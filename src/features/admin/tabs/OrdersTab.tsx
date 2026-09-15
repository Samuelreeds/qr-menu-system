// src/features/admin/tabs/OrdersTab.tsx
'use client';

import React, { useState, useMemo } from 'react';
import { ClipboardList, Download, Loader2, FileSpreadsheet, X, Search, Trash2 } from 'lucide-react';
import OrderHistoryCard from "@/features/pos/OrderHistoryCard";
import { deleteOrder } from '@/lib/actions';

interface OrdersTabProps {
  shopId: string;
  orders: any[];
  orderFilter: string;
  setOrderFilter: (filter: string) => void;
  settingsName: string;
  printerUrl: string;
  qrImage?: string | null;
}

type ReportType = "daily" | "monthly" | "yearly" | "custom";
const EXCHANGE_RATE = 4000;

export default function OrdersTab({
  shopId,
  orders,
  orderFilter,
  setOrderFilter,
  settingsName,
  printerUrl,
  qrImage
}: OrdersTabProps) {
  
  // Export Panel State
  const [showExportPanel, setShowExportPanel] = useState(false);
  const [reportType, setReportType] = useState<ReportType>("daily");
  const [exportStartDate, setExportStartDate] = useState("");
  const [exportEndDate, setExportEndDate] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  // Search & Date Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");

  // Bulk Selection State
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const filteredOrders = useMemo(() => {
    return orders?.filter(o => {
      // 1. Quick Filters
      if (orderFilter === 'Completed' && (o.status === 'CANCELLED' || o.isPaid === false)) return false;
      if (orderFilter === 'Cancelled' && o.status !== 'CANCELLED') return false;
      if (orderFilter === 'Unpaid' && o.isPaid !== false) return false;
      if (orderFilter === 'Today') {
        const today = new Date().toDateString();
        if (new Date(o.createdAt).toDateString() !== today) return false;
      }

      // 2. Search by Order ID
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const idMatch = o.id?.toLowerCase().includes(query) || o.orderNumber?.toLowerCase().includes(query);
        if (!idMatch) return false;
      }

      // 3. Search by Custom Date Range
      if (filterStartDate || filterEndDate) {
        const orderDateStr = new Date(o.createdAt).toISOString().split('T')[0];
        const orderDate = new Date(orderDateStr);
        
        if (filterStartDate) {
          const start = new Date(filterStartDate);
          if (orderDate < start) return false;
        }
        
        if (filterEndDate) {
          const end = new Date(filterEndDate);
          if (orderDate > end) return false;
        }
      }

      return true; 
    }) || [];
  }, [orders, orderFilter, searchQuery, filterStartDate, filterEndDate]);

  // Top Metrics Calculation
  const totalOrderCount = filteredOrders.length;
  const totalRevenueUSD = filteredOrders.reduce((sum, o) => sum + (o.status !== 'CANCELLED' ? Number(o.total) : 0), 0);
  const totalRevenueKHR = totalRevenueUSD * EXCHANGE_RATE;

  // Existing Export Function
  const handleDownload = async () => {
    setIsExporting(true);
    try {
      const params = new URLSearchParams({ type: reportType, shopId });
      
      if (reportType === "custom") {
        if (!exportStartDate || !exportEndDate) {
          alert("Please select both start and end dates.");
          setIsExporting(false);
          return;
        }
        params.append("start", exportStartDate);
        params.append("end", exportEndDate);
      }

      const response = await fetch(`/api/reports/export?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to generate report");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Shop_Report_${reportType}_${new Date().getTime()}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      
      setShowExportPanel(false);
    } catch (error) {
      alert("Error downloading the report. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  // Bulk Actions
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(new Set(filteredOrders.map(o => o.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleToggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const handleBulkDelete = async () => {
    setIsBulkDeleting(true);
    let successCount = 0;
    try {
      for (const id of Array.from(selectedIds)) {
        const res = await deleteOrder(id);
        if (res?.success) successCount++;
      }
      setSelectedIds(new Set());
      setShowDeleteModal(false);
      if (successCount < selectedIds.size) {
        alert(`Deleted ${successCount} orders. ${selectedIds.size - successCount} failed.`);
      }
    } catch (err) {
      alert("An error occurred during bulk deletion.");
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const handleExportSelected = () => {
    const selectedOrders = filteredOrders.filter(o => selectedIds.has(o.id));
    if (selectedOrders.length === 0) return;

    const csvRows = [
      ["Order ID", "Date", "Total Items", "Payment Method", "Status", "Total (USD)"]
    ];

    selectedOrders.forEach(o => {
      const itemsCount = o.items?.reduce((sum: number, i: any) => sum + (i.quantity || i.qty || 1), 0) || 0;
      csvRows.push([
        o.orderNumber || o.id,
        new Date(o.createdAt).toLocaleString(),
        itemsCount.toString(),
        o.paymentMethod || 'N/A',
        o.status,
        Number(o.total).toFixed(2)
      ]);
    });

    const csvContent = "data:text/csv;charset=utf-8," + csvRows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Selected_Orders_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <>
      <header className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Order History</h2>
          <p className="text-sm text-gray-500 mt-1">Review past transactions and export financial reports.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
          <div className="flex bg-gray-100 p-1 rounded-xl w-full sm:w-auto overflow-x-auto no-scrollbar [-webkit-overflow-scrolling:touch]">
            {['All', 'Today', 'Completed', 'Cancelled', 'Unpaid'].map(f => (
              <button 
                key={f} 
                onClick={() => { setOrderFilter(f); setSelectedIds(new Set()); }} 
                className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${orderFilter === f ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                {f}
              </button>
            ))}
          </div>
          
          <button 
            onClick={() => setShowExportPanel(!showExportPanel)}
            className={`flex justify-center items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all border ${showExportPanel ? 'bg-gray-900 text-white border-gray-900 shadow-md' : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-50 active:scale-95'}`}
          >
            <FileSpreadsheet size={16} className={showExportPanel ? 'text-gray-300' : 'text-green-600'} />
            {showExportPanel ? 'Close Export' : 'Export Excel'}
          </button>
        </div>
      </header>

      {/* TOP METRICS CARDS (Styled exactly to match the mockup) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-5 rounded-[18px] border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center shrink-0">
             <ClipboardList size={22} className="text-gray-600" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Total Order</p>
            <h3 className="text-2xl font-black text-gray-900">{totalOrderCount.toLocaleString()}</h3>
          </div>
        </div>
        <div className="bg-white p-5 rounded-[18px] border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center shrink-0">
             <span className="font-bold text-gray-700 text-xl">$</span>
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Product Sold (USD)</p>
            <h3 className="text-2xl font-black text-gray-900">${totalRevenueUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
          </div>
        </div>
        <div className="bg-white p-5 rounded-[18px] border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center shrink-0">
             <span className="font-bold text-gray-700 text-xl">៛</span>
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Product Sold (KHR)</p>
            <h3 className="text-2xl font-black text-gray-900">{totalRevenueKHR.toLocaleString()} ៛</h3>
          </div>
        </div>
      </div>

      {/* SEARCH AND DATE FILTERS (Combined Date Box to match mockup) */}
      <div className="flex flex-col lg:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search size={16} className="text-gray-400" />
          </div>
          <input 
            type="text" 
            placeholder="Search by Order ID..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl outline-none focus:border-gray-300 focus:ring-4 focus:ring-gray-100 text-[13px] font-bold text-gray-700 shadow-sm transition-all placeholder:text-gray-400 placeholder:font-medium"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600">
              <X size={16} />
            </button>
          )}
        </div>
        
        <div className="flex items-center w-full lg:w-auto bg-white border border-gray-200 rounded-xl px-2 shadow-sm h-[42px]">
          <input 
            type="date" 
            value={filterStartDate}
            onChange={(e) => setFilterStartDate(e.target.value)}
            className="w-full lg:w-[130px] bg-transparent outline-none text-[13px] font-medium text-gray-600 px-2 cursor-pointer"
            title="Start Date"
          />
          <span className="text-gray-400 text-[11px] font-bold px-2">to</span>
          <input 
            type="date" 
            value={filterEndDate}
            onChange={(e) => setFilterEndDate(e.target.value)}
            className="w-full lg:w-[130px] bg-transparent outline-none text-[13px] font-medium text-gray-600 px-2 cursor-pointer"
            title="End Date"
          />
        </div>
      </div>

      {/* EXPORT DROPDOWN PANEL */}
      {showExportPanel && (
        <div className="mb-6 p-5 sm:p-6 bg-gray-50 border border-gray-200 rounded-2xl animate-in fade-in slide-in-from-top-2">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Generate Report</h3>
              <p className="text-xs text-gray-500 mt-0.5">Select a period to download your Excel data.</p>
            </div>
            <button onClick={() => setShowExportPanel(false)} className="text-gray-400 hover:text-gray-600 p-1 bg-white rounded-full border border-gray-200 shadow-sm active:scale-95">
              <X size={16} />
            </button>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {["daily", "monthly", "yearly", "custom"].map((t) => (
                <button
                  key={t}
                  onClick={() => setReportType(t as ReportType)}
                  className={`py-2.5 rounded-xl text-xs font-bold capitalize transition-all ${
                    reportType === t
                      ? "bg-white text-gray-900 shadow-sm border border-gray-200"
                      : "bg-transparent text-gray-500 hover:bg-gray-200 hover:text-gray-700 border border-transparent"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {reportType === "custom" && (
              <div className="flex flex-col sm:flex-row gap-3 animate-in fade-in duration-200">
                <div className="flex-1">
                  <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1.5">Start Date</label>
                  <input
                    type="date"
                    value={exportStartDate}
                    onChange={(e) => setExportStartDate(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-gray-900 text-sm font-medium shadow-sm"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1.5">End Date</label>
                  <input
                    type="date"
                    value={exportEndDate}
                    onChange={(e) => setExportEndDate(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-gray-900 text-sm font-medium shadow-sm"
                  />
                </div>
              </div>
            )}

            <button
              onClick={handleDownload}
              disabled={isExporting}
              className="w-full py-3 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-gray-800 disabled:opacity-70 transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-sm"
            >
              {isExporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
              {isExporting ? "Generating Excel..." : "Download Data"}
            </button>
          </div>
        </div>
      )}

      {/* BULK DELETE CONFIRMATION MODAL */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white rounded-[32px] p-6 md:p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-full flex items-center justify-center mb-5 bg-red-100">
              <Trash2 size={24} className="text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Delete {selectedIds.size} Orders?</h3>
            <p className="text-gray-500 text-sm mb-8 leading-relaxed">
              Are you sure you want to permanently delete these selected orders? This action cannot be undone.
            </p>
            <div className="flex gap-3 w-full">
              <button onClick={() => setShowDeleteModal(false)} disabled={isBulkDeleting} className="flex-1 py-3.5 px-4 bg-gray-100 text-gray-700 rounded-xl font-bold active:scale-95 transition-all text-sm">Cancel</button>
              <button onClick={handleBulkDelete} disabled={isBulkDeleting} className="flex-1 py-3.5 px-4 bg-[#ff3b3b] text-white rounded-xl font-bold hover:bg-red-600 active:scale-95 transition-all text-sm flex items-center justify-center gap-2">
                {isBulkDeleting && <Loader2 size={14} className="animate-spin" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MAIN TABLE DATA UI */}
      <div className="bg-white rounded-[18px] border border-gray-200 shadow-sm overflow-hidden">
        
        {/* Bulk Action Bar (Matches Mockup) */}
        {selectedIds.size > 0 && (
          <div className="bg-[#f4f7fc] px-5 py-3.5 border-b border-[#e6edf7] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in slide-in-from-top-2">
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">{selectedIds.size}</div>
              <span className="text-[13px] font-extrabold text-[#1e3a8a]">Orders Selected</span>
            </div>
            <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <button onClick={handleExportSelected} className="flex-1 sm:flex-none px-4 py-2 bg-white border border-gray-300 rounded-lg text-xs font-bold text-gray-700 shadow-sm hover:bg-gray-50 transition-colors">
                  Export Selected
                </button>
                <button onClick={() => setShowDeleteModal(true)} className="flex-1 sm:flex-none px-4 py-2 bg-[#ff3b3b] text-white rounded-lg text-xs font-bold shadow-sm hover:bg-[#e63535] transition-colors flex items-center justify-center gap-1.5">
                  <Trash2 size={14} /> Delete
                </button>
            </div>
          </div>
        )}

        {/* Table Header (Desktop Only) */}
        <div className="hidden md:flex items-center px-4 py-4 bg-white border-b border-gray-100 text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">
           <div className="w-[30%] min-w-[200px] flex items-center gap-3">
             <div className="shrink-0 pl-1">
                <input 
                  type="checkbox" 
                  checked={selectedIds.size === filteredOrders.length && filteredOrders.length > 0} 
                  onChange={handleSelectAll} 
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600 cursor-pointer accent-blue-600" 
                />
             </div>
             <span>Order</span>
           </div>
           <div className="w-[15%]">Total Items</div>
           <div className="w-[20%]">Payment Option</div>
           <div className="w-[15%]">Status</div>
           <div className="w-[20%] flex justify-end pr-[65px]">Price</div>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-gray-100">
          {filteredOrders.map((order) => (
            <OrderHistoryCard 
              key={order.id} 
              order={order} 
              shopName={settingsName} 
              printerUrl={printerUrl}
              qrImage={qrImage}
              isSelected={selectedIds.has(order.id)}
              onToggleSelect={handleToggleSelect}
            />
          ))}
          
          {filteredOrders.length === 0 && (
            <div className="py-20 text-center">
              <ClipboardList size={32} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500 font-medium">No orders match this filter.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}