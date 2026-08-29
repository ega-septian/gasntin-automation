# Technical Requirements Document (TRD)

## Homepage

|  |  |
| --- | --- |
| **Document** | TRD-SHOPCO-HOMEPAGE-v1.1 |
| **Status** | Draft |
| **Scope** | Frontend (Section 1-7) dan Backend Asset Service yang dipakai Homepage (Section 8-11). Product/catalog API (data produk, kategori, testimoni) masih di luar cakupan — datanya masih hardcoded di frontend, lihat Known Gaps. |
| **Related PRD** | PRD-SHOPCO-HOMEPAGE-v1.0 |
| **Target Application** | SHOP.CO (frontend Vue 3 + backend Go/Gin + PostgreSQL) |
| **Date** | 28 Agustus 2026 |

---

## 1. Architecture Overview

Homepage adalah satu view Vue (`HomeView.vue`, route `/`, tanpa route guard — bisa diakses anonim maupun sudah login). Berbeda dari fitur Login yang punya store dedicated, Homepage **tidak punya store sendiri** — ia cuma membaca `useAuthStore()` yang sudah ada (dari fitur Auth) untuk satu keperluan: menentukan arah redirect tombol CTA.

Hampir seluruh konten (produk, kategori, testimoni, brand) adalah **data statis di dalam komponen**, bukan hasil fetch API. Satu-satunya panggilan ke backend adalah untuk gambar hero banner.

```
[HomeView.vue]
   | useAuthStore()            -> baca status login (untuk goToCta)
   | getAsset('hero_banner')   -> GET /api/assets/hero_banner (satu kali, saat mount)
   v
[Go API - Asset Service, lihat Section 8-11]
```

## 2. Struktur Komponen

Single-file component `frontend/src/views/HomeView.vue`. Section utama beserta `data-testid`-nya:

| Section | `data-testid` |
| --- | --- |
| Promo bar | `home-promo-bar`, `home-promo-bar-cta` |
| Navbar | `home-navbar`, `home-navbar-logo`, `home-search-input`, `home-cart-button`, `home-navbar-cta` |
| Hero | `home-hero-section`, `home-hero-heading`, `home-hero-cta`, `home-hero-stats`, `home-hero-banner` / `home-hero-banner-mobile` |
| Brand strip | `home-brand-strip`, `home-brand-item-{index}` |
| New Arrivals | `home-new-arrivals-section`, `home-new-arrival-card-{index}` |
| Top Selling | `home-top-selling-section`, `home-top-selling-card-{index}` |
| Dress Style | `home-dress-style-section`, `home-dress-style-card-{index}` |
| Testimonials | `home-testimonials-section`, `home-testimonial-card-{index}` |
| Newsletter | `home-newsletter-section`, `home-newsletter-email-input`, `home-newsletter-submit` |
| Footer | `home-footer` |

## 3. State & Data

- `heroBannerUrl` (ref, awalnya `null`) — diisi lewat `onMounted` async setelah `getAsset('hero_banner')` berhasil; kalau gagal (`catch`), tetap `null` dan template jatuh ke placeholder emoji (`v-else`). Tidak ada retry/loading indicator untuk state ini.
- `newArrivals`, `topSelling`, `dressStyles`, `testimonials`, `brands` — array statis yang didefinisikan langsung di `<script setup>`, **bukan hasil fetch**. Mengubah kontennya saat ini berarti mengubah kode, bukan data.
- `useAuthStore().isAuthenticated` — dibaca sekali per klik tombol CTA lewat `goToCta()`, tidak reaktif ditampilkan di UI Homepage (cuma menentukan tujuan redirect).

## 4. Routing & Perilaku Navigasi

- `goToCta()`: `router.push({ name: auth.isAuthenticated ? 'dashboard' : 'login' })` — dipanggil dari 3 tempat: tombol promo bar (`home-promo-bar-cta`), tombol navbar (`home-navbar-cta`), dan tombol hero (`home-hero-cta`). Ketiganya berbagi logika yang identik, tidak ada tombol dengan tujuan berbeda.
- Nav link `Shop` / `On Sale` / `New Arrivals` / `Brands` adalah **anchor dalam halaman** (`href="#shop"`, dst — scroll ke section, bukan route Vue Router terpisah).
- Tombol "View All" (New Arrivals & Top Selling), kartu produk, dan kartu dress style **tidak punya event handler** — murni tampilan, klik tidak melakukan apa-apa. **Penting untuk QA**: jangan tulis test yang mengasumsikan elemen-elemen ini melakukan navigasi.
- Form newsletter memakai `@submit.prevent` tanpa logika lanjutan — submit hanya mencegah reload halaman, tidak ada pemanggilan API atau validasi.
- Tombol cart (🛒) dan search input tidak punya handler/state sama sekali.

## 5. Ketergantungan ke Backend (dari sisi Frontend)

