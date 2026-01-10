// src/types.ts

// 🟢 1. Product Interface (ຮັກສາ category ໄວ້ຄືເກົ່າ)
export interface Product {
  id?: string;
  name: string;
  price: number;
  stock: number;
  priceCurrency: 'LAK' | 'THB';
  imageUrl?: string;
  barcode?: string;
  category?: string; // ຢ່າລຶບອັນນີ້ອອກເດີ້!
}

// 🟢 2. CartItem Interface
export interface CartItem extends Product {
  quantity: number;
}

// 🟢 3. SaleRecord Interface
export interface SaleRecord {
  id?: string;
  items: CartItem[];
  subTotal: number;
  discount: number;
  total: number;
  amountReceived: number;
  change: number;
  currency: 'LAK' | 'THB';
  totalPaid?: number;
  paymentMethod: 'CASH' | 'QR';
  source: string;
  date: string;
  status: string;
  createdAt: string;
}

// 🟢 4. COLORS (ປ່ຽນ Theme ໃໝ່ຢູ່ນີ້!)
export const COLORS = {
  // 🔵 ສີຟ້າພາສເທວ (Primary): ໃຊ້ກັບ Header, Footer, ປຸ່ມຕົກລົງ
  primary: '#64B5F6',      // Pastel Blue (Blue 300)
  primaryDark: '#1565C0',  // Darker Blue (ສຳລັບຕົວໜັງສື ຫຼື ຕອນກົດ)
  
  // 🟠 ສີສົ້ມພາສເທວ (Secondary): ໃຊ້ກັບປຸ່ມຍົກເລີກ, ຫຼື ຈຸດເນັ້ນຕ່າງໆ
  secondary: '#FFB74D',    // Pastel Orange (Orange 300)
  secondaryDark: '#EF6C00',// Darker Orange
  
  // ⚪️ ພື້ນຫຼັງ (Background): ປ່ຽນເປັນສີຟ້າອ່ອນໆຈາງໆ ໃຫ້ສະບາຍຕາ
  background: '#F0F8FF',   // AliceBlue (Very light blue)
  
  text: '#4A5568',         // ສີຕົວໜັງສືເທົາເຂັ້ມ (Cool Gray)
  textLight: '#A0AEC0',
  
  success: '#81C784',      // ສີຂຽວ (ເກັບໄວ້ໃຊ້ສະແດງສະຖານະສຳເລັດ)
  danger: '#E57373',       // ສີແດງ (ສຳລັບລຶບ ຫຼື Error)
  
  white: '#FFFFFF',
  gray: '#F7FAFC'
};

export const SIDEBAR_WIDTH = 250;

// 🟢 5. Helper Functions (ຄືເກົ່າ)
export const formatNumber = (num: number | string | undefined) => {
  if (num === undefined || num === null || num === '') return '0';
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

export const formatDate = (date: Date) => {
    const d = new Date(date);
    const day = `0${d.getDate()}`.slice(-2);
    const month = `0${d.getMonth() + 1}`.slice(-2);
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
};