// src/components/pos/OrderHistoryCard.tsx
import { useState } from 'react';
import { ShoppingCart, ChevronDown, Image as ImageIcon, Banknote, CreditCard } from 'lucide-react';

export default function OrderHistoryCard({ order }: { order: any }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const itemSummary = order.items?.map((i: any) => `${i.name} ×${i.quantity}`).join(', ') || 'No items';

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md">
      <div className="p-4 flex items-center justify-between cursor-pointer active:bg-gray-50/50" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex items-center gap-4 flex-1 min-w-0 pr-4">
          <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0 shadow-inner"><ShoppingCart size={16} className="text-gray-400" /></div>
          <div className="flex flex-col min-w-0"><div className="flex items-center gap-2 mb-0.5"><span className="font-black text-sm text-gray-900">#ORD-{order.id.slice(-4).toUpperCase()}</span><span className="bg-green-50 text-green-600 border border-green-100 text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md tracking-wider">Completed</span></div><p className="text-xs text-gray-400 font-medium truncate w-full max-w-[250px] sm:max-w-md">{itemSummary}</p></div>
        </div>
        <div className="flex items-center gap-6 shrink-0">
          <div className="hidden sm:flex flex-col items-end"><span className="font-black text-sm text-gray-900">${order.total.toFixed(2)}</span><div className="flex items-center gap-1 text-[10px] text-gray-400 font-medium mt-0.5">{order.paymentMethod === 'CASH' ? <Banknote size={10}/> : <CreditCard size={10}/>}{order.paymentMethod}</div></div>
          <div className="text-right"><p className="text-xs font-semibold text-gray-700 sm:hidden mb-0.5">${order.total.toFixed(2)}</p><p className="text-[10px] text-gray-400 font-medium whitespace-nowrap">{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p></div>
          <button className="text-gray-400 hover:text-gray-900 transition-transform duration-200" style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}><ChevronDown size={18} /></button>
        </div>
      </div>
      {isExpanded && (
        <div className="border-t border-gray-50 bg-gray-50/30 p-4 sm:p-6 animate-in slide-in-from-top-2 fade-in duration-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-4 px-1">Items</p>
              <div className="space-y-3">
                {order.items?.map((item: any, idx: number) => (
                  <div key={idx} className="flex items-start gap-3 bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-50 shrink-0 border border-gray-50"><div className="w-full h-full flex items-center justify-center"><ImageIcon size={14} className="text-gray-300" /></div></div>
                    <div className="flex-1 min-w-0 pt-0.5">
                      <p className="text-xs font-bold text-gray-900 leading-tight pr-2">{item.name} <span className="text-gray-400 font-medium">×{item.quantity}</span></p>
                      {item.customization && (
                        <p className="text-[10px] text-gray-500 mt-1">
                          {item.customization.size} {item.customization.mood && `, ${item.customization.mood}`} {item.customization.sugar && `, ${item.customization.sugar} sugar`} {item.customization.ice && `, ${item.customization.ice} ice`}
                          {item.notes && <><br/><span className="italic">Note: {item.notes}</span></>}
                        </p>
                      )}
                    </div>
                    <span className="text-xs font-bold text-gray-900 pt-0.5">${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 h-fit">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-4">Summary</p>
              <div className="space-y-2.5 mb-4">
                <div className="flex justify-between text-xs"><span className="text-gray-500 font-medium">Subtotal</span><span className="font-bold text-gray-900">${order.subtotal.toFixed(2)}</span></div>
                {order.discount > 0 && <div className="flex justify-between text-xs"><span className="text-gray-500 font-medium">Discount</span><span className="font-bold text-gray-900">-${order.discount.toFixed(2)}</span></div>}
                <div className="flex justify-between text-xs"><span className="text-gray-500 font-medium">Tax</span><span className="font-bold text-gray-900">${order.tax.toFixed(2)}</span></div>
              </div>
              <div className="flex justify-between items-end pt-4 border-t border-gray-100 mb-6"><span className="font-black text-sm text-gray-900 uppercase">Total</span><span className="font-black text-xl text-gray-900">${order.total.toFixed(2)}</span></div>
              <div className="space-y-2 pt-4 border-t border-gray-50">
                <div className="flex justify-between text-[10px]"><span className="text-gray-400 font-medium">Order Type</span><span className="font-bold text-gray-700 capitalize">{order.orderType.toLowerCase()} {order.tableNumber ? `(${order.tableNumber})` : ''}</span></div>
                <div className="flex justify-between text-[10px]"><span className="text-gray-400 font-medium">Payment</span><span className="font-bold text-gray-700 capitalize">{order.paymentMethod.toLowerCase()}</span></div>
                <div className="flex justify-between text-[10px]"><span className="text-gray-400 font-medium">Date</span><span className="font-bold text-gray-700">{new Date(order.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}