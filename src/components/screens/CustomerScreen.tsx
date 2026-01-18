import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { onValue, push, ref, remove, update } from 'firebase/database';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Dimensions,
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
// 🟢 1. ໃຊ້ SafeAreaView ຈາກ library ໃໝ່
import { SafeAreaView } from 'react-native-safe-area-context';

import { db } from '../../firebase';
// 🟢 2. Import Hook
import { useAuth } from '../../hooks/useAuth';
import { COLORS } from '../../types';

const { width } = Dimensions.get('window');
const CARD_GAP = 10;
const CARD_WIDTH = (width - 30 - CARD_GAP) / 2;

interface Customer {
  id: string;
  name: string;
  phone: string;
  facebookUrl?: string;
  imageUrl?: string;
  address?: string;
}

export default function CustomerScreen() {
  // 🟢 3. ເອີ້ນໃຊ້ Hook
  const { hasPermission } = useAuth();

  // --- State (ປະກາດໄວ້ເທິງສຸດ) ---
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // Form States
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [facebookUrl, setFacebookUrl] = useState('');
  const [address, setAddress] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  // 🟢 4. useEffect ດຶງຂໍ້ມູນ (ວາງໄວ້ບ່ອນນີ້)
  useEffect(() => {
    // ຖ້າບໍ່ມີສິດ ກໍບໍ່ຕ້ອງດຶງ (ແຕ່ Hook ຍັງທຳງານຢູ່ ບໍ່ຜິດກົດ)
    if (!hasPermission('accessCustomers')) return;

    const customerRef = ref(db, 'customers');
    const unsubscribe = onValue(customerRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const list = Object.keys(data).map(key => ({ id: key, ...data[key] }));
        
        console.log(`✅ Customers Loaded: ${list.length} items`); // Debug Log
        setCustomers(list.reverse() as Customer[]);
      } else {
        console.log("⚠️ No Customers Found");
        setCustomers([]);
      }
    }, (error) => {
        console.error("Customer Load Error:", error); 
    });
    return () => unsubscribe();
  }, []);

  // --- Functions ---
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('ຕ້ອງການສິດ', 'ກະລຸນາອະນຸຍາດໃຫ້ເຂົ້າເຖິງຮູບພາບ');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.3, 
      base64: true, 
    });

    if (!result.canceled && result.assets[0].base64) {
      const base64Img = `data:image/jpeg;base64,${result.assets[0].base64}`;
      setImageUrl(base64Img); 
    }
  };

  const handleSave = async () => {
    if (!name || !phone) {
      Alert.alert('ຂໍ້ມູນບໍ່ຄົບ', 'ກະລຸນາໃສ່ຊື່ ແລະ ເບີໂທ');
      return;
    }

    const customerData = { name, phone, facebookUrl, address, imageUrl };

    try {
      if (isEditing && currentId) {
        await update(ref(db, `customers/${currentId}`), customerData);
        Alert.alert('ສຳເລັດ', 'ແກ້ໄຂຂໍ້ມູນຮຽບຮ້ອຍ');
      } else {
        await push(ref(db, 'customers'), customerData);
        Alert.alert('ສຳເລັດ', 'ເພີ່ມລູກຄ້າໃໝ່ຮຽບຮ້ອຍ');
      }
      setModalVisible(false);
      resetForm();
    } catch (error) {
      Alert.alert('Error', 'ບັນທຶກບໍ່ໄດ້ (ຮູບພາບອາດຈະໃຫຍ່ເກີນໄປ)');
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert('ຢືນຢັນ', 'ຕ້ອງການລຶບຂໍ້ມູນລູກຄ້ານີ້ບໍ່?', [
      { text: 'ຍົກເລີກ', style: 'cancel' },
      { text: 'ລຶບ', style: 'destructive', onPress: async () => await remove(ref(db, `customers/${id}`)) }
    ]);
  };

  const openEditModal = (customer: Customer) => {
    setCurrentId(customer.id);
    setName(customer.name);
    setPhone(customer.phone);
    setFacebookUrl(customer.facebookUrl || '');
    setAddress(customer.address || '');
    setImageUrl(customer.imageUrl || '');
    setIsEditing(true);
    setModalVisible(true);
  };

  const resetForm = () => {
    setCurrentId(null);
    setName('');
    setPhone('');
    setFacebookUrl('');
    setAddress('');
    setImageUrl('');
    setIsEditing(false);
  };

  const openLink = (url?: string) => {
    if (url) {
      Linking.openURL(url).catch(() => Alert.alert('Error', 'ບໍ່ສາມາດເປີດລິ້ງໄດ້'));
    }
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.phone.includes(searchQuery)
  );

  const renderItem = ({ item }: { item: Customer }) => (
    <View style={styles.businessCard}>
      <View style={styles.imageContainer}>
        {item.imageUrl ? (
            <Image source={{ uri: item.imageUrl }} style={styles.coverImage} />
        ) : (
            <View style={styles.placeholderCover}>
                <Ionicons name="person" size={40} color="#ccc" />
            </View>
        )}
        <View style={styles.floatingActions}>
            <TouchableOpacity style={styles.actionBtn} onPress={() => openEditModal(item)}>
                <Ionicons name="pencil" size={14} color={COLORS.primary} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, {marginTop: 5}]} onPress={() => handleDelete(item.id)}>
                <Ionicons name="trash" size={14} color={COLORS.danger} /> 
            </TouchableOpacity>
        </View>
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
        <View style={styles.detailRow}>
            <Ionicons name="call" size={14} color={COLORS.textLight} />
            <Text style={styles.detailText} numberOfLines={1}>{item.phone}</Text>
        </View>
        {item.address ? (
            <View style={styles.detailRow}>
                <Ionicons name="location" size={14} color={COLORS.textLight} />
                <Text style={styles.detailText} numberOfLines={1}>{item.address}</Text>
            </View>
        ) : null}
        {item.facebookUrl ? (
            <TouchableOpacity style={styles.fbButton} onPress={() => openLink(item.facebookUrl)}>
                <Ionicons name="logo-facebook" size={16} color="#1877F2" />
                <Text style={styles.fbText}>Facebook</Text>
            </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );

  const ListHeader = () => (
    <View style={styles.headerContainer}>
        <Text style={styles.title}>ຂໍ້ມູນລູກຄ້າ</Text>
        <Text style={styles.subtitle}>ທັງໝົດ ({customers.length}) ທ່ານ</Text>
        <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="#999" />
            <TextInput 
                style={styles.searchInput} 
                placeholder="ຄົ້ນຫາ..." 
                value={searchQuery}
                onChangeText={setSearchQuery}
            />
        </View>
    </View>
  );

  // 🟢 5. ກວດສອບສິດ (Security Check) - ວາງໄວ້ລຸ່ມສຸດ ຫຼັງ Hooks
  if (!hasPermission('accessCustomers')) {
      return (
          <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F9FA'}}>
              <Ionicons name="lock-closed-outline" size={50} color="#ccc" />
              <Text style={{fontFamily: 'Lao-Bold', fontSize: 18, color: '#666', marginTop: 10}}>
                  ທ່ານບໍ່ມີສິດເຂົ້າເຖິງຂໍ້ມູນລູກຄ້າ
              </Text>
          </View>
      );
  }

  return (
    <SafeAreaView style={styles.container}>
      
      <FlatList 
        data={filteredCustomers}
        keyExtractor={item => item.id}
        ListHeaderComponent={ListHeader}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 15, paddingBottom: 100 }}
        numColumns={2}
        columnWrapperStyle={{ justifyContent: 'space-between' }} 
        ListEmptyComponent={
            <View style={styles.emptyContainer}>
                <Ionicons name="people-outline" size={60} color="#ddd" />
                <Text style={styles.emptyText}>ບໍ່ພົບຂໍ້ມູນລູກຄ້າ</Text>
            </View>
        }
      />

      <TouchableOpacity 
        style={styles.fab} 
        onPress={() => { resetForm(); setModalVisible(true); }}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={30} color="white" />
        <Text style={styles.fabText}>ເພີ່ມ</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
            <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>{isEditing ? 'ແກ້ໄຂຂໍ້ມູນ' : 'ເພີ່ມລູກຄ້າໃໝ່'}</Text>
                    <TouchableOpacity onPress={() => setModalVisible(false)}>
                        <Ionicons name="close" size={24} color="#666" />
                    </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false}>
                    <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
                        {imageUrl ? (
                            <Image source={{ uri: imageUrl }} style={styles.previewImage} />
                        ) : (
                            <View style={styles.placeholderImage}>
                                <Ionicons name="camera" size={30} color="#ccc" />
                                <Text style={styles.uploadText}>ເພີ່ມຮູບ</Text>
                            </View>
                        )}
                    </TouchableOpacity>

                    <Text style={styles.inputLabel}>ຊື່ລູກຄ້າ <Text style={{color:'red'}}>*</Text></Text>
                    <TextInput 
                        style={styles.input} 
                        placeholder="ປ້ອນຊື່ລູກຄ້າ..." 
                        placeholderTextColor="#999" 
                        value={name} 
                        onChangeText={setName} 
                    />

                    <Text style={styles.inputLabel}>ເບີໂທ <Text style={{color:'red'}}>*</Text></Text>
                    <TextInput 
                        style={styles.input} 
                        placeholder="ປ້ອນເບີໂທຕິດຕໍ່..." 
                        placeholderTextColor="#999"
                        keyboardType="phone-pad" 
                        value={phone} 
                        onChangeText={setPhone} 
                    />

                    <Text style={styles.inputLabel}>Facebook URL</Text>
                    <TextInput 
                        style={styles.input} 
                        placeholder="ວາງລິ້ງ Facebook..." 
                        placeholderTextColor="#999"
                        value={facebookUrl} 
                        onChangeText={setFacebookUrl} 
                        autoCapitalize="none" 
                    />

                    <Text style={styles.inputLabel}>ທີ່ຢູ່</Text>
                    <TextInput 
                        style={[styles.input, {height: 80, textAlignVertical: 'top'}]} 
                        placeholder="ປ້ອນທີ່ຢູ່..." 
                        placeholderTextColor="#999"
                        value={address} 
                        onChangeText={setAddress} 
                        multiline
                    />

                    <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                        <Text style={styles.saveBtnText}>ບັນທຶກຂໍ້ມູນ</Text>
                    </TouchableOpacity>
                    <View style={{height: 20}} />
                </ScrollView>
            </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  headerContainer: { paddingBottom: 15, backgroundColor: COLORS.background }, 
  title: { fontSize: 20, fontFamily: 'Lao-Bold', color: COLORS.primary },
  subtitle: { fontSize: 12, fontFamily: 'Lao-Regular', color: '#666', marginBottom: 15 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderRadius: 10, paddingHorizontal: 15, paddingVertical: 10, borderWidth: 1, borderColor: '#eee' }, 
  searchInput: { flex: 1, marginLeft: 10, fontFamily: 'Lao-Regular', fontSize: 14 },
  
  businessCard: { width: CARD_WIDTH, backgroundColor: 'white', borderRadius: 12, marginBottom: 15, elevation: 3, overflow: 'hidden', borderWidth: 1, borderColor: '#eee' },
  imageContainer: { width: '100%', height: 120, backgroundColor: '#f0f0f0', position: 'relative' },
  coverImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  placeholderCover: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center', backgroundColor: '#e0e0e0' },
  floatingActions: { position: 'absolute', top: 5, right: 5 },
  actionBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.9)', justifyContent: 'center', alignItems: 'center', elevation: 2 },
  infoContainer: { padding: 10 },
  cardName: { fontFamily: 'Lao-Bold', fontSize: 14, color: COLORS.text, marginBottom: 5 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 4 },
  detailText: { fontFamily: 'Lao-Regular', fontSize: 11, color: '#555' },
  fbButton: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 8, backgroundColor: '#E3F2FD', padding: 5, borderRadius: 6, justifyContent: 'center' },
  fbText: { fontFamily: 'Lao-Bold', color: '#1877F2', fontSize: 11 },
  
  fab: { 
    position: 'absolute', 
    bottom: 90, 
    right: 20, 
    backgroundColor: COLORS.primary, // Teal
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: 12, 
    paddingHorizontal: 20, 
    borderRadius: 30, 
    elevation: 5,
    zIndex: 999 
  },
  fabText: { color: 'white', fontFamily: 'Lao-Bold', fontSize: 16, marginLeft: 5 },
  
  emptyContainer: { alignItems: 'center', marginTop: 80 },
  emptyText: { marginTop: 10, color: '#ccc', fontFamily: 'Lao-Regular' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: 'white', borderRadius: 20, padding: 20, elevation: 5, maxHeight: '80%' }, // Limit height for scroll
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontFamily: 'Lao-Bold', color: COLORS.text },
  imagePicker: { alignSelf: 'center', marginBottom: 20 },
  placeholderImage: { width: 100, height: 100, borderRadius: 10, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#ddd', borderStyle: 'dashed' },
  previewImage: { width: 100, height: 100, borderRadius: 10 },
  uploadText: { fontSize: 12, color: '#999', marginTop: 5, fontFamily: 'Lao-Regular' },
  
  inputLabel: { fontFamily: 'Lao-Bold', fontSize: 14, color: COLORS.text, marginBottom: 5, marginTop: 5 },
  input: { backgroundColor: '#f9f9f9', padding: 12, borderRadius: 10, marginBottom: 5, borderWidth: 1, borderColor: '#eee', fontFamily: 'Lao-Regular', color: '#333' },
  
  saveBtn: { backgroundColor: COLORS.primary, padding: 15, borderRadius: 12, alignItems: 'center', marginTop: 15 },
  saveBtnText: { color: 'white', fontFamily: 'Lao-Bold', fontSize: 16 }
});