// app/[slug]/[department]/page.tsx
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import MenuClient from '@/components/MenuClient';
import CustomerEntryGate from '@/components/CustomerEntryGate';
import { getShopLimitsAndFeatures } from '@/lib/shop-guard';

export const revalidate = 0; 

export default async function ShopMenuPage({ 
  params,
  searchParams, 
}: { 
  params: Promise<{ slug: string, department: string }>; 
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedParams = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  
  // 1. Get department from URL (defaults to coffee if invalid)
  const department = resolvedParams.department === 'pub' ? 'pub' : 'coffee';
  
  const rawTableId = resolvedSearchParams.tableId;
  const tableId = Array.isArray(rawTableId) ? rawTableId[0] : rawTableId;

  const shop: any = await (prisma as any).shop.findFirst({
    where: { 
      OR: [
        { slug: resolvedParams.slug },
        { id: resolvedParams.slug }
      ]
    },
    include: {
      categories: true,
      settings: true,
      banners: { orderBy: { sortOrder: 'asc' } },
      products: {
        include: {
          category: true,
          variants: true,
        },
      },
    },
  });

  if (!shop || shop.status === 'LOCKED' || shop.deletedAt) {
    notFound();
  }

  let tableContext = { isValid: false, tableId: null as string | null, tableLabel: null as string | null };

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

  const planLimits = await getShopLimitsAndFeatures(shop.id);
  const effectiveMaxBanners = (planLimits as any)?.maxBanners || 1;
  const effectiveCustomSocials = (planLimits as any)?.customSocials || false;
  const multiLanguageEnabled = !!(planLimits as any)?.featMultipleLanguage;
  const canUseCampaign = !!(planLimits as any)?.featCampaign;
  const canUseTelegram = !!(planLimits as any)?.featAlertBarista;

  const isStaffCallActive = canUseTelegram && shop.telegramNotificationsEnabled !== false && shop.callStaffEnabled && !!shop.telegramChatId;

  const safeSettings = shop.settings || { name: shop.name, nameDisplay: 'EN', themeColor: '#000000', headerDesign: 'design1', socials: '[]' };

  const formattedSettings = {
    name: safeSettings.name || shop.name,
    name_kh: safeSettings.name_kh || '',
    nameDisplay: safeSettings.nameDisplay || 'EN',
    address: safeSettings.address || '',
    phone: safeSettings.phone || '',
    openingHours: safeSettings.openingHours || '',
    themeColor: safeSettings.themeColor || '#000000', 
    headerDesign: safeSettings.headerDesign || 'design1', 
    logo: safeSettings.logo || '', 
    logoType: safeSettings.logoType || 'withBackground', 
    facebook: safeSettings.facebook || '', showFacebook: safeSettings.showFacebook || false,
    instagram: safeSettings.instagram || '', showInstagram: safeSettings.showInstagram || false,
    telegram: safeSettings.telegram || '', showTelegram: safeSettings.showTelegram || false,
    socials: effectiveCustomSocials ? (safeSettings.socials || '[]') : '[]', 
  };

  // 2. Format and strictly filter products by department
  const allProducts = (shop.products || []).map((product: any) => ({
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
    department: (product.department || 'coffee').toLowerCase(),
    category: { 
      name: product.category?.name || 'Uncategorized',
      discount: product.category?.discount || 0
    },
    isPopular: product.isPopular || false,
    isSoldOut: product.isSoldOut || false,
    discount: product.discount || 0,
  }));

  const formattedProducts = allProducts.filter((p: any) => p.department === department);

  // 3. Filter Categories to ONLY show those that have products in THIS department
  const activeCategoryNames = new Set(formattedProducts.map((p: any) => p.category.name));
  
  const formattedCategories = (shop.categories || [])
    .filter((cat: any) => activeCategoryNames.has(cat.name))
    .map((cat: any) => ({
      id: cat.id, name: cat.name, name_kh: cat.name_kh || null, name_zh: cat.name_zh || null, discount: cat.discount || 0,
    }));

  const formattedBanners = (shop.banners || []).slice(0, effectiveMaxBanners).map((b: any) => ({ id: b.id, image: b.image, sortOrder: b.sortOrder }));

  return (
    <main className="relative min-h-screen">
      <CustomerEntryGate shopId={shop.id} shopSlug={shop.slug} shopName={formattedSettings.name} tableContext={tableContext} isStaffCallActive={isStaffCallActive} />
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