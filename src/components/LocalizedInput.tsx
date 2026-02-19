"use client";
import { useState } from "react";
import { Plus, X } from "lucide-react";

interface LocalizedInputProps {
  label: string;
  value: string;      // English (Default)
  valueKh: string;    // Khmer
  valueZh: string;    // Chinese
  onChange: (lang: 'en' | 'kh' | 'zh', val: string) => void;
  placeholder?: string;
  required?: boolean;
}

export default function LocalizedInput({ 
  label, 
  value, 
  valueKh, 
  valueZh, 
  onChange, 
  placeholder,
  required 
}: LocalizedInputProps) {
  const [showKh, setShowKh] = useState(!!valueKh); // Auto-show if value exists
  const [showZh, setShowZh] = useState(!!valueZh);

  return (
    <div className="space-y-3 mb-5">
      <div className="flex justify-between items-center">
        <label className="block text-sm font-bold text-gray-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        
        {/* Language Toggles */}
        <div className="flex gap-2">
          {!showKh && (
            <button type="button" onClick={() => setShowKh(true)} className="text-xs flex items-center gap-1 text-blue-600 font-medium hover:bg-blue-50 px-2 py-1 rounded transition-colors">
              <Plus size={12} /> Add Khmer
            </button>
          )}
          {!showZh && (
            <button type="button" onClick={() => setShowZh(true)} className="text-xs flex items-center gap-1 text-red-600 font-medium hover:bg-red-50 px-2 py-1 rounded transition-colors">
              <Plus size={12} /> Add Chinese
            </button>
          )}
        </div>
      </div>
      
      {/* 1. English Input (Always Visible) */}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange("en", e.target.value)}
        className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black/5 outline-none text-sm"
        placeholder={placeholder || `${label} (English)`}
        required={required}
      />

      {/* 2. Khmer Input (Hidden by default) */}
      {showKh && (
        <div className="relative animate-in slide-in-from-top-2 fade-in duration-200">
          <input
            type="text"
            value={valueKh}
            onChange={(e) => onChange("kh", e.target.value)}
            className="w-full p-3 border border-blue-200 bg-blue-50/20 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none text-sm"
            placeholder={`${label} (Khmer)`}
          />
          <button type="button" onClick={() => setShowKh(false)} className="absolute right-3 top-3 text-gray-400 hover:text-red-500">
            <X size={16} />
          </button>
        </div>
      )}

      {/* 3. Chinese Input (Hidden by default) */}
      {showZh && (
        <div className="relative animate-in slide-in-from-top-2 fade-in duration-200">
          <input
            type="text"
            value={valueZh}
            onChange={(e) => onChange("zh", e.target.value)}
            className="w-full p-3 border border-red-200 bg-red-50/20 rounded-xl focus:ring-2 focus:ring-red-500/20 outline-none text-sm"
            placeholder={`${label} (Chinese)`}
          />
          <button type="button" onClick={() => setShowZh(false)} className="absolute right-3 top-3 text-gray-400 hover:text-red-500">
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
}