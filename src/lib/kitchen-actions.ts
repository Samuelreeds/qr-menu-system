'use server'

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

/**
 * Updates the status of an order from the Kitchen Display System
 */
export async function updateKitchenOrderStatus(orderId: string, newStatus: "PREPARING" | "READY") {
  try {
    const order = await prisma.order.update({
      where: { id: orderId },
      data: { status: newStatus }
    });
    
    // Revalidate paths where this order might be displayed
    revalidatePath("/admin/kitchen");
    revalidatePath("/admin");
    
    return { success: true, order };
  } catch (error: any) {
    console.error("Failed to update kitchen order status:", error);
    return { success: false, error: "Failed to update order status." };
  }
}