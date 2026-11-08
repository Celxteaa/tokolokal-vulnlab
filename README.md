# Tokolokal — Toko Online (dengan Lab Keamanan Tersembunyi)

Toko online yang fungsional dan tampil profesional seperti e-commerce pada
umumnya: katalog produk, keranjang, checkout, riwayat pesanan, dan dashboard
admin. Dibangun dengan Next.js (App Router) + Supabase (Postgres, Auth, RLS),
di-deploy ke Vercel.

**Catatan untuk pemilik/pengelola proyek (bukan untuk ditampilkan di UI):**
di balik tampilan tokonya, proyek ini sengaja menyisipkan beberapa celah
keamanan halus untuk latihan pentest/SAST/DAST — lihat `docs/ANSWER_KEY.md`.
Tampilan toko sendiri tidak menunjukkan apa pun soal ini, persis seperti
aplikasi "vulnerable by design" pada umumnya (mis. OWASP Juice Shop).

## ⚠️ Wajib sebelum pakai
- Gunakan **project Supabase baru/terpisah**, khusus untuk lab ini.
- Jangan pernah pakai data, email, atau password asli.
- Jangan deploy publik tanpa proteksi akses (Vercel Deployment Protection
  atau password gate).

## Fitur toko

- Katalog produk dengan kategori & pencarian (`/produk`)
- Halaman detail produk (`/produk/[slug]`)
- Keranjang belanja client-side (`/keranjang`)
- Checkout & riwayat pesanan (`/checkout`, `/pesanan`)
- Invoice per pesanan, termasuk tombol unduh (`/pesanan/[id]`)
- Akun & profil (`/login`, `/register`, `/profile`)

## Dashboard Admin (login & tampilan terpisah dari toko)

- Login admin tersendiri di `/admin/login` (beda dari `/login` pelanggan)
- Dashboard dengan sidebar di `/admin`: statistik pendapatan, pesanan,
  pengguna, dan jumlah aktivitas yang perlu ditinjau
- `/admin/pesanan` — lihat & ubah status semua pesanan
- `/admin/pengguna` — daftar seluruh pengguna terdaftar
- `/admin/konten` — ubah judul & teks promosi beranda
- `/admin/incidents` — log aktivitas (login, registrasi, transaksi, dll),
  baris yang ditandai menunjukkan pola tidak biasa

## Setup

1. **Buat project Supabase** di https://supabase.com.
2. Buka SQL Editor, jalankan **seluruh isi** `sql/schema.sql` (aman dijalankan
   ulang berkali-kali — semua perintah bersifat idempotent).
3. Authentication → Providers → Email: aktifkan **Allow new users to sign up**,
   dan untuk mempercepat testing lab matikan **Confirm email** (opsional).
4. Salin kredensial di Project Settings → API ke `.env.local` (salin dari
   `.env.example`): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
   `SUPABASE_SERVICE_ROLE_KEY`.
5. Jalankan lokal:
   ```bash
   npm install
   npm run dev
   ```
6. Deploy ke Vercel: import repo GitHub, set tiga environment variable yang
   sama di Project Settings → Environment Variables, lalu Deploy.

## Struktur

```
app/
  page.tsx                   -> beranda: hero, kategori, produk unggulan
  produk/, produk/[slug]/    -> katalog & detail produk
  keranjang/, checkout/      -> alur belanja (client-side cart)
  pesanan/, pesanan/[id]/    -> riwayat & detail pesanan + unduh invoice
  login/, register/, profile/-> akun pelanggan
  admin/login/                -> login khusus admin (terpisah dari /login)
  admin/(dashboard)/          -> dashboard admin terproteksi: overview,
                                  pesanan, pengguna, konten, incidents
  api/checkout/route.ts      -> buat pesanan dari keranjang
  api/profile/route.ts       -> PATCH profil — celah #1 (mass assignment)
  api/site-content/route.ts  -> PATCH konten beranda — dampak celah #2
  api/export/[orderId]/      -> GET invoice — celah #3 (IDOR)
  api/admin/orders/[orderId]/-> PATCH status pesanan (admin, RLS benar)
  api/reset/route.ts         -> reset konten beranda ke default
  api/log-event/route.ts     -> catat login/logout/register ke audit_log
  components/                -> Navbar, Footer, ProductCard, AppShell
lib/
  cart-context.tsx           -> state keranjang (React context + localStorage)
  supabase-browser.ts / supabase-server.ts -> client Supabase
  audit.ts                   -> pencatatan log aktivitas/anomali
sql/schema.sql                -> skema lengkap: produk, pesanan, profil,
                                  konten beranda, log aktivitas, RLS
docs/ANSWER_KEY.md             -> rantai eksploitasi lengkap + cara perbaiki
```

## Reset konten beranda
Tombol "Kembalikan ke Konten Default" ada di `/admin`, atau panggil langsung:
```bash
curl -X POST https://<domain-lab-kamu>/api/reset
```
