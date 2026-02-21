'use client';

import { useState } from 'react';
import { registerShopFromInvite } from '@/lib/actions';
import { useRouter } from 'next/navigation';
import { Store, Loader2 } from 'lucide-react';

export default function InviteForm({ invite, token }: { invite: any, token: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const formData = new FormData(e.currentTarget);
    const result = await registerShopFromInvite(formData);

    if (result.success) {
      // Redirect to login or directly to admin panel
      router.push('/login?registered=true'); 
    } else {
      setError(result.error || 'Registration failed');
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input type="hidden" name="token" value={token} />
      
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm font-bold border border-red-100">
          {error}
        </div>
      )}

      <div>
        <label className="text-xs font-bold text-gray-500 mb-1 block">Restaurant Name</label>
        <input name="shopName" defaultValue={invite.shopName || ''} required className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
      </div>

      {/* <div>
        <label className="text-xs font-bold text-gray-500 mb-1 block">URL Slug (e.g. 'pizza-house')</label>
        <input name="slug" defaultValue={invite.slug || ''} required pattern="[a-z0-9-]+" title="Only lowercase letters, numbers, and dashes" className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
      </div> */}

      <div>
        <label className="text-xs font-bold text-gray-500 mb-1 block">Owner Email</label>
        <input type="email" name="email" defaultValue={invite.email || ''} required className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
      </div>

      <div>
        <label className="text-xs font-bold text-gray-500 mb-1 block">Create Password</label>
        <input type="password" name="password" required minLength={6} className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
      </div>

      <button disabled={loading} type="submit" className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold shadow-md hover:bg-blue-700 transition flex items-center justify-center gap-2 mt-6">
        {loading ? <Loader2 className="animate-spin" size={20} /> : <><Store size={20} /> Claim 7-Day PRO Trial</>}
      </button>
    </form>
  );
}