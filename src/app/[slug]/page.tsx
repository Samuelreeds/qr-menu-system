import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import MenuClient from '@/components/MenuClient';

export const revalidate = 0; // Force dynamic fetching

export default async function ShopMenuPage({ params }: { params: Promise<{ slug: string }> }) {
  
  const resolvedParams = await params;

  const shop: any = await (prisma as any).shop.findUnique({
    where: { id: resolvedParams.slug },
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

  if (!shop) {
    notFound();
  }

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
    facebook: safeSettings.facebook || '',
    showFacebook: safeSettings.showFacebook || false,
    instagram: safeSettings.instagram || '',
    showInstagram: safeSettings.showInstagram || false,
    telegram: safeSettings.telegram || '',
    showTelegram: safeSettings.showTelegram || false,
    socials: safeSettings.socials || '[]', 
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

  const formattedBanners = (shop.banners || []).map((b: any) => ({
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
    />
  );
}