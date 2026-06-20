'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';
import { updateKitchenOrderStatus } from '@/lib/kitchen-actions';
import { ChefHat, CheckCircle, Clock, UtensilsCrossed, AlertCircle } from 'lucide-react';

interface KitchenOrder {
  id: string;
  orderNumber: string;
  tableNumber: string;
  status: string;
  createdAt: string;
  items: {
    id: string;
    name: string;
    quantity: number;
    notes?: string | null;
    customization?: any;
  }[];
}

interface KitchenDisplayProps {
  shopId: string;
  initialOrders: KitchenOrder[];
}

export default function KitchenDisplayClient({ shopId, initialOrders }: KitchenDisplayProps) {
  // Only keep orders that need kitchen attention
  const [orders, setOrders] = useState<KitchenOrder[]>(
    initialOrders.filter(o => ['ACCEPTED', 'PREPARING'].includes(o.status))
  );
  
  const [processingId, setProcessingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize notification sound
  useEffect(() => {
    // A standard short beep for new orders. 
    // You can replace this src with any local sound file like '/sounds/new-order.mp3'
    audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
  }, []);

  // --- UPDATED REALTIME SUBSCRIPTION ---
  useEffect(() => {
    const channel = supabase
      .channel('kitchen-queue')
      .on(
        'postgres_changes', 
        { 
          event: '*', // Listen for BOTH Insert and Update
          schema: 'public', 
          table: 'Order', 
          // filter: `shopId=eq.${shopId}` 
        }, 
        (payload) => {
          console.log("DEBUG: Realtime event triggered!", payload);
          
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const orderData = payload.new as KitchenOrder;

            // Only care about orders that are ACCEPTED or PREPARING
            if (['ACCEPTED', 'PREPARING'].includes(orderData.status)) {
              
              setOrders(prev => {
                const exists = prev.find(o => o.id === orderData.id);
                
                // If it's a new order (INSERT) or we didn't have it in the list (UPDATE to Accepted)
                if (!exists) {
                  // Play sound only if it's a new order (INSERT)
                  if (payload.eventType === 'INSERT') {
                     audioRef.current?.play().catch(e => console.log("Audio blocked:", e));
                  }
                  return [...prev, orderData];
                }
                
                // Otherwise update the status
                return prev.map(o => o.id === orderData.id ? { ...o, ...orderData } : o);
              });
            } else {
              // If status moved to READY/COMPLETED, remove from board
              setOrders(prev => prev.filter(o => o.id !== orderData.id));
            }
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [shopId]);

  const handleStatusChange = async (orderId: string, newStatus: 'PREPARING' | 'READY') => {
    setProcessingId(orderId);
    
    // Optimistic UI update
    if (newStatus === 'READY') {
      setOrders(prev => prev.filter(o => o.id !== orderId));
    } else {
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    }

    const res = await updateKitchenOrderStatus(orderId, newStatus);
    
    if (!res.success) {
      // Revert on failure (triggering a reload is safest to ensure sync)
      window.location.reload();
    }
    
    setProcessingId(null);
  };

  // Group orders visually by Table
  const groupedOrders = orders.reduce((acc, order) => {
    const table = order.tableNumber || "Takeaway";
    if (!acc[table]) acc[table] = [];
    acc[table].push(order);
    return acc;
  }, {} as Record<string, KitchenOrder[]>);

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] text-gray-400 bg-gray-50">
        <ChefHat size={80} className="mb-6 opacity-20" />
        <h2 className="text-2xl font-black text-gray-300">Kitchen is all caught up!</h2>
        <p className="text-gray-400 mt-2">Waiting for new orders...</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 bg-gray-100 min-h-screen overflow-x-hidden">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 flex items-center gap-3">
          <UtensilsCrossed className="text-orange-500" size={32} />
          Kitchen Display
        </h1>
        <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-200 font-bold text-gray-700 flex items-center gap-2">
          <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
          Live Sync
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 items-start">
        {Object.entries(groupedOrders).map(([table, tableOrders]) => (
          <div key={table} className="space-y-4">
            
            {/* Table Header Grouping */}
            <div className="bg-gray-900 text-white p-3 rounded-2xl shadow-lg flex justify-between items-center sticky top-4 z-10">
              <span className="font-black text-xl tracking-wide px-2">Table {table}</span>
              <span className="bg-gray-800 text-gray-300 text-xs font-bold px-3 py-1.5 rounded-lg">
                {tableOrders.length} Order{tableOrders.length > 1 ? 's' : ''}
              </span>
            </div>

            {/* Orders for this Table */}
            {tableOrders.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()).map(order => {
              const elapsedMinutes = Math.floor((new Date().getTime() - new Date(order.createdAt).getTime()) / 60000);
              const isOverdue = elapsedMinutes > 15; // Flag orders older than 15 mins

              return (
                <div 
                  key={order.id} 
                  className={`bg-white rounded-[24px] shadow-sm border-2 flex flex-col overflow-hidden transition-all duration-300 ${
                    order.status === 'PREPARING' ? 'border-blue-400 shadow-blue-100' : 
                    isOverdue ? 'border-red-400 shadow-red-100 animate-in zoom-in-95' : 
                    'border-gray-200'
                  }`}
                >
                  {/* Order Header */}
                  <div className={`p-4 border-b flex justify-between items-start ${
                    order.status === 'PREPARING' ? 'bg-blue-50/50 border-blue-100' : 
                    isOverdue ? 'bg-red-50/50 border-red-100' : 'bg-gray-50/50 border-gray-100'
                  }`}>
                    <div>
                      <span className="font-black text-lg text-gray-900 block">{order.orderNumber}</span>
                      <div className="flex items-center gap-1.5 mt-1">
                        <Clock size={14} className={isOverdue ? 'text-red-500' : 'text-gray-500'} />
                        <span className={`text-sm font-bold ${isOverdue ? 'text-red-600' : 'text-gray-500'}`}>
                          {elapsedMinutes} min ago
                        </span>
                      </div>
                    </div>
                    <span className={`text-xs font-black uppercase px-3 py-1.5 rounded-xl flex items-center gap-1.5 ${
                      order.status === 'PREPARING' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'
                    }`}>
                      {order.status === 'PREPARING' && <ChefHat size={14} />}
                      {order.status}
                    </span>
                  </div>

                  {/* Order Items */}
                  <div className="p-4 flex-1">
                    <ul className="space-y-4">
                      {order.items.map((item, idx) => (
                        <li key={idx} className="flex gap-3 items-start">
                          <div className="bg-gray-100 text-gray-900 font-black px-3 py-1 rounded-lg text-lg min-w-[3rem] text-center">
                            x{item.quantity}
                          </div>
                          <div className="flex-1 pt-1">
                            <span className="font-bold text-gray-900 text-lg leading-tight block">{item.name}</span>
                            
                            {/* Render Customizations / Notes */}
                            {(item.notes || item.customization) && (
                              <div className="mt-2 bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm font-semibold p-2.5 rounded-xl flex items-start gap-2">
                                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                                <div className="leading-snug">
                                  {item.customization && typeof item.customization === 'object' && (
                                    <div className="mb-1">
                                      {Object.entries(item.customization).map(([key, val]) => (
                                        <span key={key} className="block">• {key}: {String(val)}</span>
                                      ))}
                                    </div>
                                  )}
                                  {item.notes && <span>• Note: {item.notes}</span>}
                                </div>
                              </div>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Action Buttons */}
                  <div className="p-3 bg-gray-50 border-t border-gray-100">
                    {order.status === 'ACCEPTED' ? (
                      <button 
                        onClick={() => handleStatusChange(order.id, 'PREPARING')}
                        disabled={processingId === order.id}
                        className="w-full bg-blue-500 hover:bg-blue-600 active:scale-95 text-white font-black py-4 rounded-xl text-lg transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                      >
                        <ChefHat size={22} /> Start Preparing
                      </button>
                    ) : (
                      <button 
                        onClick={() => handleStatusChange(order.id, 'READY')}
                        disabled={processingId === order.id}
                        className="w-full bg-green-500 hover:bg-green-600 active:scale-95 text-white font-black py-4 rounded-xl text-lg transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                      >
                        <CheckCircle size={22} /> Mark Ready to Serve
                      </button>
                    )}
                  </div>
                  
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}