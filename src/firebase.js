import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getAuth } from 'firebase/auth'; 

// 🟢 ຢ່າລືມເອົາ Config ຂອງເຈົ້າມາໃສ່ຄືເກົ່າເດີ້
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

// Auth ແບບທຳມະດາ (ບໍ່ຕ້ອງຈື່ Session)
const auth = getAuth(app);

// Initialize Database
const db = getDatabase(app);

export { db, auth };