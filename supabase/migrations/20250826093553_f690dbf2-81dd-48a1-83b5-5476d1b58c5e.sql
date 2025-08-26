-- Enable extension for UUID generation
create extension if not exists pgcrypto;

-- 1) Enums
create type public.app_role as enum ('admin', 'collector', 'resident');
create type public.waste_type as enum ('plastic','paper','glass','metal','organic','ewaste','other');
create type public.bin_status as enum ('active','inactive','maintenance','full');

-- 2) Helper functions
create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  );
$$;

-- 3) Profiles and roles
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

alter table public.user_roles enable row level security;

-- Policies for profiles
create policy if not exists "Users can view their own profile"
  on public.profiles for select to authenticated
  using (id = auth.uid());

create policy if not exists "Admins can view all profiles"
  on public.profiles for select to authenticated
  using (public.has_role(auth.uid(), 'admin'));

create policy if not exists "Users can update their own profile"
  on public.profiles for update to authenticated
  using (id = auth.uid());

create policy if not exists "Admins can manage all profiles"
  on public.profiles for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- Policies for user_roles
create policy if not exists "Users can view their own roles"
  on public.user_roles for select to authenticated
  using (user_id = auth.uid());

create policy if not exists "Admins can manage roles"
  on public.user_roles for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- Default profile + role on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do nothing;

  -- Assign default resident role if none exists
  insert into public.user_roles (user_id, role)
  values (new.id, 'resident')
  on conflict (user_id, role) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.update_updated_at_column();

-- 4) Bins (Smart bins / collection points)
create table if not exists public.bins (
  id uuid primary key default gen_random_uuid(),
  qr_code text not null unique,
  name text,
  allowed_types public.waste_type[] not null default '{}',
  address text,
  latitude numeric(9,6),
  longitude numeric(9,6),
  status public.bin_status not null default 'active',
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.bins enable row level security;

create policy if not exists "Authenticated can view bins"
  on public.bins for select to authenticated
  using (true);

create policy if not exists "Admins and collectors can insert bins"
  on public.bins for insert to authenticated
  with check (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'collector'));

create policy if not exists "Admins and collectors can update bins"
  on public.bins for update to authenticated
  using (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'collector'))
  with check (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'collector'));

create policy if not exists "Admins can delete bins"
  on public.bins for delete to authenticated
  using (public.has_role(auth.uid(), 'admin'));

create trigger bins_updated_at
  before update on public.bins
  for each row execute procedure public.update_updated_at_column();

-- 5) Scans (QR/product scans)
create table if not exists public.scans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  bin_id uuid references public.bins(id) on delete set null,
  product_name text,
  waste public.waste_type,
  confidence numeric,
  raw_code text,
  created_at timestamptz not null default now()
);

alter table public.scans enable row level security;

create policy if not exists "Users can view their own scans"
  on public.scans for select to authenticated
  using (user_id = auth.uid());

create policy if not exists "Users can insert their own scans"
  on public.scans for insert to authenticated
  with check (user_id = auth.uid());

create policy if not exists "Admins can view all scans"
  on public.scans for select to authenticated
  using (public.has_role(auth.uid(), 'admin'));

-- 6) Deposits (residents depositing waste into bins)
create table if not exists public.deposits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  bin_id uuid not null references public.bins(id) on delete cascade,
  deposited_at timestamptz not null default now(),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.deposits enable row level security;

create trigger deposits_updated_at
  before update on public.deposits
  for each row execute procedure public.update_updated_at_column();

create policy if not exists "Users can view their own deposits"
  on public.deposits for select to authenticated
  using (user_id = auth.uid());

create policy if not exists "Users can insert their own deposits"
  on public.deposits for insert to authenticated
  with check (user_id = auth.uid());

create policy if not exists "Users can update their own deposits"
  on public.deposits for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy if not exists "Admins can view all deposits"
  on public.deposits for select to authenticated
  using (public.has_role(auth.uid(), 'admin'));

