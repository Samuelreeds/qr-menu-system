// src/lib/actions.ts
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

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

const PRODUCT_PLACEHOLDER_IMAGE = 'data:image/svg+xml;charset=utf-8,%3Csvg xmlns%3D"http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg" width%3D"400" height%3D"400" viewBox%3D"0 0 400 400"%3E%3Crect width%3D"400" height%3D"400" fill%3D"%23f3f4f6"%2F%3E%3Ctext x%3D"50%25" y%3D"50%25" dominant-baseline%3D"middle" text-anchor%3D"middle" font-family%3D"sans-serif" font-size%3D"48" font-weight%3D"bold" fill%3D"%239ca3af"%3EN%2FA%3C%2Ftext%3E%3C%2Fsvg%3E';

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

export async function checkIsAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return false;
  
  const user = await prisma.user.findUnique({ 
    where: { email: session.user.email },
    include: { shopUsers: true } 
  });
  
  if (!user) return false;
  if (user.isSuperAdmin || user.role === 'SUPERADMIN') return true;
  if (user.role === 'admin') return true;
  
  if (user.shopUsers.some(su => su.role === 'OWNER' || su.role === 'admin')) return true;
  
  return false;
}

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
    include: { category: true, variants: true, ingredients: true }, 
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

export async function addBanner(formData: FormData) {
  if (!(await checkIsAdmin())) return { error: "Unauthorized" };

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
  if (!(await checkIsAdmin())) return;

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
  if (!(await checkIsAdmin())) return;

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
  if (!(await checkIsAdmin())) return;

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
  if (!(await checkIsAdmin())) return;

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

export async function createCategory(formData: FormData) {
  if (!(await checkIsAdmin())) return { error: "Unauthorized" };

  const shopId = await getActiveShopId();
  if (!shopId) return;

  const limit = await getLimit(shopId, 'maxCategories');
  const currentCount = await prisma.category.count({ where: { shopId } });
  if (currentCount >= limit) return { error: "Category limit reached." };

  const name = formData.get('name') as string;
  const name_kh = formData.get('name_kh') as string || null;
  const name_zh = formData.get('name_zh') as string || null;
  const discount = parseFloat(formData.get('discount') as string) || 0;
  const isDrink = formData.get('isDrink') === 'true'; 

  const lastCategory = await prisma.category.findFirst({ 
    where: { shopId },
    orderBy: { sortOrder: 'desc' } 
  });
  const nextOrder = (lastCategory?.sortOrder || 0) + 1;
  
  await prisma.category.create({ 
    data: { name, name_kh, name_zh, sortOrder: nextOrder, discount, isDrink, shopId } 
  });
  await revalidateActiveShop();
}

export async function updateCategory(formData: FormData) {
  if (!(await checkIsAdmin())) return;

  const id = formData.get('id') as string;
  const name = formData.get('name') as string;
  const name_kh = formData.get('name_kh') as string || null;
  const name_zh = formData.get('name_zh') as string || null;
  const sortOrder = parseInt(formData.get('sortOrder') as string);
  const discount = parseFloat(formData.get('discount') as string) || 0;
  const isDrink = formData.get('isDrink') === 'true'; 
  
  await prisma.category.update({ 
    where: { id }, 
    data: { name, name_kh, name_zh, sortOrder, discount, isDrink } 
  });
  await revalidateActiveShop();
}

export async function deleteCategory(formData: FormData) {
  if (!(await checkIsAdmin())) return;

  const id = formData.get('id') as string;
  try { await prisma.category.delete({ where: { id } }); } catch (e) {}
  await revalidateActiveShop();
}

export async function createProduct(data: {
  name: string;
  name_kh?: string | null;
  name_zh?: string | null;
  price?: number | null;
  variants?: { name: string; price: number }[] | null;
  ingredients?: { ingredientId: string; quantityUsed: number }[] | null;
  discount?: number;
  categoryId: string;
  time?: string;
  image?: any;
  isPopular?: boolean;
  isSoldOut?: boolean;
  department?: string; 
}) {
  if (!(await checkIsAdmin())) return { error: "Unauthorized" };

  const shopId = await getActiveShopId();
  if (!shopId) return;

  const limit = await getLimit(shopId, 'maxProducts');
  const currentCount = await prisma.product.count({ where: { shopId } });
  if (currentCount >= limit) return { error: "Product limit reached." };

  const name = data.name;
  const name_kh = data.name_kh || null;
  const name_zh = data.name_zh || null;
  const discount = data.discount || 0;
  const categoryId = data.categoryId;
  const time = data.time || '15min';
  const isSoldOut = !!data.isSoldOut;

  const variants = data.variants && data.variants.length > 0 ? data.variants : [{ name: 'Default', price: data.price || 0 }];
  const price = variants[0]?.price || data.price || 0;

  let imagePath: string | undefined;
  if (data.image && typeof data.image === 'object' && 'arrayBuffer' in data.image) {
    imagePath = await uploadToSupabase(data.image as File, 'products');
  } else if (typeof data.image === 'string' && data.image) {
    imagePath = data.image;
  }
  if (!imagePath) imagePath = PRODUCT_PLACEHOLDER_IMAGE;

  const hiddenDeptTag = data.department === 'pub' ? '[PUB]' : '[COFFEE]';

  await prisma.product.create({
    data: { 
      name, 
      name_kh, 
      name_zh, 
      price, 
      discount, 
      categoryId, 
      image: imagePath, 
      time, 
      rating: 4.5, 
      description: hiddenDeptTag, 
      isPopular: !!data.isPopular, 
      isSoldOut, 
      shopId,
      variants: {
        create: variants.map(v => ({
          name: v.name,
          price: v.price
        }))
      },
      ingredients: {
        create: data.ingredients?.map(ing => ({
          ingredientId: ing.ingredientId,
          quantityUsed: ing.quantityUsed
        })) || []
      }
    }
  })
  await revalidateActiveShop();
}

export async function updateProduct(data: {
  id: string;
  name: string;
  name_kh?: string | null;
  name_zh?: string | null;
  price?: number | null;
  variants?: { name: string; price: number }[] | null;
  ingredients?: { ingredientId: string; quantityUsed: number }[] | null;
  discount?: number;
  categoryId: string;
  time?: string;
  image?: any;
  isPopular?: boolean;
  isSoldOut?: boolean;
  department?: string; 
}) {
  if (!(await checkIsAdmin())) return { error: "Unauthorized" };

  const id = data.id;
  const name = data.name;
  const name_kh = data.name_kh || null;
  const name_zh = data.name_zh || null;
  const discount = data.discount || 0;
  const categoryId = data.categoryId;
  const time = data.time || '15min';
  const isSoldOut = !!data.isSoldOut;
  
  const variants = data.variants && data.variants.length > 0 ? data.variants : [{ name: 'Default', price: data.price || 0 }];
  const price = variants[0]?.price || data.price || 0;

  let newImagePath: string | undefined;
  if (data.image && typeof data.image === 'object' && 'arrayBuffer' in data.image) {
    newImagePath = await uploadToSupabase(data.image as File, 'products');
  }

  if (newImagePath) {
    const oldProduct = await prisma.product.findUnique({ where: { id }, select: { image: true } });
    await deleteFromSupabase(oldProduct?.image || null);
  }

  const hiddenDeptTag = data.department === 'pub' ? '[PUB]' : '[COFFEE]';

  await prisma.product.update({
    where: { id },
    data: { 
      name, 
      name_kh, 
      name_zh, 
      price, 
      discount, 
      categoryId, 
      time, 
      ...(newImagePath && { image: newImagePath }), 
      isPopular: !!data.isPopular, 
      isSoldOut,
      description: hiddenDeptTag, 
      variants: {
        deleteMany: {}, 
        create: variants.map(v => ({
          name: v.name,
          price: v.price
        }))
      },
      ingredients: {
        deleteMany: {},
        create: data.ingredients?.map(ing => ({
          ingredientId: ing.ingredientId,
          quantityUsed: ing.quantityUsed
        })) || []
      }
    }
  });
  await revalidateActiveShop();
}

export async function toggleProductSoldOut(formData: FormData) {
  if (!(await checkIsAdmin())) return;

  const id = formData.get('id') as string;
  const isSoldOut = formData.get('isSoldOut') === 'true';
  try {
    await prisma.product.update({ where: { id }, data: { isSoldOut } });
    await revalidateActiveShop();
  } catch (e) {}
}

export async function deleteProduct(formData: FormData) {
  if (!(await checkIsAdmin())) return;

  const id = formData.get('id') as string;
  try { 
    const product = await prisma.product.findUnique({ where: { id }, select: { image: true } });
    await prisma.product.delete({ where: { id } });
    await deleteFromSupabase(product?.image || null);
  } catch (e) {}
  await revalidateActiveShop();
}

export async function updateShopIdentity(formData: FormData) {
  if (!(await checkIsAdmin())) return { error: "Unauthorized" };

  const name = formData.get('name') as string;
  const name_kh = formData.get('name_kh') as string || null;
  const nameDisplay = formData.get('nameDisplay') as string || 'EN';
  const address = formData.get('address') as string || null;
  const phone = formData.get('phone') as string || null;
  const openingHours = formData.get('openingHours') as string || null;
  const printerUrl = formData.get('printerUrl') as string || null;
  const is24Hours = formData.get('is24Hours') === 'true';
  const removeQr = formData.get('removeQr') === 'true'; // Allow deleting the QR
  
  const qrFile = formData.get('qrImage') as File | null;

  const shopId = await getActiveShopId();
  if (!shopId) return;

  const newSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

  try {
    await prisma.shop.update({
      where: { id: shopId },
      data: { name, slug: newSlug }
    });
  } catch (error) {}

  // Handle QR Image Upload
  let newQrPath: string | undefined;
  if (qrFile && qrFile.size > 0 && qrFile.name !== 'undefined') {
    newQrPath = await uploadToSupabase(qrFile, 'branding'); // Using branding folder for shop assets
  }

  const dataToUpdate: any = { 
    name, name_kh, nameDisplay, address, phone, openingHours, is24Hours, printerUrl 
  };

  if (newQrPath) {
    const currentSettings = await prisma.shopSettings.findUnique({ where: { shopId }, select: { qrImage: true } });
    if (currentSettings?.qrImage) await deleteFromSupabase(currentSettings.qrImage);
    dataToUpdate.qrImage = newQrPath;
  } else if (removeQr) {
    const currentSettings = await prisma.shopSettings.findUnique({ where: { shopId }, select: { qrImage: true } });
    if (currentSettings?.qrImage) await deleteFromSupabase(currentSettings.qrImage);
    dataToUpdate.qrImage = null;
  }

  await prisma.shopSettings.upsert({
    where: { shopId },
    update: dataToUpdate,
    create: { 
      shopId, name, name_kh, nameDisplay, address, phone, openingHours, is24Hours, printerUrl,
      themeColor: '#000000',
      headerDesign: 'design1',
      qrImage: newQrPath || null
    }
  });
  await revalidateActiveShop();
}

export async function updateShopBranding(formData: FormData) {
  if (!(await checkIsAdmin())) return { error: "Unauthorized" };

  const shopId = await getActiveShopId();
  if (!shopId) return;
  
  const logoFile = formData.get('logo') as File;
  const logoType = formData.get('logoType') as string || 'withBackground';
  const newLogoPath = await uploadToSupabase(logoFile, 'branding');

  const dataToUpdate: any = {};
  
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
  if (!(await checkIsAdmin())) return { error: "Unauthorized" };

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
  } catch (error) {}
}

