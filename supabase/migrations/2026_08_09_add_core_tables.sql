-- supabase/migrations/2026_08_09_add_core_tables.sql

-- Enable pgcrypto for gen_random_uuid() (Supabase generally has this available)
create extension if not exists "pgcrypto";

-- ======== products / stocks ========
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  sku text,
  barcode text,
  carton_barcode text,
  name text not null,
  category text,
  stock_qty numeric default 0,
  min_stock_alert numeric default 0,
  unit jsonb,
  supplier_id uuid,
  supplier_name text,
  rack_no text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists idx_products_user_id on products(user_id);
create index if not exists idx_products_name on products((lower(name)));

-- ======== customers ========
create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  phone text,
  address jsonb,
  tole text,
  total_purchases numeric default 0,
  current_balance numeric default 0,
  advance_balance numeric default 0,
  credit_limit numeric default 0,
  last_purchase_date timestamptz,
  due_date date,
  due_notes text,
  created_at timestamptz default now()
);
create index if not exists idx_customers_user_id on customers(user_id);
create index if not exists idx_customers_phone on customers(phone);

-- ======== suppliers ========
create table if not exists suppliers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  phone text,
  company_name text,
  address jsonb,
  total_purchased numeric default 0,
  pending_payable numeric default 0,
  advance_balance numeric default 0,
  due_date date,
  due_notes text,
  created_at timestamptz default now()
);
create index if not exists idx_suppliers_user_id on suppliers(user_id);
create index if not exists idx_suppliers_phone on suppliers(phone);

-- ======== sales invoices (sales) ========
create table if not exists sales_invoices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  invoice_no text,
  customer_id uuid references customers(id),
  customer_name text,
  customer_phone text,
  subtotal numeric default 0,
  discount numeric default 0,
  tax_amount numeric default 0,
  net_amount numeric default 0,
  split_payment jsonb,
  payment_status text,
  cashier_name text,
  created_at timestamptz default now()
);
create index if not exists idx_sales_user_id on sales_invoices(user_id);
create index if not exists idx_sales_invoice_no on sales_invoices(invoice_no);

create table if not exists sales_items (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references sales_invoices(id) on delete cascade,
  product_id uuid references products(id),
  product_name text,
  sku text,
  unit_name text,
  quantity numeric default 0,
  unit_price numeric default 0,
  total_price numeric default 0
);
create index if not exists idx_sales_items_sale_id on sales_items(sale_id);

-- ======== purchases ========
create table if not exists purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  purchase_no text,
  supplier_id uuid references suppliers(id),
  supplier_name text,
  invoice_ref text,
  total_amount numeric default 0,
  cash_paid numeric default 0,
  supplier_credit numeric default 0,
  purchase_date timestamptz default now(),
  notes text,
  performed_by text
);
create index if not exists idx_purchases_user_id on purchases(user_id);

create table if not exists purchase_items (
  id uuid primary key default gen_random_uuid(),
  purchase_id uuid not null references purchases(id) on delete cascade,
  product_id uuid references products(id),
  product_name text,
  unit_name text,
  quantity numeric default 0,
  cost_price numeric default 0,
  total_amount numeric default 0
);
create index if not exists idx_purchase_items_purchase_id on purchase_items(purchase_id);

-- ======== khata / credit ledger (transactions) ========
create table if not exists khata_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entity_type text not null,
  entity_id uuid,
  entity_name text,
  type text not null,
  amount numeric default 0,
  payment_method text,
  reference_invoice_id uuid,
  note text,
  performed_by text,
  created_at timestamptz default now(),
  balance_after numeric default 0
);
create index if not exists idx_khata_user_id on khata_transactions(user_id);
create index if not exists idx_khata_entity on khata_transactions(entity_id);

-- ======== advance payments (suppliers / customers) ========
create table if not exists advance_payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  party_type text not null,
  party_id uuid,
  party_name text,
  amount numeric default 0,
  payment_method text,
  payment_date timestamptz default now(),
  notes text,
  created_at timestamptz default now()
);
create index if not exists idx_advance_user_id on advance_payments(user_id);

-- ======== activity / audit logs ========
create table if not exists activity_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  timestamp timestamptz default now(),
  action_type text,
  action text,
  performed_by text,
  performed_by_role text,
  store_branch text,
  details jsonb,
  amount numeric,
  synced_to_cloud boolean default false
);
create index if not exists idx_activity_user_id on activity_logs(user_id);
create index if not exists idx_activity_timestamp on activity_logs(timestamp);

-- ======== user profiles (app users) ========
create table if not exists user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text,
  name text,
  email text,
  phone text,
  shop_name text,
  shop_code text,
  profile jsonb,
  status text,
  subscription_plan text,
  registered_at timestamptz default now()
);
create index if not exists idx_profiles_shop_code on user_profiles(shop_code);

-- ======== expenses ========
create table if not exists expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  expense_no text,
  category text,
  title text,
  amount numeric default 0,
  payment_method text,
  paid_to text,
  notes text,
  performed_by text,
  expense_date timestamptz default now(),
  created_at timestamptz default now()
);
create index if not exists idx_expenses_user_id on expenses(user_id);

-- ======== Row Level Security (RLS) policies ========

-- Helper: function to create typical policies for tables that have a user_id column
-- We will create explicit policies per table below to avoid dynamic SQL in migrations.

-- Enable RLS and create policies for each table where user_id is present

