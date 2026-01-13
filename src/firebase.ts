import { initializeApp, getApp, getApps } from 'firebase/app';
import { getDatabase } from 'firebase/database';
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
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

// ໃຊ້ Auth ແບບທຳມະດາ (ບໍ່ມີ Error ແນ່ນອນ)
export const auth = getAuth(app);
export const db = getDatabase(app);
export default app;