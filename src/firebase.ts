import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
// 🟢 ແກ້ໄຂບ່ອນ Import ບ່ອນນີ້:
import {
  //@ts-ignore (ຖ້າຍັງຂຶ້ນແດງຢູ່)
  getReactNativePersistence,
  initializeAuth
} from 'firebase/auth';

// ⚠️ ຖ້າ Import ທາງເທິງຍັງ Error, ໃຫ້ປ່ຽນເປັນ:
// import { getReactNativePersistence } from 'firebase/auth/react-native';

import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

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

// Initialize Auth ພ້ອມຕັ້ງຄ່າ Persistence
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});