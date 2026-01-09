import { ShoppingCart, Trash2 } from 'lucide-react-native';
import React, { useState } from 'react';

// --- Types (ປັບໃຫ້ກົງກັບ Type ຂອງໂປຣເຈັກທ່ານ) ---
interface Product {
  id: string;
  name: string;
  price: number;
}

interface CartItem extends Product {
  qty: number;
}

export default function POSPage() {
  // --- Mock Data (ຂໍ້ມູນຕົວຢ່າງສິນຄ້າ) ---
  const products: Product[] = [
    { id: '1', name: 'ນ້ຳມັນເຄື່ອງ 1 ລິດ', price: 50000 },
    { id: '2', name: 'ຫົວທຽນ', price: 25000 },
    { id: '3', name: 'ຢາງນອກ', price: 120000 },
    { id: '4', name: 'ກອງນ້ຳມັນ', price: 15000 },
  ];

  // --- States ---
  const [cart, setCart] = useState<CartItem[]>([]);
  const [currency, setCurrency] = useState<'LAK' | 'THB' | 'USD'>('LAK'); // ✅ ກູ້ຄືນ: ສະກຸນເງິນ
  
  // States ສຳລັບການຊຳລະເງິນ
  const [overrideTotal, setOverrideTotal] = useState<string>(''); // ✅ ໃໝ່: ເກັບຄ່າທີ່ພິມແກ້ໄຂ
  const [amountReceived, setAmountReceived] = useState<string>(''); // ເງິນທີ່ຮັບມາ

  // --- Logic ຄຳນວນ ---
  
  // 1. ຍອດລວມສິນຄ້າທັງໝົດ (Subtotal)
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

  // 2. ຍອດຕ້ອງຊຳລະສຸດທ້າຍ (Final Total)
  // ຖ້າມີການພິມແກ້ໄຂ (overrideTotal) ໃຫ້ໃຊ້ຄ່ານັ້ນ, ຖ້າບໍ່ມີໃຫ້ໃຊ້ subtotal
  const finalTotal = overrideTotal !== '' ? parseFloat(overrideTotal) : subtotal;

  // 3. ຄຳນວນສ່ວນຫຼຸດ (Discount) ທີ່ເກີດຈາກການແກ້ໄຂລາຄາ
  const calculatedDiscount = subtotal - finalTotal;

  // 4. ຄຳນວນເງິນທອນ (Change)
  const received = parseFloat(amountReceived) || 0;
  const change = received - finalTotal;

  // --- Functions ---
  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(p => p.id === product.id);
      if (existing) {
        return prev.map(p => p.id === product.id ? { ...p, qty: p.qty + 1 } : p);
      }
      return [...prev, { ...product, qty: 1 }];
    });
    // ເມື່ອເພີ່ມສິນຄ້າ ໃຫ້ reset ລາຄາທີ່ແກ້ໄຂໄວ້ ເພື່ອຄຳນວນໃໝ່ (ຫຼື ຈະບໍ່ reset ກໍໄດ້ແລ້ວແຕ່ design)
    setOverrideTotal(''); 
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(p => p.id !== id));
    setOverrideTotal('');
  };

  const handleTotalChange = (value: string) => {
    // ຮັບຄ່າສະເພາະຕົວເລກ
    setOverrideTotal(value);
  };

  return (
    <div className="flex h-screen bg-gray-100 p-4 gap-4">
      
      {/* --- Left Side: Product List --- */}
      <div className="flex-1 bg-white rounded-lg shadow p-4 overflow-y-auto">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
           <ShoppingCart /> ລາຍການສິນຄ້າ
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {products.map(product => (
            <button
              key={product.id}
              onClick={() => addToCart(product)}
              className="p-4 border rounded hover:border-blue-500 hover:bg-blue-50 transition text-left"
            >
              <div className="font-bold">{product.name}</div>
              <div className="text-green-600">{product.price.toLocaleString()} LAK</div>
            </button>
          ))}
        </div>
      </div>

      {/* --- Right Side: Cart & Payment (ຈຸດທີ່ແກ້ໄຂ) --- */}
      <div className="w-[400px] bg-white rounded-lg shadow flex flex-col h-full">
        
        {/* Header */}
        <div className="p-4 border-b bg-gray-50 rounded-t-lg">
           <h2 className="text-lg font-bold">ລາຍການຂາຍ</h2>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {cart.length === 0 ? (
            <div className="text-center text-gray-400 mt-10">ຍັງບໍ່ມີລາຍການ</div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="flex justify-between items-center border-b pb-2">
                <div>
                  <div className="font-medium">{item.name}</div>
                  <div className="text-xs text-gray-500">
                    {item.price.toLocaleString()} x {item.qty}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold">{(item.price * item.qty).toLocaleString()}</span>
                  <button onClick={() => removeFromCart(item.id)} className="text-red-500">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* --- Payment Section (ຈຸດສຳຄັນ) --- */}
        <div className="p-4 bg-slate-50 border-t space-y-4">
          
          {/* 1. ✅ Currency Selector (ດຶງກັບມາ) */}
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium text-gray-600">ສະກຸນເງິນ:</label>
            <div className="flex rounded-md shadow-sm">
              {(['LAK', 'THB', 'USD'] as const).map((curr) => (
                <button
                  key={curr}
                  onClick={() => setCurrency(curr)}
                  className={`px-3 py-1 text-sm border first:rounded-l-md last:rounded-r-md transition ${
                    currency === curr 
                      ? 'bg-blue-600 text-white border-blue-600' 
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {curr}
                </button>
              ))}
            </div>
          </div>

          <hr />

          {/* 2. ✅ Totals & Editable Payable (ແກ້ໄຂຍອດໄດ້) */}
          <div className="space-y-2">
            <div className="flex justify-between text-gray-600 text-sm">
              <span>ລວມລາຄາສິນຄ້າ:</span>
              <span>{subtotal.toLocaleString()}</span>
            </div>
            
            {/* ສະແດງສ່ວນຫຼຸດ ຖ້າມີການແກ້ໄຂລາຄາ */}
            {calculatedDiscount > 0 && (
               <div className="flex justify-between text-green-600 text-sm">
                 <span>ສ່ວນຫຼຸດ:</span>
                 <span>-{calculatedDiscount.toLocaleString()}</span>
               </div>
            )}

            <div className="flex items-center justify-between mt-2">
              <span className="font-bold text-lg text-gray-800">ຍອດຕ້ອງຊຳລະ:</span>
              <div className="relative w-1/2">
                <input
                  type="number"
                  value={overrideTotal !== '' ? overrideTotal : (subtotal === 0 ? '' : subtotal)}
                  onChange={(e) => handleTotalChange(e.target.value)}
                  className="w-full text-right font-bold text-2xl text-blue-700 bg-yellow-50 border-b-2 border-blue-200 focus:border-blue-600 outline-none px-2 py-1 rounded"
                  placeholder="0"
                />
                <span className="absolute right-[-25px] top-3 text-xs text-gray-400">{currency}</span>
              </div>
            </div>
          </div>

          {/* 3. Payment Input */}
          <div className="bg-white p-3 border rounded-lg space-y-3 shadow-sm">
             <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">ຮັບເງິນມາ:</label>
                <input
                  type="number"
                  value={amountReceived}
                  onChange={(e) => setAmountReceived(e.target.value)}
                  className="w-full p-2 border rounded text-lg focus:ring-2 focus:ring-green-500"
                  placeholder="ປ້ອນຈຳນວນເງິນ..."
                />
             </div>
             
             {/* ສະແດງເງິນທອນ */}
             <div className="flex justify-between items-center pt-2 border-t">
                <span className="text-sm font-medium">ເງິນທອນ:</span>
                <span className={`text-xl font-bold ${change < 0 ? 'text-red-500' : 'text-green-600'}`}>
                  {change.toLocaleString()} {currency}
                </span>
             </div>
          </div>

          {/* Action Button */}
          <button 
            disabled={cart.length === 0}
            className={`w-full py-3 rounded-lg text-white font-bold text-lg shadow transition ${
              cart.length === 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            ຢືນຢັນການຂາຍ
          </button>

        </div>
      </div>
    </div>
  );
}