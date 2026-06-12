// src/components/pos/AdminPosSection.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { ShoppingCart, Search, CloudOff, RefreshCcw, Printer, X, Map, ChevronDown, ChevronLeft, Loader2 } from 'lucide-react';
import { useOrder } from "@/context/OrderContext";
import EmptyState, { SearchEmptySVG } from "@/components/ui/EmptyState";
import { createPosOrder, completeTableOrder } from '@/lib/actions';
import { useRouter } from 'next/navigation';
import { Rnd } from "react-rnd";

import PosCustomizationModal from './PosCustomizationModal';
import PosProductCard, { PosProductCardSkeleton } from './PosProductCard';
import BillingPanel from './BillingPanel';
import { generateReceiptText } from '@/components/shared/PosReceipt';

import { saveOfflineOrder, getPendingOrders, markOrderSynced, OfflineOrder } from '@/lib/offlineStore';
import { getShopTables } from '@/lib/table-actions';
import { useToast } from "@/context/ToastContext";


export interface Category { id: string; name: string; name_kh?: string | null; name_zh?: string | null; sortOrder: number; discount?: number; isDrink?: boolean; } 
export interface Product { id: string; name: string; name_kh?: string | null; name_zh?: string | null; price: number; variants?: {id?: string, name: string, price: number}[]; image: string; category: { name: string, discount?: number }; time: string; isPopular?: boolean; isSoldOut?: boolean; discount?: number; description?: string; }
export interface Topping { id: string; name: string; price: number; isDrink: boolean; }

export interface ProductCustomization { 
  size: string; 
  sugar: '0' | '50' | '100'; 
  ice: 'Normal'; 
  toppings: { name: string; price: number; qty: number }[]; 
}

export interface BillingItem { id: string; productId: string; name: string; price: number; qty: number; notes: string; img: string; customization: ProductCustomization; }
export interface PosProduct { id: string; name: string; description: string; price: number; variants?: {id?: string, name: string, price: number}[]; category: string; img: string; isDrink?: boolean; }
export type OrderType = "walk-in" | "table" | "delivery";

const TAX_RATE = 0.1;
const EXCHANGE_RATE = 4000;

