import { getCategories, getProducts, getShopSettings } from '@/lib/actions';
import MenuClient from '@/components/MenuClient';

export const revalidate = 60; 

export default async function Home() {
  const categories = await getCategories();
  const rawProducts = await getProducts(); // 1. Fetch raw data
  const settings = await getShopSettings();

  // 2. Transform the data to fix the "null" errors
  const products = rawProducts.map((product) => ({
    ...product,
    time: product.time ?? "15 min",        // Fix: If time is null, use "15 min"
    description: product.description ?? "" // Fix: If description is null, use empty string
  }));

  return (
    <MenuClient 
      categories={categories} 
      initialProducts={products} // 3. Pass the sanitized list here
      // @ts-ignore
      shopSettings={settings} 
    />
  );
}