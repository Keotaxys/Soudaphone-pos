import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { COLORS, formatNumber, Product } from '../../types';

interface ProductModalProps {
  visible: boolean;
  onClose: () => void;
  product: Product;
  setProduct: (product: Product) => void;
  onSave: () => void;
  onPickImage: () => void;
  onScan: () => void;
}

export default function ProductModal({ 
  visible, onClose, product, setProduct, onSave, onPickImage, onScan 
}: ProductModalProps) {
  
  return (
    <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{product.id ? 'ແກ້ໄຂສິນຄ້າ' : 'ເພີ່ມສິນຄ້າໃໝ່'}</Text>
            <TouchableOpacity onPress={onClose}><Ionicons name="close-circle" size={30} color="#ccc" /></TouchableOpacity>
          </View>
          
          <ScrollView>
            <TouchableOpacity style={styles.imagePicker} onPress={onPickImage}>
              {product.imageUrl ? (
                <Image source={{ uri: product.imageUrl }} style={{ width: 100, height: 100, borderRadius: 10 }} />
              ) : (
                <View style={{ alignItems: 'center' }}>
                  <Ionicons name="camera-outline" size={40} color="#ccc" />
                  <Text style={{ color: '#aaa', fontSize: 12 }}>ເລືອກຮູບ</Text>
                </View>
              )}
            </TouchableOpacity>

            <Text style={styles.label}>ຊື່ສິນຄ້າ</Text>
            <TextInput 
              style={styles.input} 
              value={product.name} 
              onChangeText={(t) => setProduct({ ...product, name: t })} 
              placeholder="ໃສ່ຊື່ສິນຄ້າ..." 
            />

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>ລາຄາ</Text>
                <TextInput 
                  style={styles.input} 
                  value={formatNumber(product.price)} 
                  onChangeText={(t) => setProduct({ ...product, price: parseFloat(t.replace(/,/g, '')) || 0 })} 
                  keyboardType="numeric" 
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>ສະກຸນເງິນ</Text>
                <View style={styles.currencySelector}>
                  <TouchableOpacity onPress={() => setProduct({ ...product, priceCurrency: 'LAK' })} style={[styles.currencyBtn, product.priceCurrency === 'LAK' && { backgroundColor: COLORS.primary }]}>
                    <Text style={{ color: product.priceCurrency === 'LAK' ? 'white' : '#888', fontWeight: 'bold' }}>₭</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setProduct({ ...product, priceCurrency: 'THB' })} style={[styles.currencyBtn, product.priceCurrency === 'THB' && { backgroundColor: COLORS.secondary }]}>
                    <Text style={{ color: product.priceCurrency === 'THB' ? 'white' : '#888', fontWeight: 'bold' }}>฿</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>ຈຳນວນສະຕັອກ</Text>
                <TextInput 
                  style={styles.input} 
                  value={formatNumber(product.stock)} 
                  onChangeText={(t) => setProduct({ ...product, stock: parseInt(t.replace(/,/g, '')) || 0 })} 
                  keyboardType="numeric" 
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>ບາໂຄດ</Text>
                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                  <TextInput 
                    style={[styles.input, {flex: 1, marginBottom: 0}]} 
                    value={product.barcode || ''} 
                    onChangeText={(t) => setProduct({ ...product, barcode: t })} 
                    placeholder="Scan..." 
                  />
                  <TouchableOpacity onPress={onScan} style={styles.scanBtn}>
                    <Ionicons name="barcode-outline" size={24} color="white" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <TouchableOpacity style={styles.confirmBtn} onPress={onSave}>
              <Text style={styles.confirmBtnText}>ບັນທຶກ</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: 'white', borderTopLeftRadius: 25, borderTopRightRadius: 25, height: '90%', padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  modalTitle: { fontSize: 20, color: '#333', fontFamily: 'Lao-Bold' },
  imagePicker: { width: 100, height: 100, backgroundColor: '#f0f0f0', borderRadius: 10, justifyContent: 'center', alignItems: 'center', alignSelf: 'center', marginBottom: 20 },
  label: { fontSize: 14, color: '#666', marginBottom: 5, fontFamily: 'Lao-Regular' },
  input: { backgroundColor: '#f9f9f9', padding: 12, borderRadius: 8, marginBottom: 15, fontFamily: 'Lao-Regular', fontSize: 16 },
  currencySelector: { flexDirection: 'row', height: 50, backgroundColor: '#f5f5f5', borderRadius: 8, alignItems: 'center', padding: 5 },
  currencyBtn: { flex: 1, alignItems: 'center', borderRadius: 6, paddingVertical: 8 },
  scanBtn: { padding: 10, backgroundColor: COLORS.secondary, borderRadius: 8, marginLeft: 5 },
  confirmBtn: { marginTop: 20, backgroundColor: COLORS.primary, padding: 18, borderRadius: 15, alignItems: 'center' },
  confirmBtnText: { color: 'white', fontSize: 18, fontFamily: 'Lao-Bold' }
});