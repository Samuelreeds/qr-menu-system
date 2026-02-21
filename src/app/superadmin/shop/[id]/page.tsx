import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Store, Trash2, ExternalLink } from 'lucide-react';
import { superAdminDeleteProduct, updateShopPlan } from '@/lib/actions';

export default async function SuperAdminShopDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Fetch the shop and all its products
  const shop = await prisma.shop.findUnique({
    where: { id },
    include: {
      products: { include: { category: true }, orderBy: { createdAt: 'desc' } },
      shopUsers: { include: { user: true } }
    }
  });

  if (!shop) notFound();

  const ownerEmail = shop.shopUsers[0]?.user?.email || 'No owner email attached';

  return (
    <div className="min-h-screen bg-[#F9FAFB] p-4 md:p-8 font-sans text-gray-800">
      <div className="max-w-5xl mx-auto mt-10 space-y-8">
        
        {/* --- HEADER --- */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/superadmin" className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition">
              <ArrowLeft size={20} className="text-gray-500" />
            </Link>
            <div>
              <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
                {shop.name}
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide ${shop.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {shop.status}
                </span>
              </h1>
              <p className="text-sm font-medium text-gray-500">{ownerEmail}</p>
            </div>
          </div>
          
          <a href={`/${shop.slug}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-xl text-sm font-bold text-gray-700 hover:text-blue-600 transition shadow-sm">
            <ExternalLink size={16} /> /{shop.slug}
          </a>
        </div>

        {/* --- SHOP DETAILS CARDS --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Current Plan</p>
            <form action={updateShopPlan} className="flex items-center gap-2">
               <input type="hidden" name="id" value={shop.id} />
               <select name="plan" defaultValue={shop.plan} className="bg-gray-50 border border-gray-200 text-sm font-bold text-gray-900 rounded-xl px-3 py-2 outline-none w-full">
                 <option value="FREE">FREE</option>
                 <option value="PRO">PRO</option>
                 <option value="PREMIUM">PREMIUM</option>
               </select>
               <button type="submit" className="bg-blue-600 text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-blue-700">Save</button>
            </form>
          </div>
          
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Total Menu Items</p>
            <p className="text-2xl font-black text-gray-900">{shop.products.length}</p>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Trial Status</p>
            <p className="text-lg font-bold text-gray-900">
              {shop.trialEndsAt && new Date() < shop.trialEndsAt ? (
                <span className="text-blue-600">Ends {shop.trialEndsAt.toLocaleDateString()}</span>
              ) : 'Expired / N/A'}
            </p>
          </div>
        </div>

        {/* --- INVENTORY MODERATION (DELETE) --- */}
        <section className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-50 flex items-center gap-2">
            <Store size={20} className="text-gray-400" />
            <h2 className="text-lg font-bold text-gray-900">Menu Moderation</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-50 text-xs font-bold text-gray-400 uppercase tracking-wider bg-gray-50/50">
                  <th className="p-5">Product Image</th>
                  <th className="p-5">Name</th>
                  <th className="p-5">Category</th>
                  <th className="p-5 text-right">Admin Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {shop.products.length === 0 && (
                  <tr><td colSpan={4} className="p-8 text-center text-gray-400 font-medium">No items in this menu yet.</td></tr>
                )}
                {shop.products.map(product => (
                  <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4">
                      <div className="w-12 h-12 rounded-xl bg-gray-100 overflow-hidden">
                        <img src={product.image} className="w-full h-full object-cover" alt="" />
                      </div>
                    </td>
                    <td className="p-4 font-bold text-gray-800">{product.name}</td>
                    <td className="p-4 text-sm text-gray-500">{product.category.name}</td>
                    <td className="p-4 text-right">
                      {/* DELETE BUTTON */}
                      <form action={superAdminDeleteProduct}>
                        <input type="hidden" name="id" value={product.id} />
                        <input type="hidden" name="shopId" value={shop.id} />
                        <button type="submit" className="inline-flex items-center gap-2 px-3 py-2 bg-red-50 text-red-600 hover:bg-red-500 hover:text-white rounded-xl text-xs font-bold transition shadow-sm">
                          <Trash2 size={14} /> Force Delete
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

      </div>
    </div>
  );
}