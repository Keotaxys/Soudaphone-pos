import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
// 🟢 ປ່ຽນການ Import ຈາກ getAuth ເປັນ initializeAuth
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { getReactNativePersistence, initializeAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyAq2zXT4AeLbbDre8lEh5KgIvq5xtoj1-o",
  authDomain: "studio-7834307833-10afa.firebaseapp.com",
  databaseURL: "https://studio-7834307833-10afa-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "studio-7834307833-10afa",
  storageBucket: "studio-7834307833-10afa.firebasestorage.app",
  messagingSenderId: "1085134944350",
  appId: "1:1085134944350:web:cdd4c563a7891c176d9ccf"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);

// Initialize Realtime Database
export const db = getDatabase(app);

// 🟢 ແກ້ໄຂການ Initialize Auth ໃຫ້ຮອງຮັບ AsyncStorage
// ວິທີນີ້ຈະເຮັດໃຫ້ສະຖານະ Login ບໍ່ຫຼຸດ ເວລາປິດແອັບ
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});