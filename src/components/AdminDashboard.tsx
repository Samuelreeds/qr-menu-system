'use client';
import LocalizedInput from "@/components/LocalizedInput"; 
import { useState, useRef, useEffect, useOptimistic, startTransition } from 'react';
import { signOut } from "next-auth/react"; 
import Cropper from 'react-easy-crop'; 
import getCroppedImg from '@/lib/cropImage'; 
import { 
  createProduct, deleteProduct, updateProduct, 
  createCategory, updateCategory, deleteCategory,
  updateShopIdentity, updateShopBranding, updateShopSocials, 
  addBanner, deleteBanner, reorderBanners
} from '@/lib/actions';
import { 
  Plus, X, Trash2, UploadCloud, CheckCircle, 
  LayoutGrid, Settings, Search, Bell, Menu, LogOut, 
  Image as ImageIcon, ChevronDown, ChevronUp, Store, Palette, Share2,
  RefreshCw, Save, Globe, Facebook, Instagram, Send, Youtube, Twitter, Linkedin,
  ZoomIn, Check, List, Pencil, ExternalLink, QrCode, ChevronLeft, ChevronRight,
  Info, Loader2, Clock, AlertTriangle, Star, Lock
} from 'lucide-react';

// --- TYPES ---
interface SocialLink { id: string; platform: string; url: string; active: boolean; }
interface ShopSettings { 
  name: string; 
  name_kh?: string | null; 
  nameDisplay?: string; 
  address: string | null; 
  phone: string | null; 
  openingHours: string | null;
  themeColor: string; 
  headerDesign: string; 
  logo: string | null; 
  socials: string; 
}
interface Banner { id: string; image: string; sortOrder: number; }
interface Category { 
  id: string; 
  name: string; 
  name_kh?: string | null; 
  name_zh?: string | null; 
  sortOrder: number; 
  discount?: number;
} 
interface Product { 
  id: string; 
  name: string; 
  name_kh?: string | null; 
  name_zh?: string | null; 
  price: number; 
  image: string; 
  category: { name: string, discount?: number }; 
  time: string;
  isPopular?: boolean; 
  discount?: number;
}

interface AdminDashboardProps { 
  categories: Category[]; 
  products: Product[]; 
  settings: ShopSettings; 
  shopSlug: string; 
  banners?: Banner[];
  shopPlan?: string;
  planLimits?: any;
}

type OptimisticAction<T> = 
  | { type: 'add'; payload: T }
  | { type: 'update'; payload: T }
  | { type: 'delete'; payload: string };

type OptimisticBannerAction = 
  | { type: 'add'; payload: Banner }
  | { type: 'delete'; payload: string }
  | { type: 'set'; payload: Banner[] };

