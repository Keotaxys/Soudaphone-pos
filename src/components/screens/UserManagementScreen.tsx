import { Ionicons } from '@expo/vector-icons';
import { onValue, push, ref, remove, set } from 'firebase/database';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    FlatList,
    Modal,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { db } from '../../firebase';
import { COLORS, User, UserPermissions } from '../../types';

const ORANGE_THEME = '#FF8F00'; 

export default function UserManagementScreen() {
  const [users, setUsers] = useState<User[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [role, setRole] = useState<'admin' | 'staff'>('staff');
  
  const [permissions, setPermissions] = useState<UserPermissions>({
    canSell: true,
    canEditProduct: false,
    canDeleteProduct: false,
    canViewReports: false,
    canManageUsers: false,
  });

  useEffect(() => {
    const usersRef = ref(db, 'users');
    const unsub = onValue(usersRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const loadedUsers = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        setUsers(loadedUsers);
      } else {
        setUsers([]);
      }
    });
    return () => unsub();
  }, []);

  const handleSaveUser = async () => {
    if (!name || !pin) {
      Alert.alert('ແຈ້ງເຕືອນ', 'ກະລຸນາໃສ່ຊື່ ແລະ PIN');
      return;
    }

    try {
      const newUser = {
        name,
        pin,
        role,
        isActive: true,
        createdAt: new Date().toISOString(),
        permissions: role === 'admin' ? null : permissions
      };

      const newRef = push(ref(db, 'users'));
      await set(newRef, newUser);
      
      Alert.alert('ສຳເລັດ', 'ເພີ່ມພະນັກງານຮຽບຮ້ອຍ');
      setModalVisible(false);
      resetForm();
    } catch (error) {
      Alert.alert('Error', 'ບັນທຶກບໍ່ໄດ້');
    }
  };

  const handleDeleteUser = (user: User) => {
    if (user.role === 'admin') {
      Alert.alert('ແຈ້ງເຕືອນ', 'ບໍ່ສາມາດລຶບ Admin ໄດ້');
      return;
    }
    
    Alert.alert('ຢືນຢັນ', `ຕ້ອງການລຶບ ${user.name} ແທ້ບໍ?`, [
      { text: 'ຍົກເລີກ', style: 'cancel' },
      { 
        text: 'ລຶບ', 
        style: 'destructive', 
        onPress: () => remove(ref(db, `users/${user.id}`)) 
      }
    ]);
  };

  const resetForm = () => {
    setName('');
    setPin('');
    setRole('staff');
    setPermissions({
        canSell: true,
        canEditProduct: false,
        canDeleteProduct: false,
        canViewReports: false,
        canManageUsers: false,
    });
  };

  const CustomSwitch = ({ value, onValueChange, label }: { value: boolean, onValueChange: (val: boolean) => void, label: string }) => (
    <View style={styles.switchRow}>
        {/* 🟢 ແກ້ໄຂ: ໃສ່ style ທີ່ມີ fontFamily */}
        <Text style={styles.switchLabel}>{label}</Text>
        <Switch 
            value={value} 
            onValueChange={onValueChange}
            trackColor={{ false: "#e0e0e0", true: COLORS.primary + '80' }}
            thumbColor={value ? COLORS.primary : "#f4f3f4"}
        />
    </View>
  );

  const renderUserItem = ({ item }: { item: User }) => (
    <View style={styles.card}>
      <View style={styles.userInfo}>
        <View style={[styles.avatar, { backgroundColor: item.role === 'admin' ? ORANGE_THEME : COLORS.primary }]}>
            <Text style={styles.avatarText}>{item.name.charAt(0)}</Text>
        </View>
        <View>
            <Text style={styles.userName}>{item.name}</Text>
            {/* 🟢 ແກ້ໄຂ: ໃຊ້ Lao-Regular */}
            <Text style={styles.userRole}>{item.role === 'admin' ? 'ຜູ້ຈັດການ (Admin)' : 'ພະນັກງານ (Staff)'}</Text>
        </View>
      </View>
      
      {item.role !== 'admin' && (
          <TouchableOpacity onPress={() => handleDeleteUser(item)}>
              <Ionicons name="trash-outline" size={24} color="#FF5252" />
          </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>ຈັດການຜູ້ໃຊ້ (Users)</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
            <Ionicons name="add" size={24} color="white" />
            <Text style={styles.addBtnText}>ເພີ່ມ</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={users}
        keyExtractor={item => item.id!}
        renderItem={renderUserItem}
        contentContainerStyle={{ padding: 15 }}
      />

      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>ເພີ່ມພະນັກງານໃໝ່</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
                {/* 🟢 ແກ້ໄຂ: ໃສ່ Font ໃຫ້ປຸ່ມປິດ */}
                <Text style={{ color: COLORS.primary, fontFamily: 'Lao-Bold', fontSize: 16 }}>ປິດ</Text>
            </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.modalContent}>
            <Text style={styles.label}>ຊື່ພະນັກງານ</Text>
            {/* 🟢 ແກ້ໄຂ: ໃສ່ Font ໃຫ້ TextInput */}
            <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="ໃສ່ຊື່..." />

            <Text style={styles.label}>ລະຫັດ PIN</Text>
            <TextInput style={styles.input} value={pin} onChangeText={setPin} placeholder="ຕົວຢ່າງ: 1234" keyboardType="numeric" maxLength={6} />

            <Text style={styles.label}>ຕຳແໜ່ງ</Text>
            <View style={styles.roleContainer}>
                <TouchableOpacity 
                    style={[styles.roleBtn, role === 'staff' && styles.activeRole]} 
                    onPress={() => setRole('staff')}
                >
                    <Text style={[styles.roleText, role === 'staff' && {color:'white'}]}>ພະນັກງານ</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.roleBtn, role === 'admin' && styles.activeRoleAdmin]} 
                    onPress={() => setRole('admin')}
                >
                    <Text style={[styles.roleText, role === 'admin' && {color:'white'}]}>Admin</Text>
                </TouchableOpacity>
            </View>

            {role === 'staff' && (
                <View style={styles.permSection}>
                    <Text style={styles.permHeader}>ກຳນົດສິດການໃຊ້ງານ:</Text>
                    <CustomSwitch label="ຂາຍສິນຄ້າໄດ້" value={permissions.canSell} onValueChange={(v) => setPermissions({...permissions, canSell: v})} />
                    <CustomSwitch label="ແກ້ໄຂສິນຄ້າໄດ້" value={permissions.canEditProduct} onValueChange={(v) => setPermissions({...permissions, canEditProduct: v})} />
                    <CustomSwitch label="ລຶບສິນຄ້າໄດ້" value={permissions.canDeleteProduct} onValueChange={(v) => setPermissions({...permissions, canDeleteProduct: v})} />
                    <CustomSwitch label="ເບິ່ງລາຍງານໄດ້" value={permissions.canViewReports} onValueChange={(v) => setPermissions({...permissions, canViewReports: v})} />
                </View>
            )}

            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveUser}>
                <Text style={styles.saveBtnText}>ບັນທຶກຂໍ້ມູນ</Text>
            </TouchableOpacity>
            <View style={{height: 50}}/>
        </ScrollView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F9FA' },
  header: { padding: 20, backgroundColor: 'white', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 2 },
  
  // 🟢 Font Header
  headerTitle: { fontSize: 20, fontFamily: 'Lao-Bold', color: '#333' },
  
  addBtn: { flexDirection: 'row', backgroundColor: COLORS.primary, padding: 10, borderRadius: 8, alignItems: 'center' },
  
  // 🟢 Font ປຸ່ມເພີ່ມ
  addBtnText: { color: 'white', fontFamily: 'Lao-Bold', marginLeft: 5 },
  
  card: { flexDirection: 'row', backgroundColor: 'white', padding: 15, borderRadius: 12, marginBottom: 10, alignItems: 'center', justifyContent: 'space-between', elevation: 1 },
  userInfo: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  
  // 🟢 Font Avatar
  avatarText: { color: 'white', fontSize: 20, fontFamily: 'Lao-Bold' },
  
  // 🟢 Font ຊື່ User
  userName: { fontSize: 16, fontFamily: 'Lao-Bold', color: '#333' },
  
  // 🟢 Font ຕຳແໜ່ງ
  userRole: { color: '#666', fontSize: 12, fontFamily: 'Lao-Regular' },

  modalHeader: { padding: 20, borderBottomWidth: 1, borderBottomColor: '#eee', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  
  // 🟢 Font ຫົວຂໍ້ Modal
  modalTitle: { fontSize: 18, fontFamily: 'Lao-Bold' },
  
  modalContent: { padding: 20 },
  
  // 🟢 Font Label
  label: { fontFamily: 'Lao-Bold', marginBottom: 10, color: '#333' },
  
  // 🟢 Font Input (ສຳຄັນ)
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 20, fontSize: 16, fontFamily: 'Lao-Regular' },
  
  roleContainer: { flexDirection: 'row', marginBottom: 20, gap: 10 },
  roleBtn: { flex: 1, padding: 12, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, alignItems: 'center' },
  activeRole: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  activeRoleAdmin: { backgroundColor: ORANGE_THEME, borderColor: ORANGE_THEME },
  
  // 🟢 Font ປຸ່ມເລືອກ Role
  roleText: { fontFamily: 'Lao-Bold', color: '#333' },

  permSection: { backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 20, borderWidth: 1, borderColor: '#eee' },
  
  // 🟢 Font ຫົວຂໍ້ Permission
  permHeader: { fontFamily: 'Lao-Bold', marginBottom: 15, color: COLORS.primary },
  
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  
  // 🟢 Font Label ຂອງ Switch
  switchLabel: { fontFamily: 'Lao-Regular', fontSize: 16, color: '#333' },
  
  saveBtn: { backgroundColor: COLORS.primary, padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  
  // 🟢 Font ປຸ່ມບັນທຶກ
  saveBtnText: { color: 'white', fontFamily: 'Lao-Bold', fontSize: 18 }
});