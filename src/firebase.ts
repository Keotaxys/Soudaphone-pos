// 1. Import App ກ່ອນ
import { getApp, getApps, initializeApp } from 'firebase/app';

// 2. 🔥 Import Auth Side-effect (ສຳຄັນ! ຕ້ອງຢູ່ບ່ອນນີ້) 🔥
// ການ import ແບບນີ້ຈະບັງຄັບໃຫ້ລະບົບ Register Component 'auth' ທັນທີ
import 'firebase/auth';

// 3. Import ຟັງຊັນອື່ນໆ
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import {
  Auth,
  getAuth,
  getReactNativePersistence,
  initializeAuth
} from 'firebase/auth';
import { getDatabase } from 'firebase/database';

// Config ຂອງທ່ານ
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
let auth: Auth;

// Logic ການກວດສອບແບບ Singleton (ມາດຕະຖານທີ່ສຸດ)
if (!getApps().length) {
  // ຖ້າຍັງບໍ່ມີ App => ສ້າງໃໝ່ (Initialize)
  app = initializeApp(firebaseConfig);
  
  // Initialize Auth ພ້ອມ Persistence
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage)
  });
} else {
  // ຖ້າມີ App ແລ້ວ => ດຶງໂຕເກົ່າມາໃຊ້
  app = getApp();
  // ເນື່ອງຈາກເຮົາ import 'firebase/auth' ທາງເທິງແລ້ວ getAuth ຈະເຮັດວຽກໄດ້ປົກກະຕິ
  auth = getAuth(app);
}

const db = getDatabase(app);

export { auth, db };
export default app;