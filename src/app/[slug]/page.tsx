import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import MenuClient from '@/components/MenuClient';

export const revalidate = 0; // Force dynamic fetching

// 1. Update the type to expect a Promise for params (Next.js 15 requirement)
export default async function ShopMenuPage({ params }: { params: Promise<{ slug: string }> }) {
  
  // 2. Await the params before using them!
  const resolvedParams = await params;

  // 3. Fetch data from DB using the resolved slug
  const shop = await prisma.shop.findUnique({
    where: { slug: resolvedParams.slug },
    include: {
      categories: true,
      settings: true,
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

  // Safely grab settings with a guaranteed fallback object
  const safeSettings = shop.settings || {
    name: shop.name,
    address: '',
    phone: '',
    themeColor: '#facc15',
    logo: '', 
    facebook: '',
    showFacebook: false,
    instagram: '',
    showInstagram: false,
    telegram: '',
    showTelegram: false,
  };

  // Format Settings for the Client
  const formattedSettings = {
    name: safeSettings.name || shop.name,
    address: safeSettings.address || '',
    phone: safeSettings.phone || '',
    themeColor: safeSettings.themeColor || '#facc15',
    logo: safeSettings.logo || '', 
    facebook: safeSettings.facebook || '',
    showFacebook: safeSettings.showFacebook || false,
    instagram: safeSettings.instagram || '',
    showInstagram: safeSettings.showInstagram || false,
    telegram: safeSettings.telegram || '',
    showTelegram: safeSettings.showTelegram || false,
  };

  // Clean up Categories
  const formattedCategories = shop.categories.map((cat) => ({
    id: cat.id,
    name: cat.name,
    name_kh: cat.name_kh || null,
    name_zh: cat.name_zh || null,
  }));

  // Clean up Products
  const formattedProducts = shop.products.map((product) => ({
    id: product.id,
    name: product.name,
    name_kh: product.name_kh || null,
    name_zh: product.name_zh || null,
    price: product.price,
    rating: product.rating || 5.0, 
    time: product.time || '10-15 min', 
    image: product.image || '', 
    categoryId: product.categoryId,
    category: { name: product.category?.name || 'Uncategorized' },
    isPopular: product.isPopular || false,
  }));

  return (
    <MenuClient
      initialProducts={formattedProducts}
      categories={formattedCategories}
      shopSettings={formattedSettings}
    />
  );
}