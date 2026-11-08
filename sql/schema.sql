-- =============================================================
-- VULNLAB SCHEMA — Lab web rentan (baseline aman + celah halus)
-- Jalankan di SQL Editor Supabase (project lab TERPISAH, data palsu)
-- =============================================================

-- ---------- EXTENSIONS ----------
create extension if not exists "pgcrypto";

-- ---------- PROFILES ----------
-- Dibuat dengan benar sejak awal: RLS aktif, policy wajar.
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  bio text default '',
  role text not null default 'user',           -- 'user' | 'editor' | 'admin'
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

-- Siapa saja yang login boleh lihat profil publik (seperti umumnya situs sosial)
create policy "profiles_select_all"
  on profiles for select
  using (true);

-- User hanya boleh update baris miliknya sendiri
-- CATATAN CELAH #1 (mass assignment / privilege escalation):
-- Policy ini mengecek KEPEMILIKAN baris dengan benar (auth.uid() = id),
-- tapi TIDAK membatasi KOLOM apa saja yang boleh diubah.
-- Karena endpoint API /api/profile meneruskan seluruh body ke .update(),
-- user bisa menyertakan {"role": "admin"} dan lolos row-level check ini.
-- (Perbaikan sebenarnya: batasi kolom lewat view/RPC, atau validasi di API.)
create policy "profiles_update_own"
  on profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "profiles_insert_own"
  on profiles for insert
  with check (auth.uid() = id);

-- ---------- AUTO-CREATE PROFILE SAAT USER BARU DAFTAR ----------
-- Ini pendekatan resmi yang direkomendasikan Supabase: daripada membuat
-- baris profiles dari sisi BROWSER (yang rawan race condition dengan RLS
-- karena session belum tentu "siap" tepat saat insert dikirim), baris
-- profiles dibuat otomatis oleh TRIGGER di database setiap kali ada baris
-- baru masuk ke auth.users. Trigger berjalan dengan SECURITY DEFINER,
-- artinya dieksekusi dengan hak akses pemilik fungsi (bukan hak akses user
-- yang mendaftar), sehingga RLS sama sekali tidak relevan di sini.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    'user'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ---------- SITE CONTENT (target deface) ----------
create table if not exists site_content (
  key text primary key,              -- misal: 'homepage_title', 'homepage_banner'
  value text not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);

alter table site_content enable row level security;

-- Semua orang (termasuk anon) boleh membaca konten homepage — ini normal.
create policy "site_content_select_public"
  on site_content for select
  using (true);

-- CATATAN CELAH #2 (RLS longgar — akar dari kemungkinan deface):
-- Policy update seharusnya mengecek role = 'admin' DI DALAM TABEL PROFILES,
-- tapi dibuat terburu-buru (mis. saat deploy fitur CMS ringan) dan hanya
-- mengecek bahwa user sudah login (authenticated), bukan role-nya.
-- Ini kelihatan wajar sekilas ("yang penting sudah login"), padahal
-- seharusnya join ke profiles dan cek role = 'admin'.
create policy "site_content_update_authenticated"
  on site_content for update
  using (auth.role() = 'authenticated');

insert into site_content (key, value) values
  ('homepage_title', 'Selamat Datang di TokoLokal'),
  ('homepage_banner', 'Promo akhir tahun — diskon hingga 30%!')
on conflict (key) do nothing;

-- Snapshot untuk reset (jangan diubah user biasa — tanpa RLS khusus,
-- tapi tidak diekspos lewat API apa pun selain /api/reset yang pakai service role)
create table if not exists site_content_defaults (
  key text primary key,
  value text not null
);
insert into site_content_defaults (key, value) values
  ('homepage_title', 'Selamat Datang di TokoLokal'),
  ('homepage_banner', 'Promo akhir tahun — diskon hingga 30%!')
on conflict (key) do nothing;


-- ---------- PRODUCTS (katalog toko) ----------
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text not null default '',
  price numeric not null,
  category text not null,
  emoji text not null default '🛍️',
  stock int not null default 100,
  created_at timestamptz not null default now()
);

alter table products enable row level security;

create policy "products_select_all"
  on products for select
  using (true);

