import { Ionicons } from '@expo/vector-icons';
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
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { db } from '../../firebase';
import { COLORS } from '../../types';

// Interface ສຳລັບຂໍ້ມູນລູກຄ້າ
interface Customer {
  id: string;
  name: string;
  phone: string;
  facebookUrl?: string;
  imageUrl?: string;
  address?: string;
}

export default function CustomerScreen() {
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

  // 1. ດຶງຂໍ້ມູນລູກຄ້າຈາກ Firebase
  useEffect(() => {
    const customerRef = ref(db, 'customers');
    const unsubscribe = onValue(customerRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const list = Object.keys(data).map(key => ({ id: key, ...data[key] }));
        setCustomers(list.reverse() as Customer[]);
      } else {
        setCustomers([]);
      }
    });
    return () => unsubscribe();
  }, []);

  // 2. ຈັດການຮູບພາບ
  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      setImageUrl(`data:image/jpeg;base64,${result.assets[0].base64}`);
    }
  };

  // 3. ບັນທຶກຂໍ້ມູນ (ເພີ່ມ ຫຼື ແກ້ໄຂ)
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
      Alert.alert('Error', 'ເກີດຂໍ້ຜິດພາດໃນການບັນທຶກ');
    }
  };

  // 4. ລຶບຂໍ້ມູນ
  const handleDelete = (id: string) => {
    Alert.alert('ຢືນຢັນ', 'ຕ້ອງການລຶບຂໍ້ມູນລູກຄ້ານີ້ບໍ່?', [
      { text: 'ຍົກເລີກ', style: 'cancel' },
      { text: 'ລຶບ', style: 'destructive', onPress: async () => await remove(ref(db, `customers/${id}`)) }
    ]);
  };

  // ເປີດ Modal ແກ້ໄຂ
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

  // ເປີດ Facebook Link
  const openLink = (url?: string) => {
    if (url) {
      Linking.openURL(url).catch(() => Alert.alert('Error', 'ບໍ່ສາມາດເປີດລິ້ງໄດ້'));
    }
  };

  // ກັ່ນຕອງຂໍ້ມູນ
  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.phone.includes(searchQuery)
  );

  const renderItem = ({ item }: { item: Customer }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Image 
          source={item.imageUrl ? { uri: item.imageUrl } : { uri: 'https://via.placeholder.com/100' }} 
          style={styles.avatar} 
        />
        <View style={styles.headerInfo}>
          <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
          <View style={styles.phoneRow}>
            <Ionicons name="call" size={14} color={COLORS.primary} />
            <Text style={styles.phone}>{item.phone}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.menuBtn} onPress={() => openEditModal(item)}>
            <Ionicons name="pencil" size={18} color="#666" />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.menuBtn, {marginLeft: 8}]} onPress={() => handleDelete(item.id)}>
            <Ionicons name="trash-outline" size={18} color={COLORS.danger} />
        </TouchableOpacity>
      </View>

      <View style={styles.cardBody}>
        {item.facebookUrl ? (
            <TouchableOpacity style={styles.linkRow} onPress={() => openLink(item.facebookUrl)}>
                <Ionicons name="logo-facebook" size={18} color="#1877F2" />
                <Text style={styles.linkText} numberOfLines={1}>Facebook Profile</Text>
            </TouchableOpacity>
        ) : null}
        
        {item.address ? (
            <View style={styles.linkRow}>
                <Ionicons name="location-outline" size={18} color="#666" />
                <Text style={styles.addressText} numberOfLines={1}>{item.address}</Text>
            </View>
        ) : null}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header & Search */}
      <View style={styles.headerContainer}>
        <Text style={styles.title}>ຂໍ້ມູນລູກຄ້າ</Text>
        <Text style={styles.subtitle}>ຈັດການຖານຂໍ້ມູນລູກຄ້າຂອງທ່ານ ({customers.length})</Text>
        
        <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="#999" />
            <TextInput 
                style={styles.searchInput} 
                placeholder="ຄົ້ນຫາຊື່ ຫຼື ເບີໂທ..." 
                value={searchQuery}
                onChangeText={setSearchQuery}
            />
        </View>
      </View>

      {/* Customer List */}
      <FlatList 
        data={filteredCustomers}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 15, paddingBottom: 100 }}
        numColumns={1}
        ListEmptyComponent={
            <View style={styles.emptyContainer}>
                <Ionicons name="people-outline" size={60} color="#ddd" />
                <Text style={styles.emptyText}>ບໍ່ພົບຂໍ້ມູນລູກຄ້າ</Text>
            </View>
        }
      />

      {/* Add Button (FAB) */}
      <TouchableOpacity style={styles.fab} onPress={() => { resetForm(); setModalVisible(true); }}>
        <Ionicons name="add" size={30} color="white" />
        <Text style={styles.fabText}>ເພີ່ມລູກຄ້າໃໝ່</Text>
      </TouchableOpacity>

      {/* Modal Form */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
            <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>{isEditing ? 'ແກ້ໄຂຂໍ້ມູນ' : 'ເພີ່ມລູກຄ້າໃໝ່'}</Text>
                    <TouchableOpacity onPress={() => setModalVisible(false)}>
                        <Ionicons name="close" size={24} color="#666" />
                    </TouchableOpacity>
                </View>

                {/* Image Picker */}
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

                <TextInput style={styles.input} placeholder="ຊື່ລູກຄ້າ *" value={name} onChangeText={setName} />
                <TextInput style={styles.input} placeholder="ເບີໂທ *" keyboardType="phone-pad" value={phone} onChangeText={setPhone} />
                <TextInput style={styles.input} placeholder="Facebook URL (https://...)" value={facebookUrl} onChangeText={setFacebookUrl} autoCapitalize="none" />
                <TextInput style={styles.input} placeholder="ທີ່ຢູ່" value={address} onChangeText={setAddress} />

                <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                    <Text style={styles.saveBtnText}>ບັນທຶກຂໍ້ມູນ</Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  
  headerContainer: { backgroundColor: 'white', padding: 20, paddingBottom: 15, borderBottomLeftRadius: 20, borderBottomRightRadius: 20, elevation: 4 },
  title: { fontSize: 22, fontFamily: 'Lao-Bold', color: COLORS.primary },
  subtitle: { fontSize: 12, fontFamily: 'Lao-Regular', color: '#666', marginBottom: 15 },
  
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f5f5f5', borderRadius: 10, paddingHorizontal: 15, paddingVertical: 10 },
  searchInput: { flex: 1, marginLeft: 10, fontFamily: 'Lao-Regular', fontSize: 16 },

  card: { backgroundColor: 'white', borderRadius: 15, marginBottom: 12, elevation: 2, overflow: 'hidden' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: '#f9f9f9' },
  avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#eee' },
  headerInfo: { flex: 1, marginLeft: 15 },
  name: { fontFamily: 'Lao-Bold', fontSize: 16, color: COLORS.text },
  phoneRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 5 },
  phone: { fontFamily: 'Lao-Regular', fontSize: 13, color: '#666' },
  menuBtn: { padding: 5, backgroundColor: '#f5f5f5', borderRadius: 8 },

  cardBody: { padding: 15, backgroundColor: '#FAFAFA' },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  linkText: { fontFamily: 'Lao-Bold', color: '#1877F2', fontSize: 13 },
  addressText: { fontFamily: 'Lao-Regular', color: '#555', fontSize: 13, flex: 1 },

  fab: { position: 'absolute', bottom: 20, right: 20, backgroundColor: COLORS.secondary, flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 30, elevation: 5 },
  fabText: { color: 'white', fontFamily: 'Lao-Bold', fontSize: 16, marginLeft: 8 },

  emptyContainer: { alignItems: 'center', marginTop: 80 },
  emptyText: { marginTop: 10, color: '#ccc', fontFamily: 'Lao-Regular' },

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: 'white', borderRadius: 20, padding: 20, elevation: 5 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontFamily: 'Lao-Bold', color: COLORS.text },
  
  imagePicker: { alignSelf: 'center', marginBottom: 20 },
  placeholderImage: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#ddd', borderStyle: 'dashed' },
  previewImage: { width: 100, height: 100, borderRadius: 50 },
  uploadText: { fontSize: 12, color: '#999', marginTop: 5, fontFamily: 'Lao-Regular' },

  input: { backgroundColor: '#f9f9f9', padding: 12, borderRadius: 10, marginBottom: 10, borderWidth: 1, borderColor: '#eee', fontFamily: 'Lao-Regular' },
  
  saveBtn: { backgroundColor: COLORS.primary, padding: 15, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  saveBtnText: { color: 'white', fontFamily: 'Lao-Bold', fontSize: 16 }
});