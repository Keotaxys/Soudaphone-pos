import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as DocumentPicker from 'expo-document-picker';

// 🟢 1. Import ແບບ Legacy ອັນດຽວຈົບ (ເພື່ອແກ້ Warning Deprecated)
import * as FileSystem from 'expo-file-system/legacy'; 

import * as Print from 'expo-print';
import { shareAsync } from 'expo-sharing';
import { onValue, push, ref, remove, update } from 'firebase/database';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Keyboard,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { db } from '../../firebase';
import { useAuth } from '../../hooks/useAuth';
import { COLORS, ExpenseRecord, formatDate, formatNumber } from '../../types';
import CurrencyInput from '../ui/CurrencyInput';

const ORANGE_COLOR = '#F57C00';
const ORANGE_BG = '#FFF3E0';

const EXPENSE_CATEGORIES = [
  'ຄ່າເຊົ່າ', 'ປັບປຸງສະຖານທີ່', 'ໄຟຟ້າ', 'ນ້ຳປະປາ', 'ອິນເຕີເນັດ',
  'ພະນັກງານ', 'ດອກເບ້ຍເງິນກູ້', 'ດອກເບ້ຍບັດເຄຣດິດ', 'ຂົນສົ່ງ',
  'ພາຫະນະຮັບໃຊ້', 'ຖົງ ແລະ ເຄື່ອງແພັກ', 'ໂຄສະນາ ແລະ ການຕະຫຼາດ',
  'ບໍລິການອອນລາຍ', 'ສັ່ງສິນຄ້າ'
];

type FilterType = 'day' | 'week' | 'month' | 'custom';

