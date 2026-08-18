import { useState, useEffect, useRef, useCallback, useMemo, Dispatch, SetStateAction } from 'react';
import { supabase } from '../lib/supabase';

export interface UseSmoothDataFetchOptions<T extends { id: string }> {
  /** Supabase table name to query and subscribe to (e.g. 'invoices', 'products') */
  tableName: string;
  /** Multi-tenant shop code to filter remote rows (e.g. 'SHOP-01') */
  shopCode?: string;
  /** Secondary shop name fallback for matching records */
  shopName?: string;
  /** Initial fallback / cached data (prevents initial skeleton if cache is warm) */
  initialData?: T[];
  /** Custom data fetcher function. If omitted, queries Supabase table directly */
  fetcher?: (options: { shopCode?: string; shopName?: string }) => Promise<T[]>;
  /** Parser function to transform raw database record into entity type T */
  parser?: (row: any) => T;
  /** Enable Supabase Realtime Postgres Changes subscription. Defaults to true */
  realtime?: boolean;
  /** Stale time in milliseconds before background revalidation is needed (default: 30s) */
  staleTimeMs?: number;
  /** Silently revalidate when user refocuses the browser window. Defaults to true */
  revalidateOnFocus?: boolean;
  /** Silently revalidate when device reconnects to network. Defaults to true */
  revalidateOnReconnect?: boolean;
  /** Optional background polling interval in ms (0 = disabled, real-time preferred) */
  revalidateInterval?: number;
  /** Duration in ms to mark updated/added rows for visual transitions (default: 2500ms) */
  highlightDurationMs?: number;
  /** Custom equality checker to prevent redundant state re-renders */
  isEqual?: (a: T, b: T) => boolean;
}

export interface UseSmoothDataFetchResult<T extends { id: string }> {
  /** The current live dataset. Stays pinned on screen during background refetches */
  data: T[];
  /** True strictly during the very first load when no data exists in cache/state */
  isInitialLoading: boolean;
  /** True whenever a background query/revalidation is executing */
  isFetching: boolean;
  /** Error object if the last query failed (previous data is retained) */
  error: Error | null;
  /** Last successful fetch timestamp */
  lastFetchedAt: Date | null;
  /** Set of item IDs that were recently inserted or updated */
  recentUpdatedIds: Set<string>;
  /** Checks if a specific row was recently inserted or updated */
  isRowHighlighted: (id: string) => boolean;
  /** Returns Tailwind transition classes for smooth highlight effects on rows */
  getRowTransitionClass: (id: string, baseClass?: string) => string;
  /** Trigger silent background refetch without resetting state or showing full loaders */
  refetch: (options?: { silent?: boolean }) => Promise<T[]>;
  /** In-place item insertion (replaces existing if same ID, or adds to start) */
  insertItem: (item: T, position?: 'start' | 'end') => void;
  /** In-place item update by immutable ID without full array reallocation */
  updateItem: (id: string, updater: Partial<T> | ((prevItem: T) => T)) => void;
  /** In-place item deletion by immutable ID */
  deleteItem: (id: string) => void;
  /** Direct state setter */
  setData: Dispatch<SetStateAction<T[]>>;
}

/**
 * Custom React hook providing smooth, jitter-free data fetching & Supabase Realtime synchronization.
 * 
 * Rules enforced:
 * 1. Separate Loading States: `isInitialLoading` for initial skeleton, `isFetching` for background updates.
 * 2. Stale-While-Revalidate: Existing data remains visible while new data resolves in background.
 * 3. In-Place Delta Reconciliation: Merges Realtime INSERT, UPDATE, DELETE events into state.
 * 4. DOM Stability: Preserves array references and row keys (`item.id`) with transition helpers.
 */
