'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import path from 'path'
import fs from 'fs/promises'
import sharp from 'sharp'

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
    return {
      id: "default", name: "Gourmet Shop", address: "", phone: "", themeColor: "#5CB85C",
      logo: null, facebook: null, showFacebook: false, instagram: null, showInstagram: false, telegram: null, showTelegram: false
    };
  }
  return settings;
}

// --- WRITE ACTIONS (PRODUCTS) ---

export async function createProduct(formData: FormData) {
  const name = formData.get('name') as string
  const price = parseFloat(formData.get('price') as string)
  const categoryId = formData.get('categoryId') as string
  const time = formData.get('time') as string || '15min'
  
  const imageFile = formData.get('image') as File
  let imagePath = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c' 

  if (imageFile && imageFile.size > 0 && imageFile.name !== 'undefined') {
    try {
      const buffer = Buffer.from(await imageFile.arrayBuffer())
      const filename = `products/${Date.now()}-${name.replace(/\s+/g, '-').toLowerCase()}.webp`
      const uploadDir = path.join(process.cwd(), 'public', 'uploads')
      const filepath = path.join(uploadDir, filename.replace('products/', ''))

      await fs.mkdir(uploadDir, { recursive: true })
      await sharp(buffer).resize(600, 600, { fit: 'cover' }).toFormat('webp').toFile(filepath)
      imagePath = `/uploads/${filename.replace('products/', '')}`
    } catch (error) { console.error("Image upload failed:", error) }
  }

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
  let imagePath = undefined;

  if (imageFile && imageFile.size > 0 && imageFile.name !== 'undefined') {
    try {
      const buffer = Buffer.from(await imageFile.arrayBuffer())
      const filename = `products/${Date.now()}-${name.replace(/\s+/g, '-').toLowerCase()}.webp`
      const uploadDir = path.join(process.cwd(), 'public', 'uploads')
      const filepath = path.join(uploadDir, filename.replace('products/', ''))

      await fs.mkdir(uploadDir, { recursive: true })
      await sharp(buffer).resize(600, 600, { fit: 'cover' }).toFormat('webp').toFile(filepath)
      imagePath = `/uploads/${filename.replace('products/', '')}`
    } catch (error) { console.error("Update image failed:", error) }
  }

  await prisma.product.update({
    where: { id },
    data: { name, price, categoryId, time, ...(imagePath && { image: imagePath }) }
  });
  revalidatePath('/', 'layout');
}

export async function deleteProduct(formData: FormData) {
  const id = formData.get('id') as string;
  try { await prisma.product.delete({ where: { id } }); } catch (e) {}
  revalidatePath('/', 'layout');
}

// --- SETTINGS ACTIONS (FIXED FOR LOCAL UPLOAD) ---

export async function updateShopIdentity(formData: FormData) {
  const name = formData.get('name') as string;
  const address = formData.get('address') as string;
  const phone = formData.get('phone') as string;

  await prisma.shopSettings.update({
    where: { id: 'default' },
    data: { name, address, phone }
  });
  revalidatePath('/', 'layout');
}

export async function updateShopBranding(formData: FormData) {
  const themeColor = formData.get('themeColor') as string || '#5cb85c';
  const logoFile = formData.get('logo') as File;
  
  let newLogoPath = undefined;

  if (logoFile && logoFile.size > 0 && logoFile.name !== 'undefined') {
    try {
      const buffer = Buffer.from(await logoFile.arrayBuffer())
      // Unique filename
      const filename = `logo-${Date.now()}.webp`
      const uploadDir = path.join(process.cwd(), 'public', 'uploads')
      const filepath = path.join(uploadDir, filename)

      await fs.mkdir(uploadDir, { recursive: true })
      await sharp(buffer)
        .resize(300, 300, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .toFormat('webp')
        .toFile(filepath)

      newLogoPath = `/uploads/${filename}`
    } catch (error) {
      console.error("Logo upload failed:", error);
    }
  }

  const dataToUpdate: any = { themeColor };
  if (newLogoPath) {
    dataToUpdate.logo = newLogoPath;
  }

  await prisma.shopSettings.update({
    where: { id: 'default' },
    data: dataToUpdate,
  });
  revalidatePath('/', 'layout');
}

// 3. SOCIALS ACTION: Updates Unlimited Links
export async function updateShopSocials(formData: FormData) {
  // We receive a JSON string containing all links
  const socials = formData.get('socials') as string;

  await prisma.shopSettings.update({
    where: { id: 'default' },
    data: { 
      socials // Saves the entire list as a string
    }
  });

  revalidatePath('/', 'layout');
}


export async function forceRevalidateAction() {
  revalidatePath('/', 'layout');
}