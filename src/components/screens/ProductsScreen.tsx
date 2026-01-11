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
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { db } from '../../firebase';
import { COLORS, formatNumber, Product } from '../../types';

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

  const [searchQuery, setSearchQuery] = useState('');

  // ກັ່ນຕອງສິນຄ້າຕາມການຄົ້ນຫາ
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (p.barcode && p.barcode.includes(searchQuery))
  );

  // 🟢 1. ຟັງຊັນ Download Template
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

  // 🟢 2. ຟັງຊັນ Export
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

  // 🟢 3. ຟັງຊັນ Import
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
                          name,
                          price,
                          stock,
                          priceCurrency: currency,
                          barcode,
                          category,
                          createdAt: new Date().toISOString()
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
            <Image 
                source={item.imageUrl ? { uri: item.imageUrl } : { uri: 'https://via.placeholder.com/150' }} 
                style={styles.image} 
            />
            <View style={[styles.tag, { backgroundColor: item.priceCurrency === 'LAK' ? COLORS.primary : COLORS.secondary }]}>
                <Text style={styles.tagText}>{item.priceCurrency}</Text>
            </View>
        </View>

        <View style={styles.details}>
            <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
            <Text style={styles.price}>
                {formatNumber(item.price)} {item.priceCurrency === 'LAK' ? '₭' : '฿'}
            </Text>
            <Text style={[styles.stock, item.stock <= 5 && { color: COLORS.danger }]}>
                ຄົງເຫຼືອ: {item.stock}
            </Text>
        </View>

        <View style={styles.actions}>
            <TouchableOpacity style={styles.editBtn} onPress={() => onEditProduct(item)}>
                <Ionicons name="pencil" size={20} color={COLORS.primary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.deleteBtn} onPress={() => onDeleteProduct(item.id!)}>
                <Ionicons name="trash-outline" size={20} color={COLORS.danger} />
            </TouchableOpacity>
        </View>
    </View>
  );

  return (
    <View style={styles.container}>
      
      {/* 🟢 Header with Actions (Search + Import/Export) */}
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
          
          <View style={styles.actionIcons}>
              <TouchableOpacity style={styles.iconBtn} onPress={handleDownloadTemplate}>
                  <Ionicons name="download-outline" size={20} color={COLORS.primary} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconBtn} onPress={handleImport}>
                  <Ionicons name="cloud-upload-outline" size={20} color={COLORS.primary} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconBtn} onPress={handleExport}>
                  <Ionicons name="share-outline" size={20} color={COLORS.primary} />
              </TouchableOpacity>
          </View>
      </View>

      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => item.id!}
        renderItem={renderProductItem}
        contentContainerStyle={{ padding: 15, paddingBottom: 100 }}
        ListEmptyComponent={
            <View style={styles.emptyContainer}>
                <Ionicons name="cube-outline" size={60} color="#ddd" />
                <Text style={styles.emptyText}>ບໍ່ພົບສິນຄ້າ</Text>
            </View>
        }
      />

      <TouchableOpacity style={styles.fab} onPress={onAddProduct}>
          <Ionicons name="add" size={30} color="white" />
          <Text style={styles.fabText}>ເພີ່ມສິນຄ້າ</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  
  // 🟢 Header Area (Search + Actions)
  headerArea: { padding: 15, paddingBottom: 0 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', paddingHorizontal: 15, paddingVertical: 10, borderRadius: 12, elevation: 2, marginBottom: 10 },
  searchInput: { flex: 1, marginLeft: 10, fontFamily: 'Lao-Regular', fontSize: 16 },
  
  actionIcons: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginBottom: 5 },
  iconBtn: { backgroundColor: 'white', padding: 8, borderRadius: 8, elevation: 2 },

  card: { flexDirection: 'row', backgroundColor: 'white', marginBottom: 10, borderRadius: 12, padding: 10, alignItems: 'center', elevation: 1 },
  imageWrapper: { position: 'relative', width: 70, height: 70, borderRadius: 10, overflow: 'hidden', backgroundColor: '#f0f0f0' },
  image: { width: '100%', height: '100%' },
  tag: { position: 'absolute', top: 0, left: 0, paddingHorizontal: 6, paddingVertical: 2, borderBottomRightRadius: 8 },
  tagText: { color: 'white', fontSize: 10, fontFamily: 'Lao-Bold' },

  details: { flex: 1, marginLeft: 15 },
  name: { fontFamily: 'Lao-Bold', fontSize: 16, color: COLORS.text },
  price: { fontFamily: 'Lao-Bold', fontSize: 15, color: COLORS.primary, marginTop: 4 },
  stock: { fontFamily: 'Lao-Regular', fontSize: 12, color: '#888', marginTop: 2 },

  actions: { flexDirection: 'row', gap: 10 },
  editBtn: { padding: 8, backgroundColor: '#E0F2F1', borderRadius: 8 },
  deleteBtn: { padding: 8, backgroundColor: '#FFEBEE', borderRadius: 8 },

  fab: { position: 'absolute', bottom: 20, right: 20, backgroundColor: COLORS.secondary, paddingVertical: 12, paddingHorizontal: 20, borderRadius: 30, flexDirection: 'row', alignItems: 'center', elevation: 5 },
  fabText: { color: 'white', fontFamily: 'Lao-Bold', fontSize: 16, marginLeft: 5 },

  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyText: { fontFamily: 'Lao-Regular', color: '#ccc', marginTop: 10 }
});