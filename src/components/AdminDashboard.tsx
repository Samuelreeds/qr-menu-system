'use client';
import Link from 'next/link';
import TableManager from "@/components/TableManager";
import LocalizedInput from "@/components/LocalizedInput"; 
import { useState, useRef, useEffect, useOptimistic, startTransition } from 'react';
import { signOut } from "next-auth/react"; 
import Cropper from 'react-easy-crop'; 
import getCroppedImg from '@/lib/cropImage'; 
import { 
  createProduct, deleteProduct, updateProduct, 
  createCategory, updateCategory, deleteCategory,
  updateShopIdentity, updateShopBranding, updateShopSocials, 
  addBanner, deleteBanner, reorderBanners, toggleProductSoldOut,
} from '@/lib/actions';
import { updateStaffSettingsAction, sendTestTelegramNotification } from '@/lib/staff-actions';
import { 
  Plus, X, Trash2, UploadCloud, CheckCircle, AlertTriangle,
  LayoutGrid, Settings, Search, Bell, Menu, LogOut, 
  Image as ImageIcon, ChevronDown, ChevronUp, Store, Palette, Share2,
  Globe, Facebook, Instagram, Send, Youtube, Twitter, Linkedin,
  ZoomIn, Check, List, Pencil, ExternalLink, QrCode, ChevronLeft, ChevronRight,
  Info, Loader2, Clock, Lock, MoreVertical, Hash, ClipboardList, ShoppingCart, Activity, Package, Sparkles
} from 'lucide-react';

import LazyImage from "./ui/LazyImage";
import StockSwitchButton from "./ui/StockSwitchButton";
import AdminPosSection from "./pos/AdminPosSection";
import OrderHistoryCard from "./pos/OrderHistoryCard";
import DashboardOverview from "./pos/DashboardOverview";
import InventoryManager from "./InventoryManager";
import PosReceipt from "@/components/PosReceipt"; 
import { ToastProvider } from "@/context/ToastContext";
import { OrderProvider } from "@/context/OrderContext";

export interface Category { id: string; name: string; name_kh?: string | null; name_zh?: string | null; sortOrder: number; discount?: number; isDrink?: boolean; } 
export interface Product { id: string; name: string; name_kh?: string | null; name_zh?: string | null; price: number; image: string; category: { name: string, discount?: number }; time: string; isPopular?: boolean; isSoldOut?: boolean; discount?: number; description?: string; }
export interface Banner { id: string; image: string; sortOrder: number; }
export interface SocialLink { id: string; platform: string; url: string; active: boolean; }
export interface ShopSettings { name: string; name_kh?: string | null; nameDisplay?: string; address: string | null; phone: string | null; openingHours: string | null; themeColor: string; headerDesign: string; logo: string | null; logoType?: string | null; socials: string; }

