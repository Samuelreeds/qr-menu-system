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

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
    setIsExpanded(false);
  };

  return (
    <div 
      className={`relative flex items-center h-[42px] transition-[width] duration-300 ease-out bg-white border border-gray-100 rounded-full shadow-sm overflow-hidden will-change-[width] ${
        isExpanded ? 'w-[180px] sm:w-[240px] ring-2 ring-black/5' : 'w-[42px] hover:bg-gray-50 cursor-pointer'
      }`}
      onClick={() => !isExpanded && setIsExpanded(true)}
    >
      <div className="flex items-center justify-center min-w-[42px] w-[42px] h-[42px] shrink-0">
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
        className={`bg-transparent text-sm font-medium text-gray-800 placeholder:text-gray-400 outline-none h-full transition-all duration-300 min-w-0 ${
          isExpanded ? 'flex-1 opacity-100' : 'w-0 flex-none opacity-0 pointer-events-none p-0 m-0'
        }`}
      />

      <div 
        className={`flex items-center justify-center h-[42px] shrink-0 transition-all duration-300 ${
          isExpanded ? 'w-[36px] opacity-100 pr-1' : 'w-0 flex-none opacity-0 pointer-events-none'
        }`}
      >
        <button 
          onClick={handleClose}
          className="p-1.5 hover:bg-gray-100 rounded-full transition-colors active:scale-95"
        >
          <X size={14} className="text-gray-400" />
        </button>
      </div>
    </div>
  );
}