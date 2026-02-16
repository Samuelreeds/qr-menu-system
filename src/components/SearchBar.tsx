import { Search, SlidersHorizontal } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (val: string) => void;
}

export default function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div className="flex gap-3 mb-2">
      <div className="relative flex-1">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input 
          type="text" 
          placeholder="Search your favorite food" 
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-white border border-gray-100 pl-11 pr-4 py-3.5 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-black/5 shadow-sm text-gray-600 placeholder:text-gray-400"
        />
      </div>
    </div>
  );
}