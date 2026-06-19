import React from 'react';
import { 
  Store, ChevronUp, ChevronDown, Check, Clock, UploadCloud, 
  CheckCircle, Palette, Lock, Menu, ImageIcon, Info, Plus, 
  Share2, Trash2, Bell, Hash, Send, ChevronLeft, ChevronRight, 
  Settings, MessageCircle, Bug, Lightbulb, BookOpen, PlayCircle, 
  Activity, Phone 
} from 'lucide-react';
import LazyImage from "@/components/ui/LazyImage";

export interface SocialLink { 
  id: string; 
  platform: string; 
  url: string; 
  active: boolean; 
}

interface SettingsTabProps {
  openSection: string | null;
  handleSectionClick: (section: string) => void;
  onIdentitySubmit: (e?: React.FormEvent) => void;
  previewNameEn: string;
  setPreviewNameEn: (val: string) => void;
  previewNameKh: string;
  setPreviewNameKh: (val: string) => void;
  previewDisplay: string;
  setPreviewDisplay: (val: string) => void;
  printerUrl: string;
  setPrinterUrl: (val: string) => void;
  address: string;
  setAddress: (val: string) => void;
  phone: string;
  setPhone: (val: string) => void;
  is24Hours: boolean;
  setIs24Hours: (val: boolean) => void;
  openTime: string;
  setOpenTime: (val: string) => void;
  closeTime: string;
  setCloseTime: (val: string) => void;
  qrImagePreview: string;
  qrInputRef: any; 
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>, target: any) => void;
  setQrImagePreview: (val: string) => void;
  setQrFileBlob: (val: Blob | null) => void;
  setRemoveQr: (val: boolean) => void;
  markDirty: (section: string) => void;
  dirtySections: Record<string, boolean>;
  onBrandingSubmit: (e?: React.FormEvent) => void;
  headerDesign: string;
  allDesigns: string[];
  isCurrentDesignLocked: boolean;
  setHeaderDesign: (val: string) => void;
  handlePrevDesign: (e?: React.MouseEvent) => void;
  handleNextDesign: (e?: React.MouseEvent) => void;
  themeColorPreview: string;
  getShopNamePreview: () => string;
  isNoBg: boolean;
  logoPreview: string;
  fallbackLogo: string;
  logoInputRef: any; 
  logoFileBlob: Blob | null;
  setLogoType: (val: string) => void;
  logoType: string;
  setThemeColorPreview: (val: string) => void;
  cancelLogoChange: () => void;
  clearDirty: (section: string) => void;
  optBanners: any[];
  draggedBannerIndex: number | null;
  handleDragStart: (e: React.DragEvent, index: number) => void;
  handleDragOver: (e: React.DragEvent, index: number) => void;
  handleDrop: (e: React.DragEvent, dropIndex: number) => void;
  handleMoveBanner: (index: number, direction: number) => void;
  dispatchOptBanners: (action: any) => void;
  deleteBanner: (fd: FormData) => void;
  showToast: (msg: string) => void;
  bannerInputRef: any; 
  safeLimits: any;
  onSocialsSubmit: (e?: React.FormEvent) => void;
  canUseCustomSocials: boolean;
  socialLinks: SocialLink[];
  getPlatformIcon: (platform: string) => React.ReactNode;
  updateSocialLink: (id: string, field: keyof SocialLink, value: any) => void;
  removeSocialLink: (id: string) => void;
  addSocialLink: () => void;
  onNotificationsSubmit: (e?: React.FormEvent) => void;
  canUseTelegram: boolean;
  isStaffEnabled: boolean;
  setIsStaffEnabled: (val: boolean) => void;
  tgChatId: string;
  setTgChatId: (val: string) => void;
  handleTestTelegram: (type: any, topicId?: string) => void;
  isTestingTg: boolean;
  tgStaffCallTopicId: string;
  setTgStaffCallTopicId: (val: string) => void;
  tgNewOrderTopicId: string;
  setTgNewOrderTopicId: (val: string) => void;
  startTransition: any;
  isDirtyLogo: boolean; 
  setIsDirtyLogo: (val: boolean) => void;
  setLogoFileBlobAction: (val: Blob | null) => void;
  isFreePlan: boolean; 
  settings: any; 
}

