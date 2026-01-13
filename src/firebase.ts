import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
// 🟢 ສັງເກດ: ລຶບ /react-native ອອກຈາກທາງຫຼັງ
// ໃຫ້ import ຈາກ 'firebase/auth' ໂດຍກົງ
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
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

// 2. Initialize Realtime Database
export const db = getDatabase(app);

// 3. Initialize Auth
// ຖ້າ VS Code ຍັງຂຶ້ນເສັ້ນແດງຢູ່ກ້ອງ getReactNativePersistence ໃຫ້ໃສ່ // @ts-ignore ໄວ້ເທິງແຖວ export
// @ts-ignore 
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});

export default app;