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
// * ແກ້ໄຂ: ເພີ່ມ note ເພື່ອໃຫ້ຕົງກັບໜ້າ Report
export interface ExpenseRecord {
  id?: string;
  date: string;
  category: string;
  description?: string; // ເຮັດເປັນ optional
  note?: string;        // ໃຊ້ໂຕນີ້ໃນ ReportDashboard
  amount: number;
  createdAt: string;
}

// 🟢 [ເພີ່ມໃໝ່] DebtRecord Interface (ບັນທຶກໜີ້ສິນ)
export interface DebtRecord {
  id?: string;
  customerName: string;
  description?: string;
  totalAmount: number;     // ຍອດໜີ້ທັງໝົດ
  paidAmount: number;      // ຈ່າຍໄປແລ້ວ
  remainingBalance: number;// ຍັງເຫຼືອ
  dueDate: string;         // ກຳນົດຈ່າຍ
  status: 'PENDING' | 'PAID' | 'OVERDUE';
  createdAt: string;
  history?: { date: string; amount: number; note: string }[]; // ປະຫວັດການຜ່ອນຈ່າຍ
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
  status: 'ຮັບອໍເດີ້' | 'ສັ່ງເຄື່ອງແລ້ວ' | 'ເຄື່ອງຮອດແລ້ວ' | 'ຈັດສົ່ງສຳເລັດ';
}

// 🟢 6. CustomerOrder Interface (ຕິດຕາມຄຳສັ່ງຊື້ລວມ)
export interface CustomerOrder {
  id?: string;
  customerName: string;
  date: string;
  items: OrderItem[];
  totalAmount: number;
  createdAt: string;
}

// 🟢 7. Customer Interface (ຂໍ້ມູນລູກຄ້າ)
export interface Customer {
  id: string;
  name: string;
  phoneNumber?: string;
  address?: string;
  createdAt?: string;
}

// 🟢 8. Order Interface (Alias)
export type Order = CustomerOrder; 

// 🟢 9. COLORS (Theme Teal + Orange)
export const COLORS = {
  primary: '#008B94',      
  primaryDark: '#006064',
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

// 🟢 10. Helper Functions
export const formatNumber = (num: number | string | undefined) => {
  if (num === undefined || num === null || num === '') return '0';
  const n = typeof num === 'string' ? parseFloat(num) : num;
  return isNaN(n) ? '0' : n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

export const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    const day = `0${d.getDate()}`.slice(-2);
    const month = `0${d.getMonth() + 1}`.slice(-2);
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
};

// 🟢 11. Shift Related Types
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