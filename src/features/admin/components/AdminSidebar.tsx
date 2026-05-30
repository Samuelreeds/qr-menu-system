'use client';

import React from 'react';
import { ChevronLeft, ChevronRight, DollarSign, LogOut, Menu } from 'lucide-react';
import { signOut } from 'next-auth/react';
import NavItem from './NavItem';
import type { LucideIcon } from 'lucide-react';

type TabId =
  | 'overview'
  | 'menu'
  | 'categories'
  | 'toppings'
  | 'inventory'
  | 'tables'
  | 'orders'
  | 'settings'
  | 'pos'
  | 'team';

type SidebarNavItem = {
  id: TabId;
  label: string;
  icon: LucideIcon;
};

type AdminSidebarProps = {
  shopName: string;
  shopPlan?: string;
  isFreePlan: boolean;
  isAdmin: boolean;
  activeTab: TabId;
  isMobileMenuOpen: boolean;
  isSidebarCollapsed: boolean;
  shift?: unknown;
  onTabClick: (tab: TabId) => void;
  onCloseShift: () => void;
  onToggleMobileMenu: () => void;
  onToggleSidebarCollapse: () => void;
  mobileMenuBtnRef: React.RefObject<HTMLButtonElement | null>;
  sidebarRef: React.RefObject<HTMLElement | null>;
  navItems: SidebarNavItem[];
};

