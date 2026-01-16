import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { onValue, push, ref } from 'firebase/database';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Dimensions,
    FlatList,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { db } from '../../firebase';
import { COLORS, formatNumber, Product } from '../../types';

const { width } = Dimensions.get('window');
const ORANGE_THEME = '#FF8F00';

interface SpecialSaleScreenProps {
  products: Product[];
}

export default function SpecialSaleScreen({ products }: SpecialSaleScreenProps) {
  // Form State
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [source, setSource] = useState<'Shop' | 'Online'>('Shop');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'QR' | 'TRANSFER'>('CASH');
  const [category, setCategory] = useState('');
  const [detail, setDetail] = useState('');
  const [price, setPrice] = useState('');
  const [qty, setQty] = useState('1');
  
  const [history, setHistory] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);

  // Fetch History & Categories
  useEffect(() => {
    const cats = [...new Set(products.map(p => p.category || 'ທົ່ວໄປ'))];
    setCategories(cats);
    if (!category && cats.length > 0) setCategory(cats[0]);

    const salesRef = ref(db, 'sales');
    const unsub = onValue(salesRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const list = Object.keys(data)
          .map(k => ({ id: k, ...data[k] }))
          .filter((item: any) => item.isSpecial === true) // ກັ່ນຕອງສະເພາະບິນພິເສດ
          .reverse();
        setHistory(list);
      }
    });
    return () => unsub();
  }, [products]);

  const handleSave = () => {
    if (!detail || !price || !qty) {
      Alert.alert("Error", "ກະລຸນາປ້ອນຂໍ້ມູນໃຫ້ຄົບ");
      return;
    }

    const total = parseFloat(price) * parseInt(qty);
    const newSale = {
      isSpecial: true,
      date: date.toISOString(),
      source: source === 'Shop' ? 'POS' : 'ONLINE',
      paymentMethod,
      currency: 'LAK', // Default manual sale to LAK
      items: [{
        name: detail,
        price: parseFloat(price),
        quantity: parseInt(qty),
        category,
        priceCurrency: 'LAK'
      }],
      subTotal: total,
      total: total,
      discount: 0,
      amountReceived: total,
      change: 0,
      status: 'COMPLETED'
    };

    push(ref(db, 'sales'), newSale)
      .then(() => {
        Alert.alert("Success", "ບັນທຶກສຳເລັດ!");
        setDetail('');
        setPrice('');
        setQty('1');
      })
      .catch(err => Alert.alert("Error", err.message));
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (selectedDate) setDate(selectedDate);
  };

  return (
    <View style={styles.container}>
      {/* Header with Tools */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>ຂາຍພິເສດ (Manual Sale)</Text>
        <View style={styles.tools}>
            <TouchableOpacity style={styles.toolBtn} onPress={() => Alert.alert("Template", "ເລືອກ Template (Coming Soon)")}>
                <Ionicons name="copy-outline" size={18} color="white" />
                <Text style={styles.toolText}>Template</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.toolBtn} onPress={() => Alert.alert("Import", "Import Excel (Coming Soon)")}>
                <Ionicons name="cloud-upload-outline" size={18} color="white" />
                <Text style={styles.toolText}>Import</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.toolBtn, {backgroundColor: ORANGE_THEME}]} onPress={() => Alert.alert("Export", "Export Excel (Coming Soon)")}>
                <Ionicons name="download-outline" size={18} color="white" />
                <Text style={styles.toolText}>Export</Text>
            </TouchableOpacity>
        </View>
      </View>

      <View style={styles.content}>
        {/* Left: Form */}
        <ScrollView style={styles.formSection}>
            <Text style={styles.label}>ວັນທີ *</Text>
            <TouchableOpacity style={styles.inputBox} onPress={() => setShowDatePicker(true)}>
                <Text>{date.toLocaleDateString('en-GB')}</Text>
                <Ionicons name="calendar" size={20} color="#666" />
            </TouchableOpacity>
            {showDatePicker && (
                <DateTimePicker value={date} mode="date" onChange={onDateChange} />
            )}

            <Text style={styles.label}>ແຫຼ່ງຂາຍ *</Text>
            <View style={styles.row}>
                {['Shop', 'Online'].map(s => (
                    <TouchableOpacity key={s} onPress={() => setSource(s as any)} style={[styles.chip, source === s && styles.activeChip]}>
                        <Text style={[styles.chipText, source === s && {color:'white'}]}>{s === 'Shop' ? 'ໜ້າຮ້ານ' : 'Online'}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            <Text style={styles.label}>ວິທີຊຳລະເງິນ *</Text>
            <View style={styles.row}>
                {['CASH', 'QR', 'TRANSFER'].map(m => (
                    <TouchableOpacity key={m} onPress={() => setPaymentMethod(m as any)} style={[styles.chip, paymentMethod === m && styles.activeChip]}>
                        <Text style={[styles.chipText, paymentMethod === m && {color:'white'}]}>{m}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            <Text style={styles.label}>ໝວດໝູ່ *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom: 15}}>
                {categories.map(c => (
                    <TouchableOpacity key={c} onPress={() => setCategory(c)} style={[styles.catChip, category === c && {borderColor: COLORS.primary, backgroundColor: '#E0F2F1'}]}>
                        <Text style={{color: category === c ? COLORS.primary : '#666'}}>{c}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            <Text style={styles.label}>ລາຍລະອຽດສິນຄ້າ *</Text>
            <TextInput style={styles.inputBox} placeholder="ພິມຊື່ສິນຄ້າ..." value={detail} onChangeText={setDetail} />

            <View style={styles.row}>
                <View style={{flex: 1, marginRight: 10}}>
                    <Text style={styles.label}>ລາຄາຂາຍ (ກີບ) *</Text>
                    <TextInput style={styles.inputBox} keyboardType="numeric" placeholder="0" value={price} onChangeText={setPrice} />
                </View>
                <View style={{flex: 1}}>
                    <Text style={styles.label}>ຈຳນວນ *</Text>
                    <TextInput style={styles.inputBox} keyboardType="numeric" placeholder="1" value={qty} onChangeText={setQty} />
                </View>
            </View>

            <View style={styles.totalBox}>
                <Text style={styles.totalLabel}>ລວມເງິນ:</Text>
                <Text style={styles.totalValue}>{formatNumber((parseFloat(price)||0) * (parseInt(qty)||0))} ₭</Text>
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                <Text style={styles.saveBtnText}>ບັນທຶກການຂາຍ</Text>
            </TouchableOpacity>
        </ScrollView>

        {/* Right: History */}
        <View style={styles.historySection}>
            <Text style={styles.historyTitle}>ປະຫວັດລາຍຮັບ (ຂາຍພິເສດ)</Text>
            <FlatList 
                data={history}
                keyExtractor={item => item.id}
                renderItem={({item}) => (
                    <View style={styles.historyCard}>
                        <View>
                            <Text style={styles.historyName}>{item.items[0]?.name}</Text>
                            <Text style={styles.historyDate}>{new Date(item.date).toLocaleDateString('en-GB')}</Text>
                        </View>
                        <View style={{alignItems: 'flex-end'}}>
                            <Text style={styles.historyPrice}>+{formatNumber(item.total)} ₭</Text>
                            <Text style={styles.historySource}>{item.paymentMethod}</Text>
                        </View>
                    </View>
                )}
            />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F9FA' },
  header: { padding: 15, backgroundColor: 'white', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 2 },
  headerTitle: { fontSize: 20, fontFamily: 'Lao-Bold', color: '#333' },
  tools: { flexDirection: 'row', gap: 10 },
  toolBtn: { flexDirection: 'row', backgroundColor: COLORS.primary, padding: 8, borderRadius: 8, gap: 5, alignItems: 'center' },
  toolText: { color: 'white', fontFamily: 'Lao-Bold', fontSize: 12 },
  
  content: { flex: 1, flexDirection: 'row', padding: 10, gap: 10 },
  formSection: { flex: 1, backgroundColor: 'white', borderRadius: 10, padding: 15, elevation: 2 },
  historySection: { flex: 1, backgroundColor: 'white', borderRadius: 10, padding: 15, elevation: 2 },
  
  label: { fontFamily: 'Lao-Bold', marginBottom: 5, color: '#333' },
  inputBox: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, marginBottom: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', fontFamily: 'Lao-Regular' },
  row: { flexDirection: 'row', marginBottom: 15, gap: 10 },
  chip: { flex: 1, padding: 10, borderWidth: 1, borderColor: '#eee', borderRadius: 8, alignItems: 'center' },
  activeChip: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontFamily: 'Lao-Bold', color: '#666' },
  catChip: { paddingHorizontal: 15, paddingVertical: 8, borderWidth: 1, borderColor: '#eee', borderRadius: 20, marginRight: 8 },
  
  totalBox: { backgroundColor: '#F0F9FA', padding: 15, borderRadius: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  totalLabel: { fontFamily: 'Lao-Bold', fontSize: 16 },
  totalValue: { fontFamily: 'Lao-Bold', fontSize: 20, color: COLORS.primary },
  
  saveBtn: { backgroundColor: COLORS.primary, padding: 15, borderRadius: 10, alignItems: 'center' },
  saveBtnText: { color: 'white', fontFamily: 'Lao-Bold', fontSize: 16 },

  historyTitle: { fontFamily: 'Lao-Bold', fontSize: 16, marginBottom: 15 },
  historyCard: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#eee' },
  historyName: { fontFamily: 'Lao-Bold', color: '#333' },
  historyDate: { fontSize: 12, color: '#888' },
  historyPrice: { fontFamily: 'Lao-Bold', color: COLORS.primary },
  historySource: { fontSize: 12, color: ORANGE_THEME }
});