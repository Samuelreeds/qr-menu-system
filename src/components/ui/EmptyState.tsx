"use client";

import React from "react";

interface EmptyStateProps {
  illustration?: React.ReactNode;
  emoji?: string;
  heading: string;
  subtext: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  compact?: boolean;
}

export default function EmptyState({
  illustration,
  emoji,
  heading,
  subtext,
  action,
  compact = false,
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center ${compact ? "py-10 px-4" : "py-16 px-6"}`}
    >
      {/* Illustration or Emoji */}
      {illustration ? (
        <div className={`${compact ? "mb-3" : "mb-4"}`}>{illustration}</div>
      ) : emoji ? (
        <div
          className={`${compact ? "w-14 h-14 text-3xl mb-3" : "w-20 h-20 text-4xl mb-4"} rounded-full flex items-center justify-center`}
          style={{ background: "#F5EDE3" }}
        >
          {emoji}
        </div>
      ) : (
        <div className={`${compact ? "mb-3" : "mb-4"}`}>
          <EmptyCupSVG compact={compact} />
        </div>
      )}

      {/* Heading */}
      <h3
        className={`font-bold ${compact ? "text-sm" : "text-base"} mb-1`}
        style={{ color: "#3B1A0A", fontFamily: "Plus Jakarta Sans, sans-serif" }}
      >
        {heading}
      </h3>

      {/* Subtext */}
      <p
        className={`${compact ? "text-xs" : "text-sm"} max-w-xs leading-relaxed`}
        style={{ color: "#9B8B7E" }}
      >
        {subtext}
      </p>

      {/* Optional Action */}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-4 px-5 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95"
          style={{
            background: "#C4956A",
            fontFamily: "Plus Jakarta Sans, sans-serif",
          }}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

// ─── Default SVG Illustration ─────────────────────────────
function EmptyCupSVG({ compact }: { compact: boolean }) {
  const size = compact ? 56 : 80;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="40" cy="40" r="40" fill="#F5EDE3" />
      <rect x="26" y="28" width="28" height="30" rx="4" fill="#E8D5C0" />
      <rect x="28" y="30" width="24" height="26" rx="3" fill="#FDFAF7" />
      <path d="M54 34 Q62 34 62 40 Q62 46 54 46" stroke="#C4956A" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <rect x="32" y="22" width="16" height="8" rx="2" fill="#C4956A" opacity="0.4" />
      <circle cx="36" cy="42" r="2" fill="#C4956A" opacity="0.5" />
      <circle cx="44" cy="42" r="2" fill="#C4956A" opacity="0.5" />
      <circle cx="40" cy="46" r="2" fill="#C4956A" opacity="0.5" />
    </svg>
  );
}

// ─── Contextual SVG Illustrations ────────────────────────

export function SearchEmptySVG({ compact = false }: { compact?: boolean }) {
  const size = compact ? 56 : 80;
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="40" cy="40" r="40" fill="#F5EDE3" />
      <circle cx="36" cy="36" r="14" stroke="#C4956A" strokeWidth="3" fill="#FDFAF7" />
      <line x1="46" y1="46" x2="58" y2="58" stroke="#C4956A" strokeWidth="3" strokeLinecap="round" />
      <line x1="30" y1="36" x2="42" y2="36" stroke="#E8D5C0" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="36" y1="30" x2="36" y2="42" stroke="#E8D5C0" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

export function HistoryEmptySVG({ compact = false }: { compact?: boolean }) {
  const size = compact ? 56 : 80;
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="40" cy="40" r="40" fill="#F5EDE3" />
      <rect x="22" y="20" width="36" height="44" rx="5" fill="#E8D5C0" />
      <rect x="24" y="22" width="32" height="40" rx="4" fill="#FDFAF7" />
      <rect x="30" y="30" width="20" height="2.5" rx="1.25" fill="#C4956A" opacity="0.5" />
      <rect x="30" y="36" width="14" height="2.5" rx="1.25" fill="#C4956A" opacity="0.3" />
      <rect x="30" y="42" width="17" height="2.5" rx="1.25" fill="#C4956A" opacity="0.3" />
      <circle cx="40" cy="52" r="5" fill="#F5EDE3" stroke="#C4956A" strokeWidth="1.5" />
      <line x1="40" y1="49.5" x2="40" y2="52" stroke="#C4956A" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="40" cy="54" r="0.75" fill="#C4956A" />
    </svg>
  );
}

export function ChartEmptySVG({ compact = false }: { compact?: boolean }) {
  const size = compact ? 56 : 80;
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="40" cy="40" r="40" fill="#F5EDE3" />
      <rect x="20" y="52" width="8" height="12" rx="2" fill="#E8D5C0" />
      <rect x="32" y="40" width="8" height="24" rx="2" fill="#C4956A" opacity="0.4" />
      <rect x="44" y="32" width="8" height="32" rx="2" fill="#E8D5C0" />
      <rect x="56" y="44" width="8" height="20" rx="2" fill="#C4956A" opacity="0.3" />
      <line x1="18" y1="64" x2="66" y2="64" stroke="#C4956A" strokeWidth="2" strokeLinecap="round" />
      <circle cx="40" cy="22" r="6" fill="#F5EDE3" stroke="#C4956A" strokeWidth="1.5" />
      <line x1="40" y1="19" x2="40" y2="22" stroke="#C4956A" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="40" cy="24.5" r="0.75" fill="#C4956A" />
    </svg>
  );
}

export function PromoEmptySVG({ compact = false }: { compact?: boolean }) {
  const size = compact ? 56 : 80;
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="40" cy="40" r="40" fill="#F5EDE3" />
      <rect x="18" y="28" width="44" height="28" rx="6" fill="#E8D5C0" />
      <rect x="20" y="30" width="40" height="24" rx="5" fill="#FDFAF7" />
      <circle cx="28" cy="42" r="5" fill="#C4956A" opacity="0.3" />
      <line x1="35" y1="38" x2="52" y2="38" stroke="#C4956A" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
      <line x1="35" y1="43" x2="48" y2="43" stroke="#C4956A" strokeWidth="2" strokeLinecap="round" opacity="0.3" />
      <line x1="35" y1="48" x2="44" y2="48" stroke="#C4956A" strokeWidth="2" strokeLinecap="round" opacity="0.3" />
      <path d="M52 20 L56 24 L52 28 L48 24 Z" fill="#C4956A" opacity="0.6" />
    </svg>
  );
}

export function InventoryEmptySVG({ compact = false }: { compact?: boolean }) {
  const size = compact ? 56 : 80;
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="40" cy="40" r="40" fill="#F5EDE3" />
      <rect x="22" y="34" width="36" height="28" rx="4" fill="#E8D5C0" />
      <rect x="24" y="36" width="32" height="24" rx="3" fill="#FDFAF7" />
      <path d="M28 34 L28 28 Q28 24 32 24 L48 24 Q52 24 52 28 L52 34" stroke="#C4956A" strokeWidth="2.5" fill="none" />
      <line x1="30" y1="44" x2="50" y2="44" stroke="#C4956A" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
      <line x1="30" y1="50" x2="42" y2="50" stroke="#C4956A" strokeWidth="2" strokeLinecap="round" opacity="0.3" />
    </svg>
  );
}

export function OrdersEmptySVG({ compact = false }: { compact?: boolean }) {
  const size = compact ? 56 : 80;
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="40" cy="40" r="40" fill="#F5EDE3" />
      <rect x="24" y="22" width="32" height="38" rx="5" fill="#E8D5C0" />
      <rect x="26" y="24" width="28" height="34" rx="4" fill="#FDFAF7" />
      <rect x="32" y="32" width="16" height="2.5" rx="1.25" fill="#C4956A" opacity="0.5" />
      <rect x="32" y="38" width="12" height="2.5" rx="1.25" fill="#C4956A" opacity="0.3" />
      <rect x="32" y="44" width="14" height="2.5" rx="1.25" fill="#C4956A" opacity="0.3" />
      <circle cx="40" cy="62" r="4" fill="#C4956A" opacity="0.3" />
      <line x1="40" y1="58" x2="40" y2="56" stroke="#C4956A" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
    </svg>
  );
}
