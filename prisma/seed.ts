import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('Start seeding...')

  // 1. Create Admin User
  const hashedPassword = await bcrypt.hash('admin1234', 10) 
  const admin = await prisma.user.upsert({
    where: { email: 'admin@gmail.com' },
    update: {},
    create: {
      email: 'admin@gmail.com',
      password: hashedPassword,
    },
  })

  // 2. Create the Default Shop and Settings
  // This is the "Parent" required by your schema
  const shop = await prisma.shop.upsert({
    where: { slug: 'default-shop' },
    update: {},
    create: {
      name: 'Gourmet Shop',
      slug: 'default-shop',
      settings: {
        create: {
          name: 'Gourmet Shop',
          themeColor: '#5CB85C',
          logo: 'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?auto=format&fit=crop&w=100&q=80',
        }
      }
    }
  })

  // 3. Clear existing data for this specific shop
  await prisma.product.deleteMany({ where: { shopId: shop.id } })
  await prisma.category.deleteMany({ where: { shopId: shop.id } })

  // 4. Create Categories with shopId
  const categoriesData = [
    { name: 'Rice', order: 1 },
    { name: 'Noodles', order: 2 },]

  const catMap: Record<string, string> = {}

  for (const c of categoriesData) {
    const created = await prisma.category.create({
      data: { 
        name: c.name, 
        sortOrder: c.order,
        shopId: shop.id // Required by schema
      }
    })
    catMap[c.name] = created.id
  }

  // 5. Create Products with shopId
  const products = [
    { name: 'Avocado Salad', price: 12.00, rating: 4.5, time: '20min', image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=500&q=80', cat: 'Salads' },
    { name: 'Cheeseburger', price: 14.00, rating: 4.8, time: '20min', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=500&q=80', cat: 'Burgers' },
    // ... add more as needed
  ]

  for (const p of products) {
    await prisma.product.create({
      data: {
        name: p.name,
        price: p.price,
        rating: p.rating,
        time: p.time,
        image: p.image,
        categoryId: catMap[p.cat],
        shopId: shop.id // Required by schema
      }
    })
  }
  
  console.log('Seeding Finished successfully.')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })