// src/features/admin/tabs/OrdersTab.tsx
'use client';

import React, { useState } from 'react';
import { ClipboardList, Download, Loader2, FileSpreadsheet, X } from 'lucide-react';
import OrderHistoryCard from "@/features/pos/OrderHistoryCard";

interface OrdersTabProps {
  shopId: string; // <-- Added shopId to pass to the API
  orders: any[];
  orderFilter: string;
  setOrderFilter: (filter: string) => void;
  settingsName: string;
  printerUrl: string;
}

type ReportType = "daily" | "monthly" | "yearly" | "custom";

export default function OrdersTab({
  shopId,
  orders,
  orderFilter,
  setOrderFilter,
  settingsName,
  printerUrl
}: OrdersTabProps) {
  
  // Export Panel State
  const [showExportPanel, setShowExportPanel] = useState(false);
  const [reportType, setReportType] = useState<ReportType>("daily");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  const filteredOrders = orders?.filter(o => {
    if (orderFilter === 'Completed') return o.status !== 'CANCELLED';
    if (orderFilter === 'Cancelled') return o.status === 'CANCELLED';
    if (orderFilter === 'Today') {
      const today = new Date().toDateString();
      return new Date(o.createdAt).toDateString() === today;
    }
    return true; 
  }) || [];

  const handleDownload = async () => {
    setIsExporting(true);
    try {
      const params = new URLSearchParams({ type: reportType, shopId });
      
      if (reportType === "custom") {
        if (!startDate || !endDate) {
          alert("Please select both start and end dates.");
          setIsExporting(false);
          return;
        }
        params.append("start", startDate);
        params.append("end", endDate);
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
      
      setShowExportPanel(false); // Close panel on success
    } catch (error) {
      console.error(error);
      alert("Error downloading the report. Please try again.");
    } finally {
      setIsExporting(false);
    }
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
            {['All', 'Today', 'Completed', 'Cancelled'].map(f => (
              <button 
                key={f} 
                onClick={() => setOrderFilter(f)} 
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
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-gray-900 text-sm font-medium shadow-sm"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1.5">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
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

      <div className="space-y-4">
        {filteredOrders.map((order) => (
          <OrderHistoryCard 
            key={order.id} 
            order={order} 
            shopName={settingsName} 
            printerUrl={printerUrl} 
          />
        ))}
        
        {filteredOrders.length === 0 && (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm py-16 text-center">
            <ClipboardList size={32} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">No orders match this filter.</p>
          </div>
        )}
      </div>
    </>
  );
}