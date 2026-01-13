import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

// 🟢 ໃຊ້ @ts-ignore ເພື່ອຜ່ານ Error ເສັ້ນແດງ
// ແລະ Import ຈາກ path ນີ້ເພື່ອແກ້ໄຂບັນຫາ "Auth not registered"
// @ts-ignore
import { getReactNativePersistence, initializeAuth } from 'firebase/auth/react-native';

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
const app = initializeApp(firebaseConfig);

// Initialize Database
export const db = getDatabase(app);

// Initialize Auth
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});

export default app;