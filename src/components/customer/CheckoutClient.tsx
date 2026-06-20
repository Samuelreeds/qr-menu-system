// src/components/customer/CheckoutClient.tsx
'use client';

import { useState } from 'react';
import { useCart } from '@/context/CartContext';
import { useRouter } from 'next/navigation';
import { placeCustomerOrder } from '@/lib/customer-actions';
import { sendNewOrderNotification } from '@/lib/staff-actions';
import { Loader2, CheckCircle, ChevronLeft, Receipt } from 'lucide-react';

export default function CheckoutClient({ 
  shopId, 
  shopSlug, 
  shopName, 
  tableLabel,
  tableId 
}: { 
  shopId: string, 
  shopSlug: string, 
  shopName: string, 
  tableLabel: string,
  tableId: string 
}) {
  const { items, totalPrice, clearCart } = useCart();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successOrder, setSuccessOrder] = useState<any>(null);

  const handlePlaceOrder = async () => {
    setIsSubmitting(true);
    setError('');

    const res = await placeCustomerOrder({
      shopId,
      tableNumber: tableLabel,
      total: totalPrice,
      items
    });

    const response = res as any;

    if (response.success && response.order) {
      const successOrder = response.order;
      const itemsSummary = items.map(i => `${i.quantity}x ${i.name}`).join('\n');
      
      await sendNewOrderNotification(shopId, shopName, tableLabel, successOrder.orderNumber || 'Pending', totalPrice, itemsSummary);
      
      clearCart();
      setSuccessOrder(successOrder);
      setIsSubmitting(false);
    } else {
      setError(response.error || 'Checkout failed');
      setIsSubmitting(false);
    }
  };

  // SUCCESS STATE UI
  if (successOrder) {
    return (
      <div className="max-w-md mx-auto p-6 flex flex-col items-center justify-center min-h-[60vh] animate-in fade-in zoom-in-95 duration-500">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
          <CheckCircle size={40} className="text-green-500" />
        </div>
        <h2 className="text-3xl font-black text-gray-900 mb-2">Order Sent!</h2>
        <p className="text-gray-500 font-medium mb-8">The kitchen has received your order.</p>

        <div className="w-full bg-gray-50 rounded-2xl p-5 mb-8 border border-gray-100">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-500 text-sm font-bold">Order Number</span>
            <span className="text-gray-900 font-black">{successOrder.orderNumber}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-500 text-sm font-bold">Amount</span>
            <span className="text-gray-900 font-black">${successOrder.total.toFixed(2)}</span>
          </div>
        </div>

        <div className="w-full space-y-3">
          <button 
            onClick={() => router.push(`/${shopSlug}?tableId=${tableId}&openOrders=true`)}
            className="w-full bg-gray-900 text-white font-bold py-4 rounded-xl active:scale-95 transition-transform flex justify-center items-center gap-2"
          >
            <Receipt size={18} /> View My Orders
          </button>
          <button 
            onClick={() => router.push(`/${shopSlug}?tableId=${tableId}`)}
            className="w-full bg-white border-2 border-gray-200 text-gray-900 font-bold py-4 rounded-xl hover:bg-gray-50 active:scale-95 transition-transform flex justify-center items-center gap-2"
          >
            <ChevronLeft size={18} /> Continue Ordering
          </button>
        </div>
      </div>
    );
  }

  if (items.length === 0) return <div className="p-8 text-center font-bold text-gray-500">Your cart is empty.</div>;

  return (
    <div className="max-w-md mx-auto p-4 space-y-6 pb-24">
      <h2 className="text-2xl font-bold">Review Order (Table {tableLabel})</h2>
      
      <div className="space-y-4">
        {items.map(item => (
          <div key={item.id} className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center gap-3">
              {item.image && item.image !== '' ? (
                <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden shrink-0 shadow-sm border border-gray-100">
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center shrink-0 border border-gray-100 text-gray-400 text-xs font-bold">
                  N/A
                </div>
              )}
              <div className="flex flex-col">
                <span className="font-medium text-gray-800 line-clamp-2">{item.name}</span>
                <span className="text-xs text-gray-500 font-bold">Qty: {item.quantity}</span>
              </div>
            </div>
            <span className="font-black shrink-0 ml-2">${(item.price * item.quantity).toFixed(2)}</span>
          </div>
        ))}
      </div>

      <div className="flex justify-between items-center text-xl font-black pt-2 border-t border-gray-200">
        <span>Total:</span>
        <span>${totalPrice.toFixed(2)}</span>
      </div>

      {error && <p className="text-red-500 text-sm font-bold text-center bg-red-50 p-3 rounded-lg">{error}</p>}

      <button 
        onClick={handlePlaceOrder} 
        disabled={isSubmitting}
        className="w-full bg-gray-900 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-70 mt-4"
      >
        {isSubmitting ? <Loader2 className="animate-spin" /> : 'Place Order'}
      </button>
    </div>
  );
}