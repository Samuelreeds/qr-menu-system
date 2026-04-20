// src/components/pos/PosCustomizationModal.tsx
'use client';

import { useState } from 'react';
import { X, Plus, Image as ImageIcon } from 'lucide-react';
import { PosProduct, ProductCustomization } from './AdminPosSection';

export default function PosCustomizationModal({
  product,
  onClose,
  onAdd
}: {
  product: PosProduct;
  onClose: () => void;
  onAdd: (product: PosProduct, customization: ProductCustomization, notes: string, dynamicPrice?: number) => void;
}) {
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);

  const [customization, setCustomization] = useState<ProductCustomization>({
    mood: "hot",
    size: "", // We override this below upon adding
    sugar: "50%",
    ice: "50%",
  });
  const [notes, setNotes] = useState("");
  
  const isDrink = product.isDrink;
  const hasVariants = product.variants && product.variants.length > 0 && product.variants.some(v => v.name !== 'Default');
  const activeBasePrice = product.variants?.[selectedVariantIndex]?.price ?? product.price;

  return (
    <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm sm:p-4 print:hidden animate-in fade-in duration-200" onClick={onClose}>
      <div className="bg-white w-full sm:max-w-md rounded-t-[32px] sm:rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-10 sm:zoom-in-95" onClick={e => e.stopPropagation()}>
        
        <div className="relative h-48 bg-gray-100 shrink-0 border-b border-gray-100">
           {product.img ? (
             <img src={product.img} alt={product.name} className="w-full h-full object-cover" />
           ) : (
             <div className="w-full h-full flex items-center justify-center"><ImageIcon size={40} className="text-gray-300"/></div>
           )}
           <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 bg-white/80 backdrop-blur-md rounded-full flex items-center justify-center text-gray-700 shadow-sm active:scale-95 transition-transform"><X size={16}/></button>
        </div>

        <div className="p-5 overflow-y-auto no-scrollbar flex-1" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
           <h3 className="font-bold text-xl text-gray-900 leading-tight mb-1">{product.name}</h3>
           <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">{product.category}</p>
           <p className="font-black text-2xl text-gray-900 mb-6">${activeBasePrice.toFixed(2)}</p>

           <div className="space-y-5">
             <div className={`grid ${isDrink ? 'grid-cols-2' : 'grid-cols-1'} gap-3`}>
               {isDrink && (
                 <div>
                   <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 px-1">Mood</p>
                   <div className="flex bg-gray-100 p-1.5 rounded-xl">
                     <button className={`flex-1 py-2 rounded-lg text-sm transition-colors ${customization.mood === "hot" ? "bg-white text-red-600 shadow-sm font-bold" : "text-gray-500 font-medium hover:text-gray-700"}`} onClick={() => setCustomization((c) => ({ ...c, mood: "hot" }))}>Hot</button>
                     <button className={`flex-1 py-2 rounded-lg text-sm transition-colors ${customization.mood === "cold" ? "bg-white text-blue-600 shadow-sm font-bold" : "text-gray-500 font-medium hover:text-gray-700"}`} onClick={() => setCustomization((c) => ({ ...c, mood: "cold" }))}>Cold</button>
                   </div>
                 </div>
               )}
               
               {hasVariants && (
                 <div>
                   <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 px-1">Size</p>
                   <div className="flex flex-wrap bg-gray-100 p-1.5 rounded-xl gap-1">
                     {product.variants!.map((v, idx) => (
                       <button 
                         key={idx} 
                         className={`flex-1 py-2 rounded-lg text-sm transition-colors ${selectedVariantIndex === idx ? "bg-white text-gray-900 shadow-sm font-bold" : "text-gray-500 font-medium hover:text-gray-700"}`} 
                         onClick={() => setSelectedVariantIndex(idx)}
                       >
                         {v.name}
                       </button>
                     ))}
                   </div>
                 </div>
               )}
             </div>

             {isDrink && (
               <div className="grid grid-cols-2 gap-3">
                 <div>
                   <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 px-1">Sugar</p>
                   <div className="flex flex-wrap bg-gray-100 p-1.5 rounded-xl gap-1">
                     {(["30%", "50%", "70%"] as const).map((v) => (
                       <button key={v} className={`flex-1 py-2 rounded-lg text-[11px] transition-colors ${customization.sugar === v ? "bg-white text-gray-900 shadow-sm font-bold" : "text-gray-500 font-medium hover:text-gray-700"}`} onClick={() => setCustomization((c) => ({ ...c, sugar: v }))}>{v.replace('%', '')}</button>
                     ))}
                   </div>
                 </div>
                 <div>
                   <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 px-1">Ice</p>
                   <div className="flex flex-wrap bg-gray-100 p-1.5 rounded-xl gap-1">
                     {(["30%", "50%", "70%"] as const).map((v) => (
                       <button key={v} className={`flex-1 py-2 rounded-lg text-[11px] transition-colors ${customization.ice === v ? "bg-white text-gray-900 shadow-sm font-bold" : "text-gray-500 font-medium hover:text-gray-700"}`} onClick={() => setCustomization((c) => ({ ...c, ice: v }))}>{v.replace('%', '')}</button>
                     ))}
                   </div>
                 </div>
               </div>
             )}
             <div>
               <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 px-1">Special Instructions</p>
               <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. Extra spicy, no onions..." className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm text-gray-900 focus:outline-none focus:border-gray-400 focus:bg-white transition-colors resize-none" rows={2} />
             </div>
           </div>
        </div>

        <div className="p-4 border-t border-gray-100 bg-gray-50 shrink-0">
           <button 
             onClick={() => { 
               const finalSizeName = product.variants?.[selectedVariantIndex]?.name || "";
               const finalCust = isDrink 
                  ? { ...customization, size: finalSizeName } 
                  : { mood: "", size: finalSizeName, sugar: "", ice: "" }; 
               
               onAdd(product, finalCust, notes, activeBasePrice); 
               onClose(); 
             }} 
             className="w-full py-4 bg-gray-900 text-white rounded-xl font-bold shadow-md hover:bg-gray-800 active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-[15px]"
           >
             <Plus size={18}/> Add to Order — ${activeBasePrice.toFixed(2)}
           </button>
        </div>
      </div>
    </div>
  );
}