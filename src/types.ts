import { Dimensions } from 'react-native';

// Interfaces
export interface Product {
  id?: string;
  name: string;
  price: number;
  stock: number;
  imageUrl?: string;
  priceCurrency?: 'LAK' | 'THB';
  barcode?: string;
}

export interface CartItem extends Product {
  quantity: number;
  id: string;
}

export interface SaleRecord {
  id: string;
  date: string;
  total: number;
  items: CartItem[];
  currency: 'LAK' | 'THB';
  paymentMethod: 'CASH' | 'QR';
  amountReceived?: number;
  change?: number;
}

// Constants
export const { width } = Dimensions.get('window');
export const COLUMN_COUNT = 2;
export const CARD_WIDTH = (width / COLUMN_COUNT) - 20;
export const SIDEBAR_WIDTH = width * 0.75;

// Theme Colors (Green & Orange)
export const COLORS = {
  primary: '#4DB6AC',    
  primaryDark: '#009688', 
  secondary: '#FFB74D',  
  secondaryDark: '#F57C00', 
  background: '#F0F4F4', 
  cardBg: '#FFFFFF',
  text: '#424242',
  textLight: '#757575',
  danger: '#EF5350',
  success: '#66BB6A',
  blue: '#42A5F5',
  white: '#FFFFFF'
};

// Helper Functions
export const formatNumber = (num: number | string) => {
  if (!num && num !== 0) return '';
  const parts = num.toString().split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return parts.join('.');
};

export const formatDate = (dateString: string | Date) => {
  const date = new Date(dateString);
  const d = date.getDate().toString().padStart(2, '0');
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
};