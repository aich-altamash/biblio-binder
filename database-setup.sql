-- ================================================
-- INVENTORY MANAGEMENT SYSTEM - DATABASE SCHEMA
-- ================================================
-- Run this SQL in your Supabase SQL Editor to set up all tables

-- Create enum for user roles
create type public.app_role as enum ('admin', 'user');

-- Create user_roles table
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  created_at timestamptz default now(),
  unique (user_id, role)
);

alter table public.user_roles enable row level security;

-- Create security definer function to check roles
create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id
      and role = _role
  )
$$;

-- Create categories table
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.categories enable row level security;

create policy "Authenticated users can view categories"
  on public.categories for select
  to authenticated
  using (true);

create policy "Admins can insert categories"
  on public.categories for insert
  to authenticated
  with check (public.has_role(auth.uid(), 'admin'));

create policy "Admins can update categories"
  on public.categories for update
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

create policy "Admins can delete categories"
  on public.categories for delete
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

-- Create suppliers table
create table public.suppliers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact_person text,
  email text,
  phone text,
  address text,
  terms text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.suppliers enable row level security;

create policy "Authenticated users can view suppliers"
  on public.suppliers for select
  to authenticated
  using (true);

create policy "Admins can insert suppliers"
  on public.suppliers for insert
  to authenticated
  with check (public.has_role(auth.uid(), 'admin'));

create policy "Admins can update suppliers"
  on public.suppliers for update
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

create policy "Admins can delete suppliers"
  on public.suppliers for delete
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

-- Create products table
create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sku text unique not null,
  isbn text,
  author text,
  edition text,
  category_id uuid references public.categories(id) on delete set null,
  description text,
  reorder_level integer default 10,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.products enable row level security;

create policy "Authenticated users can view products"
  on public.products for select
  to authenticated
  using (true);

create policy "Admins can insert products"
  on public.products for insert
  to authenticated
  with check (public.has_role(auth.uid(), 'admin'));

create policy "Admins can update products"
  on public.products for update
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

create policy "Admins can delete products"
  on public.products for delete
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

