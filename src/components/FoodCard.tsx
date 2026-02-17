'use client';

import { Plus } from 'lucide-react';

// Define the shape of the item data
interface MenuItem {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  time?: string;
  rating?: number;
}

// Add themeColor to the props definition
interface FoodCardProps {
  item: MenuItem;
  themeColor: string; 
}

export default function FoodCard({ item, themeColor }: FoodCardProps) {
  return (
    <div className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 flex flex-col h-full hover:shadow-md transition-shadow">
      {/* Image Container */}
      <div className="relative w-full h-32 rounded-xl overflow-hidden mb-3 bg-gray-100">
        <img 
          src={item.image} 
          alt={item.name} 
          className="w-full h-full object-cover" 
          loading="lazy"
        />
        {item.time && (
          <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-[10px] font-bold text-gray-700 shadow-sm">
            {item.time}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1">
        <h3 className="font-bold text-gray-900 leading-tight text-sm line-clamp-2 mb-1">
          {item.name}
        </h3>
        <p className="text-xs text-gray-400 mb-3">{item.category}</p>
        
        {/* Footer: Price & Add Button */}
        <div className="mt-auto flex items-center justify-between">
          <span className="font-extrabold text-lg" style={{ color: themeColor }}>
            ${item.price.toFixed(2)}
          </span>
          <button 
            className="w-8 h-8 rounded-full flex items-center justify-center text-white shadow-md active:scale-95 transition-transform"
            style={{ backgroundColor: themeColor }}
            aria-label="Add to cart"
          >
            <Plus size={18} strokeWidth={3} />
          </button>
        </div>
      </div>
    </div>
  );
}