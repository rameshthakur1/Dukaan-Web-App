import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { CartItem, Product } from '../types';

export interface DevicePresence {
  deviceId: string;
  deviceName: string;
  role: 'DESKTOP_POS' | 'MOBILE_SCANNER';
  lastSeen: number;
}

export interface BroadcastScanPayload {
  barcode: string;
  quantity?: number;
  selectedUnit?: 'PRIMARY' | 'SECONDARY';
  productName?: string;
  deviceId: string;
  deviceName: string;
  timestamp: number;
}

export interface BroadcastScanAckPayload {
  barcode: string;
  status: 'SUCCESS' | 'OUT_OF_STOCK' | 'NOT_FOUND';
  product?: Product | null;
  unitPrice?: number;
  unitType?: 'PRIMARY' | 'SECONDARY';
  unitName?: string;
  quantity?: number;
  targetDeviceId?: string;
  sourceDeviceId: string;
  timestamp: number;
}

export interface BroadcastCatalogSyncPayload {
  products: Product[];
  sourceDeviceId: string;
  timestamp: number;
}

export interface BroadcastCartSyncPayload {
  cart: CartItem[];
  customerName?: string;
  customerPhone?: string;
  discount?: number;
  sourceDeviceId: string;
  sourceDeviceName: string;
  timestamp: number;
}

// Generate persistent unique device ID
const getOrCreateDeviceId = (): string => {
  try {
    let id = localStorage.getItem('DUKAAN_DEVICE_ID_v1');
    if (!id) {
      const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      id = `${isMobile ? 'mob' : 'desk'}_${Math.random().toString(36).substring(2, 9)}_${Date.now().toString(36)}`;
      localStorage.setItem('DUKAAN_DEVICE_ID_v1', id);
    }
    return id;
  } catch {
    return `dev_${Math.random().toString(36).substring(2, 9)}`;
  }
};

const getDeviceName = (): string => {
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  if (/iPhone/i.test(navigator.userAgent)) return 'iPhone Scanner';
  if (/iPad/i.test(navigator.userAgent)) return 'iPad Scanner';
  if (/Android/i.test(navigator.userAgent)) return 'Android Scanner';
  if (isMobile) return 'Mobile Phone Scanner';
  return 'Desktop POS Terminal';
};

// Play audio feedback tone on barcode broadcast
export const playBroadcastBeep = (type: 'SCAN_SENT' | 'SCAN_RECEIVED' | 'CONNECT' = 'SCAN_RECEIVED') => {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    if (type === 'SCAN_RECEIVED') {
      // Crisp 2-tone chime for receiving mobile scan
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
      osc.frequency.setValueAtTime(1320, audioCtx.currentTime + 0.08); // E6
      gain.gain.setValueAtTime(0.25, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.22);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.22);
    } else if (type === 'SCAN_SENT') {
      // Sharp laser scanner beep
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1400, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.15);
    } else {
      // Connect chime
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
      osc.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.08); // E5
      osc.frequency.setValueAtTime(783.99, audioCtx.currentTime + 0.16); // G5
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.28);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.28);
    }
  } catch (e) {
    // AudioContext blocked
  }
};

