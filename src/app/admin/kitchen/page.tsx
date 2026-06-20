// src/app/admin/kitchen/page.tsx
import { prisma } from "@/lib/prisma";
import KitchenDisplayClient from "@/components/kitchen/KitchenDisplayClient";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export default async function KitchenDisplayPage() {
  const session = await getServerSession();
  if (!session?.user?.email) redirect('/login');

  // 1. Fetch user and their shop from DB
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { shopUsers: { include: { shop: true } } }
  });

  if (!user || user.shopUsers.length === 0) return <div>Access Denied: No shop found.</div>;

  const shopId = user.shopUsers[0].shop.id;

  // 2. Fetch active kitchen orders
  const orders = await (prisma as any).order.findMany({
    where: {
      shopId: shopId,
      status: { in: ['PENDING', 'ACCEPTED', 'PREPARING'] }
    },
    include: {
      items: {
        include: { product: true }
      }
    },
    orderBy: { createdAt: 'asc' }
  });

  return (
    <KitchenDisplayClient 
      shopId={shopId} 
      initialOrders={orders} 
    />
  );
}