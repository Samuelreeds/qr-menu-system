// src/components/shared/PosReceipt.tsx
import React from 'react';

export const EXCHANGE_RATE = 4000;

export function getCorrectedOrderTotals(order: any) {
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
  const tax = Number(order.tax) || ((combinedSubtotal - discount) * (order.isTaxEnabled ? 0.1 : 0));
  const total = Number(order.total) || (combinedSubtotal - discount + tax);

  return { baseSubtotal, toppingsTotal, combinedSubtotal, discount, tax, total };
}

export function generateReceiptText(order: any, shopName: string, isReprint: boolean = false): string {
  const MAX_LEN = 48; 
  
  const padRight = (str: string, len: number) => str.length > len ? str.substring(0, len) : str.padEnd(len, ' ');
  const padLeft = (str: string, len: number) => str.length > len ? str.substring(0, len) : str.padStart(len, ' ');
  const center = (str: string, len: number) => {
    if (str.length >= len) return str.substring(0, len);
    const leftPad = Math.floor((len + str.length) / 2);
    return str.padStart(leftPad, ' ').padEnd(len, ' ');
  };

  const totals = getCorrectedOrderTotals(order);

  let text = '\n';
  if (isReprint) {
    text += center('** REPRINT **', MAX_LEN) + '\n';
  }
  text += center(shopName.toUpperCase() || "SCANDINE", MAX_LEN) + '\n';
  text += center('Receipt / Tax Invoice', MAX_LEN) + '\n';
  text += `Date: ${new Date(order.createdAt).toLocaleString()}\n`;
  text += `Order ID: #${(order.orderNumber || order.id).slice(-6).toUpperCase()}\n`;
  
  const isTable = order.orderType === 'TABLE' && order.tableNumber;
  const orderTypeStr = isTable ? `TABLE ${order.tableNumber}` : order.orderType === 'TAKEAWAY' ? 'WALK-IN' : order.orderType;
  text += `Type: ${orderTypeStr}\n`;
  
  text += '-'.repeat(MAX_LEN) + '\n';
  
  text += `${padRight('Qty', 4)}${padRight('Item', 34)}${padLeft('Total', 10)}\n`;
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
    
    text += `${padRight(qtyStr, 4)}${padRight(nameStr, 34)}${padLeft(totalStr, 10)}\n`;
    
    if (item.customization || toppingsArray.length > 0) {
       let mods = [];
       if (item.customization?.size && item.customization.size !== 'Default') mods.push(item.customization.size);
       if (item.customization?.mood) mods.push(item.customization.mood);
       if (item.customization?.sugar) mods.push(`Sug:${item.customization.sugar}%`);
       if (item.customization?.ice) mods.push(`${item.customization.ice} ice`);
       
       if (toppingsArray.length > 0) {
         toppingsArray.forEach((t: any) => {
           const tQty = t.qty || 1;
           mods.push(`+ ${tQty}x ${t.name}`);
         });
       }
       
       if (mods.length > 0) {
         const modsStr = mods.join(' | ');
         const chunks = modsStr.match(/.{1,44}(\s|$)/g) || [modsStr];
         chunks.forEach(chunk => {
           text += `    ${chunk.trim()}\n`;
         });
       }
    }
  });
  
  text += '-'.repeat(MAX_LEN) + '\n';
  
  text += `${padRight('Subtotal:', 38)}${padLeft('$' + totals.baseSubtotal.toFixed(2), 10)}\n`;
  
  if (totals.toppingsTotal > 0) {
    text += `${padRight('Add-ons:', 38)}${padLeft('$' + totals.toppingsTotal.toFixed(2), 10)}\n`;
  }
  if (totals.discount > 0) text += `${padRight('Discount:', 38)}${padLeft('-$' + totals.discount.toFixed(2), 10)}\n`;
  if (totals.tax > 0) text += `${padRight('Tax (10%):', 38)}${padLeft('$' + totals.tax.toFixed(2), 10)}\n`;
  
  text += '-'.repeat(MAX_LEN) + '\n';
  text += `${padRight('TOTAL (USD):', 36)}${padLeft('$' + totals.total.toFixed(2), 12)}\n`;
  text += `${padRight('TOTAL (KHR):', 34)}${padLeft((totals.total * EXCHANGE_RATE).toLocaleString() + ' R', 14)}\n`;
  
  if (order.amountReceived !== undefined) {
    const changeAmount = order.amountReceived - totals.total;
    const symbol = order.currency === 'KHR' ? 'R' : '$';
    const multiplier = order.currency === 'KHR' ? EXCHANGE_RATE : 1;
    
    text += `${padRight('Received:', 36)}${padLeft(symbol + (order.amountReceived * multiplier).toLocaleString(), 12)}\n`;
    text += `${padRight('Change:', 36)}${padLeft(symbol + (Math.max(changeAmount, 0) * multiplier).toLocaleString(), 12)}\n`;
  }
  
  text += '-'.repeat(MAX_LEN) + '\n';
  text += `Payment: ${order.paymentMethod || 'N/A'}\n\n`;
  text += center('Thank you for your visit!', MAX_LEN) + '\n';
  text += center('Powered by Scandine', MAX_LEN) + '\n';
  text += '\n\n\n\n\n\n\n\n';
  return text;
}

