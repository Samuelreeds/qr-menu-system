"use server";

import { getShopLimitsAndFeatures } from "@/lib/shop-guard";
import { createProduct, updateProduct, createCategory, updateCategory } from "@/lib/actions";

/**
 * Secure Action Wrappers
 * These intercept the raw FormData from the client, perform a server-side entitlement check
 * for 'featCampaign', and securely scrub discount values if the shop is not entitled to them.
 */

export async function secureCreateProduct(shopId: string, fd: FormData) {
  const limits: any = await getShopLimitsAndFeatures(shopId);
  if (!limits?.featCampaign) {
    fd.set('discount', '0');
  }
  return createProduct(fd);
}

export async function secureUpdateProduct(shopId: string, fd: FormData) {
  const limits: any = await getShopLimitsAndFeatures(shopId);
  if (!limits?.featCampaign) {
    fd.set('discount', '0');
  }
  return updateProduct(fd);
}

export async function secureCreateCategory(shopId: string, fd: FormData) {
  const limits: any = await getShopLimitsAndFeatures(shopId);
  if (!limits?.featCampaign) {
    fd.set('discount', '0');
  }
  return createCategory(fd);
}

export async function secureUpdateCategory(shopId: string, fd: FormData) {
  const limits: any = await getShopLimitsAndFeatures(shopId);
  if (!limits?.featCampaign) {
    fd.set('discount', '0');
  }
  return updateCategory(fd);
}