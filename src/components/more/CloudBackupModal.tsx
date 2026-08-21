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
-- DUKAAN / RETAIL STORE POS - COMPLETE SUPABASE DATABASE SCHEMA & AUTOMATION
-- Paste this script into Supabase SQL Editor to set up tables and triggers.
-- =========================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 0. ALTER EXISTING TABLES TO GUARANTEE SHOP_NAME AND SHOP_CODE COLUMNS EXIST
ALTER TABLE IF EXISTS public.customers ADD COLUMN IF NOT EXISTS shop_name TEXT;
ALTER TABLE IF EXISTS public.customers ADD COLUMN IF NOT EXISTS shop_code TEXT;
ALTER TABLE IF EXISTS public.suppliers ADD COLUMN IF NOT EXISTS shop_name TEXT;
ALTER TABLE IF EXISTS public.suppliers ADD COLUMN IF NOT EXISTS shop_code TEXT;
ALTER TABLE IF EXISTS public.products ADD COLUMN IF NOT EXISTS shop_name TEXT;
ALTER TABLE IF EXISTS public.products ADD COLUMN IF NOT EXISTS shop_code TEXT;
ALTER TABLE IF EXISTS public.invoices ADD COLUMN IF NOT EXISTS shop_name TEXT;
ALTER TABLE IF EXISTS public.invoices ADD COLUMN IF NOT EXISTS shop_code TEXT;
ALTER TABLE IF EXISTS public.sales ADD COLUMN IF NOT EXISTS shop_name TEXT;
ALTER TABLE IF EXISTS public.sales ADD COLUMN IF NOT EXISTS shop_code TEXT;
ALTER TABLE IF EXISTS public.purchases ADD COLUMN IF NOT EXISTS shop_name TEXT;
ALTER TABLE IF EXISTS public.purchases ADD COLUMN IF NOT EXISTS shop_code TEXT;
ALTER TABLE IF EXISTS public.stock_purchases ADD COLUMN IF NOT EXISTS shop_name TEXT;
ALTER TABLE IF EXISTS public.stock_purchases ADD COLUMN IF NOT EXISTS shop_code TEXT;
ALTER TABLE IF EXISTS public.udharo_khata ADD COLUMN IF NOT EXISTS shop_name TEXT;
ALTER TABLE IF EXISTS public.udharo_khata ADD COLUMN IF NOT EXISTS shop_code TEXT;
ALTER TABLE IF EXISTS public.khata_transactions ADD COLUMN IF NOT EXISTS shop_name TEXT;
ALTER TABLE IF EXISTS public.khata_transactions ADD COLUMN IF NOT EXISTS shop_code TEXT;
ALTER TABLE IF EXISTS public.customer_advance_payments ADD COLUMN IF NOT EXISTS shop_name TEXT;
ALTER TABLE IF EXISTS public.customer_advance_payments ADD COLUMN IF NOT EXISTS shop_code TEXT;
ALTER TABLE IF EXISTS public.supplier_advance_payments ADD COLUMN IF NOT EXISTS shop_name TEXT;
ALTER TABLE IF EXISTS public.supplier_advance_payments ADD COLUMN IF NOT EXISTS shop_code TEXT;
ALTER TABLE IF EXISTS public.expenses ADD COLUMN IF NOT EXISTS shop_name TEXT;
ALTER TABLE IF EXISTS public.expenses ADD COLUMN IF NOT EXISTS shop_code TEXT;
ALTER TABLE IF EXISTS public.sales_returns ADD COLUMN IF NOT EXISTS shop_name TEXT;
ALTER TABLE IF EXISTS public.sales_returns ADD COLUMN IF NOT EXISTS shop_code TEXT;
ALTER TABLE IF EXISTS public.purchase_returns ADD COLUMN IF NOT EXISTS shop_name TEXT;
ALTER TABLE IF EXISTS public.purchase_returns ADD COLUMN IF NOT EXISTS shop_code TEXT;
ALTER TABLE IF EXISTS public.invoice_items ADD COLUMN IF NOT EXISTS shop_name TEXT;
ALTER TABLE IF EXISTS public.invoice_items ADD COLUMN IF NOT EXISTS shop_code TEXT;
ALTER TABLE IF EXISTS public.purchase_items ADD COLUMN IF NOT EXISTS shop_name TEXT;
ALTER TABLE IF EXISTS public.purchase_items ADD COLUMN IF NOT EXISTS shop_code TEXT;
ALTER TABLE IF EXISTS public.activity_logs ADD COLUMN IF NOT EXISTS shop_name TEXT;
ALTER TABLE IF EXISTS public.activity_logs ADD COLUMN IF NOT EXISTS shop_code TEXT;
ALTER TABLE IF EXISTS public.audit_logs ADD COLUMN IF NOT EXISTS shop_name TEXT;
ALTER TABLE IF EXISTS public.audit_logs ADD COLUMN IF NOT EXISTS shop_code TEXT;

