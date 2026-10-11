-- Abonelik Dedektifi — başlangıç şeması
-- Tablolar: profiles, categories, subscriptions, price_history, notifications

-- ============================================================
-- Enum tipleri
-- ============================================================
create type public.billing_cycle as enum (
  'weekly',       -- haftalık
  'monthly',      -- aylık
  'quarterly',    -- üç aylık
  'semi_annual',  -- altı aylık
  'yearly',       -- yıllık
  'custom'        -- özel gün aralığı (custom_interval_days)
);

create type public.subscription_status as enum (
  'active',     -- aktif
  'trial',      -- deneme süresinde
  'paused',     -- duraklatıldı
  'cancelled',  -- iptal edildi
  'expired'     -- süresi doldu
);

create type public.notification_type as enum (
  'payment_due',   -- yaklaşan ödeme
  'trial_ending',  -- deneme süresi bitiyor
  'price_change',  -- fiyat değişikliği
  'system'         -- sistem bildirimi
);

-- ============================================================
-- updated_at tetikleyici fonksiyonu
-- ============================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================
-- profiles
-- ============================================================
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  avatar_url text,
  default_currency text not null default 'TRY'
    check (char_length(default_currency) = 3),
  email_notifications boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own" on public.profiles
  for select using ((select auth.uid()) = id);
create policy "profiles_insert_own" on public.profiles
  for insert with check ((select auth.uid()) = id);
create policy "profiles_update_own" on public.profiles
  for update using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);
create policy "profiles_delete_own" on public.profiles
  for delete using ((select auth.uid()) = id);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ============================================================
-- categories
-- ============================================================
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  color text,
  icon text,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

create index categories_user_id_idx on public.categories (user_id);

alter table public.categories enable row level security;

create policy "categories_select_own" on public.categories
  for select using ((select auth.uid()) = user_id);
create policy "categories_insert_own" on public.categories
  for insert with check ((select auth.uid()) = user_id);
create policy "categories_update_own" on public.categories
  for update using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "categories_delete_own" on public.categories
  for delete using ((select auth.uid()) = user_id);

-- ============================================================
-- subscriptions
-- ============================================================
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  category_id uuid references public.categories (id) on delete set null,
  name text not null check (char_length(name) between 1 and 120),
  provider text check (provider is null or char_length(provider) <= 120),
  amount numeric(12, 2) not null check (amount >= 0),
  currency text not null default 'TRY' check (char_length(currency) = 3),
  billing_cycle public.billing_cycle not null default 'monthly',
  -- Yalnızca billing_cycle = 'custom' iken zorunlu ve pozitif olmalı
  custom_interval_days integer
    check (custom_interval_days is null or custom_interval_days > 0),
  start_date date not null,
  next_payment_date date not null,
  auto_renew boolean not null default true,
  status public.subscription_status not null default 'active',
  trial_end_date date,
  description text check (description is null or char_length(description) <= 2000),
  reminder_days integer[] not null default '{7,3,1}',
  cancelled_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint custom_cycle_requires_interval
    check (billing_cycle <> 'custom' or custom_interval_days is not null)
);

create index subscriptions_user_id_idx on public.subscriptions (user_id);
create index subscriptions_user_status_idx on public.subscriptions (user_id, status);
create index subscriptions_next_payment_idx on public.subscriptions (user_id, next_payment_date);
create index subscriptions_category_id_idx on public.subscriptions (category_id);

alter table public.subscriptions enable row level security;

create policy "subscriptions_select_own" on public.subscriptions
  for select using ((select auth.uid()) = user_id);
create policy "subscriptions_insert_own" on public.subscriptions
  for insert with check ((select auth.uid()) = user_id);
create policy "subscriptions_update_own" on public.subscriptions
  for update using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "subscriptions_delete_own" on public.subscriptions
  for delete using ((select auth.uid()) = user_id);

create trigger subscriptions_set_updated_at
  before update on public.subscriptions
  for each row execute function public.set_updated_at();

-- ============================================================
-- price_history
-- ============================================================
create table public.price_history (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references public.subscriptions (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  old_amount numeric(12, 2) not null check (old_amount >= 0),
  new_amount numeric(12, 2) not null check (new_amount >= 0),
  currency text not null check (char_length(currency) = 3),
  note text check (note is null or char_length(note) <= 500),
  changed_at timestamptz not null default now()
);

create index price_history_subscription_idx on public.price_history (subscription_id, changed_at desc);
create index price_history_user_idx on public.price_history (user_id, changed_at desc);

alter table public.price_history enable row level security;

create policy "price_history_select_own" on public.price_history
  for select using ((select auth.uid()) = user_id);
create policy "price_history_insert_own" on public.price_history
  for insert with check ((select auth.uid()) = user_id);
create policy "price_history_delete_own" on public.price_history
  for delete using ((select auth.uid()) = user_id);
-- Güncelleme politikası bilinçli olarak yok: fiyat geçmişi kayıtları değiştirilemez.

-- ============================================================
-- notifications
-- ============================================================
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  subscription_id uuid references public.subscriptions (id) on delete cascade,
  type public.notification_type not null,
  title text not null check (char_length(title) between 1 and 200),
  body text check (body is null or char_length(body) <= 1000),
  scheduled_for date,
  -- Aynı bildirimin tekrar üretilmesini engeller
  -- (örn. "sub:<id>:payment_due:2026-11-01:7")
  dedupe_key text,
  read_at timestamptz,
  email_sent_at timestamptz,
  created_at timestamptz not null default now()
);

create unique index notifications_dedupe_idx
  on public.notifications (user_id, dedupe_key)
  where dedupe_key is not null;
create index notifications_user_unread_idx
  on public.notifications (user_id, created_at desc)
  where read_at is null;
create index notifications_user_idx on public.notifications (user_id, created_at desc);

alter table public.notifications enable row level security;

create policy "notifications_select_own" on public.notifications
  for select using ((select auth.uid()) = user_id);
create policy "notifications_insert_own" on public.notifications
  for insert with check ((select auth.uid()) = user_id);
create policy "notifications_update_own" on public.notifications
  for update using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "notifications_delete_own" on public.notifications
  for delete using ((select auth.uid()) = user_id);

-- ============================================================
-- Yeni kullanıcı tetikleyicisi: profil + varsayılan kategoriler
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    new.raw_user_meta_data ->> 'avatar_url'
  );

  insert into public.categories (user_id, name, color, icon, is_default)
  values
    (new.id, 'Eğlence',      '#e11d48', 'clapperboard', true),
    (new.id, 'Müzik',        '#10b981', 'music',        true),
    (new.id, 'Yazılım',      '#8b5cf6', 'code',         true),
    (new.id, 'Bulut Depolama', '#0ea5e9', 'cloud',      true),
    (new.id, 'Oyun',         '#f59e0b', 'gamepad',      true),
    (new.id, 'Haber & Dergi', '#64748b', 'newspaper',   true),
    (new.id, 'Spor & Sağlık', '#22c55e', 'dumbbell',    true),
    (new.id, 'Diğer',        '#94a3b8', 'layers',       true);

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
