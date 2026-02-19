'use client';

import { useState } from 'react';
import SearchBar from '@/components/SearchBar';
import FoodCard from '@/components/FoodCard';
import ShopInfoModal from '@/components/ShopInfoModal';
import CartFloat from '@/components/CartFloat'; 
import { useLanguage } from '@/context/LanguageContext'; // 1. Import Language Hook

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

// 2. Update Types to include language fields
interface Product {
  id: string;
  name: string;
  name_kh?: string | null; // Added
  name_zh?: string | null; // Added
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
  name_kh?: string | null; // Added
  name_zh?: string | null; // Added
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
  const { lang } = useLanguage(); // 3. Get current language

  // Default values
  const shopName = shopSettings?.name || 'Gourmet Shop';
  const themeColor = shopSettings?.themeColor || '#5CB85C'; 
  const logoUrl = shopSettings?.logo || 'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?auto=format&fit=crop&w=100&q=80';

  // 4. Helper to Translate Category Name
  const getCategoryName = (cat: Category) => {
    if (lang === 'kh') return cat.name_kh || cat.name;
    if (lang === 'zh') return cat.name_zh || cat.name;
    return cat.name;
  };

  // Helper to handle product category string/object craziness
  const getProductCategoryString = (product: Product) => {
    if (typeof product.category === 'string') return product.category;
    return product.category?.name || 'Unknown';
  };

  // 5. Update Search to check ALL languages
  const getProductsBySearch = (products: Product[]) => {
    if (!searchQuery) return products;
    const lowerQuery = searchQuery.toLowerCase();
    return products.filter(p => 
      p.name.toLowerCase().includes(lowerQuery) || 
      (p.name_kh && p.name_kh.includes(searchQuery)) ||
      (p.name_zh && p.name_zh.includes(searchQuery))
    );
  };

  return (
    // Inside MenuClient.tsx
      <main 
        className="font-sans min-h-screen bg-gray-50/30 max-w-md mx-auto relative pb-24"
        style={{ '--brand-color': themeColor } as React.CSSProperties}
      >
      
      <ShopInfoModal 
        isOpen={isInfoOpen} 
        onClose={() => setIsInfoOpen(false)} 
        // @ts-ignore
        settings={shopSettings}
      />

      <div className="px-6 pt-6">
        {/* --- HEADER (FIXED: LEFT ALIGNED) --- */}
        <button 
          onClick={() => setIsInfoOpen(true)}
          className="w-full flex items-center justify-start gap-4 mb-6 hover:opacity-80 transition-opacity" // Changed justify-between to justify-start
        >
          {/* Logo */}
          <div className="relative w-14 h-14 rounded-full overflow-hidden shadow-sm border border-gray-200 bg-white shrink-0">
            <img src={logoUrl} alt={shopName} className="object-cover w-full h-full" />
          </div>

          {/* Text Left */}
          <div className="text-left flex flex-col justify-center"> 
             <h1 className="font-bold text-2xl text-gray-900 tracking-tight leading-none">{shopName}</h1>
             <p className="text-xs text-gray-500 font-medium mt-1">Tap for info & location</p>
          </div>
        </button>

        {/* --- SEARCH --- */}
        <div className="mb-6"><SearchBar value={searchQuery} onChange={setSearchQuery} /></div>

        {/* --- CATEGORIES --- */}
        <div className="mb-8">
          <div 
            className="flex gap-3 overflow-x-auto pb-4 [&::-webkit-scrollbar]:hidden" 
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {/* ALL BUTTON */}
            <button 
                onClick={() => setActiveCategory('All')}
                className={`px-6 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all border ${
                  activeCategory === 'All' 
                    ? 'text-white shadow-md border-transparent' 
                    : 'bg-white border-gray-100 text-gray-500 hover:bg-gray-50'
                }`}
                style={activeCategory === 'All' ? { backgroundColor: themeColor } : {}}
              >
                {lang === 'kh' ? 'ទាំងអស់' : lang === 'zh' ? '全部' : 'All'}
            </button>

            {/* DYNAMIC CATEGORIES (Translated) */}
            {categories.map((cat) => (
              <button 
                key={cat.id}
                onClick={() => setActiveCategory(cat.name)} // Keep English ID for logic
                className={`px-6 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all border ${
                  activeCategory === cat.name 
                    ? 'text-white shadow-md border-transparent' 
                    : 'bg-white border-gray-100 text-gray-500 hover:bg-gray-50'
                }`}
                style={activeCategory === cat.name ? { backgroundColor: themeColor } : {}}
              >
                {getCategoryName(cat)} {/* Display Translated Name */}
              </button>
            ))}
          </div>
        </div>

        {/* --- PRODUCT LIST --- */}
        {activeCategory === 'All' ? (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {categories.map((cat) => {
              const catProducts = initialProducts.filter(p => getProductCategoryString(p) === cat.name);
              const visibleProducts = getProductsBySearch(catProducts);
              if (visibleProducts.length === 0) return null;

              return (
                <section key={cat.id}>
                  {/* Category Header (Translated) */}
                  <h2 className="font-extrabold text-xl text-gray-900 mb-5 px-1 flex items-center gap-3">
                    {getCategoryName(cat)}
                    <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">{visibleProducts.length}</span>
                  </h2>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-6">
                    {visibleProducts.map((item) => (
                      <FoodCard 
                        key={item.id} 
                        item={item} // Pass the whole item (FoodCard handles translation now)
                        themeColor={themeColor} 
                      />
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
              const catProducts = initialProducts.filter(p => getProductCategoryString(p) === activeCategory);
              const visibleProducts = getProductsBySearch(catProducts);
              
              if (visibleProducts.length === 0) return <div className="col-span-2 text-center py-20 text-gray-400"><p>No items.</p></div>;

              return visibleProducts.map((item) => (
                <FoodCard key={item.id} item={item} themeColor={themeColor} />
              ));
            })()}
          </div>
        )}
      </div>

      <CartFloat themeColor={themeColor} />
    </main>
  );
}