/**
 * Utility for explicitly binding and injecting active store context into database payloads.
 * Ensures multi-store operations by Admin or Staff always record the target store's identity.
 */

export interface ActiveShopContextData {
  shopId: string;
  shopCode: string;
  shopName: string;
  ownerName: string;
  userId: string;
}

export interface InjectedShopPayload {
  shop_code: string;
  shop_name: string;
  shop_id?: string;
  user_id?: string;
  created_by?: string;
  updated_at?: string;
}

/**
 * Explicitly binds the active/target store's identity into an outgoing database payload.
 *
 * @param formData - The original form data or entity object
 * @param activeShop - The active shop context { shopCode, shopName, shopId, userId }
 * @param loggedInUserId - The user ID of the currently logged-in user or Admin performing the action
 * @returns Combined payload with explicitly assigned shop_code and shop_name
 */
export function injectActiveShopPayload<T extends Record<string, any>>(
  formData: T,
  activeShop: {
    shopCode: string;
    shopName: string;
    shopId?: string;
    userId?: string;
  },
  loggedInUserId?: string
): T & InjectedShopPayload {
  const targetShopCode = (activeShop.shopCode || '').trim() || 'SHOP-01';
  const targetShopName = (activeShop.shopName || '').trim() || 'Retail Store';
  const targetShopId = activeShop.shopId || activeShop.userId || '';
  const creatorId = loggedInUserId || targetShopId || 'anonymous';

  return {
    ...formData,
    shop_code: targetShopCode,
    shop_name: targetShopName,
    shop_id: targetShopId || undefined,
    user_id: targetShopId || undefined,
    created_by: creatorId,
    updated_at: new Date().toISOString(),
  };
}

/**
 * Returns clean camelCase and snake_case properties for dual-compatibility with React state and Supabase tables.
 */
export function getActiveStoreBindings(
  activeShop: {
    shopCode: string;
    shopName: string;
    shopId?: string;
    userId?: string;
    ownerName?: string;
  },
  loggedInUserId?: string
) {
  const shopCode = (activeShop.shopCode || '').trim() || 'SHOP-01';
  const shopName = (activeShop.shopName || '').trim() || 'Retail Store';
  const shopId = activeShop.shopId || activeShop.userId || '';
  const createdBy = loggedInUserId || shopId || 'anonymous';

  return {
    shopCode,
    shopName,
    shop_code: shopCode,
    shop_name: shopName,
    shopId,
    shop_id: shopId,
    userId: shopId,
    user_id: shopId,
    createdBy,
    created_by: createdBy,
  };
}
