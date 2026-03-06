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
  adminActions?: React.ReactNode;
}

const PLACEHOLDER_IMAGE = 'data:image/svg+xml;charset=utf-8,%3Csvg xmlns%3D"http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg" width%3D"400" height%3D"400" viewBox%3D"0 0 400 400"%3E%3Crect width%3D"400" height%3D"400" fill%3D"%23f3f4f6"%2F%3E%3Ctext x%3D"50%25" y%3D"50%25" dominant-baseline%3D"middle" text-anchor%3D"middle" font-family%3D"sans-serif" font-size%3D"48" font-weight%3D"bold" fill%3D"%239ca3af"%3EN%2FA%3C%2Ftext%3E%3C%2Fsvg%3E';
const getValidImage = (img?: string | null) => (!img || img === 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c') ? PLACEHOLDER_IMAGE : img;

export default function FoodCard({ item, onClick, adminActions }: FoodCardProps) {
  const { lang } = useLanguage(); 

  const displayName = 
    lang === 'kh' ? (item.name_kh || item.name) : 
    lang === 'zh' ? (item.name_zh || item.name) : 
    item.name;

  const categoryDiscount = typeof item.category === 'object' ? (item.category.discount || 0) : 0;
  const effectiveDiscount = (item.discount && item.discount > 0) ? item.discount : categoryDiscount;
  const discountedPrice = effectiveDiscount > 0 ? item.price * (1 - effectiveDiscount / 100) : item.price;

  return (
    <div 
      onClick={onClick} 
      className="bg-white rounded-lg shadow-sm border border-gray-100 relative flex flex-col h-full hover:shadow-md transition-all group cursor-pointer active:scale-[0.98] overflow-hidden"
    >
      
      {/* Badges */}
      <div className="absolute top-4 right-4 flex flex-col gap-2 items-end z-10">
        {item.isPopular && (
           <span className="bg-orange-500 text-white text-[10px] px-3 py-1.5 rounded-full font-extrabold uppercase tracking-wide shadow-md">
             Hot
           </span>
        )}
        {effectiveDiscount > 0 && (
           <span className="bg-red-500 text-white text-[10px] px-3 py-1.5 rounded-full font-extrabold uppercase tracking-wide shadow-md">
             -{effectiveDiscount}%
           </span>
        )}
      </div>

      {/* Image Container */}
      <div className="relative w-full aspect-[5/4] sm:aspect-[4/3] shrink-0 bg-gray-100 overflow-hidden">
        <img 
          src={getValidImage(item.image)} 
          alt={displayName} 
          className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-4 sm:p-5">
        <h3 className="font-bold text-gray-900 text-base sm:text-lg leading-tight line-clamp-2 mb-1.5">
          {displayName} 
        </h3>
        
        <div className="flex items-center text-gray-400 text-xs sm:text-sm gap-3 mb-4">
          {item.time && <span className="font-medium">{item.time}</span>}
          {item.rating && (
            <div className="flex items-center gap-1">
              <Star size={14} className="text-yellow-400 fill-yellow-400" />
              <span className="font-medium">{item.rating}</span>
            </div>
          )}
        </div>

        {/* Footer: Price & Admin Actions */}
        <div className="mt-auto flex items-center justify-between">
          <div>
            {effectiveDiscount > 0 ? (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-extrabold text-lg sm:text-xl text-red-500">
                  ${discountedPrice.toFixed(2)}
                </span>
                <span className="font-semibold text-xs sm:text-sm text-gray-400 line-through">
                  ${item.price.toFixed(2)}
                </span>
              </div>
            ) : (
              <span className="font-extrabold text-lg sm:text-xl text-gray-900">
                ${item.price.toFixed(2)}
              </span>
            )}
          </div>

          {adminActions && (
            <div className="flex gap-1.5 shrink-0 z-10 relative">
              {adminActions}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}