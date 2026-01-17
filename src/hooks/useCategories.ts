import { onValue, push, ref, remove, set } from 'firebase/database';
import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { db } from '../firebase';

const DEFAULT_CATEGORIES = [
    'ເສື້ອ', 'ໂສ້ງ', 'ໂສ້ງຊ້ອນໃນ', 'ກະໂປງ', 'ຊຸດ', 'ກະເປົາ', 
    'ໝວກ', 'ຖົງຕີນ', 'ເກີບ', 'ເຄື່ອງສຳອາງ', 'ເຄື່ອງປະດັບ', 'ທົ່ວໄປ'
];

export function useCategories() {
  // ເກັບຂໍ້ມູນແບບມີ ID ({ id: 'key123', name: 'ເສື້ອ' })
  const [categoryObjs, setCategoryObjs] = useState<{id: string, name: string}[]>([]);
  // ເກັບຂໍ້ມູນແບບເກົ່າ (string[]) ເພື່ອໃຫ້ໜ້າ POS ໃຊ້ງານໄດ້ຄືເກົ່າ
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const catRef = ref(db, 'categories');
    const unsubscribe = onValue(catRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        // ແປງຂໍ້ມູນຈາກ Firebase object ໃຫ້ເປັນ Array ທີ່ມີ ID
        const customCatsObj = Object.keys(data).map(key => ({
            id: key,
            name: data[key]
        }));
        
        const customCatNames = customCatsObj.map(c => c.name);
        
        // ອັບເດດ State
        setCategoryObjs(customCatsObj);
        setCategories(Array.from(new Set([...DEFAULT_CATEGORIES, ...customCatNames])));
      } else {
        setCategoryObjs([]);
        setCategories(DEFAULT_CATEGORIES);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // ເພີ່ມ
  const addCategory = async (newCatName: string) => {
    const trimmedName = newCatName.trim();
    if (!trimmedName) { Alert.alert("ແຈ້ງເຕືອນ", "ກະລຸນາໃສ່ຊື່ໝວດໝູ່"); return false; }
    if (categories.includes(trimmedName)) { Alert.alert("ແຈ້ງເຕືອນ", "ຊື່ໝວດໝູ່ນີ້ມີຢູ່ແລ້ວ"); return false; }

    try {
      await push(ref(db, 'categories'), trimmedName);
      return true;
    } catch (error) { Alert.alert("Error", "ບໍ່ສາມາດເພີ່ມໄດ້"); return false; }
  };

  // 🟢 ແກ້ໄຂ
  const editCategory = async (id: string, newName: string) => {
      try {
          await set(ref(db, `categories/${id}`), newName);
          return true;
      } catch (error) { Alert.alert("Error", "ແກ້ໄຂບໍ່ໄດ້"); return false; }
  };

  // 🟢 ລຶບ
  const deleteCategory = async (id: string) => {
      try {
          await remove(ref(db, `categories/${id}`));
          return true;
      } catch (error) { Alert.alert("Error", "ລຶບບໍ່ໄດ້"); return false; }
  };

  return { categories, categoryObjs, addCategory, editCategory, deleteCategory, loading };
}