export async function deleteInvite(formData: FormData) {
  if (!await verifySuperAdmin()) return { error: "Unauthorized" };
  
  const id = formData.get('id') as string;
  try {
    await prisma.invite.delete({ where: { id } });
    revalidatePath('/superadmin');
  } catch (error) {}
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
  } catch (error) {}
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
        warningMsg = "Shop deleted from database, but failed to remove some files from storage.";
      }
    }
  } catch (error: any) {
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
  } catch (error) {}
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
    const text = Buffer.from(arrayBuffer).toString('utf8').replace(/^\uFEFF/, '');
    
    try {
      await supabase.storage.from('uploads').upload(`imports/${shopId}.txt`, Buffer.from(text, 'utf8'), {
        contentType: 'text/plain;charset=UTF-8',
        upsert: true
      });
    } catch (e) {}

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
    
    if (!headers[0].includes('category') || !headers[1].includes('product')) {
       return { success: false, error: "Invalid template format. Please download and use the provided CSV template." };
    }

    let validCount = 0;
    let invalidCount = 0;
    const missingFields: string[] = [];
    const duplicates: string[] = [];
    const seenProducts = new Set<string>();

    const existingProducts = await prisma.product.findMany({
      where: { shopId },
      include: { category: true }
    });
    existingProducts.forEach(p => {
      seenProducts.add(`${p.category.name}-${p.name}`.toLowerCase());
    });

    for (let i = 1; i < rows.length; i++) {
      const cols = parseCSVRow(rows[i]);
      if (cols.length < 2 || (!cols[0] && !cols[1])) continue; 

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
                isDrink: false,
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
                description: '[COFFEE]', // Default hidden tag for imported items
                isPopular: item.isPopular,
                shopId: shopId,
                variants: {
                  create: [{ name: 'Default', price: item.price }]
                }
             }
          });
          existingProductKeys.add(prodKey);
          importedCount++;
       }
    }

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
    return { success: false, error: "Failed to process import into database." };
  }
}

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
          id: id.length < 10 ? id : undefined, 
          ...dataPayload
        }
      });
    }
    
    revalidatePath('/superadmin');
    return { success: true };
  } catch (error: any) {
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
  } catch (error) {}
}

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
  const requestedPlan = (formData.get('plan') as string)?.toUpperCase() || 'FREE';
  
  const shopName = email.split('@')[0] + "'s Shop";

  if (!email || !password) {
    return { success: false, error: "Email and password are required" };
  }

  const validPlans = ['FREE', 'BASIC', 'EXCLUSIVE'];
  const plan = validPlans.includes(requestedPlan) ? requestedPlan : 'FREE';

  let trialEndsAt: Date | undefined = undefined;
  if (plan === 'BASIC') {
    trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 7);
  }

  const slug = shopName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    return await prisma.$transaction(async (tx) => {
      const shop = await tx.shop.create({
        data: { 
          name: shopName, 
          slug, 
          plan, 
          status: "ACTIVE",
          trialEndsAt 
        }
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
    return { success: false, error: "Failed to create SuperAdmin account" };
  }
}

export async function createPosOrder(data: {
  shopId: string;
  orderType: string;
  tableNumber?: string;
  deliveryAgent?: string;
  discount: number; 
  promoCode?: string;
  paymentMethod: string;
  currency?: string;
  amountReceived?: number;
  changeAmount?: number;
  isTaxEnabled: boolean; 
  items: any[];
}) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return { error: "Unauthorized" };

    const activeShopId = await getActiveShopId();
    if (activeShopId !== data.shopId && !(session as any)?.user?.isSuperAdmin) {
       return { error: "Unauthorized for this shop" };
    }

    const currentUser = await prisma.user.findUnique({ where: { email: session!.user!.email! } });

    const productIds = data.items.map(i => i.productId);
    const realProducts = await prisma.product.findMany({
      where: { id: { in: productIds } },
      include: {
        category: { select: { discount: true } },
        ingredients: true 
      }
    });

    let secureSubtotal = 0;
    const orderItemsData = data.items.map(clientItem => {
      const realProd = realProducts.find(p => p.id === clientItem.productId);
      if (!realProd) throw new Error(`Product ${clientItem.name} not found in database.`);

      let itemPrice = realProd.price;
      const effectiveDiscount = realProd.discount > 0 ? realProd.discount : (realProd.category?.discount || 0);
      if (effectiveDiscount > 0) {
        itemPrice = itemPrice * (1 - effectiveDiscount / 100);
      }

      secureSubtotal += (itemPrice * clientItem.qty);

      return {
        productId: realProd.id,
        name: clientItem.name,
        price: itemPrice,     
        quantity: clientItem.qty,
        notes: clientItem.notes,
        customization: clientItem.customization,
      };
    });

    const secureDiscount = Math.min(data.discount, secureSubtotal);
    const afterDiscount = secureSubtotal - secureDiscount;
    const secureTax = data.isTaxEnabled ? (afterDiscount * 0.1) : 0; 
    const secureTotal = afterDiscount + secureTax;

    const mappedOrderType = data.orderType.toUpperCase() === 'WALK-IN' ? 'TAKEAWAY' : data.orderType.toUpperCase();

    const currentOrderCount = await prisma.order.count({ where: { shopId: data.shopId } });
    const generatedOrderNumber = `# ORD-${String(currentOrderCount + 1).padStart(4, '0')}`;

    const order = await prisma.$transaction(async (tx) => {
       
       const createdOrder = await tx.order.create({
         data: {
           shopId: data.shopId,
           userId: currentUser?.id, 
           orderNumber: generatedOrderNumber,
           orderType: mappedOrderType as any,
           tableNumber: data.tableNumber,
           deliveryAgent: data.deliveryAgent,
           subtotal: secureSubtotal,
           discount: secureDiscount,
           promoCode: data.promoCode,
           tax: secureTax,
           total: secureTotal,
           currency: data.currency || "USD",
           amountReceived: data.amountReceived ?? secureTotal,
           changeAmount: data.changeAmount ?? 0,
           paymentMethod: data.paymentMethod as any,
           status: 'COMPLETED',
           isPaid: true,
           items: {
             create: orderItemsData,
           },
         },
         include: { items: true } 
       });

       const deductions = new Map<string, number>(); 
       for (const clientItem of data.items) {
          const realProd = realProducts.find(p => p.id === clientItem.productId);
          if (realProd && realProd.ingredients && realProd.ingredients.length > 0) {
             for (const recipeItem of realProd.ingredients) {
                const amountToDeduct = recipeItem.quantityUsed * clientItem.qty;
                deductions.set(
                   recipeItem.ingredientId,
                   (deductions.get(recipeItem.ingredientId) || 0) + amountToDeduct
                );
             }
          }
       }

       const staffName = (session as any)?.user?.email?.split('@')[0] || "POS System";
       
       for (const [ingredientId, amountToDeduct] of deductions.entries()) {
          const ingredient = await tx.ingredient.findUnique({ where: { id: ingredientId } });
          if (ingredient) {
             const newStock = Math.max(0, ingredient.current - amountToDeduct);
             
             await tx.ingredient.update({
                where: { id: ingredientId },
                data: { current: newStock }
             });

             await tx.stockLog.create({
                data: {
                   shopId: data.shopId,
                   ingredientId: ingredientId,
                   change: -amountToDeduct,
                   reason: "Sold",
                   staffName: staffName,
                   previousStock: ingredient.current,
                   newStock: newStock
                }
             });
          }
       }

       return createdOrder;
    });

    revalidatePath('/admin');
    return { success: true, order };
  } catch (error: any) {
    return { error: error.message || "Failed to save order to database." };
  }
}

