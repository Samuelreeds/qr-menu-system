'use client';

import { useState } from 'react';
import Image from 'next/image';
import SearchBar from '@/components/SearchBar';
import FoodCard from '@/components/FoodCard';
import ShopInfoModal from '@/components/ShopInfoModal';
import CartFloat from '@/components/CartFloat'; // Assuming you kept this from V1.5
import { MapPin } from 'lucide-react';

// --- TYPES ---
interface ShopSettings {
  name: string;
  description?: string;
  logo?: string;
  address?: string;
  phone?: string;
  themeColor: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  rating: number;
  time: string;
  image: string;
  categoryId: string;
  category: { name: string } | string;
}

interface Category {
  id: string;
  name: string;
}

interface MenuClientProps {
  initialProducts: Product[];
  categories: Category[];
  shopSettings: ShopSettings;
}

export default function MenuClient({ initialProducts, categories, shopSettings }: MenuClientProps) {
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isInfoOpen, setIsInfoOpen] = useState(false);

  // Default values if settings are missing
  const shopName = shopSettings?.name || 'Gourmet Shop';
  const themeColor = shopSettings?.themeColor || '#5CB85C'; // Default Green
  const logoUrl = shopSettings?.logo || 'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?auto=format&fit=crop&w=100&q=80';

  // Helper: Get category name safely
  const getCategoryName = (product: Product) => {
    if (typeof product.category === 'string') return product.category;
    return product.category?.name || 'Unknown';
  };

  // Helper: Filter products by search query
  const getProductsBySearch = (products: Product[]) => {
    if (!searchQuery) return products;
    return products.filter(p => 
      p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  return (
    <main 
      className="min-h-screen bg-gray-50/30 max-w-md mx-auto relative pb-24"
      // Inject user's theme color as a CSS variable for easy use
      style={{ '--brand-color': themeColor } as React.CSSProperties}
    >
      
      {/* Pass settings to the modal so it shows real info */}
      <ShopInfoModal 
        isOpen={isInfoOpen} 
        onClose={() => setIsInfoOpen(false)} 
        // @ts-ignore - We will update ShopInfoModal types next if needed
        settings={shopSettings}
      />

      <div className="px-6 pt-6">
        {/* --- HEADER (Dynamic) --- */}
        <button 
          onClick={() => setIsInfoOpen(true)}
          className="w-full flex items-center justify-center gap-3 mb-6 hover:opacity-80 transition-opacity"
        >
          {/* Dynamic Logo */}
          <div className="relative w-12 h-12 rounded-full overflow-hidden shadow-sm border border-gray-200 bg-white">
            <img 
              src={logoUrl} 
              alt={shopName}
              className="object-cover w-full h-full"
            />
          </div>
          
          {/* Dynamic Shop Name */}
          <div className="text-left">
             <h1 className="font-bold text-2xl text-gray-900 tracking-tight leading-none">
              {shopName}
            </h1>
            {shopSettings.address && (
              <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                <MapPin size={12} />
                <span className="truncate max-w-[150px]">{shopSettings.address}</span>
              </div>
            )}
          </div>
        </button>

        {/* --- SEARCH BAR --- */}
        <div className="mb-6">
          <SearchBar value={searchQuery} onChange={setSearchQuery} />
        </div>

        {/* --- CATEGORIES (Dynamic Color) --- */}
        <div className="mb-8">
          <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-custom">
            <button 
                onClick={() => setActiveCategory('All')}
                className={`px-6 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all border ${
                  activeCategory === 'All'
                    ? 'bg-white border-2 text-gray-900 shadow-sm' 
                    : 'bg-white border-gray-100 text-gray-500 hover:bg-gray-50'
                }`}
                // Apply dynamic border color only when active
                style={activeCategory === 'All' ? { borderColor: themeColor, color: themeColor } : {}}
              >
                All
            </button>
            {categories.map((cat) => (
              <button 
                key={cat.id}
                onClick={() => setActiveCategory(cat.name)}
                className={`px-6 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all border ${
                  activeCategory === cat.name
                    ? 'bg-white border-2 text-gray-900 shadow-sm' 
                    : 'bg-white border-gray-100 text-gray-500 hover:bg-gray-50'
                }`}
                style={activeCategory === cat.name ? { borderColor: themeColor, color: themeColor } : {}}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* --- MAIN CONTENT AREA --- */}
        
        {activeCategory === 'All' ? (
          // VIEW 1: GROUPED BY CATEGORY
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {categories.map((cat) => {
              const catProducts = initialProducts.filter(p => getCategoryName(p) === cat.name);
              const visibleProducts = getProductsBySearch(catProducts);

              if (visibleProducts.length === 0) return null;

              return (
                <section key={cat.id}>
                  <h2 className="font-extrabold text-xl text-gray-900 mb-5 px-1 flex items-center gap-3">
                    {cat.name}
                    <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
                      {visibleProducts.length}
                    </span>
                  </h2>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-6">
                    {visibleProducts.map((item) => (
                      // @ts-ignore
                      <FoodCard key={item.id} item={item} themeColor={themeColor} />
                    ))}
                  </div>
                </section>
              );
            })}
             {/* Empty State */}
             {initialProducts.length > 0 && getProductsBySearch(initialProducts).length === 0 && (
               <div className="text-center py-20">
                  <p className="text-gray-300 text-lg font-medium">No results found for "{searchQuery}"</p>
               </div>
            )}
          </div>

        ) : (
          // VIEW 2: SINGLE CATEGORY GRID
          <div className="grid grid-cols-2 gap-x-4 gap-y-6 animate-in fade-in zoom-in-95 duration-300">
            {(() => {
              const catProducts = initialProducts.filter(p => getCategoryName(p) === activeCategory);
              const visibleProducts = getProductsBySearch(catProducts);
              
              if (visibleProducts.length === 0) {
                return (
                  <div className="col-span-2 text-center py-20 text-gray-400">
                    <p>No {activeCategory} available yet.</p>
                  </div>
                );
              }

              return visibleProducts.map((item) => (
                 // @ts-ignore
                <FoodCard key={item.id} item={item} themeColor={themeColor} />
              ));
            })()}
          </div>
        )}
      </div>

      {/* Floating Cart Bar */}
      <CartFloat themeColor={themeColor} />

    </main>
  );
}