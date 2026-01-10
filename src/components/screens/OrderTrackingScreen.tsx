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
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { db } from '../../firebase';
import { COLORS, CustomerOrder, formatDate, formatNumber } from '../../types';

const SOURCES = ['ຈີນ', 'ຫວຽດ', 'ໄທ', 'ອື່ນໆ'];
const STATUSES = ['ຮັບອໍເດີ້', 'ສັ່ງເຄື່ອງແລ້ວ', 'ເຄື່ອງຮອດແລ້ວ', 'ຈັດສົ່ງສຳເລັດ'];

export default function OrderTrackingScreen() {
    const [orders, setOrders] = useState<CustomerOrder[]>([]);
    const [loading, setLoading] = useState(true);

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

    const [showForm, setShowForm] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [viewImage, setViewImage] = useState<string | null>(null);

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
        return COLORS.primary; // ໃຊ້ສີ Teal ຂອງ Theme ເປັນສີສຳເລັດ
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>📋 ປະຫວັດຄຳສັ່ງຊື້</Text>
                <TouchableOpacity style={styles.addBtn} onPress={() => { resetForm(); setShowForm(true); }}>
                    <Ionicons name="add-circle" size={24} color="white" />
                    <Text style={styles.addBtnText}>ເພີ່ມອໍເດີ</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={orders}
                keyExtractor={item => item.id!}
                contentContainerStyle={{ paddingBottom: 20 }}
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

            <Modal visible={showForm} animationType="slide">
                <SafeAreaView style={{flex: 1, backgroundColor: 'white'}}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>{id ? 'ແກ້ໄຂຄຳສັ່ງຊື້' : 'ເພີ່ມຄຳສັ່ງຊື້'}</Text>
                        <TouchableOpacity onPress={() => setShowForm(false)}><Ionicons name="close" size={30} /></TouchableOpacity>
                    </View>
                    <ScrollView style={styles.formBody} contentContainerStyle={{paddingBottom: 40}}>
                        <Text style={styles.label}>ວັນທີ *</Text>
                        <TouchableOpacity style={styles.dateInput} onPress={() => setShowDatePicker(true)}>
                            <Text style={styles.inputText}>{formatDate(selectedDate)}</Text>
                            <Ionicons name="calendar-outline" size={22} color={COLORS.primary} />
                        </TouchableOpacity>

                        <Text style={styles.label}>ຊື່ລູກຄ້າ *</Text>
                        <TextInput style={styles.input} value={customerName} onChangeText={setCustomerName} placeholder="ປ້ອນຊື່ລູກຄ້າ..." placeholderTextColor="#999" />
                        
                        <Text style={styles.label}>ສິນຄ້າ *</Text>
                        <TextInput style={styles.input} value={productName} onChangeText={setProductName} placeholder="ຕົວຢ່າງ: ເສື້ອຢືດ..." placeholderTextColor="#999" />

                        <View style={styles.row}>
                            <View style={{flex: 1}}>
                                <Text style={styles.label}>ແຫຼ່ງສັ່ງ *</Text>
                                <View style={styles.pickerWrapper}>
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                        {SOURCES.map(s => (
                                            <TouchableOpacity key={s} onPress={() => setSource(s)} style={[styles.sourceChip, source === s && styles.sourceChipActive]}>
                                                <Text style={[styles.chipText, {color: source === s ? 'white' : '#666'}]}>{s}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                </View>
                            </View>
                            <View style={{width: 90, marginLeft: 10}}>
                                <Text style={styles.label}>ຈຳນວນ *</Text>
                                <TextInput style={styles.input} value={quantity} onChangeText={setQuantity} keyboardType="numeric" textAlign="center" />
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
                        <TextInput style={styles.input} value={link} onChangeText={setLink} placeholder="https://..." placeholderTextColor="#999" />

                        <Text style={styles.label}>ຮູບພາບສິນຄ້າ</Text>
                        <TouchableOpacity style={styles.imgPickBtn} onPress={pickImage}>
                            {imageUrl ? <Image source={{uri: imageUrl}} style={styles.formImg} /> : <Ionicons name="image-outline" size={40} color="#ccc" />}
                        </TouchableOpacity>

                        <Text style={styles.label}>ສະຖານະ *</Text>
                        <View style={styles.statusRow}>
                            {STATUSES.map(s => (
                                <TouchableOpacity key={s} onPress={() => setStatus(s as any)} style={[styles.statusChip, status === s && {backgroundColor: getStatusColor(s)}]}>
                                    <Text style={[styles.chipText, {color: status === s ? 'white' : '#666'}]}>{s}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                            <Text style={styles.saveBtnText}>{id ? 'ອັບເດດຄຳສັ່ງຊື້' : 'ບັນທຶກຄຳສັ່ງຊື້'}</Text>
                        </TouchableOpacity>
                    </ScrollView>
                </SafeAreaView>
            </Modal>

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
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#eee' },
    headerTitle: { fontFamily: 'Lao-Bold', fontSize: 20, color: COLORS.primary },
    addBtn: { flexDirection: 'row', backgroundColor: COLORS.primary, padding: 8, paddingHorizontal: 15, borderRadius: 10, alignItems: 'center' },
    addBtnText: { color: 'white', fontFamily: 'Lao-Bold', marginLeft: 5, fontSize: 14 },
    
    card: { backgroundColor: 'white', marginHorizontal: 15, marginTop: 15, borderRadius: 15, padding: 15, elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5 },
    cardTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
    custName: { fontFamily: 'Lao-Bold', fontSize: 16, color: COLORS.text },
    statusBadge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
    statusText: { color: 'white', fontSize: 12, fontFamily: 'Lao-Bold' },
    cardMid: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#f5f5f5', paddingBottom: 15 },
    prodImg: { width: 80, height: 80, borderRadius: 12, backgroundColor: '#f9f9f9', borderWidth: 1, borderColor: '#eee' },
    prodInfo: { flex: 1, marginLeft: 15 },
    prodName: { fontFamily: 'Lao-Bold', fontSize: 16, color: COLORS.text },
    subInfo: { fontSize: 13, color: COLORS.textLight, marginTop: 5, fontFamily: 'Lao-Regular' },
    linkText: { fontSize: 13, color: COLORS.primary, marginTop: 5, textDecorationLine: 'underline', fontFamily: 'Lao-Regular' },
    cardBot: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
    priceLabel: { fontSize: 12, color: COLORS.textLight, fontFamily: 'Lao-Regular' },
    priceVal: { fontFamily: 'Lao-Bold', color: COLORS.secondaryDark, fontSize: 18 },
    actionBtns: { flexDirection: 'row', gap: 15 },
    editBtn: { backgroundColor: '#f0fcfc', padding: 8, borderRadius: 10 },

    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#eee' },
    modalTitle: { fontSize: 22, fontFamily: 'Lao-Bold', color: COLORS.text },
    formBody: { padding: 20 },
    label: { fontFamily: 'Lao-Bold', fontSize: 15, color: COLORS.text, marginBottom: 8, marginTop: 15 },
    input: { backgroundColor: '#f9f9f9', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#eee', fontFamily: 'Lao-Regular', fontSize: 16, color: COLORS.text },
    inputText: { fontFamily: 'Lao-Regular', fontSize: 16, color: COLORS.text },
    dateInput: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f9f9f9', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#eee' },
    row: { flexDirection: 'row' },
    pickerWrapper: { flex: 1, marginTop: 5 },
    sourceChip: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 25, backgroundColor: '#f0f0f0', marginRight: 10 },
    sourceChipActive: { backgroundColor: COLORS.primary },
    chipText: { fontSize: 14, fontFamily: 'Lao-Bold' },
    imgPickBtn: { width: 120, height: 120, backgroundColor: '#f9f9f9', borderRadius: 15, justifyContent: 'center', alignItems: 'center', overflow: 'hidden', borderWidth: 1, borderColor: '#eee', marginTop: 5 },
    formImg: { width: '100%', height: '100%' },
    statusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 5 },
    statusChip: { paddingHorizontal: 15, paddingVertical: 10, borderRadius: 25, backgroundColor: '#f0f0f0' },
    saveBtn: { backgroundColor: COLORS.primary, padding: 18, borderRadius: 15, alignItems: 'center', marginTop: 35, elevation: 2 },
    saveBtnText: { color: 'white', fontFamily: 'Lao-Bold', fontSize: 18 },

    imgOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' },
    fullImg: { width: '95%', height: '85%' }
});