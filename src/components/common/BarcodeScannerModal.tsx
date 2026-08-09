import React, { useEffect, useState, useRef } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats, CameraDevice } from 'html5-qrcode';
import { Camera, X, Keyboard, Check, RefreshCw, AlertCircle, SwitchCamera, Zap } from 'lucide-react';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (scannedCode: string) => void;
  title?: string;
}

const SUPPORTED_BARCODE_FORMATS = [
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

// Play audio beep tone on successful detection
const playSuccessBeep = () => {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.18);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.18);
  } catch (e) {
    // Audio context not available or blocked
  }
};

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  onScanSuccess,
  title = 'Scan Product Barcode',
}) => {
  const [manualCode, setManualCode] = useState('');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string | null>(null);
  const [isScannerInitializing, setIsScannerInitializing] = useState(false);
  const [hasScanned, setHasScanned] = useState(false);

  const html5QrcodeRef = useRef<Html5Qrcode | null>(null);
  const nativeDetectorTimerRef = useRef<any>(null);
  const scannerContainerId = 'barcode-reader-container';

  const stopScanner = async () => {
    if (nativeDetectorTimerRef.current) {
      clearInterval(nativeDetectorTimerRef.current);
      nativeDetectorTimerRef.current = null;
    }
    if (html5QrcodeRef.current) {
      try {
        if (html5QrcodeRef.current.isScanning) {
          await html5QrcodeRef.current.stop();
        }
        await html5QrcodeRef.current.clear();
      } catch (err) {
        console.warn('Error clearing camera scanner:', err);
      } finally {
        html5QrcodeRef.current = null;
      }
    }
  };

  const handleDetectedCode = (rawCode: string) => {
    const cleanText = rawCode.trim();
    if (!cleanText || hasScanned) return;
    setHasScanned(true);

    playSuccessBeep();

    stopScanner().then(() => {
      onScanSuccess(cleanText);
      onClose();
    });
  };

  const startScannerWithConfig = async (cameraConfig: any) => {
    setCameraError(null);
    setIsScannerInitializing(true);
    setHasScanned(false);

    try {
      await stopScanner();

      const container = document.getElementById(scannerContainerId);
      if (!container) return;

      const html5Qrcode = new Html5Qrcode(scannerContainerId, {
        formatsToSupport: SUPPORTED_BARCODE_FORMATS,
        verbose: false,
      });
      html5QrcodeRef.current = html5Qrcode;

      // Responsive wide qrbox optimized for product 1D barcodes and QR codes
      const qrboxFunction = (viewfinderWidth: number, viewfinderHeight: number) => {
        const boxWidth = Math.min(Math.floor(viewfinderWidth * 0.88), 340);
        const boxHeight = Math.min(Math.floor(viewfinderHeight * 0.60), 200);
        return { width: Math.max(boxWidth, 200), height: Math.max(boxHeight, 120) };
      };

      await html5Qrcode.start(
        cameraConfig,
        {
          fps: 20,
          qrbox: qrboxFunction,
        },
        (decodedText) => {
          handleDetectedCode(decodedText);
        },
        () => {
          // Frame scan error - ignore silent frames
        }
      );

      setIsScannerInitializing(false);

      // Native PC Chrome BarcodeDetector overlay loop if supported for super-fast barcode detection
      if ('BarcodeDetector' in window) {
        try {
          const videoElem = container.querySelector('video') as HTMLVideoElement;
          if (videoElem) {
            const formats = [
              'ean_13',
              'ean_8',
              'code_128',
              'code_39',
              'upc_a',
              'upc_e',
              'qr_code',
              'codabar',
              'itf',
            ];
            const detector = new (window as any).BarcodeDetector({ formats });
            nativeDetectorTimerRef.current = setInterval(async () => {
              if (videoElem.readyState >= 2) {
                try {
                  const barcodes = await detector.detect(videoElem);
                  if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
                    handleDetectedCode(barcodes[0].rawValue);
                  }
                } catch (e) {
                  // Frame detection error
                }
              }
            }, 120);
          }
        } catch (e) {
          console.warn('Native BarcodeDetector loop notice:', e);
        }
      }
    } catch (err: any) {
      console.warn('Camera scan start failed with config:', cameraConfig, err);

      // Progressive fallbacks for PC / Laptop / Mobile webcams
      if (typeof cameraConfig === 'string') {
        return startScannerWithConfig({ facingMode: 'environment' });
      } else if (typeof cameraConfig === 'object' && cameraConfig.facingMode === 'environment') {
        return startScannerWithConfig({ facingMode: 'user' });
      } else if (typeof cameraConfig === 'object' && cameraConfig.facingMode === 'user') {
        return startScannerWithConfig(true as any);
      }

      setCameraError(
        'Camera access failed or permission was denied. Please allow camera access in your browser or click "Allow Camera" below.'
      );
      setIsScannerInitializing(false);
    }
  };

  const requestCameraPermissionAndStart = async () => {
    setCameraError(null);
    setIsScannerInitializing(true);

    try {
      // Step 1: Query camera devices
      const devices = await Html5Qrcode.getCameras();
      if (devices && devices.length > 0) {
        setCameras(devices);
        const backCam = devices.find(
          (d) =>
            d.label.toLowerCase().includes('back') ||
            d.label.toLowerCase().includes('rear') ||
            d.label.toLowerCase().includes('environment') ||
            d.label.toLowerCase().includes('main') ||
            d.label.toLowerCase().includes('webcam')
        );
        const chosenId = backCam ? backCam.id : devices[0].id;
        setSelectedCameraId(chosenId);
        await startScannerWithConfig(chosenId);
      } else {
        await startScannerWithConfig({ facingMode: 'environment' });
      }
    } catch (err: any) {
      console.warn('Get cameras error, falling back to camera config:', err);
      // Fallback directly to environment facing mode
      await startScannerWithConfig({ facingMode: 'environment' });
    }
  };

  useEffect(() => {
    let isMounted = true;

    if (isOpen) {
      setCameraError(null);
      setManualCode('');
      setHasScanned(false);

      const timer = setTimeout(() => {
        if (isMounted) {
          requestCameraPermissionAndStart();
        }
      }, 200);

      return () => {
        isMounted = false;
        clearTimeout(timer);
        stopScanner();
      };
    } else {
      stopScanner();
    }
  }, [isOpen]);

  const handleCameraChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const camId = e.target.value;
    setSelectedCameraId(camId);
    startScannerWithConfig(camId);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    playSuccessBeep();
    onScanSuccess(manualCode.trim());
    setManualCode('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl dark:bg-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
              <Camera className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">{title}</h3>
              <p className="text-[10px] text-slate-500 flex items-center gap-1">
                <Zap className="h-3 w-3 text-amber-500" />
                <span>PC Webcam HD Barcode Detector (EAN, Code128, QR)</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Camera Selector Dropdown (if multiple cameras exist) */}
        {cameras.length > 1 && (
          <div className="mt-3 flex items-center gap-2">
            <SwitchCamera className="h-3.5 w-3.5 text-slate-500 shrink-0" />
            <select
              value={selectedCameraId || ''}
              onChange={handleCameraChange}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 outline-none"
            >
              {cameras.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label || `Camera (${c.id.substring(0, 6)}...)`}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Camera Viewport Area */}
        <div className="my-3">
          <div className="relative overflow-hidden rounded-xl bg-slate-950 min-h-[240px] flex items-center justify-center text-slate-400 border border-slate-800 shadow-inner">
            <div id={scannerContainerId} className="w-full h-full" />

            {/* Laser scan line overlay */}
            {!isScannerInitializing && !cameraError && (
              <div className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 flex flex-col items-center justify-center">
                <div className="w-4/5 h-0.5 bg-red-500/80 shadow-[0_0_8px_rgba(239,68,68,0.9)] animate-pulse" />
              </div>
            )}

            {isScannerInitializing && !cameraError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 text-white gap-2">
                <RefreshCw className="h-6 w-6 animate-spin text-indigo-400" />
                <span className="text-xs font-medium">Opening PC camera...</span>
              </div>
            )}

            {cameraError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center bg-slate-900/95 text-slate-300 space-y-3">
                <AlertCircle className="h-8 w-8 text-amber-500" />
                <p className="text-xs font-medium text-slate-300 leading-relaxed">{cameraError}</p>
                <button
                  type="button"
                  onClick={() => requestCameraPermissionAndStart()}
                  className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 transition shadow-md"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Allow Camera & Retry</span>
                </button>
              </div>
            )}
          </div>
          <p className="text-[11px] text-center text-slate-500 dark:text-slate-400 mt-2">
            Hold product barcode steady in front of PC camera. Alignment red laser line shows scan zone.
          </p>
        </div>

        {/* Manual Barcode Typing Alternative */}
        <form onSubmit={handleManualSubmit} className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Keyboard className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Or Type Barcode / SKU / Product Code Manually:</span>
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={manualCode}
              onChange={(e) => {
                const val = e.target.value;
                setManualCode(val);
                // Auto-detect valid 13-digit EAN/UPC/GTIN barcode on typing or pasting
                if (/^\d{13}$/.test(val.trim())) {
                  playSuccessBeep();
                  onScanSuccess(val.trim());
                  setManualCode('');
                  onClose();
                }
              }}
              placeholder="e.g. 8901030701124 or PROD-1001"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-mono font-bold text-slate-900 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              autoFocus
            />
            <button
              type="submit"
              className="flex items-center gap-1 shrink-0 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-indigo-700"
            >
              <Check className="h-3.5 w-3.5" />
              <span>Apply</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

