"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getShopTables(shopId: string) {
  try {
    const tables = await prisma.table.findMany({
      where: { shopId },
      orderBy: { label: "asc" },
    });
    return { success: true, data: tables };
  } catch (error) {
    return { success: false, message: "Failed to fetch tables." };
  }
}

export async function createTable(shopId: string, label: string) {
  try {
    const existing = await prisma.table.findUnique({
      where: { shopId_label: { shopId, label } },
    });
    if (existing) return { success: false, message: "Table label already exists." };

    const table = await prisma.table.create({
      data: { shopId, label },
    });
    revalidatePath("/admin");
    return { success: true, data: table };
  } catch (error) {
    return { success: false, message: "Failed to create table." };
  }
}

export async function toggleTableStatus(tableId: string, shopId: string, isActive: boolean) {
  try {
    const table = await prisma.table.update({
      where: { id: tableId, shopId }, // Enforce shop ownership
      data: { isActive },
    });
    revalidatePath("/admin");
    return { success: true, data: table };
  } catch (error) {
    return { success: false, message: "Failed to update table status." };
  }
}

export async function updateTable(tableId: string, shopId: string, label: string) {
  try {
    // Check for duplicate label within the same shop
    const existing = await prisma.table.findUnique({
      where: { shopId_label: { shopId, label } },
    });
    if (existing && existing.id !== tableId) {
      return { success: false, message: "Table label already exists." };
    }

    const table = await prisma.table.update({
      where: { id: tableId, shopId },
      data: { label },
    });
    revalidatePath("/admin");
    return { success: true, data: table };
  } catch (error) {
    return { success: false, message: "Failed to update table." };
  }
}

export async function deleteTable(tableId: string, shopId: string) {
  try {
    await prisma.table.delete({
      where: { id: tableId, shopId },
    });
    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    return { success: false, message: "Failed to delete table." };
  }
}