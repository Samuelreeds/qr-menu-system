'use client';

import { X, MapPin, Phone, Facebook, Instagram, Send } from 'lucide-react';

interface ShopSettings {
  name: string;
  description?: string;
  logo?: string | null;
  address?: string | null;
  phone?: string | null;
  themeColor: string;
  
  // Socials
  facebook?: string | null;
  showFacebook: boolean;
  instagram?: string | null;
  showInstagram: boolean;
  telegram?: string | null;
  showTelegram: boolean;
}

interface ShopInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: ShopSettings;
}

export default function ShopInfoModal({ isOpen, onClose, settings }: ShopInfoModalProps) {
  if (!isOpen) return null;

  // Default fallbacks if data is missing
  const shopName = settings?.name || "Gourmet Shop";
  const logoUrl = settings?.logo || "https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?auto=format&fit=crop&w=150&q=80";
  const address = settings?.address || "Location not set";
  const phone = settings?.phone || "No phone number";
  const themeColor = settings?.themeColor || "#5CB85C";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="bg-white w-full max-w-sm rounded-[35px] overflow-hidden relative z-10 shadow-2xl animate-in zoom-in-95 duration-300">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition z-20"
        >
          <X size={20} className="text-gray-600" />
        </button>

        <div className="flex flex-col items-center pt-10 pb-8 px-6 text-center">
          
          {/* Logo */}
          <div className="w-24 h-24 rounded-full overflow-hidden shadow-lg border-4 border-white mb-4 bg-gray-50">
            <img 
              src={logoUrl} 
              alt={shopName}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Shop Name */}
          <h2 className="text-2xl font-extrabold text-gray-900 mb-1">{shopName}</h2>
          <p className="text-sm text-gray-400 font-medium mb-6">Best food in town</p>

          {/* Info Cards */}
          <div className="w-full space-y-3 mb-8">
            <div className="bg-gray-50 p-4 rounded-2xl flex items-center gap-4 text-left">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-gray-900 shrink-0">
                <MapPin size={20} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Address</p>
                <p className="text-sm font-bold text-gray-800 leading-tight">{address}</p>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-2xl flex items-center gap-4 text-left">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-gray-900 shrink-0">
                <Phone size={20} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Phone</p>
                <p className="text-sm font-bold text-gray-800 leading-tight">{phone}</p>
              </div>
            </div>
          </div>

          {/* Social Media Buttons (Dynamic) */}
          <div className="flex gap-4 justify-center w-full">
            
            {settings?.showFacebook && settings.facebook && (
              <a 
                href={settings.facebook} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex-1 py-3 bg-blue-50 text-blue-600 rounded-2xl flex flex-col items-center justify-center gap-1 hover:bg-blue-100 transition"
              >
                <Facebook size={24} />
                <span className="text-xs font-bold">Facebook</span>
              </a>
            )}

            {settings?.showInstagram && settings.instagram && (
              <a 
                href={settings.instagram} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex-1 py-3 bg-pink-50 text-pink-600 rounded-2xl flex flex-col items-center justify-center gap-1 hover:bg-pink-100 transition"
              >
                <Instagram size={24} />
                <span className="text-xs font-bold">Instagram</span>
              </a>
            )}

            {settings?.showTelegram && settings.telegram && (
              <a 
                href={settings.telegram} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex-1 py-3 bg-sky-50 text-sky-500 rounded-2xl flex flex-col items-center justify-center gap-1 hover:bg-sky-100 transition"
              >
                <Send size={24} />
                <span className="text-xs font-bold">Telegram</span>
              </a>
            )}

          </div>
          
          {/* Show message if no socials are active */}
          {!settings?.showFacebook && !settings?.showInstagram && !settings?.showTelegram && (
             <p className="text-xs text-gray-300 mt-2">No social media links available</p>
          )}

        </div>
      </div>
    </div>
  );
}