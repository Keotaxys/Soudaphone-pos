// path: /hooks/useExchangeRate.ts

import { getDatabase, onValue, ref } from 'firebase/database';
import { useEffect, useState } from 'react';
// 🟢 ອ້າງອີງໄປຫາ src/firebase.ts (ຍ້ອນ hooks ຢູ່ນອກ src ຈຶ່ງຕ້ອງຖອຍອອກມາແລ້ວເຂົ້າ src)
import { app } from '../firebase';

export const useExchangeRate = () => {
  const [rate, setRate] = useState<number>(0);

  useEffect(() => {
    const db = getDatabase(app);
    // ອ້າງອີງຕາມຮູບທີ 1 ທີ່ເຈົ້າສົ່ງມາ
    const rateRef = ref(db, 'settings/exchangeRateTHB');

    const unsubscribe = onValue(rateRef, (snapshot) => {
      const data = snapshot.val();
      const numericRate = Number(data);
      
      // ຖ້າດຶງມາໄດ້ ໃຫ້ອັບເດດ State
      if (!isNaN(numericRate)) {
        setRate(numericRate);
      }
    });

    return () => unsubscribe();
  }, []);

  return rate;
};