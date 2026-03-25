"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function toggleShopTelegramNotifications(shopId: string, enabled: boolean) {
  try {
    // In production, you would wrap this in a SuperAdmin session check
    
    await prisma.shop.update({
      where: { id: shopId },
      data: { telegramNotificationsEnabled: enabled }
    });
    
    // Revalidate heavily to ensure admin panels immediately reflect the change
    revalidatePath('/', 'layout'); 
    
    return { success: true };
  } catch (error) {
    console.error("Failed to toggle Telegram notifications:", error);
    return { success: false, message: "Failed to update feature toggle." };
  }
}