'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { createClient } from '@supabase/supabase-js'
import sharp from 'sharp'
import { z } from 'zod'
import crypto from 'crypto'
import bcrypt from 'bcrypt'
import { getServerSession } from 'next-auth';

// --- SETUP ---
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

// --- MULTI-TENANT HELPER (SECURED) ---
async function getActiveShopId() {
  const session = await getServerSession();
  if (!session?.user?.email) return null; // Graceful exit

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { shopUsers: true }
  });

  if (!user || user.shopUsers.length === 0) return null; // Prevent crash
  return user.shopUsers[0].shopId;
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
      address: "", 
      phone: "", 
      themeColor: "#5CB85C",
      logo: null, 
      socials: "[]"
    };
  }
  return settings;
}

// --- HELPERS ---
async function uploadToSupabase(file: File, folder: 'products' | 'branding'): Promise<string | undefined> {
  if (!file || file.size === 0 || file.name === 'undefined') return undefined;

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const optimizedBuffer = await sharp(buffer)
      .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
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

// --- CATEGORY ACTIONS ---
export async function createCategory(formData: FormData) {
  const name = formData.get('name') as string;
  const name_kh = formData.get('name_kh') as string || null;
  const name_zh = formData.get('name_zh') as string || null;
  const shopId = await getActiveShopId();
  if (!shopId) return;

  const lastCategory = await prisma.category.findFirst({ 
    where: { shopId },
    orderBy: { sortOrder: 'desc' } 
  });
  const nextOrder = (lastCategory?.sortOrder || 0) + 1;
  
  await prisma.category.create({ 
    data: { name, name_kh, name_zh, sortOrder: nextOrder, shopId } 
  });
  revalidatePath('/', 'layout');
}

export async function updateCategory(formData: FormData) {
  const id = formData.get('id') as string;
  const name = formData.get('name') as string;
  const name_kh = formData.get('name_kh') as string || null;
  const name_zh = formData.get('name_zh') as string || null;
  const sortOrder = parseInt(formData.get('sortOrder') as string);
  
  await prisma.category.update({ 
    where: { id }, 
    data: { name, name_kh, name_zh, sortOrder } 
  });
  revalidatePath('/', 'layout');
}

export async function deleteCategory(formData: FormData) {
  const id = formData.get('id') as string;
  try { await prisma.category.delete({ where: { id } }); } catch (e) {}
  revalidatePath('/', 'layout');
}

// --- PRODUCT ACTIONS ---
export async function createProduct(formData: FormData) {
  const name = formData.get('name') as string
  const name_kh = formData.get('name_kh') as string || null;
  const name_zh = formData.get('name_zh') as string || null;
  const price = parseFloat(formData.get('price') as string)
  const categoryId = formData.get('categoryId') as string
  const time = formData.get('time') as string || '15min'
  const imageFile = formData.get('image') as File
  const shopId = await getActiveShopId();
  if (!shopId) return;
  
  let imagePath = await uploadToSupabase(imageFile, 'products');
  if (!imagePath) imagePath = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c';

  await prisma.product.create({
    data: { name, name_kh, name_zh, price, categoryId, image: imagePath, time, rating: 4.5, description: '', isPopular: formData.get('isPopular') === 'on', shopId }
  })
  revalidatePath('/', 'layout');
}

export async function updateProduct(formData: FormData) {
  const id = formData.get('id') as string;
  const name = formData.get('name') as string;
  const name_kh = formData.get('name_kh') as string || null;
  const name_zh = formData.get('name_zh') as string || null;
  const price = parseFloat(formData.get('price') as string);
  const categoryId = formData.get('categoryId') as string;
  const time = formData.get('time') as string || '15min';
  const imageFile = formData.get('image') as File;

  const newImagePath = await uploadToSupabase(imageFile, 'products');

  if (newImagePath) {
    const oldProduct = await prisma.product.findUnique({ where: { id }, select: { image: true } });
    await deleteFromSupabase(oldProduct?.image || null);
  }

  await prisma.product.update({
    where: { id },
    data: { name, name_kh, name_zh, price, categoryId, time, ...(newImagePath && { image: newImagePath }), isPopular: formData.get('isPopular') === 'on' }
  });
  revalidatePath('/', 'layout');
}

export async function deleteProduct(formData: FormData) {
  const id = formData.get('id') as string;
  try { 
    const product = await prisma.product.findUnique({ where: { id }, select: { image: true } });
    await prisma.product.delete({ where: { id } });
    await deleteFromSupabase(product?.image || null);
  } catch (e) {}
  revalidatePath('/', 'layout');
}

// --- SETTINGS ACTIONS ---
export async function updateShopIdentity(formData: FormData) {
  const name = formData.get('name') as string;
  const address = formData.get('address') as string;
  const phone = formData.get('phone') as string;
  const shopId = await getActiveShopId();
  if (!shopId) return;

  await prisma.shopSettings.upsert({
    where: { shopId },
    update: { name, address, phone },
    create: { 
      shopId, name, address, phone,
      themeColor: '#5CB85C'
    }
  });
  revalidatePath('/', 'layout');
}

export async function updateShopBranding(formData: FormData) {
  const themeColor = formData.get('themeColor') as string || '#5cb85c';
  const logoFile = formData.get('logo') as File;
  const shopId = await getActiveShopId();
  if (!shopId) return;
  
  const newLogoPath = await uploadToSupabase(logoFile, 'branding');

  const dataToUpdate: any = { themeColor };
  if (newLogoPath) {
    const currentSettings = await prisma.shopSettings.findUnique({ where: { shopId }, select: { logo: true } });
    if (currentSettings?.logo) await deleteFromSupabase(currentSettings.logo);
    dataToUpdate.logo = newLogoPath;
  }

  await prisma.shopSettings.upsert({
    where: { shopId },
    update: dataToUpdate,
    create: { shopId, name: 'Scandine', themeColor, logo: newLogoPath || null }
  });
  revalidatePath('/', 'layout');
}

export async function updateShopSocials(formData: FormData) {
  const socials = formData.get('socials') as string;
  const shopId = await getActiveShopId();
  if (!shopId) return;
  
  await prisma.shopSettings.upsert({
    where: { shopId },
    update: { socials },
    create: {
      shopId,
      name: 'Scandine',
      socials
    }
  });
  revalidatePath('/', 'layout');
}

export async function forceRevalidateAction() {
  revalidatePath('/', 'layout');
}

// --- SUPER ADMIN ACTIONS ---
export async function createInvite(formData: FormData) {
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
  const id = formData.get('id') as string;
  try {
    await prisma.invite.delete({ where: { id } });
    revalidatePath('/superadmin');
  } catch (error) {
    console.error(error);
  }
}

export async function listInvites() {
  return await prisma.invite.findMany({ orderBy: { createdAt: 'desc' } });
}

export async function toggleShopStatus(formData: FormData) {
  const id = formData.get('id') as string;
  const currentStatus = formData.get('currentStatus') === 'true';
  await prisma.shop.update({ 
    where: { id }, 
    data: { status: currentStatus ? "LOCKED" : "ACTIVE" } 
  });
  revalidatePath('/superadmin');
}

export async function updateShopPlan(formData: FormData) {
  const id = formData.get('id') as string;
  const plan = formData.get('plan') as string;
  await prisma.shop.update({ where: { id }, data: { plan } });
  revalidatePath('/superadmin');
}

export async function deleteShop(formData: FormData) {
  const id = formData.get('id') as string;
  try { await prisma.shop.delete({ where: { id } }); } catch (e) {}
  revalidatePath('/superadmin');
}

export async function deleteUser(formData: FormData) {
  const id = formData.get('id') as string;
  try { await prisma.user.delete({ where: { id } }); } catch (e) {}
  revalidatePath('/superadmin');
}

/**
 * FIXED: Handles product deletion by Super Admin for specific shop details
 */
/**
 * FIXED: Handles product deletion by Super Admin.
 * Changed return type to satisfy the form action requirement (Promise<void>).
 */
export async function superAdminDeleteProduct(formData: FormData): Promise<void> {
  const id = formData.get('id') as string;
  const shopId = formData.get('shopId') as string;

  try {
    const product = await prisma.product.findUnique({
      where: { id },
      select: { image: true }
    });

    await prisma.product.delete({ where: { id } });

    if (product?.image) {
      // Assuming deleteFromSupabase is defined in your actions.ts
      await deleteFromSupabase(product.image);
    }

    revalidatePath(`/superadmin/shop/${shopId}`);
  } catch (error) {
    console.error("Super Admin Delete Failed:", error);
    // In server actions, you can throw errors to be caught by error boundaries
    // or simply return nothing to satisfy the void requirement.
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