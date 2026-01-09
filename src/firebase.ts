import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyAq2zXT4AeLbbDre8lEh5KgIvq5xtoj1-o",
  authDomain: "studio-7834307833-10afa.firebaseapp.com",
  databaseURL: "https://studio-7834307833-10afa-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "studio-7834307833-10afa",
  storageBucket: "studio-7834307833-10afa.firebasestorage.app",
  messagingSenderId: "1085134944350",
  appId: "1:1085134944350:web:cdd4c563a7891c176d9ccf"
};

// 🟢 ແກ້ໄຂແລ້ວ: ຕື່ມ export ໃສ່ທາງໜ້າ ເພື່ອໃຫ້ໄຟລ໌ອື່ນເອີ້ນໃຊ້ app ໄດ້
export const app = initializeApp(firebaseConfig);

// export database ອອກໄປນຳ
export const db = getDatabase(app);