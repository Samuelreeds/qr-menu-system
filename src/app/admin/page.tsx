import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import AdminDashboard from '@/components/AdminDashboard';
import { getShopPlanState, PLAN_LIMITS, PlanKey } from '@/lib/shop-guard';
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

  const shop = user.shopUsers[0].shop;
  const shopId = shop.id;

  // SECURITY GUARD: Prevent access to locked or soft-deleted shops
  if (shop.status === 'LOCKED' || shop.deletedAt) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB] p-4 font-sans text-center">
         <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-200 max-w-md w-full">
           <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
             <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
           </div>
           <h1 className="text-2xl font-black text-gray-900 mb-2">Shop Suspended</h1>
           <p className="text-gray-500 text-sm mb-8 leading-relaxed">This shop has been locked or deactivated by the administrator. Please contact support if you believe this is an error.</p>
           <a href="/login" className="inline-flex w-full justify-center bg-gray-900 text-white px-6 py-3.5 rounded-xl font-bold shadow-md hover:bg-gray-800 transition-all active:scale-[0.98]">
             Return to Login
           </a>
         </div>
      </div>
    );
  }

  const planState = await getShopPlanState(shopId);
  const currentPlan = (planState?.plan as PlanKey) || 'FREE';

  // Fetch data for the dashboard matching the exact props expected
  const categories = await prisma.category.findMany({
    where: { shopId },
    orderBy: { sortOrder: 'asc' }
  });

  const products = await prisma.product.findMany({
    where: { shopId },
    include: { category: true },
    orderBy: { createdAt: 'desc' }
  });

  const banners = await prisma.banner.findMany({
    where: { shopId, deletedAt: null },
    orderBy: { sortOrder: 'asc' }
  });

  let settings = await prisma.shopSettings.findUnique({
    where: { shopId }
  });

  // Provide fallback to avoid undefined crashes if settings table is completely empty
  if (!settings) {
    settings = {
      id: "default", 
      name: shop.name || "My Shop", 
      name_kh: "",
      nameDisplay: "EN",
      address: "", 
      phone: "", 
      openingHours: "",
      themeColor: "#000000",
      headerDesign: "design1",
      logo: "", 
      socials: "[]",
      shopId: shopId
    } as any;
  }

  return (
    <AdminDashboard 
      categories={categories}
      products={products}
      settings={settings}
      shopSlug={shop.id} // FIXED: Used shopId as the URL slug for live view and QR codes
      banners={banners}
      shopPlan={currentPlan}
      planLimits={PLAN_LIMITS[currentPlan]}
    />
  );
}