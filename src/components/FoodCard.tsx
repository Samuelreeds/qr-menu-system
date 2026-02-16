import Image from 'next/image';
import { Star, Heart, Plus } from 'lucide-react';
import { MenuItem } from '@/lib/data';

export default function FoodCard({ item }: { item: MenuItem }) {
  return (
    <div className="bg-white p-3 rounded-3xl shadow-sm border border-gray-100 relative">
      {/* Favorite Icon */}

      {/* Image */}
      <div className="relative h-32 w-full mb-3">
        <img 
          src={item.image} 
          alt={item.name}
          className="object-cover rounded-3xl shadow-md w-full h-full"
        />
      </div>

      {/* Content */}
      <div className="space-y-1">
        <h3 className="font-bold text-brand-dark text-lg leading-tight">{item.name}</h3>
        
        <div className="flex items-center text-gray-400 text-xs gap-2">
          <span>{item.time}</span>
          <div className="flex items-center gap-0.5">
            <Star size={12} className="text-yellow-400 fill-yellow-400" />
            <span>{item.rating}</span>
          </div>
        </div>

        <div className="flex items-center justify-between mt-3">
          <span className="font-bold text-lg text-brand-dark">${item.price.toFixed(2)}</span>
          {/* <button className="bg-brand-green text-white p-2 rounded-xl hover:bg-green-600 transition shadow-lg shadow-green-200">
            <Plus size={20} />
          </button> */}
        </div>
      </div>
    </div>
  );
}