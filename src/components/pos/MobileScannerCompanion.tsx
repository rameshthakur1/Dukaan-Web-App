import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats, CameraDevice } from 'html5-qrcode';
import {
  Camera,
  X,
  Zap,
  Volume2,
  VolumeX,
  Vibrate,
  VibrateOff,
  SwitchCamera,
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Sparkles,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
  Radio,
  Keyboard,
  ArrowLeft,
  ChevronUp,
  ChevronDown,
  Layers,
  Flame,
  Package,
  Barcode as BarcodeIcon,
  Check,
  PowerOff,
  Play,
  Pause,
  RotateCcw,
  Unlink,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { usePOSRealtimeBroadcast, playBroadcastBeep } from '../../hooks/usePOSRealtimeBroadcast';
import { findProductAndUnitByBarcode } from '../../utils/barcodeMatcher';
import { Product, CartItem } from '../../types';

interface MobileScannerCompanionProps {
  onClose?: () => void;
  shopCodeParam?: string;
  shopNameParam?: string;
}

const SUPPORTED_FORMATS = [
  Html5QrcodeSupportedFormats.EAN_13,
  Html5QrcodeSupportedFormats.EAN_8,
  Html5QrcodeSupportedFormats.CODE_128,
  Html5QrcodeSupportedFormats.CODE_39,
  Html5QrcodeSupportedFormats.CODE_93,
  Html5QrcodeSupportedFormats.UPC_A,
  Html5QrcodeSupportedFormats.UPC_E,
  Html5QrcodeSupportedFormats.CODABAR,
  Html5QrcodeSupportedFormats.ITF,
  Html5QrcodeSupportedFormats.QR_CODE,
  Html5QrcodeSupportedFormats.DATA_MATRIX,
];

export const MobileScannerCompanion: React.FC<MobileScannerCompanionProps> = ({
  onClose,
  shopCodeParam,
  shopNameParam,
}) => {
  const {
    products,
    posCart,
    setPosCart,
    addToCart,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    shopProfile,
    activeShopCode,
    activeShopName,
  } = useApp();

  const effectiveShopCode = shopCodeParam || activeShopCode || shopProfile.shopCode || 'SHOP-01';
  const effectiveShopName = shopNameParam || activeShopName || shopProfile.shopName || 'Retail Store';

  // Scanner UI States
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [selectedCamId, setSelectedCamId] = useState<string | null>(null);
  const [torchOn, setTorchOn] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const [manualCode, setManualCode] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const [syncedCatalog, setSyncedCatalog] = useState<Product[]>([]);
  const [isSessionDisconnected, setIsSessionDisconnected] = useState(false);
  const [isScannerPaused, setIsScannerPaused] = useState(false);
  const [scannedPopup, setScannedPopup] = useState<{
    status: 'SUCCESS' | 'CHECKING' | 'OUT_OF_STOCK' | 'NOT_FOUND';
    product: Product | null;
    barcode: string;
    unitPrice: number;
    unitType: 'PRIMARY' | 'SECONDARY';
    unitName: string;
    quantity: number;
  } | null>(null);

  // Merge context products with realtime synced catalog from Desktop POS
  const activeProducts = useMemo(() => {
    if (syncedCatalog.length > 0) return syncedCatalog;
    return products;
  }, [syncedCatalog, products]);

  const html5QrcodeRef = useRef<Html5Qrcode | null>(null);
  const lastScannedRef = useRef<{ code: string; time: number }>({ code: '', time: 0 });
  const isScanPausedRef = useRef<boolean>(false);
  const containerId = 'mobile-continuous-scanner-container';

  // Setup Supabase Realtime Broadcast for this mobile scanner
  const {
    isConnected,
    deviceId,
    deviceName,
    latencyMs,
    broadcastBarcodeScan,
    broadcastScanAck,
    requestCatalogSync,
    broadcastCartSync,
    broadcastQuantityUpdate,
    broadcastRemoveItem,
    broadcastClearCart,
    broadcastDisconnect,
  } = usePOSRealtimeBroadcast({
    shopCode: effectiveShopCode,
    role: 'MOBILE_SCANNER',
    onDisconnectReceived: () => {
      setIsSessionDisconnected(true);
      stopCamera();
    },
    onScanAckReceived: (payload) => {
      // Whenever desktop station confirms or corrects barcode matching, update popup instantly
      if (payload.status === 'SUCCESS' && payload.product) {
        // Also add product to local activeProducts/syncedCatalog if missing
        setSyncedCatalog((prev) => {
          if (!prev.some((p) => p.id === payload.product!.id)) {
            return [...prev, payload.product!];
          }
          return prev;
        });

        // Ensure in local cart
        addToCart(payload.product, 1, payload.unitType || 'PRIMARY');

        setScannedPopup({
          status: 'SUCCESS',
          product: payload.product,
          barcode: payload.barcode,
          unitPrice: payload.unitPrice || payload.product.unit?.primarySellingPrice || 0,
          unitType: payload.unitType || 'PRIMARY',
          unitName: payload.unitName || payload.product.unit?.primaryUnit || 'Pcs',
          quantity: payload.quantity || 1,
        });
      } else if (payload.status === 'OUT_OF_STOCK' && payload.product) {
        setScannedPopup({
          status: 'OUT_OF_STOCK',
          product: payload.product,
          barcode: payload.barcode,
          unitPrice: payload.unitPrice || 0,
          unitType: payload.unitType || 'PRIMARY',
          unitName: payload.unitName || 'Pcs',
          quantity: 0,
        });
      } else if (payload.status === 'NOT_FOUND') {
        setScannedPopup((prev) => {
          // Only update to not found if not already matched
          if (prev && prev.status === 'SUCCESS') return prev;
          return {
            status: 'NOT_FOUND',
            product: null,
            barcode: payload.barcode,
            unitPrice: 0,
            unitType: 'PRIMARY',
            unitName: 'Unit',
            quantity: 1,
          };
        });
      }
    },
    onCatalogSyncReceived: (payload) => {
      if (Array.isArray(payload.products) && payload.products.length > 0) {
        setSyncedCatalog(payload.products);
      }
    },
    onCartSyncReceived: (payload) => {
      if (Array.isArray(payload.cart)) {
        setPosCart(payload.cart);
      }
    },
    onQuantityUpdateReceived: (payload) => {
      updateCartQuantity(payload.productId, payload.quantity, payload.selectedUnit);
    },
    onRemoveItemReceived: (payload) => {
      removeFromCart(payload.productId, payload.selectedUnit);
    },
    onClearCartReceived: () => {
      clearCart();
    },
  });

  // Request catalog on connect
  useEffect(() => {
    if (isConnected) {
      requestCatalogSync();
    }
  }, [isConnected, requestCatalogSync]);

  // Calculate Cart Stats
  const cartSubtotal = useMemo(() => posCart.reduce((sum, item) => sum + item.totalPrice, 0), [posCart]);
  const totalCartCount = useMemo(() => posCart.reduce((sum, item) => sum + item.quantity, 0), [posCart]);

  // Filter products for quick search
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return activeProducts
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.barcode.toLowerCase().includes(q) ||
          (p.sku && p.sku.toLowerCase().includes(q))
      )
      .slice(0, 10);
  }, [activeProducts, searchQuery]);

  // Disconnect & Reconnect Session Handlers
  const handleDisconnectSession = () => {
    broadcastDisconnect(undefined, 'Scanner disconnected by mobile user');
    setIsSessionDisconnected(true);
    stopCamera();
  };

  const handleReconnectSession = () => {
    setIsSessionDisconnected(false);
    setIsScannerPaused(false);
    isScanPausedRef.current = false;
    initCamerasAndStart();
    requestCatalogSync();
  };

  // Handle scanned barcode event
  const handleBarcodeDetected = (rawCode: string) => {
    // If scanner is disconnected, paused, or currently showing confirmation popup, do not process
    if (isSessionDisconnected || isScannerPaused || isScanPausedRef.current) return;

    const cleanCode = rawCode.trim();
    if (!cleanCode) return;

    // Debounce duplicate rapid scans within 800ms
    const now = Date.now();
    if (lastScannedRef.current.code === cleanCode && now - lastScannedRef.current.time < 800) {
      return;
    }
    lastScannedRef.current = { code: cleanCode, time: now };

    // Pause further scanning while confirmation popup is active
    isScanPausedRef.current = true;

    // 1. Audio & Haptic feedback
    if (soundEnabled) playBroadcastBeep('SCAN_SENT');
    if (vibrationEnabled && 'vibrate' in navigator) {
      try {
        navigator.vibrate([60, 30, 60]);
      } catch {}
    }

    // 2. Find matching product in catalog
    const matched = findProductAndUnitByBarcode(activeProducts, cleanCode);

    if (matched) {
      // Add to local cart state
      addToCart(matched.product, 1, matched.unitType);

      setScannedPopup({
        status: 'SUCCESS',
        product: matched.product,
        barcode: cleanCode,
        unitPrice: matched.unitPrice,
        unitType: matched.unitType,
        unitName: matched.unitName,
        quantity: 1,
      });

      // Broadcast to Supabase Realtime channel for instant sync with Web App POS
      broadcastBarcodeScan(cleanCode, 1, matched.unitType, matched.product.name);
    } else {
      // If not found in local cache, send to desktop station and show verifying state
      setScannedPopup({
        status: 'CHECKING',
        product: null,
        barcode: cleanCode,
        unitPrice: 0,
        unitType: 'PRIMARY',
        unitName: 'Unit',
        quantity: 1,
      });

      broadcastBarcodeScan(cleanCode, 1, 'PRIMARY', undefined);
    }
  };

  // Dismiss popup and resume scanning next item
  const handleScanNext = () => {
    setScannedPopup(null);
    // Grace period of 400ms before accepting next scan to prevent re-triggering current barcode
    setTimeout(() => {
      isScanPausedRef.current = false;
    }, 400);
  };

  // Adjust quantity of the currently shown scanned popup item
  const handlePopupQuantityChange = (delta: number) => {
    if (!scannedPopup || !scannedPopup.product) return;
    const prod = scannedPopup.product;
    const unitType = scannedPopup.unitType;
    const item = posCart.find(
      (c) => c.product.id === prod.id && c.selectedUnit === unitType
    );
    const currentQty = item ? item.quantity : scannedPopup.quantity;
    const newQty = currentQty + delta;
    if (newQty <= 0) {
      removeFromCart(prod.id, unitType);
      broadcastRemoveItem(prod.id, unitType);
      setScannedPopup((prev) => (prev ? { ...prev, quantity: 0 } : null));
    } else {
      updateCartQuantity(prod.id, newQty, unitType);
      broadcastQuantityUpdate(prod.id, newQty, unitType);
      setScannedPopup((prev) => (prev ? { ...prev, quantity: newQty } : null));
    }
  };

  // Quick tap add product from search list
  const handleQuickAddProduct = (prod: Product) => {
    isScanPausedRef.current = true;
    addToCart(prod, 1, 'PRIMARY');
    if (soundEnabled) playBroadcastBeep('SCAN_SENT');
    if (vibrationEnabled && 'vibrate' in navigator) {
      try {
        navigator.vibrate(30);
      } catch {}
    }

    setScannedPopup({
      status: 'SUCCESS',
      product: prod,
      barcode: prod.barcode || prod.sku,
      unitPrice: prod.unit.primarySellingPrice,
      unitType: 'PRIMARY',
      unitName: prod.unit.primaryUnit || 'Pcs',
      quantity: 1,
    });

    broadcastBarcodeScan(prod.barcode || prod.sku, 1, 'PRIMARY', prod.name);
    setSearchQuery('');
  };

  // Cart modifications that broadcast
  const handleQuantityStep = (item: CartItem, delta: number) => {
    const newQty = item.quantity + delta;
    if (newQty <= 0) {
      removeFromCart(item.product.id, item.selectedUnit);
      broadcastRemoveItem(item.product.id, item.selectedUnit);
    } else {
      updateCartQuantity(item.product.id, newQty, item.selectedUnit);
      broadcastQuantityUpdate(item.product.id, newQty, item.selectedUnit);
    }
  };

  const handleClearCart = () => {
    if (window.confirm('Clear all items from this synchronized cart?')) {
      clearCart();
      broadcastClearCart();
    }
  };

  // Camera Management
  const stopCamera = async () => {
    if (html5QrcodeRef.current) {
      try {
        if (html5QrcodeRef.current.isScanning) {
          await html5QrcodeRef.current.stop();
        }
        await html5QrcodeRef.current.clear();
      } catch (e) {
        console.warn('Camera stop notice:', e);
      } finally {
        html5QrcodeRef.current = null;
      }
    }
  };

  const startCamera = async (camConfig: any) => {
    setCameraError(null);
    setIsInitializing(true);

    try {
      await stopCamera();
      const el = document.getElementById(containerId);
      if (!el) return;

      const html5Qrcode = new Html5Qrcode(containerId, {
        formatsToSupport: SUPPORTED_FORMATS,
        verbose: false,
      });
      html5QrcodeRef.current = html5Qrcode;

      const qrboxCalc = (w: number, h: number) => {
        const boxWidth = Math.min(Math.floor(w * 0.9), 360);
        const boxHeight = Math.min(Math.floor(h * 0.65), 220);
        return { width: Math.max(boxWidth, 220), height: Math.max(boxHeight, 140) };
      };

      await html5Qrcode.start(
        camConfig,
        {
          fps: 25,
          qrbox: qrboxCalc,
        },
        (decodedText) => {
          handleBarcodeDetected(decodedText);
        },
        () => {}
      );

      setIsInitializing(false);

      // Check native BarcodeDetector API for fast mobile frame detection
      if ('BarcodeDetector' in window) {
        try {
          const video = el.querySelector('video');
          if (video) {
            const detector = new (window as any).BarcodeDetector({
              formats: ['ean_13', 'ean_8', 'code_128', 'code_39', 'upc_a', 'upc_e', 'qr_code'],
            });
            const detectorInterval = setInterval(async () => {
              if (video.readyState >= 2) {
                try {
                  const codes = await detector.detect(video);
                  if (codes && codes.length > 0 && codes[0].rawValue) {
                    handleBarcodeDetected(codes[0].rawValue);
                  }
                } catch {}
              }
            }, 100);

            // Clear detector when scanner stops
            return () => clearInterval(detectorInterval);
          }
        } catch {}
      }
    } catch (err: any) {
      console.warn('Camera launch failed:', err);
      if (typeof camConfig === 'string') {
        return startCamera({ facingMode: 'environment' });
      } else if (typeof camConfig === 'object' && camConfig.facingMode === 'environment') {
        return startCamera({ facingMode: 'user' });
      }

      setCameraError('Camera access unavailable. Please permit camera access in your mobile browser.');
      setIsInitializing(false);
    }
  };

  const initCamerasAndStart = async () => {
    try {
      const devices = await Html5Qrcode.getCameras();
      if (devices && devices.length > 0) {
        setCameras(devices);
        const backCam = devices.find(
          (d) =>
            d.label.toLowerCase().includes('back') ||
            d.label.toLowerCase().includes('rear') ||
            d.label.toLowerCase().includes('environment') ||
            d.label.toLowerCase().includes('main')
        );
        const chosen = backCam ? backCam.id : devices[0].id;
        setSelectedCamId(chosen);
        await startCamera(chosen);
      } else {
        await startCamera({ facingMode: 'environment' });
      }
    } catch {
      await startCamera({ facingMode: 'environment' });
    }
  };

  useEffect(() => {
    initCamerasAndStart();
    return () => {
      stopCamera();
    };
  }, []);

  // Keyboard shortcut to dismiss popup and scan next barcode
  useEffect(() => {
    if (!scannedPopup) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === 'Escape') {
        e.preventDefault();
        handleScanNext();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [scannedPopup]);

  const toggleTorch = async () => {
    try {
      const videoElem = document.getElementById(containerId)?.querySelector('video') as HTMLVideoElement;
      if (videoElem && videoElem.srcObject) {
        const stream = videoElem.srcObject as MediaStream;
        const track = stream.getVideoTracks()[0];
        const caps = (track.getCapabilities && (track.getCapabilities() as any)) || {};
        if (caps.torch) {
          await (track as any).applyConstraints({
            advanced: [{ torch: !torchOn }],
          });
          setTorchOn(!torchOn);
        } else {
          alert('Flashlight / Torch not supported on this camera lens.');
        }
      }
    } catch (e) {
      console.warn('Torch toggle error:', e);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    handleBarcodeDetected(manualCode.trim());
    setManualCode('');
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950 text-white select-none overflow-hidden font-sans">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-900/90 border-b border-slate-800 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 active:scale-95 transition cursor-pointer"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-sm text-white truncate">{effectiveShopName}</span>
              <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800 font-bold shrink-0">
                {effectiveShopCode}
              </span>
            </div>
            {/* Live Sync Status indicator */}
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-400">
              <span className="flex h-2 w-2 relative shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="font-bold">
                {isConnected ? 'Real-Time Sync Online' : 'Connecting to Web POS...'}
              </span>
              {latencyMs && <span className="text-[10px] text-slate-400 font-mono">({latencyMs}ms)</span>}
            </div>
          </div>
        </div>

        {/* Quick Action Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setIsScannerPaused((prev) => !prev)}
            className={`px-2.5 py-2 rounded-xl border transition cursor-pointer text-xs font-bold flex items-center gap-1.5 ${
              isScannerPaused
                ? 'bg-amber-500 text-slate-950 border-amber-400 font-extrabold shadow-md'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
            title={isScannerPaused ? 'Resume live camera scanning' : 'Pause scanning temporarily'}
          >
            {isScannerPaused ? <Play className="h-3.5 w-3.5 fill-current" /> : <Pause className="h-3.5 w-3.5" />}
            <span className="hidden sm:inline">{isScannerPaused ? 'Resume' : 'Pause'}</span>
          </button>

          <button
            type="button"
            onClick={toggleTorch}
            className={`p-2 rounded-xl border transition cursor-pointer ${
              torchOn
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/30'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
            title="Toggle Flashlight"
          >
            <Zap className="h-4 w-4 fill-current" />
          </button>

          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-xl border transition cursor-pointer ${
              soundEnabled
                ? 'bg-slate-800 text-emerald-400 border-slate-700'
                : 'bg-slate-800 text-slate-500 border-slate-700'
            }`}
            title="Toggle Beep Sound"
          >
            {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </button>

          {cameras.length > 1 && (
            <button
              type="button"
              onClick={() => {
                const currentIndex = cameras.findIndex((c) => c.id === selectedCamId);
                const nextIndex = (currentIndex + 1) % cameras.length;
                const nextCam = cameras[nextIndex];
                setSelectedCamId(nextCam.id);
                startCamera(nextCam.id);
              }}
              className="p-2 rounded-xl bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 transition cursor-pointer"
              title="Switch Camera Lens"
            >
              <SwitchCamera className="h-4 w-4" />
            </button>
          )}

          {/* Explicit Disconnect Button */}
          <button
            type="button"
            onClick={handleDisconnectSession}
            className="px-2.5 sm:px-3 py-2 rounded-xl bg-red-600/90 hover:bg-red-600 active:scale-95 text-white border border-red-500/80 text-xs font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer shrink-0"
            title="Disconnect from billing station to stop all scans"
          >
            <PowerOff className="h-3.5 w-3.5" />
            <span>Disconnect</span>
          </button>
        </div>
      </div>

      {/* Main Viewport: Continuous Camera Scanner */}
      <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden">
        <div id={containerId} className="w-full h-full object-cover" />

        {/* Laser Targeting Overlay & Guidelines */}
        {!isInitializing && !cameraError && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center p-6">
            <div className="relative w-full max-w-xs h-48 sm:h-56 rounded-3xl border-2 border-dashed border-emerald-400/80 shadow-[0_0_20px_rgba(52,211,153,0.25)] flex items-center justify-center">
              {/* Corner markers */}
              <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-emerald-400" />
              <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-emerald-400" />
              <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-emerald-400" />
              <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-emerald-400" />

              {/* Laser line */}
              <div className="w-full h-0.5 bg-red-500/90 shadow-[0_0_12px_rgba(239,68,68,1)] animate-pulse" />

              <span className="absolute -bottom-8 px-3 py-1 rounded-full bg-slate-900/90 border border-slate-700 text-[11px] font-bold text-slate-300 shadow-md">
                Align barcode in target box
              </span>
            </div>
          </div>
        )}

        {/* Camera Loading Spinner */}
        {isInitializing && !cameraError && !isSessionDisconnected && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 text-white gap-3 p-6 text-center">
            <RefreshCw className="h-8 w-8 animate-spin text-emerald-400" />
            <p className="font-extrabold text-sm">Starting Mobile Barcode Camera...</p>
            <p className="text-xs text-slate-400 max-w-xs">
              Initializing continuous 25 FPS scan engine for instant barcode detection.
            </p>
          </div>
        )}

        {/* Scanner Paused Overlay */}
        {isScannerPaused && !isSessionDisconnected && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-slate-950/85 backdrop-blur-xs p-6 text-center space-y-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shadow-lg">
              <Pause className="h-7 w-7" />
            </div>
            <div className="space-y-1 max-w-xs">
              <h3 className="font-extrabold text-lg text-white">Scanning Paused</h3>
              <p className="text-xs text-slate-300">
                Camera barcode detection is temporarily suspended. Tap Resume when ready.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsScannerPaused(false)}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-sm shadow-xl flex items-center gap-2 transition active:scale-95 cursor-pointer"
            >
              <Play className="h-4 w-4 fill-current" />
              <span>Resume Scanning</span>
            </button>
          </div>
        )}

        {/* Session Disconnected Full Overlay */}
        {isSessionDisconnected && (
          <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-slate-950 p-6 text-center space-y-5 animate-in fade-in duration-200">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-red-500/10 text-red-500 border border-red-500/20 shadow-xl">
              <PowerOff className="h-8 w-8" />
            </div>
            <div className="space-y-2 max-w-xs">
              <span className="px-3 py-1 rounded-full bg-red-950 text-red-400 border border-red-800/80 text-[11px] font-bold">
                Scan Session Disconnected
              </span>
              <h3 className="font-black text-xl text-white">Scanner Disconnected</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Disconnected from <strong className="text-slate-200">{effectiveShopName}</strong>. Unnecessary scans are prevented.
              </p>
            </div>

            <div className="w-full max-w-xs space-y-2.5 pt-2">
              <button
                type="button"
                onClick={handleReconnectSession}
                className="w-full py-3 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition cursor-pointer"
              >
                <RotateCcw className="h-4 w-4" />
                <span>Reconnect to Station</span>
              </button>

              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-2.5 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold text-xs transition cursor-pointer"
                >
                  Close Scanner
                </button>
              )}
            </div>
          </div>
        )}

        {/* Camera Error Message */}
        {cameraError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 p-6 text-center space-y-4">
            <AlertCircle className="h-10 w-10 text-amber-500" />
            <p className="text-sm font-bold text-slate-200">{cameraError}</p>
            <button
              type="button"
              onClick={initCamerasAndStart}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-extrabold text-xs text-white shadow-lg transition"
            >
              Retry Camera Permission
            </button>
          </div>
        )}

        {/* Prominent Success / Not Found Confirmation Popup Modal */}
        {scannedPopup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl p-5 text-white overflow-hidden space-y-4 animate-in zoom-in-95 duration-200">
              {/* Header Status Zone */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {scannedPopup.status === 'SUCCESS' ? (
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-lg shadow-emerald-500/10 shrink-0">
                      <CheckCircle2 className="h-7 w-7" />
                    </div>
                  ) : scannedPopup.status === 'CHECKING' ? (
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 shadow-lg shadow-indigo-500/10 shrink-0">
                      <RefreshCw className="h-6 w-6 animate-spin" />
                    </div>
                  ) : scannedPopup.status === 'OUT_OF_STOCK' ? (
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/20 text-red-400 border border-red-500/30 shadow-lg shadow-red-500/10 shrink-0">
                      <AlertCircle className="h-7 w-7" />
                    </div>
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shadow-lg shadow-amber-500/10 shrink-0">
                      <AlertCircle className="h-7 w-7" />
                    </div>
                  )}

                  <div>
                    <h3 className="text-base font-black text-white leading-tight">
                      {scannedPopup.status === 'SUCCESS'
                        ? 'Product Added!'
                        : scannedPopup.status === 'CHECKING'
                        ? 'Checking Catalog...'
                        : scannedPopup.status === 'OUT_OF_STOCK'
                        ? 'Out of Stock!'
                        : 'Product Not Found'}
                    </h3>
                    <p className={`text-xs font-medium flex items-center gap-1 mt-0.5 ${
                      scannedPopup.status === 'SUCCESS'
                        ? 'text-emerald-400'
                        : scannedPopup.status === 'CHECKING'
                        ? 'text-indigo-400'
                        : scannedPopup.status === 'OUT_OF_STOCK'
                        ? 'text-red-400'
                        : 'text-amber-400'
                    }`}>
                      <Radio className="h-3 w-3 animate-pulse" />
                      {scannedPopup.status === 'SUCCESS'
                        ? 'Live Synced to Billing Station'
                        : scannedPopup.status === 'CHECKING'
                        ? 'Verifying with Desktop Station...'
                        : scannedPopup.status === 'OUT_OF_STOCK'
                        ? 'Stock is 0 in Inventory'
                        : 'Unregistered Barcode'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleScanNext}
                  className="rounded-xl p-2 text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                  title="Close & Scan Next"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Body Content */}
              {scannedPopup.status === 'SUCCESS' && scannedPopup.product ? (
                <div className="space-y-3">
                  {/* Product Card */}
                  <div className="rounded-2xl bg-slate-950/80 border border-slate-800 p-3.5 space-y-2">
                    <div className="flex justify-between items-start gap-2">
                      <p className="text-sm font-black text-white line-clamp-2">
                        {scannedPopup.product.name}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                      <span className="inline-flex items-center gap-1 font-mono px-2 py-0.5 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 font-semibold">
                        <BarcodeIcon className="h-3 w-3 text-slate-400" />
                        {scannedPopup.barcode}
                      </span>
                      {scannedPopup.product.category && (
                        <span className="px-2 py-0.5 rounded-lg bg-indigo-950/80 text-indigo-300 border border-indigo-800/60 font-semibold">
                          {scannedPopup.product.category}
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded-lg bg-slate-800/80 text-slate-400 font-medium">
                        Stock: {scannedPopup.product.stockQty} {scannedPopup.unitName}
                      </span>
                    </div>

                    {/* Price & Quantity Adjuster */}
                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] text-slate-400 font-semibold uppercase">Unit Rate</p>
                        <p className="font-mono text-sm font-black text-emerald-400">
                          NPR {scannedPopup.unitPrice.toLocaleString()}{' '}
                          <span className="text-xs text-slate-400 font-normal">/ {scannedPopup.unitName}</span>
                        </p>
                      </div>

                      {/* Quantity Modifier Buttons */}
                      <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-xl p-1">
                        <button
                          type="button"
                          onClick={() => handlePopupQuantityChange(-1)}
                          className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-slate-800 text-slate-300 hover:text-red-400 active:scale-95 transition cursor-pointer"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="font-mono text-sm font-black text-white px-2 min-w-7 text-center">
                          {(() => {
                            const inCart = posCart.find(
                              (c) =>
                                c.product.id === scannedPopup.product?.id &&
                                c.selectedUnit === scannedPopup.unitType
                            );
                            return inCart ? inCart.quantity : scannedPopup.quantity;
                          })()}
                        </span>
                        <button
                          type="button"
                          onClick={() => handlePopupQuantityChange(1)}
                          className="h-8 w-8 rounded-lg flex items-center justify-center bg-emerald-600 hover:bg-emerald-500 text-white active:scale-95 transition cursor-pointer"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Confirmation note */}
                  <div className="rounded-xl bg-emerald-950/40 border border-emerald-500/20 p-2.5 flex items-center gap-2 text-xs text-emerald-300">
                    <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>Item added to POS billing cart. Ready for next scan.</span>
                  </div>
                </div>
              ) : scannedPopup.status === 'CHECKING' ? (
                <div className="space-y-3">
                  <div className="rounded-2xl bg-slate-950/80 border border-indigo-500/30 p-3.5 space-y-2 text-center">
                    <p className="text-sm font-bold text-slate-200">
                      Scanned Barcode: <span className="text-indigo-400 font-mono">[{scannedPopup.barcode}]</span>
                    </p>
                    <p className="text-xs text-slate-400">
                      Transmitting to Desktop Station to find product and add to cart...
                    </p>
                  </div>
                </div>
              ) : scannedPopup.status === 'OUT_OF_STOCK' && scannedPopup.product ? (
                <div className="space-y-3">
                  <div className="rounded-2xl bg-slate-950/80 border border-red-500/30 p-3.5 space-y-2">
                    <p className="text-sm font-black text-white">
                      {scannedPopup.product.name}
                    </p>
                    <p className="text-xs text-red-300">
                      Product is registered in your shop, but current stock is <strong className="font-mono">0</strong>.
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Please record a stock purchase or update inventory before billing.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="rounded-2xl bg-slate-950/80 border border-amber-500/30 p-3.5 space-y-2">
                    <p className="text-xs text-slate-300">
                      Barcode <strong className="text-amber-400 font-mono">[{scannedPopup.barcode}]</strong> is not registered in this shop.
                    </p>
                    <p className="text-[11px] text-slate-400">
                      An unstocked barcode notice was opened on the Desktop Billing Station to quickly add and price it.
                    </p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={handleScanNext}
                  className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] font-black text-sm text-white shadow-xl shadow-emerald-950 flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <Camera className="h-4 w-4" />
                  <span>Scan New Barcode</span>
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setScannedPopup(null);
                      setIsCartDrawerOpen(true);
                      setTimeout(() => {
                        isScanPausedRef.current = false;
                      }, 400);
                    }}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-[0.98] font-bold text-xs text-slate-200 border border-slate-700 flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <ShoppingCart className="h-3.5 w-3.5 text-emerald-400" />
                    <span>View Cart ({totalCartCount})</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleScanNext}
                    className="py-2.5 px-4 rounded-xl bg-slate-800/80 hover:bg-slate-700 font-bold text-xs text-slate-400 hover:text-white transition cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Floating Quick Search Bar Overlay */}
        <div className="absolute bottom-20 inset-x-4 max-w-md mx-auto z-10 space-y-2">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search or tap product without barcode..."
              className="w-full rounded-2xl border border-slate-700 bg-slate-900/90 px-4 py-2.5 pl-10 text-xs font-semibold text-white placeholder-slate-400 shadow-xl backdrop-blur-md outline-none focus:border-emerald-500"
            />
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 p-1 text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Quick Search Autocomplete Results List */}
          {filteredProducts.length > 0 && (
            <div className="max-h-48 overflow-y-auto rounded-2xl bg-slate-900/95 border border-slate-700 shadow-2xl backdrop-blur-md p-1.5 space-y-1 divide-y divide-slate-800">
              {filteredProducts.map((prod) => (
                <button
                  key={prod.id}
                  type="button"
                  onClick={() => handleQuickAddProduct(prod)}
                  className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-slate-800 text-left transition cursor-pointer"
                >
                  <div className="min-w-0 pr-2">
                    <p className="text-xs font-bold text-white truncate">{prod.name}</p>
                    <p className="text-[10px] text-slate-400 font-mono">
                      Stock: {prod.stockQty} • Barcode: {prod.barcode || prod.sku}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-mono text-xs font-bold text-emerald-400">
                      NPR {prod.unit.primarySellingPrice}
                    </span>
                    <span className="p-1 rounded-lg bg-emerald-600 text-white">
                      <Plus className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Collapsible Synced Cart Drawer & Quick Controls */}
      <div className="bg-slate-900 border-t border-slate-800 shrink-0 z-30">
        {/* Cart Drawer Header Bar */}
        <div
          onClick={() => setIsCartDrawerOpen(!isCartDrawerOpen)}
          className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-slate-800/80 transition"
        >
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <ShoppingCart className="h-5 w-5 text-emerald-400" />
              {totalCartCount > 0 && (
                <span className="absolute -top-2 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-500 px-1 text-[10px] font-black text-slate-950">
                  {totalCartCount}
                </span>
              )}
            </div>
            <div>
              <p className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>Web Cart ({totalCartCount} items)</span>
                <span className="text-[10px] text-emerald-400 font-mono font-normal">
                  • Live Synced
                </span>
              </p>
              <p className="text-[11px] font-mono text-slate-400">
                Total: <strong className="text-emerald-400 font-black">NPR {cartSubtotal.toLocaleString()}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-indigo-400">
              {isCartDrawerOpen ? 'Hide Items' : 'View Items'}
            </span>
            {isCartDrawerOpen ? (
              <ChevronDown className="h-4 w-4 text-slate-400" />
            ) : (
              <ChevronUp className="h-4 w-4 text-slate-400" />
            )}
          </div>
        </div>

        {/* Expanded Cart Item List */}
        {isCartDrawerOpen && (
          <div className="max-h-60 overflow-y-auto px-4 py-2 border-t border-slate-800 bg-slate-950/80 divide-y divide-slate-800">
            {posCart.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-500 space-y-1">
                <ShoppingCart className="h-6 w-6 mx-auto text-slate-600 opacity-60" />
                <p>Cart is currently empty.</p>
                <p className="text-[11px]">Scan any barcode above to add items!</p>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center py-1.5">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Synced Cart Items
                  </span>
                  <button
                    type="button"
                    onClick={handleClearCart}
                    className="text-[11px] text-red-400 hover:text-red-300 flex items-center gap-1 cursor-pointer font-semibold"
                  >
                    <Trash2 className="h-3 w-3" />
                    <span>Clear Cart</span>
                  </button>
                </div>

                {posCart.map((item, idx) => (
                  <div key={`${item.product.id}-${item.selectedUnit}-${idx}`} className="py-2 flex items-center justify-between">
                    <div className="min-w-0 pr-2">
                      <p className="text-xs font-bold text-white truncate">{item.product.name}</p>
                      <p className="text-[10px] text-slate-400 font-mono">
                        NPR {item.unitPrice} / {item.unitName} • Subtotal: NPR {item.totalPrice.toLocaleString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 bg-slate-900 border border-slate-700 rounded-xl p-1">
                      <button
                        type="button"
                        onClick={() => handleQuantityStep(item, -1)}
                        className="p-1 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-red-400 cursor-pointer"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="font-mono text-xs font-black text-white px-1.5 min-w-5 text-center">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleQuantityStep(item, 1)}
                        className="p-1 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-emerald-400 cursor-pointer"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {/* Manual Barcode Typing Form at bottom */}
        <form onSubmit={handleManualSubmit} className="p-3 border-t border-slate-800/80 bg-slate-900/90 flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={manualCode}
              onChange={(e) => {
                const val = e.target.value;
                setManualCode(val);
                if (/^\d{13}$/.test(val.trim())) {
                  handleBarcodeDetected(val.trim());
                  setManualCode('');
                }
              }}
              placeholder="Type barcode/SKU (e.g. 8901030701124)..."
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-mono text-white placeholder-slate-500 outline-none focus:border-emerald-500"
            />
            <Keyboard className="absolute right-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
          </div>
          <button
            type="submit"
            className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-extrabold text-white hover:bg-emerald-500 transition cursor-pointer shrink-0"
          >
            Add
          </button>
        </form>
      </div>
    </div>
  );
};
