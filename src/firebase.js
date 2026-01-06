// src/firebase.js
import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

// 🔴 ວາງ Config ຈາກໂປຣເຈັກເກົ່າໃສ່ບ່ອນນີ້
const firebaseConfig = {
    apiKey: "AIzaSyAq2zXT4AeLbbDre8lEh5KgIvq5xtoj1-o",
    authDomain: "studio-7834307833-10afa.firebaseapp.com",
    databaseURL: "https://studio-7834307833-10afa-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "studio-7834307833-10afa",
    storageBucket: "studio-7834307833-10afa.firebasestorage.app",
    messagingSenderId: "1085134944350",
    appId: "1:1085134944350:web:cdd4c563a7891c176d9ccf"
  };
  
// ເລີ່ມຕົ້ນ Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export { db };
// 🟢 ເພີ່ມ getAuth
import { getAuth } from 'firebase/auth';
// 🟢 (ສຳຄັນ) ເພີ່ມ ReactNativeAsyncStorage ເພື່ອໃຫ້ Login ຄ້າງໄວ້ໄດ້ (ຖ້າບໍ່ມີກໍບໍ່ເປັນຫຍັງສຳລັບຂັ້ນຕອນນີ້)

const firebaseConfig = {
  // ... (Config ເດີມຂອງເຈົ້າ ບໍ່ຕ້ອງປ່ຽນ) ...
  apiKey: "AIzaSy...", 
  authDomain: "...",
  databaseURL: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "..."
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// 🟢 Initialize Auth (ແບບບໍ່ຕ້ອງຈື່ Session ໄປກ່ອນ ເພື່ອຄວາມງ່າຍ)
const auth = getAuth(app); 

// Initialize Database
const db = getDatabase(app);

export { auth, db }; // 🟢 ສົ່ງ auth ອອກໄປນຳ
