"use server";

import { getShopLimitsAndFeatures } from "@/lib/shop-guard";
import { createProduct, updateProduct, createCategory, updateCategory } from "@/lib/actions";

const parseVariants = (fd: FormData) => {
  const v = fd.get('variants') as string;
  if (!v) return null;
  try { return JSON.parse(v); } catch { return null; }
};

export async function secureCreateProduct(shopId: string, fd: FormData) {
  const limits: any = await getShopLimitsAndFeatures(shopId);
  
  let discount = parseFloat(fd.get('discount') as string) || 0;
  if (!limits?.featCampaign) {
    discount = 0;
  }

  return createProduct({
    name: fd.get('name') as string,
    name_kh: fd.get('name_kh') as string | null,
    name_zh: fd.get('name_zh') as string | null,
    price: parseFloat(fd.get('price') as string) || 0,
    discount: discount,
    categoryId: fd.get('categoryId') as string,
    time: (fd.get('time') as string) || undefined,
    image: fd.get('image'),
    isPopular: fd.get('isPopular') === 'true',
    isSoldOut: fd.get('isSoldOut') === 'true',
    variants: parseVariants(fd)
  });
}

export async function secureUpdateProduct(shopId: string, fd: FormData) {
  const limits: any = await getShopLimitsAndFeatures(shopId);
  
  let discount = parseFloat(fd.get('discount') as string) || 0;
  if (!limits?.featCampaign) {
    discount = 0;
  }

  return updateProduct({
    id: fd.get('id') as string,
    name: fd.get('name') as string,
    name_kh: fd.get('name_kh') as string | null,
    name_zh: fd.get('name_zh') as string | null,
    price: parseFloat(fd.get('price') as string) || 0,
    discount: discount,
    categoryId: fd.get('categoryId') as string,
    time: (fd.get('time') as string) || undefined,
    image: fd.get('image'),
    isPopular: fd.get('isPopular') === 'true',
    isSoldOut: fd.get('isSoldOut') === 'true',
    variants: parseVariants(fd)
  });
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