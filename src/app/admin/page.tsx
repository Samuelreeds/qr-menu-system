// src/app/admin/page.tsx
import { getCategories, getProducts, getShopSettings } from '@/lib/actions';
import AdminDashboard from '@/components/AdminDashboard';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';

export default async function AdminPage() {
  const session = await getServerSession();
  if (!session) redirect('/auth/login');

  const categories = await getCategories();
  const products = await getProducts();
  const settingsData = await getShopSettings();

  // FIX: Provide fallback settings if the database returns null
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

  // Assuming activeShop logic exists above or via session
  // For this example, we'll assume a shop is found
  const shopSlug = "my-shop"; 

  return (
    <AdminDashboard 
      categories={categories}
      products={products as any}
      settings={settings as any} // Cast as any if local types conflict slightly
      shopSlug={shopSlug}
    />
  );
}