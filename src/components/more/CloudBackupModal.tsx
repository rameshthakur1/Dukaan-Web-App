import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Cloud,
  Download,
  Upload,
  RefreshCw,
  Database,
  CheckCircle2,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
  Copy,
  Check,
  Code,
  Zap,
} from 'lucide-react';

const SUPABASE_SQL_SCRIPT = `-- =========================================================================
-- DUKAAN / RETAIL STORE POS - COMPLETE SUPABASE DATABASE SCHEMA SETUP
-- Run this in Supabase SQL Editor to enable 100% live database recording
-- =========================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. INVOICES & SALES
CREATE TABLE IF NOT EXISTS public.invoices (
  id TEXT PRIMARY KEY,
  invoice_no TEXT,
  customer_id TEXT,
  customer_name TEXT,
  customer_phone TEXT,
  items JSONB,
  subtotal NUMERIC,
  discount NUMERIC,
  tax_amount NUMERIC,
  net_amount NUMERIC,
  split_payment JSONB,
  payment_status TEXT,
  cashier_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  shop_code TEXT,
  user_id TEXT,
  synced_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.sales (
  id TEXT PRIMARY KEY,
  invoice_no TEXT,
  customer_id TEXT,
  customer_name TEXT,
  customer_phone TEXT,
  items JSONB,
  subtotal NUMERIC,
  discount NUMERIC,
  tax_amount NUMERIC,
  net_amount NUMERIC,
  split_payment JSONB,
  payment_status TEXT,
  cashier_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  shop_code TEXT,
  user_id TEXT,
  synced_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. PURCHASES
CREATE TABLE IF NOT EXISTS public.purchases (
  id TEXT PRIMARY KEY,
  purchase_no TEXT,
  supplier_id TEXT,
  supplier_name TEXT,
  invoice_ref TEXT,
  items JSONB,
  total_amount NUMERIC,
  cash_paid NUMERIC,
  supplier_credit NUMERIC,
  purchase_date TEXT,
  notes TEXT,
  performed_by TEXT,
  shop_code TEXT,
  user_id TEXT,
  synced_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. CUSTOMERS
CREATE TABLE IF NOT EXISTS public.customers (
  id TEXT PRIMARY KEY,
  name TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  pan_vat TEXT,
  credit_limit NUMERIC,
  total_purchases NUMERIC,
  current_balance NUMERIC,
  advance_balance NUMERIC,
  last_purchase_date TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  shop_code TEXT,
  user_id TEXT,
  synced_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. SUPPLIERS
CREATE TABLE IF NOT EXISTS public.suppliers (
  id TEXT PRIMARY KEY,
  name TEXT,
  company_name TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  pan_vat TEXT,
  total_purchased NUMERIC,
  pending_payable NUMERIC,
  advance_balance NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  shop_code TEXT,
  user_id TEXT,
  synced_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. KHATA TRANSACTIONS
CREATE TABLE IF NOT EXISTS public.khata_transactions (
  id TEXT PRIMARY KEY,
  entity_type TEXT,
  entity_id TEXT,
  entity_name TEXT,
  type TEXT,
  amount NUMERIC,
  payment_method TEXT,
  reference_invoice_id TEXT,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  balance_after NUMERIC,
  performed_by TEXT,
  shop_code TEXT,
  user_id TEXT,
  synced_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. PRODUCTS
CREATE TABLE IF NOT EXISTS public.products (
  id TEXT PRIMARY KEY,
  sku TEXT,
  barcode TEXT,
  carton_barcode TEXT,
  name TEXT,
  category TEXT,
  stock_qty NUMERIC,
  min_stock_alert NUMERIC,
  unit TEXT,
  supplier_id TEXT,
  supplier_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  shop_code TEXT,
  user_id TEXT,
  synced_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. EXPENSES
CREATE TABLE IF NOT EXISTS public.expenses (
  id TEXT PRIMARY KEY,
  expense_no TEXT,
  category TEXT,
  title TEXT,
  amount NUMERIC,
  payment_method TEXT,
  paid_to TEXT,
  notes TEXT,
  expense_date TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  shop_code TEXT,
  user_id TEXT,
  synced_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. REGISTERED USERS
CREATE TABLE IF NOT EXISTS public.registered_users (
  id TEXT PRIMARY KEY,
  username TEXT,
  password TEXT,
  email TEXT,
  phone TEXT,
  name TEXT,
  role TEXT,
  shop_name TEXT,
  shop_code TEXT,
  status TEXT,
  subscription_plan TEXT,
  user_payload JSONB,
  synced_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. STORE SNAPSHOTS BACKUP
CREATE TABLE IF NOT EXISTS public.store_snapshots (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  shop_code TEXT,
  shop_name TEXT,
  shop_profile JSONB,
  registered_users JSONB,
  sales_invoices JSONB,
  stock_purchases JSONB,
  customers JSONB,
  suppliers JSONB,
  khata_transactions JSONB,
  products JSONB,
  expenses JSONB,
  last_synced_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. SUPPLIER ADVANCE PAYMENTS
CREATE TABLE IF NOT EXISTS public.supplier_advance_payments (
  id TEXT PRIMARY KEY,
  supplier_id TEXT,
  supplier_name TEXT,
  amount NUMERIC,
  payment_method TEXT,
  payment_date TEXT,
  notes TEXT,
  recorded_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  shop_code TEXT,
  user_id TEXT,
  synced_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. ACTIVITY & AUDIT LOGS
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  shop_code TEXT,
  shop_name TEXT,
  action_type TEXT,
  performed_by TEXT,
  performed_by_role TEXT,
  store_branch TEXT,
  details TEXT,
  amount NUMERIC DEFAULT 0,
  timestamp TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  shop_code TEXT,
  shop_name TEXT,
  action_type TEXT,
  performed_by TEXT,
  performed_by_role TEXT,
  store_branch TEXT,
  details TEXT,
  amount NUMERIC DEFAULT 0,
  timestamp TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. ITEMIZE & RETURN TABLES
CREATE TABLE IF NOT EXISTS public.invoice_items (
  id TEXT PRIMARY KEY,
  invoice_id TEXT,
  invoice_no TEXT,
  product_id TEXT,
  product_name TEXT,
  quantity NUMERIC,
  unit_price NUMERIC,
  subtotal NUMERIC,
  discount NUMERIC,
  total_amount NUMERIC,
  shop_code TEXT,
  user_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  synced_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.purchase_items (
  id TEXT PRIMARY KEY,
  purchase_id TEXT,
  purchase_no TEXT,
  product_id TEXT,
  product_name TEXT,
  quantity NUMERIC,
  purchase_price NUMERIC,
  subtotal NUMERIC,
  total_amount NUMERIC,
  shop_code TEXT,
  user_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  synced_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.sales_returns (
  id TEXT PRIMARY KEY,
  return_no TEXT,
  invoice_id TEXT,
  invoice_no TEXT,
  customer_id TEXT,
  customer_name TEXT,
  items JSONB,
  total_refund_amount NUMERIC,
  refund_method TEXT,
  reason TEXT,
  return_date TEXT,
  recorded_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  shop_code TEXT,
  user_id TEXT,
  synced_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.purchase_returns (
  id TEXT PRIMARY KEY,
  return_no TEXT,
  purchase_id TEXT,
  purchase_no TEXT,
  supplier_id TEXT,
  supplier_name TEXT,
  items JSONB,
  total_refund_amount NUMERIC,
  refund_method TEXT,
  reason TEXT,
  return_date TEXT,
  recorded_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  shop_code TEXT,
  user_id TEXT,
  synced_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.customer_advance_payments (
  id TEXT PRIMARY KEY,
  customer_id TEXT,
  customer_name TEXT,
  customer_phone TEXT,
  amount NUMERIC,
  payment_method TEXT,
  payment_date TEXT,
  notes TEXT,
  recorded_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  shop_code TEXT,
  user_id TEXT,
  synced_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.shop_profiles (
  id TEXT PRIMARY KEY,
  shop_name TEXT,
  shop_code TEXT,
  owner_name TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  pan_vat_no TEXT,
  logo_url TEXT,
  tax_rate NUMERIC,
  currency TEXT,
  invoice_header_note TEXT,
  invoice_footer_note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  user_id TEXT,
  synced_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. FALLBACK & ALIAS TABLES
CREATE TABLE IF NOT EXISTS public.stock_purchases (
  id TEXT PRIMARY KEY,
  purchase_no TEXT,
  supplier_id TEXT,
  supplier_name TEXT,
  invoice_ref TEXT,
  items JSONB,
  total_amount NUMERIC,
  cash_paid NUMERIC,
  supplier_credit NUMERIC,
  purchase_date TEXT,
  notes TEXT,
  performed_by TEXT,
  shop_code TEXT,
  user_id TEXT,
  synced_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.app_users (
  id TEXT PRIMARY KEY,
  username TEXT,
  password TEXT,
  email TEXT,
  phone TEXT,
  name TEXT,
  role TEXT,
  shop_name TEXT,
  shop_code TEXT,
  status TEXT,
  subscription_plan TEXT,
  user_payload JSONB,
  synced_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.udharo_khata (
  id TEXT PRIMARY KEY,
  entity_type TEXT,
  entity_id TEXT,
  entity_name TEXT,
  type TEXT,
  amount NUMERIC,
  payment_method TEXT,
  reference_invoice_id TEXT,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  balance_after NUMERIC,
  performed_by TEXT,
  shop_code TEXT,
  user_id TEXT,
  synced_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.khata_details (
  id TEXT PRIMARY KEY,
  entity_type TEXT,
  entity_id TEXT,
  entity_name TEXT,
  type TEXT,
  amount NUMERIC,
  payment_method TEXT,
  reference_invoice_id TEXT,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  balance_after NUMERIC,
  performed_by TEXT,
  shop_code TEXT,
  user_id TEXT,
  synced_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.dukaan_store_snapshots (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  shop_code TEXT,
  shop_name TEXT,
  shop_profile JSONB,
  registered_users JSONB,
  sales_invoices JSONB,
  stock_purchases JSONB,
  customers JSONB,
  suppliers JSONB,
  khata_transactions JSONB,
  products JSONB,
  expenses JSONB,
  last_synced_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.store_backups (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  shop_code TEXT,
  shop_name TEXT,
  shop_profile JSONB,
  registered_users JSONB,
  sales_invoices JSONB,
  stock_purchases JSONB,
  customers JSONB,
  suppliers JSONB,
  khata_transactions JSONB,
  products JSONB,
  expenses JSONB,
  last_synced_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. ENSURE ALL COLUMNS EXIST ON PRE-EXISTING TABLES
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS carton_barcode TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS supplier_id TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS supplier_name TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS min_stock_alert NUMERIC;

ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS advance_balance NUMERIC;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS pan_vat TEXT;

ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS advance_balance NUMERIC;
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS pan_vat TEXT;

ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS split_payment JSONB;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS split_payment JSONB;

ALTER TABLE public.registered_users ADD COLUMN IF NOT EXISTS user_payload JSONB;
ALTER TABLE public.app_users ADD COLUMN IF NOT EXISTS user_payload JSONB;

-- 15. DISABLE ROW LEVEL SECURITY (RLS) FOR UNRESTRICTED REALTIME RECORDING
ALTER TABLE public.invoices DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_returns DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_purchases DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_returns DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_advance_payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_advance_payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.khata_transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.udharo_khata DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.khata_details DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.registered_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_snapshots DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.dukaan_store_snapshots DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_backups DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs DISABLE ROW LEVEL SECURITY;

-- 16. GRANT FULL READ/WRITE/UPDATE PERMISSIONS TO ALL ROLES
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
`;

