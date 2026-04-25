"use client";

import React, { useEffect, useState } from "react";
import { getShopTables, createTable, toggleTableStatus, updateTable, deleteTable } from "@/lib/table-actions";
import { Copy, QrCode, Edit2, Trash2, Check, X, Download, MoreHorizontal, Power, PowerOff, Search } from "lucide-react";

interface TableItem {
  id: string;
  label: string;
  isActive: boolean;
}

export default function TableManager({ shopId, shopSlug }: { shopId: string; shopSlug: string }) {
  const [tables, setTables] = useState<TableItem[]>([]);
  const [newLabel, setNewLabel] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [origin, setOrigin] = useState("");
  
  // Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");

  // Dropdown State
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // QR Modal State
  const [qrModalTable, setQrModalTable] = useState<TableItem | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    setOrigin(window.location.origin);
    fetchTables();
  }, [shopId]);

  const fetchTables = async () => {
    setIsLoading(true);
    const res = await getShopTables(shopId);
    if (res.success && res.data) {
      setTables(res.data);
    }
    setIsLoading(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel.trim()) return;
    const res = await createTable(shopId, newLabel.trim().toUpperCase());
    if (res.success) {
      setNewLabel("");
      fetchTables();
    } else {
      alert(res.message);
    }
  };

  const handleToggle = async (id: string, currentStatus: boolean) => {
    setTables((prev) => prev.map((t) => (t.id === id ? { ...t, isActive: !currentStatus } : t)));
    const res = await toggleTableStatus(id, shopId, !currentStatus);
    if (!res.success) fetchTables(); 
  };

  const handleUpdate = async (id: string) => {
    if (!editLabel.trim()) {
      setEditingId(null);
      return;
    }
    setTables((prev) => prev.map((t) => (t.id === id ? { ...t, label: editLabel.trim().toUpperCase() } : t)));
    setEditingId(null);
    const res = await updateTable(id, shopId, editLabel.trim().toUpperCase());
    if (!res.success) {
      alert(res.message);
      fetchTables(); 
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this table? The QR code will stop working.")) return;
    setTables((prev) => prev.filter((t) => t.id !== id));
    const res = await deleteTable(id, shopId);
    if (!res.success) {
      alert(res.message);
      fetchTables(); 
    }
  };

  const copyToClipboard = (id: string, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const downloadQR = async (url: string, label: string) => {
    try {
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=1000x1000&data=${encodeURIComponent(url)}`;
      const response = await fetch(qrUrl);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${shopSlug}-Table-${label}-QR.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      alert("Failed to download QR code.");
    }
  };

  const filteredTables = tables.filter(t => t.label.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="bg-white rounded-[24px] shadow-sm border border-gray-200 p-6 sm:p-8 w-full max-w-6xl mx-auto">
      {/* SECTION HEADER */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-1 tracking-tight">Tables & QR Codes</h2>
        <p className="text-sm text-gray-500 font-medium">Create tables and generate QR access for each one.</p>
      </div>

      {/* TOOLBAR: SEARCH & ADD */}
      <div className="flex flex-col lg:flex-row gap-4 mb-8">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18}/>
          <input 
            type="text"
            placeholder="Search tables by label..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white outline-none focus:ring-2 focus:ring-gray-900 transition-all text-sm font-medium"
          />
        </div>

        {/* Add Table */}
        <div className="flex-1 lg:max-w-md">
          <form onSubmit={handleCreate} className="flex gap-2">
            <input
              type="text"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="e.g. T01, VIP-1"
              className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:bg-white text-sm font-medium transition-all uppercase placeholder:normal-case"
            />
            <button type="submit" disabled={!newLabel.trim()} className="px-6 py-3 bg-gray-900 text-white font-bold text-sm rounded-xl hover:bg-gray-800 disabled:opacity-50 transition-all active:scale-[0.98] whitespace-nowrap shadow-sm">
              Add Table
            </button>
          </form>
          <p className="text-[11px] text-gray-500 mt-2 ml-1 font-medium">Each table gets a unique customer link and QR code.</p>
        </div>
      </div>

      {/* TABLE GRID */}
      {isLoading ? (
        <div className="py-16 text-center text-gray-500 flex flex-col items-center">
          <div className="w-8 h-8 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin mb-4"></div>
          <p className="font-semibold text-sm">Loading tables...</p>
        </div>
      ) : tables.length === 0 ? (
        <div className="py-16 text-center text-gray-500 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50 flex flex-col items-center">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-gray-100 mb-4">
            <QrCode className="text-gray-400" size={32} />
          </div>
          <p className="font-bold text-gray-900 text-lg">No tables created yet</p>
          <p className="text-sm mt-1">Add your first table above to generate a QR code.</p>
        </div>
      ) : (
        <div className="grid gap-5 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {filteredTables.map((table) => {
            const tableUrl = `${origin}/${shopSlug}?tableId=${table.id}`;
            const isEditing = editingId === table.id;
            const isMenuOpen = openMenuId === table.id;

            return (
              <div key={table.id} className={`relative bg-white border rounded-2xl p-5 flex flex-col gap-4 transition-all hover:shadow-md ${table.isActive ? 'border-gray-200' : 'border-gray-100 bg-gray-50/60 opacity-80'}`}>
                
                {/* CARD HEADER */}
                <div className="flex justify-between items-start min-h-[56px]">
                  {isEditing ? (
                    <div className="flex gap-2 w-full pr-2 z-10">
                      <input 
                        autoFocus
                        value={editLabel}
                        onChange={(e) => setEditLabel(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-900 text-lg font-black uppercase w-full shadow-sm"
                        onKeyDown={(e) => e.key === 'Enter' && handleUpdate(table.id)}
                      />
                      <button onClick={() => handleUpdate(table.id)} className="p-2.5 bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100 transition-colors shadow-sm"><Check size={18}/></button>
                      <button onClick={() => setEditingId(null)} className="p-2.5 bg-gray-50 text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors shadow-sm"><X size={18}/></button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-3.5">
                        <div className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 border ${table.isActive ? 'bg-gray-50 border-gray-200 text-gray-900' : 'bg-white border-gray-100 text-gray-400'}`}>
                           <QrCode size={26} strokeWidth={2} />
                        </div>
                        <div className="flex flex-col justify-center">
                           <span className={`text-xl font-black tracking-tight leading-none mb-1.5 ${table.isActive ? 'text-gray-900' : 'text-gray-500'}`}>{table.label}</span>
                           <div>
                             {table.isActive ? (
                               <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-green-50 text-green-700 text-[10px] font-bold uppercase rounded border border-green-100 tracking-wider">
                                 <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div> Active
                               </span>
                             ) : (
                               <span className="inline-flex items-center px-2 py-0.5 bg-gray-100 text-gray-500 text-[10px] font-bold uppercase rounded border border-gray-200 tracking-wider">
                                 Disabled
                               </span>
                             )}
                           </div>
                        </div>
                      </div>

                      {/* DROPDOWN MENU */}
                      <div className="relative">
                        <button onClick={() => setOpenMenuId(isMenuOpen ? null : table.id)} className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors active:scale-95">
                           <MoreHorizontal size={20} />
                        </button>
                        
                        {isMenuOpen && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setOpenMenuId(null)} />
                            <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-gray-100 rounded-xl shadow-xl z-20 flex flex-col p-1.5 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                               <button onClick={() => { setEditingId(table.id); setEditLabel(table.label); setOpenMenuId(null); }} className="flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg text-left font-semibold transition-colors">
                                 <Edit2 size={16} className="text-gray-400"/> Edit Label
                               </button>
                               <button onClick={() => { handleToggle(table.id, table.isActive); setOpenMenuId(null); }} className="flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg text-left font-semibold transition-colors">
                                 {table.isActive ? <><PowerOff size={16} className="text-gray-400"/> Disable Table</> : <><Power size={16} className="text-gray-400"/> Enable Table</>}
                               </button>
                               <div className="h-px bg-gray-100 my-1.5 mx-2"></div>
                               <button onClick={() => { handleDelete(table.id); setOpenMenuId(null); }} className="flex items-center gap-2.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg text-left font-semibold transition-colors">
                                 <Trash2 size={16} className="text-red-400"/> Delete Table
                               </button>
                            </div>
                          </>
                        )}
                      </div>
                    </>
                  )}
                </div>

                {/* LINK AREA */}
                <div className="mt-1">
                  <p className="text-[11px] font-bold text-gray-500 mb-1.5 ml-0.5">Customer entry link</p>
                  <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 p-1.5 rounded-xl shadow-inner">
                    <div className="flex-1 overflow-hidden pl-2">
                       <p className={`text-xs font-mono truncate select-all ${table.isActive ? 'text-gray-700' : 'text-gray-400'}`}>{tableUrl}</p>
                    </div>
                    <button 
                      onClick={() => copyToClipboard(table.id, tableUrl)}
                      className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 text-gray-700 transition-all active:scale-95 shrink-0"
                      title="Copy Link"
                    >
                      {copiedId === table.id ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                      <span className="text-xs font-bold">Copy</span>
                    </button>
                  </div>
                </div>

                {/* PRIMARY ACTION */}
                <div className="mt-auto pt-2">
                  <button 
                    onClick={() => setQrModalTable(table)}
                    className={`w-full py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${
                      table.isActive 
                        ? 'bg-gray-900 text-white hover:bg-gray-800 shadow-md' 
                        : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 shadow-sm'
                    }`}
                  >
                    <QrCode size={18} /> View QR Code
                  </button>
                </div>
              </div>
            );
          })}

          {filteredTables.length === 0 && tables.length > 0 && (
            <div className="col-span-full py-16 text-center text-gray-400 font-medium bg-gray-50 rounded-2xl border border-gray-200 border-dashed">
              No tables found matching "{searchQuery}"
            </div>
          )}
        </div>
      )}

      {/* QR MODAL */}
      {qrModalTable && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setQrModalTable(null)}>
          <div className="bg-white rounded-[32px] p-6 sm:p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95 flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
            
            {/* Modal Header */}
            <div className="w-full flex justify-between items-start mb-6">
              <div>
                <h3 className="text-2xl font-black text-gray-900 leading-none">Table {qrModalTable.label}</h3>
                <p className="text-sm text-gray-500 mt-1.5 font-medium">Customer Access QR</p>
              </div>
              <button onClick={() => setQrModalTable(null)} className="p-2 bg-gray-50 rounded-full hover:bg-gray-200 transition-colors text-gray-500 active:scale-95"><X size={20}/></button>
            </div>
            
            {/* QR Image Display */}
            <div className="bg-white p-4 rounded-3xl border-2 border-gray-100 mb-6 w-full flex justify-center shadow-sm relative overflow-hidden">
              <div className="absolute inset-0 bg-gray-50 opacity-50 pointer-events-none"></div>
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(`${origin}/${shopSlug}?tableId=${qrModalTable.id}`)}`} 
                alt={`QR for Table ${qrModalTable.label}`} 
                className="w-48 h-48 sm:w-56 sm:h-56 object-contain relative z-10 mix-blend-multiply"
              />
            </div>

            {/* Modal Link Copy */}
            <div className="w-full mb-6">
               <p className="text-xs font-bold text-gray-500 mb-1.5 ml-1">Direct Link</p>
               <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 p-1.5 rounded-xl shadow-inner">
                 <div className="flex-1 overflow-hidden pl-2">
                    <p className="text-xs font-mono truncate text-gray-600">{`${origin}/${shopSlug}?tableId=${qrModalTable.id}`}</p>
                 </div>
                 <button 
                   onClick={() => copyToClipboard(qrModalTable.id, `${origin}/${shopSlug}?tableId=${qrModalTable.id}`)}
                   className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 text-gray-700 transition-all active:scale-95 shrink-0"
                 >
                   {copiedId === qrModalTable.id ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                   <span className="text-xs font-bold">Copy</span>
                 </button>
               </div>
            </div>

            {/* Modal Actions */}
            <div className="flex w-full">
              <button 
                onClick={() => downloadQR(`${origin}/${shopSlug}?tableId=${qrModalTable.id}`, qrModalTable.label)}
                className="w-full py-3.5 bg-gray-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors active:scale-[0.98] shadow-sm"
              >
                <Download size={18} /> Download QR Code
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}