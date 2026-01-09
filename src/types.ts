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