// src/features/admin/tabs/OrdersTab.tsx
import React from 'react';
import { ClipboardList } from 'lucide-react';
import OrderHistoryCard from "@/features/pos/OrderHistoryCard";

interface OrdersTabProps {
  orders: any[];
  orderFilter: string;
  setOrderFilter: (filter: string) => void;
  settingsName: string;
  printerUrl: string;
}

export default function OrdersTab({
  orders,
  orderFilter,
  setOrderFilter,
  settingsName,
  printerUrl
}: OrdersTabProps) {
  const filteredOrders = orders?.filter(o => {
    if (orderFilter === 'Completed') return o.status !== 'CANCELLED';
    if (orderFilter === 'Cancelled') return o.status === 'CANCELLED';
    if (orderFilter === 'Today') {
      const today = new Date().toDateString();
      return new Date(o.createdAt).toDateString() === today;
    }
    return true; 
  }) || [];

  return (
    <>
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Order History</h2>
          <p className="text-sm text-gray-500 mt-1">Review past transactions generated from the POS.</p>
        </div>
        
        <div className="flex bg-gray-100 p-1 rounded-xl shrink-0 w-full sm:w-auto overflow-x-auto no-scrollbar [-webkit-overflow-scrolling:touch]">
          {['All', 'Today', 'Completed', 'Cancelled'].map(f => (
            <button 
              key={f} 
              onClick={() => setOrderFilter(f)} 
              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${orderFilter === f ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {f}
            </button>
          ))}
        </div>
      </header>

      <div className="space-y-4">
        {filteredOrders.map((order) => (
          <OrderHistoryCard 
            key={order.id} 
            order={order} 
            shopName={settingsName} 
            printerUrl={printerUrl} 
          />
        ))}
        
        {filteredOrders.length === 0 && (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm py-16 text-center">
            <ClipboardList size={32} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">No orders match this filter.</p>
          </div>
        )}
      </div>
    </>
  );
}