export async function updateOrderStatus(orderId: string, status: string) {
  const shopId = await getActiveShopId();
  if (!shopId) return { success: false, error: "Unauthorized" };

  try {
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order || order.shopId !== shopId) return { success: false, error: "Order not found" };

    await prisma.order.update({
      where: { id: orderId },
      data: { status: status as any }
    });
    
    revalidatePath('/admin');
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to update order" };
  }
}

export async function deleteOrder(orderId: string) {
  if (!(await checkIsAdmin())) return { success: false, error: "Unauthorized" };

  const shopId = await getActiveShopId();
  if (!shopId) return { success: false, error: "Unauthorized" };

  try {
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order || order.shopId !== shopId) return { success: false, error: "Order not found" };

    await prisma.order.delete({
      where: { id: orderId }
    });
    
    revalidatePath('/admin');
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to delete order" };
  }
}

export async function getInventory() {
  const shopId = await getActiveShopId();
  if (!shopId) return { ingredients: [], logs: [] };

  const ingredients = await prisma.ingredient.findMany({
    where: { shopId },
    orderBy: { name: 'asc' }
  });

  const logs = await prisma.stockLog.findMany({
    where: { shopId },
    orderBy: { timestamp: 'desc' },
    take: 100
  });

  return { ingredients, logs };
}

