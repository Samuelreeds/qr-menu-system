// src/components/pos/DashboardOverview.tsx
'use client';

import { useMemo } from 'react';
import { DollarSign, Receipt, TrendingUp, TrendingDown, Banknote, Clock, QrCode } from 'lucide-react';

const EXCHANGE_RATE = 4000;

export default function DashboardOverview({ orders, products }: { orders: any[], products: any[] }) {
  const stats = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const todayOrders = orders.filter(o => new Date(o.createdAt) >= today);
    const yesterdayOrders = orders.filter(o => {
      const d = new Date(o.createdAt);
      return d >= yesterday && d < today;
    });

    const grossSales = todayOrders.reduce((sum, o) => sum + o.total, 0);
    const yesterdaySales = yesterdayOrders.reduce((sum, o) => sum + o.total, 0);
    const salesGrowth = yesterdaySales === 0 ? (grossSales > 0 ? 100 : 0) : ((grossSales - yesterdaySales) / yesterdaySales) * 100;

    const totalOrders = todayOrders.length;
    const avgTicket = totalOrders === 0 ? 0 : grossSales / totalOrders;

    // Sales by Hour
    const hourlySales = Array(24).fill(0);
    todayOrders.forEach(o => {
      const hour = new Date(o.createdAt).getHours();
      hourlySales[hour] += o.total;
    });

    // Group into 2-hour buckets (6 AM to 10 PM)
    const chartData = [];
    for (let i = 6; i <= 22; i += 2) {
      const val = hourlySales[i] + (hourlySales[i + 1] || 0);
      chartData.push({
        hour: i,
        label: `${i % 12 || 12}${i < 12 ? 'a' : 'p'}`,
        value: val,
        height: '0%' 
      });
    }

    const maxHour = Math.max(...chartData.map(d => d.value), 1); 
    chartData.forEach(d => {
      d.height = `${(d.value / maxHour) * 100}%`;
    });

    // Order Types 
    let table = 0, walkin = 0, delivery = 0;
    todayOrders.forEach(o => {
      if (o.orderType === 'TABLE') table++;
      else if (o.orderType === 'TAKEAWAY') walkin++;
      else if (o.orderType === 'DELIVERY') delivery++;
    });
    const typeTotal = table + walkin + delivery || 1;

    // Payment Split
    let cash = 0, khqr = 0;
    todayOrders.forEach(o => {
      if (o.paymentMethod === 'CASH') cash += o.total;
      else if (o.paymentMethod === 'KHQR') khqr += o.total;
    });

    // Top Items
    const itemCounts: Record<string, number> = {};
    todayOrders.forEach(o => {
      o.items?.forEach((i: any) => {
        itemCounts[i.name] = (itemCounts[i.name] || 0) + i.quantity;
      });
    });
    const topItems = Object.entries(itemCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    return { 
      grossSales, 
      salesGrowth, 
      totalOrders, 
      avgTicket, 
      chartData, 
      table, 
      walkin, 
      delivery, 
      typeTotal, 
      cash, 
      khqr, 
      topItems, 
      recentOrders: orders.slice(0, 6) 
    };
  }, [orders]);

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12 animate-in fade-in duration-300 print:hidden min-w-0">
      
      {/* 1. TOTAL SALES + TOTAL ORDERS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 min-w-0">
        
        {/* GROSS SALES (USD) */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-between min-w-0">
          <div className="flex justify-between items-start mb-6">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-500 shrink-0">
              <DollarSign size={24} strokeWidth={2.5} />
            </div>
            {stats.salesGrowth !== 0 && (
              <span className={`flex items-center text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg shrink-0 ${stats.salesGrowth > 0 ? 'text-emerald-600 bg-emerald-50' : 'text-red-600 bg-red-50'}`}>
                {stats.salesGrowth > 0 ? <TrendingUp size={12} className="mr-1" strokeWidth={3}/> : <TrendingDown size={12} className="mr-1" strokeWidth={3}/>}
                {stats.salesGrowth > 0 ? '+' : ''}{stats.salesGrowth.toFixed(1)}%
              </span>
            )}
          </div>
          <div className="min-w-0">
             <p className="text-[11px] font-black text-gray-500 uppercase tracking-wider mb-1 truncate">Gross Sales (Today)</p>
             <h2 className="text-4xl font-black text-gray-900 truncate">${stats.grossSales.toFixed(2)}</h2>
          </div>
        </div>

        {/* GROSS SALES (KHR) */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-between min-w-0">
          <div className="flex justify-between items-start mb-6">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-500 shrink-0">
              <Banknote size={24} strokeWidth={2.5} />
            </div>
          </div>
          <div className="min-w-0">
             <p className="text-[11px] font-black text-gray-500 uppercase tracking-wider mb-1 truncate">Gross Sales (៛)</p>
             <h2 className="text-4xl font-black text-gray-900 truncate">៛{(stats.grossSales * EXCHANGE_RATE).toLocaleString()}</h2>
          </div>
        </div>

        {/* TOTAL ORDERS */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-between min-w-0">
          <div className="flex justify-between items-start mb-6">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-500 shrink-0">
              <Receipt size={24} strokeWidth={2.5} />
            </div>
          </div>
          <div className="min-w-0">
             <p className="text-[11px] font-black text-gray-500 uppercase tracking-wider mb-1 truncate">Total Orders</p>
             <h2 className="text-4xl font-black text-gray-900 truncate">{stats.totalOrders}</h2>
          </div>
        </div>

      </div>

      {/* 2. PAYMENT SUMMARY */}
      <div className="grid grid-cols-1 gap-6 min-w-0">
        <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100 min-w-0">
          <h3 className="font-extrabold text-gray-900 mb-6 flex items-center gap-2 truncate">
            <Banknote size={18} className="text-gray-400 shrink-0" strokeWidth={2.5}/> Payment Split
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 min-w-0">
            <div className="p-5 border border-gray-100 rounded-2xl flex items-center justify-between bg-white shadow-sm min-w-0">
               <div className="flex items-center gap-3.5 min-w-0">
                  <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-500 shrink-0">
                    <Banknote size={20} strokeWidth={2.5}/>
                  </div>
                  <span className="font-extrabold text-gray-900 text-sm truncate">Cash Register</span>
               </div>
               <span className="text-xl font-black text-gray-900 shrink-0 whitespace-nowrap pl-2">${stats.cash.toFixed(2)}</span>
            </div>
            
            <div className="p-5 border border-gray-100 rounded-2xl flex items-center justify-between bg-white shadow-sm min-w-0">
               <div className="flex items-center gap-3.5 min-w-0">
                  <div className="p-2.5 bg-blue-50 rounded-xl text-blue-500 shrink-0">
                    <QrCode size={20} strokeWidth={2.5}/>
                  </div>
                  <span className="font-extrabold text-gray-900 text-sm truncate">KHQR Digital</span>
               </div>
               <span className="text-xl font-black text-gray-900 shrink-0 whitespace-nowrap pl-2">${stats.khqr.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. TOP SELLING + ORDER BREAKDOWN */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 min-w-0">
        <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100 min-w-0">
          <h3 className="font-extrabold text-gray-900 mb-6 flex items-center gap-2 truncate">
            <TrendingUp size={18} className="text-gray-400 shrink-0" strokeWidth={2.5}/> Top Selling Items
          </h3>
          <div className="space-y-3 min-w-0">
            {stats.topItems.length === 0 ? (
              <p className="text-sm font-medium text-gray-400 py-8 text-center">No sales today</p>
            ) : (
              stats.topItems.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center p-3 bg-gray-50/80 rounded-xl border border-gray-100/50 min-w-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-[11px] font-black text-gray-400 w-5 text-center shrink-0">{idx + 1}</span>
                    <span className="font-extrabold text-sm text-gray-900 truncate">{item[0]}</span>
                  </div>
                  <span className="text-[11px] font-bold bg-white border border-gray-200 px-2.5 py-1 rounded-lg text-gray-600 shadow-sm shrink-0 whitespace-nowrap">{item[1]} sold</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col h-[340px] min-w-0">
          <h3 className="font-extrabold text-gray-900 mb-8 truncate">Order Breakdown</h3>
          <div className="flex-1 flex flex-col justify-center gap-6 min-w-0">
             <div className="space-y-6 w-full">
                <div>
                  <div className="flex justify-between text-xs font-extrabold mb-2 text-gray-700">
                     <span>Table</span><span>{Math.round((stats.table / stats.typeTotal) * 100)}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                     <div className="bg-gray-200 h-full rounded-full transition-all duration-500" style={{ width: `${(stats.table / stats.typeTotal) * 100}%` }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs font-extrabold mb-2 text-gray-900">
                     <span>Walkin</span><span>{Math.round((stats.walkin / stats.typeTotal) * 100)}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                     <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${(stats.walkin / stats.typeTotal) * 100}%` }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs font-extrabold mb-2 text-gray-700">
                     <span>Delivery</span><span>{Math.round((stats.delivery / stats.typeTotal) * 100)}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                     <div className="bg-gray-200 h-full rounded-full transition-all duration-500" style={{ width: `${(stats.delivery / stats.typeTotal) * 100}%` }}></div>
                  </div>
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* 4. EVERYTHING ELSE (Sales by Hour + Recent Activity) */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 min-w-0">
        <div className="xl:col-span-2 bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col h-[340px] min-w-0">
          <h3 className="font-extrabold text-gray-900 mb-6 truncate">Sales by Hour (Today)</h3>
          <div className="flex-1 flex items-end gap-3 md:gap-4 mt-auto pt-4 border-b border-gray-50 relative min-w-0">
            {stats.chartData.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center group relative h-full justify-end min-w-0">
                <div className="w-full bg-gray-100/80 rounded-t-lg relative overflow-hidden transition-all group-hover:bg-gray-200 h-40">
                  <div className="absolute bottom-0 w-full bg-[#111827] rounded-t-lg transition-all duration-500" style={{ height: d.height }}></div>
                </div>
                <span className="text-[10px] font-bold text-gray-400 mt-3 truncate w-full text-center">{d.label}</span>
                {d.value > 0 && (
                  <span className="absolute -top-7 text-[10px] font-black bg-gray-900 text-white px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity z-10 shadow-md whitespace-nowrap">
                    ${d.value.toFixed(0)}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100 min-w-0">
          <h3 className="font-extrabold text-gray-900 mb-6 flex items-center gap-2 truncate">
            <Clock size={18} className="text-gray-400 shrink-0" strokeWidth={2.5}/> Recent Activity
          </h3>
          <div className="space-y-0 min-w-0">
            {stats.recentOrders.length === 0 ? (
              <p className="text-sm font-medium text-gray-400 py-8 text-center">No orders yet</p>
            ) : (
              stats.recentOrders.map((o) => (
                <div key={o.id} className="flex justify-between items-center border-b border-gray-50 py-3.5 first:pt-0 last:border-0 last:pb-0 min-w-0">
                  <div className="min-w-0 pr-2">
                    <p className="text-sm font-extrabold text-gray-900 truncate">Order #{o.id.slice(-4).toUpperCase()}</p>
                    <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-wider truncate">
                      {new Date(o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {o.orderType === 'TAKEAWAY' ? 'Walkin' : o.orderType}
                    </p>
                  </div>
                  <span className="font-black text-gray-900 text-[15px] shrink-0 whitespace-nowrap">${o.total.toFixed(2)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

    </div>
  );
}