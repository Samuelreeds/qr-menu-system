import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import AdminDashboard from '@/components/AdminDashboard';
import { getShopPlanState, getShopLimitsAndFeatures } from '@/lib/shop-guard';
import { redirect } from 'next/navigation';

export const revalidate = 0;

export default async function AdminPage() {
  const session = await getServerSession();
  if (!session?.user?.email) redirect('/login');

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { shopUsers: { include: { shop: true } } }
  });

  if (!user || user.shopUsers.length === 0) redirect('/register');

  const shopUser = user.shopUsers[0];
  const shop = shopUser.shop;
  const shopId = shop.id;

  if (shop.status === 'LOCKED' || (shop as any).deletedAt) {
    // ... keep your suspended UI ...
    return <div>Shop Suspended</div>; 
  }

  const [
    planState,
    planLimits,
    categories,
    rawProducts,
    banners,
    dbSettings,
    dbPlan,
    orders // <-- ADD THIS
  ] = await Promise.all([
    getShopPlanState(shopId),
    getShopLimitsAndFeatures(shopId),
    prisma.category.findMany({
      where: { shopId },
      orderBy: { sortOrder: 'asc' }
    }),
    prisma.product.findMany({
      where: { shopId },
      include: { category: true },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.banner.findMany({
      where: { shopId, deletedAt: null },
      orderBy: { sortOrder: 'asc' }
    }),
    prisma.shopSettings.findUnique({
      where: { shopId }
    }),
    shop.plan
      ? (prisma as any).plan.findFirst({
          where: { OR: [{ id: shop.plan }, { slug: shop.plan.toLowerCase() }] }
        }).catch(() => null)
      : Promise.resolve(null),
    // FETCH RECENT ORDERS
    prisma.order.findMany({
      where: { shopId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { items: true }
    })
  ]);

  const rawPlanId = planState?.plan as string;
  const currentPlanName =
    dbPlan?.name || (rawPlanId && rawPlanId.length > 15 ? 'PRO' : rawPlanId) || 'FREE';

  const canUseCampaign = !!(planLimits as any)?.featCampaign;
  const canUsePos = !!(planLimits as any)?.featPos;

  // ... keep category and product formatting exactly the same ...
  const formattedCategories = categories.map((c) => ({
    id: c.id,
    name: c.name,
    name_kh: c.name_kh,
    name_zh: c.name_zh,
    sortOrder: c.sortOrder,
    discount: canUseCampaign ? c.discount : 0
  }));

  const formattedProducts = rawProducts.map((p) => ({
    id: p.id,
    name: p.name,
    name_kh: p.name_kh,
    name_zh: p.name_zh,
    price: p.price,
    image: p.image,
    category: {
      name: p.category.name,
      discount: canUseCampaign ? p.category.discount : 0
    },
    time: p.time || '15min',
    isPopular: p.isPopular,
    isSoldOut: p.isSoldOut,
    discount: canUseCampaign ? p.discount : 0,
    description: p.description || ''
  }));

  const settings = dbSettings || {
    id: 'default',
    name: shop.name || 'My Shop',
    name_kh: '',
    nameDisplay: 'EN',
    address: '',
    phone: '',
    openingHours: '',
    themeColor: '#000000',
    headerDesign: 'design1',
    logo: '',
    socials: '[]',
    shopId: shopId
  };

  return (
    <AdminDashboard
      shopId={shopId}
      categories={formattedCategories}
      products={formattedProducts}
      settings={settings as any}
      shopSlug={shop.slug || shop.id}
      banners={banners}
      shopPlan={currentPlanName}
      planLimits={planLimits}
      callStaffEnabled={(shop as any).callStaffEnabled ?? true}
      telegramChatId={(shop as any).telegramChatId ?? null}
      staffCallTopicId={(shop as any).staffCallTopicId ?? null}
      newOrderTopicId={(shop as any).newOrderTopicId ?? null}
      telegramNotificationsEnabled={(shop as any).telegramNotificationsEnabled ?? false}
      featCampaign={canUseCampaign}
      featPos={canUsePos}
      userEmail={user.email}
      userRole={shopUser.role}
      orders={orders} // <-- PASS ORDERS PROP
    />
  );
}