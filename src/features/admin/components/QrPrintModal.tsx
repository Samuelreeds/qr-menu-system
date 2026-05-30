// src/features/admin/components/QrPrintModal.tsx
import React from 'react';
import { X, QrCode } from 'lucide-react';

interface QrPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  previewFormat: 'portrait' | 'landscape';
  setPreviewFormat: (format: 'portrait' | 'landscape') => void;
  paperSize: 'A4' | 'A5' | '10x15';
  setPaperSize: (size: 'A4' | 'A5' | '10x15') => void;
  getPreviewScale: () => string;
  renderPrintTemplate: (format: 'portrait' | 'landscape') => React.ReactNode;
  handleGeneratePDF: (format: 'portrait' | 'landscape') => void;
}

export default function QrPrintModal({
  isOpen,
  onClose,
  previewFormat,
  setPreviewFormat,
  paperSize,
  setPaperSize,
  getPreviewScale,
  renderPrintTemplate,
  handleGeneratePDF
}: QrPrintModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm py-4" onClick={onClose}>
      <div className="bg-white p-6 md:p-8 rounded-[35px] max-w-md w-full relative z-10 shadow-2xl animate-in zoom-in-95 max-h-[90dvh] overflow-y-auto [-webkit-overflow-scrolling:touch] no-scrollbar [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }} onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-extrabold text-2xl text-gray-900">QR & Print Menu</h2>
          <button className="p-2 bg-gray-50 rounded-full text-gray-500 hover:bg-gray-100 transition-colors active:scale-95" onClick={onClose}>
            <X size={20}/>
          </button>
        </div>
        
        <div className="flex gap-2 mb-6 bg-gray-100 p-1.5 rounded-2xl w-full">
          <button onClick={() => setPreviewFormat('portrait')} className={`flex-1 py-2 px-1 rounded-xl text-[16px] md:text-sm font-bold transition-all active:scale-[0.98] flex flex-col items-center justify-center leading-tight ${previewFormat === 'portrait' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
            <span>Portrait</span><span className="text-[10px] font-normal opacity-70 mt-0.5">(Table stand)</span>
          </button>
          <button onClick={() => setPreviewFormat('landscape')} className={`flex-1 py-2 px-1 rounded-xl text-[16px] md:text-sm font-bold transition-all active:scale-[0.98] flex flex-col items-center justify-center leading-tight ${previewFormat === 'landscape' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
            <span>Landscape</span><span className="text-[10px] font-normal opacity-70 mt-0.5">(Wall / Counter)</span>
          </button>
        </div>
        
        <div className="mb-6">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 block text-center">Paper Size</label>
          <div className="flex gap-2 bg-gray-100 p-1.5 rounded-xl w-full max-w-[240px] mx-auto">
            {['A4', 'A5', '10x15'].map(size => (
              <button key={size} onClick={() => setPaperSize(size as any)} className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${paperSize === size ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
                {size === '10x15' ? '10×15 cm' : size}
              </button>
            ))}
          </div>
        </div>
        
        <div className="w-full bg-gray-50/80 rounded-3xl flex items-center justify-center mb-6 overflow-hidden relative shadow-inner" style={{ height: '320px' }}>
          <div className="absolute top-3 right-4 bg-white/90 backdrop-blur px-2 py-1 rounded shadow-sm z-20">
            <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Actual print ratio</span>
          </div>
          <div className="origin-center transform transition-all duration-500 flex items-center justify-center shadow-lg bg-white" style={{ transform: getPreviewScale() }}>
            {renderPrintTemplate(previewFormat)}
          </div>
        </div>
        
        <div className="space-y-3">
          <button onClick={() => handleGeneratePDF(previewFormat)} className="w-full py-3.5 bg-gray-900 text-white rounded-2xl font-bold shadow-md hover:bg-gray-800 active:scale-[0.98] transition-all text-[15px] flex items-center justify-center gap-2">
            <QrCode size={18} /> Print / Save as PDF
          </button>
        </div>
      </div>
    </div>
  );
}