import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Smartphone,
  X,
  Copy,
  Check,
  Zap,
  ExternalLink,
  Wifi,
  Radio,
  CheckCircle2,
  AlertCircle,
  Volume2,
} from 'lucide-react';
import { DevicePresence } from '../../hooks/usePOSRealtimeBroadcast';
import { Unlink, PowerOff } from 'lucide-react';

interface PairMobileScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  shopCode: string;
  shopName: string;
  isConnected: boolean;
  activeDevices: DevicePresence[];
  latencyMs: number | null;
  onSendTestPing: () => void;
  onOpenLocalScanner: () => void;
  onDisconnectDevice?: (deviceId: string) => void;
  onDisconnectAll?: () => void;
}

export const PairMobileScannerModal: React.FC<PairMobileScannerModalProps> = ({
  isOpen,
  onClose,
  shopCode,
  shopName,
  isConnected,
  activeDevices,
  latencyMs,
  onSendTestPing,
  onOpenLocalScanner,
  onDisconnectDevice,
  onDisconnectAll,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Build the direct mobile scanner pairing URL
  const origin = window.location.origin;
  const pairUrl = `${origin}?mode=scanner&pair=${encodeURIComponent(shopCode)}&shopName=${encodeURIComponent(shopName)}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(pairUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const mobileDevices = activeDevices.filter((d) => d.role === 'MOBILE_SCANNER');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-3 sm:p-4 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-3xl bg-white p-5 sm:p-7 shadow-2xl dark:bg-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-500/20 shadow-xs">
              <Smartphone className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-base">
                  Pair Phone as Barcode Scanner
                </h3>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-950/80 px-2 py-0.5 text-[10px] font-extrabold text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                  <Radio className="h-2.5 w-2.5 animate-pulse" />
                  Supabase Realtime
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Scan with your phone to add items to this cart in real-time
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Live Channel Connection Indicator Banner */}
        <div className="mt-4 flex items-center justify-between rounded-2xl bg-slate-50 p-3 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs">
          <div className="flex items-center gap-2.5">
            <span className={`flex h-3 w-3 relative shrink-0`}>
              {isConnected && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              )}
              <span
                className={`relative inline-flex rounded-full h-3 w-3 ${
                  isConnected ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
              ></span>
            </span>
            <div>
              <p className="font-bold text-slate-800 dark:text-slate-200">
                {isConnected ? 'Supabase Realtime Broadcast Active' : 'Connecting to Broadcast Channel...'}
              </p>
              <p className="text-[11px] text-slate-500 font-mono">
                Channel: <span className="font-bold text-indigo-600 dark:text-indigo-400">pos_realtime_broadcast_{shopCode.toLowerCase()}</span>
              </p>
            </div>
          </div>

          {latencyMs !== null && (
            <span className="rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-2 py-0.5 text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
              {latencyMs}ms latency
            </span>
          )}
        </div>

        {/* QR Code & Pairing Section */}
        <div className="mt-4 flex flex-col sm:flex-row items-center gap-5 p-4 rounded-2xl bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/50">
          {/* QR Code Container */}
          <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white shadow-md border border-slate-200 dark:border-slate-700 shrink-0">
            <QRCodeSVG
              value={pairUrl}
              size={150}
              level="H"
              includeMargin={true}
            />
            <span className="mt-1 text-[10px] font-bold text-slate-600 dark:text-slate-400">
              Scan with Phone Camera
            </span>
          </div>

          {/* Quick Instructions */}
          <div className="flex-1 space-y-2.5 text-xs text-slate-700 dark:text-slate-300">
            <div className="space-y-1">
              <h4 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                <Zap className="h-4 w-4 text-amber-500 fill-amber-500" />
                How to use Wireless Mobile Gun:
              </h4>
              <ol className="list-decimal list-inside space-y-1.5 text-slate-600 dark:text-slate-400 text-[12px] leading-relaxed">
                <li>
                  Open your <strong>Mobile Camera</strong> or QR reader.
                </li>
                <li>
                  Scan this QR code or open the link below on your phone.
                </li>
                <li>
                  Point your mobile at product barcodes — items will <strong>instantly appear in this cart!</strong>
                </li>
              </ol>
            </div>

            {/* Shop Code Badge */}
            <div className="pt-1 flex items-center gap-2">
              <span className="text-[11px] font-semibold text-slate-500">Pairing Code:</span>
              <span className="font-mono font-black text-xs px-2.5 py-0.5 rounded-lg bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                {shopCode}
              </span>
            </div>
          </div>
        </div>

        {/* Paired Mobile Devices Live List */}
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Wifi className="h-3.5 w-3.5 text-emerald-500" />
              Connected Mobile Scanners ({mobileDevices.length})
            </span>
            <div className="flex items-center gap-2">
              {mobileDevices.length > 0 && onDisconnectAll && (
                <button
                  type="button"
                  onClick={onDisconnectAll}
                  className="text-[11px] font-bold text-red-600 hover:text-red-700 dark:text-red-400 flex items-center gap-1 cursor-pointer"
                  title="Disconnect all mobile phones from this billing station"
                >
                  <PowerOff className="h-3 w-3" />
                  <span>Disconnect All</span>
                </button>
              )}
              {isConnected && (
                <button
                  type="button"
                  onClick={onSendTestPing}
                  className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 flex items-center gap-1 cursor-pointer"
                >
                  <Volume2 className="h-3 w-3" />
                  <span>Test Ping / Chime</span>
                </button>
              )}
            </div>
          </div>

          {mobileDevices.length > 0 ? (
            <div className="space-y-1.5 max-h-32 overflow-y-auto">
              {mobileDevices.map((dev) => (
                <div
                  key={dev.deviceId}
                  className="flex items-center justify-between rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 px-3 py-2 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      {dev.deviceName}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      (ID: {dev.deviceId.slice(-6)})
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded-full">
                      Live Synced
                    </span>
                    {onDisconnectDevice && (
                      <button
                        type="button"
                        onClick={() => onDisconnectDevice(dev.deviceId)}
                        className="p-1 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50 transition cursor-pointer"
                        title="Disconnect this phone scanner"
                      >
                        <Unlink className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-dashed border-slate-300 dark:border-slate-800 p-3 text-xs text-slate-500">
              <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />
              <span>
                No mobile scanner phone connected yet. Scan the QR code above with your mobile phone!
              </span>
            </div>
          )}
        </div>

        {/* Copy Link & Action Buttons */}
        <div className="mt-5 space-y-3 pt-3 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={pairUrl}
              className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-mono text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 select-all outline-none"
            />
            <button
              type="button"
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white dark:bg-slate-800 dark:border-slate-700 px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition cursor-pointer active:scale-95 shadow-xs"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                  <span className="text-emerald-600">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 text-slate-500" />
                  <span>Copy Link</span>
                </>
              )}
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-1">
            <button
              type="button"
              onClick={onOpenLocalScanner}
              className="flex items-center justify-center gap-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 px-4 py-2 text-xs font-bold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 transition cursor-pointer"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span>Launch Mobile Scanner View</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-slate-900 px-5 py-2 text-xs font-bold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 transition cursor-pointer"
            >
              Done & Return to POS
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
