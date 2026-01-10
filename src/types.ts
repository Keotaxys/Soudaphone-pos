// src/types.ts

// 🟢 1. Product Interface (ຮັກສາ category ໄວ້)
export interface Product {
  id?: string;
  name: string;
  price: number;
  stock: number;
  priceCurrency: 'LAK' | 'THB';
  imageUrl?: string;
  barcode?: string;
  category?: string;
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

// 🟢 4. COLORS (ປ່ຽນ Theme ໃໝ່ຕາມຮູບ PMS 320 2X!)
export const COLORS = {
  // 🔵 ສີຫຼັກ (Teal/Turquoise): ຕາມຮູບທີ່ສົ່ງມາ
  primary: '#008B94',      // ສີຂຽວອົມຟ້າເຂັ້ມ (Teal PMS 320 style)
  primaryDark: '#006064',  // ສີເຂັ້ມກວ່າສຳລັບ Text ຫຼື ກົດຄ້າງ
  
  // 🟠 ສີຮອງ (Secondary): ໃຊ້ສີສົ້ມຄຳ (Gold/Orange) ເພື່ອຕັດກັບສີ Teal ຢ່າງໂດດເດັ່ນ
  secondary: '#FFB300',    // Amber 600
  secondaryDark: '#FF8F00',// Amber 800
  
  // ⚪️ ພື້ນຫຼັງ (Background): ສີຂາວສະອາດ ຫຼື ຟ້າອ່ອນຈາງໆສຸດໆ
  background: '#F5F9FA',   // Mint Cream / Azure mist
  
  text: '#37474F',         // Blue Gray (ອ່ານງ່າຍ ສະບາຍຕາ)
  textLight: '#90A4AE',
  
  success: '#43A047',      // Green
  danger: '#E53935',       // Red
  
  white: '#FFFFFF',
  gray: '#ECEFF1'
};

export const SIDEBAR_WIDTH = 250;

// 🟢 5. Helper Functions
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