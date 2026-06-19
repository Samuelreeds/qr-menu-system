// src/lib/session-actions.ts
'use server'

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function closeSession(sessionId: string) {
  try {
    await prisma.tableSession.update({
      where: { id: sessionId },
      data: { status: "CLOSED" }
    });
    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to close session." };
  }
}