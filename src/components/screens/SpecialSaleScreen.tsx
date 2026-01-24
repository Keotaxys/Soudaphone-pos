import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { onValue, push, ref } from 'firebase/database';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView, // ✅ Import ມາແລ້ວ
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context'; // ✅ ໃຊ້ SafeAreaView ໂຕນີ້
import * as XLSX from 'xlsx';
import { db } from '../../firebase';
import { useCategories } from '../../hooks/useCategories';
import { useExchangeRate } from '../../hooks/useExchangeRate';
import { COLORS, formatDate, formatNumber, Product } from '../../types';

const ORANGE_THEME = '#FF8F00';

type FilterType = 'day' | 'week' | 'month' | 'year' | 'custom';

interface SpecialSaleScreenProps {
  products: Product[];
}

export default function SpecialSaleScreen({ products }: SpecialSaleScreenProps) {
  const { categories, addCategory } = useCategories();
  const exchangeRate = useExchangeRate();

  // Form State
  const [date, setDate] = useState(new Date());
  const [showFormDatePicker, setShowFormDatePicker] = useState(false);
  
  const [source, setSource] = useState<'Shop' | 'Online'>('Shop');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'QR'>('CASH');
  const [currency, setCurrency] = useState<'LAK' | 'THB'>('LAK'); 
  
  const [category, setCategory] = useState(''); 
  const [showCatDropdown, setShowCatDropdown] = useState(false);
  
  const [showAddCatModal, setShowAddCatModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');

  const [detail, setDetail] = useState('');
  const [price, setPrice] = useState('');
  const [qty, setQty] = useState('1');
  const [amountReceived, setAmountReceived] = useState(''); 

  // History & Filter State
  const [history, setHistory] = useState<any[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [filterType, setFilterType] = useState<FilterType>('day');
  const [currentFilterDate, setCurrentFilterDate] = useState(new Date());
  const [customStartDate, setCustomStartDate] = useState(new Date());
  const [customEndDate, setCustomEndDate] = useState(new Date());
  
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);
  const [customDateMode, setCustomDateMode] = useState<'start' | 'end'>('start');

  const totalVal = (parseFloat(price) || 0) * (parseInt(qty) || 0);
  const receivedVal = parseFloat(amountReceived) || 0;
  const changeVal = receivedVal - totalVal;

  useEffect(() => {
    if (categories.length > 0 && !category) {
        setCategory(categories[0]);
    }
  }, [categories, category]);

  useEffect(() => {
    const salesRef = ref(db, 'sales');
    const unsub = onValue(salesRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const list = Object.keys(data)
          .map(k => ({ id: k, ...data[k] }))
          .filter((item: any) => item.isSpecial === true)
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setHistory(list);
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    let start = new Date(currentFilterDate);
    let end = new Date(currentFilterDate);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    switch (filterType) {
      case 'week':
        const day = start.getDay();
        const diff = start.getDate() - day + (day === 0 ? -6 : 1);
        start.setDate(diff);
        end = new Date(start);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);
        break;
      case 'month':
        start.setDate(1);
        end = new Date(start.getFullYear(), start.getMonth() + 1, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'year':
        start.setMonth(0, 1);
        end.setMonth(11, 31);
        end.setHours(23, 59, 59, 999);
        break;
      case 'custom':
        start = new Date(customStartDate);
        start.setHours(0, 0, 0, 0);
        end = new Date(customEndDate);
        end.setHours(23, 59, 59, 999);
        break;
    }

    const filtered = history.filter(item => {
        const d = new Date(item.date);
        return d >= start && d <= end;
    });
    setFilteredHistory(filtered);

  }, [history, filterType, currentFilterDate, customStartDate, customEndDate]);

  const handleNavigateDate = (dir: 'prev' | 'next') => {
    if (filterType === 'custom') return;
    const newDate = new Date(currentFilterDate);
    const val = dir === 'next' ? 1 : -1;
    if (filterType === 'day') newDate.setDate(newDate.getDate() + val);
    else if (filterType === 'week') newDate.setDate(newDate.getDate() + (val * 7));
    else if (filterType === 'month') newDate.setMonth(newDate.getMonth() + val);
    else if (filterType === 'year') newDate.setFullYear(newDate.getFullYear() + val);
    setCurrentFilterDate(newDate);
  };

  const getDateLabel = () => {
    if (filterType === 'custom') return `${formatDate(customStartDate)} - ${formatDate(customEndDate)}`;
    return formatDate(currentFilterDate);
  };

  const parseExcelDate = (excelDate: any) => {
      if (typeof excelDate === 'number') {
          return new Date(Math.round((excelDate - 25569) * 86400 * 1000));
      }
      if (typeof excelDate === 'string') {
          const parts = excelDate.split('/');
          if (parts.length === 3) {
              return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
          }
          return new Date(excelDate);
      }
      return new Date();
  };

  const handleAddNewCategory = async () => {
    const success = await addCategory(newCatName);
    if (success) {
        setCategory(newCatName.trim());
        setNewCatName('');
        setShowAddCatModal(false);
        setShowCatDropdown(false);
        Alert.alert("ສຳເລັດ", "ເພີ່ມໝວດໝູ່ຮຽບຮ້ອຍແລ້ວ");
    }
  };

  const handleDownloadTemplate = async () => {
    setLoading(true);
    try {
        const data = [{ "ວັນທີ": "17/01/2026", "ຊື່ສິນຄ້າ": "ຕົວຢ່າງ: ເສື້ອ", "ໝວດໝູ່": categories[0] || "ເສື້ອ", "ລາຄາ": 50000, "ຈຳນວນ": 2, "ສະກຸນເງິນ(ກີບ/ບາດ)": "ກີບ", "ວິທີຈ່າຍ(ເງິນສົດ/QR)": "ເງິນສົດ", "ແຫຼ່ງຂາຍ(ໜ້າຮ້ານ/Online)": "ໜ້າຮ້ານ" }];
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(data);
        ws['!cols'] = [{ wch: 15 }, { wch: 20 }, { wch: 15 }, { wch: 10 }, { wch: 8 }, { wch: 15 }, { wch: 15 }, { wch: 20 }];
        XLSX.utils.book_append_sheet(wb, ws, "Template");
        const base64 = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
        const fileDir = (FileSystem as any).cacheDirectory || (FileSystem as any).documentDirectory;
        const uri = fileDir + "SpecialSale_Template.xlsx";
        await FileSystem.writeAsStringAsync(uri, base64, { encoding: 'base64' });
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) await Sharing.shareAsync(uri);
    } catch (e: any) { Alert.alert("Error", e.message); } finally { setLoading(false); }
  };

  const handleExport = async () => {
    if (filteredHistory.length === 0) { Alert.alert("ແຈ້ງເຕືອນ", "ບໍ່ມີຂໍ້ມູນໃນຊ່ວງເວລານີ້"); return; }
    setLoading(true);
    try {
        const exportData = filteredHistory.map(item => ({
            "ວັນທີ": new Date(item.date).toLocaleDateString('en-GB'),
            "ຊື່ສິນຄ້າ": item.items[0]?.name || "",
            "ໝວດໝູ່": item.items[0]?.category || "",
            "ລາຄາ": item.items[0]?.price || 0,
            "ຈຳນວນ": item.items[0]?.quantity || 0,
            "ລວມເງິນ": item.total,
            "ສະກຸນເງິນ(ກີບ/ບາດ)": item.currency === 'THB' ? 'ບາດ' : 'ກີບ',
            "ວິທີຈ່າຍ(ເງິນສົດ/QR)": item.paymentMethod === 'CASH' ? 'ເງິນສົດ' : 'QR',
            "ແຫຼ່ງຂາຍ(ໜ້າຮ້ານ/Online)": item.source === 'POS' ? 'ໜ້າຮ້ານ' : 'Online'
        }));
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(exportData);
        XLSX.utils.book_append_sheet(wb, ws, "SalesData");
        const base64 = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
        const fileDir = (FileSystem as any).cacheDirectory || (FileSystem as any).documentDirectory;
        const uri = fileDir + `SpecialSales_${new Date().getTime()}.xlsx`;
        await FileSystem.writeAsStringAsync(uri, base64, { encoding: 'base64' });
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) await Sharing.shareAsync(uri);
    } catch (e: any) { Alert.alert("Error", e.message); } finally { setLoading(false); }
  };

  const handleImport = async () => {
    try {
        const result = await DocumentPicker.getDocumentAsync({ type: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/csv'], copyToCacheDirectory: true });
        if (result.canceled) return;
        setLoading(true);
        const fileUri = result.assets[0].uri;
        const fileContent = await FileSystem.readAsStringAsync(fileUri, { encoding: 'base64' });
        const wb = XLSX.read(fileContent, { type: 'base64' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws) as any[];
        if (!data || data.length === 0) { setLoading(false); return Alert.alert("Error", "ບໍ່ພົບຂໍ້ມູນ"); }
        
        let count = 0;
        for (const row of data) {
            const name = row["ຊື່ສິນຄ້າ"];
            const price = parseFloat(row["ລາຄາ"] || 0);
            if (name && price > 0) {
                const qty = parseInt(row["ຈຳນວນ"] || 1);
                const total = price * qty;
                const sourceMap = row["ແຫຼ່ງຂາຍ(ໜ້າຮ້ານ/Online)"] === 'Online' ? 'ONLINE' : 'POS';
                const currencyMap = row["ສະກຸນເງິນ(ກີບ/ບາດ)"] === 'ບາດ' ? 'THB' : 'LAK';
                let paymentMap = "CASH";
                if (row["ວິທີຈ່າຍ(ເງິນສົດ/QR)"] === 'QR') paymentMap = 'QR';
                const saleDate = row["ວັນທີ"] ? parseExcelDate(row["ວັນທີ"]) : new Date();
                
                await push(ref(db, 'sales'), {
                    isSpecial: true,
                    date: saleDate.toISOString(),
                    source: sourceMap,
                    paymentMethod: paymentMap,
                    currency: currencyMap,
                    items: [{ name, price, quantity: qty, category: row["ໝວດໝູ່"] || "ທົ່ວໄປ", priceCurrency: currencyMap }],
                    subTotal: total, total, discount: 0, amountReceived: total, change: 0, status: 'COMPLETED',
                    exchangeRateUsed: exchangeRate
                });
                count++;
            }
        }
        Alert.alert("ສຳເລັດ", `ນຳເຂົ້າ ${count} ລາຍການ`);
    } catch (e: any) { Alert.alert("Error", e.message); } finally { setLoading(false); }
  };

  const handleSave = () => {
    if (!detail || !price || !qty) return Alert.alert("ແຈ້ງເຕືອນ", "ກະລຸນາປ້ອນຂໍ້ມູນໃຫ້ຄົບ");
    if (paymentMethod === 'CASH' && receivedVal < totalVal) return Alert.alert("ແຈ້ງເຕືອນ", "ເງິນທີ່ຮັບມາບໍ່ພຽງພໍ!");

    push(ref(db, 'sales'), {
      isSpecial: true, date: date.toISOString(), source: source === 'Shop' ? 'POS' : 'ONLINE',
      paymentMethod, currency,
      items: [{ name: detail, price: parseFloat(price), quantity: parseInt(qty), category, priceCurrency: currency }],
      subTotal: totalVal, total: totalVal, discount: 0,
      amountReceived: paymentMethod === 'CASH' ? receivedVal : totalVal,
      change: paymentMethod === 'CASH' ? changeVal : 0,
      status: 'COMPLETED',
      exchangeRateUsed: exchangeRate
    }).then(() => {
        Alert.alert("ສຳເລັດ", "ບັນທຶກແລ້ວ!");
        setDetail(''); setPrice(''); setQty('1'); setAmountReceived('');
    }).catch(err => Alert.alert("Error", err.message));
  };

  const onFormDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') setShowFormDatePicker(false);
    if (selectedDate) setDate(selectedDate);
  };

  const onCustomDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') setShowCustomDatePicker(false);
    if (selectedDate) {
        if (customDateMode === 'start') setCustomStartDate(selectedDate);
        else setCustomEndDate(selectedDate);
    }
  };

  const getActiveColor = (isActive: boolean, type: 'default' | 'alert') => {
      if (!isActive) return '#eee';
      if (type === 'alert') return ORANGE_THEME;
      return COLORS.primary;
  };

  return (
    <SafeAreaView style={styles.container}>
      {loading && <View style={styles.loadingOverlay}><ActivityIndicator size="large" color={COLORS.primary} /><Text style={{marginTop: 10, fontFamily: 'Lao-Bold'}}>ກຳລັງປະມວນຜົນ...</Text></View>}

      <View style={styles.header}>
        <Text style={styles.headerTitle}>ຂາຍພິເສດ (Manual Sale)</Text>
      </View>

      {/* 🟢 1. ໃຊ້ KeyboardAvoidingView ຫຸ້ມ ScrollView ຫຼັກ */}
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{ flex: 1 }}
      >
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {/* Form Section */}
            <View style={styles.formSection}>
                <View style={styles.row}>
                    <View style={{flex: 1}}>
                        <Text style={styles.label}>ວັນທີ *</Text>
                        <TouchableOpacity style={styles.inputBox} onPress={() => setShowFormDatePicker(true)}>
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
                                    <TouchableOpacity key={s} onPress={() => setSource(s as any)} style={[styles.chipSmall, { backgroundColor: isActive ? getActiveColor(true, isOnline ? 'alert' : 'default') : 'white', borderColor: isActive ? getActiveColor(true, isOnline ? 'alert' : 'default') : '#eee' }]}>
                                        <Text style={[styles.chipText, isActive && {color:'white'}]}>{s === 'Shop' ? 'ໜ້າຮ້ານ' : 'Online'}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>
                </View>

                <View style={styles.row}>
                    <View style={{flex: 1}}>
                        <Text style={styles.label}>ສະກຸນເງິນ *</Text>
                        <View style={styles.chipRow}>
                            <TouchableOpacity style={[styles.chipSmall, currency === 'LAK' && styles.activeChip]} onPress={() => setCurrency('LAK')}>
                                <Text style={[styles.chipText, currency === 'LAK' && {color:'white'}]}>₭ ກີບ</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.chipSmall, currency === 'THB' && {backgroundColor: ORANGE_THEME, borderColor: ORANGE_THEME}]} onPress={() => setCurrency('THB')}>
                                <Text style={[styles.chipText, currency === 'THB' && {color:'white'}]}>฿ ບາດ</Text>
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
                                    <TouchableOpacity key={m} onPress={() => setPaymentMethod(m as any)} style={[styles.chipSmall, { backgroundColor: isActive ? getActiveColor(true, isQR ? 'alert' : 'default') : 'white', borderColor: isActive ? getActiveColor(true, isQR ? 'alert' : 'default') : '#eee' }]}>
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
                        <Text style={styles.label}>ລາຄາ ({currency === 'THB' ? 'ບາດ' : 'ກີບ'}) *</Text>
                        <TextInput style={styles.inputBox} keyboardType="numeric" placeholder="0" value={price} onChangeText={setPrice} />
                    </View>
                    <View style={{flex: 1}}>
                        <Text style={styles.label}>ຈຳນວນ *</Text>
                        <TextInput style={styles.inputBox} keyboardType="numeric" placeholder="1" value={qty} onChangeText={setQty} />
                    </View>
                </View>

                <View style={styles.totalBox}>
                    <View>
                        <Text style={styles.totalLabel}>ລວມເງິນ:</Text>
                        {currency === 'THB' && (
                            <Text style={{fontSize: 12, color: '#666', fontFamily: 'Lao-Regular'}}>
                                (Rate: 1 = {formatNumber(exchangeRate)})
                            </Text>
                        )}
                    </View>
                    <Text style={styles.totalValue}>{formatNumber(totalVal)} {currency === 'THB' ? '฿' : '₭'}</Text>
                </View>

                {paymentMethod === 'CASH' && (
                    <View style={styles.cashSection}>
                        <Text style={styles.sectionHeader}>🧮 ຄິດໄລ່ເງິນສົດ</Text>
                        <View style={styles.row}>
                            <View style={{flex: 1, marginRight: 10}}>
                                <Text style={styles.label}>ຮັບເງິນມາ:</Text>
                                <TextInput style={[styles.inputBox, {borderColor: COLORS.primary, borderWidth: 2}]} keyboardType="numeric" placeholder="0" value={amountReceived} onChangeText={setAmountReceived} />
                            </View>
                            <View style={{flex: 1}}>
                                <Text style={styles.label}>ເງິນທອນ:</Text>
                                <View style={[styles.inputBox, {backgroundColor: '#f0f0f0', borderColor: '#eee'}]}>
                                    <Text style={{fontFamily: 'Lao-Bold', color: changeVal < 0 ? 'red' : COLORS.primary}}>{formatNumber(changeVal)}</Text>
                                </View>
                            </View>
                        </View>
                    </View>
                )}

                <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                    <Text style={styles.saveBtnText}>ບັນທຶກການຂາຍ</Text>
                </TouchableOpacity>
            </View>

            {/* History Section */}
            <View style={styles.historySection}>
                <View style={styles.historyHeaderRow}>
                    <Text style={styles.historyTitle}>ປະຫວັດລາຍຮັບ</Text>
                    <View style={styles.toolsRow}>
                        <TouchableOpacity style={styles.toolIconBtn} onPress={handleDownloadTemplate}><Ionicons name="copy-outline" size={18} color="#555" /></TouchableOpacity>
                        <TouchableOpacity style={styles.toolIconBtn} onPress={handleImport}><Ionicons name="cloud-upload-outline" size={18} color="#555" /></TouchableOpacity>
                        <TouchableOpacity style={[styles.toolIconBtn, {backgroundColor: COLORS.primary}]} onPress={handleExport}><Ionicons name="download-outline" size={18} color="white" /></TouchableOpacity>
                    </View>
                </View>

                {/* Filter Tabs */}
                <View style={styles.filterTabs}>
                    {['day', 'week', 'month', 'year', 'custom'].map((type) => (
                        <TouchableOpacity key={type} style={[styles.filterTab, filterType === type && styles.activeFilterTab]} onPress={() => setFilterType(type as FilterType)}>
                            <Text style={[styles.filterText, filterType === type && styles.activeFilterText]}>
                                {type === 'day' ? 'ມື້' : type === 'week' ? 'ອາທິດ' : type === 'month' ? 'ເດືອນ' : type === 'year' ? 'ປີ' : 'ກຳນົດເອງ'}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Date Navigation */}
                <View style={styles.navRow}>
                    {filterType !== 'custom' ? (
                        <>
                            <TouchableOpacity onPress={() => handleNavigateDate('prev')} style={styles.navBtn}><Ionicons name="chevron-back" size={24} color={COLORS.primary} /></TouchableOpacity>
                            <Text style={styles.dateLabel}>{getDateLabel()}</Text>
                            <TouchableOpacity onPress={() => handleNavigateDate('next')} style={styles.navBtn}><Ionicons name="chevron-forward" size={24} color={COLORS.primary} /></TouchableOpacity>
                        </>
                    ) : (
                        <View style={styles.customDateContainer}>
                            <TouchableOpacity style={styles.datePickBtn} onPress={() => { setCustomDateMode('start'); setShowCustomDatePicker(true); }}>
                                <Text style={styles.datePickText}>{formatDate(customStartDate)}</Text>
                            </TouchableOpacity>
                            <Text>-</Text>
                            <TouchableOpacity style={styles.datePickBtn} onPress={() => { setCustomDateMode('end'); setShowCustomDatePicker(true); }}>
                                <Text style={styles.datePickText}>{formatDate(customEndDate)}</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

                <FlatList 
                    data={filteredHistory}
                    keyExtractor={item => item.id}
                    scrollEnabled={false} 
                    ListEmptyComponent={<Text style={{textAlign:'center', margin: 20, color: '#999'}}>ບໍ່ມີຂໍ້ມູນ</Text>}
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
      </KeyboardAvoidingView>

      {/* Category Dropdown Modal */}
      <Modal visible={showCatDropdown} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setShowCatDropdown(false)}>
            <View style={styles.dropdownContent}>
                <Text style={styles.dropdownTitle}>ເລືອກໝວດໝູ່</Text>
                <FlatList 
                    data={categories} 
                    keyExtractor={i => i} 
                    renderItem={({item}) => (
                        <TouchableOpacity style={styles.dropdownItem} onPress={() => { setCategory(item); setShowCatDropdown(false); }}>
                            <Text style={{fontSize: 16}}>{item}</Text>
                            {category === item && <Ionicons name="checkmark" size={20} color={COLORS.primary} />}
                        </TouchableOpacity>
                    )} 
                />
                <TouchableOpacity 
                    style={styles.addCatBtn} 
                    onPress={() => { setShowCatDropdown(false); setShowAddCatModal(true); }}
                >
                    <Ionicons name="add-circle-outline" size={24} color={COLORS.primary} />
                    <Text style={styles.addCatText}>ເພີ່ມໝວດໝູ່ໃໝ່</Text>
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
      </Modal>

      {/* Add Category Modal */}
      <Modal visible={showAddCatModal} transparent animationType="slide">
          {/* 🟢 2. ໃຊ້ KeyboardAvoidingView ຫຸ້ມ Modal ເພີ່ມໝວດໝູ່ */}
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
              <View style={[styles.dropdownContent, {width: '85%'}]}>
                  <Text style={styles.dropdownTitle}>ເພີ່ມໝວດໝູ່ໃໝ່</Text>
                  <TextInput 
                      style={[styles.inputBox, {marginBottom: 20}]} 
                      placeholder="ຊື່ໝວດໝູ່..." 
                      value={newCatName} 
                      onChangeText={setNewCatName}
                      autoFocus
                  />
                  <View style={{flexDirection: 'row', gap: 10}}>
                      <TouchableOpacity style={[styles.saveBtn, {flex: 1, backgroundColor: '#ccc'}]} onPress={() => setShowAddCatModal(false)}>
                          <Text style={styles.saveBtnText}>ຍົກເລີກ</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.saveBtn, {flex: 1}]} onPress={handleAddNewCategory}>
                          <Text style={styles.saveBtnText}>ບັນທຶກ</Text>
                      </TouchableOpacity>
                  </View>
              </View>
          </KeyboardAvoidingView>
      </Modal>

      {/* Date Pickers */}
      {showFormDatePicker && (
        <View style={styles.datePickerOverlay}>
            <View style={styles.datePickerContainer}>
                <DateTimePicker value={date} mode="date" display="inline" onChange={onFormDateChange} textColor="black" themeVariant="light" style={{backgroundColor:'white'}} />
                <TouchableOpacity style={styles.closeDateBtn} onPress={() => setShowFormDatePicker(false)}><Text style={styles.closeDateText}>ຕົກລົງ</Text></TouchableOpacity>
            </View>
        </View>
      )}

      {showCustomDatePicker && (
        <View style={styles.datePickerOverlay}>
            <View style={styles.datePickerContainer}>
                <Text style={{fontFamily:'Lao-Bold', marginBottom:10}}>ເລືອກວັນທີ {customDateMode==='start'?'ເລີ່ມຕົ້ນ':'ສິ້ນສຸດ'}</Text>
                <DateTimePicker 
                    value={customDateMode==='start' ? customStartDate : customEndDate} 
                    mode="date" display="inline" onChange={onCustomDateChange} textColor="black" themeVariant="light" style={{backgroundColor:'white'}} 
                />
                <TouchableOpacity style={styles.closeDateBtn} onPress={() => setShowCustomDatePicker(false)}><Text style={styles.closeDateText}>ຕົກລົງ</Text></TouchableOpacity>
            </View>
        </View>
      )}

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F9FA' },
  loadingOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(255,255,255,0.8)', zIndex: 9999, justifyContent: 'center', alignItems: 'center' },
  header: { padding: 15, backgroundColor: 'white', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', elevation: 2 },
  headerTitle: { fontSize: 20, fontFamily: 'Lao-Bold', color: '#333' },
  content: { flex: 1, padding: 10 },
  formSection: { backgroundColor: 'white', borderRadius: 10, padding: 15, elevation: 2, marginBottom: 15 },
  historySection: { backgroundColor: 'white', borderRadius: 10, padding: 15, elevation: 2, marginBottom: 20 },
  historyHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  historyTitle: { fontFamily: 'Lao-Bold', fontSize: 16 },
  toolsRow: { flexDirection: 'row', gap: 8 },
  toolIconBtn: { width: 35, height: 35, borderRadius: 17.5, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' },
  filterTabs: { flexDirection: 'row', justifyContent: 'center', gap: 5, marginBottom: 10, flexWrap: 'wrap' },
  filterTab: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 15, backgroundColor: '#f0f0f0' },
  activeFilterTab: { backgroundColor: COLORS.primary },
  filterText: { fontSize: 12, fontFamily: 'Lao-Regular', color: '#666' },
  activeFilterText: { color: 'white', fontFamily: 'Lao-Bold' },
  navRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, paddingHorizontal: 10 },
  navBtn: { padding: 5 },
  dateLabel: { fontFamily: 'Lao-Bold', fontSize: 14, color: COLORS.text },
  customDateContainer: { flexDirection: 'row', alignItems: 'center', gap: 5, flex: 1, justifyContent: 'center' },
  datePickBtn: { padding: 8, backgroundColor: '#f5f5f5', borderRadius: 8 },
  datePickText: { fontFamily: 'Lao-Bold', color: COLORS.primary, fontSize: 12 },
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
  addCatBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 15, borderTopWidth: 1, borderTopColor: '#eee', marginTop: 5 },
  addCatText: { fontFamily: 'Lao-Bold', color: COLORS.primary, marginLeft: 10, fontSize: 16 }
});