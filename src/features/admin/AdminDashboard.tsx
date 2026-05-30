// src/features/admin/AdminDashboard.tsx
'use client';
import Link from 'next/link';
import TableManager from "@/components/shared/TableManager";
import { useState, useRef, useEffect, useOptimistic, startTransition, useMemo } from 'react';
import { signOut } from "next-auth/react"; 
import { arrayMove } from '@dnd-kit/sortable';
import getCroppedImg from '@/lib/cropImage'; 

import { 
  createProduct, deleteProduct, updateProduct, 
  createCategory, updateCategory, deleteCategory,
  addBanner, deleteBanner, reorderBanners,
  getTeamMembers, createTeamMember, updateTeamMemberRole, deleteTeamMember,
  getUserActivity, createTopping, updateTopping, deleteTopping
} from '@/lib/actions';
import { updateCategoryOrders } from '@/lib/category-order-actions'; 

import { 
  Plus, X, Trash2, UploadCloud, CheckCircle,
  LayoutGrid, Settings, Search, Bell, Menu, LogOut, 
  Image as ImageIcon, ChevronDown, ChevronUp, Store, Palette, Share2,
  Globe, Facebook, Instagram, Send, Youtube, Twitter, Linkedin,
  Check, List, Pencil, ExternalLink, QrCode, ChevronLeft, ChevronRight,
  Info, Loader2, Clock, Lock, MoreVertical, Hash, ClipboardList, ShoppingCart, Activity, Package, Sparkles, Users, Layers, DollarSign
} from 'lucide-react'; 

import LazyImage from "@/components/ui/LazyImage";
import AdminPosSection from "@/features/pos/AdminPosSection";
import DashboardOverview from "@/features/pos/DashboardOverview";
import InventoryManager from "@/components/shared/InventoryManager";
import PosReceipt from "@/components/shared/PosReceipt"; 
import CategorySortableList from "@/features/admin/components/CategorySortableList"; 

import { ToastProvider } from "@/context/ToastContext";
import { OrderProvider } from "@/context/OrderContext";
import { useShift } from '@/context/ShiftContext';

// Components & Tabs
import AdminToast from './components/AdminToast';
import PendingDeleteToast from './components/PendingDeleteToast';
import DeleteConfirmationModal from './components/DeleteConfirmationModal';
import UnsavedChangesModal from './components/UnsavedChangesModal';
import TeamManagementModal from './components/TeamManagementModal';
import ToppingFormModal from './components/ToppingFormModal';
import UserActivityModal from './components/UserActivityModal';
import QrPrintModal from './components/QrPrintModal';
import ImageCropperModal from './components/ImageCropperModal';

import OrdersTab from './tabs/OrdersTab';
import TeamTab from './tabs/TeamTab';
import ToppingsTab from './tabs/ToppingsTab';
import MenuTab from './tabs/MenuTab';
import SettingsTab from './tabs/SettingsTab'; 
import { useSettingsManager } from './hooks/useSettingsManager';

export interface Category { id: string; name: string; name_kh?: string | null; name_zh?: string | null; sortOrder: number; discount?: number; isDrink?: boolean; } 
export interface Product { id: string; name: string; name_kh?: string | null; name_zh?: string | null; price: number; variants?: {id?: string, name: string, price: number}[]; ingredients?: { ingredientId: string, quantityUsed: number }[]; image: string; category: { name: string, discount?: number }; time: string; isPopular?: boolean; isSoldOut?: boolean; discount?: number; description?: string; department?: string; }
export interface Banner { id: string; image: string; sortOrder: number; }
export interface ShopSettings { name: string; name_kh?: string | null; nameDisplay?: string; address: string | null; phone: string | null; openingHours: string | null; is24Hours?: boolean; themeColor: string; headerDesign: string; logo: string | null; logoType?: string | null; socials: string; printerUrl?: string | null; qrImage?: string | null; }
export interface Topping { id: string; name: string; price: number; isDrink: boolean; }

const PLACEHOLDER_IMAGE = 'data:image/svg+xml;charset=utf-8,%3Csvg xmlns%3D"http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg" width%3D"400" height%3D"400" viewBox%3D"0 0 400 400"%3E%3Crect width%3D"400" height%3D"400" fill%3D"%23f3f4f6"%2F%3E%3Ctext x%3D"50%25" y%3D"50%25" dominant-baseline%3D"middle" text-anchor%3D"middle" font-family%3D"sans-serif" font-size%3D"48" font-weight%3D"bold" fill%3D"%239ca3af"%3EN%2FA%3C%2Ftext%3E%3C%2Fsvg%3E';
const FALLBACK_LOGO = 'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?auto=format&fit=crop&w=100&q=80';
const allDesigns = ['design1', 'design2', 'design3', 'design4', 'design5', 'design6', 'design7'];

