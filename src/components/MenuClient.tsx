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

    {/* --- HEADER SECTION (Now following themeColor) --- */}
    <header
      className="relative overflow-hidden pb-8 pt-2 transition-colors duration-300"
      style={{ background: themeColor }} // Dynamically set from database
    >
      {/* Darkening Overlay: Ensures white text/icons are always readable on light theme colors */}
      <div className="absolute inset-0 bg-black/10 z-0" />

      {/* Noise texture */}
      <div
        className="absolute inset-0 pointer-events-none z-0 opacity-30"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Radial glow (Adjusted to be a highlight of the theme color) */}
      <div
        className="absolute pointer-events-none z-0"
        style={{
          top: -20,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 300,
          height: 200,
          background: 'radial-gradient(ellipse, rgba(255,255,255,0.2) 0%, transparent 70%)',
        }}
      />

      <div className="relative z-10 flex flex-col h-full">
        <div className="flex items-center justify-between px-6 pt-6 pb-6 lg:pt-10 lg:pb-8">
          {/* Left — Info */}
          <button
            onClick={() => setIsInfoOpen(true)}
            aria-label="Shop info"
            className="w-10 h-10 rounded-full flex items-center justify-center transition-all flex-shrink-0 shadow-md"
            style={{ border: '1px solid rgba(255,255,255,0.2)', background: '#fff' }}
          >
            <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </button>

          {/* Center — Logo + Name */}
          <div className="flex flex-col items-center gap-1.5">
            <div
              className="rounded-full overflow-hidden flex-shrink-0 bg-white"
              style={{
                width: 60,
                height: 60,
                padding: 0,
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              }}
            >
              <img
                src={logoUrl}
                alt={shopName}
                className="w-full h-full object-cover rounded-full"
              />
            </div>
            <h1 className="text-white tracking-wide text-center text-xl lg:text-3xl mt-1 font-bold drop-shadow-sm">
              {shopName}
            </h1>
          </div>

          {/* Right — Grid/Menu */}
          <button
            aria-label="Menu"
            className="w-10 h-10 rounded-full flex items-center justify-center transition-all flex-shrink-0 shadow-md"
            style={{ border: '1px solid rgba(255,255,255,0.2)', background: '#fff' }}
          >
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#000">
              <rect x="3" y="3" width="7" height="7" rx="1.5" strokeWidth={2.5}/>
              <rect x="14" y="3" width="7" height="7" rx="1.5" strokeWidth={2.5}/>
              <rect x="3" y="14" width="7" height="7" rx="1.5" strokeWidth={2.5}/>
              <rect x="14" y="14" width="7" height="7" rx="1.5" strokeWidth={2.5}/>
            </svg>
          </button>
        </div>
      </div>
    </header>

    {/* --- BODY SECTION --- */}
    <div className="px-4 mt-6">
      <div className="mb-6"><SearchBar value={searchQuery} onChange={setSearchQuery} /></div>

      <div className="mb-8">
        <div 
          className="flex gap-3 overflow-x-auto pb-4 no-scrollbar" 
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
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

          {categories.map((cat) => (
            <button 
              key={cat.id}
              onClick={() => setActiveCategory(cat.name)}
              className={`px-6 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all border ${
                activeCategory === cat.name 
                  ? 'text-white shadow-md border-transparent' 
                  : 'bg-white border-gray-100 text-gray-500 hover:bg-gray-50'
              }`}
              style={activeCategory === cat.name ? { backgroundColor: themeColor } : {}}
            >
              {getCategoryName(cat)}
            </button>
          ))}
        </div>
      </div>

      {/* Product list logic remains the same... */}
      {activeCategory === 'All' ? (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {categories.map((cat) => {
            const catProducts = initialProducts.filter(p => getProductCategoryString(p) === cat.name);
            const visibleProducts = getProductsBySearch(catProducts);
            if (visibleProducts.length === 0) return null;

            return (
              <section key={cat.id}>
                <h2 className="font-extrabold text-xl text-gray-900 mb-5 px-1 flex items-center gap-3">
                  {getCategoryName(cat)}
                  <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">{visibleProducts.length}</span>
                </h2>
                <div className="grid grid-cols-2 gap-x-4 gap-y-6">
                  {visibleProducts.map((item) => (
                    <FoodCard key={item.id} item={item} themeColor={themeColor} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-x-4 gap-y-6">
          {initialProducts
            .filter(p => getProductCategoryString(p) === activeCategory)
            .map((item) => (
              <FoodCard key={item.id} item={item} themeColor={themeColor} />
            ))
          }
        </div>
      )}
    </div>

    <CartFloat themeColor={themeColor} />
  </main>
);}