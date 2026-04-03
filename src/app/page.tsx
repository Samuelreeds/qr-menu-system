'use client';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ensureDemoAccountExists } from '@/lib/actions';
import { 
  Store, Utensils, ShieldCheck, ArrowRight, 
  Settings, Check, Zap, MessageCircle, Phone, 
  Instagram, Facebook, Globe, Sparkles, Loader2
} from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const [isDemoLoading, setIsDemoLoading] = useState(false);
  const [isMenuLoading, setIsMenuLoading] = useState(false);

  const handleDemoLogin = async () => {
    setIsDemoLoading(true);
    await ensureDemoAccountExists(); 
    await signIn('credentials', {
      email: 'demo@scandine.xyz', 
      password: 'demo_password_123',
      callbackUrl: '/admin',
    });
  };

  const handleViewDemoMenu = async () => {
    setIsMenuLoading(true);
    await ensureDemoAccountExists();
    router.push('/demo-cafe');
  };

  const tiers = [
    {
      name: "Starter Pack",
      price: "$0",
      period: "",
      yearlyPrice: null,
      note: "Perfect for getting started",
      features: [
        "Up to 60 menu items",
        "2 QR menu themes",
        "Preparation time",
        "Upload image menu",
        "7-day admin dashboard trial"
      ],
      button: "Start for Free",
      link: "/auth/register?plan=FREE",
      highlight: false
    },
    {
      name: "Basic Pack",
      price: "$6.99",
      period: "/mo",
      yearlyPrice: "$69 / year",
      note: "7-day free trial included",
      features: [
        "Up to 100 menu items", 
        "Preparation time", 
        "Campaign", 
        "Cover Banner",
        "Smart Categories",
        "2 QR menu themes",
        "Upload image menu",
        "Telegram staff alerts",
        "Dedicated Support"
      ],
      button: "Start 7-Day Free Trial",
      link: "/auth/register?plan=BASIC",
      highlight: true
    },
    {
      name: "Exclusive Pack",
      price: "$16.99",
      period: "/mo",
      yearlyPrice: "$169 / year",
      note: "Hardware excluded",
      features: [
        "Unlimited menu items",
        "Preparation time",
        "Campaign", 
        "POS",
        "Cover Banner",
        "Smart Categories",
        "2 QR menu themes",
        "Upload image menu / Token",
        "Order from table",
        "Telegram staff alerts",
        "Multiple languages",
        "Custom domain",
        "Dedicated Support"
      ],
      button: "Start Exclusive",
      link: "/auth/register?plan=EXCLUSIVE",
      highlight: false
    }
  ];

  return (
    <div className="min-h-screen bg-white font-sans flex flex-col">
      {/* NAVIGATION */}
      <nav className="flex items-center justify-between p-4 sm:p-6 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <div className="bg-orange-500 p-1.5 sm:p-2 rounded-xl">
            <Utensils className="text-white" size={20} />
          </div>
          <span className="text-lg sm:text-xl font-black tracking-tight text-gray-900">Scandine</span>
        </div>
        <div className="flex gap-2 sm:gap-4 items-center">
          <Link 
            href="/auth/login" 
            className="text-xs sm:text-sm font-bold text-gray-600 hover:text-gray-900 px-3 sm:px-4 py-2 transition-colors"
          >
            Partner Login
          </Link>
          <Link 
            href="/auth/register" 
            className="text-xs sm:text-sm font-bold bg-gray-900 text-white px-4 sm:px-6 py-2 sm:py-2.5 rounded-full hover:bg-black transition-all shadow-lg"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* HERO SECTION */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-10 sm:pt-16 pb-16 sm:pb-24 text-center">
        <div className="inline-flex items-center gap-2 bg-orange-50 text-orange-700 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-[10px] sm:text-xs font-bold mb-6 sm:mb-8">
          <ShieldCheck size={14} className="sm:w-4 sm:h-4" />
          <span>Trusted by restaurants in Cambodia</span>
        </div>
        
        <h1 className="text-4xl sm:text-5xl md:text-7xl font-black text-gray-900 leading-[1.1] sm:leading-tight mb-4 sm:mb-6">
          Digital Menus for the <br className="hidden sm:block" />
          <span className="text-orange-500">Modern Restaurant.</span>
        </h1>
        
        <p className="text-gray-500 text-base sm:text-lg md:text-xl max-w-2xl mx-auto mb-10 sm:mb-12 font-medium px-2">
          Create, manage, and share your QR-code menu in minutes. 
          The smartest way to engage your customers and grow your shop.
        </p>

        {/* DEMO BUTTONS */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          <Link href="/auth/register" className="bg-[#111827] text-white px-8 py-4 rounded-full font-bold hover:bg-black transition-all shadow-lg active:scale-95 text-lg flex items-center justify-center">
            Get Started
          </Link>
          
          <button 
            onClick={handleDemoLogin}
            disabled={isDemoLoading || isMenuLoading}
            className="bg-white text-[#111827] border-2 border-gray-200 px-8 py-4 rounded-full font-bold hover:border-[#111827] transition-all flex items-center justify-center gap-2 active:scale-95 text-lg disabled:opacity-70 disabled:cursor-wait"
          >
            {isDemoLoading ? (
              <Loader2 size={20} className="text-orange-500 animate-spin" />
            ) : (
              <Sparkles size={20} className="text-orange-500" />
            )}
            Live Demo
          </button>
        </div>
        
        <button 
          onClick={handleViewDemoMenu}
          disabled={isMenuLoading || isDemoLoading}
          className="inline-flex items-center justify-center gap-2 text-sm font-bold text-gray-400 hover:text-gray-600 underline transition-colors mb-8 sm:mb-12 disabled:opacity-70 disabled:cursor-wait"
        >
          {isMenuLoading && <Loader2 size={14} className="animate-spin" />}
          Just want to see the menu? View Customer Preview
        </button>

        {/* PRICING SECTION */}
        <section className="py-8 sm:py-12">
          <div className="text-center mb-10 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-gray-900 mb-3 sm:mb-4 tracking-tight">Simple Pricing</h2>
            <p className="text-gray-500 font-medium text-base sm:text-lg px-4">Everything you need to run your QR menu business.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 max-w-6xl mx-auto items-start">
            {tiers.map((tier, idx) => (
              <div 
                key={idx} 
                className={`relative p-6 sm:p-8 rounded-3xl border transition-all duration-300 flex flex-col h-full ${
                  tier.highlight 
                  ? 'border-orange-500 shadow-2xl shadow-orange-100 sm:scale-105 z-10 bg-white' 
                  : 'border-gray-100 bg-gray-50/50 hover:bg-white hover:border-gray-200'
                }`}
              >
                {tier.highlight && (
                  <div className="absolute -top-3 sm:-top-4 left-1/2 -translate-x-1/2 bg-orange-500 text-white px-3 sm:px-4 py-1 rounded-full text-[9px] sm:text-[10px] font-black tracking-widest flex items-center gap-1 uppercase whitespace-nowrap">
                    <Zap size={10} fill="currentColor" /> Recommended
                  </div>
                )}
                
                <div className="text-left mb-6 sm:mb-8">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">{tier.name}</h3>
                  <div className="flex items-baseline gap-1 mb-1">
                    <span className="text-3xl sm:text-4xl font-black text-gray-900">{tier.price}</span>
                    {tier.period && <span className="text-gray-400 font-bold text-xs sm:text-sm">{tier.period}</span>}
                  </div>
                  
                  <div className="min-h-[44px] flex flex-col justify-start">
                    {tier.yearlyPrice && (
                      <p className="text-orange-500 font-bold text-sm mb-1">{tier.yearlyPrice}</p>
                    )}
                    {tier.note && (
                      <p className="text-gray-400 text-[10px] sm:text-xs font-semibold uppercase tracking-wider">{tier.note}</p>
                    )}
                  </div>
                </div>
                
                <ul className="space-y-2.5 sm:space-y-3 mb-8 sm:mb-10 flex-1 text-left">
                  {tier.features.map((feature, fIdx) => (
                    <li key={fIdx} className="flex items-start gap-2.5 sm:gap-3 text-xs sm:text-sm font-bold text-gray-700">
                      <div className={`mt-0.5 p-0.5 rounded-full shrink-0 ${tier.highlight ? 'bg-orange-100 text-orange-600' : 'bg-gray-200 text-gray-500'}`}>
                        <Check size={10} className="sm:w-3 sm:h-3" strokeWidth={4} />
                      </div>
                      <span className="leading-snug">{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-auto">
                  <Link 
                    href={tier.link} 
                    className={`w-full py-3.5 sm:py-4 rounded-xl sm:rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                      tier.highlight 
                      ? 'bg-orange-500 text-white hover:bg-orange-600 shadow-lg shadow-orange-200' 
                      : 'bg-white border-2 border-gray-100 text-gray-900 hover:border-gray-200'
                    }`}
                  >
                    {tier.button} <ArrowRight size={16} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* FOOTER SECTION */}
      <footer className="bg-gray-50 border-t border-gray-100 pt-12 sm:pt-16 pb-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10 sm:gap-12 mb-10 sm:mb-12">
            
            <div className="col-span-1 sm:col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="bg-orange-500 p-1.5 rounded-lg">
                  <Utensils className="text-white" size={16} />
                </div>
                <span className="text-base sm:text-lg font-black tracking-tight text-gray-900">Scandine</span>
              </div>
              <p className="text-gray-500 text-xs sm:text-sm font-medium leading-relaxed max-w-xs">
                The leading digital menu platform for restaurants in Cambodia. Empowering owners with smart tools for growth.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-gray-900 mb-4 text-xs sm:text-sm">Product</h4>
              <ul className="space-y-2 text-xs sm:text-sm text-gray-500 font-medium">
                <li><Link href="/auth/register" className="hover:text-orange-500 transition-colors">Pricing</Link></li>
                <li><Link href="/auth/register" className="hover:text-orange-500 transition-colors">Features</Link></li>
                <li><Link href="/auth/login" className="hover:text-orange-500 transition-colors">Admin Login</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-gray-900 mb-4 text-xs sm:text-sm">Support</h4>
              <ul className="space-y-2 text-xs sm:text-sm text-gray-500 font-medium">
                <li><Link href="#" className="hover:text-orange-500 transition-colors">Help Center</Link></li>
                <li><Link href="#" className="hover:text-orange-500 transition-colors">Privacy Policy</Link></li>
                <li><Link href="#" className="hover:text-orange-500 transition-colors">Terms of Service</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-gray-900 mb-4 text-xs sm:text-sm">Contact Us</h4>
              <ul className="space-y-3">
                <li>
                  <a 
                    href="https://t.me/Mengyin01" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-xs sm:text-sm text-gray-500 font-medium hover:text-blue-500 transition-colors"
                  >
                    <MessageCircle size={14} className="sm:w-4 sm:h-4 text-blue-500" />
                    Telegram @Mengyin01
                  </a>
                </li>
                <li>
                  <a 
                    href="tel:066605342" 
                    className="flex items-center gap-2 text-xs sm:text-sm text-gray-500 font-medium hover:text-orange-500 transition-colors"
                  >
                    <Phone size={14} className="sm:w-4 sm:h-4 text-orange-500" />
                    066 605 342
                  </a>
                </li>
                <li className="flex items-center gap-3 pt-2">
                  <Link href="#" className="text-gray-400 hover:text-blue-600 transition-colors"><Facebook size={16} className="sm:w-[18px] sm:h-[18px]"/></Link>
                  <Link href="#" className="text-gray-400 hover:text-pink-600 transition-colors"><Instagram size={16} className="sm:w-[18px] sm:h-[18px]"/></Link>
                  <Link href="#" className="text-gray-400 hover:text-gray-900 transition-colors"><Globe size={16} className="sm:w-[18px] sm:h-[18px]"/></Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6 sm:pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
            <p className="text-[10px] sm:text-xs text-gray-400 font-bold uppercase tracking-widest">
              © {new Date().getFullYear()} Scandine. All rights reserved.
            </p>
            <div className="flex gap-6 text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-widest">
              <span className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                System Operational
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}