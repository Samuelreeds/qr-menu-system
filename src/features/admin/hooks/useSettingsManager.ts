import { useState, useRef, useEffect, TransitionStartFunction } from 'react';
import { updateShopIdentity, updateShopBranding, updateShopSocials } from '@/lib/actions';
import { updateStaffSettingsAction, sendTestTelegramNotification } from '@/lib/staff-actions';
import { ShopSettings } from '../AdminDashboard';
import { SocialLink } from '../tabs/SettingsTab';

interface UseSettingsManagerProps {
  shopId: string;
  settings: ShopSettings;
  callStaffEnabled: boolean;
  telegramChatId?: string | null;
  staffCallTopicId?: string | null;
  newOrderTopicId?: string | null;
  showToast: (msg: string) => void;
  startTransition: TransitionStartFunction;
  allDesigns: string[];
  isCurrentDesignLocked: boolean;
  markDirty: (section: string) => void;
  clearDirty: (section: string) => void;
}

export function useSettingsManager({
  shopId, settings, callStaffEnabled, telegramChatId, staffCallTopicId, newOrderTopicId,
  showToast, startTransition, allDesigns, isCurrentDesignLocked, markDirty, clearDirty
}: UseSettingsManagerProps) {
  
  const [previewNameEn, setPreviewNameEn] = useState(settings?.name || '');
  const [previewNameKh, setPreviewNameKh] = useState(settings?.name_kh || '');
  const [previewDisplay, setPreviewDisplay] = useState(settings?.nameDisplay || 'EN');
  const [address, setAddress] = useState(settings?.address || '');
  const [phone, setPhone] = useState(settings?.phone || '');
  const [printerUrl, setPrinterUrl] = useState(settings?.printerUrl || ''); 
  const qrInputRef = useRef<HTMLInputElement>(null);
  const [qrImagePreview, setQrImagePreview] = useState(settings?.qrImage || '');
  const [qrFileBlob, setQrFileBlob] = useState<Blob | null>(null);
  const [removeQr, setRemoveQr] = useState(false);

  const getInitialHours = () => { 
    if (!settings?.openingHours) return { open: '08:00', close: '22:00' }; 
    const parts = settings.openingHours.split(' - '); 
    if (parts.length === 2) return { open: parts[0], close: parts[1] }; 
    return { open: '08:00', close: '22:00' }; 
  };
  const initialHours = getInitialHours();
  const [openTime, setOpenTime] = useState(initialHours.open);
  const [closeTime, setCloseTime] = useState(initialHours.close);
  const [is24Hours, setIs24Hours] = useState(settings?.is24Hours || false);

  const [headerDesign, setHeaderDesign] = useState(settings?.headerDesign || 'design1');
  const [themeColorPreview, setThemeColorPreview] = useState(settings?.themeColor || '#000000');
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [logoPreview, setLogoPreview] = useState(settings?.logo || '');
  const [logoType, setLogoType] = useState(settings?.logoType || 'withBackground');
  const [isDirtyLogo, setIsDirtyLogo] = useState(false);
  const [logoFileBlob, setLogoFileBlob] = useState<Blob | null>(null);
  const isNoBg = logoType === 'withoutBackground';

  const [socialLinks, setSocialLinks] = useState<SocialLink[]>(() => { try { return settings?.socials ? JSON.parse(settings.socials) : []; } catch { return []; } });
  const [isStaffEnabled, setIsStaffEnabled] = useState(callStaffEnabled);
  const [tgChatId, setTgChatId] = useState(telegramChatId || '');
  const [tgStaffCallTopicId, setTgStaffCallTopicId] = useState(staffCallTopicId || '');
  const [tgNewOrderTopicId, setTgNewOrderTopicId] = useState(newOrderTopicId || '');
  const [isTestingTg, setIsTestingTg] = useState(false);

  useEffect(() => { 
    setLogoPreview(settings?.logo || ''); 
    setLogoType(settings?.logoType || 'withBackground'); 
    setIsDirtyLogo(false); 
  }, [settings?.logo, settings?.logoType]);

  const getShopNamePreview = () => { 
    if (previewDisplay === 'KH' && previewNameKh) return previewNameKh; 
    if (previewDisplay === 'BOTH' && previewNameKh) return `${previewNameEn} ${previewNameKh}`; 
    return previewNameEn || 'Shop Name'; 
  };

  const handlePrevDesign = (e?: React.MouseEvent) => { if (e) e.stopPropagation(); const idx = allDesigns.indexOf(headerDesign); setHeaderDesign(allDesigns[(idx - 1 + allDesigns.length) % allDesigns.length]); markDirty('branding'); };
  const handleNextDesign = (e?: React.MouseEvent) => { if (e) e.stopPropagation(); const idx = allDesigns.indexOf(headerDesign); setHeaderDesign(allDesigns[(idx + 1) % allDesigns.length]); markDirty('branding'); };
  const cancelLogoChange = () => { setLogoPreview(settings?.logo || ''); setLogoType(settings?.logoType || 'withBackground'); setIsDirtyLogo(false); setLogoFileBlob(null); clearDirty('branding'); };
  
  const addSocialLink = () => { setSocialLinks([...socialLinks, { id: Date.now().toString(), platform: 'website', url: '', active: true }]); markDirty('socials'); };
  const removeSocialLink = (id: string) => { setSocialLinks(socialLinks.filter(l => l.id !== id)); markDirty('socials'); };
  const updateSocialLink = (id: string, field: keyof SocialLink, value: any) => { setSocialLinks(socialLinks.map(l => l.id === id ? { ...l, [field]: value } : l)); markDirty('socials'); };

  const handleTestTelegram = async (type: 'General' | 'Staff Call' | 'New Order', specificTopicId?: string) => { 
    if (!tgChatId.trim()) { showToast("Please enter a Chat ID first."); return; } 
    setIsTestingTg(true); 
    const res = await sendTestTelegramNotification(shopId, tgChatId, settings?.name || 'Your Shop', specificTopicId, type); 
    showToast(res.message || (res.success ? "Test message sent!" : "Failed to send message.")); 
    setIsTestingTg(false); 
  };

  const saveIdentityForm = async () => { 
    const fd = new FormData(); 
    fd.set('name', !previewNameEn.trim() && previewNameKh.trim() ? previewNameKh.trim() : previewNameEn.trim()); 
    if (previewNameKh.trim()) fd.set('name_kh', previewNameKh.trim()); 
    fd.set('nameDisplay', previewDisplay); 
    fd.set('address', address); 
    fd.set('phone', phone); 
    fd.set('printerUrl', printerUrl);
    fd.set('is24Hours', String(is24Hours));
    if (!is24Hours) fd.set('openingHours', `${openTime} - ${closeTime}`); 
    if (qrFileBlob) fd.set('qrImage', qrFileBlob, 'qr.webp');
    if (removeQr) fd.set('removeQr', 'true');
    try { await updateShopIdentity(fd); return true; } catch(e) { showToast("Error saving information."); return false; } 
  };

  const saveBrandingForm = async () => { 
    if (isCurrentDesignLocked) return false; 
    const fd = new FormData(); 
    fd.set('headerDesign', headerDesign); 
    fd.set('themeColor', themeColorPreview); 
    fd.set('logoType', logoType); 
    if (logoFileBlob) fd.set('logo', logoFileBlob, 'logo.webp'); 
    try { await updateShopBranding(fd); return true; } catch (e) { showToast("Error saving branding."); return false; } 
  };

  const saveSocialsForm = async () => { 
    const fd = new FormData(); 
    fd.set('socials', JSON.stringify(socialLinks)); 
    try { const res = await updateShopSocials(fd); if (res?.error) { showToast(res.error); return false; } return true; } catch (e) { showToast("Error saving socials."); return false; } 
  };

  const saveNotificationsForm = async () => { 
    try { const res = await updateStaffSettingsAction(shopId, isStaffEnabled, tgChatId, tgStaffCallTopicId, tgNewOrderTopicId); if (!res.success) { showToast(res.message || "Error saving"); return false; } return true; } catch (e) { return false; } 
  };

  const resetSettings = (source: string) => {
    if (source === 'identity') { 
      setPreviewNameEn(settings?.name || ''); setPreviewNameKh(settings?.name_kh || ''); 
      setPreviewDisplay(settings?.nameDisplay || 'EN'); setAddress(settings?.address || ''); 
      setPhone(settings?.phone || ''); setPrinterUrl(settings?.printerUrl || ''); 
      const initH = getInitialHours(); setOpenTime(initH.open); setCloseTime(initH.close); 
      setIs24Hours(settings?.is24Hours || false); setQrImagePreview(settings?.qrImage || ''); 
      setQrFileBlob(null); setRemoveQr(false);
    } else if (source === 'branding') { 
      setHeaderDesign(settings?.headerDesign || 'design1'); setThemeColorPreview(settings?.themeColor || '#000000'); 
      setLogoPreview(settings?.logo || ''); setLogoType(settings?.logoType || 'withBackground'); setIsDirtyLogo(false); setLogoFileBlob(null); 
    } else if (source === 'socials') { 
      try { setSocialLinks(settings?.socials ? JSON.parse(settings.socials) : []); } catch { setSocialLinks([]); } 
    } else if (source === 'notifications') { 
      setIsStaffEnabled(callStaffEnabled); setTgChatId(telegramChatId || ''); setTgStaffCallTopicId(staffCallTopicId || ''); setTgNewOrderTopicId(newOrderTopicId || ''); 
    }
  };

  const saveSettings = async (source: string) => {
    let success = false; 
    if (source === 'identity') success = await saveIdentityForm(); 
    else if (source === 'branding') success = await saveBrandingForm(); 
    else if (source === 'socials') success = await saveSocialsForm(); 
    else if (source === 'notifications') success = await saveNotificationsForm(); 
    return success;
  };

  return {
    previewNameEn, setPreviewNameEn, previewNameKh, setPreviewNameKh, previewDisplay, setPreviewDisplay,
    address, setAddress, phone, setPhone, printerUrl, setPrinterUrl, is24Hours, setIs24Hours,
    openTime, setOpenTime, closeTime, setCloseTime, qrImagePreview, setQrImagePreview, qrInputRef,
    qrFileBlob, setQrFileBlob, removeQr, setRemoveQr, headerDesign, setHeaderDesign,
    themeColorPreview, setThemeColorPreview, logoPreview, setLogoPreview, logoType, setLogoType,
    isDirtyLogo, setIsDirtyLogo, logoInputRef, logoFileBlob, setLogoFileBlob, isNoBg,
    socialLinks, setSocialLinks, isStaffEnabled, setIsStaffEnabled, tgChatId, setTgChatId,
    tgStaffCallTopicId, setTgStaffCallTopicId, tgNewOrderTopicId, setTgNewOrderTopicId,
    isTestingTg, setIsTestingTg, getShopNamePreview, handlePrevDesign, handleNextDesign,
    cancelLogoChange, addSocialLink, removeSocialLink, updateSocialLink, handleTestTelegram,
    onIdentitySubmit: (e?: React.FormEvent) => { if (e) e.preventDefault(); if (!previewNameEn.trim() && !previewNameKh.trim()) { showToast("Please enter at least one shop name."); return; } clearDirty('identity'); showToast("Basic information saved!"); startTransition(async () => { await saveIdentityForm(); setQrFileBlob(null); setRemoveQr(false); }); },
    onBrandingSubmit: (e?: React.FormEvent) => { if (e) e.preventDefault(); if (isCurrentDesignLocked) return; clearDirty('branding'); setIsDirtyLogo(false); showToast("Branding updated!"); startTransition(async () => { await saveBrandingForm(); setLogoFileBlob(null); }); },
    onSocialsSubmit: (e?: React.FormEvent) => { if (e) e.preventDefault(); clearDirty('socials'); showToast("Social Media Links saved!"); startTransition(async () => { await saveSocialsForm(); }); },
    onNotificationsSubmit: (e?: React.FormEvent) => { if (e) e.preventDefault(); clearDirty('notifications'); showToast("Notification settings saved!"); startTransition(async () => { await saveNotificationsForm(); }); },
    resetSettings, saveSettings
  };
}