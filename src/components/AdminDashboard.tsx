'use client';

import { useState, useRef, useEffect } from 'react';
import { signOut } from "next-auth/react"; 
import Cropper from 'react-easy-crop'; // IMPORT THE CROPPER
import getCroppedImg from '@/lib/cropImage'; // IMPORT THE HELPER
import { 
  createProduct, deleteProduct, updateProduct, 
  updateShopIdentity, updateShopBranding, updateShopSocials, 
  forceRevalidateAction 
} from '@/lib/actions';
import { 
  Plus, X, Trash2, UploadCloud, CheckCircle, 
  LayoutGrid, Settings, Search, Bell, Menu, LogOut, 
  Image as ImageIcon, ChevronDown, ChevronUp, Store, Palette, Share2,
  RefreshCw, Save, Globe, Facebook, Instagram, Send, Youtube, Twitter, Linkedin,
  ZoomIn, Check // New Icons
} from 'lucide-react';

// --- TYPES ---
interface SocialLink {
  id: string; platform: string; url: string; active: boolean;
}

interface ShopSettings {
  name: string; address: string | null; phone: string | null;
  themeColor: string; logo: string | null; socials: string;
}

interface Category { id: string; name: string; }
interface Product { id: string; name: string; price: number; image: string; category: { name: string }; time: string; }
interface AdminDashboardProps { categories: Category[]; products: Product[]; settings: ShopSettings; }

