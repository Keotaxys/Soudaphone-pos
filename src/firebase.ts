import { getApp, getApps, initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

// 🟢 1. Import ແບບທຳມະດາ (ໃຊ້ໄດ້ກັບ Firebase ທຸກລຸ້ນ)
import { getAuth } from 'firebase/auth';

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

// 🟢 2. Logic ກວດສອບ App (Singleton)
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

// 🟢 3. ໃຊ້ getAuth ທຳມະດາ (ແກ້ບັນຫາ is not a function)
// ວິທີນີ້ຈະບໍ່ເຮັດໃຫ້ແອັບ Crash ເຖິງແມ່ນວ່າ Firebase ຈະເປັນ version ໃດກໍຕາມ
auth = getAuth(app);

const db = getDatabase(app);

export { auth, db };
export default app;