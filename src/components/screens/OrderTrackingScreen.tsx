import { Ionicons } from '@expo/vector-icons';
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
    const [items, setItems] = useState<OrderItem[]>([]); // 🟢 ລາຍການສິນຄ້າໃນອໍເດີນີ້

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

    // 🟢 ຟັງຊັນເພີ່ມລາຍການສິນຄ້າເປົ່າໆເຂົ້າໄປໃນຟອມ
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

    // 🟢 ຟັງຊັນອັບເດດຂໍ້ມູນແຕ່ລະຊິ້ນໃນຟອມ
    const updateItemValue = (itemId: string, field: keyof OrderItem, value: any) => {
        setItems(items.map(item => item.id === itemId ? { ...item, [field]: value } : item));
    };

    const handleSave = async () => {
        if (!customerName || items.length === 0) {
            Alert.alert('ຂໍ້ມູນບໍ່ຄົບ', 'ກະລຸນາໃສ່ຊື່ລູກຄ້າ ແລະ ເພີ່ມສິນຄ້າຢ່າງໜ້ອຍ 1 ລາຍການ');
            return;
        }
        const totalAmount = items.reduce((sum, item) => sum + (item.salePrice * item.quantity), 0);
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
                <Text style={styles.headerTitle}>📦 ຕິດຕາມຫຼາຍສິນຄ້າ</Text>
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
                            <Text style={styles.custName}>👤 {item.customerName}</Text>
                            <Text style={styles.groupDate}>{formatDate(new Date(item.date))}</Text>
                        </View>
                        
                        {item.items.map((subItem, index) => (
                            <View key={index} style={styles.subItemRow}>
                                <Image source={subItem.imageUrl ? { uri: subItem.imageUrl } : { uri: 'https://via.placeholder.com/150' }} style={styles.subImg} />
                                <View style={{flex: 1, marginLeft: 10}}>
                                    <Text style={styles.subName}>{subItem.productName} (x{subItem.quantity})</Text>
                                    <View style={[styles.miniStatus, {backgroundColor: getStatusColor(subItem.status)}]}>
                                        <Text style={styles.miniStatusText}>{subItem.status}</Text>
                                    </View>
                                </View>
                                <Text style={styles.subPrice}>{formatNumber(subItem.salePrice)}</Text>
                            </View>
                        ))}
                        
                        <View style={styles.groupFooter}>
                            <Text style={styles.totalText}>ລວມ: {formatNumber(item.totalAmount)} ₭</Text>
                            <TouchableOpacity onPress={() => { setId(item.id!); setCustomerName(item.customerName); setItems(item.items); setSelectedDate(new Date(item.date)); setShowForm(true); }}>
                                <Text style={{color: COLORS.primary, fontFamily: 'Lao-Bold'}}>ແກ້ໄຂອໍເດີ</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            />

            <Modal visible={showForm} animationType="slide">
                <SafeAreaView style={{flex: 1, backgroundColor: 'white'}}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>ບັນທຶກອໍເດີ (ຫຼາຍລິ້ງ)</Text>
                        <TouchableOpacity onPress={() => setShowForm(false)}><Ionicons name="close" size={30} /></TouchableOpacity>
                    </View>
                    
                    <ScrollView style={styles.formBody}>
                        <Text style={styles.label}>ຊື່ລູກຄ້າ *</Text>
                        <TextInput style={styles.input} value={customerName} onChangeText={setCustomerName} placeholder="ປ້ອນຊື່ລູກຄ້າ..." />

                        <Text style={[styles.label, {marginTop: 20}]}>ລາຍການສິນຄ້າ ({items.length})</Text>
                        
                        {items.map((item, index) => (
                            <View key={item.id} style={styles.itemEditorCard}>
                                <View style={styles.itemHeader}>
                                    <Text style={styles.itemNumber}>ລາຍການທີ {index + 1}</Text>
                                    <TouchableOpacity onPress={() => setItems(items.filter(i => i.id !== item.id))}>
                                        <Ionicons name="trash" size={20} color={COLORS.danger} />
                                    </TouchableOpacity>
                                </View>
                                
                                <TextInput 
                                    style={styles.input} 
                                    placeholder="ຊື່ສິນຄ້າ..." 
                                    value={item.productName} 
                                    onChangeText={(v) => updateItemValue(item.id, 'productName', v)}
                                />
                                
                                <View style={styles.row}>
                                    <TextInput 
                                        style={[styles.input, {flex: 1}]} 
                                        placeholder="ລາຄາຂາຍ" 
                                        keyboardType="numeric"
                                        value={item.salePrice.toString()}
                                        onChangeText={(v) => updateItemValue(item.id, 'salePrice', parseFloat(v) || 0)}
                                    />
                                    <TextInput 
                                        style={[styles.input, {width: 60, marginLeft: 10}]} 
                                        placeholder="ຈຳນວນ" 
                                        keyboardType="numeric"
                                        value={item.quantity.toString()}
                                        onChangeText={(v) => updateItemValue(item.id, 'quantity', parseInt(v) || 1)}
                                    />
                                </View>

                                <TextInput 
                                    style={styles.input} 
                                    placeholder="ລິ້ງເວັບໄຊ (Link)..." 
                                    value={item.link} 
                                    onChangeText={(v) => updateItemValue(item.id, 'link', v)}
                                />

                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom: 10}}>
                                    {STATUSES.map(s => (
                                        <TouchableOpacity 
                                            key={s} 
                                            onPress={() => updateItemValue(item.id, 'status', s)}
                                            style={[styles.statusChip, item.status === s && {backgroundColor: getStatusColor(s)}]}
                                        >
                                            <Text style={{fontSize: 10, color: item.status === s ? 'white' : '#666'}}>{s}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>
                        ))}

                        <TouchableOpacity style={styles.addItemBtn} onPress={addNewItem}>
                            <Ionicons name="add-circle-outline" size={24} color={COLORS.primary} />
                            <Text style={styles.addItemBtnText}>ເພີ່ມລາຍການສິນຄ້າ</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                            <Text style={styles.saveBtnText}>ບັນທຶກອໍເດີທັງໝົດ</Text>
                        </TouchableOpacity>
                        <View style={{height: 50}} />
                    </ScrollView>
                </SafeAreaView>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, backgroundColor: 'white' },
    headerTitle: { fontFamily: 'Lao-Bold', fontSize: 18, color: COLORS.primary },
    addBtn: { flexDirection: 'row', backgroundColor: COLORS.primary, padding: 8, paddingHorizontal: 12, borderRadius: 8, alignItems: 'center' },
    addBtnText: { color: 'white', fontFamily: 'Lao-Bold', marginLeft: 5 },
    
    // Group Card
    orderGroupCard: { backgroundColor: 'white', margin: 10, borderRadius: 15, padding: 15, elevation: 3 },
    groupHeader: { flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 10, marginBottom: 10 },
    custName: { fontFamily: 'Lao-Bold', fontSize: 16 },
    groupDate: { fontSize: 12, color: '#888', fontFamily: 'Lao-Regular' },
    subItemRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    subImg: { width: 40, height: 40, borderRadius: 5, backgroundColor: '#f9f9f9' },
    subName: { fontFamily: 'Lao-Bold', fontSize: 14 },
    miniStatus: { alignSelf: 'flex-start', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10, marginTop: 2 },
    miniStatusText: { color: 'white', fontSize: 9, fontFamily: 'Lao-Bold' },
    subPrice: { fontFamily: 'Lao-Bold', color: COLORS.secondaryDark },
    groupFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#eee' },
    totalText: { fontFamily: 'Lao-Bold', fontSize: 16, color: COLORS.primary },

    // Form
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderBottomColor: '#eee' },
    modalTitle: { fontSize: 20, fontFamily: 'Lao-Bold' },
    formBody: { padding: 20 },
    label: { fontFamily: 'Lao-Bold', fontSize: 14, color: '#444', marginBottom: 8 },
    input: { backgroundColor: '#f9f9f9', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#eee', marginBottom: 10, fontFamily: 'Lao-Regular' },
    itemEditorCard: { backgroundColor: '#f0fcfc', padding: 15, borderRadius: 15, marginBottom: 20, borderWidth: 1, borderColor: '#d0f0f0' },
    itemHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    itemNumber: { fontFamily: 'Lao-Bold', color: COLORS.primary },
    row: { flexDirection: 'row' },
    statusChip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 15, backgroundColor: '#eee', marginRight: 5 },
    addItemBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 15, borderStyle: 'dashed', borderWidth: 1, borderColor: COLORS.primary, borderRadius: 15, marginTop: 10 },
    addItemBtnText: { marginLeft: 10, fontFamily: 'Lao-Bold', color: COLORS.primary },
    saveBtn: { backgroundColor: COLORS.primary, padding: 18, borderRadius: 15, alignItems: 'center', marginTop: 30 },
    saveBtnText: { color: 'white', fontFamily: 'Lao-Bold', fontSize: 18 }
});