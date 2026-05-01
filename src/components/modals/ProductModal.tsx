import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker'; // 🟢 1. Import Image Picker
import React, { useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native';
import { useCategories } from '../../hooks/useCategories';
import { COLORS, formatNumber, Product } from '../../types';

interface ProductModalProps {
  visible: boolean;
  onClose: () => void;
  product: Product;
  setProduct: (product: Product) => void;
  onSave: () => void;
  // onPickImage: () => void; // ❌ ບໍ່ຈຳເປັນຕ້ອງຮັບ Props ນີ້ແລ້ວ ເພາະເຮັດໃນນີ້ເລີຍ
  onScan: () => void;
}

export default function ProductModal({
  visible,
  onClose,
  product,
  setProduct,
  onSave,
  onScan
}: ProductModalProps) {

  const { categories } = useCategories(); 
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  // Helper function
  const updateField = (key: keyof Product, value: any) => {
    setProduct({ ...product, [key]: value });
  };

  // 🟢 2. ສ້າງຟັງຊັນເລືອກຮູບພາບໃນນີ້ເລີຍ
  const handlePickImage = async () => {
    // ຂໍອະນຸຍາດເຂົ້າເຖິງຄັງຮູບ
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('ຕ້ອງການສິດ', 'ກະລຸນາອະນຸຍາດໃຫ້ເຂົ້າເຖິງຄັງຮູບພາບເພື່ອເລືອກຮູບ');
      return;
    }

    // ເປີດຄັງຮູບ
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, // ໃຫ້ຕັດຮູບໄດ້
      aspect: [1, 1],      // ຕັດເປັນຮູບຈັດຕຸລັດ
      quality: 0.5,        // ຫຼຸດຂະໜາດໄຟລ໌ລົງ
    });

    if (!result.canceled) {
      // ອັບເດດຮູບເຂົ້າໃນ state ຂອງສິນຄ້າທັນທີ
      updateField('imageUrl', result.assets[0].uri);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
          style={styles.overlay}
        >
          <View style={styles.container}>
            
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>
                {product.id ? 'ແກ້ໄຂສິນຄ້າ' : 'ເພີ່ມສິນຄ້າໃໝ່'}
              </Text>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close-circle" size={30} color="#ccc" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              
              {/* 🟢 3. ປ່ຽນ onPress ໃຫ້ເອີ້ນຟັງຊັນ handlePickImage */}
              <TouchableOpacity style={styles.imagePicker} onPress={handlePickImage}>
                {product.imageUrl ? (
                  <Image source={{ uri: product.imageUrl }} style={styles.image} />
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <Ionicons name="camera" size={40} color="#ccc" />
                    <Text style={styles.imageText}>ເລືອກຮູບ</Text>
                  </View>
                )}
                <View style={styles.editIcon}>
                    <Ionicons name="pencil" size={12} color="white" />
                </View>
              </TouchableOpacity>

              {/* Product Name */}
              <Text style={styles.label}>ຊື່ສິນຄ້າ <Text style={{color:'red'}}>*</Text></Text>
              <TextInput
                style={styles.input}
                value={product.name}
                onChangeText={(t) => updateField('name', t)}
                placeholder="ໃສ່ຊື່ສິນຄ້າ..."
              />

              {/* Category Selector */}
              <Text style={styles.label}>ໝວດໝູ່</Text>
              <TouchableOpacity 
                style={[styles.categoryDropdown, product.category ? { borderColor: COLORS.primary } : {}]} 
                onPress={() => setShowCategoryPicker(true)}
              >
                <Text style={[styles.categoryText, !product.category && { color: '#ccc' }]}>
                  {product.category || 'ເລືອກໝວດໝູ່'}
                </Text>
                <Ionicons name="chevron-down" size={20} color={product.category ? COLORS.primary : "#666"} />
              </TouchableOpacity>

              {/* Price & Currency */}
              <View style={styles.row}>
                <View style={styles.col}>
                  <Text style={styles.label}>ລາຄາ <Text style={{color:'red'}}>*</Text></Text>
                  <TextInput
                    style={styles.input}
                    value={product.price ? formatNumber(product.price) : ''}
                    onChangeText={(t) => updateField('price', parseFloat(t.replace(/,/g, '')) || 0)}
                    keyboardType="numeric"
                    placeholder="0"
                  />
                </View>
                <View style={styles.col}>
                  <Text style={styles.label}>ສະກຸນເງິນ</Text>
                  <View style={styles.currencySelector}>
                    <TouchableOpacity 
                      onPress={() => updateField('priceCurrency', 'LAK')} 
                      style={[styles.currencyBtn, product.priceCurrency === 'LAK' && { backgroundColor: COLORS.primary }]}
                    >
                      <Text style={{ color: product.priceCurrency === 'LAK' ? 'white' : '#888', fontWeight: 'bold' }}>₭</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      onPress={() => updateField('priceCurrency', 'THB')} 
                      style={[styles.currencyBtn, product.priceCurrency === 'THB' && { backgroundColor: COLORS.secondary }]}
                    >
                      <Text style={{ color: product.priceCurrency === 'THB' ? 'white' : '#888', fontWeight: 'bold' }}>฿</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* Stock & Barcode */}
              <View style={styles.row}>
                <View style={styles.col}>
                  <Text style={styles.label}>ຈຳນວນໃນສາງ</Text>
                  <TextInput
                    style={styles.input}
                    value={product.stock ? formatNumber(product.stock) : ''}
                    onChangeText={(t) => updateField('stock', parseInt(t.replace(/,/g, '')) || 0)}
                    keyboardType="numeric"
                    placeholder="0"
                  />
                </View>
                <View style={styles.col}>
                  <Text style={styles.label}>ບາໂຄດ</Text>
                  <View style={styles.barcodeRow}>
                    <TextInput
                      style={[styles.input, { flex: 1, marginBottom: 0 }]}
                      value={product.barcode || ''}
                      onChangeText={(t) => updateField('barcode', t)}
                      placeholder="Scan..."
                    />
                    <TouchableOpacity onPress={onScan} style={styles.scanBtn}>
                      <Ionicons name="qr-code" size={24} color="white" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* Save Button */}
              <TouchableOpacity style={styles.confirmBtn} onPress={onSave}>
                <Text style={styles.confirmBtnText}>ບັນທຶກ</Text>
              </TouchableOpacity>

              <View style={{height: 50}} />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>

      {/* Category Picker Modal */}
      <Modal visible={showCategoryPicker} transparent={true} animationType="fade">
        <View style={styles.pickerOverlay}>
          <View style={styles.pickerContent}>
            
            <View style={{alignItems: 'center', marginBottom: 15}}>
              <Ionicons name="images" size={40} color="#888" style={{marginBottom: 10}} />
              <Text style={styles.pickerTitle}>ເລືອກໝວດໝູ່</Text>
            </View>

            <FlatList
              data={categories}
              keyExtractor={(item, index) => index.toString()}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.pickerItem}
                  onPress={() => {
                    updateField('category', item);
                    setShowCategoryPicker(false);
                  }}
                >
                  <Text style={[styles.pickerItemText, product.category === item && { color: COLORS.primary, fontFamily: 'Lao-Bold' }]}>
                    {item}
                  </Text>
                  {product.category === item && <Ionicons name="checkmark-circle" size={22} color={COLORS.primary} />}
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity style={styles.pickerCloseBtn} onPress={() => setShowCategoryPicker(false)}>
              <Text style={{ color: '#666', fontFamily: 'Lao-Bold' }}>ປິດ</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  container: { backgroundColor: 'white', borderTopLeftRadius: 25, borderTopRightRadius: 25, height: '90%', padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  title: { fontSize: 20, color: '#333', fontFamily: 'Lao-Bold' },
  
  imagePicker: { width: 100, height: 100, backgroundColor: '#f0f0f0', borderRadius: 10, justifyContent: 'center', alignItems: 'center', alignSelf: 'center', marginBottom: 20, position: 'relative' },
  image: { width: 100, height: 100, borderRadius: 10 },
  imagePlaceholder: { alignItems: 'center' },
  imageText: { color: '#aaa', fontSize: 12, marginTop: 5 },
  editIcon: { position: 'absolute', bottom: -5, right: -5, backgroundColor: COLORS.primary, padding: 6, borderRadius: 15, borderWidth: 2, borderColor: 'white' },

  label: { fontSize: 14, color: '#666', marginBottom: 5, fontFamily: 'Lao-Regular' },
  input: { backgroundColor: '#f9f9f9', padding: 12, borderRadius: 8, marginBottom: 15, fontFamily: 'Lao-Regular', fontSize: 16 },
  
  row: { flexDirection: 'row', gap: 10 },
  col: { flex: 1 },

  currencySelector: { flexDirection: 'row', height: 50, backgroundColor: '#f5f5f5', borderRadius: 8, alignItems: 'center', padding: 5 },
  currencyBtn: { flex: 1, alignItems: 'center', borderRadius: 6, paddingVertical: 8 },
  
  barcodeRow: { flexDirection: 'row', alignItems: 'center' },
  scanBtn: { padding: 10, backgroundColor: COLORS.secondary, borderRadius: 8, marginLeft: 5 },
  
  confirmBtn: { marginTop: 20, backgroundColor: COLORS.primary, padding: 18, borderRadius: 15, alignItems: 'center' },
  confirmBtnText: { color: 'white', fontSize: 18, fontFamily: 'Lao-Bold' },

  categoryDropdown: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f9f9f9', padding: 12, borderRadius: 8, marginBottom: 15, borderWidth: 1, borderColor: '#eee' },
  categoryText: { fontFamily: 'Lao-Regular', fontSize: 16, color: '#333' },
  
  pickerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  pickerContent: { width: '85%', maxHeight: '70%', backgroundColor: 'white', borderRadius: 20, padding: 20, elevation: 10 },
  pickerTitle: { fontSize: 18, fontFamily: 'Lao-Bold', textAlign: 'center', color: '#333' },
  pickerItem: { paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#f5f5f5', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pickerItemText: { fontSize: 16, fontFamily: 'Lao-Regular', color: '#333' },
  pickerCloseBtn: { marginTop: 15, padding: 12, alignItems: 'center', backgroundColor: '#f5f5f5', borderRadius: 10 }
});