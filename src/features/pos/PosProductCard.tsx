// src/components/pos/PosProductCard.tsx
'use client';

import { Plus, Image as ImageIcon } from 'lucide-react';
import { PosProduct } from './AdminPosSection';

export function PosProductCardSkeleton() {
  return (
    <div className="animate-pulse bg-white p-3 sm:p-4 rounded-[20px] shadow-sm border border-gray-100 flex flex-col h-full min-w-0">
      <div className="w-full aspect-[4/3] rounded-xl mb-3 bg-gray-200" />
      <div className="h-4 rounded-full bg-gray-200 mb-2 w-3/4" />
      <div className="h-3 rounded-full bg-gray-100 mb-4 w-1/2" />
      <div className="h-6 rounded-full bg-gray-200 w-1/3 mb-4" />
      <div className="mt-auto h-8 rounded-lg bg-gray-100 mb-3" />
      <div className="h-10 rounded-xl bg-gray-200" />
    </div>
  );
}

export default function PosProductCard({ 
  product, 
  onClick 
}: { 
  product: PosProduct; 
  onClick: (product: PosProduct) => void; 
}) {
  const basePrice = product.variants && product.variants.length > 0 
    ? Math.min(...product.variants.map(v => v.price)) 
    : product.price;

  return (
    <div 
      className="animate-scale-in bg-white p-3 rounded-[20px] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-gray-100 transition-all hover:shadow-md flex flex-col h-full group cursor-pointer min-w-0" 
      onClick={() => onClick(product)}
    >
      <div className="w-full aspect-[4/3] rounded-[16px] overflow-hidden mb-3 bg-gray-50 flex-shrink-0 border border-gray-100 relative">
        {product.img ? (
          <img src={product.img} alt={`${product.name}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100">
            <ImageIcon size={32} className="text-gray-300" />
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col px-1 min-w-0">
        <h3 className="font-extrabold text-gray-900 text-sm leading-tight mb-0.5 truncate">{product.name}</h3>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 truncate">{product.category}</p>
        <p className="font-black text-[17px] text-gray-900 mb-4">
          <sup className="text-[10px] font-bold text-gray-500 mr-0.5">$</sup>
          {basePrice.toFixed(2)}
        </p>
        
        <div className="mt-auto">
          <button 
             onClick={(e) => {
               e.stopPropagation(); // Prevents clicking the button from triggering the card click twice
               onClick(product);
             }}
             className="w-full bg-[#111827] text-white py-2.5 rounded-xl text-sm font-bold shadow-md hover:bg-black active:scale-[0.98] transition-all flex items-center justify-center gap-2 min-w-0"
          >
             <Plus size={16} className="shrink-0" /> <span className="truncate">Add Item</span>
          </button>
        </div>
      </div>
    </div>
  );
}