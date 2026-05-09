// src/components/CustomerEntryGate.tsx
'use client';

import { useState, useEffect } from 'react';
import { Store, ChevronLeft, ChevronRight, MapPin } from 'lucide-react';

export interface CustomerEntryGateProps {
  shopId?: string;
  shopSlug?: string;
  shopName: string;
  tableContext?: { 
    isValid: boolean; 
    tableId: string | null; 
    tableLabel: string | null; 
  };
  isStaffCallActive?: boolean;
  logoUrl?: string | null;
  themeColor?: string;
  onEnter?: (type: 'menu' | 'table') => void;
  callStaffEnabled?: boolean;
}

export default function CustomerEntryGate({
  shopName,
  tableContext,
  isStaffCallActive,
  logoUrl,
  themeColor = '#000000',
  onEnter,
  callStaffEnabled,
}: CustomerEntryGateProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [tableNumber, setTableNumber] = useState(tableContext?.tableLabel || '');
  const [error, setError] = useState(false);
  const [mode, setMode] = useState<'select' | 'table_input'>('select');

  // "Takeaway" has been removed completely.
  // Dine In is available if the shop plan allows it.
  const showDineIn = callStaffEnabled ?? isStaffCallActive ?? true;
  
  // If Dine In is disabled, only "See Menu" is left.
  const onlyViewMenuAvailable = !showDineIn;

  const closeGate = (type: 'menu' | 'table') => {
    setIsVisible(false);
    if (typeof onEnter === 'function') {
      onEnter(type);
    }
  };

  useEffect(() => {
    if (tableContext?.isValid && tableContext.tableLabel) {
      sessionStorage.setItem('scandine_table', tableContext.tableLabel);
      closeGate('table');
    } else if (onlyViewMenuAvailable) {
      // Auto-skip the popup entirely if "See Menu" is the only option
      closeGate('menu');
    }
  }, [onlyViewMenuAvailable, tableContext]);

  if (!isVisible || onlyViewMenuAvailable || tableContext?.isValid) {
    return null; 
  }

  const handleTableSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tableNumber.trim()) {
      setError(true);
      return;
    }
    sessionStorage.setItem('scandine_table', tableNumber.trim());
    closeGate('table');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-sm rounded-[32px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div 
          className="relative px-6 py-8 text-center flex flex-col items-center justify-center overflow-hidden"
          style={{ backgroundColor: themeColor }}
        >
          {logoUrl ? (
            <div className="w-20 h-20 bg-white p-1 rounded-full shadow-xl relative z-10 mb-4">
              <img src={logoUrl} alt={shopName} className="w-full h-full object-cover rounded-full" />
            </div>
          ) : (
            <div className="w-20 h-20 bg-white/20 backdrop-blur-md text-white rounded-full shadow-xl relative z-10 mb-4 flex items-center justify-center border border-white/30">
              <span className="font-bold text-2xl">{shopName.charAt(0).toUpperCase()}</span>
            </div>
          )}
          
          <h1 className="text-white text-2xl font-black tracking-tight relative z-10 drop-shadow-sm">
            {shopName}
          </h1>
          <p className="text-white/80 text-sm font-medium relative z-10 mt-1">
            Welcome! How can we help you today?
          </p>
        </div>

        {/* Content */}
        <div className="p-6 bg-gray-50">
          {mode === 'select' ? (
            <div className="space-y-3">
              {showDineIn && (
                <button
                  onClick={() => setMode('table_input')}
                  className="w-full bg-white border border-gray-200 p-4 rounded-2xl flex items-center gap-4 hover:border-gray-900 hover:shadow-md transition-all active:scale-[0.98] group"
                >
                  <div className="w-12 h-12 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <Store className="w-6 h-6" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-bold text-gray-900">Dine In</h3>
                    <p className="text-xs text-gray-500 font-medium mt-0.5">Order to table & call staff</p>
                  </div>
                </button>
              )}

              <button
                onClick={() => {
                  sessionStorage.removeItem('scandine_table');
                  closeGate('menu');
                }}
                className="w-full bg-black text-white p-4 rounded-2xl flex items-center gap-4 hover:bg-gray-800 hover:shadow-md transition-all active:scale-[0.98] group"
              >
                <div className="flex-1 text-left pl-2">
                  <h3 className="font-bold text-lg">See Menu</h3>
                  <p className="text-xs text-gray-300 font-medium mt-0.5">Browse items and view prices</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                  <ChevronRight className="w-5 h-5" />
                </div>
              </button>
            </div>
          ) : (
            <form onSubmit={handleTableSubmit} className="animate-in slide-in-from-right-4 duration-300">
              <div className="flex items-center justify-between mb-4">
                <button 
                  type="button" 
                  onClick={() => setMode('select')}
                  className="text-gray-400 hover:text-gray-900 flex items-center gap-1 text-sm font-bold transition-colors"
                >
                  <ChevronLeft size={16} /> Back
                </button>
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Table Setup</span>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  What is your table number?
                </label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    value={tableNumber}
                    onChange={(e) => {
                      setTableNumber(e.target.value);
                      setError(false);
                    }}
                    placeholder="e.g. 5, A12, Outside"
                    className={`w-full pl-11 pr-4 py-3.5 bg-gray-50 border ${error ? 'border-red-500 focus:ring-red-500' : 'border-gray-200 focus:ring-gray-900'} rounded-xl outline-none focus:ring-2 focus:bg-white transition-all text-gray-900 font-bold`}
                    autoFocus
                  />
                </div>
                {error && <p className="text-xs text-red-500 font-bold mt-2">Please enter a table number.</p>}
                
                <button
                  type="submit"
                  className="w-full mt-4 bg-gray-900 text-white py-3.5 rounded-xl font-bold shadow-md hover:bg-gray-800 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  Confirm Table <ChevronRight size={16} />
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}