"use client";
import { useState, useEffect, useRef } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { ChevronDown, Check } from "lucide-react";

// Use direct image URLs instead of text emojis
const languages = [
  { code: 'en', label: 'English', flag: 'https://flagcdn.com/w40/us.png' }, 
  { code: 'kh', label: 'ខ្មែរ', flag: 'https://flagcdn.com/w40/kh.png' },
  { code: 'zh', label: '中文', flag: 'https://flagcdn.com/w40/cn.png' }
];

export default function LangSwitcher() {
  const { lang, setLang } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeLang = languages.find(l => l.code === lang) || languages[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative z-50" ref={dropdownRef}>
      
      {/* --- MAIN BUTTON --- */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-white border border-gray-200 rounded-full px-3 py-2 shadow-sm hover:bg-gray-50 transition-colors"
      >
        <img src={activeLang.flag} alt={activeLang.code} className="w-5 h-5 object-cover rounded-full shadow-sm" />
        <ChevronDown size={14} className={`text-gray-600 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* --- DROPDOWN MENU --- */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-36 bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          <div className="py-1">
            {languages.map((language) => (
              <button
                key={language.code}
                onClick={() => {
                  setLang(language.code as any);
                  setIsOpen(false);
                }}
                className="w-full text-left px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <img src={language.flag} alt={language.code} className="w-5 h-5 object-cover rounded-full shadow-sm" />
                  <span className={`text-sm font-bold ${lang === language.code ? 'text-black' : 'text-gray-600'}`}>
                    {language.label}
                  </span>
                </div>
                
                {lang === language.code && (
                  <Check size={16} className="text-green-600" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}