// src/components/pos/AdminPosSection.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { ShoppingCart, Search, WifiOff, CloudOff, RefreshCcw } from 'lucide-react';
import { useOrder } from "@/context/OrderContext";
import EmptyState, { SearchEmptySVG } from "@/components/ui/EmptyState";
import PosReceipt from "@/components/PosReceipt";
import { createPosOrder } from '@/lib/actions';
import { useRouter } from 'next/navigation';

import PosCustomizationModal from './PosCustomizationModal';
import PosProductCard, { PosProductCardSkeleton } from './PosProductCard';
import BillingPanel from './BillingPanel';

// IMPORT OFFLINE STORE
import { saveOfflineOrder, getPendingOrders, markOrderSynced, OfflineOrder } from '@/lib/offlineStore';

export interface Category { id: string; name: string; name_kh?: string | null; name_zh?: string | null; sortOrder: number; discount?: number; isDrink?: boolean; } 
export interface Product { id: string; name: string; name_kh?: string | null; name_zh?: string | null; price: number; variants?: {id?: string, name: string, price: number}[]; image: string; category: { name: string, discount?: number }; time: string; isPopular?: boolean; isSoldOut?: boolean; discount?: number; description?: string; }

export interface ProductCustomization { mood: string; size: string; sugar: string; ice: string; }
export interface BillingItem { id: string; productId: string; name: string; price: number; qty: number; notes: string; img: string; customization: ProductCustomization; }
export interface PosProduct { id: string; name: string; description: string; price: number; variants?: {id?: string, name: string, price: number}[]; category: string; img: string; isDrink?: boolean; }
export type OrderType = "walk-in" | "table" | "delivery";

const TAX_RATE = 0.1;

