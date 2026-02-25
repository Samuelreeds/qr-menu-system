'use client';

import { Star } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext'; 

interface MenuItem {
  id: string;
  name: string;
  name_kh?: string | null; 
  name_zh?: string | null; 
  price: number;
  image: string;
  time?: string;
  rating?: number;
  discount?: number;
  category?: string | { name: string, discount?: number };
  isPopular?: boolean;
}

interface FoodCardProps {
  item: MenuItem;
  themeColor?: string; 
  onClick?: () => void;
}

export default function FoodCard({ item, onClick }: FoodCardProps) {
  const { lang } = useLanguage(); 

  const displayName = 
    lang === 'kh' ? (item.name_kh || item.name) : 
    lang === 'zh' ? (item.name_zh || item.name) : 
    item.name;

  const categoryDiscount = typeof item.category === 'object' ? (item.category.discount || 0) : 0;
  const effectiveDiscount = (item.discount && item.discount > 0) ? item.discount : categoryDiscount;
  const discountedPrice = effectiveDiscount > 0 ? item.price * (1 - effectiveDiscount / 100) : item.price;

  return (
    <div onClick={onClick} className="bg-white p-3 sm:p-4 rounded-3xl shadow-sm border border-gray-100 relative flex flex-col h-full hover:shadow-md transition-all group cursor-pointer active:scale-[0.98]">
      
      {/* Badges */}
      <div className="absolute top-5 right-5 flex flex-col gap-1.5 items-end z-10">
        {item.isPopular && (
           <span className="bg-orange-500 text-white text-[10px] px-2.5 py-1 rounded-full font-extrabold uppercase tracking-wide shadow-md">
             Hot
           </span>
        )}
        {effectiveDiscount > 0 && (
           <span className="bg-red-500 text-white text-[10px] px-2.5 py-1 rounded-full font-extrabold uppercase tracking-wide shadow-md">
             -{effectiveDiscount}%
           </span>
        )}
      </div>

      {/* Image Container */}
      <div className="relative w-full aspect-square mb-3 shrink-0 overflow-hidden rounded-2xl bg-gray-100">
        <img 
          src={item.image} 
          alt={displayName} 
          className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 space-y-1">
        <h3 className="font-bold text-gray-900 text-lg sm:text-xl leading-tight line-clamp-2">
          {displayName} 
        </h3>
        
        <div className="flex items-center text-gray-400 text-xs sm:text-sm gap-2">
          {item.time && <span>{item.time}</span>}
          {item.rating && (
            <div className="flex items-center gap-0.5">
              <Star size={12} className="text-yellow-400 fill-yellow-400" />
              <span>{item.rating}</span>
            </div>
          )}
        </div>

        {/* Footer: Price */}
        <div className="mt-auto pt-3 flex items-center justify-between">
          <div>
            {effectiveDiscount > 0 ? (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-extrabold text-lg sm:text-xl text-red-500">
                  ${discountedPrice.toFixed(2)}
                </span>
                <span className="font-medium text-xs sm:text-sm text-gray-400 line-through">
                  ${item.price.toFixed(2)}
                </span>
              </div>
            ) : (
              <span className="font-extrabold text-lg sm:text-xl text-gray-900">
                ${item.price.toFixed(2)}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}