insert into products (slug, name, description, price, category, emoji, stock) values
  ('kopi-gayo-arabika', 'Kopi Gayo Arabika 250g', 'Biji kopi arabika single origin dari dataran tinggi Gayo, sangrai medium, aroma cokelat dan jeruk.', 85000, 'Makanan & Minuman', '☕', 50),
  ('keripik-tempe-original', 'Keripik Tempe Original', 'Keripik tempe renyah, digoreng dengan minyak kelapa, tanpa pengawet.', 28000, 'Makanan & Minuman', '🥨', 120),
  ('tas-rotan-anyam', 'Tas Rotan Anyam Tangan', 'Tas tangan dari anyaman rotan asli pengrajin Yogyakarta, muat laptop 13 inci.', 165000, 'Kerajinan Tangan', '👜', 30),
  ('vas-keramik-motif', 'Vas Keramik Motif Kawung', 'Vas keramik buatan tangan dengan motif batik kawung, tinggi 25cm.', 220000, 'Kerajinan Tangan', '🏺', 18),
  ('batik-tulis-lereng', 'Kain Batik Tulis Motif Lereng', 'Kain batik tulis asli, pewarna alami, panjang 2 meter.', 450000, 'Fashion & Tekstil', '🧵', 12),
  ('kemeja-tenun-lurik', 'Kemeja Tenun Lurik Pria', 'Kemeja lengan panjang dari kain tenun lurik, bahan adem, ukuran S-XL.', 185000, 'Fashion & Tekstil', '👔', 40),
  ('lampu-hias-bambu', 'Lampu Hias Anyaman Bambu', 'Lampu gantung dari anyaman bambu, cocok untuk ruang tamu bergaya natural.', 310000, 'Dekorasi Rumah', '💡', 15),
  ('taplak-meja-tenun', 'Taplak Meja Tenun Ikat', 'Taplak meja dari tenun ikat NTT, motif geometris, ukuran 150x90cm.', 195000, 'Dekorasi Rumah', '🧶', 22)
on conflict (slug) do nothing;

-- ---------- ORDERS (riwayat pesanan; juga titik celah IDOR di /api/export) ----------
-- "items" menyimpan snapshot produk saat checkout (nama & harga saat itu),
-- supaya invoice tidak berubah walau harga produk di katalog berubah kemudian —
-- ini praktik wajar di sistem e-commerce sungguhan.
create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  items jsonb not null default '[]'::jsonb,
  total numeric not null,
  status text not null default 'selesai',   -- 'selesai' | 'diproses' | 'dibatalkan'
  created_at timestamptz not null default now()
);

-- Migrasi aman untuk project yang sudah lebih dulu menjalankan skema versi lama
-- (yang punya kolom "item text not null" tanpa "items jsonb").
alter table orders add column if not exists items jsonb not null default '[]'::jsonb;
alter table orders add column if not exists status text not null default 'selesai';

-- Kolom "item" (text) hanya ada di project yang menjalankan skema versi lama.
-- Longgarkan constraint-nya kalau memang masih ada, supaya tidak mengganggu
-- insert order baru yang sekarang memakai kolom "items" (jsonb).
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_name = 'orders' and column_name = 'item'
  ) then
    execute 'alter table orders alter column item drop not null';
  end if;
end $$;

alter table orders enable row level security;

-- Dibuat benar: user hanya bisa lihat order miliknya sendiri lewat Supabase client.
create policy "orders_select_own"
  on orders for select
  using (auth.uid() = user_id);

create policy "orders_insert_own"
  on orders for insert
  with check (auth.uid() = user_id);

-- Admin boleh melihat & mengubah status SEMUA pesanan (fitur dashboard admin).
-- Policy ini ditulis BENAR (mengecek role di profiles), berbeda dengan
-- site_content di atas. Tetap bisa "ditembus" kalau attacker sudah lebih
-- dulu menaikkan role-nya sendiri jadi admin lewat Celah #1.
create policy "orders_select_admin"
  on orders for select
  using (exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  ));

create policy "orders_update_admin"
  on orders for update
  using (exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  ));

-- CATATAN CELAH #3 (IDOR) ADA DI KODE API, BUKAN DI SINI:
-- /api/export/[orderId] sengaja memakai service_role key di server untuk
-- "mempermudah" generate PDF/invoice, lalu lupa menambahkan pengecekan
-- `order.user_id === session.user.id` sebelum mengembalikan data.
-- Endpoint lain (yang pakai anon key + RLS) sudah benar.


-- ---------- AUDIT LOG (monitoring insiden) ----------
create table if not exists audit_log (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  actor_id uuid references auth.users(id),
  actor_email text,
  action text not null,           -- 'profile_update' | 'site_content_update' | 'export_access' | 'reset'
  detail jsonb not null default '{}',
  is_suspicious boolean not null default false,
  request_ip text
);

-- Hanya admin yang boleh membaca log (dicek lewat role di profiles).
-- Insert dilakukan lewat service_role di server, jadi tidak perlu policy insert.
alter table audit_log enable row level security;

create policy "audit_log_select_admin_only"
  on audit_log for select
  using (exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  ));

create index if not exists idx_audit_log_created_at on audit_log(created_at desc);
create index if not exists idx_audit_log_suspicious on audit_log(is_suspicious) where is_suspicious = true;

-- ---------- Index kecil biar terasa seperti proyek nyata ----------
create index if not exists idx_orders_user_id on orders(user_id);
create index if not exists idx_site_content_updated_at on site_content(updated_at);
