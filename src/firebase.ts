import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

// 🟢 ໃຊ້ @ts-ignore ເພື່ອບອກໃຫ້ລະບົບຮູ້ວ່າບໍ່ຕ້ອງສົນໃຈ Error ເສັ້ນແດງ
// ເຮົາຈຳເປັນຕ້ອງ Import ຈາກ path ນີ້ເພື່ອໃຫ້ Auth ເຮັດວຽກໃນມືຖືໄດ້
// @ts-ignore
import { getReactNativePersistence, initializeAuth } from 'firebase/auth/react-native';

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

// 3. Initialize Auth ພ້ອມ Persistence
// ຕັ້ງຄ່າໃຫ້ຈື່ການ Login ໂດຍໃຊ້ AsyncStorage
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});

export default app;