"use client";

import React, { useState } from "react";
import { requestStaffAssistance } from "@/lib/staff-actions";

type ViewState = "OPTIONS" | "CONFIRM_CALL" | "LOADING" | "SUCCESS";

interface TableContext {
  isValid: boolean;
  tableId: string | null;
  tableLabel: string | null;
}

interface CustomerEntryGateProps {
  shopId: string;
  shopSlug: string;
  shopName: string;
  tableContext: TableContext;
  isStaffCallActive?: boolean; 
}

export default function CustomerEntryGate({
  shopId,
  shopSlug,
  shopName,
  tableContext,
  isStaffCallActive = false,
}: CustomerEntryGateProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [view, setView] = useState<ViewState>("OPTIONS");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSeeMenu = () => setIsOpen(false);
  const handleCallStaff = () => { setErrorMsg(null); setView("CONFIRM_CALL"); };
  const handleBackToOptions = () => { setErrorMsg(null); setView("OPTIONS"); };

  const handleNotifyStaff = async () => {
    if (!tableContext.tableId) return;
    
    setView("LOADING");
    setErrorMsg(null);

    const res = await requestStaffAssistance(
      shopId,
      shopSlug,
      shopName,
      tableContext.tableId
    );

    if (res.success) {
      setView("SUCCESS");
    } else {
      setErrorMsg(res.message || "Something went wrong.");
      setView("CONFIRM_CALL");
    }
  };

  const getInitials = (name: string) => name.charAt(0).toUpperCase();

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-md p-4 sm:p-6">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-sm overflow-hidden flex flex-col transform transition-all">
        
        <div className="pt-8 pb-4 px-6 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-gray-900 text-white rounded-full flex items-center justify-center text-2xl font-bold mb-4 shadow-sm">
            {getInitials(shopName)}
          </div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">{shopName}</h2>
          <p className="text-gray-500 text-sm mt-1.5 font-medium">
            Welcome! How can we help you today?
          </p>

          {tableContext.isValid && view === "OPTIONS" && (
            <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 text-xs font-semibold rounded-full border border-green-100">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
              </svg>
              Table {tableContext.tableLabel} detected
            </div>
          )}
        </div>

        <div className="px-6 pb-8 pt-2">
          
          {view === "OPTIONS" && (
            <div className="flex flex-col gap-3">
              <button
                onClick={handleSeeMenu}
                className="group relative flex items-center justify-between p-4 rounded-2xl bg-black text-left transition-transform active:scale-[0.98] shadow-md"
              >
                <div>
                  <span className="block font-bold text-white text-lg">See Menu</span>
                  <span className="block text-gray-400 text-sm mt-0.5">Browse items and place your order</span>
                </div>
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>

              {isStaffCallActive && (
                <>
                  <button
                    onClick={handleCallStaff}
                    disabled={!tableContext.isValid}
                    className={`group relative flex items-center justify-between p-4 rounded-2xl border-2 text-left transition-all active:scale-[0.98] ${
                      tableContext.isValid 
                        ? 'border-gray-200 bg-white hover:border-gray-900 hover:bg-gray-50 cursor-pointer' 
                        : 'border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed'
                    }`}
                  >
                    <div>
                      <span className={`block font-bold text-lg ${tableContext.isValid ? 'text-gray-900' : 'text-gray-500'}`}>
                        Call Staff
                      </span>
                      <span className="block text-gray-500 text-sm mt-0.5">Request assistance at your table</span>
                    </div>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${tableContext.isValid ? 'bg-gray-100 text-gray-900' : 'bg-gray-200 text-gray-400'}`}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                      </svg>
                    </div>
                  </button>

                  {!tableContext.isValid && (
                    <div className="mt-2 p-3.5 rounded-2xl bg-amber-50 border border-amber-100 flex gap-3 text-left">
                      <svg className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-sm text-amber-800 leading-snug">
                        <span className="font-semibold block mb-0.5">Table not detected</span>
                        Please scan the QR code at your table to request staff assistance.
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {view === "CONFIRM_CALL" && (
            <div className="flex flex-col gap-3">
              <div className="text-center mb-4 px-2">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
                <p className="text-gray-900 font-bold text-lg">Request Assistance?</p>
                <p className="text-sm text-gray-500 mt-2">
                  Our staff will be notified to come directly to <span className="font-semibold text-gray-900">Table {tableContext.tableLabel}</span>.
                </p>
              </div>

              {errorMsg && (
                <div className="p-3 mb-2 rounded-xl bg-red-50 border border-red-100 text-sm text-red-600 text-center font-medium animate-in fade-in">
                  {errorMsg}
                </div>
              )}

              <button
                onClick={handleNotifyStaff}
                className="w-full py-3.5 px-4 bg-black text-white rounded-xl font-bold hover:bg-gray-800 transition-transform active:scale-[0.98]"
              >
                Yes, Notify Staff
              </button>
              <button
                onClick={handleBackToOptions}
                className="w-full py-3.5 px-4 bg-gray-50 text-gray-600 rounded-xl font-bold hover:bg-gray-100 transition-transform active:scale-[0.98]"
              >
                Cancel
              </button>
            </div>
          )}

          {view === "LOADING" && (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="w-10 h-10 border-4 border-gray-100 border-t-black rounded-full animate-spin mb-5"></div>
              <p className="text-gray-900 font-semibold">Notifying staff...</p>
              <p className="text-sm text-gray-500 mt-1">Please hold on a second.</p>
            </div>
          )}

          {view === "SUCCESS" && (
            <div className="flex flex-col gap-4 text-center py-2 animate-in zoom-in-95 duration-300">
              <div className="w-16 h-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-2">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="text-gray-900 font-bold text-xl">Staff Notified!</p>
                <p className="text-sm text-gray-500 mt-2 px-4">
                  Someone will be with you at Table {tableContext.tableLabel} shortly.
                </p>
              </div>
              
              <button
                onClick={handleSeeMenu}
                className="w-full mt-4 py-3.5 px-4 bg-black text-white rounded-xl font-bold hover:bg-gray-800 transition-transform active:scale-[0.98]"
              >
                Continue to Menu
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}