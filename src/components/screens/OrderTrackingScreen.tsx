import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { onValue, push, ref, remove, update } from 'firebase/database';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    FlatList,
    Image,
    Linking,
    Modal,
    SafeAreaView // 🟢 Import SafeAreaView ມາຮຽບຮ້ອຍແລ້ວ
    ,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { db } from '../../firebase';
import { COLORS, CustomerOrder, formatDate, formatNumber } from '../../types';

// 🟢 ຂໍ້ມູນທາງເລືອກ (ຕົງຕາມ Web App)
const SOURCES = ['ຈີນ', 'ຫວຽດ', 'ໄທ', 'ອື່ນໆ'];
const STATUSES = ['ຮັບອໍເດີ້', 'ສັ່ງເຄື່ອງແລ້ວ', 'ເຄື່ອງຮອດແລ້ວ', 'ຈັດສົ່ງສຳເລັດ'];

export default function OrderTrackingScreen() {
    // --- Data States ---
    const [orders, setOrders] = useState<CustomerOrder[]>([]);
    const [loading, setLoading] = useState(true);

    // --- Form States (ຄົບຕາມຮູບ 4) ---
    const [id, setId] = useState<string | null>(null);
    const [customerName, setCustomerName] = useState('');
    const [productName, setProductName] = useState('');
    const [source, setSource] = useState('ຈີນ');
    const [quantity, setQuantity] = useState('1');
    const [costPrice, setCostPrice] = useState('0');
    const [salePrice, setSalePrice] = useState('0');
    const [link, setLink] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [status, setStatus] = useState('ຮັບອໍເດີ້');
    const [selectedDate, setSelectedDate] = useState(new Date());

    // --- UI States ---
    const [showForm, setShowForm] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [viewImage, setViewImage] = useState<string | null>(null); 

    // 1. ດຶງຂໍ້ມູນ Real-time
    useEffect(() => {
        const orderRef = ref(db, 'customer_orders');
        const unsubscribe = onValue(orderRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                const list = Object.keys(data).map(key => ({ id: key, ...data[key] }));
                list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                setOrders(list as CustomerOrder[]);
            } else { setOrders([]); }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    // 2. ຟັງຊັນບັນທຶກລາຍການ
    const handleSave = async () => {
        if (!customerName || !productName) {
            Alert.alert('ຂໍ້ມູນບໍ່ຄົບ', 'ກະລຸນາໃສ່ຊື່ລູກຄ້າ ແລະ ຊື່ສິນຄ້າ');
            return;
        }
        const orderData = {
            customerName,
            date: selectedDate.toISOString(),
            productName,
            source,
            quantity: parseInt(quantity) || 1,
            costPrice: parseFloat(costPrice.replace(/,/g, '')) || 0,
            salePrice: parseFloat(salePrice.replace(/,/g, '')) || 0,
            link,
            imageUrl,
            status,
            createdAt: new Date().toISOString()
        };
        try {
            if (id) { await update(ref(db, `customer_orders/${id}`), orderData); }
            else { await push(ref(db, 'customer_orders'), orderData); }
            resetForm();
            setShowForm(false);
        } catch (error) { Alert.alert('Error', 'ບັນທຶກບໍ່ສຳເລັດ'); }
    };

    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
            base64: true
        });
        if (!result.canceled) {
            setImageUrl(`data:image/jpeg;base64,${result.assets[0].base64}`);
        }
    };

    const handleEdit = (item: CustomerOrder) => {
        setId(item.id!);
        setCustomerName(item.customerName);
        setProductName(item.productName);
        setSource(item.source);
        setQuantity(item.quantity.toString());
        setCostPrice(item.costPrice.toString());
        setSalePrice(item.salePrice.toString());
        setLink(item.link || '');
        setImageUrl(item.imageUrl || '');
        setStatus(item.status);
        setSelectedDate(new Date(item.date));
        setShowForm(true);
    };

    const resetForm = () => {
        setId(null); setCustomerName(''); setProductName(''); setSource('ຈີນ');
        setQuantity('1'); setCostPrice('0'); setSalePrice('0'); setLink('');
        setImageUrl(''); setStatus('ຮັບອໍເດີ້'); setSelectedDate(new Date());
    };

    const getStatusColor = (s: string) => {
        if (s === 'ຮັບອໍເດີ້') return COLORS.secondary;
        if (s === 'ສັ່ງເຄື່ອງແລ້ວ') return '#3498db';
        if (s === 'ເຄື່ອງຮອດແລ້ວ') return '#9b59b6';
        return COLORS.success;
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>📋 ປະຫວັດຄຳສັ່ງຊື້ (Real-time)</Text>
                <TouchableOpacity style={styles.addBtn} onPress={() => { resetForm(); setShowForm(true); }}>
                    <Ionicons name="add-circle" size={24} color="white" />
                    <Text style={styles.addBtnText}>ເພີ່ມອໍເດີ</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={orders}
                keyExtractor={item => item.id!}
                renderItem={({ item }) => (
                    <View style={styles.card}>
                        <View style={styles.cardTop}>
                            <Text style={styles.custName}>👤 {item.customerName}</Text>
                            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                                <Text style={styles.statusText}>{item.status}</Text>
                            </View>
                        </View>
                        
                        <View style={styles.cardMid}>
                            <TouchableOpacity onPress={() => setViewImage(item.imageUrl || null)}>
                                <Image 
                                    source={item.imageUrl ? { uri: item.imageUrl } : { uri: 'https://via.placeholder.com/150' }} 
                                    style={styles.prodImg} 
                                />
                            </TouchableOpacity>
                            <View style={styles.prodInfo}>
                                <Text style={styles.prodName}>{item.productName}</Text>
                                <Text style={styles.subInfo}>ແຫຼ່ງສັ່ງ: {item.source} | ຈຳນວນ: {item.quantity}</Text>
                                {item.link ? (
                                    <TouchableOpacity onPress={() => Linking.openURL(item.link!)}>
                                        <Text style={styles.linkText} numberOfLines={1}>🔗 {item.link}</Text>
                                    </TouchableOpacity>
                                ) : null}
                            </View>
                        </View>

                        <View style={styles.cardBot}>
                            <View>
                                <Text style={styles.priceLabel}>ລາຄາຂາຍ:</Text>
                                <Text style={styles.priceVal}>{formatNumber(item.salePrice)} ₭</Text>
                            </View>
                            <View style={styles.actionBtns}>
                                <TouchableOpacity onPress={() => handleEdit(item)} style={styles.editBtn}>
                                    <Ionicons name="create-outline" size={20} color={COLORS.primary} />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => Alert.alert('ຢືນຢັນ', 'ລຶບບໍ່?', [{text: 'ຍົກເລີກ'}, {text: 'ລຶບ', onPress: () => remove(ref(db, `customer_orders/${item.id}`))}])}>
                                    <Ionicons name="trash-outline" size={20} color={COLORS.danger} />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                )}
            />

            {/* --- Form Modal (ຄົບຕາມຮູບ 4) --- */}
            <Modal visible={showForm} animationType="slide">
                <SafeAreaView style={{flex: 1}}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>{id ? 'ແກ້ໄຂຄຳສັ່ງຊື້' : 'ເພີ່ມຄຳສັ່ງຊື້'}</Text>
                        <TouchableOpacity onPress={() => setShowForm(false)}><Ionicons name="close" size={30} /></TouchableOpacity>
                    </View>
                    <ScrollView style={styles.formBody} contentContainerStyle={{paddingBottom: 40}}>
                        <Text style={styles.label}>ຊື່ລູກຄ້າ *</Text>
                        <TextInput style={styles.input} value={customerName} onChangeText={setCustomerName} placeholder="ປ້ອນຊື່ລູກຄ້າ..." />
                        
                        <Text style={styles.label}>ວັນທີ *</Text>
                        <TouchableOpacity style={styles.dateInput} onPress={() => setShowDatePicker(true)}>
                            <Text>{formatDate(selectedDate)}</Text>
                            <Ionicons name="calendar-outline" size={20} />
                        </TouchableOpacity>

                        <Text style={styles.label}>ສິນຄ້າ *</Text>
                        <TextInput style={styles.input} value={productName} onChangeText={setProductName} placeholder="ຕົວຢ່າງ: ເສື້ອຢືດ..." />

                        <View style={styles.row}>
                            <View style={{flex: 1}}>
                                <Text style={styles.label}>ແຫຼ່ງສັ່ງ *</Text>
                                <View style={styles.pickerWrapper}>
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                        {SOURCES.map(s => (
                                            <TouchableOpacity key={s} onPress={() => setSource(s)} style={[styles.sourceChip, source === s && styles.sourceChipActive]}>
                                                <Text style={{color: source === s ? 'white' : '#666'}}>{s}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                </View>
                            </View>
                            <View style={{width: 80, marginLeft: 10}}>
                                <Text style={styles.label}>ຈຳນວນ *</Text>
                                <TextInput style={styles.input} value={quantity} onChangeText={setQuantity} keyboardType="numeric" />
                            </View>
                        </View>

                        <View style={styles.row}>
                            <View style={{flex: 1}}>
                                <Text style={styles.label}>ລາຄາສັ່ງ (ຕົ້ນທຶນ)</Text>
                                <TextInput style={styles.input} value={formatNumber(costPrice)} onChangeText={t => setCostPrice(t.replace(/,/g,''))} keyboardType="numeric" />
                            </View>
                            <View style={{flex: 1, marginLeft: 10}}>
                                <Text style={styles.label}>ລາຄາຂາຍ (₭)</Text>
                                <TextInput style={styles.input} value={formatNumber(salePrice)} onChangeText={t => setSalePrice(t.replace(/,/g,''))} keyboardType="numeric" />
                            </View>
                        </View>

                        <Text style={styles.label}>ລິ້ງເວັບໄຊ</Text>
                        <TextInput style={styles.input} value={link} onChangeText={setLink} placeholder="https://..." />

                        <Text style={styles.label}>ຮູບພາບສິນຄ້າ</Text>
                        <TouchableOpacity style={styles.imgPickBtn} onPress={pickImage}>
                            {imageUrl ? <Image source={{uri: imageUrl}} style={styles.formImg} /> : <Ionicons name="image-outline" size={40} color="#ccc" />}
                        </TouchableOpacity>

                        <Text style={styles.label}>ສະຖານະ *</Text>
                        <View style={styles.statusRow}>
                            {STATUSES.map(s => (
                                <TouchableOpacity key={s} onPress={() => setStatus(s as any)} style={[styles.statusChip, status === s && {backgroundColor: getStatusColor(s)}]}>
                                    <Text style={{color: status === s ? 'white' : '#666', fontSize: 12}}>{s}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                            <Text style={styles.saveBtnText}>ບັນທຶກຄຳສັ່ງຊື້</Text>
                        </TouchableOpacity>
                    </ScrollView>
                </SafeAreaView>
            </Modal>

            {/* Modal ເບິ່ງຮູບໃຫຍ່ */}
            <Modal visible={!!viewImage} transparent={true} animationType="fade">
                <TouchableOpacity style={styles.imgOverlay} onPress={() => setViewImage(null)}>
                    <Image source={{uri: viewImage || ''}} style={styles.fullImg} resizeMode="contain" />
                </TouchableOpacity>
            </Modal>

            {showDatePicker && <DateTimePicker value={selectedDate} mode="date" display="default" onChange={(e, d) => { setShowDatePicker(false); if(d) setSelectedDate(d); }} />}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, backgroundColor: 'white' },
    headerTitle: { fontFamily: 'Lao-Bold', fontSize: 18, color: COLORS.primary },
    addBtn: { flexDirection: 'row', backgroundColor: COLORS.success, padding: 8, paddingHorizontal: 12, borderRadius: 8, alignItems: 'center' },
    addBtnText: { color: 'white', fontFamily: 'Lao-Bold', marginLeft: 5 },
    
    // Card Styles
    card: { backgroundColor: 'white', margin: 10, borderRadius: 12, padding: 15, elevation: 3 },
    cardTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    custName: { fontFamily: 'Lao-Bold', fontSize: 16 },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
    statusText: { color: 'white', fontSize: 11, fontFamily: 'Lao-Bold' },
    cardMid: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#f0f0f0', paddingBottom: 10 },
    prodImg: { width: 70, height: 70, borderRadius: 8, backgroundColor: '#f9f9f9' },
    prodInfo: { flex: 1, marginLeft: 12 },
    prodName: { fontFamily: 'Lao-Bold', fontSize: 15 },
    subInfo: { fontSize: 12, color: '#666', marginTop: 4 },
    linkText: { fontSize: 12, color: COLORS.primary, marginTop: 4, textDecorationLine: 'underline' },
    cardBot: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
    priceLabel: { fontSize: 11, color: '#888' },
    priceVal: { fontFamily: 'Lao-Bold', color: COLORS.secondaryDark, fontSize: 16 },
    actionBtns: { flexDirection: 'row', gap: 15 },
    editBtn: { backgroundColor: '#f0f9f9', padding: 5, borderRadius: 5 },

    // Modal & Form
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderBottomColor: '#eee' },
    modalTitle: { fontSize: 20, fontFamily: 'Lao-Bold' },
    formBody: { padding: 20 },
    label: { fontFamily: 'Lao-Bold', fontSize: 14, color: '#444', marginBottom: 8, marginTop: 15 },
    input: { backgroundColor: '#f9f9f9', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#eee' },
    dateInput: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#f9f9f9', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#eee' },
    row: { flexDirection: 'row' },
    pickerWrapper: { flex: 1, height: 45 },
    sourceChip: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, backgroundColor: '#eee', marginRight: 10, height: 35 },
    sourceChipActive: { backgroundColor: COLORS.primary },
    imgPickBtn: { width: 100, height: 100, backgroundColor: '#f5f5f5', borderRadius: 15, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
    formImg: { width: '100%', height: '100%' },
    statusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    statusChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 15, backgroundColor: '#eee' },
    saveBtn: { backgroundColor: COLORS.success, padding: 18, borderRadius: 15, alignItems: 'center', marginTop: 30 },
    saveBtnText: { color: 'white', fontFamily: 'Lao-Bold', fontSize: 18 },

    // Full Image Preview
    imgOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' },
    fullImg: { width: '90%', height: '80%' }
});