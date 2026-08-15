import React from 'react';
import { Trash2, ShieldAlert } from 'lucide-react';

interface DeletingAccountOverlayProps {
  shopName?: string;
  shopCode?: string;
}

export const DeletingAccountOverlay: React.FC<DeletingAccountOverlayProps> = ({
  shopName = 'Store Account',
  shopCode,
}) => {
  return (
    <div
      className="fixed inset-0 z-[10000] flex flex-col items-center justify-center bg-slate-950/95 backdrop-blur-md text-white p-6 animate-fadeIn select-none"
      role="dialog"
      aria-modal="true"
      aria-live="assertive"
    >
      {/* Background ambient red glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-rose-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900/90 border border-rose-900/60 rounded-3xl p-8 shadow-2xl space-y-7 text-center relative backdrop-blur-lg">
        {/* Animated Circular Spinner */}
        <div className="relative mx-auto w-24 h-24 flex items-center justify-center">
          {/* Outer Pulsing Aura */}
          <div className="absolute inset-0 rounded-full bg-rose-500/10 animate-ping opacity-75" />

          {/* SVG Circular Spinning Track */}
          <svg className="w-24 h-24 -rotate-90 transform" viewBox="0 0 100 100">
            {/* Background Track */}
            <circle
              cx="50"
              cy="50"
              r="40"
              className="stroke-slate-800"
              strokeWidth="6"
              fill="transparent"
            />
            {/* Animated Spinning Circle Segment */}
            <circle
              cx="50"
              cy="50"
              r="40"
              className="stroke-rose-500 animate-spin origin-center"
              strokeWidth="6"
              strokeDasharray="250"
              strokeDashoffset="170"
              strokeLinecap="round"
              fill="transparent"
            />
          </svg>

          {/* Center Trash Icon */}
          <div className="absolute inset-0 flex items-center justify-center text-rose-400">
            <Trash2 className="h-9 w-9 animate-pulse" />
          </div>
        </div>

        {/* Text & Status Display */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-950/80 border border-rose-800/80 text-rose-300 text-xs font-black tracking-wider uppercase">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            <span>Deleting Account</span>
          </div>

          <h2 className="text-2xl font-black text-white tracking-tight">
            Deleting...
          </h2>

          <p className="text-xs text-slate-300 leading-relaxed px-2">
            Permanently removing <strong className="text-white">{shopName}</strong>
            {shopCode ? ` (${shopCode})` : ''} and wiping all records from Supabase cloud database.
          </p>
        </div>

        {/* Action items being purged indicator */}
        <div className="bg-slate-950/80 border border-slate-800/90 rounded-2xl p-4 text-left text-xs space-y-2 font-mono">
          <div className="flex items-center justify-between text-slate-400 text-[11px]">
            <span>Cloud Tables:</span>
            <span className="text-rose-400 font-bold">PURGING</span>
          </div>
          <div className="flex items-center justify-between text-slate-400 text-[11px]">
            <span>Khata & Invoices:</span>
            <span className="text-rose-400 font-bold">ERASING</span>
          </div>
          <div className="flex items-center justify-between text-slate-400 text-[11px]">
            <span>Local Cache:</span>
            <span className="text-rose-400 font-bold">WIPING</span>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400">
          <ShieldAlert className="h-4 w-4 text-rose-400 shrink-0" />
          <span>Please do not close this browser window.</span>
        </div>
      </div>
    </div>
  );
};
