import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getDatabase } from 'firebase/database';
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

// 1. ກວດສອບ ແລະ ດຶງ App Instance
// ຖ້າມີ App ຢູ່ແລ້ວ ໃຫ້ດຶງມາໃຊ້ (getApp), ຖ້າບໍ່ມີ ໃຫ້ສ້າງໃໝ່ (initializeApp)
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// 2. 🔥🔥🔥 ແກ້ໄຂ: ດຶງກ່ອນ ແລ້ວຄ່ອຍສ້າງ (Try GET First) 🔥🔥🔥
let auth;
try {
  // ລອງດຶງ Auth ທີ່ມີຢູ່ແລ້ວກ່ອນ (ຖ້າມັນມີ ມັນຈະຜ່ານບ່ອນນີ້)
  auth = getAuth(app);
} catch (error) {
  // ຖ້າດຶງບໍ່ໄດ້ (Error "Not registered") -> ແປວ່າເຮົາຕ້ອງສ້າງມັນຂຶ້ນມາໃໝ່
  // ໃຫ້ໂຄດ initializeAuth ຢູ່ໃນ catch ເທົ່ານັ້ນ!
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage)
  });
}

const db = getDatabase(app);

export { auth, db };
export default app;