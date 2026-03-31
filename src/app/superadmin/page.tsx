
import { prisma } from '@/lib/prisma';
import SuperAdminClient from './SuperAdminClient';
import { PLAN_LIMITS } from '@/lib/shop-guard';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { verifySuperAdmin } from '@/lib/actions';
import Link from 'next/link';

// Force dynamic rendering to ensure stats are always up to date
export const revalidate = 0; 

export default async function SuperAdminPage(props: { searchParams?: Promise<{ [key: string]: string | undefined }> }) {
  const session = await getServerSession();
  
  if (!session?.user?.email) {
    redirect('/auth/login');
  }

  const superAdminUser = await verifySuperAdmin();
  if (!superAdminUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB] p-4 font-sans text-center">
         <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-200 max-w-md w-full">
           <h1 className="text-2xl font-bold text-red-600 mb-2">Access Denied</h1>
           <p className="text-gray-500 mb-6">You do not have permission to view the SuperAdmin dashboard.</p>
           <Link href="/" className="inline-block bg-gray-900 text-white font-bold px-6 py-2.5 rounded-xl hover:bg-gray-800 transition shadow-sm">
             Return Home
           </Link>
         </div>
      </div>
    );
  }

  // OPTIMIZATION: Pagination Logic
  const searchParams = await props.searchParams;
  const pageParam = parseInt(searchParams?.page || '1', 10);
  const page = isNaN(pageParam) ? 1 : Math.max(1, pageParam);
  const limit = 25;
  const skip = (page - 1) * limit;

  // OPTIMIZATION: Query only necessary fields and use DB count for stats to drastically reduce memory footprint
  const [
    shops, 
    totalShops,
    activeShops,
    paidShops,
    invites, 
    users
  ] = await Promise.all([
    prisma.shop.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        plan: true,
        status: true,
        deletedAt: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    }),
    prisma.shop.count(),
    prisma.shop.count({ where: { status: 'ACTIVE', deletedAt: null } }),
    prisma.shop.count({ where: { plan: { not: 'FREE' } } }),
    prisma.invite.findMany({ 
      select: {
        id: true,
        token: true,
        shopName: true,
        isUsed: true,
        expiresAt: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' } 
    }),
    prisma.user.findMany({ 
      select: {
        id: true,
        email: true,
        role: true,
        isSuperAdmin: true
      },
      orderBy: { id: 'desc' } 
    })
  ]);

  const shopStats = {
    total: totalShops,
    active: activeShops,
    paid: paidShops,
    currentPage: page,
    totalPages: Math.ceil(totalShops / limit)
  };

  // Transform hardcoded PLAN_LIMITS into a format suitable for the read-only UI
  const hardcodedPlans = Object.entries(PLAN_LIMITS).map(([key, limits], index) => {
    const featuresCount = [limits.premiumThemes, limits.customSocials].filter(Boolean).length;
    const limitsCount = 5; 

    return {
      id: key, // Will match IDs like 'FREE', 'PRO', 'PREMIUM'
      name: key,
      slug: key.toLowerCase(),
      priceMonthly: key === 'FREE' ? 0 : key === 'PRO' ? 15 : 39,
      priceYearly: key === 'FREE' ? 0 : key === 'PRO' ? 150 : 390,
      status: 'ACTIVE',
      limitsCount,
      featuresCount,
      order: index + 1,
      allowTrial: false,
      trialDays: 14,
      isRecommended: false,
      limits: {
        maxProducts: limits.maxProducts,
        maxCategories: limits.maxCategories,
        maxBanners: limits.maxBanners,
        maxQrThemes: key === 'FREE' ? 1 : key === 'PRO' ? 3 : 10,
        aiUploadLimit: key === 'FREE' ? 0 : key === 'PRO' ? 50 : 500,
      },
      featPreparationTime: false,
      featCampaign: false,
      featCoverBanner: false,
      featSmartCategories: false,
      featUploadImageMenu: false,
      featAlertBarista: false,
      featPos: false,
      featOrderFromTable: false,
      featMultipleLanguage: false,
      featCustomDomain: false,
      featDedicatedSupport: false,
      featAiUpload: false,
    };
  });

  // Fetch newly created/updated DB plans
  let dbPlansRaw: any[] = [];
  try {
    if ((prisma as any).plan) {
      dbPlansRaw = await (prisma as any).plan.findMany({ orderBy: { order: 'asc' } });
    }
  } catch (e) {
    console.warn("Plan table might not be synced yet.", e);
  }

  // Build a map of the DB plans mapped to UI format
  const dbPlanMap = new Map();
  dbPlansRaw.forEach((p: any) => {
    dbPlanMap.set(p.id, {
      id: p.id,
      name: p.name,
      slug: p.slug,
      priceMonthly: p.priceMonthly,
      priceYearly: p.priceYearly,
      status: p.status,
      order: p.order,
      allowTrial: p.allowTrial,
      trialDays: p.trialDays,
      isRecommended: p.isRecommended,
      limitsCount: 5,
      featuresCount: [
        p.featPreparationTime, p.featCampaign, p.featCoverBanner, p.featSmartCategories, 
        p.featUploadImageMenu, p.featAlertBarista, p.featPos, p.featOrderFromTable, 
        p.featMultipleLanguage, p.featCustomDomain, p.featDedicatedSupport, p.featAiUpload
      ].filter(Boolean).length,
      limits: {
          maxProducts: p.maxProducts,
          maxCategories: p.maxCategories,
          maxBanners: p.maxBanners,
          maxQrThemes: p.maxQrThemes,
          aiUploadLimit: p.aiUploadLimit
      },
      featPreparationTime: p.featPreparationTime,
      featCampaign: p.featCampaign,
      featCoverBanner: p.featCoverBanner,
      featSmartCategories: p.featSmartCategories,
      featUploadImageMenu: p.featUploadImageMenu,
      featAlertBarista: p.featAlertBarista,
      featPos: p.featPos,
      featOrderFromTable: p.featOrderFromTable,
      featMultipleLanguage: p.featMultipleLanguage,
      featCustomDomain: p.featCustomDomain,
      featDedicatedSupport: p.featDedicatedSupport,
      featAiUpload: p.featAiUpload,
    });
  });

  // Merge process: Favor DB plan over hardcoded plan if the IDs match
  const finalPlans = [];
  for (const hc of hardcodedPlans) {
    if (dbPlanMap.has(hc.id)) {
      finalPlans.push(dbPlanMap.get(hc.id));
      dbPlanMap.delete(hc.id);
    } else {
      finalPlans.push(hc);
    }
  }
  
  // Add any completely new DB plans
  finalPlans.push(...Array.from(dbPlanMap.values()));
  finalPlans.sort((a, b) => a.order - b.order);

  return <SuperAdminClient shops={shops} invites={invites} users={users} plans={finalPlans} shopStats={shopStats} />;
}