-- products
alter table products enable row level security;
create policy products_select_policy on products for select using (auth.uid() = user_id);
create policy products_insert_policy on products for insert with check (auth.uid() = user_id);
create policy products_update_policy on products for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy products_delete_policy on products for delete using (auth.uid() = user_id);

-- customers
alter table customers enable row level security;
create policy customers_select_policy on customers for select using (auth.uid() = user_id);
create policy customers_insert_policy on customers for insert with check (auth.uid() = user_id);
create policy customers_update_policy on customers for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy customers_delete_policy on customers for delete using (auth.uid() = user_id);

-- suppliers
alter table suppliers enable row level security;
create policy suppliers_select_policy on suppliers for select using (auth.uid() = user_id);
create policy suppliers_insert_policy on suppliers for insert with check (auth.uid() = user_id);
create policy suppliers_update_policy on suppliers for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy suppliers_delete_policy on suppliers for delete using (auth.uid() = user_id);

-- sales_invoices
alter table sales_invoices enable row level security;
create policy sales_select_policy on sales_invoices for select using (auth.uid() = user_id);
create policy sales_insert_policy on sales_invoices for insert with check (auth.uid() = user_id);
create policy sales_update_policy on sales_invoices for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy sales_delete_policy on sales_invoices for delete using (auth.uid() = user_id);

-- sales_items: restrict via sale's user_id (simpler: require associated sale belongs to user)
alter table sales_items enable row level security;
create policy sales_items_select_policy on sales_items for select using (
  exists (select 1 from sales_invoices s where s.id = sales_items.sale_id and s.user_id = auth.uid())
);
create policy sales_items_insert_policy on sales_items for insert with check (
  exists (select 1 from sales_invoices s where s.id = sales_items.sale_id and s.user_id = auth.uid())
);
create policy sales_items_update_policy on sales_items for update using (
  exists (select 1 from sales_invoices s where s.id = sales_items.sale_id and s.user_id = auth.uid())
) with check (
  exists (select 1 from sales_invoices s where s.id = sales_items.sale_id and s.user_id = auth.uid())
);
create policy sales_items_delete_policy on sales_items for delete using (
  exists (select 1 from sales_invoices s where s.id = sales_items.sale_id and s.user_id = auth.uid())
);

-- purchases
alter table purchases enable row level security;
create policy purchases_select_policy on purchases for select using (auth.uid() = user_id);
create policy purchases_insert_policy on purchases for insert with check (auth.uid() = user_id);
create policy purchases_update_policy on purchases for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy purchases_delete_policy on purchases for delete using (auth.uid() = user_id);

-- purchase_items similar to sales_items
alter table purchase_items enable row level security;
create policy purchase_items_select_policy on purchase_items for select using (
  exists (select 1 from purchases p where p.id = purchase_items.purchase_id and p.user_id = auth.uid())
);
create policy purchase_items_insert_policy on purchase_items for insert with check (
  exists (select 1 from purchases p where p.id = purchase_items.purchase_id and p.user_id = auth.uid())
);
create policy purchase_items_update_policy on purchase_items for update using (
  exists (select 1 from purchases p where p.id = purchase_items.purchase_id and p.user_id = auth.uid())
) with check (
  exists (select 1 from purchases p where p.id = purchase_items.purchase_id and p.user_id = auth.uid())
);
create policy purchase_items_delete_policy on purchase_items for delete using (
  exists (select 1 from purchases p where p.id = purchase_items.purchase_id and p.user_id = auth.uid())
);

-- khata_transactions
alter table khata_transactions enable row level security;
create policy khata_select_policy on khata_transactions for select using (auth.uid() = user_id);
create policy khata_insert_policy on khata_transactions for insert with check (auth.uid() = user_id);
create policy khata_update_policy on khata_transactions for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy khata_delete_policy on khata_transactions for delete using (auth.uid() = user_id);

-- advance_payments
alter table advance_payments enable row level security;
create policy advance_select_policy on advance_payments for select using (auth.uid() = user_id);
create policy advance_insert_policy on advance_payments for insert with check (auth.uid() = user_id);
create policy advance_update_policy on advance_payments for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy advance_delete_policy on advance_payments for delete using (auth.uid() = user_id);

-- activity_logs
alter table activity_logs enable row level security;
create policy activity_select_policy on activity_logs for select using (auth.uid() = user_id);
create policy activity_insert_policy on activity_logs for insert with check (auth.uid() = user_id);
create policy activity_update_policy on activity_logs for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy activity_delete_policy on activity_logs for delete using (auth.uid() = user_id);

-- user_profiles: primary key is id (auth.users.id)
alter table user_profiles enable row level security;
create policy profiles_select_policy on user_profiles for select using (auth.uid() = id);
create policy profiles_insert_policy on user_profiles for insert with check (auth.uid() = id);
create policy profiles_update_policy on user_profiles for update using (auth.uid() = id) with check (auth.uid() = id);
create policy profiles_delete_policy on user_profiles for delete using (auth.uid() = id);

-- expenses
alter table expenses enable row level security;
create policy expenses_select_policy on expenses for select using (auth.uid() = user_id);
create policy expenses_insert_policy on expenses for insert with check (auth.uid() = user_id);
create policy expenses_update_policy on expenses for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy expenses_delete_policy on expenses for delete using (auth.uid() = user_id);

-- Done

-- NOTE: After applying this migration, check whether any additional view or function is needed for reporting or aggregated balances.
-- Important operational note for developers: run these migrations using Supabase SQL Editor or psql with a service role key when creating extensions and enabling RLS/policies.
