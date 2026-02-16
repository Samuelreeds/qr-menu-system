'use client';

import { useState, useRef } from 'react';
import { signOut } from "next-auth/react"; 
import { 
  createProduct, 
  deleteProduct, 
  updateProduct, 
  updateShopSettings, 
  forceRevalidateAction 
} from '@/lib/actions';
import { 
  Plus, X, Trash2, UploadCloud, CheckCircle, AlertCircle, 
  LayoutGrid, Settings, Search, Bell, Menu, LogOut, 
  Facebook, Instagram, Send, Image as ImageIcon,
  ChevronDown, ChevronUp, Store, Palette, Share2,
  RefreshCw
} from 'lucide-react';

// --- TYPES ---
interface ShopSettings {
  name: string;
  address: string | null;
  phone: string | null;
  themeColor: string;
  logo: string | null;
  facebook: string | null;
  showFacebook: boolean;
  instagram: string | null;
  showInstagram: boolean;
  telegram: string | null;
  showTelegram: boolean;
}

interface Category { id: string; name: string; }
interface Product { 
  id: string; 
  name: string; 
  price: number; 
  image: string; 
  category: { name: string }; 
  time: string; 
}

interface AdminDashboardProps {
  categories: Category[];
  products: Product[];
  settings: ShopSettings;
}

