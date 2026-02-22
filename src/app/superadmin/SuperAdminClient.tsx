'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  LayoutDashboard, Plus, ExternalLink, PowerOff, Power, Check, 
  XCircle, Link as LinkIcon, Info, Mail, Settings, Users, 
  MoreHorizontal, Clock, Menu, Trash2, KeyRound, Copy, Bell
} from 'lucide-react';
import { 
  toggleShopStatus, 
  updateShopPlan, 
  createInvite, 
  deleteShop, 
  deleteUser, 
  requestPasswordReset, 
  deleteInvite 
} from '@/lib/actions';

export default function SuperAdminClient({ shops, invites, users }: { shops: any[], invites: any[], users: any[] }) {
  const [activeTab, setActiveTab] = useState<'shops' | 'invites' | 'users'>('shops');
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Calculate Stats
  const activeShops = shops.filter(s => s.status === 'ACTIVE').length;
  const paidShops = shops.filter(s => s.plan !== 'FREE').length;
  const activeInvites = invites.filter(i => !i.isUsed && new Date(i.expiresAt) > new Date()).length;

  const copyInviteLink = (token: string) => {
    // Browser-readable absolute URL for registration
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
    const fullLink = baseUrl.startsWith('http') ? `${baseUrl}/register?token=${token}` : `https://${baseUrl}/register?token=${token}`;
    
    navigator.clipboard.writeText(fullLink);
    alert(`Invite link copied to clipboard!\n\n${fullLink}`);
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
            onClick={() => setActiveTab('shops')} 
            className={`w-full flex p-3 rounded-lg text-sm transition-all ${activeTab === 'shops' ? 'bg-orange-50 text-gray-900 font-bold' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            <LayoutDashboard size={18} className="mr-3" /> Shops
          </button>
          <button 
            onClick={() => setActiveTab('invites')} 
            className={`w-full flex p-3 rounded-lg text-sm transition-all ${activeTab === 'invites' ? 'bg-orange-50 text-gray-900 font-bold' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            <Mail size={18} className="mr-3" /> Invites
          </button>
          <button 
            onClick={() => setActiveTab('users')} 
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
            <h1 className="text-xl font-bold capitalize">Manage {activeTab}</h1>
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
            <button className="p-2 bg-white border rounded-full text-gray-400 hover:text-gray-900 transition-colors"><Bell size={18}/></button>
          </div>
        </header>

        <div className="p-6 overflow-y-auto">
          {/* STATS CARDS */}
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

          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-left whitespace-nowrap">
              {/* SHOPS TAB */}
              {activeTab === 'shops' && (
                <>
                  <thead className="bg-gray-50 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                    <tr>
                      <th className="p-4 pl-6">Shop Name</th>
                      <th className="p-4">URL Slug</th>
                      <th className="p-4">Plan</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 pr-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm">
                    {shops.map((shop: any) => (
                      <tr key={shop.id} className="hover:bg-gray-50/50 transition-colors group">
                        <td className="p-4 pl-6 font-bold text-gray-900">{shop.name}</td>
                        <td className="p-4">
                          <Link href={`/${shop.slug}`} target="_blank" className="text-blue-500 hover:underline flex items-center gap-1.5">
                            /{shop.slug} <ExternalLink size={14} />
                          </Link>
                        </td>
                        <td className="p-4">
                          <form action={updateShopPlan}>
                            <input type="hidden" name="id" value={shop.id} />
                            <select 
                              name="plan" 
                              defaultValue={shop.plan} 
                              onChange={(e) => e.target.form?.requestSubmit()}
                              className="bg-white border border-gray-200 text-xs font-bold rounded-lg px-2 py-1 outline-none"
                            >
                              <option value="FREE">Free</option>
                              <option value="PRO">Pro</option>
                              <option value="PREMIUM">Premium</option>
                            </select>
                          </form>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${shop.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                            {shop.status}
                          </span>
                        </td>
                        <td className="p-4 pr-6 text-right flex items-center justify-end gap-2">
                          <form action={toggleShopStatus}>
                            <input type="hidden" name="id" value={shop.id} />
                            <input type="hidden" name="currentStatus" value={shop.status === 'ACTIVE' ? 'true' : 'false'} />
                            <button type="submit" className="p-2 text-gray-400 hover:text-gray-900 border border-transparent hover:border-gray-200 rounded-lg">
                              {shop.status === 'ACTIVE' ? <PowerOff size={16} /> : <Power size={16} />}
                            </button>
                          </form>
                          <form action={deleteShop} onSubmit={(e) => {if(!confirm('Delete this shop?')) e.preventDefault()}}>
                            <input type="hidden" name="id" value={shop.id} />
                            <button type="submit" className="p-2 text-gray-400 hover:text-red-600 border border-transparent hover:border-red-100 rounded-lg">
                              <Trash2 size={16} />
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
                            <code className="text-xs font-bold text-gray-600">/register?token={invite.token.slice(0, 8)}...</code>
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
                          {/* Form action fix for TS(2322) */}
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
                          <form action={deleteUser} onSubmit={(e) => {if(!confirm('Delete user?')) e.preventDefault()}}>
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
                 {/* Phase 2: Expires in days field */}
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