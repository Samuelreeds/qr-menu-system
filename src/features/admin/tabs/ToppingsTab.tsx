// src/features/admin/tabs/ToppingsTab.tsx
import React from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';

export interface Topping { 
  id: string; 
  name: string; 
  price: number; 
  isDrink: boolean; 
}

interface ToppingsTabProps {
  toppings: Topping[];
  onAddTopping: () => void;
  onEditTopping: (topping: Topping) => void;
  onDeleteTopping: (id: string, name: string) => void;
}

export default function ToppingsTab({
  toppings,
  onAddTopping,
  onEditTopping,
  onDeleteTopping
}: ToppingsTabProps) {
  return (
    <>
      <div className="flex justify-between items-center gap-4 mb-6">
          <div>
            <h3 className="font-bold text-gray-900 text-xl sm:text-2xl hidden sm:block">Manage Toppings</h3>
            <p className="text-sm text-gray-500 mt-1 hidden sm:block">Create toppings that cashiers can add to drinks or food during checkout.</p>
          </div>
         <button onClick={onAddTopping} className={`hidden lg:flex ml-auto shrink-0 bg-gray-900 text-white hover:bg-gray-800 px-6 py-3.5 rounded-2xl font-bold active:scale-95 transition shadow-sm items-center justify-center gap-2 text-[16px] md:text-sm`}>
           <Plus size={18} strokeWidth={3}/> Add Topping
         </button>
      </div>
      
      {toppings.length === 0 ? (
         <div className="py-16 text-center text-gray-400 font-medium bg-white rounded-3xl border border-gray-100 shadow-sm">No toppings created yet</div>
      ) : (
         <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
           <table className="w-full text-left border-collapse">
             <thead>
               <tr className="border-b border-gray-50 text-xs font-bold text-gray-400 uppercase tracking-wider bg-gray-50/50">
                 <th className="p-5">Topping Name</th>
                 <th className="p-5">Type</th>
                 <th className="p-5">Extra Price</th>
                 <th className="p-5 text-right">Actions</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-gray-50">
               {toppings.map((topping: Topping) => (
                 <tr key={topping.id} className="hover:bg-gray-50/50 transition-colors">
                   <td className="p-5 font-bold text-gray-900">{topping.name}</td>
                   <td className="p-5">
                     <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md ${topping.isDrink ? 'bg-blue-50 text-blue-600 border border-blue-200' : 'bg-orange-50 text-orange-600 border border-orange-200'}`}>
                       {topping.isDrink ? 'Drink' : 'Food'}
                     </span>
                   </td>
                   <td className="p-5 font-bold text-gray-600">
                     {topping.price > 0 ? `+$${topping.price.toFixed(2)}` : 'Free'}
                   </td>
                   <td className="p-5 text-right">
                     <div className="flex items-center justify-end gap-2">
                       <button onClick={() => onEditTopping(topping)} className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 rounded-full transition active:scale-95"><Pencil size={18} /></button>
                       <button onClick={() => onDeleteTopping(topping.id, topping.name)} className="w-10 h-10 flex items-center justify-center text-red-500 hover:text-red-600 bg-red-50 hover:bg-red-100 rounded-full transition active:scale-95"><Trash2 size={18} /></button>
                     </div>
                   </td>
                 </tr>
               ))}
             </tbody>
           </table>
         </div>
      )}
      <button onClick={onAddTopping} className="lg:hidden fixed bottom-6 right-6 z-10 bg-gray-900 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-xl active:scale-95 transition-transform hover:bg-gray-800"><Plus size={24} strokeWidth={3} /></button>
    </>
  );
}