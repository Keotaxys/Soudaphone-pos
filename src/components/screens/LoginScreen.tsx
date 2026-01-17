import { Ionicons } from '@expo/vector-icons';
import { signInWithEmailAndPassword } from 'firebase/auth';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native';
import { auth } from '../../firebase';
// ຖ້າບໍ່ມີໄຟລ໌ types ໃຫ້ລຶບແຖວນີ້ອອກ ແລ້ວໃຊ້ສີ #008B94 ແທນ COLORS.primary
import { COLORS } from '../../types';

// 🟢 1. ກຳນົດ Type ຂອງ Props ທີ່ສົ່ງມາຈາກ index.tsx
interface LoginScreenProps {
  onLoginSuccess: () => void;
}

// 🟢 2. ຮັບ onLoginSuccess ເຂົ້າມາໃນ Component
export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [email, setEmail] = useState(''); // ໃສ່ Default ເພື່ອທົດສອບ
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('ແຈ້ງເຕືອນ', 'ກະລຸນາໃສ່ Email ແລະ ລະຫັດຜ່ານ');
      return;
    }

    setLoading(true);
    try {
      // Login ກັບ Firebase
      await signInWithEmailAndPassword(auth, email, password);
      
      // 🟢 3. ສຳຄັນຫຼາຍ! ເມື່ອ Login ຜ່ານ ຕ້ອງສັ່ງໃຫ້ App ຮູ້
      console.log("Login Success! Switching screen...");
      onLoginSuccess(); 

    } catch (error: any) {
      console.error(error);
      let msg = 'ເຂົ້າສູ່ລະບົບບໍ່ສຳເລັດ';
      if (error.code === 'auth/invalid-email') msg = 'ຮູບແບບ Email ບໍ່ຖືກຕ້ອງ';
      if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') msg = 'Email ຫຼື ລະຫັດຜ່ານບໍ່ຖືກຕ້ອງ';
      if (error.code === 'auth/wrong-password') msg = 'ລະຫັດຜ່ານບໍ່ຖືກຕ້ອງ';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
          style={styles.content}
        >
          {/* Logo Section */}
          <View style={styles.logoSection}>
            <View style={styles.logoCircle}>
              <Ionicons name="cart" size={50} color="white" />
            </View>
            <Text style={styles.appTitle}>Soudaphone POS</Text>
            <Text style={styles.appSubTitle}>ລະບົບຈັດການຮ້ານທີ່ທັນສະໄໝ</Text>
          </View>

          {/* Form Section */}
          <View style={styles.formContainer}>
            <Text style={styles.loginText}>ເຂົ້າສູ່ລະບົບ (Login)</Text>

            {/* Email Input */}
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="ອີເມວ (Email)"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
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
              <Text style={styles.footerText}>ຍັງບໍ່ມີບັນຊີ? ຕິດຕໍ່ Admin</Text>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS?.primary || '#008B94' },
  content: { flex: 1, justifyContent: 'center', padding: 20 },
  
  logoSection: { alignItems: 'center', marginBottom: 40 },
  logoCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  
  // 🟢 ປັບ Font ຫົວຂໍ້
  appTitle: { fontSize: 28, fontFamily: 'Lao-Bold', color: 'white' },
  appSubTitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)', fontFamily: 'Lao-Regular' },

  formContainer: { backgroundColor: 'white', borderRadius: 20, padding: 25, elevation: 5 },
  
  // 🟢 ປັບ Font ຂໍ້ຄວາມ Login
  loginText: { fontSize: 20, fontFamily: 'Lao-Bold', color: '#333', marginBottom: 20, textAlign: 'center' },
  
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9f9f9', borderRadius: 12, paddingHorizontal: 15, marginBottom: 15, borderWidth: 1, borderColor: '#eee', height: 55 },
  inputIcon: { marginRight: 10 },
  
  // 🟢 ປັບ Font Input
  input: { flex: 1, fontSize: 16, height: '100%', fontFamily: 'Lao-Regular' },
  
  loginBtn: { backgroundColor: COLORS?.primary || '#008B94', borderRadius: 12, height: 55, justifyContent: 'center', alignItems: 'center', marginTop: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 5 },
  
  // 🟢 ປັບ Font ປຸ່ມ
  loginBtnText: { color: 'white', fontFamily: 'Lao-Bold', fontSize: 18 },
  
  footer: { marginTop: 20, alignItems: 'center' },
  
  // 🟢 ປັບ Font Footer
  footerText: { color: '#999', fontSize: 12, fontFamily: 'Lao-Regular' }
});