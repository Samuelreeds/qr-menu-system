// components/LocalizedInput.tsx
'use client';
import { useState } from 'react';

interface LocalizedInputProps {
  label: string;
  value: string;
  valueKh?: string | null;
  valueZh?: string | null;
  onChange: (lang: 'en' | 'kh' | 'zh', val: string) => void;
  required?: boolean;
  multiLangEnabled?: boolean;
}

export default function LocalizedInput({ label, value, valueKh, valueZh, onChange, required, multiLangEnabled = false }: LocalizedInputProps) {
  const [activeTab, setActiveTab] = useState<'en' | 'kh' | 'zh'>('en');
  const [activeLangs, setActiveLangs] = useState<('en' | 'kh' | 'zh')[]>(() => {
    const langs: ('en' | 'kh' | 'zh')[] = ['en'];
    if (valueKh) langs.push('kh');
    if (valueZh && multiLangEnabled) langs.push('zh');
    return langs;
  });

  // Ensure 'zh' is removed from view if disabled, even if previously active
  const displayLangs = multiLangEnabled ? activeLangs : activeLangs.filter(l => l !== 'zh');
  const currentTab = (!multiLangEnabled && activeTab === 'zh') ? 'en' : activeTab;

  const addLang = (lang: 'kh' | 'zh') => {
    if (!activeLangs.includes(lang)) {
      setActiveLangs([...activeLangs, lang]);
    }
    setActiveTab(lang);
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-end mb-1">
        <label className="text-xs font-bold text-gray-500">{label}</label>
        <div className="flex gap-2">
          {!displayLangs.includes('kh') && (
            <button type="button" onClick={() => addLang('kh')} className="text-[10px] text-gray-400 hover:text-gray-900 font-bold transition-colors">
              + Add Khmer
            </button>
          )}
          {multiLangEnabled && !displayLangs.includes('zh') && (
            <button type="button" onClick={() => addLang('zh')} className="text-[10px] text-gray-400 hover:text-gray-900 font-bold transition-colors">
              + Add Chinese
            </button>
          )}
        </div>
      </div>

      {displayLangs.length > 1 && (
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-max mb-2">
          {displayLangs.map(l => (
            <button 
              key={l}
              type="button"
              onClick={() => setActiveTab(l)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${currentTab === l ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {l === 'en' ? 'English' : l === 'kh' ? 'Khmer' : 'Chinese'}
            </button>
          ))}
        </div>
      )}

      <div className="relative">
        <input 
          type="text" 
          value={value} 
          onChange={(e) => onChange('en', e.target.value)} 
          placeholder={`${label} (English)`}
          required={required}
          onInvalid={() => setActiveTab('en')}
          className={`w-full p-3.5 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-gray-900 ${currentTab === 'en' ? 'block' : 'absolute opacity-0 w-0 h-0 -z-10'}`} 
        />
        {displayLangs.includes('kh') && (
          <input 
            type="text" 
            value={valueKh || ''} 
            onChange={(e) => onChange('kh', e.target.value)} 
            placeholder={`${label} (Khmer)`}
            className={`w-full p-3.5 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-gray-900 ${currentTab === 'kh' ? 'block' : 'hidden'}`} 
          />
        )}
        {displayLangs.includes('zh') && multiLangEnabled && (
          <input 
            type="text" 
            value={valueZh || ''} 
            onChange={(e) => onChange('zh', e.target.value)} 
            placeholder={`${label} (Chinese)`}
            className={`w-full p-3.5 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-gray-900 ${currentTab === 'zh' ? 'block' : 'hidden'}`} 
          />
        )}
      </div>
    </div>
  );
}