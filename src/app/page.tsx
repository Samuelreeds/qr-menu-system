'use client';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
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
  const [demoSlug, setDemoSlug] = useState('');

  // Check if they already have an active demo session in local storage
  useEffect(() => {
    const now = new Date().getTime();
    const demoId = localStorage.getItem('demo_session_id');
    const demoExpiry = localStorage.getItem('demo_session_expiry');

    if (demoId && demoExpiry && now < parseInt(demoExpiry)) {
      setDemoSlug(`demo-cafe-${demoId}`);
    }
  }, []);

  const getOrCreateDemoSession = () => {
    const now = new Date().getTime();
    let demoId = localStorage.getItem('demo_session_id');
    const demoExpiry = localStorage.getItem('demo_session_expiry');

    // If no session, or session expired (1 hour), generate a new one!
    if (!demoId || !demoExpiry || now > parseInt(demoExpiry)) {
      demoId = Math.random().toString(36).substring(2, 10);
      localStorage.setItem('demo_session_id', demoId);
      localStorage.setItem('demo_session_expiry', (now + 60 * 60 * 1000).toString()); // 1 Hour Expiry
      setDemoSlug(`demo-cafe-${demoId}`);
    }
    return demoId;
  };

  const handleDemoLogin = async () => {
    setIsDemoLoading(true);
    try {
      const demoId = getOrCreateDemoSession();
      
      // 1. Creates the isolated DB for this specific user
      const setup = await ensureDemoAccountExists(demoId); 
      
      if (!setup.success) {
        console.error("Failed to setup demo database.");
        setIsDemoLoading(false);
        return;
      }
      
      // 2. Logs them in silently WITHOUT automatic redirect
      const result = await signIn('credentials', {
        email: `demo_${demoId}@scandine.xyz`, 
        password: 'demo_password_123',
        redirect: false, // <-- THIS FIXES THE LOGIN MODAL BUG
      });

      if (result?.error) {
        console.error("NextAuth Login Error:", result.error);
        setIsDemoLoading(false);
      } else if (result?.ok) {
        // 3. Force hard navigation so Middleware sees the new cookie
        window.location.href = '/admin';
      }
    } catch (error) {
      console.error("Demo login process failed:", error);
      setIsDemoLoading(false);
    }
  };

  const handleViewDemoMenu = async () => {
    setIsMenuLoading(true);
    try {
      const demoId = getOrCreateDemoSession();
      
      // Ensures their specific shop exists before routing
      await ensureDemoAccountExists(demoId);
      router.push(`/demo-cafe-${demoId}`);
    } catch (error) {
      console.error("Failed to load demo menu:", error);
      setIsMenuLoading(false);
    }
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
      <nav className="flex items-center justify-between py-4 sm:py-6 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full">
        <div className="flex items-center -ml-2 sm:-ml-0">
          <img src="/horizontalLogo.png" alt="Company Logo" className="h-14 sm:h-16 md:h-20 w-auto object-contain" />
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
            className="text-xs sm:text-sm font-bold bg-gray-900 text-white px-4 sm:px-5 py-2 rounded-full hover:bg-black transition-all shadow-md"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* HERO SECTION */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 text-center w-full">
        <div className="inline-flex items-center gap-1.5 bg-orange-50 text-orange-700 px-3 sm:px-4 py-1.5 rounded-full text-[10px] sm:text-xs font-bold mb-6 sm:mb-8">
          <ShieldCheck size={14} className="sm:w-4 sm:h-4" />
          <span>Trusted by restaurants in Cambodia</span>
        </div>
        
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-gray-900 leading-[1.1] sm:leading-[1.15] mb-4 sm:mb-6 max-w-3xl mx-auto">
          Digital Menus for the <br className="hidden sm:block" />
          <span className="text-orange-500">Modern Restaurant.</span>
        </h1>
        
        <p className="text-gray-500 text-sm sm:text-base max-w-2xl mx-auto text-center mb-8 sm:mb-10 font-medium px-2">
          Create, manage, and share your QR-code menu in minutes. 
          The smartest way to engage your customers and grow your shop.
        </p>

        {/* DEMO BUTTONS */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
          <Link href="/auth/register" className="bg-[#111827] text-white px-6 py-3 rounded-full font-bold hover:bg-black transition-all shadow-md active:scale-95 text-sm sm:text-base flex items-center justify-center">
            Get Started
          </Link>
          
          <button 
            onClick={handleDemoLogin}
            disabled={isDemoLoading || isMenuLoading}
            className="bg-white text-[#111827] border-2 border-gray-200 px-6 py-3 rounded-full font-bold hover:border-[#111827] transition-all flex items-center justify-center gap-2 active:scale-95 text-sm sm:text-base disabled:opacity-70 disabled:cursor-wait"
          >
            {isDemoLoading ? (
              <Loader2 size={18} className="text-orange-500 animate-spin" />
            ) : (
              <Sparkles size={18} className="text-orange-500" />
            )}
            Live Admin Demo
          </button>
        </div>
        
        <button 
          onClick={handleViewDemoMenu}
          disabled={isMenuLoading || isDemoLoading}
          className="inline-flex items-center justify-center gap-2 text-xs sm:text-sm font-bold text-gray-400 hover:text-gray-600 underline transition-colors mb-8 sm:mb-12 disabled:opacity-70 disabled:cursor-wait"
        >
          {isMenuLoading && <Loader2 size={14} className="animate-spin" />}
          Just want to see the menu? View Customer Preview
        </button>
      </main>

      {/* PRICING SECTION */}
      <section className="max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="text-center mb-10 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900 mb-3 sm:mb-4 tracking-tight">Simple Pricing</h2>
          <p className="text-gray-500 font-medium text-sm sm:text-base px-4">Everything you need to run your QR menu business.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 w-full items-start">
          {tiers.map((tier, idx) => (
            <div 
              key={idx} 
              className={`relative p-6 sm:p-6 rounded-3xl border transition-all duration-300 flex flex-col h-full ${
                tier.highlight 
                ? 'border-orange-500 shadow-xl shadow-orange-100 sm:scale-105 z-10 bg-white' 
                : 'border-gray-100 bg-gray-50/50 hover:bg-white hover:border-gray-200'
              }`}
            >
              {tier.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-orange-500 text-white px-3 py-1 rounded-full text-[9px] sm:text-[10px] font-black tracking-widest flex items-center gap-1 uppercase whitespace-nowrap">
                  <Zap size={10} fill="currentColor" /> Recommended
                </div>
              )}
              
              <div className="text-left mb-6">
                <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1">{tier.name}</h3>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-2xl sm:text-3xl font-black text-gray-900">{tier.price}</span>
                  {tier.period && <span className="text-gray-400 font-bold text-xs">{tier.period}</span>}
                </div>
                
                <div className="min-h-[40px] flex flex-col justify-start">
                  {tier.yearlyPrice && (
                    <p className="text-orange-500 font-bold text-xs mb-1">{tier.yearlyPrice}</p>
                  )}
                  {tier.note && (
                    <p className="text-gray-400 text-[10px] font-semibold uppercase tracking-wider">{tier.note}</p>
                  )}
                </div>
              </div>
              
              <ul className="space-y-2.5 mb-8 flex-1 text-left">
                {tier.features.map((feature, fIdx) => (
                  <li key={fIdx} className="flex items-start gap-2 text-xs font-bold text-gray-700">
                    <div className={`mt-0.5 p-0.5 rounded-full shrink-0 ${tier.highlight ? 'bg-orange-100 text-orange-600' : 'bg-gray-200 text-gray-500'}`}>
                      <Check size={10} className="sm:w-2.5 sm:h-2.5" strokeWidth={4} />
                    </div>
                    <span className="leading-snug">{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-auto">
                <Link 
                  href={tier.link} 
                  className={`w-full py-3 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 ${
                    tier.highlight 
                    ? 'bg-orange-500 text-white hover:bg-orange-600 shadow-md shadow-orange-200' 
                    : 'bg-white border-2 border-gray-100 text-gray-900 hover:border-gray-200'
                  }`}
                >
                  {tier.button} <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER SECTION */}
      <footer className="bg-gray-50 border-t border-gray-100 pt-10 sm:pt-12 pb-6 mt-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            
            <div className="col-span-1 sm:col-span-2 md:col-span-1 flex flex-col items-center md:items-start text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start mb-4 w-full">
                <img src="/horizontalLogo.png" alt="Company Logo" className="h-14 sm:h-16 md:h-20 w-auto object-contain" />
              </div>
              <p className="text-gray-500 text-xs font-medium leading-relaxed max-w-xs mx-auto md:mx-0">
                The leading digital menu platform for restaurants in Cambodia. Empowering owners with smart tools for growth.
              </p>
            </div>

            <div className="flex flex-col items-center md:items-start text-center md:text-left">
              <h4 className="font-bold text-gray-900 mb-3 text-xs sm:text-sm w-full">Product</h4>
              <ul className="space-y-2 text-xs text-gray-500 font-medium">
                <li><Link href="/auth/register" className="hover:text-orange-500 transition-colors">Pricing</Link></li>
                <li><Link href="/auth/register" className="hover:text-orange-500 transition-colors">Features</Link></li>
                <li><Link href="/auth/login" className="hover:text-orange-500 transition-colors">Admin Login</Link></li>
              </ul>
            </div>

            <div className="flex flex-col items-center md:items-start text-center md:text-left">
              <h4 className="font-bold text-gray-900 mb-3 text-xs sm:text-sm w-full">Support</h4>
              <ul className="space-y-2 text-xs text-gray-500 font-medium">
                <li><Link href="#" className="hover:text-orange-500 transition-colors">Help Center</Link></li>
                <li><Link href="#" className="hover:text-orange-500 transition-colors">Privacy Policy</Link></li>
                <li><Link href="#" className="hover:text-orange-500 transition-colors">Terms of Service</Link></li>
              </ul>
            </div>

            <div className="flex flex-col items-center md:items-start text-center md:text-left">
              <h4 className="font-bold text-gray-900 mb-3 text-xs sm:text-sm w-full">Contact Us</h4>
              <ul className="space-y-2.5 flex flex-col items-center md:items-start">
                <li>
                  <a 
                    href="https://t.me/Mengyin01" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center justify-center md:justify-start gap-2 text-xs text-gray-500 font-medium hover:text-blue-500 transition-colors"
                  >
                    <MessageCircle size={14} className="text-blue-500" />
                    Telegram @Mengyin01
                  </a>
                </li>
                <li>
                  <a 
                    href="tel:066605342" 
                    className="flex items-center justify-center md:justify-start gap-2 text-xs text-gray-500 font-medium hover:text-orange-500 transition-colors"
                  >
                    <Phone size={14} className="text-orange-500" />
                    066 605 342
                  </a>
                </li>
                <li className="flex items-center justify-center md:justify-start gap-3 pt-1.5 w-full">
                  <Link href="#" className="text-gray-400 hover:text-blue-600 transition-colors"><Facebook size={14} /></Link>
                  <Link href="#" className="text-gray-400 hover:text-pink-600 transition-colors"><Instagram size={14} /></Link>
                  <Link href="#" className="text-gray-400 hover:text-gray-900 transition-colors"><Globe size={14} /></Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6 flex flex-col md:flex-row justify-between items-center gap-3 text-center md:text-left">
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
              © {new Date().getFullYear()} Scandine. All rights reserved.
            </p>
            <div className="flex gap-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
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