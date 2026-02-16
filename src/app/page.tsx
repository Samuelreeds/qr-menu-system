import { getCategories, getProducts, getShopSettings } from '@/lib/actions';
import MenuClient from '@/components/MenuClient';

export const revalidate = 60; 

export default async function Home() {
  const categories = await getCategories();
  const products = await getProducts();
  const settings = await getShopSettings();

  return (
    <MenuClient 
      categories={categories} 
      initialProducts={products}
      // @ts-ignore
      shopSettings={settings} 
    />
  );
}