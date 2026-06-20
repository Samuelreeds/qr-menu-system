'use client';

import { useState, useEffect } from 'react';
import { X, Receipt, CheckCircle, Clock, Utensils, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { requestBill } from '@/lib/session-actions';

interface MyOrdersDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  shopId: string;
  tableSessionId: string;
  initialOrders: any[];
  themeColor: string;
}

export default function MyOrdersDrawer({ isOpen, onClose, shopId, tableSessionId, initialOrders, themeColor }: MyOrdersDrawerProps) {
  const [orders, setOrders] = useState<any[]>(initialOrders || []);
  const [isRequesting, setIsRequesting] = useState(false);
  const [billRequested, setBillRequested] = useState(false);

  useEffect(() => {
    if (!tableSessionId) return;
    
    const channel = supabase
      .channel(`session-${tableSessionId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'Order', filter: `tableSessionId=eq.${tableSessionId}` },
        (payload: any) => {
          if (payload.eventType === 'INSERT') {
            setOrders(prev => [payload.new, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setOrders(prev => prev.map(o => o.id === payload.new.id ? { ...o, ...payload.new } : o));
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [tableSessionId]);

  if (!isOpen) return null;

  const validOrders = orders.filter(o => o.status !== 'REJECTED' && o.status !== 'CANCELLED');
  const runningTotal = validOrders.reduce((sum, o) => sum + (o.total || 0), 0);

  const handleRequestBill = async () => {
    setIsRequesting(true);
    const res = await requestBill(tableSessionId);
    if (res.success) {
      setBillRequested(true);
    } else {
      alert("Failed to request bill.");
    }
    setIsRequesting(false);
  };

  return (
    <div className="fixed inset-0 z-[120] flex justify-center items-end bg-black/60 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose}>
      <div 
        // INCREASED WIDTH HERE: sm:max-w-lg
        className="bg-white w-full sm:max-w-lg h-[85vh] sm:h-auto sm:max-h-[85vh] rounded-t-[32px] sm:rounded-[32px] flex flex-col shadow-2xl animate-in slide-in-from-bottom-full sm:zoom-in-95 duration-300"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-4 flex items-center justify-between border-b border-gray-100 shrink-0">
          <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
            <Receipt size={24} style={{ color: themeColor }} />
            My Orders
          </h2>
          <button onClick={onClose} className="p-2 bg-gray-100 rounded-full active:scale-95"><X size={20} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
          {orders.length === 0 ? (
            <div className="text-center text-gray-400 font-bold py-10">No orders placed yet.</div>
          ) : (
            orders.map(order => (
              <div key={order.id} className="bg-gray-50 border border-gray-100 rounded-2xl p-4 shadow-sm">
                <div className="flex justify-between items-center mb-3 pb-3 border-b border-gray-200/60">
                  <span className="font-bold text-sm text-gray-500">{order.orderNumber}</span>
                  <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-md ${order.status === 'PENDING' ? 'bg-orange-100 text-orange-700' : order.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                    {order.status}
                  </span>
                </div>
                
                {/* UPDATED ITEMS LIST WITH IMAGES */}
                <div className="space-y-3 mb-3">
                  {order.items ? order.items.map((item: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-3">
                      {item.product?.image ? (
                        <div className="w-12 h-12 bg-white rounded-lg overflow-hidden shrink-0 shadow-sm border border-gray-100">
                          <img src={item.product.image} alt={item.name} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shrink-0 border border-gray-100 text-gray-400 text-[10px] font-bold">
                          N/A
                        </div>
                      )}
                      <div className="flex flex-col flex-1">
                        <span className="font-medium text-sm text-gray-800 line-clamp-1">{item.name}</span>
                        <span className="text-xs text-gray-500 font-bold">Qty: {item.quantity}</span>
                      </div>
                      <span className="font-black text-sm text-gray-900 shrink-0">
                        ${(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  )) : (
                    <div className="text-sm text-gray-500 italic">Items loading...</div>
                  )}
                </div>

                <div className="text-right font-black text-gray-900 pt-3 border-t border-gray-200/60">
                  Total: ${order.total?.toFixed(2)}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-5 border-t border-gray-100 shrink-0 bg-white sm:rounded-b-[32px]">
          <div className="flex justify-between items-center mb-4">
            <span className="text-gray-500 font-bold">Session Total</span>
            <span className="text-3xl font-black" style={{ color: themeColor }}>${runningTotal.toFixed(2)}</span>
          </div>
          
          <button 
            onClick={handleRequestBill}
            disabled={billRequested || isRequesting || runningTotal === 0}
            className={`w-full py-4 rounded-xl font-bold flex justify-center items-center gap-2 transition-all active:scale-95 ${
              billRequested || runningTotal === 0
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gray-900 text-white hover:bg-black shadow-lg'
            }`}
          >
            {isRequesting ? <Loader2 className="animate-spin" /> : billRequested ? <><CheckCircle /> Bill Requested</> : <><Receipt /> Request Final Bill</>}
          </button>
        </div>
      </div>
    </div>
  );
}