export default function AdminDashboard({ categories, products, settings }: AdminDashboardProps) {
  // Navigation & UI State
  const [activeTab, setActiveTab] = useState<'menu' | 'settings'>('menu');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openSection, setOpenSection] = useState<string | null>('identity');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Form Refs
  const productInputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // States for Image Feedback
  const [fileStatus, setFileStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [fileName, setFileName] = useState('');
  const [logoPreview, setLogoPreview] = useState(settings.logo || '');

  const toggleSection = (section: string) => {
    setOpenSection(openSection === section ? null : section);
  };

  const handleForceRefresh = async () => {
    setIsRefreshing(true);
    await forceRevalidateAction(); 
    setIsRefreshing(false);
    alert("Front-end cache cleared!");
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const objectUrl = URL.createObjectURL(file);
      setLogoPreview(objectUrl);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, ref: React.RefObject<HTMLInputElement | null>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { 
        setFileStatus('error');
        setFileName('Max 5MB');
        if (ref.current) ref.current.value = ''; 
      } else {
        setFileStatus('success');
        setFileName(file.name);
      }
    }
  };

  // Fixed: Definition allows nullable ref, matching strict TS usage
  const handleClearFile = (ref: React.RefObject<HTMLInputElement | null>) => {
    setFileStatus('idle');
    setFileName('');
    if (ref.current) ref.current.value = '';
  };

  return (
    <div className="flex min-h-screen bg-[#F9FAFB] font-sans text-gray-800 relative">
      
      {/* === MOBILE HEADER === */}
      <div className="md:hidden fixed top-0 left-0 w-full bg-white z-20 border-b border-gray-100 p-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <h1 className="font-bold text-lg">AdminPanel</h1>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-gray-600 bg-gray-50 rounded-lg">
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* === SIDEBAR === */}
      <aside className={`
        fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-100 transition-transform duration-300 ease-in-out
        md:translate-x-0 md:static md:flex md:flex-col
        ${isMobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
      `}>
        <div className="p-8 pb-4 h-full flex flex-col">
          <div className="hidden md:flex items-center gap-3 mb-8">
            <h1 className="font-bold text-xl tracking-tight">AdminPanel</h1>
          </div>
          
          <nav className="space-y-2 flex-1 pt-12 md:pt-0">
            <button 
              onClick={() => { setActiveTab('menu'); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${
                activeTab === 'menu' ? 'bg-brand-green text-black shadow-lg shadow-black-100' : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              <LayoutGrid size={20} />
              Menu
            </button>
            <button 
              onClick={() => { setActiveTab('settings'); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${
                activeTab === 'settings' ? 'bg-brand-green text-black shadow-lg shadow-black-100' : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              <Settings size={20} />
              Shop Settings
            </button>
          </nav>

          <div className="pt-8 border-t border-gray-50">
            <button 
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="flex items-center gap-3 text-gray-400 hover:text-red-500 transition px-4 py-2 w-full"
            >
               <LogOut size={18} /> <span className="text-sm font-medium">Log Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay for Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-20 md:hidden" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      {/* === MAIN CONTENT === */}
      <main className="flex-1 p-4 pt-20 md:p-8 md:pt-8 overflow-y-auto">
        
        <header className="hidden md:flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{activeTab === 'menu' ? 'Menu' : 'Settings'}</h2>
            <p className="text-gray-400 text-sm">Welcome back, Admin</p>
          </div>
          
          <div className="flex items-center gap-4">
            {/* FORCE SYNC BUTTON */}
            <button 
              onClick={handleForceRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-100 rounded-xl text-xs font-bold text-gray-500 hover:text-brand-green hover:border-brand-green transition-all shadow-sm active:scale-95"
            >
              <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
              {isRefreshing ? 'Syncing...' : 'Force Sync'}
            </button>

            <div className="w-10 h-10 rounded-full bg-white border border-gray-100 flex items-center justify-center text-gray-400">
              <Bell size={20} />
            </div>
          </div>
        </header>

        {/* --- MENU TAB --- */}
        {activeTab === 'menu' && (
          <div className="animate-in fade-in duration-300">
             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input type="text" placeholder="Search menu..." className="w-full pl-10 pr-4 py-3 rounded-xl border-none bg-white shadow-sm text-sm" />
              </div>
              <button onClick={() => setIsFormOpen(true)} className="w-full sm:w-auto bg-brand-green text-black px-5 py-3 rounded-xl font-bold hover:bg-green-600 transition shadow-lg flex items-center justify-center gap-2 text-sm">
                <Plus size={18} strokeWidth={3} /> Add New
              </button>
            </div>

            {/* DESKTOP VIEW */}
            <div className="hidden md:block bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-50 text-xs font-bold text-gray-400 uppercase tracking-wider">
                    <th className="p-5">Product</th>
                    <th className="p-5">Category</th>
                    <th className="p-5">Price</th>
                    <th className="p-5">Time</th>
                    <th className="p-5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {products.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="p-4 flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gray-100 overflow-hidden shrink-0">
                          <img src={item.image} className="w-full h-full object-cover" alt="" />
                        </div>
                        <span className="font-bold text-gray-700">{item.name}</span>
                      </td>
                      <td className="p-4 text-sm text-gray-500 font-medium">
                        <span className="bg-gray-100 px-3 py-1 rounded-full text-xs text-gray-600">{item.category.name}</span>
                      </td>
                      <td className="p-4 font-bold text-gray-900">${item.price.toFixed(2)}</td>
                      <td className="p-4 text-sm text-gray-400">{item.time}</td>
                      <td className="p-4 text-right flex items-center justify-end gap-2">
                        <button 
                          onClick={() => setEditingProduct(item)}
                          className="text-gray-300 hover:text-brand-green p-2 hover:bg-green-50 rounded-lg transition"
                        >
                          <Settings size={18} />
                        </button>
                        <form action={deleteProduct}>
                          <input type="hidden" name="id" value={item.id} />
                          <button className="text-gray-300 hover:text-red-500 p-2 hover:bg-red-50 rounded-lg transition"><Trash2 size={18} /></button>
                        </form>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* MOBILE VIEW */}
            <div className="md:hidden space-y-3">
               {products.map((item) => (
                  <div key={item.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                     <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-gray-100 rounded-xl overflow-hidden shrink-0">
                           <img src={item.image} className="w-full h-full object-cover" alt="" />
                        </div>
                        <div>
                           <h4 className="font-bold text-gray-800">{item.name}</h4>
                           <p className="text-xs text-gray-500 mb-1">{item.category.name} • {item.time}</p>
                           <p className="font-bold text-brand-green">${item.price.toFixed(2)}</p>
                        </div>
                     </div>
                     <div className="flex gap-2">
                        <button onClick={() => setEditingProduct(item)} className="p-2 text-gray-300 bg-gray-50 rounded-lg"><Settings size={20} /></button>
                        <form action={deleteProduct}>
                            <input type="hidden" name="id" value={item.id} />
                            <button className="p-2 text-gray-300 hover:text-red-500 bg-gray-50 rounded-lg"><Trash2 size={20} /></button>
                        </form>
                     </div>
                  </div>
               ))}
            </div>
          </div>
        )}

        {/* --- SETTINGS TAB --- */}
        {activeTab === 'settings' && (
          <div className="max-w-2xl mx-auto animate-in slide-in-from-right-4 duration-300">
            <form action={updateShopSettings} className="space-y-4">
              
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <button type="button" onClick={() => toggleSection('identity')} className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Store size={20} /></div>
                    <div className="text-left">
                      <h3 className="font-bold text-gray-800">Shop Identity</h3>
                      <p className="text-xs text-gray-400">Name, address, and contact info</p>
                    </div>
                  </div>
                  {openSection === 'identity' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>
                {openSection === 'identity' && (
                  <div className="p-5 pt-0 border-t border-gray-50 space-y-5 animate-in slide-in-from-top-2">
                    <div className="space-y-4 pt-5">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Shop Name</label>
                        <input name="name" defaultValue={settings.name} className="w-full p-3 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-brand-green" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Address</label>
                        <input name="address" defaultValue={settings.address || ''} className="w-full p-3 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-brand-green" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Phone</label>
                        <input name="phone" defaultValue={settings.phone || ''} className="w-full p-3 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-brand-green" />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <button type="button" onClick={() => toggleSection('branding')} className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><Palette size={20} /></div>
                    <div className="text-left">
                      <h3 className="font-bold text-gray-800">Branding & Design</h3>
                      <p className="text-xs text-gray-400">Logo and theme colors</p>
                    </div>
                  </div>
                  {openSection === 'branding' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>
                {openSection === 'branding' && (
                  <div className="p-5 border-t border-gray-50 space-y-6 animate-in slide-in-from-top-2">
                    <div className="flex items-center gap-5 pt-2">
                      <div onClick={() => logoInputRef.current?.click()} className="relative w-20 h-20 rounded-2xl bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden cursor-pointer">
                        {logoPreview ? <img src={logoPreview} className="w-full h-full object-cover" alt="" /> : <ImageIcon className="text-gray-300" />}
                        <input type="file" name="logo" accept="image/*" ref={logoInputRef} onChange={handleLogoChange} className="hidden" />
                      </div>
                      <button type="button" onClick={() => logoInputRef.current?.click()} className="text-xs font-bold text-brand-green bg-green-50 px-4 py-2 rounded-lg">Change Logo</button>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Theme Color</label>
                      <input name="themeColor" type="color" defaultValue={settings.themeColor} className="h-12 w-full rounded-xl cursor-pointer border-none bg-gray-50 p-1" />
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <button type="button" onClick={() => toggleSection('socials')} className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-pink-50 text-pink-600 rounded-lg"><Share2 size={20} /></div>
                    <div className="text-left">
                      <h3 className="font-bold text-gray-800">Social Media</h3>
                      <p className="text-xs text-gray-400">Link your social profiles</p>
                    </div>
                  </div>
                  {openSection === 'socials' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>
                {openSection === 'socials' && (
                  <div className="p-5 border-t border-gray-50 space-y-4 animate-in slide-in-from-top-2">
                    {[
                      { name: 'facebook', icon: <Facebook size={18} />, color: 'bg-blue-600', show: 'showFacebook' },
                      { name: 'instagram', icon: <Instagram size={18} />, color: 'bg-pink-600', show: 'showInstagram' },
                      { name: 'telegram', icon: <Send size={18} />, color: 'bg-sky-500', show: 'showTelegram' }
                    ].map((social) => (
                      <div key={social.name} className="flex items-center gap-4 bg-gray-50 p-3 rounded-xl">
                        <div className={`w-8 h-8 ${social.color} rounded-lg flex items-center justify-center text-black shrink-0`}>{social.icon}</div>
                        <input name={social.name} defaultValue={(settings as any)[social.name] || ''} placeholder={`${social.name} link`} className="flex-1 bg-transparent text-sm outline-none" />
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" name={social.show} defaultChecked={(settings as any)[social.show]} className="sr-only peer" />
                          <div className="w-10 h-5 bg-gray-200 rounded-full peer peer-checked:bg-brand-green after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-5"></div>
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-4 flex justify-end">
                <button type="submit" className="bg-brand-dark text-black px-10 py-4 rounded-2xl font-bold shadow-xl hover:scale-[1.02] transition-transform active:scale-95">
                  Save All Settings
                </button>
              </div>
            </form>
          </div>
        )}
      </main>

      {/* --- ADD PRODUCT MODAL --- */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsFormOpen(false)} />
          <div className="bg-white w-full max-w-lg p-6 md:p-8 rounded-[35px] relative z-10 shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
             <div className="flex justify-between items-center mb-6">
                <h2 className="font-extrabold text-2xl text-brand-dark">New Product</h2>
                <button onClick={() => setIsFormOpen(false)} className="p-2 bg-gray-100 rounded-full"><X size={20}/></button>
             </div>
             {/* Fixed: Added 'as any' to handleClearFile call */}
             <form action={async (fd) => { await createProduct(fd); setIsFormOpen(false); handleClearFile(productInputRef); }} className="flex flex-col gap-4">
                <div className="relative group w-full">
                    <input type="file" name="image" accept="image/*" onChange={(e) => handleFileChange(e, productInputRef)} ref={productInputRef} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" required={fileStatus !== 'success'} />
                    <div className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center transition-all duration-300 ${fileStatus === 'success' ? 'border-brand-green bg-green-50/50 text-brand-green' : 'border-gray-200 bg-gray-50 text-gray-400'}`}>
                        {fileStatus === 'success' ? <CheckCircle size={32} /> : <UploadCloud size={32} />}
                        <span className="text-sm font-bold truncate max-w-[200px] mt-2">{fileName || 'Tap to upload image'}</span>
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                   <input name="name" placeholder="Product Name" className="p-3 bg-gray-50 rounded-xl outline-none" required />
                   <input name="price" type="number" step="0.01" placeholder="Price" className="p-3 bg-gray-50 rounded-xl outline-none" required />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                   <select name="categoryId" className="p-3 bg-gray-50 rounded-xl outline-none" required>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                   </select>
                   <input name="time" placeholder="20min" className="p-3 bg-gray-50 rounded-xl outline-none" />
                </div>
                <button className="bg-brand-green text-black p-4 rounded-xl font-bold mt-2">Save Product</button>
             </form>
          </div>
        </div>
      )}

      {/* --- EDIT PRODUCT MODAL --- */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setEditingProduct(null)} />
          <div className="bg-white w-full max-w-lg p-6 md:p-8 rounded-[35px] relative z-10 shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
             <div className="flex justify-between items-center mb-6">
                <h2 className="font-extrabold text-2xl text-brand-dark">Edit Item</h2>
                <button onClick={() => setEditingProduct(null)} className="p-2 bg-gray-100 rounded-full"><X size={20}/></button>
             </div>
             {/* Fixed: Added 'as any' to handleClearFile call */}
             <form action={async (fd) => { await updateProduct(fd); setEditingProduct(null); handleClearFile(editInputRef); }} className="flex flex-col gap-4">
                <input type="hidden" name="id" value={editingProduct.id} />
                <div className="relative group w-full">
                    <input type="file" name="image" accept="image/*" onChange={(e) => handleFileChange(e, editInputRef)} ref={editInputRef} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" />
                    <div className="border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center border-gray-200 bg-gray-50 text-gray-400">
                        <ImageIcon size={32} />
                        <span className="text-sm font-bold mt-2">Replace current image (optional)</span>
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                   <input name="name" defaultValue={editingProduct.name} className="p-3 bg-gray-50 rounded-xl outline-none" required />
                   <input name="price" type="number" step="0.01" defaultValue={editingProduct.price} className="p-3 bg-gray-50 rounded-xl outline-none" required />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                   <select name="categoryId" defaultValue={editingProduct.category.name} className="p-3 bg-gray-50 rounded-xl outline-none" required>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                   </select>
                   <input name="time" defaultValue={editingProduct.time} className="p-3 bg-gray-50 rounded-xl outline-none" />
                </div>
                <button className="bg-brand-green text-black p-4 rounded-xl font-bold mt-2">Update Product</button>
             </form>
          </div>
        </div>
      )}

    </div>
  );
}