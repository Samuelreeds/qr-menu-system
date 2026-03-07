// src/app/auth/forgot-password/page.tsx
'use client';

import { useState } from 'react';
import { requestPasswordReset } from '@/lib/actions';
import { Mail, ArrowLeft, Loader2, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const result = await requestPasswordReset(formData);

    if (result.success) {
      setSuccess(true);
    } else {
      setError('Something went wrong. Please try again.');
    }
    setLoading(false);
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB] p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-xl border border-gray-100 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-50 rounded-full mb-6">
            <CheckCircle className="text-emerald-500" size={32} />
          </div>
          <h1 className="text-2xl font-black text-gray-900">Check your email</h1>
          <p className="text-gray-500 mt-2">We've sent a password reset link to your email address.</p>
          <Link href="/auth/login" className="mt-8 inline-block text-sm font-bold text-blue-600 hover:underline">
            Back to login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB] p-4">
      <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-xl border border-gray-100">
        <Link href="/auth/login" className="inline-flex items-center text-xs font-bold text-gray-400 hover:text-gray-600 mb-6 gap-1">
          <ArrowLeft size={14} /> Back to Login
        </Link>
        
        <div className="mb-8">
          <h1 className="text-2xl font-black text-gray-900">Forgot Password?</h1>
          <p className="text-sm text-gray-500 mt-2">No worries, we'll send you reset instructions.</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 text-red-600 p-4 rounded-2xl text-sm font-bold border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-500 mb-1 block">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                name="email"
                type="email" 
                required
                placeholder="owner@restaurant.com"
                className="w-full pl-11 p-3.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all" 
              />
            </div>
          </div>
          <button 
            disabled={loading}
            type="submit" 
            className="w-full bg-gray-900 text-white py-4 rounded-xl font-bold shadow-md hover:bg-black transition-all mt-4 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : 'Send Reset Link'}
          </button>
        </form>
      </div>
    </div>
  );
}