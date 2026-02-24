import { getCategories, getProducts, getShopSettings, getBanners } from '@/lib/actions';
import AdminDashboard from '@/components/AdminDashboard';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

export default async function AdminPage() {
  const session = await getServerSession();
  if (!session?.user?.email) redirect('/auth/login');

  const categories = await getCategories();
  const products = await getProducts();
  const settingsData = await getShopSettings();
  const banners = await getBanners(); // Fetch banners from DB

  const settings = settingsData || {
    id: "default",
    name: "My Shop",
    address: "",
    phone: "",
    themeColor: "#5CB85C",
    logo: null,
    socials: "[]",
    facebook: "",
    showFacebook: false,
    instagram: "",
    showInstagram: false,
    telegram: "",
    showTelegram: false,
    shopId: "",
  };

  // Dynamically fetch the actual shop slug from the database for the active user
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      shopUsers: {
        include: {
          shop: true
        }
      }
    }
  });

  const activeShop = user?.shopUsers[0]?.shop;
  
  // Use the actual ID from the Shop record as the slug for the URL
  const shopSlug = activeShop?.id || "";

  return (
    <AdminDashboard 
      categories={categories}
      products={products as any}
      settings={settings as any}
      shopSlug={shopSlug}
      banners={banners as any}
    />
  );
}