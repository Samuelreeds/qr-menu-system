// src/components/pos/AdminPosSection.tsx
'use client';

import { useState, useEffect } from 'react';
import { ShoppingCart, Search } from 'lucide-react';
import { useOrder } from "@/context/OrderContext";
import EmptyState, { SearchEmptySVG } from "@/components/ui/EmptyState";
import PosReceipt from "@/components/PosReceipt";
import { createPosOrder } from '@/lib/actions';
import { useRouter } from 'next/navigation';

import PosCustomizationModal from './PosCustomizationModal';
import PosProductCard, { PosProductCardSkeleton } from './PosProductCard';
import BillingPanel from './BillingPanel';

// DEFINED LOCALLY TO FIX IMPORT ERRORS
export interface Category { id: string; name: string; name_kh?: string | null; name_zh?: string | null; sortOrder: number; discount?: number; isDrink?: boolean; } 
export interface Product { id: string; name: string; name_kh?: string | null; name_zh?: string | null; price: number; variants?: {id?: string, name: string, price: number}[]; image: string; category: { name: string, discount?: number }; time: string; isPopular?: boolean; isSoldOut?: boolean; discount?: number; description?: string; }

export interface ProductCustomization { mood: string; size: string; sugar: string; ice: string; }
export interface BillingItem { id: string; productId: string; name: string; price: number; qty: number; notes: string; img: string; customization: ProductCustomization; }
export interface PosProduct { id: string; name: string; description: string; price: number; variants?: {id?: string, name: string, price: number}[]; category: string; img: string; isDrink?: boolean; }
export type OrderType = "walk-in" | "table" | "delivery";

const TAX_RATE = 0.1;

