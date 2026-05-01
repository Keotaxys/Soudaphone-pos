import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { onValue, push, ref, remove, update } from 'firebase/database';
import React, { useEffect, useState } from 'react';
import {
  Alert, FlatList, Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View
} from 'react-native';
import { db } from '../../firebase';
import { COLORS, CustomerOrder, OrderItem, formatDate, formatNumber } from '../../types';
import CurrencyInput from '../ui/CurrencyInput';

const SOURCES = ['ຈີນ', 'ຫວຽດ', 'ໄທ', 'ອື່ນໆ'];
const STATUSES = ['ຮັບອໍເດີ້', 'ສັ່ງເຄື່ອງແລ້ວ', 'ເຄື່ອງຮອດແລ້ວ', 'ຈັດສົ່ງສຳເລັດ'];
const FILTER_STATUSES = ['ທັງໝົດ', ...STATUSES];
const ORANGE_COLOR = '#FF8F00'; 

export default function OrderTrackingScreen() {
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [customers, setCustomers] = useState<{id: string, name: string}[]>([]);
  const [showForm, setShowForm] = useState(false);
  
  // --- Filter & Search States ---
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('ທັງໝົດ');

  // --- Form States ---
  const [id, setId] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [showCustomerList, setShowCustomerList] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [items, setItems] = useState<OrderItem[]>([]);
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    const orderRef = ref(db, 'customer_orders');
    const unsubscribeOrder = onValue(orderRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const list = Object.keys(data).map(key => ({ id: key, ...data[key] }));
        setOrders(list.reverse() as CustomerOrder[]);
      } else { setOrders([]); }
    });

    const custRef = ref(db, 'customers');
    const unsubscribeCust = onValue(custRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setCustomers(Object.keys(data).map(key => ({ id: key, name: data[key].name })));
      } else { setCustomers([]); }
    });

    return () => {
        unsubscribeOrder();
        unsubscribeCust();
    };
  }, []);

  const filteredOrders = orders.filter(order => {
    const matchSearch = order.customerName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = filterStatus === 'ທັງໝົດ' || order.items.some(i => i.status === filterStatus);
    return matchSearch && matchStatus;
  });

  const addNewItem = () => {
    const newItem: OrderItem = {
      id: Math.random().toString(36).substr(2, 9),
      productName: '',
      source: 'ຈີນ',
      quantity: 1,
      costPrice: 0,
      salePrice: 0,
      status: 'ຮັບອໍເດີ້',
      link: '',
      imageUrl: ''
    };
    setItems([...items, newItem]);
  };

  const pickItemImage = async (itemId: string) => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect: [1, 1], quality: 0.5, base64: true
    });
    if (!result.canceled) {
      updateItemValue(itemId, 'imageUrl', `data:image/jpeg;base64,${result.assets[0].base64}`);
    }
  };

  const updateItemValue = (itemId: string, field: keyof OrderItem, value: any) => {
    setItems(items.map(item => item.id === itemId ? { ...item, [field]: value } : item));
  };

  const handleSave = async () => {
    if (!customerName || items.length === 0) {
      Alert.alert('ຂໍ້ມູນບໍ່ຄົບ', 'ກະລຸນາໃສ່ຊື່ລູກຄ້າ ແລະ ເພີ່ມສິນຄ້າຢ່າງໜ້ອຍ 1 ລາຍການ');
      return;
    }

    try {
      // ບັນທຶກລູກຄ້າໃໝ່ອັດຕະໂນມັດ ຖ້າບໍ່ມີໃນລະບົບ
      const existingCust = customers.find(c => c.name.toLowerCase() === customerName.trim().toLowerCase());
      if (!existingCust) {
        await push(ref(db, 'customers'), {
          name: customerName.trim(),
          createdAt: new Date().toISOString()
        });
      }

      const totalAmount = items.reduce((sum, item) => sum + (Number(item.salePrice) * Number(item.quantity)), 0);
      const orderData = {
        customerName: customerName.trim(),
        date: selectedDate.toISOString(),
        items,
        totalAmount,
        createdAt: id ? orders.find(o => o.id === id)?.createdAt || new Date().toISOString() : new Date().toISOString()
      };

      if (id) { await update(ref(db, `customer_orders/${id}`), orderData); }
      else { await push(ref(db, 'customer_orders'), orderData); }
      setShowForm(false);
      resetForm();
    } catch (error) { Alert.alert('Error', 'ບັນທຶກບໍ່ສຳເລັດ'); }
  };

  const handleDeleteOrder = (orderId: string) => {
    Alert.alert('ຢືນຢັນ', 'ທ່ານຕ້ອງການລຶບອໍເດີ້ນີ້ແທ້ບໍ່?', [
      { text: 'ຍົກເລີກ', style: 'cancel' },
      { text: 'ລຶບ', style: 'destructive', onPress: async () => {
          try {
            await remove(ref(db, `customer_orders/${orderId}`));
          } catch (e) { Alert.alert('Error', 'ລຶບບໍ່ສຳເລັດ'); }
        }
      }
    ]);
  };

  const resetForm = () => {
    setId(null); setCustomerName(''); setSelectedDate(new Date()); setItems([]); setShowCustomerList(false);
  };

  const getStatusColor = (s: string) => {
    if (s === 'ຮັບອໍເດີ້') return COLORS.secondary;
    if (s === 'ສັ່ງເຄື່ອງແລ້ວ') return '#3498db';
    if (s === 'ເຄື່ອງຮອດແລ້ວ') return '#9b59b6';
    return COLORS.primary;
  };

  const openDatePicker = () => {
      Keyboard.dismiss();
      setShowDatePicker(true);
  };

  const onDateChange = (event: any, date?: Date) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (date) setSelectedDate(date);
  };

  const ListHeader = () => (
    <View style={styles.header}>
        <Text style={styles.headerTitle}>📦 ຕິດຕາມຄຳສັ່ງຊື້</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => { resetForm(); addNewItem(); setShowForm(true); }}>
            <Ionicons name="add-circle" size={24} color="white" />
            <Text style={styles.addBtnText}>ສ້າງອໍເດີໃໝ່</Text>
        </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* 🟢 Search & Filter Bar */}
      <View style={styles.searchFilterContainer}>
        <View style={styles.searchBox}>
            <Ionicons name="search" size={20} color="#999" />
            <TextInput 
                style={styles.searchInput} 
                placeholder="ຄົ້ນຫາຊື່ລູກຄ້າ..." 
                value={searchQuery}
                onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <Ionicons name="close-circle" size={20} color="#999" />
                </TouchableOpacity>
            )}
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
            {FILTER_STATUSES.map(status => (
                <TouchableOpacity 
                    key={status} 
                    style={[styles.filterChip, filterStatus === status && styles.filterChipActive]}
                    onPress={() => setFilterStatus(status)}
                >
                    <Text style={[styles.filterText, filterStatus === status && {color: 'white'}]}>{status}</Text>
                </TouchableOpacity>
            ))}
        </ScrollView>
      </View>

      <FlatList
        data={filteredOrders}
        keyExtractor={item => item.id!}
        ListHeaderComponent={ListHeader} 
        contentContainerStyle={{ paddingBottom: 100 }} 
        renderItem={({ item }) => (
          <View style={styles.orderGroupCard}>
            <View style={styles.groupHeader}>
              <View>
                <Text style={styles.custName}>👤 {item.customerName}</Text>
                <Text style={styles.groupDate}>{formatDate(new Date(item.date))}</Text>
              </View>
              <Text style={styles.totalText}>{formatNumber(item.totalAmount)} ₭</Text>
            </View>
            {item.items.map((subItem, index) => (
              <View key={index} style={styles.subItemRow}>
                <Image source={subItem.imageUrl ? { uri: subItem.imageUrl } : { uri: 'https://via.placeholder.com/150' }} style={styles.subImg} />
                <View style={{flex: 1, marginLeft: 10}}>
                  <Text style={styles.subName} numberOfLines={1}>{subItem.productName}</Text>
                  <View style={styles.row}>
                    <Text style={styles.subDetail}>ແຫຼ່ງ: {subItem.source} | </Text>
                    <View style={[styles.miniStatus, {backgroundColor: getStatusColor(subItem.status)}]}>
                      <Text style={styles.miniStatusText}>{subItem.status}</Text>
                    </View>
                  </View>
                </View>
              </View>
            ))}
            <View style={styles.cardActions}>
                <TouchableOpacity style={styles.editLink} onPress={() => { setId(item.id!); setCustomerName(item.customerName); setItems(item.items); setSelectedDate(new Date(item.date)); setShowForm(true); }}>
                  <Ionicons name="pencil" size={16} color={COLORS.primary} style={{marginRight: 5}}/>
                  <Text style={styles.editLinkText}>ເບິ່ງລາຍລະອຽດ / ແກ້ໄຂ</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.deleteLink} onPress={() => handleDeleteOrder(item.id!)}>
                  <Ionicons name="trash" size={20} color={ORANGE_COLOR} />
                </TouchableOpacity>
            </View>
          </View>
        )}
      />

      <Modal visible={showForm} animationType="slide">
        <SafeAreaView style={{flex: 1, backgroundColor: 'white'}}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
            style={{ flex: 1 }}
          >
            <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{id ? 'ແກ້ໄຂອໍເດີ' : 'ບັນທຶກອໍເດີ (ຫຼາຍລິ້ງ)'}</Text>
                <TouchableOpacity onPress={() => setShowForm(false)}><Ionicons name="close" size={30} color="#333" /></TouchableOpacity>
            </View>
            
            <ScrollView 
                style={styles.formBody} 
                contentContainerStyle={{ paddingBottom: 50 }}
                keyboardShouldPersistTaps="handled" 
            >
                <Text style={styles.label}>ຊື່ລູກຄ້າ *</Text>
                <View style={{zIndex: 10}}>
                    <TextInput 
                        style={styles.input} 
                        value={customerName} 
                        onChangeText={(text) => { setCustomerName(text); setShowCustomerList(true); }} 
                        placeholder="ພິມຊອກຫາ ຫຼື ເພີ່ມລູກຄ້າໃໝ່..." 
                        onFocus={() => setShowCustomerList(true)}
                    />
                    {showCustomerList && customerName.length > 0 && (
                        <View style={styles.customerDropdown}>
                            {customers.filter(c => c.name.toLowerCase().includes(customerName.toLowerCase())).slice(0, 5).map(cust => (
                                <TouchableOpacity 
                                    key={cust.id} 
                                    style={styles.customerOption}
                                    onPress={() => { setCustomerName(cust.name); setShowCustomerList(false); Keyboard.dismiss(); }}
                                >
                                    <Ionicons name="person" size={16} color="#666" style={{marginRight: 10}}/>
                                    <Text style={styles.customerOptionText}>{cust.name}</Text>
                                </TouchableOpacity>
                            ))}
                            {customers.filter(c => c.name.toLowerCase() === customerName.toLowerCase()).length === 0 && (
                                <TouchableOpacity style={styles.customerOptionNew} onPress={() => setShowCustomerList(false)}>
                                    <Ionicons name="add-circle" size={16} color={COLORS.primary} style={{marginRight: 10}}/>
                                    <Text style={styles.customerOptionNewText}>ເພີ່ມ "{customerName}" ເປັນລູກຄ້າໃໝ່</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    )}
                </View>

                <Text style={styles.label}>ວັນທີ *</Text>
                <TouchableOpacity style={styles.dateInput} onPress={openDatePicker}>
                    <Text style={styles.inputText}>{formatDate(selectedDate)}</Text>
                    <Ionicons name="calendar" size={22} color={COLORS.primary} />
                </TouchableOpacity>

                <Text style={[styles.label, {marginTop: 20, fontSize: 16}]}>ລາຍການສິນຄ້າ ({items.length})</Text>
                
                {items.map((item, index) => (
                    <View key={item.id} style={styles.itemEditorCard}>
                        <View style={styles.itemHeader}>
                            <Text style={styles.itemNumber}>ລາຍການທີ {index + 1}</Text>
                            <TouchableOpacity onPress={() => setItems(items.filter(i => i.id !== item.id))}>
                                <Ionicons name="trash" size={20} color={ORANGE_COLOR} />
                            </TouchableOpacity>
                        </View>
                        
                        <Text style={styles.subLabel}>ສິນຄ້າ *</Text>
                        <TextInput style={styles.input} placeholder="ຕົວຢ່າງ: ເສື້ອຢືດ..." value={item.productName} onChangeText={(v) => updateItemValue(item.id, 'productName', v)} />
                        
                        <View style={styles.row}>
                            <View style={{flex: 1.5}}>
                                <Text style={styles.subLabel}>ແຫຼ່ງສັ່ງ *</Text>
                                <View style={styles.sourceRow}>
                                {SOURCES.map(s => (
                                    <TouchableOpacity key={s} onPress={() => updateItemValue(item.id, 'source', s)} style={[styles.sourceChip, item.source === s && styles.sourceChipActive]}>
                                    <Text style={[styles.chipText, {color: item.source === s ? 'white' : '#666'}]}>{s}</Text>
                                    </TouchableOpacity>
                                ))}
                                </View>
                            </View>
                            <View style={{flex: 0.5, marginLeft: 10}}>
                                <Text style={styles.subLabel}>ຈຳນວນ *</Text>
                                <CurrencyInput 
                                    style={styles.input} 
                                    value={item.quantity.toString()} 
                                    onChangeValue={(v) => updateItemValue(item.id, 'quantity', v)} 
                                    placeholder="0"
                                />
                            </View>
                        </View>

                        <View style={styles.row}>
                            <View style={{flex: 1}}>
                                <Text style={styles.subLabel}>ລາຄາສັ່ງ (ຕົ້ນທຶນ)</Text>
                                <CurrencyInput 
                                    style={styles.input} 
                                    value={item.costPrice.toString()} 
                                    onChangeValue={(v) => updateItemValue(item.id, 'costPrice', v)} 
                                    placeholder="0"
                                />
                            </View>
                            <View style={{flex: 1, marginLeft: 10}}>
                                <Text style={styles.subLabel}>ລາຄາຂາຍ (₭)</Text>
                                <CurrencyInput 
                                    style={styles.input} 
                                    value={item.salePrice.toString()} 
                                    onChangeValue={(v) => updateItemValue(item.id, 'salePrice', v)} 
                                    placeholder="0"
                                />
                            </View>
                        </View>

                        <Text style={styles.subLabel}>ລິ້ງເວັບໄຊ (Link)</Text>
                        <TextInput style={styles.input} placeholder="https://..." value={item.link} onChangeText={(v) => updateItemValue(item.id, 'link', v)} />

                        <Text style={styles.subLabel}>ຮູບພາບສິນຄ້າ</Text>
                        <TouchableOpacity style={styles.imgPicker} onPress={() => pickItemImage(item.id)}>
                            {item.imageUrl ? <Image source={{uri: item.imageUrl}} style={styles.fullImg} /> : <Ionicons name="camera" size={30} color="#ccc" />}
                        </TouchableOpacity>

                        <Text style={styles.subLabel}>ສະຖານະ *</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statusRow}>
                            {STATUSES.map(s => (
                            <TouchableOpacity key={s} onPress={() => updateItemValue(item.id, 'status', s)} style={[styles.statusChip, item.status === s && {backgroundColor: getStatusColor(s)}]}>
                                <Text style={{fontSize: 12, fontFamily: 'Lao-Bold', color: item.status === s ? 'white' : '#666'}}>{s}</Text>
                            </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                ))}

                <TouchableOpacity style={styles.addItemBtn} onPress={addNewItem}>
                    <Ionicons name="add-circle" size={24} color={COLORS.primary} />
                    <Text style={styles.addItemBtnText}>+ ເພີ່ມລາຍການສິນຄ້າ</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                    <Text style={styles.saveBtnText}>ບັນທຶກອໍເດີທັງໝົດ</Text>
                </TouchableOpacity>
                <View style={{height: 50}} />
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>

        {showDatePicker && (
            Platform.OS === 'ios' ? (
                <Modal visible={true} transparent={true} animationType="fade">
                    <View style={styles.modalOverlay}>
                        <View style={styles.iosDatePickerContainer}>
                            <DateTimePicker 
                                value={selectedDate} 
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
                <DateTimePicker value={selectedDate} mode="date" display="default" onChange={onDateChange} />
            )
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  
  searchFilterContainer: { backgroundColor: 'white', padding: 15, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#eee', zIndex: 1 },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f5f5f5', borderRadius: 10, paddingHorizontal: 12, height: 45, marginBottom: 10 },
  searchInput: { flex: 1, marginLeft: 10, fontFamily: 'Lao-Regular', fontSize: 14 },
  filterScroll: { flexDirection: 'row' },
  filterChip: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, backgroundColor: '#eee', marginRight: 10 },
  filterChipActive: { backgroundColor: COLORS.primary },
  filterText: { fontSize: 12, fontFamily: 'Lao-Bold', color: '#666' },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, paddingTop: 5 },
  headerTitle: { fontFamily: 'Lao-Bold', fontSize: 18, color: COLORS.primary },
  addBtn: { flexDirection: 'row', backgroundColor: COLORS.primary, padding: 8, paddingHorizontal: 12, borderRadius: 8, alignItems: 'center' },
  addBtnText: { color: 'white', fontFamily: 'Lao-Bold', marginLeft: 5 },
  
  orderGroupCard: { backgroundColor: 'white', marginHorizontal: 10, marginBottom: 10, borderRadius: 15, padding: 15, elevation: 2 },
  groupHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', borderBottomWidth: 1, borderBottomColor: '#f5f5f5', paddingBottom: 10, marginBottom: 10 },
  custName: { fontFamily: 'Lao-Bold', fontSize: 16, color: COLORS.text },
  groupDate: { fontSize: 12, color: COLORS.textLight, fontFamily: 'Lao-Regular' },
  totalText: { fontFamily: 'Lao-Bold', fontSize: 18, color: COLORS.secondaryDark },
  
  subItemRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  subImg: { width: 45, height: 45, borderRadius: 8, backgroundColor: '#f9f9f9' },
  subName: { fontFamily: 'Lao-Bold', fontSize: 14, color: COLORS.text },
  subDetail: { fontSize: 12, color: COLORS.textLight, fontFamily: 'Lao-Regular' },
  miniStatus: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  miniStatusText: { color: 'white', fontSize: 10, fontFamily: 'Lao-Bold' },
  cardActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, borderTopWidth: 1, borderTopColor: '#f5f5f5', paddingTop: 10 },
  editLink: { flexDirection: 'row', alignItems: 'center' },
  editLinkText: { color: COLORS.primary, fontFamily: 'Lao-Bold', fontSize: 13 },
  deleteLink: { padding: 5 },

  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#eee' },
  modalTitle: { fontSize: 20, fontFamily: 'Lao-Bold', color: COLORS.text },
  formBody: { padding: 20 },
  label: { fontFamily: 'Lao-Bold', fontSize: 14, color: COLORS.text, marginBottom: 8 },
  subLabel: { fontFamily: 'Lao-Bold', fontSize: 13, color: '#666', marginBottom: 5, marginTop: 10 },
  input: { backgroundColor: '#f9f9f9', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#eee', fontFamily: 'Lao-Regular' },
  
  customerDropdown: { position: 'absolute', top: 50, left: 0, right: 0, backgroundColor: 'white', borderRadius: 10, elevation: 5, shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.2, zIndex: 100 },
  customerOption: { flexDirection: 'row', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
  customerOptionText: { fontFamily: 'Lao-Regular', fontSize: 14, color: '#333' },
  customerOptionNew: { flexDirection: 'row', alignItems: 'center', padding: 15, backgroundColor: '#f0fbcf' },
  customerOptionNewText: { fontFamily: 'Lao-Bold', fontSize: 14, color: COLORS.primary },

  inputText: { fontFamily: 'Lao-Regular', fontSize: 16, color: COLORS.text },
  dateInput: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f9f9f9', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#eee' },
  
  itemEditorCard: { backgroundColor: '#faffff', padding: 15, borderRadius: 15, marginBottom: 20, borderWidth: 1, borderColor: '#e0f7f7' },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10, borderBottomWidth: 1, borderBottomColor: '#e0f7f7', paddingBottom: 5 },
  itemNumber: { fontFamily: 'Lao-Bold', color: COLORS.primary, fontSize: 14 },
  
  row: { flexDirection: 'row' },
  sourceRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  sourceChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: '#eee' },
  sourceChipActive: { backgroundColor: COLORS.primary },
  chipText: { fontSize: 12, fontFamily: 'Lao-Bold' },
  
  imgPicker: { width: 80, height: 80, backgroundColor: '#f0f0f0', borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginTop: 5, overflow: 'hidden' },
  fullImg: { width: '100%', height: '100%' },
  
  statusRow: { flexDirection: 'row', marginTop: 10 },
  statusChip: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, backgroundColor: '#eee', marginRight: 10 },
  
  addItemBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 15, borderStyle: 'dashed', borderWidth: 1, borderColor: COLORS.primary, borderRadius: 15, marginTop: 10 },
  addItemBtnText: { marginLeft: 10, fontFamily: 'Lao-Bold', color: COLORS.primary },
  saveBtn: { backgroundColor: COLORS.primary, padding: 18, borderRadius: 15, alignItems: 'center', marginTop: 30 },
  saveBtnText: { color: 'white', fontFamily: 'Lao-Bold', fontSize: 18 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  iosDatePickerContainer: { backgroundColor: 'white', borderRadius: 20, width: '85%', padding: 20, alignItems: 'center' },
  iosDateDoneBtn: { marginTop: 10, padding: 10, width: '100%', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#eee' },
  iosDateDoneText: { fontFamily: 'Lao-Bold', color: COLORS.primary, fontSize: 16 }
});