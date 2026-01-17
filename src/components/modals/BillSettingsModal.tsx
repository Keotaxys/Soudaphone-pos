import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { onValue, ref, set } from 'firebase/database';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator
} from 'react-native';

// ⚠️ ໃຫ້ກວດເບິ່ງ path ຂອງ firebase ແລະ COLORS ໃຫ້ຖືກກັບເຄື່ອງຂອງທ່ານ
import { db } from '../../firebase';
// import { COLORS } from '../../types'; 

// ຖ້າທ່ານຍັງບໍ່ມີຟາຍ COLORS, ໃຊ້ໂຕນີ້ແທນຊົ່ວຄາວ:
const COLORS = {
  primary: '#007AFF',
  text: '#333333',
  background: '#FFFFFF',
  border: '#EEEEEE',
  placeholder: '#999999'
};

interface BillSettingsModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function BillSettingsModal({ visible, onClose }: BillSettingsModalProps) {
  const [shopName, setShopName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [footerText, setFooterText] = useState('');
  const [logo, setLogo] = useState('');
  const [loading, setLoading] = useState(false); // ເພີ່ມສະຖານະ Loading

  // ດຶງຂໍ້ມູນເກົາມາສະແດງ
  useEffect(() => {
    const settingsRef = ref(db, 'billSettings');
    const unsubscribe = onValue(settingsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setShopName(data.shopName || '');
        setAddress(data.address || '');
        setPhone(data.phone || '');
        setFooterText(data.footerText || '');
        setLogo(data.logo || '');
      }
    });
    return () => unsubscribe();
  }, []);

  // ຟັງຊັນເລືອກຮູບພາບ (ພ້ອມການຂໍ Permission)
  const pickLogo = async () => {
    // 1. ຂໍອະນຸຍາດກ່ອນ
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('ຕ້ອງການອະນຸຍາດ', 'ກະລຸນາອະນຸຍາດໃຫ້ເຂົ້າເຖິງຮູບພາບເພື່ອປ່ຽນໂລໂກ້');
      return;
    }

    // 2. ເປີດບ່ອນເລືອກຮູບ
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1], // ບັງຄັບເປັນຮູບຈັດຕຸລັດ
      quality: 0.5,   // ຫຼຸດຄຸນນະພາບລົງເຫຼືອ 50% ເພື່ອບໍ່ໃຫ້ໜັກ Database
      base64: true,   // ຈຳເປັນຕ້ອງໃຊ້ base64
    });

    if (!result.canceled && result.assets[0].base64) {
      // ຕ້ອງມີ prefix data:image... ຈຶ່ງຈະສະແດງຜົນໄດ້
      setLogo(`data:image/jpeg;base64,${result.assets[0].base64}`);
    }
  };

  // ຟັງຊັນບັນທຶກຂໍ້ມູນ
  const handleSave = async () => {
    if (!shopName.trim()) {
      Alert.alert('ແຈ້ງເຕືອນ', 'ກະລຸນາໃສ່ຊື່ຮ້ານ');
      return;
    }

    setLoading(true); // ເລີ່ມໂຫຼດ

    try {
      await set(ref(db, 'billSettings'), {
        shopName,
        address,
        phone,
        footerText,
        logo
      });
      Alert.alert('ສຳເລັດ', 'ບັນທຶກການຕັ້ງຄ່າໃບບິນຮຽບຮ້ອຍແລ້ວ');
      onClose();
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'ເກີດຂໍ້ຜິດພາດໃນການບັນທຶກ');
    } finally {
      setLoading(false); // ຢຸດໂຫຼດ
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.overlay}>
        <View style={styles.container}>
          
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>ຕັ້ງຄ່າໃບບິນ (Bill Settings)</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Logo Section */}
            <TouchableOpacity style={styles.logoPicker} onPress={pickLogo}>
              {logo ? (
                <Image source={{ uri: logo }} style={styles.logo} />
              ) : (
                <View style={styles.placeholder}>
                  <Ionicons name="camera" size={30} color="#ccc" />
                  <Text style={styles.placeholderText}>ເລືອກໂລໂກ້</Text>
                </View>
              )}
              {/* ໄອຄອນສໍນ້ອຍໆ */}
              <View style={styles.editIconContainer}>
                 <Ionicons name="pencil" size={12} color="white" />
              </View>
            </TouchableOpacity>

            {/* Form Inputs */}
            <Text style={styles.label}>ຊື່ຮ້ານ (ຫົວບິນ) <Text style={{color: 'red'}}>*</Text></Text>
            <TextInput 
              style={styles.input} 
              value={shopName} 
              onChangeText={setShopName} 
              placeholder="ຕົວຢ່າງ: ຮ້ານ ສຸດາພອນ" 
            />

            <Text style={styles.label}>ທີ່ຢູ່ / ສະໂລແກນ</Text>
            <TextInput 
              style={styles.input} 
              value={address} 
              onChangeText={setAddress} 
              placeholder="ຕົວຢ່າງ: ບ້ານ ສີຫອມ..." 
            />

            <Text style={styles.label}>ເບີໂທຕິດຕໍ່</Text>
            <TextInput 
              style={styles.input} 
              value={phone} 
              onChangeText={setPhone} 
              keyboardType="phone-pad" 
              placeholder="020 xxxx xxxx" 
            />

            <Text style={styles.label}>ຂໍ້ຄວາມທ້າຍບິນ</Text>
            <TextInput 
              style={[styles.input, styles.textArea]} 
              value={footerText} 
              onChangeText={setFooterText} 
              placeholder="ຂອບໃຈທີ່ອຸດໜູນ" 
              multiline={true}
              numberOfLines={3}
            />

            {/* Save Button */}
            <TouchableOpacity 
              style={[styles.saveBtn, loading && styles.disabledBtn]} 
              onPress={handleSave}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.saveBtnText}>ບັນທຶກການຕັ້ງຄ່າ</Text>
              )}
            </TouchableOpacity>

            <View style={{height: 20}} /> 
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.5)', 
    justifyContent: 'center', 
    padding: 20 
  },
  container: { 
    backgroundColor: 'white', 
    borderRadius: 20, 
    padding: 20, 
    maxHeight: '90%',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: 10
  },
  title: { 
    fontSize: 18, 
    fontFamily: 'Lao-Bold', // ຖ້າບໍ່ມີ font ນີ້ ໃຫ້ລຶບແຖວນີ້ອອກ
    fontWeight: 'bold',
    color: COLORS.text 
  },
  logoPicker: { 
    alignSelf: 'center', 
    marginBottom: 20,
    position: 'relative'
  },
  logo: { 
    width: 100, 
    height: 100, 
    borderRadius: 50,
    borderWidth: 2,
    borderColor: '#eee'
  },
  placeholder: { 
    width: 100, 
    height: 100, 
    borderRadius: 50, 
    backgroundColor: '#f8f9fa', 
    justifyContent: 'center', 
    alignItems: 'center', 
    borderWidth: 1, 
    borderColor: '#ddd', 
    borderStyle: 'dashed' 
  },
  placeholderText: {
    fontSize: 12,
    color: COLORS.placeholder,
    marginTop: 5,
    fontFamily: 'Lao-Regular' // ຖ້າບໍ່ມີ font ນີ້ ໃຫ້ລຶບແຖວນີ້ອອກ
  },
  editIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.primary,
    padding: 6,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: 'white'
  },
  label: { 
    fontFamily: 'Lao-Bold', // ຖ້າບໍ່ມີ font ນີ້ ໃຫ້ລຶບແຖວນີ້ອອກ
    fontWeight: '600',
    fontSize: 14, 
    marginBottom: 5, 
    color: '#666' 
  },
  input: { 
    backgroundColor: '#f9f9f9', 
    padding: 12, 
    borderRadius: 10, 
    borderWidth: 1, 
    borderColor: COLORS.border, 
    marginBottom: 15, 
    fontFamily: 'Lao-Regular', // ຖ້າບໍ່ມີ font ນີ້ ໃຫ້ລຶບແຖວນີ້ອອກ
    fontSize: 16
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top'
  },
  saveBtn: { 
    backgroundColor: COLORS.primary, 
    padding: 15, 
    borderRadius: 10, 
    alignItems: 'center', 
    marginTop: 10 
  },
  disabledBtn: {
    opacity: 0.7,
    backgroundColor: '#999'
  },
  saveBtnText: { 
    color: 'white', 
    fontFamily: 'Lao-Bold', // ຖ້າບໍ່ມີ font ນີ້ ໃຫ້ລຶບແຖວນີ້ອອກ
    fontWeight: 'bold',
    fontSize: 16 
  }
});