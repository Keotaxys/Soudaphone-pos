// src/types.ts

// 🟢 1. Product Interface (ເພີ່ມ category)
export interface Product {
  id?: string;
  name: string;
  price: number;
  stock: number;
  priceCurrency: 'LAK' | 'THB';
  imageUrl?: string;
  barcode?: string;
  category?: string; // 🟢 ຕ້ອງເພີ່ມແຖວນີ້ເຂົ້າໄປ ບັນຫາຈຶ່ງຈະຫາຍ!
}

// 🟢 2. CartItem Interface (ສືບທອດຈາກ Product)
export interface CartItem extends Product {
  quantity: number;
}

// 🟢 3. SaleRecord Interface (ສຳລັບບັນທຶກການຂາຍ)
export interface SaleRecord {
  id?: string;
  items: CartItem[];
  subTotal: number;
  discount: number;
  total: number;
  amountReceived: number;
  change: number;
  currency: 'LAK' | 'THB';
  totalPaid?: number; // ຍອດທີ່ຈ່າຍຈິງຕາມສະກຸນເງິນ
  paymentMethod: 'CASH' | 'QR';
  source: string;
  date: string;
  status: string;
  createdAt: string;
}

// 🟢 4. Constants & Colors (ສີ Theme ພາສເທວ)
export const COLORS = {
  primary: '#88C9A1',      // Pastel Green (Main)
  primaryDark: '#557C55',  // Darker Green (Text)
  secondary: '#FFD3B6',    // Pastel Orange (Accent)
  secondaryDark: '#E09E72',// Darker Orange (Text)
  background: '#F9FBF9',   // Off-white Greenish
  text: '#4A4A4A',
  textLight: '#888888',
  success: '#81C784',      // Green Success
  danger: '#E57373',       // Red Danger
  white: '#FFFFFF',
  gray: '#F0F0F0'
};

export const SIDEBAR_WIDTH = 250;

// 🟢 5. Helper Functions
export const formatNumber = (num: number | string | undefined) => {
  if (num === undefined || num === null || num === '') return '0';
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

export const formatDate = (date: Date) => {
    // Format: DD/MM/YYYY
    const d = new Date(date);
    const day = `0${d.getDate()}`.slice(-2);
    const month = `0${d.getMonth() + 1}`.slice(-2);
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
};