import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Dimensions, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CartItem, COLORS, Product } from '../../types';

import { useExchangeRate } from '../../../hooks/useExchangeRate';
import CartModal from '../modals/CartModal';

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
  totalItems: number;
  totalLAK: number; 
  formatNumber: (num: number | string) => string;
  updateQuantity: (id: string, delta: number) => void;
  removeFromCart: (id: string) => void;
  onCheckout: (details: any) => void;
}

export default function POSScreen({ 
  products, addToCart, openEditProductModal, openScanner, openAddProductModal, 
  cart, totalItems, totalLAK, formatNumber,
  updateQuantity, removeFromCart, onCheckout
}: POSScreenProps) {
  
  const [modalVisible, setModalVisible] = useState(false);
  const exchangeRate = useExchangeRate(); 
  
  const currentRate = exchangeRate > 0 ? exchangeRate : 680;

  const grandTotalLAK = cart.reduce((sum, item) => {
    const itemTotal = item.price * item.quantity;
    if (item.priceCurrency === 'THB') {
        return sum + (itemTotal * currentRate);
    }
    return sum + itemTotal;
  }, 0);

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
                        {item.imageUrl ? (
                            <Image 
                                source={{ uri: item.imageUrl }} 
                                style={styles.productImage} 
                                resizeMode="cover" // 🟢 ໃຫ້ຮູບຂະຫຍາຍເຕັມພື້ນທີ່
                            /> 
                        ) : (
                            <View style={styles.imagePlaceholder}>
                                <Text style={styles.placeholderText}>{item.name.charAt(0)}</Text>
                            </View>
                        )}
                        
                        <View style={[styles.currencyBadge, { backgroundColor: item.priceCurrency === 'THB' ? COLORS.secondary : COLORS.success }]}>
                            <Text style={styles.currencyText}>{item.priceCurrency || 'LAK'}</Text>
                        </View>
                        
                        {item.stock <= 5 && (
                            <View style={styles.stockBadge}>
                                <Text style={styles.stockText}>{item.stock}</Text>
                            </View>
                        )}
                    </View>
                    
                    <View style={styles.cardContent}>
                        <Text style={styles.title} numberOfLines={1}>{item.name}</Text>
                        <Text style={[styles.price, { color: item.priceCurrency === 'THB' ? COLORS.secondaryDark : COLORS.primaryDark }]}>
                            {formatNumber(item.price)} {item.priceCurrency === 'THB' ? '฿' : '₭'}
                        </Text>
                    </View>
                    
                    <TouchableOpacity style={styles.addBtn} onPress={() => addToCart(item)}>
                        <Ionicons name="add" size={24} color="white" />
                    </TouchableOpacity>
                </TouchableOpacity>
            )}
        />
        
        {cart.length > 0 && (
            <TouchableOpacity style={styles.floatingCart} onPress={() => setModalVisible(true)}>
                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                    <View style={styles.cartBadge}><Text style={{color:'white', fontWeight:'bold'}}>{totalItems}</Text></View>
                    <Text style={{color:'white', fontFamily:'Lao-Bold', fontSize: 16, marginLeft: 10}}>ເບິ່ງກະຕ່າ</Text>
                </View>
                <Text style={{color:'white', fontFamily:'Lao-Bold', fontSize: 18}}>{formatNumber(grandTotalLAK)} ₭</Text>
            </TouchableOpacity>
        )}

        <CartModal 
            visible={modalVisible}
            onClose={() => setModalVisible(false)}
            cart={cart}
            total={grandTotalLAK}
            updateQuantity={updateQuantity}
            removeFromCart={removeFromCart}
            onCheckout={onCheckout}
            exchangeRate={currentRate} 
        />
    </View>
  );
}

const styles = StyleSheet.create({
    toolsBar: { flexDirection: 'row', padding: 10, gap: 10 },
    toolBtn: { flexDirection: 'row', backgroundColor: COLORS.secondary, padding: 10, borderRadius: 8, alignItems: 'center', gap: 5, flex: 1, justifyContent: 'center' },
    toolText: { color: 'white', fontFamily: 'Lao-Bold', fontSize: 12 },
    
    // 🟢 Card Style: ໃສ່ overflow hidden ເພື່ອຕັດມຸມຮູບ
    card: { 
        width: CARD_WIDTH, 
        backgroundColor: 'white', 
        marginBottom: 15, 
        borderRadius: 16, 
        overflow: 'hidden', // ສຳຄັນ!
        elevation: 2, 
        shadowColor: COLORS.primary, 
        shadowOpacity: 0.1, 
        shadowRadius: 5 
    },
    
    // 🟢 Image Container: ປັບຄວາມສູງ ແລະ ການຈັດວາງ
    imageContainer: { 
        height: 150, // ເພີ່ມຈາກ 130 ເປັນ 150 ໃຫ້ຮູບເບິ່ງເຕັມຕາ
        width: '100%', 
        backgroundColor: '#F8F8F8', // ປ່ຽນສີພື້ນຫຼັງອ່ອນໆ
        position: 'relative',
        justifyContent: 'center', // ຈັດກາງ (ສຳລັບ placeholder)
        alignItems: 'center'      // ຈັດກາງ (ສຳລັບ placeholder)
    },
    
    productImage: { 
        width: '100%', 
        height: '100%' 
    },
    
    imagePlaceholder: { 
        width: '100%', 
        height: '100%', 
        justifyContent: 'center', 
        alignItems: 'center' 
    },
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