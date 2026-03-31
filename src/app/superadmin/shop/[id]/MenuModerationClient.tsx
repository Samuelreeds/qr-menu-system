'use client';

import { useState, useMemo, startTransition, useRef, useEffect } from 'react';
import { Store, Trash2, Loader2 } from 'lucide-react';
import { superAdminDeleteProduct, listShopProductsForModeration } from '@/lib/actions';

const LazyImage = ({ src, alt, className, ...props }: React.ImgHTMLAttributes<HTMLImageElement>) => {
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  
  useEffect(() => {
    if (imgRef.current?.complete) setLoaded(true);
  }, [src]);
  
  return (
    <>
      {!loaded && <div className="absolute inset-0 bg-gray-200 animate-pulse" />}
      <img
        {...props}
        ref={imgRef}
        src={src}
        alt={alt || ""}
        loading="lazy"
        decoding="async"
        className={`${className || ''} transition-opacity duration-500 ease-in-out ${loaded ? 'opacity-100' : 'opacity-0'}`}
        onLoad={(e) => {
          setLoaded(true);
          if (props.onLoad) props.onLoad(e);
        }}
        onError={(e) => {
          setLoaded(true);
          if (props.onError) props.onError(e);
        }}
      />
    </>
  );
};

type Product = {
  id: string;
  name: string;
  image: string;
  createdAt: Date;
  category: { name: string } | null;
};

export default function MenuModerationClient({ 
  shopId, 
  initialProducts, 
  initialNextCursor, 
  totalProducts,
  isDeleted
}: { 
  shopId: string; 
  initialProducts: Product[]; 
  initialNextCursor: string | null;
  totalProducts: number;
  isDeleted: boolean;
}) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [nextCursor, setNextCursor] = useState<string | null>(initialNextCursor);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [sortParam, setSortParam] = useState('newest');
  const limit = 10;

  const handleLoadMore = async () => {
    if (!nextCursor || isLoadingMore) return;
    setIsLoadingMore(true);
    try {
      const res = await listShopProductsForModeration(shopId, nextCursor, 50);
      if (res) {
        setProducts(prev => {
          const existingIds = new Set(prev.map(p => p.id));
          const newProducts = res.products.filter(p => !existingIds.has(p.id));
          return [...prev, ...newProducts];
        });
        setNextCursor(res.nextCursor);
      }
    } finally {
      setIsLoadingMore(false);
    }
  };

  const sortedProducts = useMemo(() => {
    let sorted = [...products];
    if (sortParam === 'name') {
      sorted.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortParam === 'category') {
      sorted.sort((a, b) => (a.category?.name || '').localeCompare(b.category?.name || ''));
    } else {
      sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return sorted;
  }, [products, sortParam]);

  const totalPages = Math.ceil(sortedProducts.length / limit);
  const currentProducts = sortedProducts.slice((page - 1) * limit, page * limit);

  return (
    <section className={`bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden ${isDeleted ? 'opacity-50 pointer-events-none' : ''}`}>
      <div className="p-6 border-b border-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Store size={20} className="text-gray-400" />
          <h2 className="text-lg font-bold text-gray-900">Menu Moderation</h2>
          <span className="bg-gray-100 text-gray-600 text-xs font-bold px-3 py-1 rounded-full">{totalProducts} Items</span>
        </div>
        
        <div className="flex items-center gap-2">
          <label htmlFor="sort" className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Sort loaded:</label>
          <select value={sortParam} onChange={(e) => { setSortParam(e.target.value); setPage(1); }} className="bg-gray-50 border border-gray-200 text-sm font-bold text-gray-900 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-gray-900 transition-all cursor-pointer">
            <option value="newest">Created (Newest)</option>
            <option value="name">Name (A-Z)</option>
            <option value="category">Category (A-Z)</option>
          </select>
        </div>
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
            {currentProducts.length === 0 && (
              <tr><td colSpan={4} className="p-8 text-center text-gray-400 font-medium">No items in this menu yet.</td></tr>
            )}
            {currentProducts.map(product => (
              <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                <td className="p-4">
                  <div className="w-12 h-12 rounded-xl bg-gray-100 overflow-hidden relative">
                    <LazyImage src={product.image} className="w-full h-full object-cover" alt="" />
                  </div>
                </td>
                <td className="p-4 font-bold text-gray-800">{product.name}</td>
                <td className="p-4 text-sm text-gray-500">{product.category?.name || 'N/A'}</td>
                <td className="p-4 text-right">
                  <form action={(fd: FormData) => {
                    startTransition(() => {
                       setProducts(prev => prev.filter(p => p.id !== product.id));
                    });
                    startTransition(async () => {
                      await superAdminDeleteProduct(fd);
                    });
                  }}>
                    <input type="hidden" name="id" value={product.id} />
                    <input type="hidden" name="shopId" value={shopId} />
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
      
      {(totalPages > 1 || nextCursor) && (
        <div className="p-4 border-t border-gray-50 flex items-center justify-between bg-gray-50/50">
          <span className="text-xs text-gray-500 font-medium">
            Showing {currentProducts.length > 0 ? (page - 1) * limit + 1 : 0}-{Math.min(page * limit, sortedProducts.length)} of {sortedProducts.length} loaded 
            {totalProducts > sortedProducts.length ? ` (${totalProducts} total)` : ''}
          </span>
          <div className="flex gap-2">
            {page > 1 ? (
              <button onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 bg-white border border-gray-200 text-gray-700 text-xs font-bold rounded-lg hover:bg-gray-50 transition shadow-sm">
                Previous
              </button>
            ) : (
              <button disabled className="px-3 py-1.5 bg-gray-50 border border-gray-100 text-gray-400 text-xs font-bold rounded-lg cursor-not-allowed">Previous</button>
            )}
            {page < totalPages ? (
              <button onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 bg-white border border-gray-200 text-gray-700 text-xs font-bold rounded-lg hover:bg-gray-50 transition shadow-sm">
                Next
              </button>
            ) : (
              <button disabled className="px-3 py-1.5 bg-gray-50 border border-gray-100 text-gray-400 text-xs font-bold rounded-lg cursor-not-allowed">Next</button>
            )}

            {nextCursor && (
               <button onClick={handleLoadMore} disabled={isLoadingMore} className="ml-2 px-3 py-1.5 bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-100 text-xs font-bold rounded-lg transition shadow-sm flex items-center gap-1">
                 {isLoadingMore ? <Loader2 size={14} className="animate-spin" /> : 'Load More 50'}
               </button>
            )}
          </div>
        </div>
      )}
    </section>
  );
}