Satu-satunya pemanggilan API dari Homepage: `getAsset('hero_banner')` (`frontend/src/lib/api.js`) → `GET /api/assets/hero_banner`, dikonsumsi lewat `assetFileUrl(asset)` yang menggabungkan `BASE_URL + asset.url` jadi URL gambar penuh. Kegagalan (network error, 404, dsb.) ditangkap oleh `try/catch` di `onMounted` dan tidak melempar error ke UI. Detail lengkap implementasi & kontrak endpoint-nya ada di Section 8-11.

## 6. Catatan Desain Responsif

- Hero banner punya **dua markup terpisah** untuk breakpoint berbeda: `home-hero-banner-mobile` (`lg:hidden`, banner di bawah teks, alur normal) dan `home-hero-banner` (`hidden lg:block`, full-bleed nempel kanan sebagai elemen posisi absolut). Ini bukan satu elemen yang di-resize CSS, tapi dua blok markup berbeda yang saling exclusive berdasarkan breakpoint — perlu diperhatikan kalau nanti bikin test visual per breakpoint.
- Grid produk (New Arrivals, Top Selling) memakai `grid-cols-2` di mobile, `lg:grid-cols-4` di desktop.
- Grid dress style tetap `grid-cols-2` di semua breakpoint (tidak berubah jadi 4 kolom di desktop, beda dari grid produk).

## 7. Known Gaps / Elemen Non-Fungsional (Frontend)

- Search input: ada secara visual, tidak ada logika pencarian.
- Cart button: ikon saja, tidak ada state/fungsi keranjang.
- Nav link navbar: anchor scroll dalam halaman, bukan halaman/route sungguhan.
- Tombol "View All" & kartu produk: tidak bisa diklik untuk melihat detail produk.
- Kartu dress style: styling menyarankan bisa diklik (`cursor-pointer`, efek hover), tapi tidak ada handler — kemungkinan fitur yang direncanakan tapi belum selesai dikerjakan.
- Newsletter: submit tidak memanggil API apa pun, email yang diketik tidak tersimpan di mana pun.
- Footer: seluruh item link (Company/Help/FAQ) adalah teks statis, tanpa `href` atau navigasi.
- Seluruh data katalog (produk, kategori, testimoni, brand) hardcoded di komponen — belum ada Product API.

## 8. Backend Architecture Overview (Asset Service)

Ketergantungan backend Homepage bukan endpoint yang dibuat khusus untuknya, melainkan **Asset Service** generik (upload/serve gambar) yang bisa dipakai fitur lain juga ke depannya.

```
[Admin/CMS client] --POST /api/assets/upload (Bearer token)--> AssetHandler.Upload
                                                                     |
                                                                     v
                                                     content-type sniffing, validasi tipe,
                                                     simpan file ke disk (UploadDir),
                                                     upsert row ke tabel assets

[HomeView.vue] --GET /api/assets/hero_banner (publik)--> AssetHandler.Get --> tabel assets

[Browser] --GET /uploads/<filename> (static, publik)--> file di disk
```

File disajikan lewat `router.Static("/uploads", cfg.UploadDir)` (`cmd/api/main.go`) — langsung serve file statis dari disk, bukan lewat handler API.

## 9. Backend Data Model

Tabel `assets` (migration `0002_create_assets.sql`):

```sql
id            UUID          PRIMARY KEY DEFAULT gen_random_uuid()
key           TEXT          NOT NULL UNIQUE   -- contoh: "hero_banner", "logo"
filename      TEXT          NOT NULL
url           TEXT          NOT NULL          -- path relatif, contoh "/uploads/hero_banner-a1b2c3d4.jpg"
content_type  TEXT          NOT NULL
size_bytes    BIGINT        NOT NULL
created_at    TIMESTAMPTZ   NOT NULL DEFAULT now()
updated_at    TIMESTAMPTZ   NOT NULL DEFAULT now()
```

Index tambahan `idx_assets_key` — sama seperti pada tabel `users` di fitur Login, kemungkinan redundant dengan index implisit dari constraint `UNIQUE`.

## 10. Backend API Design

| Method | Endpoint | Auth | Request | Success | Error |
| --- | --- | --- | --- | --- | --- |
| GET | `/api/assets/{key}` | – | – | 200 `{id, key, filename, url, content_type, size_bytes, created_at, updated_at}` | 404 "asset tidak ditemukan" |
| GET | `/api/assets` | – | – | 200 `[Asset]` (array, urut berdasar `key`) | 500 |
| POST | `/api/assets/upload` | Bearer token | `multipart/form-data`: `key` (text), `image` (file) | 200 Asset object (upsert — replace kalau `key` sudah ada) | 400 field kosong, 413 file melebihi `MAX_UPLOAD_MB`, 415 tipe file tidak didukung, 500 |
| DELETE | `/api/assets/{key}` | Bearer token | – | 204 No Content | 404 "asset tidak ditemukan" |

