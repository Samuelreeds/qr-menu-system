// src/lib/customer-actions.ts
"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function placeCustomerOrder(data: {
  shopId: string;
  tableNumber?: string; // Support both incoming prop names
  tableId?: string; 
  total: number;
  items: any[];
}) {
  try {
    // Extract the table label (e.g., "T1") safely
    const tableLabel = data.tableNumber || data.tableId || "Unknown";

    return await prisma.$transaction(async (tx) => {
      // 1. Find the table to get its real database ID
      const table = await tx.table.findUnique({
        where: { shopId_label: { shopId: data.shopId, label: tableLabel } }
      });
      
      if (!table) throw new Error("Table not found");

      // 2. Find or Create Active Session
      let session = await tx.tableSession.findFirst({
        where: { tableId: table.id, status: "ACTIVE" }
      });

      if (!session) {
        session = await tx.tableSession.create({
          data: { 
            shopId: data.shopId, 
            status: "ACTIVE",
            table: { connect: { id: table.id } } // Explicitly connect the table
          }
        });
      }

      // 3. Generate Order Number
      const currentOrderCount = await tx.order.count({ where: { shopId: data.shopId } });
      const generatedOrderNumber = `# CUST-${String(currentOrderCount + 1).padStart(4, '0')}`;

      // 4. Create Order linked to the Session
      const order = await tx.order.create({
        data: {
          shopId: data.shopId,
          tableSessionId: session.id, // Correct relation
          orderNumber: generatedOrderNumber,
          orderType: "TABLE",
          tableNumber: tableLabel, // Store the label "T1" here, NOT the tableId
          subtotal: data.total,
          discount: 0,
          tax: 0,
          total: data.total,
          currency: "USD",
          status: "PENDING",
          isPaid: false,
          paymentMethod: "CASH",
          items: {
            create: data.items.map(item => ({
              productId: item.id,
              name: item.name,
              price: item.price,
              quantity: item.quantity,
            }))
          }
        },
        include: { items: true }
      });

      return { success: true, order };
    });
  } catch (error: any) {
    console.error("Place Order Error:", error);
    return { success: false, error: error.message || "Failed to place order." };
  }
}

export async function updateStaffDecision(orderId: string, status: "ACCEPTED" | "REJECTED", reason?: string) {
  try {
    await prisma.order.update({
      where: { id: orderId },
      data: { 
        status: status as any, 
        rejectionReason: reason || null
      }
    });
    revalidatePath("/admin");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: "Failed to update decision." };
  }
}