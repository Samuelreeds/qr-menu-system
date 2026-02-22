import Link from 'next/link';
import { 
  Store, Utensils, ShieldCheck, ArrowRight, 
  Settings, Check, Zap, MessageCircle, Phone, 
  Instagram, Facebook, Globe 
} from 'lucide-react';

export default function HomePage() {
  const tiers = [
    {
      name: "Free",
      price: "$0",
      description: "Perfect for a simple digital presence.",
      features: [
        "Digital menu (Menu only)",
        "Standard QR code",
        "Community support"
      ],
      button: "Start for Free",
      link: "/register",
      highlight: false
    },
    {
      name: "Starter",
      price: "$9",
      description: "Complete control for small businesses.",
      features: [
        "Up to 100 products", 
        "Full control (Admin Dashboard)", 
        "Custom branding", 
        "Standard QR code",
        "Community support"
      ],
      button: "Choose Starter",
      link: "/register",
      highlight: true
    },
    {
      name: "Premium",
      price: "$29",
      description: "The ultimate brand experience.",
      features: [
        "Unlimited products",
        "Custom branding",
        "Custom domain", 
        "Direct support from team",
        "Full control (Admin Dashboard)"
      ],
      button: "Go Premium",
      link: "/register",
      highlight: false
    }
  ];

  return (
    <div className="min-h-screen bg-white font-sans flex flex-col">
      {/* NAVIGATION */}
      <nav className="flex items-center justify-between p-6 max-w-7xl mx-auto w-full">
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

      {/* HERO SECTION */}
      <main className="max-w-7xl mx-auto px-6 pt-16 pb-24 text-center">
        <div className="inline-flex items-center gap-2 bg-orange-50 text-orange-700 px-4 py-2 rounded-full text-xs font-bold mb-8">
          <ShieldCheck size={16} />
          <span>Trusted by restaurants in Cambodia</span>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-black text-gray-900 leading-tight mb-6">
          Digital Menus for the <br />
          <span className="text-orange-500">Modern Restaurant.</span>
        </h1>
        
        <p className="text-gray-500 text-lg md:text-xl max-w-2xl mx-auto mb-12 font-medium">
          Create, manage, and share your QR-code menu in minutes. 
          The smartest way to engage your customers and grow your shop.
        </p>

        {/* PRICING SECTION */}
        <section className="py-12">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black text-gray-900 mb-4 tracking-tight">Simple Pricing</h2>
            <p className="text-gray-500 font-medium text-lg">Everything you need to run your digital menu efficiently.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {tiers.map((tier, idx) => (
              <div 
                key={idx} 
                className={`relative p-8 rounded-3xl border transition-all duration-300 flex flex-col ${
                  tier.highlight 
                  ? 'border-orange-500 shadow-2xl shadow-orange-100 scale-105 z-10 bg-white' 
                  : 'border-gray-100 bg-gray-50/50 hover:bg-white hover:border-gray-200'
                }`}
              >
                {tier.highlight && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-orange-500 text-white px-4 py-1 rounded-full text-[10px] font-black tracking-widest flex items-center gap-1 uppercase">
                    <Zap size={10} fill="currentColor" /> Recommended
                  </div>
                )}
                
                <div className="text-left mb-8">
                  <h3 className="text-xl font-bold text-gray-900 mb-1">{tier.name}</h3>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-4xl font-black text-gray-900">{tier.price}</span>
                    <span className="text-gray-400 font-bold text-sm">/mo</span>
                  </div>
                  <p className="text-gray-500 text-xs font-medium leading-relaxed">{tier.description}</p>
                </div>
                
                <ul className="space-y-4 mb-10 flex-1 text-left">
                  {tier.features.map((feature, fIdx) => (
                    <li key={fIdx} className="flex items-start gap-3 text-sm font-bold text-gray-700">
                      <div className={`mt-0.5 p-0.5 rounded-full ${tier.highlight ? 'bg-orange-100 text-orange-600' : 'bg-gray-200 text-gray-500'}`}>
                        <Check size={12} strokeWidth={4} />
                      </div>
                      {feature}
                    </li>
                  ))}
                </ul>

                <Link 
                  href={tier.link} 
                  className={`w-full py-4 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                    tier.highlight 
                    ? 'bg-orange-500 text-white hover:bg-orange-600 shadow-lg shadow-orange-200' 
                    : 'bg-white border-2 border-gray-100 text-gray-900 hover:border-gray-200'
                  }`}
                >
                  {tier.button} <ArrowRight size={16} />
                </Link>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* FOOTER SECTION */}
      <footer className="bg-gray-50 border-t border-gray-100 pt-16 pb-8 mt-auto">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            
            {/* Brand Column */}
            <div className="col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="bg-orange-500 p-1.5 rounded-lg">
                  <Utensils className="text-white" size={18} />
                </div>
                <span className="text-lg font-black tracking-tight text-gray-900">Scandine</span>
              </div>
              <p className="text-gray-500 text-sm font-medium leading-relaxed">
                The leading digital menu platform for restaurants in Cambodia. Empowering owners with smart tools for growth.
              </p>
            </div>

            {/* Product Column */}
            <div>
              <h4 className="font-bold text-gray-900 mb-4 text-sm">Product</h4>
              <ul className="space-y-2 text-sm text-gray-500 font-medium">
                <li><Link href="/register" className="hover:text-orange-500 transition-colors">Pricing</Link></li>
                <li><Link href="/register" className="hover:text-orange-500 transition-colors">Features</Link></li>
                <li><Link href="/auth/login" className="hover:text-orange-500 transition-colors">Admin Login</Link></li>
              </ul>
            </div>

            {/* Support Column */}
            <div>
              <h4 className="font-bold text-gray-900 mb-4 text-sm">Support</h4>
              <ul className="space-y-2 text-sm text-gray-500 font-medium">
                <li><Link href="#" className="hover:text-orange-500 transition-colors">Help Center</Link></li>
                <li><Link href="#" className="hover:text-orange-500 transition-colors">Privacy Policy</Link></li>
                <li><Link href="#" className="hover:text-orange-500 transition-colors">Terms of Service</Link></li>
              </ul>
            </div>

            {/* Contact Column */}
            <div>
              <h4 className="font-bold text-gray-900 mb-4 text-sm">Contact Us</h4>
              <ul className="space-y-3">
                <li>
                  <a 
                    href="https://t.me/Mengyin01" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-gray-500 font-medium hover:text-blue-500 transition-colors"
                  >
                    <MessageCircle size={16} className="text-blue-500" />
                    Telegram @Mengyin01
                  </a>
                </li>
                <li>
                  <a 
                    href="tel:066605342" 
                    className="flex items-center gap-2 text-sm text-gray-500 font-medium hover:text-orange-500 transition-colors"
                  >
                    <Phone size={16} className="text-orange-500" />
                    066 605 342
                  </a>
                </li>
                <li className="flex items-center gap-3 pt-2">
                  <Link href="#" className="text-gray-400 hover:text-blue-600 transition-colors"><Facebook size={18} /></Link>
                  <Link href="#" className="text-gray-400 hover:text-pink-600 transition-colors"><Instagram size={18} /></Link>
                  <Link href="#" className="text-gray-400 hover:text-gray-900 transition-colors"><Globe size={18} /></Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-gray-200 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">
              © {new Date().getFullYear()} Scandine. All rights reserved.
            </p>
            <div className="flex gap-6 text-xs font-bold text-gray-400 uppercase tracking-widest">
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