export function useSmoothDataFetch<T extends { id: string }>(
  options: UseSmoothDataFetchOptions<T>
): UseSmoothDataFetchResult<T> {
  const {
    tableName,
    shopCode,
    shopName,
    initialData = [],
    fetcher,
    parser,
    realtime = true,
    staleTimeMs = 30000,
    revalidateOnFocus = true,
    revalidateOnReconnect = true,
    revalidateInterval = 0,
    highlightDurationMs = 2500,
    isEqual,
  } = options;

  // Primary data state: initialized with initialData (if provided)
  const [data, setData] = useState<T[]>(() => initialData);

  // Loading states: separated cleanly
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(() => initialData.length === 0);
  const [isFetching, setIsFetching] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastFetchedAt, setLastFetchedAt] = useState<Date | null>(null);

  // Set of recently modified/added item IDs for smooth Tailwind CSS animations
  const [recentUpdatedIds, setRecentUpdatedIds] = useState<Set<string>>(new Set());

  // Refs for tracking mounted state, active requests, and highlighting timeouts
  const isMountedRef = useRef<boolean>(true);
  const isFetchingRef = useRef<boolean>(false);
  const lastFetchedRef = useRef<number>(0);
  const highlightTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // Mark an ID as recently updated with automatic cleanup timer
  const triggerRowHighlight = useCallback((id: string) => {
    if (!id) return;
    
    // Clear existing timer if any
    const existingTimer = highlightTimersRef.current.get(id);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    setRecentUpdatedIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });

    const timer = setTimeout(() => {
      if (!isMountedRef.current) return;
      setRecentUpdatedIds((prev) => {
        if (!prev.has(id)) return prev;
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      highlightTimersRef.current.delete(id);
    }, highlightDurationMs);

    highlightTimersRef.current.set(id, timer);
  }, [highlightDurationMs]);

  // Default deep/shallow equality comparator for records
  const defaultIsEqual = useCallback((a: T, b: T): boolean => {
    if (isEqual) return isEqual(a, b);
    if (a === b) return true;
    if (a.id !== b.id) return false;
    const aObj = a as Record<string, any>;
    const bObj = b as Record<string, any>;
    return (
      aObj.updatedAt === bObj.updatedAt &&
      aObj.stockQty === bObj.stockQty &&
      aObj.currentBalance === bObj.currentBalance &&
      aObj.netAmount === bObj.netAmount &&
      aObj.totalAmount === bObj.totalAmount &&
      aObj.amount === bObj.amount &&
      aObj.paymentStatus === bObj.paymentStatus
    );
  }, [isEqual]);

  // Default Supabase query fetcher
  const defaultFetcher = useCallback(async (): Promise<T[]> => {
    let query = supabase.from(tableName).select('*');
    if (shopCode && shopCode !== 'N/A') {
      query = query.eq('shop_code', shopCode);
    }

    const { data: rows, error: queryError } = await query;
    if (queryError) throw queryError;
    if (!rows) return [];

    if (parser) {
      return rows.map(parser);
    }
    return rows as unknown as T[];
  }, [tableName, shopCode, parser]);

  // Smooth data fetch execution with Stale-While-Revalidate semantics
  const executeFetch = useCallback(
    async (options?: { silent?: boolean }): Promise<T[]> => {
      if (isFetchingRef.current) return data;
      if (typeof navigator !== 'undefined' && !navigator.onLine) return data;

      const silent = options?.silent ?? (data.length > 0);

      isFetchingRef.current = true;
      if (isMountedRef.current) {
        setIsFetching(true);
        if (!silent && data.length === 0) {
          setIsInitialLoading(true);
        }
      }

      try {
        const fetchFn = fetcher ? () => fetcher({ shopCode, shopName }) : defaultFetcher;
        const freshRecords = await fetchFn();

        if (isMountedRef.current) {
          setData((prev) => {
            // Intelligent delta merge: preserve existing object references if unchanged
            if (prev.length === 0) return freshRecords;

            const freshMap = new Map<string, T>();
            for (const item of freshRecords) {
              if (item?.id) freshMap.set(String(item.id), item);
            }

            let hasChanged = false;
            const merged: T[] = [];
            const processedIds = new Set<string>();

            // 1. Reconcile existing records in their original order
            for (const existing of prev) {
              const fresh = freshMap.get(existing.id);
              if (fresh) {
                processedIds.add(existing.id);
                if (defaultIsEqual(existing, fresh)) {
                  merged.push(existing); // Keep identical object reference
                } else {
                  merged.push(fresh);
                  hasChanged = true;
                  triggerRowHighlight(fresh.id);
                }
              } else {
                // Item might have been deleted remotely
                hasChanged = true;
              }
            }

            // 2. Append new incoming records that weren't in previous state
            for (const fresh of freshRecords) {
              if (!processedIds.has(fresh.id)) {
                merged.unshift(fresh); // Place new items on top
                hasChanged = true;
                triggerRowHighlight(fresh.id);
              }
            }

            return hasChanged ? merged : prev;
          });

          setError(null);
          const now = new Date();
          setLastFetchedAt(now);
          lastFetchedRef.current = now.getTime();
        }

        return freshRecords;
      } catch (err: any) {
        if (isMountedRef.current) {
          setError(err instanceof Error ? err : new Error(String(err)));
        }
        return data;
      } finally {
        isFetchingRef.current = false;
        if (isMountedRef.current) {
          setIsFetching(false);
          setIsInitialLoading(false);
        }
      }
    },
    [data, fetcher, defaultFetcher, shopCode, shopName, defaultIsEqual, triggerRowHighlight]
  );

  // In-place item insertion
  const insertItem = useCallback((item: T, position: 'start' | 'end' = 'start') => {
    if (!item?.id) return;
    setData((prev) => {
      const idx = prev.findIndex((x) => x.id === item.id);
      if (idx >= 0) {
        if (defaultIsEqual(prev[idx], item)) return prev;
        const next = [...prev];
        next[idx] = item;
        return next;
      }
      return position === 'start' ? [item, ...prev] : [...prev, item];
    });
    triggerRowHighlight(item.id);
  }, [defaultIsEqual, triggerRowHighlight]);

  // In-place item update
  const updateItem = useCallback(
    (id: string, updater: Partial<T> | ((prevItem: T) => T)) => {
      if (!id) return;
      setData((prev) => {
        const idx = prev.findIndex((x) => x.id === id);
        if (idx === -1) return prev;
        const current = prev[idx];
        const updated = typeof updater === 'function' ? updater(current) : { ...current, ...updater };
        if (defaultIsEqual(current, updated)) return prev;
        const next = [...prev];
        next[idx] = updated;
        return next;
      });
      triggerRowHighlight(id);
    },
    [defaultIsEqual, triggerRowHighlight]
  );

  // In-place item deletion
  const deleteItem = useCallback((id: string) => {
    if (!id) return;
    setData((prev) => prev.filter((x) => x.id !== id));
  }, []);

  // Helper checking if a row is highlighted
  const isRowHighlighted = useCallback(
    (id: string): boolean => {
      return recentUpdatedIds.has(id);
    },
    [recentUpdatedIds]
  );

  // Helper returning smooth transition styling
  const getRowTransitionClass = useCallback(
    (id: string, baseClass: string = ''): string => {
      const isHighlighted = recentUpdatedIds.has(id);
      const highlightStyles = isHighlighted
        ? 'ring-2 ring-emerald-500/40 bg-emerald-50/60 dark:bg-emerald-950/30'
        : 'bg-transparent';
      return `${baseClass} transition-all duration-300 ease-in-out ${highlightStyles}`.trim();
    },
    [recentUpdatedIds]
  );

  // 1. Initial Load & Stale Check Effect
  useEffect(() => {
    isMountedRef.current = true;
    const now = Date.now();
    const isCacheStale = now - lastFetchedRef.current > staleTimeMs;

    if (data.length === 0 || isCacheStale) {
      executeFetch({ silent: data.length > 0 });
    }

    return () => {
      isMountedRef.current = false;
      highlightTimersRef.current.forEach((t) => clearTimeout(t));
      highlightTimersRef.current.clear();
    };
  }, [tableName, shopCode]);

  // 2. Window Focus & Reconnect Listeners for Silent Revalidation
  useEffect(() => {
    const handleFocus = () => {
      if (revalidateOnFocus && navigator.onLine) {
        const isCacheStale = Date.now() - lastFetchedRef.current > staleTimeMs;
        if (isCacheStale) {
          executeFetch({ silent: true });
        }
      }
    };

    const handleOnline = () => {
      if (revalidateOnReconnect) {
        executeFetch({ silent: true });
      }
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('online', handleOnline);
    };
  }, [revalidateOnFocus, revalidateOnReconnect, staleTimeMs, executeFetch]);

  // 3. Optional Background Polling (Silent)
  useEffect(() => {
    if (!revalidateInterval || revalidateInterval <= 0) return;

    const intervalId = setInterval(() => {
      if (navigator.onLine && !isFetchingRef.current) {
        executeFetch({ silent: true });
      }
    }, revalidateInterval);

    return () => clearInterval(intervalId);
  }, [revalidateInterval, executeFetch]);

  // 4. Supabase Realtime Postgres Changes Subscription
  useEffect(() => {
    if (!realtime || typeof window === 'undefined') return;

    const channelName = `smooth-sync-${tableName}-${shopCode || 'all'}-${Date.now()}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: tableName },
        (payload) => {
          const { eventType, new: newRecord, old: oldRecord } = payload;
          const record = (newRecord as any) || (oldRecord as any);
          if (!record) return;

          // Tenant isolation filter
          if (shopCode && record.shop_code && record.shop_code !== shopCode) {
            return;
          }

          const recordId = String((newRecord as any)?.id || (oldRecord as any)?.id || '');
          if (!recordId) return;

          if (eventType === 'DELETE') {
            deleteItem(recordId);
          } else if (eventType === 'INSERT' || eventType === 'UPDATE') {
            const mappedItem: T = parser ? parser(newRecord) : (newRecord as unknown as T);
            if (eventType === 'INSERT') {
              insertItem(mappedItem, 'start');
            } else {
              updateItem(recordId, mappedItem);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tableName, shopCode, realtime, parser, insertItem, updateItem, deleteItem]);

  return {
    data,
    isInitialLoading,
    isFetching,
    error,
    lastFetchedAt,
    recentUpdatedIds,
    isRowHighlighted,
    getRowTransitionClass,
    refetch: executeFetch,
    insertItem,
    updateItem,
    deleteItem,
    setData,
  };
}
