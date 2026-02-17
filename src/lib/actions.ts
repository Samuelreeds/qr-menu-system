'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { createClient } from '@supabase/supabase-js'
import sharp from 'sharp'

// --- SETUP ---
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

// --- READ ACTIONS ---
export async function getCategories() {
  return await prisma.category.findMany({ orderBy: { sortOrder: 'asc' } })
}

export async function getProducts() {
  return await prisma.product.findMany({
    include: { category: true },
    orderBy: { createdAt: 'desc' }
  })
}

export async function getShopSettings() {
  let settings = await prisma.shopSettings.findUnique({ where: { id: 'default' } });
  
  if (!settings) {
    // If DB is empty, return these temporary defaults so the UI doesn't crash
    return {
      id: "default", 
      name: "Gourmet Shop", 
      address: "", 
      phone: "", 
      themeColor: "#5CB85C",
      logo: null, 
      socials: "[]"
    };
  }
  return settings;
}

// --- HELPER 1: UPLOAD ---
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

// --- HELPER 2: DELETE OLD IMAGE ---
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
  const lastCategory = await prisma.category.findFirst({ orderBy: { sortOrder: 'desc' } });
  const nextOrder = (lastCategory?.sortOrder || 0) + 1;
  await prisma.category.create({ data: { name, sortOrder: nextOrder } });
  revalidatePath('/', 'layout');
}

export async function updateCategory(formData: FormData) {
  const id = formData.get('id') as string;
  const name = formData.get('name') as string;
  const sortOrder = parseInt(formData.get('sortOrder') as string);
  await prisma.category.update({ where: { id }, data: { name, sortOrder } });
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
  const price = parseFloat(formData.get('price') as string)
  const categoryId = formData.get('categoryId') as string
  const time = formData.get('time') as string || '15min'
  const imageFile = formData.get('image') as File
  
  let imagePath = await uploadToSupabase(imageFile, 'products');
  if (!imagePath) imagePath = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c';

  await prisma.product.create({
    data: { name, price, categoryId, image: imagePath, time, rating: 4.5, description: '' }
  })
  revalidatePath('/', 'layout');
}

export async function updateProduct(formData: FormData) {
  const id = formData.get('id') as string;
  const name = formData.get('name') as string;
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
    data: { name, price, categoryId, time, ...(newImagePath && { image: newImagePath }) }
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

// --- SETTINGS ACTIONS (FIXED: Using upsert instead of update) ---

export async function updateShopIdentity(formData: FormData) {
  const name = formData.get('name') as string;
  const address = formData.get('address') as string;
  const phone = formData.get('phone') as string;

  // Use upsert: Create if missing, Update if exists
  await prisma.shopSettings.upsert({
    where: { id: 'default' },
    update: { name, address, phone },
    create: { 
      id: 'default', 
      name, 
      address, 
      phone,
      themeColor: '#5CB85C' // Default if creating new
    }
  });
  revalidatePath('/', 'layout');
}

export async function updateShopBranding(formData: FormData) {
  const themeColor = formData.get('themeColor') as string || '#5cb85c';
  const logoFile = formData.get('logo') as File;
  
  const newLogoPath = await uploadToSupabase(logoFile, 'branding');

  const dataToUpdate: any = { themeColor };
  
  if (newLogoPath) {
    // Only try to delete old logo if record exists
    const currentSettings = await prisma.shopSettings.findUnique({ where: { id: 'default' }, select: { logo: true } });
    if (currentSettings?.logo) {
      await deleteFromSupabase(currentSettings.logo);
    }
    dataToUpdate.logo = newLogoPath;
  }

  await prisma.shopSettings.upsert({
    where: { id: 'default' },
    update: dataToUpdate,
    create: {
      id: 'default',
      name: 'Gourmet Shop', // Fallback name required for creation
      themeColor,
      logo: newLogoPath || null
    }
  });
  revalidatePath('/', 'layout');
}

export async function updateShopSocials(formData: FormData) {
  const socials = formData.get('socials') as string;
  
  await prisma.shopSettings.upsert({
    where: { id: 'default' },
    update: { socials },
    create: {
      id: 'default',
      name: 'Gourmet Shop', // Fallback name required for creation
      socials
    }
  });
  revalidatePath('/', 'layout');
}

export async function forceRevalidateAction() {
  revalidatePath('/', 'layout');
}