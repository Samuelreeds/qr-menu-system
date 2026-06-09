// src/app/[shopSlug]/page.tsx
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import MenuClient from '@/components/shared/MenuClient';
import CustomerEntryGate from '@/components/shared/CustomerEntryGate';
import { getShopLimitsAndFeatures } from '@/lib/shop-guard';

export const revalidate = 0; 

export default async function ShopMenuPage({ 
  params,
  searchParams, 
}: { 
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  
  const resolvedParams = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  
  const rawTableId = resolvedSearchParams.tableId;
  const tableId = Array.isArray(rawTableId) ? rawTableId[0] : rawTableId;

  // Use findFirst with OR to support both the new slug and legacy shop IDs
  const shop: any = await (prisma as any).shop.findFirst({
    where: { 
      OR: [
        { slug: resolvedParams.slug },
        { id: resolvedParams.slug }
      ]
    },
    include: {
      categories: {
          orderBy: { sortOrder: 'asc' }
      },
      settings: true,
      banners: {
        orderBy: { sortOrder: 'asc' }
      },
      products: {
        where: {
          deletedAt: null, // <-- ADD THIS LINE
        },
        include: {
          category: true,
          variants: true, 
        },
      },
    },
  });

  // SECURITY GUARD: Prevent public access to locked or soft-deleted shops
  if (!shop || shop.status === 'LOCKED' || shop.deletedAt) {
    notFound();
  }

  // ==========================================
  // TABLE VALIDATION LOGIC
  // ==========================================
  let tableContext = {
    isValid: false,
    tableId: null as string | null,
    tableLabel: null as string | null,
  };

  if (tableId) {
    const tableRecord = await (prisma as any).table.findUnique({
      where: { id: tableId },
    });

    if (tableRecord && tableRecord.shopId === shop.id && tableRecord.isActive) {
      tableContext = {
        isValid: true,
        tableId: tableRecord.id,
        tableLabel: tableRecord.label,
      };
    }
  }

  // ENFORCEMENT: Fetch the effective capabilities for this shop to apply downgrade logic
  const planLimits = await getShopLimitsAndFeatures(shop.id);
  
  const effectiveMaxBanners = (planLimits as any)?.maxBanners || 1;
  const effectiveCustomSocials = (planLimits as any)?.customSocials || false;
  const multiLanguageEnabled = !!(planLimits as any)?.featMultipleLanguage;
  
  // SUPERADMIN FEATURE GATES
  const canUseCampaign = !!(planLimits as any)?.featCampaign;
  const canUseTelegram = !!(planLimits as any)?.featAlertBarista;

  // DETERMINE IF CALL STAFF IS FULLY ACTIVE
  const isStaffCallActive = canUseTelegram && shop.telegramNotificationsEnabled !== false && shop.callStaffEnabled && !!shop.telegramChatId;

  const safeSettings = shop.settings || {
    name: shop.name,
    name_kh: '',
    nameDisplay: 'EN',
    address: '',
    phone: '',
    openingHours: '',
    is24Hours: false,
    themeColor: '#000000',
    headerDesign: 'design1',
    logo: '', 
    logoType: 'withBackground',
    facebook: '',
    showFacebook: false,
    instagram: '',
    showInstagram: false,
    telegram: '',
    showTelegram: false,
    socials: '[]', 
    qrImage: null, // <--- ADDED QR IMAGE FALLBACK
  };

  const formattedSettings = {
    name: safeSettings.name || shop.name,
    name_kh: safeSettings.name_kh || '',
    nameDisplay: safeSettings.nameDisplay || 'EN',
    address: safeSettings.address || '',
    phone: safeSettings.phone || '',
    openingHours: safeSettings.is24Hours ? 'Open 24 Hours' : (safeSettings.openingHours || ''),
    themeColor: safeSettings.themeColor || '#000000', 
    headerDesign: safeSettings.headerDesign || 'design1', 
    logo: safeSettings.logo || '', 
    logoType: safeSettings.logoType || 'withBackground', 
    facebook: safeSettings.facebook || '',
    showFacebook: safeSettings.showFacebook || false,
    instagram: safeSettings.instagram || '',
    showInstagram: safeSettings.showInstagram || false,
    telegram: safeSettings.telegram || '',
    showTelegram: safeSettings.showTelegram || false,
    socials: effectiveCustomSocials ? (safeSettings.socials || '[]') : '[]', 
    qrImage: safeSettings.qrImage || null, // <--- ADDED QR IMAGE PAYLOAD
  };

  const formattedCategories = (shop.categories || []).map((cat: any) => ({
    id: cat.id,
    name: cat.name,
    name_kh: cat.name_kh || null,
    name_zh: cat.name_zh || null,
    discount: cat.discount || 0,
  }));

  const formattedProducts = (shop.products || []).map((product: any) => ({
    id: product.id,
    name: product.name,
    name_kh: product.name_kh || null,
    name_zh: product.name_zh || null,
    price: product.price,
    variants: product.variants, 
    rating: product.rating || 5.0, 
    time: product.time || '10-15 min', 
    image: product.image || '', 
    categoryId: product.categoryId,
    category: { 
      name: product.category?.name || 'Uncategorized',
      discount: product.category?.discount || 0
    },
    isPopular: product.isPopular || false,
    isSoldOut: product.isSoldOut || false,
    discount: product.discount || 0,
  }));

  const formattedBanners = (shop.banners || [])
    .slice(0, effectiveMaxBanners)
    .map((b: any) => ({
      id: b.id,
      image: b.image,
      sortOrder: b.sortOrder,
    }));

  return (
    <main className="relative min-h-screen">
      <CustomerEntryGate 
        shopId={shop.id}
        shopSlug={shop.slug}
        shopName={formattedSettings.name} 
        tableContext={tableContext} 
        isStaffCallActive={isStaffCallActive}
      />
      <MenuClient
        initialProducts={formattedProducts}
        categories={formattedCategories}
        shopSettings={formattedSettings}
        banners={formattedBanners}
        multiLanguageEnabled={multiLanguageEnabled}
        featCampaign={canUseCampaign}
        isStaffCallActive={isStaffCallActive}
        tableContext={tableContext}
        shopId={shop.id}
        shopSlug={shop.slug}
      />
    </main>
  );
}