export default function AdminPosSection({ dashboardCategories, dashboardProducts, shopId, userEmail, userRole, shopName }: { dashboardCategories: Category[], dashboardProducts: Product[], shopId: string, userEmail?: string, userRole?: string, shopName: string }) {
  const router = useRouter();
  
  const {
    setOrderType: setContextOrderType,
    setTableNumber: setContextTableNumber,
    setDeliveryAgent: setContextDeliveryAgent,
    setDiscount: setContextDiscount,
    setPromoCode: setContextPromoCode,
    addItem: addContextItem,
    removeItem: removeContextItem,
    updateQty: updateContextQty,
    clearDraft,
    draft,
  } = useOrder();

  const [menuLoading, setMenuLoading] = useState(true);
  const [latestOrder, setLatestOrder] = useState<any>(null);
  const [selectedModalProduct, setSelectedModalProduct] = useState<PosProduct | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setMenuLoading(false), 500);
    return () => clearTimeout(timer);
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
        variants: item.variants, // Pass variants to the POS product card
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
          price: finalPrice, // Utilize the selected variant price
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

  const handleProceedToConfirm = async (paymentMethod: string, deliveryAgent: string, promoCode: string, discountType: string, discountValue: string, isTaxEnabled: boolean) => {
    if (billingItems.length === 0) return;
    if (orderType === "table" && !tableNumber) {
      alert("Please select a table number first.");
      return;
    }
    
    setIsSavingOrder(true);
    
    const subtotal = billingItems.reduce((sum, i) => sum + i.price * i.qty, 0);
    const discountNum = parseFloat(discountValue) || 0;
    const discountAmount = discountType === "percent" ? (subtotal * discountNum) / 100 : Math.min(discountNum, subtotal);
    const afterDiscount = subtotal - discountAmount;
    const tax = isTaxEnabled ? (afterDiscount * TAX_RATE) : 0;

    const res = await createPosOrder({
      shopId,
      orderType: orderType.toUpperCase(),
      tableNumber,
      deliveryAgent: deliveryAgent || "", 
      discount: discountAmount,
      promoCode: promoCode || "",
      isTaxEnabled: isTaxEnabled,
      paymentMethod: paymentMethod.toUpperCase(),
      items: billingItems.map(i => ({
        productId: i.productId,
        name: i.name,
        price: i.price,
        qty: i.qty,
        notes: i.notes,
        customization: i.customization
      }))
    });

    setIsSavingOrder(false);

    if (res?.success && res.order) {
      setLatestOrder(res.order);
      setBillingItems([]);
      setTableNumber("");
      setIsMobileCartOpen(false);

      setTimeout(() => {
        window.print();
        setTimeout(() => setLatestOrder(null), 1000); 
        router.refresh();
      }, 500);

    } else {
      alert("Error: " + (res?.error || "Failed to create order"));
    }
  };

  const handleReprintOrder = (orderToPrint: any) => {
    setLatestOrder(orderToPrint);
    setTimeout(() => {
      window.print();
      setTimeout(() => setLatestOrder(null), 1000);
    }, 300);
  };

  return (
    <div className="flex flex-row h-full w-full bg-[#F9FAFB] relative">
      
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
            /* Hide the dashboard completely */
            aside, header, nav, #pos-left-pane, #pos-right-pane, #pos-mobile-fab, .md\\:hidden { 
              display: none !important; 
            }
            /* Position receipt naturally */
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
      
      {/* LEFT PANE: ALWAYS SHOW MENU */}
      <div id="pos-left-pane" className={`flex-1 flex flex-col h-full overflow-hidden p-4 md:p-6 print:hidden pb-28 md:pb-6 ${isMobileCartOpen ? 'hidden md:flex' : 'flex'}`}>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-5 gap-3 shrink-0">
          <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}>
            Select Products
          </h1>
          <div className="relative w-full sm:w-72 shrink-0">
            <input
              type="text"
              placeholder="Search category or menu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-gray-200 shadow-sm text-sm outline-none focus:border-gray-900 transition-colors"
            />
            <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>
        </div>

        <div className="flex gap-2 mb-4 overflow-x-auto pb-2 shrink-0 no-scrollbar [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
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

        <div className="flex-1 overflow-y-auto no-scrollbar [&::-webkit-scrollbar]:hidden pb-12" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900" style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}>
              {categories.find((c) => String(c.id) === activeCategory)?.label || "All"} Menu
            </h2>
            <p className="text-xs font-semibold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-lg">
              {menuLoading ? "Loading..." : `${filteredProducts.length} Items`}
            </p>
          </div>

          {menuLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
              {Array.from({ length: 10 }).map((_, i) => <PosProductCardSkeleton key={i} />)}
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
              {filteredProducts.map((product) => (
                <PosProductCard key={product.id} product={product}  onClick={(p) => setSelectedModalProduct(p)} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm py-12">
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
        <div id="pos-mobile-fab" className="md:hidden fixed bottom-6 left-0 w-full px-4 z-40 print:hidden animate-in slide-in-from-bottom-10">
          <button 
            onClick={() => setIsMobileCartOpen(true)}
            className="w-full bg-gray-900 text-white shadow-2xl rounded-2xl p-4 flex items-center justify-between active:scale-[0.98] transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="relative flex items-center justify-center bg-gray-800 p-2 rounded-xl">
                <ShoppingCart size={20} />
                {billingItems.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-gray-900">
                    {billingItems.reduce((acc, item) => acc + item.qty, 0)}
                  </span>
                )}
              </div>
              <span className="font-bold text-sm">View Cart</span>
            </div>
            <span className="font-black text-lg">
              ${(billingItems.reduce((acc, item) => acc + item.price * item.qty, 0)).toFixed(2)}
            </span>
          </button>
        </div>
      )}

      {/* RIGHT PANE: CART & ORDER CONFIG */}
      <div id="pos-right-pane" className={`fixed inset-0 z-[60] md:static w-full md:w-[360px] shrink-0 border-l border-gray-200 bg-white flex-col h-full print:hidden shadow-[-4px_0_15px_-3px_rgba(0,0,0,0.05)] transition-transform duration-300 ${isMobileCartOpen ? 'flex' : 'hidden md:flex'}`}>
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