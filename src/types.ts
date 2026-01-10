// src/types.ts

// 🟢 1. Product Interface (ສິນຄ້າໃນສະຕັອກ)
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

// 🟢 2. CartItem Interface (ສິນຄ້າໃນກະຕ່າຂາຍ)
export interface CartItem extends Product {
  quantity: number;
}

// 🟢 3. SaleRecord Interface (ປະຫວັດການຂາຍໜ້າຮ້ານ)
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

// 🟢 5. OrderItem Interface (ລາຍຊື່ສິນຄ້າຍ່ອຍໃນອໍເດີ Online)
export interface OrderItem {
  id: string;
  productName: string;
  source: string; // ຈີນ, ຫວຽດ, ໄທ
  quantity: number;
  costPrice: number;
  salePrice: number;
  link?: string;
  imageUrl?: string;
  status: 'ຮັບອໍເດີ້' | 'ສັ່ງເຄື່ອງແລ້ວ' | 'ເຄື່ອງຮອດແລ້ວ' | 'ຈັດສົ່ງສຳເລັດ'; // ສະຖານະແຍກແຕ່ລະຊິ້ນ
}

// 🟢 6. CustomerOrder Interface (ຕິດຕາມຄຳສັ່ງຊື້ລວມ)
export interface CustomerOrder {
  id?: string;
  customerName: string;
  date: string;
  items: OrderItem[]; // ຮອງຮັບ 1 ລູກຄ້າສັ່ງຫຼາຍຢ່າງ
  totalAmount: number;
  createdAt: string;
}

// 🟢 7. COLORS (Theme Teal + Orange)
export const COLORS = {
  // ສີ Teal ຕາມ PMS 320 2X
  primary: '#008B94',      
  primaryDark: '#006064',
  
  // ສີສົ້ມພາສເທວສຳລັບຈຸດເນັ້ນ
  secondary: '#FFB300',    
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

// 🟢 8. Helper Functions
// ຟັງຊັນຈັດຮູບແບບຕົວເລກ (Noto Sans Lao)
export const formatNumber = (num: number | string | undefined) => {
  if (num === undefined || num === null || num === '') return '0';
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

// ຟັງຊັນຈັດຮູບແບບວັນທີ
export const formatDate = (date: Date) => {
    const d = new Date(date);
    const day = `0${d.getDate()}`.slice(-2);
    const month = `0${d.getMonth() + 1}`.slice(-2);
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
};
// ເພີ່ມເຂົ້າໃນ src/types.ts

export interface CashDenomination {
  value: number;
  count: number;
}

export interface ShiftRecord {
  id?: string;
  startTime: string;
  endTime?: string;
  status: 'OPEN' | 'CLOSED';
  startingCashLAK: number;
  startingCashTHB: number;
  denominationsLAK: CashDenomination[];
  denominationsTHB: CashDenomination[];
  totalSalesLAK?: number;
  totalSalesTHB?: number;
  actualCashLAK?: number;
  actualCashTHB?: number;
  note?: string;
}