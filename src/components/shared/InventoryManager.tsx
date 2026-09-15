// src/features/admin/tabs/InventoryManager.tsx
"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { AlertTriangle, X, Search, Copy, CheckCircle2, ChevronDown, Loader2, Plus, Package, Trash2, MoreHorizontal, Download, Upload, FileSpreadsheet } from "lucide-react";
import { adjustStockAction, createIngredient, getInventory, deleteInventoryItem, executeInventoryImport } from "@/lib/actions";
import * as XLSX from 'xlsx';

type AdjustmentReason = "Restock" | "Sold" | "Waste" | "Manual";

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export default function InventoryManager({ 
  userName = "Admin",
  ingredients = [],
  stockLogs = []
}: { 
  userName?: string;
  ingredients?: any[];
  stockLogs?: any[];
}) {
  
  const [localIngredients, setLocalIngredients] = useState<any[]>(ingredients);
  const [localLogs, setLocalLogs] = useState<any[]>(stockLogs);
  const [isProcessing, setIsProcessing] = useState(false);

  const syncWithServer = async () => {
    const data = await getInventory();
    if (data.ingredients) setLocalIngredients(data.ingredients);
    if (data.logs) setLocalLogs(data.logs);
  };

  useEffect(() => { syncWithServer(); }, []);

  // Filter, Search & Pagination States
  const [cardSearch, setCardSearch] = useState("");
  const debouncedSearch = useDebounce(cardSearch, 300);
  const [cardFilter, setCardFilter] = useState<"All" | "Low">("All");
  const [currentPage, setCurrentPage] = useState(1);
  
  const [logFilter, setLogFilter] = useState<"All" | AdjustmentReason>("All");
  const [logVisibleCount, setLogVisibleCount] = useState(10);
  
  // UX Header Menu State
  const [menuOpen, setMenuOpen] = useState(false);

  // Import State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importPreview, setImportPreview] = useState<any[]>([]);
  const [importErrors, setImportErrors] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Existing Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [adjustmentMode, setAdjustmentMode] = useState<"restock" | "adjust">("restock");
  const [amount, setAmount] = useState<number | "">("");
  const [reason, setReason] = useState<AdjustmentReason>("Restock");
  const [copied, setCopied] = useState(false);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newItemName, setNewItemName] = useState("");
  const [newItemUnit, setNewItemUnit] = useState("kg");
  const [newItemMax, setNewItemMax] = useState<number | "">("");
  const [newItemThreshold, setNewItemThreshold] = useState<number | "">(20);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{id: string, name: string} | null>(null);

  // Reset pagination when search or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, cardFilter]);

  // --- MEMOS ---
  const lowStockItems = useMemo(() => {
    return localIngredients.filter(ing => (ing.current / ing.max) * 100 < ing.lowThreshold);
  }, [localIngredients]);

  const displayedIngredients = useMemo(() => {
    const searchLower = debouncedSearch.toLowerCase();
    return localIngredients.filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(searchLower);
      const pct = (item.current / item.max) * 100;
      const matchesFilter = cardFilter === "All" ? true : pct < item.lowThreshold;
      return matchesSearch && matchesFilter;
    });
  }, [localIngredients, debouncedSearch, cardFilter]);

  // Pagination Logic (10 per page)
  const itemsPerPage = 10;
  const totalPages = Math.max(1, Math.ceil(displayedIngredients.length / itemsPerPage));
  const paginatedIngredients = displayedIngredients.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const paginatedLog = useMemo(() => {
    const filtered = localLogs.filter(entry => logFilter === "All" ? true : entry.reason === logFilter);
    return { items: filtered.slice(0, logVisibleCount), total: filtered.length };
  }, [localLogs, logFilter, logVisibleCount]);


  // --- EXCEL IMPORT/EXPORT WORKFLOW ---

  const handleDownloadTemplate = () => {
    const templateData = [{
      "Item Name": "Example Coffee Beans",
      "Unit": "kg",
      "Current Stock": 10,
      "Max Capacity": 20,
      "Low Alert Threshold (%)": 20
    }];
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "Inventory_Import_Template.xlsx");
    setMenuOpen(false);
  };

  const handleExportStock = () => {
    const exportData = localIngredients.map(ing => ({
      "Item Name": ing.name,
      "Unit": ing.unit,
      "Current Stock": ing.current,
      "Max Capacity": ing.max,
      "Low Alert Threshold (%)": ing.lowThreshold
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Inventory");
    XLSX.writeFile(wb, `Inventory_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
    setMenuOpen(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        const parsed: any[] = [];
        let errorCount = 0;

        data.forEach((row: any, idx: number) => {
          const name = row["Item Name"]?.toString().trim();
          const unit = row["Unit"]?.toString().trim();
          const current = Number(row["Current Stock"]);
          const max = Number(row["Max Capacity"]);
          const lowThreshold = Number(row["Low Alert Threshold (%)"]);

          let status = 'create';
          let errorMsg = '';
          let matchedId = undefined;

          if (!name) errorMsg += 'Missing Name. ';
          if (!unit) errorMsg += 'Missing Unit. ';
          if (isNaN(current) || current < 0) errorMsg += 'Invalid Current Stock. ';
          if (isNaN(max) || max <= 0) errorMsg += 'Invalid Max Capacity. ';
          if (isNaN(lowThreshold) || lowThreshold < 0 || lowThreshold > 100) errorMsg += 'Invalid Threshold. ';

          if (name) {
            const existing = localIngredients.find(i => i.name.toLowerCase() === name.toLowerCase());
            if (existing) {
              status = 'update';
              matchedId = existing.id; 
            }
          }

          if (errorMsg) {
             status = 'error';
             errorCount++;
          }

          parsed.push({ rowNum: idx + 2, id: matchedId, name, unit, current, max, lowThreshold, status, errorMsg });
        });

        setImportPreview(parsed);
        setImportErrors(errorCount);
      } catch (err) {
        alert("Failed to parse Excel file. Please use the provided template.");
      }
    };
    reader.readAsBinaryString(file);
    if (fileInputRef.current) fileInputRef.current.value = ""; 
  };

  const executeImport = async () => {
    if (importErrors > 0 || isProcessing || importPreview.length === 0) return;
    setIsProcessing(true);

    const payload = importPreview.map(p => ({
      id: p.id, name: p.name, unit: p.unit, current: p.current, max: p.max, lowThreshold: p.lowThreshold
    }));

    const res = await executeInventoryImport(payload);
    if (res.success) {
      await syncWithServer();
      setIsImportModalOpen(false);
      setImportPreview([]);
    } else {
      alert("Import Failed: " + res.error);
    }
    setIsProcessing(false);
  };


  // --- EXISTING HANDLERS ---

  const openModal = (item: any, mode: "restock" | "adjust") => {
    if (item.id.startsWith("temp-")) return alert("This item is still being saved to the database. Please wait.");
    setSelectedItem(item);
    setAdjustmentMode(mode);
    setReason(mode === "restock" ? "Restock" : "Manual");
    setAmount("");
    setIsModalOpen(true);
  };

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem || amount === "" || Number(amount) <= 0 || isProcessing) return;
    
    setIsProcessing(true);
    const changeAmount = adjustmentMode === "restock" ? Number(amount) : -Number(amount);
    const expectedNewStock = Math.max(0, selectedItem.current + changeAmount);
    const tempLogId = `temp-log-${Date.now()}`;

    setLocalIngredients(prev => prev.map(item => item.id === selectedItem.id ? { ...item, current: expectedNewStock } : item));
    setLocalLogs(prev => [{ id: tempLogId, ingredientName: selectedItem.name, change: changeAmount, reason: reason, staffName: userName, newStock: expectedNewStock, timestamp: new Date() }, ...prev]);
    setIsModalOpen(false); 

    const res = await adjustStockAction(selectedItem.id, changeAmount, reason, userName);
    if (!res.success) alert(res.error || "Failed to adjust stock. Changes reverted.");
    await syncWithServer(); 
    setIsProcessing(false);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName || !newItemUnit || newItemMax === "" || newItemThreshold === "" || isProcessing) return;
    
    setIsProcessing(true);
    const maxNum = Number(newItemMax);
    const thresholdNum = Number(newItemThreshold);
    
    setIsCreateModalOpen(false);

    const res = await createIngredient({ name: newItemName, unit: newItemUnit, max: maxNum, lowThreshold: thresholdNum });
    if (res.success) {
      setNewItemName(""); setNewItemUnit("kg"); setNewItemMax(""); setNewItemThreshold(20);
    } else {
      alert(res.error || "Failed to create ingredient");
    }
    await syncWithServer(); 
    setIsProcessing(false);
  };

  const executeDelete = async () => {
    if (!itemToDelete || isProcessing) return;
    setIsProcessing(true);
    
    const id = itemToDelete.id;
    setLocalIngredients(prev => prev.filter(item => item.id !== id));
    setIsDeleteModalOpen(false); 

    const res = await deleteInventoryItem(id);
    if (!res.success) alert(res.error || "Failed to delete item.");
    
    await syncWithServer(); 
    setIsProcessing(false);
    setItemToDelete(null);
  };

  const handleCopyRestockList = () => {
    const listText = lowStockItems.map(item => `- ${item.name}: Needs Restock (Currently ${item.current.toFixed(1)} ${item.unit})`).join('\n');
    navigator.clipboard.writeText(`🚨 Restock Required:\n${listText}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getReasonBadge = (r: string) => {
    switch (r) {
      case "Restock": return "bg-emerald-50 text-emerald-600 border border-emerald-100";
      case "Sold": return "bg-blue-50 text-blue-600 border border-blue-100";
      case "Waste": return "bg-red-50 text-red-600 border border-red-100";
      case "Manual": return "bg-gray-100 text-gray-600 border border-gray-200";
      default: return "bg-gray-50 text-gray-500 border border-gray-100";
    }
  };

  return (
    <div className="w-full pb-12 font-sans text-gray-800 animate-in fade-in duration-300">
      
      {/* --- RESPONSIVE TOOLBAR --- */}
      <div className="flex flex-col gap-5 mb-8">
         <div className="flex items-center justify-between">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 hidden md:block">Inventory Items</h2>

            {/* Mobile Actions */}
            <div className="flex md:hidden w-full justify-between items-center gap-2 relative">
              <h2 className="text-xl font-bold text-gray-900">Inventory Items</h2>
              <div className="flex items-center gap-2">
                  <button onClick={() => setIsCreateModalOpen(true)} className="flex items-center gap-1.5 bg-gray-900 text-white px-3 py-2 rounded-lg text-xs font-bold shadow-sm active:scale-95">
                    <Plus size={14} /> Add Item
                  </button>
                  <div className="relative">
                    <button onClick={() => setMenuOpen(!menuOpen)} className="p-2 bg-white border border-gray-200 text-gray-700 rounded-lg active:scale-95"><MoreHorizontal size={16}/></button>
                    {menuOpen && (
                      <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 shadow-xl rounded-xl overflow-hidden z-50">
                         <button onClick={() => { setIsImportModalOpen(true); setMenuOpen(false); }} className="w-full text-left px-4 py-3 text-xs font-bold hover:bg-gray-50 border-b flex items-center gap-2"><Upload size={14}/> Import Excel</button>
                         <button onClick={handleExportStock} className="w-full text-left px-4 py-3 text-xs font-bold hover:bg-gray-50 border-b flex items-center gap-2"><Download size={14}/> Export All Stock</button>
                         <button onClick={handleDownloadTemplate} className="w-full text-left px-4 py-3 text-xs font-bold hover:bg-gray-50 text-blue-600 flex items-center gap-2"><FileSpreadsheet size={14}/> Download Template</button>
                      </div>
                    )}
                  </div>
              </div>
            </div>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center gap-2">
              <div className="relative">
                <button onClick={() => setMenuOpen(!menuOpen)} className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2.5 rounded-lg text-sm font-bold shadow-sm hover:bg-gray-50 transition-colors active:scale-95">
                  <Upload size={16} /> Import / Export <ChevronDown size={14} className="ml-1 text-gray-400" />
                </button>
                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 shadow-xl rounded-xl overflow-hidden z-50">
                     <button onClick={() => { setIsImportModalOpen(true); setMenuOpen(false); }} className="w-full text-left px-4 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50 border-b">Import Items</button>
                     <button onClick={handleExportStock} className="w-full text-left px-4 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50 border-b">Export Items</button>
                     <button onClick={handleDownloadTemplate} className="w-full text-left px-4 py-3 text-sm font-bold text-gray-500 hover:bg-gray-50 bg-gray-50/50">Download Excel Template</button>
                  </div>
                )}
              </div>
              <button onClick={() => setIsCreateModalOpen(true)} className="flex items-center gap-1.5 bg-[#4c1d95] text-white px-5 py-2.5 rounded-lg text-sm font-bold shadow-sm hover:bg-[#3b1575] transition-colors active:scale-95 ml-2">
                Create Item
              </button>
            </div>
         </div>
      </div>

      {lowStockItems.length > 0 && (
        <div className="mb-8 bg-red-50 border border-red-100 rounded-xl p-5 shadow-sm flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle size={20} className="text-red-500" strokeWidth={2.5} />
              <h2 className="font-extrabold text-red-600 text-sm">Low Stock Alerts — {lowStockItems.length} items need attention</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {lowStockItems.map(item => (
                <div key={item.id} className="bg-orange-500 text-white text-[11px] font-bold px-3 py-1.5 rounded-full shadow-sm flex items-center gap-1.5 tracking-wide">
                  <span>{item.name}</span>
                  <span className="opacity-90 font-medium">{item.current.toFixed(1)} {item.unit} ({Math.round((item.current / item.max) * 100)}%)</span>
                </div>
              ))}
            </div>
          </div>
          <button onClick={handleCopyRestockList} className={`shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm active:scale-95 ${copied ? 'bg-emerald-500 text-white border border-emerald-500' : 'bg-white border border-red-200 text-red-600 hover:bg-red-50'}`}>
            {copied ? <CheckCircle2 size={16} /> : <Copy size={16} />}
            {copied ? 'List Copied!' : 'Copy Restock List'}
          </button>
        </div>
      )}

      {/* --- TABLE LIST VIEW --- */}
      <div className="mb-12 bg-white border border-gray-200 rounded-[12px] shadow-sm overflow-hidden flex flex-col">
        
        {/* Table Toolbar */}
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white">
            <div className="flex w-full sm:w-auto overflow-x-auto no-scrollbar gap-6 px-2">
              <button onClick={() => setCardFilter("All")} className={`pb-3 text-[13px] font-extrabold transition-all border-b-[3px] whitespace-nowrap ${cardFilter === "All" ? 'text-gray-900 border-gray-900' : 'text-gray-400 border-transparent hover:text-gray-600'}`}>All Items</button>
              <button onClick={() => setCardFilter("Low")} className={`pb-3 text-[13px] font-extrabold transition-all border-b-[3px] whitespace-nowrap ${cardFilter === "Low" ? 'text-gray-900 border-gray-900' : 'text-gray-400 border-transparent hover:text-gray-600'}`}>Low Stock</button>
            </div>
            <div className="relative w-full sm:w-72">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
               <input placeholder="Search items..." value={cardSearch} onChange={(e) => setCardSearch(e.target.value)} className="w-full pl-9 pr-4 py-2 rounded-md border border-gray-200 bg-white text-[13px] font-medium outline-none focus:ring-1 focus:ring-gray-300 transition-all shadow-sm" />
            </div>
        </div>

        {/* The Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-white border-b border-gray-200 text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">
                <th className="p-4 pl-6 w-[5%]">No.</th>
                <th className="p-4 w-[30%]">Name</th>
                <th className="p-4 w-[25%]">Stock Level</th>
                <th className="p-4 w-[15%]">Status</th>
                <th className="p-4 text-right pr-6 w-[25%]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedIngredients.map((item, idx) => {
                const pct = (item.current / item.max) * 100;
                const isLow = pct < item.lowThreshold;
                const rowIndex = (currentPage - 1) * itemsPerPage + idx + 1;
                
                return (
                  <tr key={item.id} className="hover:bg-gray-50/50 transition-colors group">
                    {/* Index / Order Number */}
                    <td className="p-4 pl-6 font-bold text-gray-400 text-[12px]">
                      {rowIndex}
                    </td>

                    {/* Item Name */}
                    <td className="p-4 font-extrabold text-gray-900 text-[13px]">
                      {item.name}
                    </td>
                    
                    {/* Stock Level with Solid Bottom Bar */}
                    <td className="p-4 flex flex-col justify-center pt-5">
                      <span className="text-[13px] font-extrabold text-gray-900 mb-1">
                        {item.current.toFixed(1)} / {item.max} <span className="text-gray-400 font-medium text-xs ml-0.5">{item.unit}</span>
                      </span>
                      {/* Only showing the filled color bar per your design */}
                      <div 
                        className={`h-1.5 mt-0.5 rounded-full transition-all duration-500 ${isLow ? 'bg-[#ff3b3b]' : 'bg-[#10b981]'}`} 
                        style={{ width: `${Math.min(100, Math.max(0, pct))}%`, maxWidth: '100px' }} 
                      />
                    </td>

                    {/* Status Pill */}
                    <td className="p-4">
                      {isLow ? (
                         <span className="bg-red-50 text-[#ff3b3b] text-[10px] font-extrabold px-2.5 py-1 rounded border border-red-100 tracking-wider">LOW</span>
                      ) : (
                         <span className="bg-emerald-50 text-[#10b981] text-[10px] font-extrabold px-2.5 py-1 rounded border border-emerald-100 tracking-wider">GOOD</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="p-4 pr-6">
                      <div className="flex items-center justify-end gap-1.5">
                        <button onClick={() => openModal(item, "restock")} className="px-3 py-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-[11px] font-bold rounded-md shadow-sm transition-all active:scale-95 whitespace-nowrap">
                          + Restock
                        </button>
                        <button onClick={() => openModal(item, "adjust")} className="px-3 py-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-[11px] font-bold rounded-md shadow-sm transition-all active:scale-95 whitespace-nowrap">
                          − Adjust
                        </button>
                        <div className="w-px h-4 bg-gray-200 mx-1"></div>
                        <button 
                          onClick={() => {
                            if (item.id.startsWith("temp-")) return alert("Please wait for this item to save.");
                            setItemToDelete({ id: item.id, name: item.name });
                            setIsDeleteModalOpen(true);
                          }} 
                          disabled={isProcessing}
                          className="text-gray-400 hover:text-red-500 p-1.5 rounded transition-colors disabled:opacity-50" 
                          title="Delete Item"
                        >
                          <Trash2 size={16} strokeWidth={2} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {paginatedIngredients.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-16 text-center">
                    <Package size={32} className="mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-900 font-bold text-sm">No items found</p>
                    <p className="text-gray-400 font-medium text-xs mt-1">Adjust your filters or add a new item.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-white">
            <span className="text-xs font-bold text-gray-500">
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, displayedIngredients.length)} of {displayedIngredients.length} entries
            </span>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-gray-200 rounded-md text-xs font-bold text-gray-700 disabled:opacity-50 hover:bg-gray-50 transition-colors shadow-sm"
              >
                Previous
              </button>
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border border-gray-200 rounded-md text-xs font-bold text-gray-700 disabled:opacity-50 hover:bg-gray-50 transition-colors shadow-sm"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ADJUSTMENT LOG (Unchanged) */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
          <h2 className="text-xl font-bold text-gray-900">Adjustment Log</h2>
          <div className="flex bg-gray-100 p-1.5 rounded-xl overflow-x-auto no-scrollbar">
            {(["All", "Restock", "Sold", "Waste", "Manual"] as const).map(filter => (
              <button key={filter} onClick={() => { setLogFilter(filter); setLogVisibleCount(10); }} className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${logFilter === filter ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>{filter}</button>
            ))}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-sm flex flex-col">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100 text-xs font-bold text-gray-400 uppercase tracking-wider">
                  <th className="p-5 pl-6">Timestamp</th><th className="p-5">Ingredient</th><th className="p-5">Change</th><th className="p-5">Reason</th><th className="p-5">Staff</th><th className="p-5 pr-6">Stock After</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paginatedLog.items.map(log => (
                  <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-4 pl-6 text-xs text-gray-500 font-medium">
                      {new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(log.timestamp))}
                    </td>
                    <td className="p-4 text-sm font-bold text-gray-900">{log.ingredientName}</td>
                    <td className={`p-4 text-xs font-black ${log.change > 0 ? 'text-emerald-500' : 'text-red-500'}`}>{log.change > 0 ? '+' : ''}{log.change.toFixed(1)}</td>
                    <td className="p-4"><span className={`px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wide ${getReasonBadge(log.reason)}`}>{log.reason}</span></td>
                    <td className="p-4 text-xs font-semibold text-gray-500">{log.staffName}</td>
                    <td className="p-4 pr-6 text-sm font-bold text-gray-900">{log.newStock.toFixed(1)}</td>
                  </tr>
                ))}
                {paginatedLog.items.length === 0 && (
                  <tr><td colSpan={6} className="p-12 text-center text-sm font-medium text-gray-400">No adjustments found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          
          {paginatedLog.total > paginatedLog.items.length && (
            <div className="p-4 bg-gray-50/50 border-t border-gray-100 flex justify-center">
              <button onClick={() => setLogVisibleCount(prev => prev + 10)} className="flex items-center gap-2 px-6 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-colors shadow-sm active:scale-95">
                Load More <ChevronDown size={16} />
              </button>
            </div>
          )}
        </div>
      </div>


      {/* --- EXCEL IMPORT PREVIEW MODAL --- */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-4xl rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-white shrink-0">
              <div>
                <h3 className="font-bold text-gray-900 text-lg">Import Inventory Excel</h3>
                <p className="text-xs text-gray-500 mt-1">Upload your populated Excel template to bulk update stock.</p>
              </div>
              <button onClick={() => { setIsImportModalOpen(false); setImportPreview([]); setImportErrors(0); }} className="text-gray-400 hover:bg-gray-100 p-2 rounded-full transition-colors active:scale-95"><X size={20} /></button>
            </div>
            
            <div className="p-6 overflow-y-auto bg-gray-50 flex-1">
              {importPreview.length === 0 ? (
                <div className="border-2 border-dashed border-gray-200 rounded-2xl p-12 text-center bg-white flex flex-col items-center justify-center">
                  <Upload size={32} className="text-gray-300 mb-4" />
                  <p className="text-sm font-bold text-gray-900 mb-1">Select Excel File</p>
                  <p className="text-xs text-gray-500 mb-6">Must be .xlsx format generated from the template.</p>
                  <input type="file" accept=".xlsx, .xls" className="hidden" id="excel-upload" ref={fileInputRef} onChange={handleFileUpload} />
                  <label htmlFor="excel-upload" className="bg-gray-900 text-white text-xs font-bold px-5 py-3 rounded-xl cursor-pointer hover:bg-gray-800 transition-colors shadow-sm active:scale-95">
                    Browse Files
                  </label>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex-1">
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Items Found</p>
                      <p className="text-lg font-black text-gray-900">{importPreview.length}</p>
                    </div>
                    <div className="flex-1 border-l border-gray-100 pl-4">
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Action</p>
                      <p className="text-sm font-bold text-gray-700">
                        {importPreview.filter(p => p.status === 'create').length} New / {importPreview.filter(p => p.status === 'update').length} Updates
                      </p>
                    </div>
                    <div className="flex-1 border-l border-gray-100 pl-4">
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Status</p>
                      {importErrors > 0 ? (
                        <p className="text-sm font-bold text-red-600 flex items-center gap-1.5"><AlertTriangle size={14}/> {importErrors} Errors found</p>
                      ) : (
                        <p className="text-sm font-bold text-emerald-600 flex items-center gap-1.5"><CheckCircle2 size={14}/> Ready to Import</p>
                      )}
                    </div>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto max-h-[400px]">
                      <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
                        <thead className="sticky top-0 bg-gray-100 shadow-sm z-10">
                          <tr className="text-gray-500 font-bold uppercase tracking-wider">
                            <th className="p-3 pl-4">Row</th><th className="p-3">Action</th><th className="p-3">Name</th><th className="p-3">Stock</th><th className="p-3">Max</th><th className="p-3">Issues</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {importPreview.map(row => (
                            <tr key={row.rowNum} className={row.status === 'error' ? 'bg-red-50/50' : 'hover:bg-gray-50'}>
                              <td className="p-3 pl-4 font-medium text-gray-400">{row.rowNum}</td>
                              <td className="p-3">
                                {row.status === 'create' && <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded font-bold">CREATE</span>}
                                {row.status === 'update' && <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-bold">UPDATE</span>}
                                {row.status === 'error' && <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded font-bold">ERROR</span>}
                              </td>
                              <td className="p-3 font-bold text-gray-900">{row.name || '—'}</td>
                              <td className="p-3 font-medium text-gray-700">{row.current} {row.unit}</td>
                              <td className="p-3 font-medium text-gray-500">{row.max}</td>
                              <td className="p-3 text-red-600 font-medium">{row.errorMsg || '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  
                  {importErrors > 0 && (
                    <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-xs font-bold text-center">
                      Please fix the errors in your Excel file and upload again.
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-gray-100 bg-white shrink-0 flex gap-3">
               <button onClick={() => { setIsImportModalOpen(false); setImportPreview([]); setImportErrors(0); }} disabled={isProcessing} className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold active:scale-95 transition-all text-sm disabled:opacity-50">Cancel</button>
               <button onClick={executeImport} disabled={importErrors > 0 || importPreview.length === 0 || isProcessing} className="flex-1 py-3 bg-gray-900 text-white rounded-xl font-bold active:scale-95 transition-all text-sm disabled:opacity-50 flex items-center justify-center gap-2">
                 {isProcessing ? <Loader2 size={16} className="animate-spin"/> : "Confirm Import"}
               </button>
            </div>
          </div>
        </div>
      )}


      {/* EXISTING MODALS (Update/Adjust/Create/Delete) UNCHANGED BELOW */}
      {isModalOpen && selectedItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-white">
              <h3 className="font-bold text-gray-900 text-lg">{adjustmentMode === "restock" ? "Restock Item" : "Adjust Inventory"}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:bg-gray-100 p-2 rounded-full transition-colors active:scale-95"><X size={20} /></button>
            </div>
            <form onSubmit={handleAdjustSubmit} className="p-6">
              <div className="mb-6">
                <p className="text-sm font-bold text-gray-900 mb-1">{selectedItem.name}</p>
                <p className="text-xs text-gray-500 font-medium">Current Stock: <span className="font-bold text-gray-700">{selectedItem.current.toFixed(1)} {selectedItem.unit}</span></p>
              </div>
              <div className="space-y-5 mb-8">
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Amount ({selectedItem.unit})</label>
                  <input type="number" step="0.1" min="0.1" value={amount} onChange={(e) => setAmount(e.target.value ? Number(e.target.value) : "")} required placeholder={`e.g. 2.5`} className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl font-bold text-gray-900 text-lg outline-none focus:border-gray-900 focus:ring-2 focus:ring-gray-900/20 transition-all shadow-sm" />
                </div>
                {adjustmentMode === "adjust" && (
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Reason</label>
                    <select value={reason} onChange={(e) => setReason(e.target.value as AdjustmentReason)} className="w-full px-4 py-3.5 bg-white border border-gray-200 rounded-xl font-bold text-gray-700 text-sm outline-none focus:border-gray-900 focus:ring-2 focus:ring-gray-900/20 transition-all shadow-sm cursor-pointer">
                      <option value="Manual">Manual Audit Fix</option>
                      <option value="Waste">Waste / Spilled</option>
                      <option value="Sold">Sold (Manual entry)</option>
                    </select>
                  </div>
                )}
              </div>
              <button type="submit" disabled={isProcessing} className="w-full bg-gray-900 hover:bg-gray-800 text-white font-bold py-4 rounded-xl shadow-md transition-all active:scale-[0.98] text-[15px] disabled:opacity-50">
                {isProcessing ? <Loader2 className="animate-spin mx-auto" size={20} /> : `Confirm ${adjustmentMode === "restock" ? "Restock" : "Adjustment"}`}
              </button>
            </form>
          </div>
        </div>
      )}

      {isCreateModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-white">
              <h3 className="font-bold text-gray-900 text-lg">Add New Item</h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-gray-400 hover:bg-gray-100 p-2 rounded-full transition-colors active:scale-95"><X size={20} /></button>
            </div>
            <form onSubmit={handleCreateSubmit} className="p-6">
              <div className="space-y-4 mb-8">
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Item Name</label>
                  <input type="text" value={newItemName} onChange={(e) => setNewItemName(e.target.value)} required placeholder="e.g. Espresso Beans" className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl font-bold text-gray-900 text-sm outline-none focus:border-gray-900 focus:ring-2 focus:ring-gray-900/20 transition-all shadow-sm" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Max Capacity</label>
                    <input type="number" step="0.1" min="0.1" value={newItemMax} onChange={(e) => setNewItemMax(e.target.value ? Number(e.target.value) : "")} required placeholder="e.g. 20" className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl font-bold text-gray-900 text-sm outline-none focus:border-gray-900 focus:ring-2 focus:ring-gray-900/20 transition-all shadow-sm" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Unit</label>
                    <select value={newItemUnit} onChange={(e) => setNewItemUnit(e.target.value)} className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl font-bold text-gray-700 text-sm outline-none focus:border-gray-900 focus:ring-2 focus:ring-gray-900/20 transition-all shadow-sm cursor-pointer">
                      <option value="kg">kg</option>
                      <option value="liters">liters</option>
                      <option value="pcs">pcs</option>
                      <option value="boxes">boxes</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Low Alert Threshold (%)</label>
                  <div className="relative">
                    <input type="number" min="1" max="99" value={newItemThreshold} onChange={(e) => setNewItemThreshold(e.target.value ? Number(e.target.value) : "")} required placeholder="e.g. 20" className="w-full pl-4 pr-10 py-3 bg-white border border-gray-200 rounded-xl font-bold text-gray-900 text-sm outline-none focus:border-gray-900 focus:ring-2 focus:ring-gray-900/20 transition-all shadow-sm" />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">%</span>
                  </div>
                </div>
              </div>
              <button type="submit" disabled={isProcessing} className="w-full bg-gray-900 hover:bg-gray-800 text-white font-bold py-4 rounded-xl shadow-md transition-all active:scale-[0.98] text-[15px] disabled:opacity-50">
                {isProcessing ? <Loader2 className="animate-spin mx-auto" size={20} /> : "Create Item"}
              </button>
            </form>
          </div>
        </div>
      )}

      {isDeleteModalOpen && itemToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 p-6 md:p-8">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-5">
              <Trash2 size={24} className="text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Item?</h3>
            <p className="text-gray-500 text-sm mb-8 leading-relaxed">
              Are you sure you want to delete <span className="font-bold text-gray-700">"{itemToDelete.name}"</span>? This action cannot be undone.
            </p>
            <div className="flex gap-3 w-full">
              <button onClick={() => setIsDeleteModalOpen(false)} disabled={isProcessing} className="flex-1 py-3.5 px-4 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 active:scale-95 transition-all text-[16px] md:text-sm disabled:opacity-50">Cancel</button>
              <button onClick={executeDelete} disabled={isProcessing} className="flex-1 py-3.5 px-4 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 active:scale-95 transition-all flex items-center justify-center text-[16px] md:text-sm disabled:opacity-50">
                {isProcessing ? <Loader2 className="animate-spin" size={18} /> : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}