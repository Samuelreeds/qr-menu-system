"use client";
import { useState, useEffect, useRef } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { ChevronDown, Check } from "lucide-react";

const ALL_LANGUAGES = [
  { code: 'en', label: 'English', flag: 'https://flagcdn.com/w40/us.png' }, 
  { code: 'kh', label: 'ខ្មែរ', flag: 'https://flagcdn.com/w40/kh.png' },
  { code: 'zh', label: '中文', flag: 'https://flagcdn.com/w40/cn.png' }
];

export default function LangSwitcher() {
  const { lang, setLang, multiLangEnabled } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const languages = multiLangEnabled 
    ? ALL_LANGUAGES 
    : ALL_LANGUAGES.filter(l => l.code !== 'zh');

  useEffect(() => {
    if (!multiLangEnabled && lang === 'zh') {
      setLang('en');
    }
  }, [multiLangEnabled, lang, setLang]);

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
    <div className="relative z-50 h-10" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center gap-2 h-full bg-white/20 backdrop-blur-md border border-white/30 rounded-xl px-3 shadow-sm hover:bg-white/30 transition-all active:scale-95"
      >
        <div className="w-5 h-5 rounded-full overflow-hidden ring-1 ring-white/20">
          <img src={activeLang.flag} alt={activeLang.code} className="w-full h-full object-cover" />
        </div>
        <ChevronDown size={14} className={`text-white transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

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