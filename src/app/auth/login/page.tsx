// src/app/auth/login/page.tsx
'use client';

import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { CheckCircle, Lock, Loader2 } from 'lucide-react';

function LoginContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const registered = searchParams.get('registered');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    // Handle authentication redirect manually to ensure it goes to /admin
    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    } else {
      // SUCCESS: Redirect to the tenant admin dashboard
      router.push('/admin');
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB] p-4 font-sans">
      <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-xl border border-gray-100">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-50 rounded-2xl mb-4">
            <Lock className="text-gray-900" size={24} />
          </div>
          <h1 className="text-2xl font-black text-gray-900">Admin Login</h1>
        </div>

        {registered && !error && (
          <div className="mb-6 flex items-center gap-3 bg-emerald-50 border border-emerald-100 p-4 rounded-2xl text-emerald-700">
            <CheckCircle size={20} className="shrink-0" />
            <p className="text-sm font-bold">Registration successful! Please log in.</p>
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-50 border border-red-100 p-4 rounded-2xl text-red-600 text-sm font-bold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-500 mb-1 block">Email Address</label>
            <input 
              name="email"
              type="email" 
              required
              placeholder="owner@restaurant.com"
              className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all" 
            />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 mb-1 block">Password</label>
            <input 
              name="password"
              type="password" 
              required
              placeholder="••••••••"
              className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all" 
            />
          </div>
          <button 
            disabled={loading}
            type="submit" 
            className="w-full bg-gray-900 text-white py-4 rounded-xl font-bold shadow-md hover:bg-black transition-all mt-4 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  );
}