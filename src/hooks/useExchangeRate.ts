import { onValue, ref } from 'firebase/database';
import { useEffect, useState } from 'react';
import { db } from '../firebase';

export const useExchangeRate = () => {
  // ກຳນົດຄ່າເລີ່ມຕົ້ນເປັນ 680 (ກັນພາດ ກໍລະນີດຶງບໍ່ໄດ້ ຫຼື ເນັດຊ້າ)
  const [exchangeRate, setExchangeRate] = useState<number>(680);

  useEffect(() => {
    // 🟢 ຈຸດສຳຄັນ: ດຶງຈາກ 'settings/exchangeRateTHB' ໃຫ້ກົງກັບ Header.tsx
    const rateRef = ref(db, 'settings/exchangeRateTHB');

    const unsubscribe = onValue(rateRef, (snapshot) => {
      if (snapshot.exists()) {
        const val = snapshot.val();
        // ແປງຄ່າເປັນ Number ໃຫ້ຊັດເຈນ
        const numVal = parseFloat(val);
        
        if (!isNaN(numVal) && numVal > 0) {
          // ອັບເດດຄ່າທັນທີເມື່ອມີການປ່ຽນແປງໃນ Firebase
          setExchangeRate(numVal);
        }
      } else {
        console.log("⚠️ No rate found in DB (settings/exchangeRateTHB), using default");
      }
    });

    return () => unsubscribe();
  }, []);

  return exchangeRate;
};