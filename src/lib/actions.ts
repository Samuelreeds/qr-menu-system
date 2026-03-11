'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { createClient } from '@supabase/supabase-js'
import sharp from 'sharp'
import crypto from 'crypto'
import bcrypt from 'bcrypt'
import { getServerSession } from 'next-auth';
import { canUseFeature, getLimit } from '@/lib/shop-guard';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// --- SETUP ---
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

const PRODUCT_PLACEHOLDER_IMAGE = 'data:image/svg+xml;charset=utf-8,%3Csvg xmlns%3D"http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg" width%3D"400" height%3D"400" viewBox%3D"0 0 400 400"%3E%3Crect width%3D"400" height%3D"400" fill%3D"%23f3f4f6"%2F%3E%3Ctext x%3D"50%25" y%3D"50%25" dominant-baseline%3D"middle" text-anchor%3D"middle" font-family%3D"sans-serif" font-size%3D"48" font-weight%3D"bold" fill%3D"%239ca3af"%3EN%2FA%3C%2Ftext%3E%3C%2Fsvg%3E';

// --- MULTI-TENANT HELPER (SECURED) ---
async function getActiveShopId() {
  const session = await getServerSession(authOptions);
  
  if ((session as any)?.user?.shopId) {
    return (session as any).user.shopId;
  }

  if (!session?.user?.email) return null;

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { shopUsers: true }
  });

  if (!user || user.shopUsers.length === 0) return null;
  return user.shopUsers[0].shopId;
}

// --- OPTIMIZATION: TARGETED REVALIDATION HELPER ---
async function revalidateActiveShop() {
  revalidatePath('/admin');
  try {
    const shopId = await getActiveShopId();
    if (shopId) {
      const shop = await prisma.shop.findUnique({ where: { id: shopId }, select: { slug: true } });
      if (shop?.slug) {
        revalidatePath(`/${shop.slug}`);
      }
      revalidatePath(`/${shopId}`);
    }
  } catch (e) {
    console.error("Targeted revalidation failed", e);
  }
}

// --- SUPER ADMIN HELPER (SECURED) ---
export async function verifySuperAdmin() {
  const session = await getServerSession(authOptions);
  
  if ((session as any)?.user?.isSuperAdmin || (session as any)?.user?.role === 'SUPERADMIN') {
    return {
      id: (session as any).user?.id,
      email: session?.user?.email,
      role: (session as any).user?.role,
      isSuperAdmin: (session as any).user?.isSuperAdmin
    };
  }

  if (!session?.user?.email) return null;

  const user = await prisma.user.findUnique({
    where: { email: session.user.email }
  });

  if (!user) return null;
  
  if (user.role === 'SUPERADMIN' || user.isSuperAdmin) {
    return user;
  }
  
  return null;
}

// --- READ ACTIONS ---
export async function getCategories() {
  const shopId = await getActiveShopId();
  if (!shopId) return [];
  return await prisma.category.findMany({ 
    where: { shopId },
    orderBy: { sortOrder: 'asc' } 
  });
}

export async function getProducts() {
  const shopId = await getActiveShopId();
  if (!shopId) return [];
  return await prisma.product.findMany({
    where: { shopId },
    include: { category: true },
    orderBy: { createdAt: 'desc' }
  });
}

export async function getShopSettings() {
  const shopId = await getActiveShopId();
  if (!shopId) return null;
  let settings = await prisma.shopSettings.findUnique({ where: { shopId } });
  
  if (!settings) {
    return {
      id: "default", 
      name: "Scandine", 
      name_kh: null,
      nameDisplay: "EN",
      address: "", 
      phone: "", 
      openingHours: null,
      themeColor: "#000000",
      headerDesign: "design1",
      logo: null, 
      logoType: "withBackground",
      socials: "[]"
    };
  }
  return settings;
}

export async function getBanners() {
  const shopId = await getActiveShopId();
  if (!shopId) return [];
  const prismaAny = prisma as any;
  return await prismaAny.banner.findMany({ 
    where: { shopId, deletedAt: null },
    orderBy: { sortOrder: 'asc' } 
  });
}

