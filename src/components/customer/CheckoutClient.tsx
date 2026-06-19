'use client';

import { useState } from 'react';
import { useCart } from '@/context/CartContext';
import { useRouter } from 'next/navigation';
import { placeCustomerOrder } from '@/lib/customer-actions';
import { sendNewOrderNotification } from '@/lib/staff-actions';
import { Loader2 } from 'lucide-react';

export default function CheckoutClient({ shopId, shopSlug, shopName, tableLabel }: { shopId: string, shopSlug: string, shopName: string, tableLabel: string }) {
  const { items, totalPrice, clearCart } = useCart();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handlePlaceOrder = async () => {
    setIsSubmitting(true);
    setError('');

    const res = await placeCustomerOrder({
      shopId,
      tableNumber: tableLabel,
      total: totalPrice,
      items
    });

    if (res.success && res.order) {
      const itemsSummary = items.map(i => `${i.quantity}x ${i.name}`).join('\n');
      
      // FIX: Added fallback for orderNumber to satisfy strict TS check
      await sendNewOrderNotification(shopId, shopName, tableLabel, res.order.orderNumber || 'Pending', totalPrice, itemsSummary);
      
      clearCart();
      router.push(`/${shopSlug}/order/${res.order.id}`);
    } else {
      setError(res.error || 'Checkout failed');
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) return <div className="p-8 text-center">Your cart is empty.</div>;

  return (
    <div className="max-w-md mx-auto p-4 space-y-6">
      <h2 className="text-2xl font-bold">Review Order (Table {tableLabel})</h2>
      
      <div className="space-y-4">
        {items.map(item => (
          <div key={item.id} className="flex justify-between border-b pb-2">
            <span>{item.quantity}x {item.name}</span>
            <span className="font-bold">${(item.price * item.quantity).toFixed(2)}</span>
          </div>
        ))}
      </div>

      <div className="flex justify-between items-center text-xl font-black pt-4 border-t">
        <span>Total:</span>
        <span>${totalPrice.toFixed(2)}</span>
      </div>

      {error && <p className="text-red-500 text-sm font-bold text-center">{error}</p>}

      <button 
        onClick={handlePlaceOrder} 
        disabled={isSubmitting}
        className="w-full bg-gray-900 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-70"
      >
        {isSubmitting ? <Loader2 className="animate-spin" /> : 'Place Order'}
      </button>
    </div>
  );
}