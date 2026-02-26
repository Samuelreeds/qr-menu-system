'use client';

import { useState, useEffect } from 'react';
import SearchBar from '@/components/SearchBar';
import FoodCard from '@/components/FoodCard';
import ShopInfoModal from '@/components/ShopInfoModal';
import CartFloat from '@/components/CartFloat'; 
import { useLanguage } from '@/context/LanguageContext'; 
import { Menu, X, Star } from 'lucide-react';

// --- TYPES ---
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
}

export default function MenuClient({ initialProducts, categories, shopSettings, banners = [] }: MenuClientProps) {
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Product | null>(null);
  
  // --- BANNER SLIDER STATE ---
  const [currentBanner, setCurrentBanner] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  
  const { lang } = useLanguage(); 

  // Default values
  const shopNameEn = shopSettings?.name || 'Gourmet Shop';
  const shopNameKh = shopSettings?.name_kh || '';
  const nameDisplay = shopSettings?.nameDisplay || 'EN';

  // Strictly follow the shop setting for name display
  const displayShopName = nameDisplay === 'KH' && shopNameKh ? shopNameKh 
                        : nameDisplay === 'BOTH' && shopNameKh ? `${shopNameEn} ${shopNameKh}` 
                        : shopNameEn;

  const themeColor = shopSettings?.themeColor || '#5CB85C'; 
  const headerDesign = shopSettings?.headerDesign || 'design1';
  const logoUrl = shopSettings?.logo || 'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?auto=format&fit=crop&w=100&q=80';

  // Auto Slider with 3 second delay
  useEffect(() => {
    if (!banners || banners.length <= 1) return;
    const timer = setTimeout(() => {
      setCurrentBanner((prev) => (prev + 1) % banners.length);
    }, 3000); 
    return () => clearTimeout(timer);
  }, [banners, currentBanner]);

  // Swipe & Click Handlers
  const handleNext = () => setCurrentBanner((prev) => (prev + 1) % banners.length);
  const handlePrev = () => setCurrentBanner((prev) => (prev === 0 ? banners.length - 1 : prev - 1));

  const handleTouchStart = (e: React.TouchEvent) => setTouchStart(e.targetTouches[0].clientX);
  const handleTouchMove = (e: React.TouchEvent) => setTouchEnd(e.targetTouches[0].clientX);
  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) handleNext();
    if (isRightSwipe) handlePrev();
    
    setTouchStart(0);
    setTouchEnd(0);
  };

  const getCategoryName = (cat: Category) => {
    if (lang === 'kh') return cat.name_kh || cat.name;
    if (lang === 'zh') return cat.name_zh || cat.name;
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
      (p.name_zh && p.name_zh.includes(searchQuery))
    );
  };

  const hasPopularProducts = initialProducts.some(p => p.isPopular);

  return (
  <main 
    className="font-sans min-h-screen bg-gray-50/30 w-full relative pb-24 shadow-sm"
    style={{ '--brand-color': themeColor } as React.CSSProperties}
  >
    <ShopInfoModal 
      isOpen={isInfoOpen} 
      onClose={() => setIsInfoOpen(false)} 
      settings={shopSettings}
    />

    {/* --- HEADER SECTION --- */}
    <header
      className="relative overflow-hidden pb-12 pt-4 transition-colors duration-300 min-h-[140px]"
      style={{ background: themeColor }}
    >
      <div className="absolute inset-0 bg-black/10 z-0" />

      <div
        className="absolute inset-0 pointer-events-none z-0 opacity-30"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E")`,
        }}
      />

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

      <div className="relative z-10 flex flex-col h-full max-w-7xl mx-auto w-full">
        <div className="absolute top-2 left-4 sm:left-6 lg:left-8 z-20">
          <button
            onClick={() => setIsInfoOpen(true)}
            aria-label="Shop info"
            className="p-2 sm:p-2.5 rounded-xl bg-white/20 backdrop-blur-md border border-white/30 text-white hover:bg-white/30 transition-all shadow-sm flex items-center justify-center active:scale-95"
          >
            <Menu size={24} strokeWidth={2.5} />
          </button>
        </div>

        <div className="flex items-center justify-center px-4 sm:px-6 lg:px-8 pt-12 pb-2 w-full h-full">
          {headerDesign === 'design2' ? (
            <h1 className="text-white tracking-wide text-center text-3xl sm:text-4xl font-bold drop-shadow-sm">
              {displayShopName}
            </h1>
          ) : headerDesign === 'design3' ? (
            <div className="flex flex-col items-center gap-3">
              <div className="rounded-2xl overflow-hidden flex-shrink-0 bg-white w-20 h-20 shadow-xl p-0.5">
                <img src={logoUrl} alt={displayShopName} className="w-full h-full object-cover rounded-[14px]" />
              </div>
              <h1 className="text-white tracking-wide text-center text-2xl font-bold drop-shadow-sm">{displayShopName}</h1>
            </div>
          ) : headerDesign === 'design4' ? (
            <div className="flex items-center gap-4">
              <div className="rounded-full overflow-hidden flex-shrink-0 bg-white w-14 h-14 shadow-lg p-0.5">
                <img src={logoUrl} alt={displayShopName} className="w-full h-full object-cover rounded-full" />
              </div>
              <h1 className="text-white tracking-wide text-left text-2xl font-bold drop-shadow-sm">{displayShopName}</h1>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="rounded-full overflow-hidden flex-shrink-0 bg-white w-16 h-16 shadow-lg p-0.5">
                <img src={logoUrl} alt={displayShopName} className="w-full h-full object-cover rounded-full" />
              </div>
              <h1 className="text-white tracking-wide text-center text-2xl font-bold drop-shadow-sm">{displayShopName}</h1>
            </div>
          )}
        </div>
      </div>
    </header>

    {/* --- BODY SECTION --- */}
    <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      <div className="relative z-30 -mt-6 sm:-mt-8 mb-6 sm:mb-8 max-w-3xl mx-auto">
        <SearchBar 
          value={searchQuery} 
          onChange={setSearchQuery} 
          hideSwitcher={isInfoOpen} 
        />
      </div>

      <div className="mb-6">
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

          {hasPopularProducts && (
            <button 
                onClick={() => setActiveCategory('Hot Sale')}
                className={`px-6 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all border flex items-center gap-1.5 ${
                  activeCategory === 'Hot Sale' 
                    ? 'text-white shadow-md border-transparent' 
                    : 'bg-orange-50 border-orange-100 text-orange-600 hover:bg-orange-100'
                }`}
                style={activeCategory === 'Hot Sale' ? { backgroundColor: themeColor } : {}}
              >
                🔥 {lang === 'kh' ? 'ពេញនិយម' : lang === 'zh' ? '热卖' : 'Hot Sale'}
            </button>
          )}

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

      {banners && banners.length > 0 && (
        <div 
          className="w-full relative aspect-[21/9] sm:aspect-[4/1] md:aspect-[5/1] max-h-[250px] md:max-h-[300px] mb-8 rounded-2xl overflow-hidden shadow-sm bg-gray-50 border border-gray-100"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="absolute inset-0 w-full h-full flex items-center justify-center group">
            {banners.map((b, i) => (
              <img 
                key={b.id} 
                src={b.image} 
                className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-500 ${i === currentBanner ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
                alt={`Banner ${i + 1}`}
              />
            ))}

            {banners.length > 1 && (
              <>
                <button 
                  onClick={handlePrev}
                  className="absolute left-0 top-0 bottom-0 w-1/4 z-20 outline-none focus:outline-none opacity-0 cursor-pointer"
                  aria-label="Previous Banner"
                />
                <button 
                  onClick={handleNext}
                  className="absolute right-0 top-0 bottom-0 w-1/4 z-20 outline-none focus:outline-none opacity-0 cursor-pointer"
                  aria-label="Next Banner"
                />
              </>
            )}

            {banners.length > 1 && (
              <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5 z-30 pb-1">
                {banners.map((_, i) => (
                  <button 
                    key={i} 
                    onClick={() => setCurrentBanner(i)}
                    className={`h-1.5 rounded-full transition-all shadow-sm outline-none cursor-pointer ${i === currentBanner ? 'bg-[var(--brand-color)] w-5' : 'bg-gray-300/80 w-1.5 hover:bg-gray-400'}`} 
                    aria-label={`Go to banner ${i + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeCategory === 'All' ? (
        <div className="space-y-10 sm:space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {categories.map((cat) => {
            const catProducts = initialProducts.filter(p => getProductCategoryString(p) === cat.name);
            const visibleProducts = getProductsBySearch(catProducts);
            if (visibleProducts.length === 0) return null;

            return (
              <section key={cat.id}>
                <h2 className="font-extrabold text-xl sm:text-2xl text-gray-900 mb-5 sm:mb-6 px-1 flex items-center gap-3">
                  {getCategoryName(cat)}
                  <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">{visibleProducts.length}</span>
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-6">
                  {visibleProducts.map((item) => (
                    <FoodCard 
                      key={item.id} 
                      item={item as any} 
                      themeColor={themeColor} 
                      onClick={() => setSelectedItem(item)} 
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      ) : activeCategory === 'Hot Sale' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-6 animate-in fade-in duration-300">
          {getProductsBySearch(initialProducts.filter(p => p.isPopular))
            .map((item) => (
              <FoodCard 
                key={item.id} 
                item={item as any} 
                themeColor={themeColor} 
                onClick={() => setSelectedItem(item)}
              />
            ))
          }
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-6 animate-in fade-in duration-300">
          {getProductsBySearch(initialProducts.filter(p => getProductCategoryString(p) === activeCategory))
            .map((item) => (
              <FoodCard 
                key={item.id} 
                item={item as any} 
                themeColor={themeColor} 
                onClick={() => setSelectedItem(item)}
              />
            ))
          }
        </div>
      )}
    </div>

    {/* --- PREVIEW MODAL --- */}
    {selectedItem && (
      <div 
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
        onClick={() => setSelectedItem(null)}
      >
        <div 
          className="bg-white rounded-[32px] overflow-hidden w-full max-w-sm shadow-2xl relative animate-in zoom-in-95 duration-200"
          onClick={e => e.stopPropagation()}
        >
          <button 
            onClick={() => setSelectedItem(null)}
            className="absolute top-4 right-4 bg-black/40 text-white p-2 rounded-full backdrop-blur-md z-10 hover:bg-black/60 active:scale-95 transition-all"
          >
            <X size={20} />
          </button>
          
          <div className="w-full aspect-square bg-gray-100 relative">
            <img src={selectedItem.image} alt={selectedItem.name} className="w-full h-full object-cover" />
            <div className="absolute top-4 left-4 flex flex-col gap-1.5 items-start">
              {selectedItem.isPopular && (
                 <span className="bg-orange-500 text-white text-xs px-3 py-1.5 rounded-full font-extrabold uppercase tracking-wide shadow-md">
                   Hot
                 </span>
              )}
              {(() => {
                const catDiscount = typeof selectedItem.category === 'object' ? ((selectedItem.category as any).discount || 0) : 0;
                const effDiscount = (selectedItem.discount && selectedItem.discount > 0) ? selectedItem.discount : catDiscount;
                return effDiscount > 0 ? (
                  <span className="bg-red-500 text-white text-xs px-3 py-1.5 rounded-full font-extrabold uppercase tracking-wide shadow-md">
                    -{effDiscount}%
                  </span>
                ) : null;
              })()}
            </div>
          </div>
          
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 leading-tight mb-2">
              {lang === 'kh' ? (selectedItem.name_kh || selectedItem.name) : lang === 'zh' ? (selectedItem.name_zh || selectedItem.name) : selectedItem.name}
            </h2>
            
            <div className="flex items-center gap-3 text-gray-500 text-sm mb-4 font-medium">
              {selectedItem.time && <span>{selectedItem.time}</span>}
              {selectedItem.rating && (
                <div className="flex items-center gap-1">
                  <Star size={14} className="text-yellow-400 fill-yellow-400" />
                  <span>{selectedItem.rating}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
               <div>
                 <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Price</p>
                 {(() => {
                    const catDiscount = typeof selectedItem.category === 'object' ? ((selectedItem.category as any).discount || 0) : 0;
                    const effDiscount = (selectedItem.discount && selectedItem.discount > 0) ? selectedItem.discount : catDiscount;
                    const discountedPrice = effDiscount > 0 ? selectedItem.price * (1 - effDiscount / 100) : selectedItem.price;
                    
                    return effDiscount > 0 ? (
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-extrabold text-2xl" style={{ color: 'var(--brand-color)' }}>
                          ${discountedPrice.toFixed(2)}
                        </span>
                        <span className="font-medium text-sm text-gray-400 line-through">
                          ${selectedItem.price.toFixed(2)}
                        </span>
                      </div>
                    ) : (
                      <span className="font-extrabold text-2xl" style={{ color: 'var(--brand-color)' }}>
                        ${selectedItem.price.toFixed(2)}
                      </span>
                    );
                 })()}
               </div>
            </div>
          </div>
        </div>
      </div>
    )}

    <CartFloat themeColor={themeColor} />
  </main>
);}