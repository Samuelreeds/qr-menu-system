"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export type StaffRequestStatus = "PENDING" | "ACKNOWLEDGED" | "COMPLETED" | "CANCELLED";

export async function getShopStaffRequests(shopId: string) {
  try {
    const requests = await prisma.staffCallRequest.findMany({
      where: { shopId },
      include: {
        table: {
          select: {
            label: true
          }
        }
      },
      orderBy: { createdAt: "desc" },
      take: 100, // Limit to recent 100 for performance
    });

    // Map the raw DB result to match the frontend RequestItem interface
    const formattedRequests = requests.map(req => ({
      id: req.id,
      tableNumber: req.table?.label || "Unknown",
      status: req.status,
      createdAt: req.createdAt,
      resolvedAt: req.resolvedAt,
    }));

    return { success: true, data: formattedRequests };
  } catch (error) {
    console.error("Error fetching staff requests:", error);
    return { success: false, message: "Failed to fetch requests" };
  }
}

export async function updateStaffRequestStatus(
  requestId: string,
  shopId: string,
  newStatus: StaffRequestStatus
) {
  try {
    const updateData: any = { status: newStatus };

    // Set resolvedAt timestamp if finishing the request
    if (newStatus === "COMPLETED" || newStatus === "CANCELLED") {
      updateData.resolvedAt = new Date();
    } else {
      updateData.resolvedAt = null; 
    }

    const updatedRequest = await prisma.staffCallRequest.update({
      where: {
        id: requestId,
        shopId: shopId, // Security check: Ensure request belongs to the shop
      },
      data: updateData,
    });

    revalidatePath("/admin"); // Adjust path if your dashboard route is different
    return { success: true, data: updatedRequest };
  } catch (error) {
    console.error("Error updating request status:", error);
    return { success: false, message: "Failed to update request" };
  }
}