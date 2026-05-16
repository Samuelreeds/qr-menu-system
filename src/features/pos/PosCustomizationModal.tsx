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

  // Updated strictly to the new ProductCustomization interface
  const [customization, setCustomization] = useState<ProductCustomization>({
    size: "", 
    sugar: "50",
    ice: "Normal",
    topping: "None",
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

           <div className="space-y-6">
             {hasVariants && (
               <div>
                 <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 px-1">Size</p>
                 <div className="flex flex-wrap gap-2">
                   {product.variants!.map((v, idx) => (
                     <button 
                       key={idx} 
                       className={`px-4 py-2.5 rounded-xl text-sm font-bold border-2 transition-all duration-200 ease-out active:scale-95 whitespace-nowrap ${selectedVariantIndex === idx ? "border-gray-900 bg-gray-900 text-white shadow-md" : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50"}`} 
                       onClick={() => setSelectedVariantIndex(idx)}
                     >
                       {v.name}
                     </button>
                   ))}
                 </div>
               </div>
             )}

             {isDrink && (
               <>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                   <div>
                     <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 px-1">Sugar</p>
                     <div className="flex flex-wrap gap-2">
                       {(["0", "50", "100"] as const).map((v) => (
                         <button 
                           key={v} 
                           className={`px-4 py-2.5 rounded-xl text-sm font-bold border-2 transition-all duration-200 ease-out active:scale-95 ${customization.sugar === v ? "border-gray-900 bg-gray-900 text-white shadow-md" : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50"}`} 
                           onClick={() => setCustomization((c) => ({ ...c, sugar: v }))}
                         >
                           {v}%
                         </button>
                       ))}
                     </div>
                   </div>
                   
                   <div>
                     <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 px-1">Ice</p>
                     <div className="flex flex-wrap gap-2">
                        {/* Locked Ice Option */}
                         <button 
                           className="px-4 py-2.5 rounded-xl text-sm font-bold border-2 border-gray-900 bg-gray-900 text-white shadow-md cursor-default"
                         >
                           Normal
                         </button>
                     </div>
                   </div>
                 </div>

                 <div>
                   <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 px-1">Topping</p>
                   <div className="flex flex-wrap gap-2">
                     {(["None", "Pearl", "Coconut Jelly", "Aloe Vera"] as const).map((v) => (
                       <button 
                         key={v} 
                         className={`px-4 py-2.5 rounded-xl text-sm font-bold border-2 transition-all duration-200 ease-out active:scale-95 ${customization.topping === v ? "border-gray-900 bg-gray-900 text-white shadow-md" : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50"}`} 
                         onClick={() => setCustomization((c) => ({ ...c, topping: v }))}
                       >
                         {v}
                       </button>
                     ))}
                   </div>
                 </div>
               </>
             )}

             <div>
               <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 px-1">Special Instructions</p>
               <textarea 
                 value={notes} 
                 onChange={(e) => setNotes(e.target.value)} 
                 placeholder="e.g. Extra spicy, less foam..." 
                 className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm text-gray-900 focus:outline-none focus:border-gray-900 focus:bg-white transition-colors resize-none shadow-sm" 
                 rows={2} 
               />
             </div>
           </div>
        </div>

        <div className="p-4 border-t border-gray-100 bg-gray-50 shrink-0">
           <button 
             onClick={() => { 
               const finalSizeName = product.variants?.[selectedVariantIndex]?.name || "";
               
               // Ensure proper payload is sent back to Billing
               const finalCust: ProductCustomization = isDrink 
                  ? { ...customization, size: finalSizeName } 
                  : { size: finalSizeName, sugar: "50", ice: "Normal", topping: "None" }; 
               
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