-- Create batches table
create table public.batches (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete cascade not null,
  batch_number text not null,
  quantity integer not null default 0,
  cost_per_unit decimal(10, 2) not null,
  expiry_date date,
  received_date date default current_date,
  supplier_id uuid references public.suppliers(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.batches enable row level security;

create policy "Authenticated users can view batches"
  on public.batches for select
  to authenticated
  using (true);

create policy "Admins can insert batches"
  on public.batches for insert
  to authenticated
  with check (public.has_role(auth.uid(), 'admin'));

create policy "Admins can update batches"
  on public.batches for update
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

create policy "Admins can delete batches"
  on public.batches for delete
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

-- Create inventory_logs table
create table public.inventory_logs (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete cascade not null,
  batch_id uuid references public.batches(id) on delete set null,
  quantity integer not null,
  movement_type text not null check (movement_type in ('IN', 'OUT')),
  reference_type text,
  reference_id uuid,
  notes text,
  created_at timestamptz default now()
);

alter table public.inventory_logs enable row level security;

create policy "Authenticated users can view inventory logs"
  on public.inventory_logs for select
  to authenticated
  using (true);

create policy "Admins can insert inventory logs"
  on public.inventory_logs for insert
  to authenticated
  with check (public.has_role(auth.uid(), 'admin'));

-- Create purchase_orders table
create table public.purchase_orders (
  id uuid primary key default gen_random_uuid(),
  order_number text unique not null,
  supplier_id uuid references public.suppliers(id) on delete restrict not null,
  order_date date default current_date,
  expected_delivery date,
  status text not null default 'PENDING' check (status in ('PENDING', 'RECEIVED', 'CANCELLED')),
  total_amount decimal(10, 2) default 0,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.purchase_orders enable row level security;

create policy "Authenticated users can view purchase orders"
  on public.purchase_orders for select
  to authenticated
  using (true);

create policy "Admins can insert purchase orders"
  on public.purchase_orders for insert
  to authenticated
  with check (public.has_role(auth.uid(), 'admin'));

create policy "Admins can update purchase orders"
  on public.purchase_orders for update
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

create policy "Admins can delete purchase orders"
  on public.purchase_orders for delete
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

-- Create purchase_items table
create table public.purchase_items (
  id uuid primary key default gen_random_uuid(),
  purchase_order_id uuid references public.purchase_orders(id) on delete cascade not null,
  product_id uuid references public.products(id) on delete restrict not null,
  quantity integer not null,
  unit_price decimal(10, 2) not null,
  total_price decimal(10, 2) generated always as (quantity * unit_price) stored,
  created_at timestamptz default now()
);

alter table public.purchase_items enable row level security;

create policy "Authenticated users can view purchase items"
  on public.purchase_items for select
  to authenticated
  using (true);

create policy "Admins can insert purchase items"
  on public.purchase_items for insert
  to authenticated
  with check (public.has_role(auth.uid(), 'admin'));

create policy "Admins can update purchase items"
  on public.purchase_items for update
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

create policy "Admins can delete purchase items"
  on public.purchase_items for delete
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

-- Create campuses table
create table public.campuses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  location text,
  contact_person text,
  email text,
  phone text,
  address text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.campuses enable row level security;

create policy "Authenticated users can view campuses"
  on public.campuses for select
  to authenticated
  using (true);

create policy "Admins can insert campuses"
  on public.campuses for insert
  to authenticated
  with check (public.has_role(auth.uid(), 'admin'));

create policy "Admins can update campuses"
  on public.campuses for update
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

create policy "Admins can delete campuses"
  on public.campuses for delete
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

-- Create sales_invoices table
create table public.sales_invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_number text unique not null,
  campus_id uuid references public.campuses(id) on delete restrict not null,
  invoice_date date default current_date,
  total_amount decimal(10, 2) default 0,
  discount_percentage decimal(5, 2) default 0,
  discount_amount decimal(10, 2) default 0,
  net_amount decimal(10, 2) default 0,
  payment_status text default 'PENDING' check (payment_status in ('PENDING', 'PARTIAL', 'PAID')),
  amount_paid decimal(10, 2) default 0,
  profit decimal(10, 2) default 0,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.sales_invoices enable row level security;

create policy "Authenticated users can view sales invoices"
  on public.sales_invoices for select
  to authenticated
  using (true);

create policy "Admins can insert sales invoices"
  on public.sales_invoices for insert
  to authenticated
  with check (public.has_role(auth.uid(), 'admin'));

create policy "Admins can update sales invoices"
  on public.sales_invoices for update
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

create policy "Admins can delete sales invoices"
  on public.sales_invoices for delete
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

-- Create sales_items table
create table public.sales_items (
  id uuid primary key default gen_random_uuid(),
  sales_invoice_id uuid references public.sales_invoices(id) on delete cascade not null,
  product_id uuid references public.products(id) on delete restrict not null,
  batch_id uuid references public.batches(id) on delete set null,
  quantity integer not null,
  unit_price decimal(10, 2) not null,
  cost_per_unit decimal(10, 2) not null,
  total_price decimal(10, 2) generated always as (quantity * unit_price) stored,
  total_cost decimal(10, 2) generated always as (quantity * cost_per_unit) stored,
  profit decimal(10, 2) generated always as ((quantity * unit_price) - (quantity * cost_per_unit)) stored,
  created_at timestamptz default now()
);

alter table public.sales_items enable row level security;

create policy "Authenticated users can view sales items"
  on public.sales_items for select
  to authenticated
  using (true);

create policy "Admins can insert sales items"
  on public.sales_items for insert
  to authenticated
  with check (public.has_role(auth.uid(), 'admin'));

create policy "Admins can update sales items"
  on public.sales_items for update
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

create policy "Admins can delete sales items"
  on public.sales_items for delete
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

-- Create system_settings table
create table public.system_settings (
  id uuid primary key default gen_random_uuid(),
  company_name text,
  company_address text,
  company_phone text,
  company_email text,
  warehouse_name text,
  warehouse_address text,
  tax_rate decimal(5, 2) default 0,
  currency text default 'PKR',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.system_settings enable row level security;

create policy "Authenticated users can view system settings"
  on public.system_settings for select
  to authenticated
  using (true);

create policy "Admins can insert system settings"
  on public.system_settings for insert
  to authenticated
  with check (public.has_role(auth.uid(), 'admin'));

create policy "Admins can update system settings"
  on public.system_settings for update
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

-- Insert default system settings
insert into public.system_settings (company_name, currency)
values ('Your Company Name', 'PKR');

-- Create indexes for better performance
create index idx_products_category on public.products(category_id);
create index idx_batches_product on public.batches(product_id);
create index idx_batches_supplier on public.batches(supplier_id);
create index idx_inventory_logs_product on public.inventory_logs(product_id);
create index idx_inventory_logs_batch on public.inventory_logs(batch_id);
create index idx_purchase_orders_supplier on public.purchase_orders(supplier_id);
create index idx_purchase_items_po on public.purchase_items(purchase_order_id);
create index idx_purchase_items_product on public.purchase_items(product_id);
create index idx_sales_invoices_campus on public.sales_invoices(campus_id);
create index idx_sales_items_invoice on public.sales_items(sales_invoice_id);
create index idx_sales_items_product on public.sales_items(product_id);
create index idx_sales_items_batch on public.sales_items(batch_id);

-- ================================================
-- SETUP COMPLETE
-- ================================================
-- Your inventory management database is now ready!
-- 
-- Next steps:
-- 1. Sign up a user in your app
-- 2. Get your user ID from Supabase Auth > Users
-- 3. Run this SQL to make them an admin:
--    INSERT INTO public.user_roles (user_id, role) 
--    VALUES ('your-user-id-here', 'admin');
