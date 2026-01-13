import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { COLORS } from '../../types';

interface EditShopModalProps {
  visible: boolean;
  onClose: () => void;
  initialData: { name: string; id: string; logo: string | null };
  onSave: (name: string, id: string, logo: string | null) => void;
}

export default function EditShopModal({ visible, onClose, initialData, onSave }: EditShopModalProps) {
  const [name, setName] = useState('');
  const [shopId, setShopId] = useState('');
  const [logo, setLogo] = useState<string | null>(null);

  // ໂຫຼດຂໍ້ມູນເກົ່າມາສະແດງຕອນເປີດ Modal
  useEffect(() => {
    if (visible) {
      setName(initialData.name);
      setShopId(initialData.id);
      setLogo(initialData.logo);
    }
  }, [visible, initialData]);

  // ຟັງຊັນເລືອກຮູບ
  const pickImage = async () => {
    // ຂໍອະນຸຍາດເຂົ້າເຖິງຮູບ
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Error', 'ຕ້ອງການສິດເຂົ້າເຖິງຮູບພາບ');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1], // ບັງຄັບຕັດຮູບເປັນ 4 ຫຼ່ຽມ
      quality: 0.5,
    });

    if (!result.canceled) {
      setLogo(result.assets[0].uri);
    }
  };

  const handleSave = () => {
    onSave(name, shopId, logo);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>ແກ້ໄຂຂໍ້ມູນຮ້ານ</Text>

          {/* ສ່ວນເລືອກຮູບໂລໂກ້ */}
          <View style={styles.logoSection}>
            <TouchableOpacity onPress={pickImage} style={styles.logoWrapper}>
              {logo ? (
                <Image source={{ uri: logo }} style={styles.logo} />
              ) : (
                <View style={styles.placeholder}>
                  <Text style={styles.placeholderText}>{name ? name.charAt(0) : 'S'}</Text>
                </View>
              )}
              <View style={styles.cameraIcon}>
                <Ionicons name="camera" size={20} color="white" />
              </View>
            </TouchableOpacity>
            <Text style={styles.hint}>ກົດເພື່ອປ່ຽນໂລໂກ້</Text>
          </View>

          {/* ຊ່ອງປ້ອນຂໍ້ມູນ */}
          <Text style={styles.label}>ຊື່ຮ້ານ:</Text>
          <TextInput 
            style={styles.input} 
            value={name} 
            onChangeText={setName} 
            placeholder="ໃສ່ຊື່ຮ້ານ..." 
          />

          <Text style={styles.label}>ລະຫັດຮ້ານ / ID:</Text>
          <TextInput 
            style={styles.input} 
            value={shopId} 
            onChangeText={setShopId} 
            placeholder="ໃສ່ ID ຮ້ານ..." 
          />

          {/* ປຸ່ມ Action */}
          <View style={styles.btnRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelText}>ຍົກເລີກ</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Text style={styles.saveText}>ບັນທຶກ</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  container: { width: '85%', backgroundColor: 'white', borderRadius: 20, padding: 25, elevation: 5 },
  title: { fontSize: 20, fontFamily: 'Lao-Bold', color: COLORS.text, textAlign: 'center', marginBottom: 20 },
  
  logoSection: { alignItems: 'center', marginBottom: 20 },
  logoWrapper: { position: 'relative' },
  logo: { width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: '#eee' },
  placeholder: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#E0F2F1', justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#eee' },
  placeholderText: { fontSize: 40, fontFamily: 'Lao-Bold', color: COLORS.primary },
  cameraIcon: { position: 'absolute', bottom: 0, right: 0, backgroundColor: COLORS.primary, width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'white' },
  hint: { fontSize: 12, color: '#999', marginTop: 8, fontFamily: 'Lao-Regular' },

  label: { fontSize: 14, fontFamily: 'Lao-Bold', color: '#666', marginBottom: 5 },
  input: { backgroundColor: '#f9f9f9', borderWidth: 1, borderColor: '#eee', borderRadius: 10, padding: 12, fontSize: 16, marginBottom: 15, fontFamily: 'Lao-Regular' },

  btnRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, marginTop: 10 },
  cancelBtn: { flex: 1, padding: 12, borderRadius: 10, backgroundColor: '#f5f5f5', alignItems: 'center' },
  saveBtn: { flex: 1, padding: 12, borderRadius: 10, backgroundColor: COLORS.primary, alignItems: 'center' },
  cancelText: { color: '#666', fontFamily: 'Lao-Bold' },
  saveText: { color: 'white', fontFamily: 'Lao-Bold' }
});