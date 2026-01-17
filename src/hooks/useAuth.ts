import AsyncStorage from '@react-native-async-storage/async-storage'; // ✅ Import ແບບໃໝ່
import { equalTo, get, orderByChild, query, ref } from 'firebase/database';
import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { db } from '../firebase';
import { User, UserPermissions } from '../types';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // 1. ກວດສອບວ່າເຄີຍ Login ມາແລ້ວບໍ (ຕອນເປີດແອັບ)
  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const storedUser = await AsyncStorage.getItem('user_session');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (e) {
      console.error("Failed to load user", e);
    } finally {
      setLoading(false);
    }
  };

  // 2. ຟັງຊັນ Login ດ້ວຍ PIN
  const login = async (pin: string) => {
    if (!pin) return false;
    setLoading(true);

    try {
      // ຄົ້ນຫາ User ຈາກ Firebase ທີ່ມີ pin ກົງກັນ
      const usersRef = ref(db, 'users');
      const q = query(usersRef, orderByChild('pin'), equalTo(pin));
      const snapshot = await get(q);

      if (snapshot.exists()) {
        const data = snapshot.val();
        // ດຶງເອົາ User ຄົນທຳອິດທີ່ພົບ (ເພາະ PIN ຄວນຈະບໍ່ຊ້ຳກັນ)
        const userId = Object.keys(data)[0];
        const userData = data[userId];

        if (!userData.isActive) {
            Alert.alert("ຜິດພາດ", "ບັນຊີນີຖືກປິດການໃຊ້ງານແລ້ວ");
            setLoading(false);
            return false;
        }

        const loggedInUser: User = { ...userData, id: userId };

        // ບັນທຶກລົງເຄື່ອງ (AsyncStorage)
        await AsyncStorage.setItem('user_session', JSON.stringify(loggedInUser));
        setUser(loggedInUser);
        return true;
      } else {
        Alert.alert("ຜິດພາດ", "ລະຫັດ PIN ບໍ່ຖືກຕ້ອງ");
        return false;
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "ເກີດຂໍ້ຜິດພາດໃນການເຊື່ອມຕໍ່");
      return false;
    } finally {
      setLoading(false);
    }
  };

  // 3. ຟັງຊັນ Logout
  const logout = async () => {
    try {
      await AsyncStorage.removeItem('user_session');
      setUser(null);
    } catch (e) {
      console.error(e);
    }
  };

  // 4. ຟັງຊັນກວດສອບສິດ (Permission Check)
  const hasPermission = (permission: keyof UserPermissions): boolean => {
    if (!user) return false;
    if (user.role === 'admin') return true; // Admin ຜ່ານຕະຫຼອດ
    return user.permissions?.[permission] ?? false;
  };

  return { user, loading, login, logout, hasPermission };
}