export default function SettingsTab({
  openSection, handleSectionClick, onIdentitySubmit, previewNameEn, setPreviewNameEn,
  previewNameKh, setPreviewNameKh, previewDisplay, setPreviewDisplay, printerUrl,
  setPrinterUrl, address, setAddress, phone, setPhone, is24Hours, setIs24Hours,
  openTime, setOpenTime, closeTime, setCloseTime, qrImagePreview, qrInputRef,
  onFileSelect, setQrImagePreview, setQrFileBlob, setRemoveQr, markDirty, dirtySections,
  onBrandingSubmit, headerDesign, allDesigns, isCurrentDesignLocked, setHeaderDesign,
  handlePrevDesign, handleNextDesign, themeColorPreview, getShopNamePreview, isNoBg,
  logoPreview, fallbackLogo, logoInputRef, logoFileBlob, setLogoType, logoType,
  setThemeColorPreview, cancelLogoChange, clearDirty, optBanners, 
  draggedBannerIndex,
  handleDragStart, handleDragOver, handleDrop, handleMoveBanner, dispatchOptBanners, deleteBanner,
  showToast, bannerInputRef, safeLimits, onSocialsSubmit, canUseCustomSocials,
  socialLinks, getPlatformIcon, updateSocialLink, removeSocialLink, addSocialLink,
  onNotificationsSubmit, canUseTelegram, isStaffEnabled, setIsStaffEnabled, tgChatId,
  setTgChatId, handleTestTelegram, isTestingTg, tgStaffCallTopicId, setTgStaffCallTopicId,
  tgNewOrderTopicId, setTgNewOrderTopicId, startTransition, 
  setIsDirtyLogo, setLogoFileBlobAction,
  isDirtyLogo, isFreePlan, settings 
}: SettingsTabProps) {
  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12 print:hidden">
      
      {/* 1. BASIC INFORMATION */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
        <button onClick={() => handleSectionClick('identity')} className="w-full flex justify-between items-center p-5 hover:bg-gray-50 transition-colors">
           <div className="flex gap-4 items-center">
             <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl"><Store size={20}/></div>
             <div className="text-left"><h3 className="font-bold text-gray-900 text-base">Basic Information</h3><p className="text-xs text-gray-500 mt-0.5">Name, display preferences, and contact info</p></div>
           </div>
           {openSection === 'identity' ? <ChevronUp className="text-gray-400"/> : <ChevronDown className="text-gray-400"/>}
        </button>
        <div className={openSection === 'identity' ? 'block' : 'hidden'}>
          <form onSubmit={onIdentitySubmit} className="p-6 border-t border-gray-100 space-y-6">
            <div className="space-y-4">
              <div><label className="block text-sm font-semibold text-gray-800 mb-1.5">Shop Name (English)</label><input name="name" value={previewNameEn} onChange={e => { setPreviewNameEn(e.target.value); markDirty('identity'); }} placeholder="e.g. Banlung City" className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-colors text-[16px] md:text-sm text-gray-900 placeholder:text-gray-400 shadow-sm"/></div>
              <div><label className="block text-sm font-semibold text-gray-800 mb-1.5">Shop Name (Local)</label><input name="name_kh" value={previewNameKh} onChange={e => { setPreviewNameKh(e.target.value); markDirty('identity'); }} placeholder="e.g. បានលុង ស៊ីធី" className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-colors text-[16px] md:text-sm text-gray-900 placeholder:text-gray-400 shadow-sm"/></div>
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">How should we display your name?</label>
                <div className="flex flex-col sm:flex-row gap-3">
                  {[{ id: 'EN', label: 'English' }, { id: 'KH', label: 'Local (Khmer)' }, { id: 'BOTH', label: 'Both' }].map((option) => (
                    <label key={option.id} className={`relative flex-1 flex items-center justify-center py-3 px-2 rounded-xl border-2 cursor-pointer transition-all ${previewDisplay === option.id ? 'border-gray-900 bg-gray-900/5 shadow-sm' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                      <input type="radio" name="nameDisplay" value={option.id} checked={previewDisplay === option.id} onChange={(e) => { setPreviewDisplay(e.target.value); markDirty('identity'); }} className="sr-only" />
                      <div className="flex items-center gap-2"><div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${previewDisplay === option.id ? 'border-gray-900 bg-gray-900' : 'border-gray-300 bg-transparent'}`}>{previewDisplay === option.id && <Check size={10} strokeWidth={4} className="text-white" />}</div><span className={`text-xs sm:text-sm font-semibold text-center ${previewDisplay === option.id ? 'text-gray-900' : 'text-gray-600'}`}>{option.label}</span></div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <hr className="border-gray-100" />
            <div className="space-y-4">
              <div><label className="block text-sm font-semibold text-gray-800 mb-1.5">Shop Address</label><input name="address" value={address} onChange={e => { setAddress(e.target.value); markDirty('identity'); }} placeholder="e.g. Street 123, Phnom Penh" className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-colors text-[16px] md:text-sm text-gray-900 placeholder:text-gray-400 shadow-sm"/></div>
              <div><label className="block text-sm font-semibold text-gray-800 mb-1.5">Phone Number</label><input name="phone" value={phone} onChange={e => { setPhone(e.target.value); markDirty('identity'); }} placeholder="e.g. 012 345 678" className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-colors text-[16px] md:text-sm text-gray-900 placeholder:text-gray-400 shadow-sm"/></div>
              <div className="pt-2">
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-semibold text-gray-800">Operating Hours</label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={is24Hours} onChange={(e) => { setIs24Hours(e.target.checked); markDirty('identity'); }} className="w-4 h-4 cursor-pointer accent-gray-900" />
                    <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">Open 24 Hours</span>
                  </label>
                </div>
                <div className={`flex flex-col sm:flex-row sm:items-end gap-3 transition-opacity ${is24Hours ? 'opacity-50 pointer-events-none' : ''}`}>
                  <div className="relative w-full sm:flex-1"><label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Opening Time</label><div className="relative"><Clock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" /><input type="time" disabled={is24Hours} value={openTime} onChange={(e) => { setOpenTime(e.target.value); markDirty('identity'); }} className="w-full pl-9 pr-4 py-3 bg-white border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-colors text-[16px] md:text-sm text-gray-900 shadow-sm cursor-pointer disabled:bg-gray-50"/></div></div>
                  <span className="hidden sm:block text-gray-400 font-medium text-sm text-center mb-3.5">to</span>
                  <div className="relative w-full sm:flex-1"><label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Closing Time</label><div className="relative"><Clock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" /><input type="time" disabled={is24Hours} value={closeTime} onChange={(e) => { setCloseTime(e.target.value); markDirty('identity'); }} className="w-full pl-9 pr-4 py-3 bg-white border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-colors text-[16px] md:text-sm text-gray-900 shadow-sm cursor-pointer disabled:bg-gray-50"/></div></div>
                </div>
                <p className="text-xs text-gray-500 mt-2 ml-1">This will be displayed on your customer menu.</p>
              </div>
            </div>
            
            <hr className="border-gray-100" />
            <div>
               <div className="mb-4">
                 <h4 className="text-sm font-semibold text-gray-800">Shop Payment QR</h4>
                 <p className="text-xs text-gray-500 mt-1">Upload your bank or payment QR code so customers can easily scan to pay.</p>
               </div>
               <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div 
                    onClick={() => qrInputRef.current?.click()}
                    className={`w-32 h-32 rounded-2xl border-2 border-dashed flex items-center justify-center cursor-pointer transition-all overflow-hidden relative group shrink-0 ${qrImagePreview ? 'border-gray-200 bg-white' : 'border-gray-300 bg-gray-50 hover:bg-gray-100'}`}
                  >
                    {qrImagePreview ? (
                      <>
                        <LazyImage src={qrImagePreview} alt="QR Code" className="w-full h-full object-contain p-2" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"><span className="text-white text-xs font-bold">Change</span></div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center text-gray-400 gap-1.5"><UploadCloud size={24} strokeWidth={1.5} /><span className="text-[10px] font-bold uppercase tracking-wider">Upload QR</span></div>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                     <button type="button" onClick={() => qrInputRef.current?.click()} className="text-[16px] md:text-sm font-semibold bg-white border border-gray-300 px-4 py-2.5 rounded-xl shadow-sm hover:bg-gray-50 transition-all text-gray-700 w-max">Choose Image</button>
                     {qrImagePreview && (
                       <button type="button" onClick={() => { setQrImagePreview(''); setQrFileBlob(null); setRemoveQr(true); markDirty('identity'); }} className="text-[16px] md:text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 px-4 py-2.5 rounded-xl transition-all w-max">Remove QR</button>
                     )}
                  </div>
               </div>
               <input type="file" accept="image/*" ref={qrInputRef} onChange={(e) => onFileSelect(e, 'qr')} className="hidden" />
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-100">
               <button type="submit" disabled={!dirtySections['identity']} className="bg-gray-900 text-white px-6 py-3 rounded-xl font-semibold text-[16px] md:text-sm shadow-sm flex items-center justify-center gap-2 hover:bg-gray-800 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed w-full sm:w-auto"><CheckCircle size={16}/>{dirtySections['identity'] ? 'Save Changes' : 'Saved'}</button>
            </div>
          </form>
        </div>
      </div>

      {/* 2. BRANDING & DESIGN */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden mt-6">
        <button onClick={() => handleSectionClick('branding')} className="w-full flex justify-between items-center p-5 hover:bg-gray-50 transition-colors">
           <div className="flex gap-4 items-center"><div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl"><Palette size={20}/></div><div className="text-left"><h3 className="font-bold text-gray-900 text-base">Branding & Design</h3><p className="text-xs text-gray-500 mt-0.5">Customize how your menu looks</p></div></div>
           {openSection === 'branding' ? <ChevronUp className="text-gray-400"/> : <ChevronDown className="text-gray-400"/>}
        </button>
        <div className={openSection === 'branding' ? 'block' : 'hidden'}>
          <form onSubmit={onBrandingSubmit} className="p-6 border-t border-gray-100 space-y-6">
             <div className="space-y-4">
                <div className="flex justify-between items-center"><label className="block text-sm font-semibold text-gray-800">Menu Header Style</label><span className="text-[10px] font-bold bg-gray-100 text-gray-600 px-2 py-1 rounded-md uppercase tracking-wider">{headerDesign.replace('design', 'Design ')}</span></div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {allDesigns.map((designKey, idx) => {
                    const isLocked = isFreePlan && idx > 3 && designKey !== safeLimits.overrideHeaderStyle;
                    const isSelected = headerDesign === designKey;
                    return (
                      <div key={designKey} onClick={() => { if (!isLocked) { setHeaderDesign(designKey); markDirty('branding'); } }} className={`relative h-20 rounded-xl border-2 flex items-center justify-center overflow-hidden transition-all ${isSelected ? 'border-gray-900 shadow-md scale-[1.02]' : 'border-gray-200 hover:border-gray-300'} ${isLocked ? 'cursor-not-allowed opacity-70 bg-gray-50' : 'cursor-pointer bg-white'}`}>
                        <span className="text-xs font-semibold text-gray-500 relative z-10">{designKey.replace('design', 'Style ')}</span>
                        {isLocked && <div className="absolute top-1.5 right-1.5 bg-gray-900/60 backdrop-blur-md text-white rounded-full p-1 shadow-sm z-20"><Lock size={10} /></div>}
                        {isSelected && !isLocked && <div className="absolute top-1 right-1 bg-gray-900 text-white rounded-full p-0.5"><Check size={10} strokeWidth={4} /></div>}
                      </div>
                    );
                  })}
                </div>

                <div className={`w-full relative z-0 overflow-hidden rounded-2xl border ${isCurrentDesignLocked ? 'border-gray-300' : 'border-gray-200'} shadow-sm group`}>
                   <button type="button" onClick={handlePrevDesign} className="absolute left-2 top-1/2 -translate-y-1/2 z-40 p-2 bg-white/20 backdrop-blur text-white rounded-full shadow-md hover:bg-white/30 transition-all opacity-100 active:scale-95"><ChevronLeft size={18}/></button>
                   <button type="button" onClick={handleNextDesign} className="absolute right-2 top-1/2 -translate-y-1/2 z-40 p-2 bg-white/20 backdrop-blur text-white rounded-full shadow-md hover:bg-white/30 transition-all opacity-100 active:scale-95"><ChevronRight size={18}/></button>
                   {!isCurrentDesignLocked && <div className="absolute top-3 left-1/2 -translate-x-1/2 z-40 pointer-events-none flex justify-center w-max"><span className="bg-black/40 backdrop-blur-md text-white text-[11px] font-medium tracking-wide px-4 py-1.5 rounded-full shadow-sm border border-white/20 block whitespace-nowrap font-sans">Tap arrows to change layout</span></div>}
                   {isCurrentDesignLocked && <div className="absolute top-3 right-3 z-40 pointer-events-none"><div className="bg-gray-900/80 backdrop-blur-md text-white px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm border border-white/10"><Lock size={12} className="text-amber-400" /><span className="text-[10px] font-bold tracking-wider uppercase">Locked</span></div></div>}
                   <header onClick={handleNextDesign} className={`relative overflow-hidden transition-colors duration-300 min-h-[140px] cursor-pointer`} style={{ background: themeColorPreview }}>
                      <div className="absolute inset-0 bg-black/10 z-0 pointer-events-none" />
                      <div className="absolute inset-0 pointer-events-none z-0 opacity-30" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E")` }} />
                      <div className="absolute pointer-events-none z-0" style={{ top: -20, left: '50%', transform: 'translateX(-50%)', width: 300, height: 200, background: 'radial-gradient(ellipse, rgba(255,255,255,0.2) 0%, transparent 70%)' }} />
                      <div className="relative z-10 flex flex-col h-full w-full pointer-events-none">
                         {headerDesign !== 'design6' && <div className="absolute top-2 left-4 z-20 pointer-events-none"><div className="p-1.5 sm:p-2 rounded-xl bg-white/20 backdrop-blur-md border border-white/30 text-white shadow-sm flex items-center justify-center"><Menu size={20} strokeWidth={2.5}/></div></div>}
                         <div className={`flex items-center justify-center px-4 pb-2 w-full h-full pointer-events-none ${headerDesign === 'design6' ? 'pt-6' : 'pt-12'}`}>
                            {headerDesign === 'design2' ? <h1 className="text-white tracking-wide text-center text-2xl font-bold drop-shadow-sm font-sans leading-relaxed pt-1 line-clamp-2 w-full">{getShopNamePreview()}</h1> : headerDesign === 'design3' ? <div className="flex flex-col items-center gap-3 max-w-full"><div className={`flex-shrink-0 relative group/logo pointer-events-auto cursor-pointer flex items-center justify-center ${isNoBg ? 'w-16 h-16 overflow-hidden rounded-2xl' : 'rounded-full overflow-hidden bg-white w-16 h-16 shadow-xl p-0.5'}`} onClick={(e) => { e.stopPropagation(); logoInputRef.current?.click(); }}><LazyImage src={logoPreview || fallbackLogo} alt="Logo" className={`w-full h-full ${isNoBg ? 'object-contain' : 'object-cover rounded-[14px]'}`} /><div className={`absolute inset-0 bg-black/40 opacity-0 group-hover/logo:opacity-100 flex items-center justify-center transition-opacity ${isNoBg ? 'rounded-[14px]' : 'rounded-[14px]'}`}><span className="text-white text-[10px] font-bold">Edit</span></div></div><h1 className="text-white tracking-wide text-center text-xl font-bold drop-shadow-sm font-sans leading-relaxed pt-1 line-clamp-2 break-words w-full">{getShopNamePreview()}</h1></div> : headerDesign === 'design4' ? <div className="flex items-center justify-center gap-3 max-w-full"><div className={`flex-shrink-0 relative group/logo pointer-events-auto cursor-pointer flex items-center justify-center ${isNoBg ? 'w-14 h-14 overflow-hidden rounded-full' : 'rounded-full overflow-hidden bg-white w-14 h-14 shadow-lg p-0.5'}`} onClick={(e) => { e.stopPropagation(); logoInputRef.current?.click(); }}><LazyImage src={logoPreview || fallbackLogo} alt="Logo" className={`w-full h-full ${isNoBg ? 'object-contain' : 'object-cover rounded-full'}`} /><div className={`absolute inset-0 bg-black/40 opacity-0 group-hover/logo:opacity-100 flex items-center justify-center transition-opacity ${isNoBg ? 'rounded-full' : 'rounded-full'}`}><span className="text-white text-[10px] font-bold">Edit</span></div></div><h1 className="text-white tracking-wide text-left text-xl font-bold drop-shadow-sm font-sans leading-relaxed pt-1 line-clamp-2 break-words flex-1">{getShopNamePreview()}</h1></div> : headerDesign === 'design5' ? <div className="flex flex-col items-center justify-center w-full max-w-full">{(logoPreview || settings?.logo) ? (<div className={`flex-shrink-0 relative group/logo pointer-events-auto cursor-pointer flex items-center justify-center ${isNoBg ? 'w-20 h-20 overflow-hidden rounded-2xl' : 'rounded-2xl overflow-hidden bg-white w-20 h-20 shadow-xl p-0.5'}`} onClick={(e) => { e.stopPropagation(); logoInputRef.current?.click(); }}><LazyImage src={logoPreview || fallbackLogo} alt="Logo" className={`w-full h-full ${isNoBg ? 'object-contain' : 'object-cover rounded-[14px]'}`} /><div className={`absolute inset-0 bg-black/40 opacity-0 group-hover/logo:opacity-100 flex items-center justify-center transition-opacity ${isNoBg ? 'rounded-[14px]' : 'rounded-[14px]'}`}><span className="text-white text-[10px] font-bold">Edit</span></div></div>) : (<h1 className="text-white tracking-wide text-center text-xl font-bold drop-shadow-sm font-sans leading-relaxed pt-1 line-clamp-2 break-words w-full cursor-pointer pointer-events-auto" onClick={(e) => { e.stopPropagation(); logoInputRef.current?.click(); }}>{getShopNamePreview()}</h1>)}</div> : headerDesign === 'design7' ? <div className="flex flex-col items-center justify-center w-full max-w-full">{(logoPreview || settings?.logo) ? (<div className={`flex-shrink-0 relative group/logo pointer-events-auto cursor-pointer flex items-center justify-center ${isNoBg ? 'w-20 h-20 overflow-hidden rounded-full' : 'rounded-full overflow-hidden bg-white w-20 h-20 shadow-xl p-0.5'}`} onClick={(e) => { e.stopPropagation(); logoInputRef.current?.click(); }}><LazyImage src={logoPreview || fallbackLogo} alt="Logo" className={`w-full h-full ${isNoBg ? 'object-contain' : 'object-cover rounded-full'}`} /><div className={`absolute inset-0 bg-black/40 opacity-0 group-hover/logo:opacity-100 flex items-center justify-center transition-opacity ${isNoBg ? 'rounded-full' : 'rounded-full'}`}><span className="text-white text-[10px] font-bold">Edit</span></div></div>) : (<h1 className="text-white tracking-wide text-center text-xl font-bold drop-shadow-sm font-sans leading-relaxed pt-1 line-clamp-2 break-words w-full cursor-pointer pointer-events-auto" onClick={(e) => { e.stopPropagation(); logoInputRef.current?.click(); }}>{getShopNamePreview()}</h1>)}</div> : headerDesign === 'design6' ? <div className="flex items-center justify-between w-full max-w-full gap-3 mt-[-20px]"><div className={`flex-shrink-0 relative group/logo pointer-events-auto cursor-pointer flex items-center justify-center ${isNoBg && (logoPreview || settings?.logo) ? 'w-10 h-10 overflow-hidden rounded-full' : 'rounded-full overflow-hidden bg-white w-10 h-10 shadow-sm p-0.5'}`} onClick={(e) => { e.stopPropagation(); logoInputRef.current?.click(); }}>{(logoPreview || settings?.logo) ? (<LazyImage src={logoPreview || fallbackLogo} alt="Logo" className={`w-full h-full ${isNoBg ? 'object-contain' : 'object-cover rounded-full'}`} />) : (<div className="w-full h-full bg-gray-200 rounded-full flex items-center justify-center text-gray-500 font-bold text-xs">{getShopNamePreview().charAt(0).toUpperCase()}</div>)}<div className={`absolute inset-0 bg-black/40 opacity-0 group-hover/logo:opacity-100 flex items-center justify-center transition-opacity ${isNoBg ? 'rounded-full' : 'rounded-full'}`}><span className="text-white text-[8px] font-bold">Edit</span></div></div><h1 className="text-white tracking-wide text-center text-lg font-bold drop-shadow-sm font-sans leading-relaxed line-clamp-1 flex-1 break-words">{getShopNamePreview()}</h1><div className="p-1.5 rounded-xl bg-white/20 backdrop-blur-md border border-white/30 text-white shadow-sm flex items-center justify-center"><Menu size={16} strokeWidth={2.5}/></div></div> : <div className="flex flex-col items-center gap-2 max-w-full"><div className={`flex-shrink-0 relative group/logo pointer-events-auto cursor-pointer flex items-center justify-center ${isNoBg ? 'w-16 h-16 overflow-hidden rounded-full' : 'rounded-full overflow-hidden bg-white w-16 h-16 shadow-lg p-0.5'}`} onClick={(e) => { e.stopPropagation(); logoInputRef.current?.click(); }}><LazyImage src={logoPreview || fallbackLogo} alt="Logo" className={`w-full h-full ${isNoBg ? 'object-contain' : 'object-cover rounded-full'}`} /><div className={`absolute inset-0 bg-black/40 opacity-0 group-hover/logo:opacity-100 flex items-center justify-center transition-opacity ${isNoBg ? 'rounded-full' : 'rounded-full'}`}><span className="text-white text-[10px] font-bold">Edit</span></div></div><h1 className="text-white tracking-wide text-center text-xl font-bold drop-shadow-sm font-sans leading-relaxed pt-1 line-clamp-2 break-words w-full">{getShopNamePreview()}</h1></div>}
                               </div>
                            </div>
                         </header>
                      </div>
                      
                      <input type="hidden" name="headerDesign" value={headerDesign} />
                      <div className="flex justify-center pt-2">
                         <div className="flex items-center gap-3 flex-wrap">
                            <button type="button" onClick={() => logoInputRef.current?.click()} className="text-[16px] md:text-sm font-semibold bg-white border border-gray-300 px-6 py-2.5 rounded-xl shadow-sm hover:bg-gray-50 flex items-center gap-2 text-gray-700 active:scale-95 transition-all"><ImageIcon size={16}/> {logoPreview ? 'Change Logo Image' : 'Upload Logo Image'}</button>
                            {isDirtyLogo && <button type="button" onClick={() => { cancelLogoChange(); clearDirty('branding'); }} className="text-[16px] md:text-sm font-semibold text-red-600 bg-red-50 px-6 py-2.5 rounded-xl hover:bg-red-100 active:scale-95 transition-all">Cancel</button>}
                         </div>
                      </div>
                      <input type="file" accept="image/*" ref={logoInputRef} onChange={(e) => onFileSelect(e, 'logo')} className="hidden"/> 

                      {logoFileBlob && (
                        <div className="mt-8 border-t border-gray-100 pt-6 animate-in fade-in slide-in-from-bottom-4">
                           <div className="mb-4"><h4 className="text-sm font-bold text-gray-900">Logo Style</h4><p className="text-xs text-gray-500 mt-1">Not sure? Choose "Without background" if your logo does not have a box or colored background behind it.</p></div>
                           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                              <button type="button" onClick={() => { setLogoType('withBackground'); markDirty('branding'); }} className={`p-4 rounded-2xl border-2 text-left transition-all ${logoType === 'withBackground' ? 'border-gray-900 bg-gray-50 shadow-sm' : 'border-gray-200 hover:border-gray-300 bg-white'}`}><div className="flex items-center justify-between mb-2"><span className={`font-bold text-sm ${logoType === 'withBackground' ? 'text-gray-900' : 'text-gray-700'}`}>With background</span><div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${logoType === 'withBackground' ? 'border-gray-900 bg-gray-900' : 'border-gray-300 bg-transparent'}`}>{logoType === 'withBackground' && <Check size={10} strokeWidth={4} className="text-white" />}</div></div><p className="text-xs text-gray-500">Best for QR, print, and strong visibility</p></button>
                              <button type="button" onClick={() => { setLogoType('withoutBackground'); markDirty('branding'); }} className={`p-4 rounded-2xl border-2 text-left transition-all ${logoType === 'withoutBackground' ? 'border-gray-900 bg-gray-50 shadow-sm' : 'border-gray-200 hover:border-gray-300 bg-white'}`}><div className="flex items-center justify-between mb-2"><span className={`font-bold text-sm ${logoType === 'withoutBackground' ? 'text-gray-900' : 'text-gray-700'}`}>Without background</span><div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${logoType === 'withoutBackground' ? 'border-gray-900 bg-gray-900' : 'border-gray-300 bg-transparent'}`}>{logoType === 'withoutBackground' && <Check size={10} strokeWidth={4} className="text-white" />}</div></div><p className="text-xs text-gray-500">Best for website headers and flexible layouts</p></button>
                           </div>
                        </div>
                      )}
                   </div>

                   <div className="space-y-2">
                      <div className="flex justify-between items-center"><label className="block text-sm font-semibold text-gray-800">Theme Color</label></div>
                      <div className="flex items-center gap-4"><input name="themeColor" type="color" value={themeColorPreview} onChange={(e) => { setThemeColorPreview(e.target.value); markDirty('branding'); }} className="h-12 w-16 rounded-xl bg-white p-1 border border-gray-300 shadow-sm cursor-pointer"/><span className="text-sm font-mono text-gray-500 uppercase">{themeColorPreview}</span></div>
                   </div>
                   <div className="flex justify-end pt-4">
                       <button type="submit" disabled={!dirtySections['branding'] || isCurrentDesignLocked} className="bg-gray-900 text-white px-6 py-3 rounded-xl font-semibold text-[16px] md:text-sm shadow-sm flex items-center justify-center gap-2 hover:bg-gray-800 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed w-full sm:w-auto"><CheckCircle size={16}/> {isCurrentDesignLocked ? 'Locked' : (dirtySections['branding'] ? 'Save Design' : 'Saved')}</button>
                   </div>
                </form>
              </div>
            </div>

      {/* 3. PROMOTIONAL BANNERS */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden mt-6">
        <button onClick={() => handleSectionClick('banners')} className="w-full flex justify-between items-center p-5 hover:bg-gray-50 transition-colors">
           <div className="flex gap-4 items-center"><div className="p-2.5 bg-yellow-50 text-yellow-600 rounded-xl"><ImageIcon size={20}/></div><div className="text-left"><h3 className="font-bold text-gray-900 text-base">Promotional Banners</h3><p className="text-xs text-gray-500 mt-0.5">Add sliding banners to your menu</p></div></div>
           {openSection === 'banners' ? <ChevronUp className="text-gray-400"/> : <ChevronDown className="text-gray-400"/>}
        </button>
        <div className={openSection === 'banners' ? 'block' : 'hidden'}>
          <div className="p-6 border-t border-gray-100 space-y-4">
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
               {optBanners.map((b, index) => (
                 <div key={b.id} draggable onDragStart={(e) => handleDragStart(e, index)} onDragOver={(e) => handleDragOver(e, index)} onDrop={(e) => handleDrop(e, index)} className={`relative w-full aspect-[16/9] rounded-2xl overflow-hidden border ${draggedBannerIndex === index ? 'border-gray-900 opacity-50' : 'border-gray-200'} shadow-sm group bg-gray-50 flex items-center justify-center cursor-move`}>
                   <LazyImage src={b.image} className="w-full h-full object-contain pointer-events-none" alt="Banner" />
                   <div className="absolute top-2 left-2 flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"><button type="button" onClick={() => handleMoveBanner(index, -1)} disabled={index === 0} className="p-1.5 bg-white/90 text-gray-600 rounded-lg shadow-sm hover:bg-white disabled:opacity-50 backdrop-blur-sm active:scale-95"><ChevronUp size={14}/></button><button type="button" onClick={() => handleMoveBanner(index, 1)} disabled={index === optBanners.length - 1} className="p-1.5 bg-white/90 text-gray-600 rounded-lg shadow-sm hover:bg-white disabled:opacity-50 backdrop-blur-sm active:scale-95"><ChevronDown size={14}/></button></div>
                   <form action={(fd) => { startTransition(async () => { dispatchOptBanners({ type: 'delete', payload: b.id }); await deleteBanner(fd); showToast("Banner deleted"); }); }}><input type="hidden" name="id" value={b.id} /><button type="submit" className="absolute top-2 right-2 p-1.5 bg-red-500/90 text-white rounded-lg opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity backdrop-blur-sm active:scale-95 hover:bg-red-600"><Trash2 size={14}/></button></form>
                 </div>
               ))}
             </div>
             {optBanners.length >= safeLimits.maxBanners && <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl flex gap-3 my-2"><Info className="text-blue-500 shrink-0" size={20}/><div className="text-xs text-blue-700 leading-relaxed"><p className="font-black mb-1 uppercase tracking-tight">Banner Limit Reached</p><p>Your current plan allows for {safeLimits.maxBanners} active banner. Upgrade to add more promotions.</p></div></div>}
             <button type="button" onClick={() => bannerInputRef.current?.click()} disabled={optBanners.length >= safeLimits.maxBanners} className="w-full py-4 bg-gray-50 border border-dashed border-gray-300 rounded-2xl text-gray-600 font-semibold text-[16px] md:text-sm hover:border-gray-400 hover:bg-gray-100 transition-all flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"><Plus size={16}/> Upload New Banner</button>
             <input type="file" accept="image/*" ref={bannerInputRef} onChange={(e) => onFileSelect(e, 'banner')} className="hidden" />
          </div>
        </div>
      </div>

      {/* 4. SOCIAL MEDIA LINKS */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden mt-6">
        <button onClick={() => handleSectionClick('socials')} className="w-full flex justify-between items-center p-5 hover:bg-gray-50 transition-colors">
           <div className="flex gap-4 items-center"><div className="p-2.5 bg-pink-50 text-pink-600 rounded-xl"><Share2 size={20}/></div><div className="text-left flex items-center gap-2"><h3 className="font-bold text-gray-900 text-base">Social Media Links</h3>{!canUseCustomSocials && <Lock size={12} className="text-gray-300"/>}</div></div>
           {openSection === 'socials' ? <ChevronUp className="text-gray-400"/> : <ChevronDown className="text-gray-400"/>}
        </button>
        <div className={openSection === 'socials' ? 'block' : 'hidden'}>
          {!canUseCustomSocials ? (
            <div className="bg-gray-50 border-t border-dashed border-gray-200 p-8 text-center"><Share2 className="mx-auto text-gray-300 mb-3" size={32}/><p className="text-sm font-bold text-gray-600">Social Links Locked</p><p className="text-[11px] text-gray-400 mt-1 leading-relaxed max-w-xs mx-auto">Connect Facebook, Instagram, and Telegram to your menu with a PRO plan.</p></div>
          ) : (
            <form onSubmit={onSocialsSubmit} className="p-6 border-t border-gray-100 space-y-4">
              {socialLinks.map((link) => (
                <div key={link.id} className="flex flex-col sm:flex-row gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-200 animate-in slide-in-from-left-2 shadow-sm"><div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-gray-300 shadow-sm"><span className="text-gray-500">{getPlatformIcon(link.platform)}</span><select value={link.platform} onChange={(e) => updateSocialLink(link.id, 'platform' as keyof SocialLink, e.target.value)} className="bg-transparent text-[16px] md:text-sm font-semibold outline-none cursor-pointer w-24"><option value="facebook">Facebook</option><option value="instagram">Instagram</option><option value="telegram">Telegram</option><option value="youtube">YouTube</option><option value="twitter">Twitter</option><option value="linkedin">LinkedIn</option><option value="website">Website</option></select></div><input value={link.url} onChange={(e) => updateSocialLink(link.id, 'url' as keyof SocialLink, e.target.value)} placeholder="Paste link here..." className="flex-1 px-4 py-2.5 bg-white border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-colors text-[16px] md:text-sm text-gray-900 placeholder:text-gray-400 shadow-sm"/><div className="flex items-center gap-3 justify-end sm:pl-2"><label className="relative inline-flex items-center cursor-pointer"><input type="checkbox" checked={link.active} onChange={(e) => updateSocialLink(link.id, 'active' as keyof SocialLink, e.target.checked)} className="sr-only peer"/><div className="w-11 h-6 bg-gray-300 rounded-full peer peer-checked:bg-gray-900 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full peer-checked:after:border-white shadow-inner"></div></label><button type="button" onClick={() => removeSocialLink(link.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors active:scale-95"><Trash2 size={18}/></button></div></div>
              ))}
              <button type="button" onClick={addSocialLink} className="w-full py-4 bg-white border border-dashed border-gray-300 rounded-2xl text-gray-700 font-semibold text-[16px] md:text-sm hover:border-gray-400 hover:bg-gray-50 transition-all flex items-center justify-center gap-2 active:scale-[0.99] shadow-sm"><Plus size={16}/> Add New Link</button>
              <div className="flex justify-end pt-4"><button type="submit" disabled={!dirtySections['socials']} className="bg-gray-900 text-white px-6 py-3 rounded-xl font-semibold text-[16px] md:text-sm shadow-sm flex items-center justify-center gap-2 hover:bg-gray-800 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed w-full sm:w-auto"><CheckCircle size={16}/> {dirtySections['socials'] ? 'Save Social Links' : 'Saved'}</button></div>
            </form>
          )}
        </div>
      </div>

      {/* 5. STAFF NOTIFICATIONS */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden mt-6">
        <button onClick={() => handleSectionClick('notifications')} className="w-full flex justify-between items-center p-5 hover:bg-gray-50 transition-colors">
           <div className="flex gap-4 items-center"><div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl"><Bell size={20}/></div><div className="text-left"><h3 className="font-bold text-gray-900 text-base">Staff Notifications</h3><p className="text-xs text-gray-500 mt-0.5">Configure Telegram alerts for table requests</p></div></div>
           {openSection === 'notifications' ? <ChevronUp className="text-gray-400"/> : <ChevronDown className="text-gray-400"/>}
        </button>
        <div className={openSection === 'notifications' ? 'block' : 'hidden'}>
          {!canUseTelegram ? (
            <div className="p-8 text-center bg-gray-50 border-t border-dashed border-gray-200"><div className="w-14 h-14 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-3 shadow-inner"><Lock size={24}/></div><p className="text-sm font-bold text-gray-700">Telegram Notifications Locked</p><p className="text-xs text-gray-500 mt-1.5 leading-relaxed max-w-xs mx-auto">Alert Barista via Telegram is not included in your current plan.</p></div>
          ) : (
            <form onSubmit={onNotificationsSubmit} className="p-6 border-t border-gray-100 space-y-6">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-200">
                <div><h4 className="font-bold text-gray-900 text-sm">Enable "Call Staff" Feature</h4><p className="text-xs text-gray-500 mt-1">Allow customers to request assistance from their table.</p></div>
                <label className="relative inline-flex items-center cursor-pointer"><input type="checkbox" checked={isStaffEnabled} onChange={(e) => { setIsStaffEnabled(e.target.checked); markDirty('notifications'); }} className="sr-only peer"/><div className="w-11 h-6 bg-gray-300 rounded-full peer peer-checked:bg-emerald-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full peer-checked:after:border-white shadow-inner"></div></label>
              </div>
              <div className="space-y-4">
                <label className="block text-sm font-semibold text-gray-800">Main Telegram Chat ID</label>
                <div className="flex gap-2"><input type="text" value={tgChatId} onChange={e => { setTgChatId(e.target.value); markDirty('notifications'); }} placeholder="e.g. 123456789" className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors text-[16px] md:text-sm text-gray-900 placeholder:text-gray-400 shadow-sm font-mono"/><button type="button" onClick={() => handleTestTelegram('General')} disabled={isTestingTg || !tgChatId.trim()} className="px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-[16px] md:text-sm rounded-xl transition-colors disabled:opacity-50 shrink-0">Test</button></div>
              </div>
              <div className="pt-4 border-t border-gray-100">
                <div className="mb-4"><h4 className="font-bold text-gray-900 text-sm mb-1">Topic Routing (Optional)</h4></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><label className="block text-xs font-semibold text-gray-800 mb-1.5 flex items-center gap-1.5"><Hash size={12}/> Staff Call Topic ID</label><div className="flex gap-2"><input type="text" value={tgStaffCallTopicId} onChange={e => { setTgStaffCallTopicId(e.target.value); markDirty('notifications'); }} placeholder="e.g. 45" className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors text-[16px] md:text-sm text-gray-900 placeholder:text-gray-400 shadow-sm font-mono"/><button type="button" onClick={() => handleTestTelegram('Staff Call', tgStaffCallTopicId)} disabled={isTestingTg || !tgChatId.trim() || !tgStaffCallTopicId.trim()} className="px-3 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl transition-colors disabled:opacity-50" title="Test Staff Call Topic"><Send size={14}/></button></div></div>
                  <div><label className="block text-xs font-semibold text-gray-800 mb-1.5 flex items-center gap-1.5"><Hash size={12}/> New Order Topic ID</label><div className="flex gap-2"><input type="text" value={tgNewOrderTopicId} onChange={e => { setTgNewOrderTopicId(e.target.value); markDirty('notifications'); }} placeholder="e.g. 99" className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors text-[16px] md:text-sm text-gray-900 placeholder:text-gray-400 shadow-sm font-mono"/><button type="button" onClick={() => handleTestTelegram('New Order', tgNewOrderTopicId)} disabled={isTestingTg || !tgChatId.trim() || !tgNewOrderTopicId.trim()} className="px-3 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl transition-colors disabled:opacity-50" title="Test New Order Topic"><Send size={14}/></button></div></div>
                </div>
              </div>
              <div className="flex justify-end pt-4 border-t border-gray-100"><button type="submit" disabled={!dirtySections['notifications']} className="w-full sm:w-auto bg-gray-900 text-white px-6 py-3 rounded-xl font-semibold text-[16px] md:text-sm shadow-sm flex items-center justify-center gap-2 hover:bg-gray-800 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed"><CheckCircle size={16}/>{dirtySections['notifications'] ? 'Save Notifications' : 'Saved'}</button></div>
            </form>
          )}
        </div>
      </div>

      {/* 6. ADVANCED SETTINGS */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden mt-6">
        <button onClick={() => handleSectionClick('advanced')} className="w-full flex justify-between items-center p-5 hover:bg-gray-50 transition-colors">
           <div className="flex gap-4 items-center">
             <div className="p-2.5 bg-slate-50 text-slate-600 rounded-xl"><Settings size={20}/></div>
             <div className="text-left"><h3 className="font-bold text-gray-900 text-base">Advanced Settings</h3><p className="text-xs text-gray-500 mt-0.5">Local POS integrations and print servers</p></div>
           </div>
           {openSection === 'advanced' ? <ChevronUp className="text-gray-400"/> : <ChevronDown className="text-gray-400"/>}
        </button>
        <div className={openSection === 'advanced' ? 'block' : 'hidden'}>
          <form onSubmit={onIdentitySubmit} className="p-6 border-t border-gray-100 space-y-6">
             <div className="space-y-4">
                <div className="pt-2">
                  <label className="block text-sm font-semibold text-gray-800 mb-1.5">Local Print Server URL (POS)</label>
                  <input name="printerUrl" value={printerUrl} onChange={e => { setPrinterUrl(e.target.value); markDirty('identity'); }} placeholder="e.g. http://192.168.0.10:3001" className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-colors text-[16px] md:text-sm text-gray-900 placeholder:text-gray-400 shadow-sm font-mono"/>
                  <p className="text-xs text-gray-500 mt-1.5">Required for automatic thermal receipt printing.</p>
                </div>
             </div>
             <div className="flex justify-end pt-4 border-t border-gray-100">
               <button type="submit" disabled={!dirtySections['identity']} className="bg-gray-900 text-white px-6 py-3 rounded-xl font-semibold text-[16px] md:text-sm shadow-sm flex items-center justify-center gap-2 hover:bg-gray-800 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed w-full sm:w-auto"><CheckCircle size={16}/>{dirtySections['identity'] ? 'Save Changes' : 'Saved'}</button>
             </div>
          </form>
        </div>
      </div>

      {/* 7. HELP & SUPPORT */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden mt-6">
        <button onClick={() => handleSectionClick('support')} className="w-full flex justify-between items-center p-5 hover:bg-gray-50 transition-colors">
           <div className="flex gap-4 items-center">
             <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl"><Info size={20}/></div>
             <div className="text-left">
               <h3 className="font-bold text-gray-900 text-base">Help & Support</h3>
               <p className="text-xs text-gray-500 mt-0.5">Get help, contact support, report issues, and access documentation.</p>
             </div>
           </div>
           {openSection === 'support' ? <ChevronUp className="text-gray-400"/> : <ChevronDown className="text-gray-400"/>}
        </button>
        <div className={openSection === 'support' ? 'block' : 'hidden'}>
          <div className="p-6 border-t border-gray-100 space-y-3">
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <a href="#" className="flex items-center gap-3 p-4 rounded-2xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors bg-white shadow-sm">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><MessageCircle size={18}/></div>
                  <div className="text-left"><h4 className="font-bold text-gray-900 text-sm">Contact Support</h4><p className="text-[11px] text-gray-500">Reach out to our team</p></div>
                </a>
                <a href="#" className="flex items-center gap-3 p-4 rounded-2xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors bg-white shadow-sm">
                  <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><Phone size={18}/></div>
                  <div className="text-left"><h4 className="font-bold text-gray-900 text-sm">WhatsApp Support</h4><p className="text-[11px] text-gray-500">Chat with us directly</p></div>
                </a>
                <a href="#" className="flex items-center gap-3 p-4 rounded-2xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors bg-white shadow-sm">
                  <div className="p-2 bg-sky-50 text-sky-600 rounded-lg"><Send size={18}/></div>
                  <div className="text-left"><h4 className="font-bold text-gray-900 text-sm">Telegram Support</h4><p className="text-[11px] text-gray-500">Join our community</p></div>
                </a>
                <a href="#" className="flex items-center gap-3 p-4 rounded-2xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors bg-white shadow-sm">
                  <div className="p-2 bg-orange-50 text-orange-600 rounded-lg"><BookOpen size={18}/></div>
                  <div className="text-left"><h4 className="font-bold text-gray-900 text-sm">Documentation</h4><p className="text-[11px] text-gray-500">Read the user guides</p></div>
                </a>
                <a href="#" className="flex items-center gap-3 p-4 rounded-2xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors bg-white shadow-sm">
                  <div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><PlayCircle size={18}/></div>
                  <div className="text-left"><h4 className="font-bold text-gray-900 text-sm">Video Tutorials</h4><p className="text-[11px] text-gray-500">Watch how-to videos</p></div>
                </a>
                <a href="#" className="flex items-center gap-3 p-4 rounded-2xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors bg-white shadow-sm">
                  <div className="p-2 bg-red-50 text-red-600 rounded-lg"><Bug size={18}/></div>
                  <div className="text-left"><h4 className="font-bold text-gray-900 text-sm">Report a Bug</h4><p className="text-[11px] text-gray-500">Help us fix issues</p></div>
                </a>
                <a href="#" className="flex items-center gap-3 p-4 rounded-2xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors bg-white shadow-sm">
                  <div className="p-2 bg-yellow-50 text-yellow-600 rounded-lg"><Lightbulb size={18}/></div>
                  <div className="text-left"><h4 className="font-bold text-gray-900 text-sm">Feature Request</h4><p className="text-[11px] text-gray-500">Suggest new ideas</p></div>
                </a>
                <a href="#" className="flex items-center gap-3 p-4 rounded-2xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors bg-white shadow-sm">
                  <div className="p-2 bg-green-50 text-green-600 rounded-lg"><Activity size={18}/></div>
                  <div className="text-left"><h4 className="font-bold text-gray-900 text-sm">System Status</h4><p className="text-[11px] text-gray-500">Check server health</p></div>
                </a>
             </div>
             
             <div className="mt-4 flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-200">
               <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500"><Settings size={14}/></div>
                 <div>
                   <h4 className="font-bold text-gray-900 text-sm">App Version</h4>
                   <p className="text-[11px] text-gray-500">v0.1.0 (Production)</p>
                 </div>
               </div>
               <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full uppercase tracking-wider">Up to Date</span>
             </div>
          </div>
        </div>
      </div>
      
    </div>
  );
}