export const CloudBackupModal: React.FC = () => {
  const {
    cloudBackup,
    triggerCloudBackup,
    exportDataToJson,
    importDataFromJson,
    resetToDefaultDemoData,
    shopProfile,
  } = useApp();

  const [importNotice, setImportNotice] = useState<string | null>(null);
  const [jsonInputText, setJsonInputText] = useState('');
  const [copiedSql, setCopiedSql] = useState(false);

  const handleDownloadBackup = () => {
    const jsonStr = exportDataToJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Dukaan_Backup_${shopProfile.shopCode}_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCRIPT);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 3000);
  };

  const handleImportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!jsonInputText.trim()) return;

    const success = importDataFromJson(jsonInputText.trim());
    if (success) {
      setImportNotice('Cloud database successfully restored from JSON backup!');
      setJsonInputText('');
    } else {
      setImportNotice('Failed to restore. Invalid JSON file format.');
    }
    setTimeout(() => setImportNotice(null), 4000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setJsonInputText(content);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6 bg-slate-50 dark:bg-slate-950 min-h-[calc(100vh-4rem)]">
      {/* Header Banner */}
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
            <Cloud className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Live Supabase Database Sync & Cloud Backup
            </h2>
            <p className="text-xs text-slate-500">
              Instant sub-second pushing of sales, billing invoices, purchases, customers & suppliers.
            </p>
          </div>
        </div>

        <button
          onClick={triggerCloudBackup}
          className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-md transition hover:bg-emerald-700"
          id="sync-now-btn"
        >
          {cloudBackup.status === 'SYNCING' ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Zap className="h-4 w-4 text-amber-300 fill-amber-300" />
          )}
          <span>{cloudBackup.status === 'SYNCING' ? 'Pushing Data...' : 'Push All Existing Web App Data Now'}</span>
        </button>
      </div>

      {importNotice && (
        <div className="flex items-center gap-2 rounded-2xl bg-indigo-100 p-4 text-xs font-bold text-indigo-900 dark:bg-indigo-950 dark:text-indigo-200">
          <ShieldCheck className="h-5 w-5 text-indigo-600 shrink-0" />
          <span>{importNotice}</span>
        </div>
      )}

      {/* Supabase SQL Setup Instruction Box */}
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-6 dark:border-emerald-900/50 dark:bg-emerald-950/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white shrink-0">
              <Code className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                Required Supabase SQL Setup Code
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Run this SQL query once in your Supabase SQL Editor to create all tables and enable live recording.
              </p>
            </div>
          </div>

          <button
            onClick={handleCopySql}
            className="flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-800 transition"
          >
            {copiedSql ? <Check className="h-4 w-4 text-emerald-300" /> : <Copy className="h-4 w-4" />}
            <span>{copiedSql ? 'SQL Code Copied!' : 'Copy SQL Setup Script'}</span>
          </button>
        </div>

        <div className="relative rounded-xl border border-slate-300 bg-slate-900 p-4 text-[11px] font-mono text-emerald-400 overflow-x-auto max-h-48 dark:border-slate-800">
          <pre>{SUPABASE_SQL_SCRIPT}</pre>
        </div>
      </div>

      {/* Cloud Status Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs font-bold uppercase text-slate-400">Cloud Sync Status</span>
          <div className="flex items-center gap-2 mt-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h3 className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
              {cloudBackup.status === 'SYNCING' ? 'Synchronizing...' : 'Live Auto-Sync Active'}
            </h3>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Last pushed: {cloudBackup.lastBackupAt ? new Date(cloudBackup.lastBackupAt).toLocaleTimeString() : 'Just now'}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs font-bold uppercase text-slate-400">Total Web App Records</span>
          <h3 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 mt-1">
            {cloudBackup.totalRecords} Entries
          </h3>
          <p className="text-[11px] text-slate-400 mt-1">Sales, Invoices, Purchases, Customers & Suppliers</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs font-bold uppercase text-slate-400">Encrypted Storage Size</span>
          <h3 className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-1">
            {(cloudBackup.storageSizeBytes / 1024).toFixed(1)} KB
          </h3>
          <p className="text-[11px] text-slate-400 mt-1">Automated local cache & cloud mirror</p>
        </div>
      </div>

      {/* Backup & Restore Action Panels */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Export Data Panel */}
        <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
              <Download className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                Download Offline JSON Backup
              </h3>
              <p className="text-xs text-slate-500">
                Save an offline JSON snapshot of your store's entire database.
              </p>
            </div>
          </div>

          <button
            onClick={handleDownloadBackup}
            className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 font-bold text-white shadow-md transition hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-xs"
            id="download-json-backup-btn"
          >
            <Download className="h-4 w-4" />
            <span>Download Store JSON Backup File</span>
          </button>
        </div>

        {/* Restore Data Panel */}
        <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
              <Upload className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                Restore Database from Backup JSON
              </h3>
              <p className="text-xs text-slate-500">
                Upload or paste a previous JSON backup to restore all records.
              </p>
            </div>
          </div>

          <form onSubmit={handleImportSubmit} className="space-y-3">
            <input
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="w-full text-xs text-slate-500 file:mr-3 file:rounded-xl file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-slate-700 dark:file:bg-slate-800 dark:file:text-slate-200"
            />

            <textarea
              rows={2}
              value={jsonInputText}
              onChange={(e) => setJsonInputText(e.target.value)}
              placeholder="Or paste JSON backup string here..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-[11px] font-mono text-slate-800 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            />

            <button
              type="submit"
              disabled={!jsonInputText.trim()}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-900 py-2.5 font-bold text-white shadow-md transition hover:bg-slate-800 disabled:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs"
              id="restore-json-backup-btn"
            >
              <Upload className="h-4 w-4" />
              <span>Restore Database State</span>
            </button>
          </form>
        </div>
      </div>

      {/* Danger Zone: Reset Demo Data */}
      <div className="rounded-2xl border border-red-200 bg-red-50/20 p-6 shadow-2xs dark:border-red-900/40 dark:bg-red-950/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-6 w-6 text-red-500 shrink-0" />
          <div>
            <h4 className="font-bold text-red-900 dark:text-red-300 text-xs">Reset to Factory Demo Dataset</h4>
            <p className="text-[11px] text-slate-500">
              Restores initial Nepalese retail items (Wai Wai, Milk, Fortune Oil) & sample Khata ledgers.
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            if (confirm('Reset all store data to initial factory demo dataset?')) {
              resetToDefaultDemoData();
            }
          }}
          className="flex items-center gap-1.5 rounded-xl border border-red-300 bg-white px-4 py-2 text-xs font-bold text-red-700 hover:bg-red-50 dark:border-red-800 dark:bg-slate-900 dark:text-red-300"
          id="reset-demo-data-btn"
        >
          <RotateCcw className="h-4 w-4" />
          <span>Reset Demo Data</span>
        </button>
      </div>
    </div>
  );
};

