// src/types.ts

// 🟢 1. Product Interface (ສິນຄ້າ)
export interface Product {
  id?: string;
  name: string;
  price: number;
  stock: number;
  priceCurrency: 'LAK' | 'THB';
  imageUrl?: string;
  barcode?: string;
  category?: string; // ໝວດໝູ່ສິນຄ້າ
}

// 🟢 2. CartItem Interface (ສິນຄ້າໃນກະຕ່າ)
export interface CartItem extends Product {
  quantity: number;
}

// 🟢 3. SaleRecord Interface (ປະຫວັດການຂາຍ)
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

// 🟢 4. ExpenseRecord Interface (ປະຫວັດລາຍຈ່າຍ - ໃໝ່!)
export interface ExpenseRecord {
  id?: string;
  date: string;       // ວັນທີບັນທຶກ (ISO String)
  category: string;   // ໝວດໝູ່ລາຍຈ່າຍ
  description: string;// ລາຍລະອຽດ
  amount: number;     // ຈຳນວນເງິນ
  createdAt: string;  // ວັນທີສ້າງ record
}

// 🟢 5. COLORS (Theme ສີ Teal + Orange)
export const COLORS = {
  // 🔵 ສີຫຼັກ (Teal/Turquoise):
  primary: '#008B94',      // ສີຂຽວອົມຟ້າເຂັ້ມ (Teal PMS 320 style)
  primaryDark: '#006064',  // ສີເຂັ້ມກວ່າສຳລັບ Text ຫຼື ກົດຄ້າງ
  
  // 🟠 ສີຮອງ (Secondary):
  secondary: '#FFB300',    // Amber 600 (ສີສົ້ມຄຳ)
  secondaryDark: '#FF8F00',// Amber 800
  
  // ⚪️ ພື້ນຫຼັງ (Background):
  background: '#F5F9FA',   // Mint Cream / Azure mist
  
  text: '#37474F',         // Blue Gray
  textLight: '#90A4AE',
  
  success: '#43A047',      // Green
  danger: '#E53935',       // Red
  
  white: '#FFFFFF',
  gray: '#ECEFF1'
};

export const SIDEBAR_WIDTH = 250;

// 🟢 6. Helper Functions (ຟັງຊັນຊ່ວຍເຫຼືອ)

// ຈັດຮູບແບບຕົວເລກ (ມີຈຸດຂັ້ນຫຼັກພັນ)
export const formatNumber = (num: number | string | undefined) => {
  if (num === undefined || num === null || num === '') return '0';
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

// ຈັດຮູບແບບວັນທີ (DD/MM/YYYY)
export const formatDate = (date: Date) => {
    const d = new Date(date);
    const day = `0${d.getDate()}`.slice(-2);
    const month = `0${d.getMonth() + 1}`.slice(-2);
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
};