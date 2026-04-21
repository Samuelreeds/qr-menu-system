import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(req: Request) {
  // Optional security check if triggered externally (like via Vercel Cron or GitHub Actions)
  const authHeader = req.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  let demoShopsDeleted = 0;
  let failedShopDeletions = 0;

  try {
    // --- 1. CLEANUP EXPIRED DEMO SHOPS ---
    const now = new Date();
    
    const expiredDemoShops = await prisma.shop.findMany({
      where: {
        isDemo: true,
        expiresAt: {
          lte: now
        }
      },
      include: {
        products: { select: { image: true } },
        banners: { select: { image: true } },
        settings: { select: { logo: true } }
      }
    });

    for (const shop of expiredDemoShops) {
       try {
          const pathsToDelete: string[] = [];
          const extractPath = (url: string | null | undefined) => {
            if (!url || url.includes('unsplash.com') || url.startsWith('data:image')) return null;
            try { 
              const parts = url.split('/uploads/');
              return parts.length > 1 ? parts[1] : null; 
            } catch { return null; }
          };

          // Collect images to delete from Supabase
          shop.products.forEach((p: any) => { const path = extractPath(p.image); if (path) pathsToDelete.push(path); });
          shop.banners.forEach((b: any) => { const path = extractPath(b.image); if (path) pathsToDelete.push(path); });
          if (shop.settings?.logo) { const path = extractPath(shop.settings.logo); if (path) pathsToDelete.push(path); }

          // Delete all related records within a transaction
          await prisma.$transaction([
            prisma.shopUser.deleteMany({ where: { shopId: shop.id } }),
            prisma.product.deleteMany({ where: { shopId: shop.id } }),
            prisma.category.deleteMany({ where: { shopId: shop.id } }),
            prisma.banner.deleteMany({ where: { shopId: shop.id } }),
            prisma.shopSettings.deleteMany({ where: { shopId: shop.id } }),
            prisma.order.deleteMany({ where: { shopId: shop.id } }), 
            prisma.table.deleteMany({ where: { shopId: shop.id } }),
            prisma.staffCallRequest.deleteMany({ where: { shopId: shop.id } }),
            prisma.ingredient.deleteMany({ where: { shopId: shop.id } }),
            prisma.stockLog.deleteMany({ where: { shopId: shop.id } }),
            prisma.shop.delete({ where: { id: shop.id } })
          ]);

          demoShopsDeleted++;

          // Delete images from Supabase if any exist
          if (pathsToDelete.length > 0) {
             await supabase.storage.from('uploads').remove(pathsToDelete);
          }

       } catch (err) {
          failedShopDeletions++;
          console.error(`Failed to delete expired demo shop ${shop.id}:`, err);
       }
    }

    // --- 2. EXISTING TELEGRAM CLEANUP LOGIC ---
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    let deletedTelegramCount = 0;
    let failedTelegramCount = 0;
    let processedTelegramRequests = 0;

    if (botToken) {
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const expiredRequests = await prisma.staffCallRequest.findMany({
          where: {
            telegramMessageId: { not: null },
            telegramChatId: { not: null },
            telegramSentAt: { lte: twentyFourHoursAgo },
          },
          take: 50, 
        });

        processedTelegramRequests = expiredRequests.length;

        for (const alert of expiredRequests) {
          try {
            const res = await fetch(`https://api.telegram.org/bot${botToken}/deleteMessage`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                chat_id: alert.telegramChatId,
                message_id: alert.telegramMessageId
              })
            });

            if (res.ok || res.status === 400) {
              await prisma.staffCallRequest.update({
                where: { id: alert.id },
                data: { telegramMessageId: null } 
              });
              deletedTelegramCount++;
            } else {
              failedTelegramCount++;
              console.error(`Telegram delete failed for record ${alert.id}:`, await res.text());
            }
          } catch (err) {
            failedTelegramCount++;
            console.error(`Network error while deleting record ${alert.id}:`, err);
          }
        }
    } else {
        console.warn("Telegram Bot Token is missing, skipping telegram cleanup.");
    }

    return NextResponse.json({ 
      success: true, 
      message: "Cleanup tasks complete", 
      demoShops: {
          deleted: demoShopsDeleted,
          failed: failedShopDeletions
      },
      telegramAlerts: {
          processed: processedTelegramRequests,
          deletedOrCleared: deletedTelegramCount,
          failed: failedTelegramCount
      }
    });

  } catch (error) {
    console.error("Cleanup cron failed:", error);
    return NextResponse.json({ error: "Internal server error during cleanup tasks" }, { status: 500 });
  }
}