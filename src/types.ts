// src/types.ts

// 🟢 1. COLORS Theme
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

// 🟢 2. Product Interface
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

// 🟢 3. CartItem Interface
export interface CartItem extends Product {
  quantity: number;
}

// 🟢 4. SaleRecord Interface
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
  isSpecial?: boolean; 
}

// 🟢 5. ExpenseRecord Interface
export interface ExpenseRecord {
  id?: string;
  date: string;
  category: string;
  description?: string; 
  note?: string;        
  amount: number;
  createdAt: string;
}

// 🟢 6. DebtRecord Interface
export interface DebtRecord {
  id?: string;
  customerName: string;
  description?: string;
  totalAmount: number;     
  paidAmount: number;      
  remainingBalance: number;
  dueDate: string;         
  status: 'PENDING' | 'PAID' | 'OVERDUE';
  createdAt: string;
  history?: { date: string; amount: number; note: string }[];
}

// 🟢 7. Order Items (Online)
export interface OrderItem {
  id: string;
  productName: string;
  source: string; 
  quantity: number;
  costPrice: number;
  salePrice: number;
  link?: string;
  imageUrl?: string;
  status: 'ຮັບອໍເດີ້' | 'ສັ່ງເຄື່ອງແລ້ວ' | 'ເຄື່ອງຮອດແລ້ວ' | 'ຈັດສົ່ງສຳເລັດ';
}

// 🟢 8. Customer Order
export interface CustomerOrder {
  id?: string;
  customerName: string;
  date: string;
  items: OrderItem[];
  totalAmount: number;
  createdAt: string;
}

// 🟢 9. Customer
export interface Customer {
  id: string;
  name: string;
  phoneNumber?: string;
  address?: string;
  createdAt?: string;
}

// 🟢 10. Type Alias
export type Order = CustomerOrder; 

// 🟢 11. Helper Functions
export const formatNumber = (num: number | string | undefined | null) => {
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

// 🟢 12. Shift Records
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

// 🟢 13. User Permissions Interface (ລວມກັນແລ້ວ)
export interface UserPermissions {
  // Functional Permissions
  canSell: boolean;
  canEditProduct: boolean;
  canDeleteProduct: boolean;
  canViewReports: boolean;
  canManageUsers: boolean;

  // Page Access Permissions (ເພີ່ມໃໝ່)
  accessPos: boolean;
  accessProducts: boolean;
  accessCustomers: boolean;
  accessReports: boolean;
  accessFinancial: boolean;
}

// 🟢 14. User Interface
export interface User {
  id?: string;
  name: string;
  pin: string;
  role: 'admin' | 'staff';
  isActive: boolean;
  permissions?: UserPermissions;
  createdAt: string;
}