'use client';

import { useState, useRef, useEffect } from 'react';
import { X, MapPin, Phone, Clock, Facebook, Instagram, Send, Globe, Youtube, Twitter, Linkedin, Store } from 'lucide-react';

interface SocialLink {
  id: string;
  platform: string;
  url: string;
  active: boolean;
}

interface ShopSettings {
  name: string;
  name_kh?: string | null;
  nameDisplay?: string;
  address?: string | null;
  phone?: string | null;
  openingHours?: string | null;
  logo?: string | null;
  socials?: string;
  themeColor?: string;
}

interface ShopInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: ShopSettings;
}

export default function ShopInfoModal({ isOpen, onClose, settings }: ShopInfoModalProps) {
  const [logoLoaded, setLogoLoaded] = useState(false);
  const logoRef = useRef<HTMLImageElement>(null);

  // Safety check for browser-cached images where onLoad doesn't fire
  useEffect(() => {
    if (isOpen && logoRef.current?.complete) {
      setLogoLoaded(true);
    }
  }, [isOpen, settings.logo]);

  if (!isOpen) return null;

  // Strictly follow the exact admin setting for name display
  const getShopName = () => {
    const display = settings.nameDisplay || 'EN';
    if (display === 'KH' && settings.name_kh) return settings.name_kh;
    if (display === 'BOTH' && settings.name_kh) return `${settings.name} ${settings.name_kh}`;
    return settings.name || 'Shop Name';
  };

  // Parse Socials
  let socialLinks: SocialLink[] = [];
  try {
    if (settings.socials) {
      socialLinks = JSON.parse(settings.socials).filter((s: SocialLink) => s.active && s.url);
    }
  } catch (e) {
    console.error("Failed to parse socials", e);
  }

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'facebook': return <Facebook size={18} />;
      case 'instagram': return <Instagram size={18} />;
      case 'telegram': return <Send size={18} />;
      case 'youtube': return <Youtube size={18} />;
      case 'twitter': return <Twitter size={18} />;
      case 'linkedin': return <Linkedin size={18} />;
      default: return <Globe size={18} />;
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-[32px] w-full max-w-sm shadow-2xl relative animate-in zoom-in-95 duration-300 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        <div className="absolute top-4 right-4 z-10">
          <button 
            onClick={onClose}
            className="bg-black/5 text-gray-500 hover:bg-black/10 p-2 rounded-full backdrop-blur-md transition-all active:scale-95"
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-6 pt-10 pb-8 overflow-y-auto no-scrollbar">
           <div className="flex flex-col items-center text-center mb-8">
             {settings.logo ? (
               <div className="w-20 h-20 rounded-2xl overflow-hidden mb-4 shadow-md bg-gray-50 border border-gray-100 p-0.5 relative">
                 {!logoLoaded && <div className="absolute inset-0 bg-gray-200 animate-pulse" />}
                 <img 
                   ref={logoRef}
                   src={settings.logo} 
                   alt={getShopName()} 
                   loading="lazy"
                   decoding="async"
                   className={`w-full h-full object-cover rounded-[14px] transition-opacity duration-500 ${logoLoaded ? 'opacity-100' : 'opacity-0'}`} 
                   onLoad={() => setLogoLoaded(true)}
                   onError={() => setLogoLoaded(true)}
                 />
               </div>
             ) : (
               <div className="w-20 h-20 rounded-2xl bg-gray-100 mb-4 flex items-center justify-center shadow-inner border border-gray-200">
                 <Store size={32} className="text-gray-400" />
               </div>
             )}
             <h2 className="text-2xl font-black text-gray-900 leading-tight">
               {getShopName()}
             </h2>
           </div>

           <div className="space-y-3">
             {settings.openingHours && (
               <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                 <div className="bg-white p-2 rounded-xl shadow-sm shrink-0">
                   <Clock size={18} className="text-gray-600" />
                 </div>
                 <div>
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Opening Hours</p>
                   <p className="text-sm font-semibold text-gray-800">{settings.openingHours}</p>
                 </div>
               </div>
             )}

             {settings.address && (
               <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                 <div className="bg-white p-2 rounded-xl shadow-sm shrink-0">
                   <MapPin size={18} className="text-gray-600" />
                 </div>
                 <div>
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Address</p>
                   <p className="text-sm font-semibold text-gray-800 leading-relaxed">{settings.address}</p>
                 </div>
               </div>
             )}

             {settings.phone && (
               <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                 <div className="bg-white p-2 rounded-xl shadow-sm shrink-0">
                   <Phone size={18} className="text-gray-600" />
                 </div>
                 <div>
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Contact</p>
                   <a href={`tel:${settings.phone}`} className="text-sm font-semibold text-blue-600 hover:underline">{settings.phone}</a>
                 </div>
               </div>
             )}

             {socialLinks.length > 0 && (
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 mt-2">
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Connect with us</p>
                   <div className="flex flex-wrap gap-2">
                     {socialLinks.map((link) => (
                       <a 
                         key={link.id} 
                         href={link.url.startsWith('http') ? link.url : `https://${link.url}`} 
                         target="_blank" 
                         rel="noopener noreferrer"
                         className="p-2.5 bg-white rounded-xl shadow-sm hover:shadow-md transition-all text-gray-600 hover:text-gray-900 border border-gray-100 active:scale-95"
                       >
                         {getPlatformIcon(link.platform)}
                       </a>
                     ))}
                   </div>
                </div>
             )}
           </div>
        </div>
      </div>
    </div>
  );
}