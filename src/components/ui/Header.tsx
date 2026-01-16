import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, Platform, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
// ໃຊ້ useSafeAreaInsets ເພື່ອດຶງຄ່າຄວາມສູງຂອງຕິ່ງໜ້າຈໍມາໃຊ້ເອງ
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  
  // 🟢 1. ດຶງຄ່າ Insets (ໄລຍະຫ່າງຂອບຈໍ)
  const insets = useSafeAreaInsets();
  
  const displayName = shopName || user?.name || "ຮ້ານ ສຸດາພອນ";
  const displayDetail = shopId || (user?.role ? `Role: ${user.role}` : "");

  return (
    // 🟢 2. ກຳນົດ paddingTop ຕາມຄ່າ insets.top
    // ວິທີນີ້ພື້ນຫຼັງສີ Teal ຈະຢືດເຕັມຈໍ (ລວມທັງ Status Bar) ແຕ່ຕົວໜັງສືຈະຖືກດັນລົງມາບໍ່ໃຫ້ບັງ
    <View style={[styles.container, { paddingTop: insets.top }]}>
      
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    backgroundColor: COLORS.primary, // ສີ Teal (#008B94)
    paddingBottom: 20, 
    borderBottomLeftRadius: 20, 
    borderBottomRightRadius: 20, 
    zIndex: 1000, 
    // ບໍ່ຕ້ອງກຳນົດ paddingTop ຢູ່ທີ່ນີ້ ເພາະເຮົາກຳນົດແບບ Dynamic ຢູ່ດ້ານເທິງແລ້ວ
  },
  topBar: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    marginBottom: 20,
    marginTop: 10 
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