import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
// Use // @ts-ignore to suppress the TypeScript error for the react-native sub-module
// @ts-ignore
import { initializeAuth, getReactNativePersistence } from 'firebase/auth/react-native';
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

// 1. Initialize Firebase App
const app = initializeApp(firebaseConfig);

// 2. Initialize Realtime Database and Export
export const db = getDatabase(app);

// 3. Initialize Auth with Persistence and Export
// ວິທີນີ້ຈະຊ່ວຍໃຫ້ແອັບຈື່ການ Login ຂອງຜູ້ໃຊ້ໄວ້ ເວລາປິດແລ້ວເປີດແອັບໃໝ່
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});

export default app;