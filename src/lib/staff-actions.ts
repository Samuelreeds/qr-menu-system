"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getShopLimitsAndFeatures } from "@/lib/shop-guard";

export async function requestStaffAssistance(
  shopId: string,
  shopSlug: string,
  shopName: string,
  tableId: string
) {
  try {
    // ------------------------------------------------------------------
    // 1. PLAN ENTITLEMENT ENFORCEMENT
    // ------------------------------------------------------------------
    const planLimits: any = await getShopLimitsAndFeatures(shopId);
    if (!planLimits?.featAlertBarista) {
      return { success: false, message: "Telegram notifications are not enabled for this plan." };
    }

    // ------------------------------------------------------------------
    // 2. SHOP SETTINGS VALIDATION
    // ------------------------------------------------------------------
    const shop = await prisma.shop.findUnique({
      where: { id: shopId },
      select: { 
        callStaffEnabled: true, 
        telegramChatId: true, 
        staffCallTopicId: true 
      },
    });

    if (!shop) return { success: false, message: "Shop not found." };
    if (shop.callStaffEnabled === false) return { success: false, message: "Staff assistance is currently disabled for this shop." };
    if (!shop.telegramChatId) return { success: false, message: "Shop is not configured to receive notifications." };

    // ------------------------------------------------------------------
    // 3. TABLE VALIDATION
    // ------------------------------------------------------------------
    const table = await prisma.table.findUnique({
      where: { id: tableId },
    });

    if (!table || table.shopId !== shopId || !table.isActive) return { success: false, message: "Invalid or inactive table." };

    // ------------------------------------------------------------------
    // 4. COOLDOWN PROTECTION
    // ------------------------------------------------------------------
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
    const recentRequest = await prisma.staffCallRequest.findFirst({
      where: {
        shopId: shopId,
        tableId: tableId,
        createdAt: { gte: twoMinutesAgo },
      },
    });

    if (recentRequest) return { success: false, message: "Staff already notified. Please wait a moment." };

    // ------------------------------------------------------------------
    // 5. CREATE REQUEST
    // ------------------------------------------------------------------
    const newRequest = await prisma.staffCallRequest.create({
      data: { shopId: shopId, tableId: tableId, status: "PENDING" },
    });

    // ------------------------------------------------------------------
    // 6. NOTIFY TELEGRAM & TRACK MESSAGE ID
    // ------------------------------------------------------------------
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) return { success: false, message: "System configuration error." };

    const time = new Date().toLocaleString("en-US", { 
      timeZone: "Asia/Phnom_Penh", 
      hour12: false, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
    });
    
    const message = `🔔 *Staff Call Request*\nShop: ${shopName}\nSlug: ${shopSlug}\nTable: ${table.label}\nType: Call Staff\nTime: ${time}`;

    const payload: any = {
      chat_id: shop.telegramChatId,
      text: message,
      parse_mode: "Markdown"
    };

    if (shop.staffCallTopicId) {
      payload.message_thread_id = shop.staffCallTopicId;
    }

    const tgResponse = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const tgData = await tgResponse.json();

    if (!tgResponse.ok) {
      console.error("Telegram API Error:", tgData);
    } else if (tgData.ok && tgData.result?.message_id) {
      // Message successfully sent. Store the exact message ID for 24hr auto-delete.
      await prisma.staffCallRequest.update({
        where: { id: newRequest.id },
        data: {
          telegramMessageId: tgData.result.message_id.toString(),
          telegramChatId: shop.telegramChatId,
          telegramSentAt: new Date()
        }
      });
    }

    return { success: true };
  } catch (error) {
    return { success: false, message: "An unexpected error occurred. Please try again." };
  }
}

export async function updateStaffSettingsAction(
  shopId: string, 
  enabled: boolean, 
  chatId: string,
  staffCallTopicId: string,
  newOrderTopicId: string
) {
  try {
    const planLimits: any = await getShopLimitsAndFeatures(shopId);
    if (!planLimits?.featAlertBarista) {
      return { success: false, message: "Feature not included in current plan." };
    }

    await prisma.shop.update({
      where: { id: shopId },
      data: {
        callStaffEnabled: enabled,
        telegramChatId: chatId.trim() === "" ? null : chatId.trim(),
        staffCallTopicId: staffCallTopicId.trim() === "" ? null : staffCallTopicId.trim(),
        newOrderTopicId: newOrderTopicId.trim() === "" ? null : newOrderTopicId.trim(),
      },
    });
    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("Failed to update staff settings:", error);
    return { success: false, message: "Failed to save notification settings." };
  }
}

export async function sendTestTelegramNotification(
  shopId: string, 
  chatId: string, 
  shopName: string, 
  topicId?: string,
  typeName?: string
) {
  try {
    const planLimits: any = await getShopLimitsAndFeatures(shopId);
    if (!planLimits?.featAlertBarista) {
      return { success: false, message: "Telegram notifications are not enabled for this plan." };
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) return { success: false, message: "Bot token not configured on server." };

    const message = `✅ *Test Notification: ${typeName || 'General'}*\nShop: ${shopName}\n\nYour Telegram routing is working perfectly!`;

    const payload: any = {
      chat_id: chatId.trim(),
      text: message,
      parse_mode: "Markdown",
    };

    if (topicId && topicId.trim() !== '') {
      payload.message_thread_id = topicId.trim();
    }

    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) return { success: false, message: "Telegram rejected the message. Double-check your Chat ID / Topic ID." };
    return { success: true, message: `Test message sent to ${typeName || 'General'}!` };
  } catch (error) {
    return { success: false, message: "Failed to send test message." };
  }
}