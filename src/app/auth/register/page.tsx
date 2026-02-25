'use client';

import { useState } from 'react';
import { ArrowLeft, Store, Mail, MessageCircle, Phone, Lock, Loader2, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { registerPublicShop } from '@/lib/actions';

export default function RegisterRequestPage() {
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const [formValues, setFormValues] = useState({
    email: '',
    phone: '',
    telegram: '',
    password: '',
    confirmPassword: ''
  });
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formValues.email) {
      errs.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formValues.email)) {
      errs.email = 'Please enter a valid email address';
    }
    
    if (!formValues.phone) {
      errs.phone = 'Phone number is required';
    } else if (formValues.phone.replace(/\D/g, '').length < 6) {
      errs.phone = 'Please enter a valid phone number';
    }
    
    if (formValues.telegram && formValues.telegram.trim().length === 0) {
      errs.telegram = 'Invalid format';
    }

    if (formValues.password.length > 0 && formValues.password.length < 8) {
      errs.password = 'Password must be at least 8 characters';
    } else if (!formValues.password) {
      errs.password = 'Password is required';
    }

    if (formValues.confirmPassword && formValues.password !== formValues.confirmPassword) {
      errs.confirmPassword = 'Passwords do not match';
    } else if (!formValues.confirmPassword) {
      errs.confirmPassword = 'Confirm password is required';
    }

    return errs;
  };

  const errors = validate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormValues({ ...formValues, [e.target.name]: e.target.value });
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setTouched({ ...touched, [e.target.name]: true });
  };

  const isFieldValid = (field: string) => touched[field] && !errors[field] && formValues[field as keyof typeof formValues].length > 0;

  const handleRequest = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setServerError('');
    
    const allTouched = Object.keys(formValues).reduce((acc, key) => ({...acc, [key]: true}), {});
    setTouched(allTouched);

    if (Object.keys(errors).length > 0) return;

    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    const res = await registerPublicShop(formData);
    
    if (res.success) {
      const signInRes = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (signInRes?.error) {
        setServerError('Account created, but auto-login failed. Please log in manually.');
        setLoading(false);
      } else {
        router.push('/admin');
      }
    } else {
      setServerError(res.error || 'Registration failed');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB] p-4 sm:p-6 lg:p-8 font-sans py-12">
      <div className="max-w-md w-full bg-white p-6 sm:p-10 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 relative">
        <Link href="/" className="inline-flex items-center text-[10px] sm:text-xs font-bold text-gray-400 hover:text-gray-900 mb-8 gap-1 transition-colors uppercase tracking-widest relative z-10">
          <ArrowLeft size={14} /> Back to Home
        </Link>

        <div className="mb-8 flex flex-col items-center text-center">
          <div className="flex items-center justify-center w-12 h-12 bg-white rounded-2xl mb-4 border border-gray-100 shadow-sm">
            <Store className="text-gray-900" size={20} />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">Register Shop</h1>
          <p className="text-gray-500 mt-2 font-medium text-xs sm:text-sm">Create your owner account to get started.</p>
        </div>

        {serverError && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-xs sm:text-sm font-bold border border-red-100 text-center">
            {serverError}
          </div>
        )}

        <form onSubmit={handleRequest} className="space-y-4 relative z-10" noValidate>
          {/* Owner Email */}
          <div>
            <label htmlFor="email" className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block ml-1">Owner Email</label>
            <div className="relative">
              <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${touched.email && errors.email ? 'text-red-400' : isFieldValid('email') ? 'text-green-500' : 'text-gray-400'}`} size={16} />
              <input 
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                autoCapitalize="none"
                placeholder="owner@email.com"
                value={formValues.email}
                onChange={handleChange}
                onBlur={handleBlur}
                aria-describedby={touched.email && errors.email ? "email-error" : undefined}
                className={`w-full pl-11 pr-10 py-3.5 bg-[#F0F4F8] border rounded-xl outline-none focus:ring-2 focus:bg-white transition-all font-medium text-sm text-gray-900 placeholder:text-gray-400 ${
                  touched.email && errors.email 
                    ? 'border-red-300 focus:ring-red-400' 
                    : isFieldValid('email') 
                      ? 'border-green-300 focus:ring-green-400' 
                      : 'border-transparent focus:ring-gray-900'
                }`} 
              />
              {isFieldValid('email') && <CheckCircle2 className="absolute right-4 top-1/2 -translate-y-1/2 text-green-500" size={16} />}
            </div>
            {touched.email && errors.email && (
              <p id="email-error" className="text-red-500 text-[10px] sm:text-xs mt-1.5 font-medium ml-1">{errors.email}</p>
            )}
          </div>

          {/* Phone Number */}
          <div>
            <label htmlFor="phone" className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block ml-1">Phone Number</label>
            <div className="relative">
               <Phone className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${touched.phone && errors.phone ? 'text-red-400' : isFieldValid('phone') ? 'text-green-500' : 'text-gray-400'}`} size={16} />
               <input 
                id="phone"
                name="phone"
                type="tel"
                required
                autoComplete="tel"
                placeholder="012 345 678"
                value={formValues.phone}
                onChange={handleChange}
                onBlur={handleBlur}
                aria-describedby={touched.phone && errors.phone ? "phone-error" : undefined}
                className={`w-full pl-11 pr-10 py-3.5 bg-[#F0F4F8] border rounded-xl outline-none focus:ring-2 focus:bg-white transition-all font-medium text-sm text-gray-900 placeholder:text-gray-400 ${
                  touched.phone && errors.phone 
                    ? 'border-red-300 focus:ring-red-400' 
                    : isFieldValid('phone') 
                      ? 'border-green-300 focus:ring-green-400' 
                      : 'border-transparent focus:ring-gray-900'
                }`} 
              />
              {isFieldValid('phone') && <CheckCircle2 className="absolute right-4 top-1/2 -translate-y-1/2 text-green-500" size={16} />}
            </div>
            {touched.phone && errors.phone && (
              <p id="phone-error" className="text-red-500 text-[10px] sm:text-xs mt-1.5 font-medium ml-1">{errors.phone}</p>
            )}
          </div>

          {/* Telegram Username */}
          <div>
            <label htmlFor="telegram" className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block ml-1">Telegram Username (Optional)</label>
            <div className="relative">
               <MessageCircle className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${touched.telegram && errors.telegram ? 'text-red-400' : isFieldValid('telegram') ? 'text-green-500' : 'text-gray-400'}`} size={16} />
               <input 
                id="telegram"
                name="telegram"
                type="text"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                placeholder="@username or t.me/username"
                value={formValues.telegram}
                onChange={handleChange}
                onBlur={handleBlur}
                aria-describedby="telegram-help"
                className={`w-full pl-11 pr-10 py-3.5 bg-[#F0F4F8] border rounded-xl outline-none focus:ring-2 focus:bg-white transition-all font-medium text-sm text-gray-900 placeholder:text-gray-400 ${
                  touched.telegram && errors.telegram 
                    ? 'border-red-300 focus:ring-red-400' 
                    : isFieldValid('telegram') 
                      ? 'border-green-300 focus:ring-green-400' 
                      : 'border-transparent focus:ring-gray-900'
                }`} 
              />
              {isFieldValid('telegram') && <CheckCircle2 className="absolute right-4 top-1/2 -translate-y-1/2 text-green-500" size={16} />}
            </div>
            {touched.telegram && errors.telegram ? (
              <p id="telegram-error" className="text-red-500 text-[10px] sm:text-xs mt-1.5 font-medium ml-1">{errors.telegram}</p>
            ) : (
              <p id="telegram-help" className="text-gray-400 text-[10px] sm:text-xs mt-1.5 font-medium ml-1">For contact and support communication only</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block ml-1">Password</label>
            <div className="relative">
              <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${touched.password && errors.password ? 'text-red-400' : isFieldValid('password') ? 'text-green-500' : 'text-gray-400'}`} size={16} />
              <input 
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                required
                autoComplete="new-password"
                placeholder="••••••••"
                value={formValues.password}
                onChange={handleChange}
                onBlur={handleBlur}
                aria-describedby="password-help"
                className={`w-full pl-11 pr-11 py-3.5 bg-[#F0F4F8] border rounded-xl outline-none focus:ring-2 focus:bg-white transition-all font-medium text-sm text-gray-900 placeholder:text-gray-400 ${
                  touched.password && errors.password 
                    ? 'border-red-300 focus:ring-red-400' 
                    : isFieldValid('password') 
                      ? 'border-green-300 focus:ring-green-400' 
                      : 'border-transparent focus:ring-gray-900'
                }`} 
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
            {touched.password && errors.password ? (
              <p id="password-error" className="text-red-500 text-[10px] sm:text-xs mt-1.5 font-medium ml-1">{errors.password}</p>
            ) : (
              <p id="password-help" className="text-gray-400 text-[10px] sm:text-xs mt-1.5 font-medium ml-1">At least 8 characters</p>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label htmlFor="confirmPassword" className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block ml-1">Confirm Password</label>
            <div className="relative">
              <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${touched.confirmPassword && errors.confirmPassword ? 'text-red-400' : isFieldValid('confirmPassword') ? 'text-green-500' : 'text-gray-400'}`} size={16} />
              <input 
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirm ? "text" : "password"}
                required
                autoComplete="new-password"
                placeholder="••••••••"
                value={formValues.confirmPassword}
                onChange={handleChange}
                onBlur={handleBlur}
                aria-describedby={touched.confirmPassword && errors.confirmPassword ? "confirmPassword-error" : undefined}
                className={`w-full pl-11 pr-11 py-3.5 bg-[#F0F4F8] border rounded-xl outline-none focus:ring-2 focus:bg-white transition-all font-medium text-sm text-gray-900 placeholder:text-gray-400 ${
                  touched.confirmPassword && errors.confirmPassword 
                    ? 'border-red-300 focus:ring-red-400' 
                    : isFieldValid('confirmPassword') 
                      ? 'border-green-300 focus:ring-green-400' 
                      : 'border-transparent focus:ring-gray-900'
                }`} 
              />
              <button 
                type="button" 
                onClick={() => setShowConfirm(!showConfirm)}
                aria-label={showConfirm ? "Hide confirm password" : "Show confirm password"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1.5 active:scale-95 transition-all"
              >
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {touched.confirmPassword && errors.confirmPassword && (
              <p id="confirmPassword-error" className="text-red-500 text-[10px] sm:text-xs mt-1.5 font-medium ml-1">{errors.confirmPassword}</p>
            )}
          </div>

          <div className="pt-4">
            <p className="text-center text-[10px] sm:text-xs text-gray-400 font-medium mb-4">
              We use your contact details only for account and shop-related communication.
            </p>
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-[#0F172A] text-white py-3.5 rounded-xl font-bold shadow-md hover:bg-black transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed text-sm relative z-10"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : 'Create account'}
            </button>
          </div>
          
          <div className="mt-4 text-center relative z-20">
            <p className="text-xs sm:text-sm text-gray-500 font-medium">
              Already have an account? 
              <Link href="/auth/login" className="text-gray-900 font-black hover:underline ml-1 inline-block p-1 cursor-pointer">
                Sign in
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}