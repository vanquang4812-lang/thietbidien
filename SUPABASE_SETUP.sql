-- Run this once in Supabase SQL Editor.
-- Public visitors can read products and images; only listed admins can write.

create table if not exists public.product_catalog (
  id text primary key check (id = 'main'),
  products jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.site_admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);

alter table public.product_catalog enable row level security;
alter table public.site_admins enable row level security;

drop policy if exists "Public can read product catalog" on public.product_catalog;
create policy "Public can read product catalog"
  on public.product_catalog for select to anon, authenticated
  using (true);

drop policy if exists "Admins can insert product catalog" on public.product_catalog;
create policy "Admins can insert product catalog"
  on public.product_catalog for insert to authenticated
  with check (exists (
    select 1 from public.site_admins
    where user_id = (select auth.uid())
  ));

drop policy if exists "Admins can update product catalog" on public.product_catalog;
create policy "Admins can update product catalog"
  on public.product_catalog for update to authenticated
  using (exists (
    select 1 from public.site_admins
    where user_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.site_admins
    where user_id = (select auth.uid())
  ));

drop policy if exists "Admins can read own membership" on public.site_admins;
create policy "Admins can read own membership"
  on public.site_admins for select to authenticated
  using (user_id = (select auth.uid()));

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do update set public = true;

drop policy if exists "Public can read product images" on storage.objects;
create policy "Public can read product images"
  on storage.objects for select to public
  using (bucket_id = 'product-images');

drop policy if exists "Admins can manage product images" on storage.objects;
create policy "Admins can manage product images"
  on storage.objects for all to authenticated
  using (
    bucket_id = 'product-images'
    and exists (
      select 1 from public.site_admins
      where user_id = (select auth.uid())
    )
  )
  with check (
    bucket_id = 'product-images'
    and exists (
      select 1 from public.site_admins
      where user_id = (select auth.uid())
    )
  );

-- After creating the admin user in Supabase Auth, grant it access with:
-- insert into public.site_admins (user_id) values ('AUTH-USER-UUID');
