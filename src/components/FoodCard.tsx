'use client';

import { Star } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext'; // 1. Import the hook

// 2. Add language fields to the interface
interface MenuItem {
  id: string;
  name: string;
  name_kh?: string | null; 
  name_zh?: string | null; 
  price: number;
  image: string;
  time?: string;
  rating?: number;
  category?: string | { name: string };
}

interface FoodCardProps {
  item: MenuItem;
  themeColor?: string; 
}

export default function FoodCard({ item }: FoodCardProps) {
  const { lang } = useLanguage(); // 3. Get current language

  // 4. Logic to get the correct translated name
  const displayName = 
    lang === 'kh' ? (item.name_kh || item.name) : 
    lang === 'zh' ? (item.name_zh || item.name) : 
    item.name;

  return (
    <div className="bg-white p-3 rounded-3xl shadow-sm border border-gray-100 relative flex flex-col h-full hover:shadow-md transition-shadow">
      
      {/* Image Container */}
      <div className="relative h-32 w-full mb-3 shrink-0">
        <img 
          src={item.image} 
          alt={displayName} // Update alt text
          className="object-cover rounded-2xl w-full h-full bg-gray-100"
          loading="lazy"
        />
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 space-y-1">
        <h3 className="font-bold text-gray-900 text-lg leading-tight line-clamp-2">
          {displayName} {/* 5. Display the translated name */}
        </h3>
        
        <div className="flex items-center text-gray-400 text-xs gap-2">
          {item.time && <span>{item.time}</span>}
          {item.rating && (
            <div className="flex items-center gap-0.5">
              <Star size={12} className="text-yellow-400 fill-yellow-400" />
              <span>{item.rating}</span>
            </div>
          )}
        </div>

        {/* Footer: Price Only (Black) */}
        <div className="mt-auto pt-3">
          <span className="font-extrabold text-lg text-gray-900">
            ${item.price.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}