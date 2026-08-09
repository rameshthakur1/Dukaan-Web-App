import { supabase } from './supabase';

// Helper to get current authenticated user's id
async function getUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) throw new Error('Not authenticated');
  return data.user.id;
}

// Generic logger
export async function logActivity(entry: {
  action_type?: string;
  action: string;
  performed_by?: string;
  performed_by_role?: string;
  store_branch?: string;
  details?: any;
  amount?: number;
}) {
  const user_id = await getUserId();
  const { data, error } = await supabase
    .from('activity_logs')
    .insert([{ user_id, ...entry }]);
  if (error) throw error;
  return data;
}

// Products / Stocks
export async function createProduct(payload: any) {
  const user_id = await getUserId();
  const now = new Date().toISOString();
  const body = { user_id, ...payload, created_at: now, updated_at: now };
  const { data, error } = await supabase.from('products').insert([body]).select();
  if (error) throw error;
  await logActivity({ action_type: 'INVENTORY_CHANGE', action: 'CREATE_PRODUCT', details: body });
  return data?.[0];
}

export async function updateProduct(id: string, updates: any) {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('products')
    .update({ ...updates, updated_at: now })
    .eq('id', id)
    .select();
  if (error) throw error;
  await logActivity({ action_type: 'INVENTORY_CHANGE', action: 'UPDATE_PRODUCT', details: { id, updates } });
  return data?.[0];
}

export async function getProducts() {
  const user_id = await getUserId();
  const { data, error } = await supabase.from('products').select('*').eq('user_id', user_id);
  if (error) throw error;
  return data;
}

// Customers
export async function createCustomer(payload: any) {
  const user_id = await getUserId();
  const body = { user_id, ...payload, created_at: new Date().toISOString() };
  const { data, error } = await supabase.from('customers').insert([body]).select();
  if (error) throw error;
  await logActivity({ action_type: 'CUSTOMER_MANAGEMENT', action: 'CREATE_CUSTOMER', details: body });
  return data?.[0];
}

export async function getCustomers() {
  const user_id = await getUserId();
  const { data, error } = await supabase.from('customers').select('*').eq('user_id', user_id);
  if (error) throw error;
  return data;
}

// Suppliers
export async function createSupplier(payload: any) {
  const user_id = await getUserId();
  const body = { user_id, ...payload, created_at: new Date().toISOString() };
  const { data, error } = await supabase.from('suppliers').insert([body]).select();
  if (error) throw error;
  await logActivity({ action_type: 'SUPPLIER_MANAGEMENT', action: 'CREATE_SUPPLIER', details: body });
  return data?.[0];
}

export async function getSuppliers() {
  const user_id = await getUserId();
  const { data, error } = await supabase.from('suppliers').select('*').eq('user_id', user_id);
  if (error) throw error;
  return data;
}

// Sales: invoices + items
export async function createSaleInvoice(invoice: any, items: any[]) {
  const user_id = await getUserId();
  const now = new Date().toISOString();
  const invoiceBody = { user_id, ...invoice, created_at: now };

  const { data: invData, error: invError } = await supabase
    .from('sales_invoices')
    .insert([invoiceBody])
    .select()
    .single();
  if (invError) throw invError;

  const saleId = invData.id;
  const itemsToInsert = items.map((it) => ({ sale_id: saleId, ...it }));
  const { data: insertedItems, error: itemsError } = await supabase
    .from('sales_items')
    .insert(itemsToInsert)
    .select();
  if (itemsError) throw itemsError;

  await logActivity({ action_type: 'SALE', action: 'CREATE_SALE', details: { invoice: invData, items: insertedItems }, amount: invoiceBody.net_amount });
  return { invoice: invData, items: insertedItems };
}

export async function getSales() {
  const user_id = await getUserId();
  const { data, error } = await supabase.from('sales_invoices').select('*, sales_items(*)').eq('user_id', user_id);
  if (error) throw error;
  return data;
}

