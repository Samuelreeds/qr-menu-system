import React from 'react';
import type { LucideIcon } from 'lucide-react';

type NavItemProps = {
  id: string;
  label: string;
  icon: LucideIcon;
  active: boolean;
  compact: boolean;
  onClick: (id: string) => void;
};

export default function NavItem({
  id,
  label,
  icon: Icon,
  active,
  compact,
  onClick,
}: NavItemProps) {
  return (
    <div className="relative group/nav">
      <button
        type="button"
        onClick={() => onClick(id)}
        className={`w-full flex items-center py-3 rounded-xl transition-all min-w-0 ${
          compact ? 'justify-center px-0' : 'justify-start px-4 gap-3'
        } ${
          active
            ? 'bg-gray-900 text-white font-bold shadow-md'
            : 'text-gray-500 font-medium hover:bg-gray-50 active:scale-[0.98]'
        }`}
      >
        <Icon size={20} className="shrink-0" />
        {!compact && <span className="font-medium truncate">{label}</span>}
      </button>

      {compact && (
        <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-1.5 bg-gray-900 text-white text-xs font-bold rounded-lg opacity-0 pointer-events-none group-hover/nav:opacity-100 transition-all z-50 whitespace-nowrap shadow-xl flex items-center">
          {label}
          <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-gray-900 rotate-45" />
        </div>
      )}
    </div>
  );
}