create policy if not exists "Admins can manage all deposits"
  on public.deposits for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- Deposit items (normalized weights per material)
create table if not exists public.deposit_items (
  id uuid primary key default gen_random_uuid(),
  deposit_id uuid not null references public.deposits(id) on delete cascade,
  waste public.waste_type not null,
  weight_kg numeric not null check (weight_kg >= 0),
  created_at timestamptz not null default now()
);

alter table public.deposit_items enable row level security;

-- RLS for deposit_items based on parent deposit ownership
create policy if not exists "Users can view their own deposit items"
  on public.deposit_items for select to authenticated
  using (exists (
    select 1 from public.deposits d where d.id = deposit_id and d.user_id = auth.uid()
  ));

create policy if not exists "Users can insert their own deposit items"
  on public.deposit_items for insert to authenticated
  with check (exists (
    select 1 from public.deposits d where d.id = deposit_id and d.user_id = auth.uid()
  ));

create policy if not exists "Users can update their own deposit items"
  on public.deposit_items for update to authenticated
  using (exists (
    select 1 from public.deposits d where d.id = deposit_id and d.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.deposits d where d.id = deposit_id and d.user_id = auth.uid()
  ));

create policy if not exists "Admins can manage all deposit items"
  on public.deposit_items for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- 7) Pickups (collectors emptying bins)
create table if not exists public.pickups (
  id uuid primary key default gen_random_uuid(),
  bin_id uuid not null references public.bins(id) on delete cascade,
  collector_id uuid not null references auth.users(id) on delete cascade,
  picked_at timestamptz not null default now(),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.pickups enable row level security;

create trigger pickups_updated_at
  before update on public.pickups
  for each row execute procedure public.update_updated_at_column();

create policy if not exists "Collectors can view their own pickups"
  on public.pickups for select to authenticated
  using (collector_id = auth.uid());

create policy if not exists "Collectors can insert their own pickups"
  on public.pickups for insert to authenticated
  with check (collector_id = auth.uid());

create policy if not exists "Collectors can update their own pickups"
  on public.pickups for update to authenticated
  using (collector_id = auth.uid())
  with check (collector_id = auth.uid());

create policy if not exists "Admins can manage all pickups"
  on public.pickups for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- Pickup items
create table if not exists public.pickup_items (
  id uuid primary key default gen_random_uuid(),
  pickup_id uuid not null references public.pickups(id) on delete cascade,
  waste public.waste_type not null,
  weight_kg numeric not null check (weight_kg >= 0),
  created_at timestamptz not null default now()
);

alter table public.pickup_items enable row level security;

create policy if not exists "Collectors can view their own pickup items"
  on public.pickup_items for select to authenticated
  using (exists (
    select 1 from public.pickups p where p.id = pickup_id and p.collector_id = auth.uid()
  ));

create policy if not exists "Collectors can insert their own pickup items"
  on public.pickup_items for insert to authenticated
  with check (exists (
    select 1 from public.pickups p where p.id = pickup_id and p.collector_id = auth.uid()
  ));

create policy if not exists "Collectors can update their own pickup items"
  on public.pickup_items for update to authenticated
  using (exists (
    select 1 from public.pickups p where p.id = pickup_id and p.collector_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.pickups p where p.id = pickup_id and p.collector_id = auth.uid()
  ));

create policy if not exists "Admins can manage all pickup items"
  on public.pickup_items for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- 8) Realtime configuration
alter table public.bins replica identity full;
alter table public.scans replica identity full;
alter table public.deposits replica identity full;
alter table public.deposit_items replica identity full;
alter table public.pickups replica identity full;
alter table public.pickup_items replica identity full;

-- Add to realtime publication (ignore errors if already present)
alter publication supabase_realtime add table public.bins;
alter publication supabase_realtime add table public.scans;
alter publication supabase_realtime add table public.deposits;
alter publication supabase_realtime add table public.deposit_items;
alter publication supabase_realtime add table public.pickups;
alter publication supabase_realtime add table public.pickup_items;