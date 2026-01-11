import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
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
import { COLORS } from '../../types';

interface EditShopModalProps {
  visible: boolean;
  onClose: () => void;
  shopName: string;
  setShopName: (text: string) => void;
  shopId: string;
  setShopId: (text: string) => void;
  shopLogo: string;
  onPickImage: () => void;
  onSave: () => void;
}

export default function EditShopModal({
  visible, onClose, shopName, setShopName, shopId, setShopId, shopLogo, onPickImage, onSave
}: EditShopModalProps) {
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>ແກ້ໄຂຂໍ້ມູນຮ້ານ</Text>
            <TouchableOpacity onPress={onClose}><Ionicons name="close" size={24} color="#666" /></TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Logo Picker */}
            <TouchableOpacity style={styles.imagePicker} onPress={onPickImage}>
              {shopLogo ? (
                <Image source={{ uri: shopLogo }} style={styles.previewImage} />
              ) : (
                <View style={styles.placeholderImage}>
                  <Ionicons name="camera" size={30} color="#ccc" />
                  <Text style={styles.uploadText}>ປ່ຽນໂລໂກ້</Text>
                </View>
              )}
            </TouchableOpacity>

            <Text style={styles.label}>ຊື່ຮ້ານ *</Text>
            <TextInput style={styles.input} value={shopName} onChangeText={setShopName} placeholder="ຊື່ຮ້ານຂອງທ່ານ..." />

            <Text style={styles.label}>ລະຫັດຮ້ານ (ID) *</Text>
            <TextInput style={styles.input} value={shopId} onChangeText={setShopId} placeholder="ID: 8888..." />

            <TouchableOpacity style={styles.saveBtn} onPress={onSave}>
              <Text style={styles.saveBtnText}>ບັນທຶກການແກ້ໄຂ</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: 'white', borderRadius: 15, padding: 20, elevation: 5 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontFamily: 'Lao-Bold', color: COLORS.text },
  
  imagePicker: { alignSelf: 'center', marginBottom: 20 },
  placeholderImage: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#ddd', borderStyle: 'dashed' },
  previewImage: { width: 100, height: 100, borderRadius: 50 },
  uploadText: { fontSize: 12, color: '#999', marginTop: 5, fontFamily: 'Lao-Regular' },

  label: { fontSize: 14, fontFamily: 'Lao-Bold', color: COLORS.text, marginBottom: 5, marginTop: 10 },
  input: { backgroundColor: '#f9f9f9', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#eee', fontFamily: 'Lao-Regular' },
  
  saveBtn: { backgroundColor: COLORS.primary, padding: 15, borderRadius: 12, alignItems: 'center', marginTop: 30 },
  saveBtnText: { color: 'white', fontFamily: 'Lao-Bold', fontSize: 16 }
});