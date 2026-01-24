import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView, // 🟢 1. Import ScrollView ເພີ່ມ
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../hooks/useAuth';
import { COLORS } from '../../types';

interface LoginScreenProps {
  onLoginSuccess: () => void;
}

export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const { login, loading } = useAuth();
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('ແຈ້ງເຕືອນ', 'ກະລຸນາໃສ່ ຊື່ຜູ້ໃຊ້ ແລະ ລະຫັດຜ່ານ');
      return;
    }

    const success = await login(username, password);
    
    if (success) {
      onLoginSuccess();
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView style={styles.container}>
        {/* 🟢 2. ໃຊ້ KeyboardAvoidingView ຫຸ້ມໄວ້ຊັ້ນນອກ */}
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
          style={{ flex: 1 }}
        >
          {/* 🟢 3. ໃຊ້ ScrollView ຫຸ້ມເນື້ອຫາທັງໝົດ */}
          <ScrollView 
            contentContainerStyle={styles.scrollContent} 
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled" // ໃຫ້ກົດປຸ່ມໄດ້ເລີຍໂດຍບໍ່ຕ້ອງປິດຄີບອດກ່ອນ
          >
            
            {/* Logo Section */}
            <View style={styles.logoSection}>
              <View style={styles.logoCircle}>
                <Ionicons name="cart" size={50} color="white" />
              </View>
              {/* ປ່ຽນຊື່ເປັນ Keota ໃຫ້ເລີຍ */}
              <Text style={styles.appTitle}>Keota POS</Text>
              <Text style={styles.appSubTitle}>ລະບົບຈັດການຮ້ານທີ່ທັນສະໄໝ</Text>
            </View>

            {/* Form Section */}
            <View style={styles.formContainer}>
              <Text style={styles.loginText}>ເຂົ້າສູ່ລະບົບ (Login)</Text>

              {/* Username Input */}
              <View style={styles.inputWrapper}>
                <Ionicons name="person-outline" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="ຊື່ຜູ້ໃຊ້ (Username)"
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                />
              </View>

              {/* Password Input */}
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="ລະຫັດຜ່ານ (Password)"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  keyboardType="default" 
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#666" />
                </TouchableOpacity>
              </View>

              {/* Login Button */}
              <TouchableOpacity style={styles.loginBtn} onPress={handleLogin} disabled={loading}>
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.loginBtnText}>ເຂົ້າສູ່ລະບົບ</Text>
                )}
              </TouchableOpacity>

              <View style={styles.footer}>
                <Text style={styles.footerText}>ຕິດຂັດບັນຫາ? ຕິດຕໍ່ Admin</Text>
              </View>
            </View>

          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS?.primary || '#008B94' },
  
  // 🟢 4. ປັບ Style ສຳລັບ ScrollView ໃຫ້ຈັດກາງ
  scrollContent: { 
    flexGrow: 1, 
    justifyContent: 'center', 
    padding: 20 
  },
  
  logoSection: { alignItems: 'center', marginBottom: 40 },
  logoCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  
  appTitle: { fontSize: 28, fontFamily: 'Lao-Bold', color: 'white' },
  appSubTitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)', fontFamily: 'Lao-Regular' },

  formContainer: { backgroundColor: 'white', borderRadius: 20, padding: 25, elevation: 5 },
  
  loginText: { fontSize: 20, fontFamily: 'Lao-Bold', color: '#333', marginBottom: 20, textAlign: 'center' },
  
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9f9f9', borderRadius: 12, paddingHorizontal: 15, marginBottom: 15, borderWidth: 1, borderColor: '#eee', height: 55 },
  inputIcon: { marginRight: 10 },
  
  input: { flex: 1, fontSize: 16, height: '100%', fontFamily: 'Lao-Regular' },
  
  loginBtn: { backgroundColor: COLORS?.primary || '#008B94', borderRadius: 12, height: 55, justifyContent: 'center', alignItems: 'center', marginTop: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 5 },
  
  loginBtnText: { color: 'white', fontFamily: 'Lao-Bold', fontSize: 18 },
  
  footer: { marginTop: 20, alignItems: 'center' },
  footerText: { color: '#999', fontSize: 12, fontFamily: 'Lao-Regular' }
});