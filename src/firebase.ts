import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
// @ts-ignore
import { getAuth, getReactNativePersistence, initializeAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyAq2zXT4AeLbbDre8lEh5KgIvq5xtoj1-o",
  authDomain: "studio-7834307833-10afa.firebaseapp.com",
  databaseURL: "https://studio-7834307833-10afa-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "studio-7834307833-10afa",
  storageBucket: "studio-7834307833-10afa.firebasestorage.app",
  messagingSenderId: "1085134944350",
  appId: "1:1085134944350:web:cdd4c563a7891c176d9ccf"
};

// 1. ກວດສອບ App Instance
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

// 2. 🔥🔥🔥 SOLUTION: Reverse Logic (ດຶງກ່ອນ ຄ່ອຍສ້າງ) 🔥🔥🔥
let auth;
try {
  // ລອງດຶງ Auth ທີ່ມີຢູ່ແລ້ວອອກມາໃຊ້
  auth = getAuth(app);
} catch (error) {
  // ຖ້າມັນຟ້ອງວ່າ "auth has not been registered" (ຍັງບໍ່ມີ)
  // ໃຫ້ເຮົາສ້າງໃໝ່ເລີຍ (Initialize)
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage)
  });
}

const db = getDatabase(app);

export { auth, db };
export default app;