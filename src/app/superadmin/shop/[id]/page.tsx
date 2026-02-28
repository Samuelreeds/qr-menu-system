import { prisma } from '@/lib/prisma';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Store, Trash2, ExternalLink, Power, PowerOff, RefreshCw, Upload, Download } from 'lucide-react';
import { superAdminDeleteProduct, updateShopPlan, toggleShopStatus, softDeleteShop, restoreShop, updateShopLimits, importMenuData, executeMenuImport } from '@/lib/actions';
import { PLAN_LIMITS, PlanKey } from '@/lib/shop-guard';

export default async function SuperAdminShopDetail(props: { 
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const { id } = await props.params;
  const searchParams = await props.searchParams;
  const msg = searchParams?.msg;

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

  // CSV Template Data
  const csvTemplate = "data:text/csv;charset=utf-8," + encodeURIComponent(
    "Category Name,Product Name,Khmer Name,Chinese Name,Price,Discount,Preparation Time,Image URL,Popular,Description\n" +
    "Hot Drinks,Latte,ឡាតេ,拿铁,3.50,0,5min,https://images.unsplash.com/photo-1546069901-ba9599a7e63c,TRUE,Delicious espresso with steamed milk"
  );

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

        {/* --- MENU IMPORT MODULE --- */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-2">
              <Upload size={20} className="text-blue-500" />
              <h2 className="text-lg font-bold text-gray-900">Import Menu</h2>
            </div>
            <a 
              href={csvTemplate} 
              download="menu_import_template.csv"
              className="inline-flex items-center gap-2 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-xl transition shadow-sm border border-blue-100"
            >
              <Download size={14} /> Download CSV Template
            </a>
          </div>
          <p className="text-sm text-gray-500 mb-2">
            Import categories and products into this shop using the standard template format.
          </p>
          <p className="text-xs font-bold text-amber-600 bg-amber-50 px-3 py-2 rounded-lg inline-block mb-6">
            ⚠️ This import only affects this shop
          </p>

          {msg === 'import_done' && searchParams?.result && (() => {
             try {
               const summary = JSON.parse(decodeURIComponent(searchParams.result as string));
               return (
                 <div className="mb-6 border border-green-200 rounded-xl overflow-hidden shadow-sm">
                   <div className="bg-green-50 px-5 py-3 border-b border-green-200">
                     <h3 className="text-sm font-bold text-green-800">Import Completed Successfully</h3>
                   </div>
                   <div className="p-5 space-y-4 bg-white">
                      <div className="flex flex-wrap items-center gap-3 text-sm font-medium">
                        <div className="px-3 py-2 bg-green-50 text-green-700 rounded-xl border border-green-100">Imported: {summary.imported}</div>
                        <div className="px-3 py-2 bg-amber-50 text-amber-700 rounded-xl border border-amber-100">Skipped: {summary.skipped}</div>
                        <div className="px-3 py-2 bg-red-50 text-red-700 rounded-xl border border-red-100">Failed: {summary.failed}</div>
                      </div>
                      
                      {summary.skipReasons && summary.skipReasons.length > 0 && (
                        <div>
                          <h4 className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-2">Skipped (Duplicates)</h4>
                          <ul className="text-xs text-amber-600 space-y-1 list-disc list-inside bg-amber-50/50 p-3 rounded-xl border border-amber-100">
                            {summary.skipReasons.map((r: string, i: number) => <li key={i}>{r}</li>)}
                          </ul>
                        </div>
                      )}

                      {summary.failReasons && summary.failReasons.length > 0 && (
                        <div>
                          <h4 className="text-xs font-bold text-red-600 uppercase tracking-wider mb-2">Failed (Invalid Data)</h4>
                          <ul className="text-xs text-red-600 space-y-1 list-disc list-inside bg-red-50/50 p-3 rounded-xl border border-red-100">
                            {summary.failReasons.map((r: string, i: number) => <li key={i}>{r}</li>)}
                          </ul>
                        </div>
                      )}
                      
                      <div className="pt-2">
                        <Link href={`/superadmin/shop/${shop.id}`} className="inline-block px-5 py-2.5 bg-gray-100 text-gray-700 text-xs font-bold rounded-xl hover:bg-gray-200 transition">Done</Link>
                      </div>
                   </div>
                 </div>
               );
             } catch(e) {
               return <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 text-sm font-bold rounded-xl">Import completed successfully!</div>;
             }
          })()}

          {msg === 'import_done' && !searchParams?.result && (
             <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 text-sm font-bold rounded-xl">Import completed successfully!</div>
          )}
          
          {msg === 'import_error' && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 text-sm font-bold rounded-xl">
              Error: {searchParams?.err || "Please provide a valid Excel or CSV file."}
            </div>
          )}

          {searchParams?.preview ? (
            <div className="mt-4 border border-gray-200 rounded-xl overflow-hidden shadow-sm">
               <div className="bg-gray-50 px-5 py-3 border-b border-gray-200">
                 <h3 className="text-sm font-bold text-gray-800">Preview Import Summary</h3>
               </div>
               <div className="p-5 space-y-5">
                  {(() => {
                     try {
                        const summary = JSON.parse(decodeURIComponent(searchParams.preview as string));
                        return (
                          <>
                            <div className="flex flex-wrap items-center gap-3 text-sm font-medium">
                              <div className="px-3 py-2 bg-gray-100 text-gray-700 rounded-xl border border-gray-200">Total Rows: {summary.total}</div>
                              <div className="px-3 py-2 bg-green-50 text-green-700 rounded-xl border border-green-100">Valid Rows: {summary.valid}</div>
                              <div className="px-3 py-2 bg-red-50 text-red-700 rounded-xl border border-red-100">Invalid Rows: {summary.invalid}</div>
                            </div>

                            {summary.missing && summary.missing.length > 0 && (
                              <div>
                                <h4 className="text-xs font-bold text-red-600 uppercase tracking-wider mb-2">Missing Required Fields</h4>
                                <ul className="text-xs text-red-600 space-y-1 list-disc list-inside bg-red-50/50 p-4 rounded-xl border border-red-100">
                                  {summary.missing.map((m: string, i: number) => <li key={i}>{m}</li>)}
                                </ul>
                              </div>
                            )}

                            {summary.duplicates && summary.duplicates.length > 0 && (
                              <div>
                                <h4 className={`text-xs font-bold uppercase tracking-wider mb-2 ${summary.importMode === 'skip' ? 'text-amber-600' : 'text-blue-600'}`}>
                                  {summary.importMode === 'skip' ? 'Duplicate Warnings (Will be skipped)' : 'Duplicate Warnings (Will be created)'}
                                </h4>
                                <ul className={`text-xs space-y-1 list-disc list-inside p-4 rounded-xl border ${summary.importMode === 'skip' ? 'text-amber-600 bg-amber-50/50 border-amber-100' : 'text-blue-600 bg-blue-50/50 border-blue-100'}`}>
                                  {summary.duplicates.map((d: string, i: number) => <li key={i}>{d}</li>)}
                                </ul>
                              </div>
                            )}

                            <div className="flex gap-3 pt-4 border-t border-gray-100">
                               <Link href={`/superadmin/shop/${shop.id}`} className="px-5 py-2.5 bg-gray-100 text-gray-700 text-xs font-bold rounded-xl hover:bg-gray-200 transition">Cancel</Link>
                               
                               <form action={async (fd: FormData) => {
                                  'use server';
                                  const res = await executeMenuImport(fd);
                                  if (res.success && res.summary) {
                                    const resultStr = encodeURIComponent(JSON.stringify(res.summary));
                                    redirect(`/superadmin/shop/${shop.id}?msg=import_done&result=${resultStr}`);
                                  } else if (res.success) {
                                    redirect(`/superadmin/shop/${shop.id}?msg=import_done`);
                                  } else {
                                    redirect(`/superadmin/shop/${shop.id}?msg=import_error&err=${encodeURIComponent(res.error || '')}`);
                                  }
                               }}>
                                  <input type="hidden" name="shopId" value={shop.id} />
                                  <input type="hidden" name="importMode" value={summary.importMode || 'skip'} />
                                  <button type="submit" className="px-5 py-2.5 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition">
                                     Confirm Import
                                  </button>
                               </form>
                            </div>
                          </>
                        );
                     } catch(e) {
                        return <p className="text-sm font-bold text-red-500">Failed to load preview. Please try again.</p>;
                     }
                  })()}
               </div>
            </div>
          ) : (
            msg !== 'import_done' && (
              <form action={async (fd: FormData) => {
                'use server';
                const res = await importMenuData(fd);
                if (res.success && res.previewSummary) {
                  const summaryStr = encodeURIComponent(JSON.stringify(res.previewSummary));
                  redirect(`/superadmin/shop/${shop.id}?preview=${summaryStr}`);
                } else {
                  redirect(`/superadmin/shop/${shop.id}?msg=import_error&err=${encodeURIComponent(res.error || '')}`);
                }
              }} className="flex flex-col gap-4">
                <input type="hidden" name="shopId" value={shop.id} />
                
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="flex-1 w-full relative">
                    <input 
                      type="file" 
                      name="excelFile" 
                      accept=".xlsx, .xls, .csv" 
                      required
                      className="w-full text-sm text-gray-500
                      file:mr-4 file:py-2.5 file:px-4
                      file:rounded-xl file:border-0
                      file:text-sm file:font-bold
                      file:bg-blue-50 file:text-blue-700
                      hover:file:bg-blue-100 cursor-pointer"
                    />
                  </div>
                  <button 
                    type="submit" 
                    className="w-full sm:w-auto px-8 py-2.5 bg-gray-900 text-white text-sm font-bold rounded-xl hover:bg-gray-800 transition shadow-sm whitespace-nowrap"
                  >
                    Upload & Preview
                  </button>
                </div>

                <div className="flex items-center gap-3 bg-gray-50 px-4 py-3 rounded-xl border border-gray-200 w-fit">
                  <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">Strategy:</span>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
                    <input type="radio" name="importMode" value="skip" defaultChecked className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500" />
                    Skip Duplicates
                  </label>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer ml-2">
                    <input type="radio" name="importMode" value="create_only" className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500" />
                    Create Only
                  </label>
                </div>
              </form>
            )
          )}

          {!searchParams?.preview && msg !== 'import_done' && (
            <div className="mt-8 pt-6 border-t border-gray-50">
               <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">Template Format & Required Columns:</p>
               <div className="flex flex-wrap gap-2">
                 <span className="text-xs text-gray-800 font-bold bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200">Category Name *</span>
                 <span className="text-xs text-gray-800 font-bold bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200">Product Name *</span>
                 <span className="text-xs text-gray-800 font-bold bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200">Price *</span>
                 
                 <span className="text-xs text-gray-500 font-medium bg-white px-3 py-1.5 rounded-lg border border-gray-200 border-dashed">Preparation Time</span>
                 <span className="text-xs text-gray-500 font-medium bg-white px-3 py-1.5 rounded-lg border border-gray-200 border-dashed">Khmer Name</span>
                 <span className="text-xs text-gray-500 font-medium bg-white px-3 py-1.5 rounded-lg border border-gray-200 border-dashed">Chinese Name</span>
                 <span className="text-xs text-gray-500 font-medium bg-white px-3 py-1.5 rounded-lg border border-gray-200 border-dashed">Discount</span>
                 <span className="text-xs text-gray-500 font-medium bg-white px-3 py-1.5 rounded-lg border border-gray-200 border-dashed">Image URL</span>
                 <span className="text-xs text-gray-500 font-medium bg-white px-3 py-1.5 rounded-lg border border-gray-200 border-dashed">Popular</span>
                 <span className="text-xs text-gray-500 font-medium bg-white px-3 py-1.5 rounded-lg border border-gray-200 border-dashed">Description</span>
               </div>
            </div>
          )}
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