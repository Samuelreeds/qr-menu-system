'use client';
import LocalizedInput from "@/components/LocalizedInput"; // Make sure this path is correct
import { useState, useRef, useEffect } from 'react';
import { signOut } from "next-auth/react"; 
import Cropper from 'react-easy-crop'; 
import getCroppedImg from '@/lib/cropImage'; 
import { 
  createProduct, deleteProduct, updateProduct, 
  createCategory, updateCategory, deleteCategory,
  updateShopIdentity, updateShopBranding, updateShopSocials, 
  forceRevalidateAction 
} from '@/lib/actions';
import { 
  Plus, X, Trash2, UploadCloud, CheckCircle, 
  LayoutGrid, Settings, Search, Bell, Menu, LogOut, 
  Image as ImageIcon, ChevronDown, ChevronUp, Store, Palette, Share2,
  RefreshCw, Save, Globe, Facebook, Instagram, Send, Youtube, Twitter, Linkedin,
  ZoomIn, Check, List 
} from 'lucide-react';

// --- TYPES (Updated with Language Fields) ---
interface SocialLink { id: string; platform: string; url: string; active: boolean; }
interface ShopSettings { name: string; address: string | null; phone: string | null; themeColor: string; logo: string | null; socials: string; }
interface Category { 
  id: string; 
  name: string; 
  name_kh?: string; // Added
  name_zh?: string; // Added
  sortOrder: number; 
} 
interface Product { 
  id: string; 
  name: string; 
  name_kh?: string; // Added
  name_zh?: string; // Added
  price: number; 
  image: string; 
  category: { name: string }; 
  time: string; 
}
interface AdminDashboardProps { categories: Category[]; products: Product[]; settings: ShopSettings; }

