'use client';

import { ShoppingBag, ChevronRight } from 'lucide-react';
import { useCart } from '@/context/CartContext'; 

interface CartFloatProps {
  themeColor?: string; // Optional prop
}

export default function CartFloat({ themeColor = '#000000' }: CartFloatProps) {
  const { totalItems, totalPrice } = useCart(); 
  
  if (totalItems === 0) return null;

  return (
    <div className="fixed bottom-6 left-0 w-full px-6 z-40">
      <div className="max-w-md mx-auto bg-gray-900 text-white p-4 rounded-3xl shadow-2xl flex items-center justify-between animate-in slide-in-from-bottom-5 fade-in duration-300">
        
        <div className="flex items-center gap-3">
          <div className="bg-white/10 p-2.5 rounded-full">
            <ShoppingBag size={20} />
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-bold text-lg">{totalItems} items</span>
            <span className="text-gray-400 text-xs">Total</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="font-bold text-xl">${totalPrice.toFixed(2)}</span>
          <button 
            style={{ backgroundColor: themeColor }}
            className="text-white p-2 rounded-full transition hover:brightness-110"
          >
            <ChevronRight size={24} />
          </button>
        </div>

      </div>
    </div>
  );
}