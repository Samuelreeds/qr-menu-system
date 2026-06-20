import CheckoutClient from '@/components/customer/CheckoutClient';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';

export default async function CartPage({ 
  params,
  searchParams, 
}: { 
  params: Promise<{ shopSlug: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedParams = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  
  const rawTableId = resolvedSearchParams.tableId;
  const tableId = Array.isArray(rawTableId) ? rawTableId[0] : rawTableId || "";

  // 1. Fetch the exact Shop using the URL slug
  // 1. Fetch the exact Shop using the URL shopSlug
  const shop = await prisma.shop.findFirst({
    where: {
      OR: [
        { slug: resolvedParams.shopSlug }, // <-- FIX 1: Changed shopSlug to slug
        { id: resolvedParams.shopSlug }
      ]
    },
    select: {
      id: true,
      slug: true, // <-- FIX 2: Changed shopSlug to slug here as well
      name: true,
      status: true,
      deletedAt: true
    }
  });
  if (!shop || shop.status === 'LOCKED' || shop.deletedAt) {
    notFound();
  }

  // 2. Resolve the exact Table Label (if the customer scanned a specific table QR)
  let tableLabel = "Walk-in";
  
  if (tableId) {
    const tableRecord = await prisma.table.findUnique({
      where: { id: tableId },
      select: { label: true, shopId: true, isActive: true }
    });
    
    // Ensure the table actually belongs to this shop and is active
    if (tableRecord && tableRecord.shopId === shop.id && tableRecord.isActive) {
      tableLabel = tableRecord.label;
    }
  }

  // 3. Render the Client Checkout UI with the fetched server data
  return (
    <div className="min-h-screen bg-gray-50 pt-10">
      <CheckoutClient 
        shopId={shop.id} 
        shopSlug={shop.slug} 
        shopName={shop.name} 
        tableLabel={tableLabel}
        tableId={tableId}
      />
    </div>
  );
}