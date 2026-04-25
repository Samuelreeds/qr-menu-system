// src/components/pos/BillingPanel.tsx
'use client';

import { useState, useEffect } from 'react';
import { ShoppingCart, X, ChevronLeft, ChevronDown, Image as ImageIcon, Loader2, Pencil } from 'lucide-react';
import { useToast } from "@/context/ToastContext";
import { BillingItem, OrderType } from './AdminPosSection';

const TAX_RATE = 0.1;

export default function BillingPanel({ items, onRemove, onQtyChange, orderType, setOrderType, tableNumber, setTableNumber, onProceedToConfirm, isSavingOrder, userEmail, userRole, onCloseMobile, isTableModalOpen, setIsTableModalOpen }: { items: BillingItem[]; onRemove: (id: string) => void; onQtyChange: (id: string, delta: number) => void; orderType: OrderType; setOrderType: (t: OrderType) => void; tableNumber: string; setTableNumber: (t: string) => void; onProceedToConfirm: (paymentMethod: string, deliveryAgent: string, promoCode: string, discountType: string, discountValue: string, isTaxEnabled: boolean) => void; isSavingOrder?: boolean; userEmail?: string; userRole?: string; onCloseMobile?: () => void; isTableModalOpen: boolean; setIsTableModalOpen: (b: boolean) => void; }) {
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "khqr">("cash");
  const [deliveryAgent, setDeliveryAgent] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [discountValue, setDiscountValue] = useState("");
  const [discountType, setDiscountType] = useState<"percent" | "fixed">("percent");
  const [isTaxEnabled, setIsTaxEnabled] = useState(false);

  const { addSuccessToast, addErrorToast } = useToast();

  // Editable Name State
  const defaultCashierName = userEmail ? userEmail.split('@')[0] : 'Unknown';
  const defaultFormattedName = defaultCashierName.charAt(0).toUpperCase() + defaultCashierName.slice(1);
  
  const [customName, setCustomName] = useState(defaultFormattedName);
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState("");

  useEffect(() => {
    const storedName = localStorage.getItem('pos_cashier_name');
    if (storedName) {
      setCustomName(storedName);
    }
  }, []);

  const handleNameSave = () => {
    const newName = tempName.trim() || defaultFormattedName;
    setCustomName(newName);
    localStorage.setItem('pos_cashier_name', newName);
    setIsEditingName(false);
  };

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleNameSave();
    } else if (e.key === 'Escape') {
      setIsEditingName(false);
    }
  };

  const subtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0);
  const discountNum = parseFloat(discountValue) || 0;
  const discountAmount = discountType === "percent" ? (subtotal * discountNum) / 100 : Math.min(discountNum, subtotal);
  const afterDiscount = subtotal - discountAmount;
  const tax = isTaxEnabled ? (afterDiscount * TAX_RATE) : 0;
  const total = afterDiscount + tax;

  const handlePrint = () => { if (items.length === 0) return; onProceedToConfirm(paymentMethod, deliveryAgent, promoCode, discountType, discountValue, isTaxEnabled); };

  return (
    <>
      {/* HEADER SECTION */}
      <div className="p-3 sm:p-4 border-b border-gray-100 shrink-0 bg-white z-20 min-w-0">
        <div className="flex items-center justify-between min-w-0">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {onCloseMobile && (
              <button 
                onClick={onCloseMobile} 
                className="md:hidden mr-1 p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors active:scale-95 shrink-0"
              >
                <ChevronLeft size={20} className="text-gray-700" />
              </button>
            )}
            <div 
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center font-bold text-gray-500 text-xs sm:text-sm shrink-0 cursor-pointer hover:bg-gray-200 transition-colors"
              onClick={() => { setTempName(customName); setIsEditingName(true); }}
              title="Edit Name"
            >
              {customName.substring(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1 flex flex-col justify-center">
              <p className="text-[9px] sm:text-[10px] text-gray-500 font-black uppercase tracking-wider truncate">
                {userRole || 'Cashier'}
              </p>
              {isEditingName ? (
                <input 
                  autoFocus
                  type="text"
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  onBlur={handleNameSave}
                  onKeyDown={handleNameKeyDown}
                  className="text-xs sm:text-sm font-extrabold text-gray-900 truncate bg-gray-50 border border-gray-200 rounded px-1.5 py-0.5 -ml-1 outline-none focus:ring-1 focus:ring-gray-900 w-full"
                />
              ) : (
                <div 
                  className="text-xs sm:text-sm font-extrabold text-gray-900 truncate cursor-pointer hover:bg-gray-50 hover:text-gray-600 rounded px-1.5 py-0.5 -ml-1.5 transition-colors w-max group/name flex items-center gap-1"
                  onClick={() => { setTempName(customName); setIsEditingName(true); }}
                  title="Click to edit name"
                >
                  <span className="truncate">{customName}</span>
                  <Pencil size={10} className="text-gray-400 opacity-0 group-hover/name:opacity-100 transition-opacity" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* CONFIGURATION SECTION (Order Type, Table, Delivery) */}
      <div className="px-3 sm:px-4 pt-3 sm:pt-4 pb-2 border-b border-gray-100 bg-white shrink-0 z-10 shadow-sm relative min-w-0">
        <div className="flex bg-gray-50 p-1 rounded-[14px] mb-3 sm:mb-4 border border-gray-100 min-w-0">
          <button 
            onClick={() => setOrderType('walk-in')} 
            className={`flex-1 py-1.5 text-[11px] sm:text-xs font-bold rounded-[10px] transition-all min-w-0 truncate px-1 ${orderType === 'walk-in' ? 'bg-white text-gray-900 shadow-sm border border-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Walk-in
          </button>
          <button 
            onClick={() => setOrderType('table')} 
            className={`flex-1 py-1.5 text-[11px] sm:text-xs font-bold rounded-[10px] transition-all min-w-0 truncate px-1 ${orderType === 'table' ? 'bg-white text-gray-900 shadow-sm border border-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Table
          </button>
          <button 
            onClick={() => setOrderType('delivery')} 
            className={`flex-1 py-1.5 text-[11px] sm:text-xs font-bold rounded-[10px] transition-all min-w-0 truncate px-1 ${orderType === 'delivery' ? 'bg-white text-gray-900 shadow-sm border border-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Delivery
          </button>
        </div>

        {orderType === 'table' && (
           <div className="mb-2 relative min-w-0">
             <button 
               onClick={() => setIsTableModalOpen(!isTableModalOpen)} 
               className={`w-full py-2.5 rounded-xl border flex items-center justify-between px-3 sm:px-4 transition-colors min-w-0 ${tableNumber ? 'border-gray-900 bg-gray-900 text-white shadow-md' : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50'}`}
             >
               <span className="text-xs sm:text-sm font-bold truncate pr-2">
                 {tableNumber ? tableNumber : 'Select Table'}
               </span>
               <ChevronDown size={16} className={`shrink-0 ${tableNumber ? 'text-gray-300' : 'text-gray-400'}`} />
             </button>
             {isTableModalOpen && (
               <>
                 <div className="fixed inset-0 bg-transparent z-[100]" onClick={() => setIsTableModalOpen(false)}></div>
                 <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-200 p-2 sm:p-3 z-[110] max-h-[250px] sm:max-h-[300px] overflow-y-auto no-scrollbar">
                   <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                     {Array.from({ length: 40 }, (_, i) => i + 1).map((num) => { 
                       const tVal = `Table ${num}`; 
                       const isSel = tableNumber === tVal; 
                       return (
                         <button 
                           key={num} 
                           onClick={() => { setTableNumber(tVal); setIsTableModalOpen(false); }} 
                           className={`py-2 rounded-xl flex items-center justify-center font-bold text-xs sm:text-sm transition-all ${isSel ? 'bg-[#111827] text-white shadow-md' : 'bg-gray-50 text-gray-700 hover:bg-gray-200'}`}
                         >
                           {num}
                         </button>
                       ); 
                     })}
                   </div>
                 </div>
               </>
             )}
           </div>
        )}
        
        {orderType === 'delivery' && (
           <select 
             value={deliveryAgent} 
             onChange={(e) => setDeliveryAgent(e.target.value)} 
             className="w-full px-3 py-2.5 rounded-xl text-xs font-semibold outline-none border border-gray-200 bg-white focus:border-gray-900 transition-all text-gray-900 cursor-pointer mb-2 min-w-0"
           >
             <option value="" className="text-gray-500">— Select Agent —</option>
             {["Grab", "Wownow", "Food Panda", "E-get"].map((agent) => (
               <option key={agent} value={agent}>{agent}</option>
             ))}
           </select>
        )}
      </div>

      {/* ITEMS LIST SECTION */}
      <div className="flex-1 overflow-y-auto no-scrollbar [&::-webkit-scrollbar]:hidden p-3 sm:p-4 bg-gray-50/50 min-w-0" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        <div className="flex items-center justify-between mb-3 sm:mb-4 min-w-0">
          <h3 className="font-extrabold text-gray-900 text-[10px] sm:text-xs uppercase tracking-widest truncate">Current Order</h3>
          <span className="bg-gray-200 text-gray-700 text-xs font-black px-2 py-0.5 rounded-full shrink-0">{items.length}</span>
        </div>
        
        {items.length === 0 ? (
          <div className="text-center py-12 sm:py-20 flex flex-col items-center opacity-70">
            <ShoppingCart size={40} strokeWidth={1} className="text-gray-300 mb-3 sm:mb-4 sm:w-12 sm:h-12" />
            <p className="text-xs sm:text-sm font-bold text-gray-900">Cart is empty</p>
            <p className="text-[10px] sm:text-xs text-gray-500 mt-1 px-4">Tap items on the menu to add them to your order</p>
          </div>
        ) : (
          <div className="space-y-2.5 sm:space-y-3 min-w-0">
            {items.map((item) => (
              <div key={item.id} className="flex items-start gap-2.5 sm:gap-3 p-2.5 sm:p-3 bg-white rounded-[16px] border border-gray-100 shadow-sm relative group min-w-0">
                <button 
                  onClick={() => onRemove(item.id)} 
                  className="absolute -top-2 -right-2 w-5 h-5 sm:w-6 sm:h-6 bg-white hover:bg-gray-100 text-gray-400 hover:text-red-500 rounded-full flex items-center justify-center opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all border border-gray-200 shadow-sm z-10"
                >
                  <X size={10} className="sm:w-3 sm:h-3" strokeWidth={3} />
                </button>
                
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden flex-shrink-0 bg-gray-50 border border-gray-100">
                  {item.img ? (
                    <img src={item.img} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon size={16} className="text-gray-300" />
                    </div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0 flex flex-col justify-between h-full pt-0.5">
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-extrabold text-gray-900 leading-tight truncate pr-2 sm:pr-4">
                      {item.name}
                    </p>
                    <p className="text-[9px] sm:text-[10px] text-gray-400 font-bold truncate mt-0.5">
                      Size {item.customization.size}
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-between mt-2 min-w-0">
                    <span className="font-black text-xs sm:text-sm text-gray-900 truncate pr-2">
                      ${(item.price * item.qty).toFixed(2)}
                    </span>
                    <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg h-6 sm:h-7 shrink-0">
                      <button 
                        className="w-6 sm:w-7 h-full flex items-center justify-center text-gray-500 hover:text-gray-900 font-medium active:bg-gray-100 rounded-l-lg" 
                        onClick={() => onQtyChange(item.id, -1)}
                      >
                        −
                      </button>
                      <span className="w-5 sm:w-6 text-center text-[10px] sm:text-xs font-bold text-gray-900 bg-white border-x border-gray-200 h-full flex items-center justify-center">
                        {item.qty}
                      </span>
                      <button 
                        className="w-6 sm:w-7 h-full flex items-center justify-center text-gray-500 hover:text-gray-900 font-medium active:bg-gray-100 rounded-r-lg" 
                        onClick={() => onQtyChange(item.id, 1)}
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FOOTER TOTALS & CHECKOUT */}
      <div className="border-t border-gray-100 bg-white shrink-0 z-20 min-w-0">
        <div className="p-3 sm:p-4 space-y-2 sm:space-y-3 border-b border-gray-100 min-w-0">
          <div className="flex justify-between text-[11px] sm:text-xs min-w-0">
            <span className="text-gray-500 font-bold truncate pr-2">Subtotal</span>
            <span className="font-black text-gray-900 shrink-0">${subtotal.toFixed(2)}</span>
          </div>
          
          <div className="flex justify-between items-center text-[11px] sm:text-xs min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-gray-500 font-bold truncate">Tax (10%)</span>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input type="checkbox" checked={isTaxEnabled} onChange={(e) => setIsTaxEnabled(e.target.checked)} className="sr-only peer" />
                <div className="w-6 h-3 sm:w-7 sm:h-4 bg-gray-300 rounded-full peer peer-checked:bg-[#111827] after:content-[''] after:absolute after:top-[1px] sm:after:top-[2px] after:left-[1px] sm:after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-2.5 after:w-2.5 sm:after:h-3 sm:after:w-3 after:transition-all peer-checked:after:translate-x-full peer-checked:after:border-white"></div>
              </label>
            </div>
            <span className={`font-black shrink-0 pl-2 ${isTaxEnabled ? 'text-gray-900' : 'text-gray-300 line-through'}`}>
              ${(afterDiscount * TAX_RATE).toFixed(2)}
            </span>
          </div>
          
          <div className="flex justify-between pt-2 border-t border-gray-100 mt-2 items-end min-w-0">
            <span className="font-black text-gray-900 text-xs sm:text-sm truncate pr-2">Total</span>
            <span className="font-black text-gray-900 text-xl sm:text-2xl leading-none shrink-0">${total.toFixed(2)}</span>
          </div>
        </div>
        
        <div className="p-3 sm:p-4 pt-3 sm:pt-4 bg-gray-50/50 min-w-0">
          <div className="flex gap-2 mb-2 sm:mb-3 min-w-0">
            <button 
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 sm:gap-1 py-2 sm:py-3 rounded-[12px] sm:rounded-[14px] font-bold text-[10px] sm:text-xs transition-all active:scale-[0.98] border-2 min-w-0 truncate px-1 ${paymentMethod === "cash" ? "bg-[#111827] text-white border-[#111827] shadow-md" : "bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:text-gray-900"}`} 
              onClick={() => setPaymentMethod("cash")}
            >
              <span className="text-base sm:text-lg leading-none shrink-0">💵</span>
              <span className="truncate w-full text-center">Cash</span>
            </button>
            <button 
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 sm:gap-1 py-2 sm:py-3 rounded-[12px] sm:rounded-[14px] font-bold text-[10px] sm:text-xs transition-all active:scale-[0.98] border-2 min-w-0 truncate px-1 ${paymentMethod === "khqr" ? "bg-[#111827] text-white border-[#111827] shadow-md" : "bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:text-gray-900"}`} 
              onClick={() => setPaymentMethod("khqr")}
            >
              <span className="text-base sm:text-lg leading-none shrink-0">📲</span>
              <span className="truncate w-full text-center">KHQR</span>
            </button>
          </div>
          
          <button 
            className={`w-full py-3 sm:py-4 rounded-[12px] sm:rounded-[14px] font-bold text-sm sm:text-[15px] transition-all flex items-center justify-center gap-2 min-w-0 px-2 ${items.length > 0 && !isSavingOrder ? 'bg-[#111827] text-white shadow-lg hover:bg-black active:scale-[0.98]' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`} 
            onClick={handlePrint} 
            disabled={items.length === 0 || isSavingOrder}
          >
            {isSavingOrder ? <Loader2 className="animate-spin shrink-0" size={18} /> : null}
            <span className="truncate">
              {items.length > 0 && !isSavingOrder ? `Place Order — $${total.toFixed(2)}` : isSavingOrder ? "Processing..." : "Select items to begin"}
            </span>
          </button>
        </div>
      </div>
    </>
  );
}