'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  LayoutDashboard, Search, Bell, Plus, ExternalLink, 
  PowerOff, Power, Check, XCircle, Link as LinkIcon, Info, Mail,
  Settings, Users, ChevronDown, Filter, MoreHorizontal, Clock, Menu
} from 'lucide-react';
import { toggleShopStatus, updateShopPlan, createInvite } from '@/lib/actions';

type Shop = any; 
type Invite = any; 

export default function SuperAdminClient({ shops, invites }: { shops: Shop[], invites: Invite[] }) {
  const [activeTab, setActiveTab] = useState<'shops' | 'invites'>('shops');
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Calculate Stats
  const activeShops = shops.filter(s => s.status === 'ACTIVE').length;
  const paidShops = shops.filter(s => s.plan !== 'FREE').length;
  const activeInvites = invites.filter(i => !i.isUsed && new Date(i.expiresAt) > new Date()).length;

  const handleTabChange = (tab: 'shops' | 'invites') => {
    setActiveTab(tab);
    setIsSidebarOpen(false); 
  };

  return (
    <div className="flex h-screen bg-[#F9FAFB] font-sans text-gray-900 overflow-hidden relative">
      
      {/* --- MOBILE SIDEBAR BACKDROP --- */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-30 md:hidden" 
          onClick={() => setIsSidebarOpen(false)} 
        />
      )}

      {/* --- SIDEBAR --- */}
      <aside className={`w-[260px] flex-shrink-0 border-r border-gray-200 bg-white flex flex-col z-40 fixed md:static h-full transform transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="flex items-center justify-between mb-8 px-4 sm:px-8 lg:px-12 pt-6">
          <div>
            <h2 className="font-bold text-base leading-tight text-gray-900 pr-4 lg:pr-6">Scandine Admin</h2>
            <p className="text-[11px] text-gray-500 font-medium">System Dashboard</p>
          </div>
          <button className="md:hidden text-gray-400 hover:text-gray-900 transition-colors p-1" onClick={() => setIsSidebarOpen(false)}>
            <XCircle size={20} />
          </button>
        </div>

        <div className="p-4 flex-1 overflow-y-auto">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 mt-4 pl-4 pr-6">Main Menu</p>
          <nav className="space-y-1">
            <button 
              type="button"
              onClick={() => handleTabChange('shops')} 
              className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm transition-all ${activeTab === 'shops' ? 'bg-orange-50/50 text-gray-900 font-bold border-l-4 border-orange-500' : 'text-gray-500 font-medium hover:bg-gray-50 border-l-4 border-transparent'}`}
            >
              <div className="flex items-center gap-3"><LayoutDashboard size={18} className={activeTab === 'shops' ? 'text-orange-600' : 'text-gray-400'} /> Shops</div>
              <span className="text-[10px] font-bold bg-gray-200 text-gray-600 px-2.5 py-0.5 rounded-md">{shops.length}</span>
            </button>
            <button 
              type="button"
              onClick={() => handleTabChange('invites')} 
              className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm transition-all ${activeTab === 'invites' ? 'bg-orange-50/50 text-gray-900 font-bold border-l-4 border-orange-500' : 'text-gray-500 font-medium hover:bg-gray-50 border-l-4 border-transparent'}`}
            >
              <div className="flex items-center gap-3"><Mail size={18} className={activeTab === 'invites' ? 'text-orange-600' : 'text-gray-400'} /> Invites</div>
              <span className="text-[10px] font-bold bg-gray-200 text-gray-600 px-2.5 py-0.5 rounded-md">{invites.length}</span>
            </button>
          </nav>

          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 mt-8 pl-4 pr-6">Tools</p>
          <nav className="space-y-1">
            <button type="button" className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-50 border-l-4 border-transparent">
              <Users size={18} className="text-gray-400" /> Users
            </button>
            <button type="button" className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-50 border-l-4 border-transparent">
              <Settings size={18} className="text-gray-400" /> System Settings
            </button>
          </nav>
        </div>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-[#F9FAFB] w-full">
        
        {/* TOP NAVBAR */}
        <header className="flex items-center justify-between mb-6 px-4 sm:px-8 lg:px-12 pt-6">
          <div className="flex items-center gap-4">
            <button 
              type="button" 
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Menu size={22} />
            </button>
            <h1 className="text-2xl font-bold text-gray-900 capitalize">{activeTab === 'shops' ? 'Registered Shops' : 'Manage Invites'}</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <button type="button" className="p-2.5 bg-white border border-gray-200 rounded-full text-gray-500 hover:text-gray-900 hover:bg-gray-50 shadow-sm transition-colors">
              <Bell size={18} />
            </button>
          </div>
        </header>

        {/* SCROLLABLE BODY */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-8 lg:px-12 pb-12">

          {/* STATS CARDS (Separated & Smaller) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <p className="text-gray-500 text-xs font-bold mb-1.5 flex items-center gap-1.5">Total {activeTab === 'shops' ? 'Shops' : 'Invites'} <Info size={12} className="text-gray-300"/></p>
              <h3 className="text-2xl font-black mb-1 text-gray-900">{activeTab === 'shops' ? shops.length : invites.length}</h3>
              <p className="text-[11px] font-bold text-gray-400">vs last month <span className="text-emerald-500 ml-1">+12%</span></p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <p className="text-gray-500 text-xs font-bold mb-1.5 flex items-center gap-1.5">{activeTab === 'shops' ? 'Paid Subscriptions' : 'Used Invites'} <Info size={12} className="text-gray-300"/></p>
              <h3 className="text-2xl font-black mb-1 text-gray-900">{activeTab === 'shops' ? paidShops : invites.filter((i:any) => i.isUsed).length}</h3>
              <p className="text-[11px] font-bold text-gray-400">vs last month <span className="text-emerald-500 ml-1">+4%</span></p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <p className="text-gray-500 text-xs font-bold mb-1.5 flex items-center gap-1.5">{activeTab === 'shops' ? 'Active Shops' : 'Pending Invites'} <Info size={12} className="text-gray-300"/></p>
              <h3 className="text-2xl font-black mb-1 text-gray-900">{activeTab === 'shops' ? activeShops : activeInvites}</h3>
              <p className="text-[11px] font-bold text-gray-400">vs last month <span className="text-emerald-500 ml-1">+2%</span></p>
            </div>
          </div>

          {/* TABLE ACTIONS & INLINE NEW INVITE BUTTON */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
              <button type="button" className="flex-1 sm:flex-none flex justify-center items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm font-bold text-gray-700 shadow-sm hover:bg-gray-50 transition-colors">
                Table View <ChevronDown size={14} />
              </button>
              <button type="button" className="flex-1 sm:flex-none flex justify-center items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm font-bold text-gray-700 shadow-sm hover:bg-gray-50 transition-colors">
                <Filter size={14} /> Filter
              </button>
            </div>
            
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button type="button" className="w-full sm:w-auto flex justify-center items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm font-bold text-gray-700 shadow-sm hover:bg-gray-50 transition-colors">
                Export
              </button>
              {activeTab === 'invites' && (
                <button 
                  type="button" 
                  onClick={() => setIsInviteModalOpen(true)} 
                  className="w-full sm:w-auto flex justify-center items-center gap-1.5 px-3 py-1.5 bg-[#18181B] text-white rounded-lg text-sm font-bold shadow-md hover:bg-black transition shrink-0"
                >
                  <Plus size={14} /> Add New Invite
                </button>
              )}
            </div>
          </div>

          {/* TABLE SECTION */}
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm w-full overflow-hidden">
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left text-sm whitespace-nowrap min-w-[700px]">
                
                {activeTab === 'shops' && (
                  <>
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50/50 text-[11px] font-extrabold text-gray-400 uppercase tracking-wider">
                        <th className="p-4 sm:p-5 pl-4 sm:pl-6">Shop Name</th>
                        <th className="p-4 sm:p-5">URL Slug</th>
                        <th className="p-4 sm:p-5">Subscription Plan</th>
                        <th className="p-4 sm:p-5">Status</th>
                        <th className="p-4 sm:p-5 pr-4 sm:pr-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 text-gray-800">
                      {shops.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-gray-400 font-medium">No shops found.</td></tr>}
                      {shops.map((shop: any) => (
                        <tr key={shop.id} className="hover:bg-gray-50/50 transition-colors group">
                          
                          <td className="p-4 sm:p-5 pl-4 sm:pl-6 font-bold text-gray-900">
                            <Link href={`/superadmin/shop/${shop.id}`} className="hover:text-blue-600 transition-colors no-underline">
                              {shop.name}
                            </Link>
                          </td>
                          
                          <td className="p-4 sm:p-5">
                            <Link href={`/${shop.slug}`} target="_blank" className="text-sm font-medium text-blue-500 hover:text-blue-700 flex items-center gap-1.5 no-underline">
                              /{shop.slug} <ExternalLink size={14} />
                            </Link>
                          </td>
                          <td className="p-4 sm:p-5">
                            <form action={updateShopPlan}>
                              <input type="hidden" name="id" value={shop.id} />
                              <div className="relative inline-block w-full max-w-[120px]">
                                <select name="plan" defaultValue={shop.plan} onChange={(e) => e.target.form?.requestSubmit()} className="appearance-none bg-white border border-gray-200 text-xs font-bold text-gray-700 rounded-lg px-3 py-2 w-full outline-none cursor-pointer focus:border-gray-900 shadow-sm transition-all hover:bg-gray-50">
                                  <option value="FREE">Free</option>
                                  <option value="PRO">Pro</option>
                                  <option value="PREMIUM">Premium</option>
                                </select>
                              </div>
                            </form>
                          </td>
                          <td className="p-4 sm:p-5">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase ${shop.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${shop.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                              {shop.status}
                            </span>
                          </td>
                          <td className="p-4 sm:p-5 pr-4 sm:pr-6 text-right flex items-center justify-end gap-2">
                            <Link href={`/superadmin/shop/${shop.id}`} className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors inline-block">
                              <MoreHorizontal size={18} />
                            </Link>
                            
                            <form action={toggleShopStatus}>
                              <input type="hidden" name="id" value={shop.id} />
                              <input type="hidden" name="currentStatus" value={shop.status === 'ACTIVE' ? 'true' : 'false'} />
                              <button className={`p-2 rounded-lg transition-all shadow-sm active:scale-95 ${shop.status === 'ACTIVE' ? 'bg-white border border-gray-200 text-gray-400 hover:text-red-600 hover:bg-red-50' : 'bg-red-500 text-white hover:bg-red-600'}`}>
                                {shop.status === 'ACTIVE' ? <PowerOff size={16} /> : <Power size={16} />}
                              </button>
                            </form>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </>
                )}

                {activeTab === 'invites' && (
                  <>
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50/50 text-[11px] font-extrabold text-gray-400 uppercase tracking-wider">
                        <th className="p-4 sm:p-5 pl-4 sm:pl-6">Invite Token</th>
                        <th className="p-4 sm:p-5">Reserved Shop</th>
                        <th className="p-4 sm:p-5">Expiration</th>
                        <th className="p-4 sm:p-5 pr-4 sm:pr-6">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 text-gray-800">
                      {invites.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-gray-400 font-medium">No invites found.</td></tr>}
                      {invites.map((invite: any) => {
                        const isExpired = new Date() > new Date(invite.expiresAt);
                        return (
                          <tr key={invite.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="p-4 sm:p-5 pl-4 sm:pl-6">
                              <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100 w-fit">
                                <LinkIcon size={14} className="text-gray-400" />
                                <code className="text-xs font-bold text-gray-600">/invite/{invite.token.slice(0, 10)}...</code>
                              </div>
                            </td>
                            <td className="p-4 sm:p-5 text-sm font-bold text-gray-700">
                              {invite.shopName || <span className="text-gray-400 font-medium italic">Any Shop</span>}
                            </td>
                            <td className="p-4 sm:p-5 text-sm text-gray-500 font-medium">
                              {new Date(invite.expiresAt).toLocaleDateString()}
                            </td>
                            <td className="p-4 sm:p-5 pr-4 sm:pr-6">
                              {invite.isUsed ? (
                                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-600 bg-gray-100 px-2.5 py-1 rounded-md"><Check size={12} strokeWidth={3}/> Used</span>
                              ) : isExpired ? (
                                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-red-600 bg-red-50 px-2.5 py-1 rounded-md"><XCircle size={12} strokeWidth={3}/> Expired</span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md"><Clock size={12} strokeWidth={3}/> Active</span>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </>
                )}
              </table>
            </div>
            
            <div className="p-4 sm:p-5 border-t border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500 font-medium">
               <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
                 <span>Showing per page</span>
                 <select className="border border-gray-200 rounded-md px-2 py-1 outline-none bg-white font-bold text-gray-900"><option>10</option></select>
               </div>
               <div className="flex items-center gap-1">
                 <button type="button" className="px-3 py-1 bg-gray-900 text-white rounded-md font-bold shadow-sm">1</button>
                 <button type="button" className="px-3 py-1 hover:bg-gray-200 rounded-md font-bold transition-colors">2</button>
                 <button type="button" className="px-3 py-1 hover:bg-gray-200 rounded-md font-bold transition-colors">3</button>
               </div>
            </div>
          </div>
        </div>
      </main>

      {/* --- GENERATE INVITE MODAL --- */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-gray-900/40 backdrop-blur-sm sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in slide-in-from-bottom-10 sm:zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-900">Add New Invite</h2>
              <button type="button" onClick={() => setIsInviteModalOpen(false)} className="text-gray-400 hover:text-gray-900 hover:bg-gray-100 p-2 rounded-full transition-colors">
                <XCircle size={22} />
              </button>
            </div>
            <form action={async (fd) => { await createInvite(fd); setIsInviteModalOpen(false); }} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 mb-1.5 block">Pre-fill Shop Name</label>
                <input name="shopName" placeholder="e.g. Burger Palace" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:bg-white focus:ring-2 focus:ring-gray-900 transition-all" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 mb-1.5 block">Owner Email</label>
                <input name="email" type="email" placeholder="owner@restaurant.com" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:bg-white focus:ring-2 focus:ring-gray-900 transition-all" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 mb-1.5 block">Valid For (Days)</label>
                <input name="expiresInDays" type="number" defaultValue={7} min={1} max={30} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:bg-white focus:ring-2 focus:ring-gray-900 transition-all" />
              </div>
              <button type="submit" className="w-full bg-gray-900 text-white font-bold py-3.5 rounded-xl hover:bg-black transition-colors shadow-md mt-4">
                Create Link
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}