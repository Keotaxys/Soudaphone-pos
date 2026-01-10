import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { onValue, push, ref, remove, update } from 'firebase/database';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    FlatList,
    Image,
    KeyboardAvoidingView,
    Linking,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { db } from '../../firebase';
import { COLORS, CustomerOrder, formatDate, formatNumber } from '../../types';

const SOURCES = ['ຈີນ', 'ໄທ', 'ຫວຽດ', 'ອື່ນໆ'];
const STATUSES = ['ຮັບອໍເດີ້', 'ສັ່ງເຄື່ອງແລ້ວ', 'ເຄື່ອງຮອດແລ້ວ', 'ຈັດສົ່ງສຳເລັດ'];

// 🟢 ຕ້ອງມີຄຳວ່າ export default ຢູ່ບ່ອນນີ້ເພື່ອໃຫ້ໄຟລ໌ອື່ນ Import ໄປໃຊ້ໄດ້ໂດຍກົງ
export default function OrderTrackingScreen() {
    
    const [orders, setOrders] = useState<CustomerOrder[]>([]);
    const [loading, setLoading] = useState(true);

    const [id, setId] = useState<string | null>(null);
    const [customerName, setCustomerName] = useState('');
    const [productName, setProductName] = useState('');
    const [source, setSource] = useState('ຈີນ');
    const [quantity, setQuantity] = useState('1');
    const [costPrice, setCostPrice] = useState('');
    const [salePrice, setSalePrice] = useState('');
    const [link, setLink] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [status, setStatus] = useState('ຮັບອໍເດີ້');
    const [selectedDate, setSelectedDate] = useState(new Date());

    const [showForm, setShowForm] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);

    useEffect(() => {
        const orderRef = ref(db, 'customer_orders');
        const unsubscribe = onValue(orderRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                const list = Object.keys(data).map(key => ({ id: key, ...data[key] }));
                list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                setOrders(list as CustomerOrder[]);
            } else {
                setOrders([]);
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleSave = async () => {
        if (!customerName || !productName || !salePrice) {
            Alert.alert('ຂໍ້ມູນບໍ່ຄົບ', 'ກະລຸນາໃສ່ຊື່ລູກຄ້າ, ສິນຄ້າ ແລະ ລາຄາຂາຍ');
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
            if (id) {
                await update(ref(db, `customer_orders/${id}`), orderData);
            } else {
                await push(ref(db, 'customer_orders'), orderData);
            }
            resetForm();
            setShowForm(false);
        } catch (error) {
            Alert.alert('Error', 'ເກີດຂໍ້ຜິດພາດ');
        }
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

    const handleDelete = (deleteId: string) => {
        Alert.alert('ຢືນຢັນ', 'ລຶບລາຍການນີ້ແທ້ບໍ່?', [
            { text: 'ຍົກເລີກ', style: 'cancel' },
            { text: 'ລຶບ', style: 'destructive', onPress: async () => await remove(ref(db, `customer_orders/${deleteId}`)) }
        ]);
    };

    const cycleStatus = async (item: CustomerOrder) => {
        const currentIndex = STATUSES.indexOf(item.status);
        const nextIndex = (currentIndex + 1) % STATUSES.length;
        const nextStatus = STATUSES[nextIndex];
        await update(ref(db, `customer_orders/${item.id}`), { status: nextStatus });
    };

    const resetForm = () => {
        setId(null);
        setCustomerName('');
        setProductName('');
        setSource('ຈີນ');
        setQuantity('1');
        setCostPrice('');
        setSalePrice('');
        setLink('');
        setImageUrl('');
        setStatus('ຮັບອໍເດີ້');
        setSelectedDate(new Date());
    };

    const getStatusColor = (s: string) => {
        switch (s) {
            case 'ຮັບອໍເດີ້': return '#FFB74D';
            case 'ສັ່ງເຄື່ອງແລ້ວ': return '#64B5F6';
            case 'ເຄື່ອງຮອດແລ້ວ': return '#BA68C8';
            case 'ຈັດສົ່ງສຳເລັດ': return '#81C784';
            default: return '#ccc';
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>📦 ຕິດຕາມຄຳສັ່ງຊື້ ({orders.length})</Text>
                <TouchableOpacity style={styles.addBtn} onPress={() => { resetForm(); setShowForm(true); }}>
                    <Ionicons name="add" size={24} color="white" />
                    <Text style={styles.addBtnText}>ເພີ່ມອໍເດີ</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={orders}
                keyExtractor={item => item.id!}
                contentContainerStyle={{ padding: 15, paddingBottom: 100 }}
                renderItem={({ item }) => (
                    <View style={styles.card}>
                        <View style={styles.cardHeader}>
                            <View style={styles.dateBadge}><Text style={styles.dateText}>{formatDate(new Date(item.date))}</Text></View>
                            <TouchableOpacity onPress={() => cycleStatus(item)}>
                                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}><Text style={styles.statusText}>{item.status}</Text></View>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.cardBody}>
                            <Image source={item.imageUrl ? { uri: item.imageUrl } : { uri: 'https://via.placeholder.com/150' }} style={styles.cardImage} />
                            <View style={{ flex: 1, marginLeft: 12 }}>
                                <Text style={styles.productName}>{item.productName}</Text>
                                <Text style={styles.customerText}>👤 {item.customerName}</Text>
                                <Text style={styles.sourceText}>🚩 ແຫຼ່ງ: {item.source}</Text>
                            </View>
                        </View>
                        <View style={styles.cardFooter}>
                            <Text style={styles.priceText}>{formatNumber(item.salePrice)} ₭</Text>
                            <View style={styles.actionIcons}>
                                <TouchableOpacity onPress={() => handleEdit(item)}><Ionicons name="pencil" size={18} color={COLORS.primary} /></TouchableOpacity>
                                <TouchableOpacity onPress={() => handleDelete(item.id!)}><Ionicons name="trash-outline" size={18} color={COLORS.danger} /></TouchableOpacity>
                            </View>
                        </View>
                    </View>
                )}
            />

            <Modal visible={showForm} animationType="slide" transparent={true}>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{id ? 'ແກ້ໄຂອໍເດີ' : 'ເພີ່ມອໍເດີໃໝ່'}</Text>
                            <TouchableOpacity onPress={() => setShowForm(false)}><Ionicons name="close-circle" size={30} color="#ccc" /></TouchableOpacity>
                        </View>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
                                {imageUrl ? <Image source={{ uri: imageUrl }} style={{ width: '100%', height: '100%' }} /> : <Ionicons name="camera" size={30} color="#ccc" />}
                            </TouchableOpacity>
                            <Text style={styles.label}>ຊື່ລູກຄ້າ *</Text>
                            <TextInput style={styles.input} value={customerName} onChangeText={setCustomerName} />
                            <Text style={styles.label}>ສິນຄ້າ *</Text>
                            <TextInput style={styles.input} value={productName} onChangeText={setProductName} />
                            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}><Text style={styles.saveBtnText}>ບັນທຶກ</Text></TouchableOpacity>
                        </ScrollView>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, backgroundColor: 'white' },
    headerTitle: { fontFamily: 'Lao-Bold', fontSize: 18, color: COLORS.primaryDark },
    addBtn: { flexDirection: 'row', backgroundColor: COLORS.primary, padding: 8, paddingHorizontal: 15, borderRadius: 20, alignItems: 'center' },
    addBtnText: { color: 'white', fontFamily: 'Lao-Bold', marginLeft: 5 },
    card: { backgroundColor: 'white', borderRadius: 12, marginBottom: 12, padding: 12 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    dateBadge: { backgroundColor: '#f0f0f0', paddingHorizontal: 8, borderRadius: 4 },
    dateText: { fontSize: 10, color: '#666' },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    statusText: { color: 'white', fontSize: 10, fontFamily: 'Lao-Bold' },
    cardBody: { flexDirection: 'row', alignItems: 'center' },
    cardImage: { width: 60, height: 60, borderRadius: 8 },
    productName: { fontFamily: 'Lao-Bold', fontSize: 16 },
    customerText: { fontSize: 12, color: '#666', fontFamily: 'Lao-Regular' },
    sourceText: { fontSize: 12, color: '#888' },
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
    priceText: { fontFamily: 'Lao-Bold', color: COLORS.secondaryDark, fontSize: 16 },
    actionIcons: { flexDirection: 'row', gap: 15 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: 'white', height: '80%', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    modalTitle: { fontFamily: 'Lao-Bold', fontSize: 20 },
    imagePicker: { width: 100, height: 100, backgroundColor: '#f5f5f5', borderRadius: 10, alignSelf: 'center', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
    label: { fontFamily: 'Lao-Bold', marginBottom: 5 },
    input: { backgroundColor: '#f9f9f9', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#eee', marginBottom: 15 },
    saveBtn: { backgroundColor: COLORS.primary, padding: 15, borderRadius: 12, alignItems: 'center' },
    saveBtnText: { color: 'white', fontFamily: 'Lao-Bold' }
});