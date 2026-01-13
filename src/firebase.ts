import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getDatabase } from 'firebase/database';

// 🟢 1. ເພີ່ມແຖວນີ້! (ສຳຄັນ) ບັງຄັບໃຫ້ໂຫຼດ Auth Component ເພື່ອແກ້ Error "Not registered"
import 'firebase/auth'; 

// @ts-ignore
import { initializeAuth, getReactNativePersistence, getAuth } from 'firebase/auth';

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

try {
  // 🟢 2. ກວດສອບ App Instance
  if (getApps().length > 0) {
    app = getApp();
  } else {
    app = initializeApp(firebaseConfig);
  }

  // 🟢 3. ພະຍາຍາມ Initialize Auth ດ້ວຍ Persistence
  // ຖ້າມັນ Error (ເພາະມີຢູ່ແລ້ວ) ມັນຈະໄປທີ່ catch ເອງ
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage),
  });

} catch (error) {
  // 🟢 4. Recovery: ຖ້າ initialize ບໍ່ໄດ້ (Duplicate) ໃຫ້ດຶງໂຕເກົ່າ
  // Error "Not registered" ຈະຫາຍໄປເພາະເຮົາ import 'firebase/auth' ແລ້ວ
  console.log("Auth Exists, getting instance...");
  auth = getAuth(app);
}

const db = getDatabase(app);

export { auth, db };
export default app;