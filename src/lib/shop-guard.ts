// ============================================================================
// PHASE 3: TRIAL ENFORCEMENT GUARD
// Create a new file: src/lib/shop-guard.ts
// ============================================================================

import { prisma } from '@/lib/prisma';

export async function checkShopAccess(shopId: string) {
  const shop = await prisma.shop.findUnique({
    where: { id: shopId }
  });

  // 1. Handle missing shop
  if (!shop) {
    return { allowed: false, reason: 'NOT_FOUND', plan: null };
  }

  // 2. The "Kill Switch" - Block access if unpaid/locked
  if (shop.status === 'LOCKED') {
    return { allowed: false, reason: 'LOCKED', plan: null };
  }

  let currentPlan = shop.plan;

  // 3. Trial Enforcement - Automatically downgrade if trial expired
  // We check if trialEndsAt exists, if it's in the past, and if they aren't already on FREE
  if (shop.trialEndsAt && new Date() > shop.trialEndsAt && shop.plan !== 'FREE') {
    
    // Perform the automatic downgrade
    await prisma.shop.update({
      where: { id: shop.id },
      data: { plan: 'FREE' }
    });
    
    currentPlan = 'FREE';
  }

  // 4. Access Granted
  return { 
    allowed: true, 
    reason: 'ACTIVE',
    plan: currentPlan, 
    shop 
  };
}