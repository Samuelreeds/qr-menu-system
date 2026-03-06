import { prisma } from '@/lib/prisma';
import { cache } from 'react';

// --- CONFIGURATION ---
export const PLAN_LIMITS = {
  FREE: {
    maxProducts: 10,
    maxCategories: 3,
    maxBanners: 1,
    premiumThemes: false,
    customSocials: false,
  },
  PRO: {
    maxProducts: 100,
    maxCategories: 20,
    maxBanners: 5,
    premiumThemes: true,
    customSocials: true,
  },
  PREMIUM: {
    maxProducts: 1000,
    maxCategories: 100,
    maxBanners: 20,
    premiumThemes: true,
    customSocials: true,
  }
} as const;

export type FeatureKey = string;
export type PlanKey = string;

// --- HELPERS ---

/**
 * Returns the current plan and full shop record.
 * OPTIMIZATION: Wrapped in React cache to prevent duplicate DB queries during the same request lifecycle.
 */
export const getShopPlanState = cache(async (shopId: string) => {
  const shop = await prisma.shop.findUnique({
    where: { id: shopId },
    select: {
      id: true,
      plan: true,
      status: true,
      trialEndsAt: true,
      paidUntil: true,
      overrideMaxProducts: true,
      overrideMaxCategories: true,
      overrideMaxBanners: true,
      overrideHeaderStyle: true,
    }
  });

  if (!shop || shop.status === 'LOCKED') return null;
  
  return {
    ...shop,
    plan: shop.plan || 'FREE'
  };
});

/**
 * Resolves the ultimate limits and features for a shop.
 * Priority: Per-Shop Overrides > Dynamic DB Plan Settings > Legacy Hardcoded Defaults
 * OPTIMIZATION: Wrapped in React cache to prevent duplicate DB queries during the same request lifecycle.
 */
export const getShopLimitsAndFeatures = cache(async (shopId: string) => {
  const state: any = await getShopPlanState(shopId);
  if (!state) return null;

  const planKey = (state.plan as keyof typeof PLAN_LIMITS) in PLAN_LIMITS ? (state.plan as keyof typeof PLAN_LIMITS) : 'FREE';
  const legacyLimits = PLAN_LIMITS[planKey];

  let dbPlan: any = null;
  try {
    dbPlan = await (prisma as any).plan.findFirst({
      where: { OR: [{ id: state.plan }, { slug: state.plan.toLowerCase() }] }
    });
  } catch (e) {
    console.warn("Could not fetch DB plan:", e);
  }

  // 1. Resolve Limits
  const maxProducts = state.overrideMaxProducts ?? dbPlan?.maxProducts ?? legacyLimits.maxProducts;
  const maxCategories = state.overrideMaxCategories ?? dbPlan?.maxCategories ?? legacyLimits.maxCategories;
  const maxBanners = state.overrideMaxBanners ?? dbPlan?.maxBanners ?? legacyLimits.maxBanners;

  // 2. Resolve Features (Map legacy to new flags if needed)
  const premiumThemes = dbPlan ? !!dbPlan.featCoverBanner : legacyLimits.premiumThemes;
  const customSocials = dbPlan ? !!dbPlan.featUploadImageMenu : legacyLimits.customSocials;

  return {
    maxProducts,
    maxCategories,
    maxBanners,
    overrideHeaderStyle: state.overrideHeaderStyle,
    premiumThemes,
    customSocials,
    // Database Toggles
    featPreparationTime: dbPlan ? !!dbPlan.featPreparationTime : (planKey !== 'FREE'),
    featCampaign: dbPlan ? !!dbPlan.featCampaign : (planKey !== 'FREE'),
    featCoverBanner: dbPlan ? !!dbPlan.featCoverBanner : (planKey !== 'FREE'),
    featSmartCategories: dbPlan ? !!dbPlan.featSmartCategories : (planKey !== 'FREE'),
    featUploadImageMenu: dbPlan ? !!dbPlan.featUploadImageMenu : (planKey !== 'FREE'),
    featAlertBarista: dbPlan ? !!dbPlan.featAlertBarista : (planKey !== 'FREE'),
    featPos: dbPlan ? !!dbPlan.featPos : (planKey !== 'FREE'),
    featOrderFromTable: dbPlan ? !!dbPlan.featOrderFromTable : (planKey !== 'FREE'),
    featMultipleLanguage: dbPlan ? !!dbPlan.featMultipleLanguage : (planKey !== 'FREE'),
    featCustomDomain: dbPlan ? !!dbPlan.featCustomDomain : (planKey !== 'FREE'),
    featDedicatedSupport: dbPlan ? !!dbPlan.featDedicatedSupport : (planKey !== 'FREE'),
    featAiUpload: dbPlan ? !!dbPlan.featAiUpload : (planKey !== 'FREE'),
  };
});

/**
 * Checks if a specific feature is enabled for the shop's plan (backed by DB).
 */
export async function canUseFeature(shopId: string, featureKey: string): Promise<boolean> {
  const limits = await getShopLimitsAndFeatures(shopId);
  if (!limits) return false;
  return !!(limits as any)[featureKey];
}

/**
 * Retrieves a numeric limit for a specific feature based on the shop's plan (backed by DB).
 */
export async function getLimit(shopId: string, limitKey: string): Promise<number> {
  const limits = await getShopLimitsAndFeatures(shopId);
  if (!limits) return 0;
  return (limits as any)[limitKey] || 0;
}

/**
 * Verification for module-level access.
 */
export async function canAccessAdminModule(shopId: string, moduleKey: string): Promise<boolean> {
  const state = await getShopPlanState(shopId);
  if (!state) return false;

  if (state.plan === 'FREE') {
    const protectedModules = ['analytics', 'advanced-branding'];
    return !protectedModules.includes(moduleKey);
  }

  return true;
}

/**
 * Legacy check for backward compatibility with trial enforcement logic.
 */
export async function checkShopAccess(shopId: string) {
  const shop = await prisma.shop.findUnique({
    where: { id: shopId }
  });

  if (!shop) return { allowed: false, reason: 'NOT_FOUND', plan: null };
  if (shop.status === 'LOCKED') return { allowed: false, reason: 'LOCKED', plan: null };

  let currentPlan = shop.plan;

  if (shop.trialEndsAt && new Date() > shop.trialEndsAt && shop.plan !== 'FREE') {
    await prisma.shop.update({
      where: { id: shop.id },
      data: { plan: 'FREE' }
    });
    currentPlan = 'FREE';
  }

  return { 
    allowed: true, 
    reason: 'ACTIVE',
    plan: currentPlan, 
    shop 
  };
}