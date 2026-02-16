'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { createClient } from '@supabase/supabase-js'

// --- SUPABASE SETUP ---
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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
  // Default fallback image
  let imagePath = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c' 

  // SUPABASE UPLOAD LOGIC
  if (imageFile && imageFile.size > 0 && imageFile.name !== 'undefined') {
    try {
      const fileName = `products/${Date.now()}-${imageFile.name.replaceAll(" ", "_")}`;
      
      const { data, error } = await supabase.storage
        .from('uploads') // Ensure your bucket is named 'uploads'
        .upload(fileName, imageFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Supabase upload error:', error);
      } else {
        // Construct Public URL
        imagePath = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/uploads/${fileName}`;
      }
    } catch (error) {
      console.error("Image processing failed:", error)
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

  // SUPABASE UPLOAD LOGIC (For Updates)
  if (imageFile && imageFile.size > 0 && imageFile.name !== 'undefined') {
    try {
      const fileName = `products/${Date.now()}-${imageFile.name.replaceAll(" ", "_")}`;
      
      const { data, error } = await supabase.storage
        .from('uploads')
        .upload(fileName, imageFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (!error) {
         imagePath = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/uploads/${fileName}`;
      }
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
      ...(imagePath && { image: imagePath }) // Only update if new image exists
    }
  });

  revalidatePath('/');
  revalidatePath('/admin');
}

export async function deleteProduct(formData: FormData) {
  const id = formData.get('id') as string;

  try {
    // Note: We don't strictly need to delete the image from Supabase 
    // to keep the app fast, but you can add that logic here if you want cleanup.
    await prisma.product.delete({ where: { id } });
  } catch (error) {
    console.error("Failed to delete product:", error);
  }

  revalidatePath('/')
  revalidatePath('/admin')
}

// --- SHOP SETTINGS ACTIONS (FIXED) ---

export async function getShopSettings() {
  // 1. Try to find the specific "default" row
  let settings = await prisma.shopSettings.findUnique({
    where: { id: 'default' }
  });

  // 2. Fallback: If "default" doesn't exist, try to find ANY row (e.g. from seed)
  if (!settings) {
    settings = await prisma.shopSettings.findFirst();
  }

  // 3. Fallback: Create default in memory if DB is empty
  if (!settings) {
    return {
      id: "default",
      name: "Gourmet Shop",
      address: "",
      phone: "",
      themeColor: "#5CB85C",
      logo: null,
      facebook: null,
      showFacebook: false,
      instagram: null,
      showInstagram: false,
      telegram: null,
      showTelegram: false
    };
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

  // SUPABASE UPLOAD LOGIC (For Logo)
  if (logoFile && logoFile.size > 0 && logoFile.name !== 'undefined') {
    try {
      const fileName = `branding/logo-${Date.now()}.webp`;
      
      const { data, error } = await supabase.storage
        .from('uploads')
        .upload(fileName, logoFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (!error) {
        logoPath = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/uploads/${fileName}`;
      }
    } catch (error) {
      console.error("Logo upload failed:", error)
    }
  }

  // === CRITICAL FIX: DELETE GHOST ROWS ===
  // This ensures we don't have multiple settings rows confusing the app
  const allSettings = await prisma.shopSettings.findMany();
  if (allSettings.length > 1) {
    await prisma.shopSettings.deleteMany({
      where: {
        id: { not: 'default' }
      }
    });
  }

  // Upsert specifically to ID 'default'
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
      id: 'default', // FORCE ID
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