// src/components/pos/PosCustomizationModal.tsx
'use client';

import { useState } from 'react';
import { X, Plus, Image as ImageIcon, Minus } from 'lucide-react';
import { PosProduct, ProductCustomization, Topping } from './AdminPosSection';

export default function PosCustomizationModal({
  product,
  toppings = [],
  onClose,
  onAdd
}: {
  product: PosProduct;
  toppings?: Topping[];
  onClose: () => void;
  onAdd: (product: PosProduct, customization: ProductCustomization, notes: string, dynamicPrice?: number) => void;
}) {
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);

  const [customization, setCustomization] = useState<ProductCustomization>({
    size: "", 
    sugar: "50",
    ice: "Normal", // Keeps the backend happy, but hidden from UI
    toppings: [], 
  });
  
  const [notes, setNotes] = useState("");
  
  const { isDrink } = product; // Linter fix applied
  const hasVariants = product.variants && product.variants.length > 0 && product.variants.some(v => v.name !== 'Default');
  const activeBasePrice = product.variants?.[selectedVariantIndex]?.price ?? product.price;

  const availableToppings = toppings.filter(t => t.isDrink === (isDrink ?? false));

  const handleToppingChange = (topping: Topping, delta: number) => {
    setCustomization(prev => {
      const existingIdx = prev.toppings.findIndex(t => t.name === topping.name);
      let newToppings = [...prev.toppings];

      if (existingIdx >= 0) {
        const newQty = Math.max(0, newToppings[existingIdx].qty + delta);
        if (newQty === 0) {
          newToppings.splice(existingIdx, 1);
        } else {
          newToppings[existingIdx] = { ...newToppings[existingIdx], qty: newQty };
        }
      } else if (delta > 0) {
        newToppings.push({ name: topping.name, price: topping.price, qty: 1 });
      }

      return { ...prev, toppings: newToppings };
    });
  };

  const toppingsTotal = customization.toppings.reduce((sum, t) => sum + (t.price * t.qty), 0);
  const finalPrice = activeBasePrice + toppingsTotal;

  return (
    <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm sm:p-4 print:hidden animate-in fade-in duration-200" onClick={onClose}>
      <div className="bg-white w-full sm:max-w-md rounded-t-[32px] sm:rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-10 sm:zoom-in-95" onClick={e => e.stopPropagation()}>
        
        <div className="relative h-40 sm:h-48 bg-gray-100 shrink-0 border-b border-gray-100">
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
           
           <div className="flex items-baseline gap-2 mb-6 pb-4 border-b border-gray-100">
             <p className="font-black text-3xl text-gray-900">${finalPrice.toFixed(2)}</p>
             {toppingsTotal > 0 && <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded-md">Includes +${toppingsTotal.toFixed(2)} toppings</span>}
           </div>

           <div className="space-y-6">
             {hasVariants && (
               <div>
                 <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3 px-1">Size</p>
                 <div className="flex flex-wrap gap-2">
                   {product.variants!.map((v, idx) => (
                     <button 
                       key={idx} 
                       className={`px-5 py-3 rounded-xl text-sm font-bold border-2 transition-all duration-200 ease-out active:scale-95 whitespace-nowrap ${selectedVariantIndex === idx ? "border-gray-900 bg-gray-900 text-white shadow-md" : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50"}`} 
                       onClick={() => setSelectedVariantIndex(idx)}
                     >
                       {v.name}
                     </button>
                   ))}
                 </div>
               </div>
             )}

             {isDrink && (
               <div>
                 <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3 px-1">Sugar Level</p>
                 <div className="flex gap-2">
                   {(["0", "50", "100"] as const).map((v) => (
                     <button 
                       key={v} 
                       className={`flex-1 py-3 rounded-xl text-sm font-bold border-2 transition-all duration-200 ease-out active:scale-95 ${customization.sugar === v ? "border-gray-900 bg-gray-900 text-white shadow-md" : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50"}`} 
                       onClick={() => setCustomization((c) => ({ ...c, sugar: v }))}
                     >
                       {v}%
                     </button>
                   ))}
                 </div>
               </div>
             )}

             <div>
               <div className="flex justify-between items-center mb-3 px-1">
                 <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Extra Toppings</p>
                 {toppingsTotal > 0 && (
                    <button onClick={() => setCustomization(prev => ({...prev, toppings: []}))} className="text-[10px] font-bold text-red-500 hover:text-red-600 uppercase tracking-wider transition-colors">Clear All</button>
                 )}
               </div>
               
               <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                 {availableToppings.map((t) => {
                   const selectedTopping = customization.toppings.find(ct => ct.name === t.name);
                   const qty = selectedTopping?.qty || 0;
                   
                   return (
                     <div key={t.id} className="relative group">
                       {qty > 0 && (
                         <button 
                           onClick={(e) => { e.stopPropagation(); handleToppingChange(t, -1); }} 
                           className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-md z-10 active:scale-95 transition-all"
                         >
                           <Minus size={14} strokeWidth={3} />
                         </button>
                       )}
                       
                       <button 
                         onClick={() => handleToppingChange(t, 1)} 
                         className={`w-full py-2.5 px-2 rounded-xl border-2 transition-all duration-200 ease-out active:scale-95 flex flex-col items-center justify-center leading-tight ${qty > 0 ? "border-gray-900 bg-gray-900 text-white shadow-md" : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50"}`}
                       >
                         <span className="font-extrabold text-sm text-center line-clamp-1">
                           {qty > 0 && <span className="text-emerald-400 mr-1">{qty}x</span>}
                           {t.name}
                         </span>
                         <span className={`text-[10px] mt-0.5 font-bold ${qty > 0 ? "text-gray-300" : "text-gray-400"}`}>
                           {t.price > 0 ? `+$${t.price.toFixed(2)}` : 'Free'}
                         </span>
                       </button>
                     </div>
                   );
                 })}
               </div>
               
               {availableToppings.length === 0 && (
                 <p className="text-sm text-gray-400 font-medium py-2 px-1">
                   No toppings available for {isDrink ? 'drinks' : 'food items'}.
                 </p>
               )}
             </div>

             <div>
               <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3 px-1">Special Instructions</p>
               <textarea 
                 value={notes} 
                 onChange={(e) => setNotes(e.target.value)} 
                 placeholder="e.g. Extra spicy, less foam..." 
                 className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm font-medium text-gray-900 focus:outline-none focus:border-gray-900 focus:bg-white transition-colors resize-none shadow-sm" 
                 rows={2} 
               />
             </div>
           </div>
        </div>

        <div className="p-4 border-t border-gray-100 bg-white shrink-0 shadow-[0_-4px_15px_-3px_rgba(0,0,0,0.05)]">
           <button 
             onClick={() => { 
               const finalSizeName = product.variants?.[selectedVariantIndex]?.name || "";
               
               const finalCust: ProductCustomization = isDrink 
                  ? { ...customization, size: finalSizeName } 
                  : { size: finalSizeName, sugar: "50", ice: "Normal", toppings: customization.toppings }; 
               
               onAdd(product, finalCust, notes, finalPrice); 
               onClose(); 
             }} 
             className="w-full py-4 sm:py-4.5 bg-gray-900 text-white rounded-2xl font-black shadow-xl hover:bg-gray-800 active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-[15px]"
           >
             Add to Order — ${finalPrice.toFixed(2)}
           </button>
        </div>
      </div>
    </div>
  );
}