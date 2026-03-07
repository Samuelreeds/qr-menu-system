'use client';

import { useState, useEffect, useRef } from 'react';
import SearchBar from '@/components/SearchBar';
import LangSwitcher from '@/components/LangSwitcher';
import FoodCard from '@/components/FoodCard';
import ShopInfoModal from '@/components/ShopInfoModal';
import CartFloat from '@/components/CartFloat'; 
import { useLanguage } from '@/context/LanguageContext'; 
import { Menu, X, Star } from 'lucide-react';

const PLACEHOLDER_IMAGE = 'data:image/svg+xml;charset=utf-8,%3Csvg xmlns%3D"http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg" width%3D"400" height%3D"400" viewBox%3D"0 0 400 400"%3E%3Crect width%3D"400" height%3D"400" fill%3D"%23f3f4f6"%2F%3E%3Ctext x%3D"50%25" y%3D"50%25" dominant-baseline%3D"middle" text-anchor%3D"middle" font-family%3D"sans-serif" font-size%3D"48" font-weight%3D"bold" fill%3D"%239ca3af"%3EN%2FA%3C%2Ftext%3E%3C%2Fsvg%3E';
const getValidImage = (img?: string | null) => (!img || img === 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c') ? PLACEHOLDER_IMAGE : img;

interface ShopSettings {
  name: string;
  name_kh?: string | null;
  nameDisplay?: string;
  address?: string;
  phone?: string;
  openingHours?: string | null;
  themeColor: string;
  headerDesign?: string;
  logo?: string;
  logoType?: string | null;
  facebook?: string; showFacebook: boolean;
  instagram?: string; showInstagram: boolean;
  telegram?: string; showTelegram: boolean;
  socials: string; 
}

interface Product {
  id: string;
  name: string;
  name_kh?: string | null; 
  name_zh?: string | null; 
  price: number;
  rating: number;
  time: string;
  image: string;
  categoryId: string;
  category: { name: string, discount?: number } | string;
  discount?: number;
  isPopular?: boolean;
}

interface Banner {
  id: string;
  image: string;
  sortOrder?: number;
}

interface Category { 
  id: string; 
  name: string; 
  name_kh?: string | null; 
  name_zh?: string | null; 
}

interface MenuClientProps {
  initialProducts: Product[];
  categories: Category[];
  shopSettings: ShopSettings;
  banners?: Banner[];
  multiLanguageEnabled?: boolean;
}

export default function MenuClient({ initialProducts, categories, shopSettings, banners = [], multiLanguageEnabled = false }: MenuClientProps) {
  const hasPopularProducts = initialProducts.some(p => p.isPopular);
  
  const [activeCategory, setActiveCategory] = useState(
    hasPopularProducts ? 'Hot Sale' : (categories.length > 0 ? categories[0].name : '')
  );
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Product | null>(null);
  const [currentBanner, setCurrentBanner] = useState(0);
  
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  
  const sectionRefs = useRef<{ [key: string]: HTMLElement | null }>({});
  const categoryNavRef = useRef<HTMLDivElement>(null);
  const isManualScrolling = useRef(false);

  const { lang, setMultiLangEnabled } = useLanguage(); 

  useEffect(() => {
    if (setMultiLangEnabled) {
      setMultiLangEnabled(multiLanguageEnabled);
    }
  }, [multiLanguageEnabled, setMultiLangEnabled]);

  useEffect(() => {
    const handleScroll = () => {
      if (isManualScrolling.current || searchQuery) return;

      const offset = 140; 
      const scrollPosition = window.scrollY + offset;

      for (const cat of categories) {
        const section = sectionRefs.current[cat.name];
        if (section) {
          const { top, bottom } = section.getBoundingClientRect();
          const absoluteTop = top + window.scrollY;
          const absoluteBottom = bottom + window.scrollY;

          if (scrollPosition >= absoluteTop && scrollPosition < absoluteBottom) {
            setActiveCategory(cat.name);
            const tab = document.getElementById(`tab-${cat.id}`);
            if (tab && categoryNavRef.current) {
              categoryNavRef.current.scrollTo({
                left: tab.offsetLeft - (categoryNavRef.current.offsetWidth / 2) + (tab.offsetWidth / 2),
                behavior: 'smooth'
              });
            }
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [categories, searchQuery]);

  const scrollToCategory = (categoryName: string) => {
    const section = sectionRefs.current[categoryName];
    if (section) {
      isManualScrolling.current = true;
      setActiveCategory(categoryName);
      const offset = 120; 
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = section.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });

      setTimeout(() => {
        isManualScrolling.current = false;
      }, 1000);
    }
  };

  const themeColor = shopSettings?.themeColor || '#5CB85C'; 
  const headerDesign = shopSettings?.headerDesign || 'design1';
  const logoUrl = shopSettings?.logo || '';
  const displayShopName = shopSettings?.name || 'Shop';
  const isNoBg = shopSettings?.logoType === 'withoutBackground';

  const getCategoryName = (cat: Category) => {
    if (lang === 'kh') return cat.name_kh || cat.name;
    if (lang === 'zh' && multiLanguageEnabled) return cat.name_zh || cat.name;
    return cat.name;
  };

  const getProductCategoryString = (product: Product) => {
    if (typeof product.category === 'string') return product.category;
    return product.category?.name || 'Unknown';
  };

  const getProductsBySearch = (products: Product[]) => {
    if (!searchQuery) return products;
    const lowerQuery = searchQuery.toLowerCase();
    return products.filter(p => 
      p.name.toLowerCase().includes(lowerQuery) || 
      (p.name_kh && p.name_kh.includes(searchQuery)) ||
      (multiLanguageEnabled && p.name_zh && p.name_zh.includes(searchQuery))
    );
  };

  return (
    <main 
      className="font-sans min-h-screen bg-white w-full relative pb-24"
      style={{ '--brand-color': themeColor } as React.CSSProperties}
    >
      <ShopInfoModal isOpen={isInfoOpen} onClose={() => setIsInfoOpen(false)} settings={shopSettings} />

      {/* --- SYNCED DYNAMIC HEADER --- */}
      <header className="relative overflow-hidden min-h-[160px]" style={{ background: themeColor }}>
        <div className="absolute inset-0 bg-black/10 z-0" />
        
        {/* Optional Noise/Gradient Backgrounds */}
        <div className="absolute inset-0 pointer-events-none z-0 opacity-30" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E")` }} />
        <div className="absolute pointer-events-none z-0" style={{ top: -20, left: '50%', transform: 'translateX(-50%)', width: 300, height: 200, background: 'radial-gradient(ellipse, rgba(255,255,255,0.2) 0%, transparent 70%)' }} />

        <div className="relative z-10 flex flex-col items-center justify-center pt-12 pb-8 px-4 h-full">
          <div className="absolute top-4 left-0 right-0 px-4 flex justify-between items-center w-full max-w-7xl mx-auto z-20 pointer-events-none">
              <button 
                onClick={() => setIsInfoOpen(true)} 
                className="p-2.5 rounded-xl bg-white/20 backdrop-blur-md border border-white/30 text-white active:scale-95 flex-shrink-0 pointer-events-auto shadow-sm"
              >
                <Menu size={20} />
              </button>
              <div className="flex-shrink-0 pointer-events-auto">
                <LangSwitcher />
              </div>
          </div>
          
          <div className="flex-1 flex flex-col items-center justify-center w-full mt-2">
            {headerDesign === 'design2' ? (
              <h1 className="text-white tracking-wide text-center text-3xl sm:text-4xl font-bold drop-shadow-sm w-full">{displayShopName}</h1>
            ) : headerDesign === 'design3' ? (
              <div className="flex flex-col items-center gap-3">
                <div className={`flex-shrink-0 flex items-center justify-center ${isNoBg ? 'w-20 h-20' : 'rounded-2xl overflow-hidden bg-white w-20 h-20 shadow-xl p-0.5'}`}>
                   <img src={logoUrl || PLACEHOLDER_IMAGE} alt={displayShopName} className={`w-full h-full ${isNoBg ? 'object-contain' : 'object-cover rounded-[14px]'}`} />
                </div>
                <h1 className="text-white tracking-wide text-center text-2xl font-bold drop-shadow-sm">{displayShopName}</h1>
              </div>
            ) : headerDesign === 'design4' ? (
              <div className="flex items-center gap-4 w-full max-w-sm mx-auto justify-center">
                <div className={`flex-shrink-0 flex items-center justify-center ${isNoBg ? 'w-16 h-16' : 'rounded-full overflow-hidden bg-white w-16 h-16 shadow-lg p-0.5'}`}>
                   <img src={logoUrl || PLACEHOLDER_IMAGE} alt={displayShopName} className={`w-full h-full ${isNoBg ? 'object-contain' : 'object-cover rounded-full'}`} />
                </div>
                <h1 className="text-white tracking-wide text-left text-2xl font-bold drop-shadow-sm">{displayShopName}</h1>
              </div>
            ) : headerDesign === 'design5' ? (
              <div className="flex flex-col items-center w-full">
                {logoUrl ? (
                  <div className={`flex-shrink-0 flex items-center justify-center ${isNoBg ? 'w-24 h-24' : 'rounded-2xl overflow-hidden bg-white w-24 h-24 shadow-xl p-0.5'}`}>
                     <img src={logoUrl} alt={displayShopName} className={`w-full h-full ${isNoBg ? 'object-contain' : 'object-cover rounded-[14px]'}`} />
                  </div>
                ) : (
                  <h1 className="text-white tracking-wide text-center text-3xl sm:text-4xl font-bold drop-shadow-sm">{displayShopName}</h1>
                )}
              </div>
            ) : headerDesign === 'design7' ? (
              <div className="flex flex-col items-center w-full">
                {logoUrl ? (
                  <div className={`flex-shrink-0 flex items-center justify-center ${isNoBg ? 'w-24 h-24' : 'rounded-full overflow-hidden bg-white w-24 h-24 shadow-xl p-0.5'}`}>
                     <img src={logoUrl} alt={displayShopName} className={`w-full h-full ${isNoBg ? 'object-contain' : 'object-cover rounded-full'}`} />
                  </div>
                ) : (
                  <h1 className="text-white tracking-wide text-center text-3xl sm:text-4xl font-bold drop-shadow-sm">{displayShopName}</h1>
                )}
              </div>
            ) : headerDesign === 'design6' ? (
              <div className="flex items-center justify-between w-full max-w-sm mx-auto gap-3 pt-2">
                <div className={`flex-shrink-0 flex items-center justify-center ${isNoBg && logoUrl ? 'w-12 h-12' : 'rounded-full overflow-hidden bg-white w-12 h-12 shadow-sm p-0.5'}`}>
                  {logoUrl ? (
                    <img src={logoUrl} alt={displayShopName} className={`w-full h-full ${isNoBg ? 'object-contain' : 'object-cover rounded-full'}`} />
                  ) : (
                    <div className="w-full h-full bg-gray-200 rounded-full flex items-center justify-center text-gray-500 font-bold text-xl">{displayShopName.charAt(0).toUpperCase()}</div>
                  )}
                </div>
                <h1 className="text-white tracking-wide text-center text-xl sm:text-2xl font-bold drop-shadow-sm flex-1 truncate px-2">{displayShopName}</h1>
              </div>
            ) : (
              // Default design1
              <div className="flex flex-col items-center gap-2">
                <div className={`flex-shrink-0 flex items-center justify-center ${isNoBg ? 'w-20 h-20 mb-3' : 'rounded-full overflow-hidden bg-white w-20 h-20 shadow-xl p-0.5 mb-3'}`}>
                   <img src={logoUrl || PLACEHOLDER_IMAGE} alt={displayShopName} className={`w-full h-full ${isNoBg ? 'object-contain' : 'object-cover rounded-full'}`} />
                </div>
                <h1 className="text-white text-2xl font-bold drop-shadow-sm">{displayShopName}</h1>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* --- BORDERLESS STICKY CONTROLS --- */}
      <div className="sticky top-0 z-40 bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="shrink-0">
            <SearchBar value={searchQuery} onChange={setSearchQuery} />
          </div>

          <div 
            ref={categoryNavRef}
            className="flex-1 flex gap-2 overflow-x-auto no-scrollbar items-center py-1 scroll-smooth" 
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {hasPopularProducts && (
              <button 
                  onClick={() => {
                    setActiveCategory('Hot Sale');
                    scrollToCategory('Hot Sale');
                  }}
                  className={`px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all border shrink-0 ${
                    activeCategory === 'Hot Sale' 
                      ? 'text-white shadow-md border-transparent' 
                      : 'bg-orange-50 border-orange-100 text-orange-600 hover:bg-orange-100'
                  }`}
                  style={activeCategory === 'Hot Sale' ? { backgroundColor: themeColor } : {}}
                >
                  🔥 {lang === 'kh' ? 'ពេញនិយម' : lang === 'zh' && multiLanguageEnabled ? '热卖' : 'Hot Sale'}
              </button>
            )}

            {categories.map((cat) => (
              <button 
                key={cat.id}
                id={`tab-${cat.id}`}
                onClick={() => {
                  setActiveCategory(cat.name);
                  scrollToCategory(cat.name);
                }}
                className={`px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all shrink-0 border ${
                  activeCategory === cat.name 
                    ? 'text-white shadow-md border-transparent' 
                    : 'bg-gray-50 border-gray-100 text-gray-500 hover:bg-gray-100'
                }`}
                style={activeCategory === cat.name ? { backgroundColor: themeColor } : {}}
              >
                {getCategoryName(cat)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full mt-6">
        {!searchQuery && banners && banners.length > 0 && (
          <div className="w-full relative aspect-[21/9] sm:aspect-[4/1] mb-10 rounded-2xl overflow-hidden shadow-sm bg-gray-50 border border-gray-100"
            onTouchStart={(e) => setTouchStart(e.targetTouches[0].clientX)}
            onTouchMove={(e) => setTouchEnd(e.targetTouches[0].clientX)}
            onTouchEnd={() => {
              if (!touchStart || !touchEnd) return;
              if (touchStart - touchEnd > 50) setCurrentBanner((prev) => (prev + 1) % banners.length);
              if (touchStart - touchEnd < -50) setCurrentBanner((prev) => (prev === 0 ? banners.length - 1 : prev - 1));
              setTouchStart(0);
              setTouchEnd(0);
            }}
          >
            {banners.map((b, i) => (
              <img key={b.id} src={b.image} className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-500 ${i === currentBanner ? 'opacity-100 z-10' : 'opacity-0 z-0'}`} alt={`Banner ${i + 1}`} />
            ))}
            {banners.length > 1 && (
              <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5 z-30 pb-1">
                {banners.map((_, i) => (
                  <button key={i} onClick={() => setCurrentBanner(i)} className={`h-1.5 rounded-full transition-all ${i === currentBanner ? 'bg-[var(--brand-color)] w-5' : 'bg-gray-300/80 w-1.5'}`} />
                ))}
              </div>
            )}
          </div>
        )}

        <div className="space-y-12">
          {searchQuery ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {getProductsBySearch(initialProducts).map((item) => (
                <FoodCard key={item.id} item={item as any} themeColor={themeColor} onClick={() => setSelectedItem(item)} />
              ))}
            </div>
          ) : (
            <>
              {hasPopularProducts && (
                <section key="hot-sale" ref={el => { sectionRefs.current['Hot Sale'] = el }} className="scroll-mt-32">
                  <h2 className="font-extrabold text-xl text-gray-900 mb-6 flex items-center gap-2">
                    🔥 {lang === 'kh' ? 'ពេញនិយម' : lang === 'zh' && multiLanguageEnabled ? '热卖' : 'Hot Sale'}
                    <div className="h-1 flex-1 bg-gray-50 rounded-full ml-2" />
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {initialProducts.filter(p => p.isPopular).map((item) => (
                      <FoodCard key={item.id} item={item as any} themeColor={themeColor} onClick={() => setSelectedItem(item)} />
                    ))}
                  </div>
                </section>
              )}
              {categories.map((cat) => {
                const catProducts = initialProducts.filter(p => getProductCategoryString(p) === cat.name);
                if (catProducts.length === 0) return null;

                return (
                  <section 
                    key={cat.id} 
                    ref={el => { sectionRefs.current[cat.name] = el }}
                    className="scroll-mt-32"
                  >
                    <h2 className="font-extrabold text-xl text-gray-900 mb-6 flex items-center gap-2">
                      {getCategoryName(cat)}
                      <div className="h-1 flex-1 bg-gray-50 rounded-full ml-2" />
                    </h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                      {catProducts.map((item) => (
                        <FoodCard key={item.id} item={item as any} themeColor={themeColor} onClick={() => setSelectedItem(item)} />
                      ))}
                    </div>
                  </section>
                );
              })}
            </>
          )}
        </div>
      </div>

      {selectedItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={() => setSelectedItem(null)}>
          <div className="bg-white rounded-[32px] overflow-hidden w-full max-w-sm shadow-2xl relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelectedItem(null)} className="absolute top-4 right-4 bg-black/40 text-white p-2 rounded-full z-10 hover:bg-black/60 transition-all"><X size={20} /></button>
            <div className="w-full aspect-square bg-gray-100">
              <img src={getValidImage(selectedItem.image)} alt={selectedItem.name} className="w-full h-full object-cover" />
            </div>
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {lang === 'kh' ? (selectedItem.name_kh || selectedItem.name) : (lang === 'zh' && multiLanguageEnabled) ? (selectedItem.name_zh || selectedItem.name) : selectedItem.name}
              </h2>
              <div className="flex items-center gap-3 text-gray-500 text-sm mb-4">
                <span>{selectedItem.time}</span>
                <div className="flex items-center gap-1"><Star size={14} className="text-yellow-400 fill-yellow-400" /><span>{selectedItem.rating}</span></div>
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                 <span className="font-extrabold text-2xl" style={{ color: 'var(--brand-color)' }}>${selectedItem.price.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <CartFloat themeColor={themeColor} />
    </main>
  );
}