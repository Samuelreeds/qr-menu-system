'use client';

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Pencil, Trash2 } from 'lucide-react';
import { Category } from '@/features/admin/AdminDashboard'; 

interface Props {
  category: Category;
  onEdit: (cat: Category) => void;
  onDelete: (id: string, name: string) => void;
}

export default function SortableCategoryItem({ category, onEdit, onDelete }: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center justify-between p-4 bg-white border rounded-2xl transition-all ${
        isDragging 
          ? 'border-gray-900 shadow-xl opacity-90 scale-[1.02]' 
          : 'border-gray-100 shadow-sm hover:border-gray-300'
      }`}
    >
      <div className="flex items-center gap-4">
        {/* Drag Handle */}
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="p-2 -ml-2 text-gray-300 hover:text-gray-900 cursor-grab active:cursor-grabbing rounded-lg hover:bg-gray-50 transition-colors touch-none"
        >
          <GripVertical size={20} />
        </button>
        
        <div>
          <h4 className="font-bold text-gray-800 text-base">{category.name}</h4>
          <div className="flex items-center gap-2 mt-1">
            {category.discount ? (
              <span className="text-[10px] text-red-600 font-bold bg-red-50 px-2 py-0.5 rounded-md uppercase tracking-wide">
                {category.discount}% OFF
              </span>
            ) : null}
            {category.isDrink && (
              <span className="text-[10px] text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded-md uppercase tracking-wide">
                Drink
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={(e) => { e.stopPropagation(); onEdit(category); }}
          className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 rounded-full transition-all active:scale-95"
        >
          <Pencil size={16} />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(category.id, category.name); }}
          className="w-10 h-10 flex items-center justify-center text-red-500 hover:text-white bg-red-50 hover:bg-red-500 rounded-full transition-all active:scale-95"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}