import { Ionicons } from '@expo/vector-icons';
import { onValue, ref, update } from 'firebase/database';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { db } from '../../firebase';
import { useAuth } from '../../hooks/useAuth'; // 🟢 1. Import useAuth
import { COLORS, formatNumber } from '../../types';

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
  
  const insets = useSafeAreaInsets();
  const { hasPermission } = useAuth(); // 🟢 2. ດຶງຟັງຊັນກວດສອບສິດມາໃຊ້
  
  const [exchangeRate, setExchangeRate] = useState('0');
  const [modalVisible, setModalVisible] = useState(false);
  const [newRate, setNewRate] = useState('');

  const displayName = shopName || user?.name || "ຮ້ານ ສຸດາພອນ";
  const displayDetail = shopId || (user?.role ? `Role: ${user.role}` : "");

  useEffect(() => {
    const rateRef = ref(db, 'settings/exchangeRateTHB');
    const unsubscribe = onValue(rateRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setExchangeRate(data.toString());
      }
    });

    return () => unsubscribe();
  }, []);

  const handleSaveRate = async () => {
    if (!newRate) return;
    try {
      await update(ref(db, 'settings'), {
        exchangeRateTHB: parseFloat(newRate)
      });
      setModalVisible(false);
      Alert.alert("ສຳເລັດ", "ອັບເດດອັດຕາແລກປ່ຽນຮຽບຮ້ອຍແລ້ວ");
    } catch (error) {
      Alert.alert("Error", "ບໍ່ສາມາດບັນທຶກຂໍ້ມູນໄດ້");
    }
  };

  const openRateModal = () => {
    setNewRate(exchangeRate);
    setModalVisible(true);
  };

  return (
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
            <Image 
                source={{ uri: shopLogo }} 
                style={styles.shopLogo} 
                resizeMode="cover" 
            />
          ) : (
            <View style={styles.shopLogoPlaceholder}>
              <Text style={styles.shopLogoText}>{displayName ? displayName.charAt(0) : 'S'}</Text>
            </View>
          )}
          
          <View>
            <Text style={styles.shopName}>{displayName}</Text>
            <Text style={styles.shopId}>{displayDetail}</Text>
            
            <View style={{flexDirection: 'row', alignItems: 'center', marginTop: 4}}>
                <Text style={{fontSize: 12, color: '#666', fontFamily: 'Lao-Regular'}}>Rate: </Text>
                <Text style={{fontSize: 12, color: COLORS.primary, fontFamily: 'Lao-Bold'}}>1 ฿ = {formatNumber(parseFloat(exchangeRate))} ₭</Text>
            </View>
          </View>
        </View>
        
        <View style={{gap: 8}}>
            <TouchableOpacity style={styles.rateBtn} onPress={openRateModal}>
                <Ionicons name="swap-horizontal" size={16} color="white" />
                <Text style={styles.rateBtnText}>ປ່ຽນ Rate</Text>
            </TouchableOpacity>

            {/* 🟢 3. ກວດສອບສິດ: ຖ້າມີສິດ editSettings ຈຶ່ງສະແດງປຸ່ມ */}
            {hasPermission('editSettings') && (
              <TouchableOpacity style={styles.editBtn} onPress={onEditPress}>
                  <Text style={styles.editBtnText}>ແກ້ໄຂຮ້ານ</Text>
              </TouchableOpacity>
            )}
        </View>
      </View>

      {/* Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <KeyboardAvoidingView 
                behavior={Platform.OS === "ios" ? "padding" : undefined}
                style={styles.modalOverlay}
            >
                <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>ກຳນົດອັດຕາແລກປ່ຽນ</Text>
                    <Text style={styles.modalSubtitle}>ກຳນົດຄ່າເງິນກີບ ຕໍ່ 1 ບາດ (THB)</Text>
                    
                    <TextInput 
                        style={styles.input}
                        keyboardType="numeric"
                        value={newRate}
                        onChangeText={setNewRate}
                        placeholder="ຕົວຢ່າງ: 680"
                        autoFocus
                    />

                    <View style={styles.modalActions}>
                        <TouchableOpacity style={styles.cancelModalBtn} onPress={() => setModalVisible(false)}>
                            <Text style={styles.cancelText}>ຍົກເລີກ</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.saveModalBtn} onPress={handleSaveRate}>
                            <Text style={styles.saveText}>ບັນທຶກ</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    backgroundColor: COLORS.primary, 
    paddingBottom: 20, 
    borderBottomLeftRadius: 20, 
    borderBottomRightRadius: 20, 
    zIndex: 1000, 
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
  shopInfo: { flexDirection: 'row', alignItems: 'center', gap: 15, flex: 1 },
  shopLogo: { 
    width: 50, 
    height: 50, 
    borderRadius: 25, 
    backgroundColor: '#eee',
    borderWidth: 1,      
    borderColor: '#eee'  
  },
  shopLogoPlaceholder: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#E0F2F1', justifyContent: 'center', alignItems: 'center' },
  shopLogoText: { fontSize: 24, fontFamily: 'Lao-Bold', color: COLORS.primary },
  shopName: { fontSize: 16, fontFamily: 'Lao-Bold', color: COLORS.text },
  shopId: { fontSize: 12, fontFamily: 'Lao-Regular', color: '#666' },
  
  editBtn: { backgroundColor: '#f0f0f0', paddingVertical: 6, paddingHorizontal: 15, borderRadius: 20, alignItems: 'center' },
  editBtnText: { fontSize: 10, fontFamily: 'Lao-Regular', color: '#666' },

  rateBtn: { 
    backgroundColor: COLORS.primary, 
    paddingVertical: 6, 
    paddingHorizontal: 12, 
    borderRadius: 20, 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 4,
    justifyContent: 'center'
  },
  rateBtnText: { fontSize: 10, fontFamily: 'Lao-Bold', color: 'white' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: 'white', width: '80%', padding: 20, borderRadius: 15, elevation: 5 },
  modalTitle: { fontSize: 18, fontFamily: 'Lao-Bold', textAlign: 'center', marginBottom: 5, color: COLORS.text },
  modalSubtitle: { fontSize: 12, fontFamily: 'Lao-Regular', textAlign: 'center', marginBottom: 15, color: '#666' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, fontSize: 18, fontFamily: 'Lao-Bold', textAlign: 'center', marginBottom: 20 },
  modalActions: { flexDirection: 'row', gap: 10 },
  cancelModalBtn: { flex: 1, padding: 12, borderRadius: 8, backgroundColor: '#f0f0f0', alignItems: 'center' },
  saveModalBtn: { flex: 1, padding: 12, borderRadius: 8, backgroundColor: COLORS.primary, alignItems: 'center' },
  cancelText: { fontFamily: 'Lao-Bold', color: '#666' },
  saveText: { fontFamily: 'Lao-Bold', color: 'white' }
});