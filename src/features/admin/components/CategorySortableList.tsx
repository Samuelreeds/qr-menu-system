'use client';

import React from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import SortableCategoryItem from './SortableCategoryItem';
import { Category } from '@/features/admin/AdminDashboard';

interface Props {
  categories: Category[];
  onReorder: (activeId: string, overId: string) => void;
  onEdit: (cat: Category) => void;
  onDelete: (id: string, name: string) => void;
}

export default function CategorySortableList({ categories, onReorder, onEdit, onDelete }: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }), // Requires 5px drag to trigger (avoids accidental clicks)
    useSensor(TouchSensor, { activationConstraint: { delay: 100, tolerance: 5 } }), 
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      onReorder(active.id as string, over.id as string);
    }
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={categories.map(c => c.id)} strategy={verticalListSortingStrategy}>
        <div className="w-full flex flex-col space-y-3 pb-8">
          {categories.map((cat) => (
            <SortableCategoryItem 
              key={cat.id} 
              category={cat} 
              onEdit={onEdit} 
              onDelete={onDelete} 
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}