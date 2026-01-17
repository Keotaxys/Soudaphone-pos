import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
// @ts-ignore
import * as FileSystem from 'expo-file-system/legacy';
import { shareAsync } from 'expo-sharing';
import { push, ref } from 'firebase/database';
import React, { useState } from 'react';
import {
    Alert,
    FlatList,
    Image,
    Keyboard,
    KeyboardAvoidingView,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { db } from '../../firebase';
import { useCategories } from '../../hooks/useCategories';
import { COLORS, formatNumber, Product } from '../../types';

const ORANGE_THEME = '#FF8F00'; 

interface ProductsScreenProps {
  products: Product[];
  onAddProduct: () => void;
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (id: string) => void;
}

export default function ProductsScreen({ 
  products, 
  onAddProduct, 
  onEditProduct, 
  onDeleteProduct 
}: ProductsScreenProps) {

  // 🟢 ດຶງຂໍ້ມູນແລະຟັງຊັນຈາກ Hook
  const { categories: dbCategories, categoryObjs, addCategory, editCategory, deleteCategory } = useCategories();
  const categoryList = ['All', ...dbCategories];

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All'); 
  
  // State ສຳລັບ Modal ໝວດໝູ່
  const [showCatModal, setShowCatModal] = useState(false);
  const [catNameInput, setCatNameInput] = useState('');
  const [editingCatId, setEditingCatId] = useState<string | null>(null);

  const filteredProducts = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        (p.barcode && p.barcode.includes(searchQuery));
    const matchCategory = selectedCategory === 'All' || (p.category || 'ອື່ນໆ') === selectedCategory;
    return matchSearch && matchCategory;
  });

  // 🟢 ເປີດ Modal (ເພີ່ມ ຫຼື ແກ້ໄຂ)
  const openCategoryModal = (mode: 'add' | 'edit', name = '', id: string | null = null) => {
      setCatNameInput(name);
      setEditingCatId(id);
      setShowCatModal(true);
  };

  // 🟢 ບັນທຶກ (ແຍກກໍລະນີເພີ່ມໃໝ່ ແລະ ແກ້ໄຂ)
  const handleSaveCategory = async () => {
    if (!catNameInput.trim()) return;

    let success = false;
    if (editingCatId) {
        success = await editCategory(editingCatId, catNameInput);
    } else {
        success = await addCategory(catNameInput);
    }

    if (success) {
        setCatNameInput('');
        setEditingCatId(null);
        setShowCatModal(false);
    }
  };

  // 🟢 ກົດຄ້າງເພື່ອລຶບ/ແກ້ໄຂ
  const handleLongPressCategory = (catName: string) => {
      if (catName === 'All') return;

      const targetCat = categoryObjs.find(c => c.name === catName);
      
      // ຖ້າບໍ່ພົບ ID (ເຊິ່ງບໍ່ໜ້າຈະເກີດຂຶ້ນແລ້ວ ເພາະເຮົາລຶບ Default ອອກໝົດແລ້ວ)
      if (!targetCat) return;

      Alert.alert(
          "ຈັດການໝວດໝູ່",
          `ເລືອກການທຳງານສຳລັບ "${catName}"`,
          [
              { text: "ຍົກເລີກ", style: "cancel" },
              { text: "ແກ້ໄຂຊື່", onPress: () => openCategoryModal('edit', catName, targetCat.id) },
              { 
                  text: "ລຶບ", 
                  style: "destructive", 
                  onPress: () => {
                      Alert.alert("ຢືນຢັນ", "ຕ້ອງການລຶບແທ້ບໍ?", [
                          { text: "ຍົກເລີກ", style: "cancel" },
                          { text: "ລຶບເລີຍ", style: 'destructive', onPress: () => deleteCategory(targetCat.id) }
                      ]);
                  }
              }
          ]
      );
  };

  // --- Logic ເດີມ (Template, Export, Import) ---
  const handleDownloadTemplate = async () => {
      const csvContent = "Name,Price,Stock,Currency(LAK/THB),Barcode,Category\nເສື້ອຢືດ,50000,10,LAK,88889999,ເສື້ອຜ້າ\n";
      const fileName = `${FileSystem.documentDirectory}product_template.csv`;
      try {
          await FileSystem.writeAsStringAsync(fileName, csvContent, { encoding: 'utf8' });
          await shareAsync(fileName, { mimeType: 'text/csv', UTI: 'public.comma-separated-values-text' });
      } catch (error) {
          Alert.alert("Error", "ບໍ່ສາມາດດາວໂຫລດ Template ໄດ້");
      }
  };

  const handleExport = async () => {
      let csvContent = "Name,Price,Stock,Currency,Barcode,Category\n";
      products.forEach(p => {
          csvContent += `${p.name},${p.price},${p.stock},${p.priceCurrency},${p.barcode || ''},${p.category || ''}\n`;
      });
      const fileName = `${FileSystem.documentDirectory}products_export_${new Date().getTime()}.csv`;
      try {
          await FileSystem.writeAsStringAsync(fileName, csvContent, { encoding: 'utf8' });
          await shareAsync(fileName, { mimeType: 'text/csv', UTI: 'public.comma-separated-values-text' });
      } catch (error) {
          Alert.alert("Error", "ບໍ່ສາມາດ Export ໄດ້");
      }
  };

  const handleImport = async () => {
      try {
          const result = await DocumentPicker.getDocumentAsync({ type: ['text/csv', 'application/vnd.ms-excel', '*/*'] });
          if (result.canceled) return;

          const fileUri = result.assets[0].uri;
          const fileContent = await FileSystem.readAsStringAsync(fileUri);
          const rows = fileContent.split('\n');

          let successCount = 0;
          for (let i = 1; i < rows.length; i++) {
              const row = rows[i].split(',');
              if (row.length >= 3) {
                  const name = row[0]?.trim();
                  const price = parseFloat(row[1]?.trim());
                  const stock = parseInt(row[2]?.trim());
                  const currency = row[3]?.trim() === 'THB' ? 'THB' : 'LAK';
                  const barcode = row[4]?.trim() || '';
                  const category = row[5]?.trim() || 'ທົ່ວໄປ';

                  if (name && !isNaN(price) && !isNaN(stock)) {
                      await push(ref(db, 'products'), {
                          name, price, stock, priceCurrency: currency, barcode, category, createdAt: new Date().toISOString()
                      });
                      successCount++;
                  }
              }
          }
          Alert.alert("ສຳເລັດ", `ນຳເຂົ້າສິນຄ້າສຳເລັດ ${successCount} ລາຍການ`);
      } catch (error) {
          Alert.alert("Error", "ເກີດຂໍ້ຜິດພາດໃນການນຳເຂົ້າຟາຍ");
      }
  };

  const renderProductItem = ({ item }: { item: Product }) => (
    <View style={styles.card}>
        <View style={styles.imageWrapper}>
            <Image source={item.imageUrl ? { uri: item.imageUrl } : { uri: 'https://via.placeholder.com/150' }} style={styles.image} />
            <View style={[styles.tag, { backgroundColor: item.priceCurrency === 'LAK' ? COLORS.primary : ORANGE_THEME }]}>
                <Text style={styles.tagText}>{item.priceCurrency}</Text>
            </View>
        </View>
        <View style={styles.details}>
            <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
            <Text style={styles.categoryText}>{item.category || 'ບໍ່ມີໝວດໝູ່'}</Text>
            <Text style={styles.price}>{formatNumber(item.price)} {item.priceCurrency === 'LAK' ? '₭' : '฿'}</Text>
            <Text style={[styles.stock, item.stock <= 5 && { color: ORANGE_THEME }]}>ຄົງເຫຼືອ: {item.stock}</Text>
        </View>
        <View style={styles.actions}>
            <TouchableOpacity style={styles.editBtn} onPress={() => onEditProduct(item)}>
                <Ionicons name="pencil" size={20} color={COLORS.primary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.deleteBtn} onPress={() => onDeleteProduct(item.id!)}>
                <Ionicons name="trash-outline" size={20} color={ORANGE_THEME} />
            </TouchableOpacity>
        </View>
    </View>
  );

  const ListHeader = () => (
    <View style={styles.headerArea}>
        <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="#999" />
            <TextInput 
              style={styles.searchInput} 
              placeholder="ຄົ້ນຫາຊື່ ຫຼື ບາໂຄດ..." 
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <Ionicons name="close-circle" size={20} color="#ccc" />
                </TouchableOpacity>
            )}
        </View>

        <View style={{flexDirection: 'row', marginBottom: 10, alignItems: 'center'}}>
            {/* 🟢 ປ່ຽນສີປຸ່ມເປັນ Teal */}
            <TouchableOpacity style={[styles.addCatMiniBtn, {backgroundColor: COLORS.primary}]} onPress={() => openCategoryModal('add')}>
                <Ionicons name="add" size={20} color="white" />
            </TouchableOpacity>
            <FlatList 
                horizontal 
                data={categoryList} 
                keyExtractor={i => i} 
                showsHorizontalScrollIndicator={false} 
                contentContainerStyle={{paddingRight: 10}}
                renderItem={({item}) => (
                    <TouchableOpacity 
                        style={[styles.catChip, selectedCategory === item && styles.activeCatChip]} 
                        onPress={() => setSelectedCategory(item)}
                        // 🟢 ກົດຄ້າງເພື່ອແກ້ໄຂ/ລຶບ
                        onLongPress={() => handleLongPressCategory(item)}
                        delayLongPress={500}
                    >
                        <Text style={[styles.catText, selectedCategory === item && styles.activeCatText]}>{item}</Text>
                    </TouchableOpacity>
                )} 
            />
        </View>

        <View style={styles.actionIcons}>
            <TouchableOpacity style={styles.iconBtn} onPress={handleDownloadTemplate}><Ionicons name="download-outline" size={20} color={COLORS.primary} /></TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn} onPress={handleImport}><Ionicons name="cloud-upload-outline" size={20} color={COLORS.primary} /></TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn} onPress={handleExport}><Ionicons name="share-outline" size={20} color={COLORS.primary} /></TouchableOpacity>
        </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => item.id!}
        ListHeaderComponent={ListHeader}
        renderItem={renderProductItem}
        contentContainerStyle={{ padding: 15, paddingBottom: 120 }}
        ListEmptyComponent={
            <View style={styles.emptyContainer}>
                <Ionicons name="cube-outline" size={60} color="#ddd" />
                <Text style={styles.emptyText}>ບໍ່ພົບສິນຄ້າ</Text>
            </View>
        }
      />

      {/* 🟢 FAB ວົງມົນ ສີ Teal */}
      <TouchableOpacity 
        style={styles.fab} 
        onPress={onAddProduct}
        activeOpacity={0.8}
      >
          <Ionicons name="add" size={35} color="white" />
      </TouchableOpacity>

      {/* Modal ສຳລັບ Add/Edit Category */}
      <Modal visible={showCatModal} transparent animationType="slide">
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>
                        {editingCatId ? 'ແກ້ໄຂໝວດໝູ່' : 'ເພີ່ມໝວດໝູ່ໃໝ່'}
                    </Text>
                    <TextInput 
                        style={styles.inputBox} 
                        placeholder="ຊື່ໝວດໝູ່..." 
                        value={catNameInput} 
                        onChangeText={setCatNameInput}
                        autoFocus
                    />
                    <View style={{flexDirection: 'row', gap: 10, marginTop: 20}}>
                        <TouchableOpacity style={[styles.modalBtn, {backgroundColor: '#ccc'}]} onPress={() => setShowCatModal(false)}>
                            <Text style={styles.modalBtnText}>ຍົກເລີກ</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.modalBtn, {backgroundColor: COLORS.primary}]} onPress={handleSaveCategory}>
                            <Text style={styles.modalBtnText}>ບັນທຶກ</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  
  headerArea: { paddingBottom: 10 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', paddingHorizontal: 15, paddingVertical: 10, borderRadius: 12, elevation: 2, marginBottom: 10 },
  searchInput: { flex: 1, marginLeft: 10, fontFamily: 'Lao-Regular', fontSize: 16 },
  
  actionIcons: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginBottom: 5 },
  iconBtn: { backgroundColor: 'white', padding: 8, borderRadius: 8, elevation: 2 },

  catChip: { paddingHorizontal: 15, paddingVertical: 6, backgroundColor: 'white', borderRadius: 20, marginRight: 8, borderWidth: 1, borderColor: '#eee' },
  activeCatChip: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  catText: { fontFamily: 'Lao-Regular', color: '#666', fontSize: 12 },
  activeCatText: { color: 'white', fontFamily: 'Lao-Bold' },
  addCatMiniBtn: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 10 },

  card: { flexDirection: 'row', backgroundColor: 'white', marginBottom: 10, borderRadius: 12, padding: 10, alignItems: 'center', elevation: 1 },
  imageWrapper: { position: 'relative', width: 70, height: 70, borderRadius: 10, overflow: 'hidden', backgroundColor: '#f0f0f0' },
  image: { width: '100%', height: '100%' },
  tag: { position: 'absolute', top: 0, left: 0, paddingHorizontal: 6, paddingVertical: 2, borderBottomRightRadius: 8 },
  tagText: { color: 'white', fontSize: 10, fontFamily: 'Lao-Bold' },

  details: { flex: 1, marginLeft: 15 },
  name: { fontFamily: 'Lao-Bold', fontSize: 16, color: COLORS.text },
  categoryText: { fontFamily: 'Lao-Regular', fontSize: 10, color: '#999', marginBottom: 2 },
  price: { fontFamily: 'Lao-Bold', fontSize: 15, color: COLORS.primary, marginTop: 2 },
  stock: { fontFamily: 'Lao-Regular', fontSize: 12, color: '#888', marginTop: 2 },

  actions: { flexDirection: 'row', gap: 10 },
  editBtn: { padding: 8, backgroundColor: '#E0F2F1', borderRadius: 8 },
  deleteBtn: { padding: 8, backgroundColor: '#FFF3E0', borderRadius: 8 },

  // 🟢 FAB Style ແກ້ໄຂໃໝ່
  fab: { 
    position: 'absolute', 
    bottom: 90, 
    right: 20, 
    backgroundColor: COLORS.primary, // ສີ Teal
    width: 60, 
    height: 60,
    borderRadius: 30, 
    justifyContent: 'center',
    alignItems: 'center', 
    elevation: 10, 
    zIndex: 9999, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.3, 
    shadowRadius: 4.65,
  },

  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyText: { fontFamily: 'Lao-Regular', color: '#ccc', marginTop: 10 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: 'white', width: '80%', padding: 20, borderRadius: 15, alignItems: 'center' },
  modalTitle: { fontFamily: 'Lao-Bold', fontSize: 18, marginBottom: 15 },
  inputBox: { width: '100%', borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, fontFamily: 'Lao-Regular' },
  modalBtn: { flex: 1, padding: 12, borderRadius: 8, alignItems: 'center' },
  modalBtnText: { color: 'white', fontFamily: 'Lao-Bold' }
});