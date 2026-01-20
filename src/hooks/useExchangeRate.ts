import { onValue, ref } from 'firebase/database';
import { useEffect, useState } from 'react';
import { db } from '../firebase';

export const useExchangeRate = () => {
  // ກຳນົດຄ່າເລີ່ມຕົ້ນເປັນ 680 (ກັນພາດ ກໍລະນີດຶງບໍ່ໄດ້)
  const [exchangeRate, setExchangeRate] = useState<number>(680);

  useEffect(() => {
    // 🟢 ຈຸດສຳຄັນ: ຕ້ອງດຶງຈາກ 'settings/exchangeRate' ໃຫ້ກົງກັບ Header
    const rateRef = ref(db, 'settings/exchangeRate');

    const unsubscribe = onValue(rateRef, (snapshot) => {
      if (snapshot.exists()) {
        const val = snapshot.val();
        // ແປງຄ່າເປັນ Number ໃຫ້ຊັດເຈນ
        const numVal = parseFloat(val);
        
        if (!isNaN(numVal) && numVal > 0) {
          console.log("✅ Updated Rate from DB:", numVal);
          setExchangeRate(numVal);
        }
      } else {
        console.log("⚠️ No rate found in DB, using default");
      }
    });

    return () => unsubscribe();
  }, []);

  return exchangeRate;
};