export default function AdminDashboard({ categories, products, settings, shopSlug, banners = [], shopPlan, planLimits }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'menu' | 'categories' | 'settings'>('menu');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid'); 
  const [isFormOpen, setIsFormOpen] = useState(false); 
  const [isCatFormOpen, setIsCatFormOpen] = useState(false); 
  const [isQrModalOpen, setIsQrModalOpen] = useState(false); 
  const [previewFormat, setPreviewFormat] = useState<'portrait' | 'landscape'>('portrait'); 
  const [printFormat, setPrintFormat] = useState<'portrait' | 'landscape' | null>(null); 
  const [paperSize, setPaperSize] = useState<'A4' | 'A5' | '10x15'>('A4');
  const [origin, setOrigin] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null); 

  const [prodName, setProdName] = useState({ en: '', kh: '', zh: '' });
  const [catName, setCatName] = useState({ en: '', kh: '', zh: '' });

  const [previewNameEn, setPreviewNameEn] = useState(settings?.name || '');
  const [previewNameKh, setPreviewNameKh] = useState(settings?.name_kh || '');
  const [previewDisplay, setPreviewDisplay] = useState(settings?.nameDisplay || 'EN');
  
  const [address, setAddress] = useState(settings?.address || '');
  const [phone, setPhone] = useState(settings?.phone || '');

  // Parse existing opening hours safely or set defaults
  const getInitialHours = () => {
    if (!settings?.openingHours) return { open: '08:00', close: '22:00' };
    const parts = settings.openingHours.split(' - ');
    if (parts.length === 2) {
      return { open: parts[0], close: parts[1] };
    }
    return { open: '08:00', close: '22:00' };
  };

  const initialHours = getInitialHours();
  const [openTime, setOpenTime] = useState(initialHours.open);
  const [closeTime, setCloseTime] = useState(initialHours.close);

  const [prepTime, setPrepTime] = useState('15');
  const [isHotSale, setIsHotSale] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openSection, setOpenSection] = useState<string | null>('identity');

  const [toast, setToast] = useState<{ show: boolean; message: string }>({ show: false, message: '' });
  const [dismissGuide, setDismissGuide] = useState(false);

  const [draggedBannerIndex, setDraggedBannerIndex] = useState<number | null>(null);

  // Safely assign properties with fallback limits based on the current plan state
  const safeLimits = planLimits || {
    maxProducts: 0,
    maxCategories: 0,
    maxBanners: 0,
    premiumThemes: false,
    customSocials: false,
  };
  const canUsePremiumThemes = safeLimits.premiumThemes;
  const canUseCustomSocials = safeLimits.customSocials;

  const [headerDesign, setHeaderDesign] = useState(settings?.headerDesign || 'design1');
  const [themeColorPreview, setThemeColorPreview] = useState(settings?.themeColor || '#000000');

  const [dirtySections, setDirtySections] = useState<Record<string, boolean>>({});
  const [pendingNav, setPendingNav] = useState<{ type: 'tab' | 'section', payload: any, source: string } | null>(null);

  const markDirty = (section: string) => setDirtySections(prev => ({ ...prev, [section]: true }));
  const clearDirty = (section: string) => setDirtySections(prev => ({ ...prev, [section]: false }));

  const [optProducts, dispatchOptProducts] = useOptimistic(
    products,
    (state, action: OptimisticAction<Product>) => {
      switch (action.type) {
        case 'add': return [action.payload, ...state];
        case 'update': return state.map(p => p.id === action.payload.id ? action.payload : p);
        case 'delete': return state.filter(p => p.id !== action.payload);
        default: return state;
      }
    }
  );

  const [optCategories, dispatchOptCategories] = useOptimistic(
    categories,
    (state, action: OptimisticAction<Category>) => {
      switch (action.type) {
        case 'add': return [...state, action.payload].sort((a, b) => a.sortOrder - b.sortOrder);
        case 'update': return state.map(c => c.id === action.payload.id ? action.payload : c).sort((a, b) => a.sortOrder - b.sortOrder);
        case 'delete': return state.filter(c => c.id !== action.payload);
        default: return state;
      }
    }
  );

  const [optBanners, dispatchOptBanners] = useOptimistic(
    banners,
    (state, action: OptimisticBannerAction) => {
      switch (action.type) {
        case 'add': return [...state, action.payload].sort((a, b) => a.sortOrder - b.sortOrder);
        case 'delete': return state.filter(b => b.id !== action.payload);
        case 'set': return action.payload;
        default: return state;
      }
    }
  );

  const [cropTarget, setCropTarget] = useState<'logo' | 'product' | 'banner' | null>(null);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [cropAspect, setCropAspect] = useState<number>(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const [logoPreview, setLogoPreview] = useState(settings?.logo || '');
  const [isDirtyLogo, setIsDirtyLogo] = useState(false);
  const [logoFileBlob, setLogoFileBlob] = useState<Blob | null>(null);

  const bannerInputRef = useRef<HTMLInputElement>(null);

  const productInputRef = useRef<HTMLInputElement>(null);
  const [productPreview, setProductPreview] = useState('');
  const [productFileBlob, setProductFileBlob] = useState<Blob | null>(null);

  const [socialLinks, setSocialLinks] = useState<SocialLink[]>(() => {
    try { return settings?.socials ? JSON.parse(settings.socials) : []; } catch { return []; }
  });

  const hasCategory = optCategories.length > 0;
  const hasProduct = optProducts.length > 0;
  const hasSettings = !!settings?.address || !!settings?.logo || !!settings?.phone;
  const isGuideComplete = hasCategory && hasProduct && hasSettings;

  useEffect(() => {
    setOrigin(window.location.origin);
    const afterPrint = () => setPrintFormat(null);
    window.addEventListener('afterprint', afterPrint);
    return () => window.removeEventListener('afterprint', afterPrint);
  }, []);

  useEffect(() => { setLogoPreview(settings?.logo || ''); setIsDirtyLogo(false); }, [settings?.logo]);

  useEffect(() => {
    if (editingProduct) {
      setProductPreview(editingProduct.image);
      setProductFileBlob(null);
      setProdName({ en: editingProduct.name || '', kh: editingProduct.name_kh || '', zh: editingProduct.name_zh || '' });
      setPrepTime(editingProduct.time ? editingProduct.time.replace(/\D/g, '') : '15');
      setIsHotSale(editingProduct.isPopular || false);
    } else if (isFormOpen) {
      setProductPreview('');
      setProductFileBlob(null);
      setProdName({ en: '', kh: '', zh: '' }); 
      setPrepTime('15');
      setIsHotSale(false);
    }
  }, [editingProduct, isFormOpen]);

  useEffect(() => {
    if (editingCategory) {
      setCatName({ en: editingCategory.name || '', kh: editingCategory.name_kh || '', zh: editingCategory.name_zh || '' });
    } else if (isCatFormOpen) {
      setCatName({ en: '', kh: '', zh: '' });
    }
  }, [editingCategory, isCatFormOpen]);

  const showToast = (message: string) => {
    setToast({ show: true, message });
    setTimeout(() => setToast({ show: false, message: '' }), 3000);
  };

  const handleGeneratePDF = (format: 'portrait' | 'landscape') => {
    setPrintFormat(format);
    setTimeout(() => {
      window.print();
    }, 500); 
  };

  const getPreviewScale = () => {
    if (previewFormat === 'portrait') {
      if (paperSize === 'A4') return 'scale(0.28)';
      if (paperSize === 'A5') return 'scale(0.24)';
      return 'scale(0.22)'; 
    } else {
      if (paperSize === 'A4') return 'scale(0.3)';
      if (paperSize === 'A5') return 'scale(0.26)';
      return 'scale(0.24)'; 
    }
  };

  const getShopNamePreview = () => {
    if (previewDisplay === 'KH' && previewNameKh) return previewNameKh;
    if (previewDisplay === 'BOTH' && previewNameKh) return `${previewNameEn} ${previewNameKh}`;
    return previewNameEn || 'Shop Name';
  };

  const executeNav = (type: 'tab' | 'section', payload: any) => {
    if (type === 'tab') {
      setActiveTab(payload);
      setIsMobileMenuOpen(false);
    } else if (type === 'section') {
      setOpenSection(openSection === payload ? null : payload);
    }
  };

  const handleTabClick = (tab: any) => {
    if (activeTab === tab) return;
    if (activeTab === 'settings' && openSection && dirtySections[openSection]) {
      setPendingNav({ type: 'tab', payload: tab, source: openSection });
    } else {
      executeNav('tab', tab);
    }
  };

  const handleSectionClick = (section: string) => {
    if (openSection && dirtySections[openSection]) {
      if (openSection === section) {
         setPendingNav({ type: 'section', payload: null, source: openSection });
      } else {
         setPendingNav({ type: 'section', payload: section, source: openSection });
      }
    } else {
      executeNav('section', section);
    }
  };

  const discardChanges = (source: string) => {
    if (source === 'identity') {
      setPreviewNameEn(settings?.name || '');
      setPreviewNameKh(settings?.name_kh || '');
      setPreviewDisplay(settings?.nameDisplay || 'EN');
      setAddress(settings?.address || '');
      setPhone(settings?.phone || '');
      const initH = getInitialHours();
      setOpenTime(initH.open);
      setCloseTime(initH.close);
    } else if (source === 'branding') {
      setHeaderDesign(settings?.headerDesign || 'design1');
      setThemeColorPreview(settings?.themeColor || '#000000');
      setLogoPreview(settings?.logo || '');
      setIsDirtyLogo(false);
      setLogoFileBlob(null);
    } else if (source === 'socials') {
      try { setSocialLinks(settings?.socials ? JSON.parse(settings.socials) : []); } catch { setSocialLinks([]); }
    }
  };

  const saveIdentityForm = async () => {
    if (!previewNameEn.trim() && !previewNameKh.trim()) {
      showToast("Please enter at least one shop name.");
      return false;
    }
    const fd = new FormData();
    if (!previewNameEn.trim() && previewNameKh.trim()) {
       fd.set('name', previewNameKh.trim());
    } else {
       fd.set('name', previewNameEn.trim());
    }
    if (previewNameKh.trim()) fd.set('name_kh', previewNameKh.trim());
    fd.set('nameDisplay', previewDisplay);
    fd.set('address', address);
    fd.set('phone', phone);
    fd.set('openingHours', `${openTime} - ${closeTime}`);
    
    try {
      await updateShopIdentity(fd); 
      showToast("Basic information saved!"); 
      clearDirty('identity');
      return true;
    } catch(e) {
      showToast("Error saving information.");
      return false;
    }
  };

  const saveBrandingForm = async () => {
     const fd = new FormData();
     fd.set('headerDesign', headerDesign);
     fd.set('themeColor', themeColorPreview);
     if (logoFileBlob) fd.set('logo', logoFileBlob, 'logo.webp');
     try {
       await updateShopBranding(fd);
       setIsDirtyLogo(false); 
       setLogoFileBlob(null); 
       showToast("Branding updated!"); 
       clearDirty('branding');
       return true;
     } catch (e) {
       showToast("Error saving branding.");
       return false;
     }
  };

  const saveSocialsForm = async () => {
    const fd = new FormData();
    fd.set('socials', JSON.stringify(socialLinks));
    try {
      const res = await updateShopSocials(fd); 
      if (res?.error) {
        showToast(res.error);
        return false;
      }
      showToast("Social Media Links saved!"); 
      clearDirty('socials');
      return true;
    } catch (e) {
      showToast("Error saving socials.");
      return false;
    }
  };

  const onIdentitySubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    await saveIdentityForm();
    setIsSaving(false);
  };

  const onBrandingSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    await saveBrandingForm();
    setIsSaving(false);
  };

  const onSocialsSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    await saveSocialsForm();
    setIsSaving(false);
  };

  const handleMoveBanner = async (index: number, direction: number) => {
    if (index + direction < 0 || index + direction >= optBanners.length) return;
    
    const newBanners = [...optBanners].sort((a,b) => a.sortOrder - b.sortOrder);
    const tempOrder = newBanners[index].sortOrder;
    newBanners[index].sortOrder = newBanners[index + direction].sortOrder;
    newBanners[index + direction].sortOrder = tempOrder;
    newBanners.sort((a,b) => a.sortOrder - b.sortOrder);

    startTransition(() => {
      dispatchOptBanners({ type: 'set', payload: newBanners });
    });
    
    await reorderBanners(newBanners.map(b => ({ id: b.id, sortOrder: b.sortOrder })));
    showToast("Banners reordered!");
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedBannerIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedBannerIndex === null || draggedBannerIndex === dropIndex) {
      setDraggedBannerIndex(null);
      return;
    }
    
    const newBanners = [...optBanners].sort((a,b) => a.sortOrder - b.sortOrder);
    const draggedItem = newBanners[draggedBannerIndex];
    
    newBanners.splice(draggedBannerIndex, 1);
    newBanners.splice(dropIndex, 0, draggedItem);
    newBanners.forEach((b, i) => b.sortOrder = i + 1);

    startTransition(() => {
      dispatchOptBanners({ type: 'set', payload: newBanners });
    });
    
    setDraggedBannerIndex(null);

    await reorderBanners(newBanners.map(b => ({ id: b.id, sortOrder: b.sortOrder })));
    showToast("Banners reordered!");
  };

  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>, target: 'logo' | 'product' | 'banner') => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.addEventListener('load', () => { 
        setCropImageSrc(reader.result as string); 
        setCropTarget(target); 
        setZoom(1); 
        setCropAspect(target === 'banner' ? 16 / 9 : 1);
      });
      reader.readAsDataURL(file);
      e.target.value = ''; 
    }
  };

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
          markDirty('branding');
        } 
        else if (cropTarget === 'product') { 
          setProductFileBlob(croppedBlob); 
          setProductPreview(objectUrl); 
        }
        else if (cropTarget === 'banner') {
          const fd = new FormData();
          fd.append('image', croppedBlob, 'banner.webp');
          const tempId = `temp-${Date.now()}`;
          const nextOrder = optBanners.length > 0 ? Math.max(...optBanners.map(b => b.sortOrder)) + 1 : 1;
          
          startTransition(() => {
            dispatchOptBanners({ 
              type: 'add', 
              payload: { id: tempId, image: objectUrl, sortOrder: nextOrder } 
            });
          });
          
          const res = await addBanner(fd);
          if (res?.error) {
            showToast(res.error);
            // Revert optimistic update
            startTransition(() => {
              dispatchOptBanners({ type: 'delete', payload: tempId });
            });
          } else {
            showToast("Banner added!");
          }
        }
        setCropImageSrc(null); setCropTarget(null);
      }
    } catch (e) { console.error(e); }
  };

  const cancelLogoChange = () => { setLogoPreview(settings?.logo || ''); setIsDirtyLogo(false); setLogoFileBlob(null); };

  const addSocialLink = () => { setSocialLinks([...socialLinks, { id: Date.now().toString(), platform: 'website', url: '', active: true }]); markDirty('socials'); };
  const removeSocialLink = (id: string) => { setSocialLinks(socialLinks.filter(l => l.id !== id)); markDirty('socials'); };
  const updateSocialLink = (id: string, field: keyof SocialLink, value: any) => { setSocialLinks(socialLinks.map(l => l.id === id ? { ...l, [field]: value } : l)); markDirty('socials'); };
  
  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'facebook': return <Facebook size={18}/>; case 'instagram': return <Instagram size={18}/>;
      case 'telegram': return <Send size={18}/>; case 'youtube': return <Youtube size={18}/>;
      case 'twitter': return <Twitter size={18}/>; case 'linkedin': return <Linkedin size={18}/>;
      default: return <Globe size={18}/>;
    }
  };

  const handlePrevDesign = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const designs = ['design1', 'design2', 'design3', 'design4'];
    const idx = designs.indexOf(headerDesign);
    setHeaderDesign(designs[(idx - 1 + designs.length) % designs.length]);
    markDirty('branding');
  };

  const handleNextDesign = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const designs = ['design1', 'design2', 'design3', 'design4'];
    const idx = designs.indexOf(headerDesign);
    setHeaderDesign(designs[(idx + 1) % designs.length]);
    markDirty('branding');
  };

  const filteredProducts = optProducts.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (p.category?.name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderPrintTemplate = (format: 'portrait' | 'landscape') => {
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(origin ? `${origin}/${shopSlug}` : `https://scandine.xyz/${shopSlug}`)}`;
    
    return (
      <div 
        className="border-[16px] border-[#1a1a1a] rounded-[48px] flex items-center justify-center bg-white text-[#4a4a4a] relative font-sans"
        style={{ 
          width: format === 'landscape' ? '1000px' : '650px', 
          height: format === 'landscape' ? '650px' : '1000px',
          flexDirection: format === 'landscape' ? 'row' : 'column',
          boxSizing: 'border-box',
          padding: format === 'landscape' ? '3rem 4rem' : '4rem 3rem'
        }}
      >
        {format === 'landscape' ? (
          <>
            <div className="flex-1 flex flex-col items-center justify-center text-center px-6 w-1/2">
              <h1 className="text-[3.5rem] leading-[1.2] font-light text-gray-600 mb-2 tracking-wide break-words max-w-full font-sans">
                {getShopNamePreview()}
              </h1>
              <p className="text-[2.5rem] text-gray-500 mb-12 font-light">scan to view menu !</p>
              
              <div className="flex items-center w-full justify-center gap-4 mb-8">
                 <div className="flex-1 h-[1px] bg-gray-400"></div>
                 <div className="relative flex items-center justify-center px-4">
                    <div className="absolute w-14 h-14 bg-[#1a1a1a] rounded-full z-0"></div>
                    <div className="relative bg-[#333] rounded-xl w-10 h-16 flex items-center justify-center shadow-md z-10 border-[3px] border-[#1a1a1a]">
                      <div className="bg-white w-[26px] h-[34px] rounded-[2px] flex items-center justify-center"><QrCode size={18} className="text-black" /></div>
                      <div className="absolute top-1 w-2.5 h-[2px] bg-gray-400 rounded-full"></div>
                      <div className="absolute bottom-1 w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                    </div>
                 </div>
                 <div className="flex-1 h-[1px] bg-gray-400"></div>
              </div>
              <p className="text-lg text-gray-500 font-medium tracking-wide">www.scandine.xyz</p>
            </div>
            <div className="flex-1 flex justify-center items-center w-1/2 pl-4">
              <img src={qrCodeUrl} alt="Shop QR Code" className="w-[400px] h-[400px] object-contain" />
            </div>
          </>
        ) : (
          <>
            <div className="flex flex-col items-center justify-center text-center mt-2 w-full px-4">
              <h1 className="text-[4rem] leading-[1.2] font-light text-gray-600 mb-2 tracking-wide break-words max-w-full font-sans">
                {getShopNamePreview()}
              </h1>
              <p className="text-[3rem] text-gray-500 font-light">scan to view menu !</p>
            </div>
            <div className="flex justify-center items-center flex-1 w-full my-6">
              <img src={qrCodeUrl} alt="Shop QR Code" className="w-[450px] h-[450px] object-contain" />
            </div>
            <div className="flex flex-col items-center justify-center text-center w-full px-8 mb-4">
              <div className="flex items-center w-full justify-center gap-4 mb-8">
                 <div className="flex-1 h-[1px] bg-gray-400"></div>
                 <div className="relative flex items-center justify-center px-4">
                    <div className="absolute w-16 h-16 bg-[#1a1a1a] rounded-full z-0"></div>
                    <div className="relative bg-[#333] rounded-2xl w-12 h-20 flex items-center justify-center shadow-md z-10 border-[3px] border-[#1a1a1a]">
                      <div className="bg-white w-8 h-12 rounded-[2px] flex items-center justify-center"><QrCode size={22} className="text-black" /></div>
                      <div className="absolute top-1.5 w-3 h-[2px] bg-gray-400 rounded-full"></div>
                      <div className="absolute bottom-1.5 w-2 h-2 bg-gray-400 rounded-full"></div>
                    </div>
                 </div>
                 <div className="flex-1 h-[1px] bg-gray-400"></div>
              </div>
              <p className="text-2xl text-gray-500 font-medium tracking-wide">www.scandine.xyz</p>
            </div>
          </>
        )}
      </div>
    );
  };

  const fallbackLogo = 'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?auto=format&fit=crop&w=100&q=80';

  return (
    <div className="flex min-h-screen bg-[#F9FAFB] font-sans text-gray-800 relative" style={{ '--theme-color': settings?.themeColor || '#000000' } as React.CSSProperties}>
      <div className={`fixed top-6 right-6 z-[100] transition-all duration-500 transform ${toast.show ? 'translate-y-0 opacity-100' : '-translate-y-10 opacity-0 pointer-events-none'}`}>
        <div className="bg-gray-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3">
          <div className="bg-green-500 rounded-full p-1"><Check size={14} strokeWidth={3} className="text-white" /></div>
          <span className="font-bold text-sm">{toast.message}</span>
        </div>
      </div>

      <div className="md:hidden fixed top-0 left-0 w-full bg-[#F9FAFB] z-20 p-4 flex items-center justify-between gap-4 border-b border-gray-100">
        <div className="flex items-center gap-4">
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 bg-white rounded-xl shadow-sm border border-gray-100 active:scale-95 transition-transform">
            <Menu size={22} className="text-gray-700" />
          </button>
          <h1 className="font-bold text-xl tracking-tight text-gray-900 truncate font-sans">
            {getShopNamePreview() || 'AdminPanel'}
          </h1>
        </div>
        <button onClick={() => handleTabClick('settings')} className="p-2 bg-white rounded-xl shadow-sm border border-gray-100 text-gray-700 active:scale-95 transition-transform">
          <Settings size={20} />
        </button>
      </div>

      <aside className={`fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-100 transition-transform duration-300 md:translate-x-0 md:static flex-shrink-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="px-6 md:px-8 pb-6 md:pb-8 pt-20 md:pt-8 h-full flex flex-col overflow-hidden">
          <div className="mb-6 hidden md:block">
            <h1 className="font-bold text-xl font-sans line-clamp-1">{getShopNamePreview() || 'AdminPanel'}</h1>
            <span className={`inline-block mt-2 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${shopPlan === 'FREE' ? 'bg-gray-100 text-gray-600' : 'bg-orange-100 text-orange-700'}`}>{shopPlan} PLAN</span>
          </div>
          <nav className="space-y-2 flex-1 overflow-y-auto no-scrollbar [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <button onClick={() => handleTabClick('menu')} className={`w-full flex gap-3 px-4 py-3 rounded-xl ${activeTab === 'menu' ? 'bg-gray-900 text-white font-bold shadow-md' : 'text-gray-500 font-medium hover:bg-gray-50 active:scale-[0.98] transition-all'}`}><LayoutGrid size={20}/> Menu</button>
            <button onClick={() => handleTabClick('categories')} className={`w-full flex gap-3 px-4 py-3 rounded-xl ${activeTab === 'categories' ? 'bg-gray-900 text-white font-bold shadow-md' : 'text-gray-500 font-medium hover:bg-gray-50 active:scale-[0.98] transition-all'}`}><List size={20}/> Categories</button>
            <button onClick={() => handleTabClick('settings')} className={`w-full flex gap-3 px-4 py-3 rounded-xl ${activeTab === 'settings' ? 'bg-gray-900 text-white font-bold shadow-md' : 'text-gray-500 font-medium hover:bg-gray-50 active:scale-[0.98] transition-all'}`}><Settings size={20}/> Settings</button>
          </nav>
          <div className="pt-6 border-t border-gray-50 mt-auto shrink-0">
            <button onClick={() => signOut({ callbackUrl: '/auth/login' })} className="w-full flex gap-3 font-medium text-gray-400 px-4 py-2 hover:text-red-500 transition active:scale-95"><LogOut size={18}/> Log Out</button>
          </div>
        </div>
      </aside>

      {isMobileMenuOpen && <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-20 md:hidden" onClick={() => setIsMobileMenuOpen(false)} />}

      <main className="flex-1 p-4 pt-24 md:p-8 pb-24 md:pb-8 overflow-y-auto w-full max-w-full no-scrollbar [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        
        <header className="flex flex-col sm:flex-row justify-between mb-6 sm:mb-8 items-start sm:items-center gap-3">
           <h2 className="text-2xl font-bold capitalize hidden sm:block">{activeTab}</h2>
           <div className="flex gap-2 w-full sm:w-auto">
             <a 
               href={`/${shopSlug}`} 
               target="_blank" 
               rel="noopener noreferrer"
               className="flex-1 sm:flex-none flex justify-center gap-2 px-4 py-2.5 sm:py-2 bg-gray-900 text-white rounded-xl text-xs font-bold hover:bg-gray-800 transition-all shadow-sm active:scale-95 items-center"
             >
               <ExternalLink size={14} /> View Live Menu
             </a>
             <button onClick={() => setIsQrModalOpen(true)} className="flex-1 sm:flex-none flex justify-center gap-1.5 px-3 py-2 sm:py-1.5 bg-transparent border-2 border-gray-200 rounded-xl text-xs font-bold text-gray-500 hover:text-gray-700 hover:border-gray-300 transition-all shadow-sm active:scale-95 items-center">
               <QrCode size={14} /> Get QR
             </button>
           </div>
        </header>

        {!isGuideComplete && !dismissGuide && (
          <div className="mb-8 bg-white p-6 rounded-3xl border border-gray-900 shadow-sm relative overflow-hidden animate-in fade-in slide-in-from-top-4">
            <div className="absolute top-0 left-0 w-2 h-full bg-gray-900"></div>
            <div className="flex justify-between items-start mb-4">
               <div>
                 <h3 className="text-lg font-bold text-gray-900">Welcome to your dashboard! 👋</h3>
                 <p className="text-sm text-gray-500 mt-1">Complete these steps to get your menu live.</p>
               </div>
               <button onClick={() => setDismissGuide(true)} className="text-gray-400 hover:text-gray-600 p-1 active:scale-95 transition-transform"><X size={20}/></button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
               <button onClick={() => { handleTabClick('categories'); if(!hasCategory) setIsCatFormOpen(true); }} className={`p-4 rounded-2xl text-left flex flex-col gap-2 border transition-all active:scale-[0.98] ${hasCategory ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200 hover:border-gray-900'}`}>
                 <div className="flex justify-between items-center w-full">
                   <span className={`text-sm font-bold ${hasCategory ? 'text-green-700' : 'text-gray-700'}`}>1. Create Category</span>
                   {hasCategory ? <CheckCircle size={18} className="text-green-500" /> : <div className="w-4 h-4 rounded-full border-2 border-gray-300"></div>}
                 </div>
                 <span className="text-xs text-gray-500">Organize your menu structure.</span>
               </button>

               <button onClick={() => { handleTabClick('menu'); if(!hasProduct) setIsFormOpen(true); }} className={`p-4 rounded-2xl text-left flex flex-col gap-2 border transition-all active:scale-[0.98] ${hasProduct ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200 hover:border-gray-900'}`}>
                 <div className="flex justify-between items-center w-full">
                   <span className={`text-sm font-bold ${hasProduct ? 'text-green-700' : 'text-gray-700'}`}>2. Add Item</span>
                   {hasProduct ? <CheckCircle size={18} className="text-green-500" /> : <div className="w-4 h-4 rounded-full border-2 border-gray-300"></div>}
                 </div>
                 <span className="text-xs text-gray-500">Add products to your menu.</span>
               </button>

               <button onClick={() => { handleTabClick('settings'); handleSectionClick('identity'); }} className={`p-4 rounded-2xl text-left flex flex-col gap-2 border transition-all active:scale-[0.98] ${hasSettings ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200 hover:border-gray-900'}`}>
                 <div className="flex justify-between items-center w-full">
                   <span className={`text-sm font-bold ${hasSettings ? 'text-green-700' : 'text-gray-700'}`}>3. Update Settings</span>
                   {hasSettings ? <CheckCircle size={18} className="text-green-500" /> : <div className="w-4 h-4 rounded-full border-2 border-gray-300"></div>}
                 </div>
                 <span className="text-xs text-gray-500">Set your shop details & logo.</span>
               </button>
            </div>
          </div>
        )}

        {activeTab === 'menu' && (
           <div className="animate-in fade-in duration-300">
             <div className="flex flex-col md:flex-row items-center justify-between gap-3 mb-6">
                <div className="relative w-full md:flex-1 md:max-w-md">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18}/>
                  <input 
                    placeholder="Search menu..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 rounded-2xl border-none bg-white shadow-sm text-sm outline-none focus:ring-2 focus:ring-gray-900"
                  />
                </div>
                <div className="flex w-full md:w-auto items-center justify-between md:justify-end gap-3 flex-wrap">
                  <div className="flex bg-gray-200/50 p-1 rounded-xl">
                    <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition-colors active:scale-95 ${viewMode === 'list' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}><List size={18}/></button>
                    <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition-colors active:scale-95 ${viewMode === 'grid' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}><LayoutGrid size={18}/></button>
                  </div>
                  <button 
                    onClick={() => setIsFormOpen(true)} 
                    disabled={optProducts.length >= safeLimits.maxProducts}
                    className={`hidden md:flex shrink-0 ${optProducts.length >= safeLimits.maxProducts ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-gray-900 text-white hover:bg-gray-800'} px-4 sm:px-6 py-3.5 rounded-2xl font-bold active:scale-95 transition shadow-sm items-center justify-center gap-2 text-sm`}
                  >
                    <Plus size={18} strokeWidth={3}/> {optProducts.length >= safeLimits.maxProducts ? 'Limit Reached' : 'Add New'}
                  </button>
                </div>
             </div>
             
             {optProducts.length === 0 && searchQuery === '' ? (
                <div className="flex flex-col items-center justify-center py-16 px-4 bg-white rounded-3xl border border-gray-100 shadow-sm mt-4 text-center">
                   <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-4">
                     <LayoutGrid size={28} className="text-gray-400"/>
                   </div>
                   <h3 className="text-xl font-bold text-gray-900 mb-2">No products yet</h3>
                   <ul className="text-sm text-gray-500 mb-8 text-left space-y-2 inline-block">
                      <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-gray-400" /> Create a category</li>
                      <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-gray-400" /> Add your first product</li>
                      <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-gray-400" /> View your live menu</li>
                   </ul>
                   <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                     <button onClick={() => setIsFormOpen(true)} className="bg-gray-900 text-white px-6 py-3.5 rounded-xl font-bold shadow-md hover:bg-gray-800 active:scale-95 transition flex items-center justify-center gap-2 text-sm w-full sm:w-auto">
                       <Plus size={16} strokeWidth={3}/> Add Product
                     </button>
                     <button onClick={() => handleTabClick('categories')} className="bg-white border border-gray-200 text-gray-700 px-6 py-3.5 rounded-xl font-bold hover:bg-gray-50 active:scale-95 transition text-sm w-full sm:w-auto">
                       Go to Categories
                     </button>
                   </div>
                </div>
             ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                  {filteredProducts.map(item => {
                    const categoryDiscount = typeof item.category === 'object' ? (item.category.discount || 0) : 0;
                    const effectiveDiscount = (item.discount && item.discount > 0) ? item.discount : categoryDiscount;
                    const discountedPrice = effectiveDiscount > 0 ? item.price * (1 - effectiveDiscount / 100) : item.price;
                    return (
                    <div key={item.id} className="bg-white p-3 sm:p-4 rounded-3xl shadow-sm border border-gray-100 relative flex flex-col h-full hover:shadow-md transition-all group">
                      <div className="absolute top-5 right-5 flex flex-col gap-1.5 items-end z-10">
                        {item.isPopular && <span className="bg-orange-500 text-white text-[10px] px-2.5 py-1 rounded-full font-extrabold uppercase tracking-wide shadow-md">Hot</span>}
                        {effectiveDiscount > 0 && <span className="bg-red-500 text-white text-[10px] px-2.5 py-1 rounded-full font-extrabold uppercase tracking-wide shadow-md">-{effectiveDiscount}%</span>}
                      </div>
                      <div className="relative w-full aspect-square mb-3 shrink-0 overflow-hidden rounded-2xl bg-gray-100">
                        <img src={item.image} alt={item.name} className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"/>
                      </div>
                      <div className="flex flex-col flex-1 space-y-1">
                        <h3 className="font-bold text-gray-900 text-lg sm:text-xl leading-tight line-clamp-2">{item.name}</h3>
                        <div className="flex items-center text-gray-400 text-xs sm:text-sm gap-2">
                           <span className="truncate uppercase tracking-wider">{item.category?.name}</span> • <span>{item.time}</span>
                        </div>
                        <div className="mt-auto pt-3 flex items-center justify-between">
                          <div>
                            {effectiveDiscount > 0 ? (
                              <div className="flex flex-col sm:flex-row sm:items-center gap-0 sm:gap-2 flex-wrap">
                                <span className="font-extrabold text-lg sm:text-xl text-red-500">${discountedPrice.toFixed(2)}</span>
                                <span className="font-medium text-xs sm:text-sm text-gray-400 line-through">${item.price.toFixed(2)}</span>
                              </div>
                            ) : (
                              <span className="font-extrabold text-lg sm:text-xl text-gray-900">${item.price.toFixed(2)}</span>
                            )}
                          </div>
                          <div className="flex gap-1.5 shrink-0 z-10 relative">
                            <button onClick={(e) => { e.stopPropagation(); setEditingProduct(item); }} className="p-2 text-gray-400 bg-gray-50 rounded-xl hover:bg-gray-100 hover:text-gray-900 transition-colors active:scale-95"><Pencil size={16} /></button>
                            <form action={async (fd) => { 
                                setDeletingId(item.id);
                                startTransition(() => dispatchOptProducts({ type: 'delete', payload: item.id })); 
                                const res = await deleteProduct(fd); 
                                setDeletingId(null);
                                showToast("Product deleted"); 
                            }}>
                              <input type="hidden" name="id" value={item.id} />
                              <button onClick={(e) => e.stopPropagation()} disabled={deletingId === item.id} className="p-2 text-gray-400 hover:text-red-500 bg-gray-50 rounded-xl hover:bg-red-50 transition-colors active:scale-95 disabled:opacity-50">
                                {deletingId === item.id ? <RefreshCw size={16} className="animate-spin" /> : <Trash2 size={16} />}
                              </button>
                            </form>
                          </div>
                        </div>
                      </div>
                    </div>
                  )})}
                  {filteredProducts.length === 0 && searchQuery !== '' && (
                    <div className="col-span-full py-12 text-center text-gray-400 font-medium">No products found matching "{searchQuery}"</div>
                  )}
                </div>
             ) : (
                <>
                  <div className="hidden md:block bg-white rounded-3xl shadow-sm border border-gray-100 overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[600px]">
                      <thead><tr className="border-b border-gray-50 text-xs font-bold text-gray-400 uppercase tracking-wider"><th className="p-5">Product</th><th className="p-5">Category</th><th className="p-5">Price</th><th className="p-5">Time</th><th className="p-5 text-right">Action</th></tr></thead>
                      <tbody className="divide-y divide-gray-50">
                        {filteredProducts.map((item) => {
                          const categoryDiscount = typeof item.category === 'object' ? (item.category.discount || 0) : 0;
                          const effectiveDiscount = (item.discount && item.discount > 0) ? item.discount : categoryDiscount;
                          const discountedPrice = effectiveDiscount > 0 ? item.price * (1 - effectiveDiscount / 100) : item.price;
                          return (
                          <tr key={item.id} className="hover:bg-gray-50/50 transition-colors group">
                            <td className="p-4 flex items-center gap-3">
                              <div className="w-12 h-12 rounded-xl bg-gray-100 overflow-hidden shrink-0"><img src={item.image} className="w-full h-full object-cover" alt="" /></div>
                              <span className="font-bold text-gray-900 flex items-center gap-2">
                                {item.name}
                                {item.isPopular && <span className="text-orange-500 text-[9px] bg-orange-100 px-2 py-0.5 rounded-full font-extrabold uppercase tracking-wide">Hot</span>}
                                {effectiveDiscount > 0 && <span className="text-red-500 text-[9px] bg-red-100 px-2 py-0.5 rounded-full font-extrabold uppercase tracking-wide">-{effectiveDiscount}%</span>}
                              </span>
                            </td>
                            <td className="p-4 text-xs text-gray-400 uppercase tracking-wider"><span className="bg-gray-100 px-3 py-1 rounded-full">{item.category?.name}</span></td>
                            <td className="p-4 font-black text-xl text-gray-900">
                               {effectiveDiscount > 0 ? (
                                 <div className="flex flex-col">
                                   <span className="text-red-500">${discountedPrice.toFixed(2)}</span>
                                   <span className="text-xs text-gray-400 line-through font-normal">${item.price.toFixed(2)}</span>
                                 </div>
                              ) : (
                                 `$${item.price.toFixed(2)}`
                              )}
                            </td>
                            <td className="p-4 text-xs text-gray-400 font-medium">{item.time}</td>
                            <td className="p-4 text-right flex items-center justify-end gap-2">
                              <button onClick={() => setEditingProduct(item)} className="text-gray-400 hover:text-gray-900 p-2 hover:bg-gray-50 rounded-xl transition active:scale-95"><Pencil size={18} /></button>
                              <form action={async (fd) => { 
                                setDeletingId(item.id);
                                startTransition(() => dispatchOptProducts({ type: 'delete', payload: item.id })); 
                                await deleteProduct(fd); 
                                setDeletingId(null);
                                showToast("Product deleted"); 
                              }}>
                                <input type="hidden" name="id" value={item.id} />
                                <button disabled={deletingId === item.id} className="text-gray-400 hover:text-red-500 p-2 hover:bg-red-50 rounded-xl transition active:scale-95 disabled:opacity-50">
                                  {deletingId === item.id ? <RefreshCw size={18} className="animate-spin" /> : <Trash2 size={18} />}
                                </button>
                              </form>
                            </td>
                          </tr>
                        )})}
                      </tbody>
                    </table>
                    {filteredProducts.length === 0 && searchQuery !== '' && (
                      <div className="py-12 text-center text-gray-400 font-medium">No products found matching "{searchQuery}"</div>
                    )}
                  </div>
                  
                  <div className="md:hidden space-y-3">
                     {filteredProducts.map((item) => {
                       const categoryDiscount = typeof item.category === 'object' ? (item.category.discount || 0) : 0;
                       const effectiveDiscount = (item.discount && item.discount > 0) ? item.discount : categoryDiscount;
                       const discountedPrice = effectiveDiscount > 0 ? item.price * (1 - effectiveDiscount / 100) : item.price;
                       return(
                        <div key={item.id} className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 flex items-center justify-between active:scale-[0.98] transition-transform cursor-default">
                           <div className="flex items-center gap-4">
                              <div className="w-16 h-16 bg-gray-100 rounded-2xl overflow-hidden shrink-0"><img src={item.image} className="w-full h-full object-cover" alt="" /></div>
                              <div>
                                <h4 className="font-bold text-gray-900 text-base leading-tight mb-1 flex items-center gap-2">
                                  {item.name}
                                  {item.isPopular && <span className="text-orange-500 text-[9px] bg-orange-100 px-2 py-0.5 rounded-full font-extrabold uppercase tracking-wide">Hot</span>}
                                </h4>
                                <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">{item.category?.name} • <span className="font-medium">{item.time}</span></p>
                                <div className="flex flex-col">
                                   {effectiveDiscount > 0 ? (
                                      <div className="flex items-baseline gap-1.5 flex-wrap">
                                        <span className="font-black text-lg text-red-500 leading-none">${discountedPrice.toFixed(2)}</span>
                                        <span className="text-xs text-gray-400 line-through">${item.price.toFixed(2)}</span>
                                      </div>
                                    ) : (
                                      <span className="font-black text-lg text-gray-900 leading-none">${item.price.toFixed(2)}</span>
                                    )}
                                </div>
                              </div>
                           </div>
                           <div className="flex flex-col gap-2 shrink-0">
                            <button onClick={() => setEditingProduct(item)} className="p-2 text-gray-400 bg-gray-50 rounded-xl hover:bg-gray-100 hover:text-gray-900 active:scale-95 transition-all"><Pencil size={16} /></button>
                            <form action={async (fd) => { 
                                setDeletingId(item.id);
                                startTransition(() => dispatchOptProducts({ type: 'delete', payload: item.id })); 
                                await deleteProduct(fd); 
                                setDeletingId(null);
                                showToast("Product deleted"); 
                            }}>
                              <input type="hidden" name="id" value={item.id} />
                              <button disabled={deletingId === item.id} className="p-2 text-gray-400 hover:text-red-500 bg-gray-50 rounded-xl hover:bg-red-50 active:scale-95 transition-all disabled:opacity-50">
                                {deletingId === item.id ? <RefreshCw size={16} className="animate-spin" /> : <Trash2 size={16} />}
                              </button>
                            </form>
                          </div>
                        </div>
                     )})}
                     {filteredProducts.length === 0 && searchQuery !== '' && (
                        <div className="bg-white p-8 rounded-3xl text-center text-gray-400 font-medium shadow-sm border border-gray-100">No products found matching "{searchQuery}"</div>
                     )}
                  </div>
                </>
             )}

             {/* Mobile Primary Action (FAB) */}
             {optProducts.length > 0 && (
               <button 
                 onClick={() => setIsFormOpen(true)}
                 disabled={optProducts.length >= safeLimits.maxProducts}
                 className="md:hidden fixed bottom-6 right-6 z-10 bg-gray-900 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-xl active:scale-95 transition-transform hover:bg-gray-800 disabled:opacity-50"
               >
                 <Plus size={24} strokeWidth={3} />
               </button>
             )}
           </div>
        )}

        {/* --- CATEGORIES TAB --- */}
        {activeTab === 'categories' && (
           <div className="animate-in fade-in duration-300">
             <div className="flex justify-between items-center gap-4 mb-6">
                 <h3 className="font-bold text-gray-800 hidden sm:block">Manage Categories</h3>
                <button 
                  onClick={() => setIsCatFormOpen(true)} 
                  disabled={optCategories.length >= safeLimits.maxCategories}
                  className={`hidden md:flex ml-auto shrink-0 ${optCategories.length >= safeLimits.maxCategories ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-gray-900 text-white hover:bg-gray-800'} px-6 py-3.5 rounded-2xl font-bold active:scale-95 transition shadow-sm items-center justify-center gap-2 text-sm`}
                >
                  <Plus size={18} strokeWidth={3}/> {optCategories.length >= safeLimits.maxCategories ? 'Limit Reached' : 'Add New'}
                </button>
             </div>
             
             <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[500px]">
                <thead><tr className="border-b border-gray-50 text-xs font-bold text-gray-400 uppercase tracking-wider"><th className="p-5">Name</th><th className="p-5">Sort Order</th><th className="p-5">Discount</th><th className="p-5 text-right">Action</th></tr></thead>
                <tbody className="divide-y divide-gray-50">
                  {optCategories.map((cat) => (
                    <tr key={cat.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="p-4 font-bold text-gray-700">{cat.name}</td>
                      <td className="p-4 text-sm text-gray-500">{cat.sortOrder}</td>
                      <td className="p-4 text-sm text-gray-500">{cat.discount ? `${cat.discount}%` : '-'}</td>
                      <td className="p-4 text-right flex items-center justify-end gap-2">
                        <button onClick={() => setEditingCategory(cat)} className="text-gray-400 hover:text-gray-900 p-2 hover:bg-gray-50 rounded-xl transition active:scale-95"><Pencil size={18} /></button>
                        <form action={async (fd) => { 
                          setDeletingId(cat.id);
                          startTransition(() => dispatchOptCategories({ type: 'delete', payload: cat.id })); 
                          await deleteCategory(fd); 
                          setDeletingId(null);
                          showToast("Category deleted"); 
                        }}>
                          <input type="hidden" name="id" value={cat.id} />
                          <button disabled={deletingId === cat.id} className="text-gray-400 hover:text-red-500 p-2 hover:bg-red-50 rounded-xl transition active:scale-95 disabled:opacity-50">
                            {deletingId === cat.id ? <RefreshCw size={18} className="animate-spin" /> : <Trash2 size={18} />}
                          </button>
                        </form>
                      </td>
                    </tr>
                  ))}
                  {optCategories.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-12 text-center text-gray-400 font-medium">No categories created yet</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Primary Action for Categories (FAB) */}
            <button 
              onClick={() => setIsCatFormOpen(true)}
              disabled={optCategories.length >= safeLimits.maxCategories}
              className="md:hidden fixed bottom-6 right-6 z-10 bg-gray-900 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-xl active:scale-95 transition-transform hover:bg-gray-800 disabled:opacity-50"
            >
              <Plus size={24} strokeWidth={3} />
            </button>
           </div>
        )}

        {/* --- SETTINGS TAB --- */}
        {activeTab === 'settings' && (
          <div className="max-w-2xl mx-auto space-y-6 animate-in slide-in-from-right-4 duration-300 pb-12">
            {/* Shop Details Section */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
              <button onClick={() => handleSectionClick('identity')} className="w-full flex justify-between items-center p-5 hover:bg-gray-50 transition-colors">
                 <div className="flex gap-4 items-center">
                   <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                     <Store size={20}/>
                   </div>
                   <div className="text-left">
                     <h3 className="font-bold text-gray-900 text-base">Basic Information</h3>
                     <p className="text-xs text-gray-500 mt-0.5">Name, display preferences, and contact info</p>
                   </div>
                 </div>
                 {openSection === 'identity' ? <ChevronUp className="text-gray-400"/> : <ChevronDown className="text-gray-400"/>}
              </button>
              
              <div className={openSection === 'identity' ? 'block' : 'hidden'}>
                <form 
                  onSubmit={onIdentitySubmit} 
                  className="p-6 border-t border-gray-100 space-y-6"
                >
                  
                  {/* Name Sub-section */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-800 mb-1.5">Shop Name (English)</label>
                      <input name="name" value={previewNameEn} onChange={e => { setPreviewNameEn(e.target.value); markDirty('identity'); }} placeholder="e.g. Banlung City" className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-colors text-sm text-gray-900 placeholder:text-gray-400 shadow-sm"/>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-800 mb-1.5">Shop Name (Local)</label>
                      <input name="name_kh" value={previewNameKh} onChange={e => { setPreviewNameKh(e.target.value); markDirty('identity'); }} placeholder="e.g. បានលុង ស៊ីធី" className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-colors text-sm text-gray-900 placeholder:text-gray-400 shadow-sm"/>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-800 mb-2">How should we display your name?</label>
                      <div className="flex flex-col sm:flex-row gap-3">
                        {[
                          { id: 'EN', label: 'English' },
                          { id: 'KH', label: 'Local (Khmer)' },
                          { id: 'BOTH', label: 'Both' }
                        ].map((option) => (
                          <label 
                            key={option.id} 
                            className={`relative flex-1 flex items-center justify-center py-3 px-2 rounded-xl border-2 cursor-pointer transition-all ${
                              previewDisplay === option.id 
                                ? 'border-gray-900 bg-gray-900/5 shadow-sm' 
                                : 'border-gray-200 bg-white hover:border-gray-300'
                            }`}
                          >
                            <input 
                              type="radio" 
                              name="nameDisplay" 
                              value={option.id} 
                              checked={previewDisplay === option.id}
                              onChange={(e) => { setPreviewDisplay(e.target.value); markDirty('identity'); }}
                              className="sr-only" 
                            />
                            <div className="flex items-center gap-2">
                              <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${previewDisplay === option.id ? 'border-gray-900 bg-gray-900' : 'border-gray-300 bg-transparent'}`}>
                                {previewDisplay === option.id && <Check size={10} strokeWidth={4} className="text-white" />}
                              </div>
                              <span className={`text-xs sm:text-sm font-semibold text-center ${previewDisplay === option.id ? 'text-gray-900' : 'text-gray-600'}`}>
                                {option.label}
                              </span>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>

                  <hr className="border-gray-100" />

                  {/* Details Sub-section */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-800 mb-1.5">Shop Address</label>
                      <input name="address" value={address} onChange={e => { setAddress(e.target.value); markDirty('identity'); }} placeholder="e.g. Street 123, Phnom Penh" className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-colors text-sm text-gray-900 placeholder:text-gray-400 shadow-sm"/>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-gray-800 mb-1.5">Phone Number</label>
                      <input name="phone" value={phone} onChange={e => { setPhone(e.target.value); markDirty('identity'); }} placeholder="e.g. 012 345 678" className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-colors text-sm text-gray-900 placeholder:text-gray-400 shadow-sm"/>
                    </div>

                    <div className="pt-2">
                      <label className="block text-sm font-semibold text-gray-800 mb-3">Operating Hours</label>
                      <div className="flex flex-col sm:flex-row sm:items-end gap-3">
                        <div className="relative w-full sm:flex-1">
                          <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Opening Time</label>
                          <div className="relative">
                            <Clock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            <input 
                              type="time" 
                              value={openTime}
                              onChange={(e) => { setOpenTime(e.target.value); markDirty('identity'); }}
                              className="w-full pl-9 pr-4 py-3 bg-white border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-colors text-sm text-gray-900 shadow-sm cursor-pointer"
                            />
                          </div>
                        </div>
                        <span className="hidden sm:block text-gray-400 font-medium text-sm text-center mb-3.5">to</span>
                        <div className="relative w-full sm:flex-1">
                          <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Closing Time</label>
                          <div className="relative">
                            <Clock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            <input 
                              type="time" 
                              value={closeTime}
                              onChange={(e) => { setCloseTime(e.target.value); markDirty('identity'); }}
                              className="w-full pl-9 pr-4 py-3 bg-white border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-colors text-sm text-gray-900 shadow-sm cursor-pointer"
                            />
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-2 ml-1">This will be displayed on your customer menu.</p>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4 border-t border-gray-100">
                     <button type="submit" disabled={isSaving || !dirtySections['identity']} className="bg-gray-900 text-white px-6 py-3 rounded-xl font-semibold text-sm shadow-sm flex items-center justify-center gap-2 hover:bg-gray-800 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed w-full sm:w-auto">
                       {isSaving ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle size={16}/>} 
                       {dirtySections['identity'] ? (isSaving ? 'Saving...' : 'Save Changes') : 'Saved'}
                     </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Branding Section */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
              <button onClick={() => handleSectionClick('branding')} className="w-full flex justify-between items-center p-5 hover:bg-gray-50 transition-colors">
                 <div className="flex gap-4 items-center">
                   <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl">
                     <Palette size={20}/>
                   </div>
                   <div className="text-left">
                     <h3 className="font-bold text-gray-900 text-base">Branding & Design</h3>
                     <p className="text-xs text-gray-500 mt-0.5">Customize how your menu looks</p>
                   </div>
                 </div>
                 {openSection === 'branding' ? <ChevronUp className="text-gray-400"/> : <ChevronDown className="text-gray-400"/>}
              </button>
              
              <div className={openSection === 'branding' ? 'block' : 'hidden'}>
                <form onSubmit={onBrandingSubmit} className="p-6 border-t border-gray-100 space-y-6">
                   
                   <div className="space-y-4">
                      <div className="flex justify-between items-center">
                         <label className="block text-sm font-semibold text-gray-800">Menu Header Style</label>
                         <span className="text-[10px] font-bold bg-gray-100 text-gray-600 px-2 py-1 rounded-md uppercase tracking-wider">
                           {headerDesign.replace('design', 'Design ')}
                         </span>
                      </div>

                      <div className={`w-full relative z-0 overflow-hidden rounded-2xl border border-gray-200 shadow-sm group ${!canUsePremiumThemes ? 'opacity-60 grayscale' : ''}`}>
                         <button type="button" disabled={!canUsePremiumThemes} onClick={handlePrevDesign} className="absolute left-2 top-1/2 -translate-y-1/2 z-10 p-2 bg-white/20 backdrop-blur text-white rounded-full shadow-md hover:bg-white/30 transition-all opacity-100 active:scale-95 disabled:hidden">
                           <ChevronLeft size={18}/>
                         </button>
                         
                         <button type="button" disabled={!canUsePremiumThemes} onClick={handleNextDesign} className="absolute right-2 top-1/2 -translate-y-1/2 z-10 p-2 bg-white/20 backdrop-blur text-white rounded-full shadow-md hover:bg-white/30 transition-all opacity-100 active:scale-95 disabled:hidden">
                           <ChevronRight size={18}/>
                         </button>

                         {canUsePremiumThemes && (
                         <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 pointer-events-none animate-pulse">
                           <span className="bg-black/50 backdrop-blur-md text-white text-[10px] font-bold px-3 py-1.5 rounded-full shadow-sm border border-white/10">
                             Tap to change layout
                           </span>
                         </div>
                         )}

                         <header 
                           onClick={canUsePremiumThemes ? handleNextDesign : undefined}
                           className={`relative overflow-hidden pb-8 pt-4 transition-colors duration-300 min-h-[140px] ${canUsePremiumThemes ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                           style={{ background: themeColorPreview }}
                         >
                            <div className="absolute inset-0 bg-black/10 z-0 pointer-events-none" />
                            <div className="absolute inset-0 pointer-events-none z-0 opacity-30" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E")` }} />
                            <div className="absolute pointer-events-none z-0" style={{ top: -20, left: '50%', transform: 'translateX(-50%)', width: 300, height: 200, background: 'radial-gradient(ellipse, rgba(255,255,255,0.2) 0%, transparent 70%)' }} />

                            <div className="relative z-10 flex flex-col h-full w-full pointer-events-none">
                               <div className="absolute top-2 left-4 z-20 pointer-events-none">
                                  <div className="p-1.5 sm:p-2 rounded-xl bg-white/20 backdrop-blur-md border border-white/30 text-white shadow-sm flex items-center justify-center">
                                    <Menu size={20} strokeWidth={2.5}/>
                                  </div>
                               </div>

                               <div className="flex items-center justify-center px-4 pt-12 pb-2 w-full h-full pointer-events-none">
                                  {headerDesign === 'design2' ? (
                                    <h1 className="text-white tracking-wide text-center text-2xl font-bold drop-shadow-sm font-sans leading-relaxed pt-1 line-clamp-2 w-full">{getShopNamePreview()}</h1>
                                  ) : headerDesign === 'design3' ? (
                                    <div className="flex flex-col items-center gap-3 max-w-full">
                                      <div className="rounded-2xl overflow-hidden flex-shrink-0 bg-white w-16 h-16 shadow-xl p-0.5 cursor-pointer relative group/logo pointer-events-auto" onClick={(e) => { e.stopPropagation(); logoInputRef.current?.click(); }}>
                                        <img src={logoPreview || fallbackLogo} alt="Logo" className="w-full h-full object-cover rounded-[14px]" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/logo:opacity-100 flex items-center justify-center transition-opacity rounded-[14px]"><span className="text-white text-[10px] font-bold">Edit</span></div>
                                      </div>
                                      <h1 className="text-white tracking-wide text-center text-xl font-bold drop-shadow-sm font-sans leading-relaxed pt-1 line-clamp-2 break-words w-full">{getShopNamePreview()}</h1>
                                    </div>
                                  ) : headerDesign === 'design4' ? (
                                    <div className="flex items-center justify-center gap-3 max-w-full">
                                      <div className="rounded-full overflow-hidden flex-shrink-0 bg-white w-14 h-14 shadow-lg p-0.5 cursor-pointer relative group/logo pointer-events-auto" onClick={(e) => { e.stopPropagation(); logoInputRef.current?.click(); }}>
                                        <img src={logoPreview || fallbackLogo} alt="Logo" className="w-full h-full object-cover rounded-full" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/logo:opacity-100 flex items-center justify-center transition-opacity rounded-full"><span className="text-white text-[10px] font-bold">Edit</span></div>
                                      </div>
                                      <h1 className="text-white tracking-wide text-left text-xl font-bold drop-shadow-sm font-sans leading-relaxed pt-1 line-clamp-2 break-words flex-1">{getShopNamePreview()}</h1>
                                    </div>
                                  ) : (
                                    <div className="flex flex-col items-center gap-2 max-w-full">
                                      <div className="rounded-full overflow-hidden flex-shrink-0 bg-white w-16 h-16 shadow-lg p-0.5 cursor-pointer relative group/logo pointer-events-auto" onClick={(e) => { e.stopPropagation(); logoInputRef.current?.click(); }}>
                                        <img src={logoPreview || fallbackLogo} alt="Logo" className="w-full h-full object-cover rounded-full" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/logo:opacity-100 flex items-center justify-center transition-opacity rounded-full"><span className="text-white text-[10px] font-bold">Edit</span></div>
                                      </div>
                                      <h1 className="text-white tracking-wide text-center text-xl font-bold drop-shadow-sm font-sans leading-relaxed pt-1 line-clamp-2 break-words w-full">{getShopNamePreview()}</h1>
                                    </div>
                                  )}
                               </div>
                            </div>
                         </header>
                      </div>
                      
                      <input type="hidden" name="headerDesign" value={headerDesign} />

                      <div className="flex justify-center pt-2">
                         <div className="flex items-center gap-3 flex-wrap">
                            <button type="button" onClick={() => logoInputRef.current?.click()} className="text-sm font-semibold bg-white border border-gray-300 px-6 py-2.5 rounded-xl shadow-sm hover:bg-gray-50 flex items-center gap-2 text-gray-700 active:scale-95 transition-all">
                               <ImageIcon size={16}/> {logoPreview ? 'Change Logo Image' : 'Upload Logo Image'}
                            </button>
                            {isDirtyLogo && <button type="button" onClick={() => { cancelLogoChange(); clearDirty('branding'); }} className="text-sm font-semibold text-red-600 bg-red-50 px-6 py-2.5 rounded-xl hover:bg-red-100 active:scale-95 transition-all">Cancel</button>}
                         </div>
                      </div>
                      <input type="file" accept="image/*" ref={logoInputRef} onChange={(e) => onFileSelect(e, 'logo')} className="hidden"/> 
                   </div>

                   <div className={`space-y-2 ${!canUsePremiumThemes ? 'opacity-50' : ''}`}>
                      <div className="flex justify-between items-center">
                        <label className="block text-sm font-semibold text-gray-800">Theme Color</label>
                        {!canUsePremiumThemes && <span className="flex items-center gap-1 text-[9px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100"><Lock size={10}/> PRO</span>}
                      </div>
                      <div className="flex items-center gap-4">
                        <input name="themeColor" type="color" disabled={!canUsePremiumThemes} value={themeColorPreview} onChange={(e) => { setThemeColorPreview(e.target.value); markDirty('branding'); }} className={`h-12 w-16 rounded-xl bg-white p-1 border border-gray-300 shadow-sm ${canUsePremiumThemes ? 'cursor-pointer' : 'cursor-not-allowed'}`}/>
                        <span className="text-sm font-mono text-gray-500 uppercase">{themeColorPreview}</span>
                      </div>
                   </div>

                   <div className="flex justify-end pt-4">
                       <button type="submit" disabled={isSaving || !dirtySections['branding']} className="bg-gray-900 text-white px-6 py-3 rounded-xl font-semibold text-sm shadow-sm flex items-center justify-center gap-2 hover:bg-gray-800 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed w-full sm:w-auto">
                         {isSaving ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle size={16}/>} 
                         {dirtySections['branding'] ? (isSaving ? 'Saving...' : 'Save Design') : 'Saved'}
                       </button>
                   </div>
                </form>
              </div>
            </div>

            {/* Promotional Banners */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
              <button onClick={() => handleSectionClick('banners')} className="w-full flex justify-between items-center p-5 hover:bg-gray-50 transition-colors">
                 <div className="flex gap-4 items-center">
                   <div className="p-2.5 bg-yellow-50 text-yellow-600 rounded-xl">
                     <ImageIcon size={20}/>
                   </div>
                   <div className="text-left">
                     <h3 className="font-bold text-gray-900 text-base">Promotional Banners</h3>
                     <p className="text-xs text-gray-500 mt-0.5">Add sliding banners to your menu</p>
                   </div>
                 </div>
                 {openSection === 'banners' ? <ChevronUp className="text-gray-400"/> : <ChevronDown className="text-gray-400"/>}
              </button>
              
              <div className={openSection === 'banners' ? 'block' : 'hidden'}>
                <div className="p-6 border-t border-gray-100 space-y-4">
                   <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                     {optBanners.map((b, index) => (
                       <div 
                         key={b.id} 
                         draggable
                         onDragStart={(e) => handleDragStart(e, index)}
                         onDragOver={(e) => handleDragOver(e, index)}
                         onDrop={(e) => handleDrop(e, index)}
                         className={`relative w-full aspect-[16/9] rounded-2xl overflow-hidden border ${draggedBannerIndex === index ? 'border-gray-900 opacity-50' : 'border-gray-200'} shadow-sm group bg-gray-50 flex items-center justify-center cursor-move`}
                       >
                         <img src={b.image} className="w-full h-full object-contain pointer-events-none" alt="Banner" />
                         
                         <div className="absolute top-2 left-2 flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                            <button type="button" onClick={() => handleMoveBanner(index, -1)} disabled={index === 0} className="p-1.5 bg-white/90 text-gray-600 rounded-lg shadow-sm hover:bg-white disabled:opacity-50 backdrop-blur-sm active:scale-95"><ChevronUp size={14}/></button>
                            <button type="button" onClick={() => handleMoveBanner(index, 1)} disabled={index === optBanners.length - 1} className="p-1.5 bg-white/90 text-gray-600 rounded-lg shadow-sm hover:bg-white disabled:opacity-50 backdrop-blur-sm active:scale-95"><ChevronDown size={14}/></button>
                         </div>

                         <form action={async (fd) => {
                           setDeletingId(b.id);
                           startTransition(() => dispatchOptBanners({ type: 'delete', payload: b.id }));
                           await deleteBanner(fd);
                           setDeletingId(null);
                           showToast("Banner deleted");
                         }}>
                           <input type="hidden" name="id" value={b.id} />
                           <button disabled={deletingId === b.id} className="absolute top-2 right-2 p-1.5 bg-red-500/90 text-white rounded-lg opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity backdrop-blur-sm active:scale-95 disabled:opacity-50">
                             {deletingId === b.id ? <RefreshCw size={14} className="animate-spin" /> : <Trash2 size={14}/>}
                           </button>
                         </form>
                       </div>
                     ))}
                   </div>
                   
                   {optBanners.length >= safeLimits.maxBanners && (
                     <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl flex gap-3 my-2">
                       <Info className="text-blue-500 shrink-0" size={20}/>
                       <div className="text-xs text-blue-700 leading-relaxed">
                         <p className="font-black mb-1 uppercase tracking-tight">Banner Limit Reached</p>
                         <p>Your current plan allows for {safeLimits.maxBanners} active banner. Upgrade to add more promotions.</p>
                       </div>
                     </div>
                   )}

                   <button 
                     type="button" 
                     onClick={() => bannerInputRef.current?.click()} 
                     disabled={optBanners.length >= safeLimits.maxBanners}
                     className="w-full py-4 bg-gray-50 border border-dashed border-gray-300 rounded-2xl text-gray-600 font-semibold text-sm hover:border-gray-400 hover:bg-gray-100 transition-all flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
                   >
                     <Plus size={16}/> Upload New Banner
                   </button>
                   <input type="file" accept="image/*" ref={bannerInputRef} onChange={(e) => onFileSelect(e, 'banner')} className="hidden" />
                </div>
              </div>
            </div>

            {/* Social Links */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
              <button onClick={() => handleSectionClick('socials')} className="w-full flex justify-between items-center p-5 hover:bg-gray-50 transition-colors">
                 <div className="flex gap-4 items-center">
                   <div className="p-2.5 bg-pink-50 text-pink-600 rounded-xl">
                     <Share2 size={20}/>
                   </div>
                   <div className="text-left flex items-center gap-2">
                     <h3 className="font-bold text-gray-900 text-base">Social Media Links</h3>
                     {!canUseCustomSocials && <Lock size={12} className="text-gray-300"/>}
                   </div>
                 </div>
                 {openSection === 'socials' ? <ChevronUp className="text-gray-400"/> : <ChevronDown className="text-gray-400"/>}
              </button>

              <div className={openSection === 'socials' ? 'block' : 'hidden'}>
                {!canUseCustomSocials ? (
                  <div className="bg-gray-50 border-t border-dashed border-gray-200 p-8 text-center">
                    <Share2 className="mx-auto text-gray-300 mb-3" size={32}/>
                    <p className="text-sm font-bold text-gray-600">Social Links Locked</p>
                    <p className="text-[11px] text-gray-400 mt-1 leading-relaxed max-w-xs mx-auto">Connect Facebook, Instagram, and Telegram to your menu with a PRO plan.</p>
                  </div>
                ) : (
                  <form onSubmit={onSocialsSubmit} className="p-6 border-t border-gray-100 space-y-4">
                    {socialLinks.map((link) => (
                      <div key={link.id} className="flex flex-col sm:flex-row gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-200 animate-in slide-in-from-left-2 shadow-sm">
                         <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-gray-300 shadow-sm">
                            <span className="text-gray-500">{getPlatformIcon(link.platform)}</span>
                            <select value={link.platform} onChange={(e) => updateSocialLink(link.id, 'platform', e.target.value)} className="bg-transparent text-sm font-semibold outline-none cursor-pointer w-24">
                              <option value="facebook">Facebook</option><option value="instagram">Instagram</option><option value="telegram">Telegram</option><option value="youtube">YouTube</option><option value="twitter">Twitter</option><option value="linkedin">LinkedIn</option><option value="website">Website</option>
                            </select>
                         </div>
                         <input value={link.url} onChange={(e) => updateSocialLink(link.id, 'url', e.target.value)} placeholder="Paste link here..." className="flex-1 px-4 py-2.5 bg-white border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-colors text-sm text-gray-900 placeholder:text-gray-400 shadow-sm"/>
                         <div className="flex items-center gap-3 justify-end sm:pl-2">
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input type="checkbox" checked={link.active} onChange={(e) => updateSocialLink(link.id, 'active', e.target.checked)} className="sr-only peer"/>
                              <div className="w-11 h-6 bg-gray-300 rounded-full peer peer-checked:bg-gray-900 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full peer-checked:after:border-white shadow-inner"></div>
                            </label>
                            <button type="button" onClick={() => removeSocialLink(link.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors active:scale-95"><Trash2 size={18}/></button>
                         </div>
                      </div>
                    ))}
                    
                    <button type="button" onClick={addSocialLink} className="w-full py-4 bg-white border border-dashed border-gray-300 rounded-2xl text-gray-700 font-semibold text-sm hover:border-gray-400 hover:bg-gray-50 transition-all flex items-center justify-center gap-2 active:scale-[0.99] shadow-sm">
                      <Plus size={16}/> Add New Link
                    </button>

                    <div className="flex justify-end pt-4">
                      <button type="submit" disabled={isSaving || !dirtySections['socials']} className="bg-gray-900 text-white px-6 py-3 rounded-xl font-semibold text-sm shadow-sm flex items-center justify-center gap-2 hover:bg-gray-800 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed w-full sm:w-auto">
                        {isSaving ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle size={16}/>} 
                        {dirtySections['socials'] ? (isSaving ? 'Saving...' : 'Save Social Links') : 'Saved'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>

          </div>
        )}
      </main>

      {/* --- UNSAVED CHANGES DIALOG --- */}
      {pendingNav && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white rounded-[32px] p-6 md:p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center mb-5">
               <AlertTriangle size={24} className="text-orange-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Unsaved Changes</h3>
            <p className="text-gray-500 text-sm mb-8 leading-relaxed">You have unsaved changes in this section. Do you want to save them before leaving?</p>
            <div className="flex gap-3 w-full">
              <button 
                onClick={() => {
                  discardChanges(pendingNav.source);
                  clearDirty(pendingNav.source);
                  executeNav(pendingNav.type, pendingNav.payload);
                  setPendingNav(null);
                }}
                className="flex-1 py-3.5 px-4 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 active:scale-95 transition-all text-sm"
              >
                No, Discard
              </button>
              <button 
                onClick={async () => {
                  setIsSaving(true);
                  let success = false;
                  if (pendingNav.source === 'identity') success = await saveIdentityForm();
                  else if (pendingNav.source === 'branding') success = await saveBrandingForm();
                  else if (pendingNav.source === 'socials') success = await saveSocialsForm();
                  setIsSaving(false);

                  if (success) {
                    executeNav(pendingNav.type, pendingNav.payload);
                    setPendingNav(null);
                  }
                }}
                className="flex-1 py-3.5 px-4 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 active:scale-95 transition-all flex items-center justify-center text-sm"
              >
                {isSaving ? <Loader2 className="animate-spin" size={18} /> : 'Yes, Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- QR CODE MODAL --- */}
      {isQrModalOpen && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm py-4" onClick={() => setIsQrModalOpen(false)}>
            <div className="bg-white p-6 md:p-8 rounded-[35px] max-w-md w-full relative z-10 shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto no-scrollbar [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }} onClick={e => e.stopPropagation()}>
               
               <div className="flex justify-between items-center mb-6">
                  <h2 className="font-extrabold text-2xl text-gray-900">QR & Print Menu</h2>
                  <button className="p-2 bg-gray-50 rounded-full text-gray-500 hover:bg-gray-100 transition-colors active:scale-95" onClick={() => setIsQrModalOpen(false)}>
                    <X size={20}/>
                  </button>
               </div>
               
               {/* 1. Orientation Selector with Context */}
               <div className="flex gap-2 mb-6 bg-gray-100 p-1.5 rounded-2xl w-full">
                  <button 
                    onClick={() => setPreviewFormat('portrait')}
                    className={`flex-1 py-2 px-1 rounded-xl text-sm font-bold transition-all active:scale-[0.98] flex flex-col items-center justify-center leading-tight ${previewFormat === 'portrait' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    <span>Portrait</span>
                    <span className="text-[10px] font-normal opacity-70 mt-0.5">(Table stand)</span>
                  </button>
                  <button 
                    onClick={() => setPreviewFormat('landscape')}
                    className={`flex-1 py-2 px-1 rounded-xl text-sm font-bold transition-all active:scale-[0.98] flex flex-col items-center justify-center leading-tight ${previewFormat === 'landscape' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    <span>Landscape</span>
                    <span className="text-[10px] font-normal opacity-70 mt-0.5">(Wall / Counter)</span>
                  </button>
               </div>

               {/* 2. Paper Size Selector */}
               <div className="mb-6">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 block text-center">Paper Size</label>
                  <div className="flex gap-2 bg-gray-100 p-1.5 rounded-xl w-full max-w-[240px] mx-auto">
                     {['A4', 'A5', '10x15'].map(size => (
                       <button 
                         key={size} 
                         onClick={() => setPaperSize(size as any)} 
                         className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${paperSize === size ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                       >
                         {size === '10x15' ? '10×15 cm' : size}
                       </button>
                     ))}
                  </div>
               </div>

               {/* 3. QR Target Link Preview */}
               <div className="mb-3 flex flex-col items-center justify-center">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">QR will open:</span>
                  <div className="bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-lg max-w-[280px] w-full text-center truncate shadow-sm">
                     <span className="text-xs text-gray-500 font-medium font-sans">
                       {origin ? `${origin}/${shopSlug}` : `.../${shopSlug}`}
                     </span>
                  </div>
               </div>

               {/* 6. Preview Container */}
               <div className="w-full bg-gray-50/80 rounded-3xl flex items-center justify-center mb-6 overflow-hidden relative shadow-inner" style={{ height: '320px' }}>
                  <div className="absolute top-3 right-4 bg-white/90 backdrop-blur px-2 py-1 rounded shadow-sm z-20">
                     <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Actual print ratio</span>
                  </div>
                  <div 
                    className="origin-center transform transition-all duration-500 flex items-center justify-center shadow-lg bg-white"
                    style={{ transform: getPreviewScale() }}
                  >
                    {renderPrintTemplate(previewFormat)}
                  </div>
               </div>

               {/* 4. Non-Technical Print Warning */}
               <div className="flex items-start gap-3 bg-blue-50/60 text-blue-800 p-3.5 rounded-2xl border border-blue-100 mb-6">
                  <svg className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-xs leading-relaxed">
                    <span className="font-bold block mb-0.5 text-blue-900">Best print result:</span>
                    Turn ON <span className="font-bold">“Background graphics”</span> in the print window
                  </div>
               </div>

               {/* 5. Primary and Secondary Actions */}
               <div className="space-y-3">
                  <button 
                    onClick={() => handleGeneratePDF(previewFormat)} 
                    className="w-full py-3.5 bg-gray-900 text-white rounded-2xl font-bold shadow-md hover:bg-gray-800 active:scale-[0.98] transition-all text-[15px] flex items-center justify-center gap-2"
                  >
                    <QrCode size={18} /> Print / Save as PDF
                  </button>
               </div>

            </div>
         </div>
      )}

      {/* --- PRINTABLE QR SECTION (HIDDEN BY DEFAULT) --- */}
      <div 
        id="print-area" 
        className="hidden items-center justify-center bg-white"
      >
        {printFormat && renderPrintTemplate(printFormat)}
      </div>

      {printFormat && (
        <style>{`
          @media print {
            @page { size: ${printFormat === 'landscape' ? 'landscape' : 'portrait'}; margin: 0; }
            body * { visibility: hidden !important; }
            #print-area, #print-area * { visibility: visible !important; }
            #print-area { 
              position: absolute; left: 0; top: 0; 
              width: 100vw; height: 100vh; 
              display: flex !important; 
              align-items: center; justify-content: center;
              background: white;
              z-index: 99999;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
          }
        `}</style>
      )}

      {/* --- UNIVERSAL CROPPER MODAL --- */}
      {cropImageSrc && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-4 border-b flex justify-between items-center bg-white z-10"><h3 className="font-bold text-lg">Adjust Image</h3><button onClick={() => { setCropImageSrc(null); setCropTarget(null); }} className="p-2 bg-gray-100 rounded-full hover:bg-red-50 hover:text-red-500 active:scale-95 transition-transform"><X size={20}/></button></div>
            <div className="relative w-full h-[300px] sm:h-[400px] bg-black">
              <Cropper image={cropImageSrc} crop={crop} zoom={zoom} aspect={cropAspect} onCropChange={setCrop} onCropComplete={onCropComplete} onZoomChange={setZoom} showGrid={false} />
            </div>
            <div className="p-6 bg-white space-y-6"><div className="flex items-center gap-4"><ZoomIn size={20} className="text-gray-400"/><input type="range" value={zoom} min={1} max={3} step={0.1} onChange={(e) => setZoom(Number(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-brand-green"/></div><button onClick={showCroppedImage} className="w-full py-4 bg-gray-900 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg hover:bg-gray-800 active:scale-95 transition-all"><Check size={20} /> Apply Crop</button></div>
          </div>
        </div>
      )}

      {/* --- ADD/EDIT PRODUCT MODAL --- */}
      {(isFormOpen || editingProduct) && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm" onClick={() => { setIsFormOpen(false); setEditingProduct(null); }}>
            <div className="bg-white p-6 md:p-8 rounded-[35px] max-w-lg w-full relative z-10 shadow-2xl overflow-y-auto max-h-[90vh] no-scrollbar [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }} onClick={e => e.stopPropagation()}>
               <div className="flex justify-between items-center mb-6"><h2 className="font-extrabold text-2xl text-gray-900">{editingProduct ? 'Edit Product' : 'New Product'}</h2><button className="p-2 bg-gray-50 rounded-full text-gray-500 hover:bg-gray-100 active:scale-95 transition-transform" onClick={() => { setIsFormOpen(false); setEditingProduct(null); }}><X size={20}/></button></div>
               
               <form 
                 key={editingProduct ? editingProduct.id : 'new'} 
                 onSubmit={(e) => { 
                   e.preventDefault();
                   const fd = new FormData(e.currentTarget);
                   const isEdit = !!editingProduct;
                   const tempId = isEdit ? editingProduct!.id : `temp-${Date.now()}`;
                   const catId = fd.get('categoryId') as string;
                   const catNameStr = categories.find(c => c.id === catId)?.name || 'Unknown';

                   const tempProduct: Product = {
                     id: tempId,
                     name: prodName.en,
                     name_kh: prodName.kh,
                     name_zh: prodName.zh,
                     price: parseFloat(fd.get('price') as string),
                     discount: parseFloat(fd.get('discount') as string) || 0,
                     image: productPreview || editingProduct?.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c',
                     category: { name: catNameStr },
                     time: fd.get('time') as string || '15min',
                     isPopular: isHotSale, 
                   };

                   startTransition(() => {
                     dispatchOptProducts({ type: isEdit ? 'update' : 'add', payload: tempProduct });
                   });
                   
                   // Close immediately without waiting for server action
                   setIsFormOpen(false); 
                   setEditingProduct(null); 
                   
                   // Execute request in background without blocking UI
                   setTimeout(async () => {
                     if (productFileBlob) fd.set('image', productFileBlob, 'product.webp');
                     fd.set('name', prodName.en);
                     fd.set('name_kh', prodName.kh);
                     fd.set('name_zh', prodName.zh);
                     fd.set('isPopular', isHotSale ? 'on' : 'off');
                     
                     try {
                       if (isEdit) await updateProduct(fd);
                       else await createProduct(fd); 
                       
                       setProductFileBlob(null);
                       showToast("Product saved successfully!");
                     } catch (err) {
                       showToast("Failed to save product.");
                     }
                   }, 0);
                 }} 
                 className="space-y-4"
               >
                  {editingProduct && <input type="hidden" name="id" value={editingProduct.id} />}
                  
                  <div 
                    onClick={() => productInputRef.current?.click()}
                    className="relative w-full h-48 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer overflow-hidden group hover:border-gray-900 transition-colors"
                  >
                     {productPreview ? (
                       <><img src={productPreview} className="w-full h-full object-cover" alt="Preview" /><div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><p className="text-white font-bold text-sm bg-black/50 px-4 py-2 rounded-full backdrop-blur-sm">Change Image</p></div></>
                     ) : (
                       <div className="text-center text-gray-400"><UploadCloud size={32} className="mx-auto mb-2 text-gray-300"/><span className="text-sm font-medium">Tap to upload image</span></div>
                     )}
                     <input type="file" accept="image/*" ref={productInputRef} onChange={(e) => onFileSelect(e, 'product')} className="hidden" />
                  </div>

                  <LocalizedInput label="Product Name" value={prodName.en} valueKh={prodName.kh} valueZh={prodName.zh} onChange={(lang, val) => setProdName(prev => ({ ...prev, [lang]: val }))} required />

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="block text-sm font-semibold text-gray-800 mb-1.5 ml-1">Price ($)</label>
                      <input name="price" defaultValue={editingProduct?.price || ''} type="number" step="0.01" placeholder="0.00" className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-colors text-sm text-gray-900 placeholder:text-gray-400 shadow-sm" required />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-sm font-semibold text-gray-800 mb-1.5 ml-1">Discount (%)</label>
                      <input name="discount" defaultValue={editingProduct?.discount || ''} type="number" min="0" max="100" placeholder="0" className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-colors text-sm text-gray-900 placeholder:text-gray-400 shadow-sm" />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-sm font-semibold text-gray-800 mb-1.5 ml-1">Category</label>
                      <select name="categoryId" defaultValue={categories.find(c => c.name === editingProduct?.category?.name)?.id || categories[0]?.id} className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-colors text-sm text-gray-900 cursor-pointer shadow-sm" required>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-sm font-semibold text-gray-800 mb-1.5 ml-1">Preparation Time</label>
                    <div className="relative flex items-center">
                      <input 
                        type="number" 
                        value={prepTime}
                        onChange={(e) => setPrepTime(e.target.value)}
                        placeholder="15" 
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-colors text-sm text-gray-900 placeholder:text-gray-400 shadow-sm pr-12" 
                      />
                      <span className="absolute right-4 text-gray-400 font-medium text-sm pointer-events-none">min</span>
                      <input type="hidden" name="time" value={prepTime ? `${prepTime}min` : ''} />
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-3 p-4 bg-orange-50 rounded-xl border border-orange-100 mt-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-orange-600 text-sm">Hot Sale Item</h4>
                        <p className="text-[10px] text-orange-400">Show this in the popular section</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={isHotSale} 
                          onChange={(e) => setIsHotSale(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-white border border-gray-200 rounded-full peer peer-checked:bg-orange-500 peer-checked:border-orange-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-gray-300 after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full peer-checked:after:bg-white peer-checked:after:border-white shadow-sm"></div>
                      </label>
                    </div>
                    {isHotSale && (
                      <div className="flex">
                        <span className="bg-orange-500 text-white text-[10px] px-2.5 py-1 rounded-full font-extrabold uppercase tracking-wide shadow-sm">
                          Hot Sale
                        </span>
                      </div>
                    )}
                  </div>

                  <button type="submit" className="w-full bg-gray-900 text-white py-3.5 rounded-xl font-bold shadow-md hover:bg-gray-800 transition-all flex items-center justify-center gap-2 active:scale-[0.98] mt-4 text-sm">
                    {editingProduct ? 'Update Product' : 'Save Product'}
                  </button>
               </form>
            </div>
         </div>
      )}

      {/* --- ADD/EDIT CATEGORY MODAL --- */}
      {(isCatFormOpen || editingCategory) && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm" onClick={() => { setIsCatFormOpen(false); setEditingCategory(null); }}>
            <div className="bg-white p-6 md:p-8 rounded-[35px] max-w-sm w-full relative z-10 shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto no-scrollbar [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }} onClick={e => e.stopPropagation()}>
               <div className="flex justify-between items-center mb-6"><h2 className="font-extrabold text-2xl text-gray-900">{editingCategory ? 'Edit Category' : 'New Category'}</h2><button className="p-2 bg-gray-50 rounded-full text-gray-500 hover:bg-gray-100 active:scale-95 transition-transform" onClick={() => { setIsCatFormOpen(false); setEditingCategory(null); }}><X size={20}/></button></div>
               <form 
                 key={editingCategory ? editingCategory.id : 'new'}
                 onSubmit={(e) => { 
                    e.preventDefault();
                    const fd = new FormData(e.currentTarget);
                    const isEdit = !!editingCategory;
                    const tempId = isEdit ? editingCategory!.id : `temp-${Date.now()}`;
                    const tempCat: Category = {
                      id: tempId,
                      name: catName.en,
                      name_kh: catName.kh,
                      name_zh: catName.zh,
                      sortOrder: isEdit ? parseInt(fd.get('sortOrder') as string) : categories.length + 1,
                      discount: parseFloat(fd.get('discount') as string) || 0
                    };

                    startTransition(() => {
                      dispatchOptCategories({ type: isEdit ? 'update' : 'add', payload: tempCat });
                    });
                    
                    // Close immediately without waiting for server action
                    setIsCatFormOpen(false); 
                    setEditingCategory(null); 

                    // Execute request in background
                    setTimeout(async () => {
                      fd.set('name', catName.en);
                      fd.set('name_kh', catName.kh);
                      fd.set('name_zh', catName.zh);

                      try {
                        if (isEdit) await updateCategory(fd); 
                        else await createCategory(fd); 
                        showToast("Category saved successfully!");
                      } catch (err) {
                        showToast("Failed to save category.");
                      }
                    }, 0);
                 }} 
                 className="space-y-4"
               >
                  {editingCategory && <input type="hidden" name="id" value={editingCategory.id} />}
                  <LocalizedInput label="Category Name" value={catName.en} valueKh={catName.kh} valueZh={catName.zh} onChange={(lang, val) => setCatName(prev => ({ ...prev, [lang]: val }))} required />
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-sm font-semibold text-gray-800 mb-1.5 ml-1">Discount (%)</label>
                      <input name="discount" type="number" min="0" max="100" placeholder="0" defaultValue={editingCategory?.discount || ''} className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-colors text-sm text-gray-900 placeholder:text-gray-400 shadow-sm" />
                    </div>
                    {editingCategory && (
                      <div className="space-y-1">
                        <label className="block text-sm font-semibold text-gray-800 mb-1.5 ml-1">Sort Order</label>
                        <input name="sortOrder" type="number" placeholder="Order" defaultValue={editingCategory.sortOrder} className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-colors text-sm text-gray-900 placeholder:text-gray-400 shadow-sm" required />
                      </div>
                    )}
                  </div>

                  <button type="submit" className="w-full bg-gray-900 text-white py-3.5 rounded-xl font-bold shadow-md hover:bg-gray-800 transition-all flex items-center justify-center gap-2 active:scale-[0.98] mt-6 text-sm">
                    {editingCategory ? 'Update' : 'Create'}
                  </button>
               </form>
            </div>
         </div>
      )}
    </div>
  );
}