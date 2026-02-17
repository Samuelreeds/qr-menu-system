'use client';

import { useState } from 'react';
import SearchBar from '@/components/SearchBar';
import FoodCard from '@/components/FoodCard';
import ShopInfoModal from '@/components/ShopInfoModal';
import CartFloat from '@/components/CartFloat'; 
import { MapPin } from 'lucide-react'; 


// --- TYPES ---
interface ShopSettings {
  name: string;
  address?: string;
  phone?: string;
  themeColor: string;
  logo?: string;
  facebook?: string; showFacebook: boolean;
  instagram?: string; showInstagram: boolean;
  telegram?: string; showTelegram: boolean;
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

interface Category { id: string; name: string; }

interface MenuClientProps {
  initialProducts: Product[];
  categories: Category[];
  shopSettings: ShopSettings;
}

export default function MenuClient({ initialProducts, categories, shopSettings }: MenuClientProps) {
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isInfoOpen, setIsInfoOpen] = useState(false);

  // Default values
  const shopName = shopSettings?.name || 'Gourmet Shop';
  const themeColor = shopSettings?.themeColor || '#5CB85C'; 
  const logoUrl = shopSettings?.logo || 'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?auto=format&fit=crop&w=100&q=80';

  const getCategoryName = (product: Product) => {
    if (typeof product.category === 'string') return product.category;
    return product.category?.name || 'Unknown';
  };

  const getProductsBySearch = (products: Product[]) => {
    if (!searchQuery) return products;
    return products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
  };

  return (
    <main 
      className="min-h-screen bg-gray-50/30 max-w-md mx-auto relative pb-24"
      style={{ '--brand-color': themeColor } as React.CSSProperties}
    >
      
      <ShopInfoModal 
        isOpen={isInfoOpen} 
        onClose={() => setIsInfoOpen(false)} 
        // @ts-ignore
        settings={shopSettings}
      />

      <div className="px-6 pt-6">
        {/* --- HEADER --- */}
        <button 
          onClick={() => setIsInfoOpen(true)}
          className="w-full flex items-center justify-center gap-3 mb-6 hover:opacity-80 transition-opacity"
        >
          <div className="relative w-12 h-12 rounded-full overflow-hidden shadow-sm border border-gray-200 bg-white">
            <img src={logoUrl} alt={shopName} className="object-cover w-full h-full" />
          </div>
          <div className="text-left">
             <h1 className="font-bold text-2xl text-gray-900 tracking-tight leading-none">{shopName}</h1>
             {shopSettings.address && (
               <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                 <MapPin size={12} />
                 <span className="truncate max-w-[150px]">{shopSettings.address}</span>
               </div>
             )}
          </div>
        </button>

        {/* --- SEARCH --- */}
        <div className="mb-6"><SearchBar value={searchQuery} onChange={setSearchQuery} /></div>

        {/* --- CATEGORIES --- */}
        <div className="mb-8">
          <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-custom">
            <button 
                onClick={() => setActiveCategory('All')}
                className={`px-6 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all border ${activeCategory === 'All' ? 'bg-white border-2 shadow-sm' : 'bg-white border-gray-100 text-gray-500 hover:bg-gray-50'}`}
                style={activeCategory === 'All' ? { borderColor: themeColor, color: themeColor } : {}}
              >All</button>
            {categories.map((cat) => (
              <button 
                key={cat.id}
                onClick={() => setActiveCategory(cat.name)}
                className={`px-6 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all border ${activeCategory === cat.name ? 'bg-white border-2 shadow-sm' : 'bg-white border-gray-100 text-gray-500 hover:bg-gray-50'}`}
                style={activeCategory === cat.name ? { borderColor: themeColor, color: themeColor } : {}}
              >{cat.name}</button>
            ))}
          </div>
        </div>

        {/* --- PRODUCT LIST --- */}
        {activeCategory === 'All' ? (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {categories.map((cat) => {
              const catProducts = initialProducts.filter(p => getCategoryName(p) === cat.name);
              const visibleProducts = getProductsBySearch(catProducts);
              if (visibleProducts.length === 0) return null;

              return (
                <section key={cat.id}>
                  <h2 className="font-extrabold text-xl text-gray-900 mb-5 px-1 flex items-center gap-3">
                    {cat.name}
                    <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">{visibleProducts.length}</span>
                  </h2>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-6">
                    {visibleProducts.map((item) => (
                      <FoodCard key={item.id} item={{...item, category: getCategoryName(item)}} themeColor={themeColor} />
                    ))}
                  </div>
                </section>
              );
            })}
             {initialProducts.length > 0 && getProductsBySearch(initialProducts).length === 0 && (
               <div className="text-center py-20"><p className="text-gray-300 text-lg font-medium">No results found</p></div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-6 animate-in fade-in zoom-in-95 duration-300">
            {(() => {
              const catProducts = initialProducts.filter(p => getCategoryName(p) === activeCategory);
              const visibleProducts = getProductsBySearch(catProducts);
              
              if (visibleProducts.length === 0) return <div className="col-span-2 text-center py-20 text-gray-400"><p>No items.</p></div>;

              return visibleProducts.map((item) => (
                <FoodCard key={item.id} item={{...item, category: getCategoryName(item)}} themeColor={themeColor} />
              ));
            })()}
          </div>
        )}
      </div>

      <CartFloat themeColor={themeColor} />
    </main>
  );
}