export default function AdminSidebar({
  shopName,
  shopPlan,
  isFreePlan,
  isAdmin,
  activeTab,
  isMobileMenuOpen,
  isSidebarCollapsed,
  shift,
  onTabClick,
  onCloseShift,
  onToggleMobileMenu,
  onToggleSidebarCollapse,
  mobileMenuBtnRef,
  sidebarRef,
  navItems,
}: AdminSidebarProps) {
  const showText = !isSidebarCollapsed || isMobileMenuOpen;

  return (
    <>
      <div className="lg:hidden fixed top-0 left-0 w-full bg-white z-20 px-4 py-3 flex items-center justify-between gap-4 border-b border-gray-100 shadow-sm print:hidden">
        <div className="flex items-center gap-3 min-w-0 overflow-hidden">
          <button
            ref={mobileMenuBtnRef}
            onClick={onToggleMobileMenu}
            className="p-2 bg-gray-50 rounded-xl active:scale-95 transition-transform shrink-0"
            type="button"
          >
            <Menu size={22} className="text-gray-700" />
          </button>
          <h1 className="font-bold text-lg tracking-tight text-gray-900 truncate font-sans">
            {shopName || 'AdminPanel'}
          </h1>
        </div>

        <button
          onClick={() => onTabClick('settings')}
          className="p-2 bg-gray-50 rounded-xl text-gray-700 active:scale-95 transition-transform shrink-0"
          type="button"
        >
          <Menu size={20} />
        </button>
      </div>

      <aside
        ref={sidebarRef}
        className={`fixed inset-y-0 left-0 z-40 bg-white border-r border-gray-100 transition-all duration-300 lg:static flex-shrink-0 flex flex-col ${
          isMobileMenuOpen
            ? 'translate-x-0 w-64'
            : `-translate-x-full lg:translate-x-0 ${isSidebarCollapsed ? 'w-20' : 'w-64'}`
        } print:hidden`}
      >
        <button
          onClick={onToggleSidebarCollapse}
          className="hidden lg:flex absolute -right-4 top-8 w-8 h-8 bg-gray-900 text-white border-2 border-white rounded-full items-center justify-center shadow-md hover:bg-gray-800 hover:scale-110 z-50 transition-all active:scale-95 cursor-pointer ring-4 ring-white"
          type="button"
        >
          {isSidebarCollapsed ? (
            <ChevronRight size={16} strokeWidth={2.5} />
          ) : (
            <ChevronLeft size={16} strokeWidth={2.5} />
          )}
        </button>

        <div
          className={`pb-6 pt-20 lg:pt-8 h-full flex flex-col overflow-hidden transition-all duration-300 ${
            isSidebarCollapsed && !isMobileMenuOpen ? 'px-3' : 'px-6'
          }`}
        >
          <div
            className={`mb-6 hidden lg:flex items-center ${
              isSidebarCollapsed && !isMobileMenuOpen ? 'justify-center' : 'justify-start'
            }`}
          >
            {!isSidebarCollapsed || isMobileMenuOpen ? (
              <div className="flex flex-col min-w-0 animate-in fade-in duration-300">
                <h1 className="font-bold text-xl font-sans line-clamp-1 text-gray-900">
                  {shopName || 'AdminPanel'}
                </h1>
                <span
                  className={`inline-block mt-2 px-2.5 py-1 rounded-md text-[10px] uppercase font-bold tracking-wider w-max ${
                    shopPlan === 'STARTER' || isFreePlan
                      ? 'bg-orange-50 text-orange-600'
                      : 'bg-orange-50 text-orange-600'
                  }`}
                >
                  {shopPlan} PLAN
                </span>
              </div>
            ) : (
              <div className="w-10 h-10 bg-gray-900 text-white rounded-xl flex items-center justify-center font-black text-lg shadow-md shrink-0 animate-in fade-in duration-300">
                {(shopName || 'A').charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <div className="mb-6 lg:hidden flex flex-col min-w-0">
            <h1 className="font-bold text-xl font-sans line-clamp-1 text-gray-900">
              {shopName || 'AdminPanel'}
            </h1>
            <span
              className={`inline-block mt-2 px-2.5 py-1 rounded-md text-[10px] uppercase font-bold tracking-wider w-max ${
                shopPlan === 'STARTER' || isFreePlan
                  ? 'bg-orange-50 text-orange-600'
                  : 'bg-orange-50 text-orange-600'
              }`}
            >
              {shopPlan} PLAN
            </span>
          </div>

          <nav
            className="space-y-2 flex-1 min-h-0 overflow-y-auto no-scrollbar [-webkit-overflow-scrolling:touch]"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {navItems.map((item) => (
              <NavItem
                key={item.id}
                id={item.id}
                label={item.label}
                icon={item.icon}
                active={activeTab === item.id}
                compact={!showText}
                onClick={(id) => onTabClick(id as any)}
              />
            ))}
          </nav>

          <div className="pt-6 border-t border-gray-100 mt-auto shrink-0 flex flex-col gap-2">
            {!isAdmin && shift ? (
              <div className="relative group/nav mb-2">
                <button
                  onClick={onCloseShift}
                  className={`w-full flex items-center py-3 rounded-xl transition-all min-w-0 ${
                    !showText ? 'justify-center px-0' : 'justify-start px-4 gap-3'
                  } text-red-600 font-bold bg-red-50 hover:bg-red-100 active:scale-[0.98] border border-red-100 shadow-sm`}
                  type="button"
                >
                  <DollarSign size={20} className="shrink-0" />
                  {showText && <span className="font-semibold truncate text-sm">Close Shift</span>}
                </button>

                {!showText && (
                  <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-1.5 bg-red-600 text-white text-xs font-bold rounded-lg opacity-0 pointer-events-none group-hover/nav:opacity-100 transition-all z-50 whitespace-nowrap shadow-xl flex items-center">
                    Close Shift
                    <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-red-600 rotate-45" />
                  </div>
                )}
              </div>
            ) : null}

            <div className="relative group/nav">
              <button
                onClick={() => signOut({ callbackUrl: '/auth/login' })}
                className={`w-full flex items-center py-3 rounded-xl transition-all min-w-0 ${
                  !showText ? 'justify-center px-0' : 'justify-start px-4 gap-3'
                } text-gray-400 hover:text-red-600 hover:bg-red-50 active:scale-[0.98]`}
                type="button"
              >
                <LogOut size={20} className="shrink-0" />
                {showText && <span className="font-semibold truncate text-sm">Log Out</span>}
              </button>

              {!showText && (
                <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-1.5 bg-red-600 text-white text-xs font-bold rounded-lg opacity-0 pointer-events-none group-hover/nav:opacity-100 transition-all z-50 whitespace-nowrap shadow-xl flex items-center">
                  Log Out
                  <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-red-600 rotate-45" />
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}