import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  // Optional security check if triggered externally (like via Vercel Cron or GitHub Actions)
  const authHeader = req.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    return NextResponse.json({ error: "Telegram Bot Token is missing" }, { status: 500 });
  }

  // Calculate the timestamp for 24 hours ago
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  try {
    // Find up to 50 alerts sent more than 24 hours ago that still have an active Message ID
    const expiredRequests = await prisma.staffCallRequest.findMany({
      where: {
        telegramMessageId: { not: null },
        telegramChatId: { not: null },
        telegramSentAt: { lte: twentyFourHoursAgo },
      },
      take: 50, 
    });

    let deletedCount = 0;
    let failedCount = 0;

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

        // 200 OK means it was successfully deleted. 
        // 400 Bad Request usually means the message was already deleted manually by staff.
        // In both cases, we remove the tracking ID so we stop trying to delete it.
        if (res.ok || res.status === 400) {
          await prisma.staffCallRequest.update({
            where: { id: alert.id },
            data: { telegramMessageId: null } 
          });
          deletedCount++;
        } else {
          failedCount++;
          console.error(`Telegram delete failed for record ${alert.id}:`, await res.text());
        }
      } catch (err) {
        failedCount++;
        console.error(`Network error while deleting record ${alert.id}:`, err);
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: "Cleanup complete", 
      processed: expiredRequests.length,
      deletedOrCleared: deletedCount,
      failed: failedCount
    });

  } catch (error) {
    console.error("Cleanup cron failed:", error);
    return NextResponse.json({ error: "Internal server error during cleanup" }, { status: 500 });
  }
}