'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import path from 'path'
import fs from 'fs/promises'
import sharp from 'sharp'

// --- READ ACTIONS ---

export async function getCategories() {
  return await prisma.category.findMany({
    orderBy: { sortOrder: 'asc' },
  })
}

export async function getProducts() {
  return await prisma.product.findMany({
    include: {
      category: true 
    },
    orderBy: {
      createdAt: 'desc'
    }
  })
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
      const filename = `${name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.webp`
      const uploadDir = path.join(process.cwd(), 'public', 'uploads')
      const filepath = path.join(uploadDir, filename)

      await fs.mkdir(uploadDir, { recursive: true })

      await sharp(buffer)
        .resize(600, 600, { fit: 'cover', position: 'center' })
        .toFormat('webp', { quality: 80 })
        .toFile(filepath)

      imagePath = `/uploads/${filename}`
    } catch (error) {
      console.error("Image upload failed:", error)
    }
  }

  await prisma.product.create({
    data: {
      name,
      price,
      categoryId,
      image: imagePath,
      time,
      rating: 4.5,
      description: ''
    }
  })

  revalidatePath('/')
  revalidatePath('/admin')
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
      // 1. Delete old image from storage
      const oldProduct = await prisma.product.findUnique({ where: { id }, select: { image: true } });
      if (oldProduct?.image && !oldProduct.image.startsWith('http')) {
        const oldFilePath = path.join(process.cwd(), 'public', oldProduct.image);
        try { await fs.unlink(oldFilePath); } catch (e) { console.log("Old file not found for deletion"); }
      }

      // 2. Process new image
      const buffer = Buffer.from(await imageFile.arrayBuffer());
      const filename = `${name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.webp`;
      const uploadDir = path.join(process.cwd(), 'public', 'uploads');
      const filepath = path.join(uploadDir, filename);
      await fs.mkdir(uploadDir, { recursive: true });

      await sharp(buffer)
        .resize(600, 600, { fit: 'cover', position: 'center' })
        .toFormat('webp', { quality: 80 })
        .toFile(filepath);

      imagePath = `/uploads/${filename}`;
    } catch (error) {
      console.error("Update image failed:", error);
    }
  }

  await prisma.product.update({
    where: { id },
    data: {
      name,
      price,
      categoryId,
      time,
      ...(imagePath && { image: imagePath })
    }
  });

  revalidatePath('/');
  revalidatePath('/admin');
}

export async function deleteProduct(formData: FormData) {
  const id = formData.get('id') as string;

  try {
    const product = await prisma.product.findUnique({
      where: { id },
      select: { image: true }
    });

    if (product && product.image && !product.image.startsWith('http')) {
      const filePath = path.join(process.cwd(), 'public', product.image);
      try {
        await fs.access(filePath);
        await fs.unlink(filePath);
      } catch (err) {
        console.error("File deletion failed:", err);
      }
    }

    await prisma.product.delete({ where: { id } });

  } catch (error) {
    console.error("Failed to delete product:", error);
  }

  revalidatePath('/')
  revalidatePath('/admin')
}

// --- SHOP SETTINGS ACTIONS ---

export async function getShopSettings() {
  let settings = await prisma.shopSettings.findUnique({
    where: { id: 'default' }
  });

  if (!settings) {
    settings = await prisma.shopSettings.create({
      data: {
        id: 'default',
        name: 'Gourmet Shop',
        themeColor: '#5CB85C'
      }
    });
  }
  return settings;
}

export async function updateShopSettings(formData: FormData) {
  const name = (formData.get('name') as string) || 'Gourmet Shop';
  const address = formData.get('address') as string || '';
  const phone = formData.get('phone') as string || '';
  const themeColor = formData.get('themeColor') as string || '#5cb85c';
  
  const facebook = formData.get('facebook') as string || '';
  const showFacebook = formData.get('showFacebook') === 'on'; 
  const instagram = formData.get('instagram') as string || '';
  const showInstagram = formData.get('showInstagram') === 'on';
  const telegram = formData.get('telegram') as string || '';
  const showTelegram = formData.get('showTelegram') === 'on';

  const logoFile = formData.get('logo') as File
  let logoPath: string | null = null

  if (logoFile && logoFile.size > 0 && logoFile.name !== 'undefined') {
    try {
      const currentSettings = await prisma.shopSettings.findUnique({ where: { id: 'default' } });
      if (currentSettings?.logo) {
        const oldLogoPath = path.join(process.cwd(), 'public', currentSettings.logo);
        try { await fs.unlink(oldLogoPath); } catch (e) { console.log("Old logo not found"); }
      }

      const buffer = Buffer.from(await logoFile.arrayBuffer())
      const filename = `logo-${Date.now()}.webp`
      const uploadDir = path.join(process.cwd(), 'public', 'uploads')
      const filepath = path.join(uploadDir, filename)

      await fs.mkdir(uploadDir, { recursive: true })

      await sharp(buffer)
        .resize(300, 300, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
        .toFormat('webp')
        .toFile(filepath)

      logoPath = `/uploads/${filename}`
    } catch (error) {
      console.error("Logo upload failed:", error)
    }
  }

  await prisma.shopSettings.upsert({
    where: { id: 'default' },
    update: {
      name,
      address,
      phone,
      themeColor,
      facebook,
      showFacebook,
      instagram,
      showInstagram,
      telegram,
      showTelegram,
      ...(logoPath && { logo: logoPath }),
    },
    create: {
      id: 'default',
      name,
      address,
      phone,
      themeColor,
      facebook,
      showFacebook,
      instagram,
      showInstagram,
      telegram,
      showTelegram,
      logo: logoPath || null,
    }
  });

  revalidatePath('/');
  revalidatePath('/admin');
}

export async function forceRevalidateAction() {
  revalidatePath('/');
  revalidatePath('/admin');
}