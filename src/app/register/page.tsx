'use client';

import { useState } from 'react';
import { Send, ArrowLeft, Store, Mail, MessageCircle, Phone, Lock, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { registerPublicShop } from '@/lib/actions';

export default function RegisterRequestPage() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRequest = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    const res = await registerPublicShop(formData);
    
    if (res.success) {
      const signInRes = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (signInRes?.error) {
        setError('Account created, but auto-login failed. Please log in manually.');
        setLoading(false);
      } else {
        router.push('/admin');
      }
    } else {
      setError(res.error || 'Registration failed');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB] p-4 font-sans py-12">
      <div className="max-w-xl w-full bg-white p-8 md:p-12 rounded-[2.5rem] shadow-xl border border-gray-100">
        <Link href="/" className="inline-flex items-center text-xs font-bold text-gray-400 hover:text-gray-900 mb-8 gap-1 transition-colors uppercase tracking-widest">
          <ArrowLeft size={14} /> Back to Home
        </Link>

        <div className="mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-orange-100 rounded-2xl mb-4">
            <Store className="text-orange-600" size={28} />
          </div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Register Your Shop</h1>
          <p className="text-gray-500 mt-2 font-medium">Step 1: Create your self-service account.</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm font-bold border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleRequest} className="space-y-6">
          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Owner Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
              <input 
                name="email"
                type="email"
                required
                placeholder="owner@email.com"
                className="w-full pl-12 p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all font-medium" 
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Telegram</label>
            <div className="relative">
               <MessageCircle className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
               <input 
                name="telegram"
                placeholder="@username"
                className="w-full pl-12 p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all font-medium" 
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Phone Number</label>
            <div className="relative">
               <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
               <input 
                name="phone"
                required
                placeholder="012 345 678"
                className="w-full pl-12 p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all font-medium" 
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
              <input 
                name="password"
                type="password"
                required
                placeholder="••••••••"
                className="w-full pl-12 p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all font-medium" 
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Confirm Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
              <input 
                name="confirmPassword"
                type="password"
                required
                placeholder="••••••••"
                className="w-full pl-12 p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all font-medium" 
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-gray-900 text-white py-5 rounded-2xl font-black shadow-xl hover:bg-black transition-all mt-4 flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-70"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <>CREATE ACCOUNT <Send size={20} /></>}
          </button>
        </form>
      </div>
    </div>
  );
}