import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { onValue, push, ref } from 'firebase/database';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import * as XLSX from 'xlsx';
import { db } from '../../firebase';
import { COLORS, formatNumber, Product } from '../../types';

const ORANGE_THEME = '#FF8F00';

const STATIC_CATEGORIES = [
    'ເສື້ອ', 'ໂສ້ງ', 'ໂສ້ງຊ້ອນໃນ', 'ກະໂປງ', 'ຊຸດ', 'ກະເປົາ', 
    'ໝວກ', 'ຖົງຕີນ', 'ເກີບ', 'ເຄື່ອງສຳອາງ', 'ເຄື່ອງປະດັບ', 'ທົ່ວໄປ'
];

interface SpecialSaleScreenProps {
  products: Product[];
}

export default function SpecialSaleScreen({ products }: SpecialSaleScreenProps) {
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [source, setSource] = useState<'Shop' | 'Online'>('Shop');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'QR'>('CASH');
  const [currency, setCurrency] = useState<'LAK' | 'THB'>('LAK'); 

  const [category, setCategory] = useState(STATIC_CATEGORIES[0]);
  const [showCatDropdown, setShowCatDropdown] = useState(false);

  const [detail, setDetail] = useState('');
  const [price, setPrice] = useState('');
  const [qty, setQty] = useState('1');
  const [amountReceived, setAmountReceived] = useState(''); 

  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const totalVal = (parseFloat(price) || 0) * (parseInt(qty) || 0);
  const receivedVal = parseFloat(amountReceived) || 0;
  const changeVal = receivedVal - totalVal;

  useEffect(() => {
    const salesRef = ref(db, 'sales');
    const unsub = onValue(salesRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const list = Object.keys(data)
          .map(k => ({ id: k, ...data[k] }))
          .filter((item: any) => item.isSpecial === true)
          .reverse();
        setHistory(list);
      }
    });
    return () => unsub();
  }, []);

  // 1. Template
  const handleDownloadTemplate = async () => {
    setLoading(true);
    try {
        const data = [
            { "ຊື່ສິນຄ້າ": "ຕົວຢ່າງ: ເສື້ອຢືດ", "ໝວດໝູ່": "ເສື້ອ", "ລາຄາ": 50000, "ຈຳນວນ": 2, "ສະກຸນເງິນ(LAK/THB)": "LAK", "ວິທີຈ່າຍ(CASH/QR)": "CASH", "ແຫຼ່ງຂາຍ(Shop/Online)": "Shop" }
        ];
        
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(data);
        XLSX.utils.book_append_sheet(wb, ws, "Template");
        
        const base64 = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
        // 🟢 ແກ້ໄຂ: ໃຊ້ cacheDirectory ເພື່ອລົດບັນຫາ type ແລະໃຊ້ string 'base64'
        const filename = FileSystem.cacheDirectory + "SpecialSale_Template.xlsx";
        
        await FileSystem.writeAsStringAsync(filename, base64, { encoding: 'base64' });
        await Sharing.shareAsync(filename);
    } catch (e) {
        Alert.alert("Error", "ບໍ່ສາມາດສ້າງ Template ໄດ້");
    } finally {
        setLoading(false);
    }
  };

  // 2. Export
  const handleExport = async () => {
    if (history.length === 0) {
        Alert.alert("ແຈ້ງເຕືອນ", "ບໍ່ມີຂໍ້ມູນໃຫ້ສົ່ງອອກ");
        return;
    }
    setLoading(true);
    try {
        const exportData = history.map(item => ({
            "ວັນທີ": new Date(item.date).toLocaleDateString('en-GB'),
            "ຊື່ສິນຄ້າ": item.items[0]?.name || "",
            "ໝວດໝູ່": item.items[0]?.category || "",
            "ລາຄາ": item.items[0]?.price || 0,
            "ຈຳນວນ": item.items[0]?.quantity || 0,
            "ລວມເງິນ": item.total,
            "ສະກຸນເງິນ": item.currency,
            "ວິທີຊຳລະ": item.paymentMethod,
            "ແຫຼ່ງຂາຍ": item.source
        }));

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(exportData);
        XLSX.utils.book_append_sheet(wb, ws, "SalesData");

        const base64 = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
        // 🟢 ແກ້ໄຂ: ໃຊ້ cacheDirectory
        const filename = FileSystem.cacheDirectory + `SpecialSales_${new Date().getTime()}.xlsx`;

        await FileSystem.writeAsStringAsync(filename, base64, { encoding: 'base64' });
        await Sharing.shareAsync(filename);
    } catch (e) {
        Alert.alert("Error", "ສົ່ງອອກຂໍ້ມູນບໍ່ສຳເລັດ");
    } finally {
        setLoading(false);
    }
  };

  // 3. Import
  const handleImport = async () => {
    try {
        const result = await DocumentPicker.getDocumentAsync({
            type: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/comma-separated-values'],
            copyToCacheDirectory: true
        });

        if (result.canceled) return;

        setLoading(true);
        const fileUri = result.assets[0].uri;
        // 🟢 ແກ້ໄຂ: ໃຊ້ string 'base64' ແທນ Enum
        const fileContent = await FileSystem.readAsStringAsync(fileUri, { encoding: 'base64' });
        
        const wb = XLSX.read(fileContent, { type: 'base64' });
        const wsName = wb.SheetNames[0];
        const ws = wb.Sheets[wsName];
        
        // 🟢 ແກ້ໄຂ: Cast data ເປັນ any[]
        const data = XLSX.utils.sheet_to_json(ws) as any[];

        if (data.length === 0) {
            Alert.alert("Error", "ບໍ່ພົບຂໍ້ມູນໃນຟາຍ");
            setLoading(false);
            return;
        }

        let successCount = 0;
        // 🟢 ແກ້ໄຂ: Loop ແບບຖືກຕ້ອງຕາມຫຼັກ TypeScript
        for (const rowItem of data) {
            const row = rowItem as any;
            const name = row["ຊື່ສິນຄ້າ"];
            const cat = row["ໝວດໝູ່"] || "ທົ່ວໄປ";
            const price = parseFloat(row["ລາຄາ"] || 0);
            const qty = parseInt(row["ຈຳນວນ"] || 1);
            const curr = row["ສະກຸນເງິນ(LAK/THB)"] || "LAK";
            const method = row["ວິທີຈ່າຍ(CASH/QR)"] || "CASH";
            const src = row["ແຫຼ່ງຂາຍ(Shop/Online)"] || "Shop";

            if (name && price > 0) {
                const total = price * qty;
                const newSale = {
                    isSpecial: true,
                    date: new Date().toISOString(),
                    source: src === 'Shop' ? 'POS' : 'ONLINE',
                    paymentMethod: method,
                    currency: curr,
                    items: [{ name, price, quantity: qty, category: cat, priceCurrency: curr }],
                    subTotal: total,
                    total: total,
                    discount: 0,
                    amountReceived: total,
                    change: 0,
                    status: 'COMPLETED'
                };
                await push(ref(db, 'sales'), newSale);
                successCount++;
            }
        }
        
        Alert.alert("ສຳເລັດ", `ນຳເຂົ້າຂໍ້ມູນສຳເລັດ ${successCount} ລາຍການ`);

    } catch (e) {
        console.log(e);
        Alert.alert("Error", "ເກີດຂໍ້ຜິດພາດໃນການອ່ານຟາຍ");
    } finally {
        setLoading(false);
    }
  };

  const handleSave = () => {
    if (!detail || !price || !qty) {
      Alert.alert("ແຈ້ງເຕືອນ", "ກະລຸນາປ້ອນຂໍ້ມູນໃຫ້ຄົບຖ້ວນ");
      return;
    }

    if (paymentMethod === 'CASH' && receivedVal < totalVal) {
        Alert.alert("ແຈ້ງເຕືອນ", "ເງິນທີ່ຮັບມາບໍ່ພຽງພໍ!");
        return;
    }

    const newSale = {
      isSpecial: true,
      date: date.toISOString(),
      source: source === 'Shop' ? 'POS' : 'ONLINE',
      paymentMethod,
      currency,
      items: [{
        name: detail,
        price: parseFloat(price),
        quantity: parseInt(qty),
        category,
        priceCurrency: currency
      }],
      subTotal: totalVal,
      total: totalVal,
      discount: 0,
      amountReceived: paymentMethod === 'CASH' ? receivedVal : totalVal,
      change: paymentMethod === 'CASH' ? changeVal : 0,
      status: 'COMPLETED'
    };

    push(ref(db, 'sales'), newSale)
      .then(() => {
        Alert.alert("ສຳເລັດ", "ບັນທຶກຂໍ້ມູນການຂາຍຮຽບຮ້ອຍແລ້ວ!");
        setDetail('');
        setPrice('');
        setQty('1');
        setAmountReceived('');
      })
      .catch(err => Alert.alert("ຜິດພາດ", err.message));
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (selectedDate) setDate(selectedDate);
  };

  const getActiveColor = (isActive: boolean, type: 'default' | 'alert') => {
      if (!isActive) return '#eee';
      if (type === 'alert') return ORANGE_THEME;
      return COLORS.primary;
  };

  return (
    <View style={styles.container}>
      {/* Loading Overlay */}
      {loading && (
        <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={{marginTop: 10, fontFamily: 'Lao-Bold'}}>ກຳລັງປະມວນຜົນ...</Text>
        </View>
      )}

      <View style={styles.header}>
        <Text style={styles.headerTitle}>ຂາຍພິເສດ (Manual Sale)</Text>
        <View style={styles.tools}>
            <TouchableOpacity style={styles.toolBtn} onPress={handleDownloadTemplate}>
                <Ionicons name="copy-outline" size={18} color="white" />
                <Text style={styles.toolText}>Template</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.toolBtn} onPress={handleImport}>
                <Ionicons name="cloud-upload-outline" size={18} color="white" />
                <Text style={styles.toolText}>Import</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.toolBtn, {backgroundColor: COLORS.primary}]} onPress={handleExport}>
                <Ionicons name="download-outline" size={18} color="white" />
                <Text style={styles.toolText}>Export</Text>
            </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        
        <View style={styles.formSection}>
            
            {/* Row 1: Date & Source */}
            <View style={styles.row}>
                <View style={{flex: 1}}>
                    <Text style={styles.label}>ວັນທີ *</Text>
                    <TouchableOpacity style={styles.inputBox} onPress={() => setShowDatePicker(true)}>
                        <Text>{date.toLocaleDateString('en-GB')}</Text>
                        <Ionicons name="calendar" size={20} color="#666" />
                    </TouchableOpacity>
                </View>
                <View style={{flex: 1, marginLeft: 10}}>
                    <Text style={styles.label}>ແຫຼ່ງຂາຍ *</Text>
                    <View style={styles.chipRow}>
                        {['Shop', 'Online'].map(s => {
                            const isOnline = s === 'Online';
                            const isActive = source === s;
                            return (
                                <TouchableOpacity 
                                    key={s} 
                                    onPress={() => setSource(s as any)} 
                                    style={[
                                        styles.chipSmall, 
                                        { 
                                            backgroundColor: isActive ? getActiveColor(true, isOnline ? 'alert' : 'default') : 'white',
                                            borderColor: isActive ? getActiveColor(true, isOnline ? 'alert' : 'default') : '#eee'
                                        }
                                    ]}
                                >
                                    <Text style={[styles.chipText, isActive && {color:'white'}]}>{s === 'Shop' ? 'ຮ້ານ' : 'Online'}</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>
            </View>

            {/* Row 2: Currency & Payment */}
            <View style={styles.row}>
                <View style={{flex: 1}}>
                    <Text style={styles.label}>ສະກຸນເງິນ *</Text>
                    <View style={styles.chipRow}>
                        <TouchableOpacity style={[styles.chipSmall, currency === 'LAK' && styles.activeChip]} onPress={() => setCurrency('LAK')}>
                            <Text style={[styles.chipText, currency === 'LAK' && {color:'white'}]}>₭ LAK</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.chipSmall, currency === 'THB' && {backgroundColor: ORANGE_THEME, borderColor: ORANGE_THEME}]} onPress={() => setCurrency('THB')}>
                            <Text style={[styles.chipText, currency === 'THB' && {color:'white'}]}>฿ THB</Text>
                        </TouchableOpacity>
                    </View>
                </View>
                <View style={{flex: 1, marginLeft: 10}}>
                    <Text style={styles.label}>ຊຳລະໂດຍ *</Text>
                    <View style={styles.chipRow}>
                        {['CASH', 'QR'].map(m => {
                            const isQR = m === 'QR';
                            const isActive = paymentMethod === m;
                            return (
                                <TouchableOpacity 
                                    key={m} 
                                    onPress={() => setPaymentMethod(m as any)} 
                                    style={[
                                        styles.chipSmall, 
                                        { 
                                            backgroundColor: isActive ? getActiveColor(true, isQR ? 'alert' : 'default') : 'white',
                                            borderColor: isActive ? getActiveColor(true, isQR ? 'alert' : 'default') : '#eee'
                                        }
                                    ]}
                                >
                                    <Text style={[styles.chipText, isActive && {color:'white'}]}>{m === 'CASH' ? 'ເງິນສົດ' : 'QR'}</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>
            </View>

            <Text style={styles.label}>ໝວດໝູ່ *</Text>
            <TouchableOpacity style={styles.inputBox} onPress={() => setShowCatDropdown(true)}>
                <Text>{category || 'ເລືອກໝວດໝູ່'}</Text>
                <Ionicons name="chevron-down" size={20} color="#666" />
            </TouchableOpacity>

            <Text style={styles.label}>ລາຍລະອຽດສິນຄ້າ *</Text>
            <TextInput style={styles.inputBox} placeholder="ພິມຊື່ສິນຄ້າ..." value={detail} onChangeText={setDetail} />

            <View style={styles.row}>
                <View style={{flex: 1, marginRight: 10}}>
                    <Text style={styles.label}>ລາຄາ ({currency}) *</Text>
                    <TextInput style={styles.inputBox} keyboardType="numeric" placeholder="0" value={price} onChangeText={setPrice} />
                </View>
                <View style={{flex: 1}}>
                    <Text style={styles.label}>ຈຳນວນ *</Text>
                    <TextInput style={styles.inputBox} keyboardType="numeric" placeholder="1" value={qty} onChangeText={setQty} />
                </View>
            </View>

            <View style={styles.totalBox}>
                <Text style={styles.totalLabel}>ລວມເງິນ:</Text>
                <Text style={styles.totalValue}>{formatNumber(totalVal)} {currency === 'THB' ? '฿' : '₭'}</Text>
            </View>

            {paymentMethod === 'CASH' && (
                <View style={styles.cashSection}>
                    <Text style={styles.sectionHeader}>🧮 ຄິດໄລ່ເງິນສົດ</Text>
                    <View style={styles.row}>
                        <View style={{flex: 1, marginRight: 10}}>
                            <Text style={styles.label}>ຮັບເງິນມາ:</Text>
                            <TextInput 
                                style={[styles.inputBox, {borderColor: COLORS.primary, borderWidth: 2}]} 
                                keyboardType="numeric" 
                                placeholder="0" 
                                value={amountReceived} 
                                onChangeText={setAmountReceived} 
                            />
                        </View>
                        <View style={{flex: 1}}>
                            <Text style={styles.label}>ເງິນທອນ:</Text>
                            <View style={[styles.inputBox, {backgroundColor: '#f0f0f0', borderColor: '#eee'}]}>
                                <Text style={{fontFamily: 'Lao-Bold', color: changeVal < 0 ? 'red' : COLORS.primary}}>
                                    {formatNumber(changeVal)}
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>
            )}

            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                <Text style={styles.saveBtnText}>ບັນທຶກການຂາຍ</Text>
            </TouchableOpacity>
        </View>

        <View style={styles.historySection}>
            <Text style={styles.historyTitle}>ປະຫວັດລາຍຮັບ (ຂາຍພິເສດ)</Text>
            <FlatList 
                data={history}
                keyExtractor={item => item.id}
                scrollEnabled={false} 
                renderItem={({item}) => (
                    <View style={styles.historyCard}>
                        <View>
                            <Text style={styles.historyName}>{item.items[0]?.name}</Text>
                            <Text style={styles.historyDate}>{new Date(item.date).toLocaleDateString('en-GB')}</Text>
                        </View>
                        <View style={{alignItems: 'flex-end'}}>
                            <Text style={styles.historyPrice}>+{formatNumber(item.total)} {item.currency === 'THB' ? '฿' : '₭'}</Text>
                            <Text style={styles.historySource}>{item.paymentMethod}</Text>
                        </View>
                    </View>
                )}
            />
        </View>

        <View style={{height: 50}} /> 
      </ScrollView>

      {/* Category Dropdown Modal */}
      <Modal visible={showCatDropdown} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setShowCatDropdown(false)}>
            <View style={styles.dropdownContent}>
                <Text style={styles.dropdownTitle}>ເລືອກໝວດໝູ່</Text>
                <FlatList 
                    data={STATIC_CATEGORIES}
                    keyExtractor={i => i}
                    renderItem={({item}) => (
                        <TouchableOpacity style={styles.dropdownItem} onPress={() => { setCategory(item); setShowCatDropdown(false); }}>
                            <Text style={{fontSize: 16}}>{item}</Text>
                            {category === item && <Ionicons name="checkmark" size={20} color={COLORS.primary} />}
                        </TouchableOpacity>
                    )}
                />
            </View>
        </TouchableOpacity>
      </Modal>

      {/* Date Picker Modal */}
      {showDatePicker && (
        <View style={styles.datePickerOverlay}>
            <View style={styles.datePickerContainer}>
                <DateTimePicker 
                    value={date} 
                    mode="date" 
                    display="inline" 
                    onChange={onDateChange} 
                    textColor="black" 
                    themeVariant="light" 
                    style={{backgroundColor: 'white'}}
                />
                <TouchableOpacity style={styles.closeDateBtn} onPress={() => setShowDatePicker(false)}>
                    <Text style={styles.closeDateText}>ຕົກລົງ</Text>
                </TouchableOpacity>
            </View>
        </View>
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F9FA' },
  loadingOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(255,255,255,0.8)', zIndex: 9999, justifyContent: 'center', alignItems: 'center' },
  header: { padding: 15, backgroundColor: 'white', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 2 },
  headerTitle: { fontSize: 20, fontFamily: 'Lao-Bold', color: '#333' },
  tools: { flexDirection: 'row', gap: 5 },
  toolBtn: { flexDirection: 'row', backgroundColor: COLORS.primary, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8, gap: 5, alignItems: 'center' },
  toolText: { color: 'white', fontFamily: 'Lao-Bold', fontSize: 10 },
  
  content: { flex: 1, padding: 10 },
  formSection: { backgroundColor: 'white', borderRadius: 10, padding: 15, elevation: 2, marginBottom: 15 },
  historySection: { backgroundColor: 'white', borderRadius: 10, padding: 15, elevation: 2, marginBottom: 20 },
  
  label: { fontFamily: 'Lao-Bold', marginBottom: 5, color: '#333' },
  inputBox: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, marginBottom: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', fontFamily: 'Lao-Regular', height: 50 },
  
  row: { flexDirection: 'row', alignItems: 'center' },
  chipRow: { flexDirection: 'row', gap: 5, marginBottom: 15 },
  chipSmall: { flex: 1, paddingVertical: 10, borderWidth: 1, borderColor: '#eee', borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  activeChip: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontFamily: 'Lao-Bold', color: '#666', fontSize: 12 },
  
  totalBox: { backgroundColor: '#F0F9FA', padding: 15, borderRadius: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  totalLabel: { fontFamily: 'Lao-Bold', fontSize: 16 },
  totalValue: { fontFamily: 'Lao-Bold', fontSize: 20, color: COLORS.primary },
  
  cashSection: { backgroundColor: '#FFF3E0', padding: 15, borderRadius: 10, marginBottom: 20, borderLeftWidth: 5, borderLeftColor: ORANGE_THEME },
  sectionHeader: { fontFamily: 'Lao-Bold', color: ORANGE_THEME, marginBottom: 10 },

  saveBtn: { backgroundColor: COLORS.primary, padding: 15, borderRadius: 10, alignItems: 'center' },
  saveBtnText: { color: 'white', fontFamily: 'Lao-Bold', fontSize: 16 },

  historyTitle: { fontFamily: 'Lao-Bold', fontSize: 16, marginBottom: 15 },
  historyCard: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#eee' },
  historyName: { fontFamily: 'Lao-Bold', color: '#333' },
  historyDate: { fontSize: 12, color: '#888' },
  historyPrice: { fontFamily: 'Lao-Bold', color: COLORS.primary },
  historySource: { fontSize: 12, color: ORANGE_THEME },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  dropdownContent: { backgroundColor: 'white', width: '80%', padding: 20, borderRadius: 15, maxHeight: '60%' },
  dropdownTitle: { fontFamily: 'Lao-Bold', fontSize: 18, marginBottom: 15, textAlign: 'center' },
  dropdownItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#eee' },

  datePickerOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', zIndex: 999 },
  datePickerContainer: { backgroundColor: 'white', padding: 20, borderRadius: 20, width: '90%', alignItems: 'center' },
  closeDateBtn: { marginTop: 10, padding: 10, width: '100%', alignItems: 'center', backgroundColor: '#f0f0f0', borderRadius: 10 },
  closeDateText: { fontFamily: 'Lao-Bold', color: COLORS.primary },
});