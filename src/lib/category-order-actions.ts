'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function updateCategoryOrders(orderedIds: string[]) {
  try {
    // Perform a transactional sequential update
    const updates = orderedIds.map((id, index) =>
      prisma.category.update({
        where: { id },
        data: { sortOrder: index + 1 },
      })
    );

    await prisma.$transaction(updates);
    
    // Revalidate paths if you use server components for data fetching
    revalidatePath('/', 'layout');
    
    return { success: true };
  } catch (error) {
    console.error('Failed to update category order:', error);
    return { success: false, error: 'Failed to update category order' };
  }
}