import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
// 🟢 ໃຊ້ Module ຫຼັກ 'firebase/auth' ເພື່ອປ້ອງກັນ Error ຂອງ Metro Specifier
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

// 1. Initialize Firebase App
const app = initializeApp(firebaseConfig);

// 2. Initialize Realtime Database
export const db = getDatabase(app);

// 3. Initialize Auth ໂດຍໃຊ້ Manual Persistence Configuration
// ວິທີນີ້ຈະບໍ່ມີບັນຫາເລື່ອງ Missing Specifier ໃນ Firebase v11
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});

export default app;