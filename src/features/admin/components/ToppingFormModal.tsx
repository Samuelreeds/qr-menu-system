// src/features/admin/components/ToppingFormModal.tsx
import { X, Loader2 } from 'lucide-react';

export interface Topping { 
  id: string; 
  name: string; 
  price: number; 
  isDrink: boolean; 
}

interface ToppingFormModalProps {
  isOpen: boolean;
  editingTopping: Topping | null;
  isSaving: boolean;
  onClose: () => void;
  formAction: (fd: FormData) => void;
}

export default function ToppingFormModal({
  isOpen,
  editingTopping,
  isSaving,
  onClose,
  formAction
}: ToppingFormModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 print:hidden" onClick={onClose}>
      <div className="bg-white w-full max-w-sm rounded-[32px] shadow-2xl p-6 md:p-8 animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
         <div className="flex justify-between items-center mb-6">
           <h2 className="text-2xl font-bold">{editingTopping ? "Edit Topping" : "Add Topping"}</h2>
           <button type="button" onClick={onClose} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 active:scale-95 transition-colors">
             <X size={20}/>
           </button>
         </div>
         <form action={formAction} className="space-y-4">
           <div>
             <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Topping Name</label>
             <input type="text" name="name" defaultValue={editingTopping?.name} placeholder="e.g. Pearl" className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:border-gray-900" required />
           </div>
           <div>
             <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Extra Price ($)</label>
             <input type="number" step="0.01" min="0" name="price" defaultValue={editingTopping?.price || ''} placeholder="0.50" className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:border-gray-900" required />
           </div>
           <div className="pt-2">
             <label className="flex items-center gap-2 text-sm font-bold cursor-pointer">
               <input type="checkbox" name="isDrink" value="true" defaultChecked={editingTopping ? editingTopping.isDrink : true} className="w-4 h-4 cursor-pointer accent-gray-900"/> Available for Drinks (Uncheck for Food)
             </label>
           </div>
           <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 mt-6">
             <button type="button" onClick={onClose} className="px-6 py-3.5 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 active:scale-95 transition-all">Cancel</button>
             <button type="submit" disabled={isSaving} className="px-6 py-3.5 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-2">
               {isSaving && <Loader2 size={16} className="animate-spin"/>} Save
             </button>
           </div>
         </form>
      </div>
    </div>
  );
}