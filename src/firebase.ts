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

let app;
let auth;

// 1. ກວດສອບ ແລະ ສ້າງ App
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

// 2. 🔥🔥🔥 SOLUTION: ໃຊ້ Try-Catch ເພື່ອແກ້ບັນຫາ Auth Error 🔥🔥🔥
try {
  // ພະຍາຍາມ Initialize Auth ໃໝ່ (ສຳລັບຄັ້ງທຳອິດ)
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage)
  });
} catch (error) {
  // ຖ້າເກີດ Error (ເຊັ່ນ: ມີ Auth ຢູ່ແລ້ວ ຫຼື ບັນຫາ Registered)
  // ໃຫ້ດຶງເອົາ Auth instance ທີ່ມີຢູ່ແລ້ວມາໃຊ້ແທນ
  auth = getAuth(app);
}

const db = getDatabase(app);

export { auth, db };
export default app;