export default function ExpenseScreen() {
  const { hasPermission } = useAuth();
  
  const [allExpenses, setAllExpenses] = useState<ExpenseRecord[]>([]);
  const [filteredExpenses, setFilteredExpenses] = useState<ExpenseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);

  const [filterType, setFilterType] = useState<FilterType>('day');
  const [filterDate, setFilterDate] = useState(new Date());
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());

  const [id, setId] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('ສັ່ງສິນຄ້າ'); 
  const [formDate, setFormDate] = useState(new Date());
  
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerTarget, setDatePickerTarget] = useState<'form' | 'filter' | 'start' | 'end'>('form');
  const [showExportOptions, setShowExportOptions] = useState(false);

  // 1. Fetch Data
  useEffect(() => {
    if (!hasPermission('accessFinancial')) {
        setLoading(false);
        return;
    }

    const expenseRef = ref(db, 'expenses');
    const unsubscribe = onValue(expenseRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const list = Object.keys(data).map(key => ({
            id: key,
            ...data[key]
        }));
        list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setAllExpenses(list as ExpenseRecord[]);
      } else {
        setAllExpenses([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [hasPermission]);

  // 2. Logic ກັ່ນຕອງຂໍ້ມູນ
  useEffect(() => {
    let start = new Date(filterDate);
    let end = new Date(filterDate);

    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    if (filterType === 'day') {
    } else if (filterType === 'week') {
        const day = start.getDay();
        const diff = start.getDate() - day + (day === 0 ? -6 : 1);
        start.setDate(diff);
        end = new Date(start);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);
    } else if (filterType === 'month') {
        start.setDate(1);
        end = new Date(start);
        end.setMonth(start.getMonth() + 1);
        end.setDate(0);
        end.setHours(23, 59, 59, 999);
    } else if (filterType === 'custom') {
        start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
    }

    const filtered = allExpenses.filter(item => {
      const itemDate = new Date(item.date);
      return itemDate >= start && itemDate <= end;
    });

    setFilteredExpenses(filtered);
  }, [allExpenses, filterType, filterDate, startDate, endDate]);

  const handleDateNavigate = (direction: number) => {
    if (filterType === 'custom') return;

    const newDate = new Date(filterDate);
    if (filterType === 'day') {
        newDate.setDate(newDate.getDate() + direction);
    } else if (filterType === 'week') {
        newDate.setDate(newDate.getDate() + (direction * 7));
    } else if (filterType === 'month') {
        newDate.setMonth(newDate.getMonth() + direction);
    }
    setFilterDate(newDate);
  };

  // 🟢 4. Download Template (ແກ້ໄຂ Error ໂດຍໃຊ້ as any)
  const handleDownloadTemplate = async () => {
    try {
      const csvContent = 
        "Date(YYYY-MM-DD),Category,Description,Amount\n" +
        "2026-01-20,ສັ່ງສິນຄ້າ,ຊື້ເຄື່ອງເຂົ້າຮ້ານ,500000\n" +
        "2026-01-21,ຄ່າເຊົ່າ,ຈ່າຍຄ່າເຊົ່າເດືອນ 1,2000000";

      // 🟢 ໃຊ້ (FileSystem as any) ເພື່ອ Bypass TypeScript Error
      // ແຕ່ຍັງໃຊ້ 'expo-file-system/legacy' ເພື່ອບໍ່ໃຫ້ເກີດ Warning
      const docDir = (FileSystem as any).documentDirectory;
      
      if (!docDir) {
          throw new Error("Device storage is not available");
      }

      const fileName = `${docDir}expense_template.csv`;

      await FileSystem.writeAsStringAsync(fileName, csvContent, { encoding: 'utf8' });
      await shareAsync(fileName, { mimeType: 'text/csv', UTI: 'public.comma-separated-values-text' });
      setShowExportOptions(false);
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "ບໍ່ສາມາດດາວໂຫຼດ Template ໄດ້: " + (error as Error).message);
    }
  };

  // 5. Import CSV
  const handleImportCSV = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'application/vnd.ms-excel', 'text/comma-separated-values'],
        copyToCacheDirectory: true
      });

      if (result.canceled) return;

      setImporting(true);
      const fileUri = result.assets[0].uri;
      
      // 🟢 ໃຊ້ FileSystem ຈາກ legacy
      const fileContent = await FileSystem.readAsStringAsync(fileUri);
      
      const rows = fileContent.split('\n');
      let successCount = 0;
      
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i].trim();
        if (!row) continue;

        const columns = row.split(',');
        if (columns.length < 4) continue;

        const [dateStr, catStr, descStr, amountStr] = columns;

        const parsedAmount = parseFloat(amountStr);
        if (isNaN(parsedAmount)) continue;

        const parsedDate = new Date(dateStr);
        if (isNaN(parsedDate.getTime())) continue;

        await push(ref(db, 'expenses'), {
          date: parsedDate.toISOString(),
          category: catStr?.trim() || 'ອື່ນໆ',
          description: descStr?.trim() || 'Imported via CSV',
          amount: parsedAmount,
          createdAt: new Date().toISOString()
        });
        
        successCount++;
      }

      Alert.alert("ສຳເລັດ", `ນຳເຂົ້າຂໍ້ມູນສຳເລັດ ${successCount} ລາຍການ`);
      setShowExportOptions(false);

    } catch (error) {
      console.error(error);
      Alert.alert("Error", "ເກີດຂໍ້ຜິດພາດໃນການອ່ານຟາຍ CSV");
    } finally {
      setImporting(false);
    }
  };

  // 6. Export CSV
  const exportToCSV = async () => {
    try {
        let csvContent = "Date,Category,Description,Amount\n";
        filteredExpenses.forEach(item => {
            const dateStr = new Date(item.date).toLocaleDateString('en-GB');
            const cleanDesc = item.description ? item.description.replace(/,/g, ' ') : '';
            csvContent += `${dateStr},${item.category},${cleanDesc},${item.amount}\n`;
        });

        const total = filteredExpenses.reduce((sum, item) => sum + item.amount, 0);
        csvContent += `\n,,Total,${total}`;

        // 🟢 ໃຊ້ (as any) ເຊັ່ນກັນ
        const docDir = (FileSystem as any).documentDirectory;
        if (!docDir) throw new Error("Storage Unavailable");

        const fileName = `${docDir}expenses_report.csv`;

        await FileSystem.writeAsStringAsync(fileName, csvContent, { encoding: 'utf8' });
        await shareAsync(fileName, { mimeType: 'text/csv', UTI: 'public.comma-separated-values-text' });
        setShowExportOptions(false);
    } catch (error) {
        Alert.alert("Error", "Export CSV ບໍ່ສຳເລັດ");
    }
  };

  // 7. Export PDF
  const exportToPDF = async () => {
    try {
        const total = filteredExpenses.reduce((sum, item) => sum + item.amount, 0);
        const rows = filteredExpenses.map(item => `
            <tr>
                <td>${formatDate(new Date(item.date))}</td>
                <td>${item.category}</td>
                <td>${item.description || '-'}</td>
                <td style="text-align: right;">${formatNumber(item.amount)}</td>
            </tr>
        `).join('');

        const html = `
            <html>
                <head>
                    <style>
                        body { font-family: 'Helvetica'; padding: 20px; }
                        h1 { text-align: center; color: #333; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                        th { background-color: ${COLORS.primary}; color: white; }
                        .total { margin-top: 20px; text-align: right; font-size: 18px; font-weight: bold; }
                    </style>
                </head>
                <body>
                    <h1>ລາຍງານລາຍຈ່າຍ</h1>
                    <p>ວັນທີພິມ: ${formatDate(new Date())}</p>
                    <table>
                        <tr>
                            <th>ວັນທີ</th>
                            <th>ໝວດໝູ່</th>
                            <th>ລາຍລະອຽດ</th>
                            <th>ຈຳນວນເງິນ</th>
                        </tr>
                        ${rows}
                    </table>
                    <div class="total">ລວມທັງໝົດ: ${formatNumber(total)} ກີບ</div>
                </body>
            </html>
        `;

        const { uri } = await Print.printToFileAsync({ html });
        await shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
        setShowExportOptions(false);
    } catch (error) {
        Alert.alert("Error", "Export PDF ບໍ່ສຳເລັດ");
    }
  };

  const handleSave = async () => {
    if (!amount || !description) {
      Alert.alert('ຂໍ້ມູນບໍ່ຄົບ', 'ກະລຸນາໃສ່ຈຳນວນເງິນ ແລະ ລາຍລະອຽດ');
      return;
    }
    const expenseData = {
      date: formDate.toISOString(),
      category,
      description,
      amount: parseFloat(amount),
      createdAt: new Date().toISOString()
    };
    try {
      if (id) {
          await update(ref(db, `expenses/${id}`), expenseData);
          Alert.alert('ສຳເລັດ', 'ແກ້ໄຂລາຍຈ່າຍແລ້ວ');
      } else {
          await push(ref(db, 'expenses'), expenseData);
          Alert.alert('ສຳເລັດ', 'ບັນທຶກລາຍຈ່າຍແລ້ວ');
      }
      resetForm();
      Keyboard.dismiss();
    } catch (error) { Alert.alert('Error', 'ເກີດຂໍ້ຜິດພາດໃນການບັນທຶກ'); }
  };

  const handleDelete = (deleteId: string) => {
    Alert.alert('ຢືນຢັນການລຶບ', 'ທ່ານຕ້ອງການລຶບລາຍການນີ້ແທ້ບໍ່?', [
        { text: 'ຍົກເລີກ', style: 'cancel' },
        { text: 'ລຶບ', style: 'destructive', onPress: async () => { try { await remove(ref(db, `expenses/${deleteId}`)); if (id === deleteId) resetForm(); } catch (error) { Alert.alert('Error', 'ລຶບບໍ່ໄດ້'); } } }
    ]);
  };

  const handleEdit = (item: ExpenseRecord) => {
    setId(item.id!);
    setAmount(item.amount.toString());
    setDescription(item.description || ''); 
    setCategory(item.category);
    setFormDate(new Date(item.date));
  };

  const resetForm = () => {
    setId(null);
    setAmount('');
    setDescription('');
    setCategory('ສັ່ງສິນຄ້າ');
    setFormDate(new Date());
  };

  const openDatePicker = (target: 'form' | 'filter' | 'start' | 'end') => {
    setDatePickerTarget(target);
    setShowDatePicker(true);
  };

  const onDateChange = (event: any, date?: Date) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (date) {
        if (datePickerTarget === 'form') setFormDate(date);
        else if (datePickerTarget === 'filter') setFilterDate(date);
        else if (datePickerTarget === 'start') setStartDate(date);
        else if (datePickerTarget === 'end') setEndDate(date);
    }
  };

  if (!hasPermission('accessFinancial')) {
      return (
          <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F9FA'}}>
              <Ionicons name="lock-closed-outline" size={50} color="#ccc" />
              <Text style={{fontFamily: 'Lao-Bold', fontSize: 18, color: '#666', marginTop: 10}}>
                  ທ່ານບໍ່ມີສິດເຂົ້າເຖິງຂໍ້ມູນການເງິນ
              </Text>
          </View>
      );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} keyboardShouldPersistTaps="handled">
        
        {/* Header with Export */}
        <View style={styles.headerRow}>
            <Text style={styles.screenTitle}>ລາຍຈ່າຍ (Expenses)</Text>
            {/* ປຸ່ມເມນູ Export/Import */}
            <TouchableOpacity style={styles.exportIconBtn} onPress={() => setShowExportOptions(true)}>
                <Ionicons name="ellipsis-vertical" size={22} color={COLORS.primary} />
            </TouchableOpacity>
        </View>

        {/* Filter Bar */}
        <View style={styles.filterContainer}>
            <View style={styles.filterRow}>
                {['day', 'week', 'month', 'custom'].map((type) => (
                    <TouchableOpacity 
                        key={type} 
                        style={[styles.filterChip, filterType === type && styles.activeFilterChip]} 
                        onPress={() => setFilterType(type as FilterType)}
                    >
                        <Text style={[styles.filterText, filterType === type && {color: 'white'}]}>
                            {type === 'day' ? 'ມື້' : type === 'week' ? 'ອາທິດ' : type === 'month' ? 'ເດືອນ' : 'ກຳນົດເອງ'}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Date Selector */}
            <View style={styles.dateSelectorRow}>
                {filterType === 'custom' ? (
                    <View style={{flexDirection: 'row', alignItems: 'center', gap: 10}}>
                        <TouchableOpacity onPress={() => openDatePicker('start')} style={styles.dateDisplayBtn}>
                            <Text style={styles.dateDisplayText}>{formatDate(startDate)}</Text>
                        </TouchableOpacity>
                        <Ionicons name="arrow-forward" size={16} color="#666" />
                        <TouchableOpacity onPress={() => openDatePicker('end')} style={styles.dateDisplayBtn}>
                            <Text style={styles.dateDisplayText}>{formatDate(endDate)}</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={styles.navRow}>
                        <TouchableOpacity onPress={() => handleDateNavigate(-1)} style={styles.navBtn}>
                            <Ionicons name="chevron-back" size={20} color="#666" />
                        </TouchableOpacity>
                        
                        <TouchableOpacity onPress={() => openDatePicker('filter')} style={styles.dateDisplayBtn}>
                            <Ionicons name="calendar" size={16} color={COLORS.primary} />
                            <Text style={styles.dateDisplayText}>
                                {filterType === 'day' ? formatDate(filterDate) : 
                                 filterType === 'month' ? `${filterDate.getMonth() + 1}/${filterDate.getFullYear()}` : 
                                 formatDate(filterDate)}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => handleDateNavigate(1)} style={styles.navBtn}>
                            <Ionicons name="chevron-forward" size={20} color="#666" />
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </View>

        {/* Form Input */}
        <View style={styles.formCard}>
            <View style={styles.actionRowTop}>
                <Text style={styles.headerTitle}>{id ? '✏️ ແກ້ໄຂ' : '➕ ເພີ່ມລາຍຈ່າຍ'}</Text>
            </View>
            
            <View style={styles.row}>
                <TouchableOpacity style={styles.dateBtn} onPress={() => openDatePicker('form')}>
                    <Ionicons name="calendar-outline" size={20} color={COLORS.primary} />
                    <Text style={styles.dateText}>{formatDate(formDate)}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.categoryBtn} onPress={() => setShowCategoryPicker(true)}>
                    <Text style={styles.categoryText} numberOfLines={1}>{category}</Text>
                    <Ionicons name="chevron-down" size={16} color="#666" />
                </TouchableOpacity>
            </View>

            <TextInput style={styles.input} placeholder="ລາຍລະອຽດ..." value={description} onChangeText={setDescription} />

            <View style={styles.amountContainer}>
                <Text style={[styles.currencyLabel, {color: ORANGE_COLOR}]}>₭</Text>
                <CurrencyInput 
                    style={[styles.amountInput, {color: ORANGE_COLOR}]} 
                    placeholder="0" 
                    value={amount} 
                    onChangeValue={setAmount} 
                />
            </View>

            <View style={styles.actionRow}>
                {id && (
                    <TouchableOpacity style={styles.cancelBtn} onPress={resetForm}>
                        <Ionicons name="close" size={24} color="white" />
                    </TouchableOpacity>
                )}
                <TouchableOpacity 
                    style={[styles.saveBtn, { backgroundColor: id ? COLORS.secondary : COLORS.primary }]} 
                    onPress={handleSave}
                >
                    <Text style={styles.saveBtnText}>{id ? 'ອັບເດດລາຍຈ່າຍ' : 'ບັນທຶກລາຍຈ່າຍ'}</Text>
                </TouchableOpacity>
            </View>
        </View>

        <Text style={styles.listHeader}>
            📜 ປະຫວັດລາຍຈ່າຍ ({filteredExpenses.length} ລາຍການ)
        </Text>

        {filteredExpenses.map((item) => (
            <View key={item.id} style={styles.expenseItem}>
                <View style={styles.dateBox}>
                    <Text style={styles.dayText}>{new Date(item.date).getDate()}</Text>
                    <Text style={styles.monthText}>{new Date(item.date).getMonth() + 1}/{new Date(item.date).getFullYear().toString().substr(2)}</Text>
                </View>
                <View style={{ flex: 1, paddingHorizontal: 10 }}>
                    <Text style={styles.itemCategory}>{item.category}</Text>
                    <Text style={styles.itemDesc} numberOfLines={1}>{item.description}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[styles.itemAmount, {color: ORANGE_COLOR}]}>- {formatNumber(item.amount)}</Text>
                    <View style={{ flexDirection: 'row', gap: 10, marginTop: 5 }}>
                        <TouchableOpacity onPress={() => handleEdit(item)}>
                            <Ionicons name="pencil" size={18} color={COLORS.primary} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleDelete(item.id!)}>
                            <Ionicons name="trash-outline" size={18} color={ORANGE_COLOR} />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        ))}
      </ScrollView>

      {/* Export/Import Options Modal */}
      <Modal visible={showExportOptions} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowExportOptions(false)}>
            <View style={styles.exportModalContent}>
                <Text style={styles.exportTitle}>ຈັດການຂໍ້ມູນ (Data Management)</Text>
                
                {importing ? (
                    <View style={{padding: 20, alignItems: 'center'}}>
                        <ActivityIndicator size="large" color={COLORS.primary} />
                        <Text style={{marginTop: 10, fontFamily: 'Lao-Regular'}}>ກຳລັງນຳເຂົ້າຂໍ້ມູນ...</Text>
                    </View>
                ) : (
                    <>
                        <Text style={styles.sectionHeader}>📤 ສົ່ງອອກ (Export)</Text>
                        <TouchableOpacity style={styles.exportOption} onPress={exportToCSV}>
                            <Ionicons name="document-text" size={24} color="#2ecc71" />
                            <Text style={styles.exportText}>Export as CSV (Excel)</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.exportOption} onPress={exportToPDF}>
                            <Ionicons name="print" size={24} color="#e74c3c" />
                            <Text style={styles.exportText}>Export as PDF</Text>
                        </TouchableOpacity>

                        <Text style={styles.sectionHeader}>📥 ນຳເຂົ້າ (Import)</Text>
                        <TouchableOpacity style={styles.exportOption} onPress={handleDownloadTemplate}>
                            <Ionicons name="download-outline" size={24} color={COLORS.primary} />
                            <Text style={styles.exportText}>ດາວໂຫຼດແບບຟອມ (Template)</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.exportOption} onPress={handleImportCSV}>
                            <Ionicons name="cloud-upload-outline" size={24} color={ORANGE_COLOR} />
                            <Text style={styles.exportText}>Import ຈາກ Excel (CSV)</Text>
                        </TouchableOpacity>
                    </>
                )}

                <TouchableOpacity style={styles.cancelExportBtn} onPress={() => setShowExportOptions(false)}>
                    <Text style={{color: '#666', fontFamily: 'Lao-Bold'}}>ປິດ</Text>
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
      </Modal>

      {/* Date Picker */}
      {showDatePicker && (
        Platform.OS === 'ios' ? (
            <Modal visible={true} transparent={true} animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.iosDatePickerContainer}>
                        <DateTimePicker 
                            value={
                                datePickerTarget === 'form' ? formDate :
                                datePickerTarget === 'start' ? startDate :
                                datePickerTarget === 'end' ? endDate :
                                filterDate
                            } 
                            mode="date" 
                            display="inline" 
                            onChange={onDateChange} 
                            style={{ height: 320, width: '100%', backgroundColor: 'white' }} 
                            textColor="black" 
                            themeVariant="light"
                        />
                        <TouchableOpacity style={styles.iosDateDoneBtn} onPress={() => setShowDatePicker(false)}>
                            <Text style={styles.iosDateDoneText}>ຕົກລົງ</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        ) : (
            <DateTimePicker 
                value={
                    datePickerTarget === 'form' ? formDate :
                    datePickerTarget === 'start' ? startDate :
                    datePickerTarget === 'end' ? endDate :
                    filterDate
                } 
                mode="date" 
                display="default" 
                onChange={onDateChange} 
            />
        )
      )}

      <Modal visible={showCategoryPicker} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>ເລືອກໝວດໝູ່</Text>
                <ScrollView showsVerticalScrollIndicator={false}>
                    {EXPENSE_CATEGORIES.map((item) => (
                        <TouchableOpacity key={item} style={styles.categoryItem} onPress={() => { setCategory(item); setShowCategoryPicker(false); }}>
                            <Text style={[styles.categoryItemText, category === item && {color: COLORS.primary, fontFamily: 'Lao-Bold'}]}>{item}</Text>
                            {category === item && <Ionicons name="checkmark" size={20} color={COLORS.primary} />}
                        </TouchableOpacity>
                    ))}
                </ScrollView>
                <TouchableOpacity style={styles.closeModalBtn} onPress={() => setShowCategoryPicker(false)}>
                    <Text style={{color: '#666', fontFamily: 'Lao-Bold'}}>ປິດ</Text>
                </TouchableOpacity>
            </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20 },
  screenTitle: { fontSize: 22, fontFamily: 'Lao-Bold', color: COLORS.text },
  exportIconBtn: { padding: 8, backgroundColor: '#fff', borderRadius: 8, elevation: 2 },

  filterContainer: { backgroundColor: 'white', padding: 10, marginHorizontal: 15, marginTop: 15, borderRadius: 12, elevation: 2 },
  filterRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  filterChip: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20, backgroundColor: '#f0f0f0' },
  activeFilterChip: { backgroundColor: COLORS.primary },
  filterText: { fontSize: 12, fontFamily: 'Lao-Regular', color: '#666' },
  
  dateSelectorRow: { alignItems: 'center', marginTop: 5 },
  navRow: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  navBtn: { padding: 5 },
  dateDisplayBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#f9f9f9', padding: 8, borderRadius: 8, borderWidth: 1, borderColor: '#eee', minWidth: 120, justifyContent: 'center' },
  dateDisplayText: { fontFamily: 'Lao-Bold', color: '#333' },

  formCard: { backgroundColor: 'white', margin: 15, marginBottom: 5, padding: 15, borderRadius: 15, elevation: 3, shadowColor: COLORS.primary, shadowOpacity: 0.1 },
  actionRowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  headerTitle: { fontFamily: 'Lao-Bold', fontSize: 18, color: COLORS.primaryDark },
  row: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  dateBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0f0f0', padding: 10, borderRadius: 8, gap: 5 },
  dateText: { fontFamily: 'Lao-Bold', color: '#555' },
  categoryBtn: { flex: 1.5, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#f0f0f0', padding: 10, borderRadius: 8 },
  categoryText: { fontFamily: 'Lao-Regular', color: '#333' },
  input: { backgroundColor: '#f9f9f9', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#eee', fontFamily: 'Lao-Regular', marginBottom: 10 },
  amountContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: ORANGE_BG, borderRadius: 8, paddingHorizontal: 15, borderWidth: 1, borderColor: '#FFE0B2' },
  currencyLabel: { fontSize: 18, fontFamily: 'Lao-Bold', marginRight: 10 },
  amountInput: { flex: 1, fontSize: 20, fontFamily: 'Lao-Bold', paddingVertical: 10 },
  actionRow: { flexDirection: 'row', marginTop: 15, gap: 10 },
  saveBtn: { flex: 1, padding: 12, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  saveBtnText: { color: 'white', fontFamily: 'Lao-Bold', fontSize: 16 },
  cancelBtn: { width: 50, backgroundColor: '#eee', borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  listHeader: { fontFamily: 'Lao-Bold', fontSize: 16, color: '#666', marginTop: 15, marginBottom: 10, marginHorizontal: 15 },
  expenseItem: { flexDirection: 'row', backgroundColor: 'white', padding: 12, borderRadius: 12, marginBottom: 10, marginHorizontal: 15, alignItems: 'center', elevation: 1 },
  dateBox: { backgroundColor: '#f0f0f0', padding: 8, borderRadius: 8, alignItems: 'center', minWidth: 50 },
  dayText: { fontFamily: 'Lao-Bold', fontSize: 18, color: COLORS.primary },
  monthText: { fontSize: 10, color: '#888' },
  itemCategory: { fontSize: 12, color: COLORS.primary, fontFamily: 'Lao-Bold', marginBottom: 2 },
  itemDesc: { fontSize: 14, color: '#333', fontFamily: 'Lao-Regular' },
  itemAmount: { fontSize: 16, fontFamily: 'Lao-Bold' },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '80%', maxHeight: '60%', backgroundColor: 'white', borderRadius: 20, padding: 20 },
  modalTitle: { fontFamily: 'Lao-Bold', fontSize: 18, textAlign: 'center', marginBottom: 15 },
  categoryItem: { paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#f5f5f5', flexDirection: 'row', justifyContent: 'space-between' },
  categoryItemText: { fontFamily: 'Lao-Regular', fontSize: 16, color: '#333' },
  closeModalBtn: { marginTop: 15, padding: 10, alignItems: 'center', backgroundColor: '#f5f5f5', borderRadius: 10 },
  
  // Export Modal Styles
  exportModalContent: { width: '85%', backgroundColor: 'white', borderRadius: 15, padding: 20 },
  exportTitle: { fontFamily: 'Lao-Bold', fontSize: 18, marginBottom: 10, textAlign: 'center', color: '#333' },
  sectionHeader: { fontFamily: 'Lao-Bold', fontSize: 14, color: '#999', marginTop: 15, marginBottom: 5, borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 5 },
  exportOption: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f5f5f5', gap: 15 },
  exportText: { fontFamily: 'Lao-Regular', fontSize: 16, color: '#333' },
  cancelExportBtn: { marginTop: 15, alignItems: 'center', padding: 10 },

  iosDatePickerContainer: { backgroundColor: 'white', borderRadius: 20, width: '85%', padding: 20, alignItems: 'center' },
  iosDateDoneBtn: { marginTop: 10, padding: 10, width: '100%', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#eee' },
  iosDateDoneText: { fontFamily: 'Lao-Bold', color: COLORS.primary, fontSize: 16 }
});