import { Search } from 'lucide-react';
import LangSwitcher from './LangSwitcher'; // 1. Import the Switcher
import { useLanguage } from '@/context/LanguageContext'; // 2. Import the Hook

interface SearchBarProps {
  value: string;
  onChange: (val: string) => void;
}

export default function SearchBar({ value, onChange }: SearchBarProps) {
  const { lang } = useLanguage(); // 3. Get current language

  // 4. Dynamic Placeholder Logic
  const placeholderText = {
    en: "Search your favorite food",
    kh: "ស្វែងរកអាហារដែលអ្នកចូលចិត្ត",
    zh: "搜索你最喜欢的食物"
  };

  return (
    <div className="flex gap-3 mb-2 items-center"> {/* Added items-center */}
      <div className="relative flex-1">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input 
          type="text" 
          placeholder={placeholderText[lang]} // 5. Use dynamic placeholder
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-white border border-gray-100 pl-11 pr-4 py-3.5 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-black/5 shadow-sm text-gray-600 placeholder:text-gray-400"
        />
      </div>
      
      {/* 6. Add the Language Switcher here */}
      <div className="shrink-0">
        <LangSwitcher />
      </div>
    </div>
  );
}