export default function AdminDashboard({ categories, products, settings }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'menu' | 'settings'>('menu');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openSection, setOpenSection] = useState<string | null>('identity');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // --- LOGO & CROPPER STATE ---
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [logoPreview, setLogoPreview] = useState(settings.logo || '');
  const [isDirtyLogo, setIsDirtyLogo] = useState(false);
  
  // Cropper specific states
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [croppedFile, setCroppedFile] = useState<Blob | null>(null);

  // --- SOCIALS STATE ---
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>(() => {
    try { return settings.socials ? JSON.parse(settings.socials) : []; } catch { return []; }
  });

  // Product Refs
  const productInputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);
  const [fileStatus, setFileStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [fileName, setFileName] = useState('');

  useEffect(() => { 
    setLogoPreview(settings.logo || ''); 
    setIsDirtyLogo(false);
  }, [settings.logo]);

  const toggleSection = (section: string) => setOpenSection(openSection === section ? null : section);
  
  const handleForceRefresh = async () => {
    setIsRefreshing(true);
    await forceRevalidateAction(); 
    setIsRefreshing(false);
    alert("Synced!");
  };

  // --- 1. LOGO SELECTION ---
  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      // When file loads, open the Cropper Modal instead of just setting preview
      reader.addEventListener('load', () => setCropImageSrc(reader.result as string));
      reader.readAsDataURL(file);
      e.target.value = ''; // Reset input
    }
  };

  // --- 2. CROPPER LOGIC ---
  const onCropComplete = (_: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const showCroppedImage = async () => {
    if (!cropImageSrc || !croppedAreaPixels) return;
    try {
      const croppedBlob = await getCroppedImg(cropImageSrc, croppedAreaPixels);
      if (croppedBlob) {
        setCroppedFile(croppedBlob); // Store the file to upload later
        setLogoPreview(URL.createObjectURL(croppedBlob)); // Show preview
        setCropImageSrc(null); // Close modal
        setIsDirtyLogo(true);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const cancelLogoChange = () => {
    setLogoPreview(settings.logo || '');
    setIsDirtyLogo(false);
    setCroppedFile(null);
  };

  // --- SOCIALS HANDLERS ---
  const addSocialLink = () => {
    setSocialLinks([...socialLinks, { id: Date.now().toString(), platform: 'website', url: '', active: true }]);
  };
  const removeSocialLink = (id: string) => setSocialLinks(socialLinks.filter(l => l.id !== id));
  const updateSocialLink = (id: string, field: keyof SocialLink, value: any) => {
    setSocialLinks(socialLinks.map(l => l.id === id ? { ...l, [field]: value } : l));
  };
  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'facebook': return <Facebook size={18}/>; case 'instagram': return <Instagram size={18}/>;
      case 'telegram': return <Send size={18}/>; case 'youtube': return <Youtube size={18}/>;
      case 'twitter': return <Twitter size={18}/>; case 'linkedin': return <Linkedin size={18}/>;
      default: return <Globe size={18}/>;
    }
  };

  // --- PRODUCT IMAGE HANDLERS ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, ref: React.RefObject<HTMLInputElement | null>) => {
    const file = e.target.files?.[0];
    if (file) { setFileStatus('success'); setFileName(file.name); }
  };
  const handleClearFile = (ref: React.RefObject<HTMLInputElement | null>) => {
    setFileStatus('idle'); setFileName(''); if (ref.current) ref.current.value = '';
  };

  return (
    <div className="flex min-h-screen bg-[#F9FAFB] font-sans text-gray-800 relative">
      {/* HEADER & SIDEBAR */}
      <div className="md:hidden fixed top-0 left-0 w-full bg-white z-20 border-b border-gray-100 p-4 flex justify-between items-center shadow-sm">
        <h1 className="font-bold text-lg">AdminPanel</h1>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 bg-gray-50 rounded-lg"><Menu size={24} /></button>
      </div>

      <aside className={`fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-100 transition-transform duration-300 md:translate-x-0 md:static ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-8 h-full flex flex-col">
          <h1 className="font-bold text-xl mb-8 hidden md:block">AdminPanel</h1>
          <nav className="space-y-2 flex-1">
            <button onClick={() => setActiveTab('menu')} className={`w-full flex gap-3 px-4 py-3 rounded-xl ${activeTab === 'menu' ? 'bg-brand-green text-black' : 'text-gray-500'}`}><LayoutGrid size={20}/> Menu</button>
            <button onClick={() => setActiveTab('settings')} className={`w-full flex gap-3 px-4 py-3 rounded-xl ${activeTab === 'settings' ? 'bg-brand-green text-black' : 'text-gray-500'}`}><Settings size={20}/> Settings</button>
          </nav>
          <div className="pt-8 border-t border-gray-50"><button onClick={() => signOut()} className="flex gap-3 text-gray-400 px-4 py-2 hover:text-red-500 transition"><LogOut size={18}/> Log Out</button></div>
        </div>
      </aside>

      {isMobileMenuOpen && <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-20 md:hidden" onClick={() => setIsMobileMenuOpen(false)} />}

      <main className="flex-1 p-4 pt-20 md:p-8 md:pt-8 overflow-y-auto">
        <header className="hidden md:flex justify-between mb-8">
           <h2 className="text-2xl font-bold">{activeTab === 'menu' ? 'Menu' : 'Settings'}</h2>
           <button onClick={handleForceRefresh} disabled={isRefreshing} className="flex gap-2 px-4 py-2 bg-white border rounded-xl text-xs font-bold text-gray-500 hover:text-brand-green hover:border-brand-green transition-all shadow-sm active:scale-95"><RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''}/> {isRefreshing ? 'Syncing...' : 'Force Sync'}</button>
        </header>

        {/* MENU TAB */}
        {activeTab === 'menu' && (
           <div className="animate-in fade-in duration-300">
             {/* ... Product Table/UI from previous code ... */}
             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div className="relative w-full sm:w-64"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18}/><input placeholder="Search menu..." className="w-full pl-10 pr-4 py-3 rounded-xl border-none bg-white shadow-sm text-sm"/></div>
                <button onClick={() => setIsFormOpen(true)} className="w-full sm:w-auto bg-brand-green text-black px-5 py-3 rounded-xl font-bold hover:bg-green-600 transition shadow-lg flex items-center justify-center gap-2 text-sm"><Plus size={18} strokeWidth={3}/> Add New</button>
             </div>
             
             {/* DESKTOP TABLE */}
             <div className="hidden md:block bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead><tr className="border-b border-gray-50 text-xs font-bold text-gray-400 uppercase tracking-wider"><th className="p-5">Product</th><th className="p-5">Category</th><th className="p-5">Price</th><th className="p-5">Time</th><th className="p-5 text-right">Action</th></tr></thead>
                <tbody className="divide-y divide-gray-50">
                  {products.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="p-4 flex items-center gap-3"><div className="w-12 h-12 rounded-xl bg-gray-100 overflow-hidden shrink-0"><img src={item.image} className="w-full h-full object-cover" alt="" /></div><span className="font-bold text-gray-700">{item.name}</span></td>
                      <td className="p-4 text-sm text-gray-500 font-medium"><span className="bg-gray-100 px-3 py-1 rounded-full text-xs text-gray-600">{item.category.name}</span></td>
                      <td className="p-4 font-bold text-gray-900">${item.price.toFixed(2)}</td>
                      <td className="p-4 text-sm text-gray-400">{item.time}</td>
                      <td className="p-4 text-right flex items-center justify-end gap-2"><button onClick={() => setEditingProduct(item)} className="text-gray-300 hover:text-brand-green p-2 hover:bg-green-50 rounded-lg transition"><Settings size={18} /></button><form action={deleteProduct}><input type="hidden" name="id" value={item.id} /><button className="text-gray-300 hover:text-red-500 p-2 hover:bg-red-50 rounded-lg transition"><Trash2 size={18} /></button></form></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* MOBILE LIST */}
            <div className="md:hidden space-y-3">
               {products.map((item) => (
                  <div key={item.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                     <div className="flex items-center gap-4"><div className="w-16 h-16 bg-gray-100 rounded-xl overflow-hidden shrink-0"><img src={item.image} className="w-full h-full object-cover" alt="" /></div><div><h4 className="font-bold text-gray-800">{item.name}</h4><p className="text-xs text-gray-500 mb-1">{item.category.name} • {item.time}</p><p className="font-bold text-brand-green">${item.price.toFixed(2)}</p></div></div>
                     <div className="flex gap-2"><button onClick={() => setEditingProduct(item)} className="p-2 text-gray-300 bg-gray-50 rounded-lg"><Settings size={20} /></button><form action={deleteProduct}><input type="hidden" name="id" value={item.id} /><button className="p-2 text-gray-300 hover:text-red-500 bg-gray-50 rounded-lg"><Trash2 size={20} /></button></form></div>
                  </div>
               ))}
            </div>
           </div>
        )}

        {/* SETTINGS TAB */}
        {activeTab === 'settings' && (
          <div className="max-w-2xl mx-auto space-y-6 animate-in slide-in-from-right-4 duration-300">
            
            {/* 1. IDENTITY */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <button onClick={() => toggleSection('identity')} className="w-full flex justify-between p-5 hover:bg-gray-50 transition-colors">
                 <div className="flex gap-4 items-center"><div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Store size={20}/></div><div className="text-left font-bold text-gray-800">Shop Identity</div></div>{openSection === 'identity' ? <ChevronUp/> : <ChevronDown/>}
              </button>
              <div className={openSection === 'identity' ? 'block' : 'hidden'}>
                <form action={updateShopIdentity} className="p-5 border-t border-gray-50 space-y-4">
                   <div className="space-y-1"><label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Shop Name</label><input name="name" defaultValue={settings.name} className="w-full p-3 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-brand-green"/></div>
                   <div className="space-y-1"><label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Address</label><input name="address" defaultValue={settings.address || ''} className="w-full p-3 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-brand-green"/></div>
                   <div className="space-y-1"><label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Phone</label><input name="phone" defaultValue={settings.phone || ''} className="w-full p-3 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-brand-green"/></div>
                   <div className="flex justify-end pt-2"><button className="bg-brand-dark px-6 py-3 rounded-xl font-bold text-sm shadow-md flex gap-2 hover:scale-[1.02] transition"><Save size={16}/> Save Identity</button></div>
                </form>
              </div>
            </div>

            {/* 2. BRANDING (WITH CROPPER) */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <button onClick={() => toggleSection('branding')} className="w-full flex justify-between p-5 hover:bg-gray-50 transition-colors">
                 <div className="flex gap-4 items-center"><div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><Palette size={20}/></div><div className="text-left font-bold text-gray-800">Branding & Design</div></div>{openSection === 'branding' ? <ChevronUp/> : <ChevronDown/>}
              </button>
              <div className={openSection === 'branding' ? 'block' : 'hidden'}>
                <form 
                  action={async (formData) => {
                    // INTERCEPT: If a cropped file exists, inject it!
                    if (croppedFile) {
                      formData.set('logo', croppedFile, 'logo.webp');
                    }
                    await updateShopBranding(formData);
                    setIsDirtyLogo(false);
                    setCroppedFile(null);
                  }} 
                  className="p-5 border-t border-gray-50 space-y-6"
                >
                   <div className="bg-gray-50 p-6 rounded-2xl flex flex-col items-center justify-center text-center border-2 border-dashed border-gray-200">
                      {logoPreview ? (
                        <div className="relative group">
                           <div className="w-32 h-32 rounded-full overflow-hidden shadow-lg border-4 border-white">
                              <img src={logoPreview} className="w-full h-full object-cover" alt="Preview" />
                           </div>
                           {isDirtyLogo && <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-[10px] px-2 py-1 rounded-full font-bold shadow-md">NEW</span>}
                        </div>
                      ) : (
                        <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center text-gray-400"><ImageIcon size={40}/></div>
                      )}
                      
                      <div className="mt-4 flex gap-3">
                        <button type="button" onClick={() => logoInputRef.current?.click()} className="text-sm font-bold bg-white border border-gray-200 px-4 py-2 rounded-xl shadow-sm hover:bg-gray-50">
                           {logoPreview ? 'Change Image' : 'Upload Logo'}
                        </button>
                        {isDirtyLogo && <button type="button" onClick={cancelLogoChange} className="text-sm font-bold text-red-500 bg-red-50 px-4 py-2 rounded-xl hover:bg-red-100">Cancel</button>}
                      </div>
                      {/* Note: onChange triggers onFileSelect, NOT handleLogoChange */}
                      <input type="file" accept="image/*" ref={logoInputRef} onChange={onFileSelect} className="hidden"/> 
                   </div>
                   <div><label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Theme Color</label><input name="themeColor" type="color" defaultValue={settings.themeColor} className="h-12 w-full rounded-xl bg-gray-50 p-1 cursor-pointer"/></div>
                   <div className="flex justify-end pt-2"><button className="bg-brand-dark px-6 py-3 rounded-xl font-bold text-sm shadow-md flex gap-2 hover:scale-[1.02] transition"><Save size={16}/> Save Branding</button></div>
                </form>
              </div>
            </div>

            {/* 3. SOCIAL MEDIA (DYNAMIC) */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <button onClick={() => toggleSection('socials')} className="w-full flex justify-between p-5 hover:bg-gray-50 transition-colors">
                 <div className="flex gap-4 items-center"><div className="p-2 bg-pink-50 text-pink-600 rounded-lg"><Share2 size={20}/></div><div className="text-left font-bold text-gray-800">Social Media</div></div>{openSection === 'socials' ? <ChevronUp/> : <ChevronDown/>}
              </button>
              <div className={openSection === 'socials' ? 'block' : 'hidden'}>
                <form action={updateShopSocials} className="p-5 border-t border-gray-50 space-y-4">
                  <input type="hidden" name="socials" value={JSON.stringify(socialLinks)} />
                  {socialLinks.map((link) => (
                    <div key={link.id} className="flex flex-col sm:flex-row gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 animate-in slide-in-from-left-2">
                       <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-gray-200">
                          <span className="text-gray-500">{getPlatformIcon(link.platform)}</span>
                          <select value={link.platform} onChange={(e) => updateSocialLink(link.id, 'platform', e.target.value)} className="bg-transparent text-sm font-bold outline-none cursor-pointer w-24">
                            <option value="facebook">Facebook</option><option value="instagram">Instagram</option><option value="telegram">Telegram</option><option value="youtube">YouTube</option><option value="twitter">Twitter</option><option value="linkedin">LinkedIn</option><option value="website">Website</option>
                          </select>
                       </div>
                       <input value={link.url} onChange={(e) => updateSocialLink(link.id, 'url', e.target.value)} placeholder="Paste link here..." className="flex-1 p-2 bg-white rounded-lg border border-gray-200 text-sm outline-none"/>
                       <div className="flex items-center gap-2 justify-end">
                          <label className="relative inline-flex items-center cursor-pointer"><input type="checkbox" checked={link.active} onChange={(e) => updateSocialLink(link.id, 'active', e.target.checked)} className="sr-only peer"/><div className="w-9 h-5 bg-gray-300 rounded-full peer peer-checked:bg-brand-green after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4"></div></label>
                          <button type="button" onClick={() => removeSocialLink(link.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={16}/></button>
                       </div>
                    </div>
                  ))}
                  <button type="button" onClick={addSocialLink} className="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 font-bold text-sm hover:border-brand-green hover:text-brand-green transition-colors flex items-center justify-center gap-2"><Plus size={16}/> Add New Link</button>
                  <div className="flex justify-end pt-4"><button className="bg-brand-dark px-6 py-3 rounded-xl font-bold text-sm shadow-md flex gap-2 hover:scale-[1.02] transition"><Save size={16}/> Save Socials</button></div>
                </form>
              </div>
            </div>

          </div>
        )}
      </main>

      {/* --- CROPPER MODAL (NEW) --- */}
      {cropImageSrc && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-4 border-b flex justify-between items-center bg-white z-10">
              <h3 className="font-bold text-lg">Adjust Logo</h3>
              <button onClick={() => setCropImageSrc(null)} className="p-2 bg-gray-100 rounded-full hover:bg-red-50 hover:text-red-500"><X size={20}/></button>
            </div>
            {/* Cropper Container */}
            <div className="relative w-full h-[300px] sm:h-[400px] bg-black">
              <Cropper
                image={cropImageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1} // Lock aspect ratio to 1:1 (Square)
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
                showGrid={false}
              />
            </div>
            {/* Controls */}
            <div className="p-6 bg-white space-y-6">
               <div className="flex items-center gap-4">
                  <ZoomIn size={20} className="text-gray-400"/>
                  <input type="range" value={zoom} min={1} max={3} step={0.1} onChange={(e) => setZoom(Number(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-brand-green"/>
               </div>
               <button onClick={showCroppedImage} className="w-full py-4 bg-brand-green text-black font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg hover:brightness-105 active:scale-95 transition-all">
                 <Check size={20} /> Apply Crop
               </button>
            </div>
          </div>
        </div>
      )}

      {/* MODALS (Product Add/Edit - Keep existing) */}
      {isFormOpen && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm" onClick={() => setIsFormOpen(false)}>
            <div className="bg-white p-6 md:p-8 rounded-[35px] max-w-lg w-full relative z-10 shadow-2xl overflow-y-auto max-h-[90vh]" onClick={e => e.stopPropagation()}>
               <div className="flex justify-between items-center mb-6"><h2 className="font-extrabold text-2xl text-brand-dark">New Product</h2><button onClick={() => setIsFormOpen(false)}><X/></button></div>
               <form action={async (fd) => { await createProduct(fd); setIsFormOpen(false); handleClearFile(productInputRef as any); }} className="space-y-4">
                  <div className="relative group w-full"><input type="file" name="image" accept="image/*" onChange={(e) => handleFileChange(e, productInputRef)} ref={productInputRef} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" required={fileStatus !== 'success'} /><div className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center transition-all duration-300 ${fileStatus === 'success' ? 'border-brand-green bg-green-50/50 text-brand-green' : 'border-gray-200 bg-gray-50 text-gray-400'}`}>{fileStatus === 'success' ? <CheckCircle size={32} /> : <UploadCloud size={32} />}<span className="text-sm font-bold truncate max-w-[200px] mt-2">{fileName || 'Tap to upload image'}</span></div></div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><input name="name" placeholder="Product Name" className="p-3 bg-gray-50 rounded-xl outline-none" required /><input name="price" type="number" step="0.01" placeholder="Price" className="p-3 bg-gray-50 rounded-xl outline-none" required /></div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><select name="categoryId" className="p-3 bg-gray-50 rounded-xl outline-none" required>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select><input name="time" placeholder="20min" className="p-3 bg-gray-50 rounded-xl outline-none" /></div>
                  <button className="bg-brand-green text-black p-4 rounded-xl font-bold mt-2">Save Product</button>
               </form>
            </div>
         </div>
      )}
    </div>
  );
}