// src/app/page.tsx
import Link from 'next/link';
// ADDED 'Settings' to the import list below
import { Store, Utensils, ShieldCheck, ArrowRight, Settings } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Navigation */}
      <nav className="flex items-center justify-between p-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="bg-orange-500 p-2 rounded-xl">
            <Utensils className="text-white" size={24} />
          </div>
          <span className="text-xl font-black tracking-tight text-gray-900">Scandine</span>
        </div>
        <div className="flex gap-4">
          <Link 
            href="/auth/login" 
            className="text-sm font-bold text-gray-600 hover:text-gray-900 px-4 py-2 transition-colors"
          >
            Partner Login
          </Link>
          <Link 
            href="/register" 
            className="text-sm font-bold bg-gray-900 text-white px-6 py-2 rounded-full hover:bg-black transition-all shadow-lg"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-6 pt-16 pb-24 text-center">
        <div className="inline-flex items-center gap-2 bg-orange-50 text-orange-700 px-4 py-2 rounded-full text-xs font-bold mb-8">
          <ShieldCheck size={16} />
          <span>Trusted by restaurants in Cambodia</span>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-black text-gray-900 leading-tight mb-6">
          Digital Menus for the <br />
          <span className="text-orange-500">Modern Restaurant.</span>
        </h1>
        
        <p className="text-gray-500 text-lg md:text-xl max-w-2xl mx-auto mb-10 font-medium">
          Create, manage, and share your QR-code menu in minutes. 
          The smartest way to engage your customers and grow your shop.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link 
            href="/register" 
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-orange-500 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-orange-600 transition-all shadow-xl shadow-orange-200"
          >
            Start 7-Day Free Trial <ArrowRight size={20} />
          </Link>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-24">
          <div className="p-8 rounded-3xl bg-gray-50 border border-gray-100 text-left">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-6">
              <Store className="text-orange-500" size={24} />
            </div>
            <h3 className="text-xl font-bold mb-3">Multi-Tenant Dashboard</h3>
            <p className="text-gray-500 text-sm leading-relaxed">
              Manage your branding, categories, and products all in one secure place with dedicated subdomains.
            </p>
          </div>
          
          <div className="p-8 rounded-3xl bg-gray-50 border border-gray-100 text-left">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-6">
              <LinkIcon size={24} className="text-orange-500" />
            </div>
            <h3 className="text-xl font-bold mb-3">Instant QR Menus</h3>
            <p className="text-gray-500 text-sm leading-relaxed">
              Generate dynamic QR codes that customers can scan to view your latest offerings in real-time.
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-gray-50 border border-gray-100 text-left">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-6">
              {/* This was causing the error: */}
              <Settings size={24} className="text-orange-500" />
            </div>
            <h3 className="text-xl font-bold mb-3">Custom Branding</h3>
            <p className="text-gray-500 text-sm leading-relaxed">
              Upload your logo and choose your theme colors to match your restaurant's unique identity.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

function LinkIcon({ size, className }: { size: number, className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}