ALTER TABLE IF EXISTS public.store_snapshots ADD COLUMN IF NOT EXISTS supplier_advance_payments JSONB;
ALTER TABLE IF EXISTS public.dukaan_store_snapshots ADD COLUMN IF NOT EXISTS supplier_advance_payments JSONB;
ALTER TABLE IF EXISTS public.store_backups ADD COLUMN IF NOT EXISTS supplier_advance_payments JSONB;

-- DISABLE RLS TO ALLOW OPEN API SYNC
ALTER TABLE IF EXISTS public.registered_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.app_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.suppliers DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.products DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.invoices DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.sales DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.purchases DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.stock_purchases DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.expenses DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.invoice_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.purchase_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.store_snapshots DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.store_backups DISABLE ROW LEVEL SECURITY;

-- 1. CUSTOMERS TABLE
CREATE TABLE IF NOT EXISTS public.customers (
  id TEXT PRIMARY KEY,
  name TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  tole TEXT,
  pan_vat TEXT,
  credit_limit NUMERIC DEFAULT 0,
  total_purchases NUMERIC DEFAULT 0,
  current_balance NUMERIC DEFAULT 0,
  advance_balance NUMERIC DEFAULT 0,
  last_purchase_date TEXT,
  due_date TEXT,
  due_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  shop_name TEXT,
  shop_code TEXT,
  user_id TEXT,
  synced_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. SUPPLIERS TABLE
CREATE TABLE IF NOT EXISTS public.suppliers (
  id TEXT PRIMARY KEY,
  name TEXT,
  company_name TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  pan_vat TEXT,
  total_purchased NUMERIC DEFAULT 0,
  pending_payable NUMERIC DEFAULT 0,
  advance_balance NUMERIC DEFAULT 0,
  due_date TEXT,
  due_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  shop_name TEXT,
  shop_code TEXT,
  user_id TEXT,
  synced_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. PRODUCTS / INVENTORY TABLE
CREATE TABLE IF NOT EXISTS public.products (
  id TEXT PRIMARY KEY,
  sku TEXT,
  barcode TEXT,
  carton_barcode TEXT,
  name TEXT,
  category TEXT,
  stock_qty NUMERIC DEFAULT 0,
  min_stock_alert NUMERIC DEFAULT 5,
  unit JSONB,
  supplier_id TEXT,
  supplier_name TEXT,
  rack_no TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  shop_name TEXT,
  shop_code TEXT,
  user_id TEXT,
  synced_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. SALES & INVOICES TABLES
CREATE TABLE IF NOT EXISTS public.invoices (
  id TEXT PRIMARY KEY,
  invoice_no TEXT,
  customer_id TEXT,
  customer_name TEXT,
  customer_phone TEXT,
  items JSONB,
  subtotal NUMERIC DEFAULT 0,
  discount NUMERIC DEFAULT 0,
  tax_amount NUMERIC DEFAULT 0,
  net_amount NUMERIC DEFAULT 0,
  split_payment JSONB,
  payment_status TEXT,
  cashier_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  shop_name TEXT,
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
  subtotal NUMERIC DEFAULT 0,
  discount NUMERIC DEFAULT 0,
  tax_amount NUMERIC DEFAULT 0,
  net_amount NUMERIC DEFAULT 0,
  split_payment JSONB,
  payment_status TEXT,
  cashier_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  shop_name TEXT,
  shop_code TEXT,
  user_id TEXT,
  synced_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. PURCHASES & STOCK PURCHASES TABLES
CREATE TABLE IF NOT EXISTS public.purchases (
  id TEXT PRIMARY KEY,
  purchase_no TEXT,
  supplier_id TEXT,
  supplier_name TEXT,
  invoice_ref TEXT,
  items JSONB,
  total_amount NUMERIC DEFAULT 0,
  cash_paid NUMERIC DEFAULT 0,
  supplier_credit NUMERIC DEFAULT 0,
  purchase_date TEXT,
  notes TEXT,
  performed_by TEXT,
  shop_name TEXT,
  shop_code TEXT,
  user_id TEXT,
  synced_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.stock_purchases (
  id TEXT PRIMARY KEY,
  purchase_no TEXT,
  supplier_id TEXT,
  supplier_name TEXT,
  invoice_ref TEXT,
  items JSONB,
  total_amount NUMERIC DEFAULT 0,
  cash_paid NUMERIC DEFAULT 0,
  supplier_credit NUMERIC DEFAULT 0,
  purchase_date TEXT,
  notes TEXT,
  performed_by TEXT,
  shop_name TEXT,
  shop_code TEXT,
  user_id TEXT,
  synced_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. UDHARO KHATA & TRANSACTIONS TABLES
CREATE TABLE IF NOT EXISTS public.udharo_khata (
  id TEXT PRIMARY KEY,
  entity_type TEXT,
  entity_id TEXT,
  entity_name TEXT,
  type TEXT,
  amount NUMERIC DEFAULT 0,
  payment_method TEXT,
  reference_invoice_id TEXT,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  balance_after NUMERIC DEFAULT 0,
  performed_by TEXT,
  shop_name TEXT,
  shop_code TEXT,
  user_id TEXT,
  synced_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.khata_transactions (
  id TEXT PRIMARY KEY,
  entity_type TEXT,
  entity_id TEXT,
  entity_name TEXT,
  type TEXT,
  amount NUMERIC DEFAULT 0,
  payment_method TEXT,
  reference_invoice_id TEXT,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  balance_after NUMERIC DEFAULT 0,
  performed_by TEXT,
  shop_name TEXT,
  shop_code TEXT,
  user_id TEXT,
  synced_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. ADVANCE PAYMENTS (CUSTOMER & SUPPLIER)
CREATE TABLE IF NOT EXISTS public.customer_advance_payments (
  id TEXT PRIMARY KEY,
  customer_id TEXT,
  customer_name TEXT,
  customer_phone TEXT,
  amount NUMERIC DEFAULT 0,
  payment_method TEXT,
  payment_date TEXT,
  notes TEXT,
  recorded_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  shop_name TEXT,
  shop_code TEXT,
  user_id TEXT,
  synced_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.supplier_advance_payments (
  id TEXT PRIMARY KEY,
  supplier_id TEXT,
  supplier_name TEXT,
  amount NUMERIC DEFAULT 0,
  payment_method TEXT,
  payment_date TEXT,
  notes TEXT,
  recorded_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  shop_name TEXT,
  shop_code TEXT,
  user_id TEXT,
  synced_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. USERS TABLES (ADMIN USER MONITORING & SHOP DETAILS)
CREATE TABLE IF NOT EXISTS public.users (
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
  approved_until_date TEXT,
  user_payload JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  synced_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. REGISTERED USERS TABLE (Single Unified User Accounts Table)
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
  approved_until_date TEXT,
  user_payload JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  synced_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. SHOP PROFILES TABLE
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

-- 10. EXPENSES & RETURNS TABLES
CREATE TABLE IF NOT EXISTS public.expenses (
  id TEXT PRIMARY KEY,
  expense_no TEXT,
  category TEXT,
  title TEXT,
  amount NUMERIC DEFAULT 0,
  payment_method TEXT,
  paid_to TEXT,
  notes TEXT,
  expense_date TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  shop_name TEXT,
  shop_code TEXT,
  user_id TEXT,
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
  total_refund_amount NUMERIC DEFAULT 0,
  refund_method TEXT,
  reason TEXT,
  return_date TEXT,
  recorded_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  shop_name TEXT,
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
  total_refund_amount NUMERIC DEFAULT 0,
  refund_method TEXT,
  reason TEXT,
  return_date TEXT,
  recorded_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  shop_name TEXT,
  shop_code TEXT,
  user_id TEXT,
  synced_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. ITEMIZED LINE ITEM TABLES
CREATE TABLE IF NOT EXISTS public.invoice_items (
  id TEXT PRIMARY KEY,
  invoice_id TEXT,
  invoice_no TEXT,
  product_id TEXT,
  product_name TEXT,
  quantity NUMERIC DEFAULT 0,
  unit_price NUMERIC DEFAULT 0,
  subtotal NUMERIC DEFAULT 0,
  discount NUMERIC DEFAULT 0,
  total_amount NUMERIC DEFAULT 0,
  shop_name TEXT,
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
  quantity NUMERIC DEFAULT 0,
  purchase_price NUMERIC DEFAULT 0,
  subtotal NUMERIC DEFAULT 0,
  total_amount NUMERIC DEFAULT 0,
  shop_name TEXT,
  shop_code TEXT,
  user_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  synced_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. STORE SNAPSHOTS & BACKUPS
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
  supplier_advance_payments JSONB,
  last_synced_at TIMESTAMPTZ DEFAULT NOW()
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
  supplier_advance_payments JSONB,
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
  supplier_advance_payments JSONB,
  last_synced_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. AUDIT & ACTIVITY LOGS
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

-- 14. ALTER EXISTING TABLES TO ENSURE NO MISSING COLUMNS
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS carton_barcode TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS supplier_id TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS supplier_name TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS rack_no TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS min_stock_alert NUMERIC;

ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS advance_balance NUMERIC;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS tole TEXT;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS pan_vat TEXT;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS due_date TEXT;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS due_notes TEXT;

ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS advance_balance NUMERIC;
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS pan_vat TEXT;
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS due_date TEXT;
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS due_notes TEXT;

ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS split_payment JSONB;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS split_payment JSONB;

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS user_payload JSONB;
ALTER TABLE public.registered_users ADD COLUMN IF NOT EXISTS user_payload JSONB;
ALTER TABLE public.app_users ADD COLUMN IF NOT EXISTS user_payload JSONB;

-- -------------------------------------------------------------------------
-- AUTOMATION FUNCTIONS & TRIGGERS
-- -------------------------------------------------------------------------

-- FUNCTION A: PROCESS SALE / INVOICE AUTOMATION
-- Auto-records unregistered customer, reduces stock quantity, updates Udharo Khata
CREATE OR REPLACE FUNCTION public.fn_process_sale_automation()
RETURNS TRIGGER AS $$
DECLARE
  v_customer_id TEXT;
  v_credit_amount NUMERIC := 0;
  v_item JSONB;
  v_prod_id TEXT;
  v_qty NUMERIC;
  v_udharo_from_split NUMERIC := 0;
  v_new_cust_id TEXT;
BEGIN
  -- 1. Check & Auto-Register Unregistered Customer
  IF NEW.customer_name IS NOT NULL AND TRIM(NEW.customer_name) <> '' AND UPPER(TRIM(NEW.customer_name)) <> 'WALK-IN CUSTOMER' THEN
    SELECT id INTO v_customer_id
    FROM public.customers
    WHERE (id = NEW.customer_id AND NEW.customer_id IS NOT NULL AND NEW.customer_id <> '')
       OR (LOWER(TRIM(name)) = LOWER(TRIM(NEW.customer_name)))
       OR (phone = NEW.customer_phone AND NEW.customer_phone IS NOT NULL AND TRIM(NEW.customer_phone) <> '')
    LIMIT 1;

    IF v_customer_id IS NULL THEN
      v_new_cust_id := COALESCE(NEW.customer_id, 'CUST_' || substring(md5(random()::text) from 1 for 8));
      v_customer_id := v_new_cust_id;
      
      INSERT INTO public.customers (
        id, name, phone, credit_limit, total_purchases, current_balance, advance_balance, created_at, shop_code, user_id
      ) VALUES (
        v_new_cust_id,
        TRIM(NEW.customer_name),
        COALESCE(NEW.customer_phone, 'N/A'),
        10000,
        COALESCE(NEW.net_amount, 0),
        0,
        0,
        NOW(),
        NEW.shop_code,
        NEW.user_id
      );
    ELSE
      -- Update existing customer total purchases & last purchase date
      UPDATE public.customers
      SET total_purchases = COALESCE(total_purchases, 0) + COALESCE(NEW.net_amount, 0),
          last_purchase_date = NOW()::text
      WHERE id = v_customer_id;
    END IF;

    -- Assign customer_id if missing
    NEW.customer_id := v_customer_id;
  END IF;

  -- 2. Auto Inventory Stock Reduction - Managed by Application
  -- Product stock levels are updated explicitly by client applications and synced.

  -- 3. Calculate Udharo / Credit Amount
  IF NEW.split_payment IS NOT NULL AND jsonb_typeof(NEW.split_payment) = 'object' THEN
    v_udharo_from_split := COALESCE((NEW.split_payment->>'udharo')::NUMERIC, 0);
  END IF;

  IF v_udharo_from_split > 0 THEN
    v_credit_amount := v_udharo_from_split;
  ELSIF NEW.payment_status = 'UNPAID' OR NEW.payment_status = 'CREDIT' THEN
    v_credit_amount := COALESCE(NEW.net_amount, 0);
  END IF;

  -- 4. Auto Udharo Khata Record & Customer Balance Update
  IF v_credit_amount > 0 AND v_customer_id IS NOT NULL THEN
    UPDATE public.customers
    SET current_balance = COALESCE(current_balance, 0) + v_credit_amount
    WHERE id = v_customer_id;

    -- Insert into udharo_khata & khata_transactions
    INSERT INTO public.udharo_khata (
      id, entity_type, entity_id, entity_name, type, amount, payment_method, reference_invoice_id, note, performed_by, shop_code, user_id
    ) VALUES (
      'KHATA_' || substring(md5(random()::text) from 1 for 12),
      'CUSTOMER',
      v_customer_id,
      COALESCE(NEW.customer_name, 'Customer'),
      'CREDIT_GIVEN',
      v_credit_amount,
      'UDHARO',
      COALESCE(NEW.invoice_no, NEW.id),
      'Auto Udharo sale recorded for Invoice #' || COALESCE(NEW.invoice_no, NEW.id),
      COALESCE(NEW.cashier_name, 'System POS'),
      NEW.shop_code,
      NEW.user_id
    );

    INSERT INTO public.khata_transactions (
      id, entity_type, entity_id, entity_name, type, amount, payment_method, reference_invoice_id, note, performed_by, shop_code, user_id
    ) VALUES (
      'TXN_' || substring(md5(random()::text) from 1 for 12),
      'CUSTOMER',
      v_customer_id,
      COALESCE(NEW.customer_name, 'Customer'),
      'CREDIT_GIVEN',
      v_credit_amount,
      'UDHARO',
      COALESCE(NEW.invoice_no, NEW.id),
      'Auto Udharo sale recorded for Invoice #' || COALESCE(NEW.invoice_no, NEW.id),
      COALESCE(NEW.cashier_name, 'System POS'),
      NEW.shop_code,
      NEW.user_id
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_invoices_automation ON public.invoices;
CREATE TRIGGER trg_invoices_automation
BEFORE INSERT ON public.invoices
FOR EACH ROW EXECUTE FUNCTION public.fn_process_sale_automation();

DROP TRIGGER IF EXISTS trg_sales_automation ON public.sales;
CREATE TRIGGER trg_sales_automation
BEFORE INSERT ON public.sales
FOR EACH ROW EXECUTE FUNCTION public.fn_process_sale_automation();


-- FUNCTION B: PROCESS PURCHASE AUTOMATION
-- Auto-records unregistered supplier, increases buyed stock, updates Udharo Khata
CREATE OR REPLACE FUNCTION public.fn_process_purchase_automation()
RETURNS TRIGGER AS $$
DECLARE
  v_supplier_id TEXT;
  v_item JSONB;
  v_prod_id TEXT;
  v_qty NUMERIC;
  v_cost NUMERIC;
  v_prod_name TEXT;
  v_new_supp_id TEXT;
BEGIN
  -- 1. Check & Auto-Register Unregistered Supplier
  IF NEW.supplier_name IS NOT NULL AND TRIM(NEW.supplier_name) <> '' THEN
    SELECT id INTO v_supplier_id
    FROM public.suppliers
    WHERE (id = NEW.supplier_id AND NEW.supplier_id IS NOT NULL AND NEW.supplier_id <> '')
       OR (LOWER(TRIM(name)) = LOWER(TRIM(NEW.supplier_name)))
    LIMIT 1;

    IF v_supplier_id IS NULL THEN
      v_new_supp_id := COALESCE(NEW.supplier_id, 'SUPP_' || substring(md5(random()::text) from 1 for 8));
      v_supplier_id := v_new_supp_id;

      INSERT INTO public.suppliers (
        id, name, company_name, phone, total_purchased, pending_payable, advance_balance, created_at, shop_code, user_id
      ) VALUES (
        v_new_supp_id,
        TRIM(NEW.supplier_name),
        TRIM(NEW.supplier_name),
        'N/A',
        COALESCE(NEW.total_amount, 0),
        COALESCE(NEW.supplier_credit, 0),
        0,
        NOW(),
        NEW.shop_code,
        NEW.user_id
      );
    ELSE
      -- Update existing supplier total purchased
      UPDATE public.suppliers
      SET total_purchased = COALESCE(total_purchased, 0) + COALESCE(NEW.total_amount, 0)
      WHERE id = v_supplier_id;
    END IF;

    -- Assign supplier_id if missing
    NEW.supplier_id := v_supplier_id;
  END IF;

  -- 2. Auto Buyed Stock Product Creation (if missing) - Managed by Application
  IF NEW.items IS NOT NULL AND jsonb_typeof(NEW.items) = 'array' THEN
    FOR v_item IN SELECT * FROM jsonb_array_elements(NEW.items) LOOP
      v_prod_id := COALESCE(v_item->>'productId', v_item->>'id');
      v_prod_name := COALESCE(v_item->>'productName', v_item->>'name', 'Purchased Product');
      v_qty := COALESCE((v_item->>'quantity')::NUMERIC, (v_item->>'qty')::NUMERIC, 1);

      IF v_prod_id IS NOT NULL AND v_prod_id <> '' THEN
        -- If product doesn't exist, insert new product
        IF NOT EXISTS (SELECT 1 FROM public.products WHERE id = v_prod_id OR sku = v_prod_id OR LOWER(TRIM(name)) = LOWER(TRIM(v_prod_name))) THEN
          INSERT INTO public.products (
            id, sku, barcode, name, category, stock_qty, min_stock_alert, supplier_id, supplier_name, created_at, shop_code, user_id
          ) VALUES (
            v_prod_id,
            'SKU-' || substring(md5(random()::text) from 1 for 6),
            'BC-' || substring(md5(random()::text) from 1 for 8),
            v_prod_name,
            'General',
            v_qty,
            5,
            v_supplier_id,
            NEW.supplier_name,
            NOW(),
            NEW.shop_code,
            NEW.user_id
          );
        END IF;
      END IF;
    END LOOP;
  END IF;

  -- 3. Auto Udharo Khata Record & Supplier Pending Payable Update
  IF COALESCE(NEW.supplier_credit, 0) > 0 AND v_supplier_id IS NOT NULL THEN
    UPDATE public.suppliers
    SET pending_payable = COALESCE(pending_payable, 0) + NEW.supplier_credit
    WHERE id = v_supplier_id;

    INSERT INTO public.udharo_khata (
      id, entity_type, entity_id, entity_name, type, amount, payment_method, reference_invoice_id, note, performed_by, shop_code, user_id
    ) VALUES (
      'KHATA_' || substring(md5(random()::text) from 1 for 12),
      'SUPPLIER',
      v_supplier_id,
      COALESCE(NEW.supplier_name, 'Supplier'),
      'DEBT_ADDED',
      NEW.supplier_credit,
      'UDHARO',
      COALESCE(NEW.purchase_no, NEW.id),
      'Auto Udharo purchase recorded for Purchase #' || COALESCE(NEW.purchase_no, NEW.id),
      COALESCE(NEW.performed_by, 'Inventory Admin'),
      NEW.shop_code,
      NEW.user_id
    );

    INSERT INTO public.khata_transactions (
      id, entity_type, entity_id, entity_name, type, amount, payment_method, reference_invoice_id, note, performed_by, shop_code, user_id
    ) VALUES (
      'TXN_' || substring(md5(random()::text) from 1 for 12),
      'SUPPLIER',
      v_supplier_id,
      COALESCE(NEW.supplier_name, 'Supplier'),
      'DEBT_ADDED',
      NEW.supplier_credit,
      'UDHARO',
      COALESCE(NEW.purchase_no, NEW.id),
      'Auto Udharo purchase recorded for Purchase #' || COALESCE(NEW.purchase_no, NEW.id),
      COALESCE(NEW.performed_by, 'Inventory Admin'),
      NEW.shop_code,
      NEW.user_id
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_purchases_automation ON public.purchases;
CREATE TRIGGER trg_purchases_automation
BEFORE INSERT ON public.purchases
FOR EACH ROW EXECUTE FUNCTION public.fn_process_purchase_automation();

DROP TRIGGER IF EXISTS trg_stock_purchases_automation ON public.stock_purchases;
CREATE TRIGGER trg_stock_purchases_automation
BEFORE INSERT ON public.stock_purchases
FOR EACH ROW EXECUTE FUNCTION public.fn_process_purchase_automation();


-- -------------------------------------------------------------------------
-- MULTI-STORE TENANT IDENTITY ENFORCEMENT
-- Prioritizes explicit payload shop_code and shop_name over Admin's personal JWT metadata
-- -------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.fn_enforce_target_store_identity()
RETURNS TRIGGER AS $$
BEGIN
  -- 1. Explicit payload shop_code has highest priority, then JWT metadata, then default
  NEW.shop_code := COALESCE(
    NULLIF(TRIM(NEW.shop_code), ''),
    (auth.jwt()->'raw_user_meta_data'->>'shop_code'),
    (auth.jwt()->'user_metadata'->>'shop_code'),
    'SHOP-01'
  );
  
  -- 2. Explicit payload shop_name has highest priority
  NEW.shop_name := COALESCE(
    NULLIF(TRIM(NEW.shop_name), ''),
    (auth.jwt()->'raw_user_meta_data'->>'shop_name'),
    (auth.jwt()->'user_metadata'->>'shop_name'),
    'Retail Store'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach identity triggers
DROP TRIGGER IF EXISTS trg_invoices_identity ON public.invoices;
CREATE TRIGGER trg_invoices_identity
BEFORE INSERT OR UPDATE ON public.invoices
FOR EACH ROW EXECUTE FUNCTION public.fn_enforce_target_store_identity();

DROP TRIGGER IF EXISTS trg_sales_identity ON public.sales;
CREATE TRIGGER trg_sales_identity
BEFORE INSERT OR UPDATE ON public.sales
FOR EACH ROW EXECUTE FUNCTION public.fn_enforce_target_store_identity();

DROP TRIGGER IF EXISTS trg_purchases_identity ON public.purchases;
CREATE TRIGGER trg_purchases_identity
BEFORE INSERT OR UPDATE ON public.purchases
FOR EACH ROW EXECUTE FUNCTION public.fn_enforce_target_store_identity();

DROP TRIGGER IF EXISTS trg_products_identity ON public.products;
CREATE TRIGGER trg_products_identity
BEFORE INSERT OR UPDATE ON public.products
FOR EACH ROW EXECUTE FUNCTION public.fn_enforce_target_store_identity();

DROP TRIGGER IF EXISTS trg_customers_identity ON public.customers;
CREATE TRIGGER trg_customers_identity
BEFORE INSERT OR UPDATE ON public.customers
FOR EACH ROW EXECUTE FUNCTION public.fn_enforce_target_store_identity();

DROP TRIGGER IF EXISTS trg_suppliers_identity ON public.suppliers;
CREATE TRIGGER trg_suppliers_identity
BEFORE INSERT OR UPDATE ON public.suppliers
FOR EACH ROW EXECUTE FUNCTION public.fn_enforce_target_store_identity();

DROP TRIGGER IF EXISTS trg_expenses_identity ON public.expenses;
CREATE TRIGGER trg_expenses_identity
BEFORE INSERT OR UPDATE ON public.expenses
FOR EACH ROW EXECUTE FUNCTION public.fn_enforce_target_store_identity();

-- DISABLE ROW LEVEL SECURITY (RLS) FOR UNRESTRICTED REALTIME RECORDING
ALTER TABLE public.customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_purchases DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.udharo_khata DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.khata_transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_advance_payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_advance_payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.registered_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_returns DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_returns DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_snapshots DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.dukaan_store_snapshots DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_backups DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs DISABLE ROW LEVEL SECURITY;

-- GRANT FULL PERMISSIONS TO ALL ROLES
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
    activeShopCode,
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
    link.download = `Dukaan_Backup_${activeShopCode || shopProfile.shopCode}_${new Date().toISOString().slice(0, 10)}.json`;
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

