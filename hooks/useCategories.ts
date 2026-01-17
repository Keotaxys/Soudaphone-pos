import { onValue, push, ref } from 'firebase/database';
import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { db } from '../firebase'; // ກວດ path ໃຫ້ຖືກ

// ໝວດໝູ່ເລີ່ມຕົ້ນ
const DEFAULT_CATEGORIES = [
    'ເສື້ອ', 'ໂສ້ງ', 'ໂສ້ງຊ້ອນໃນ', 'ກະໂປງ', 'ຊຸດ', 'ກະເປົາ', 
    'ໝວກ', 'ຖົງຕີນ', 'ເກີບ', 'ເຄື່ອງສຳອາງ', 'ເຄື່ອງປະດັບ', 'ທົ່ວໄປ'
];

export function useCategories() {
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const [loading, setLoading] = useState(true);

  // 1. ດຶງຂໍ້ມູນຈາກ Firebase (ຈະທຳງານຕະຫຼອດເວລາທີ່ມີການປ່ຽນແປງ)
  useEffect(() => {
    const catRef = ref(db, 'categories');
    const unsubscribe = onValue(catRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const customCats = Object.values(data) as string[];
        // ເອົາ Default + ໂຕໃໝ່ ມາລວມກັນ ແລ້ວຕັດໂຕຊ້ຳອອກ
        const uniqueCats = Array.from(new Set([...DEFAULT_CATEGORIES, ...customCats]));
        setCategories(uniqueCats);
      } else {
        setCategories(DEFAULT_CATEGORIES);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 2. ຟັງຊັນເພີ່ມໝວດໝູ່
  const addCategory = async (newCatName: string) => {
    const trimmedName = newCatName.trim();
    
    if (!trimmedName) {
      Alert.alert("ແຈ້ງເຕືອນ", "ກະລຸນາໃສ່ຊື່ໝວດໝູ່");
      return false;
    }
    
    if (categories.includes(trimmedName)) {
      Alert.alert("ແຈ້ງເຕືອນ", "ຊື່ໝວດໝູ່ນີ້ມີຢູ່ແລ້ວ");
      return false;
    }

    try {
      await push(ref(db, 'categories'), trimmedName);
      return true; // ບອກວ່າສຳເລັດ
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "ບໍ່ສາມາດເພີ່ມໄດ້");
      return false;
    }
  };

  return { categories, addCategory, loading };
}