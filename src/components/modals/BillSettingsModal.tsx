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
    View
} from 'react-native';
import { db } from '../../firebase';
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

  const pickLogo = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      setLogo(`data:image/jpeg;base64,${result.assets[0].base64}`);
    }
  };

  const handleSave = async () => {
    try {
      await set(ref(db, 'billSettings'), {
        shopName,
        address,
        phone,
        footerText,
        logo
      });
      Alert.alert('ສຳເລັດ', 'ບັນທຶກການຕັ້ງຄ່າໃບບິນແລ້ວ');
      onClose();
    } catch (error) {
      Alert.alert('Error', 'ບັນທຶກບໍ່ໄດ້');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>ຕັ້ງຄ່າໃບບິນ (Bill Settings)</Text>
            <TouchableOpacity onPress={onClose}><Ionicons name="close" size={24} color="#666" /></TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <TouchableOpacity style={styles.logoPicker} onPress={pickLogo}>
              {logo ? (
                <Image source={{ uri: logo }} style={styles.logo} />
              ) : (
                <View style={styles.placeholder}>
                  <Ionicons name="camera" size={30} color="#ccc" />
                  <Text style={{ fontSize: 12, color: '#999' }}>ເລືອກໂລໂກ້</Text>
                </View>
              )}
            </TouchableOpacity>

            <Text style={styles.label}>ຊື່ຮ້ານ (ຫົວບິນ)</Text>
            <TextInput style={styles.input} value={shopName} onChangeText={setShopName} placeholder="ຕົວຢ່າງ: ຮ້ານ ສຸດາພອນ" />

            <Text style={styles.label}>ທີ່ຢູ່ / ສະໂລແກນ</Text>
            <TextInput style={styles.input} value={address} onChangeText={setAddress} placeholder="ຕົວຢ່າງ: ບ້ານ ສີຫອມ..." />

            <Text style={styles.label}>ເບີໂທຕິດຕໍ່</Text>
            <TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="020 xxxx xxxx" />

            <Text style={styles.label}>ຂໍ້ຄວາມທ້າຍບິນ</Text>
            <TextInput style={styles.input} value={footerText} onChangeText={setFooterText} placeholder="ຂອບໃຈທີ່ອຸດໜູນ" multiline />

            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Text style={styles.saveBtnText}>ບັນທຶກການຕັ້ງຄ່າ</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  container: { backgroundColor: 'white', borderRadius: 20, padding: 20, maxHeight: '90%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 18, fontFamily: 'Lao-Bold', color: COLORS.text },
  logoPicker: { alignSelf: 'center', marginBottom: 20 },
  logo: { width: 100, height: 100, borderRadius: 50 },
  placeholder: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#ddd', borderStyle: 'dashed' },
  label: { fontFamily: 'Lao-Bold', fontSize: 14, marginBottom: 5, color: '#666' },
  input: { backgroundColor: '#f9f9f9', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#eee', marginBottom: 15, fontFamily: 'Lao-Regular' },
  saveBtn: { backgroundColor: COLORS.primary, padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  saveBtnText: { color: 'white', fontFamily: 'Lao-Bold', fontSize: 16 }
});