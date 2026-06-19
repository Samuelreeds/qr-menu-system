'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
// FIX: Swapped BellConcierge for Utensils to guarantee compatibility with your lucide-react version
import { CheckCircle, Clock, XCircle, ChefHat, Utensils } from 'lucide-react';

interface OrderStatusProps {
  initialOrder: any;
}

export default function OrderStatusClient({ initialOrder }: OrderStatusProps) {
  const [order, setOrder] = useState(initialOrder);

  useEffect(() => {
    const channel = supabase
      .channel(`order-${order.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'Order', filter: `id=eq.${order.id}` },
        (payload) => {
          setOrder((prev: any) => ({ ...prev, ...payload.new }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [order.id]);

  const getStatusDisplay = () => {
    switch (order.status) {
      case 'PENDING':
        return { icon: <Clock size={40} className="text-orange-500" />, text: 'Pending Review', color: 'bg-orange-50', textCol: 'text-orange-800' };
      case 'ACCEPTED':
        return { icon: <CheckCircle size={40} className="text-green-500" />, text: 'Order Accepted', color: 'bg-green-50', textCol: 'text-green-800' };
      case 'PREPARING':
        return { icon: <ChefHat size={40} className="text-blue-500" />, text: 'Preparing', color: 'bg-blue-50', textCol: 'text-blue-800' };
      case 'READY':
        return { icon: <Utensils size={40} className="text-purple-500" />, text: 'Ready', color: 'bg-purple-50', textCol: 'text-purple-800' };
      case 'REJECTED':
        return { icon: <XCircle size={40} className="text-red-500" />, text: 'Order Rejected', color: 'bg-red-50', textCol: 'text-red-800' };
      default:
        return { icon: <CheckCircle size={40} className="text-gray-500" />, text: order.status, color: 'bg-gray-50', textCol: 'text-gray-800' };
    }
  };

  const statusInfo = getStatusDisplay();

  return (
    <div className="max-w-md mx-auto p-6 space-y-6">
      <h2 className="text-xl font-bold text-center">Order {order.orderNumber}</h2>
      
      <div className={`flex flex-col items-center justify-center p-8 rounded-3xl ${statusInfo.color} ${statusInfo.textCol} transition-colors duration-500`}>
        <div className="mb-4">{statusInfo.icon}</div>
        <h3 className="text-2xl font-black">{statusInfo.text}</h3>
        {order.status === 'REJECTED' && order.rejectionReason && (
          <p className="mt-2 text-sm font-semibold text-red-600 text-center">Reason: {order.rejectionReason}</p>
        )}
      </div>

      <div className="bg-gray-50 p-4 rounded-xl space-y-2">
        {order.items?.map((item: any) => (
          <div key={item.id} className="flex justify-between text-sm">
            <span>{item.quantity}x {item.name}</span>
            <span className="font-bold">${(item.price * item.quantity).toFixed(2)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}