import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import MenuClient from '@/components/MenuClient';
import { getShopLimitsAndFeatures } from '@/lib/shop-guard';

export const revalidate = 0; 

export default async function ShopMenuPage({ params }: { params: Promise<{ slug: string }> }) {
  
  const resolvedParams = await params;

  // Use findFirst with OR to support both the new slug and legacy shop IDs
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
      banners: {
        orderBy: { sortOrder: 'asc' }
      },
      products: {
        include: {
          category: true,
        },
      },
    },
  });

  // SECURITY GUARD: Prevent public access to locked or soft-deleted shops
  if (!shop || shop.status === 'LOCKED' || shop.deletedAt) {
    notFound();
  }

  // ENFORCEMENT: Fetch the effective capabilities for this shop to apply downgrade logic
  const planLimits = await getShopLimitsAndFeatures(shop.id);
  
  const effectiveMaxBanners = (planLimits as any)?.maxBanners || 1;
  const effectivePremiumThemes = (planLimits as any)?.premiumThemes || false;
  const effectiveCustomSocials = (planLimits as any)?.customSocials || false;
  const multiLanguageEnabled = !!(planLimits as any)?.featMultipleLanguage;

  const safeSettings = shop.settings || {
    name: shop.name,
    name_kh: '',
    nameDisplay: 'EN',
    address: '',
    phone: '',
    openingHours: '',
    themeColor: '#000000',
    headerDesign: 'design1',
    logo: '', 
    facebook: '',
    showFacebook: false,
    instagram: '',
    showInstagram: false,
    telegram: '',
    showTelegram: false,
    socials: '[]', 
  };

  // DATA SYNC: Read visual configurations directly from the database value.
  // Enforcement happens during the save/update action in the admin dashboard.
  const formattedSettings = {
    name: safeSettings.name || shop.name,
    name_kh: safeSettings.name_kh || '',
    nameDisplay: safeSettings.nameDisplay || 'EN',
    address: safeSettings.address || '',
    phone: safeSettings.phone || '',
    openingHours: safeSettings.openingHours || '',
    themeColor: effectivePremiumThemes ? (safeSettings.themeColor || '#000000') : '#000000',
    headerDesign: effectivePremiumThemes ? (safeSettings.headerDesign || 'design1') : 'design1',
    logo: safeSettings.logo || '', 
    facebook: safeSettings.facebook || '',
    showFacebook: safeSettings.showFacebook || false,
    instagram: safeSettings.instagram || '',
    showInstagram: safeSettings.showInstagram || false,
    telegram: safeSettings.telegram || '',
    showTelegram: safeSettings.showTelegram || false,
    socials: effectiveCustomSocials ? (safeSettings.socials || '[]') : '[]', 
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
    rating: product.rating || 5.0, 
    time: product.time || '10-15 min', 
    image: product.image || '', 
    categoryId: product.categoryId,
    category: { 
      name: product.category?.name || 'Uncategorized',
      discount: product.category?.discount || 0
    },
    isPopular: product.isPopular || false,
    discount: product.discount || 0,
  }));

  // ENFORCEMENT: Slice banners array if shop exceeds its allowed limit after downgrade.
  const formattedBanners = (shop.banners || [])
    .slice(0, effectiveMaxBanners)
    .map((b: any) => ({
      id: b.id,
      image: b.image,
      sortOrder: b.sortOrder,
    }));

  return (
    <MenuClient
      initialProducts={formattedProducts}
      categories={formattedCategories}
      shopSettings={formattedSettings}
      banners={formattedBanners}
      multiLanguageEnabled={multiLanguageEnabled}
    />
  );
}