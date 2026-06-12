// src/components/pos/OrderHistoryCard.tsx
'use client';

import { useState, useTransition } from 'react';
import { ShoppingCart, ChevronDown, Image as ImageIcon, Banknote, CreditCard, Trash2, XCircle, AlertTriangle, Printer, X } from 'lucide-react';
import { deleteOrder, updateOrderStatus, settleUnpaidOrder } from '@/lib/actions';
import { generateReceiptText, getCorrectedOrderTotals, EXCHANGE_RATE } from '@/components/shared/PosReceipt';

export default function OrderHistoryCard({ order, shopName = "Store", printerUrl, qrImage }: { order: any, shopName?: string, printerUrl?: string, qrImage?: string | null }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [, startTransition] = useTransition();

  const [optimisticStatus, setOptimisticStatus] = useState(order.status);
  const [optimisticIsPaid, setOptimisticIsPaid] = useState(order.isPaid);
  const [isOptimisticallyDeleted, setIsOptimisticallyDeleted] = useState(false);
  
  // Updated modal actions to support separate Cash and KHQR modals
  const [modalAction, setModalAction] = useState<'delete' | 'cancel' | 'pay_cash' | 'pay_khqr' | null>(null);

  // Cash Calculation States
  const [cashReceivedUSD, setCashReceivedUSD] = useState("");
  const [cashReceivedKHR, setCashReceivedKHR] = useState("");

  const totals = getCorrectedOrderTotals(order);
  const itemSummary = order.items?.map((i: any) => `${i.name} ×${i.quantity || i.qty}`).join(', ') || 'No items';
  
  const isCancelled = optimisticStatus === 'CANCELLED';
  const isUnpaid = optimisticIsPaid === false; 
  const amountReceived = optimisticIsPaid ? totals.total : Number(order.amountReceived || 0);

  const priceColor = isCancelled ? 'text-gray-400 line-through' : isUnpaid ? 'text-red-500' : 'text-green-600';

  // Safe Cash Math Calculations
  const parsedUSD = parseFloat(cashReceivedUSD) || 0;
  const parsedKHR = parseFloat(cashReceivedKHR) || 0;
  const totalReceivedInUSD = parsedUSD + (parsedKHR / EXCHANGE_RATE);
  const changeDueUSD = Math.max(0, totalReceivedInUSD - totals.total);
  const changeDueKHR = changeDueUSD * EXCHANGE_RATE;
  const isPaymentSufficient = Math.round(totalReceivedInUSD * 100) >= Math.round(totals.total * 100);

  if (isOptimisticallyDeleted) return null; 

  const handleConfirmAction = () => {
    if (modalAction === 'delete') {
      setIsOptimisticallyDeleted(true); 
      setModalAction(null);
      startTransition(async () => { await deleteOrder(order.id); });
    } else if (modalAction === 'cancel') {
      setOptimisticStatus('CANCELLED'); 
      setModalAction(null);
      startTransition(async () => { await updateOrderStatus(order.id, 'CANCELLED'); });
    }
  };

  const handleConfirmPayment = (method: 'CASH' | 'KHQR') => {
    setOptimisticStatus('COMPLETED');
    setOptimisticIsPaid(true);
    setModalAction(null);
    startTransition(async () => { 
      await settleUnpaidOrder(order.id, method, totals.total); 
    });
  };

  const handlePrint = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!printerUrl) return alert("⚠️ Printer URL not configured.");
    try {
      await fetch(`${printerUrl}/print`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: generateReceiptText(order, shopName, true) })
      });
    } catch (err) { alert(`❌ Failed to connect to printer.`); }
  };

  const formatMoney = (usdAmount: number) => {
    if (order.currency === 'KHR') return `៛${(usdAmount * EXCHANGE_RATE).toLocaleString()}`;
    return `$${usdAmount.toFixed(2)}`;
  };

  return (
    <>
      {/* CASH PAYMENT MODAL */}
      {modalAction === 'pay_cash' && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-[32px] shadow-2xl overflow-hidden p-6 md:p-8 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-extrabold text-gray-900 text-xl">Cash Payment</h3>
              <button onClick={() => setModalAction(null)} className="text-gray-400 hover:bg-gray-100 p-2 rounded-full transition-colors active:scale-95">
                <X size={20} />
              </button>
            </div>

            <div className="mb-6 text-center py-4 bg-gray-50 rounded-2xl border border-gray-100">
              <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Total Due</p>
              <div className="flex flex-col items-center justify-center gap-0.5">
                <p className="text-4xl font-black text-gray-900">${totals.total.toFixed(2)}</p>
                <p className="text-sm font-bold text-gray-500">{(totals.total * EXCHANGE_RATE).toLocaleString()} ៛</p>
              </div>
            </div>

            <div className="space-y-4 mb-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2 block pl-1">USD Received</label>
                  <div className="relative mb-2">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-base">$</span>
                    <input 
                      type="number" step="0.01" min="0" 
                      value={cashReceivedUSD} 
                      onChange={e => setCashReceivedUSD(e.target.value)} 
                      className="w-full pl-7 pr-2 py-3 bg-white border-2 border-gray-200 rounded-xl font-black text-base outline-none focus:border-gray-900 transition-colors shadow-sm" 
                      placeholder="0.00" 
                    />
                  </div>
                  <button 
                    onClick={() => { setCashReceivedUSD(totals.total.toFixed(2)); setCashReceivedKHR(""); }} 
                    className="w-full text-[11px] font-bold bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition-colors active:scale-95"
                  >
                    Exact $
                  </button>
                </div>
                
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2 block pl-1">KHR Received</label>
                  <div className="relative mb-2">
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-base">៛</span>
                    <input 
                      type="number" step="100" min="0" 
                      value={cashReceivedKHR} 
                      onChange={e => setCashReceivedKHR(e.target.value)} 
                      className="w-full pl-3 pr-7 py-3 bg-white border-2 border-gray-200 rounded-xl font-black text-base outline-none focus:border-gray-900 transition-colors shadow-sm" 
                      placeholder="0" 
                    />
                  </div>
                  <button 
                    onClick={() => { setCashReceivedKHR((totals.total * EXCHANGE_RATE).toString()); setCashReceivedUSD(""); }} 
                    className="w-full text-[11px] font-bold bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition-colors active:scale-95"
                  >
                    Exact ៛
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2 block pl-1">Change Due</label>
                <div className="w-full px-4 py-3.5 bg-emerald-50 border-2 border-emerald-100 rounded-xl font-black text-emerald-600 text-lg flex items-center justify-between shadow-sm">
                  <span>${changeDueUSD.toFixed(2)}</span>
                  <span className="text-sm opacity-80">{changeDueKHR.toLocaleString()} ៛</span>
                </div>
              </div>
            </div>

            {!isPaymentSufficient && totalReceivedInUSD > 0 && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-xl text-xs font-bold text-center">
                Received amount is less than total
              </div>
            )}

            <button 
              onClick={() => handleConfirmPayment('CASH')}
              disabled={!isPaymentSufficient}
              className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold text-[15px] hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              Confirm Payment
            </button>
          </div>
        </div>
      )}

      {/* KHQR PAYMENT MODAL */}
      {modalAction === 'pay_khqr' && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-[32px] shadow-2xl overflow-hidden p-6 md:p-8 animate-in zoom-in-95 duration-200 flex flex-col items-center">
            
            <div className="w-full flex justify-between items-center mb-6">
              <h3 className="font-extrabold text-gray-900 text-xl">KHQR Payment</h3>
              <button onClick={() => setModalAction(null)} className="text-gray-400 hover:bg-gray-100 p-2 rounded-full transition-colors active:scale-95">
                <X size={20} />
              </button>
            </div>

            <div className="mb-6 text-center py-4 bg-gray-50 rounded-2xl border border-gray-100 w-full">
              <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Amount to Pay</p>
              <div className="flex flex-col items-center justify-center gap-0.5">
                <p className="text-4xl font-black text-gray-900">${totals.total.toFixed(2)}</p>
                <p className="text-sm font-bold text-gray-500">{(totals.total * EXCHANGE_RATE).toLocaleString()} ៛</p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-3xl border-2 border-gray-100 mb-8 w-full flex justify-center shadow-sm relative overflow-hidden">
              {qrImage ? (
                <img 
                  src={qrImage} 
                  alt="Shop KHQR Code" 
                  className="w-48 h-48 sm:w-56 sm:h-56 object-contain relative z-10"
                />
              ) : (
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(`KHQR_PAYMENT_FOR_${totals.total}`)}`} 
                  alt="Default KHQR Code" 
                  className="w-48 h-48 sm:w-56 sm:h-56 object-contain relative z-10 mix-blend-multiply opacity-50"
                />
              )}
            </div>

            <div className="w-full flex gap-3">
              <button 
                onClick={() => handleConfirmPayment('KHQR')}
                className="flex-1 py-4 bg-gray-900 text-white rounded-2xl font-bold text-[14px] hover:bg-gray-800 shadow-md active:scale-[0.98] transition-all flex flex-col items-center justify-center gap-1"
              >
                <span>Paid in USD</span>
                <span className="text-[10px] text-gray-300 font-medium">Record as $</span>
              </button>
              <button 
                onClick={() => handleConfirmPayment('KHQR')}
                className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-bold text-[14px] hover:bg-blue-700 shadow-md active:scale-[0.98] transition-all flex flex-col items-center justify-center gap-1"
              >
                <span>Paid in ៛</span>
                <span className="text-[10px] text-blue-200 font-medium">Record as KHR</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* CANCEL & DELETE MODAL */}
      {(modalAction === 'cancel' || modalAction === 'delete') && (
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

      {/* MAIN CARD UI */}
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
                ) : isUnpaid ? (
                  <span className="bg-orange-50 text-orange-600 border border-orange-100 text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md">Unpaid</span>
                ) : (
                  <span className="bg-green-50 text-green-600 border border-green-100 text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md">{optimisticStatus || 'Completed'}</span>
                )}
              </div>
              <p className="text-xs text-gray-400 font-medium truncate w-full max-w-[250px] sm:max-w-md">{itemSummary}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-6 shrink-0">
            <div className="hidden sm:flex flex-col items-end">
              <span className={`font-black text-sm ${priceColor}`}>
                {isUnpaid ? 'Unpaid' : `$${totals.total.toFixed(2)}`}
              </span>
              <span className={`font-bold text-[10px] ${isCancelled ? 'text-gray-400 line-through' : 'text-gray-500'}`}>
                {isUnpaid ? `Amount Recv: $${amountReceived.toFixed(2)}` : (totals.total * EXCHANGE_RATE).toLocaleString() + ' ៛'}
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
                    {totals.toppingsTotal > 0 && <div className="flex justify-between text-xs"><span className="text-gray-500 font-medium">Add-ons</span><span className="font-bold text-gray-900">{formatMoney(totals.toppingsTotal)}</span></div>}
                    {totals.discount > 0 && <div className="flex justify-between text-xs"><span className="text-gray-500 font-medium">Discount</span><span className="font-bold text-gray-900">-{formatMoney(totals.discount)}</span></div>}
                    <div className="flex justify-between text-xs"><span className="text-gray-500 font-medium">Tax</span><span className="font-bold text-gray-900">{formatMoney(totals.tax)}</span></div>
                  </div>
                  
                  <div className="flex justify-between items-end pt-4 border-t border-gray-100 mb-6">
                    <div className="flex flex-col">
                      <span className="font-black text-sm text-gray-900 uppercase">Total</span>
                      <span className="text-[10px] text-gray-400 font-bold">Rate: {EXCHANGE_RATE}៛</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className={`font-black text-xl leading-none ${priceColor}`}>
                        {isUnpaid ? '$0.00' : `$${totals.total.toFixed(2)}`}
                      </span>
                      <span className={`font-bold text-sm mt-1 ${isCancelled ? 'text-gray-400 line-through' : priceColor}`}>
                         {isUnpaid ? 'Unpaid' : (totals.total * EXCHANGE_RATE).toLocaleString() + ' ៛'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-2 pt-4 border-t border-gray-50">
                    <div className="flex justify-between text-[10px]"><span className="text-gray-400 font-medium">Order Type</span><span className="font-bold text-gray-700 capitalize">{order.orderType === 'TAKEAWAY' ? 'Walk-in' : order.orderType?.toLowerCase()} {order.tableNumber ? `(${order.tableNumber})` : ''}</span></div>
                    <div className="flex justify-between text-[10px]"><span className="text-gray-400 font-medium">Payment</span><span className="font-bold text-gray-700 capitalize">{order.paymentMethod?.toLowerCase()}</span></div>
                    <div className="flex justify-between text-[10px]"><span className="text-gray-400 font-medium">Date</span><span className="font-bold text-gray-700">{new Date(order.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span></div>
                  </div>
                </div>

                <div className="flex flex-col gap-2 mt-auto pt-2">
                  {isUnpaid && !isCancelled && (
                    <div className="flex gap-2 w-full mb-1">
                      <button onClick={() => setModalAction('pay_cash')} className="flex-1 bg-gray-900 text-white font-bold text-xs py-3 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98]">
                        <span className="text-base leading-none">💵</span> Settle (Cash)
                      </button>
                      <button onClick={() => setModalAction('pay_khqr')} className="flex-1 bg-gray-900 text-white font-bold text-xs py-3 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98]">
                        <span className="text-base leading-none">📲</span> Settle (KHQR)
                      </button>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
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
          </div>
        )}
      </div>
    </>
  );
}