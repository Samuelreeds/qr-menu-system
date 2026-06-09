'use client';
import PrintButton from '@/components/PrintButton';

export default function KitchenDashboard() {
  const order = {
    id: 'test-1',
    table: 99,
    items: [{ name: "Test Coffee", qty: 2 }]
  };

  return (
    <div style={{ padding: '24px', fontFamily: 'sans-serif' }}>
      <h1>Kitchen Dashboard (Test Mode)</h1>
      <hr />
      <div style={{ border: '1px solid #000', padding: '16px', marginTop: '20px', width: '300px' }}>
        <h3>Table {order.table}</h3>
        <ul>
          {order.items.map((item, i) => (
            <li key={i}>{item.qty}x {item.name}</li>
          ))}
        </ul>
        <PrintButton order={order} />
      </div>
    </div>
  );
}