Implementasi: `backend/internal/handlers/asset_handler.go`, di-mount di `router.Group("/api/assets")` (`cmd/api/main.go`). `GET` (single & list) bersifat publik — tidak butuh login, sesuai kebutuhan Homepage yang bisa diakses anonim.

**Detail validasi upload:**

- Tipe file divalidasi dari **isi byte sungguhan** (`http.DetectContentType`, 512 byte pertama), bukan dari header `Content-Type` yang dikirim client — mencegah file disamarkan jadi gambar.
- Tipe yang diizinkan: `image/jpeg`, `image/png`, `image/webp`, `image/gif`, `image/svg+xml`.
- Ukuran maksimum dari env `MAX_UPLOAD_MB` (default 5 MB).
- Nama file baru dibuat dari `key` (disanitasi) + random hex 8 karakter + ekstensi — mencegah collision maupun path traversal dari nama asli file.
- Upload ke `key` yang sudah ada = **replace** (upsert DB + hapus file lama dari disk setelah file baru berhasil tersimpan).

## 11. Backend Known Gaps / Risks

- **`GET /api/assets/{key}` dan `GET /api/assets` bersifat publik sepenuhnya** — siapa pun bisa melihat daftar & metadata semua asset yang pernah diupload. Wajar untuk hero banner, tapi perlu diperhatikan kalau Asset Service ini dipakai untuk kebutuhan lain yang lebih sensitif.
- **Hasil `os.Remove` tidak dicek** (`_ = os.Remove(...)`, baik saat replace di `Upload` maupun di `Delete`) — kalau gagal, tidak ada log/pemberitahuan; berpotensi menumpuk file orphan di server tanpa terdeteksi.
- **Tidak ada image processing** (resize/compress/thumbnail) — file diupload & disajikan apa adanya, ukuran besar bisa memperlambat load Homepage karena hero banner diambil langsung dari file asli.
- Upload/delete dilindungi `RequireAuth` biasa (semua user bertoken valid) — **belum ada pembedaan role/permission** (mis. hanya admin yang boleh ubah asset situs). Konsisten dengan gap yang sama yang sudah dicatat di TRD Login (belum ada role/permission sama sekali di seluruh sistem).

## 12. Traceability ke PRD

| PRD Requirement | Komponen/Kode |
| --- | --- |
| FR-1 (hero content) | `HomeView.vue` — section hero, `heroStats` inline template |
| FR-2 (hero banner + fallback) | Frontend: `heroBannerUrl` ref, `onMounted`, `getAsset()`/`assetFileUrl()` di `lib/api.js`. Backend: `GET /api/assets/hero_banner` — `asset_handler.go:Get`, lihat Section 8-10 |
| FR-3, FR-4 (redirect CTA sesuai status login) | `goToCta()`, `useAuthStore().isAuthenticated` |
| FR-5 (promo bar) | `home-promo-bar` section |
| FR-6 (brand strip) | `brands` array, `home-brand-strip` section |
| FR-7 (New Arrivals) | `newArrivals` array, `home-new-arrivals-section` |
| FR-8 (Top Selling) | `topSelling` array, `home-top-selling-section` |
| FR-9 (Dress Style) | `dressStyles` array, `home-dress-style-section` |
| FR-10 (Testimonials) | `testimonials` array, `home-testimonials-section` |
| FR-11 (Newsletter) | `home-newsletter-section` (tampilan saja, lihat Section 7) |
| FR-12 (Footer) | `home-footer` section |
| NFR-1 (responsif) | Breakpoint Tailwind, lihat Section 6 |
| NFR-2 (testability/testid) | Tabel `data-testid` di Section 2 |
| NFR-3 (banner tidak blocking, gagal-tanpa-error) | Frontend: `onMounted` async + `try/catch`. Backend: `asset_repo.go`, tabel `assets`, lihat Section 8-9 |

---

_Dokumen ini disusun terbalik (reverse-engineered) dari kode yang sudah berjalan (`frontend/src/views/HomeView.vue`, `frontend/src/lib/api.js`, `backend/internal/handlers/asset_handler.go`, `backend/internal/models/asset_repo.go`), mengacu ke PRD-SHOPCO-HOMEPAGE-v1.0. Cakupan Product/catalog API (data produk, kategori, testimoni yang masih hardcoded di frontend) sengaja belum dibahas di versi ini — menyusul di TRD/versi terpisah setelah scope-nya diputuskan._

---

_Dipublikasikan ke Confluence sebagai halaman "Homepage - FE" (folder TRD, space SD, page ID 8323075, versi 2) — judul halaman masih menyebut "FE" meski isinya sekarang FE+BE; ganti judulnya di Confluence kalau ingin konsisten._
