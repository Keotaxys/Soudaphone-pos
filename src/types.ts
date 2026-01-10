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
  category?: string;
}

// 🟢 2. CartItem Interface
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
  totalPaid?: number;
  paymentMethod: 'CASH' | 'QR';
  source: string;
  date: string;
  status: string;
  createdAt: string;
}

// 🟢 4. ExpenseRecord Interface (ລາຍຈ່າຍ)
export interface ExpenseRecord {
  id?: string;
  date: string;
  category: string;
  description: string;
  amount: number;
  createdAt: string;
}

// 🟢 5. CustomerOrder Interface (ຕິດຕາມຄຳສັ່ງຊື້ - 🟢 ເພີ່ມບ່ອນນີ້!)
export interface CustomerOrder {
  id?: string;
  customerName: string;
  date: string;
  productName: string;
  source: string;
  quantity: number;
  costPrice: number;
  salePrice: number;
  link?: string;
  imageUrl?: string;
  status: 'ຮັບອໍເດີ້' | 'ສັ່ງເຄື່ອງແລ້ວ' | 'ເຄື່ອງຮອດແລ້ວ' | 'ຈັດສົ່ງສຳເລັດ';
  createdAt: string;
}

// 🟢 6. COLORS (Theme Teal + Orange)
export const COLORS = {
  primary: '#008B94',      // Teal
  primaryDark: '#006064',
  secondary: '#FFB300',    // Orange
  secondaryDark: '#FF8F00',
  background: '#F5F9FA',
  text: '#37474F',
  textLight: '#90A4AE',
  success: '#43A047',
  danger: '#E53935',
  white: '#FFFFFF',
  gray: '#ECEFF1'
};

export const SIDEBAR_WIDTH = 250;

// 🟢 7. Helper Functions
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