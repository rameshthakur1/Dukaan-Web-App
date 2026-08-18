import { supabase } from '../lib/supabase';

export interface QueuedOfflineMutation {
  id: string;
  tableName: string;
  action: 'UPSERT' | 'DELETE';
  payload: any;
  shopCode: string;
  shopName: string;
  timestamp: string;
  retryCount: number;
}

const OFFLINE_QUEUE_KEY = 'dukaan_offline_sync_queue_v1';

/**
 * Retrieves the pending offline mutations queue from local storage.
 */
export function getOfflineSyncQueue(): QueuedOfflineMutation[] {
  try {
    const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Saves the offline queue to local storage.
 */
export function saveOfflineSyncQueue(queue: QueuedOfflineMutation[]): void {
  try {
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  } catch (e) {
    console.error('Failed to persist offline sync queue:', e);
  }
}

/**
 * Enqueues a mutation to be synchronized when back online.
 */
export function enqueueOfflineMutation(
  tableName: string,
  payload: any,
  action: 'UPSERT' | 'DELETE' = 'UPSERT',
  shopCode: string = 'SHOP-01',
  shopName: string = 'Retail Store'
): void {
  const id = String(payload?.id || payload?.invoiceNo || payload?.purchaseNo || `MUT-${Date.now()}`);
  const queue = getOfflineSyncQueue();

  // Deduplicate if mutation for same entity already exists
  const existingIdx = queue.findIndex((m) => m.id === id && m.tableName === tableName);
  const mutation: QueuedOfflineMutation = {
    id,
    tableName,
    action,
    payload,
    shopCode,
    shopName,
    timestamp: new Date().toISOString(),
    retryCount: 0,
  };

  if (existingIdx > -1) {
    queue[existingIdx] = mutation;
  } else {
    queue.push(mutation);
  }

  saveOfflineSyncQueue(queue);
}

/**
 * Processes all pending offline mutations and pushes them to Supabase database.
 * Returns the number of successfully synchronized items.
 */
export async function flushOfflineSyncQueue(): Promise<{ successCount: number; failedCount: number }> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return { successCount: 0, failedCount: 0 };
  }

  const queue = getOfflineSyncQueue();
  if (queue.length === 0) return { successCount: 0, failedCount: 0 };

  const remainingQueue: QueuedOfflineMutation[] = [];
  let successCount = 0;

  for (const item of queue) {
    try {
      if (item.action === 'DELETE') {
        const { error } = await supabase.from(item.tableName).delete().eq('id', item.id);
        if (!error) {
          successCount++;
        } else {
          item.retryCount++;
          if (item.retryCount < 5) remainingQueue.push(item);
        }
      } else {
        // UPSERT
        const { error } = await supabase.from(item.tableName).upsert(item.payload, { onConflict: 'id' });
        if (!error) {
          successCount++;
        } else {
          item.retryCount++;
          if (item.retryCount < 5) remainingQueue.push(item);
        }
      }
    } catch {
      item.retryCount++;
      if (item.retryCount < 5) remainingQueue.push(item);
    }
  }

  saveOfflineSyncQueue(remainingQueue);
  return { successCount, failedCount: remainingQueue.length };
}
