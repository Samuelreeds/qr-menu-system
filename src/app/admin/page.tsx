import { getCategories, getProducts, getShopSettings } from '@/lib/actions';
import AdminDashboard from '@/components/AdminDashboard';

export const revalidate = 0;

export default async function AdminPage() {
  const categories = await getCategories();
  const products = await getProducts();
  const settings = await getShopSettings(); // Fetch Settings

  return (
    <AdminDashboard 
      categories={categories} 
      // @ts-ignore
      products={products}
      // @ts-ignore
      settings={settings}
    />
  );
}