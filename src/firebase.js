import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp } from 'firebase/app';
import { getReactNativePersistence, initializeAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

// 🟢 ຢ່າລືມເອົາ Config ຂອງເຈົ້າມາໃສ່ບ່ອນນີ້ເດີ້ (ໂຕທີ່ເປັນ AIzaSy...)
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

// Initialize Auth with Persistence (ເພື່ອໃຫ້ມັນຈື່ການ Login ໄວ້)
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});

// Initialize Database
const db = getDatabase(app);

export { auth, db };