// Purchases: invoices + items
export async function createPurchase(purchase: any, items: any[]) {
  const user_id = await getUserId();
  const now = new Date().toISOString();
  const purchaseBody = { user_id, ...purchase, purchase_date: now };

  const { data: pData, error: pError } = await supabase.from('purchases').insert([purchaseBody]).select().single();
  if (pError) throw pError;

  const purchaseId = pData.id;
  const itemsToInsert = items.map((it) => ({ purchase_id: purchaseId, ...it }));
  const { data: insertedItems, error: itemsError } = await supabase.from('purchase_items').insert(itemsToInsert).select();
  if (itemsError) throw itemsError;

  await logActivity({ action_type: 'PURCHASE', action: 'CREATE_PURCHASE', details: { purchase: pData, items: insertedItems }, amount: purchaseBody.total_amount });
  return { purchase: pData, items: insertedItems };
}

export async function getPurchases() {
  const user_id = await getUserId();
  const { data, error } = await supabase.from('purchases').select('*, purchase_items(*)').eq('user_id', user_id);
  if (error) throw error;
  return data;
}

// Advance payments (supplier / customer)
export async function createAdvancePayment(payment: any) {
  const user_id = await getUserId();
  const body = { user_id, ...payment, created_at: new Date().toISOString() };
  const { data, error } = await supabase.from('advance_payments').insert([body]).select();
  if (error) throw error;
  await logActivity({ action_type: 'ADVANCE_PAYMENT', action: 'CREATE_ADVANCE', details: body, amount: body.amount });
  return data?.[0];
}

export async function getAdvancePayments() {
  const user_id = await getUserId();
  const { data, error } = await supabase.from('advance_payments').select('*').eq('user_id', user_id);
  if (error) throw error;
  return data;
}

// Khata / Credit ledger
export async function recordKhataTransaction(txn: any) {
  const user_id = await getUserId();
  const body = { user_id, ...txn, created_at: new Date().toISOString() };
  const { data, error } = await supabase.from('khata_transactions').insert([body]).select();
  if (error) throw error;
  await logActivity({ action_type: 'KHATA_PAYMENT', action: 'RECORD_KHATA', details: body, amount: body.amount });
  return data?.[0];
}

export async function getKhataTransactions() {
  const user_id = await getUserId();
  const { data, error } = await supabase.from('khata_transactions').select('*').eq('user_id', user_id).order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

// Expenses
export async function createExpense(expense: any) {
  const user_id = await getUserId();
  const body = { user_id, ...expense, created_at: new Date().toISOString() };
  const { data, error } = await supabase.from('expenses').insert([body]).select();
  if (error) throw error;
  await logActivity({ action_type: 'EXPENSE', action: 'CREATE_EXPENSE', details: body, amount: body.amount });
  return data?.[0];
}

export async function getExpenses() {
  const user_id = await getUserId();
  const { data, error } = await supabase.from('expenses').select('*').eq('user_id', user_id).order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

// User profile
export async function upsertUserProfile(profile: any) {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) throw new Error('Not authenticated');
  const id = userData.user.id;
  const body = { id, ...profile };
  const { data, error } = await supabase.from('user_profiles').upsert([body]).select();
  if (error) throw error;
  return data?.[0];
}

export async function getUserProfile() {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) throw new Error('Not authenticated');
  const id = userData.user.id;
  const { data, error } = await supabase.from('user_profiles').select('*').eq('id', id).single();
  if (error) throw error;
  return data;
}

// Realtime subscription helper (table-level for current user)
export async function subscribeToTable(table: string, callback: (payload: any) => void) {
  const user_id = await getUserId();
  const channel = supabase
    .channel(`public:${table}:user:${user_id}`)
    .on('postgres_changes', { event: '*', schema: 'public', table, filter: `user_id=eq.${user_id}` }, (payload) => {
      callback(payload);
    })
    .subscribe();
  return channel;
}

// Export types as needed (optional)
export default {
  createProduct,
  updateProduct,
  getProducts,
  createCustomer,
  getCustomers,
  createSupplier,
  getSuppliers,
  createSaleInvoice,
  getSales,
  createPurchase,
  getPurchases,
  createAdvancePayment,
  getAdvancePayments,
  recordKhataTransaction,
  getKhataTransactions,
  createExpense,
  getExpenses,
  upsertUserProfile,
  getUserProfile,
  subscribeToTable,
  logActivity,
};
