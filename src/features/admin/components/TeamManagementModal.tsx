// src/features/admin/components/TeamManagementModal.tsx
import { X, Loader2 } from 'lucide-react';

interface TeamManagementModalProps {
  isOpen: boolean;
  editingTeamMember: any | null;
  isSaving: boolean;
  onClose: () => void;
  formAction: (fd: FormData) => void;
}

export default function TeamManagementModal({
  isOpen,
  editingTeamMember,
  isSaving,
  onClose,
  formAction
}: TeamManagementModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 print:hidden" onClick={onClose}>
      <div className="bg-white w-full max-w-sm rounded-[32px] shadow-2xl p-6 md:p-8 animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
         <div className="flex justify-between items-center mb-6">
           <h2 className="text-2xl font-bold">{editingTeamMember ? "Edit Team Member" : "Add Staff"}</h2>
           <button type="button" onClick={onClose} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 active:scale-95 transition-colors">
             <X size={20}/>
           </button>
         </div>
         <form action={formAction} className="space-y-4">
           {!editingTeamMember && (
             <>
               <div>
                 <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Email Address</label>
                 <input type="email" name="email" placeholder="staff@shop.com" className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:border-gray-900" required />
               </div>
               <div>
                 <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Temporary Password</label>
                 <input type="password" name="password" placeholder="Min 6 characters" className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:border-gray-900" required minLength={6} />
               </div>
             </>
           )}
           {editingTeamMember && (
              <div className="mb-4 p-3 bg-gray-50 rounded-xl border border-gray-200">
                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">User</p>
                <p className="font-bold text-gray-900">{editingTeamMember.email}</p>
              </div>
           )}
           <div>
             <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Role</label>
             <select name="role" defaultValue={editingTeamMember?.role === 'OWNER' ? 'admin' : (editingTeamMember?.role || 'staff')} className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:border-gray-900 bg-white" required>
               <option value="staff">Staff (POS & Orders)</option>
               <option value="admin">Admin (Full Access)</option>
             </select>
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