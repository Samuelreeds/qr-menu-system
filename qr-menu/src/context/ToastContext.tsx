"use client";

import React, { createContext, useContext, useState, useCallback, useRef } from "react";

export type ToastType = "pending" | "cooking" | "ready" | "paid" | "success" | "error";

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  onRetry?: () => void;
}

interface ToastContextValue {
  addToast: (type: ToastType, orderNumber: string) => void;
  addSuccessToast: (message: string) => void;
  addErrorToast: (message: string, onRetry?: () => void) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const toastConfig: Record<
  "pending" | "cooking" | "ready" | "paid",
  { message: (n: string) => string; bg: string; border: string; dot: string }
> = {
  pending: {
    message: (n) => `Order ${n} received! 📋`,
    bg: "#EEF2FF",
    border: "#6366F1",
    dot: "#6366F1",
  },
  cooking: {
    message: (n) => `Order ${n} is now Cooking 🍳`,
    bg: "#FFFBEB",
    border: "#F59E0B",
    dot: "#F59E0B",
  },
  ready: {
    message: (n) => `Order ${n} is Ready for pickup ✅`,
    bg: "#F0FDF4",
    border: "#16A34A",
    dot: "#16A34A",
  },
  paid: {
    message: (n) => `Order ${n} Paid 💳`,
    bg: "#FDF4EE",
    border: "#3B1A0A",
    dot: "#3B1A0A",
  },
};

const successConfig = {
  bg: "#F0FDF4",
  border: "#16A34A",
  text: "#166534",
};

const errorConfig = {
  bg: "#FEF2F2",
  border: "#DC2626",
  text: "#991B1B",
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const addToast = useCallback(
    (type: ToastType, orderNumber: string) => {
      if (type === "success" || type === "error") return;
      const id = `toast-${Date.now()}-${Math.random()}`;
      const cfg = toastConfig[type as "pending" | "cooking" | "ready" | "paid"];
      const toast: Toast = { id, type, message: cfg.message(orderNumber) };
      setToasts((prev) => [...prev.slice(-4), toast]);
      const timer = setTimeout(() => removeToast(id), 4000);
      timers.current.set(id, timer);
    },
    [removeToast]
  );

  const addSuccessToast = useCallback(
    (message: string) => {
      const id = `toast-success-${Date.now()}-${Math.random()}`;
      const toast: Toast = { id, type: "success", message };
      setToasts((prev) => [...prev.slice(-4), toast]);
      const timer = setTimeout(() => removeToast(id), 4000);
      timers.current.set(id, timer);
    },
    [removeToast]
  );

  const addErrorToast = useCallback(
    (message: string, onRetry?: () => void) => {
      const id = `toast-error-${Date.now()}-${Math.random()}`;
      const toast: Toast = { id, type: "error", message, onRetry };
      setToasts((prev) => [...prev.slice(-4), toast]);
      // Error toasts with retry stay longer (6s), without retry auto-dismiss in 4s
      const duration = onRetry ? 6000 : 4000;
      const timer = setTimeout(() => removeToast(id), duration);
      timers.current.set(id, timer);
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ addToast, addSuccessToast, addErrorToast }}>
      {children}
      {/* Toast Container */}
      <div
        className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none"
        style={{ maxWidth: 340 }}
      >
        {toasts.map((toast) => {
          if (toast.type === "success") {
            return (
              <div
                key={toast.id}
                className="pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl shadow-lg"
                style={{
                  background: successConfig.bg,
                  border: `1.5px solid ${successConfig.border}`,
                  minWidth: 260,
                  animation: "toastSlideIn 0.3s cubic-bezier(0.34,1.56,0.64,1)",
                }}
              >
                {/* Checkmark icon */}
                <span
                  className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: "#16A34A" }}
                >
                  <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <p
                  className="flex-1 text-sm font-semibold"
                  style={{ color: successConfig.text, fontFamily: "Plus Jakarta Sans, sans-serif" }}
                >
                  {toast.message}
                </p>
                <button
                  onClick={() => removeToast(toast.id)}
                  className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-full text-xs transition-opacity"
                  style={{
                    color: successConfig.text,
                    background: "rgba(22,163,74,0.12)",
                    opacity: 0.7,
                  }}
                  aria-label="Dismiss"
                >
                  ×
                </button>
              </div>
            );
          }

          if (toast.type === "error") {
            return (
              <div
                key={toast.id}
                className="pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-2xl shadow-lg"
                style={{
                  background: errorConfig.bg,
                  border: `1.5px solid ${errorConfig.border}`,
                  minWidth: 260,
                  animation: "toastSlideIn 0.3s cubic-bezier(0.34,1.56,0.64,1)",
                }}
              >
                {/* Warning icon */}
                <span
                  className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: "#DC2626" }}
                >
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                    <path d="M6 2v4M6 8.5v.5" stroke="white" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </span>
                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm font-semibold leading-snug"
                    style={{ color: errorConfig.text, fontFamily: "Plus Jakarta Sans, sans-serif" }}
                  >
                    {toast.message}
                  </p>
                  {toast.onRetry && (
                    <button
                      onClick={() => {
                        removeToast(toast.id);
                        toast.onRetry?.();
                      }}
                      className="mt-1.5 text-xs font-bold underline underline-offset-2 transition-opacity hover:opacity-80"
                      style={{ color: "#DC2626", fontFamily: "Plus Jakarta Sans, sans-serif" }}
                    >
                      Retry
                    </button>
                  )}
                </div>
                <button
                  onClick={() => removeToast(toast.id)}
                  className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-full text-xs transition-opacity mt-0.5"
                  style={{
                    color: errorConfig.text,
                    background: "rgba(220,38,38,0.12)",
                    opacity: 0.7,
                  }}
                  aria-label="Dismiss"
                >
                  ×
                </button>
              </div>
            );
          }

          const cfg = toastConfig[toast.type as "pending" | "cooking" | "ready" | "paid"];
          return (
            <div
              key={toast.id}
              className="pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl shadow-lg"
              style={{
                background: cfg.bg,
                border: `1.5px solid ${cfg.border}`,
                minWidth: 260,
                animation: "toastSlideIn 0.3s cubic-bezier(0.34,1.56,0.64,1)",
              }}
            >
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ background: cfg.dot }}
              />
              <p
                className="flex-1 text-sm font-semibold"
                style={{ color: "#3B1A0A", fontFamily: "Plus Jakarta Sans, sans-serif" }}
              >
                {toast.message}
              </p>
              <button
                onClick={() => removeToast(toast.id)}
                className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-full text-xs transition-opacity"
                style={{
                  color: "#3B1A0A",
                  background: "rgba(59,26,10,0.1)",
                  opacity: 0.6,
                }}
                aria-label="Dismiss"
              >
                ×
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
