# Kunci Jawaban — Tokolokal Vulnerability Lab

Jangan baca sebelum mencoba sendiri. Dokumen ini untuk instruktur / pembuat
soal, berisi daftar celah, cara mengeksploitasi, dan cara memperbaikinya.

**Catatan:** tampilan toko (katalog produk, keranjang, checkout, dashboard
admin) dibuat terlihat seperti e-commerce profesional pada umumnya, dan
sama sekali tidak menyebut kata "keamanan" atau "lab" di mana pun di UI.
Semua celah tertanam secara wajar di balik fitur-fitur toko yang terlihat
normal — persis seperti pola aplikasi "vulnerable by design" sungguhan.

## Daftar celah

### Celah #1 — Mass assignment di `PATCH /api/profile`
**Lokasi:** `app/api/profile/route.ts`
**Akar masalah:** endpoint meneruskan seluruh body request langsung ke
`.update(body)`, tanpa whitelist kolom. RLS (`profiles_update_own`) hanya
mengecek kepemilikan baris (`auth.uid() = id`), bukan kolom apa yang
boleh diubah — jadi RLS tidak menolak percobaan ini.

**Eksploitasi:**
```bash
curl -X PATCH https://<lab>/api/profile \
  -H "Content-Type: application/json" \
  -H "Cookie: <cookie-sesi-setelah-login>" \
  -d '{"username":"saya","bio":"halo","role":"admin"}'
```
Role user yang sedang login berubah jadi `admin` di tabel `profiles`.

**Perbaikan:**
```ts
const { username, bio } = await req.json();
await supabase.from("profiles").update({ username, bio }).eq("id", user.id);
```
Atau tambahkan `with check (role = (select role from profiles where id = auth.uid()))`
di policy, atau pisahkan kolom `role` ke tabel/izin terpisah yang hanya bisa
diubah lewat service role di server dengan pengecekan eksplisit.

---

### Celah #2 — RLS `site_content` hanya cek login, bukan role admin
**Lokasi:** `sql/schema.sql`, policy `site_content_update_authenticated`
**Akar masalah:** `using (auth.role() = 'authenticated')` seharusnya
`using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'))`.

**Dampak:** setelah Celah #1 membuat user biasa punya `role = 'admin'` di
tabel `profiles` (catatan: tabel `profiles`, bukan klaim JWT — policy ini
memang tidak mengecek tabel itu sama sekali), user itu **tetap bisa update
site_content** karena syaratnya cuma "sudah login", apa pun role-nya.
Jadi sebenarnya Celah #1 di sini tidak wajib — siapa pun yang authenticated
sudah bisa langsung deface tanpa perlu privilege escalation dulu. Ini
sengaja dibuat berlapis supaya peserta menyadari dua masalah terpisah:
(a) siapa saja yang login bisa update site_content (celah utama), dan
(b) role di profiles bisa dinaikkan sembarangan (celah kedua, independen).

**Eksploitasi (jalur tercepat):**
```bash
curl -X PATCH https://<lab>/api/site-content \
  -H "Content-Type: application/json" \
  -H "Cookie: <cookie-sesi-user-biasa-apa-saja>" \
  -d '{"key":"homepage_banner","value":"DEFACED by <nama>"}'
```
Homepage langsung berubah — ini deface-nya.

**Perbaikan SQL:**
```sql
drop policy "site_content_update_authenticated" on site_content;
create policy "site_content_update_admin_only"
  on site_content for update
  using (exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  ));
```

---

### Celah #3 — IDOR di `GET /api/export/[orderId]`
**Lokasi:** `app/api/export/[orderId]/route.ts`
**Akar masalah:** memakai `service_role` (bypass RLS) untuk ambil data
order, tapi lupa `.eq("user_id", user.id)`.

Fitur ini dipakai di tombol **"Unduh Invoice"** pada halaman detail pesanan
(`/pesanan/[id]`), jadi secara tampilan terasa seperti fitur toko biasa.

**Eksploitasi:** user A login, lalu tebak/urutkan UUID order milik user B
(ID order terlihat di URL `/pesanan/<id>` — kalau ID berurutan atau
ditemukan lewat cara lain, makin mudah), lalu:
```bash
curl https://<lab>/api/export/<order-id-milik-user-lain> \
  -H "Cookie: <cookie-sesi-user-A>"
```
Isi invoice (daftar item, total, status) milik user lain ikut terbaca.

**Perbaikan:**
```ts
const { data: order } = await service
  .from("orders")
  .select("id, items, total, status, created_at, user_id")
  .eq("id", params.orderId)
  .eq("user_id", user.id)   // <- baris yang hilang
  .single();
```
Atau lebih baik lagi: jangan pakai service_role sama sekali di sini, pakai
client biasa (anon key + sesi) supaya RLS otomatis menjaga.

---