export default function AdminPosSection({ dashboardCategories, dashboardProducts, shopId, userEmail, userRole, shopName }: { dashboardCategories: Category[], dashboardProducts: Product[], shopId: string, userEmail?: string, userRole?: string, shopName: string }) {
  const router = useRouter();
  
  const [menuLoading, setMenuLoading] = useState(true);
  const [latestOrder, setLatestOrder] = useState<any>(null);
  const [selectedModalProduct, setSelectedModalProduct] = useState<PosProduct | null>(null);

  // Offline Sync State
  const [pendingSyncCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const isSyncingRef = useRef(false); 
  const isCheckoutLocked = useRef(false); 

  useEffect(() => {
    const timer = setTimeout(() => setMenuLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  const checkPendingOrders = async () => {
    try {
      const pending = await getPendingOrders();
      setPendingCount(pending.length);
    } catch (e) {
      console.error("Failed to read pending offline orders", e);
    }
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
          if (res?.success) {
            await markOrderSynced(offlineOrder.id);
          } else if (res?.error) {
            console.error(`Offline order rejected by server, discarding to clear queue:`, res.error);
            await markOrderSynced(offlineOrder.id);
          }
        } catch (error) {
          console.warn(`Failed to sync offline order ${offlineOrder.id}, will retry later`, error);
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
    ...dashboardCategories.map((c) => ({
      id: String(c.name), 
      label: c.name,
      emoji: "🏷️",
      isDrink: c.isDrink || false
    })),
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
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);

  const filteredProducts = products.filter((p) => {
    const matchCat = activeCategory === "all" || p.category === activeCategory;
    const matchSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const handleAddToBilling = (product: PosProduct, customization: ProductCustomization, notes: string, dynamicPrice?: number) => {
    const finalPrice = dynamicPrice !== undefined ? dynamicPrice : product.price;

    setBillingItems((prev) => {
      const existing = prev.find((i) => i.name === product.name && i.notes === notes && JSON.stringify(i.customization) === JSON.stringify(customization) && i.price === finalPrice);
      if (existing) {
        return prev.map((i) => i.id === existing.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [
        ...prev,
        {
          id: `b${Date.now()}`,
          productId: product.id, 
          name: product.name,
          price: finalPrice, 
          qty: 1,
          notes: notes,
          img: product.img,
          customization,
        },
      ];
    });
  };

  const handleRemove = (id: string) => {
    setBillingItems((prev) => prev.filter((i) => i.id !== id));
  };

  const handleQtyChange = (id: string, delta: number) => {
    setBillingItems((prev) =>
      prev
        .map((i) => (i.id === id ? { ...i, qty: Math.max(0, i.qty + delta) } : i))
        .filter((i) => i.qty > 0)
    );
  };

  const [isSavingOrder, setIsSavingOrder] = useState(false);

  const handleProceedToConfirm = async (paymentMethod: string, deliveryAgent: string, promoCode: string, discountType: string, discountValue: string, isTaxEnabled: boolean, currency: string = "USD", amountReceived: number = 0, changeAmount: number = 0) => {
    if (billingItems.length === 0) return;
    if (orderType === "table" && !tableNumber) {
      alert("Please select a table number first.");
      return;
    }
    
    if (isCheckoutLocked.current) return;
    isCheckoutLocked.current = true;
    setIsSavingOrder(true);
    
    try {
      const subtotal = billingItems.reduce((sum, i) => sum + i.price * i.qty, 0);
      const discountNum = parseFloat(discountValue) || 0;
      const discountAmount = discountType === "percent" ? (subtotal * discountNum) / 100 : Math.min(discountNum, subtotal);
      const afterDiscount = subtotal - discountAmount;
      const tax = isTaxEnabled ? (afterDiscount * TAX_RATE) : 0;
      const total = afterDiscount + tax;

      // Add amountReceived and changeAmount to the payload 
      const orderPayload = {
        shopId,
        orderType: orderType.toUpperCase(),
        tableNumber,
        deliveryAgent: deliveryAgent || "", 
        discount: discountAmount,
        promoCode: promoCode || "",
        isTaxEnabled: isTaxEnabled,
        paymentMethod: paymentMethod.toUpperCase(),
        currency: currency,
        amountReceived: amountReceived,
        changeAmount: changeAmount,
        items: billingItems.map(i => ({
          productId: i.productId,
          name: i.name,
          price: i.price,
          qty: i.qty,
          notes: i.notes,
          customization: i.customization
        }))
      };

      const tempOrderId = `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      let finalOrderForReceipt: any = null;

      try {
        if (!navigator.onLine) throw new Error("Offline");

        isSyncingRef.current = true;
        
        const res = await createPosOrder(orderPayload);
        
        if (res?.success && res.order) {
          finalOrderForReceipt = res.order;
        } else {
          alert("Server rejected order: " + (res?.error || "Unknown error"));
          isCheckoutLocked.current = false;
          setIsSavingOrder(false);
          isSyncingRef.current = false;
          return;
        }
      } catch (err) {
        console.warn("Network offline or error, saving to local queue:", err);
        
        const offlineRecord: OfflineOrder = {
          id: tempOrderId,
          payload: orderPayload,
          status: 'pending',
          createdAt: Date.now()
        };
        
        await saveOfflineOrder(offlineRecord);
        await checkPendingOrders(); 

        // Update the mock order for printing with the new values
        finalOrderForReceipt = {
          id: tempOrderId,
          shopId: shopId,
          orderType: orderPayload.orderType,
          tableNumber: orderPayload.tableNumber,
          deliveryAgent: orderPayload.deliveryAgent,
          subtotal: subtotal,
          discount: discountAmount,
          promoCode: orderPayload.promoCode,
          tax: tax,
          total: total,
          paymentMethod: orderPayload.paymentMethod,
          currency: orderPayload.currency,
          amountReceived: orderPayload.amountReceived,
          changeAmount: orderPayload.changeAmount,
          status: 'COMPLETED',
          isPaid: true,
          createdAt: new Date(),
          items: billingItems,
          isOffline: true 
        };
      } finally {
        isSyncingRef.current = false;
      }

      setLatestOrder(finalOrderForReceipt);
      setBillingItems([]);
      setTableNumber("");
      setIsMobileCartOpen(false);

      setTimeout(() => {
        window.print();
        setTimeout(() => setLatestOrder(null), 1000); 
        if (finalOrderForReceipt && !finalOrderForReceipt.isOffline) {
          router.refresh();
        }
      }, 500);

    } finally {
      isCheckoutLocked.current = false;
      setIsSavingOrder(false);
    }
  };

  return (
    <div className="flex flex-row h-full w-full bg-[#F9FAFB] relative min-w-0">
      
      {/* INVISIBLE RECEIPT FOR PRINTING */}
      {latestOrder && (
        <>
          <style>{`
          @media print {
            @page { 
              margin: 0 !important; 
              padding: 0 !important;
            }
            html, body, #__next, main {
              background: white !important;
              height: max-content !important; 
              min-height: 0 !important;
              margin: 0 !important;
              padding: 0 !important;
              overflow: hidden !important;
            }
            aside, header, nav, #pos-left-pane, #pos-right-pane, #pos-mobile-fab, .md\\:hidden { 
              display: none !important; 
            }
            #pos-receipt-print-area, #dashboard-receipt-print-area { 
              display: block !important; 
              position: relative !important; 
              width: 57mm !important; 
              margin: 0 auto !important; 
              padding: 0 !important; 
              page-break-after: always;
            }
          }
        `}</style>
          <div id="pos-receipt-print-area" className="hidden print:block bg-white z-[99999]">
             <PosReceipt order={latestOrder} shopName={shopName} />
          </div>
        </>
      )}

      {/* POPUP MODAL */}
      {selectedModalProduct && (
        <PosCustomizationModal 
          product={selectedModalProduct} 
          onClose={() => setSelectedModalProduct(null)} 
          onAdd={handleAddToBilling} 
        />
      )}
      
      {/* LEFT PANE: MENU */}
      <div id="pos-left-pane" className={`flex-1 flex flex-col h-full overflow-hidden p-4 md:p-6 print:hidden pb-28 md:pb-6 min-w-0 ${isMobileCartOpen ? 'hidden md:flex' : 'flex'}`}>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-5 gap-3 shrink-0 min-w-0">
          <div className="flex items-center gap-4 min-w-0">
            <h1 className="text-2xl font-bold text-gray-900 truncate" style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}>
              Select Products
            </h1>
            
            {/* OFFLINE SYNC INDICATOR */}
            {pendingSyncCount > 0 && (
              <div 
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0 ${isSyncing ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700 hover:bg-orange-200'}`}
                onClick={syncPendingOrders}
                title="Click to force sync"
              >
                {isSyncing ? <RefreshCcw size={14} className="animate-spin" /> : <CloudOff size={14} />}
                <span className="hidden sm:inline-block">{pendingSyncCount} pending sync</span>
                <span className="sm:hidden">{pendingSyncCount}</span>
              </div>
            )}
          </div>

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

        <div className="flex gap-2 mb-4 overflow-x-auto pb-2 shrink-0 no-scrollbar [&::-webkit-scrollbar]:hidden min-w-0" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
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

        <div className="flex-1 overflow-y-auto no-scrollbar [&::-webkit-scrollbar]:hidden pb-12 min-w-0" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          <div className="flex items-center justify-between mb-4 min-w-0">
            <h2 className="font-bold text-gray-900 truncate" style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}>
              {categories.find((c) => String(c.id) === activeCategory)?.label || "All"} Menu
            </h2>
            <p className="text-xs font-semibold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-lg shrink-0">
              {menuLoading ? "Loading..." : `${filteredProducts.length} Items`}
            </p>
          </div>

          {menuLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 min-w-0">
              {Array.from({ length: 8 }).map((_, i) => <PosProductCardSkeleton key={i} />)}
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 min-w-0">
              {filteredProducts.map((product) => (
                <PosProductCard key={product.id} product={product}  onClick={(p) => setSelectedModalProduct(p)} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm py-12 min-w-0">
              <EmptyState
                illustration={<SearchEmptySVG />}
                heading={searchQuery ? "No results found" : "No items in this category"}
                subtext={searchQuery ? `No menu items match "${searchQuery}". Try a different search term.` : "There are no products available in this category right now."}
                action={searchQuery ? { label: "Clear Search", onClick: () => setSearchQuery("") } : undefined}
              />
            </div>
          )}
        </div>
      </div>

      {/* MOBILE VIEW CART FAB */}
      {!isMobileCartOpen && (
        <div id="pos-mobile-fab" className="md:hidden fixed bottom-6 left-0 w-full px-4 z-40 print:hidden animate-in slide-in-from-bottom-10 min-w-0">
          <button 
            onClick={() => setIsMobileCartOpen(true)}
            className="w-full bg-gray-900 text-white shadow-2xl rounded-2xl p-4 flex items-center justify-between active:scale-[0.98] transition-all min-w-0"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative flex items-center justify-center bg-gray-800 p-2 rounded-xl shrink-0">
                <ShoppingCart size={20} />
                {billingItems.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-gray-900">
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

      {/* RIGHT PANE: CART & ORDER CONFIG */}
      <div id="pos-right-pane" className={`fixed inset-0 z-[60] md:static w-full md:w-[360px] lg:w-[400px] shrink-0 border-l border-gray-200 bg-white flex-col h-full print:hidden shadow-[-4px_0_15px_-3px_rgba(0,0,0,0.05)] transition-transform duration-300 min-w-0 ${isMobileCartOpen ? 'flex' : 'hidden md:flex'}`}>
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
          isTableModalOpen={isTableModalOpen}
          setIsTableModalOpen={setIsTableModalOpen}
        />
      </div>
    </div>
  );
}