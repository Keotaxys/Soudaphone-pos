import { onValue, ref } from 'firebase/database';
import { useEffect, useState } from 'react';
import { db } from '../firebase';

export const useExchangeRate = () => {
  const [exchangeRate, setExchangeRate] = useState<number>(680);

  useEffect(() => {
    // 🟢 ແກ້ໄຂ: ດຶງຈາກ 'settings/exchangeRateTHB'
    const rateRef = ref(db, 'settings/exchangeRateTHB'); // <--- ປ່ຽນບ່ອນນີ້

    const unsubscribe = onValue(rateRef, (snapshot) => {
      if (snapshot.exists()) {
        const val = snapshot.val();
        const numVal = parseFloat(val);
        
        if (!isNaN(numVal) && numVal > 0) {
          setExchangeRate(numVal);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  return exchangeRate;
};