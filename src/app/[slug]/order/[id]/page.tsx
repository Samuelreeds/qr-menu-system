import OrderStatusClient from '@/components/customer/OrderStatusClient';
import { prisma } from '@/lib/prisma';

export default async function OrderStatusPage({ 
  params 
}: { 
  params: Promise<{ slug: string, id: string }> 
}) {
  const resolvedParams = await params;
  
  const order = await prisma.order.findUnique({
    where: { id: resolvedParams.id },
    include: { items: true }
  });

  if (!order) return <div>Order not found</div>;

  return <OrderStatusClient initialOrder={order} />;
}