export async function adjustStockAction(ingredientId: string, change: number, reason: string, staffName: string) {
  if (!(await checkIsAdmin())) return { success: false, error: "Unauthorized" };

  const shopId = await getActiveShopId();
  if (!shopId) return { success: false, error: "Unauthorized" };

  try {
    await prisma.$transaction(async (tx) => {
      const ingredient = await tx.ingredient.findUnique({ where: { id: ingredientId } });
      if (!ingredient) throw new Error("Ingredient not found");

      const newStock = Math.max(0, ingredient.current + change);

      await tx.ingredient.update({
        where: { id: ingredientId },
        data: { current: newStock }
      });

      await tx.stockLog.create({
        data: {
          shopId,
          ingredientId,
          change,
          reason,
          staffName,
          previousStock: ingredient.current,
          newStock
        }
      });
    });

    revalidatePath('/admin');
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to adjust stock" };
  }
}

export async function createIngredient(data: { name: string, unit: string, max: number, lowThreshold: number }) {
  if (!(await checkIsAdmin())) return { success: false, error: "Unauthorized" };

  const shopId = await getActiveShopId();
  if (!shopId) return { error: "Unauthorized" };

  try {
    const ingredient = await prisma.ingredient.create({
      data: {
        shopId,
        name: data.name,
        unit: data.unit,
        current: data.max,
        max: data.max,
        lowThreshold: data.lowThreshold
      }
    });
    revalidatePath('/admin');
    return { success: true, ingredient };
  } catch (e) {
    return { success: false, error: "Failed to create ingredient" };
  }
}

