import React from 'react';

export default function StockSwitchButton({ checked, onToggle, fullWidth }: { checked: boolean; onToggle: (e?: React.MouseEvent) => void; fullWidth?: boolean }) {
  return (
    <button type="button" onClick={(e) => { e.stopPropagation(); onToggle(e); }} className={`flex items-center justify-between px-4 py-2.5 rounded-2xl font-bold transition-all duration-200 active:scale-[0.98] border shadow-sm ${fullWidth ? 'w-full mt-3' : 'w-auto gap-4'} ${checked ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 hover:border-rose-300' : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300'}`}>
      <span className="uppercase tracking-wide text-xs">{checked ? 'Sold Out' : 'Available'}</span>
      <div className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${checked ? 'bg-rose-500' : 'bg-emerald-500'}`}><span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${checked ? 'translate-x-5' : 'translate-x-0'}`} /></div>
    </button>
  );
}