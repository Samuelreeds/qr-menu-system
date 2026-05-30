// src/features/admin/components/DeleteConfirmationModal.tsx
import { Trash2 } from 'lucide-react';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  type: 'product' | 'category' | 'topping' | null;
  name: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function DeleteConfirmationModal({
  isOpen,
  type,
  name,
  onCancel,
  onConfirm
}: DeleteConfirmationModalProps) {
  if (!isOpen) return null;

  const displayType = type === 'product' ? 'Product' : type === 'topping' ? 'Topping' : 'Category';

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <div className="bg-white rounded-[32px] p-6 md:p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95">
        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-5">
          <Trash2 size={24} className="text-red-500" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Delete {displayType}?</h3>
        <p className="text-gray-500 text-sm mb-8 leading-relaxed">
          Are you sure you want to delete <span className="font-semibold text-gray-700">"{name}"</span>? This action cannot be undone after confirmation.
        </p>
        <div className="flex gap-3 w-full">
          <button 
            onClick={onCancel} 
            className="flex-1 py-3.5 px-4 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 active:scale-95 transition-all text-[16px] md:text-sm"
          >
            Cancel
          </button>
          <button 
            onClick={onConfirm} 
            className="flex-1 py-3.5 px-4 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 active:scale-95 transition-all flex items-center justify-center text-[16px] md:text-sm"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}