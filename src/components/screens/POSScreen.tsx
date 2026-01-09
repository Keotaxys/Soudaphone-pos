import React from 'react';
import { View, FlatList, TouchableOpacity, Text, Image, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Product, CartItem, COLORS } from '../../types';

const { width } = Dimensions.get('window');
const COLUMN_COUNT = 2;
const CARD_WIDTH = (width / COLUMN_COUNT) - 20;

interface POSScreenProps {
  products: Product[];
  addToCart: (item: Product) => void;
  openEditProductModal: (item: Product) => void;
  openScanner: (mode: 'sell' | 'edit') => void;
  openAddProductModal: () => void;
  cart: CartItem[];
  setModalVisible: (visible: boolean) => void;
  totalItems: number;
  totalLAK: number;
  formatNumber: (num: number | string) => string;
}

export default function POSScreen({ 
  products, addToCart, openEditProductModal, openScanner, openAddProductModal, 
  cart, setModalVisible, totalItems, totalLAK, formatNumber 
}: POSScreenProps) {
  
  return (
    <View style={{flex: 1}}>
        <View style={styles.toolsBar}>
            <TouchableOpacity style={styles.toolBtn} onPress={() => openScanner('sell')}>
                <Ionicons name="barcode-outline" size={24} color="white" />
                <Text style={styles.toolText}>ສະແກນ</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.toolBtn} onPress={openAddProductModal}>
                <Ionicons name="add-circle-outline" size={24} color="white" />
                <Text style={styles.toolText}>ເພີ່ມສິນຄ້າ</Text>
            </TouchableOpacity>
        </View>

        <FlatList 
            key="pos-grid"
            data={products}
            keyExtractor={item => item.id!}
            numColumns={COLUMN_COUNT}
            columnWrapperStyle={{ justifyContent: 'space-between', paddingHorizontal: 10 }}
            contentContainerStyle={{ paddingBottom: 100, paddingTop: 10 }}
            renderItem={({ item }) => (
                <TouchableOpacity style={styles.card} onPress={() => addToCart(item)} onLongPress={() => openEditProductModal(item)} activeOpacity={0.8}>
                    <View style={styles.imageContainer}>
                        {item.imageUrl ? <Image source={{ uri: item.imageUrl }} style={styles.productImage} resizeMode="cover" /> : <View style={styles.imagePlaceholder}><Text style={styles.placeholderText}>{item.name.charAt(0)}</Text></View>}
                        <View style={[styles.currencyBadge, { backgroundColor: item.priceCurrency === 'THB' ? COLORS.secondary : COLORS.success }]}><Text style={styles.currencyText}>{item.priceCurrency || 'LAK'}</Text></View>
                        {item.stock <= 5 && <View style={styles.stockBadge}><Text style={styles.stockText}>{item.stock}</Text></View>}
                    </View>
                    <View style={styles.cardContent}>
                        <Text style={styles.title} numberOfLines={1}>{item.name}</Text>
                        <Text style={[styles.price, { color: item.priceCurrency === 'THB' ? COLORS.secondaryDark : COLORS.primaryDark }]}>{formatNumber(item.price)} {item.priceCurrency === 'THB' ? '฿' : '₭'}</Text>
                    </View>
                    <TouchableOpacity style={styles.addBtn} onPress={() => addToCart(item)}><Ionicons name="add" size={24} color="white" /></TouchableOpacity>
                </TouchableOpacity>
            )}
        />
        
        {/* ປຸ່ມກະຕ່າລອຍ (Floating Cart) - ກົດແລ້ວເປີດ Modal */}
        {cart.length > 0 && (
            <TouchableOpacity style={styles.floatingCart} onPress={() => setModalVisible(true)} activeOpacity={0.9}>
                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                    <View style={styles.cartBadge}><Text style={{color:'white', fontWeight:'bold'}}>{totalItems}</Text></View>
                    <Text style={{color:'white', fontFamily:'Lao-Bold', fontSize: 16, marginLeft: 10}}>ເບິ່ງກະຕ່າ</Text>
                </View>
                {/* ສະແດງຍອດເງິນລວມເປັນກີບໄວ້ກ່ອນ */}
                <Text style={{color:'white', fontFamily:'Lao-Bold', fontSize: 18}}>{formatNumber(totalLAK)} ₭</Text>
            </TouchableOpacity>
        )}
    </View>
  );
}

const styles = StyleSheet.create({
    toolsBar: { flexDirection: 'row', padding: 10, gap: 10 },
    toolBtn: { flexDirection: 'row', backgroundColor: COLORS.secondary, padding: 10, borderRadius: 8, alignItems: 'center', gap: 5, flex: 1, justifyContent: 'center' },
    toolText: { color: 'white', fontFamily: 'Lao-Bold', fontSize: 12 },
    card: { width: CARD_WIDTH, backgroundColor: 'white', marginBottom: 15, borderRadius: 16, overflow: 'hidden', elevation: 2, shadowColor: COLORS.primary, shadowOpacity: 0.1, shadowRadius: 5 },
    imageContainer: { height: 130, width: '100%', backgroundColor: '#f0f0f0', position: 'relative' },
    productImage: { width: '100%', height: '100%' },
    imagePlaceholder: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
    placeholderText: { fontSize: 30, color: '#ccc', fontFamily: 'Lao-Bold' },
    currencyBadge: { position: 'absolute', top: 8, left: 8, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    currencyText: { color: 'white', fontSize: 10, fontFamily: 'Lao-Bold' },
    stockBadge: { position: 'absolute', top: 8, right: 8, backgroundColor: COLORS.danger, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10 },
    stockText: { color: 'white', fontSize: 10, fontFamily: 'Lao-Bold' },
    cardContent: { padding: 12 },
    title: { fontSize: 14, color: '#333', marginBottom: 4, fontFamily: 'Lao-Regular' },
    price: { fontSize: 16, fontFamily: 'Lao-Bold' },
    addBtn: { position: 'absolute', bottom: 10, right: 10, backgroundColor: COLORS.secondary, width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 2, elevation: 3 },
    floatingCart: { position: 'absolute', bottom: 20, left: 20, right: 20, backgroundColor: '#333', borderRadius: 50, padding: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 10 },
    cartBadge: { backgroundColor: 'red', width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
});