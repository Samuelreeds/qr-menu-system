// src/components/PosReceipt.tsx
import React from 'react';

interface PosReceiptProps {
  order: any;
  shopName: string;
}

export default function PosReceipt({ order, shopName }: PosReceiptProps) {
  if (!order) return null;

  return (
    <div className="bg-white text-black font-mono text-sm w-[80mm] mx-auto p-4">
      <div className="text-center mb-4">
        <h2 className="font-bold text-xl uppercase mb-1">{shopName}</h2>
        <p className="text-xs">Receipt / Tax Invoice</p>
        <p className="text-xs">Date: {new Date(order.createdAt).toLocaleString()}</p>
        <p className="text-xs">Order ID: #{order.id.slice(-6).toUpperCase()}</p>
        <p className="text-xs font-bold mt-1 uppercase">Type: {order.orderType} {order.tableNumber ? `- ${order.tableNumber}` : ''}</p>
      </div>

      <div className="border-t border-b border-black py-2 mb-2 border-dashed">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left border-b border-black border-dashed">
              <th className="pb-1">Qty</th>
              <th className="pb-1">Item</th>
              <th className="text-right pb-1">Total</th>
            </tr>
          </thead>
          <tbody>
            {order.items?.map((item: any, idx: number) => (
              <React.Fragment key={idx}>
                <tr>
                  <td className="pt-1 align-top">{item.quantity}x</td>
                  <td className="pt-1 pr-2 leading-tight">
                    {item.name}
                    {item.customization && (
                      <div className="text-[10px] text-gray-600 mt-0.5">
                        {item.customization.size}, {item.customization.mood}, {item.customization.sugar} sugar, {item.customization.ice} ice
                      </div>
                    )}
                  </td>
                  <td className="text-right pt-1 align-top">${(item.price * item.quantity).toFixed(2)}</td>
                </tr>
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between text-xs mb-1">
        <span>Subtotal:</span>
        <span>${order.subtotal.toFixed(2)}</span>
      </div>
      {order.discount > 0 && (
        <div className="flex justify-between text-xs mb-1">
          <span>Discount:</span>
          <span>-${order.discount.toFixed(2)}</span>
        </div>
      )}
      <div className="flex justify-between text-xs mb-2">
        <span>Tax (10%):</span>
        <span>${order.tax.toFixed(2)}</span>
      </div>
      
      <div className="flex justify-between font-bold text-base border-t border-black border-dashed pt-2 mb-4">
        <span>TOTAL:</span>
        <span>${order.total.toFixed(2)}</span>
      </div>

      <div className="text-center text-xs">
        <p>Payment Method: {order.paymentMethod}</p>
        <p className="mt-4 font-bold">Thank you for your visit!</p>
        <p className="text-[10px] mt-1">Powered by Scandine</p>
      </div>
    </div>
  );
}