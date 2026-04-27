// src/components/PosReceipt.tsx
import React from 'react';

interface PosReceiptProps {
  order: any;
  shopName: string;
}

export default function PosReceipt({ order, shopName }: PosReceiptProps) {
  if (!order) return null;

  return (
    <div className="bg-white text-black font-mono w-[57mm] mx-auto px-2 py-4">
      
      {/* HEADER */}
      <div className="text-center mb-3">
        <h2 className="font-extrabold text-lg uppercase mb-1 leading-tight">{shopName}</h2>
        <p className="text-[10px] leading-tight">Receipt / Tax Invoice</p>
        <p className="text-[10px] leading-tight">Date: {new Date(order.createdAt).toLocaleString()}</p>
        <p className="text-[10px] leading-tight">Order ID: #{order.id.slice(-6).toUpperCase()}</p>
        <p className="text-[11px] font-bold mt-1.5 uppercase">
          Type: {order.orderType === 'TAKEAWAY' ? 'WALK-IN' : order.orderType} {order.tableNumber ? `- ${order.tableNumber}` : ''}
        </p>
      </div>

      {/* ITEMS TABLE */}
      <div className="border-t border-b border-black py-1.5 mb-2 border-dashed">
        <table className="w-full text-[11px]">
          <thead>
            <tr className="text-left border-b border-black border-dashed">
              <th className="pb-1 w-5">Qty</th>
              <th className="pb-1">Item</th>
              <th className="text-right pb-1 w-10">Total</th>
            </tr>
          </thead>
          <tbody>
            {order.items?.map((item: any, idx: number) => (
              <React.Fragment key={idx}>
                <tr>
                  <td className="pt-1.5 align-top">{item.quantity}x</td>
                  <td className="pt-1.5 pr-1 leading-tight">
                    <span className="font-semibold">{item.name}</span>
                    {item.customization && (
                      <div className="text-[9px] text-gray-700 mt-0.5 leading-tight">
                        {item.customization.size}, {item.customization.mood}, {item.customization.sugar} sug, {item.customization.ice} ice
                      </div>
                    )}
                  </td>
                  <td className="text-right pt-1.5 align-top">${(item.price * item.quantity).toFixed(2)}</td>
                </tr>
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* TOTALS */}
      <div className="flex justify-between text-[11px] mb-0.5">
        <span>Subtotal:</span>
        <span>${order.subtotal.toFixed(2)}</span>
      </div>
      {order.discount > 0 && (
        <div className="flex justify-between text-[11px] mb-0.5">
          <span>Discount:</span>
          <span>-${order.discount.toFixed(2)}</span>
        </div>
      )}
      <div className="flex justify-between text-[11px] mb-1.5">
        <span>Tax (10%):</span>
        <span>${order.tax.toFixed(2)}</span>
      </div>
      
      <div className={`flex justify-between font-bold text-sm border-t border-black border-dashed pt-1.5 ${order.amountReceived !== undefined ? 'mb-1' : 'mb-3'}`}>
        <span>TOTAL:</span>
        <span>${order.total.toFixed(2)}</span>
      </div>

      {order.amountReceived !== undefined && (
        <>
          <div className="flex justify-between text-[11px] mb-0.5">
            <span>Received:</span>
            <span>${order.amountReceived.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-[11px] mb-3">
            <span>Change:</span>
            <span>${(order.changeAmount || 0).toFixed(2)}</span>
          </div>
        </>
      )}

      {/* FOOTER */}
      <div className="text-center text-[10px]">
        <p>Payment: {order.paymentMethod}</p>
        <p className="mt-3 font-bold text-[11px]">Thank you for your visit!</p>
        <p className="text-[9px] mt-0.5">Powered by Scandine</p>
      </div>
    </div>
  );
}