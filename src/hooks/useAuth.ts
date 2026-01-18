import AsyncStorage from '@react-native-async-storage/async-storage';
import { equalTo, get, orderByChild, query, ref } from 'firebase/database';
import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { db } from '../firebase';
import { User, UserPermissions } from '../types';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      // 🟢 ໃຊ້ key ດຽວກັນກັບຕອນ Login ('user_session')
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

  const login = async (username: string, passwordInput: string) => {
    if (!username || !passwordInput) return false;
    setLoading(true);

    try {
      const usersRef = ref(db, 'users');
      const q = query(usersRef, orderByChild('name'), equalTo(username));
      const snapshot = await get(q);

      if (snapshot.exists()) {
        const data = snapshot.val();
        const userId = Object.keys(data)[0];
        const userData = data[userId];

        // ກວດສອບ PIN
        if (userData.pin !== passwordInput) {
            Alert.alert("ຜິດພາດ", "ລະຫັດຜ່ານບໍ່ຖືກຕ້ອງ");
            setLoading(false);
            return false;
        }

        if (!userData.isActive) {
            Alert.alert("ຜິດພາດ", "ບັນຊີນີຖືກປິດການໃຊ້ງານແລ້ວ");
            setLoading(false);
            return false;
        }

        const loggedInUser: User = { ...userData, id: userId };

        // 🟢 ບັນທຶກ Session
        await AsyncStorage.setItem('user_session', JSON.stringify(loggedInUser));
        setUser(loggedInUser);
        return true;
      } else {
        Alert.alert("ຜິດພາດ", "ບໍ່ພົບຊື່ຜູ້ໃຊ້ນີ້");
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

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('user_session');
      setUser(null);
    } catch (e) {
      console.error(e);
    }
  };

  // 🟢 ຈຸດສຳຄັນ: ແກ້ໄຂ Logic ການກວດສິດ (Admin Bypass)
  const hasPermission = (permission: keyof UserPermissions): boolean => {
    if (!user) return false;

    // ✨ ຖ້າເປັນ Admin ໃຫ້ຜ່ານໄດ້ໝົດທຸກຢ່າງ! (ແກ້ບັນຫາ Access Denied)
    if (user.role === 'admin') {
        return true; 
    }

    // ຖ້າເປັນ Staff ທຳມະດາ ຄ່ອຍກວດສອບສິດລາຍໂຕ
    return user.permissions?.[permission] ?? false;
  };

  return { user, loading, login, logout, hasPermission };
}