'use client';

import { X, MapPin, Phone, Globe, Facebook, Instagram, Send, Youtube, Twitter, Linkedin } from 'lucide-react';

interface SocialLink {
  id: string;
  platform: string;
  url: string;
  active: boolean;
}

interface ShopSettings {
  name: string; address?: string; phone?: string; logo?: string;
  socials: string; // JSON string
}

interface ShopInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: ShopSettings;
}

export default function ShopInfoModal({ isOpen, onClose, settings }: ShopInfoModalProps) {
  if (!isOpen) return null;

  const logoUrl = settings.logo || 'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?auto=format&fit=crop&w=100&q=80';

  // Parse links safely
  const socialLinks: SocialLink[] = settings.socials ? JSON.parse(settings.socials) : [];
  const activeLinks = socialLinks.filter(l => l.active && l.url);

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'facebook': return <Facebook size={24} />;
      case 'instagram': return <Instagram size={24} />;
      case 'telegram': return <Send size={24} />;
      case 'youtube': return <Youtube size={24} />;
      case 'twitter': return <Twitter size={24} />;
      case 'linkedin': return <Linkedin size={24} />;
      default: return <Globe size={24} />;
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case 'facebook': return 'bg-blue-50 text-blue-600';
      case 'instagram': return 'bg-pink-50 text-pink-600';
      case 'telegram': return 'bg-sky-50 text-sky-500';
      case 'youtube': return 'bg-red-50 text-red-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      
      <div className="bg-white w-full max-w-sm rounded-[35px] p-8 relative z-10 shadow-2xl animate-in zoom-in-95 duration-200">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-gray-50 rounded-full text-gray-400 hover:bg-gray-100"><X size={20} /></button>

        <div className="text-center">
          <div className="w-24 h-24 bg-gray-50 rounded-full mx-auto mb-6 p-1 border border-gray-100 shadow-sm">
             <img src={logoUrl} alt="Shop Logo" className="w-full h-full object-cover rounded-full" />
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900 mb-2">{settings.name}</h2>
          <p className="text-sm text-gray-400 font-medium mb-8">Best food in town</p>

          <div className="space-y-4 text-left">
            {settings.address && (
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-gray-900 shadow-sm shrink-0"><MapPin size={20} /></div>
                <div><p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Address</p><p className="text-sm font-semibold text-gray-800 leading-tight">{settings.address}</p></div>
              </div>
            )}
            {settings.phone && (
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-gray-900 shadow-sm shrink-0"><Phone size={20} /></div>
                <div><p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Phone</p><p className="text-sm font-semibold text-gray-800">{settings.phone}</p></div>
              </div>
            )}
          </div>

          {activeLinks.length > 0 && (
             <div className="mt-8 pt-8 border-t border-gray-100">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Connect With Us</p>
                <div className="flex flex-wrap justify-center gap-3">
                  {activeLinks.map(link => (
                    <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer" className={`p-3 rounded-full hover:scale-110 transition-transform ${getPlatformColor(link.platform)}`}>
                      {getPlatformIcon(link.platform)}
                    </a>
                  ))}
                </div>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}