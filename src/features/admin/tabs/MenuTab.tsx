// src/features/admin/tabs/MenuTab.tsx
import React from 'react';
import { Search, List, LayoutGrid, Plus, MoreVertical } from 'lucide-react';
import LazyImage from "@/components/ui/LazyImage";

interface MenuTabProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  viewMode: 'list' | 'grid';
  setViewMode: (mode: 'list' | 'grid') => void;
  optProducts: any[];
  filteredProducts: any[];
  safeLimits: any;
  setIsFormOpen: (isOpen: boolean) => void;
  setEditingProduct: (product: any) => void;
  handleTabClick: (tab: string) => void;
  featCampaign: boolean;
  getDisplayPrice: (product: any) => number;
  getValidImage: (img?: string | null) => string;
}

export default function MenuTab({
  searchQuery,
  setSearchQuery,
  viewMode,
  setViewMode,
  optProducts,
  filteredProducts,
  safeLimits,
  setIsFormOpen,
  setEditingProduct,
  handleTabClick,
  featCampaign,
  getDisplayPrice,
  getValidImage
}: MenuTabProps) {
  return (
    <>
      <div className="flex flex-row items-center justify-between gap-3 mb-6 w-full">
         <div className="relative flex-1 min-w-0">
           <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} style={{ color: 'var(--theme-color)' }}/>
           <input placeholder="Search menu..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-gray-200 bg-white shadow-sm text-[16px] md:text-sm outline-none focus:ring-2 focus:ring-gray-900"/>
         </div>
         <div className="flex bg-gray-100 p-1 rounded-xl shrink-0 border border-gray-200">
           <button onClick={() => setViewMode('list')} className={`p-2.5 rounded-lg transition-colors active:scale-95 flex items-center justify-center ${viewMode === 'list' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}><List size={18}/></button>
           <button onClick={() => setViewMode('grid')} className={`p-2.5 rounded-lg transition-colors active:scale-95 flex items-center justify-center ${viewMode === 'grid' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}><LayoutGrid size={18}/></button>
         </div>
         <button onClick={() => setIsFormOpen(true)} className={`hidden lg:flex shrink-0 ${optProducts.length >= safeLimits.maxProducts ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-gray-900 text-white hover:bg-gray-800'} px-6 py-3.5 rounded-2xl font-bold active:scale-95 transition shadow-sm items-center justify-center gap-2 text-[16px] md:text-sm`}>
           <Plus size={18} strokeWidth={3}/> Add Product
         </button>
      </div>
      
      {optProducts.length === 0 && searchQuery === '' ? (
         <div className="flex flex-col items-center justify-center py-16 px-4 bg-white rounded-3xl border border-gray-100 shadow-sm mt-4 text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-4"><LayoutGrid size={28} className="text-gray-400"/></div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No products yet</h3>
            <ul className="text-sm text-gray-500 mb-8 text-left space-y-2 inline-block"><li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-gray-400" /> Create a category</li><li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-gray-400" /> Add your first product</li><li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-gray-400" /> View your live menu</li></ul>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <button onClick={() => setIsFormOpen(true)} className="bg-gray-900 text-white px-6 py-3.5 rounded-xl font-bold shadow-md hover:bg-gray-800 active:scale-95 transition flex items-center justify-center gap-2 text-[16px] md:text-sm w-full sm:w-auto"><Plus size={16} strokeWidth={3}/> Add Product</button>
              <button onClick={() => handleTabClick('categories')} className="bg-white border border-gray-200 text-gray-700 px-6 py-3.5 rounded-xl font-bold hover:bg-gray-50 active:scale-95 transition text-[16px] md:text-sm w-full sm:w-auto">Go to Categories</button>
            </div>
         </div>
      ) : viewMode === 'grid' ? (
         <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6 min-w-0">
           {filteredProducts.map(item => {
             const categoryDiscount = typeof item.category === 'object' ? (item.category.discount || 0) : 0;
             const rawItemDiscount = item.discount || 0;
             const effectiveDiscount = featCampaign === false ? 0 : (rawItemDiscount > 0 ? rawItemDiscount : categoryDiscount);
             const basePrice = getDisplayPrice(item);
             const discountedPrice = effectiveDiscount > 0 ? basePrice * (1 - effectiveDiscount / 100) : basePrice;
             return (
             <div key={item.id} className="bg-white rounded-lg shadow-sm border border-gray-100 relative flex flex-col h-full group hover:shadow-md transition-all overflow-hidden cursor-pointer" onClick={() => setEditingProduct(item)}>
               <div className="absolute top-4 right-4 flex flex-col gap-2 items-end z-10 pointer-events-none">
                 {item.isPopular && <span className="bg-orange-500 text-white text-[10px] px-3 py-1.5 rounded-full font-extrabold uppercase tracking-wide shadow-md">Hot</span>}
                 {effectiveDiscount > 0 && <span className="bg-red-500 text-white text-[10px] px-3 py-1.5 rounded-full font-extrabold uppercase tracking-wide shadow-md">-{effectiveDiscount}%</span>}
               </div>
               <div className={`relative w-full aspect-[5/4] sm:aspect-[4/3] shrink-0 bg-gray-100 overflow-hidden pointer-events-none ${item.isSoldOut ? 'opacity-50 grayscale' : ''}`}>
                 <LazyImage src={getValidImage(item.image)} alt={item.name} className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"/>
               </div>
               <div className="flex flex-col flex-1 p-4 sm:p-5 min-w-0 pointer-events-none">
                 <h3 className={`font-bold text-gray-900 text-base sm:text-lg leading-tight line-clamp-2 mb-1.5 ${item.isSoldOut ? 'text-gray-500' : ''}`}>{item.name}</h3>
                 <div className="flex items-center text-gray-400 text-xs sm:text-sm gap-2 mb-4"><span className="font-medium truncate">{item.category?.name}</span><span className="font-medium shrink-0">•</span><span className="font-medium shrink-0">{item.time}</span></div>
                 <div className="mt-auto pt-3 flex flex-col pointer-events-auto border-t border-gray-50">
                   <div className="flex items-center justify-between">
                     <div className="flex-1 min-w-0 pr-2">
                       {effectiveDiscount > 0 ? (
                         <div className="flex flex-col"><span className={`font-extrabold text-lg sm:text-xl leading-none truncate block ${item.isSoldOut ? 'text-gray-400' : 'text-red-500'}`}>${discountedPrice.toFixed(2)}</span><span className="font-semibold text-xs sm:text-sm text-gray-400 line-through mt-1 truncate block">${basePrice.toFixed(2)}</span></div>
                       ) : (
                         <span className={`font-extrabold text-lg sm:text-xl leading-none truncate block ${item.isSoldOut ? 'text-gray-400' : 'text-gray-900'}`}>${basePrice.toFixed(2)}</span>
                       )}
                     </div>
                     <div className="flex items-center shrink-0 relative z-10" onClick={(e) => e.stopPropagation()}>
                       <button onClick={(e) => { e.stopPropagation(); setEditingProduct(item); }} className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center text-gray-50 bg-gray-50 rounded-full hover:bg-gray-100 hover:text-gray-900 transition-colors active:scale-95 shrink-0"><MoreVertical size={16} /></button>
                     </div>
                   </div>
                 </div>
               </div>
             </div>
           )})}
           {filteredProducts.length === 0 && searchQuery !== '' && <div className="col-span-full py-16 text-center text-gray-400 font-medium bg-white rounded-3xl border border-gray-100 shadow-sm">No products found matching "{searchQuery}"</div>}
         </div>
      ) : (
         <>
           <div className="hidden lg:block bg-white rounded-3xl shadow-sm border border-gray-100 overflow-x-auto [-webkit-overflow-scrolling:touch]">
             <table className="w-full text-left border-collapse min-w-[600px]">
               <thead><tr className="border-b border-gray-50 text-xs font-bold text-gray-400 uppercase tracking-wider"><th className="p-5">Product</th><th className="p-5">Category</th><th className="p-5">Price</th><th className="p-5">Time</th><th className="p-5 text-right">Action</th></tr></thead>
               <tbody className="divide-y divide-gray-50">
                 {filteredProducts.map((item) => {
                   const categoryDiscount = typeof item.category === 'object' ? (item.category.discount || 0) : 0;
                   const rawItemDiscount = item.discount || 0;
                   const effectiveDiscount = featCampaign === false ? 0 : (rawItemDiscount > 0 ? rawItemDiscount : categoryDiscount);
                   const basePrice = getDisplayPrice(item);
                   const discountedPrice = effectiveDiscount > 0 ? basePrice * (1 - effectiveDiscount / 100) : basePrice;
                   return (
                   <tr key={item.id} className={`hover:bg-gray-50/50 transition-colors group cursor-pointer ${item.isSoldOut ? 'opacity-70' : ''}`} onClick={() => setEditingProduct(item)}>
                     <td className="p-4 flex items-center gap-4 min-w-0"><div className={`w-14 h-14 rounded-xl bg-gray-50 overflow-hidden shrink-0 border border-gray-100 relative ${item.isSoldOut ? 'grayscale' : ''}`}><LazyImage src={getValidImage(item.image)} className="w-full h-full object-cover" alt="" /></div><div className="flex flex-col min-w-0"><span className={`font-bold text-base truncate ${item.isSoldOut ? 'text-gray-500' : 'text-gray-900'}`}>{item.name}</span><div className="flex items-center gap-2 mt-1">{item.isPopular && <span className="text-orange-500 text-[9px] bg-orange-100 px-2 py-0.5 rounded-full font-extrabold uppercase tracking-wide">Hot</span>}{effectiveDiscount > 0 && <span className="text-red-500 text-[9px] bg-red-100 px-2 py-0.5 rounded-full font-extrabold uppercase tracking-wide">-{effectiveDiscount}%</span>}</div></div></td>
                     <td className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider"><span className="bg-gray-100 px-3 py-1.5 rounded-lg truncate inline-block max-w-[120px]">{item.category?.name}</span></td>
                     <td className={`p-4 font-black text-xl ${item.isSoldOut ? 'text-gray-500' : 'text-gray-900'}`}>{effectiveDiscount > 0 ? (<div className="flex flex-col"><span className={item.isSoldOut ? 'text-gray-500' : 'text-red-500'}>${discountedPrice.toFixed(2)}</span><span className="text-xs text-gray-400 line-through font-medium mt-0.5">${basePrice.toFixed(2)}</span></div>) : (`$${basePrice.toFixed(2)}`)}</td>
                     <td className="p-4 text-sm text-gray-500 font-medium">{item.time}</td>
                     <td className="p-4 text-right"><div className="flex items-center justify-end gap-3 relative z-10" onClick={(e) => e.stopPropagation()}><button onClick={(e) => { e.stopPropagation(); setEditingProduct(item); }} className="w-10 h-10 flex items-center justify-center text-gray-500 bg-gray-50 rounded-full hover:bg-gray-100 hover:text-gray-900 transition-colors active:scale-95"><MoreVertical size={18} /></button></div></td>
                   </tr>
                 )})}
               </tbody>
             </table>
             {filteredProducts.length === 0 && searchQuery !== '' && <div className="py-16 text-center text-gray-400 font-medium">No products found matching "{searchQuery}"</div>}
           </div>
           <div className="lg:hidden space-y-4">
              {filteredProducts.map((item) => {
                const categoryDiscount = typeof item.category === 'object' ? (item.category.discount || 0) : 0;
                const rawItemDiscount = item.discount || 0;
                const effectiveDiscount = featCampaign === false ? 0 : (rawItemDiscount > 0 ? rawItemDiscount : categoryDiscount);
                const basePrice = getDisplayPrice(item);
                const discountedPrice = effectiveDiscount > 0 ? basePrice * (1 - effectiveDiscount / 100) : basePrice;
                return(
                 <div key={item.id} className={`bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex flex-col cursor-pointer ${item.isSoldOut ? 'opacity-75' : ''}`} onClick={() => setEditingProduct(item)}>
                    <div className="flex items-start gap-4 mb-3"><div className={`w-[72px] h-[72px] bg-gray-50 rounded-md overflow-hidden shrink-0 border border-gray-100 relative ${item.isSoldOut ? 'grayscale' : ''}`}><LazyImage src={getValidImage(item.image)} className="w-full h-full object-cover" alt="" /></div><div className="flex-1 min-w-0 pt-1"><h4 className={`font-extrabold text-base leading-tight mb-1.5 line-clamp-2 ${item.isSoldOut ? 'text-gray-500' : 'text-gray-900'}`}>{item.name}</h4><div className="flex items-center gap-2 flex-wrap"><p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{item.category?.name} • {item.time}</p>{item.isPopular && <span className="text-orange-500 text-[9px] bg-orange-50 px-2 py-0.5 rounded-md font-extrabold uppercase tracking-wider">Hot</span>}</div></div></div>
                    <div className="flex flex-col border-t border-gray-50 pt-3 relative z-10 mt-auto"><div className="flex items-center justify-between"><div className="flex-1 min-w-0 pr-2 pointer-events-none">{effectiveDiscount > 0 ? (<div className="flex items-baseline gap-1.5 flex-wrap"><span className={`font-black text-xl leading-none truncate ${item.isSoldOut ? 'text-gray-400' : 'text-red-500'}`}>${discountedPrice.toFixed(2)}</span><span className="text-xs font-medium text-gray-400 line-through truncate">${basePrice.toFixed(2)}</span></div>) : (<span className={`font-black text-xl leading-none truncate block ${item.isSoldOut ? 'text-gray-400' : 'text-gray-900'}`}>${basePrice.toFixed(2)}</span>)}</div><div className="flex items-center shrink-0" onClick={(e) => e.stopPropagation()}><button onClick={(e) => { e.stopPropagation(); setEditingProduct(item); }} className="w-8 h-8 flex items-center justify-center text-gray-500 bg-gray-50 rounded-full hover:bg-gray-100 hover:text-gray-900 active:scale-95 transition-all"><MoreVertical size={16} /></button></div></div></div>
                 </div>
              )})}
              {filteredProducts.length === 0 && searchQuery !== '' && <div className="bg-white p-8 rounded-3xl text-center text-gray-400 font-medium shadow-sm border border-gray-100">No products found matching "{searchQuery}"</div>}
           </div>
         </>
      )}
      {optProducts.length > 0 && <button onClick={() => setIsFormOpen(true)} className="lg:hidden fixed bottom-6 right-6 z-10 bg-gray-900 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-xl active:scale-95 transition-transform hover:bg-gray-800 disabled:opacity-50 print:hidden"><Plus size={24} strokeWidth={3} /></button>}
    </>
  );
}