import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  const hashedPassword = await bcrypt.hash('admin1234', 10) 
  const admin = await prisma.user.upsert({
    where: { email: 'admin@gmail.com' },
    update: {},
    create: {
      email: 'admin@gmail.com',
      password: hashedPassword,
    },
  })

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

  await prisma.product.deleteMany({ where: { shopId: shop.id } })
  await prisma.category.deleteMany({ where: { shopId: shop.id } })

  const categoriesData = [
    { name: 'Salads', order: 1 },
    { name: 'Hot sale', order: 2 },
    { name: 'Popularity', order: 3 },
    { name: 'Burgers', order: 4 },
  ]

  const catMap: Record<string, string> = {}

  for (const c of categoriesData) {
    const created = await prisma.category.create({
      data: { 
        name: c.name, 
        sortOrder: c.order,
        shopId: shop.id 
      }
    })
    catMap[c.name] = created.id
  }

  const products = [
    { name: 'Avocado Salad', price: 12.00, rating: 4.5, time: '20min', image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=500&q=80', cat: 'Salads' },
    { name: 'Fruits Salad', price: 11.00, rating: 4.5, time: '15min', image: 'https://images.unsplash.com/photo-1519996529931-28324d1a6305?auto=format&fit=crop&w=500&q=80', cat: 'Salads' },
    { name: 'Greek Salad', price: 13.50, rating: 4.7, time: '25min', image: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=500&q=80', cat: 'Salads' },
    { name: 'Cheeseburger', price: 14.00, rating: 4.8, time: '20min', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=500&q=80', cat: 'Burgers' },
    { name: 'Chicken Burger', price: 12.50, rating: 4.6, time: '25min', image: 'https://images.unsplash.com/photo-1615297348774-61d090d5ce20?auto=format&fit=crop&w=500&q=80', cat: 'Burgers' },
    { name: 'Spicy Pasta', price: 16.00, rating: 4.9, time: '30min', image: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?auto=format&fit=crop&w=500&q=80', cat: 'Hot sale' },
    { name: 'Grilled Salmon', price: 22.00, rating: 4.8, time: '40min', image: 'https://images.unsplash.com/photo-1467003909585-2f8a7270028d?auto=format&fit=crop&w=500&q=80', cat: 'Hot sale' },
    { name: 'Margherita Pizza', price: 15.00, rating: 4.7, time: '25min', image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=500&q=80', cat: 'Popularity' },
    { name: 'Sushi Platter', price: 24.00, rating: 4.8, time: '35min', image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=500&q=80', cat: 'Popularity' },
  ]

  for (const p of products) {
    const categoryId = catMap[p.cat]
    if (!categoryId) continue

    await prisma.product.create({
      data: {
        name: p.name,
        price: p.price,
        rating: p.rating,
        time: p.time,
        image: p.image,
        // Removed shopId to avoid conflict with nested relationship creation
        category: {
          connect: { id: categoryId }
        },
        shop: {
          connect: { id: shop.id }
        }
      }
    })
  }
}

main()
  .catch((e) => { process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })