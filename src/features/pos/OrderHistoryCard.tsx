// src/components/pos/OrderHistoryCard.tsx
'use client';

import { useState, useTransition } from 'react';
import { ShoppingCart, ChevronDown, Image as ImageIcon, Banknote, CreditCard, Trash2, XCircle, AlertTriangle, Printer } from 'lucide-react';
import { deleteOrder, updateOrderStatus } from '@/lib/actions';

const EXCHANGE_RATE = 4000;

// --- DYNAMIC TOTAL RECALCULATION ---
function getCorrectedOrderTotals(order: any) {
  let baseSubtotal = 0;
  let toppingsTotal = 0;

  order.items?.forEach((item: any) => {
    const qty = Number(item.quantity || item.qty || 1);
    const itemPrice = Number(item.price) || 0;
    
    const toppingsArray = item.toppings || item.customization?.toppings || [];
    const itemToppingsPrice = toppingsArray.reduce((sum: number, t: any) => sum + (Number(t.price) || 0), 0);
    
    baseSubtotal += itemPrice * qty;
    toppingsTotal += itemToppingsPrice * qty;
  });

  const combinedSubtotal = baseSubtotal + toppingsTotal;
  const discount = Number(order.discount) || 0;
  const taxRate = order.tax > 0 ? 0.10 : 0; 
  const tax = (combinedSubtotal - discount) * taxRate;
  const total = combinedSubtotal - discount + tax;

  return { baseSubtotal, toppingsTotal, combinedSubtotal, discount, tax, total };
}

// --- RECEIPT GENERATOR ---
function generateReceiptText(order: any, shopName: string): string {
  const MAX_LEN = 32;
  const padRight = (str: string, len: number) => str.length > len ? str.substring(0, len) : str.padEnd(len, ' ');
  const padLeft = (str: string, len: number) => str.length > len ? str.substring(0, len) : str.padStart(len, ' ');
  const center = (str: string, len: number) => {
    if (str.length >= len) return str.substring(0, len);
    const leftPad = Math.floor((len + str.length) / 2);
    return str.padStart(leftPad, ' ').padEnd(len, ' ');
  };

  const totals = getCorrectedOrderTotals(order);

  let text = '\n';
  text += center('** REPRINT **', MAX_LEN) + '\n';
  text += center(shopName.toUpperCase(), MAX_LEN) + '\n';
  text += center('Receipt / Tax Invoice', MAX_LEN) + '\n';
  text += `Date: ${new Date(order.createdAt).toLocaleString()}\n`;
  text += `Order ID: #${(order.orderNumber || order.id).slice(-6).toUpperCase()}\n`;
  
  const orderTypeStr = order.orderType === 'TAKEAWAY' ? 'WALK-IN' : order.orderType;
  const tableStr = order.tableNumber ? ` - ${order.tableNumber}` : '';
  text += `Type: ${orderTypeStr}${tableStr}\n`;
  
  text += '-'.repeat(MAX_LEN) + '\n';
  text += `${padRight('Qty', 4)}${padRight('Item', 20)}${padLeft('Total', 8)}\n`;
  text += '-'.repeat(MAX_LEN) + '\n';
  
  order.items?.forEach((item: any) => {
    const qty = Number(item.quantity || item.qty || 1);
    const qtyStr = `${qty}x`; 
    const nameStr = item.name;

    const itemPrice = Number(item.price) || 0;
    const toppingsArray = item.toppings || item.customization?.toppings || [];
    const itemToppingsPrice = toppingsArray.reduce((sum: number, t: any) => sum + (Number(t.price) || 0), 0);
    const itemTotal = (itemPrice + itemToppingsPrice) * qty;
    
    const totalStr = `$${itemTotal.toFixed(2)}`;
    
    text += `${padRight(qtyStr, 4)}${padRight(nameStr, 20)}${padLeft(totalStr, 8)}\n`;
    
    if (item.customization || toppingsArray.length > 0) {
       let mods = [];
       if (item.customization?.size && item.customization.size !== 'Default') mods.push(item.customization.size);
       if (item.customization?.mood) mods.push(item.customization.mood);
       if (item.customization?.sugar) mods.push(`${item.customization.sugar} sug`);
       if (item.customization?.ice) mods.push(`${item.customization.ice} ice`);
       
       if (toppingsArray.length > 0) {
         mods.push(`+ ${toppingsArray.map((t: any) => t.name).join(', ')}`);
       }
       
       if (mods.length > 0) {
         const modsStr = mods.join(', ');
         const chunks = modsStr.match(/.{1,28}(\s|$)/g) || [modsStr];
         chunks.forEach(chunk => {
           text += `    ${chunk.trim()}\n`;
         });
       }
    }
  });
  
  text += '-'.repeat(MAX_LEN) + '\n';
  text += `${padRight('Subtotal:', 24)}${padLeft('$' + totals.baseSubtotal.toFixed(2), 8)}\n`;
  
  if (totals.toppingsTotal > 0) {
    text += `${padRight('Add-ons:', 24)}${padLeft('$' + totals.toppingsTotal.toFixed(2), 8)}\n`;
  }
  if (totals.discount > 0) text += `${padRight('Discount:', 24)}${padLeft('-$' + totals.discount.toFixed(2), 8)}\n`;
  if (totals.tax > 0) text += `${padRight('Tax (10%):', 24)}${padLeft('$' + totals.tax.toFixed(2), 8)}\n`;
  
  text += '-'.repeat(MAX_LEN) + '\n';
  text += `${padRight('TOTAL (USD):', 22)}${padLeft('$' + totals.total.toFixed(2), 10)}\n`;
  text += `${padRight('TOTAL (KHR):', 20)}${padLeft((totals.total * EXCHANGE_RATE).toLocaleString() + ' R', 12)}\n`;
  
  if (order.amountReceived !== undefined) {
    const changeAmount = order.amountReceived - totals.total;
    const symbol = order.currency === 'KHR' ? 'R' : '$';
    const multiplier = order.currency === 'KHR' ? EXCHANGE_RATE : 1;
    
    text += `${padRight('Received:', 22)}${padLeft(symbol + (order.amountReceived * multiplier).toLocaleString(), 10)}\n`;
    text += `${padRight('Change:', 22)}${padLeft(symbol + (Math.max(changeAmount, 0) * multiplier).toLocaleString(), 10)}\n`;
  }
  
  text += '-'.repeat(MAX_LEN) + '\n';
  text += `Payment: ${order.paymentMethod || 'N/A'}\n\n`;
  text += center('Thank you for your visit!', MAX_LEN) + '\n';
  text += center('Powered by Scandine', MAX_LEN) + '\n';
  text += '\n\n\n\n';
  return text;
}

