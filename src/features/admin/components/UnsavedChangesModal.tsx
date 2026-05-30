// src/features/admin/components/UnsavedChangesModal.tsx
import { AlertTriangle, Loader2 } from 'lucide-react';

interface UnsavedChangesModalProps {
  isOpen: boolean;
  isSaving: boolean;
  onDiscard: () => void;
  onSave: () => void;
}

export default function UnsavedChangesModal({
  isOpen,
  isSaving,
  onDiscard,
  onSave
}: UnsavedChangesModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <div className="bg-white rounded-[32px] p-6 md:p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95">
        <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center mb-5">
          <AlertTriangle size={24} className="text-orange-500" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Unsaved Changes</h3>
        <p className="text-gray-500 text-sm mb-8 leading-relaxed">
          You have unsaved changes in this section. Do you want to save them before leaving?
        </p>
        <div className="flex gap-3 w-full">
          <button 
            onClick={onDiscard} 
            className="flex-1 py-3.5 px-4 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 active:scale-95 transition-all text-[16px] md:text-sm"
          >
            No, Discard
          </button>
          <button 
            onClick={onSave} 
            className="flex-1 py-3.5 px-4 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 active:scale-95 transition-all flex items-center justify-center text-[16px] md:text-sm"
          >
            {isSaving ? <Loader2 className="animate-spin" size={18} /> : 'Yes, Save'}
          </button>
        </div>
      </div>
    </div>
  );
}