import { Ionicons } from '@expo/vector-icons';
import { onValue, ref } from 'firebase/database';
import React, { useEffect, useState } from 'react';
import {
  FlatList,
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
import { db } from '../../firebase'; // 🟢 ຢ່າລືມກວດ path ນີ້
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

    // --- 🟢 ເພີ່ມສ່ວນຈັດການໝວດໝູ່ ---
    const [categories, setCategories] = useState<string[]>([]);
    const [showCategoryPicker, setShowCategoryPicker] = useState(false);

    useEffect(() => {
        const catRef = ref(db, 'categories');
        const unsubscribe = onValue(catRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                const catList = Array.isArray(data) ? data : Object.values(data);
                setCategories(catList as string[]);
            } else {
                // Default Categories
                setCategories(['ເສື້ອ', 'ໂສ້ງ', 'ກະໂປ່ງ', 'ຊຸດ', 'ກະເປົາ', 'ໝວກ', 'ເຄື່ອງສຳອາງ', 'ທົ່ວໄປ']);
            }
        });
        return () => unsubscribe();
    }, []);

    return (
        <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onClose}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    
                    {/* Header */}
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>{product.id ? 'ແກ້ໄຂສິນຄ້າ' : 'ເພີ່ມສິນຄ້າໃໝ່'}</Text>
                        <TouchableOpacity onPress={onClose}><Ionicons name="close-circle" size={30} color="#ccc" /></TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false}>
                        
                        {/* Image Picker */}
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

                        {/* Product Name */}
                        <Text style={styles.label}>ຊື່ສິນຄ້າ</Text>
                        <TextInput
                            style={styles.input}
                            value={product.name}
                            onChangeText={(t) => setProduct({ ...product, name: t })}
                            placeholder="ໃສ່ຊື່ສິນຄ້າ..."
                        />

                        {/* 🟢 Category Selector (Dropdown Style) */}
                        <Text style={styles.label}>ໝວດໝູ່</Text>
                        <TouchableOpacity 
                            style={styles.categoryDropdown} 
                            onPress={() => setShowCategoryPicker(true)}
                        >
                            <Text style={[styles.categoryText, !product.category && { color: '#ccc' }]}>
                                {product.category || 'ເລືອກໝວດໝູ່...'}
                            </Text>
                            <Ionicons name="chevron-down" size={20} color="#666" />
                        </TouchableOpacity>

                        {/* Price & Currency */}
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

                        {/* Stock & Barcode */}
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
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <TextInput
                                        style={[styles.input, { flex: 1, marginBottom: 0 }]}
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

                        <View style={{height: 50}} />
                    </ScrollView>
                </View>

                {/* 🟢 Category Picker Modal (ຊ້ອນທາງໃນ) */}
                <Modal visible={showCategoryPicker} transparent={true} animationType="fade">
                    <View style={styles.pickerOverlay}>
                        <View style={styles.pickerContent}>
                            <Text style={styles.pickerTitle}>ເລືອກໝວດໝູ່</Text>
                            <FlatList
                                data={categories}
                                keyExtractor={(item, index) => index.toString()}
                                renderItem={({ item }) => (
                                    <TouchableOpacity 
                                        style={styles.pickerItem}
                                        onPress={() => {
                                            setProduct({ ...product, category: item });
                                            setShowCategoryPicker(false);
                                        }}
                                    >
                                        <Text style={[styles.pickerItemText, product.category === item && { color: COLORS.primary, fontFamily: 'Lao-Bold' }]}>
                                            {item}
                                        </Text>
                                        {product.category === item && <Ionicons name="checkmark" size={20} color={COLORS.primary} />}
                                    </TouchableOpacity>
                                )}
                            />
                            <TouchableOpacity style={styles.pickerCloseBtn} onPress={() => setShowCategoryPicker(false)}>
                                <Text style={{ color: '#666', fontFamily: 'Lao-Bold' }}>ປິດ</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>

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
    confirmBtnText: { color: 'white', fontSize: 18, fontFamily: 'Lao-Bold' },

    // 🟢 Styles ໃໝ່ສຳລັບ Category
    categoryDropdown: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f9f9f9', padding: 12, borderRadius: 8, marginBottom: 15, borderWidth: 1, borderColor: '#f0f0f0' },
    categoryText: { fontFamily: 'Lao-Regular', fontSize: 16, color: '#333' },
    
    // 🟢 Styles ສຳລັບ Picker Modal
    pickerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },
    pickerContent: { width: '80%', maxHeight: '60%', backgroundColor: 'white', borderRadius: 20, padding: 20, elevation: 5 },
    pickerTitle: { fontSize: 18, fontFamily: 'Lao-Bold', marginBottom: 15, textAlign: 'center' },
    pickerItem: { paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#f0f0f0', flexDirection: 'row', justifyContent: 'space-between' },
    pickerItemText: { fontSize: 16, fontFamily: 'Lao-Regular', color: '#333' },
    pickerCloseBtn: { marginTop: 15, padding: 10, alignItems: 'center', backgroundColor: '#f5f5f5', borderRadius: 10 }
});