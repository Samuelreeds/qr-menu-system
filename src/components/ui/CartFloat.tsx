'use client';

import { ShoppingBag, ChevronRight } from 'lucide-react';
import { useCart } from '@/context/CartContext'; 
import { useParams, useSearchParams, useRouter } from 'next/navigation';

interface CartFloatProps {
  themeColor?: string;
}

export default function CartFloat({ themeColor = '#000000' }: CartFloatProps) {
  const { totalItems, totalPrice } = useCart(); 
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  
  if (totalItems === 0) return null;

  const handleCheckout = () => {
    // Dynamically grab the shop slug and table ID from the current URL
    const slug = params.slug || params.shopSlug;
    const tableId = searchParams?.get('tableId');
    
    let url = `/${slug}/cart`;
    if (tableId) {
      url += `?tableId=${tableId}`;
    }
    
    router.push(url);
  };

  return (
    <div className="fixed bottom-6 left-0 w-full px-6 z-40">
      <div 
        onClick={handleCheckout}
        className="max-w-md mx-auto bg-gray-900 text-white p-4 rounded-3xl shadow-2xl flex items-center justify-between animate-in slide-in-from-bottom-5 fade-in duration-300 cursor-pointer hover:bg-gray-800 transition-colors"
      >
        
        <div className="flex items-center gap-3">
          <div className="bg-white/10 p-2.5 rounded-full pointer-events-none">
            <ShoppingBag size={20} />
          </div>
          <div className="flex flex-col leading-none pointer-events-none">
            <span className="font-bold text-lg">{totalItems} items</span>
            <span className="text-gray-400 text-xs">Total</span>
          </div>
        </div>

        <div className="flex items-center gap-4 pointer-events-none">
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