export default function AdminDashboard({ categories, products, settings }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'menu' | 'categories' | 'settings'>('menu');
  const [isFormOpen, setIsFormOpen] = useState(false); // Product Modal
  const [isCatFormOpen, setIsCatFormOpen] = useState(false); // Category Modal
  
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null); 

  // --- LOCALIZED INPUT STATE ---
  const [prodName, setProdName] = useState({ en: '', kh: '', zh: '' });
  const [catName, setCatName] = useState({ en: '', kh: '', zh: '' });

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openSection, setOpenSection] = useState<string | null>('identity');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // --- NOTIFICATION STATE ---
  const [toast, setToast] = useState<{ show: boolean; message: string }>({ show: false, message: '' });

  // --- UNIVERSAL CROPPER STATE ---
  const [cropTarget, setCropTarget] = useState<'logo' | 'product' | null>(null);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  // --- LOGO SPECIFIC STATE ---
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [logoPreview, setLogoPreview] = useState(settings.logo || '');
  const [isDirtyLogo, setIsDirtyLogo] = useState(false);
  const [logoFileBlob, setLogoFileBlob] = useState<Blob | null>(null);

  // --- PRODUCT SPECIFIC STATE ---
  const productInputRef = useRef<HTMLInputElement>(null);
  const [productPreview, setProductPreview] = useState('');
  const [productFileBlob, setProductFileBlob] = useState<Blob | null>(null);

  // --- SOCIALS STATE ---
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>(() => {
    try { return settings.socials ? JSON.parse(settings.socials) : []; } catch { return []; }
  });

  useEffect(() => { setLogoPreview(settings.logo || ''); setIsDirtyLogo(false); }, [settings.logo]);

  // --- SYNC STATE WHEN OPENING MODALS ---
  useEffect(() => {
    if (editingProduct) {
      setProductPreview(editingProduct.image);
      setProductFileBlob(null);
      // Populate names
      setProdName({
        en: editingProduct.name || '',
        kh: editingProduct.name_kh || '',
        zh: editingProduct.name_zh || ''
      });
    } else if (isFormOpen) {
      setProductPreview('');
      setProductFileBlob(null);
      setProdName({ en: '', kh: '', zh: '' }); // Reset names
    }
  }, [editingProduct, isFormOpen]);

  useEffect(() => {
    if (editingCategory) {
      setCatName({
        en: editingCategory.name || '',
        kh: editingCategory.name_kh || '',
        zh: editingCategory.name_zh || ''
      });
    } else if (isCatFormOpen) {
      setCatName({ en: '', kh: '', zh: '' });
    }
  }, [editingCategory, isCatFormOpen]);

  const toggleSection = (section: string) => setOpenSection(openSection === section ? null : section);
  
  const handleForceRefresh = async () => {
    setIsRefreshing(true);
    await forceRevalidateAction(); 
    setIsRefreshing(false);
    showToast("Synced successfully!");
  };

  // --- NOTIFICATION HELPER ---
  const showToast = (message: string) => {
    setToast({ show: true, message });
    setTimeout(() => setToast({ show: false, message: '' }), 3000);
  };

  // --- 1. UNIVERSAL FILE SELECT ---
  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>, target: 'logo' | 'product') => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setCropImageSrc(reader.result as string);
        setCropTarget(target); 
        setZoom(1); 
      });
      reader.readAsDataURL(file);
      e.target.value = ''; 
    }
  };

  // --- 2. APPLY CROP ---
  const onCropComplete = (_: any, croppedAreaPixels: any) => setCroppedAreaPixels(croppedAreaPixels);
  
  const showCroppedImage = async () => {
    if (!cropImageSrc || !croppedAreaPixels) return;
    try {
      const croppedBlob = await getCroppedImg(cropImageSrc, croppedAreaPixels);
      if (croppedBlob) {
        const objectUrl = URL.createObjectURL(croppedBlob);
        
        if (cropTarget === 'logo') {
          setLogoFileBlob(croppedBlob); 
          setLogoPreview(objectUrl); 
          setIsDirtyLogo(true);
        } else if (cropTarget === 'product') {
          setProductFileBlob(croppedBlob);
          setProductPreview(objectUrl);
        }
        setCropImageSrc(null); 
        setCropTarget(null);
      }
    } catch (e) { console.error(e); }
  };

  const cancelLogoChange = () => { setLogoPreview(settings.logo || ''); setIsDirtyLogo(false); setLogoFileBlob(null); };

  // Socials Handlers
  const addSocialLink = () => setSocialLinks([...socialLinks, { id: Date.now().toString(), platform: 'website', url: '', active: true }]);
  const removeSocialLink = (id: string) => setSocialLinks(socialLinks.filter(l => l.id !== id));
  const updateSocialLink = (id: string, field: keyof SocialLink, value: any) => setSocialLinks(socialLinks.map(l => l.id === id ? { ...l, [field]: value } : l));
  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'facebook': return <Facebook size={18}/>; case 'instagram': return <Instagram size={18}/>;
      case 'telegram': return <Send size={18}/>; case 'youtube': return <Youtube size={18}/>;
      case 'twitter': return <Twitter size={18}/>; case 'linkedin': return <Linkedin size={18}/>;
      default: return <Globe size={18}/>;
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F9FAFB] font-sans text-gray-800 relative">
      
      {/* --- TOAST NOTIFICATION --- */}
      <div className={`fixed bottom-6 right-6 z-[100] transition-all duration-500 transform ${toast.show ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0 pointer-events-none'}`}>
        <div className="bg-gray-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3">
          <div className="bg-green-500 rounded-full p-1"><Check size={14} strokeWidth={3} className="text-white" /></div>
          <span className="font-bold text-sm">{toast.message}</span>
        </div>
      </div>

      {/* MOBILE HEADER */}
      <div className="md:hidden fixed top-0 left-0 w-full bg-white z-20 border-b border-gray-100 p-4 flex justify-between items-center shadow-sm">
        <h1 className="font-bold text-lg">AdminPanel</h1>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 bg-gray-50 rounded-lg"><Menu size={24} /></button>
      </div>

      {/* SIDEBAR */}
      <aside className={`fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-100 transition-transform duration-300 md:translate-x-0 md:static ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-8 h-full flex flex-col">
          <h1 className="font-bold text-xl mb-8 hidden md:block">AdminPanel</h1>
          <nav className="space-y-2 flex-1">
            <button onClick={() => setActiveTab('menu')} className={`w-full flex gap-3 px-4 py-3 rounded-xl ${activeTab === 'menu' ? 'bg-brand-green text-black' : 'text-gray-500'}`}><LayoutGrid size={20}/> Menu</button>
            <button onClick={() => setActiveTab('categories')} className={`w-full flex gap-3 px-4 py-3 rounded-xl ${activeTab === 'categories' ? 'bg-brand-green text-black' : 'text-gray-500'}`}><List size={20}/> Categories</button>
            <button onClick={() => setActiveTab('settings')} className={`w-full flex gap-3 px-4 py-3 rounded-xl ${activeTab === 'settings' ? 'bg-brand-green text-black' : 'text-gray-500'}`}><Settings size={20}/> Settings</button>
          </nav>
          <div className="pt-8 border-t border-gray-50"><button onClick={() => signOut({ callbackUrl: '/login' })} className="flex gap-3 text-gray-400 px-4 py-2 hover:text-red-500 transition"><LogOut size={18}/> Log Out</button></div>
        </div>
      </aside>

      {isMobileMenuOpen && <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-20 md:hidden" onClick={() => setIsMobileMenuOpen(false)} />}

      <main className="flex-1 p-4 pt-20 md:p-8 md:pt-8 overflow-y-auto">
        <header className="hidden md:flex justify-between mb-8">
           <h2 className="text-2xl font-bold capitalize">{activeTab}</h2>
           <button onClick={handleForceRefresh} disabled={isRefreshing} className="flex gap-2 px-4 py-2 bg-white border rounded-xl text-xs font-bold text-gray-500 hover:text-brand-green hover:border-brand-green transition-all shadow-sm active:scale-95"><RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''}/> Sync</button>
        </header>

        {/* --- MENU TAB --- */}
        {activeTab === 'menu' && (
           <div className="animate-in fade-in duration-300">
             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div className="relative w-full sm:w-64"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18}/><input placeholder="Search menu..." className="w-full pl-10 pr-4 py-3 rounded-xl border-none bg-white shadow-sm text-sm"/></div>
                <button onClick={() => setIsFormOpen(true)} className="w-full sm:w-auto bg-brand-green text-black px-5 py-3 rounded-xl font-bold hover:bg-green-600 transition shadow-lg flex items-center justify-center gap-2 text-sm"><Plus size={18} strokeWidth={3}/> Add New</button>
             </div>
             
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
                      <td className="p-4 text-right flex items-center justify-end gap-2">
                        <button onClick={() => setEditingProduct(item)} className="text-gray-300 hover:text-brand-green p-2 hover:bg-green-50 rounded-lg transition"><Settings size={18} /></button>
                        <form action={async (fd) => { await deleteProduct(fd); showToast("Product deleted"); }}><input type="hidden" name="id" value={item.id} /><button className="text-gray-300 hover:text-red-500 p-2 hover:bg-red-50 rounded-lg transition"><Trash2 size={18} /></button></form>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="md:hidden space-y-3">
               {products.map((item) => (
                  <div key={item.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                     <div className="flex items-center gap-4"><div className="w-16 h-16 bg-gray-100 rounded-xl overflow-hidden shrink-0"><img src={item.image} className="w-full h-full object-cover" alt="" /></div><div><h4 className="font-bold text-gray-800">{item.name}</h4><p className="text-xs text-gray-500 mb-1">{item.category.name} • {item.time}</p><p className="font-bold text-brand-green">${item.price.toFixed(2)}</p></div></div>
                     <div className="flex gap-2"><button onClick={() => setEditingProduct(item)} className="p-2 text-gray-300 bg-gray-50 rounded-lg"><Settings size={20} /></button><form action={async (fd) => { await deleteProduct(fd); showToast("Product deleted"); }}><input type="hidden" name="id" value={item.id} /><button className="p-2 text-gray-300 hover:text-red-500 bg-gray-50 rounded-lg"><Trash2 size={20} /></button></form></div>
                  </div>
               ))}
            </div>
           </div>
        )}

        {/* --- CATEGORIES TAB --- */}
        {activeTab === 'categories' && (
           <div className="animate-in fade-in duration-300">
             <div className="flex justify-between items-center gap-4 mb-6">
                <h3 className="font-bold text-gray-800">Manage Categories</h3>
                <button onClick={() => setIsCatFormOpen(true)} className="w-full sm:w-auto bg-brand-green text-black px-5 py-3 rounded-xl font-bold hover:bg-green-600 transition shadow-lg flex items-center justify-center gap-2 text-sm"><Plus size={18} strokeWidth={3}/> Add New</button>
             </div>
             
             <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead><tr className="border-b border-gray-50 text-xs font-bold text-gray-400 uppercase tracking-wider"><th className="p-5">Name</th><th className="p-5">Sort Order</th><th className="p-5 text-right">Action</th></tr></thead>
                <tbody className="divide-y divide-gray-50">
                  {categories.map((cat) => (
                    <tr key={cat.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="p-4 font-bold text-gray-700">{cat.name}</td>
                      <td className="p-4 text-sm text-gray-500">{cat.sortOrder}</td>
                      <td className="p-4 text-right flex items-center justify-end gap-2">
                        <button onClick={() => setEditingCategory(cat)} className="text-gray-300 hover:text-brand-green p-2 hover:bg-green-50 rounded-lg transition"><Settings size={18} /></button>
                        <form action={async (fd) => { await deleteCategory(fd); showToast("Category deleted"); }}><input type="hidden" name="id" value={cat.id} /><button className="text-gray-300 hover:text-red-500 p-2 hover:bg-red-50 rounded-lg transition"><Trash2 size={18} /></button></form>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
           </div>
        )}

        {/* --- SETTINGS TAB --- */}
        {activeTab === 'settings' && (
          <div className="max-w-2xl mx-auto space-y-6 animate-in slide-in-from-right-4 duration-300">
            {/* 1. IDENTITY */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <button onClick={() => toggleSection('identity')} className="w-full flex justify-between p-5 hover:bg-gray-50 transition-colors">
                 <div className="flex gap-4 items-center"><div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Store size={20}/></div><div className="text-left font-bold text-gray-800">Shop Identity</div></div>{openSection === 'identity' ? <ChevronUp/> : <ChevronDown/>}
              </button>
              <div className={openSection === 'identity' ? 'block' : 'hidden'}>
                <form action={async (fd) => { await updateShopIdentity(fd); showToast("Identity saved successfully!"); }} className="p-5 border-t border-gray-50 space-y-4">
                   <div className="space-y-1"><label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Shop Name</label><input name="name" defaultValue={settings.name} className="w-full p-3 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-brand-green"/></div>
                   <div className="space-y-1"><label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Address</label><input name="address" defaultValue={settings.address || ''} className="w-full p-3 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-brand-green"/></div>
                   <div className="space-y-1"><label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Phone</label><input name="phone" defaultValue={settings.phone || ''} className="w-full p-3 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-brand-green"/></div>
                   <div className="flex justify-end pt-2"><button className="bg-brand-dark px-6 py-3 rounded-xl font-bold text-sm shadow-md flex gap-2 hover:scale-[1.02] transition"><Save size={16}/> Save Identity</button></div>
                </form>
              </div>
            </div>

            {/* 2. BRANDING */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <button onClick={() => toggleSection('branding')} className="w-full flex justify-between p-5 hover:bg-gray-50 transition-colors">
                 <div className="flex gap-4 items-center"><div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><Palette size={20}/></div><div className="text-left font-bold text-gray-800">Branding & Design</div></div>{openSection === 'branding' ? <ChevronUp/> : <ChevronDown/>}
              </button>
              <div className={openSection === 'branding' ? 'block' : 'hidden'}>
                <form action={async (formData) => { if (logoFileBlob) formData.set('logo', logoFileBlob, 'logo.webp'); await updateShopBranding(formData); setIsDirtyLogo(false); setLogoFileBlob(null); showToast("Branding updated!"); }} className="p-5 border-t border-gray-50 space-y-6">
                   <div className="bg-gray-50 p-6 rounded-2xl flex flex-col items-center justify-center text-center border-2 border-dashed border-gray-200">
                      {logoPreview ? (
                        <div className="relative group"><div className="w-32 h-32 rounded-full overflow-hidden shadow-lg border-4 border-white"><img src={logoPreview} className="w-full h-full object-cover" alt="Preview" /></div>{isDirtyLogo && <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-[10px] px-2 py-1 rounded-full font-bold shadow-md">NEW</span>}</div>
                      ) : ( <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center text-gray-400"><ImageIcon size={40}/></div> )}
                      <div className="mt-4 flex gap-3"><button type="button" onClick={() => logoInputRef.current?.click()} className="text-sm font-bold bg-white border border-gray-200 px-4 py-2 rounded-xl shadow-sm hover:bg-gray-50">{logoPreview ? 'Change Image' : 'Upload Logo'}</button>{isDirtyLogo && <button type="button" onClick={cancelLogoChange} className="text-sm font-bold text-red-500 bg-red-50 px-4 py-2 rounded-xl hover:bg-red-100">Cancel</button>}</div>
                      <input type="file" accept="image/*" ref={logoInputRef} onChange={(e) => onFileSelect(e, 'logo')} className="hidden"/> 
                   </div>
                   <div><label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Theme Color</label><input name="themeColor" type="color" defaultValue={settings.themeColor} className="h-12 w-full rounded-xl bg-gray-50 p-1 cursor-pointer"/></div>
                   <div className="flex justify-end pt-2"><button className="bg-brand-dark px-6 py-3 rounded-xl font-bold text-sm shadow-md flex gap-2 hover:scale-[1.02] transition"><Save size={16}/> Save Branding</button></div>
                </form>
              </div>
            </div>

            {/* 3. SOCIALS */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <button onClick={() => toggleSection('socials')} className="w-full flex justify-between p-5 hover:bg-gray-50 transition-colors">
                 <div className="flex gap-4 items-center"><div className="p-2 bg-pink-50 text-pink-600 rounded-lg"><Share2 size={20}/></div><div className="text-left font-bold text-gray-800">Social Media</div></div>{openSection === 'socials' ? <ChevronUp/> : <ChevronDown/>}
              </button>
              <div className={openSection === 'socials' ? 'block' : 'hidden'}>
                <form action={async (fd) => { await updateShopSocials(fd); showToast("Socials saved!"); }} className="p-5 border-t border-gray-50 space-y-4">
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

      {/* --- UNIVERSAL CROPPER MODAL --- */}
      {cropImageSrc && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-4 border-b flex justify-between items-center bg-white z-10"><h3 className="font-bold text-lg">Adjust Image</h3><button onClick={() => { setCropImageSrc(null); setCropTarget(null); }} className="p-2 bg-gray-100 rounded-full hover:bg-red-50 hover:text-red-500"><X size={20}/></button></div>
            <div className="relative w-full h-[300px] sm:h-[400px] bg-black">
              <Cropper 
                image={cropImageSrc} 
                crop={crop} 
                zoom={zoom} 
                aspect={1} // Keep aspect ratio square for consistency
                onCropChange={setCrop} 
                onCropComplete={onCropComplete} 
                onZoomChange={setZoom} 
                showGrid={false} 
              />
            </div>
            <div className="p-6 bg-white space-y-6"><div className="flex items-center gap-4"><ZoomIn size={20} className="text-gray-400"/><input type="range" value={zoom} min={1} max={3} step={0.1} onChange={(e) => setZoom(Number(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-brand-green"/></div><button onClick={showCroppedImage} className="w-full py-4 bg-brand-green text-black font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg hover:brightness-105 active:scale-95 transition-all"><Check size={20} /> Apply Crop</button></div>
          </div>
        </div>
      )}

      {/* --- ADD/EDIT PRODUCT MODAL (UPDATED WITH LOCALIZED INPUT) --- */}
      {(isFormOpen || editingProduct) && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm" onClick={() => { setIsFormOpen(false); setEditingProduct(null); }}>
            <div className="bg-white p-6 md:p-8 rounded-[35px] max-w-lg w-full relative z-10 shadow-2xl overflow-y-auto max-h-[90vh]" onClick={e => e.stopPropagation()}>
               <div className="flex justify-between items-center mb-6"><h2 className="font-extrabold text-2xl text-brand-dark">{editingProduct ? 'Edit Product' : 'New Product'}</h2><button onClick={() => { setIsFormOpen(false); setEditingProduct(null); }}><X/></button></div>
               
               <form 
                 key={editingProduct ? editingProduct.id : 'new'} 
                 action={async (fd) => { 
                   if (productFileBlob) fd.set('image', productFileBlob, 'product.webp');
                   
                   // --- INJECT LOCALIZED NAMES ---
                   fd.set('name', prodName.en);
                   fd.set('name_kh', prodName.kh);
                   fd.set('name_zh', prodName.zh);
                   
                   if (editingProduct) await updateProduct(fd);
                   else await createProduct(fd); 
                   
                   setIsFormOpen(false); 
                   setEditingProduct(null); 
                   setProductFileBlob(null);
                   showToast("Product saved successfully!");
                 }} 
                 className="space-y-4"
               >
                  {editingProduct && <input type="hidden" name="id" value={editingProduct.id} />}
                  
                  {/* --- NEW IMAGE SELECTOR --- */}
                  <div 
                    onClick={() => productInputRef.current?.click()}
                    className="relative w-full h-48 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer overflow-hidden group hover:border-brand-green transition-colors"
                  >
                     {productPreview ? (
                       <>
                         <img src={productPreview} className="w-full h-full object-cover" alt="Preview" />
                         <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <p className="text-white font-bold text-sm bg-black/50 px-3 py-1 rounded-full">Change Image</p>
                         </div>
                       </>
                     ) : (
                       <div className="text-center text-gray-400">
                          <UploadCloud size={32} className="mx-auto mb-2"/>
                          <span className="text-xs font-bold">Tap to upload image</span>
                       </div>
                     )}
                     <input type="file" accept="image/*" ref={productInputRef} onChange={(e) => onFileSelect(e, 'product')} className="hidden" />
                  </div>

                  {/* --- LOCALIZED NAME INPUT --- */}
                  <LocalizedInput 
                    label="Product Name"
                    value={prodName.en}
                    valueKh={prodName.kh}
                    valueZh={prodName.zh}
                    onChange={(lang, val) => setProdName(prev => ({ ...prev, [lang]: val }))}
                    required
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Price - keeping standard input */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-500">Price ($)</label>
                      <input name="price" defaultValue={editingProduct?.price || ''} type="number" step="0.01" placeholder="0.00" className="w-full p-3 bg-gray-50 rounded-xl outline-none" required />
                    </div>
                    {/* Category */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-500">Category</label>
                      <select name="categoryId" defaultValue={editingProduct?.category?.name} className="w-full p-3 bg-gray-50 rounded-xl outline-none" required>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500">Preparation Time</label>
                    <input name="time" defaultValue={editingProduct?.time || ''} placeholder="e.g. 20min" className="w-full p-3 bg-gray-50 rounded-xl outline-none" />
                  </div>
                  
                  <button className="w-full bg-brand-green text-black p-4 rounded-xl font-bold mt-4 shadow-lg hover:brightness-105 active:scale-95 transition-all">{editingProduct ? 'Update Product' : 'Save Product'}</button>
               </form>
            </div>
         </div>
      )}

      {/* --- ADD/EDIT CATEGORY MODAL (UPDATED WITH LOCALIZED INPUT) --- */}
      {(isCatFormOpen || editingCategory) && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm" onClick={() => { setIsCatFormOpen(false); setEditingCategory(null); }}>
            <div className="bg-white p-6 md:p-8 rounded-[35px] max-w-sm w-full relative z-10 shadow-2xl animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
               <div className="flex justify-between items-center mb-6"><h2 className="font-extrabold text-2xl text-brand-dark">{editingCategory ? 'Edit Category' : 'New Category'}</h2><button onClick={() => { setIsCatFormOpen(false); setEditingCategory(null); }}><X/></button></div>
               <form 
                 key={editingCategory ? editingCategory.id : 'new'}
                 action={async (fd) => { 
                    // --- INJECT LOCALIZED NAMES ---
                    fd.set('name', catName.en);
                    fd.set('name_kh', catName.kh);
                    fd.set('name_zh', catName.zh);

                   if (editingCategory) await updateCategory(fd); 
                   else await createCategory(fd); 
                   setIsCatFormOpen(false); 
                   setEditingCategory(null); 
                   showToast("Category saved successfully!");
                 }} 
                 className="space-y-4"
               >
                  {editingCategory && <input type="hidden" name="id" value={editingCategory.id} />}
                  
                  <LocalizedInput 
                    label="Category Name"
                    value={catName.en}
                    valueKh={catName.kh}
                    valueZh={catName.zh}
                    onChange={(lang, val) => setCatName(prev => ({ ...prev, [lang]: val }))}
                    required
                  />

                  {editingCategory && (
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-500">Sort Order</label>
                      <input name="sortOrder" type="number" placeholder="Sort Order" defaultValue={editingCategory.sortOrder} className="w-full p-3 bg-gray-50 rounded-xl outline-none" required />
                    </div>
                  )}
                  <button className="w-full bg-brand-green p-4 rounded-xl font-bold shadow-lg hover:brightness-105 active:scale-95 transition-all">{editingCategory ? 'Update' : 'Create'}</button>
               </form>
            </div>
         </div>
      )}
    </div>
  );
}