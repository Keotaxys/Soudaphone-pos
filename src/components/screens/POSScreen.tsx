import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Image,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { CartItem, COLORS, formatNumber, Product } from '../../types';

const { width } = Dimensions.get('window');

interface POSScreenProps {
  products: Product[];
  cart: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, delta: number) => void;
  clearCart: () => void;
  onCheckout: (details: any) => void;
  openEditProductModal?: (product: Product) => void;
  onOpenScan?: () => void;
  onOpenAddProduct?: () => void;
}

export default function POSScreen({
  products,
  cart,
  addToCart,
  removeFromCart,
  updateQuantity,
  clearCart,
  onCheckout,
  onOpenScan,
  onOpenAddProduct
}: POSScreenProps) {
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>(['All']);
  const [isCartVisible, setCartVisible] = useState(false);

  useEffect(() => {
    const uniqueCats = ['All', ...new Set(products.map(p => p.category || 'ອື່ນໆ'))];
    setCategories(uniqueCats);

    const filtered = products.filter(p => {
      const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (p.barcode && p.barcode.includes(searchQuery));
      const matchCat = selectedCategory === 'All' || (p.category || 'ອື່ນໆ') === selectedCategory;
      return matchSearch && matchCat;
    });
    setFilteredProducts(filtered);
  }, [searchQuery, selectedCategory, products]);

  const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  // --- Render Item (ບັດສິນຄ້າ) ---
  const renderProductItem = ({ item }: { item: Product }) => (
    <View style={styles.productCard}>
      <TouchableOpacity 
        activeOpacity={0.8}
        onPress={() => addToCart(item)}
        style={styles.cardContent}
      >
        <View style={[styles.currencyTag, item.priceCurrency === 'THB' ? {backgroundColor: '#FF9800'} : {backgroundColor: COLORS.primary}]}>
            <Text style={styles.currencyText}>{item.priceCurrency || 'LAK'}</Text>
        </View>

        <Image 
          source={item.imageUrl ? { uri: item.imageUrl } : { uri: 'https://via.placeholder.com/150' }} 
          style={styles.productImage} 
        />
        
        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
          <View style={styles.priceRow}>
            <Text style={styles.productPrice}>{formatNumber(item.price)} {item.priceCurrency === 'THB' ? '฿' : '₭'}</Text>
            <TouchableOpacity style={styles.addBtnSmall} onPress={() => addToCart(item)}>
                <Ionicons name="add" size={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );

  // 🟢 List Header Component: ລວມສ່ວນຄົ້ນຫາ, ປຸ່ມ ແລະ ໝວດໝູ່ ໄວ້ບ່ອນນີ້
  const ListHeader = () => (
    <View>
      {/* 1. Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#999" />
        <TextInput 
          style={styles.searchInput}
          placeholder="ຄົ້ນຫາສິນຄ້າ (ຊື່ ຫຼື ບາໂຄດ)..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color="#ccc" />
            </TouchableOpacity>
        )}
      </View>

      {/* 2. Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: COLORS.primary, marginRight: 10 }]} onPress={onOpenScan}>
            <Ionicons name="qr-code-outline" size={20} color="white" />
            <Text style={styles.actionBtnText}>ສະແກນ</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: COLORS.primary }]} onPress={onOpenAddProduct}>
            <Ionicons name="add-circle-outline" size={20} color="white" />
            <Text style={styles.actionBtnText}>ເພີ່ມສິນຄ້າ</Text>
        </TouchableOpacity>
      </View>

      {/* 3. Categories */}
      <View style={{ marginBottom: 10 }}>
        <FlatList 
          horizontal
          data={categories}
          keyExtractor={item => item}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 15 }}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={[styles.catChip, selectedCategory === item && styles.activeCatChip]}
              onPress={() => setSelectedCategory(item)}
            >
              <Text style={[styles.catText, selectedCategory === item && styles.activeCatText]}>{item}</Text>
            </TouchableOpacity>
          )}
        />
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      
      {/* 🟢 4. Main List: ໃຊ້ FlatList ດຽວຄຸມທັງໝົດ */}
      <FlatList
        ListHeaderComponent={ListHeader} // ໃສ່ສ່ວນຫົວທີ່ນີ້
        data={filteredProducts}
        keyExtractor={item => item.id!}
        numColumns={2}
        contentContainerStyle={{ paddingBottom: 100 }} // ເວັ້ນບ່ອນໃຫ້ Floating Cart
        columnWrapperStyle={{ paddingHorizontal: 10 }} // ຈັດ column ໃຫ້ຫ່າງຂອບ
        renderItem={renderProductItem}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="cube-outline" size={60} color="#ddd" />
            <Text style={styles.emptyText}>ບໍ່ພົບສິນຄ້າ</Text>
          </View>
        }
      />

      {/* 5. Floating Cart Bar */}
      {cart.length > 0 && (
        <TouchableOpacity 
            style={styles.floatingCartBar} 
            activeOpacity={0.9}
            onPress={() => setCartVisible(true)}
        >
            <View style={styles.cartIconWrapper}>
                <Ionicons name="cart" size={24} color="white" />
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>{totalItems}</Text>
                </View>
            </View>
            <View style={styles.cartTextWrapper}>
                <Text style={styles.cartTotalLabel}>ຍອດລວມ:</Text>
                <Text style={styles.cartTotalValue}>{formatNumber(totalAmount)} ₭</Text>
            </View>
            <View style={styles.viewCartBtn}>
                <Text style={styles.viewCartText}>ເບິ່ງກະຕ່າ</Text>
                <Ionicons name="chevron-forward" size={16} color={COLORS.primary} />
            </View>
        </TouchableOpacity>
      )}

      {/* 6. Cart Modal */}
      <Modal visible={isCartVisible} animationType="slide" onRequestClose={() => setCartVisible(false)}>
        <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
                <TouchableOpacity onPress={() => setCartVisible(false)}>
                    <Ionicons name="close" size={28} color="#333" />
                </TouchableOpacity>
                <Text style={styles.modalTitle}>ກະຕ່າສິນຄ້າ ({totalItems})</Text>
                <TouchableOpacity onPress={() => { clearCart(); setCartVisible(false); }}>
                    <Text style={{color: 'red', fontFamily: 'Lao-Bold'}}>ລ້າງ</Text>
                </TouchableOpacity>
            </View>

            <FlatList 
                data={cart}
                keyExtractor={item => item.id!}
                contentContainerStyle={{padding: 15}}
                renderItem={({item}) => (
                    <View style={styles.cartItem}>
                        <View style={{flex: 1}}>
                            <Text style={styles.cartItemName}>{item.name}</Text>
                            <Text style={styles.cartItemPrice}>{formatNumber(item.price)} x {item.quantity} = {formatNumber(item.price * item.quantity)}</Text>
                        </View>
                        <View style={styles.qtyControls}>
                            <TouchableOpacity onPress={() => updateQuantity(item.id!, -1)}><Ionicons name="remove-circle" size={28} color="#ccc" /></TouchableOpacity>
                            <Text style={styles.qtyText}>{item.quantity}</Text>
                            <TouchableOpacity onPress={() => updateQuantity(item.id!, 1)}><Ionicons name="add-circle" size={28} color={COLORS.primary} /></TouchableOpacity>
                        </View>
                        <TouchableOpacity onPress={() => removeFromCart(item.id!)} style={{marginLeft: 10}}>
                            <Ionicons name="trash-outline" size={24} color="red" />
                        </TouchableOpacity>
                    </View>
                )}
            />

            <View style={styles.modalFooter}>
                <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>ຍອດລວມ:</Text>
                    <Text style={styles.totalValue}>{formatNumber(totalAmount)} ₭</Text>
                </View>
                <TouchableOpacity 
                    style={styles.checkoutBtn} 
                    onPress={() => {
                        setCartVisible(false);
                        onCheckout({ amountReceived: totalAmount, paymentMethod: 'CASH' });
                    }}
                >
                    <Text style={styles.checkoutText}>ຊຳລະເງິນ</Text>
                </TouchableOpacity>
            </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F9FA' },
  
  // Search
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', margin: 15, paddingHorizontal: 15, height: 50, borderRadius: 10, elevation: 2 },
  searchInput: { flex: 1, marginLeft: 10, fontFamily: 'Lao-Regular', fontSize: 16 },

  // Action Buttons
  actionButtons: { flexDirection: 'row', paddingHorizontal: 15, marginBottom: 15 },
  actionBtn: { flex: 1, flexDirection: 'row', height: 45, borderRadius: 10, justifyContent: 'center', alignItems: 'center', gap: 8, elevation: 2 },
  actionBtnText: { color: 'white', fontFamily: 'Lao-Bold', fontSize: 14 },

  // Categories
  catChip: { paddingHorizontal: 20, paddingVertical: 8, backgroundColor: 'white', borderRadius: 20, marginRight: 8, borderWidth: 1, borderColor: '#eee' },
  activeCatChip: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  catText: { fontFamily: 'Lao-Regular', color: '#666' },
  activeCatText: { color: 'white', fontFamily: 'Lao-Bold' },

  // Product Grid
  productCard: { width: '50%', padding: 5 },
  cardContent: { backgroundColor: 'white', borderRadius: 12, padding: 10, elevation: 2, alignItems: 'center' },
  productImage: { width: '100%', height: 120, borderRadius: 10, backgroundColor: '#f0f0f0', marginBottom: 10, resizeMode: 'cover' },
  productInfo: { width: '100%' },
  productName: { fontFamily: 'Lao-Bold', fontSize: 14, color: '#333', marginBottom: 5 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  productPrice: { fontFamily: 'Lao-Bold', fontSize: 14, color: COLORS.primary },
  addBtnSmall: { backgroundColor: COLORS.primary, width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  
  currencyTag: { position: 'absolute', top: 10, left: 10, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, zIndex: 1 },
  currencyText: { color: 'white', fontSize: 10, fontFamily: 'Lao-Bold' },

  // Empty State
  emptyContainer: { alignItems: 'center', marginTop: 50 },
  emptyText: { fontFamily: 'Lao-Regular', color: '#999', marginTop: 10 },

  // Floating Cart Bar
  floatingCartBar: { 
    position: 'absolute', 
    bottom: 20, left: 15, right: 15, 
    backgroundColor: '#333', 
    borderRadius: 50, 
    height: 60,
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 15, 
    elevation: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5
  },
  cartIconWrapper: { position: 'relative', paddingRight: 15, borderRightWidth: 1, borderRightColor: '#555' },
  badge: { position: 'absolute', top: -5, right: 5, backgroundColor: COLORS.primary, width: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  badgeText: { color: 'white', fontSize: 10, fontFamily: 'Lao-Bold' },
  cartTextWrapper: { flex: 1, paddingLeft: 15 },
  cartTotalLabel: { color: '#ccc', fontSize: 10, fontFamily: 'Lao-Regular' },
  cartTotalValue: { color: 'white', fontSize: 16, fontFamily: 'Lao-Bold' },
  viewCartBtn: { backgroundColor: 'white', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 5 },
  viewCartText: { color: COLORS.primary, fontFamily: 'Lao-Bold', fontSize: 12 },

  // Modal Styles
  modalContainer: { flex: 1, backgroundColor: '#F5F9FA' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: 'white', elevation: 2, paddingTop: 50 },
  modalTitle: { fontSize: 18, fontFamily: 'Lao-Bold' },
  cartItem: { flexDirection: 'row', backgroundColor: 'white', padding: 15, marginHorizontal: 15, marginTop: 10, borderRadius: 10, alignItems: 'center', elevation: 1 },
  cartItemName: { fontFamily: 'Lao-Bold', fontSize: 16, marginBottom: 5 },
  cartItemPrice: { fontFamily: 'Lao-Regular', color: COLORS.primary },
  qtyControls: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  qtyText: { fontFamily: 'Lao-Bold', fontSize: 16 },
  
  modalFooter: { backgroundColor: 'white', padding: 20, borderTopWidth: 1, borderTopColor: '#eee', paddingBottom: 40 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  totalLabel: { fontFamily: 'Lao-Regular', fontSize: 16 },
  totalValue: { fontFamily: 'Lao-Bold', fontSize: 20, color: COLORS.primary },
  checkoutBtn: { backgroundColor: COLORS.primary, padding: 15, borderRadius: 10, alignItems: 'center' },
  checkoutText: { color: 'white', fontFamily: 'Lao-Bold', fontSize: 18 }
});