// --- LIVE FLOOR PLAN VIEW (Returns 2 Columns to mimic standard POS layout) ---
function LiveFloorPlanView({ 
  shopId, 
  printerUrl, 
  shopName,
  userEmail,
  userRole,
  onSelectTableForOrder,
  onOrderTypeChange
}: { 
  shopId: string; 
  printerUrl?: string; 
  shopName: string;
  userEmail?: string;
  userRole?: string;
  onSelectTableForOrder: (tableId: string) => void;
  onOrderTypeChange: (type: OrderType) => void;
}) {
  const [tables, setTables] = useState<any[]>([]);
  const [selectedTable, setSelectedTable] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isMobilePanelOpen, setIsMobilePanelOpen] = useState(false);

  // Replicate Cashier Name logic from BillingPanel
  const defaultCashierName = userEmail ? userEmail.split('@')[0] : 'Unknown';
  const defaultFormattedName = defaultCashierName.charAt(0).toUpperCase() + defaultCashierName.slice(1);
  const [customName, setCustomName] = useState(defaultFormattedName);
  useEffect(() => {
    const storedName = localStorage.getItem('pos_cashier_name');
    if (storedName) setCustomName(storedName);
  }, []);

  const fetchLiveTables = async () => {
    const res = await getShopTables(shopId);
    if (res.success && res.data) {
      setTables(res.data);
      if (selectedTable) {
        const updatedSelected = res.data.find((t: any) => t.id === selectedTable.id);
        if (updatedSelected) setSelectedTable(updatedSelected);
      }
    }
  };

  useEffect(() => {
    fetchLiveTables();
    const interval = setInterval(fetchLiveTables, 10000); 
    return () => clearInterval(interval);
  }, [shopId, selectedTable]);

  const handlePrintAndComplete = async (order: any) => {
    setIsProcessing(true);
    if (printerUrl) {
      try {
        const receiptText = generateReceiptText(order, shopName);
        await fetch(`${printerUrl}/print`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: receiptText }) });
      } catch (e) { alert("Failed to print ticket."); }
    }
    await completeTableOrder(order.id);
    await fetchLiveTables();
    setIsProcessing(false);
  };

  return (
    <>
      {/* PANE 1: LEFT CANVAS (Mimics the Product Grid wrapper) */}
      <div id="pos-left-pane-floorplan" className="flex-1 flex flex-col h-full overflow-hidden min-w-0 bg-[#F9FAFB] relative border-r border-gray-200">
        
        <div className="h-16 flex items-center justify-between px-4 sm:px-6 shrink-0 bg-transparent relative z-10 mt-2">
          <div className="flex items-center gap-3">
            <select className="bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-bold text-gray-900 outline-none shadow-sm hidden sm:block">
              <option>Main Dining</option>
            </select>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-400 shadow-sm w-full sm:w-64 text-left flex items-center gap-2">
            <Search size={16} className="text-gray-400" /> Search table...
          </div>
        </div>

        <div className="flex-1 relative overflow-auto" onClick={() => setSelectedTable(null)}>
          <div className="relative w-[2000px] h-[2000px]">
            {tables.map((table) => {
              const isSelected = selectedTable?.id === table.id;
              const hasActiveSession = table.sessions && table.sessions.length > 0 && table.sessions[0].status === "OPEN";
              
              const borderColor = isSelected ? '#111827' : hasActiveSession ? '#9CA3AF' : '#E5E7EB';
              const badgeColor = hasActiveSession ? 'bg-gray-900' : 'bg-gray-200';

              return (
                <Rnd
                  key={table.id}
                  size={{ width: table.width || 100, height: table.height || 100 }}
                  position={{ x: table.positionX || 0, y: table.positionY || 0 }}
                  disableDragging={true}
                  enableResizing={false}
                  className={`absolute flex items-center justify-center cursor-pointer transition-all duration-200 ${isSelected ? 'z-20 scale-105' : 'z-10 hover:scale-105'}`}
                  style={{
                    borderRadius: table.shape === 'circle' ? '50%' : '16px',
                    backgroundColor: '#ffffff',
                    border: `2px solid ${borderColor}`,
                    boxShadow: isSelected ? '0 10px 25px -5px rgba(0, 0, 0, 0.15)' : '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                  }}
                  onClick={(e: any) => { 
                    e.stopPropagation(); 
                    setSelectedTable(table); 
                    setIsMobilePanelOpen(true); // Open panel on mobile
                  }}
                >
                  <div className="flex flex-col items-center justify-center text-center">
                    <span className="font-black text-gray-900 text-lg">{table.label}</span>
                    <span className="text-xs text-gray-400 font-medium flex items-center gap-1 mt-1">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                      {table.seats || 4}
                    </span>
                  </div>
                  <div className={`absolute -bottom-2 -right-2 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center ${badgeColor}`}>
                    {hasActiveSession && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                  </div>
                </Rnd>
              );
            })}
          </div>
        </div>
      </div>

      {/* PANE 2: RIGHT DETAILS (Identical replica of BillingPanel layout) */}
      <div id="pos-right-pane-floorplan" className={`fixed inset-0 z-[60] md:static w-full md:w-[360px] lg:w-[400px] shrink-0 border-l border-gray-200 bg-white flex-col h-full shadow-[-4px_0_15px_-3px_rgba(0,0,0,0.05)] transition-transform duration-300 min-w-0 ${isMobilePanelOpen ? 'flex' : 'hidden md:flex'}`}>
        
        {/* IDENTICAL PROFILE HEADER */}
        <div className="p-3 sm:p-4 border-b border-gray-100 shrink-0 bg-white z-20 min-w-0">
          <div className="flex items-center justify-between min-w-0">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <button onClick={() => setIsMobilePanelOpen(false)} className="md:hidden mr-1 p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors active:scale-95 shrink-0">
                <ChevronLeft size={20} className="text-gray-700" />
              </button>
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center font-bold text-gray-500 text-xs sm:text-sm shrink-0">
                {customName.substring(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1 flex flex-col justify-center">
                <p className="text-[9px] sm:text-[10px] text-gray-500 font-black uppercase tracking-wider truncate">{userRole || 'Cashier'}</p>
                <div className="text-xs sm:text-sm font-extrabold text-gray-900 truncate">
                  <span>{customName}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* IDENTICAL NAVIGATION / TABLE SELECTOR */}
        <div className="px-3 sm:px-4 pt-3 sm:pt-4 pb-2 border-b border-gray-100 bg-white shrink-0 z-10 shadow-sm relative min-w-0">
          <div className="flex bg-gray-50 p-1 rounded-[14px] mb-3 sm:mb-4 border border-gray-100 min-w-0">
            <button onClick={() => onOrderTypeChange('walk-in')} className="flex-1 py-1.5 text-[11px] sm:text-xs font-bold rounded-[10px] transition-all min-w-0 truncate px-1 text-gray-500 hover:text-gray-700">Walk-in</button>
            <button className="flex-1 py-1.5 text-[11px] sm:text-xs font-bold rounded-[10px] transition-all min-w-0 truncate px-1 bg-white text-gray-900 shadow-sm border border-gray-200">Table</button>
            <button onClick={() => onOrderTypeChange('delivery')} className="flex-1 py-1.5 text-[11px] sm:text-xs font-bold rounded-[10px] transition-all min-w-0 truncate px-1 text-gray-500 hover:text-gray-700">Delivery</button>
          </div>

          <div className="mb-2 relative min-w-0">
            <button onClick={() => setSelectedTable(null)} className={`w-full py-2.5 rounded-xl border flex items-center justify-between px-3 sm:px-4 transition-colors min-w-0 ${selectedTable ? 'border-gray-900 bg-gray-900 text-white shadow-md' : 'border-gray-300 bg-white text-gray-600'}`}>
              <span className="text-xs sm:text-sm font-bold truncate pr-2">{selectedTable ? selectedTable.label : 'Select Table'}</span>
              {selectedTable ? <X size={16} className="shrink-0 text-gray-300" /> : <ChevronDown size={16} className="shrink-0 text-gray-400" />}
            </button>
          </div>
        </div>

        {/* IDENTICAL LIST AREA */}
        <div className="flex-1 overflow-y-auto no-scrollbar [&::-webkit-scrollbar]:hidden p-3 sm:p-4 bg-gray-50/50 min-w-0" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          <div className="flex items-center justify-between mb-3 sm:mb-4 min-w-0">
            <h3 className="font-extrabold text-gray-900 text-[10px] sm:text-xs uppercase tracking-widest truncate">Live Orders</h3>
            <span className="bg-gray-200 text-gray-700 text-xs font-black px-2 py-0.5 rounded-full shrink-0">{selectedTable?.sessions?.[0]?.orders?.length || 0}</span>
          </div>
          
          {!selectedTable ? (
            <div className="text-center py-12 sm:py-20 flex flex-col items-center opacity-70">
              <Map size={40} strokeWidth={1} className="text-gray-300 mb-3 sm:mb-4 sm:w-12 sm:h-12" />
              <p className="text-xs sm:text-sm font-bold text-gray-900">No Table Selected</p>
              <p className="text-[10px] sm:text-xs text-gray-500 mt-1 px-4">Tap a table on the map</p>
            </div>
          ) : !selectedTable.sessions?.[0]?.orders?.length ? (
            <div className="text-center py-12 sm:py-20 flex flex-col items-center opacity-70">
              <ShoppingCart size={40} strokeWidth={1} className="text-gray-300 mb-3 sm:mb-4 sm:w-12 sm:h-12" />
              <p className="text-xs sm:text-sm font-bold text-gray-900">Table is empty</p>
              <p className="text-[10px] sm:text-xs text-gray-500 mt-1 px-4">Assign an order to begin</p>
            </div>
          ) : (
            <div className="space-y-2.5 sm:space-y-3 min-w-0">
              {selectedTable.sessions[0].orders.map((order: any) => (
                 <div key={order.id} className="p-3 sm:p-4 bg-white rounded-[16px] border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-center mb-2 pb-2 border-b border-gray-50">
                      <span className={`text-[9px] sm:text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${order.status === 'PENDING' ? 'bg-orange-50 text-orange-600' : 'bg-gray-100 text-gray-600'}`}>{order.status}</span>
                    </div>
                    {order.items.map((item: any, idx: number) => (
                      <div key={idx} className="flex justify-between text-xs sm:text-sm mb-1.5">
                        <div>
                          <span className="font-bold text-gray-900">{item.name}</span>
                          <span className="text-gray-500 font-medium ml-2">x{item.quantity}</span>
                        </div>
                        <span className="font-black text-gray-900">${(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                    {order.status === 'PENDING' && (
                      <button onClick={() => handlePrintAndComplete(order)} disabled={isProcessing} className="w-full mt-2 bg-gray-100 hover:bg-gray-200 text-gray-900 font-bold py-2 sm:py-2.5 rounded-xl text-[10px] sm:text-xs transition-colors flex items-center justify-center gap-2">
                        {isProcessing ? <Loader2 size={14} className="animate-spin" /> : <Printer size={14} />} Print & Complete Order
                      </button>
                    )}
                 </div>
              ))}
            </div>
          )}
        </div>

        {/* IDENTICAL FOOTER */}
        <div className="p-3 sm:p-4 pt-3 sm:pt-4 bg-gray-50/50 min-w-0 border-t border-gray-100">
           <button 
            onClick={() => selectedTable ? onSelectTableForOrder(selectedTable.label) : null} 
            disabled={!selectedTable}
            className={`w-full py-3 sm:py-4 rounded-[12px] sm:rounded-[14px] font-bold text-sm sm:text-[15px] transition-all flex items-center justify-center gap-2 min-w-0 px-2 ${selectedTable ? 'bg-[#111827] text-white shadow-lg hover:bg-black active:scale-[0.98]' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
          >
            Assign POS Order
          </button>
        </div>
      </div>
    </>
  );
}


export default function AdminPosSection({ 
  dashboardCategories, 
  dashboardProducts, 
  shopId, 
  userEmail, 
  userRole, 
  shopName, 
  printerUrl, 
  qrImage, 
  toppings = [] 
}: { 
  dashboardCategories: Category[], 
  dashboardProducts: Product[], 
  shopId: string, 
  userEmail?: string, 
  userRole?: string, 
  shopName: string, 
  printerUrl?: string, 
  qrImage?: string | null, 
  toppings?: Topping[] 
}) {
  const router = useRouter();
  const { addSuccessToast, addErrorToast } = useToast();
  const [menuLoading, setMenuLoading] = useState(true);
  const [selectedModalProduct, setSelectedModalProduct] = useState<PosProduct | null>(null);
  const [isSavingOrder, setIsSavingOrder] = useState(false);
  const [pendingSyncCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const isSyncingRef = useRef(false); 
  const isCheckoutLocked = useRef(false); 

  const [leftView, setLeftView] = useState<'menu' | 'floorplan'>('menu');

  useEffect(() => {
    const timer = setTimeout(() => setMenuLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  const checkPendingOrders = async () => {
    try {
      const pending = await getPendingOrders();
      setPendingCount(pending.length);
    } catch (e) { }
  };

  const syncPendingOrders = async () => {
    if (isSyncingRef.current) return;
    try {
      const pendingOrders = await getPendingOrders();
      if (pendingOrders.length === 0) return;
      
      isSyncingRef.current = true;
      setIsSyncing(true);
      
      for (const offlineOrder of pendingOrders) {
        try {
          const res = await createPosOrder(offlineOrder.payload);
          if (res?.success || res?.error) {
            await markOrderSynced(offlineOrder.id);
          }
        } catch (error) { 
          if (!navigator.onLine) break; 
        }
      }
    } finally {
      await checkPendingOrders();
      isSyncingRef.current = false;
      setIsSyncing(false);
      router.refresh(); 
    }
  };

  useEffect(() => {
    checkPendingOrders();
    syncPendingOrders();
    const interval = setInterval(syncPendingOrders, 30000); 
    window.addEventListener('online', syncPendingOrders);
    return () => { 
      clearInterval(interval); 
      window.removeEventListener('online', syncPendingOrders); 
    };
  }, []);

  const categories = [
    { id: "all", label: "All", emoji: "📋", isDrink: false },
    ...dashboardCategories.map((c) => ({ id: String(c.name), label: c.name, emoji: "🏷️", isDrink: c.isDrink || false })),
  ];

  const products: PosProduct[] = dashboardProducts
    .filter((item) => !item.isSoldOut)
    .map((item) => {
      const catName = typeof item.category === 'string' ? item.category : (item.category?.name || "Unknown");
      const parentCat = dashboardCategories.find(c => c.name === catName);
      return {
        id: String(item.id),
        name: item.name,
        description: item.description || "",
        price: item.price,
        variants: item.variants,
        category: catName,
        img: item.image || "",
        isDrink: parentCat?.isDrink || false,
      };
    });

  const [activeCategory, setActiveCategory] = useState("all");
  const [billingItems, setBillingItems] = useState<BillingItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [orderType, setOrderType] = useState<OrderType>("walk-in");
  const [tableNumber, setTableNumber] = useState("");
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);

  useEffect(() => {
    if (orderType === 'table' && !tableNumber) {
      setLeftView('floorplan');
    } else if (orderType !== 'table') {
      setLeftView('menu');
      setTableNumber(""); 
    }
  }, [orderType, tableNumber]);

  const filteredProducts = products.filter((p) => {
    const matchCat = activeCategory === "all" || p.category === activeCategory;
    const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const handleAddToBilling = (product: PosProduct, customization: ProductCustomization, notes: string, dynamicPrice?: number) => {
    const finalPrice = dynamicPrice !== undefined ? dynamicPrice : product.price;
    setBillingItems((prev) => {
      const existing = prev.find((i) => 
        i.name === product.name && 
        i.notes === notes && 
        JSON.stringify(i.customization) === JSON.stringify(customization) && 
        i.price === finalPrice
      );
      if (existing) return prev.map((i) => i.id === existing.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { 
        id: `b${Date.now()}`, 
        productId: product.id, 
        name: product.name, 
        price: finalPrice, 
        qty: 1, 
        notes: notes, 
        img: product.img, 
        customization 
      }];
    });
  };

  const handleRemove = (id: string) => setBillingItems((prev) => prev.filter((i) => i.id !== id));
  
  const handleQtyChange = (id: string, delta: number) => {
    setBillingItems((prev) => prev.map((i) => (i.id === id ? { ...i, qty: Math.max(0, i.qty + delta) } : i)).filter((i) => i.qty > 0));
  };

  const handleProceedToConfirm = async (
    paymentMethod: string, 
    deliveryAgent: string, 
    promoCode: string, 
    discountType: string, 
    discountValue: string, 
    isTaxEnabled: boolean, 
    currency: string = "USD", 
    amountReceived: number = 0, 
    changeAmount: number = 0,
    shouldPrint: boolean = true
  ) => {
    if (billingItems.length === 0) return;
    if (orderType === "table" && !tableNumber) { 
      alert("Please select a table number first."); 
      return; 
    }
    
    // Capture data
    const itemsToProcess = [...billingItems];
    const subtotal = itemsToProcess.reduce((sum, i) => sum + i.price * i.qty, 0);
    const discountNum = parseFloat(discountValue) || 0;
    const discountAmount = discountType === "percent" ? (subtotal * discountNum) / 100 : Math.min(discountNum, subtotal);
    const afterDiscount = subtotal - discountAmount;
    const tax = isTaxEnabled ? (afterDiscount * TAX_RATE) : 0;
    const total = afterDiscount + tax;

    const orderPayload = {
      shopId, 
      orderType: orderType.toUpperCase(), 
      tableNumber, 
      deliveryAgent: deliveryAgent || "", 
      discount: discountAmount, 
      promoCode: promoCode || "", 
      isTaxEnabled, 
      paymentMethod: paymentMethod.toUpperCase(), 
      currency, 
      amountReceived, 
      changeAmount,
      items: itemsToProcess.map(i => ({ 
        productId: i.productId, 
        name: i.name, 
        price: i.price, 
        qty: i.qty, 
        notes: i.notes, 
        customization: i.customization 
      }))
    };

    // OPTIMISTIC UI: Clear the cart instantly
    setBillingItems([]); 
    setTableNumber(""); 
    setIsMobileCartOpen(false);

    // BACKGROUND PROCESSING
    (async () => {
      try {
        let finalOrderForReceipt: any = null;

        if (!navigator.onLine) {
            await saveOfflineOrder({ id: `offline_${Date.now()}`, payload: orderPayload, status: 'pending', createdAt: Date.now() });
            checkPendingOrders();
        } else {
            const res = await createPosOrder(orderPayload);
            if (res?.success && res.order) {
                finalOrderForReceipt = res.order;
                if (orderType === 'table') completeTableOrder(res.order.id).catch(console.error);
            } else {
                throw new Error(res?.error || "Server rejected order");
            }
        }
        
        // FIXED: Replaced showToast with addSuccessToast
        addSuccessToast("Order Saved!");

        // OPTIMISTIC PRINTING
        if (shouldPrint && printerUrl && finalOrderForReceipt) {
            const receiptText = generateReceiptText(finalOrderForReceipt, shopName);
            
            fetch(`${printerUrl}/print`, { 
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' }, 
                body: JSON.stringify({ text: receiptText }) 
            })
            .then(printRes => {
                if (printRes.ok) {
                   addSuccessToast("Receipt Printed"); // FIXED
                } else {
                   addErrorToast("Printer error: Check paper or connection"); // FIXED
                }
            })
            .catch(printErr => {
                console.error("Print Error:", printErr);
                addErrorToast("Failed to connect to printer"); // FIXED
            });
        }

      } catch (err) {
        console.error("Background Order Error:", err);
        addErrorToast("Order failed to save to server."); // FIXED
      }
    })();
  };

  return (
    <div className="flex flex-row h-full w-full bg-[#F9FAFB] relative min-w-0">
      
      {selectedModalProduct && (
        <PosCustomizationModal 
          product={selectedModalProduct} 
          toppings={toppings} 
          onClose={() => setSelectedModalProduct(null)} 
          onAdd={handleAddToBilling} 
        />
      )}

      {/* RENDER EITHER THE FLOOR PLAN OR THE MENU + BILLING PANEL */}
      {leftView === 'floorplan' ? (
        <LiveFloorPlanView 
          shopId={shopId} 
          shopName={shopName}
          printerUrl={printerUrl}
          userEmail={userEmail}
          userRole={userRole}
          onSelectTableForOrder={(id) => {
            setOrderType("table");
            setTableNumber(id);
            setLeftView("menu");
          }}
          onOrderTypeChange={(type) => {
            setOrderType(type);
            setLeftView("menu");
          }}
        />
      ) : (
        <>
          {/* LEFT PANE: PRODUCT MENU */}
          <div id="pos-left-pane" className={`flex-1 flex flex-col h-full overflow-hidden p-4 md:p-6 pb-28 md:pb-6 min-w-0 ${isMobileCartOpen ? 'hidden md:flex' : 'flex'}`}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-5 gap-3 shrink-0 min-w-0">
              <h1 className="text-2xl font-bold text-gray-900 truncate">Select Products</h1>
              
              <div className="flex items-center gap-3 w-full sm:w-auto">
                {pendingSyncCount > 0 && (
                  <div className="flex items-center gap-1.5 bg-gray-100 border border-gray-200 text-gray-900 px-3 py-2 rounded-xl text-xs font-bold shadow-sm whitespace-nowrap">
                    <CloudOff size={14} />
                    <span>{pendingSyncCount} Offline</span>
                    {isSyncing && <RefreshCcw size={12} className="animate-spin ml-1" />}
                  </div>
                )}
                
                <div className="relative w-full sm:w-72 shrink-0">
                  <input 
                    type="text" 
                    placeholder="Search menu..." 
                    value={searchQuery} 
                    onChange={(e) => setSearchQuery(e.target.value)} 
                    className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-gray-200 shadow-sm text-sm outline-none focus:border-gray-900 transition-colors" 
                  />
                  <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>
              </div>
            </div>

            <div className="flex gap-2 mb-4 overflow-x-auto pb-2 shrink-0 no-scrollbar" style={{ scrollbarWidth: 'none' }}>
              {categories.map((cat) => (
                <button 
                  key={cat.id} 
                  className={`flex-shrink-0 px-5 py-2.5 rounded-xl text-sm font-bold border transition-all active:scale-95 ${activeCategory === String(cat.id) ? "bg-gray-900 text-white border-gray-900 shadow-md" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"}`} 
                  onClick={() => setActiveCategory(String(cat.id))}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar pb-12" style={{ scrollbarWidth: 'none' }}>
              {menuLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                  {[...Array(8)].map((_, i) => <PosProductCardSkeleton key={i} />)}
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center pt-10 pb-20">
                  <div className="w-32 h-32 mb-4 opacity-50"><SearchEmptySVG /></div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">No products found</h3>
                  <p className="text-sm text-gray-500">Try adjusting your search or category filter.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                  {filteredProducts.map((product) => (
                    <PosProductCard 
                      key={product.id} 
                      product={product} 
                      onClick={(p) => setSelectedModalProduct(p)} 
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* MOBILE CART BUTTON */}
          {!isMobileCartOpen && (
            <div className="md:hidden fixed bottom-6 left-0 w-full px-4 z-40">
              <button 
                onClick={() => setIsMobileCartOpen(true)} 
                className="w-full bg-gray-900 text-white shadow-2xl rounded-2xl p-4 flex items-center justify-between active:scale-[0.98] transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <ShoppingCart size={20} />
                    {billingItems.length > 0 && (
                      <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                        {billingItems.reduce((acc, item) => acc + item.qty, 0)}
                      </span>
                    )}
                  </div>
                  <span className="font-bold text-sm truncate">View Cart</span>
                </div>
                <span className="font-black text-lg shrink-0">
                  ${(billingItems.reduce((acc, item) => acc + item.price * item.qty, 0)).toFixed(2)}
                </span>
              </button>
            </div>
          )}

          {/* RIGHT PANE: STANDARD BILLING PANEL */}
          <div 
            id="pos-right-pane" 
            className={`fixed inset-0 z-[60] md:static w-full md:w-[360px] lg:w-[400px] shrink-0 border-l border-gray-200 bg-white flex-col h-full shadow-[-4px_0_15px_-3px_rgba(0,0,0,0.05)] transition-transform duration-300 min-w-0 ${isMobileCartOpen ? 'flex' : 'hidden md:flex'}`}
          >
            <BillingPanel
              items={billingItems}
              onRemove={handleRemove}
              onQtyChange={handleQtyChange}
              orderType={orderType}
              setOrderType={setOrderType}
              tableNumber={tableNumber}
              setTableNumber={setTableNumber}
              onProceedToConfirm={handleProceedToConfirm}
              isSavingOrder={isSavingOrder}
              userEmail={userEmail}
              userRole={userRole}
              onCloseMobile={() => setIsMobileCartOpen(false)}
              isTableModalOpen={false} 
              setIsTableModalOpen={() => {}} 
              qrImage={qrImage}
            />
          </div>
        </>
      )}
    </div>
  );
}