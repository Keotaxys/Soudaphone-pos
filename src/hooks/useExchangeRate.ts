// path: src/hooks/useExchangeRate.ts
import { onValue, ref } from 'firebase/database';
import { useEffect, useState } from 'react';

// ✅ ແກ້ໄຂ Path: ດຶງ db ໂດຍກົງຈາກ ../firebase (ເພາະທັງສອງຢູ່ໃນ src ຄືກັນ)
import { db } from '../firebase';

export const useExchangeRate = () => {
  const [rate, setRate] = useState<number>(0);

  useEffect(() => {
    // ✅ ບໍ່ຕ້ອງໃຊ້ getDatabase(app) ຊ້ຳອີກ, ໃຊ້ db ທີ່ import ມາໄດ້ເລີຍ
    const rateRef = ref(db, 'settings/exchangeRateTHB');

    const unsubscribe = onValue(rateRef, (snapshot) => {
      const data = snapshot.val();
      const numericRate = Number(data);
      
      // ກວດສອບຂໍ້ມູນກ່ອນບັນທຶກ
      if (!isNaN(numericRate) && data !== null) {
        setRate(numericRate);
      }
    });

    return () => unsubscribe();
  }, []);

  return rate;
};