// src/features/admin/components/AdminToast.tsx
import { CheckCircle, AlertTriangle, XCircle, Info } from 'lucide-react';

interface AdminToastProps {
  show: boolean;
  message: string;
  type?: 'success' | 'warning' | 'fail' | 'info';
}

export default function AdminToast({ show, message, type = 'info' }: AdminToastProps) {
  if (!show) return null;

  const styles = {
    success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    warning: 'bg-orange-50 border-orange-200 text-orange-800',
    fail: 'bg-red-50 border-red-200 text-red-800',
    info: 'bg-gray-900 border-gray-800 text-white'
  };

  const icons = {
    success: <CheckCircle size={18} className="text-emerald-600" />,
    warning: <AlertTriangle size={18} className="text-orange-600" />,
    fail: <XCircle size={18} className="text-red-600" />,
    info: <Info size={18} className="text-gray-400" />
  };

  return (
    <div className={`fixed bottom-6 right-6 z-[99999] px-4 py-3 rounded-2xl border shadow-xl flex items-center gap-3 animate-in slide-in-from-bottom-6 fade-in duration-300 ${styles[type]}`}>
      {icons[type]}
      <span className="text-sm font-bold tracking-wide">{message}</span>
    </div>
  );
}