export async function deleteInventoryItem(id: string) {
  if (!(await checkIsAdmin())) return { success: false, error: "Unauthorized" };

  const shopId = await getActiveShopId();
  if (!shopId) return { success: false, error: "Unauthorized" };

  try {
    const item = await prisma.ingredient.findUnique({ where: { id } });
    if (!item || item.shopId !== shopId) {
      return { success: false, error: "Item not found or unauthorized" };
    }
    
    await prisma.ingredient.delete({
      where: { id }
    });
    
    revalidatePath('/admin');
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to delete item" };
  }
}

// --- TEAM MANAGEMENT ACTIONS ---

export async function getTeamMembers() {
  if (!(await checkIsAdmin())) return { success: false, data: [] };
  
  const shopId = await getActiveShopId();
  if (!shopId) return { success: false, data: [] };

  const members = await prisma.shopUser.findMany({
    where: { shopId },
    include: { user: true }
  });

  return {
    success: true,
    data: members.map(m => ({
      id: m.user.id,
      email: m.user.email,
      role: m.user.role || 'staff',
      createdAt: m.createdAt
    }))
  };
}

export async function createTeamMember(formData: FormData) {
  if (!(await checkIsAdmin())) return { success: false, error: "Unauthorized. Admin access required." };
  
  const shopId = await getActiveShopId();
  if (!shopId) return { success: false, error: "No active shop." };
  
  const session = await getServerSession(authOptions);
  const currentUser = await prisma.user.findUnique({ where: { email: session!.user!.email! } });
  
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const role = formData.get('role') as string; // 'admin' | 'staff'
  
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) return { success: false, error: "Email already in use." };
  
  const hashedPassword = await bcrypt.hash(password, 10);
  
  try {
    await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          role,
          createdBy: currentUser!.id
        }
      });
      
      await tx.shopUser.create({
        data: {
          userId: newUser.id,
          shopId,
          role: role === 'admin' ? 'OWNER' : 'STAFF'
        }
      });
    });
    revalidatePath('/admin');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to create user." };
  }
}

