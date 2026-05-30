// src/features/admin/components/AdminToast.tsx
import { Check } from 'lucide-react';

interface AdminToastProps {
  show: boolean;
  message: string;
}

export default function AdminToast({ show, message }: AdminToastProps) {
  return (
    <div 
      className={`fixed top-6 right-6 z-[100] transition-all duration-500 transform ${show ? 'translate-y-0 opacity-100' : '-translate-y-10 opacity-0 pointer-events-none'} print:hidden`}
    >
      <div className="bg-gray-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3">
        <div className="bg-green-500 rounded-full p-1">
          <Check size={14} strokeWidth={3} className="text-white" />
        </div>
        <span className="font-bold text-sm">{message}</span>
      </div>
    </div>
  );
}