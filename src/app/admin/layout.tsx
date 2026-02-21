import { checkShopAccess } from '@/lib/shop-guard';
import { prisma } from '@/lib/prisma'; 

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Get the current shop ID
  const shop = await prisma.shop.findFirst({ orderBy: { createdAt: 'asc' } });
  
  if (shop) {
    const access = await checkShopAccess(shop.id);
    
    // ENFORCE THE KILL SWITCH
    if (!access.allowed && access.reason === 'LOCKED') {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB] p-4 font-sans">
           <div className="bg-white p-8 rounded-3xl shadow-lg border border-red-100 text-center max-w-md w-full">
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
              </div>
              <h1 className="text-2xl font-extrabold text-gray-900 mb-2">Account Locked</h1>
              <p className="text-gray-500 text-sm font-medium">Your restaurant's account has been temporarily locked. Please contact the system administrator to settle your subscription and restore access.</p>
           </div>
        </div>
      );
    }
  }

  return <>{children}</>;
}