export async function updateTeamMemberRole(formData: FormData) {
  if (!(await checkIsAdmin())) return { success: false, error: "Unauthorized." };
  
  const userId = formData.get('userId') as string;
  const role = formData.get('role') as string;
  
  try {
    await prisma.user.update({
      where: { id: userId },
      data: { role }
    });
    
    // Sync ShopUser role
    const shopId = await getActiveShopId();
    if (shopId) {
      const su = await prisma.shopUser.findFirst({
         where: { userId: userId, shopId: shopId }
      });
      if (su) {
        await prisma.shopUser.update({
          where: { id: su.id },
          data: { role: role === 'admin' ? 'OWNER' : 'STAFF' }
        });
      }
    }
    revalidatePath('/admin');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: "Failed to update role." };
  }
}

export async function deleteTeamMember(formData: FormData) {
  if (!(await checkIsAdmin())) return { success: false, error: "Unauthorized." };
  
  const userId = formData.get('userId') as string;
  const session = await getServerSession(authOptions);
  const currentUser = await prisma.user.findUnique({ where: { email: session!.user!.email! } });
  
  if (userId === currentUser!.id) {
    return { success: false, error: "You cannot delete yourself." };
  }
  
  try {
    await prisma.user.delete({ where: { id: userId } });
    revalidatePath('/admin');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: "Failed to delete user." };
  }
}

export async function getUserActivity(userId: string) {
  if (!(await checkIsAdmin())) return { success: false, error: "Unauthorized" };
  const shopId = await getActiveShopId();
  if (!shopId) return { success: false, error: "No active shop" };

  const targetUser = await prisma.user.findUnique({ where: { id: userId } });
  if (!targetUser) return { success: false, error: "User not found" };

  const orders = await prisma.order.findMany({
    where: { shopId, userId },
    orderBy: { createdAt: 'desc' },
    include: { items: true }
  });

  const totalSales = orders.reduce((sum, o) => sum + (o.status !== 'CANCELLED' ? o.total : 0), 0);

  const staffNamePrefix = targetUser.email.split('@')[0];
  const stockLogs = await prisma.stockLog.findMany({
    where: { shopId, staffName: staffNamePrefix },
    orderBy: { timestamp: 'desc' }
  });

  return {
    success: true,
    data: {
      orders,
      totalSales,
      stockLogs
    }
  };
}

