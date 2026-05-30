// src/features/admin/tabs/TeamTab.tsx
import React from 'react';
import { Loader2, Plus, Activity, Pencil, Trash2 } from 'lucide-react';

interface TeamTabProps {
  teamMembers: any[];
  isTeamLoading: boolean;
  userEmail: string;
  onAddStaff: () => void;
  onEditStaff: (member: any) => void;
  onViewActivity: (member: any) => void;
  onDeleteStaff: (memberId: string) => void;
}

export default function TeamTab({
  teamMembers,
  isTeamLoading,
  userEmail,
  onAddStaff,
  onEditStaff,
  onViewActivity,
  onDeleteStaff
}: TeamTabProps) {
  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h3 className="font-bold text-2xl text-gray-900">Staff & Team Management</h3>
          <p className="text-sm text-gray-500 mt-1">Manage who has access to your shop's dashboard and POS.</p>
        </div>
        <button 
          onClick={onAddStaff} 
          className="shrink-0 bg-gray-900 text-white hover:bg-gray-800 px-6 py-3.5 rounded-2xl font-bold active:scale-95 transition shadow-sm flex items-center justify-center gap-2 text-[16px] md:text-sm"
        >
          <Plus size={18} strokeWidth={3}/> Add Staff
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-x-auto [-webkit-overflow-scrolling:touch]">
        <table className="w-full text-left border-collapse min-w-[500px]">
          <thead>
            <tr className="border-b border-gray-50 text-xs font-bold text-gray-400 uppercase tracking-wider">
              <th className="p-5">User Email</th>
              <th className="p-5">Role Level</th>
              <th className="p-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isTeamLoading ? (
              <tr><td colSpan={3} className="py-12 text-center text-gray-400"><Loader2 className="animate-spin mx-auto"/></td></tr>
            ) : teamMembers.map((member) => (
              <tr key={member.id} className="hover:bg-gray-50/50 transition-colors group">
                <td className="p-4 font-bold text-gray-900">
                  {member.email}
                  {member.email === userEmail && <span className="ml-2 text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-md">YOU</span>}
                </td>
                <td className="p-4">
                  <span className={`px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider rounded-md border ${member.role === 'admin' || member.role === 'OWNER' ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                    {member.role === 'OWNER' ? 'admin' : member.role}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => onViewActivity(member)} className="w-10 h-10 flex items-center justify-center text-blue-500 hover:text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-full transition active:scale-95" title="View Activity">
                      <Activity size={18} />
                    </button>
                    <button onClick={() => onEditStaff(member)} className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 rounded-full transition active:scale-95" title="Edit Role">
                      <Pencil size={18} />
                    </button>
                    <button 
                      onClick={() => onDeleteStaff(member.id)} 
                      disabled={member.email === userEmail} 
                      className="w-10 h-10 flex items-center justify-center text-red-500 hover:text-red-600 bg-red-50 hover:bg-red-100 rounded-full transition active:scale-95 disabled:opacity-50" 
                      title="Delete User"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!isTeamLoading && teamMembers.length === 0 && <tr><td colSpan={3} className="py-12 text-center text-gray-400 font-medium">No team members found</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}