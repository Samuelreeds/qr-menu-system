import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Store, Trash2, ExternalLink, Power, PowerOff, RefreshCw } from 'lucide-react';
import { superAdminDeleteProduct, updateShopPlan, toggleShopStatus, softDeleteShop, restoreShop, updateShopLimits } from '@/lib/actions';
import { PLAN_LIMITS, PlanKey } from '@/lib/shop-guard';

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
  
  const rawPlan = shop.plan as string | undefined;
  const currentPlan = rawPlan && rawPlan in PLAN_LIMITS ? (rawPlan as keyof typeof PLAN_LIMITS) : 'FREE';
  const defaults = PLAN_LIMITS[currentPlan];

  return (
    <div className="min-h-screen bg-[#F9FAFB] p-4 md:p-8 font-sans text-gray-800">
      <div className="max-w-5xl mx-auto mt-10 space-y-8">
        
        {/* --- HEADER --- */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/superadmin" className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition">
              <ArrowLeft size={20} className="text-gray-500" />
            </Link>
            <div>
              <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
                <span className={shop.deletedAt ? 'line-through text-gray-400' : ''}>{shop.name}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide ${shop.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {shop.status}
                </span>
                {shop.deletedAt && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide bg-gray-200 text-gray-600">
                    DELETED
                  </span>
                )}
              </h1>
              <p className="text-sm font-medium text-gray-500">{ownerEmail}</p>
            </div>
          </div>
          
          <a href={`/${shop.id}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-xl text-sm font-bold text-gray-700 hover:text-blue-600 transition shadow-sm">
            <ExternalLink size={16} /> <span className="truncate max-w-[120px]">/{shop.id}</span>
          </a>
        </div>

        {/* --- SHOP DETAILS CARDS --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-center">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Current Plan</p>
            <form action={async (fd: FormData) => {
              'use server';
              await updateShopPlan(fd);
            }} className="flex items-center gap-2 mt-1">
               <input type="hidden" name="id" value={shop.id} />
               <select name="plan" defaultValue={shop.plan} className="bg-gray-50 border border-gray-200 text-sm font-bold text-gray-900 rounded-xl px-3 py-2 outline-none w-full cursor-pointer">
                 <option value="FREE">FREE</option>
                 <option value="PRO">PRO</option>
                 <option value="PREMIUM">PREMIUM</option>
               </select>
               <button type="submit" className="bg-blue-600 text-white text-xs font-bold px-3 py-2.5 rounded-xl hover:bg-blue-700 transition">Save</button>
            </form>
          </div>
          
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-center">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Trial Status</p>
            <p className="text-lg font-bold text-gray-900">
              {shop.trialEndsAt && new Date() < shop.trialEndsAt ? (
                <span className="text-blue-600">Ends {shop.trialEndsAt.toLocaleDateString()}</span>
              ) : 'Expired / N/A'}
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-between">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Access Control</p>
            <form action={async (fd: FormData) => {
              'use server';
              await toggleShopStatus(fd);
            }}>
              <input type="hidden" name="id" value={shop.id} />
              <input type="hidden" name="currentStatus" value={shop.status === 'ACTIVE' ? 'true' : 'false'} />
              <button type="submit" className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${shop.status === 'ACTIVE' ? 'bg-amber-50 text-amber-600 hover:bg-amber-100' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}>
                {shop.status === 'ACTIVE' ? <><PowerOff size={16} /> Lock Shop</> : <><Power size={16} /> Unlock Shop</>}
              </button>
            </form>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-between">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Danger Zone</p>
            {shop.deletedAt ? (
              <form action={async (fd: FormData) => {
                'use server';
                await restoreShop(fd);
              }}>
                <input type="hidden" name="id" value={shop.id} />
                <button type="submit" className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white rounded-xl text-sm font-bold transition-all shadow-sm">
                  <RefreshCw size={16} /> Restore
                </button>
              </form>
            ) : (
              <form action={async (fd: FormData) => {
                'use server';
                await softDeleteShop(fd);
              }}>
                <input type="hidden" name="id" value={shop.id} />
                <button type="submit" className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-50 text-red-600 hover:bg-red-500 hover:text-white rounded-xl text-sm font-bold transition-all shadow-sm">
                  <Trash2 size={16} /> Soft Delete
                </button>
              </form>
            )}
          </div>
        </div>

        {/* --- PER-SHOP OVERRIDES --- */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Plan Limit Overrides</p>
              <p className="text-[10px] text-gray-500 mt-0.5">Leave blank to use default plan limits</p>
            </div>
            <span className="text-[10px] font-bold bg-gray-100 text-gray-600 px-3 py-1 rounded-full uppercase tracking-wider">
              {currentPlan} Defaults
            </span>
          </div>
          
          <form action={async (fd: FormData) => {
            'use server';
            await updateShopLimits(fd);
          }} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <input type="hidden" name="id" value={shop.id} />

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">Max Products (Def: {defaults.maxProducts})</label>
              <input type="number" name="overrideMaxProducts" defaultValue={shop.overrideMaxProducts ?? ''} placeholder={`Default: ${defaults.maxProducts}`} className="w-full bg-gray-50 border border-gray-200 text-sm font-bold text-gray-900 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-gray-900 transition-all" />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">Max Categories (Def: {defaults.maxCategories})</label>
              <input type="number" name="overrideMaxCategories" defaultValue={shop.overrideMaxCategories ?? ''} placeholder={`Default: ${defaults.maxCategories}`} className="w-full bg-gray-50 border border-gray-200 text-sm font-bold text-gray-900 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-gray-900 transition-all" />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">Max Banners (Def: {defaults.maxBanners})</label>
              <input type="number" name="overrideMaxBanners" defaultValue={shop.overrideMaxBanners ?? ''} placeholder={`Default: ${defaults.maxBanners}`} className="w-full bg-gray-50 border border-gray-200 text-sm font-bold text-gray-900 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-gray-900 transition-all" />
            </div>

            <div className="col-span-1 sm:col-span-3 flex justify-end mt-2">
              <button type="submit" className="bg-gray-900 text-white text-xs font-bold px-5 py-2.5 rounded-xl hover:bg-gray-800 transition-colors shadow-sm">
                Save Overrides
              </button>
            </div>
          </form>
        </div>

        {/* --- INVENTORY MODERATION (DELETE) --- */}
        <section className={`bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden ${shop.deletedAt ? 'opacity-50 pointer-events-none' : ''}`}>
          <div className="p-6 border-b border-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Store size={20} className="text-gray-400" />
              <h2 className="text-lg font-bold text-gray-900">Menu Moderation</h2>
            </div>
            <span className="bg-gray-100 text-gray-600 text-xs font-bold px-3 py-1 rounded-full">{shop.products.length} Items</span>
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
                      <form action={async (fd: FormData) => {
                        'use server';
                        await superAdminDeleteProduct(fd);
                      }}>
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