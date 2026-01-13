import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
// 🟢 1. Import Auth ແລະ Persistence
import {
  getAuth,
  getReactNativePersistence,
  initializeAuth
} from 'firebase/auth';

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

// 🟢 2. ກວດສອບ App Instance
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

// 🟢 3. ພະຍາຍາມ Initialize Auth ແບບຈື່ຈຳ (Persistence)
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage)
  });
} catch (error) {
  // ຖ້າມີ Auth ຢູ່ແລ້ວ (Duplicate) ໃຫ້ດຶງໂຕເກົ່າມາໃຊ້
  auth = getAuth(app);
}

const db = getDatabase(app);

export { auth, db };
export default app;