export default function OrderHistoryCard({ order, shopName = "Store", printerUrl }: { order: any, shopName?: string, printerUrl?: string }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [, startTransition] = useTransition();

  const [optimisticStatus, setOptimisticStatus] = useState(order.status);
  const [isOptimisticallyDeleted, setIsOptimisticallyDeleted] = useState(false);
  const [modalAction, setModalAction] = useState<'delete' | 'cancel' | null>(null);

  const totals = getCorrectedOrderTotals(order);
  const itemSummary = order.items?.map((i: any) => `${i.name} ×${i.quantity || i.qty}`).join(', ') || 'No items';
  const isCancelled = optimisticStatus === 'CANCELLED';

  if (isOptimisticallyDeleted) return null; 

  const handleConfirmAction = () => {
    if (modalAction === 'delete') {
      setIsOptimisticallyDeleted(true); 
      setModalAction(null);
      startTransition(async () => {
        await deleteOrder(order.id);
      });
    } else if (modalAction === 'cancel') {
      setOptimisticStatus('CANCELLED'); 
      setModalAction(null);
      startTransition(async () => {
        await updateOrderStatus(order.id, 'CANCELLED');
      });
    }
  };

  const handlePrint = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!printerUrl) {
      alert("⚠️ Printer URL not configured for this shop. Please add your local print server IP in Settings.");
      return;
    }

    try {
      const receiptText = generateReceiptText(order, shopName);
      await fetch(`${printerUrl}/print`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: receiptText })
      });
      console.log("✅ Reprint sent successfully");
    } catch (err) {
      console.error("🖨️ Printer server not reachable:", err);
      alert(`❌ Failed to connect to printer server at ${printerUrl}.`);
    }
  };

  const formatMoney = (usdAmount: number) => {
    if (order.currency === 'KHR') {
      return `៛${(usdAmount * EXCHANGE_RATE).toLocaleString()}`;
    }
    return `$${usdAmount.toFixed(2)}`;
  };

  return (
    <>
      {modalAction && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white rounded-[32px] p-6 md:p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-5 ${modalAction === 'delete' ? 'bg-red-100' : 'bg-orange-100'}`}>
              {modalAction === 'delete' ? <Trash2 size={24} className="text-red-500" /> : <AlertTriangle size={24} className="text-orange-500" />}
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">{modalAction === 'delete' ? 'Delete Order?' : 'Cancel Order?'}</h3>
            <p className="text-gray-500 text-sm mb-8 leading-relaxed">
              {modalAction === 'delete' ? "Are you sure you want to permanently delete this order?" : "Are you sure you want to mark this order as cancelled?"}
            </p>
            <div className="flex gap-3 w-full">
              <button onClick={() => setModalAction(null)} className="flex-1 py-3.5 px-4 bg-gray-100 text-gray-700 rounded-xl font-bold active:scale-95 transition-all text-sm">No, Keep it</button>
              <button onClick={handleConfirmAction} className={`flex-1 py-3.5 px-4 text-white rounded-xl font-bold active:scale-95 transition-all text-sm ${modalAction === 'delete' ? 'bg-red-500 hover:bg-red-600' : 'bg-orange-500 hover:bg-orange-600'}`}>
                Yes, {modalAction === 'delete' ? 'Delete' : 'Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md ${isCancelled ? 'opacity-75' : ''}`}>
        <div className="p-4 flex items-center justify-between cursor-pointer active:bg-gray-50/50" onClick={() => setIsExpanded(!isExpanded)}>
          <div className="flex items-center gap-4 flex-1 min-w-0 pr-4">
            <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0 shadow-inner">
              <ShoppingCart size={16} className="text-gray-400" />
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className={`font-black text-sm ${isCancelled ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                  #ORD-{(order.orderNumber || order.id).slice(-4).toUpperCase()}
                </span>
                {isCancelled ? (
                  <span className="bg-red-50 text-red-600 border border-red-100 text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md">Cancelled</span>
                ) : (
                  <span className="bg-green-50 text-green-600 border border-green-100 text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md">{optimisticStatus || 'Completed'}</span>
                )}
              </div>
              <p className="text-xs text-gray-400 font-medium truncate w-full max-w-[250px] sm:max-w-md">{itemSummary}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-6 shrink-0">
            <div className="hidden sm:flex flex-col items-end">
              <span className={`font-black text-sm ${isCancelled ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                ${totals.total.toFixed(2)}
              </span>
              <span className={`font-bold text-[10px] ${isCancelled ? 'text-gray-400 line-through' : 'text-orange-600'}`}>
                {(totals.total * EXCHANGE_RATE).toLocaleString()} ៛
              </span>
              <div className="flex items-center gap-1 text-[10px] text-gray-400 font-medium mt-0.5">
                {order.paymentMethod === 'CASH' ? <Banknote size={10}/> : <CreditCard size={10}/>}
                {order.paymentMethod}
              </div>
            </div>
            <div className="flex items-center gap-1 border-l border-gray-100 pl-2 sm:pl-4 ml-2 sm:ml-0">
              <button onClick={handlePrint} className="p-2 text-gray-400 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 rounded-full transition-colors active:scale-95 hidden sm:flex">
                <Printer size={16} />
              </button>
              <button className="text-gray-400 hover:text-gray-900 transition-transform duration-200 p-2" style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                <ChevronDown size={18} />
              </button>
            </div>
          </div>
        </div>

        {isExpanded && (
          <div className="border-t border-gray-50 bg-gray-50/30 p-4 sm:p-6 animate-in slide-in-from-top-2 fade-in duration-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-4 px-1">Items</p>
                <div className="space-y-3">
                  {order.items?.map((item: any, idx: number) => {
                    const qty = Number(item.quantity || item.qty || 1);
                    const itemPrice = Number(item.price) || 0;
                    const toppingsArray = item.toppings || item.customization?.toppings || [];
                    const toppingsPrice = toppingsArray.reduce((sum: number, t: any) => sum + (Number(t.price) || 0), 0);
                    const itemTotal = (itemPrice + toppingsPrice) * qty;

                    return (
                    <div key={idx} className="flex items-start gap-3 bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-50 shrink-0 border border-gray-50">
                        <div className="w-full h-full flex items-center justify-center"><ImageIcon size={14} className="text-gray-300" /></div>
                      </div>
                      <div className="flex-1 min-w-0 pt-0.5">
                        <p className="text-xs font-bold text-gray-900 leading-tight pr-2">{item.name} <span className="text-gray-400 font-medium">×{qty}</span></p>
                        {item.customization && (
                          <p className="text-[10px] text-gray-500 mt-1">
                            {item.customization.size} 
                            {item.customization.mood && `, ${item.customization.mood}`} 
                            {item.customization.sugar && `, ${item.customization.sugar} sugar`} 
                            {item.customization.ice && `, ${item.customization.ice} ice`}
                          </p>
                        )}
                        {toppingsArray.length > 0 && (
                          <p className="text-[10px] text-gray-600 mt-0.5 italic">
                            + {toppingsArray.map((t: any) => t.name).join(', ')}
                          </p>
                        )}
                        {item.notes && <p className="text-[10px] text-gray-500 italic mt-0.5">Note: {item.notes}</p>}
                      </div>
                      <span className={`text-xs font-bold pt-0.5 ${isCancelled ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                        {formatMoney(itemTotal)}
                      </span>
                    </div>
                  )})}
                </div>
              </div>
              <div className="flex flex-col gap-4 h-full">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 h-fit">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-4">Summary</p>
                  <div className="space-y-2.5 mb-4">
                    <div className="flex justify-between text-xs"><span className="text-gray-500 font-medium">Subtotal</span><span className="font-bold text-gray-900">{formatMoney(totals.baseSubtotal)}</span></div>
                    
                    {totals.toppingsTotal > 0 && (
                      <div className="flex justify-between text-xs"><span className="text-gray-500 font-medium">Add-ons</span><span className="font-bold text-gray-900">{formatMoney(totals.toppingsTotal)}</span></div>
                    )}
                    
                    {totals.discount > 0 && <div className="flex justify-between text-xs"><span className="text-gray-500 font-medium">Discount</span><span className="font-bold text-gray-900">-{formatMoney(totals.discount)}</span></div>}
                    <div className="flex justify-between text-xs"><span className="text-gray-500 font-medium">Tax</span><span className="font-bold text-gray-900">{formatMoney(totals.tax)}</span></div>
                  </div>
                  
                  <div className="flex justify-between items-end pt-4 border-t border-gray-100 mb-6">
                    <div className="flex flex-col">
                      <span className="font-black text-sm text-gray-900 uppercase">Total</span>
                      <span className="text-[10px] text-gray-400 font-bold">Rate: {EXCHANGE_RATE}៛</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className={`font-black text-xl leading-none ${isCancelled ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                        ${totals.total.toFixed(2)}
                      </span>
                      <span className={`font-bold text-sm mt-1 ${isCancelled ? 'text-gray-400 line-through' : 'text-orange-600'}`}>
                        {(totals.total * EXCHANGE_RATE).toLocaleString()} ៛
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-2 pt-4 border-t border-gray-50">
                    <div className="flex justify-between text-[10px]"><span className="text-gray-400 font-medium">Order Type</span><span className="font-bold text-gray-700 capitalize">{order.orderType === 'TAKEAWAY' ? 'Walk-in' : order.orderType?.toLowerCase()} {order.tableNumber ? `(${order.tableNumber})` : ''}</span></div>
                    <div className="flex justify-between text-[10px]"><span className="text-gray-400 font-medium">Payment</span><span className="font-bold text-gray-700 capitalize">{order.paymentMethod?.toLowerCase()}</span></div>
                    <div className="flex justify-between text-[10px]"><span className="text-gray-400 font-medium">Date</span><span className="font-bold text-gray-700">{new Date(order.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span></div>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-auto pt-2">
                  {!isCancelled && (
                    <button onClick={() => setModalAction('cancel')} className="flex-1 bg-orange-50 text-orange-600 hover:bg-orange-100 font-bold text-xs py-3 rounded-xl flex items-center justify-center gap-2 transition-colors">
                      <XCircle size={14}/> Cancel Order
                    </button>
                  )}
                  <button onClick={() => setModalAction('delete')} className="flex-1 bg-red-50 text-red-600 hover:bg-red-100 font-bold text-xs py-3 rounded-xl flex items-center justify-center gap-2 transition-colors">
                    <Trash2 size={14}/> Delete Order
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}