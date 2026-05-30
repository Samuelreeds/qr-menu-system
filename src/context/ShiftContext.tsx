// src/context/ShiftContext.tsx
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getCurrentShift, openShift, closeShift } from '@/lib/actions';
import { Loader2, DollarSign, X, LogOut, AlertTriangle } from 'lucide-react';
import { signOut } from 'next-auth/react';

interface Shift {
  id: string;
  startingCash: number;
  status: string;
  startTime: Date;
}

interface ShiftContextType {
  shift: Shift | null;
  isLoading: boolean;
  requireShift: () => void;
  initiateCloseShift: () => void;
}

const ShiftContext = createContext<ShiftContextType | undefined>(undefined);

export function ShiftProvider({ children }: { children: ReactNode }) {
  const [shift, setShift] = useState<Shift | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showOpenPrompt, setShowOpenPrompt] = useState(false);
  const [showClosePrompt, setShowClosePrompt] = useState(false);

  // Open Shift State
  const [startingCash, setStartingCash] = useState<string>("0");
  const [isOpenSubmitting, setIsOpenSubmitting] = useState(false);
  const [openError, setOpenError] = useState("");

  // Close Shift State
  const [actualCash, setActualCash] = useState<string>("");
  const [isCloseSubmitting, setIsCloseSubmitting] = useState(false);
  const [closeError, setCloseError] = useState("");

  useEffect(() => {
    refreshShift();
  }, []);

  const refreshShift = async () => {
    setIsLoading(true);
    try {
      const activeShift = await getCurrentShift();
      setShift(activeShift as Shift | null);
    } catch (error) {
      console.error("Failed to load shift", error);
    }
    setIsLoading(false);
  };

  const requireShift = () => {
    if (!shift && !isLoading) {
      setShowOpenPrompt(true);
    }
  };

  const initiateCloseShift = () => {
    if (shift) {
      setActualCash("");
      setShowClosePrompt(true);
    }
  };

  const handleOpenShift = async (e: React.FormEvent) => {
    e.preventDefault();
    setOpenError("");
    setIsOpenSubmitting(true);
    
    const cashAmount = parseFloat(startingCash) || 0;
    
    try {
      const res = await openShift(cashAmount);
      if (res.success && res.shift) {
        setShift(res.shift as Shift);
        setShowOpenPrompt(false);
      } else {
        setOpenError(res.error || "Failed to open shift");
      }
    } catch (err) {
      setOpenError("An unexpected error occurred");
    }
    
    setIsOpenSubmitting(false);
  };

  const handleCloseShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shift) return;
    
    setCloseError("");
    setIsCloseSubmitting(true);
    
    const finalCash = parseFloat(actualCash);
    if (isNaN(finalCash)) {
      setCloseError("Please enter a valid cash amount");
      setIsCloseSubmitting(false);
      return;
    }

    try {
      // Pass 0 for expectedEndingCash for now (can add logic to compute total sales later)
      const res = await closeShift(shift.id, finalCash, 0); 
      if (res.success) {
        setShift(null);
        setShowClosePrompt(false);
        // Automatically log the cashier out after a successful shift close
        signOut({ callbackUrl: '/auth/login' });
      } else {
        setCloseError(res.error || "Failed to close shift");
      }
    } catch (err) {
      setCloseError("An unexpected error occurred");
    }
    
    setIsCloseSubmitting(false);
  };

  return (
    <ShiftContext.Provider value={{ shift, isLoading, requireShift, initiateCloseShift }}>
      {children}

      {/* OPEN SHIFT MODAL (BLOCKING) */}
      {showOpenPrompt && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-sm rounded-[32px] shadow-2xl p-8 animate-in zoom-in-95">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-inner">
              <DollarSign size={32} strokeWidth={2.5} />
            </div>
            <h2 className="text-2xl font-black text-gray-900 mb-2">Start Shift</h2>
            <p className="text-sm text-gray-500 font-medium mb-6 leading-relaxed">
              Before you can use the POS, please enter the starting cash amount in your drawer.
            </p>

            {openError && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-xs font-bold flex items-center gap-2">
                <AlertTriangle size={14} /> {openError}
              </div>
            )}

            <form onSubmit={handleOpenShift} className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Starting Cash (USD)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-black text-lg">$</span>
                  <input 
                    type="number" 
                    step="0.01" 
                    min="0"
                    value={startingCash} 
                    onChange={e => setStartingCash(e.target.value)} 
                    className="w-full pl-8 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl font-black text-xl outline-none focus:border-gray-900 focus:bg-white transition-all shadow-sm" 
                    placeholder="0.00"
                    required 
                  />
                </div>
              </div>
              
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowOpenPrompt(false)} className="px-6 py-4 bg-gray-100 text-gray-700 rounded-2xl font-bold hover:bg-gray-200 active:scale-95 transition-all text-sm">Cancel</button>
                <button type="submit" disabled={isOpenSubmitting} className="flex-1 py-4 bg-gray-900 text-white rounded-2xl font-black shadow-lg hover:bg-gray-800 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                  {isOpenSubmitting ? <Loader2 size={18} className="animate-spin" /> : "Open Register"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CLOSE SHIFT MODAL */}
      {showClosePrompt && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-sm rounded-[32px] shadow-2xl p-8 animate-in zoom-in-95">
            <div className="flex justify-between items-start mb-6">
              <div className="w-16 h-16 bg-gray-900 text-white rounded-2xl flex items-center justify-center shadow-inner">
                <LogOut size={32} strokeWidth={2.5} />
              </div>
              <button onClick={() => setShowClosePrompt(false)} className="p-2 bg-gray-50 text-gray-400 hover:text-gray-600 rounded-full transition-colors active:scale-95">
                <X size={20} />
              </button>
            </div>
            
            <h2 className="text-2xl font-black text-gray-900 mb-2">Close Shift</h2>
            <p className="text-sm text-gray-500 font-medium mb-6 leading-relaxed">
              Count the cash in your drawer and enter the final amount. You will be logged out automatically.
            </p>

            {closeError && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-xs font-bold flex items-center gap-2">
                <AlertTriangle size={14} /> {closeError}
              </div>
            )}

            <form onSubmit={handleCloseShift} className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Actual Cash in Drawer (USD)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-black text-lg">$</span>
                  <input 
                    type="number" 
                    step="0.01" 
                    min="0"
                    value={actualCash} 
                    onChange={e => setActualCash(e.target.value)} 
                    className="w-full pl-8 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl font-black text-xl outline-none focus:border-gray-900 focus:bg-white transition-all shadow-sm" 
                    placeholder="0.00"
                    required 
                    autoFocus
                  />
                </div>
              </div>
              
              <button type="submit" disabled={isCloseSubmitting} className="w-full py-4 bg-red-600 text-white rounded-2xl font-black shadow-lg hover:bg-red-700 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm">
                {isCloseSubmitting ? <Loader2 size={18} className="animate-spin" /> : "Close Shift & Log Out"}
              </button>
            </form>
          </div>
        </div>
      )}
    </ShiftContext.Provider>
  );
}

export function useShift() {
  const context = useContext(ShiftContext);
  if (context === undefined) {
    throw new Error('useShift must be used within a ShiftProvider');
  }
  return context;
}