const PLACEHOLDER_IMAGE = 'data:image/svg+xml;charset=utf-8,%3Csvg xmlns%3D"http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg" width%3D"400" height%3D"400" viewBox%3D"0 0 400 400"%3E%3Crect width%3D"400" height%3D"400" fill%3D"%23f3f4f6"%2F%3E%3Ctext x%3D"50%25" y%3D"50%25" dominant-baseline%3D"middle" text-anchor%3D"middle" font-family%3D"sans-serif" font-size%3D"48" font-weight%3D"bold" fill%3D"%239ca3af"%3EN%2FA%3C%2Ftext%3E%3C%2Fsvg%3E';
const getValidImage = (img?: string | null) => (!img || img === 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c') ? PLACEHOLDER_IMAGE : img;

interface AdminDashboardProps { shopId: string; categories: Category[]; products: Product[]; settings: ShopSettings; shopSlug: string; banners?: Banner[]; shopPlan?: string; planLimits?: any; callStaffEnabled?: boolean; telegramChatId?: string | null; staffCallTopicId?: string | null; newOrderTopicId?: string | null; telegramNotificationsEnabled?: boolean; featCampaign?: boolean; featPos?: boolean; userEmail?: string; userRole?: string; orders?: any[]; ingredients?: any[]; stockLogs?: any[]; }
type OptimisticAction<T> = | { type: 'add'; payload: T } | { type: 'update'; payload: T } | { type: 'delete'; payload: string };
type OptimisticBannerAction = | { type: 'add'; payload: Banner } | { type: 'delete'; payload: string } | { type: 'set'; payload: Banner[] };
interface PendingDelete { productId: string; productSnapshot: Product; name: string; actionFormData: FormData; timeoutId: NodeJS.Timeout; intervalId: NodeJS.Timeout; expiresAt: number; timeLeft: number; }

const allDesigns = ['design1', 'design2', 'design3', 'design4', 'design5', 'design6', 'design7'];

export default function AdminDashboard({ shopId, categories, products, settings, shopSlug, banners = [], shopPlan, planLimits, callStaffEnabled = true, telegramChatId, staffCallTopicId, newOrderTopicId, telegramNotificationsEnabled = false, featCampaign = false, featPos = false, userEmail = "admin@scandine.xyz", userRole = "OWNER", orders = [], ingredients = [], stockLogs = [] }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'menu' | 'categories' | 'inventory' | 'tables' | 'orders' | 'settings' | 'pos'>(featPos ? 'overview' : 'menu');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid'); 
  const [isFormOpen, setIsFormOpen] = useState(false); 
  const [isCatFormOpen, setIsCatFormOpen] = useState(false); 
  const [isQrModalOpen, setIsQrModalOpen] = useState(false); 
  const [previewFormat, setPreviewFormat] = useState<'portrait' | 'landscape'>('portrait'); 
  const [printFormat, setPrintFormat] = useState<'portrait' | 'landscape' | null>(null); 
  
  const [receiptToPrint, setReceiptToPrint] = useState<any>(null); 

  const [paperSize, setPaperSize] = useState<'A4' | 'A5' | '10x15'>('A4');
  const [origin, setOrigin] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [orderFilter, setOrderFilter] = useState('All');
  
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null); 
  const [prodName, setProdName] = useState({ en: '', kh: '', zh: '' });
  const [catName, setCatName] = useState({ en: '', kh: '', zh: '' });
  const [catIsDrink, setCatIsDrink] = useState(false);

  const [previewNameEn, setPreviewNameEn] = useState(settings?.name || '');
  const [previewNameKh, setPreviewNameKh] = useState(settings?.name_kh || '');
  const [previewDisplay, setPreviewDisplay] = useState(settings?.nameDisplay || 'EN');
  const [address, setAddress] = useState(settings?.address || '');
  const [phone, setPhone] = useState(settings?.phone || '');

  const [isStaffEnabled, setIsStaffEnabled] = useState(callStaffEnabled);
  const [tgChatId, setTgChatId] = useState(telegramChatId || '');
  const [tgStaffCallTopicId, setTgStaffCallTopicId] = useState(staffCallTopicId || '');
  const [tgNewOrderTopicId, setTgNewOrderTopicId] = useState(newOrderTopicId || '');
  const [isTestingTg, setIsTestingTg] = useState(false);

  const [deleteConfirmation, setDeleteConfirmation] = useState<{isOpen: boolean; type: 'product' | 'category' | null; id: string | null; name: string | null; actionFormData: FormData | null;}>({ isOpen: false, type: null, id: null, name: null, actionFormData: null });
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null);
  const pendingDeleteRef = useRef<PendingDelete | null>(null);

  const getInitialHours = () => { if (!settings?.openingHours) return { open: '08:00', close: '22:00' }; const parts = settings.openingHours.split(' - '); if (parts.length === 2) return { open: parts[0], close: parts[1] }; return { open: '08:00', close: '22:00' }; };
  const initialHours = getInitialHours();
  const [openTime, setOpenTime] = useState(initialHours.open);
  const [closeTime, setCloseTime] = useState(initialHours.close);

  const [prepTime, setPrepTime] = useState('15');
  const [isHotSale, setIsHotSale] = useState(false);
  const [isSoldOutState, setIsSoldOutState] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openSection, setOpenSection] = useState<string | null>('identity');
  const [toast, setToast] = useState<{ show: boolean; message: string }>({ show: false, message: '' });
  const [dismissGuide, setDismissGuide] = useState(false);
  const [draggedBannerIndex, setDraggedBannerIndex] = useState<number | null>(null);
  
  const safeLimits = planLimits || { maxProducts: 0, maxCategories: 0, maxBanners: 0, overrideHeaderStyle: null, premiumThemes: false, customSocials: false, featMultipleLanguage: false, featAlertBarista: false };
  const canUsePremiumThemes = safeLimits.premiumThemes;
  const canUseCustomSocials = safeLimits.customSocials;
  const multiLanguageEnabled = !!safeLimits.featMultipleLanguage;
  const canUseTelegram = !!safeLimits.featAlertBarista;
  const isFreePlan = shopPlan === 'FREE' || shopPlan === 'STARTER'; 

  const [headerDesign, setHeaderDesign] = useState(settings?.headerDesign || 'design1');
  const [themeColorPreview, setThemeColorPreview] = useState(settings?.themeColor || '#000000');
  const currentDesignIndex = allDesigns.indexOf(headerDesign);
  const isCurrentDesignLocked = isFreePlan && currentDesignIndex > 3 && headerDesign !== safeLimits.overrideHeaderStyle;

  const [dirtySections, setDirtySections] = useState<Record<string, boolean>>({});
  const [pendingNav, setPendingNav] = useState<{ type: 'tab' | 'section', payload: any, source: string } | null>(null);

  const markDirty = (section: string) => setDirtySections(prev => ({ ...prev, [section]: true }));
  const clearDirty = (section: string) => setDirtySections(prev => ({ ...prev, [section]: false }));

  const [optProducts, dispatchOptProducts] = useOptimistic(products, (state, action: OptimisticAction<Product>) => { switch (action.type) { case 'add': return [action.payload, ...state]; case 'update': return state.map(p => p.id === action.payload.id ? action.payload : p); case 'delete': return state.filter(p => p.id !== action.payload); default: return state; } });
  const [optCategories, dispatchOptCategories] = useOptimistic(categories, (state, action: OptimisticAction<Category>) => { switch (action.type) { case 'add': return [...state, action.payload].sort((a, b) => a.sortOrder - b.sortOrder); case 'update': return state.map(c => c.id === action.payload.id ? action.payload : c).sort((a, b) => a.sortOrder - b.sortOrder); case 'delete': return state.filter(c => c.id !== action.payload); default: return state; } });
  const [optBanners, dispatchOptBanners] = useOptimistic(banners, (state, action: OptimisticBannerAction) => { switch (action.type) { case 'add': return [...state, action.payload].sort((a, b) => a.sortOrder - b.sortOrder); case 'delete': return state.filter(b => b.id !== action.payload); case 'set': return action.payload; default: return state; } });

  const [cropTarget, setCropTarget] = useState<'logo' | 'product' | 'banner' | null>(null);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [cropAspect, setCropAspect] = useState<number>(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const [logoPreview, setLogoPreview] = useState(settings?.logo || '');
  const [logoType, setLogoType] = useState(settings?.logoType || 'withBackground');
  const [isDirtyLogo, setIsDirtyLogo] = useState(false);
  const [logoFileBlob, setLogoFileBlob] = useState<Blob | null>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const productInputRef = useRef<HTMLInputElement>(null);
  const [productPreview, setProductPreview] = useState('');
  const [productFileBlob, setProductFileBlob] = useState<Blob | null>(null);
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>(() => { try { return settings?.socials ? JSON.parse(settings.socials) : []; } catch { return []; } });

  const hasCategory = optCategories.length > 0;
  const hasProduct = optProducts.length > 0;
  const hasSettings = !!settings?.address || !!settings?.logo || !!settings?.phone;
  const isGuideComplete = hasCategory && hasProduct && hasSettings;
  const isNoBg = logoType === 'withoutBackground';
  const isAdmin = userRole === 'OWNER' || userRole === 'SUPERADMIN';

  useEffect(() => { setOrigin(window.location.origin); const afterPrint = () => setPrintFormat(null); window.addEventListener('afterprint', afterPrint); return () => { window.removeEventListener('afterprint', afterPrint); if (pendingDeleteRef.current) { clearTimeout(pendingDeleteRef.current.timeoutId); clearInterval(pendingDeleteRef.current.intervalId); deleteProduct(pendingDeleteRef.current.actionFormData).catch(() => {}); } }; }, []);
  useEffect(() => { setLogoPreview(settings?.logo || ''); setLogoType(settings?.logoType || 'withBackground'); setIsDirtyLogo(false); }, [settings?.logo, settings?.logoType]);
  useEffect(() => { if (editingProduct) { setProductPreview(getValidImage(editingProduct.image) === PLACEHOLDER_IMAGE ? '' : editingProduct.image); setProductFileBlob(null); setProdName({ en: editingProduct.name || '', kh: editingProduct.name_kh || '', zh: editingProduct.name_zh || '' }); setPrepTime(editingProduct.time ? editingProduct.time.replace(/\D/g, '') : '15'); setIsHotSale(editingProduct.isPopular || false); setIsSoldOutState(editingProduct.isSoldOut || false); } else if (isFormOpen) { setProductPreview(''); setProductFileBlob(null); setProdName({ en: '', kh: '', zh: '' }); setPrepTime('15'); setIsHotSale(false); setIsSoldOutState(false); } }, [editingProduct, isFormOpen]);
  useEffect(() => { if (editingCategory) { setCatName({ en: editingCategory.name || '', kh: editingCategory.name_kh || '', zh: editingCategory.name_zh || '' }); setCatIsDrink(editingCategory.isDrink || false); } else if (isCatFormOpen) { setCatName({ en: '', kh: '', zh: '' }); setCatIsDrink(false); } }, [editingCategory, isCatFormOpen]);

  const showToast = (message: string) => { setToast({ show: true, message }); setTimeout(() => setToast({ show: false, message: '' }), 3000); };
  const getPreviewScale = () => { if (previewFormat === 'portrait') return paperSize === 'A4' ? 'scale(0.28)' : paperSize === 'A5' ? 'scale(0.24)' : 'scale(0.22)'; return paperSize === 'A4' ? 'scale(0.3)' : paperSize === 'A5' ? 'scale(0.26)' : 'scale(0.24)'; };
  const getShopNamePreview = () => { if (previewDisplay === 'KH' && previewNameKh) return previewNameKh; if (previewDisplay === 'BOTH' && previewNameKh) return `${previewNameEn} ${previewNameKh}`; return previewNameEn || 'Shop Name'; };

  const handleGeneratePDF = (format: 'portrait' | 'landscape') => { setPrintFormat(format); setTimeout(() => { window.print(); }, 500); };
  
  const handleReprintOrder = (order: any) => {
    setReceiptToPrint(order);
    setTimeout(() => {
      window.print();
      setTimeout(() => setReceiptToPrint(null), 1000);
    }, 300);
  };

  const executeNav = (type: 'tab' | 'section', payload: any) => { if (type === 'tab') { setActiveTab(payload); setIsMobileMenuOpen(false); } else if (type === 'section') { setOpenSection(openSection === payload ? null : payload); } };
  const handleTabClick = (tab: any) => { if (activeTab === tab) return; if (activeTab === 'settings' && openSection && dirtySections[openSection]) { setPendingNav({ type: 'tab', payload: tab, source: openSection }); } else { executeNav('tab', tab); } };
  const handleSectionClick = (section: string) => { if (openSection && dirtySections[openSection]) { setPendingNav({ type: 'section', payload: openSection === section ? null : section, source: openSection }); } else { executeNav('section', section); } };
  
  const discardChanges = (source: string) => { if (source === 'identity') { setPreviewNameEn(settings?.name || ''); setPreviewNameKh(settings?.name_kh || ''); setPreviewDisplay(settings?.nameDisplay || 'EN'); setAddress(settings?.address || ''); setPhone(settings?.phone || ''); const initH = getInitialHours(); setOpenTime(initH.open); setCloseTime(initH.close); } else if (source === 'branding') { setHeaderDesign(settings?.headerDesign || 'design1'); setThemeColorPreview(settings?.themeColor || '#000000'); setLogoPreview(settings?.logo || ''); setLogoType(settings?.logoType || 'withBackground'); setIsDirtyLogo(false); setLogoFileBlob(null); } else if (source === 'socials') { try { setSocialLinks(settings?.socials ? JSON.parse(settings.socials) : []); } catch { setSocialLinks([]); } } else if (source === 'notifications') { setIsStaffEnabled(callStaffEnabled); setTgChatId(telegramChatId || ''); setTgStaffCallTopicId(staffCallTopicId || ''); setTgNewOrderTopicId(newOrderTopicId || ''); } };
  const saveIdentityForm = async () => { const fd = new FormData(); fd.set('name', !previewNameEn.trim() && previewNameKh.trim() ? previewNameKh.trim() : previewNameEn.trim()); if (previewNameKh.trim()) fd.set('name_kh', previewNameKh.trim()); fd.set('nameDisplay', previewDisplay); fd.set('address', address); fd.set('phone', phone); fd.set('openingHours', `${openTime} - ${closeTime}`); try { await updateShopIdentity(fd); return true; } catch(e) { showToast("Error saving information."); return false; } };
  const saveBrandingForm = async () => { if (isCurrentDesignLocked) return false; const fd = new FormData(); fd.set('headerDesign', headerDesign); fd.set('themeColor', themeColorPreview); fd.set('logoType', logoType); if (logoFileBlob) fd.set('logo', logoFileBlob, 'logo.webp'); try { await updateShopBranding(fd); return true; } catch (e) { showToast("Error saving branding."); return false; } };
  const saveSocialsForm = async () => { const fd = new FormData(); fd.set('socials', JSON.stringify(socialLinks)); try { const res = await updateShopSocials(fd); if (res?.error) { showToast(res.error); return false; } return true; } catch (e) { showToast("Error saving socials."); return false; } };
  const saveNotificationsForm = async () => { try { const res = await updateStaffSettingsAction(shopId, isStaffEnabled, tgChatId, tgStaffCallTopicId, tgNewOrderTopicId); if (!res.success) { showToast(res.message || "Error saving"); return false; } return true; } catch (e) { return false; } };
  const handleTestTelegram = async (type: 'General' | 'Staff Call' | 'New Order', specificTopicId?: string) => { if (!tgChatId.trim()) { showToast("Please enter a Chat ID first."); return; } setIsTestingTg(true); const res = await sendTestTelegramNotification(shopId, tgChatId, settings?.name || 'Your Shop', specificTopicId, type); showToast(res.message || (res.success ? "Test message sent!" : "Failed to send message.")); setIsTestingTg(false); };
  const onIdentitySubmit = (e?: React.FormEvent) => { if (e) e.preventDefault(); if (!previewNameEn.trim() && !previewNameKh.trim()) { showToast("Please enter at least one shop name."); return; } clearDirty('identity'); showToast("Basic information saved!"); startTransition(async () => { await saveIdentityForm(); }); };
  const onBrandingSubmit = (e?: React.FormEvent) => { if (e) e.preventDefault(); if (isCurrentDesignLocked) return; clearDirty('branding'); setIsDirtyLogo(false); showToast("Branding updated!"); startTransition(async () => { await saveBrandingForm(); setLogoFileBlob(null); }); };
  const onSocialsSubmit = (e?: React.FormEvent) => { if (e) e.preventDefault(); clearDirty('socials'); showToast("Social Media Links saved!"); startTransition(async () => { await saveSocialsForm(); }); };
  const onNotificationsSubmit = (e?: React.FormEvent) => { if (e) e.preventDefault(); clearDirty('notifications'); showToast("Notification settings saved!"); startTransition(async () => { await saveNotificationsForm(); }); };
  
  const handleMoveBanner = async (index: number, direction: number) => { if (index + direction < 0 || index + direction >= optBanners.length) return; const newBanners = [...optBanners].sort((a,b) => a.sortOrder - b.sortOrder); const tempOrder = newBanners[index].sortOrder; newBanners[index].sortOrder = newBanners[index + direction].sortOrder; newBanners[index + direction].sortOrder = tempOrder; newBanners.sort((a,b) => a.sortOrder - b.sortOrder); startTransition(() => { dispatchOptBanners({ type: 'set', payload: newBanners }); }); startTransition(async () => { await reorderBanners(newBanners.map(b => ({ id: b.id, sortOrder: b.sortOrder }))); showToast("Banners reordered!"); }); };
  const handleDragStart = (e: React.DragEvent, index: number) => { setDraggedBannerIndex(index); e.dataTransfer.effectAllowed = "move"; };
  const handleDragOver = (e: React.DragEvent, index: number) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; };
  const handleDrop = async (e: React.DragEvent, dropIndex: number) => { e.preventDefault(); if (draggedBannerIndex === null || draggedBannerIndex === dropIndex) { setDraggedBannerIndex(null); return; } const newBanners = [...optBanners].sort((a,b) => a.sortOrder - b.sortOrder); const draggedItem = newBanners[draggedBannerIndex]; newBanners.splice(draggedBannerIndex, 1); newBanners.splice(dropIndex, 0, draggedItem); newBanners.forEach((b, i) => b.sortOrder = i + 1); startTransition(() => { dispatchOptBanners({ type: 'set', payload: newBanners }); }); setDraggedBannerIndex(null); startTransition(async () => { await reorderBanners(newBanners.map(b => ({ id: b.id, sortOrder: b.sortOrder }))); showToast("Banners reordered!"); }); };
  
  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>, target: 'logo' | 'product' | 'banner') => { if (e.target.files && e.target.files.length > 0) { const file = e.target.files[0]; const reader = new FileReader(); reader.addEventListener('load', () => { setCropImageSrc(reader.result as string); setCropTarget(target); setZoom(1); setCropAspect(target === 'banner' ? 16 / 9 : 1); }); reader.readAsDataURL(file); e.target.value = ''; } };
  const onCropComplete = (_: any, croppedAreaPixels: any) => setCroppedAreaPixels(croppedAreaPixels);
  const showCroppedImage = async () => { if (!cropImageSrc || !croppedAreaPixels) return; try { const croppedBlob = await getCroppedImg(cropImageSrc, croppedAreaPixels); if (croppedBlob) { const objectUrl = URL.createObjectURL(croppedBlob); const currentTarget = cropTarget; setCropImageSrc(null); setCropTarget(null); if (currentTarget === 'logo') { setLogoFileBlob(croppedBlob); setLogoPreview(objectUrl); setIsDirtyLogo(true); markDirty('branding'); } else if (currentTarget === 'product') { setProductFileBlob(croppedBlob); setProductPreview(objectUrl); } else if (currentTarget === 'banner') { const fd = new FormData(); fd.append('image', croppedBlob, 'banner.webp'); const tempId = `temp-${Date.now()}`; const nextOrder = optBanners.length > 0 ? Math.max(...optBanners.map(b => b.sortOrder)) + 1 : 1; startTransition(() => { dispatchOptBanners({ type: 'add', payload: { id: tempId, image: objectUrl, sortOrder: nextOrder } }); }); startTransition(async () => { const res = await addBanner(fd); if (res?.error) { showToast(res.error); startTransition(() => { dispatchOptBanners({ type: 'delete', payload: tempId }); }); } else { showToast("Banner added!"); } }); } } } catch (e) { console.error(e); } };
  
  const cancelLogoChange = () => { setLogoPreview(settings?.logo || ''); setLogoType(settings?.logoType || 'withBackground'); setIsDirtyLogo(false); setLogoFileBlob(null); };
  const addSocialLink = () => { setSocialLinks([...socialLinks, { id: Date.now().toString(), platform: 'website', url: '', active: true }]); markDirty('socials'); };
  const removeSocialLink = (id: string) => { setSocialLinks(socialLinks.filter(l => l.id !== id)); markDirty('socials'); };
  const updateSocialLink = (id: string, field: keyof SocialLink, value: any) => { setSocialLinks(socialLinks.map(l => l.id === id ? { ...l, [field]: value } : l)); markDirty('socials'); };
  const getPlatformIcon = (platform: string) => { switch (platform) { case 'facebook': return <Facebook size={18}/>; case 'instagram': return <Instagram size={18}/>; case 'telegram': return <Send size={18}/>; case 'youtube': return <Youtube size={18}/>; case 'twitter': return <Twitter size={18}/>; case 'linkedin': return <Linkedin size={18}/>; default: return <Globe size={18}/>; } };
  
  const handlePrevDesign = (e?: React.MouseEvent) => { if (e) e.stopPropagation(); const idx = allDesigns.indexOf(headerDesign); setHeaderDesign(allDesigns[(idx - 1 + allDesigns.length) % allDesigns.length]); markDirty('branding'); };
  const handleNextDesign = (e?: React.MouseEvent) => { if (e) e.stopPropagation(); const idx = allDesigns.indexOf(headerDesign); setHeaderDesign(allDesigns[(idx + 1) % allDesigns.length]); markDirty('branding'); };
  
  const filteredProducts = optProducts.filter(p => (p.name.toLowerCase().includes(searchQuery.toLowerCase()) || (p.category?.name || '').toLowerCase().includes(searchQuery.toLowerCase())) && p.id !== pendingDelete?.productId);
  const confirmDelete = (type: 'product' | 'category', id: string, name: string, fd: FormData) => { setDeleteConfirmation({ isOpen: true, type, id, name, actionFormData: fd }); };
  const handleConfirmDeleteAction = () => { if (!deleteConfirmation.actionFormData || !deleteConfirmation.type || !deleteConfirmation.id) return; const fd = deleteConfirmation.actionFormData; const type = deleteConfirmation.type; const id = deleteConfirmation.id; const name = deleteConfirmation.name || 'Item'; if (type === 'product') { if (pendingDeleteRef.current) { const prev = pendingDeleteRef.current; clearTimeout(prev.timeoutId); clearInterval(prev.intervalId); startTransition(() => dispatchOptProducts({ type: 'delete', payload: prev.productId })); startTransition(async () => { await deleteProduct(prev.actionFormData); }); } const snapshot = optProducts.find(p => p.id === id); if (!snapshot) return; const expiresAt = Date.now() + 5000; const intervalId = setInterval(() => { setPendingDelete(curr => { if (!curr) return null; const left = Math.ceil((curr.expiresAt - Date.now()) / 1000); if (left <= 0) { clearInterval(curr.intervalId); } return { ...curr, timeLeft: left }; }); }, 1000); const timeoutId = setTimeout(() => { if (pendingDeleteRef.current?.productId === id) { clearInterval(pendingDeleteRef.current.intervalId); startTransition(() => dispatchOptProducts({ type: 'delete', payload: id })); startTransition(async () => { await deleteProduct(fd); }); setPendingDelete(null); pendingDeleteRef.current = null; } }, 5000); const newPending: PendingDelete = { productId: id, productSnapshot: snapshot, name, actionFormData: fd, timeoutId, intervalId, expiresAt, timeLeft: 5 }; setPendingDelete(newPending); pendingDeleteRef.current = newPending; } else if (type === 'category') { startTransition(() => dispatchOptCategories({ type: 'delete', payload: id })); startTransition(async () => { await deleteCategory(fd); showToast("Category deleted"); }); } setDeleteConfirmation({ isOpen: false, type: null, id: null, name: null, actionFormData: null }); };

  const renderPrintTemplate = (format: 'portrait' | 'landscape') => {
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(origin ? `${origin}/${shopSlug}` : `https://scandine.xyz/${shopSlug}`)}`;
    return (
      <div className="border-[16px] border-[#1a1a1a] rounded-[48px] flex items-center justify-center bg-white text-[#4a4a4a] relative font-sans" style={{ width: format === 'landscape' ? '1000px' : '650px', height: format === 'landscape' ? '650px' : '1000px', flexDirection: format === 'landscape' ? 'row' : 'column', boxSizing: 'border-box', padding: format === 'landscape' ? '3rem 4rem' : '4rem 3rem' }}>
        {format === 'landscape' ? (
          <><div className="flex-1 flex flex-col items-center justify-center text-center px-6 w-1/2"><h1 className="text-[3.5rem] leading-[1.2] font-light text-gray-600 mb-2 tracking-wide break-words max-w-full font-sans">{getShopNamePreview()}</h1><p className="text-[2.5rem] text-gray-500 mb-12 font-light">scan to view menu !</p><div className="flex items-center w-full justify-center gap-4 mb-8"><div className="flex-1 h-[1px] bg-gray-400"></div><div className="relative flex items-center justify-center px-4"><div className="absolute w-14 h-14 bg-[#1a1a1a] rounded-full z-0"></div><div className="relative bg-[#333] rounded-xl w-10 h-16 flex items-center justify-center shadow-md z-10 border-[3px] border-[#1a1a1a]"><div className="bg-white w-[26px] h-[34px] rounded-[2px] flex items-center justify-center"><QrCode size={18} className="text-black" /></div><div className="absolute top-1 w-2.5 h-[2px] bg-gray-400 rounded-full"></div><div className="absolute bottom-1 w-1.5 h-1.5 bg-gray-400 rounded-full"></div></div></div><div className="flex-1 h-[1px] bg-gray-400"></div></div><p className="text-lg text-gray-500 font-medium tracking-wide">www.scandine.xyz</p></div><div className="flex-1 flex justify-center items-center w-1/2 pl-4"><div className="relative w-[400px] h-[400px] overflow-hidden"><LazyImage src={qrCodeUrl} alt="Shop QR Code" className="w-[400px] h-[400px] object-contain" /></div></div></>
        ) : (
          <><div className="flex flex-col items-center justify-center text-center mt-2 w-full px-4"><h1 className="text-[4rem] leading-[1.2] font-light text-gray-600 mb-2 tracking-wide break-words max-w-full font-sans">{getShopNamePreview()}</h1><p className="text-[3rem] text-gray-500 font-light">scan to view menu !</p></div><div className="flex justify-center items-center flex-1 w-full my-6"><div className="relative w-[450px] h-[450px] overflow-hidden"><LazyImage src={qrCodeUrl} alt="Shop QR Code" className="w-[450px] h-[450px] object-contain" /></div></div><div className="flex flex-col items-center justify-center text-center w-full px-8 mb-4"><div className="flex items-center w-full justify-center gap-4 mb-8"><div className="flex-1 h-[1px] bg-gray-400"></div><div className="relative flex items-center justify-center px-4"><div className="absolute w-16 h-16 bg-[#1a1a1a] rounded-full z-0"></div><div className="relative bg-[#333] rounded-2xl w-12 h-20 flex items-center justify-center shadow-md z-10 border-[3px] border-[#1a1a1a]"><div className="bg-white w-8 h-12 rounded-[2px] flex items-center justify-center"><QrCode size={22} className="text-black" /></div><div className="absolute top-1.5 w-3 h-[2px] bg-gray-400 rounded-full"></div><div className="absolute bottom-1.5 w-2 h-2 bg-gray-400 rounded-full"></div></div></div><div className="flex-1 h-[1px] bg-gray-400"></div></div><p className="text-2xl text-gray-500 font-medium tracking-wide">www.scandine.xyz</p></div></>
        )}
      </div>
    );
  };

  const fallbackLogo = 'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?auto=format&fit=crop&w=100&q=80';

  return (
    <div className={`flex min-h-screen bg-[#F9FAFB] font-sans text-gray-800 relative`} style={{ '--theme-color': settings?.themeColor || '#000000' } as React.CSSProperties}>
      
      {/* INVISIBLE RECEIPT FOR HISTORICAL PRINTING */}
      {receiptToPrint && (
        <>
          <style>{`
            @media print {
              @page { 
                margin: 0; 
                size: 57mm auto; 
              }
              html, body {
                background: white !important;
                height: auto !important;
                min-height: 0 !important;
              }
              .min-h-screen, .h-screen, .h-full {
                min-height: 0 !important;
                height: auto !important;
              }
              aside, header, nav, main, .md\\:hidden { 
                display: none !important; 
              }
              #dashboard-receipt-print-area { 
                display: block !important; 
                position: absolute !important; 
                top: 0 !important; 
                left: 0 !important; 
                width: 57mm !important; 
                margin: 0 !important; 
                padding: 0 !important; 
              }
            }
          `}</style>
          <div id="dashboard-receipt-print-area" className="hidden print:block bg-white z-[99999]">
             <PosReceipt order={receiptToPrint} shopName={settings?.name || "Shop"} />
          </div>
        </>
      )}

      {/* Pending Delete Undo Toast */}
      {pendingDelete && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[110] w-[90vw] max-w-sm bg-gray-900 shadow-2xl p-2 rounded-2xl flex flex-row items-center gap-3 animate-in slide-in-from-bottom-5 fade-in duration-300 print:hidden">
          <div className="flex items-center flex-1 overflow-hidden pl-2"><span className="text-sm text-gray-300 truncate w-full flex items-center gap-2"><span>Deleted <span className="font-bold text-white">"{pendingDelete.name}"</span></span></span></div>
          <div className="flex items-center gap-2 shrink-0 pr-1"><span className="text-xs font-bold px-2 py-1 bg-white/10 text-white rounded-lg">{pendingDelete.timeLeft}s</span><button type="button" onClick={() => { clearTimeout(pendingDelete.timeoutId); clearInterval(pendingDelete.intervalId); setPendingDelete(null); pendingDeleteRef.current = null; }} className="text-gray-900 font-bold text-sm bg-white px-4 py-2 rounded-xl hover:bg-gray-100 active:scale-95 transition-transform">Undo</button></div>
        </div>
      )}

      <div className={`fixed top-6 right-6 z-[100] transition-all duration-500 transform ${toast.show ? 'translate-y-0 opacity-100' : '-translate-y-10 opacity-0 pointer-events-none'} print:hidden`}>
        <div className="bg-gray-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3"><div className="bg-green-500 rounded-full p-1"><Check size={14} strokeWidth={3} className="text-white" /></div><span className="font-bold text-sm">{toast.message}</span></div>
      </div>

      <div className="md:hidden fixed top-0 left-0 w-full bg-white z-20 px-4 py-3 flex items-center justify-between gap-4 border-b border-gray-100 shadow-sm print:hidden">
        <div className="flex items-center gap-3 overflow-hidden">
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 bg-gray-50 rounded-xl active:scale-95 transition-transform shrink-0"><Menu size={22} className="text-gray-700" /></button>
          <h1 className="font-bold text-lg tracking-tight text-gray-900 truncate font-sans">{getShopNamePreview() || 'AdminPanel'}</h1>
        </div>
        <button onClick={() => handleTabClick('settings')} className="p-2 bg-gray-50 rounded-xl text-gray-700 active:scale-95 transition-transform shrink-0"><Settings size={20} /></button>
      </div>

      <aside className={`fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-100 transition-transform duration-300 md:translate-x-0 md:static flex-shrink-0 flex flex-col ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} print:hidden`}>
        <div className="px-6 md:px-8 pb-6 md:pb-8 pt-20 md:pt-8 h-full flex flex-col overflow-hidden">
          <div className="mb-6 hidden md:block">
            <h1 className="font-bold text-xl font-sans line-clamp-1 text-gray-900">{getShopNamePreview() || 'AdminPanel'}</h1>
            <span className={`inline-block mt-2 px-2.5 py-1 rounded-md text-[10px] uppercase font-bold tracking-wider ${shopPlan === 'STARTER' || isFreePlan ? 'bg-orange-50 text-orange-600' : 'bg-orange-50 text-orange-600'}`}>{shopPlan} PLAN</span>
          </div>
          <nav className="space-y-2 flex-1 overflow-y-auto no-scrollbar [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            
            {featPos && (
              <>
                <button onClick={() => handleTabClick('overview')} className={`w-full flex gap-3 px-4 py-3 rounded-xl ${activeTab === 'overview' ? 'bg-gray-900 text-white font-bold shadow-md' : 'text-gray-500 font-medium hover:bg-gray-50 active:scale-[0.98] transition-all'}`}><Activity size={20}/> Overview</button>
                <button onClick={() => handleTabClick('pos')} className={`w-full flex gap-3 px-4 py-3 rounded-xl ${activeTab === 'pos' ? 'bg-gray-900 text-white font-bold shadow-md' : 'text-gray-500 font-medium hover:bg-gray-50 active:scale-[0.98] transition-all'}`}><ShoppingCart size={20}/> POS</button>
                <button onClick={() => handleTabClick('orders')} className={`w-full flex gap-3 px-4 py-3 rounded-xl ${activeTab === 'orders' ? 'bg-gray-900 text-white font-bold shadow-md' : 'text-gray-500 font-medium hover:bg-gray-50 active:scale-[0.98] transition-all'}`}><ClipboardList size={20}/> Orders</button>
              </>
            )}
            
            {!isFreePlan && (
               <button onClick={() => handleTabClick('tables')} className={`w-full flex gap-3 px-4 py-3 rounded-xl ${activeTab === 'tables' ? 'bg-gray-900 text-white font-bold shadow-md' : 'text-gray-500 font-medium hover:bg-gray-50 active:scale-[0.98] transition-all'}`}><QrCode size={20}/> Tables & QR</button>
            )}

            {isAdmin && (
              <div className="mt-8 pt-4 border-t border-gray-100">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block px-4">Management</span>
                <button onClick={() => handleTabClick('menu')} className={`w-full flex gap-3 px-4 py-3 rounded-xl ${activeTab === 'menu' ? 'bg-gray-900 text-white font-bold shadow-md' : 'text-gray-500 font-medium hover:bg-gray-50 active:scale-[0.98] transition-all'}`}><LayoutGrid size={20}/> Menu</button>
                <button onClick={() => handleTabClick('categories')} className={`w-full flex gap-3 px-4 py-3 rounded-xl ${activeTab === 'categories' ? 'bg-gray-900 text-white font-bold shadow-md' : 'text-gray-500 font-medium hover:bg-gray-50 active:scale-[0.98] transition-all'}`}><List size={20}/> Categories</button>
                
                {/* INVENTORY TAB */}
                <button onClick={() => handleTabClick('inventory')} className={`w-full flex gap-3 px-4 py-3 rounded-xl ${activeTab === 'inventory' ? 'bg-gray-900 text-white font-bold shadow-md' : 'text-gray-500 font-medium hover:bg-gray-50 active:scale-[0.98] transition-all'}`}><Package size={20}/> Inventory</button>
                
                <button onClick={() => handleTabClick('settings')} className={`w-full flex gap-3 px-4 py-3 rounded-xl ${activeTab === 'settings' ? 'bg-gray-900 text-white font-bold shadow-md' : 'text-gray-500 font-medium hover:bg-gray-50 active:scale-[0.98] transition-all'}`}><Settings size={20}/> Settings</button>
              </div>
            )}
          </nav>
          <div className="pt-6 border-t border-gray-100 mt-auto shrink-0">
            <button onClick={() => signOut({ callbackUrl: '/auth/login' })} className="w-full flex items-center gap-3 font-semibold text-gray-400 px-4 py-2 hover:text-gray-800 transition active:scale-95"><LogOut size={18}/> Log Out</button>
          </div>
        </div>
      </aside>

      {isMobileMenuOpen && <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-20 md:hidden print:hidden" onClick={() => setIsMobileMenuOpen(false)} />}

      <main className={`flex-1 w-full max-w-full no-scrollbar [&::-webkit-scrollbar]:hidden ${activeTab === 'pos' ? 'flex flex-col h-screen pt-[60px] md:pt-0 overflow-hidden bg-white print:h-auto print:overflow-visible print:pt-0' : 'p-4 pt-20 md:p-8 pb-28 md:pb-8 overflow-y-auto print:overflow-visible'}`} style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        
        {userEmail?.includes('demo_') && (
          <div className="mb-6 bg-orange-50 border border-orange-100 p-4 rounded-2xl flex items-center justify-between animate-in slide-in-from-top-4 print:hidden">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
                <Sparkles size={18} />
              </div>
              <div>
                <p className="text-sm font-bold text-orange-900">You are in Demo Mode</p>
                <p className="text-xs text-orange-700">Make any changes you like! This temporary account is yours for 1 hour.</p>
              </div>
            </div>
            <Link href="/auth/register" className="hidden sm:block bg-orange-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-orange-700 transition-colors">
              Create Your Own Shop
            </Link>
          </div>
        )}

        {/* OVERVIEW */}
        {featPos && (
          <div className={activeTab === 'overview' ? 'block animate-in fade-in duration-300' : 'hidden'}>
            <DashboardOverview orders={orders} products={products} />
          </div>
        )}

        {/* POS */}
        {featPos && (
          <div className={activeTab === 'pos' ? 'block h-full flex flex-col min-h-0' : 'hidden'}>
            <ToastProvider>
              <OrderProvider>
                <AdminPosSection dashboardCategories={optCategories} dashboardProducts={optProducts} shopId={shopId} userEmail={userEmail} userRole={userRole} shopName={settings?.name || "Shop"} />
              </OrderProvider>
            </ToastProvider>
          </div>
        )}

        {/* ORDERS */}
        {featPos && (
           <div className={`${activeTab === 'orders' ? 'block animate-in fade-in duration-300' : 'hidden'} max-w-5xl mx-auto pb-12 print:hidden`}>
              <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Order History</h2>
                  <p className="text-sm text-gray-500 mt-1">Review past transactions generated from the POS.</p>
                </div>
                
                {/* Quick Filters */}
                <div className="flex bg-gray-100 p-1 rounded-xl shrink-0 w-full sm:w-auto overflow-x-auto no-scrollbar">
                  {['All', 'Today', 'Completed', 'Cancelled'].map(f => (
                    <button 
                      key={f} 
                      onClick={() => setOrderFilter(f)} 
                      className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${orderFilter === f ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </header>

              <div className="space-y-4">
                {orders?.filter(o => {
                   if (orderFilter === 'Completed') return o.status !== 'CANCELLED';
                   if (orderFilter === 'Cancelled') return o.status === 'CANCELLED';
                   if (orderFilter === 'Today') {
                     const today = new Date().toDateString();
                     return new Date(o.createdAt).toDateString() === today;
                   }
                   return true; 
                }).map((order) => (
                  <OrderHistoryCard 
                    key={order.id} 
                    order={order} 
                    onPrint={() => handleReprintOrder(order)} 
                  />
                ))}
                
                {(!orders || orders.filter(o => {
                   if (orderFilter === 'Completed') return o.status !== 'CANCELLED';
                   if (orderFilter === 'Cancelled') return o.status === 'CANCELLED';
                   if (orderFilter === 'Today') {
                     const today = new Date().toDateString();
                     return new Date(o.createdAt).toDateString() === today;
                   }
                   return true; 
                }).length === 0) && (
                  <div className="bg-white rounded-3xl border border-gray-100 shadow-sm py-16 text-center">
                    <ClipboardList size={32} className="mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500 font-medium">No orders match this filter.</p>
                  </div>
                )}
              </div>
           </div>
        )}

        {/* INVENTORY */}
        {isAdmin && (
           <div className={`${activeTab === 'inventory' ? 'block animate-in fade-in duration-300' : 'hidden'} pb-12 print:hidden max-w-5xl mx-auto`}>
             <InventoryManager userName={userEmail ? userEmail.split('@')[0] : 'Admin'} ingredients={ingredients} stockLogs={stockLogs} />
           </div>
        )}

        {/* Shared Header for standard tabs */}
        {activeTab !== 'overview' && activeTab !== 'pos' && activeTab !== 'orders' && activeTab !== 'inventory' && (
          <header className="flex flex-col sm:flex-row justify-between mb-6 items-start sm:items-center gap-4 print:hidden">
             <h2 className="text-2xl font-bold capitalize hidden sm:block">{activeTab}</h2>
             <div className="flex w-full sm:w-auto gap-3">
               <a href={`/${shopSlug}`} target="_blank" rel="noopener noreferrer" className="flex-1 sm:flex-none flex justify-center items-center gap-2 px-4 py-3.5 sm:py-2.5 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-gray-800 transition-all shadow-sm active:scale-95"><ExternalLink size={16} /> View Live Menu</a>
               <button onClick={() => setIsQrModalOpen(true)} className="flex-1 sm:flex-none flex justify-center items-center gap-2 px-4 py-3.5 sm:py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:border-gray-300 transition-all shadow-sm active:scale-95"><QrCode size={16} className="text-gray-500"/> Get Shop QR</button>
             </div>
          </header>
        )}

        {/* Onboarding Guide */}
        {activeTab !== 'overview' && activeTab !== 'pos' && activeTab !== 'orders' && activeTab !== 'inventory' && !isGuideComplete && !dismissGuide && (
          <div className="mb-8 bg-white p-6 rounded-3xl border border-gray-900 shadow-sm relative overflow-hidden animate-in fade-in slide-in-from-top-4 print:hidden">
            <div className="absolute top-0 left-0 w-2 h-full bg-gray-900"></div>
            <div className="flex justify-between items-start mb-4">
               <div><h3 className="text-lg font-bold text-gray-900">Welcome to your dashboard! 👋</h3><p className="text-sm text-gray-500 mt-1">Complete these steps to get your menu live.</p></div>
               <button onClick={() => setDismissGuide(true)} className="text-gray-400 hover:text-gray-600 p-1 active:scale-95 transition-transform"><X size={20}/></button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
               <button onClick={() => { handleTabClick('categories'); if(!hasCategory) setIsCatFormOpen(true); }} className={`p-4 rounded-2xl text-left flex flex-col gap-2 border transition-all active:scale-[0.98] ${hasCategory ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200 hover:border-gray-900'}`}><div className="flex justify-between items-center w-full"><span className={`text-sm font-bold ${hasCategory ? 'text-green-700' : 'text-gray-700'}`}>1. Create Category</span>{hasCategory ? <CheckCircle size={18} className="text-green-500" /> : <div className="w-4 h-4 rounded-full border-2 border-gray-300"></div>}</div><span className="text-xs text-gray-500">Organize your menu structure.</span></button>
               <button onClick={() => { handleTabClick('menu'); if(!hasProduct) setIsFormOpen(true); }} className={`p-4 rounded-2xl text-left flex flex-col gap-2 border transition-all active:scale-[0.98] ${hasProduct ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200 hover:border-gray-900'}`}><div className="flex justify-between items-center w-full"><span className={`text-sm font-bold ${hasProduct ? 'text-green-700' : 'text-gray-700'}`}>2. Add Item</span>{hasProduct ? <CheckCircle size={18} className="text-green-500" /> : <div className="w-4 h-4 rounded-full border-2 border-gray-300"></div>}</div><span className="text-xs text-gray-500">Add products to your menu.</span></button>
               <button onClick={() => { handleTabClick('settings'); handleSectionClick('identity'); }} className={`p-4 rounded-2xl text-left flex flex-col gap-2 border transition-all active:scale-[0.98] ${hasSettings ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200 hover:border-gray-900'}`}><div className="flex justify-between items-center w-full"><span className={`text-sm font-bold ${hasSettings ? 'text-green-700' : 'text-gray-700'}`}>3. Update Settings</span>{hasSettings ? <CheckCircle size={18} className="text-green-500" /> : <div className="w-4 h-4 rounded-full border-2 border-gray-300"></div>}</div><span className="text-xs text-gray-500">Set your shop details & logo.</span></button>
            </div>
          </div>
        )}

        {/* MENU TAB */}
        {isAdmin && (
           <div className={`${activeTab === 'menu' ? 'block animate-in fade-in duration-300' : 'hidden'} print:hidden`}>
             <div className="flex flex-row items-center justify-between gap-3 mb-6 w-full">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} style={{ color: 'var(--theme-color)' }}/>
                  <input placeholder="Search menu..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-gray-200 bg-white shadow-sm text-sm outline-none focus:ring-2 focus:ring-gray-900"/>
                </div>
                <div className="flex bg-gray-100 p-1 rounded-xl shrink-0 border border-gray-200">
                  <button onClick={() => setViewMode('list')} className={`p-2.5 rounded-lg transition-colors active:scale-95 flex items-center justify-center ${viewMode === 'list' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}><List size={18}/></button>
                  <button onClick={() => setViewMode('grid')} className={`p-2.5 rounded-lg transition-colors active:scale-95 flex items-center justify-center ${viewMode === 'grid' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}><LayoutGrid size={18}/></button>
                </div>
                <button onClick={() => setIsFormOpen(true)} className={`hidden md:flex shrink-0 ${optProducts.length >= safeLimits.maxProducts ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-gray-900 text-white hover:bg-gray-800'} px-6 py-3.5 rounded-2xl font-bold active:scale-95 transition shadow-sm items-center justify-center gap-2 text-sm`}>
                  <Plus size={18} strokeWidth={3}/> Add Product
                </button>
             </div>
             
             {optProducts.length === 0 && searchQuery === '' ? (
                <div className="flex flex-col items-center justify-center py-16 px-4 bg-white rounded-3xl border border-gray-100 shadow-sm mt-4 text-center">
                   <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-4"><LayoutGrid size={28} className="text-gray-400"/></div>
                   <h3 className="text-xl font-bold text-gray-900 mb-2">No products yet</h3>
                   <ul className="text-sm text-gray-500 mb-8 text-left space-y-2 inline-block"><li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-gray-400" /> Create a category</li><li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-gray-400" /> Add your first product</li><li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-gray-400" /> View your live menu</li></ul>
                   <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                     <button onClick={() => setIsFormOpen(true)} className="bg-gray-900 text-white px-6 py-3.5 rounded-xl font-bold shadow-md hover:bg-gray-800 active:scale-95 transition flex items-center justify-center gap-2 text-sm w-full sm:w-auto"><Plus size={16} strokeWidth={3}/> Add Product</button>
                     <button onClick={() => handleTabClick('categories')} className="bg-white border border-gray-200 text-gray-700 px-6 py-3.5 rounded-xl font-bold hover:bg-gray-50 active:scale-95 transition text-sm w-full sm:w-auto">Go to Categories</button>
                   </div>
                </div>
             ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                  {filteredProducts.map(item => {
                    const categoryDiscount = typeof item.category === 'object' ? (item.category.discount || 0) : 0;
                    const rawItemDiscount = item.discount || 0;
                    const effectiveDiscount = featCampaign === false ? 0 : (rawItemDiscount > 0 ? rawItemDiscount : categoryDiscount);
                    const discountedPrice = effectiveDiscount > 0 ? item.price * (1 - effectiveDiscount / 100) : item.price;
                    return (
                    <div key={item.id} className="bg-white rounded-lg shadow-sm border border-gray-100 relative flex flex-col h-full group hover:shadow-md transition-all overflow-hidden cursor-pointer" onClick={() => setEditingProduct(item)}>
                      <div className="absolute top-4 right-4 flex flex-col gap-2 items-end z-10 pointer-events-none">
                        {item.isPopular && <span className="bg-orange-500 text-white text-[10px] px-3 py-1.5 rounded-full font-extrabold uppercase tracking-wide shadow-md">Hot</span>}
                        {effectiveDiscount > 0 && <span className="bg-red-500 text-white text-[10px] px-3 py-1.5 rounded-full font-extrabold uppercase tracking-wide shadow-md">-{effectiveDiscount}%</span>}
                      </div>
                      <div className={`relative w-full aspect-[5/4] sm:aspect-[4/3] shrink-0 bg-gray-100 overflow-hidden pointer-events-none ${item.isSoldOut ? 'opacity-50 grayscale' : ''}`}>
                        <LazyImage src={getValidImage(item.image)} alt={item.name} className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"/>
                      </div>
                      <div className="flex flex-col flex-1 p-4 sm:p-5 pointer-events-none">
                        <h3 className={`font-bold text-gray-900 text-base sm:text-lg leading-tight line-clamp-2 mb-1.5 ${item.isSoldOut ? 'text-gray-500' : ''}`}>{item.name}</h3>
                        <div className="flex items-center text-gray-400 text-xs sm:text-sm gap-2 mb-4"><span className="font-medium">{item.category?.name}</span><span className="font-medium">•</span><span className="font-medium">{item.time}</span></div>
                        <div className="mt-auto pt-3 flex flex-col pointer-events-auto border-t border-gray-50">
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0 pr-2">
                              {effectiveDiscount > 0 ? (
                                <div className="flex flex-col"><span className={`font-extrabold text-lg sm:text-xl leading-none truncate block ${item.isSoldOut ? 'text-gray-400' : 'text-red-500'}`}>${discountedPrice.toFixed(2)}</span><span className="font-semibold text-xs sm:text-sm text-gray-400 line-through mt-1 truncate block">${item.price.toFixed(2)}</span></div>
                              ) : (
                                <span className={`font-extrabold text-lg sm:text-xl leading-none truncate block ${item.isSoldOut ? 'text-gray-400' : 'text-gray-900'}`}>${item.price.toFixed(2)}</span>
                              )}
                            </div>
                            <div className="flex items-center shrink-0 relative z-10" onClick={(e) => e.stopPropagation()}>
                              <button onClick={(e) => { e.stopPropagation(); setEditingProduct(item); }} className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center text-gray-500 bg-gray-50 rounded-full hover:bg-gray-100 hover:text-gray-900 transition-colors active:scale-95 shrink-0"><MoreVertical size={16} /></button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )})}
                  {filteredProducts.length === 0 && searchQuery !== '' && <div className="col-span-full py-16 text-center text-gray-400 font-medium bg-white rounded-3xl border border-gray-100 shadow-sm">No products found matching "{searchQuery}"</div>}
                </div>
             ) : (
                <>
                  <div className="hidden md:block bg-white rounded-3xl shadow-sm border border-gray-100 overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[600px]">
                      <thead><tr className="border-b border-gray-50 text-xs font-bold text-gray-400 uppercase tracking-wider"><th className="p-5">Product</th><th className="p-5">Category</th><th className="p-5">Price</th><th className="p-5">Time</th><th className="p-5 text-right">Action</th></tr></thead>
                      <tbody className="divide-y divide-gray-50">
                        {filteredProducts.map((item) => {
                          const categoryDiscount = typeof item.category === 'object' ? (item.category.discount || 0) : 0;
                          const rawItemDiscount = item.discount || 0;
                          const effectiveDiscount = featCampaign === false ? 0 : (rawItemDiscount > 0 ? rawItemDiscount : categoryDiscount);
                          const discountedPrice = effectiveDiscount > 0 ? item.price * (1 - effectiveDiscount / 100) : item.price;
                          return (
                          <tr key={item.id} className={`hover:bg-gray-50/50 transition-colors group cursor-pointer ${item.isSoldOut ? 'opacity-70' : ''}`} onClick={() => setEditingProduct(item)}>
                            <td className="p-4 flex items-center gap-4"><div className={`w-14 h-14 rounded-xl bg-gray-50 overflow-hidden shrink-0 border border-gray-100 relative ${item.isSoldOut ? 'grayscale' : ''}`}><LazyImage src={getValidImage(item.image)} className="w-full h-full object-cover" alt="" /></div><div className="flex flex-col"><span className={`font-bold text-base ${item.isSoldOut ? 'text-gray-500' : 'text-gray-900'}`}>{item.name}</span><div className="flex items-center gap-2 mt-1">{item.isPopular && <span className="text-orange-500 text-[9px] bg-orange-100 px-2 py-0.5 rounded-full font-extrabold uppercase tracking-wide">Hot</span>}{effectiveDiscount > 0 && <span className="text-red-500 text-[9px] bg-red-100 px-2 py-0.5 rounded-full font-extrabold uppercase tracking-wide">-{effectiveDiscount}%</span>}</div></div></td>
                            <td className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider"><span className="bg-gray-100 px-3 py-1.5 rounded-lg">{item.category?.name}</span></td>
                            <td className={`p-4 font-black text-xl ${item.isSoldOut ? 'text-gray-500' : 'text-gray-900'}`}>{effectiveDiscount > 0 ? (<div className="flex flex-col"><span className={item.isSoldOut ? 'text-gray-500' : 'text-red-500'}>${discountedPrice.toFixed(2)}</span><span className="text-xs text-gray-400 line-through font-medium mt-0.5">${item.price.toFixed(2)}</span></div>) : (`$${item.price.toFixed(2)}`)}</td>
                            <td className="p-4 text-sm text-gray-500 font-medium">{item.time}</td>
                            <td className="p-4 text-right"><div className="flex items-center justify-end gap-3 relative z-10" onClick={(e) => e.stopPropagation()}><button onClick={(e) => { e.stopPropagation(); setEditingProduct(item); }} className="w-10 h-10 flex items-center justify-center text-gray-500 bg-gray-50 rounded-full hover:bg-gray-100 hover:text-gray-900 transition-colors active:scale-95"><MoreVertical size={18} /></button></div></td>
                          </tr>
                        )})}
                      </tbody>
                    </table>
                    {filteredProducts.length === 0 && searchQuery !== '' && <div className="py-16 text-center text-gray-400 font-medium">No products found matching "{searchQuery}"</div>}
                  </div>
                  <div className="md:hidden space-y-4">
                     {filteredProducts.map((item) => {
                       const categoryDiscount = typeof item.category === 'object' ? (item.category.discount || 0) : 0;
                       const rawItemDiscount = item.discount || 0;
                       const effectiveDiscount = featCampaign === false ? 0 : (rawItemDiscount > 0 ? rawItemDiscount : categoryDiscount);
                       const discountedPrice = effectiveDiscount > 0 ? item.price * (1 - effectiveDiscount / 100) : item.price;
                       return(
                        <div key={item.id} className={`bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex flex-col cursor-pointer ${item.isSoldOut ? 'opacity-75' : ''}`} onClick={() => setEditingProduct(item)}>
                           <div className="flex items-start gap-4 mb-3"><div className={`w-[72px] h-[72px] bg-gray-50 rounded-md overflow-hidden shrink-0 border border-gray-100 relative ${item.isSoldOut ? 'grayscale' : ''}`}><LazyImage src={getValidImage(item.image)} className="w-full h-full object-cover" alt="" /></div><div className="flex-1 pt-1"><h4 className={`font-extrabold text-base leading-tight mb-1.5 line-clamp-2 ${item.isSoldOut ? 'text-gray-500' : 'text-gray-900'}`}>{item.name}</h4><div className="flex items-center gap-2 flex-wrap"><p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{item.category?.name} • {item.time}</p>{item.isPopular && <span className="text-orange-500 text-[9px] bg-orange-50 px-2 py-0.5 rounded-md font-extrabold uppercase tracking-wider">Hot</span>}</div></div></div>
                           <div className="flex flex-col border-t border-gray-50 pt-3 relative z-10 mt-auto"><div className="flex items-center justify-between"><div className="flex-1 min-w-0 pr-2 pointer-events-none">{effectiveDiscount > 0 ? (<div className="flex items-baseline gap-1.5 flex-wrap"><span className={`font-black text-xl leading-none truncate ${item.isSoldOut ? 'text-gray-400' : 'text-red-500'}`}>${discountedPrice.toFixed(2)}</span><span className="text-xs font-medium text-gray-400 line-through truncate">${item.price.toFixed(2)}</span></div>) : (<span className={`font-black text-xl leading-none truncate block ${item.isSoldOut ? 'text-gray-400' : 'text-gray-900'}`}>${item.price.toFixed(2)}</span>)}</div><div className="flex items-center shrink-0" onClick={(e) => e.stopPropagation()}><button onClick={(e) => { e.stopPropagation(); setEditingProduct(item); }} className="w-8 h-8 flex items-center justify-center text-gray-500 bg-gray-50 rounded-full hover:bg-gray-100 hover:text-gray-900 active:scale-95 transition-all"><MoreVertical size={16} /></button></div></div></div>
                        </div>
                     )})}
                     {filteredProducts.length === 0 && searchQuery !== '' && <div className="bg-white p-8 rounded-3xl text-center text-gray-400 font-medium shadow-sm border border-gray-100">No products found matching "{searchQuery}"</div>}
                  </div>
                </>
             )}
             {optProducts.length > 0 && <button onClick={() => setIsFormOpen(true)} className="md:hidden fixed bottom-6 right-6 z-10 bg-gray-900 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-xl active:scale-95 transition-transform hover:bg-gray-800 disabled:opacity-50 print:hidden"><Plus size={24} strokeWidth={3} /></button>}
           </div>
        )}

        {/* CATEGORIES TAB */}
        {isAdmin && (
           <div className={`${activeTab === 'categories' ? 'block animate-in fade-in duration-300' : 'hidden'} print:hidden`}>
             <div className="flex justify-between items-center gap-4 mb-6">
                 <h3 className="font-bold text-gray-800 hidden sm:block">Manage Categories</h3>
                <button onClick={() => setIsCatFormOpen(true)} className={`hidden md:flex ml-auto shrink-0 ${optCategories.length >= safeLimits.maxCategories ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-gray-900 text-white hover:bg-gray-800'} px-6 py-3.5 rounded-2xl font-bold active:scale-95 transition shadow-sm items-center justify-center gap-2 text-sm`}>
                  <Plus size={18} strokeWidth={3}/> Add New
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
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => setEditingCategory(cat)} className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 rounded-full transition active:scale-95"><Pencil size={18} /></button>
                          <form action={(fd) => { confirmDelete('category', cat.id, cat.name, fd); }}>
                            <input type="hidden" name="id" value={cat.id} />
                            <button type="submit" className="w-10 h-10 flex items-center justify-center text-red-500 hover:text-red-600 bg-red-50 hover:bg-red-100 rounded-full transition active:scale-95"><Trash2 size={18} /></button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {optCategories.length === 0 && <tr><td colSpan={4} className="py-12 text-center text-gray-400 font-medium">No categories created yet</td></tr>}
                </tbody>
              </table>
            </div>
            <button onClick={() => setIsCatFormOpen(true)} className="md:hidden fixed bottom-6 right-6 z-10 bg-gray-900 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-xl active:scale-95 transition-transform hover:bg-gray-800 disabled:opacity-50"><Plus size={24} strokeWidth={3} /></button>
           </div>
        )}

        {/* TABLES & QR TAB */}
        {!isFreePlan && (
           <div className={`${activeTab === 'tables' ? 'block animate-in fade-in duration-300' : 'hidden'} pb-12 print:hidden`}>
             <TableManager shopId={shopId} shopSlug={shopSlug} />
           </div>
        )}

        {/* SETTINGS TAB */}
        {isAdmin && (
          <div className={`${activeTab === 'settings' ? 'block animate-in slide-in-from-right-4 duration-300' : 'hidden'} max-w-2xl mx-auto space-y-6 pb-12 print:hidden`}>
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
                    <div><label className="block text-sm font-semibold text-gray-800 mb-1.5">Shop Name (English)</label><input name="name" value={previewNameEn} onChange={e => { setPreviewNameEn(e.target.value); markDirty('identity'); }} placeholder="e.g. Banlung City" className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-colors text-sm text-gray-900 placeholder:text-gray-400 shadow-sm"/></div>
                    <div><label className="block text-sm font-semibold text-gray-800 mb-1.5">Shop Name (Local)</label><input name="name_kh" value={previewNameKh} onChange={e => { setPreviewNameKh(e.target.value); markDirty('identity'); }} placeholder="e.g. បានលុង ស៊ីធី" className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-colors text-sm text-gray-900 placeholder:text-gray-400 shadow-sm"/></div>
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
                    <div><label className="block text-sm font-semibold text-gray-800 mb-1.5">Shop Address</label><input name="address" value={address} onChange={e => { setAddress(e.target.value); markDirty('identity'); }} placeholder="e.g. Street 123, Phnom Penh" className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-colors text-sm text-gray-900 placeholder:text-gray-400 shadow-sm"/></div>
                    <div><label className="block text-sm font-semibold text-gray-800 mb-1.5">Phone Number</label><input name="phone" value={phone} onChange={e => { setPhone(e.target.value); markDirty('identity'); }} placeholder="e.g. 012 345 678" className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-colors text-sm text-gray-900 placeholder:text-gray-400 shadow-sm"/></div>
                    <div className="pt-2">
                      <label className="block text-sm font-semibold text-gray-800 mb-3">Operating Hours</label>
                      <div className="flex flex-col sm:flex-row sm:items-end gap-3">
                        <div className="relative w-full sm:flex-1"><label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Opening Time</label><div className="relative"><Clock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" /><input type="time" value={openTime} onChange={(e) => { setOpenTime(e.target.value); markDirty('identity'); }} className="w-full pl-9 pr-4 py-3 bg-white border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-colors text-sm text-gray-900 shadow-sm cursor-pointer"/></div></div>
                        <span className="hidden sm:block text-gray-400 font-medium text-sm text-center mb-3.5">to</span>
                        <div className="relative w-full sm:flex-1"><label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Closing Time</label><div className="relative"><Clock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" /><input type="time" value={closeTime} onChange={(e) => { setCloseTime(e.target.value); markDirty('identity'); }} className="w-full pl-9 pr-4 py-3 bg-white border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-colors text-sm text-gray-900 shadow-sm cursor-pointer"/></div></div>
                      </div>
                      <p className="text-xs text-gray-500 mt-2 ml-1">This will be displayed on your customer menu.</p>
                    </div>
                  </div>
                  <div className="flex justify-end pt-4 border-t border-gray-100">
                     <button type="submit" disabled={!dirtySections['identity']} className="bg-gray-900 text-white px-6 py-3 rounded-xl font-semibold text-sm shadow-sm flex items-center justify-center gap-2 hover:bg-gray-800 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed w-full sm:w-auto"><CheckCircle size={16}/>{dirtySections['identity'] ? 'Save Changes' : 'Saved'}</button>
                  </div>
                </form>
              </div>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
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
                                  {headerDesign === 'design2' ? <h1 className="text-white tracking-wide text-center text-2xl font-bold drop-shadow-sm font-sans leading-relaxed pt-1 line-clamp-2 w-full">{getShopNamePreview()}</h1> : headerDesign === 'design3' ? <div className="flex flex-col items-center gap-3 max-w-full"><div className={`flex-shrink-0 relative group/logo pointer-events-auto cursor-pointer flex items-center justify-center ${isNoBg ? 'w-16 h-16 overflow-hidden rounded-2xl' : 'rounded-2xl overflow-hidden bg-white w-16 h-16 shadow-xl p-0.5'}`} onClick={(e) => { e.stopPropagation(); logoInputRef.current?.click(); }}><LazyImage src={logoPreview || fallbackLogo} alt="Logo" className={`w-full h-full ${isNoBg ? 'object-contain' : 'object-cover rounded-[14px]'}`} /><div className={`absolute inset-0 bg-black/40 opacity-0 group-hover/logo:opacity-100 flex items-center justify-center transition-opacity ${isNoBg ? 'rounded-[14px]' : 'rounded-[14px]'}`}><span className="text-white text-[10px] font-bold">Edit</span></div></div><h1 className="text-white tracking-wide text-center text-xl font-bold drop-shadow-sm font-sans leading-relaxed pt-1 line-clamp-2 break-words w-full">{getShopNamePreview()}</h1></div> : headerDesign === 'design4' ? <div className="flex items-center justify-center gap-3 max-w-full"><div className={`flex-shrink-0 relative group/logo pointer-events-auto cursor-pointer flex items-center justify-center ${isNoBg ? 'w-14 h-14 overflow-hidden rounded-full' : 'rounded-full overflow-hidden bg-white w-14 h-14 shadow-lg p-0.5'}`} onClick={(e) => { e.stopPropagation(); logoInputRef.current?.click(); }}><LazyImage src={logoPreview || fallbackLogo} alt="Logo" className={`w-full h-full ${isNoBg ? 'object-contain' : 'object-cover rounded-full'}`} /><div className={`absolute inset-0 bg-black/40 opacity-0 group-hover/logo:opacity-100 flex items-center justify-center transition-opacity ${isNoBg ? 'rounded-full' : 'rounded-full'}`}><span className="text-white text-[10px] font-bold">Edit</span></div></div><h1 className="text-white tracking-wide text-left text-xl font-bold drop-shadow-sm font-sans leading-relaxed pt-1 line-clamp-2 break-words flex-1">{getShopNamePreview()}</h1></div> : headerDesign === 'design5' ? <div className="flex flex-col items-center justify-center w-full max-w-full">{(logoPreview || settings?.logo) ? (<div className={`flex-shrink-0 relative group/logo pointer-events-auto cursor-pointer flex items-center justify-center ${isNoBg ? 'w-20 h-20 overflow-hidden rounded-2xl' : 'rounded-2xl overflow-hidden bg-white w-20 h-20 shadow-xl p-0.5'}`} onClick={(e) => { e.stopPropagation(); logoInputRef.current?.click(); }}><LazyImage src={logoPreview || fallbackLogo} alt="Logo" className={`w-full h-full ${isNoBg ? 'object-contain' : 'object-cover rounded-[14px]'}`} /><div className={`absolute inset-0 bg-black/40 opacity-0 group-hover/logo:opacity-100 flex items-center justify-center transition-opacity ${isNoBg ? 'rounded-[14px]' : 'rounded-[14px]'}`}><span className="text-white text-[10px] font-bold">Edit</span></div></div>) : (<h1 className="text-white tracking-wide text-center text-xl font-bold drop-shadow-sm font-sans leading-relaxed pt-1 line-clamp-2 break-words w-full cursor-pointer pointer-events-auto" onClick={(e) => { e.stopPropagation(); logoInputRef.current?.click(); }}>{getShopNamePreview()}</h1>)}</div> : headerDesign === 'design7' ? <div className="flex flex-col items-center justify-center w-full max-w-full">{(logoPreview || settings?.logo) ? (<div className={`flex-shrink-0 relative group/logo pointer-events-auto cursor-pointer flex items-center justify-center ${isNoBg ? 'w-20 h-20 overflow-hidden rounded-full' : 'rounded-full overflow-hidden bg-white w-20 h-20 shadow-xl p-0.5'}`} onClick={(e) => { e.stopPropagation(); logoInputRef.current?.click(); }}><LazyImage src={logoPreview || fallbackLogo} alt="Logo" className={`w-full h-full ${isNoBg ? 'object-contain' : 'object-cover rounded-full'}`} /><div className={`absolute inset-0 bg-black/40 opacity-0 group-hover/logo:opacity-100 flex items-center justify-center transition-opacity ${isNoBg ? 'rounded-full' : 'rounded-full'}`}><span className="text-white text-[10px] font-bold">Edit</span></div></div>) : (<h1 className="text-white tracking-wide text-center text-xl font-bold drop-shadow-sm font-sans leading-relaxed pt-1 line-clamp-2 break-words w-full cursor-pointer pointer-events-auto" onClick={(e) => { e.stopPropagation(); logoInputRef.current?.click(); }}>{getShopNamePreview()}</h1>)}</div> : headerDesign === 'design6' ? <div className="flex items-center justify-between w-full max-w-full gap-3 mt-[-20px]"><div className={`flex-shrink-0 relative group/logo pointer-events-auto cursor-pointer flex items-center justify-center ${isNoBg && (logoPreview || settings?.logo) ? 'w-10 h-10 overflow-hidden rounded-full' : 'rounded-full overflow-hidden bg-white w-10 h-10 shadow-sm p-0.5'}`} onClick={(e) => { e.stopPropagation(); logoInputRef.current?.click(); }}>{(logoPreview || settings?.logo) ? (<LazyImage src={logoPreview || fallbackLogo} alt="Logo" className={`w-full h-full ${isNoBg ? 'object-contain' : 'object-cover rounded-full'}`} />) : (<div className="w-full h-full bg-gray-200 rounded-full flex items-center justify-center text-gray-500 font-bold text-xs">{getShopNamePreview().charAt(0).toUpperCase()}</div>)}<div className={`absolute inset-0 bg-black/40 opacity-0 group-hover/logo:opacity-100 flex items-center justify-center transition-opacity ${isNoBg ? 'rounded-full' : 'rounded-full'}`}><span className="text-white text-[8px] font-bold">Edit</span></div></div><h1 className="text-white tracking-wide text-center text-lg font-bold drop-shadow-sm font-sans leading-relaxed line-clamp-1 flex-1 break-words">{getShopNamePreview()}</h1><div className="p-1.5 rounded-xl bg-white/20 backdrop-blur-md border border-white/30 text-white shadow-sm flex items-center justify-center"><Menu size={16} strokeWidth={2.5}/></div></div> : <div className="flex flex-col items-center gap-2 max-w-full"><div className={`flex-shrink-0 relative group/logo pointer-events-auto cursor-pointer flex items-center justify-center ${isNoBg ? 'w-16 h-16 overflow-hidden rounded-full' : 'rounded-full overflow-hidden bg-white w-16 h-16 shadow-lg p-0.5'}`} onClick={(e) => { e.stopPropagation(); logoInputRef.current?.click(); }}><LazyImage src={logoPreview || fallbackLogo} alt="Logo" className={`w-full h-full ${isNoBg ? 'object-contain' : 'object-cover rounded-full'}`} /><div className={`absolute inset-0 bg-black/40 opacity-0 group-hover/logo:opacity-100 flex items-center justify-center transition-opacity ${isNoBg ? 'rounded-full' : 'rounded-full'}`}><span className="text-white text-[10px] font-bold">Edit</span></div></div><h1 className="text-white tracking-wide text-center text-xl font-bold drop-shadow-sm font-sans leading-relaxed pt-1 line-clamp-2 break-words w-full">{getShopNamePreview()}</h1></div>}
                               </div>
                            </div>
                         </header>
                      </div>
                      
                      <input type="hidden" name="headerDesign" value={headerDesign} />
                      <div className="flex justify-center pt-2">
                         <div className="flex items-center gap-3 flex-wrap">
                            <button type="button" onClick={() => logoInputRef.current?.click()} className="text-sm font-semibold bg-white border border-gray-300 px-6 py-2.5 rounded-xl shadow-sm hover:bg-gray-50 flex items-center gap-2 text-gray-700 active:scale-95 transition-all"><ImageIcon size={16}/> {logoPreview ? 'Change Logo Image' : 'Upload Logo Image'}</button>
                            {isDirtyLogo && <button type="button" onClick={() => { cancelLogoChange(); clearDirty('branding'); }} className="text-sm font-semibold text-red-600 bg-red-50 px-6 py-2.5 rounded-xl hover:bg-red-100 active:scale-95 transition-all">Cancel</button>}
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
                       <button type="submit" disabled={!dirtySections['branding'] || isCurrentDesignLocked} className="bg-gray-900 text-white px-6 py-3 rounded-xl font-semibold text-sm shadow-sm flex items-center justify-center gap-2 hover:bg-gray-800 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed w-full sm:w-auto"><CheckCircle size={16}/> {isCurrentDesignLocked ? 'Locked' : (dirtySections['branding'] ? 'Save Design' : 'Saved')}</button>
                   </div>
                </form>
              </div>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
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
                         <form action={(fd) => { startTransition(() => dispatchOptBanners({ type: 'delete', payload: b.id })); startTransition(async () => { await deleteBanner(fd); showToast("Banner deleted"); }); }}><input type="hidden" name="id" value={b.id} /><button type="submit" className="absolute top-2 right-2 p-1.5 bg-red-500/90 text-white rounded-lg opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity backdrop-blur-sm active:scale-95 hover:bg-red-600"><Trash2 size={14}/></button></form>
                       </div>
                     ))}
                   </div>
                   {optBanners.length >= safeLimits.maxBanners && <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl flex gap-3 my-2"><Info className="text-blue-500 shrink-0" size={20}/><div className="text-xs text-blue-700 leading-relaxed"><p className="font-black mb-1 uppercase tracking-tight">Banner Limit Reached</p><p>Your current plan allows for {safeLimits.maxBanners} active banner. Upgrade to add more promotions.</p></div></div>}
                   <button type="button" onClick={() => bannerInputRef.current?.click()} disabled={optBanners.length >= safeLimits.maxBanners} className="w-full py-4 bg-gray-50 border border-dashed border-gray-300 rounded-2xl text-gray-600 font-semibold text-sm hover:border-gray-400 hover:bg-gray-100 transition-all flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"><Plus size={16}/> Upload New Banner</button>
                   <input type="file" accept="image/*" ref={bannerInputRef} onChange={(e) => onFileSelect(e, 'banner')} className="hidden" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
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
                      <div key={link.id} className="flex flex-col sm:flex-row gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-200 animate-in slide-in-from-left-2 shadow-sm"><div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-gray-300 shadow-sm"><span className="text-gray-500">{getPlatformIcon(link.platform)}</span><select value={link.platform} onChange={(e) => updateSocialLink(link.id, 'platform', e.target.value)} className="bg-transparent text-sm font-semibold outline-none cursor-pointer w-24"><option value="facebook">Facebook</option><option value="instagram">Instagram</option><option value="telegram">Telegram</option><option value="youtube">YouTube</option><option value="twitter">Twitter</option><option value="linkedin">LinkedIn</option><option value="website">Website</option></select></div><input value={link.url} onChange={(e) => updateSocialLink(link.id, 'url', e.target.value)} placeholder="Paste link here..." className="flex-1 px-4 py-2.5 bg-white border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-colors text-sm text-gray-900 placeholder:text-gray-400 shadow-sm"/><div className="flex items-center gap-3 justify-end sm:pl-2"><label className="relative inline-flex items-center cursor-pointer"><input type="checkbox" checked={link.active} onChange={(e) => updateSocialLink(link.id, 'active', e.target.checked)} className="sr-only peer"/><div className="w-11 h-6 bg-gray-300 rounded-full peer peer-checked:bg-gray-900 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full peer-checked:after:border-white shadow-inner"></div></label><button type="button" onClick={() => removeSocialLink(link.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors active:scale-95"><Trash2 size={18}/></button></div></div>
                    ))}
                    <button type="button" onClick={addSocialLink} className="w-full py-4 bg-white border border-dashed border-gray-300 rounded-2xl text-gray-700 font-semibold text-sm hover:border-gray-400 hover:bg-gray-50 transition-all flex items-center justify-center gap-2 active:scale-[0.99] shadow-sm"><Plus size={16}/> Add New Link</button>
                    <div className="flex justify-end pt-4"><button type="submit" disabled={!dirtySections['socials']} className="bg-gray-900 text-white px-6 py-3 rounded-xl font-semibold text-sm shadow-sm flex items-center justify-center gap-2 hover:bg-gray-800 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed w-full sm:w-auto"><CheckCircle size={16}/> {dirtySections['socials'] ? 'Save Social Links' : 'Saved'}</button></div>
                  </form>
                )}
              </div>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden animate-in slide-in-from-bottom-2">
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
                      <div className="flex gap-2"><input type="text" value={tgChatId} onChange={e => { setTgChatId(e.target.value); markDirty('notifications'); }} placeholder="e.g. 123456789" className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors text-sm text-gray-900 placeholder:text-gray-400 shadow-sm font-mono"/><button type="button" onClick={() => handleTestTelegram('General')} disabled={isTestingTg || !tgChatId.trim()} className="px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-sm rounded-xl transition-colors disabled:opacity-50 shrink-0">Test</button></div>
                    </div>
                    <div className="pt-4 border-t border-gray-100">
                      <div className="mb-4"><h4 className="font-bold text-gray-900 text-sm mb-1">Topic Routing (Optional)</h4></div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div><label className="block text-xs font-semibold text-gray-800 mb-1.5 flex items-center gap-1.5"><Hash size={12}/> Staff Call Topic ID</label><div className="flex gap-2"><input type="text" value={tgStaffCallTopicId} onChange={e => { setTgStaffCallTopicId(e.target.value); markDirty('notifications'); }} placeholder="e.g. 45" className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors text-sm text-gray-900 placeholder:text-gray-400 shadow-sm font-mono"/><button type="button" onClick={() => handleTestTelegram('Staff Call', tgStaffCallTopicId)} disabled={isTestingTg || !tgChatId.trim() || !tgStaffCallTopicId.trim()} className="px-3 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl transition-colors disabled:opacity-50" title="Test Staff Call Topic"><Send size={14}/></button></div></div>
                        <div><label className="block text-xs font-semibold text-gray-800 mb-1.5 flex items-center gap-1.5"><Hash size={12}/> New Order Topic ID</label><div className="flex gap-2"><input type="text" value={tgNewOrderTopicId} onChange={e => { setTgNewOrderTopicId(e.target.value); markDirty('notifications'); }} placeholder="e.g. 99" className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors text-sm text-gray-900 placeholder:text-gray-400 shadow-sm font-mono"/><button type="button" onClick={() => handleTestTelegram('New Order', tgNewOrderTopicId)} disabled={isTestingTg || !tgChatId.trim() || !tgNewOrderTopicId.trim()} className="px-3 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl transition-colors disabled:opacity-50" title="Test New Order Topic"><Send size={14}/></button></div></div>
                      </div>
                    </div>
                    <div className="flex justify-end pt-4 border-t border-gray-100"><button type="submit" disabled={!dirtySections['notifications']} className="w-full sm:w-auto bg-gray-900 text-white px-6 py-3 rounded-xl font-semibold text-sm shadow-sm flex items-center justify-center gap-2 hover:bg-gray-800 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed"><CheckCircle size={16}/>{dirtySections['notifications'] ? 'Save Notifications' : 'Saved'}</button></div>
                  </form>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* MODALS AND UTILS */}
      {pendingNav && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white rounded-[32px] p-6 md:p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95"><div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center mb-5"><AlertTriangle size={24} className="text-orange-500" /></div><h3 className="text-xl font-bold text-gray-900 mb-2">Unsaved Changes</h3><p className="text-gray-500 text-sm mb-8 leading-relaxed">You have unsaved changes in this section. Do you want to save them before leaving?</p><div className="flex gap-3 w-full"><button onClick={() => { discardChanges(pendingNav.source); clearDirty(pendingNav.source); executeNav(pendingNav.type, pendingNav.payload); setPendingNav(null); }} className="flex-1 py-3.5 px-4 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 active:scale-95 transition-all text-sm">No, Discard</button><button onClick={async () => { setIsSaving(true); let success = false; if (pendingNav.source === 'identity') success = await saveIdentityForm(); else if (pendingNav.source === 'branding') success = await saveBrandingForm(); else if (pendingNav.source === 'socials') success = await saveSocialsForm(); else if (pendingNav.source === 'notifications') success = await saveNotificationsForm(); setIsSaving(false); if (success) { clearDirty(pendingNav.source); if (pendingNav.source === 'branding') setLogoFileBlob(null); showToast("Changes saved!"); executeNav(pendingNav.type, pendingNav.payload); setPendingNav(null); } }} className="flex-1 py-3.5 px-4 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 active:scale-95 transition-all flex items-center justify-center text-sm">{isSaving ? <Loader2 className="animate-spin" size={18} /> : 'Yes, Save'}</button></div></div>
        </div>
      )}

      {deleteConfirmation.isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white rounded-[32px] p-6 md:p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95"><div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-5"><Trash2 size={24} className="text-red-500" /></div><h3 className="text-xl font-bold text-gray-900 mb-2">Delete {deleteConfirmation.type === 'product' ? 'Product' : 'Category'}?</h3><p className="text-gray-500 text-sm mb-8 leading-relaxed">Are you sure you want to delete <span className="font-semibold text-gray-700">"{deleteConfirmation.name}"</span>? This action cannot be undone after confirmation.</p><div className="flex gap-3 w-full"><button onClick={() => setDeleteConfirmation({ isOpen: false, type: null, id: null, name: null, actionFormData: null })} className="flex-1 py-3.5 px-4 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 active:scale-95 transition-all text-sm">Cancel</button><button onClick={handleConfirmDeleteAction} className="flex-1 py-3.5 px-4 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 active:scale-95 transition-all flex items-center justify-center text-sm">Confirm</button></div></div>
        </div>
      )}

      {isQrModalOpen && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm py-4" onClick={() => setIsQrModalOpen(false)}>
            <div className="bg-white p-6 md:p-8 rounded-[35px] max-w-md w-full relative z-10 shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto no-scrollbar [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }} onClick={e => e.stopPropagation()}>
               <div className="flex justify-between items-center mb-6"><h2 className="font-extrabold text-2xl text-gray-900">QR & Print Menu</h2><button className="p-2 bg-gray-50 rounded-full text-gray-500 hover:bg-gray-100 transition-colors active:scale-95" onClick={() => setIsQrModalOpen(false)}><X size={20}/></button></div>
               <div className="flex gap-2 mb-6 bg-gray-100 p-1.5 rounded-2xl w-full"><button onClick={() => setPreviewFormat('portrait')} className={`flex-1 py-2 px-1 rounded-xl text-sm font-bold transition-all active:scale-[0.98] flex flex-col items-center justify-center leading-tight ${previewFormat === 'portrait' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}><span>Portrait</span><span className="text-[10px] font-normal opacity-70 mt-0.5">(Table stand)</span></button><button onClick={() => setPreviewFormat('landscape')} className={`flex-1 py-2 px-1 rounded-xl text-sm font-bold transition-all active:scale-[0.98] flex flex-col items-center justify-center leading-tight ${previewFormat === 'landscape' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}><span>Landscape</span><span className="text-[10px] font-normal opacity-70 mt-0.5">(Wall / Counter)</span></button></div>
               <div className="mb-6"><label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 block text-center">Paper Size</label><div className="flex gap-2 bg-gray-100 p-1.5 rounded-xl w-full max-w-[240px] mx-auto">{['A4', 'A5', '10x15'].map(size => (<button key={size} onClick={() => setPaperSize(size as any)} className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${paperSize === size ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>{size === '10x15' ? '10×15 cm' : size}</button>))}</div></div>
               <div className="w-full bg-gray-50/80 rounded-3xl flex items-center justify-center mb-6 overflow-hidden relative shadow-inner" style={{ height: '320px' }}><div className="absolute top-3 right-4 bg-white/90 backdrop-blur px-2 py-1 rounded shadow-sm z-20"><span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Actual print ratio</span></div><div className="origin-center transform transition-all duration-500 flex items-center justify-center shadow-lg bg-white" style={{ transform: getPreviewScale() }}>{renderPrintTemplate(previewFormat)}</div></div>
               <div className="space-y-3"><button onClick={() => handleGeneratePDF(previewFormat)} className="w-full py-3.5 bg-gray-900 text-white rounded-2xl font-bold shadow-md hover:bg-gray-800 active:scale-[0.98] transition-all text-[15px] flex items-center justify-center gap-2"><QrCode size={18} /> Print / Save as PDF</button></div>
            </div>
         </div>
      )}

      {/* INVISIBLE RENDER AREA FOR STANDARD QR PRINTING (Kept separate from receipt) */}
      <div id="print-area" className="hidden items-center justify-center bg-white">{printFormat && renderPrintTemplate(printFormat)}</div>
      {printFormat && <style>{`@media print { @page { size: ${printFormat === 'landscape' ? 'landscape' : 'portrait'}; margin: 0; } body * { visibility: hidden !important; } #print-area, #print-area * { visibility: visible !important; } #print-area { position: absolute; left: 0; top: 0; width: 100vw; height: 100vh; display: flex !important; align-items: center; justify-content: center; background: white; z-index: 99999; -webkit-print-color-adjust: exact; print-color-adjust: exact; } }`}</style>}

      {cropImageSrc && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"><div className="p-4 border-b flex justify-between items-center bg-white z-10"><h3 className="font-bold text-lg">Adjust Image</h3><button onClick={() => { setCropImageSrc(null); setCropTarget(null); }} className="p-2 bg-gray-100 rounded-full hover:bg-red-50 hover:text-red-500 active:scale-95 transition-transform"><X size={20}/></button></div><div className="relative w-full h-[300px] sm:h-[400px] bg-black"><Cropper image={cropImageSrc} crop={crop} zoom={zoom} aspect={cropAspect} onCropChange={setCrop} onCropComplete={onCropComplete} onZoomChange={setZoom} showGrid={false} /></div><div className="p-6 bg-white space-y-6"><div className="flex items-center gap-4"><ZoomIn size={20} className="text-gray-400"/><input type="range" value={zoom} min={1} max={3} step={0.1} onChange={(e) => setZoom(Number(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-brand-green"/></div><button onClick={showCroppedImage} className="w-full py-4 bg-gray-900 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg hover:bg-gray-800 active:scale-95 transition-all"><Check size={20} /> Apply Crop</button></div></div>
        </div>
      )}

      {(isFormOpen || editingProduct) && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm" onClick={() => { setIsFormOpen(false); setEditingProduct(null); }}>
            <div className="bg-white p-6 md:p-8 rounded-[35px] max-w-lg w-full relative z-10 shadow-2xl overflow-y-auto max-h-[90vh] no-scrollbar [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }} onClick={e => e.stopPropagation()}>
               <div className="flex justify-between items-center mb-6"><h2 className="font-extrabold text-2xl text-gray-900">{editingProduct ? 'Edit Product' : 'New Product'}</h2><button className="p-2 bg-gray-50 rounded-full text-gray-500 hover:bg-gray-100 active:scale-95 transition-transform" onClick={() => { setIsFormOpen(false); setEditingProduct(null); }}><X size={20}/></button></div>
               <form key={editingProduct ? editingProduct.id : 'new'} onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); const isEdit = !!editingProduct; const tempId = isEdit ? editingProduct!.id : `temp-${Date.now()}`; const catId = fd.get('categoryId') as string; const catNameStr = categories.find(c => c.id === catId)?.name || 'Unknown'; const tempProduct: Product = { id: tempId, name: prodName.en, name_kh: prodName.kh, name_zh: prodName.zh, price: parseFloat(fd.get('price') as string), discount: parseFloat(fd.get('discount') as string) || 0, image: productPreview || editingProduct?.image || PLACEHOLDER_IMAGE, category: { name: catNameStr }, time: fd.get('time') as string || '15min', isPopular: isHotSale, isSoldOut: isSoldOutState }; startTransition(() => { dispatchOptProducts({ type: isEdit ? 'update' : 'add', payload: tempProduct }); }); setIsFormOpen(false); setEditingProduct(null); startTransition(async () => { if (productFileBlob) fd.set('image', productFileBlob, 'product.webp'); else if (productPreview) fd.set('image', productPreview); fd.set('name', prodName.en); fd.set('name_kh', prodName.kh); fd.set('name_zh', prodName.zh); fd.set('isPopular', isHotSale ? 'on' : 'off'); fd.set('isSoldOut', isSoldOutState ? 'true' : 'false'); try { if (isEdit) await updateProduct(fd); else await createProduct(fd); setProductFileBlob(null); showToast("Product saved successfully!"); } catch (err) { showToast("Failed to save product."); } }); }} className="space-y-4">
                  {editingProduct && <input type="hidden" name="id" value={editingProduct.id} />}
                  
                  <div className="w-full">
                    <div onClick={() => productInputRef.current?.click()} className="relative w-full h-48 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer overflow-hidden group hover:border-gray-900 transition-colors">
                      {productPreview ? (
                        <>
                          <LazyImage src={productPreview} className="w-full h-full object-cover" alt="Preview" />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <p className="text-white font-bold text-sm bg-black/50 px-4 py-2 rounded-full backdrop-blur-sm">Change Image</p>
                          </div>
                        </>
                      ) : (
                        <div className="text-center text-gray-400">
                          <UploadCloud size={32} className="mx-auto mb-2 text-gray-300"/>
                          <span className="text-sm font-medium">Tap to upload</span>
                        </div>
                      )}
                      <input type="file" accept="image/*" ref={productInputRef} onChange={(e) => onFileSelect(e, 'product')} className="hidden" />
                    </div>
                  </div>

                  <LocalizedInput label="Product Name" value={prodName.en} valueKh={prodName.kh} valueZh={prodName.zh} onChange={(lang, val) => setProdName(prev => ({ ...prev, [lang]: val }))} required multiLangEnabled={multiLanguageEnabled} />
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1"><label className="block text-sm font-semibold text-gray-800 mb-1.5 ml-1">Price ($)</label><input name="price" defaultValue={editingProduct?.price || ''} type="number" step="0.01" placeholder="0.00" className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-colors text-sm text-gray-900 placeholder:text-gray-400 shadow-sm" required /></div>
                    {featCampaign ? (<div className="space-y-1"><label className="block text-sm font-semibold text-gray-800 mb-1.5 ml-1">Discount (%)</label><input name="discount" defaultValue={editingProduct?.discount || ''} type="number" min="0" max="100" placeholder="0" className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-colors text-sm text-gray-900 placeholder:text-gray-400 shadow-sm" /></div>) : (<div className="space-y-1 opacity-70"><div className="flex items-center justify-between mb-1.5 ml-1 pr-1"><label className="block text-sm font-semibold text-gray-800">Discount (%)</label><Lock size={12} className="text-gray-500" /></div><input disabled type="text" placeholder="Upgrade Plan" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm text-gray-500 cursor-not-allowed shadow-sm" /><input type="hidden" name="discount" value="0" /></div>)}
                    <div className="space-y-1"><label className="block text-sm font-semibold text-gray-800 mb-1.5 ml-1">Category</label><select name="categoryId" defaultValue={categories.find(c => c.name === editingProduct?.category?.name)?.id || categories[0]?.id} className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-colors text-sm text-gray-900 cursor-pointer shadow-sm" required>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                  </div>
                  <div className="space-y-1"><label className="block text-sm font-semibold text-gray-800 mb-1.5 ml-1">Preparation Time</label><div className="relative flex items-center"><input type="number" value={prepTime} onChange={(e) => setPrepTime(e.target.value)} placeholder="15" className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-colors text-sm text-gray-900 placeholder:text-gray-400 shadow-sm pr-12" /><span className="absolute right-4 text-gray-400 font-medium text-sm pointer-events-none">min</span><input type="hidden" name="time" value={prepTime ? `${prepTime}min` : ''} /></div></div>
                  <div className="flex flex-col gap-3 p-4 bg-orange-50 rounded-xl border border-orange-100 mt-2"><div className="flex items-center justify-between"><div><h4 className="font-bold text-orange-600 text-sm">Hot Sale Item</h4><p className="text-[10px] text-orange-400">Show this in the popular section</p></div><label className="relative inline-flex items-center cursor-pointer"><input type="checkbox" checked={isHotSale} onChange={(e) => setIsHotSale(e.target.checked)} className="sr-only peer"/><div className="w-11 h-6 bg-white border border-gray-200 rounded-full peer peer-checked:bg-orange-500 peer-checked:border-orange-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-gray-300 after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full peer-checked:after:bg-white peer-checked:after:border-white shadow-sm"></div></label></div>{isHotSale && (<div className="flex"><span className="bg-orange-500 text-white text-[10px] px-2.5 py-1 rounded-full font-extrabold uppercase tracking-wide shadow-sm">Hot Sale</span></div>)}</div>
                  <div className="mt-2"><StockSwitchButton checked={isSoldOutState} onToggle={() => setIsSoldOutState(!isSoldOutState)} fullWidth={true} /><p className="text-[10px] text-gray-500 mt-1.5 ml-1">Toggle to mark item as currently unavailable.</p></div>
                  <div className="flex flex-col gap-3 mt-6"><button type="submit" className="w-full bg-gray-900 text-white py-3.5 rounded-xl font-bold shadow-md hover:bg-gray-800 transition-all flex items-center justify-center gap-2 active:scale-[0.98] text-sm">{editingProduct ? 'Update Product' : 'Save Product'}</button>{editingProduct && (<button type="button" onClick={() => { const fd = new FormData(); fd.append('id', editingProduct.id); setIsFormOpen(false); setEditingProduct(null); confirmDelete('product', editingProduct.id, editingProduct.name, fd); }} className="w-full bg-red-50 text-red-600 border border-red-100 py-3.5 rounded-xl font-bold shadow-sm hover:bg-red-100 transition-all flex items-center justify-center gap-2 active:scale-[0.98] text-sm"><Trash2 size={18} /> Delete Product</button>)}</div>
               </form>
            </div>
         </div>
      )}

      {(isCatFormOpen || editingCategory) && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm" onClick={() => { setIsCatFormOpen(false); setEditingCategory(null); }}>
            <div className="bg-white p-6 md:p-8 rounded-[35px] max-w-sm w-full relative z-10 shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto no-scrollbar [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }} onClick={e => e.stopPropagation()}>
               <div className="flex justify-between items-center mb-6"><h2 className="font-extrabold text-2xl text-gray-900">{editingCategory ? 'Edit Category' : 'New Category'}</h2><button className="p-2 bg-gray-50 rounded-full text-gray-500 hover:bg-gray-100 active:scale-95 transition-transform" onClick={() => { setIsCatFormOpen(false); setEditingCategory(null); }}><X size={20}/></button></div>
               <form key={editingCategory ? editingCategory.id : 'new'} onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); const isEdit = !!editingCategory; const tempId = isEdit ? editingCategory!.id : `temp-${Date.now()}`; const tempCat: Category = { id: tempId, name: catName.en, name_kh: catName.kh, name_zh: catName.zh, sortOrder: isEdit ? parseInt(fd.get('sortOrder') as string) : categories.length + 1, discount: parseFloat(fd.get('discount') as string) || 0 }; startTransition(() => { dispatchOptCategories({ type: isEdit ? 'update' : 'add', payload: tempCat }); }); setIsCatFormOpen(false); setEditingCategory(null); startTransition(async () => { fd.set('name', catName.en); fd.set('name_kh', catName.kh); fd.set('name_zh', catName.zh); fd.set('isDrink', catIsDrink ? 'true' : 'false'); try { if (isEdit) await updateCategory(fd); else await createCategory(fd); showToast("Category saved successfully!"); } catch (err) { showToast("Failed to save category."); } }); }} className="space-y-4">
                  {editingCategory && <input type="hidden" name="id" value={editingCategory.id} />}
                  <LocalizedInput label="Category Name" value={catName.en} valueKh={catName.kh} valueZh={catName.zh} onChange={(lang, val) => setCatName(prev => ({ ...prev, [lang]: val }))} required multiLangEnabled={multiLanguageEnabled} />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {featCampaign ? (<div className="space-y-1"><label className="block text-sm font-semibold text-gray-800 mb-1.5 ml-1">Discount (%)</label><input name="discount" type="number" min="0" max="100" placeholder="0" defaultValue={editingCategory?.discount || ''} className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-colors text-sm text-gray-900 placeholder:text-gray-400 shadow-sm" /></div>) : (<div className="space-y-1 opacity-70"><div className="flex items-center justify-between mb-1.5 ml-1 pr-1"><label className="block text-sm font-semibold text-gray-800">Discount (%)</label><Lock size={12} className="text-gray-500" /></div><input disabled type="text" placeholder="Upgrade Plan" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm text-gray-500 cursor-not-allowed shadow-sm" /><input type="hidden" name="discount" value="0" /></div>)}
                    {editingCategory && <div className="space-y-1"><label className="block text-sm font-semibold text-gray-800 mb-1.5 ml-1">Sort Order</label><input name="sortOrder" type="number" placeholder="Order" defaultValue={editingCategory.sortOrder} className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-colors text-sm text-gray-900 placeholder:text-gray-400 shadow-sm" required /></div>}
                  </div>
                  <div className="flex flex-col gap-3 p-4 bg-blue-50 rounded-xl border border-blue-100 mt-2"><div className="flex items-center justify-between"><div><h4 className="font-bold text-blue-600 text-sm">Drink Category</h4><p className="text-[10px] text-blue-400">Show Mood/Sugar/Ice options</p></div><label className="relative inline-flex items-center cursor-pointer"><input type="checkbox" checked={catIsDrink} onChange={(e) => setCatIsDrink(e.target.checked)} className="sr-only peer"/><div className="w-11 h-6 bg-white border border-gray-200 rounded-full peer peer-checked:bg-blue-500 peer-checked:border-blue-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full peer-checked:after:bg-white peer-checked:after:border-white shadow-sm"></div></label></div></div>
                  <button type="submit" className="w-full bg-gray-900 text-white py-3.5 rounded-xl font-bold shadow-md hover:bg-gray-800 transition-all flex items-center justify-center gap-2 active:scale-[0.98] mt-6 text-sm">{editingCategory ? 'Update' : 'Create'}</button>
               </form>
            </div>
         </div>
      )}
    </div>
  );
}