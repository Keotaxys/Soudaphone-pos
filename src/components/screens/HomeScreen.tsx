import { Ionicons } from '@expo/vector-icons';
import { onValue, ref } from 'firebase/database';
import React, { useEffect, useState } from 'react';
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { db } from '../../firebase';
import { COLORS, formatNumber } from '../../types';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);
  const [netProfit, setNetProfit] = useState(0);

  // ດຶງຂໍ້ມູນ Realtime ຈາກ Firebase
  useEffect(() => {
    // 1. ດຶງຍອດຂາຍ
    const salesRef = ref(db, 'sales');
    const unsubSales = onValue(salesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.values(data);
        const revenue = list.reduce((sum: number, item: any) => sum + (parseFloat(item.total) || 0), 0);
        setTotalRevenue(revenue);
        setTotalOrders(list.length);
      } else {
        setTotalRevenue(0);
        setTotalOrders(0);
      }
    });

    // 2. ດຶງລາຍຈ່າຍ
    const expRef = ref(db, 'expenses');
    const unsubExp = onValue(expRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.values(data);
        const expense = list.reduce((sum: number, item: any) => sum + (parseFloat(item.amount) || 0), 0);
        setTotalExpense(expense);
      } else {
        setTotalExpense(0);
      }
    });

    return () => {
      unsubSales();
      unsubExp();
    };
  }, []);

  // ຄຳນວນກຳໄລທຸກຄັ້ງທີ່ Revenue ຫຼື Expense ປ່ຽນ
  useEffect(() => {
    setNetProfit(totalRevenue - totalExpense);
  }, [totalRevenue, totalExpense]);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      
      <View style={styles.contentContainer}>
        {/* Welcome Text */}
        <View style={styles.welcomeSection}>
           <Text style={styles.dateText}>{new Date().toLocaleDateString('lo-LA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'})}</Text>
           <Text style={styles.welcomeTitle}>ພາບລວມມື້ນີ້</Text>
        </View>

        {/* 🟢 Grid Layout 2 Columns */}
        <View style={styles.gridContainer}>
            
            {/* Card 1: ຍອດຂາຍ (Teal ເຂັ້ມ) */}
            <View style={[styles.card, styles.cardSales]}>
                <View style={[styles.iconCircle, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                    <Ionicons name="cash" size={24} color="white" />
                </View>
                <Text style={styles.cardLabelWhite}>ຍອດຂາຍ</Text>
                <Text style={styles.cardValueWhite}>{formatNumber(totalRevenue)} ₭</Text>
            </View>

            {/* Card 2: ກຳໄລ (Teal ອ່ອນ) */}
            <View style={[styles.card, styles.cardProfit]}>
                <View style={[styles.iconCircle, { backgroundColor: 'white' }]}>
                    <Ionicons name="trending-up" size={24} color={COLORS.primary} />
                </View>
                <Text style={styles.cardLabelTeal}>ກຳໄລ</Text>
                <Text style={styles.cardValueTeal}>
                    {netProfit > 0 ? '+' : ''}{formatNumber(netProfit)}
                </Text>
            </View>

            {/* Card 3: ອໍເດີ (ສີສົ້ມ) */}
            <View style={[styles.card, styles.cardOrders]}>
                <View style={[styles.iconCircle, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                    <Ionicons name="receipt" size={24} color="white" />
                </View>
                <Text style={styles.cardLabelWhite}>ອໍເດີ</Text>
                <Text style={styles.cardValueWhite}>{totalOrders}</Text>
            </View>

            {/* Card 4: ລາຍຈ່າຍ (ສີຂາວ) */}
            <View style={[styles.card, styles.cardExpense]}>
                <View style={[styles.iconCircle, { backgroundColor: '#FFF3E0' }]}>
                    <Ionicons name="wallet" size={24} color="#F57C00" />
                </View>
                <Text style={styles.cardLabelOrange}>ລາຍຈ່າຍ</Text>
                <Text style={styles.cardValueOrange}>{formatNumber(totalExpense)}</Text>
            </View>

        </View>

        {/* Recent Activity Section (Optional) */}
        <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>ເມນູດ່ວນ</Text>
        </View>
        
        <View style={styles.quickMenu}>
            <View style={styles.quickMenuItem}>
                <Ionicons name="add-circle-outline" size={30} color={COLORS.primary} />
                <Text style={styles.quickMenuText}>ເພີ່ມສິນຄ້າ</Text>
            </View>
            <View style={styles.quickMenuItem}>
                <Ionicons name="qr-code-outline" size={30} color={COLORS.primary} />
                <Text style={styles.quickMenuText}>ສະແກນ</Text>
            </View>
            <View style={styles.quickMenuItem}>
                <Ionicons name="people-outline" size={30} color={COLORS.primary} />
                <Text style={styles.quickMenuText}>ລູກຄ້າ</Text>
            </View>
        </View>

      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F5F9FA' // ສີພື້ນຫຼັງຂອງ App
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 50,
  },
  welcomeSection: {
    marginBottom: 20,
  },
  dateText: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Lao-Regular',
  },
  welcomeTitle: {
    fontSize: 22,
    color: '#333',
    fontFamily: 'Lao-Bold',
  },

  // 🟢 Grid Styles (ຈັດ 2 ຄໍລຳ)
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between', // ຍູ້ອອກສອງຂ້າງ
    gap: 15, // ໄລຍະຫ່າງລະຫວ່າງແຖວ (ສຳລັບ Android ໃໝ່/iOS)
  },
  card: {
    width: '48%', // ແບ່ງເຄິ່ງ (ເຫຼືອ 4% ໄວ້ເປັນຊ່ອງວ່າງ)
    borderRadius: 20,
    padding: 20,
    marginBottom: 15, // ໄລຍະຫ່າງດ້ານລຸ່ມ
    elevation: 3, // ເງົາ Android
    shadowColor: '#000', // ເງົາ iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    minHeight: 140, // ຄວາມສູງຂັ້ນຕ່ຳ
    justifyContent: 'space-between'
  },
  iconCircle: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },

  // Card Colors
  cardSales: { backgroundColor: COLORS.primary },
  cardProfit: { backgroundColor: '#E0F2F1', borderWidth: 1, borderColor: COLORS.primary },
  cardOrders: { backgroundColor: '#FFB300' },
  cardExpense: { backgroundColor: 'white', borderWidth: 1, borderColor: '#eee' },

  // Text Styles
  cardLabelWhite: { fontSize: 14, color: 'rgba(255,255,255,0.8)', fontFamily: 'Lao-Regular' },
  cardValueWhite: { fontSize: 24, color: 'white', fontFamily: 'Lao-Bold' },

  cardLabelTeal: { fontSize: 14, color: COLORS.primary, fontFamily: 'Lao-Regular' },
  cardValueTeal: { fontSize: 24, color: COLORS.primary, fontFamily: 'Lao-Bold' },

  cardLabelOrange: { fontSize: 14, color: '#F57C00', fontFamily: 'Lao-Regular' },
  cardValueOrange: { fontSize: 24, color: '#F57C00', fontFamily: 'Lao-Bold' },

  // Quick Menu
  sectionHeader: { marginTop: 10, marginBottom: 15 },
  sectionTitle: { fontSize: 18, fontFamily: 'Lao-Bold', color: '#333' },
  quickMenu: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: 'white', padding: 20, borderRadius: 15, elevation: 2 },
  quickMenuItem: { alignItems: 'center', gap: 5 },
  quickMenuText: { fontSize: 12, fontFamily: 'Lao-Regular', color: '#555' }
});