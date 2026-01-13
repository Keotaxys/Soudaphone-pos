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

// 1. ກວດສອບ ແລະ ດຶງ App Instance ມາກ່ອນ
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// 2. 🔥🔥🔥 SOLUTION: Try GET First, Then Initialize 🔥🔥🔥
// ວິທີນີ້ຈະບໍ່ເກີດ Error "auth has not been registered"
let auth;
try {
  // ລອງດຶງ Auth ທີ່ມີຢູ່ແລ້ວກ່ອນ
  auth = getAuth(app);
} catch (error) {
  // ຖ້າດຶງບໍ່ໄດ້ (ແປວ່າບໍ່ທັນມີ ຫຼື ບໍ່ທັນ Register) -> ໃຫ້ສ້າງໃໝ່
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage)
  });
}

const db = getDatabase(app);

export { auth, db };
export default app;