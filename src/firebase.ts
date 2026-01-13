import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

// 🟢 ເພີ່ມ getAuth ເຂົ້າມານຳ ເພື່ອເອີ້ນໃຊ້ Auth ທີ່ມີຢູ່ແລ້ວ
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

// ປະກາດຕົວປ່ຽນໄວ້ຂ້າງນອກ
let app;
let auth;

// 🔥 Logic ແກ້ໄຂ: ກວດສອບວ່າ Firebase App ຖືກສ້າງແລ້ວຫຼືຍັງ
if (!getApps().length) {
  // 🟢 ກໍລະນີທີ 1: ຍັງບໍ່ທັນມີ App (ສ້າງໃໝ່)
  app = initializeApp(firebaseConfig);
  
  // @ts-ignore
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage)
  });
} else {
  // 🟢 ກໍລະນີທີ 2: ມີ App ຢູ່ແລ້ວ (ດຶງຕົວເກົ່າມາໃຊ້ ບໍ່ສ້າງຊ້ຳ)
  app = getApp();
  auth = getAuth(app);
}

// ໃຊ້ Database ຈາກ app ທີ່ໄດ້ມາ
const db = getDatabase(app);

// Export ອອກໄປໃຊ້
export { auth, db };
export default app;