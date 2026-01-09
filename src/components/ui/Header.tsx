import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS } from '../../types';

interface HeaderProps {
  onMenuPress: () => void;
}

export default function Header({ onMenuPress }: HeaderProps) {
  return (
    <View>
      <View style={styles.topHeader}>
          <Text style={styles.appName}>Soudaphone POS</Text>
          <View style={{flexDirection: 'row', gap: 15}}>
             <Ionicons name="notifications-outline" size={24} color="white" />
             <Ionicons name="menu" size={24} color="white" onPress={onMenuPress} />
          </View>
      </View>

      <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
             <Text style={styles.avatarText}>S</Text>
          </View>
          <View style={{justifyContent: 'center'}}>
              <Text style={styles.shopName}>ຮ້ານ ສຸດາພອນ</Text>
              <Text style={styles.shopId}>ID: 8888 9999</Text>
          </View>
          <TouchableOpacity style={styles.editProfileBtn}>
              <Text style={{fontSize: 12, color: '#666'}}>ແກ້ໄຂ</Text>
          </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  topHeader: { backgroundColor: COLORS.primary, paddingHorizontal: 20, paddingTop: 50, paddingBottom: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  appName: { color: 'white', fontSize: 20, fontFamily: 'Lao-Bold' },
  profileSection: { backgroundColor: 'white', padding: 15, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#eee' },
  avatarContainer: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#eee', justifyContent: 'center', alignItems: 'center', marginRight: 15, overflow: 'hidden' },
  avatarText: { fontSize: 24, fontWeight: 'bold', color: COLORS.primary },
  shopName: { fontSize: 16, fontFamily: 'Lao-Bold', color: '#333' },
  shopId: { fontSize: 14, color: '#666', fontFamily: 'Lao-Regular' },
  editProfileBtn: { position: 'absolute', right: 20, backgroundColor: '#f0f0f0', paddingHorizontal: 15, paddingVertical: 5, borderRadius: 20 },
});