// --- HELPERS ---
async function uploadToSupabase(file: File, folder: 'products' | 'branding' | 'banners'): Promise<string | undefined> {
  if (!file || file.size === 0 || file.name === 'undefined') return undefined;

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const optimizedBuffer = await sharp(buffer)
      .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
      .toFormat('webp', { quality: 80 })
      .toBuffer();

    const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}.webp`;
    const path = `${folder}/${filename}`;

    const { error } = await supabase.storage.from('uploads').upload(path, optimizedBuffer, {
        contentType: 'image/webp',
        upsert: false
    });

    if (error) throw error;
    const { data } = supabase.storage.from('uploads').getPublicUrl(path);
    return data.publicUrl;
  } catch (error) {
    console.error("Upload failed:", error);
    return undefined;
  }
}

async function deleteFromSupabase(fullUrl: string | null) {
  if (!fullUrl) return;
  try {
    const path = fullUrl.split('/uploads/')[1]; 
    if (path) {
      await supabase.storage.from('uploads').remove([path]);
    }
  } catch (error) {
    console.error("Delete failed:", error);
  }
}

// --- BANNER ACTIONS ---
export async function addBanner(formData: FormData) {
  const shopId = await getActiveShopId();
  if (!shopId) return;

  const limit = await getLimit(shopId, 'maxBanners');
  const prismaAny = prisma as any;
  const currentCount = await prismaAny.banner.count({ where: { shopId, deletedAt: null } });
  if (currentCount >= limit) return { error: "Banner limit reached." };

  const imageFile = formData.get('image') as File;
  const imagePath = await uploadToSupabase(imageFile, 'banners');
  if (imagePath) {
    const lastBanner = await prismaAny.banner.findFirst({
      where: { shopId },
      orderBy: { sortOrder: 'desc' }
    });
    const nextOrder = (lastBanner?.sortOrder || 0) + 1;

    await prismaAny.banner.create({
      data: { image: imagePath, sortOrder: nextOrder, shopId }
    });
    await revalidateActiveShop();
  }
}

export async function deleteBanner(formData: FormData) {
  const id = formData.get('id') as string;
  try {
    const prismaAny = prisma as any;
    const banner = await prismaAny.banner.findUnique({ where: { id }, select: { image: true } });
    if (banner) {
      await prismaAny.banner.delete({ where: { id } });
      await deleteFromSupabase(banner.image);
      await revalidateActiveShop();
    }
  } catch (e) {}
}

export async function softDeleteBanner(formData: FormData) {
  const id = formData.get('id') as string;
  try {
    const prismaAny = prisma as any;
    await prismaAny.banner.update({
      where: { id },
      data: { deletedAt: new Date() }
    });
    await revalidateActiveShop();
  } catch (e) {}
}

export async function undoDeleteBanner(formData: FormData) {
  const id = formData.get('id') as string;
  try {
    const prismaAny = prisma as any;
    await prismaAny.banner.update({
      where: { id },
      data: { deletedAt: null }
    });
    await revalidateActiveShop();
  } catch (e) {}
}

export async function reorderBanners(banners: {id: string, sortOrder: number}[]) {
  const shopId = await getActiveShopId();
  if (!shopId) return;
  
  try {
    const prismaAny = prisma as any;
    for (const banner of banners) {
      await prismaAny.banner.update({
        where: { id: banner.id },
        data: { sortOrder: banner.sortOrder }
      });
    }
    await revalidateActiveShop();
  } catch (error) {
    console.error("Failed to reorder banners", error);
  }
}

// --- CATEGORY ACTIONS ---
export async function createCategory(formData: FormData) {
  const shopId = await getActiveShopId();
  if (!shopId) return;

  const limit = await getLimit(shopId, 'maxCategories');
  const currentCount = await prisma.category.count({ where: { shopId } });
  if (currentCount >= limit) return { error: "Category limit reached." };

  const name = formData.get('name') as string;
  const name_kh = formData.get('name_kh') as string || null;
  const name_zh = formData.get('name_zh') as string || null;
  const discount = parseFloat(formData.get('discount') as string) || 0;

  const lastCategory = await prisma.category.findFirst({ 
    where: { shopId },
    orderBy: { sortOrder: 'desc' } 
  });
  const nextOrder = (lastCategory?.sortOrder || 0) + 1;
  
  await prisma.category.create({ 
    data: { name, name_kh, name_zh, sortOrder: nextOrder, discount, shopId } 
  });
  await revalidateActiveShop();
}

export async function updateCategory(formData: FormData) {
  const id = formData.get('id') as string;
  const name = formData.get('name') as string;
  const name_kh = formData.get('name_kh') as string || null;
  const name_zh = formData.get('name_zh') as string || null;
  const sortOrder = parseInt(formData.get('sortOrder') as string);
  const discount = parseFloat(formData.get('discount') as string) || 0;
  
  await prisma.category.update({ 
    where: { id }, 
    data: { name, name_kh, name_zh, sortOrder, discount } 
  });
  await revalidateActiveShop();
}

export async function deleteCategory(formData: FormData) {
  const id = formData.get('id') as string;
  try { await prisma.category.delete({ where: { id } }); } catch (e) {}
  await revalidateActiveShop();
}

// --- PRODUCT ACTIONS ---
export async function createProduct(formData: FormData) {
  const shopId = await getActiveShopId();
  if (!shopId) return;

  const limit = await getLimit(shopId, 'maxProducts');
  const currentCount = await prisma.product.count({ where: { shopId } });
  if (currentCount >= limit) return { error: "Product limit reached." };

  const name = formData.get('name') as string
  const name_kh = formData.get('name_kh') as string || null;
  const name_zh = formData.get('name_zh') as string || null;
  const price = parseFloat(formData.get('price') as string)
  const discount = parseFloat(formData.get('discount') as string) || 0
  const categoryId = formData.get('categoryId') as string
  const time = formData.get('time') as string || '15min'
  const imageFile = formData.get('image') as File
  const isSoldOut = formData.get('isSoldOut') === 'on'
  
  let imagePath = await uploadToSupabase(imageFile, 'products');
  if (!imagePath) imagePath = PRODUCT_PLACEHOLDER_IMAGE;

  await prisma.product.create({
    data: { name, name_kh, name_zh, price, discount, categoryId, image: imagePath, time, rating: 4.5, description: '', isPopular: formData.get('isPopular') === 'on', isSoldOut, shopId }
  })
  await revalidateActiveShop();
}

export async function updateProduct(formData: FormData) {
  const id = formData.get('id') as string;
  const name = formData.get('name') as string;
  const name_kh = formData.get('name_kh') as string || null;
  const name_zh = formData.get('name_zh') as string || null;
  const price = parseFloat(formData.get('price') as string);
  const discount = parseFloat(formData.get('discount') as string) || 0;
  const categoryId = formData.get('categoryId') as string;
  const time = formData.get('time') as string || '15min';
  const imageFile = formData.get('image') as File;
  const isSoldOut = formData.get('isSoldOut') === 'on';

  const newImagePath = await uploadToSupabase(imageFile, 'products');

  if (newImagePath) {
    const oldProduct = await prisma.product.findUnique({ where: { id }, select: { image: true } });
    await deleteFromSupabase(oldProduct?.image || null);
  }

  await prisma.product.update({
    where: { id },
    data: { name, name_kh, name_zh, price, discount, categoryId, time, ...(newImagePath && { image: newImagePath }), isPopular: formData.get('isPopular') === 'on', isSoldOut }
  });
  await revalidateActiveShop();
}

export async function toggleProductSoldOut(formData: FormData) {
  const id = formData.get('id') as string;
  const isSoldOut = formData.get('isSoldOut') === 'true';
  try {
    await prisma.product.update({ where: { id }, data: { isSoldOut } });
    await revalidateActiveShop();
  } catch (e) {
    console.error("Failed to toggle sold out status", e);
  }
}

export async function deleteProduct(formData: FormData) {
  const id = formData.get('id') as string;
  try { 
    const product = await prisma.product.findUnique({ where: { id }, select: { image: true } });
    await prisma.product.delete({ where: { id } });
    await deleteFromSupabase(product?.image || null);
  } catch (e) {}
  await revalidateActiveShop();
}

// --- SETTINGS ACTIONS ---
export async function updateShopIdentity(formData: FormData) {
  const name = formData.get('name') as string;
  const name_kh = formData.get('name_kh') as string || null;
  const nameDisplay = formData.get('nameDisplay') as string || 'EN';
  const address = formData.get('address') as string || null;
  const phone = formData.get('phone') as string || null;
  const openingHours = formData.get('openingHours') as string || null;
  const shopId = await getActiveShopId();
  if (!shopId) return;

  const newSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

  try {
    await prisma.shop.update({
      where: { id: shopId },
      data: { name, slug: newSlug }
    });
  } catch (error) {
    console.error("Failed to update slug (might be duplicate):", error);
  }

  await prisma.shopSettings.upsert({
    where: { shopId },
    update: { name, name_kh, nameDisplay, address, phone, openingHours },
    create: { 
      shopId, name, name_kh, nameDisplay, address, phone, openingHours,
      themeColor: '#000000',
      headerDesign: 'design1'
    }
  });
  await revalidateActiveShop();
}

export async function updateShopBranding(formData: FormData) {
  const shopId = await getActiveShopId();
  if (!shopId) return;
  
  const logoFile = formData.get('logo') as File;
  const logoType = formData.get('logoType') as string || 'withBackground';
  const newLogoPath = await uploadToSupabase(logoFile, 'branding');

  const dataToUpdate: any = {};
  
  // FIX: Theme color and header design are accessible to all plans. 
  // We unconditionally save them because the Admin UI handles the plan enforcement visually.
  const headerDesign = formData.get('headerDesign') as string;
  if (headerDesign) dataToUpdate.headerDesign = headerDesign;
  
  const themeColor = formData.get('themeColor') as string;
  if (themeColor) dataToUpdate.themeColor = themeColor;
  
  dataToUpdate.logoType = logoType;

  if (newLogoPath) {
    const currentSettings = await prisma.shopSettings.findUnique({ where: { shopId }, select: { logo: true } });
    if (currentSettings?.logo) await deleteFromSupabase(currentSettings.logo);
    dataToUpdate.logo = newLogoPath;
  }

  await prisma.shopSettings.upsert({
    where: { shopId },
    update: dataToUpdate,
    create: { 
      shopId, 
      name: 'Scandine', 
      logo: newLogoPath || null,
      logoType,
      themeColor: themeColor || '#000000',
      headerDesign: headerDesign || 'design1'
    }
  });
  await revalidateActiveShop();
}

export async function updateShopSocials(formData: FormData) {
  const shopId = await getActiveShopId();
  if (!shopId) return;
  
  const canUseSocials = await canUseFeature(shopId, 'customSocials');
  if (!canUseSocials) return { error: "Custom socials require an upgraded plan." };

  const socials = formData.get('socials') as string;
  
  await prisma.shopSettings.upsert({
    where: { shopId },
    update: { socials },
    create: {
      shopId,
      name: 'Scandine',
      socials
    }
  });
  await revalidateActiveShop();
}

export async function forceRevalidateAction() {
  await revalidateActiveShop();
}

// --- SUPER ADMIN ACTIONS ---
export async function createInvite(formData: FormData) {
  if (!await verifySuperAdmin()) return { error: "Unauthorized" };
  
  const token = crypto.randomBytes(16).toString('hex');
  const expiresInDays = parseInt(formData.get('expiresInDays')?.toString() || '7', 10);
  const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);

  try {
    await prisma.invite.create({
      data: {
        token,
        shopName: formData.get('shopName')?.toString(),
        email: formData.get('email')?.toString(),
        expiresAt,
      }
    });
    revalidatePath('/superadmin');
  } catch (error) {
    console.error(error);
  }
}

export async function deleteInvite(formData: FormData) {
  if (!await verifySuperAdmin()) return { error: "Unauthorized" };
  
  const id = formData.get('id') as string;
  try {
    await prisma.invite.delete({ where: { id } });
    revalidatePath('/superadmin');
  } catch (error) {
    console.error(error);
  }
}

export async function listInvites() {
  if (!await verifySuperAdmin()) return [];
  return await prisma.invite.findMany({ orderBy: { createdAt: 'desc' } });
}

export async function toggleShopStatus(formData: FormData) {
  if (!await verifySuperAdmin()) return { error: "Unauthorized" };
  
  const id = formData.get('id') as string;
  const currentStatus = formData.get('currentStatus') === 'true';
  const shop = await prisma.shop.update({ 
    where: { id }, 
    data: { status: currentStatus ? "LOCKED" : "ACTIVE" },
    select: { id: true, slug: true }
  });
  revalidatePath('/superadmin');
  if (shop.slug) revalidatePath(`/${shop.slug}`);
  revalidatePath(`/${shop.id}`);
}

export async function updateShopPlan(formData: FormData) {
  if (!await verifySuperAdmin()) return { error: "Unauthorized" };
  
  const id = formData.get('id') as string;
  const plan = formData.get('plan') as string;
  try {
    const shop = await prisma.shop.update({ 
      where: { id }, 
      data: { plan },
      select: { id: true, slug: true }
    });
    revalidatePath('/superadmin');
    if (shop.slug) revalidatePath(`/${shop.slug}`);
    revalidatePath(`/${shop.id}`);
  } catch (error) {
    console.error("Failed to update shop plan:", error);
  }
}

export async function updateShopLimits(formData: FormData) {
  if (!await verifySuperAdmin()) return { error: "Unauthorized" };
  
  const id = formData.get('id') as string;
  const maxProducts = formData.get('overrideMaxProducts') as string;
  const maxCategories = formData.get('overrideMaxCategories') as string;
  const maxBanners = formData.get('overrideMaxBanners') as string;
  const overrideHeaderStyle = formData.get('overrideHeaderStyle') as string;

  const shop = await prisma.shop.update({
    where: { id },
    data: {
      overrideMaxProducts: maxProducts ? parseInt(maxProducts, 10) : null,
      overrideMaxCategories: maxCategories ? parseInt(maxCategories, 10) : null,
      overrideMaxBanners: maxBanners ? parseInt(maxBanners, 10) : null,
      overrideHeaderStyle: overrideHeaderStyle ? overrideHeaderStyle : null,
    },
    select: { id: true, slug: true }
  });
  revalidatePath('/superadmin');
  if (shop.slug) revalidatePath(`/${shop.slug}`);
  revalidatePath(`/${shop.id}`);
}

export async function deleteShop(formData: FormData) {
  if (!await verifySuperAdmin()) return { error: "Unauthorized" };

  const id = formData.get('id') as string;
  let success = false;
  let warningMsg: string | null = null;

  try { 
    const shop = await prisma.shop.findUnique({
      where: { id },
      include: {
        products: { select: { image: true } },
        banners: { select: { image: true } },
        settings: { select: { logo: true } }
      }
    });

    if (!shop) return { error: "Shop not found" };
    if (!shop.deletedAt) return { error: "Shop must be soft-deleted before permanent deletion" };

    const pathsToDelete: string[] = [];
    const extractPath = (url: string | null | undefined) => {
      if (!url || url.includes('unsplash.com') || url.startsWith('data:image')) return null;
      try { 
        const parts = url.split('/uploads/');
        return parts.length > 1 ? parts[1] : null; 
      } catch { return null; }
    };

    shop.products.forEach(p => { const path = extractPath(p.image); if (path) pathsToDelete.push(path); });
    shop.banners.forEach(b => { const path = extractPath(b.image); if (path) pathsToDelete.push(path); });
    if (shop.settings?.logo) { const path = extractPath(shop.settings.logo); if (path) pathsToDelete.push(path); }

    await prisma.$transaction([
      prisma.shopUser.deleteMany({ where: { shopId: id } }),
      prisma.product.deleteMany({ where: { shopId: id } }),
      prisma.category.deleteMany({ where: { shopId: id } }),
      prisma.banner.deleteMany({ where: { shopId: id } }),
      prisma.shopSettings.deleteMany({ where: { shopId: id } }),
      prisma.shop.delete({ where: { id } })
    ]); 
    
    success = true;

    if (pathsToDelete.length > 0) {
      const { error } = await supabase.storage.from('uploads').remove(pathsToDelete);
      if (error) {
        console.error("Storage deletion error:", error);
        warningMsg = "Shop deleted from database, but failed to remove some files from storage.";
      }
    }
  } catch (error: any) {
    console.error("Delete shop failed:", error);
    return { error: "Failed to permanently delete shop." };
  }

  if (success) {
    revalidatePath('/superadmin');
    if (warningMsg) return { success: true, warning: warningMsg };
    redirect('/superadmin');
  }
}

export async function softDeleteShop(formData: FormData) {
  if (!await verifySuperAdmin()) return { success: false, error: "Unauthorized" };
  
  const id = formData.get('id') as string;
  try {
    const shop = await prisma.shop.update({
      where: { id },
      data: { deletedAt: new Date() },
      select: { id: true, slug: true }
    });
    revalidatePath('/superadmin');
    if (shop.slug) revalidatePath(`/${shop.slug}`);
    revalidatePath(`/${shop.id}`);
    return { success: true };
  } catch (e) {
    return { success: false, error: "Failed to soft delete shop" };
  }
}

export async function restoreShop(formData: FormData) {
  if (!await verifySuperAdmin()) return { success: false, error: "Unauthorized" };
  
  const id = formData.get('id') as string;
  try {
    const shop = await prisma.shop.update({
      where: { id },
      data: { deletedAt: null },
      select: { id: true, slug: true }
    });
    revalidatePath('/superadmin');
    if (shop.slug) revalidatePath(`/${shop.slug}`);
    revalidatePath(`/${shop.id}`);
    return { success: true };
  } catch (e) {
    return { success: false, error: "Failed to restore shop" };
  }
}

export async function deleteUser(formData: FormData) {
  if (!await verifySuperAdmin()) return { error: "Unauthorized" };
  
  const id = formData.get('id') as string;
  try { await prisma.user.delete({ where: { id } }); } catch (e) {}
  revalidatePath('/superadmin');
}

export async function superAdminDeleteProduct(formData: FormData): Promise<void> {
  if (!await verifySuperAdmin()) return;
  
  const id = formData.get('id') as string;
  const shopId = formData.get('shopId') as string;

  try {
    const product = await prisma.product.findUnique({
      where: { id },
      select: { image: true }
    });

    await prisma.product.delete({ where: { id } });

    if (product?.image) {
      await deleteFromSupabase(product.image);
    }

    revalidatePath(`/superadmin/shop/${shopId}`);
  } catch (error) {
    console.error("Super Admin Delete Failed:", error);
  }
}

export async function listShopProductsForModeration(shopId: string, cursor?: string, take = 50) {
  if (!await verifySuperAdmin()) return null;
  
  const products = await prisma.product.findMany({
    where: { shopId },
    take: take + 1,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      image: true,
      createdAt: true,
      category: { select: { name: true } }
    }
  });

  let nextCursor: string | null = null;
  if (products.length > take) {
    const nextItem = products.pop();
    nextCursor = nextItem!.id;
  }

  return { products, nextCursor };
}

export async function importMenuData(formData: FormData) {
  if (!await verifySuperAdmin()) return { success: false, error: "Unauthorized" };
  
  const shopId = formData.get('shopId') as string;
  const importMode = formData.get('importMode') as string || 'skip';
  const file = formData.get('excelFile') as File | null;

  if (!shopId) {
    return { success: false, error: "Shop ID is required for import." };
  }
  
  if (!file || file.size === 0 || file.name === 'undefined') {
    return { success: false, error: "Please provide a valid CSV file." };
  }

  if (!file.name.toLowerCase().endsWith('.csv')) {
    return { success: false, error: "For safety, only .csv files are supported in this version." };
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    // Parse as UTF-8 explicitly and remove BOM if present
    const text = Buffer.from(arrayBuffer).toString('utf8').replace(/^\uFEFF/, '');
    
    // Stash the parsed text safely in Supabase for the confirm step
    try {
      await supabase.storage.from('uploads').upload(`imports/${shopId}.txt`, Buffer.from(text, 'utf8'), {
        contentType: 'text/plain;charset=UTF-8',
        upsert: true
      });
    } catch (e) {
      console.warn("Temp file upload to Supabase failed.", e);
    }

    const rows = text.split(/\r?\n/).filter(row => row.trim().length > 0);

    if (rows.length < 2) {
      return { success: false, error: "The file appears to be empty or missing data rows." };
    }

    const parseCSVRow = (row: string) => {
      const result = [];
      let insideQuotes = false;
      let currentVal = '';
      for (let i = 0; i < row.length; i++) {
        const char = row[i];
        if (char === '"' && row[i+1] === '"') {
           currentVal += '"';
           i++;
        } else if (char === '"') {
          insideQuotes = !insideQuotes;
        } else if (char === ',' && !insideQuotes) {
          result.push(currentVal.trim());
          currentVal = '';
        } else {
          currentVal += char;
        }
      }
      result.push(currentVal.trim());
      return result;
    };

    const headers = parseCSVRow(rows[0]).map(h => h.toLowerCase());
    
    // Validate template columns exist
    if (!headers[0].includes('category') || !headers[1].includes('product')) {
       return { success: false, error: "Invalid template format. Please download and use the provided CSV template." };
    }

    let validCount = 0;
    let invalidCount = 0;
    const missingFields: string[] = [];
    const duplicates: string[] = [];
    const seenProducts = new Set<string>();

    // Check existing DB products to warn about duplicates
    const existingProducts = await prisma.product.findMany({
      where: { shopId },
      include: { category: true }
    });
    existingProducts.forEach(p => {
      seenProducts.add(`${p.category.name}-${p.name}`.toLowerCase());
    });

    for (let i = 1; i < rows.length; i++) {
      const cols = parseCSVRow(rows[i]);
      if (cols.length < 2 || (!cols[0] && !cols[1])) continue; // Skip empty rows

      const categoryName = cols[0]?.trim();
      const productName = cols[1]?.trim();
      const priceStr = cols[4]?.trim();

      let isValid = true;
      const missing = [];

      if (!categoryName) missing.push("Category Name");
      if (!productName) missing.push("Product Name");
      if (!priceStr || isNaN(parseFloat(priceStr))) missing.push("Price");

      if (missing.length > 0) {
        isValid = false;
        if (missingFields.length < 5) {
           missingFields.push(`Row ${i + 1}: Missing ${missing.join(', ')}`);
        }
      }

      if (isValid) {
        validCount++;
        const prodKey = `${categoryName}-${productName}`.toLowerCase();
        
        if (seenProducts.has(prodKey)) {
          if (importMode === 'skip') {
            if (duplicates.length < 5) duplicates.push(`Will skip: ${productName} in ${categoryName}`);
          } else {
            if (duplicates.length < 5) duplicates.push(`Will duplicate: ${productName} in ${categoryName}`);
          }
        }
        seenProducts.add(prodKey);
      } else {
        invalidCount++;
      }
    }

    if (missingFields.length >= 5) missingFields.push("...and more missing fields");
    if (duplicates.length >= 5) duplicates.push("...and more duplicate warnings");

    return { 
      success: true, 
      previewSummary: {
        total: validCount + invalidCount,
        valid: validCount,
        invalid: invalidCount,
        missing: missingFields,
        duplicates: duplicates,
        importMode
      }
    };
  } catch (error: any) {
    console.error("Import parse error:", error);
    return { success: false, error: "Failed to parse the file. Please ensure it is a valid CSV." };
  }
}

export async function executeMenuImport(formData: FormData) {
  if (!await verifySuperAdmin()) return { success: false, error: "Unauthorized" };
  
  const shopId = formData.get('shopId') as string;
  const importMode = formData.get('importMode') as string || 'skip';
  
  if (!shopId) return { success: false, error: "Shop ID is required." };

  try {
    const { data, error } = await supabase.storage.from('uploads').download(`imports/${shopId}.txt`);
    if (error || !data) {
      return { success: false, error: "Import session expired or file missing. Please upload the CSV again." };
    }

    const arrayBuffer = await data.arrayBuffer();
    // Parse as UTF-8 explicitly and remove BOM if present
    const text = Buffer.from(arrayBuffer).toString('utf8').replace(/^\uFEFF/, '');
    const rows = text.split(/\r?\n/).filter(row => row.trim().length > 0);
    
    if (rows.length < 2) return { success: false, error: "No data rows found." };

    const parseCSVRow = (row: string) => {
      const result = [];
      let insideQuotes = false;
      let currentVal = '';
      for (let i = 0; i < row.length; i++) {
        const char = row[i];
        if (char === '"' && row[i+1] === '"') {
           currentVal += '"';
           i++;
        } else if (char === '"') {
          insideQuotes = !insideQuotes;
        } else if (char === ',' && !insideQuotes) {
          result.push(currentVal.trim());
          currentVal = '';
        } else {
          currentVal += char;
        }
      }
      result.push(currentVal.trim());
      return result;
    };

    const parsedItems = [];
    for (let i = 1; i < rows.length; i++) {
      const cols = parseCSVRow(rows[i]);
      if (cols.length < 2 || (!cols[0] && !cols[1])) continue;

      parsedItems.push({
        _row: i,
        categoryName: cols[0]?.trim() || 'Uncategorized',
        productName: cols[1]?.trim() || 'Unnamed Product',
        nameKh: cols[2]?.trim() || null,
        nameZh: cols[3]?.trim() || null,
        price: parseFloat(cols[4]) || 0,
        discount: parseFloat(cols[5]) || 0,
        preparationTime: cols[6]?.trim() || '15min',
        imageUrl: cols[7]?.trim() || null,
        isPopular: (cols[8] || '').toLowerCase() === 'true',
        description: cols[9]?.trim() || null
      });
    }

    // DB Inserts
    const existingCategories = await prisma.category.findMany({ where: { shopId } });
    const categoryMap = new Map(existingCategories.map(c => [c.name.toLowerCase(), c.id]));
    let maxCatSortOrder = existingCategories.reduce((max, c) => Math.max(max, c.sortOrder), 0);

    const existingProducts = await prisma.product.findMany({ where: { shopId }, include: { category: true } });
    const existingProductKeys = new Set(existingProducts.map(p => `${p.category?.name || 'Uncategorized'}-${p.name}`.toLowerCase()));

    let importedCount = 0;
    let skippedCount = 0;
    let failedCount = 0;
    const skipDetails: string[] = [];
    const failDetails: string[] = [];

    for (const item of parsedItems) {
       // Validate minimum requirements for safe insertion
       if (!item.categoryName || !item.productName || isNaN(item.price)) {
          failedCount++;
          if (failDetails.length < 5) failDetails.push(`Row ${item._row + 1}: Missing fields for ${item.productName || 'unknown product'}`);
          continue;
       }

       const catKey = item.categoryName.toLowerCase();
       let categoryId = categoryMap.get(catKey);
       
       if (!categoryId) {
          maxCatSortOrder++;
          const newCat = await prisma.category.create({
             data: {
                name: item.categoryName,
                sortOrder: maxCatSortOrder,
                discount: 0,
                shopId
             }
          });
          categoryId = newCat.id;
          categoryMap.set(catKey, categoryId);
       }

       const prodKey = `${item.categoryName}-${item.productName}`.toLowerCase();
       
       if (importMode === 'skip' && existingProductKeys.has(prodKey)) {
          skippedCount++;
          if (skipDetails.length < 5) skipDetails.push(`Duplicate skipped: ${item.productName} in ${item.categoryName}`);
       } else {
          await prisma.product.create({
             data: {
                name: item.productName,
                name_kh: item.nameKh,
                name_zh: item.nameZh,
                price: item.price,
                discount: item.discount,
                categoryId: categoryId,
                time: item.preparationTime || '15min',
                image: item.imageUrl || PRODUCT_PLACEHOLDER_IMAGE,
                rating: 5.0,
                description: item.description || '',
                isPopular: item.isPopular,
                shopId: shopId
             }
          });
          existingProductKeys.add(prodKey); // Ensure within-file duplicates are skipped if mode is skip
          importedCount++;
       }
    }

    // Clean up temporary file
    await supabase.storage.from('uploads').remove([`imports/${shopId}.txt`]);

    return { 
       success: true,
       summary: {
          imported: importedCount,
          skipped: skippedCount,
          failed: failedCount,
          skipReasons: skipDetails,
          failReasons: failDetails
       }
    };
  } catch (error: any) {
    console.error("Execute import error:", error);
    return { success: false, error: "Failed to process import into database." };
  }
}

// --- PLAN MANAGEMENT ACTIONS ---
export async function createPlan(formData: FormData) {
  if (!await verifySuperAdmin()) return { success: false, error: "Unauthorized" };
  
  const name = formData.get('name') as string;
  const slug = formData.get('slug') as string;
  const status = formData.get('status') as string;
  const order = parseInt(formData.get('order') as string) || 0;
  const priceMonthly = parseFloat(formData.get('priceMonthly') as string) || 0;
  const priceYearly = parseFloat(formData.get('priceYearly') as string) || 0;
  const allowTrial = formData.get('allowTrial') === 'on';
  const trialDays = parseInt(formData.get('trialDays') as string) || 14;
  const isRecommended = formData.get('isRecommended') === 'on';

  const maxProducts = parseInt(formData.get('maxProducts') as string) || 0;
  const maxCategories = parseInt(formData.get('maxCategories') as string) || 0;
  const maxBanners = parseInt(formData.get('maxBanners') as string) || 0;
  const maxQrThemes = parseInt(formData.get('maxQrThemes') as string) || 0;
  const aiUploadLimit = parseInt(formData.get('aiUploadLimit') as string) || 0;

  const featPreparationTime = formData.get('featPreparationTime') === 'on';
  const featCampaign = formData.get('featCampaign') === 'on';
  const featCoverBanner = formData.get('featCoverBanner') === 'on';
  const featSmartCategories = formData.get('featSmartCategories') === 'on';
  const featUploadImageMenu = formData.get('featUploadImageMenu') === 'on';
  const featAlertBarista = formData.get('featAlertBarista') === 'on';
  const featPos = formData.get('featPos') === 'on';
  const featOrderFromTable = formData.get('featOrderFromTable') === 'on';
  const featMultipleLanguage = formData.get('featMultipleLanguage') === 'on';
  const featCustomDomain = formData.get('featCustomDomain') === 'on';
  const featDedicatedSupport = formData.get('featDedicatedSupport') === 'on';
  const featAiUpload = formData.get('featAiUpload') === 'on';

  try {
    await (prisma as any).plan.create({
      data: {
        name,
        slug: slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        status,
        order,
        priceMonthly,
        priceYearly,
        allowTrial,
        trialDays,
        isRecommended,
        maxProducts,
        maxCategories,
        maxBanners,
        maxQrThemes,
        aiUploadLimit,
        featPreparationTime,
        featCampaign,
        featCoverBanner,
        featSmartCategories,
        featUploadImageMenu,
        featAlertBarista,
        featPos,
        featOrderFromTable,
        featMultipleLanguage,
        featCustomDomain,
        featDedicatedSupport,
        featAiUpload
      }
    });
    revalidatePath('/superadmin');
    return { success: true };
  } catch (error: any) {
    console.error("Failed to create plan:", error);
    return { success: false, error: error.message || "Failed to create plan" };
  }
}

export async function updatePlan(formData: FormData) {
  if (!await verifySuperAdmin()) return { success: false, error: "Unauthorized" };
  
  const id = formData.get('id') as string;
  const name = formData.get('name') as string;
  const slug = formData.get('slug') as string || name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const status = formData.get('status') as string;
  const order = parseInt(formData.get('order') as string) || 0;
  const priceMonthly = parseFloat(formData.get('priceMonthly') as string) || 0;
  const priceYearly = parseFloat(formData.get('priceYearly') as string) || 0;
  const allowTrial = formData.get('allowTrial') === 'on';
  const trialDays = parseInt(formData.get('trialDays') as string) || 14;
  const isRecommended = formData.get('isRecommended') === 'on';

  const maxProducts = parseInt(formData.get('maxProducts') as string) || 0;
  const maxCategories = parseInt(formData.get('maxCategories') as string) || 0;
  const maxBanners = parseInt(formData.get('maxBanners') as string) || 0;
  const maxQrThemes = parseInt(formData.get('maxQrThemes') as string) || 0;
  const aiUploadLimit = parseInt(formData.get('aiUploadLimit') as string) || 0;

  const featPreparationTime = formData.get('featPreparationTime') === 'on';
  const featCampaign = formData.get('featCampaign') === 'on';
  const featCoverBanner = formData.get('featCoverBanner') === 'on';
  const featSmartCategories = formData.get('featSmartCategories') === 'on';
  const featUploadImageMenu = formData.get('featUploadImageMenu') === 'on';
  const featAlertBarista = formData.get('featAlertBarista') === 'on';
  const featPos = formData.get('featPos') === 'on';
  const featOrderFromTable = formData.get('featOrderFromTable') === 'on';
  const featMultipleLanguage = formData.get('featMultipleLanguage') === 'on';
  const featCustomDomain = formData.get('featCustomDomain') === 'on';
  const featDedicatedSupport = formData.get('featDedicatedSupport') === 'on';
  const featAiUpload = formData.get('featAiUpload') === 'on';

  try {
    const dataPayload = {
      name, slug, status, order, priceMonthly, priceYearly, allowTrial, trialDays, isRecommended,
      maxProducts, maxCategories, maxBanners, maxQrThemes, aiUploadLimit,
      featPreparationTime, featCampaign, featCoverBanner, featSmartCategories, featUploadImageMenu,
      featAlertBarista, featPos, featOrderFromTable, featMultipleLanguage, featCustomDomain,
      featDedicatedSupport, featAiUpload
    };

    const existing = await (prisma as any).plan.findUnique({ where: { id } });

    if (existing) {
      await (prisma as any).plan.update({
        where: { id },
        data: dataPayload
      });
    } else {
      await (prisma as any).plan.create({
        data: {
          id: id.length < 10 ? id : undefined, // Keep hardcoded short IDs like 'FREE', otherwise auto-generate CUID
          ...dataPayload
        }
      });
    }
    
    revalidatePath('/superadmin');
    return { success: true };
  } catch (error: any) {
    console.error("Failed to update plan:", error);
    return { success: false, error: error.message || "Failed to update plan. Ensure internal key is unique." };
  }
}

export async function togglePlanStatus(formData: FormData) {
  if (!await verifySuperAdmin()) return { error: "Unauthorized" };
  
  const id = formData.get('id') as string;
  const currentStatus = formData.get('currentStatus') as string;
  const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';

  try {
    const existing = await (prisma as any).plan.findUnique({ where: { id } });
    if (existing) {
      await (prisma as any).plan.update({
        where: { id },
        data: { status: newStatus }
      });
    } else {
      // Lazy-create the hardcoded plan if missing so we can store its inactive state
      await (prisma as any).plan.create({
        data: {
          id: id.length < 10 ? id : undefined,
          name: id,
          slug: id.toLowerCase(),
          status: newStatus
        }
      });
    }
    revalidatePath('/superadmin');
    revalidatePath('/', 'layout');
  } catch (error) {
    console.error("Failed to toggle plan status:", error);
  }
}

// --- REGISTRATION ACTIONS ---
export async function validateInviteToken(token: string) {
  if (!token) return { valid: false, error: "No token provided" };

  const invite = await prisma.invite.findUnique({
    where: { token }
  });

  if (!invite) return { valid: false, error: "Invite not found or invalid" };
  if (invite.isUsed) return { valid: false, error: "This invite has already been used" };
  if (new Date() > invite.expiresAt) return { valid: false, error: "This invite has expired" };

  return { valid: true, invite };
}

export async function registerShopFromInvite(formData: FormData) {
  const token = formData.get('token') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const shopName = formData.get('shopName') as string;

  const inviteCheck = await validateInviteToken(token);
  if (!inviteCheck.valid) return { success: false, error: inviteCheck.error };

  const slug = shopName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    await prisma.$transaction(async (tx) => {
      const shop = await tx.shop.create({
        data: { name: shopName, slug, plan: "PRO", status: "ACTIVE" }
      });
      const user = await tx.user.create({
        data: { email, password: hashedPassword }
      });
      await tx.shopUser.create({
        data: { userId: user.id, shopId: shop.id, role: "OWNER" }
      });
      await tx.invite.update({
        where: { token },
        data: { isUsed: true }
      });
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: "Registration failed" };
  }
}

// --- PASSWORD RESET ACTIONS ---
export async function requestPasswordReset(formData: FormData) {
  if (!await verifySuperAdmin()) return { success: false, error: "Unauthorized" };
  
  const email = formData.get('email') as string;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return { success: true, debugLink: null };

  const resetToken = crypto.randomBytes(32).toString('hex');
  const resetTokenExpiry = new Date(Date.now() + 3600000);

  await (prisma.user as any).update({
    where: { email },
    data: { resetToken, resetTokenExpiry }
  });

  return { success: true, debugLink: `/auth/${email}/reset-password?token=${resetToken}` };
}

export async function resetPassword(formData: FormData) {
  const token = formData.get('token') as string;
  const newPassword = formData.get('password') as string;
  const user = await (prisma.user as any).findUnique({ where: { resetToken: token } });
  const userData = user as any; 

  if (!userData || !userData.resetTokenExpiry || new Date() > new Date(userData.resetTokenExpiry)) {
    return { success: false, error: "Invalid or expired token" };
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await (prisma.user as any).update({
    where: { id: userData.id },
    data: { password: hashedPassword, resetToken: null, resetTokenExpiry: null }
  });

  return { success: true };
}

export async function registerPublicShop(formData: FormData): Promise<{ success: boolean; error?: string }> {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const telegram = formData.get('telegram') as string;
  const phone = formData.get('phone') as string;
  
  const shopName = email.split('@')[0] + "'s Shop";

  if (!email || !password) {
    return { success: false, error: "Email and password are required" };
  }

  // Use an exact match slug to ensure consistency
  const slug = shopName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    return await prisma.$transaction(async (tx) => {
      const shop = await tx.shop.create({
        data: { name: shopName, slug, plan: "FREE", status: "ACTIVE" }
      });

      const user = await tx.user.create({
        data: { email, password: hashedPassword }
      });

      await tx.shopUser.create({
        data: { userId: user.id, shopId: shop.id, role: "OWNER" }
      });

      await tx.shopSettings.create({
        data: {
          shopId: shop.id,
          name: shopName,
          themeColor: "#000000",
          headerDesign: "design1",
          socials: "[]",
          telegram: telegram || null,
          phone: phone || null
        }
      });

      return { success: true };
    });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return { success: false, error: "Email already exists" };
    }
    return { success: false, error: "Registration failed. Please try again." };
  }
}

export async function createSuperAdminUser(formData: FormData) {
  if (!await verifySuperAdmin()) return { success: false, error: "Unauthorized" };
  
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  
  if (!email || !password) return { success: false, error: "Email and password are required" };

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { success: false, error: "Email already exists" };

  const hashedPassword = await bcrypt.hash(password, 10);
  
  try {
    await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: "SUPERADMIN",
        isSuperAdmin: true
      }
    });
    revalidatePath('/superadmin');
    return { success: true };
  } catch (error) {
    console.error("Failed to create super admin", error);
    return { success: false, error: "Failed to create SuperAdmin account" };
  }
}
