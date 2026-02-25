'use client';

import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { CheckCircle, Lock, Loader2, Mail, EyeOff, Eye, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

function LoginContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const registered = searchParams.get('registered');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    } else {
      router.push('/admin');
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB] p-4 sm:p-6 lg:p-8 font-sans">
      <div className="max-w-md w-full bg-white p-6 sm:p-10 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 relative">
        <Link href="/" className="inline-flex items-center text-[10px] sm:text-xs font-bold text-gray-400 hover:text-gray-900 mb-8 gap-1 transition-colors uppercase tracking-widest relative z-10">
          <ArrowLeft size={14} /> Back to Home
        </Link>

        <div className="flex flex-col items-center text-center mb-8">
          <div className="flex items-center justify-center w-12 h-12 bg-white rounded-2xl mb-4 border border-gray-100 shadow-sm">
            <Lock className="text-gray-900" size={20} />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">Admin Login</h1>
          <p className="text-gray-500 mt-2 font-medium text-xs sm:text-sm">Welcome back! Please enter your details.</p>
        </div>

        {registered && !error && (
          <div className="mb-6 flex items-center justify-center gap-2 bg-green-50 border border-green-200 p-4 rounded-xl text-green-700">
            <CheckCircle size={18} className="shrink-0" />
            <p className="text-xs sm:text-sm font-bold">Registration successful! Please log in.</p>
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-50 border border-red-100 p-4 rounded-xl text-red-600 text-xs sm:text-sm font-bold text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
          <div>
            <label htmlFor="email" className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block ml-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input 
                id="email"
                name="email"
                type="email" 
                required
                autoComplete="email"
                autoCapitalize="none"
                placeholder="owner@restaurant.com"
                className="w-full pl-11 pr-4 py-3.5 bg-[#F0F4F8] border border-transparent rounded-xl outline-none focus:ring-2 focus:ring-gray-900 focus:bg-white transition-all font-medium text-sm text-gray-900 placeholder:text-gray-400" 
              />
            </div>
          </div>
          
          <div>
            <label htmlFor="password" className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block ml-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input 
                id="password"
                name="password"
                type={showPassword ? "text" : "password"} 
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full pl-11 pr-11 py-3.5 bg-[#F0F4F8] border border-transparent rounded-xl outline-none focus:ring-2 focus:ring-gray-900 focus:bg-white transition-all font-medium text-sm text-gray-900 placeholder:text-gray-400" 
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1.5 active:scale-95 transition-all"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          
          <button 
            disabled={loading}
            type="submit" 
            className="w-full bg-[#0F172A] text-white py-3.5 rounded-xl font-bold shadow-md hover:bg-black transition-all mt-6 flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed text-sm"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : 'Sign In'}
          </button>
        </form>

        <div className="mt-8 text-center relative z-20">
          <p className="text-xs sm:text-sm text-gray-500 font-medium">
            Don't have an account? 
            <Link href="/auth/register" className="text-gray-900 font-black hover:underline ml-1 inline-block p-1 cursor-pointer">
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center"><Loader2 className="animate-spin text-gray-400" size={32} /></div>}>
      <LoginContent />
    </Suspense>
  );
}