### Celah #2b — Gerbang `/admin/login` bisa dilewati lewat akses URL langsung
**Lokasi:** `app/admin/login/page.tsx` vs `app/admin/(dashboard)/layout.tsx`
**Akar masalah:** `/admin/login` memang mengecek `role === 'admin'` dengan
benar sebelum mengizinkan masuk — terlihat seperti gerbang yang aman. Tapi
`app/admin/(dashboard)/layout.tsx` (yang membungkus SEMUA halaman dashboard)
hanya mengecek "apakah ada sesi login", bukan role. Ini pola **broken access
control klasik (forced browsing)**: ada satu pintu yang dijaga ketat, tapi
isi gedungnya bisa diakses lewat pintu lain yang tidak dijaga sama sekali.

**Eksploitasi:** daftar/login sebagai user BIASA lewat `/login` (bukan
`/admin/login`), lalu langsung ketik URL `/admin` di address bar. Dashboard
tetap terbuka — termasuk `/admin/pengguna` yang menampilkan email seluruh
pengguna (lewat `service_role`, lihat catatan di file tersebut), walau
user ini tidak pernah lolos pengecekan role di `/admin/login`.

**Perbaikan:** tambahkan pengecekan role yang sama di
`app/admin/(dashboard)/layout.tsx`, bukan hanya di halaman login-nya:
```ts
const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
if (profile?.role !== "admin") redirect("/admin/login");
```
Prinsip umum: **gerbang di satu halaman tidak pernah cukup** — otorisasi
harus dicek di titik yang benar-benar melindungi data/aksinya (idealnya di
layout yang membungkus semua halaman admin, DAN di setiap RLS policy).

---

### Celah #4 (opsional, mudah ditambahkan) — Secret di riwayat git / source map
Kalau mau menambah satu lapis recon: commit awal proyek bisa sengaja
menyertakan `.env.local` lalu "dihapus" di commit berikutnya (tetap ada di
riwayat git). Peserta yang melakukan `git log -p` bisa menemukan anon key
dan URL Supabase lebih cepat. **Jangan** masukkan `service_role` asli ke
riwayat git mana pun, bahkan yang "sudah dihapus" — ganti key di Supabase
kalau pernah ter-commit beneran.

## Rantai deface end-to-end (ringkas)
1. Daftar akun biasa di `/register`.
2. (Opsional, untuk menunjukkan Celah #1) Kirim `PATCH /api/profile` dengan
   `role: "admin"` di body.
3. Kirim `PATCH /api/site-content` dengan key `homepage_banner` dan value
   bebas — berhasil walau role masih `user`, karena Celah #2 independen.
4. Buka `/` — homepage sudah berubah. **Deface berhasil.**
5. Reset: `POST /api/reset` atau klik tombol di `/admin`.

## Monitoring insiden (untuk admin)
Selain aksi pada endpoint sensitif (`/api/profile`, `/api/site-content`,
`/api/export/[orderId]`, `/api/reset`, `/api/checkout`), log juga mencatat
event auth yang terjadi di browser lewat `/api/log-event`: login berhasil,
login gagal, logout, registrasi akun baru, dan percobaan login di
`/admin/login` yang ditolak karena role bukan admin (`admin_access_denied`
— ini SELALU ditandai suspicious, karena jadi sinyal paling jelas ada
orang yang mencoba masuk ke area admin tanpa hak akses).

Baris ditandai `is_suspicious = true` kalau:
- body `/api/profile` menyertakan field `role` (indikasi percobaan
  privilege escalation, Celah #1),
- `/api/site-content` diubah oleh user yang role-nya bukan `admin`
  (indikasi eksploitasi Celah #2 — ini akan selalu true sebelum
  policy-nya diperbaiki, karena memang semua orang authenticated bisa lewat),
- `/api/export/[orderId]` mengembalikan order yang `user_id`-nya BUKAN
  milik user yang login (indikasi IDOR, Celah #3).

Lihat di `/admin/incidents`. Akses ke tabel `audit_log` sendiri dibatasi
RLS hanya untuk `profiles.role = 'admin'` — jadi kalau Celah #1 sudah
dipakai attacker untuk menaikkan role-nya sendiri, attacker tersebut
**juga bisa melihat (dan berpotensi menutupi) jejaknya sendiri**. Ini
sengaja dibiarkan apa adanya karena realistis: di banyak insiden nyata,
begitu attacker dapat akses admin, dia juga dapat akses ke log monitoring.
Pelajaran untuk peserta: log sensitif idealnya dikirim juga ke sistem
terpisah (SIEM eksternal) yang tidak bisa diakses lewat akun yang sama
dengan aplikasi yang dipantau.

## Cara memverifikasi lab sudah "ditambal" dengan benar
Setelah menerapkan ketiga perbaikan di atas, ulangi langkah 1–3: langkah 3
harus gagal dengan `403`/RLS error kecuali role user benar-benar `admin`
yang diset lewat jalur tepercaya (misal langsung dari SQL editor atau
endpoint admin-only dengan verifikasi manual).
