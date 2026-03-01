'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  LayoutDashboard, Plus, ExternalLink, PowerOff, Power, Check, 
  XCircle, Link as LinkIcon, Info, Mail, Settings, Users, 
  MoreHorizontal, Clock, Menu, Trash2, KeyRound, Copy, Bell,
  RefreshCw, Eye, Layers, Pencil, Archive, ArrowLeft, ShieldCheck,
  Loader2
} from 'lucide-react';
import { 
  toggleShopStatus, 
  updateShopPlan, 
  createInvite, 
  deleteShop, 
  deleteUser, 
  requestPasswordReset, 
  deleteInvite,
  softDeleteShop,
  restoreShop,
  createPlan,
  updatePlan,
  togglePlanStatus
} from '@/lib/actions';

export default function SuperAdminClient({ shops, invites, users, plans = [] }: { shops: any[], invites: any[], users: any[], plans?: any[] }) {
  const [activeTab, setActiveTab] = useState<'shops' | 'plans' | 'invites' | 'users'>('shops');
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  
  const [isSaving, setIsSaving] = useState(false);
  const [planError, setPlanError] = useState<string | null>(null);

  // Calculate Stats
  const activeShops = shops.filter(s => s.status === 'ACTIVE' && !s.deletedAt).length;
  const paidShops = shops.filter(s => s.plan !== 'FREE').length;
  const activeInvites = invites.filter(i => !i.isUsed && new Date(i.expiresAt) > new Date()).length;

  const displayPlans = plans || [];

  const planFeatures = [
    { key: 'featPreparationTime', label: "Preparation Time" },
    { key: 'featCampaign', label: "Campaign" },
    { key: 'featCoverBanner', label: "Cover Banner" },
    { key: 'featSmartCategories', label: "Smart Categories" },
    { key: 'featUploadImageMenu', label: "Upload Image Menu" },
    { key: 'featAlertBarista', label: "Alert Barista from Telegram" },
    { key: 'featPos', label: "POS" },
    { key: 'featOrderFromTable', label: "Order From Table" },
    { key: 'featMultipleLanguage', label: "Multiple Language" },
    { key: 'featCustomDomain', label: "Custom Domain" },
    { key: 'featDedicatedSupport', label: "Dedicated Support" },
    { key: 'featAiUpload', label: "AI Upload Image Menu" }
  ];

  const copyInviteLink = (token: string) => {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
    const fullLink = baseUrl.startsWith('http') ? `${baseUrl}/auth/register?token=${token}` : `https://${baseUrl}/auth/register?token=${token}`;
    
    navigator.clipboard.writeText(fullLink);
    alert(`Invite link copied to clipboard!\n\n${fullLink}`);
  };

  const selectedPlan = editingPlanId === 'new' 
    ? { id: 'new', name: 'New Plan', slug: '', priceMonthly: 0, priceYearly: 0, status: 'ACTIVE', limitsCount: 0, featuresCount: 0, order: displayPlans.length + 1, limits: {}, allowTrial: false, trialDays: 14, isRecommended: false }
    : displayPlans.find(p => p.id === editingPlanId);

  const handlePlanSave = async (fd: FormData) => {
    setIsSaving(true);
    setPlanError(null);
    try {
      let res;
      if (editingPlanId === 'new') {
        res = await createPlan(fd);
      } else {
        res = await updatePlan(fd);
      }
      
      if (res?.success) {
        setEditingPlanId(null);
      } else {
        setPlanError(res?.error || 'Failed to save plan. Ensure internal key is unique.');
      }
    } catch (err) {
      setPlanError('An unexpected error occurred while saving.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#F9FAFB] font-sans overflow-hidden relative">
      {/* SIDEBAR */}
      <aside className={`w-[260px] border-r border-gray-200 bg-white flex flex-col z-40 fixed md:static h-full transform transition-transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="p-6 mb-8">
           <h2 className="font-bold text-gray-900 text-lg">Scandine Admin</h2>
        </div>
        <nav className="p-4 space-y-2">
          <button 
            onClick={() => { setActiveTab('shops'); setEditingPlanId(null); }} 
            className={`w-full flex p-3 rounded-lg text-sm transition-all ${activeTab === 'shops' ? 'bg-orange-50 text-gray-900 font-bold' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            <LayoutDashboard size={18} className="mr-3" /> Shops
          </button>
          <button 
            onClick={() => { setActiveTab('plans'); setEditingPlanId(null); }} 
            className={`w-full flex p-3 rounded-lg text-sm transition-all ${activeTab === 'plans' ? 'bg-orange-50 text-gray-900 font-bold' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            <Layers size={18} className="mr-3" /> Plans
          </button>
          <button 
            onClick={() => { setActiveTab('invites'); setEditingPlanId(null); }} 
            className={`w-full flex p-3 rounded-lg text-sm transition-all ${activeTab === 'invites' ? 'bg-orange-50 text-gray-900 font-bold' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            <Mail size={18} className="mr-3" /> Invites
          </button>
          <button 
            onClick={() => { setActiveTab('users'); setEditingPlanId(null); }} 
            className={`w-full flex p-3 rounded-lg text-sm transition-all ${activeTab === 'users' ? 'bg-orange-50 text-gray-900 font-bold' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            <Users size={18} className="mr-3" /> Users
          </button>
        </nav>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden w-full">
        <header className="flex items-center justify-between p-6 bg-white border-b border-gray-100">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2"><Menu size={22}/></button>
            <h1 className="text-xl font-bold capitalize">
              {activeTab === 'plans' ? (editingPlanId === 'new' ? 'Create Plan' : editingPlanId ? 'Edit Plan' : 'Plan Management') : `Manage ${activeTab}`}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            {activeTab === 'invites' && (
              <button 
                onClick={() => setIsInviteModalOpen(true)} 
                className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-black transition-colors"
              >
                <Plus size={18}/> Create Invite
              </button>
            )}
            {activeTab === 'plans' && !editingPlanId && (
              <button onClick={() => setEditingPlanId('new')} className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-black transition-colors">
                <Plus size={18}/> Create Plan
              </button>
            )}
            <button className="p-2 bg-white border rounded-full text-gray-400 hover:text-gray-900 transition-colors"><Bell size={18}/></button>
          </div>
        </header>

        <div className="p-6 overflow-y-auto">
          
          {/* STATS CARDS (Hidden when editing a plan) */}
          {!editingPlanId && activeTab === 'plans' && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                <p className="text-gray-500 text-xs font-bold mb-1.5 flex items-center gap-1.5">Total Plans <Info size={12} className="text-gray-300"/></p>
                <h3 className="text-2xl font-black mb-1 text-gray-900">{displayPlans.length}</h3>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                <p className="text-gray-500 text-xs font-bold mb-1.5 flex items-center gap-1.5">Active Plans <Info size={12} className="text-gray-300"/></p>
                <h3 className="text-2xl font-black mb-1 text-gray-900">{displayPlans.filter(p => p.status === 'ACTIVE').length}</h3>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                <p className="text-gray-500 text-xs font-bold mb-1.5 flex items-center gap-1.5">Total Enabled Features <Info size={12} className="text-gray-300"/></p>
                <h3 className="text-2xl font-black mb-1 text-gray-900">{displayPlans.reduce((acc, p) => acc + (p.featuresCount || 0), 0)}</h3>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                <p className="text-gray-500 text-xs font-bold mb-1.5 flex items-center gap-1.5">Total Configured Limits <Info size={12} className="text-gray-300"/></p>
                <h3 className="text-2xl font-black mb-1 text-gray-900">{displayPlans.reduce((acc, p) => acc + (p.limitsCount || 0), 0)}</h3>
              </div>
            </div>
          )}

          {!editingPlanId && activeTab !== 'plans' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                <p className="text-gray-500 text-xs font-bold mb-1.5 flex items-center gap-1.5">Total {activeTab === 'shops' ? 'Shops' : activeTab === 'invites' ? 'Invites' : 'Users'} <Info size={12} className="text-gray-300"/></p>
                <h3 className="text-2xl font-black mb-1 text-gray-900">{activeTab === 'shops' ? shops.length : activeTab === 'invites' ? invites.length : users.length}</h3>
                <p className="text-[11px] font-bold text-gray-400">vs last month <span className="text-emerald-500 ml-1">+12%</span></p>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                <p className="text-gray-500 text-xs font-bold mb-1.5 flex items-center gap-1.5">{activeTab === 'shops' ? 'Paid Subscriptions' : activeTab === 'invites' ? 'Used Invites' : 'Active Users'} <Info size={12} className="text-gray-300"/></p>
                <h3 className="text-2xl font-black mb-1 text-gray-900">{activeTab === 'shops' ? paidShops : activeTab === 'invites' ? invites.filter((i:any) => i.isUsed).length : users.length}</h3>
                <p className="text-[11px] font-bold text-gray-400">vs last month <span className="text-emerald-500 ml-1">+4%</span></p>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                <p className="text-gray-500 text-xs font-bold mb-1.5 flex items-center gap-1.5">{activeTab === 'shops' ? 'Active Shops' : activeTab === 'invites' ? 'Pending Invites' : 'New Users'} <Info size={12} className="text-gray-300"/></p>
                <h3 className="text-2xl font-black mb-1 text-gray-900">{activeTab === 'shops' ? activeShops : activeTab === 'invites' ? activeInvites : 0}</h3>
                <p className="text-[11px] font-bold text-gray-400">vs last month <span className="text-emerald-500 ml-1">+2%</span></p>
              </div>
            </div>
          )}

          {/* PLAN EDITOR VIEW */}
          {activeTab === 'plans' && editingPlanId && selectedPlan ? (
            <div key={selectedPlan.id} className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300 pb-12">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <button onClick={() => setEditingPlanId(null)} className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition active:scale-95">
                    <ArrowLeft size={20} className="text-gray-600"/>
                  </button>
                  <div>
                    <h2 className="text-2xl font-black text-gray-900 tracking-tight">{editingPlanId === 'new' ? 'Create New Plan' : selectedPlan.name}</h2>
                    <p className="text-sm text-gray-500 font-medium">Plan settings and limitations</p>
                  </div>
                </div>
                <button type="submit" form="planForm" disabled={isSaving} className="flex items-center gap-2 bg-gray-900 text-white px-6 py-2.5 rounded-xl font-bold shadow-sm hover:bg-black active:scale-95 transition-all text-sm disabled:opacity-70">
                  {isSaving && <Loader2 size={16} className="animate-spin" />}
                  {isSaving ? 'Saving...' : (editingPlanId === 'new' ? 'Create Plan' : 'Save Changes')}
                </button>
              </div>

              {planError && (
                <div className="bg-red-50 border border-red-100 p-4 rounded-xl flex items-center gap-3 shadow-sm animate-in fade-in">
                  <XCircle className="text-red-500 shrink-0" size={20} />
                  <p className="text-sm text-red-800 font-semibold">{planError}</p>
                </div>
              )}

              {/* Section E: Downgrade Notice */}
              <div className="bg-blue-50/50 border border-blue-100 p-5 rounded-2xl flex items-start gap-3 shadow-sm">
                <Info className="text-blue-500 shrink-0 mt-0.5" size={20} />
                <div className="text-sm text-blue-800 leading-relaxed">
                  <p className="font-extrabold mb-1 tracking-tight">Downgrade Behavior Notice</p>
                  <p className="opacity-90">Existing premium data should remain stored on downgrade. Disabled features become hidden/locked for the tenant. Upgrading later restores access to saved settings automatically.</p>
                </div>
              </div>

              <form id="planForm" action={handlePlanSave} className="space-y-6">
                
                {editingPlanId !== 'new' && <input type="hidden" name="id" value={selectedPlan.id} />}

                {/* Section A: Basic Info */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="p-5 border-b border-gray-100 bg-gray-50/50">
                    <h3 className="font-bold text-gray-900">Basic Information</h3>
                  </div>
                  <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Plan Name</label>
                      <input type="text" name="name" defaultValue={selectedPlan.name} required className="w-full bg-white border border-gray-200 text-sm font-semibold text-gray-900 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-gray-900 transition-all shadow-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Internal Key / Slug</label>
                      <input type="text" name="slug" defaultValue={selectedPlan.slug} className="w-full bg-white border border-gray-200 text-sm font-semibold text-gray-900 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-gray-900 transition-all shadow-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Status</label>
                      <select name="status" defaultValue={selectedPlan.status} className="w-full bg-white border border-gray-200 text-sm font-semibold text-gray-900 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-gray-900 transition-all shadow-sm cursor-pointer">
                        <option value="ACTIVE">Active</option>
                        <option value="INACTIVE">Inactive / Hidden</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Display Order</label>
                      <input type="number" name="order" defaultValue={selectedPlan.order} className="w-full bg-white border border-gray-200 text-sm font-semibold text-gray-900 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-gray-900 transition-all shadow-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Monthly Price ($)</label>
                      <input type="number" step="0.01" name="priceMonthly" defaultValue={selectedPlan.priceMonthly} className="w-full bg-white border border-gray-200 text-sm font-semibold text-gray-900 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-gray-900 transition-all shadow-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Yearly Price ($)</label>
                      <input type="number" step="0.01" name="priceYearly" defaultValue={selectedPlan.priceYearly} className="w-full bg-white border border-gray-200 text-sm font-semibold text-gray-900 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-gray-900 transition-all shadow-sm" />
                    </div>
                  </div>
                </div>

                {/* Section B: Billing / Trial Rules */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="p-5 border-b border-gray-100 bg-gray-50/50">
                    <h3 className="font-bold text-gray-900">Billing & Trial Rules</h3>
                  </div>
                  <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                      <div>
                        <p className="font-bold text-gray-800 text-sm">Allow Trial</p>
                        <p className="text-xs text-gray-500 mt-0.5">Enable free trial for this plan</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" name="allowTrial" defaultChecked={selectedPlan.allowTrial} className="sr-only peer"/>
                        <div className="w-11 h-6 bg-gray-300 rounded-full peer peer-checked:bg-gray-900 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full peer-checked:after:border-white shadow-sm"></div>
                      </label>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                      <div>
                        <p className="font-bold text-gray-800 text-sm">Show as Recommended</p>
                        <p className="text-xs text-gray-500 mt-0.5">Highlight this plan on pricing page</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" name="isRecommended" defaultChecked={selectedPlan.isRecommended} className="sr-only peer"/>
                        <div className="w-11 h-6 bg-gray-300 rounded-full peer peer-checked:bg-gray-900 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full peer-checked:after:border-white shadow-sm"></div>
                      </label>
                    </div>
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Trial Days</label>
                      <input type="number" name="trialDays" defaultValue={selectedPlan.trialDays ?? 14} className="w-full md:w-1/2 bg-white border border-gray-200 text-sm font-semibold text-gray-900 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-gray-900 transition-all shadow-sm" />
                    </div>
                  </div>
                </div>

                {/* Section C: Limits */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                    <h3 className="font-bold text-gray-900">Numeric Limits</h3>
                    <span className="text-[10px] font-bold bg-white border border-gray-200 text-gray-500 px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm">Configured: 5</span>
                  </div>
                  <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Max Menu Items (Products)</label>
                      <input type="number" name="maxProducts" defaultValue={selectedPlan.limits?.maxProducts ?? 0} className="w-full bg-white border border-gray-200 text-sm font-semibold text-gray-900 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-gray-900 transition-all shadow-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Max Categories</label>
                      <input type="number" name="maxCategories" defaultValue={selectedPlan.limits?.maxCategories ?? 0} className="w-full bg-white border border-gray-200 text-sm font-semibold text-gray-900 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-gray-900 transition-all shadow-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Max Promotional Banners</label>
                      <input type="number" name="maxBanners" defaultValue={selectedPlan.limits?.maxBanners ?? 0} className="w-full bg-white border border-gray-200 text-sm font-semibold text-gray-900 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-gray-900 transition-all shadow-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Max QR Themes</label>
                      <input type="number" name="maxQrThemes" defaultValue={selectedPlan.limits?.maxQrThemes ?? 0} className="w-full bg-white border border-gray-200 text-sm font-semibold text-gray-900 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-gray-900 transition-all shadow-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">AI Upload Token Limit (Monthly)</label>
                      <input type="number" name="aiUploadLimit" defaultValue={selectedPlan.limits?.aiUploadLimit ?? 0} className="w-full bg-white border border-gray-200 text-sm font-semibold text-gray-900 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-gray-900 transition-all shadow-sm" />
                    </div>
                  </div>
                </div>

                {/* Section D: Feature Access */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                    <div>
                      <h3 className="font-bold text-gray-900">Feature Access</h3>
                      <p className="text-xs text-gray-500 mt-0.5">Toggle specific modules and capabilities for this plan</p>
                    </div>
                    <ShieldCheck className="text-gray-400" size={24} />
                  </div>
                  <div className="divide-y divide-gray-50 grid grid-cols-1 md:grid-cols-2">
                    {planFeatures.map((feature, idx) => {
                      const isChecked = selectedPlan[feature.key] === true;

                      return (
                        <div key={feature.key} className={`p-4 px-6 flex items-center justify-between hover:bg-gray-50 transition-colors ${idx % 2 === 0 ? 'md:border-r border-gray-50' : ''}`}>
                          <div>
                            <p className="font-bold text-gray-800 text-sm">{feature.label}</p>
                            <p className="text-[10px] text-gray-400 mt-0.5 uppercase tracking-wider">Default in this plan</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" name={feature.key} defaultChecked={isChecked} className="sr-only peer"/>
                            <div className="w-11 h-6 bg-gray-300 rounded-full peer peer-checked:bg-gray-900 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full peer-checked:after:border-white shadow-sm"></div>
                          </label>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </form>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
              <table className="w-full text-left whitespace-nowrap">
                {/* SHOPS TAB */}
                {activeTab === 'shops' && (
                  <>
                    <thead className="bg-gray-50 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                      <tr>
                        <th className="p-4 pl-6">Shop Name</th>
                        <th className="p-4">Shop Link (ID)</th>
                        <th className="p-4">Plan</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 pr-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-sm">
                      {shops.map((shop: any) => (
                        <tr key={shop.id} className={`hover:bg-gray-50/50 transition-colors group ${shop.deletedAt ? 'opacity-50' : ''}`}>
                          <td className="p-4 pl-6 font-bold text-gray-900">{shop.name}</td>
                          <td className="p-4">
                            <Link href={`/${shop.id}`} target="_blank" className="text-blue-500 hover:underline flex items-center gap-1.5" title={`/${shop.id}`}>
                              <span className="truncate max-w-[120px]">/{shop.id}</span> <ExternalLink size={14} className="shrink-0" />
                            </Link>
                          </td>
                          <td className="p-4">
                            <form action={async (fd) => { await updateShopPlan(fd); }}>
                              <input type="hidden" name="id" value={shop.id} />
                              <select 
                                key={`${shop.id}-${shop.plan}`} // Force re-render of select box value when server responds
                                name="plan" 
                                defaultValue={shop.plan} 
                                onChange={(e) => e.target.form?.requestSubmit()}
                                className="bg-white border border-gray-200 text-xs font-bold rounded-lg px-2 py-1 outline-none cursor-pointer"
                              >
                                {displayPlans.filter(p => p.status === 'ACTIVE' || p.id === shop.plan).map(p => (
                                  <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                              </select>
                            </form>
                          </td>
                          <td className="p-4">
                            <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${shop.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                              {shop.status}
                            </span>
                          </td>
                          <td className="p-4 pr-6 text-right flex items-center justify-end gap-2">
                            <Link href={`/superadmin/shop/${shop.id}`} className="p-2 text-gray-400 hover:text-gray-900 border border-transparent hover:border-gray-200 rounded-lg">
                              <Eye size={16} />
                            </Link>
                            <form action={async (fd) => { await toggleShopStatus(fd); }}>
                              <input type="hidden" name="id" value={shop.id} />
                              <input type="hidden" name="currentStatus" value={shop.status === 'ACTIVE' ? 'true' : 'false'} />
                              <button type="submit" className="p-2 text-gray-400 hover:text-gray-900 border border-transparent hover:border-gray-200 rounded-lg">
                                {shop.status === 'ACTIVE' ? <PowerOff size={16} /> : <Power size={16} />}
                              </button>
                            </form>

                            {shop.deletedAt ? (
                              <form action={async (fd) => { await restoreShop(fd); }}>
                                <input type="hidden" name="id" value={shop.id} />
                                <button type="submit" className="p-2 text-emerald-600 hover:text-emerald-700 border border-transparent hover:border-emerald-100 rounded-lg">
                                  <RefreshCw size={16} />
                                </button>
                              </form>
                            ) : (
                              <form action={async (fd) => { if(confirm('Soft delete this shop?')) await softDeleteShop(fd); }}>
                                <input type="hidden" name="id" value={shop.id} />
                                <button type="submit" className="p-2 text-gray-400 hover:text-red-600 border border-transparent hover:border-red-100 rounded-lg">
                                  <Trash2 size={16} />
                                </button>
                              </form>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </>
                )}

                {/* PLANS TAB (Table View) */}
                {activeTab === 'plans' && !editingPlanId && (
                  <>
                    <thead className="bg-gray-50 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                      <tr>
                        <th className="p-4 pl-6">Plan Name</th>
                        <th className="p-4">Monthly Price</th>
                        <th className="p-4">Yearly Price</th>
                        <th className="p-4 text-center">Limits Count</th>
                        <th className="p-4 text-center">Enabled Features</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 pr-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-sm">
                      {displayPlans.map((plan: any) => (
                        <tr key={plan.id} className={`hover:bg-gray-50/50 transition-colors group ${plan.status === 'INACTIVE' ? 'opacity-60' : ''}`}>
                          <td className="p-4 pl-6 font-bold text-gray-900">{plan.name}</td>
                          <td className="p-4 font-medium text-gray-600">${plan.priceMonthly}</td>
                          <td className="p-4 font-medium text-gray-600">${plan.priceYearly}</td>
                          <td className="p-4 text-center font-medium text-gray-600">{plan.limitsCount}</td>
                          <td className="p-4 text-center font-medium text-gray-600">{plan.featuresCount}</td>
                          <td className="p-4">
                            <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${plan.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                              {plan.status}
                            </span>
                          </td>
                          <td className="p-4 pr-6 text-right flex items-center justify-end gap-2">
                            <button type="button" onClick={() => setEditingPlanId(plan.id)} title="Edit" className="p-2 text-gray-400 hover:text-gray-900 border border-transparent hover:border-gray-200 rounded-lg transition-all">
                              <Pencil size={16}/>
                            </button>
                            <button type="button" title="Duplicate" className="p-2 text-gray-400 hover:text-gray-900 border border-transparent hover:border-gray-200 rounded-lg transition-all">
                              <Copy size={16}/>
                            </button>
                            <form action={async (fd) => { await togglePlanStatus(fd); }}>
                              <input type="hidden" name="id" value={plan.id} />
                              <input type="hidden" name="currentStatus" value={plan.status} />
                              <button type="submit" title={plan.status === 'ACTIVE' ? "Archive / Disable" : "Enable"} className={`p-2 border border-transparent rounded-lg transition-all ${plan.status === 'ACTIVE' ? 'text-gray-400 hover:text-orange-600 hover:border-orange-100' : 'text-orange-400 hover:text-emerald-600 hover:border-emerald-100'}`}>
                                {plan.status === 'ACTIVE' ? <Archive size={16}/> : <RefreshCw size={16}/>}
                              </button>
                            </form>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </>
                )}

                {/* INVITES TAB */}
                {activeTab === 'invites' && (
                  <>
                    <thead className="bg-gray-50 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                      <tr>
                        <th className="p-4 pl-6">Invite Link</th>
                        <th className="p-4">Reserved Shop</th>
                        <th className="p-4 text-center">Status</th>
                        <th className="p-4 pr-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-sm">
                      {invites.map((invite: any) => (
                        <tr key={invite.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="p-4 pl-6">
                            <button 
                              onClick={() => copyInviteLink(invite.token)} 
                              className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100 hover:border-orange-300 transition-all group"
                              title="Copy full URL"
                            >
                              <LinkIcon size={14} className="text-gray-400"/>
                              <code className="text-xs font-bold text-gray-600">/auth/register?token={invite.token.slice(0, 8)}...</code>
                              <Copy size={12} className="text-gray-300 group-hover:text-orange-500"/>
                            </button>
                          </td>
                          <td className="p-4 font-bold text-gray-700">{invite.shopName || 'Any'}</td>
                          <td className="p-4 text-center">
                            <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase ${invite.isUsed ? 'bg-gray-100 text-gray-500' : 'bg-blue-50 text-blue-600'}`}>
                              {invite.isUsed ? 'Used' : 'Active'}
                            </span>
                          </td>
                          <td className="p-4 pr-6 text-right">
                            <form 
                              action={async (fd) => { if(confirm('Delete invite?')) await deleteInvite(fd); }}
                            >
                              <input type="hidden" name="id" value={invite.id} />
                              <button type="submit" className="p-2 text-gray-400 hover:text-red-600 border border-transparent hover:border-red-100 rounded-lg">
                                <Trash2 size={16}/>
                              </button>
                            </form>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </>
                )}

                {/* USERS TAB */}
                {activeTab === 'users' && (
                  <>
                    <thead className="bg-gray-50 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                      <tr>
                        <th className="p-4 pl-6">Email Address</th>
                        <th className="p-4">User ID</th>
                        <th className="p-4 pr-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-sm">
                      {users.map((user: any) => (
                        <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="p-4 pl-6 font-bold text-gray-900">{user.email}</td>
                          <td className="p-4 text-xs font-mono text-gray-400">{user.id}</td>
                          <td className="p-4 pr-6 text-right flex items-center justify-end gap-2">
                            <form action={async (fd) => {
                              if (confirm(`Generate reset token for ${user.email}?`)) {
                                const res = await requestPasswordReset(fd);
                                if (res.success && res.debugLink) {
                                  const origin = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
                                  const fullLink = res.debugLink.startsWith('http') ? res.debugLink : `${origin}${res.debugLink}`;
                                  navigator.clipboard.writeText(fullLink);
                                  alert(`Link copied to clipboard!\n\n${fullLink}`);
                                }
                              }
                            }}>
                              <input type="hidden" name="email" value={user.email} />
                              <button type="submit" className="p-2 text-gray-400 hover:text-blue-600 border border-transparent hover:border-blue-100 rounded-lg">
                                <KeyRound size={16}/>
                              </button>
                            </form>
                            <form action={async (fd) => { if(confirm('Delete user?')) await deleteUser(fd); }}>
                              <input type="hidden" name="id" value={user.id} />
                              <button type="submit" className="p-2 text-gray-400 hover:text-red-600 border border-transparent hover:border-red-100 rounded-lg">
                                <Trash2 size={16}/>
                              </button>
                            </form>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </>
                )}
              </table>
            </div>
          )}
        </div>
      </main>

      {/* INVITE MODAL */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
           <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="flex justify-between items-center mb-6">
                <h2 className="font-bold text-gray-900 text-lg">Add New Invite</h2>
                <button onClick={() => setIsInviteModalOpen(false)} className="text-gray-400 hover:text-gray-900"><XCircle/></button>
              </div>
              <form action={async (fd) => { await createInvite(fd); setIsInviteModalOpen(false); }} className="space-y-4">
                 <div>
                   <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Shop Name</label>
                   <input name="shopName" placeholder="e.g. Burger Palace" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:bg-white focus:ring-2 focus:ring-gray-900 transition-all" />
                 </div>
                 <div>
                   <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Owner Email</label>
                   <input name="email" type="email" placeholder="owner@email.com" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:bg-white focus:ring-2 focus:ring-gray-900 transition-all" />
                 </div>
                 <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Expires In (Days)</label>
                    <input name="expiresInDays" type="number" defaultValue={7} min={1} max={30} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:bg-white focus:ring-2 focus:ring-gray-900 transition-all" />
                 </div>
                 <button type="submit" className="w-full bg-gray-900 text-white font-bold py-3.5 rounded-xl hover:bg-black transition-all shadow-lg active:scale-[0.98]">
                    Create Link
                 </button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
}