export function usePOSRealtimeBroadcast(options: {
  shopCode: string;
  role: 'DESKTOP_POS' | 'MOBILE_SCANNER';
  onBarcodeReceived?: (payload: BroadcastScanPayload) => void;
  onScanAckReceived?: (payload: BroadcastScanAckPayload) => void;
  onCatalogSyncReceived?: (payload: BroadcastCatalogSyncPayload) => void;
  onRequestCatalogSyncReceived?: (sourceDeviceId: string) => void;
  onCartSyncReceived?: (payload: BroadcastCartSyncPayload) => void;
  onClearCartReceived?: (sourceDeviceId: string) => void;
  onQuantityUpdateReceived?: (payload: { productId: string; quantity: number; selectedUnit: 'PRIMARY' | 'SECONDARY' }) => void;
  onRemoveItemReceived?: (payload: { productId: string; selectedUnit: 'PRIMARY' | 'SECONDARY' }) => void;
  onCustomerSyncReceived?: (payload: { customerName: string; customerPhone: string; discount?: number }) => void;
  onDisconnectReceived?: (payload: { sourceDeviceId: string; targetDeviceId?: string; message?: string }) => void;
}) {
  const {
    shopCode,
    role,
    onBarcodeReceived,
    onScanAckReceived,
    onCatalogSyncReceived,
    onRequestCatalogSyncReceived,
    onCartSyncReceived,
    onClearCartReceived,
    onQuantityUpdateReceived,
    onRemoveItemReceived,
    onCustomerSyncReceived,
    onDisconnectReceived,
  } = options;

  const deviceId = useRef(getOrCreateDeviceId()).current;
  const deviceName = useRef(getDeviceName()).current;
  const channelRef = useRef<any>(null);

  const [isConnected, setIsConnected] = useState(false);
  const [activeDevices, setActiveDevices] = useState<DevicePresence[]>([]);
  const [lastReceivedScan, setLastReceivedScan] = useState<BroadcastScanPayload | null>(null);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);

  // Clean, consistent channel name based on shop code
  const cleanShopCode = (shopCode || 'DEFAULT_SHOP').replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
  const channelName = `pos_realtime_broadcast_${cleanShopCode}`;

  useEffect(() => {
    let isMounted = true;
    let heartbeatTimer: any = null;

    // Create Supabase Realtime Broadcast channel
    const channel = supabase.channel(channelName, {
      config: {
        broadcast: {
          self: false, // Don't receive own broadcasts
          ack: false,
        },
      },
    });

    channelRef.current = channel;

    // 1. Listen for Barcode Scan broadcasts
    channel.on('broadcast', { event: 'BARCODE_SCANNED' }, ({ payload }: { payload: BroadcastScanPayload }) => {
      if (!isMounted || payload.deviceId === deviceId) return;

      playBroadcastBeep('SCAN_RECEIVED');
      if ('vibrate' in navigator) {
        try {
          navigator.vibrate([30, 20, 30]);
        } catch {}
      }

      setLastReceivedScan(payload);
      if (onBarcodeReceived) {
        onBarcodeReceived(payload);
      }
    });

    // 1b. Listen for Scan Acknowledgement from Desktop Station
    channel.on('broadcast', { event: 'SCAN_ACK' }, ({ payload }: { payload: BroadcastScanAckPayload }) => {
      if (!isMounted) return;
      if (payload.targetDeviceId && payload.targetDeviceId !== deviceId) return;
      if (onScanAckReceived) {
        onScanAckReceived(payload);
      }
    });

    // 1c. Listen for Catalog Sync from Desktop Station
    channel.on('broadcast', { event: 'CATALOG_SYNC' }, ({ payload }: { payload: BroadcastCatalogSyncPayload }) => {
      if (!isMounted || payload.sourceDeviceId === deviceId) return;
      if (onCatalogSyncReceived) {
        onCatalogSyncReceived(payload);
      }
    });

    // 1d. Listen for Request Catalog Sync (from newly connected mobile scanners)
    channel.on('broadcast', { event: 'REQUEST_CATALOG_SYNC' }, ({ payload }: { payload: { sourceDeviceId: string } }) => {
      if (!isMounted || payload.sourceDeviceId === deviceId) return;
      if (onRequestCatalogSyncReceived) {
        onRequestCatalogSyncReceived(payload.sourceDeviceId);
      }
    });

    // 2. Listen for Full Cart Sync broadcasts
    channel.on('broadcast', { event: 'CART_STATE_SYNC' }, ({ payload }: { payload: BroadcastCartSyncPayload }) => {
      if (!isMounted || payload.sourceDeviceId === deviceId) return;
      if (onCartSyncReceived) {
        onCartSyncReceived(payload);
      }
    });

    // 3. Listen for Item Quantity Updates
    channel.on('broadcast', { event: 'ITEM_QUANTITY_UPDATE' }, ({ payload }) => {
      if (!isMounted || payload.sourceDeviceId === deviceId) return;
      if (onQuantityUpdateReceived) {
        onQuantityUpdateReceived(payload);
      }
    });

    // 4. Listen for Item Removal
    channel.on('broadcast', { event: 'ITEM_REMOVED' }, ({ payload }) => {
      if (!isMounted || payload.sourceDeviceId === deviceId) return;
      if (onRemoveItemReceived) {
        onRemoveItemReceived(payload);
      }
    });

    // 5. Listen for Cart Clear
    channel.on('broadcast', { event: 'CART_CLEARED' }, ({ payload }) => {
      if (!isMounted || payload.sourceDeviceId === deviceId) return;
      if (onClearCartReceived) {
        onClearCartReceived(payload.sourceDeviceId);
      }
    });

    // 6. Listen for Customer Info & Discount Sync
    channel.on('broadcast', { event: 'CUSTOMER_SYNC' }, ({ payload }) => {
      if (!isMounted || payload.sourceDeviceId === deviceId) return;
      if (onCustomerSyncReceived) {
        onCustomerSyncReceived(payload);
      }
    });

    // 6b. Listen for Session Disconnect
    channel.on('broadcast', { event: 'SESSION_DISCONNECTED' }, ({ payload }: { payload: { sourceDeviceId: string; targetDeviceId?: string; message?: string } }) => {
      if (!isMounted) return;
      if (payload.sourceDeviceId === deviceId) return;
      if (payload.targetDeviceId && payload.targetDeviceId !== deviceId) return;

      // Remove the disconnecting device from activeDevices
      setActiveDevices((prev) => prev.filter((d) => d.deviceId !== payload.sourceDeviceId));

      if (onDisconnectReceived) {
        onDisconnectReceived(payload);
      }
    });

    // 7. Presence / Heartbeat ping
    channel.on('broadcast', { event: 'PRESENCE_PING' }, ({ payload }: { payload: DevicePresence & { pingTime?: number } }) => {
      if (!isMounted || payload.deviceId === deviceId) return;

      // Update active devices list
      setActiveDevices((prev) => {
        const filtered = prev.filter((d) => d.deviceId !== payload.deviceId && Date.now() - d.lastSeen < 30000);
        return [...filtered, { deviceId: payload.deviceId, deviceName: payload.deviceName, role: payload.role, lastSeen: Date.now() }];
      });

      // Respond with presence pong
      channel.send({
        type: 'broadcast',
        event: 'PRESENCE_PONG',
        payload: {
          deviceId,
          deviceName,
          role,
          inResponseToPingTime: payload.pingTime,
          timestamp: Date.now(),
        },
      });
    });

    // 8. Presence Pong response
    channel.on('broadcast', { event: 'PRESENCE_PONG' }, ({ payload }) => {
      if (!isMounted || payload.deviceId === deviceId) return;

      if (payload.inResponseToPingTime) {
        const roundtrip = Math.max(1, Math.round(Date.now() - payload.inResponseToPingTime));
        setLatencyMs(roundtrip);
      }

      setActiveDevices((prev) => {
        const filtered = prev.filter((d) => d.deviceId !== payload.deviceId && Date.now() - d.lastSeen < 30000);
        return [...filtered, { deviceId: payload.deviceId, deviceName: payload.deviceName, role: payload.role, lastSeen: Date.now() }];
      });
    });

    // Subscribe to channel
    channel.subscribe((status) => {
      if (!isMounted) return;
      if (status === 'SUBSCRIBED') {
        setIsConnected(true);

        // Send initial presence ping
        channel.send({
          type: 'broadcast',
          event: 'PRESENCE_PING',
          payload: {
            deviceId,
            deviceName,
            role,
            pingTime: Date.now(),
            lastSeen: Date.now(),
          },
        });
      } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
        setIsConnected(false);
      }
    });

    // Periodic heartbeat every 8 seconds
    heartbeatTimer = setInterval(() => {
      if (channelRef.current && isConnected) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'PRESENCE_PING',
          payload: {
            deviceId,
            deviceName,
            role,
            pingTime: Date.now(),
            lastSeen: Date.now(),
          },
        });
      }

      // Prune stale devices (> 25s no heartbeat)
      setActiveDevices((prev) => prev.filter((d) => Date.now() - d.lastSeen < 25000));
    }, 8000);

    return () => {
      isMounted = false;
      if (heartbeatTimer) clearInterval(heartbeatTimer);
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [channelName, deviceId, deviceName, role]);

  // Broadcast a scanned barcode from this device
  const broadcastBarcodeScan = useCallback(
    (barcode: string, quantity: number = 1, selectedUnit: 'PRIMARY' | 'SECONDARY' = 'PRIMARY', productName?: string) => {
      if (!channelRef.current) return;

      playBroadcastBeep('SCAN_SENT');
      if ('vibrate' in navigator) {
        try {
          navigator.vibrate(40);
        } catch {}
      }

      channelRef.current.send({
        type: 'broadcast',
        event: 'BARCODE_SCANNED',
        payload: {
          barcode: barcode.trim(),
          quantity,
          selectedUnit,
          productName,
          deviceId,
          deviceName,
          timestamp: Date.now(),
        },
      });
    },
    [deviceId, deviceName]
  );

  // Broadcast entire cart state
  const broadcastCartSync = useCallback(
    (cart: CartItem[], customerInfo?: { name?: string; phone?: string; discount?: number }) => {
      if (!channelRef.current) return;

      channelRef.current.send({
        type: 'broadcast',
        event: 'CART_STATE_SYNC',
        payload: {
          cart,
          customerName: customerInfo?.name,
          customerPhone: customerInfo?.phone,
          discount: customerInfo?.discount,
          sourceDeviceId: deviceId,
          sourceDeviceName: deviceName,
          timestamp: Date.now(),
        },
      });
    },
    [deviceId, deviceName]
  );

  // Broadcast item quantity update
  const broadcastQuantityUpdate = useCallback(
    (productId: string, quantity: number, selectedUnit: 'PRIMARY' | 'SECONDARY') => {
      if (!channelRef.current) return;

      channelRef.current.send({
        type: 'broadcast',
        event: 'ITEM_QUANTITY_UPDATE',
        payload: {
          productId,
          quantity,
          selectedUnit,
          sourceDeviceId: deviceId,
        },
      });
    },
    [deviceId]
  );

  // Broadcast item removal
  const broadcastRemoveItem = useCallback(
    (productId: string, selectedUnit: 'PRIMARY' | 'SECONDARY') => {
      if (!channelRef.current) return;

      channelRef.current.send({
        type: 'broadcast',
        event: 'ITEM_REMOVED',
        payload: {
          productId,
          selectedUnit,
          sourceDeviceId: deviceId,
        },
      });
    },
    [deviceId]
  );

  // Broadcast cart clear
  const broadcastClearCart = useCallback(() => {
    if (!channelRef.current) return;

    channelRef.current.send({
      type: 'broadcast',
      event: 'CART_CLEARED',
      payload: {
        sourceDeviceId: deviceId,
      },
    });
  }, [deviceId]);

  // Broadcast customer information and discount
  const broadcastCustomerSync = useCallback(
    (customerName: string, customerPhone: string, discount?: number) => {
      if (!channelRef.current) return;

      channelRef.current.send({
        type: 'broadcast',
        event: 'CUSTOMER_SYNC',
        payload: {
          customerName,
          customerPhone,
          discount,
          sourceDeviceId: deviceId,
        },
      });
    },
    [deviceId]
  );

  // Broadcast scan acknowledgement with product details back to mobile scanner
  const broadcastScanAck = useCallback(
    (ack: {
      barcode: string;
      status: 'SUCCESS' | 'OUT_OF_STOCK' | 'NOT_FOUND';
      product?: Product | null;
      unitPrice?: number;
      unitType?: 'PRIMARY' | 'SECONDARY';
      unitName?: string;
      quantity?: number;
      targetDeviceId?: string;
    }) => {
      if (!channelRef.current) return;

      channelRef.current.send({
        type: 'broadcast',
        event: 'SCAN_ACK',
        payload: {
          ...ack,
          sourceDeviceId: deviceId,
          timestamp: Date.now(),
        },
      });
    },
    [deviceId]
  );

  // Broadcast product catalog to connected mobile devices
  const broadcastCatalogSync = useCallback(
    (catalogProducts: Product[]) => {
      if (!channelRef.current) return;

      channelRef.current.send({
        type: 'broadcast',
        event: 'CATALOG_SYNC',
        payload: {
          products: catalogProducts,
          sourceDeviceId: deviceId,
          timestamp: Date.now(),
        },
      });
    },
    [deviceId]
  );

  // Request fresh catalog from Desktop POS (used by mobile scanners upon connection)
  const requestCatalogSync = useCallback(() => {
    if (!channelRef.current) return;

    channelRef.current.send({
      type: 'broadcast',
      event: 'REQUEST_CATALOG_SYNC',
      payload: {
        sourceDeviceId: deviceId,
        timestamp: Date.now(),
      },
    });
  }, [deviceId]);

  // Send a test ping chime to verify connection
  const sendTestChime = useCallback(() => {
    if (!channelRef.current) return;
    channelRef.current.send({
      type: 'broadcast',
      event: 'PRESENCE_PING',
      payload: {
        deviceId,
        deviceName,
        role,
        pingTime: Date.now(),
        lastSeen: Date.now(),
      },
    });
  }, [deviceId, deviceName, role]);

  // Broadcast intentional disconnection to peer devices
  const broadcastDisconnect = useCallback(
    (targetDeviceId?: string, message?: string) => {
      if (!channelRef.current) return;
      channelRef.current.send({
        type: 'broadcast',
        event: 'SESSION_DISCONNECTED',
        payload: {
          sourceDeviceId: deviceId,
          targetDeviceId,
          message: message || 'Session disconnected by user',
          timestamp: Date.now(),
        },
      });
    },
    [deviceId]
  );

  return {
    isConnected,
    deviceId,
    deviceName,
    channelName,
    activeDevices,
    latencyMs,
    lastReceivedScan,
    broadcastBarcodeScan,
    broadcastScanAck,
    broadcastCatalogSync,
    requestCatalogSync,
    broadcastCartSync,
    broadcastQuantityUpdate,
    broadcastRemoveItem,
    broadcastClearCart,
    broadcastCustomerSync,
    sendTestChime,
    broadcastDisconnect,
  };
}
