import AdminDashboard from '@/components/AdminDashboard';
import { getCategories, getProducts, getShopSettings } from '@/lib/actions';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';

export default async function AdminPage() {
  // 1. Get the current logged-in session
  const session = await getServerSession();
  if (!session?.user?.email) redirect('/login');

  // 2. Find the user and their exact shop
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { shopUsers: { include: { shop: true } } }
  });

  if (!user || user.shopUsers.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-red-500 font-bold">
        Error: No shop assigned to this account.
      </div>
    );
  }

  const activeShop = user.shopUsers[0].shop;

  // 3. Fetch data ONLY for this specific shop (secured by actions.ts)
  const categories = await getCategories();
  const products = await getProducts();
  const settings = await getShopSettings();

  return (
    <AdminDashboard 
      categories={categories} 
      products={products} 
      settings={settings} 
      shopSlug={activeShop.slug} 
    />
  );
}