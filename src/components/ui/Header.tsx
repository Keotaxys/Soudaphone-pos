import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
// 🟢 1. Import SafeAreaView
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../types';

interface HeaderProps {
  toggleSidebar: () => void; 
  user?: { name: string; role: string };
  title?: string;
  shopName?: string;
  shopId?: string;
  shopLogo?: string;
  onEditPress?: () => void;
  onLogout?: () => void;
}

export default function Header({ 
  toggleSidebar, 
  user,
  title = "Soudaphone POS",
  shopName = "ຮ້ານ ສຸດາພອນ",
  shopId = "ID: 8888 9999",
  shopLogo,
  onEditPress,
  onLogout 
}: HeaderProps) {
  
  const displayName = shopName || user?.name || "ຮ້ານ ສຸດາພອນ";
  const displayDetail = shopId || (user?.role ? `Role: ${user.role}` : "");

  return (
    // 🟢 2. ປ່ຽນ View ເປັນ SafeAreaView ແລະກຳນົດ edges=['top']
    // ວິທີນີ້ຈະເຮັດໃຫ້ພື້ນຫຼັງສີ Teal ຂະຫຍາຍຂຶ້ນໄປເຕັມ Status Bar ດ້ານເທິງສຸດ
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar backgroundColor={COLORS.primary} barStyle="light-content" />
      
      {/* Top Bar */}
      <View style={styles.topBar}>
        <View style={styles.leftContainer}>
          <TouchableOpacity onPress={toggleSidebar}>
            <Ionicons name="menu" size={30} color="white" />
          </TouchableOpacity>
          <Text style={styles.appTitle}>{title}</Text>
        </View>

        <View style={styles.rightIcons}>
          <TouchableOpacity>
            <Ionicons name="notifications-outline" size={24} color="white" />
          </TouchableOpacity>
          <TouchableOpacity onPress={onLogout} style={{marginLeft: 5}}>
            <Ionicons name="log-out-outline" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Shop Info Card */}
      <View style={styles.shopCard}>
        <View style={styles.shopInfo}>
          {shopLogo ? (
            <Image source={{ uri: shopLogo }} style={styles.shopLogo} />
          ) : (
            <View style={styles.shopLogoPlaceholder}>
              <Text style={styles.shopLogoText}>{displayName ? displayName.charAt(0) : 'S'}</Text>
            </View>
          )}
          
          <View>
            <Text style={styles.shopName}>{displayName}</Text>
            <Text style={styles.shopId}>{displayDetail}</Text>
          </View>
        </View>
        
        <TouchableOpacity style={styles.editBtn} onPress={onEditPress}>
          <Text style={styles.editBtnText}>ແກ້ໄຂ</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    backgroundColor: COLORS.primary, // ສີ Teal ຢູ່ນີ້ຈະຂະຫຍາຍໄປເຕັມ Status Bar
    paddingBottom: 20, 
    // 🟢 3. ລຶບ paddingTop ແບບ manual ອອກ ເພາະ SafeAreaView ຈັດການໃຫ້ແລ້ວ
    // paddingTop: Platform.OS === 'android' ? 10 : 0, 
    borderBottomLeftRadius: 20, 
    borderBottomRightRadius: 20, 
    zIndex: 1000,
    // 🟢 4. ເພີ່ມ padding ດ້ານເທິງເລັກນ້ອຍສຳລັບເນື້ອຫາພາຍໃນ ບໍ່ໃຫ້ຕິດຂອບເກີນໄປ
    paddingTop: 10, 
  },
  topBar: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    marginBottom: 20 
  },
  leftContainer: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  appTitle: { fontSize: 20, fontFamily: 'Lao-Bold', color: 'white' },
  rightIcons: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  
  shopCard: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    backgroundColor: 'white', 
    marginHorizontal: 20, 
    padding: 15, 
    borderRadius: 15, 
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4
  },
  shopInfo: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  shopLogo: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#eee' },
  shopLogoPlaceholder: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#E0F2F1', justifyContent: 'center', alignItems: 'center' },
  shopLogoText: { fontSize: 24, fontFamily: 'Lao-Bold', color: COLORS.primary },
  shopName: { fontSize: 16, fontFamily: 'Lao-Bold', color: COLORS.text },
  shopId: { fontSize: 12, fontFamily: 'Lao-Regular', color: '#666' },
  editBtn: { backgroundColor: '#f0f0f0', paddingVertical: 5, paddingHorizontal: 15, borderRadius: 20 },
  editBtnText: { fontSize: 12, fontFamily: 'Lao-Regular', color: '#666' },
});