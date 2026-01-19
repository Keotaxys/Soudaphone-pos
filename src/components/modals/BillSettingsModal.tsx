import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { onValue, ref, set } from 'firebase/database';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
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
  View
} from 'react-native';

import { db } from '../../firebase';
// 🟢 1. Import COLORS ຈາກ types ຢ່າງຖືກຕ້ອງ
import { COLORS } from '../../types';

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
  const [loading, setLoading] = useState(false);

  // 🟢 2. ດຶງຂໍ້ມູນ (Fetch Data)
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

  // ຟັງຊັນເລືອກຮູບພາບ
  const pickLogo = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('ຕ້ອງການອະນຸຍາດ', 'ກະລຸນາອະນຸຍາດໃຫ້ເຂົ້າເຖິງຮູບພາບເພື່ອປ່ຽນໂລໂກ້');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1], // ຮູບຈັດຕຸລັດ
      quality: 0.5,   // ຫຼຸດຂະໜາດໄຟລ໌
      base64: true,   
    });

    if (!result.canceled && result.assets[0].base64) {
      setLogo(`data:image/jpeg;base64,${result.assets[0].base64}`);
    }
  };

  // ຟັງຊັນບັນທຶກ
  const handleSave = async () => {
    if (!shopName.trim()) {
      Alert.alert('ແຈ້ງເຕືອນ', 'ກະລຸນາໃສ່ຊື່ຮ້ານ');
      return;
    }

    setLoading(true);

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
      setLoading(false);
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
    fontFamily: 'Lao-Bold', 
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
    color: '#999',
    marginTop: 5,
    fontFamily: 'Lao-Regular'
  },
  editIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.primary, // 🟢 ໃຊ້ສີຈາກ Theme
    padding: 6,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: 'white'
  },
  label: { 
    fontFamily: 'Lao-Bold',
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
    borderColor: '#eee', 
    marginBottom: 15, 
    fontFamily: 'Lao-Regular',
    fontSize: 16
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top'
  },
  saveBtn: { 
    backgroundColor: COLORS.primary, // 🟢 ໃຊ້ສີຈາກ Theme
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
    fontFamily: 'Lao-Bold',
    fontWeight: 'bold',
    fontSize: 16 
  }
});