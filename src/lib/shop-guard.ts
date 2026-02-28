import { prisma } from '@/lib/prisma';

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

export type FeatureKey = keyof typeof PLAN_LIMITS.FREE;
export type PlanKey = keyof typeof PLAN_LIMITS;

// --- HELPERS ---

/**
 * Returns the current plan and full shop record.
 * Centralizes the source of truth for a shop's subscription state.
 */
export async function getShopPlanState(shopId: string) {
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
    }
  });

  if (!shop || shop.status === 'LOCKED') return null;
  
  return {
    ...shop,
    plan: (shop.plan as PlanKey) || 'FREE'
  };
}

/**
 * Checks if a specific feature is enabled for the shop's plan.
 */
export async function canUseFeature(shopId: string, featureKey: FeatureKey): Promise<boolean> {
  const state = await getShopPlanState(shopId);
  if (!state) return false;

  const limit = PLAN_LIMITS[state.plan][featureKey];
  return typeof limit === 'boolean' ? limit : false;
}

/**
 * Retrieves a numeric limit for a specific feature based on the shop's plan.
 * Checks per-shop overrides before falling back to plan defaults.
 */
export async function getLimit(shopId: string, limitKey: FeatureKey): Promise<number> {
  const state = await getShopPlanState(shopId);
  if (!state) return 0;

  // 1. Check for explicit overrides on this specific shop
  if (limitKey === 'maxProducts' && state.overrideMaxProducts !== null) return state.overrideMaxProducts;
  if (limitKey === 'maxCategories' && state.overrideMaxCategories !== null) return state.overrideMaxCategories;
  if (limitKey === 'maxBanners' && state.overrideMaxBanners !== null) return state.overrideMaxBanners;

  // 2. Fall back to global plan limits
  const limit = PLAN_LIMITS[state.plan][limitKey];
  return typeof limit === 'number' ? limit : 0;
}

/**
 * Verification for module-level access (e.g., Analytics, Advanced Settings).
 */
export async function canAccessAdminModule(shopId: string, moduleKey: string): Promise<boolean> {
  const state = await getShopPlanState(shopId);
  if (!state) return false;

  // Basic logic: FREE shops only access core modules.
  // This can be expanded as specific module requirements are defined.
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