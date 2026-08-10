import { supabase } from './supabase';

export interface SaleTransactionItem {
  productId: string;
  productName: string;
  sku?: string;
  unitName?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  selectedUnit?: 'PRIMARY' | 'SECONDARY';
}

export interface SaleTransactionPayload {
  storeId: string;
  customerName: string;
  customerPhone?: string;
  items: SaleTransactionItem[];
  subtotal: number;
  discount: number;
  taxAmount: number;
  netAmount: number;
  paidAmount: number;
  splitPayment: {
    cash?: number;
    qr?: number;
    udharo?: number;
    advance?: number;
    bank?: number;
  };
  cashierName?: string;
}

export interface PurchaseTransactionItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface PurchaseTransactionPayload {
  storeId: string;
  supplierName: string;
  supplierPhone?: string;
  items: PurchaseTransactionItem[];
  totalAmount: number;
  paidAmount: number;
  paymentMode: 'CASH' | 'QR' | 'BANK' | 'UDHARO' | 'PARTIAL';
  note?: string;
  performedBy?: string;
}

/**
 * Execute Sale Transaction atomically via Supabase Stored Procedure
 */
export async function executeSaleTransaction(payload: SaleTransactionPayload) {
  try {
    const { data, error } = await supabase.rpc('process_sale_transaction', {
      p_store_id: payload.storeId,
      p_customer_name: payload.customerName || 'Walk-in Customer',
      p_customer_phone: payload.customerPhone || 'N/A',
      p_items: payload.items,
      p_subtotal: payload.subtotal,
      p_discount: payload.discount,
      p_tax_amount: payload.taxAmount,
      p_net_amount: payload.netAmount,
      p_paid_amount: payload.paidAmount,
      p_split_payment: payload.splitPayment,
      p_cashier_name: payload.cashierName || 'Store Staff',
    });

    if (error) {
      console.warn('[RPC Sale Failed]:', error.message);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err: any) {
    console.error('[RPC Sale Error]:', err);
    return { success: false, error: err.message || 'Transaction failed' };
  }
}

/**
 * Execute Purchase Transaction atomically via Supabase Stored Procedure
 */
export async function executePurchaseTransaction(payload: PurchaseTransactionPayload) {
  try {
    const { data, error } = await supabase.rpc('process_purchase_transaction', {
      p_store_id: payload.storeId,
      p_supplier_name: payload.supplierName || 'General Supplier',
      p_supplier_phone: payload.supplierPhone || 'N/A',
      p_items: payload.items,
      p_total_amount: payload.totalAmount,
      p_paid_amount: payload.paidAmount,
      p_payment_mode: payload.paymentMode,
      p_note: payload.note || '',
      p_performed_by: payload.performedBy || 'Store Owner',
    });

    if (error) {
      console.warn('[RPC Purchase Failed]:', error.message);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err: any) {
    console.error('[RPC Purchase Error]:', err);
    return { success: false, error: err.message || 'Transaction failed' };
  }
}
