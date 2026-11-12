-- Reality Food — initial schema (Prompt 2).
-- Multi-tenant: every row belongs to a restaurant. Row Level Security is on
-- for every table: diners read published menus, owners/staff manage only
-- their own restaurant, platform admins manage everything.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.platform_admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.restaurants (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and slug not in ('en', 'es', 'admin', 'api', 'qr')),
  name text not null check (char_length(name) between 1 and 80),
  tagline jsonb not null default '{}'::jsonb, -- {"en": "...", "es": "..."}
  logo_path text,
  primary_color text not null default '#B8301F' check (primary_color ~ '^#[0-9a-fA-F]{6}$'),
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create type public.member_role as enum ('owner', 'staff');

create table public.restaurant_members (
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.member_role not null default 'staff',
  created_at timestamptz not null default now(),
  primary key (restaurant_id, user_id)
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  slug text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name jsonb not null, -- {"en": "Desserts", "es": "Postres"}
  sort_order int not null default 0,
  unique (restaurant_id, slug)
);

create type public.vessel as enum ('plate', 'cup', 'glass', 'bowl', 'pan');

create table public.dishes (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  category_id uuid references public.categories (id) on delete set null,
  slug text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name jsonb not null,
  description jsonb not null default '{}'::jsonb,
  price_cents int not null check (price_cents >= 0),
  tags text[] not null default '{}',
  photo_path text,
  model_glb_path text,
  model_usdz_path text,
  -- True size: the widest point of the model must match this (checked on upload).
  plate_diameter_cm numeric(5, 1) not null check (plate_diameter_cm between 3 and 80),
  portion_cm jsonb, -- {"width": 8.0, "depth": 8.2, "height": 8.5}
  served_in public.vessel not null default 'plate',
  served_in_oz numeric(4, 1),
  is_available boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (restaurant_id, slug)
);

create index dishes_restaurant_idx on public.dishes (restaurant_id, sort_order);

-- Usage data for owner reports (menu views, dish views, AR opens).
create type public.menu_event_type as enum ('menu_view', 'dish_view', 'ar_open', 'ar_placed');

create table public.menu_events (
  id bigint generated always as identity primary key,
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  dish_id uuid references public.dishes (id) on delete set null,
  type public.menu_event_type not null,
  table_label text check (char_length(table_label) <= 20),
  locale text check (locale in ('en', 'es')),
  session_id uuid, -- random per browser tab; no personal data
  created_at timestamptz not null default now()
);

create index menu_events_report_idx on public.menu_events (restaurant_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create function public.is_platform_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.platform_admins where user_id = auth.uid());
$$;

create function public.is_member(rid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.restaurant_members where restaurant_id = rid and user_id = auth.uid());
$$;

create function public.is_owner(rid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.restaurant_members where restaurant_id = rid and user_id = auth.uid() and role = 'owner'
  );
$$;

create function public.is_published(rid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.restaurants where id = rid and is_published);
$$;

create function public.touch_updated_at() returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger restaurants_touch before update on public.restaurants for each row execute function public.touch_updated_at();
create trigger dishes_touch before update on public.dishes for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.platform_admins enable row level security;
alter table public.restaurants enable row level security;
alter table public.restaurant_members enable row level security;
alter table public.categories enable row level security;
alter table public.dishes enable row level security;
alter table public.menu_events enable row level security;

-- platform_admins: only admins can see the list; changes only via the dashboard SQL editor.
create policy "admins read admins" on public.platform_admins for select using (public.is_platform_admin());

-- restaurants
create policy "public reads published restaurants" on public.restaurants for select using (is_published);
create policy "members read their restaurant" on public.restaurants for select using (public.is_member(id));
create policy "owners update their restaurant" on public.restaurants for update using (public.is_owner(id)) with check (public.is_owner(id));
create policy "admins manage restaurants" on public.restaurants for all using (public.is_platform_admin()) with check (public.is_platform_admin());

-- restaurant_members
create policy "members see their team" on public.restaurant_members for select using (public.is_member(restaurant_id));
create policy "admins manage members" on public.restaurant_members for all using (public.is_platform_admin()) with check (public.is_platform_admin());

-- categories
create policy "public reads published categories" on public.categories for select using (public.is_published(restaurant_id));
create policy "members manage categories" on public.categories for all using (public.is_member(restaurant_id)) with check (public.is_member(restaurant_id));
create policy "admins manage categories" on public.categories for all using (public.is_platform_admin()) with check (public.is_platform_admin());

-- dishes: staff edit text, price and availability; 3D models are uploaded by admins
-- (enforced in the app; the true-size check runs on upload).
create policy "public reads published dishes" on public.dishes for select using (public.is_published(restaurant_id));
create policy "members manage dishes" on public.dishes for all using (public.is_member(restaurant_id)) with check (public.is_member(restaurant_id));
create policy "admins manage dishes" on public.dishes for all using (public.is_platform_admin()) with check (public.is_platform_admin());

-- menu_events: anyone may record an event for a published menu; only the team reads them.
create policy "diners record events" on public.menu_events for insert with check (public.is_published(restaurant_id));
create policy "members read events" on public.menu_events for select using (public.is_member(restaurant_id));
create policy "admins read events" on public.menu_events for select using (public.is_platform_admin());

-- ---------------------------------------------------------------------------
-- Storage: dish photos and 3D models, stored as <restaurant_id>/<file>
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'dish-media',
  'dish-media',
  true,
  5242880, -- 5 MB, same limit as npm run check-models
  array['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'model/gltf-binary', 'model/vnd.usdz+zip', 'application/octet-stream']
)
on conflict (id) do nothing;

create policy "public reads dish media" on storage.objects for select using (bucket_id = 'dish-media');
create policy "members upload media" on storage.objects for insert
  with check (bucket_id = 'dish-media' and (public.is_platform_admin() or public.is_member(((storage.foldername(name))[1])::uuid)));
create policy "members update media" on storage.objects for update
  using (bucket_id = 'dish-media' and (public.is_platform_admin() or public.is_member(((storage.foldername(name))[1])::uuid)));
create policy "members delete media" on storage.objects for delete
  using (bucket_id = 'dish-media' and (public.is_platform_admin() or public.is_member(((storage.foldername(name))[1])::uuid)));
