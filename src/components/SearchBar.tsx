import { Search, X } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';

interface SearchBarProps {
  value: string;
  onChange: (val: string) => void;
  hideSwitcher?: boolean;
}

export default function SearchBar({ value, onChange }: SearchBarProps) {
  const { lang } = useLanguage();
  const [isExpanded, setIsExpanded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const placeholderText = {
    en: "Search...",
    kh: "ស្វែងរក...",
    zh: "搜索..."
  };

  useEffect(() => {
    if (isExpanded && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isExpanded]);

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
    setIsExpanded(false);
  };

  return (
    <div 
      className={`relative flex items-center h-[42px] transition-all duration-300 ease-in-out bg-white border border-gray-100 rounded-full shadow-sm ${
        isExpanded ? 'w-full sm:w-64 px-3 ring-2 ring-black/5' : 'w-[42px] justify-center hover:bg-gray-50 cursor-pointer'
      }`}
      onClick={() => !isExpanded && setIsExpanded(true)}
    >
      <div className={`shrink-0 flex items-center justify-center ${isExpanded ? 'mr-2' : ''}`}>
        <Search 
          size={18} 
          className={`transition-colors ${isExpanded ? 'text-gray-400' : 'text-gray-700'}`} 
          strokeWidth={2.5}
        />
      </div>

      <input
        ref={inputRef}
        type="text"
        placeholder={placeholderText[lang]}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`bg-transparent text-sm font-medium text-gray-800 placeholder:text-gray-400 outline-none transition-all duration-300 ${
          isExpanded ? 'w-full opacity-100' : 'w-0 opacity-0 pointer-events-none'
        }`}
        onBlur={() => value === "" && setIsExpanded(false)}
      />

      {isExpanded && value !== "" && (
        <button 
          onClick={handleClear}
          className="shrink-0 ml-1 p-1 hover:bg-gray-100 rounded-full transition-colors"
        >
          <X size={14} className="text-gray-400" />
        </button>
      )}
    </div>
  );
}