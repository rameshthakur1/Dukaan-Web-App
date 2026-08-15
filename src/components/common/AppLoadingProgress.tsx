import React, { useState, useEffect } from 'react';
import { Store, ShieldCheck, Database, Zap, CheckCircle2 } from 'lucide-react';

interface AppLoadingProgressProps {
  shopName?: string;
  shopCode?: string;
  userName?: string;
  onComplete: () => void;
}

export const AppLoadingProgress: React.FC<AppLoadingProgressProps> = ({
  shopName = 'My Store',
  shopCode = 'SHOP-01',
  userName,
  onComplete,
}) => {
  const [progress, setProgress] = useState(1);
  const [isFinishing, setIsFinishing] = useState(false);

  useEffect(() => {
    let current = 1;
    const interval = setInterval(() => {
      // Fast, smooth non-linear progress acceleration (finishes in ~700-900ms)
      let increment = 1;
      if (current < 35) {
        increment = Math.floor(Math.random() * 4) + 4; // Fast start (4-7%)
      } else if (current < 75) {
        increment = Math.floor(Math.random() * 4) + 3; // Mid sync (3-6%)
      } else if (current < 95) {
        increment = Math.floor(Math.random() * 3) + 3; // Finalizing (3-5%)
      } else {
        increment = 2; // Last stretch
      }

      current = Math.min(100, current + increment);
      setProgress(current);

      if (current >= 100) {
        clearInterval(interval);
        setIsFinishing(true);
        setTimeout(() => {
          onComplete();
        }, 120);
      }
    }, 14);

    return () => clearInterval(interval);
  }, [onComplete]);

  // Contextual loading step text
  const getStepText = (pct: number) => {
    if (pct < 25) return 'Authenticating store credentials & license...';
    if (pct < 55) return 'Synchronizing product catalog, Khata ledgers & invoices...';
    if (pct < 80) return 'Configuring thermal printer & billing preferences...';
    if (pct < 99) return 'Preparing offline database cache & POS station...';
    return 'Workspace ready! Launching Dukaan...';
  };

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#070d18] text-white px-4 transition-opacity duration-300 ${
        isFinishing ? 'opacity-0 scale-98 pointer-events-none' : 'opacity-100 scale-100'
      }`}
    >
      {/* Background ambient lighting */}
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 left-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800/90 rounded-3xl p-7 sm:p-8 shadow-2xl space-y-6 relative backdrop-blur-md">
        {/* Brand Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-black text-white text-xl shadow-lg shadow-blue-600/30">
              D
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-base font-extrabold text-white tracking-tight">Dukaan.io</span>
                <span className="text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 px-1.5 py-0.2 rounded">
                  POS
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">Smart Retail & Khata Management</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 text-[10px] font-mono font-bold text-slate-300">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            <span>Encrypted</span>
          </div>
        </div>

        {/* Store Identifier Card */}
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 text-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 shrink-0">
              <Store className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <span className="text-slate-400 text-[10px] block font-medium">Active Store</span>
              <p className="text-slate-100 font-bold text-xs truncate max-w-[200px]" title={shopName}>
                {shopName}
              </p>
            </div>
          </div>

          <div className="text-right shrink-0">
            <span className="text-slate-400 text-[10px] block font-medium">Store Code</span>
            <span className="font-mono font-bold text-blue-400 text-xs bg-blue-950/60 px-2 py-0.5 rounded border border-blue-800/60">
              {shopCode}
            </span>
          </div>
        </div>

        {/* Progress Bar & Percentage Section */}
        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-slate-300 font-medium">
              <Database className="h-3.5 w-3.5 text-blue-400 animate-pulse" />
              <span className="text-slate-300 text-xs font-semibold">Loading Store Workspace</span>
            </div>
            <div className="font-mono font-black text-sm text-blue-400 tracking-wider">
              {progress}%
            </div>
          </div>

          {/* Sliding Progress Track */}
          <div className="relative h-3 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800/80 p-0.5">
            <div
              className="h-full bg-gradient-to-r from-blue-600 via-indigo-500 to-cyan-400 rounded-full transition-all duration-75 ease-out relative overflow-hidden"
              style={{ width: `${progress}%` }}
            >
              {/* Shimmer animation highlight */}
              <div className="absolute inset-0 bg-white/20 animate-[pulse_1.5s_infinite]" />
            </div>
          </div>

          {/* Dynamic Status Text */}
          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
            <span className="truncate pr-2">{getStepText(progress)}</span>
            {progress === 100 && (
              <span className="flex items-center gap-1 text-emerald-400 font-bold shrink-0">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Ready</span>
              </span>
            )}
          </div>
        </div>

        {/* Security & Offline Notice */}
        <div className="flex items-center justify-center gap-2 text-[10px] text-slate-500 pt-1 border-t border-slate-800/60">
          <Zap className="h-3 w-3 text-amber-400" />
          <span>Synchronizing cloud data & local offline database cache</span>
        </div>
      </div>
    </div>
  );
};