const getValidImage = (img?: string | null) => (!img || img === 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c') ? PLACEHOLDER_IMAGE : img;

const getDisplayPrice = (product: Product) => {
  if (product.variants && product.variants.length > 0) return Math.min(...product.variants.map((v: any) => v.price));
  return product.price || 0;
};

interface AdminDashboardProps { shopId: string; categories: Category[]; products: Product[]; settings: ShopSettings; shopSlug: string; banners?: Banner[]; shopPlan?: string; planLimits?: any; callStaffEnabled?: boolean; telegramChatId?: string | null; staffCallTopicId?: string | null; newOrderTopicId?: string | null; telegramNotificationsEnabled?: boolean; featCampaign?: boolean; featPos?: boolean; userEmail?: string; userRole?: string; orders?: any[]; ingredients?: any[]; stockLogs?: any[]; toppings?: Topping[]; }
type OptimisticAction<T> = | { type: 'add'; payload: T } | { type: 'update'; payload: T } | { type: 'delete'; payload: string } | { type: 'set'; payload: T[] };
type OptimisticBannerAction = | { type: 'add'; payload: Banner } | { type: 'delete'; payload: string } | { type: 'set'; payload: Banner[] };
interface PendingDelete { productId: string; productSnapshot: Product; name: string; actionFormData: FormData; timeoutId: NodeJS.Timeout; intervalId: NodeJS.Timeout; expiresAt: number; timeLeft: number; }

export default function AdminDashboard({ shopId, categories, products: initialProducts, settings, shopSlug, banners = [], shopPlan, planLimits, callStaffEnabled = true, telegramChatId, staffCallTopicId, newOrderTopicId, telegramNotificationsEnabled = false, featCampaign = false, featPos = false, userEmail = "admin@scandine.xyz", userRole = "OWNER", orders = [], ingredients = [], stockLogs = [], toppings = [] }: AdminDashboardProps) {
  
  const { shift, requireShift, initiateCloseShift } = useShift();

  const [deletedItemIds, setDeletedItemIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'menu' | 'categories' | 'toppings' | 'inventory' | 'tables' | 'orders' | 'settings' | 'pos' | 'team'>(featPos ? 'overview' : 'menu');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid'); 
  const [isFormOpen, setIsFormOpen] = useState(false); 
  const [isCatFormOpen, setIsCatFormOpen] = useState(false); 
  const [isQrModalOpen, setIsQrModalOpen] = useState(false); 
  const [previewFormat, setPreviewFormat] = useState<'portrait' | 'landscape'>('portrait'); 
  const [printFormat, setPrintFormat] = useState<'portrait' | 'landscape' | null>(null); 
  const [receiptToPrint, setReceiptToPrint] = useState<any>(null); 

  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [isTeamLoading, setIsTeamLoading] = useState(false);
  const [isTeamFormOpen, setIsTeamFormOpen] = useState(false);
  const [editingTeamMember, setEditingTeamMember] = useState<any>(null);
  const hasFetchedTeam = useRef(false);

  const [activityUser, setActivityUser] = useState<any>(null);
  const [userActivityData, setUserActivityData] = useState<any>(null);
  const [isActivityLoading, setIsActivityLoading] = useState(false);

  const [paperSize, setPaperSize] = useState<'A4' | 'A5' | '10x15'>('A4');
  const [origin, setOrigin] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [orderFilter, setOrderFilter] = useState('All');
  
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null); 
  const [isToppingFormOpen, setIsToppingFormOpen] = useState(false);
  const [editingTopping, setEditingTopping] = useState<Topping | null>(null);

  const [prodName, setProdName] = useState({ en: '', kh: '', zh: '' });
  const [productVariants, setProductVariants] = useState<{name: string, price: number | string}[]>([{name: 'Default', price: ''}]);
  const [productRecipe, setProductRecipe] = useState<{ingredientId: string, quantityUsed: number | string}[]>([]);
  const [productDepartment, setProductDepartment] = useState<'coffee' | 'pub'>('coffee');
  const [productCategoryId, setProductCategoryId] = useState('');
  const [productDiscount, setProductDiscount] = useState<number | ''>('');
  const [showExtraLangs, setShowExtraLangs] = useState(false);
  const hasInitializedProductRef = useRef(false);

  const [prepTime, setPrepTime] = useState('15');
  const [isHotSale, setIsHotSale] = useState(false);
  const [isSoldOutState, setIsSoldOutState] = useState(false);

  const [deleteConfirmation, setDeleteConfirmation] = useState<{isOpen: boolean; type: 'product' | 'category' | 'topping' | null; id: string | null; name: string | null; actionFormData: FormData | null;}>({ isOpen: false, type: null, id: null, name: null, actionFormData: null });
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null);
  const pendingDeleteRef = useRef<PendingDelete | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);

  const sidebarRef = useRef<HTMLElement>(null);
  const mobileMenuBtnRef = useRef<HTMLButtonElement>(null);
  const isAdmin = userRole === 'OWNER' || userRole === 'SUPERADMIN' || userRole === 'admin';

  const [openSection, setOpenSection] = useState<string | null>('identity');
  
  // --- ADDED SNACKBAR TYPES ---
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'warning' | 'fail' | 'info' }>({ show: false, message: '', type: 'info' });
  
  const [dismissGuide, setDismissGuide] = useState(false);
  const [draggedBannerIndex, setDraggedBannerIndex] = useState<number | null>(null);

  const safeLimits = planLimits || { maxProducts: 0, maxCategories: 0, maxBanners: 0, overrideHeaderStyle: null, premiumThemes: false, customSocials: false, featMultipleLanguage: false, featAlertBarista: false };
  const canUsePremiumThemes = safeLimits.premiumThemes;
  const canUseCustomSocials = safeLimits.customSocials;
  const multiLanguageEnabled = !!safeLimits.featMultipleLanguage;
  const canUseTelegram = !!safeLimits.featAlertBarista;
  const isFreePlan = shopPlan === 'FREE' || shopPlan === 'STARTER'; 
  
  const currentDesignIndex = allDesigns.indexOf(settings?.headerDesign || 'design1');
  const isCurrentDesignLocked = isFreePlan && currentDesignIndex > 3 && (settings?.headerDesign || 'design1') !== safeLimits.overrideHeaderStyle;

  const [dirtySections, setDirtySections] = useState<Record<string, boolean>>({});
  const [pendingNav, setPendingNav] = useState<{ type: 'tab' | 'section', payload: any, source: string } | null>(null);

  const markDirty = (section: string) => setDirtySections(prev => ({ ...prev, [section]: true }));
  const clearDirty = (section: string) => setDirtySections(prev => ({ ...prev, [section]: false }));
  
  // --- UPDATED SHOW TOAST ---
  const showToast = (message: string, type: 'success' | 'warning' | 'fail' | 'info' = 'success') => { 
    setToast({ show: true, message, type }); 
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000); 
  };

  const settingsState = useSettingsManager({
    shopId, settings, callStaffEnabled, telegramChatId, staffCallTopicId, newOrderTopicId,
    showToast, startTransition, allDesigns, isCurrentDesignLocked, markDirty, clearDirty
  });

  const mappedProducts: Product[] = initialProducts.map(p => ({
    ...p,
    department: p.department?.toLowerCase() === 'pub' ? 'pub' : (p.description?.includes('[PUB]') ? 'pub' : 'coffee')
  }));

  const [optProducts, dispatchOptProducts] = useOptimistic(mappedProducts, (state: Product[], action: OptimisticAction<Product>) => { switch (action.type) { case 'add': return [action.payload, ...state]; case 'update': return state.map(p => p.id === action.payload.id ? action.payload : p); case 'delete': return state.filter(p => p.id !== action.payload); default: return state; } });
  const [optCategories, dispatchOptCategories] = useOptimistic(categories, (state: Category[], action: OptimisticAction<Category>) => { switch (action.type) { case 'add': return [...state, action.payload].sort((a, b) => (a.sortOrder || 999999) - (b.sortOrder || 999999)); case 'update': return state.map(c => c.id === action.payload.id ? action.payload : c).sort((a, b) => (a.sortOrder || 999999) - (b.sortOrder || 999999)); case 'delete': return state.filter(c => c.id !== action.payload); case 'set': return action.payload as Category[]; default: return state; } });
  const [optBanners, dispatchOptBanners] = useOptimistic(banners, (state: Banner[], action: OptimisticBannerAction) => { switch (action.type) { case 'add': return [...state, action.payload].sort((a, b) => a.sortOrder - b.sortOrder); case 'delete': return state.filter(b => b.id !== action.payload); case 'set': return action.payload; default: return state; } });
  const [optToppings, dispatchOptToppings] = useOptimistic(toppings, (state: Topping[], action: OptimisticAction<Topping>) => { switch (action.type) { case 'add': return [...state, action.payload].sort((a, b) => a.name.localeCompare(b.name)); case 'update': return state.map(t => t.id === action.payload.id ? action.payload : t).sort((a, b) => a.name.localeCompare(b.name)); case 'delete': return state.filter(t => t.id !== action.payload); default: return state; } });

  const [cropTarget, setCropTarget] = useState<'logo' | 'product' | 'banner' | 'qr' | null>(null);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [cropAspect, setCropAspect] = useState<number>(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  const bannerInputRef = useRef<HTMLInputElement>(null);
  const productInputRef = useRef<HTMLInputElement>(null);
  const [productPreview, setProductPreview] = useState('');
  const [productFileBlob, setProductFileBlob] = useState<Blob | null>(null);

  const sortedCategories = useMemo(() => {
    return [...optCategories].sort((a, b) => {
      const orderA = typeof a.sortOrder === 'number' ? a.sortOrder : 999999;
      const orderB = typeof b.sortOrder === 'number' ? b.sortOrder : 999999;
      return orderA - orderB;
    });
  }, [optCategories]);

  const hasCategory = sortedCategories.length > 0;
  const hasProduct = optProducts.length > 0;
  const hasSettings = !!settings?.address || !!settings?.logo || !!settings?.phone;
  const isGuideComplete = hasCategory && hasProduct && hasSettings;

  // --- CLICK OUTSIDE LISTENER FOR MOBILE MENU ---
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (window.innerWidth >= 1280 || !isMobileMenuOpen) return;
      const target = event.target as Node;
      if (
        sidebarRef.current && 
        !sidebarRef.current.contains(target) &&
        mobileMenuBtnRef.current && 
        !mobileMenuBtnRef.current.contains(target)
      ) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isMobileMenuOpen]);

  useEffect(() => {
    if (activeTab === 'pos' && !isAdmin) requireShift();
  }, [activeTab, requireShift, isAdmin]);

  useEffect(() => {
    const handleResize = () => { if (window.innerWidth < 1280) setIsSidebarCollapsed(true); };
    handleResize(); 
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const clearPendingDelete = () => {
    if (pendingDeleteRef.current) {
      clearTimeout(pendingDeleteRef.current.timeoutId);
      clearInterval(pendingDeleteRef.current.intervalId);
      setPendingDelete(null);
      pendingDeleteRef.current = null;
    }
  };

  useEffect(() => { 
    setOrigin(window.location.origin); 
    const afterPrint = () => setPrintFormat(null); 
    window.addEventListener('afterprint', afterPrint); 
    return () => { 
      window.removeEventListener('afterprint', afterPrint); 
      if (pendingDeleteRef.current) { 
        clearTimeout(pendingDeleteRef.current.timeoutId); 
        clearInterval(pendingDeleteRef.current.intervalId); 
        deleteProduct(pendingDeleteRef.current.actionFormData).catch(() => {}); 
      } 
    }; 
  }, []);

  const [wasEditingProduct, setWasEditingProduct] = useState<string | null>(null);
  const [wasFormOpen, setWasFormOpen] = useState(false);

  useEffect(() => { 
    if ((isFormOpen || editingProduct) && !hasInitializedProductRef.current) {
      hasInitializedProductRef.current = true;
      if (editingProduct) { 
        setProductPreview(getValidImage(editingProduct.image) === PLACEHOLDER_IMAGE ? '' : editingProduct.image); 
        setProductFileBlob(null); 
        setProdName({ en: editingProduct.name || '', kh: editingProduct.name_kh || '', zh: editingProduct.name_zh || '' }); 
        setShowExtraLangs(!!(editingProduct.name_kh || editingProduct.name_zh));
        setPrepTime(editingProduct.time ? editingProduct.time.replace(/\D/g, '') : '15'); 
        setIsHotSale(editingProduct.isPopular || false); 
        setIsSoldOutState(editingProduct.isSoldOut || false);
        setProductDiscount(editingProduct.discount || ''); 
        setProductCategoryId(sortedCategories.find(c => c.name === editingProduct.category.name)?.id || sortedCategories[0]?.id || '');
        const rawDept = (editingProduct.department || 'coffee').toLowerCase();
        const fallbackDept = editingProduct.description?.includes('[PUB]') ? 'pub' : 'coffee';
        setProductDepartment(rawDept === 'pub' ? 'pub' : (fallbackDept === 'pub' ? 'pub' : 'coffee')); 
        if (editingProduct.variants && editingProduct.variants.length > 0) {
          setProductVariants(editingProduct.variants.map((v: any) => ({ name: v.name, price: v.price })));
        } else {
          setProductVariants([{name: 'Default', price: editingProduct.price ?? ''}]);
        }
        if (editingProduct.ingredients && editingProduct.ingredients.length > 0) {
          setProductRecipe(editingProduct.ingredients.map((i: any) => ({ ingredientId: i.ingredientId, quantityUsed: i.quantityUsed })));
        } else {
          setProductRecipe([]);
        }
        setWasEditingProduct(editingProduct.id);
      } else { 
        setProductPreview(''); 
        setProductFileBlob(null); 
        setProdName({ en: '', kh: '', zh: '' }); 
        setShowExtraLangs(false);
        setPrepTime('15'); 
        setIsHotSale(false); 
        setIsSoldOutState(false); 
        setProductDiscount('');
        setProductDepartment('coffee');
        setProductCategoryId(sortedCategories[0]?.id || '');
        setProductVariants([{name: 'Default', price: ''}]);
        setProductRecipe([]);
        setWasFormOpen(true);
      } 
    } else if (!isFormOpen && !editingProduct) {
      hasInitializedProductRef.current = false;
      setWasEditingProduct(null);
      setWasFormOpen(false);
    }
  }, [editingProduct, isFormOpen, sortedCategories]);

  useEffect(() => {
    if (activeTab === 'team' && !hasFetchedTeam.current) {
      setIsTeamLoading(true);
      getTeamMembers().then(res => {
        if (res.success) {
          setTeamMembers(res.data);
          hasFetchedTeam.current = true;
        }
        setIsTeamLoading(false);
      });
    }
  }, [activeTab]);

  const getPreviewScale = () => { if (previewFormat === 'portrait') return paperSize === 'A4' ? 'scale(0.28)' : paperSize === 'A5' ? 'scale(0.24)' : 'scale(0.22)'; return paperSize === 'A4' ? 'scale(0.3)' : paperSize === 'A5' ? 'scale(0.26)' : 'scale(0.24)'; };
  const handleGeneratePDF = (format: 'portrait' | 'landscape') => { setPrintFormat(format); setTimeout(() => { window.print(); }, 500); };
  
  const fetchUserActivity = async (member: any) => {
    setActivityUser(member);
    setIsActivityLoading(true);
    const res = await getUserActivity(member.id);
    if (res.success) setUserActivityData(res.data);
    else showToast("Could not load activity", "fail");
    setIsActivityLoading(false);
  };

  const executeNav = (type: 'tab' | 'section', payload: any) => { if (type === 'tab') { setActiveTab(payload); setIsMobileMenuOpen(false); } else if (type === 'section') { setOpenSection(openSection === payload ? null : payload); } };
  const handleTabClick = (tab: any) => { if (activeTab === tab) return; if (activeTab === 'settings' && openSection && dirtySections[openSection]) { setPendingNav({ type: 'tab', payload: tab, source: openSection }); } else { executeNav('tab', tab); } };
  const handleSectionClick = (section: string) => { if (openSection && dirtySections[openSection]) { setPendingNav({ type: 'section', payload: openSection === section ? null : section, source: openSection }); } else { executeNav('section', section); } };
  
  const handleMoveBanner = async (index: number, direction: number) => { 
    if (index + direction < 0 || index + direction >= optBanners.length) return; 
    const newBanners = [...optBanners].sort((a,b) => a.sortOrder - b.sortOrder); 
    const tempOrder = newBanners[index].sortOrder; 
    newBanners[index].sortOrder = newBanners[index + direction].sortOrder; 
    newBanners[index + direction].sortOrder = tempOrder; 
    newBanners.sort((a,b) => a.sortOrder - b.sortOrder); 
    startTransition(async () => { 
      dispatchOptBanners({ type: 'set', payload: newBanners }); 
      try { await reorderBanners(newBanners.map(b => ({ id: b.id, sortOrder: b.sortOrder }))); showToast("Banners reordered!", "success"); } 
      catch (e) { showToast("Failed to reorder banners", "fail"); }
    }); 
  };

  const handleDragStart = (e: React.DragEvent, index: number) => { setDraggedBannerIndex(index); e.dataTransfer.effectAllowed = "move"; };
  const handleDragOver = (e: React.DragEvent, index: number) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; };
  const handleDrop = async (e: React.DragEvent, dropIndex: number) => { 
    e.preventDefault(); 
    if (draggedBannerIndex === null || draggedBannerIndex === dropIndex) { setDraggedBannerIndex(null); return; } 
    const newBanners = [...optBanners].sort((a,b) => a.sortOrder - b.sortOrder); 
    const draggedItem = newBanners[draggedBannerIndex]; 
    newBanners.splice(draggedBannerIndex, 1); 
    newBanners.splice(dropIndex, 0, draggedItem); 
    newBanners.forEach((b, i) => b.sortOrder = i + 1); 
    setDraggedBannerIndex(null); 
    startTransition(async () => { 
      dispatchOptBanners({ type: 'set', payload: newBanners }); 
      try { await reorderBanners(newBanners.map(b => ({ id: b.id, sortOrder: b.sortOrder }))); showToast("Banners reordered!", "success"); } 
      catch (e) { showToast("Failed to drop banner", "fail"); }
    }); 
  };

  const handleReorderCategories = (activeId: string, overId: string) => {
    const oldIndex = sortedCategories.findIndex(c => c.id === activeId);
    const newIndex = sortedCategories.findIndex(c => c.id === overId);
    if (oldIndex !== -1 && newIndex !== -1) {
      const newOrder = arrayMove(sortedCategories, oldIndex, newIndex);
      const reorderedCategories = newOrder.map((cat, index) => ({ ...cat, sortOrder: index + 1 }));
      startTransition(async () => {
         dispatchOptCategories({ type: 'set', payload: reorderedCategories });
         try { const res = await updateCategoryOrders(reorderedCategories.map(c => c.id)); if (!res.success) showToast("Failed to reorder categories.", "fail"); } 
         catch (e) { showToast("Failed to reorder categories.", "fail"); }
      });
    }
  };
  
  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>, target: 'logo' | 'product' | 'banner' | 'qr') => { 
    if (e.target.files && e.target.files.length > 0) { 
      const file = e.target.files[0]; 
      const objectUrl = URL.createObjectURL(file);
      setCropImageSrc(objectUrl); 
      setCropTarget(target); 
      setZoom(1); 
      setCropAspect(target === 'banner' ? 16 / 9 : 1); 
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
        const currentTarget = cropTarget; 
        setCropImageSrc(null); 
        setCropTarget(null); 
        
        if (currentTarget === 'logo') { 
          settingsState.setLogoFileBlob(croppedBlob); 
          settingsState.setLogoPreview(objectUrl); 
          settingsState.setIsDirtyLogo(true); 
          markDirty('branding'); 
        } else if (currentTarget === 'product') { 
          setProductFileBlob(croppedBlob); 
          setProductPreview(objectUrl); 
        } else if (currentTarget === 'banner') { 
          const fd = new FormData(); 
          fd.append('image', croppedBlob, 'banner.webp'); 
          const tempId = `temp-${Date.now()}`; 
          const nextOrder = optBanners.length > 0 ? Math.max(...optBanners.map(b => b.sortOrder)) + 1 : 1; 
          startTransition(async () => { 
            dispatchOptBanners({ type: 'add', payload: { id: tempId, image: objectUrl, sortOrder: nextOrder } }); 
            const res = await addBanner(fd); 
            if (res?.error) showToast(res.error, "fail"); else showToast("Banner added!", "success"); 
          }); 
        } else if (currentTarget === 'qr') { 
          settingsState.setQrFileBlob(croppedBlob); 
          settingsState.setQrImagePreview(objectUrl); 
          settingsState.setRemoveQr(false);
          markDirty('identity'); 
        } 
      } 
    } catch (e) { console.error(e); } 
  };
  
  const getPlatformIcon = (platform: string) => { switch (platform) { case 'facebook': return <Facebook size={18}/>; case 'instagram': return <Instagram size={18}/>; case 'telegram': return <Send size={18}/>; case 'youtube': return <Youtube size={18}/>; case 'twitter': return <Twitter size={18}/>; case 'linkedin': return <Linkedin size={18}/>; default: return <Globe size={18}/>; } };
  
  const filteredProducts = optProducts.filter(p => 
    !deletedItemIds.includes(p.id) && 
    (p.name.toLowerCase().includes(searchQuery.toLowerCase()) || (p.category?.name || '').toLowerCase().includes(searchQuery.toLowerCase())) && 
    p.id !== pendingDelete?.productId
  );

  const confirmDelete = (type: 'product' | 'category' | 'topping', id: string, name: string, fd: FormData) => { setDeleteConfirmation({ isOpen: true, type, id, name, actionFormData: fd }); };
  
  const handleConfirmDeleteAction = () => { 
    if (!deleteConfirmation.actionFormData || !deleteConfirmation.type || !deleteConfirmation.id) return; 
    const fd = deleteConfirmation.actionFormData; 
    const type = deleteConfirmation.type; 
    const id = deleteConfirmation.id; 
    
    if (type === 'product') { 
      if (pendingDeleteRef.current) { 
        const prev = pendingDeleteRef.current; 
        clearTimeout(prev.timeoutId); 
        clearInterval(prev.intervalId); 
        startTransition(async () => { 
          setDeletedItemIds(prevIds => [...prevIds, prev.productId]);
          dispatchOptProducts({ type: 'delete', payload: prev.productId }); 
          await deleteProduct(prev.actionFormData); 
        }); 
      } 
      const snapshot = optProducts.find(p => p.id === id); 
      if (!snapshot) return; 
      const expiresAt = Date.now() + 5000; 
      
      const intervalId = setInterval(() => { 
        setPendingDelete(curr => { 
          if (!curr) return null; 
          const left = Math.ceil((curr.expiresAt - Date.now()) / 1000); 
          if (left <= 0) { clearInterval(curr.intervalId); } 
          return { ...curr, timeLeft: left }; 
        }); 
      }, 1000); 
      
      const timeoutId = setTimeout(() => { 
        if (pendingDeleteRef.current?.productId === id) { 
          clearInterval(pendingDeleteRef.current.intervalId); 
          startTransition(async () => { 
            setDeletedItemIds(prevIds => [...prevIds, id]);
            dispatchOptProducts({ type: 'delete', payload: id }); 
            await deleteProduct(fd); 
          }); 
          setPendingDelete(null); pendingDeleteRef.current = null; 
        } 
      }, 5000); 
      
      const newPending: PendingDelete = { productId: id, productSnapshot: snapshot, name: deleteConfirmation.name || 'Item', actionFormData: fd, timeoutId, intervalId, expiresAt, timeLeft: 5 }; 
      setPendingDelete(newPending); pendingDeleteRef.current = newPending; 
    } else if (type === 'category') { 
      setDeleteConfirmation({ isOpen: false, type: null, id: null, name: null, actionFormData: null });
      startTransition(async () => { dispatchOptCategories({ type: 'delete', payload: id }); try { await deleteCategory(fd); showToast("Category deleted", "success"); } catch(e) { showToast("Failed to delete category", "fail"); } }); return; 
    } else if (type === 'topping') {
      setDeleteConfirmation({ isOpen: false, type: null, id: null, name: null, actionFormData: null });
      startTransition(async () => { dispatchOptToppings({ type: 'delete', payload: id }); try { await deleteTopping(fd); showToast("Topping deleted", "success"); } catch(e) { showToast("Failed to delete topping", "fail"); } }); return;
    }
    setDeleteConfirmation({ isOpen: false, type: null, id: null, name: null, actionFormData: null }); 
  };

  const addRecipeItem = () => setProductRecipe([...productRecipe, { ingredientId: '', quantityUsed: '' }]);
  const removeRecipeItem = (index: number) => setProductRecipe(productRecipe.filter((_, i) => i !== index));
  const updateRecipeItem = (index: number, field: 'ingredientId' | 'quantityUsed', value: any) => { const newRecipe = [...productRecipe]; newRecipe[index] = { ...newRecipe[index], [field]: value }; setProductRecipe(newRecipe); };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: prodName.en, name_kh: prodName.kh, name_zh: prodName.zh,
      price: parseFloat(productVariants[0]?.price as string) || 0,
      variants: productVariants.map(v => ({ name: v.name, price: parseFloat(v.price as string) || 0 })),
      discount: Number(productDiscount) || 0, categoryId: productCategoryId, time: prepTime + 'min',
      isPopular: isHotSale, isSoldOut: isSoldOutState, department: productDepartment,
      ingredients: productRecipe.map(r => ({ ingredientId: r.ingredientId, quantityUsed: parseFloat(r.quantityUsed as string) || 0 })).filter(r => r.ingredientId && r.quantityUsed > 0),
      image: productFileBlob || undefined
    };

    const isUpdate = !!editingProduct;
    const currentEditingId = editingProduct?.id;
    const tempId = `temp-${Date.now()}`;

    setIsFormOpen(false); setEditingProduct(null); setWasFormOpen(false); setWasEditingProduct(null);

    startTransition(async () => {
      if (isUpdate) {
        const optimisticProduct = { ...editingProduct, ...payload, category: { name: sortedCategories.find(c => c.id === payload.categoryId)?.name || '' }, image: productPreview || editingProduct.image } as Product;
        dispatchOptProducts({ type: 'update', payload: optimisticProduct });
        try { const res = await updateProduct({ ...payload, id: currentEditingId as string }); if (res?.error) showToast(res.error || "Failed to update product", "fail"); else showToast("Product updated successfully!", "success"); } catch (e) { showToast("Failed to update product.", "fail"); }
      } else {
        const optimisticProduct = { ...payload, id: tempId, category: { name: sortedCategories.find(c => c.id === payload.categoryId)?.name || '' }, image: productPreview || '' } as Product;
        dispatchOptProducts({ type: 'add', payload: optimisticProduct });
        try { const res = await createProduct(payload); if (res?.error) showToast(res.error || "Failed to create product", "fail"); else showToast("Product created successfully!", "success"); } catch (e) { showToast("Failed to create product.", "fail"); }
      }
    });
  };

  const handleToppingFormAction = (fd: FormData) => {
    const name = fd.get("name") as string;
    const price = parseFloat(fd.get("price") as string) || 0;
    const isDrink = fd.get("isDrink") === 'true';

    if (editingTopping) {
      const id = editingTopping.id; fd.append("id", id);
      setIsToppingFormOpen(false); setEditingTopping(null);
      startTransition(async () => { dispatchOptToppings({ type: 'update', payload: { ...editingTopping, name, price, isDrink } as Topping }); try { await updateTopping(fd); showToast("Topping updated!", "success"); } catch (e) { showToast("Failed to update topping.", "fail"); } });
    } else {
      setIsToppingFormOpen(false);
      startTransition(async () => { dispatchOptToppings({ type: 'add', payload: { id: `temp-${Date.now()}`, name, price, isDrink } as Topping }); try { await createTopping(fd); showToast("Topping created!", "success"); } catch (e) { showToast("Failed to create topping.", "fail"); } });
    }
  };

  const handleTeamFormAction = async (fd: FormData) => {
    setIsSaving(true);
    if (editingTeamMember) {
      fd.append('userId', editingTeamMember.id);
      const res = await updateTeamMemberRole(fd);
      if (res.success) { setTeamMembers(teamMembers.map(m => m.id === editingTeamMember.id ? { ...m, role: fd.get('role') } : m)); showToast("Role updated!", "success"); setIsTeamFormOpen(false); } else { showToast(res.error || "Update failed", "fail"); }
    } else {
      const res = await createTeamMember(fd);
      if (res.success) { showToast("Team member added!", "success"); getTeamMembers().then(r => { if(r.success) setTeamMembers(r.data); }); setIsTeamFormOpen(false); } else { showToast(res.error || "Creation failed", "fail"); }
    }
    setIsSaving(false);
  };

  const handleDeleteTeamMember = async (memberId: string) => {
    if (confirm("Are you sure you want to remove this user from your team?")) {
      const fd = new FormData(); fd.append('userId', memberId);
      const res = await deleteTeamMember(fd);
      if (res.success) { setTeamMembers(teamMembers.filter(m => m.id !== memberId)); showToast("User removed!", "success"); } else { showToast(res.error || "Failed to remove user", "fail"); }
    }
  };

  const handleUnsavedChangesDiscard = () => {
    if (!pendingNav) return;
    settingsState.resetSettings(pendingNav.source); 
    clearDirty(pendingNav.source); 
    executeNav(pendingNav.type, pendingNav.payload); 
    setPendingNav(null);
  };

  const handleUnsavedChangesSave = async () => {
    if (!pendingNav) return;
    setIsSaving(true); 
    const success = await settingsState.saveSettings(pendingNav.source);
    setIsSaving(false); 
    if (success) { 
      clearDirty(pendingNav.source); 
      if (pendingNav.source === 'branding') settingsState.setLogoFileBlob(null); 
      showToast("Changes saved!", "success"); 
      executeNav(pendingNav.type, pendingNav.payload); 
      setPendingNav(null); 
    }
  };

  const renderPrintTemplate = (format: 'portrait' | 'landscape') => {
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(origin ? `${origin}/${shopSlug}` : `https://scandine.xyz/${shopSlug}`)}`;
    return (
      <div className="border-[16px] border-[#1a1a1a] rounded-[48px] flex items-center justify-center bg-white text-[#4a4a4a] relative font-sans" style={{ width: format === 'landscape' ? '1000px' : '650px', height: format === 'landscape' ? '650px' : '1000px', flexDirection: format === 'landscape' ? 'row' : 'column', boxSizing: 'border-box', padding: format === 'landscape' ? '3rem 4rem' : '4rem 3rem' }}>
        {format === 'landscape' ? (
          <><div className="flex-1 flex flex-col items-center justify-center text-center px-6 w-1/2 min-w-0"><h1 className="text-[3.5rem] leading-[1.2] font-light text-gray-600 mb-2 tracking-wide break-words max-w-full font-sans">{settingsState.getShopNamePreview()}</h1><p className="text-[2.5rem] text-gray-500 mb-12 font-light">scan to view menu !</p><div className="flex items-center w-full justify-center gap-4 mb-8"><div className="flex-1 min-w-0 h-[1px] bg-gray-400"></div><div className="relative flex items-center justify-center px-4"><div className="absolute w-14 h-14 bg-[#1a1a1a] rounded-full z-0"></div><div className="relative bg-[#333] rounded-xl w-10 h-16 flex items-center justify-center shadow-md z-10 border-[3px] border-[#1a1a1a]"><div className="bg-white w-[26px] h-[34px] rounded-[2px] flex items-center justify-center"><QrCode size={18} className="text-black" /></div><div className="absolute top-1 w-2.5 h-[2px] bg-gray-400 rounded-full"></div><div className="absolute bottom-1 w-1.5 h-1.5 bg-gray-400 rounded-full"></div></div></div><div className="flex-1 min-w-0 h-[1px] bg-gray-400"></div></div><p className="text-lg text-gray-500 font-medium tracking-wide">www.scandine.xyz</p></div><div className="flex-1 flex justify-center items-center w-1/2 pl-4"><div className="relative w-[400px] h-[400px] overflow-hidden"><LazyImage src={qrCodeUrl} alt="Shop QR Code" className="w-[400px] h-[400px] object-contain" /></div></div></>
        ) : (
          <><div className="flex flex-col items-center justify-center text-center mt-2 w-full px-4 min-w-0"><h1 className="text-[4rem] leading-[1.2] font-light text-gray-600 mb-2 tracking-wide break-words max-w-full font-sans">{settingsState.getShopNamePreview()}</h1><p className="text-[3rem] text-gray-500 font-light">scan to view menu !</p></div><div className="flex justify-center items-center flex-1 w-full my-6"><div className="relative w-[450px] h-[450px] overflow-hidden"><LazyImage src={qrCodeUrl} alt="Shop QR Code" className="w-[450px] h-[450px] object-contain" /></div></div><div className="flex flex-col items-center justify-center text-center w-full px-8 mb-4 min-w-0"><div className="flex items-center w-full justify-center gap-4 mb-8"><div className="flex-1 min-w-0 h-[1px] bg-gray-400"></div><div className="relative flex items-center justify-center px-4"><div className="absolute w-16 h-16 bg-[#1a1a1a] rounded-full z-0"></div><div className="relative bg-[#333] rounded-2xl w-12 h-20 flex items-center justify-center shadow-md z-10 border-[3px] border-[#1a1a1a]"><div className="bg-white w-8 h-12 rounded-[2px] flex items-center justify-center"><QrCode size={22} className="text-black" /></div><div className="absolute top-1.5 w-3 h-[2px] bg-gray-400 rounded-full"></div><div className="absolute bottom-1.5 w-2 h-2 bg-gray-400 rounded-full"></div></div></div><div className="flex-1 min-w-0 h-[1px] bg-gray-400"></div></div><p className="text-2xl text-gray-500 font-medium tracking-wide">www.scandine.xyz</p></div></>
        )}
      </div>
    );
  };

  const showText = !isSidebarCollapsed || isMobileMenuOpen;

  const NavItem = ({ id, icon: Icon, label }: { id: string, icon: any, label: string }) => {
    const isActive = activeTab === id;
    return (
      <div className="relative group/nav">
        <button onClick={() => handleTabClick(id)} className={`w-full flex items-center py-3 rounded-xl transition-all min-w-0 ${!showText ? 'justify-center px-0' : 'justify-start px-4 gap-3'} ${isActive ? 'bg-gray-900 text-white font-bold shadow-md' : 'text-gray-500 font-medium hover:bg-gray-50 active:scale-[0.98]'}`}>
          <Icon size={20} className="shrink-0" />{showText && <span className="font-medium truncate">{label}</span>}
        </button>
        {!showText && (<div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-1.5 bg-gray-900 text-white text-xs font-bold rounded-lg opacity-0 pointer-events-none group-hover/nav:opacity-100 transition-all z-50 whitespace-nowrap shadow-xl flex items-center">{label}<div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-gray-900 rotate-45"></div></div>)}
      </div>
    );
  };

  return (
    <div className={`flex min-h-[100dvh] bg-[#F9FAFB] font-sans text-gray-800 relative`} style={{ '--theme-color': settings?.themeColor || '#000000' } as React.CSSProperties}>
      
      {receiptToPrint && (
        <>
          <style>{`@media print { @page { margin: 0; size: 57mm auto; } html, body { background: white !important; height: auto !important; min-height: 0 !important; } .min-h-screen, .h-screen, .h-full, .min-h-[100dvh], .h-[100dvh] { min-height: 0 !important; height: auto !important; } aside, header, nav, main, .md\\:hidden, .lg\\:hidden { display: none !important; } #dashboard-receipt-print-area { display: block !important; position: absolute !important; top: 0 !important; left: 0 !important; width: 57mm !important; margin: 0 !important; padding: 0 !important; } }`}</style>
          <div id="dashboard-receipt-print-area" className="hidden print:block bg-white z-[99999]"><PosReceipt order={receiptToPrint} shopName={settings?.name || "Shop"} /></div>
        </>
      )}

      <PendingDeleteToast pendingDelete={pendingDelete} onUndo={clearPendingDelete} />
      
      {/* --- ADDED TOAST COMPONENT --- */}
      <AdminToast show={toast.show} message={toast.message} type={toast.type} />

      <div className="lg:hidden fixed top-0 left-0 w-full bg-white z-20 px-4 py-3 flex items-center justify-between gap-4 border-b border-gray-100 shadow-sm print:hidden">
        <div className="flex items-center gap-3 min-w-0 overflow-hidden"><button ref={mobileMenuBtnRef} onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 bg-gray-50 rounded-xl active:scale-95 transition-transform shrink-0"><Menu size={22} className="text-gray-700" /></button><h1 className="font-bold text-lg tracking-tight text-gray-900 truncate font-sans">{settingsState.getShopNamePreview() || 'AdminPanel'}</h1></div>
        <button onClick={() => handleTabClick('settings')} className="p-2 bg-gray-50 rounded-xl text-gray-700 active:scale-95 transition-transform shrink-0"><Settings size={20} /></button>
      </div>

      <aside ref={sidebarRef} className={`fixed inset-y-0 left-0 z-40 bg-white border-r border-gray-100 transition-all duration-300 lg:static flex-shrink-0 flex flex-col ${isMobileMenuOpen ? 'translate-x-0 w-64' : `-translate-x-full lg:translate-x-0 ${isSidebarCollapsed ? 'w-20' : 'w-64'}`} print:hidden`}>
        <button onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} className="hidden lg:flex absolute -right-4 top-8 w-8 h-8 bg-gray-900 text-white border-2 border-white rounded-full items-center justify-center shadow-md hover:bg-gray-800 hover:scale-110 z-50 transition-all active:scale-95 cursor-pointer ring-4 ring-white">{isSidebarCollapsed ? <ChevronRight size={16} strokeWidth={2.5} /> : <ChevronLeft size={16} strokeWidth={2.5} />}</button>
        <div className={`pb-6 pt-20 lg:pt-8 h-full flex flex-col overflow-hidden transition-all duration-300 ${isSidebarCollapsed && !isMobileMenuOpen ? 'px-3' : 'px-6'}`}>
          <div className={`mb-6 hidden lg:flex items-center ${isSidebarCollapsed && !isMobileMenuOpen ? 'justify-center' : 'justify-start'}`}>
            {!isSidebarCollapsed || isMobileMenuOpen ? (
              <div className="flex flex-col min-w-0 animate-in fade-in duration-300"><h1 className="font-bold text-xl font-sans line-clamp-1 text-gray-900">{settingsState.getShopNamePreview() || 'AdminPanel'}</h1><span className={`inline-block mt-2 px-2.5 py-1 rounded-md text-[10px] uppercase font-bold tracking-wider w-max bg-orange-50 text-orange-600`}>{shopPlan} PLAN</span></div>
            ) : (<div className="w-10 h-10 bg-gray-900 text-white rounded-xl flex items-center justify-center font-black text-lg shadow-md shrink-0 animate-in fade-in duration-300">{settingsState.getShopNamePreview().charAt(0).toUpperCase()}</div>)}
          </div>
          <div className="mb-6 lg:hidden flex flex-col min-w-0"><h1 className="font-bold text-xl font-sans line-clamp-1 text-gray-900">{settingsState.getShopNamePreview() || 'AdminPanel'}</h1><span className={`inline-block mt-2 px-2.5 py-1 rounded-md text-[10px] uppercase font-bold tracking-wider w-max bg-orange-50 text-orange-600`}>{shopPlan} PLAN</span></div>
          <nav className="space-y-2 flex-1 min-h-0 overflow-y-auto no-scrollbar [-webkit-overflow-scrolling:touch]" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {featPos && (<><NavItem id="overview" icon={Activity} label="Overview" /><NavItem id="pos" icon={ShoppingCart} label="POS" /><NavItem id="orders" icon={ClipboardList} label="Orders" /></>)}
            {!isFreePlan && <NavItem id="tables" icon={QrCode} label="Tables & QR" />}
            {isAdmin && (
              <div className="mt-8 pt-4 border-t border-gray-100">
                {showText ? <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block px-4 animate-in fade-in duration-300">Management</span> : <div className="h-px w-8 bg-gray-200 mx-auto mb-3 mt-1 rounded-full"></div>}
                <NavItem id="menu" icon={LayoutGrid} label="Menu" />
                <NavItem id="categories" icon={List} label="Categories" />
                <NavItem id="toppings" icon={Layers} label="Toppings" />
                {featPos && <NavItem id="inventory" icon={Package} label="Inventory" />}
                {featPos && <NavItem id="team" icon={Users} label="Staff & Team" />}
                <NavItem id="settings" icon={Settings} label="Settings" />
              </div>
            )}
          </nav>
          <div className="pt-6 border-t border-gray-100 mt-auto shrink-0 flex flex-col gap-2">
            {!isAdmin && shift && (
              <div className="relative group/nav mb-2"><button onClick={initiateCloseShift} className={`w-full flex items-center py-3 rounded-xl transition-all min-w-0 ${!showText ? 'justify-center px-0' : 'justify-start px-4 gap-3'} text-red-600 font-bold bg-red-50 hover:bg-red-100 active:scale-[0.98] border border-red-100 shadow-sm`}><DollarSign size={20} className="shrink-0" />{showText && <span className="font-semibold truncate text-sm">Close Shift</span>}</button></div>
            )}
            <div className="relative group/nav"><button onClick={() => signOut({ callbackUrl: '/auth/login' })} className={`w-full flex items-center py-3 rounded-xl transition-all min-w-0 ${!showText ? 'justify-center px-0' : 'justify-start px-4 gap-3'} text-gray-400 hover:text-red-600 hover:bg-red-50 active:scale-[0.98]`}><LogOut size={20} className="shrink-0" />{showText && <span className="font-semibold truncate text-sm">Log Out</span>}</button></div>
          </div>
        </div>
      </aside>

      <UserActivityModal isOpen={!!activityUser} userEmail={activityUser?.email} isLoading={isActivityLoading} activityData={userActivityData} onClose={() => setActivityUser(null)} />

      <main className={`flex-1 w-full max-w-full min-w-0 min-h-0 no-scrollbar [&::-webkit-scrollbar]:hidden ${activeTab === 'pos' ? 'flex flex-col h-[100dvh] lg:h-[100dvh] pt-[60px] lg:pt-0 overflow-hidden bg-white print:h-auto print:overflow-visible print:pt-0' : 'p-4 pt-20 lg:p-8 lg:pt-8 pb-28 lg:pb-8 overflow-y-auto [-webkit-overflow-scrolling:touch] print:overflow-visible'}`} style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        
        {userEmail?.includes('demo_') && (
          <div className="mb-6 bg-orange-50 border border-orange-100 p-4 rounded-2xl flex items-center justify-between animate-in slide-in-from-top-4 print:hidden">
            <div className="flex items-center gap-3"><div className="p-2 bg-orange-100 text-orange-600 rounded-lg"><Sparkles size={18} /></div><div><p className="text-sm font-bold text-orange-900">You are in Demo Mode</p><p className="text-xs text-orange-700">Make any changes you like! This temporary account is yours for 1 hour.</p></div></div>
            <Link href="/auth/register" className="hidden sm:block bg-orange-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-orange-700 transition-colors">Create Your Own Shop</Link>
          </div>
        )}

        {featPos && <div className={activeTab === 'overview' ? 'block animate-in fade-in duration-300' : 'hidden'}><DashboardOverview orders={orders} products={optProducts} /></div>}
        {featPos && <div className={activeTab === 'pos' ? 'block h-full flex flex-col min-h-0' : 'hidden'}>
          <ToastProvider>
            <OrderProvider>
              <AdminPosSection 
                dashboardCategories={sortedCategories} 
                dashboardProducts={filteredProducts} // <--- USE FILTERED PRODUCTS HERE
                shopId={shopId} 
                userEmail={userEmail} 
                userRole={userRole} 
                shopName={settings?.name || "Shop"} 
                printerUrl={settingsState.printerUrl} 
                toppings={optToppings} 
              />
            </OrderProvider>
          </ToastProvider>
        </div>}
        {featPos && <div className={`${activeTab === 'orders' ? 'block animate-in fade-in duration-300' : 'hidden'} max-w-5xl mx-auto pb-12 print:hidden`}><OrdersTab orders={orders} orderFilter={orderFilter} setOrderFilter={setOrderFilter} settingsName={settings?.name || "Shop"} printerUrl={settingsState.printerUrl} /></div>}
        {isAdmin && featPos && <div className={`${activeTab === 'inventory' ? 'block animate-in fade-in duration-300' : 'hidden'} pb-12 print:hidden max-w-5xl mx-auto`}><InventoryManager userName={userEmail ? userEmail.split('@')[0] : 'Admin'} ingredients={ingredients} stockLogs={stockLogs} /></div>}
        {isAdmin && featPos && <div className={`${activeTab === 'team' ? 'block animate-in fade-in duration-300' : 'hidden'} print:hidden max-w-5xl mx-auto`}><TeamTab teamMembers={teamMembers} isTeamLoading={isTeamLoading} userEmail={userEmail || ''} onAddStaff={() => { setEditingTeamMember(null); setIsTeamFormOpen(true); }} onEditStaff={(member) => { setEditingTeamMember(member); setIsTeamFormOpen(true); }} onViewActivity={fetchUserActivity} onDeleteStaff={handleDeleteTeamMember} /></div>}

        {activeTab !== 'overview' && activeTab !== 'pos' && activeTab !== 'orders' && activeTab !== 'inventory' && activeTab !== 'team' && activeTab !== 'toppings' && (
          <header className="flex flex-col sm:flex-row justify-between mb-6 items-start sm:items-center gap-4 print:hidden">
             <h2 className="text-2xl font-bold capitalize hidden sm:block">{activeTab}</h2>
             <div className="flex w-full sm:w-auto gap-3">
               <a href={`/${shopSlug}`} target="_blank" rel="noopener noreferrer" className="flex-1 sm:flex-none flex justify-center items-center gap-2 px-4 py-3.5 sm:py-2.5 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-gray-800 transition-all shadow-sm active:scale-95"><ExternalLink size={16} /> View Live Menu</a>
               <button onClick={() => setIsQrModalOpen(true)} className="flex-1 sm:flex-none flex justify-center items-center gap-2 px-4 py-3.5 sm:py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:border-gray-300 transition-all shadow-sm active:scale-95"><QrCode size={16} className="text-gray-500"/> Get Shop QR</button>
             </div>
          </header>
        )}

        {activeTab !== 'overview' && activeTab !== 'pos' && activeTab !== 'orders' && activeTab !== 'inventory' && activeTab !== 'team' && activeTab !== 'toppings' && !isGuideComplete && !dismissGuide && (
          <div className="mb-8 bg-white p-6 rounded-3xl border border-gray-900 shadow-sm relative overflow-hidden animate-in fade-in slide-in-from-top-4 print:hidden min-w-0">
            <div className="absolute top-0 left-0 w-2 h-full bg-gray-900"></div>
            <div className="flex justify-between items-start mb-4"><div><h3 className="text-lg font-bold text-gray-900">Welcome to your dashboard! 👋</h3><p className="text-sm text-gray-500 mt-1">Complete these steps to get your menu live.</p></div><button onClick={() => setDismissGuide(true)} className="text-gray-400 hover:text-gray-600 p-1 active:scale-95 transition-transform"><X size={20}/></button></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 min-w-0">
               <button onClick={() => { handleTabClick('categories'); if(!hasCategory) setIsCatFormOpen(true); }} className={`p-4 rounded-2xl text-left flex flex-col gap-2 border transition-all active:scale-[0.98] min-w-0 ${hasCategory ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200 hover:border-gray-900'}`}><div className="flex justify-between items-center w-full"><span className={`text-sm font-bold ${hasCategory ? 'text-green-700' : 'text-gray-700'}`}>1. Create Category</span>{hasCategory ? <CheckCircle size={18} className="text-green-500" /> : <div className="w-4 h-4 rounded-full border-2 border-gray-300"></div>}</div><span className="text-xs text-gray-500">Organize your menu structure.</span></button>
               <button onClick={() => { handleTabClick('menu'); if(!hasProduct) setIsFormOpen(true); }} className={`p-4 rounded-2xl text-left flex flex-col gap-2 border transition-all active:scale-[0.98] min-w-0 ${hasProduct ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200 hover:border-gray-900'}`}><div className="flex justify-between items-center w-full"><span className={`text-sm font-bold ${hasProduct ? 'text-green-700' : 'text-gray-700'}`}>2. Add Item</span>{hasProduct ? <CheckCircle size={18} className="text-green-500" /> : <div className="w-4 h-4 rounded-full border-2 border-gray-300"></div>}</div><span className="text-xs text-gray-500">Add products to your menu.</span></button>
               <button onClick={() => { handleTabClick('settings'); handleSectionClick('identity'); }} className={`p-4 rounded-2xl text-left flex flex-col gap-2 border transition-all active:scale-[0.98] min-w-0 ${hasSettings ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200 hover:border-gray-900'}`}><div className="flex justify-between items-center w-full"><span className={`text-sm font-bold ${hasSettings ? 'text-green-700' : 'text-gray-700'}`}>3. Update Settings</span>{hasSettings ? <CheckCircle size={18} className="text-green-500" /> : <div className="w-4 h-4 rounded-full border-2 border-gray-300"></div>}</div><span className="text-xs text-gray-500">Set your shop details & logo.</span></button>
            </div>
          </div>
        )}

        {isAdmin && <div className={`${activeTab === 'menu' ? 'block animate-in fade-in duration-300' : 'hidden'} print:hidden`}><MenuTab searchQuery={searchQuery} setSearchQuery={setSearchQuery} viewMode={viewMode} setViewMode={setViewMode} optProducts={optProducts} filteredProducts={filteredProducts} safeLimits={safeLimits} setIsFormOpen={setIsFormOpen} setEditingProduct={setEditingProduct} handleTabClick={handleTabClick} featCampaign={featCampaign} getDisplayPrice={getDisplayPrice} getValidImage={getValidImage} /></div>}
        
        {isAdmin && (
           <div className={`${activeTab === 'categories' ? 'block animate-in fade-in duration-300' : 'hidden'} print:hidden`}>
             <div className="flex justify-between items-center gap-4 mb-6"><div><h3 className="font-bold text-gray-900 text-xl sm:text-2xl hidden sm:block">Manage Categories</h3><p className="text-sm text-gray-500 mt-1 hidden sm:block">Drag and drop to reorder. The live menu will follow this order.</p></div><button onClick={() => setIsCatFormOpen(true)} className={`hidden lg:flex ml-auto shrink-0 ${optCategories.length >= safeLimits.maxCategories ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-gray-900 text-white hover:bg-gray-800'} px-6 py-3.5 rounded-2xl font-bold active:scale-95 transition shadow-sm items-center justify-center gap-2 text-[16px] md:text-sm`}><Plus size={18} strokeWidth={3}/> Add New</button></div>
             {sortedCategories.length === 0 ? (<div className="py-16 text-center text-gray-400 font-medium bg-white rounded-3xl border border-gray-100 shadow-sm">No categories created yet</div>) : (<CategorySortableList categories={sortedCategories} onReorder={handleReorderCategories} onEdit={(cat) => setEditingCategory(cat)} onDelete={(id, name) => { const fd = new FormData(); fd.append('id', id); confirmDelete('category', id, name, fd); }} />)}
            <button onClick={() => setIsCatFormOpen(true)} className="lg:hidden fixed bottom-6 right-6 z-10 bg-gray-900 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-xl active:scale-95 transition-transform hover:bg-gray-800 disabled:opacity-50"><Plus size={24} strokeWidth={3} /></button>
           </div>
        )}

        {isAdmin && <div className={`${activeTab === 'toppings' ? 'block animate-in fade-in duration-300' : 'hidden'} print:hidden`}><ToppingsTab toppings={optToppings} onAddTopping={() => setIsToppingFormOpen(true)} onEditTopping={(topping) => { setEditingTopping(topping); setIsToppingFormOpen(true); }} onDeleteTopping={(id, name) => { const fd = new FormData(); fd.append('id', id); confirmDelete('topping', id, name, fd); }} /></div>}
        {!isFreePlan && <div className={`${activeTab === 'tables' ? 'block animate-in fade-in duration-300' : 'hidden'} pb-12 print:hidden`}><TableManager shopId={shopId} shopSlug={shopSlug} /></div>}

        {isAdmin && (
          <div className={`${activeTab === 'settings' ? 'block animate-in slide-in-from-right-4 duration-300' : 'hidden'} max-w-2xl mx-auto space-y-6 pb-12 print:hidden`}>
             <SettingsTab 
               openSection={openSection}
               handleSectionClick={handleSectionClick}
               onIdentitySubmit={settingsState.onIdentitySubmit}
               previewNameEn={settingsState.previewNameEn}
               setPreviewNameEn={settingsState.setPreviewNameEn}
               previewNameKh={settingsState.previewNameKh}
               setPreviewNameKh={settingsState.setPreviewNameKh}
               previewDisplay={settingsState.previewDisplay}
               setPreviewDisplay={settingsState.setPreviewDisplay}
               printerUrl={settingsState.printerUrl}
               setPrinterUrl={settingsState.setPrinterUrl}
               address={settingsState.address}
               setAddress={settingsState.setAddress}
               phone={settingsState.phone}
               setPhone={settingsState.setPhone}
               is24Hours={settingsState.is24Hours}
               setIs24Hours={settingsState.setIs24Hours}
               openTime={settingsState.openTime}
               setOpenTime={settingsState.setOpenTime}
               closeTime={settingsState.closeTime}
               setCloseTime={settingsState.setCloseTime}
               qrImagePreview={settingsState.qrImagePreview}
               qrInputRef={settingsState.qrInputRef} 
               onFileSelect={onFileSelect}
               setQrImagePreview={settingsState.setQrImagePreview}
               setQrFileBlob={settingsState.setQrFileBlob}
               setRemoveQr={settingsState.setRemoveQr}
               markDirty={markDirty}
               dirtySections={dirtySections}
               onBrandingSubmit={settingsState.onBrandingSubmit}
               headerDesign={settingsState.headerDesign}
               allDesigns={allDesigns}
               isCurrentDesignLocked={isCurrentDesignLocked}
               setHeaderDesign={settingsState.setHeaderDesign}
               handlePrevDesign={settingsState.handlePrevDesign}
               handleNextDesign={settingsState.handleNextDesign}
               themeColorPreview={settingsState.themeColorPreview}
               getShopNamePreview={settingsState.getShopNamePreview}
               isNoBg={settingsState.isNoBg}
               logoPreview={settingsState.logoPreview}
               fallbackLogo={FALLBACK_LOGO}
               logoInputRef={settingsState.logoInputRef} 
               logoFileBlob={settingsState.logoFileBlob}
               setLogoType={settingsState.setLogoType}
               logoType={settingsState.logoType}
               setThemeColorPreview={settingsState.setThemeColorPreview}
               cancelLogoChange={settingsState.cancelLogoChange}
               clearDirty={clearDirty}
               optBanners={optBanners}
               draggedBannerIndex={draggedBannerIndex}
               handleDragStart={handleDragStart}
               handleDragOver={handleDragOver}
               handleDrop={handleDrop}
               handleMoveBanner={handleMoveBanner}
               dispatchOptBanners={dispatchOptBanners}
               deleteBanner={deleteBanner}
               showToast={showToast}
               bannerInputRef={bannerInputRef}
               safeLimits={safeLimits}
               onSocialsSubmit={settingsState.onSocialsSubmit}
               canUseCustomSocials={canUseCustomSocials}
               socialLinks={settingsState.socialLinks}
               getPlatformIcon={getPlatformIcon as any}
               updateSocialLink={settingsState.updateSocialLink}
               removeSocialLink={settingsState.removeSocialLink}
               addSocialLink={settingsState.addSocialLink}
               onNotificationsSubmit={settingsState.onNotificationsSubmit}
               canUseTelegram={canUseTelegram} 
               isStaffEnabled={settingsState.isStaffEnabled}
               setIsStaffEnabled={settingsState.setIsStaffEnabled}
               tgChatId={settingsState.tgChatId}
               setTgChatId={settingsState.setTgChatId}
               handleTestTelegram={settingsState.handleTestTelegram}
               isTestingTg={settingsState.isTestingTg}
               tgStaffCallTopicId={settingsState.tgStaffCallTopicId}
               setTgStaffCallTopicId={settingsState.setTgStaffCallTopicId}
               tgNewOrderTopicId={settingsState.tgNewOrderTopicId}
               setTgNewOrderTopicId={settingsState.setTgNewOrderTopicId}
               startTransition={startTransition}
               isDirtyLogo={settingsState.isDirtyLogo}
               setIsDirtyLogo={settingsState.setIsDirtyLogo}
               setLogoFileBlobAction={settingsState.setLogoFileBlob}
               isFreePlan={isFreePlan}
               settings={settings}
             />
          </div>
        )}
      </main>

      <DeleteConfirmationModal 
        isOpen={deleteConfirmation.isOpen} 
        type={deleteConfirmation.type}
        name={deleteConfirmation.name || 'this item'}
        onCancel={() => setDeleteConfirmation({ isOpen: false, type: null, id: null, name: null, actionFormData: null })} 
        onConfirm={handleConfirmDeleteAction} 
      />
      <ToppingFormModal isOpen={isToppingFormOpen || !!editingTopping} editingTopping={editingTopping} isSaving={isSaving} onClose={() => { setIsToppingFormOpen(false); setEditingTopping(null); }} formAction={handleToppingFormAction} />
      <TeamManagementModal isOpen={isTeamFormOpen || !!editingTeamMember} editingTeamMember={editingTeamMember} isSaving={isSaving} onClose={() => { setIsTeamFormOpen(false); setEditingTeamMember(null); }} formAction={handleTeamFormAction} />
      <UnsavedChangesModal isOpen={!!pendingNav} isSaving={isSaving} onDiscard={handleUnsavedChangesDiscard} onSave={handleUnsavedChangesSave} />
      <QrPrintModal isOpen={isQrModalOpen} onClose={() => setIsQrModalOpen(false)} previewFormat={previewFormat} setPreviewFormat={setPreviewFormat} paperSize={paperSize} setPaperSize={setPaperSize} getPreviewScale={getPreviewScale} renderPrintTemplate={renderPrintTemplate} handleGeneratePDF={handleGeneratePDF} />
      <ImageCropperModal isOpen={!!cropImageSrc && !!cropTarget} imageSrc={cropImageSrc} crop={crop} zoom={zoom} aspect={cropAspect} onCropChange={setCrop} onZoomChange={setZoom} onCropComplete={onCropComplete} onClose={() => { setCropImageSrc(null); setCropTarget(null); }} onSave={showCroppedImage} />

      {(isFormOpen || editingProduct) && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 sm:p-6 overflow-y-auto print:hidden" onClick={() => { setIsFormOpen(false); setEditingProduct(null); }}>
          <div className="bg-white w-full max-w-3xl rounded-[32px] shadow-2xl p-6 sm:p-8 md:p-10 my-auto max-h-[90vh] overflow-y-auto no-scrollbar relative flex flex-col" onClick={e => e.stopPropagation()}>
             <div className="flex justify-between items-center mb-6 md:mb-8 shrink-0"><h2 className="text-2xl md:text-3xl font-extrabold text-gray-900">{editingProduct ? "Edit Product" : "Add Product"}</h2><button type="button" onClick={() => { setIsFormOpen(false); setEditingProduct(null); }} className="p-2 sm:p-3 bg-gray-50 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors active:scale-95"><X size={20} className="sm:w-6 sm:h-6"/></button></div>
             <form onSubmit={handleSaveProduct} className="space-y-5 md:space-y-6 flex-1 overflow-y-auto no-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                <div onClick={() => productInputRef.current?.click()} className="w-full h-36 md:h-48 border-2 border-dashed border-gray-200 rounded-[24px] flex flex-col items-center justify-center text-gray-400 cursor-pointer hover:bg-gray-50 transition-colors overflow-hidden relative group bg-gray-50/30 shrink-0">
                  {productPreview ? (<><img src={productPreview} className="w-full h-full object-contain p-2 md:p-4" alt="Preview"/><div className="absolute inset-0 bg-white/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><span className="bg-white text-gray-900 text-sm font-bold px-4 py-2 rounded-xl shadow-sm border border-gray-200">Change Image</span></div></>) : (<><UploadCloud size={32} className="mb-2 sm:mb-3 text-gray-300" strokeWidth={1.5} /><span className="text-sm sm:text-base font-semibold text-gray-400">Tap to upload</span></>)}
                </div>
                <input type="file" ref={productInputRef} onChange={e => onFileSelect(e, 'product')} className="hidden" />

                <div><div className="flex justify-between items-center mb-2"><label className="block text-xs md:text-sm font-extrabold text-gray-500">Product Name</label><button type="button" onClick={() => setShowExtraLangs(!showExtraLangs)} className="text-[11px] md:text-xs font-extrabold text-gray-400 hover:text-gray-600">+ Add Khmer</button></div><input required value={prodName.en} onChange={e => setProdName({...prodName, en: e.target.value})} placeholder="e.g. Anchor" className="w-full px-4 sm:px-5 py-3.5 sm:py-4 md:py-5 bg-gray-50/50 border border-gray-100 rounded-2xl outline-none focus:border-gray-900 text-sm sm:text-base md:text-lg font-bold transition-all shadow-sm" />{showExtraLangs && (<input value={prodName.kh} onChange={e => setProdName({...prodName, kh: e.target.value})} placeholder="Khmer Name (Optional)" className="w-full mt-3 px-4 sm:px-5 py-3.5 sm:py-4 md:py-5 bg-gray-50/50 border border-gray-100 rounded-2xl outline-none focus:border-gray-900 text-sm sm:text-base md:text-lg font-bold transition-all shadow-sm" />)}</div>

                <div className="p-4 sm:p-5 border border-gray-100 rounded-[24px] bg-gray-50/30">
                   <h3 className="text-sm md:text-base font-extrabold text-gray-900 mb-3 md:mb-4">Sizes & Pricing</h3>
                   {productVariants.map((v, idx) => (
                    <div key={idx} className="flex flex-col sm:flex-row gap-3 mb-3 items-start sm:items-center">
                      <input placeholder="Default" value={v.name} onChange={e => { const nv = [...productVariants]; nv[idx].name = e.target.value; setProductVariants(nv); }} className="w-full sm:flex-1 px-4 py-3 sm:py-3.5 md:py-4 bg-white border border-gray-200 rounded-2xl outline-none focus:border-gray-900 text-sm sm:text-base font-bold shadow-sm" required />
                      <div className="flex w-full sm:w-auto gap-3"><input type="number" step="0.01" min="0" placeholder="2" value={v.price} onChange={e => { const nv = [...productVariants]; nv[idx].price = e.target.value; setProductVariants(nv); }} className="w-full sm:w-32 md:w-40 px-4 py-3 sm:py-3.5 md:py-4 bg-white border border-gray-200 rounded-2xl outline-none focus:border-gray-900 text-sm sm:text-base font-bold shadow-sm" required />{productVariants.length > 1 && <button type="button" onClick={() => setProductVariants(productVariants.filter((_, i) => i !== idx))} className="p-3 sm:p-3.5 md:p-4 text-red-300 hover:text-red-500 transition-colors bg-white border border-gray-200 rounded-2xl shadow-sm"><Trash2 size={20} className="sm:w-5 sm:h-5 md:w-6 md:h-6"/></button>}</div>
                    </div>
                   ))}
                   <button type="button" onClick={() => setProductVariants([...productVariants, {name: '', price: ''}])} className="text-xs sm:text-sm font-extrabold text-gray-900 hover:text-gray-600 flex items-center gap-1.5 mt-2"><Plus size={16} strokeWidth={3}/> Add Size</button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                   <div><label className="block text-xs md:text-sm font-extrabold text-gray-500 mb-2">Discount (%)</label><input type="number" min="0" max="100" value={productDiscount} onChange={e => setProductDiscount(Number(e.target.value))} placeholder="0" className="w-full px-4 sm:px-5 py-3.5 sm:py-4 md:py-5 bg-white border border-gray-200 rounded-2xl outline-none focus:border-gray-900 text-sm sm:text-base md:text-lg font-bold shadow-sm" /></div>
                   <div><label className="block text-xs md:text-sm font-extrabold text-gray-500 mb-2">Category</label><select value={productCategoryId} onChange={(e) => setProductCategoryId(e.target.value)} className="w-full px-4 sm:px-5 py-3.5 sm:py-4 md:py-5 bg-white border border-gray-200 rounded-2xl outline-none focus:border-gray-900 text-sm sm:text-base md:text-lg font-bold shadow-sm appearance-none cursor-pointer">{sortedCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                </div>

                <div><label className="block text-xs md:text-sm font-extrabold text-gray-500 mb-2">Preparation Time</label><div className="relative"><input type="number" min="1" value={prepTime} onChange={e => setPrepTime(e.target.value)} placeholder="15" className="w-full px-4 sm:px-5 py-3.5 sm:py-4 md:py-5 bg-white border border-gray-200 rounded-2xl outline-none focus:border-gray-900 text-sm sm:text-base md:text-lg font-bold shadow-sm" /><span className="absolute right-5 md:right-6 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm md:text-base pointer-events-none">min</span></div></div>

                <div className="p-4 sm:p-5 border border-gray-100 rounded-[24px] bg-gray-50/30">
                   <h3 className="text-sm md:text-base font-extrabold text-gray-900 mb-1.5">Recipe Mapping</h3><p className="text-[11px] md:text-xs text-gray-500 mb-4 font-medium">Auto-deduct inventory stock</p>
                   {productRecipe.map((item, idx) => (
                    <div key={idx} className="flex flex-col sm:flex-row gap-3 mb-3 items-start sm:items-center">
                      <select value={item.ingredientId} onChange={e => updateRecipeItem(idx, 'ingredientId', e.target.value)} className="w-full sm:flex-1 px-4 py-3 sm:py-3.5 md:py-4 bg-white border border-gray-200 rounded-2xl outline-none focus:border-gray-900 text-sm sm:text-base font-bold shadow-sm" required><option value="">Select Ingredient</option>{ingredients?.map(ing => <option key={ing.id} value={ing.id}>{ing.name} ({ing.unit})</option>)}</select>
                      <div className="flex w-full sm:w-auto gap-3"><input type="number" step="0.01" min="0.01" placeholder="Qty" value={item.quantityUsed} onChange={e => updateRecipeItem(idx, 'quantityUsed', e.target.value)} className="w-full sm:w-24 md:w-32 px-4 py-3 sm:py-3.5 md:py-4 bg-white border border-gray-200 rounded-2xl outline-none focus:border-gray-900 text-sm sm:text-base font-bold shadow-sm" required /><button type="button" onClick={() => removeRecipeItem(idx)} className="p-3 sm:p-3.5 md:p-4 text-red-300 hover:text-red-50 transition-colors bg-white border border-gray-200 rounded-2xl shadow-sm"><Trash2 size={20} className="sm:w-5 sm:h-5 md:w-6 md:h-6"/></button></div>
                    </div>
                   ))}
                   <button type="button" onClick={addRecipeItem} className="text-xs sm:text-sm font-extrabold text-gray-900 hover:text-gray-600 flex items-center gap-1.5 mt-2"><Plus size={16} strokeWidth={3}/> Add Ingredient</button>
                </div>

                <div className="p-5 md:p-6 bg-orange-50/50 border border-orange-100 rounded-[24px] flex justify-between items-center mt-4"><div><h4 className="font-extrabold text-orange-600 text-sm md:text-base">Hot Sale Item</h4><p className="text-[11px] md:text-xs text-orange-400 font-bold mt-1">Show this in the popular section</p></div><label className="relative inline-flex items-center cursor-pointer shrink-0"><input type="checkbox" checked={isHotSale} onChange={e => setIsHotSale(e.target.checked)} className="sr-only peer" /><div className="w-12 h-7 md:w-14 md:h-8 bg-orange-200/50 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 md:after:h-7 md:after:w-7 after:transition-all peer-checked:bg-orange-500"></div></label></div>
                <div className="p-5 md:p-6 bg-emerald-50/50 border border-emerald-100 rounded-[24px] flex justify-between items-center mt-3 mb-1"><div><h4 className="font-extrabold text-emerald-600 text-sm md:text-base tracking-wide">AVAILABLE</h4></div><label className="relative inline-flex items-center cursor-pointer shrink-0"><input type="checkbox" checked={!isSoldOutState} onChange={e => setIsSoldOutState(!e.target.checked)} className="sr-only peer" /><div className="w-12 h-7 md:w-14 md:h-8 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 md:after:h-7 md:after:w-7 after:transition-all peer-checked:bg-emerald-500"></div></label></div><p className="text-[11px] md:text-xs text-gray-400 font-medium px-2 mb-8">Toggle to mark item as currently unavailable.</p>

                <div className="flex flex-col gap-3 sm:gap-4 pt-4 shrink-0">
                   <button type="submit" disabled={isSaving} className="w-full py-4 sm:py-5 bg-[#111827] text-white rounded-[20px] font-extrabold text-sm md:text-base active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2">{isSaving && <Loader2 size={20} className="animate-spin"/>} {editingProduct ? "Update Product" : "Create Product"}</button>
                   {editingProduct && <button type="button" onClick={() => { const fd = new FormData(); fd.append('id', editingProduct.id); confirmDelete('product', editingProduct.id, editingProduct.name, fd); setIsFormOpen(false); setEditingProduct(null); }} className="w-full py-4 sm:py-5 bg-red-50 text-red-600 rounded-[20px] font-extrabold text-sm md:text-base hover:bg-red-100 active:scale-[0.98] transition-all flex justify-center items-center gap-2"><Trash2 size={20} /> Delete Product</button>}
                </div>
             </form>
          </div>
        </div>
      )}

      {(isCatFormOpen || editingCategory) && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 print:hidden" onClick={() => { setIsCatFormOpen(false); setEditingCategory(null); }}>
          <div className="bg-white w-full max-w-sm rounded-[32px] shadow-2xl p-6 md:p-8 animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
             <div className="flex justify-between items-center mb-6"><h2 className="text-2xl font-bold">{editingCategory ? "Edit Category" : "Add Category"}</h2><button type="button" onClick={() => { setIsCatFormOpen(false); setEditingCategory(null); }} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 active:scale-95 transition-colors"><X size={20}/></button></div>
             <form action={(fd) => { const name = fd.get("name") as string; const isDrink = fd.get("isDrink") === 'true'; if (editingCategory) { const id = editingCategory.id; fd.append("id", id); fd.append("sortOrder", (editingCategory.sortOrder || 1).toString()); setIsCatFormOpen(false); setEditingCategory(null); startTransition(async () => { dispatchOptCategories({ type: 'update', payload: { ...editingCategory, name, isDrink } as Category }); try { await updateCategory(fd); showToast("Category updated!", "success"); } catch (e) { showToast("Failed to update category.", "fail"); } }); } else { setIsCatFormOpen(false); const maxSort = sortedCategories.length > 0 ? Math.max(...sortedCategories.map(c => c.sortOrder || 0)) : 0; const newSortOrder = maxSort + 1; fd.append("sortOrder", newSortOrder.toString()); startTransition(async () => { dispatchOptCategories({ type: 'add', payload: { id: `temp-${Date.now()}`, name, sortOrder: newSortOrder, isDrink, discount: 0, shopId: shopId } as Category }); try { await createCategory(fd); showToast("Category created!", "success"); } catch (e) { showToast("Failed to create category.", "fail"); } }); } }} className="space-y-4">
               <div><label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Category Name</label><input type="text" name="name" defaultValue={editingCategory?.name} placeholder="e.g. Coffee" className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:border-gray-900" required /></div>
               <div className="pt-2"><label className="flex items-center gap-2 text-sm font-bold cursor-pointer"><input type="checkbox" name="isDrink" value="true" defaultChecked={editingCategory?.isDrink} className="w-4 h-4 cursor-pointer accent-gray-900"/> This is a Drink Category</label></div>
               <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 mt-6"><button type="button" onClick={() => { setIsCatFormOpen(false); setEditingCategory(null); }} className="px-6 py-3.5 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 active:scale-95 transition-all">Cancel</button><button type="submit" disabled={isSaving} className="px-6 py-3.5 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-2">{isSaving && <Loader2 size={16} className="animate-spin"/>} Save</button></div>
             </form>
          </div>
        </div>
      )}

    </div>
  );
}