export async function ensureDemoAccountExists(demoId: string = 'default') {
  try {
    const demoEmail = `demo_${demoId}@scandine.xyz`;
    const slug = `demo-cafe-${demoId}`;

    const existingUser = await prisma.user.findUnique({ 
      where: { email: demoEmail },
      select: { id: true } 
    });

    if (existingUser) return { success: true };

    const DEMO_PRODUCT_IMAGE = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iI2ZmZWRkNSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIyNCIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IiNmOTczMTYiPkNhZmU8L3RleHQ+PC9zdmc+";
    const DEMO_LOGO_IMAGE = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iI2Y5NzMxNiIgcng9IjEwMCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIxMjAiIGZvbnQtd2VpZ2h0PSJib2xkIiBmaWxsPSIjZmZmZmZmIj5TPC90ZXh0Pjwvc3ZnPg==";
    
    const hashedPassword = await bcrypt.hash('demo_password_123', 10);
    
    try {
        await (prisma as any).plan.create({
          data: {
            id: "EXCLUSIVE", name: "Exclusive Pack", slug: "exclusive", status: "ACTIVE",
            priceMonthly: 16.99, priceYearly: 169, maxProducts: 9999, maxCategories: 9999, maxBanners: 10,
            featPos: true, featCampaign: true, featOrderFromTable: true, featAlertBarista: true
          }
        }).catch(() => {});
    } catch(e) {}

    const expirationTime = new Date(Date.now() + 60 * 1000);

    const shop = await prisma.shop.create({
      data: { 
        name: "Scandine Demo Shop", 
        slug: slug, 
        plan: "EXCLUSIVE" as any, 
        status: "ACTIVE" as any,
        isDemo: true,
        expiresAt: expirationTime
      }
    });
    const shopId = shop.id;
    
    const newUser = await prisma.user.create({
      data: { email: demoEmail, password: hashedPassword }
    });
    
    await prisma.shopUser.create({
      data: { userId: newUser.id, shopId: shopId, role: "OWNER" as any }
    });
    
    await prisma.shopSettings.create({
      data: { shopId: shopId, name: "Scandine Demo Shop", themeColor: "#f97316", headerDesign: "design1", socials: "[]", logo: DEMO_LOGO_IMAGE }
    });

    const cat1 = await prisma.category.create({ data: { shopId, name: "Popular 🔥", sortOrder: 1, isDrink: true } });
    const cat2 = await prisma.category.create({ data: { shopId, name: "Coffee ☕", sortOrder: 2, isDrink: true } });
    const cat3 = await prisma.category.create({ data: { shopId, name: "Tea & Refreshers 🍹", sortOrder: 3, isDrink: true } });
    const cat4 = await prisma.category.create({ data: { shopId, name: "Food & Pastries 🥐", sortOrder: 4, isDrink: false } });

    const products = [
        { shopId, categoryId: cat1.id, name: "Signature Matcha Latte", price: 4.00, time: "5min", image: DEMO_PRODUCT_IMAGE, isPopular: true, description: "[COFFEE]" },
        { shopId, categoryId: cat1.id, name: "Iced Caramel Macchiato", price: 4.50, time: "5min", image: DEMO_PRODUCT_IMAGE, isPopular: true, description: "[COFFEE]" },
        { shopId, categoryId: cat1.id, name: "Classic Avocado Toast", price: 6.50, time: "10min", image: DEMO_PRODUCT_IMAGE, isPopular: true, description: "[COFFEE]" },
        { shopId, categoryId: cat1.id, name: "Strawberry Hibiscus Tea", price: 4.50, time: "5min", image: DEMO_PRODUCT_IMAGE, isPopular: true, description: "[COFFEE]" },
        { shopId, categoryId: cat2.id, name: "Hot Cafe Latte", price: 3.50, time: "5min", image: DEMO_PRODUCT_IMAGE, isPopular: false, description: "[COFFEE]" },
        { shopId, categoryId: cat2.id, name: "Cold Brew Coffee", price: 4.00, time: "5min", image: DEMO_PRODUCT_IMAGE, isPopular: false, description: "[COFFEE]" },
        { shopId, categoryId: cat2.id, name: "Americano", price: 3.00, time: "5min", image: DEMO_PRODUCT_IMAGE, isPopular: false, description: "[COFFEE]" },
        { shopId, categoryId: cat2.id, name: "Iced Mocha", price: 4.50, time: "5min", image: DEMO_PRODUCT_IMAGE, isPopular: false, description: "[COFFEE]" },
        { shopId, categoryId: cat2.id, name: "Vanilla Sweet Cream Cold Brew", price: 4.80, time: "5min", image: DEMO_PRODUCT_IMAGE, isPopular: false, description: "[COFFEE]" },
        { shopId, categoryId: cat2.id, name: "Espresso Macchiato", price: 2.80, time: "5min", image: DEMO_PRODUCT_IMAGE, isPopular: false, description: "[COFFEE]" },
        { shopId, categoryId: cat3.id, name: "Peach Iced Tea", price: 4.00, time: "5min", image: DEMO_PRODUCT_IMAGE, isPopular: false, description: "[COFFEE]" },
        { shopId, categoryId: cat3.id, name: "Lemon Passionfruit Tea", price: 4.20, time: "5min", image: DEMO_PRODUCT_IMAGE, isPopular: false, description: "[COFFEE]" },
        { shopId, categoryId: cat3.id, name: "Thai Iced Tea", price: 4.50, time: "5min", image: DEMO_PRODUCT_IMAGE, isPopular: false, description: "[COFFEE]" },
        { shopId, categoryId: cat3.id, name: "Lychee Soda", price: 3.80, time: "5min", image: DEMO_PRODUCT_IMAGE, isPopular: false, description: "[COFFEE]" },
        { shopId, categoryId: cat4.id, name: "Butter Croissant", price: 3.00, time: "2min", image: DEMO_PRODUCT_IMAGE, isPopular: false, description: "[COFFEE]" },
        { shopId, categoryId: cat4.id, name: "Chocolate Chip Cookie", price: 2.50, time: "2min", image: DEMO_PRODUCT_IMAGE, isPopular: false, description: "[COFFEE]" },
        { shopId, categoryId: cat4.id, name: "Blueberry Muffin", price: 3.50, time: "2min", image: DEMO_PRODUCT_IMAGE, isPopular: false, description: "[COFFEE]" },
        { shopId, categoryId: cat4.id, name: "Almond Danish", price: 3.80, time: "2min", image: DEMO_PRODUCT_IMAGE, isPopular: false, description: "[COFFEE]" },
        { shopId, categoryId: cat4.id, name: "Spicy Basil Chicken Pasta", price: 7.50, time: "15min", image: DEMO_PRODUCT_IMAGE, isPopular: false, description: "[COFFEE]" },
        { shopId, categoryId: cat4.id, name: "Tiramisu Slice", price: 5.50, time: "5min", image: DEMO_PRODUCT_IMAGE, isPopular: false, description: "[COFFEE]" }
    ];

    for (const p of products) {
        await prisma.product.create({
            data: {
               ...p,
               variants: { create: [{ name: 'Default', price: p.price }] }
            }
        });
    }

    const p1 = await prisma.product.findFirst({ where: { shopId, name: "Signature Matcha Latte" }});
    const p2 = await prisma.product.findFirst({ where: { shopId, name: "Butter Croissant" }});
    const p3 = await prisma.product.findFirst({ where: { shopId, name: "Iced Caramel Macchiato" }});

    if (p1 && p2 && p3) {
      await prisma.order.create({
        data: {
          shopId, orderNumber: '# ORD-0001', orderType: 'TABLE' as any, tableNumber: 'Table 4', subtotal: 7.00, discount: 0, tax: 0.70, total: 7.70, status: 'COMPLETED' as any, isPaid: true, paymentMethod: 'CASH' as any,
          items: { create: [ { productId: p1.id, name: p1.name, price: 4.00, quantity: 1 }, { productId: p2.id, name: p2.name, price: 3.00, quantity: 1 } ] }
        }
      });
      await prisma.order.create({
        data: {
          shopId, orderNumber: '# ORD-0002', orderType: 'TAKEAWAY' as any, subtotal: 4.50, discount: 0, tax: 0.45, total: 4.95, status: 'PENDING' as any, isPaid: true, paymentMethod: 'KHQR' as any,
          items: { create: [ { productId: p3.id, name: p3.name, price: 4.50, quantity: 1 } ] }
        }
      });
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}