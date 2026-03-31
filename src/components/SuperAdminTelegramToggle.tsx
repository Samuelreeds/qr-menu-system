"use client";

import React, { useTransition } from "react";
import { toggleShopTelegramNotifications } from "@/lib/superadmin-actions";

interface SuperAdminTelegramToggleProps {
  shopId: string;
  initialStatus: boolean;
  shopName: string;
}

export default function SuperAdminTelegramToggle({ shopId, initialStatus, shopName }: SuperAdminTelegramToggleProps) {
  const [isPending, startTransition] = useTransition();

  const handleToggle = () => {
    startTransition(async () => {
      const res = await toggleShopTelegramNotifications(shopId, !initialStatus);
      if (!res.success) {
        alert(res.message);
      }
    });
  };

  return (
    <div className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl shadow-sm max-w-sm">
      <div>
        <p className="text-sm font-bold text-gray-900">Telegram Notifications</p>
        <p className="text-[11px] text-gray-500 mt-0.5">Controls Staff Call & New Orders</p>
      </div>
      <button 
        onClick={handleToggle} 
        disabled={isPending}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${initialStatus ? 'bg-emerald-500' : 'bg-gray-300'} ${isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${initialStatus ? 'translate-x-5' : 'translate-x-0'}`} />
      </button>
    </div>
  );
}