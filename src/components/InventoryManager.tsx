"use client";

import React, { useState, useEffect, useMemo } from "react";
import { AlertTriangle, X, Search, Copy, CheckCircle2, ChevronDown, Loader2, Plus, Package, Trash2 } from "lucide-react";
import { adjustStockAction, createIngredient, getInventory, deleteInventoryItem } from "@/lib/actions";

type AdjustmentReason = "Restock" | "Sold" | "Waste" | "Manual";

// --- Custom Debounce Hook ---
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
  
  // --- BULLETPROOF STATE MANAGEMENT ---
  // Start with server data for an instant load, then manage it locally to prevent Next.js cache glitches.
  const [localIngredients, setLocalIngredients] = useState<any[]>(ingredients);
  const [localLogs, setLocalLogs] = useState<any[]>(stockLogs);
  const [isProcessing, setIsProcessing] = useState(false);

  // Silently fetches the absolute latest DB data in the background
  const syncWithServer = async () => {
    const data = await getInventory();
    if (data.ingredients) setLocalIngredients(data.ingredients);
    if (data.logs) setLocalLogs(data.logs);
  };

  // Run a silent sync when the component first mounts just to be safe
  useEffect(() => {
    syncWithServer();
  }, []);

  // Search & Filter State
  const [cardSearch, setCardSearch] = useState("");
  const debouncedSearch = useDebounce(cardSearch, 300);
  
  const [cardFilter, setCardFilter] = useState<"All" | "Low">("All");
  const [logFilter, setLogFilter] = useState<"All" | AdjustmentReason>("All");
  const [logVisibleCount, setLogVisibleCount] = useState(10);
  
  // Modals State
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

  // Delete Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{id: string, name: string} | null>(null);

  // --- Memoized Filtering ---
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

  const paginatedLog = useMemo(() => {
    const filtered = localLogs.filter(entry => logFilter === "All" ? true : entry.reason === logFilter);
    return {
      items: filtered.slice(0, logVisibleCount),
      total: filtered.length
    };
  }, [localLogs, logFilter, logVisibleCount]);

  // --- HANDLERS ---
  const openModal = (item: any, mode: "restock" | "adjust") => {
    if (item.id.startsWith("temp-")) {
      alert("This item is still being saved to the database. Please wait a few seconds.");
      return;
    }
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

    // 1. INSTANT UI UPDATE
    setLocalIngredients(prev => prev.map(item => item.id === selectedItem.id ? { ...item, current: expectedNewStock } : item));
    setLocalLogs(prev => [
      {
        id: tempLogId,
        ingredientName: selectedItem.name,
        change: changeAmount,
        reason: reason,
        staffName: userName,
        newStock: expectedNewStock,
        timestamp: new Date()
      },
      ...prev
    ]);
    setIsModalOpen(false); 

    // 2. BACKGROUND DATABASE UPDATE
    const res = await adjustStockAction(selectedItem.id, changeAmount, reason, userName);
    if (res.success) {
      await syncWithServer(); // Pull the real timestamp and ID from database
    } else {
      alert(res.error || "Failed to adjust stock. Changes reverted.");
      await syncWithServer(); // Revert back to DB truth if it failed
    }
    setIsProcessing(false);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName || !newItemUnit || newItemMax === "" || newItemThreshold === "" || isProcessing) return;
    
    setIsProcessing(true);
    const maxNum = Number(newItemMax);
    const thresholdNum = Number(newItemThreshold);
    const tempId = `temp-${Date.now()}`;

    // 1. INSTANT UI UPDATE
    const tempItem = {
      id: tempId,
      name: newItemName,
      unit: newItemUnit,
      current: maxNum,
      max: maxNum,
      lowThreshold: thresholdNum
    };
    
    setLocalIngredients(prev => [...prev, tempItem].sort((a, b) => a.name.localeCompare(b.name)));
    setIsCreateModalOpen(false);

    // 2. BACKGROUND DATABASE UPDATE
    const res = await createIngredient({
      name: newItemName, 
      unit: newItemUnit, 
      max: maxNum, 
      lowThreshold: thresholdNum
    });

    if (res.success) {
      setNewItemName(""); 
      setNewItemUnit("kg"); 
      setNewItemMax(""); 
      setNewItemThreshold(20);
      await syncWithServer(); // Securely replaces the 'temp' ID with the real database ID
    } else {
      alert(res.error || "Failed to create ingredient");
      await syncWithServer(); // Revert back to DB truth if it failed
    }
    setIsProcessing(false);
  };

  const executeDelete = async () => {
    if (!itemToDelete || isProcessing) return;

    setIsProcessing(true);
    const id = itemToDelete.id;
    
    // 1. Optimistic UI update
    setLocalIngredients(prev => prev.filter(item => item.id !== id));
    setIsDeleteModalOpen(false); // Close early for a snappy feel

    // 2. Database update
    const res = await deleteInventoryItem(id);
    if (!res.success) {
      alert(res.error || "Failed to delete item.");
      await syncWithServer(); // Revert back to DB truth if it failed
    }
    
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
      
      {lowStockItems.length > 0 && (
        <div className="mb-8 bg-red-50 border border-red-100 rounded-3xl p-5 shadow-sm flex flex-col md:flex-row md:items-start justify-between gap-4">
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

      {/* STOCK LEVELS SECTION */}
      <div className="mb-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
          
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-gray-900">Stock Levels</h2>
            <button onClick={() => setIsCreateModalOpen(true)} className="flex items-center gap-1.5 bg-gray-900 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-gray-800 transition-all active:scale-95 shadow-sm">
              <Plus size={14} strokeWidth={3} /> Add New Item
            </button>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <div className="flex bg-gray-100 p-1.5 rounded-xl w-full sm:w-auto">
              <button onClick={() => setCardFilter("All")} className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all ${cardFilter === "All" ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>All Items</button>
              <button onClick={() => setCardFilter("Low")} className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all ${cardFilter === "Low" ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Low Stock</button>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input placeholder="Search items..." value={cardSearch} onChange={(e) => setCardSearch(e.target.value)} className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-medium outline-none focus:ring-2 focus:ring-gray-900 transition-all shadow-sm" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {displayedIngredients.map(item => {
            const pct = (item.current / item.max) * 100;
            const isLow = pct < item.lowThreshold;
            return (
              <div key={item.id} className={`bg-white rounded-2xl p-5 shadow-sm transition-all duration-200 flex flex-col ${isLow ? 'border-2 border-red-400' : 'border border-gray-200'}`}>
                <div className="flex justify-between items-start mb-1 gap-2">
                  <h3 className="font-extrabold text-gray-900 text-sm truncate flex-1">{item.name}</h3>
                  <div className="flex items-center gap-2 shrink-0">
                    {isLow && <span className="bg-red-50 text-red-600 text-[10px] font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider border border-red-100">LOW</span>}
                    <button 
                      onClick={() => {
                        if (item.id.startsWith("temp-")) {
                          alert("This item is still being saved to the database. Please wait a few seconds.");
                          return;
                        }
                        setItemToDelete({ id: item.id, name: item.name });
                        setIsDeleteModalOpen(true);
                      }} 
                      disabled={isProcessing}
                      className="text-gray-300 hover:text-red-500 hover:bg-red-50 p-1 rounded-md transition-colors disabled:opacity-50" 
                      title="Delete Item"
                    >
                      <Trash2 size={14} strokeWidth={2.5} />
                    </button>
                  </div>
                </div>
                <p className="text-xs text-gray-500 font-semibold mb-4">{item.current.toFixed(1)} / {item.max} {item.unit}</p>
                <div className="w-full bg-gray-100 rounded-full h-2 mb-2 overflow-hidden mt-auto">
                  <div className={`h-full rounded-full transition-all duration-500 ${isLow ? 'bg-red-500' : 'bg-gray-900'}`} style={{ width: `${Math.min(100, Math.max(0, pct))}%` }} />
                </div>
                <p className="text-[11px] text-gray-400 font-bold mb-5">{Math.round(pct)}% capacity</p>
                <div className="flex gap-2">
                  <button onClick={() => openModal(item, "restock")} className="flex-1 bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold py-2.5 rounded-xl transition-all active:scale-[0.98] shadow-sm">+ Restock</button>
                  <button onClick={() => openModal(item, "adjust")} className="flex-1 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 text-xs font-bold py-2.5 rounded-xl transition-all active:scale-[0.98]">− Adjust</button>
                </div>
              </div>
            );
          })}
          {displayedIngredients.length === 0 && (
            <div className="col-span-full py-16 text-center bg-white rounded-2xl border border-gray-200 shadow-sm">
              <Package size={32} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-900 font-bold text-sm">No items found</p>
              <p className="text-gray-400 font-medium text-xs mt-1">Click "Add New Item" to create your first stock item.</p>
            </div>
          )}
        </div>
      </div>

      {/* ADJUSTMENT LOG */}
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

      {/* MODAL 1: UPDATE/ADJUST EXISTING ITEM */}
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

      {/* MODAL 2: CREATE NEW ITEM */}
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
                  <input 
                    type="text" 
                    value={newItemName} 
                    onChange={(e) => setNewItemName(e.target.value)} 
                    required 
                    placeholder="e.g. Espresso Beans" 
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl font-bold text-gray-900 text-sm outline-none focus:border-gray-900 focus:ring-2 focus:ring-gray-900/20 transition-all shadow-sm" 
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Max Capacity</label>
                    <input 
                      type="number" 
                      step="0.1" 
                      min="0.1" 
                      value={newItemMax} 
                      onChange={(e) => setNewItemMax(e.target.value ? Number(e.target.value) : "")} 
                      required 
                      placeholder="e.g. 20" 
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl font-bold text-gray-900 text-sm outline-none focus:border-gray-900 focus:ring-2 focus:ring-gray-900/20 transition-all shadow-sm" 
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Unit</label>
                    <select 
                      value={newItemUnit} 
                      onChange={(e) => setNewItemUnit(e.target.value)} 
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl font-bold text-gray-700 text-sm outline-none focus:border-gray-900 focus:ring-2 focus:ring-gray-900/20 transition-all shadow-sm cursor-pointer"
                    >
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
                    <input 
                      type="number" 
                      min="1" 
                      max="99" 
                      value={newItemThreshold} 
                      onChange={(e) => setNewItemThreshold(e.target.value ? Number(e.target.value) : "")} 
                      required 
                      placeholder="e.g. 20" 
                      className="w-full pl-4 pr-10 py-3 bg-white border border-gray-200 rounded-xl font-bold text-gray-900 text-sm outline-none focus:border-gray-900 focus:ring-2 focus:ring-gray-900/20 transition-all shadow-sm" 
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">%</span>
                  </div>
                  <p className="text-[10px] text-gray-400 font-medium mt-1.5 ml-1">You will be alerted when stock drops below this %.</p>
                </div>
              </div>
              <button type="submit" disabled={isProcessing} className="w-full bg-gray-900 hover:bg-gray-800 text-white font-bold py-4 rounded-xl shadow-md transition-all active:scale-[0.98] text-[15px] disabled:opacity-50">
                {isProcessing ? <Loader2 className="animate-spin mx-auto" size={20} /> : "Create Item"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: DELETE CONFIRMATION */}
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
              <button 
                onClick={() => setIsDeleteModalOpen(false)} 
                disabled={isProcessing}
                className="flex-1 py-3.5 px-4 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 active:scale-95 transition-all text-[16px] md:text-sm disabled:opacity-50"
              >
                Cancel
              </button>
              <button 
                onClick={executeDelete} 
                disabled={isProcessing}
                className="flex-1 py-3.5 px-4 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 active:scale-95 transition-all flex items-center justify-center text-[16px] md:text-sm disabled:opacity-50"
              >
                {isProcessing ? <Loader2 className="animate-spin" size={18} /> : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}