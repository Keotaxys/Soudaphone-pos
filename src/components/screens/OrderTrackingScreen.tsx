import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { onValue, push, ref, update } from 'firebase/database';
import React, { useEffect, useState } from 'react';
import {
    Alert, FlatList, Image,
    Modal,
    SafeAreaView,
    ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View
} from 'react-native';
import { db } from '../../firebase';
import { COLORS, CustomerOrder, OrderItem, formatDate, formatNumber } from '../../types';

const SOURCES = ['ຈີນ', 'ຫວຽດ', 'ໄທ', 'ອື່ນໆ'];
const STATUSES = ['ຮັບອໍເດີ້', 'ສັ່ງເຄື່ອງແລ້ວ', 'ເຄື່ອງຮອດແລ້ວ', 'ຈັດສົ່ງສຳເລັດ'];

export default function OrderTrackingScreen() {
    const [orders, setOrders] = useState<CustomerOrder[]>([]);
    const [showForm, setShowForm] = useState(false);
    
    // --- Form States ---
    const [id, setId] = useState<string | null>(null);
    const [customerName, setCustomerName] = useState('');
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [items, setItems] = useState<OrderItem[]>([]);
    const [showDatePicker, setShowDatePicker] = useState(false);

    useEffect(() => {
        const orderRef = ref(db, 'customer_orders');
        const unsubscribe = onValue(orderRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                const list = Object.keys(data).map(key => ({ id: key, ...data[key] }));
                setOrders(list.reverse() as CustomerOrder[]);
            } else { setOrders([]); }
        });
        return () => unsubscribe();
    }, []);

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
        const totalAmount = items.reduce((sum, item) => sum + (Number(item.salePrice) * Number(item.quantity)), 0);
        const orderData = {
            customerName,
            date: selectedDate.toISOString(),
            items,
            totalAmount,
            createdAt: new Date().toISOString()
        };

        try {
            if (id) { await update(ref(db, `customer_orders/${id}`), orderData); }
            else { await push(ref(db, 'customer_orders'), orderData); }
            setShowForm(false);
            resetForm();
        } catch (error) { Alert.alert('Error', 'ບັນທຶກບໍ່ສຳເລັດ'); }
    };

    const resetForm = () => {
        setId(null); setCustomerName(''); setSelectedDate(new Date()); setItems([]);
    };

    const getStatusColor = (s: string) => {
        if (s === 'ຮັບອໍເດີ້') return COLORS.secondary;
        if (s === 'ສັ່ງເຄື່ອງແລ້ວ') return '#3498db';
        if (s === 'ເຄື່ອງຮອດແລ້ວ') return '#9b59b6';
        return COLORS.primary;
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>📦 ຕິດຕາມຄຳສັ່ງຊື້</Text>
                <TouchableOpacity style={styles.addBtn} onPress={() => { resetForm(); addNewItem(); setShowForm(true); }}>
                    <Ionicons name="add-circle" size={24} color="white" />
                    <Text style={styles.addBtnText}>ສ້າງອໍເດີໃໝ່</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={orders}
                keyExtractor={item => item.id!}
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
                        <TouchableOpacity style={styles.editLink} onPress={() => { setId(item.id!); setCustomerName(item.customerName); setItems(item.items); setSelectedDate(new Date(item.date)); setShowForm(true); }}>
                            <Text style={styles.editLinkText}>ເບິ່ງລາຍລະອຽດ / ແກ້ໄຂ</Text>
                        </TouchableOpacity>
                    </View>
                )}
            />

            <Modal visible={showForm} animationType="slide">
                <SafeAreaView style={{flex: 1, backgroundColor: 'white'}}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>{id ? 'ແກ້ໄຂອໍເດີ' : 'ບັນທຶກອໍເດີ (ຫຼາຍລິ້ງ)'}</Text>
                        <TouchableOpacity onPress={() => setShowForm(false)}><Ionicons name="close" size={30} /></TouchableOpacity>
                    </View>
                    
                    <ScrollView style={styles.formBody}>
                        <Text style={styles.label}>ຊື່ລູກຄ້າ *</Text>
                        <TextInput style={styles.input} value={customerName} onChangeText={setCustomerName} placeholder="ປ້ອນຊື່ລູກຄ້າ..." />

                        <Text style={styles.label}>ວັນທີ *</Text>
                        <TouchableOpacity style={styles.dateInput} onPress={() => setShowDatePicker(true)}>
                            <Text style={styles.inputText}>{formatDate(selectedDate)}</Text>
                            <Ionicons name="calendar-outline" size={22} color={COLORS.primary} />
                        </TouchableOpacity>

                        <Text style={[styles.label, {marginTop: 20, fontSize: 16}]}>ລາຍການສິນຄ້າ ({items.length})</Text>
                        
                        {items.map((item, index) => (
                            <View key={item.id} style={styles.itemEditorCard}>
                                <View style={styles.itemHeader}>
                                    <Text style={styles.itemNumber}>ລາຍການທີ {index + 1}</Text>
                                    <TouchableOpacity onPress={() => setItems(items.filter(i => i.id !== item.id))}>
                                        <Ionicons name="trash" size={20} color={COLORS.danger} />
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
                                        <TextInput style={styles.input} keyboardType="numeric" value={item.quantity.toString()} onChangeText={(v) => updateItemValue(item.id, 'quantity', v)} />
                                    </View>
                                </View>

                                <View style={styles.row}>
                                    <View style={{flex: 1}}>
                                        <Text style={styles.subLabel}>ລາຄາສັ່ງ (ຕົ້ນທຶນ)</Text>
                                        <TextInput style={styles.input} keyboardType="numeric" value={item.costPrice.toString()} onChangeText={(v) => updateItemValue(item.id, 'costPrice', v)} />
                                    </View>
                                    <View style={{flex: 1, marginLeft: 10}}>
                                        <Text style={styles.subLabel}>ລາຄາຂາຍ (₭)</Text>
                                        <TextInput style={styles.input} keyboardType="numeric" value={item.salePrice.toString()} onChangeText={(v) => updateItemValue(item.id, 'salePrice', v)} />
                                    </View>
                                </View>

                                <Text style={styles.subLabel}>ລິ້ງເວັບໄຊ (Link)</Text>
                                <TextInput style={styles.input} placeholder="https://..." value={item.link} onChangeText={(v) => updateItemValue(item.id, 'link', v)} />

                                <Text style={styles.subLabel}>ຮູບພາບສິນຄ້າ</Text>
                                <TouchableOpacity style={styles.imgPicker} onPress={() => pickItemImage(item.id)}>
                                    {item.imageUrl ? <Image source={{uri: item.imageUrl}} style={styles.fullImg} /> : <Ionicons name="camera-outline" size={30} color="#ccc" />}
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
                            <Ionicons name="add-circle-outline" size={24} color={COLORS.primary} />
                            <Text style={styles.addItemBtnText}>+ ເພີ່ມລາຍການສິນຄ້າ</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                            <Text style={styles.saveBtnText}>ບັນທຶກອໍເດີທັງໝົດ</Text>
                        </TouchableOpacity>
                        <View style={{height: 50}} />
                    </ScrollView>
                </SafeAreaView>

                {showDatePicker && (
                    <DateTimePicker value={selectedDate} mode="date" display="default" onChange={(e, d) => { setShowDatePicker(false); if(d) setSelectedDate(d); }} />
                )}
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#eee' },
    headerTitle: { fontFamily: 'Lao-Bold', fontSize: 18, color: COLORS.primary },
    addBtn: { flexDirection: 'row', backgroundColor: COLORS.primary, padding: 8, paddingHorizontal: 12, borderRadius: 8, alignItems: 'center' },
    addBtnText: { color: 'white', fontFamily: 'Lao-Bold', marginLeft: 5 },
    
    orderGroupCard: { backgroundColor: 'white', margin: 10, borderRadius: 15, padding: 15, elevation: 2 },
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
    editLink: { alignSelf: 'center', marginTop: 5 },
    editLinkText: { color: COLORS.primary, fontFamily: 'Lao-Bold', fontSize: 13 },

    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#eee' },
    modalTitle: { fontSize: 20, fontFamily: 'Lao-Bold', color: COLORS.text },
    formBody: { padding: 20 },
    label: { fontFamily: 'Lao-Bold', fontSize: 14, color: COLORS.text, marginBottom: 8 },
    subLabel: { fontFamily: 'Lao-Bold', fontSize: 13, color: '#666', marginBottom: 5, marginTop: 10 },
    input: { backgroundColor: '#f9f9f9', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#eee', fontFamily: 'Lao-Regular' },
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
    saveBtnText: { color: 'white', fontFamily: 'Lao-Bold', fontSize: 18 }
});