interface PosReceiptProps {
  order: any;
  shopName: string;
}

export default function PosReceipt({ order, shopName }: PosReceiptProps) {
  if (!order) return null;

  const totals = getCorrectedOrderTotals(order);
  const isTable = order.orderType === 'TABLE' && order.tableNumber;
  const orderTypeDisplay = isTable ? `TABLE ${order.tableNumber}` : order.orderType === 'TAKEAWAY' ? 'TAKEAWAY' : order.orderType;

  return (
    <div className="receipt-wrapper">
      <style>{`
        .receipt-wrapper {
          background: #e8e8e8;
          display: flex;
          justify-content: center;
          align-items: flex-start;
          padding: 20px;
          font-family: 'Courier New', Courier, monospace;
        }

        .receipt {
          background: #fff;
          width: 302px;        /* 80mm at 96dpi */
          padding: 24px 16px 24px; 
          box-shadow: 0 2px 12px rgba(0,0,0,0.15);
          position: relative;
        }

        @media print {
          @page {
            size: 80mm auto;   
            margin: 0;
          }
          body { background: #fff; padding: 0; margin: 0; }
          .receipt-wrapper { padding: 0; background: #fff; }
          .receipt {
            width: 80mm;
            padding: 4mm 4mm;
            box-shadow: none;
          }
        }

        .receipt::after {
          content: '';
          position: absolute;
          bottom: -10px;
          left: 0;
          width: 100%;
          height: 10px;
          background:
            linear-gradient(135deg, #fff 33.33%, transparent 33.33%) 0 0,
            linear-gradient(225deg, #fff 33.33%, transparent 33.33%) 0 0;
          background-size: 10px 10px;
          background-color: #e8e8e8;
        }

        @media print {
          .receipt::after { display: none; }
        }

        .logo-area { text-align: center; margin-bottom: 16px; }
        .logo-icon { width: 72px; height: 72px; margin: 0 auto 10px; display: block; }
        .store-name {
          font-family: 'Arial Black', Arial, sans-serif;
          font-size: 28px; /* INCREASED FROM 22px */
          font-weight: 900;
          letter-spacing: 2px;
          line-height: 1.2;
          text-transform: uppercase;
          color: #111;
        }

        .store-info {
          text-align: center;
          font-size: 11.5px;
          color: #444;
          line-height: 1.7;
          margin-bottom: 16px;
        }

        .divider-dashed { border: none; border-top: 1.5px dashed #aaa; margin: 12px 0; }
        .divider-double { border: none; border-top: 2px double #333; margin: 12px 0; }

        .items-table { width: 100%; border-collapse: collapse; font-size: 12.5px; }
        .items-table thead th {
          font-weight: 700;
          text-transform: uppercase;
          padding-bottom: 6px;
          color: #222;
          font-size: 11px;
          letter-spacing: 0.5px;
        }
        .items-table thead th:first-child { text-align: left; width: 28px; }
        .items-table thead th:nth-child(2) { text-align: left; }
        .items-table thead th:nth-child(3) { text-align: right; }
        .items-table thead th:nth-child(4) { text-align: right; }

        .items-table tbody td { padding: 3px 0; color: #222; vertical-align: top; }
        .items-table tbody td:first-child { text-align: left; font-weight: 600; }
        .items-table tbody td:nth-child(2) { text-align: left; text-transform: uppercase; }
        .items-table tbody td:nth-child(3) { text-align: right; }
        .items-table tbody td:nth-child(4) { text-align: right; font-weight: 600; }

        .total-row { display: flex; justify-content: space-between; align-items: baseline; margin: 14px 0 10px; }
        .total-label {
          font-family: 'Arial Black', Arial, sans-serif;
          font-size: 20px;
          font-weight: 900;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: #111;
        }
        .total-amount {
          font-family: 'Arial Black', Arial, sans-serif;
          font-size: 22px;
          font-weight: 900;
          color: #111;
        }

        .payment-summary {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 4px;
          font-size: 13px;
          margin-top: 8px;
          color: #333;
        }
        .payment-row { display: flex; gap: 20px; }
        .payment-row span:first-child { font-weight: 600; }
        .payment-row span:last-child  { font-weight: 700; font-family: 'Courier New', monospace; }

        .receipt-footer { text-align: center; margin-top: 18px; font-size: 12px; color: #555; line-height: 1.8; }
        .receipt-footer .thank-you { font-weight: 700; font-size: 13px; color: #222; }

        .qr-placeholder {
          width: 80px;
          height: 80px;
          margin: 14px auto 0;
          border: 2px solid #222;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 9px;
          color: #999;
          letter-spacing: 0.5px;
        }
      `}</style>

      <div className="receipt" id="receipt">
        {/* LOGO */}
        <div className="logo-area">
          <svg className="logo-icon" viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
            <ellipse cx="40" cy="56" rx="18" ry="16" fill="#111"/>
            <ellipse cx="40" cy="38" rx="11" ry="13" fill="#111"/>
            <ellipse cx="33" cy="20" rx="4.5" ry="13" fill="#111" transform="rotate(-10 33 20)"/>
            <ellipse cx="47" cy="18" rx="4.5" ry="13" fill="#111" transform="rotate(10 47 18)"/>
            <circle cx="44" cy="35" r="1.5" fill="#fff"/>
            <ellipse cx="55" cy="50" rx="3" ry="8" fill="#111" transform="rotate(-30 55 50)"/>
            <ellipse cx="58" cy="42" rx="2" ry="5" fill="#111" transform="rotate(-50 58 42)"/>
            <ellipse cx="52" cy="41" rx="2" ry="5" fill="#111" transform="rotate(-10 52 41)"/>
          </svg>
          <div className="store-name">{shopName || "SCANDINE"}</div>
        </div>

        {/* STORE INFO */}
        <div className="store-info">
          <div>{orderTypeDisplay}</div>
          <div>ID: #{order.id?.slice(-6).toUpperCase()}</div>
          <div>{new Date(order.createdAt).toLocaleString()}</div>
        </div>

        <hr className="divider-dashed" />

        {/* ITEMS */}
        <table className="items-table">
          <thead>
            <tr>
              <th>Qty</th>
              <th>Item</th>
              <th>Price</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {order.items?.map((item: any, idx: number) => {
              const qty = Number(item.quantity || item.qty || 1);
              const toppings = item.customization?.toppings || [];
              const itemPrice = Number(item.price) || 0;
              const toppingsTotal = toppings.reduce((sum: number, t: any) => sum + ((Number(t.price) || 0) * (Number(t.qty) || 1)), 0);
              const itemTotal = (itemPrice + toppingsTotal) * qty;

              return (
                <React.Fragment key={idx}>
                  <tr>
                    <td>{qty}</td>
                    <td>{item.name}</td>
                    <td>{(itemPrice + toppingsTotal).toFixed(2)}</td>
                    <td>{itemTotal.toFixed(2)}</td>
                  </tr>
                  
                  {item.customization && (
                    <tr>
                      <td></td>
                      <td colSpan={3} style={{ fontSize: '10px', color: '#555', textTransform: 'none', paddingBottom: '0' }}>
                        {[
                          item.customization.size && item.customization.size !== 'Default' ? item.customization.size : null,
                          item.customization.sugar ? `Sug:${item.customization.sugar}%` : null
                        ].filter(Boolean).join(' | ')}
                      </td>
                    </tr>
                  )}
                  
                  {toppings.length > 0 && toppings.map((t: any, tIdx: number) => (
                    <tr key={`t-${idx}-${tIdx}`}>
                      <td></td>
                      <td colSpan={3} style={{ fontSize: '10px', color: '#666', fontStyle: 'italic', textTransform: 'none', paddingTop: '0' }}>
                        + {t.qty || 1}x {t.name}
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>

        <hr className="divider-dashed" />

        {/* SUBTOTAL & TAX */}
        <div className="payment-summary" style={{ alignItems: 'space-between', width: '100%' }}>
          <div className="payment-row" style={{ width: '100%', justifyContent: 'space-between' }}>
            <span>Subtotal</span>
            <span>${totals.baseSubtotal.toFixed(2)}</span>
          </div>
          {totals.toppingsTotal > 0 && (
            <div className="payment-row" style={{ width: '100%', justifyContent: 'space-between' }}>
              <span>Add-ons</span>
              <span>${totals.toppingsTotal.toFixed(2)}</span>
            </div>
          )}
          {totals.discount > 0 && (
            <div className="payment-row" style={{ width: '100%', justifyContent: 'space-between', color: '#d32f2f' }}>
              <span>Discount</span>
              <span>-${totals.discount.toFixed(2)}</span>
            </div>
          )}
          <div className="payment-row" style={{ width: '100%', justifyContent: 'space-between' }}>
            <span>Tax (10%)</span>
            <span>${totals.tax.toFixed(2)}</span>
          </div>
        </div>

        <hr className="divider-double" />

        {/* TOTAL */}
        <div className="total-row">
          <span className="total-label">TOTAL</span>
          <span className="total-amount">${totals.total.toFixed(2)}</span>
        </div>

        {/* PAYMENT AMOUNT */}
        {order.amountReceived !== undefined && (
          <div className="payment-summary">
            <div className="payment-row">
              <span>{order.paymentMethod || 'Paid'}</span>
              <span>${order.amountReceived.toFixed(2)}</span>
            </div>
            <div className="payment-row">
              <span>Change</span>
              <span>${Math.max((order.amountReceived - totals.total), 0).toFixed(2)}</span>
            </div>
          </div>
        )}

        {/* FOOTER */}
        <div className="receipt-footer">
          <div className="thank-you">Thank you for your visit!</div>
          <div>Powered by Scandine</div>
        </div>

        {/* QR CODE PLACEHOLDER */}
        <div className="qr-placeholder">QR CODE</div>
      </div>
    </div>
  );
}