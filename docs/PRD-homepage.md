# Product Requirements Document (PRD)

## Homepage

|  |  |
| --- | --- |
| **Document** | PRD-SHOPCO-HOMEPAGE-v1.1 |
| **Status** | Draft |
| **Target Application** | SHOP.CO (frontend Vue 3) |
| **Feature** | Homepage / Landing Page Toko |
| **Date** | 28 Agustus 2026 |

---

## 1. Background

SHOP.CO membutuhkan halaman utama (homepage) sebagai pintu masuk pertama pengunjung — baik yang belum punya akun maupun yang sudah login — untuk mengenal brand, melihat highlight katalog, dan diarahkan menuju alur akun (login/registrasi). Saat ini halaman ini sudah diimplementasikan di frontend sesuai desain yang disetujui, namun sebagian besar elemen interaktif di dalamnya (pencarian, keranjang, navigasi produk) masih berupa tampilan statis, belum terhubung ke fungsi/data sungguhan.

## 2. Objectives

* Menyajikan landing page yang mencerminkan identitas brand SHOP.CO dan menampilkan highlight katalog (produk baru, produk terlaris, kategori gaya).
* Mengarahkan pengunjung anonim ke alur Login lewat tombol call-to-action utama, dan menampilkan status sudah login langsung di homepage itu sendiri (bukan halaman terpisah) begitu berhasil masuk.
* Menampilkan banner promosi utama (hero banner) yang dapat diperbarui dari sisi backend tanpa perlu perubahan kode.
* Menampilkan testimoni pelanggan untuk membangun kepercayaan pengunjung baru.

## 3. Scope

**In scope:** tampilan hero section (heading, deskripsi, CTA, statistik), pengambilan gambar hero banner dari backend dengan fallback, routing tombol CTA utama berdasarkan status login, navbar yang berubah kondisi sesuai status login, pengambilan data New Arrivals/Top Selling/Browse by Dress Style dari Product API backend (termasuk foto tiap kategori Dress Style dari Asset Service), tampilan strip brand, testimoni pelanggan, newsletter, dan footer sesuai desain yang disetujui.

**Out of scope:** fungsi pencarian produk (input ada, belum ada aksi pencarian), fungsi keranjang belanja, navigasi ke halaman/detail produk (termasuk tombol "View All"), filter kategori dress style, penyimpanan/pengiriman email newsletter, tautan navbar (Shop/On Sale/New Arrivals/Brands) sebagai halaman sungguhan, tautan footer sebagai halaman sungguhan, serta data testimoni pelanggan dan daftar brand (masih statis di frontend, belum dari API).

---

## 4. Functional Requirements

* Sistem harus menampilkan hero section berisi headline, deskripsi singkat, tombol "Shop Now", dan statistik toko (jumlah brand, produk, pelanggan).
* Sistem harus mengambil gambar hero banner dari endpoint asset backend dan menampilkannya; jika asset tidak tersedia atau gagal diambil, sistem harus menampilkan placeholder alih-alih gambar rusak atau error yang terlihat pengguna.
* Sistem harus menampilkan navbar dalam kondisi berbeda sesuai status login: tombol "Masuk" untuk pengunjung anonim, atau ikon keranjang dan akun untuk pengguna yang sudah login — tanpa mengarahkan ke halaman terpisah manapun.
* Sistem harus mengarahkan pengguna yang belum login (anonim) ke halaman Login saat tombol "Masuk", "Daftar Sekarang", atau "Shop Now" diklik.
* Sistem harus menampilkan promo bar berisi pesan diskon dan tombol call-to-action di bagian atas halaman, khusus untuk pengunjung yang belum login.
* Sistem harus menampilkan strip daftar nama brand yang bekerja sama/tersedia di platform.
* Sistem harus menampilkan bagian "New Arrivals" berisi minimal 4 produk, masing-masing dengan nama, rating, harga, dan harga coret jika sedang diskon.
* Sistem harus menampilkan bagian "Top Selling" dengan format kartu produk yang sama seperti New Arrivals.
* Sistem harus menampilkan bagian "Browse by Dress Style" berisi minimal 4 kategori gaya berpakaian.
* Sistem harus menampilkan bagian "Our Happy Customers" berisi minimal 3 testimoni pelanggan, masing-masing dengan nama, rating bintang, dan kutipan ulasan.
* Sistem harus menampilkan bagian pendaftaran newsletter berisi input email dan tombol submit.
* Sistem harus menampilkan footer berisi identitas brand, kelompok tautan (Company, Help, FAQ), dan keterangan hak cipta.

## 5. Non-Functional Requirements

* Tata letak halaman harus responsif dan tetap terbaca/dapat digunakan di lebar layar mobile, tablet, maupun desktop.
* Setiap section dan elemen interaktif pada halaman harus memiliki identifier yang stabil untuk keperluan pengujian otomatis.
* Pengambilan gambar hero banner tidak boleh memblokir render bagian lain dari halaman, dan kegagalan pengambilan asset tidak boleh menyebabkan error yang terlihat pengguna.

---

_Total requirements: 12 functional + 3 non-functional. Dokumen ini disusun terbalik (reverse-engineered) dari kode yang sudah berjalan (`frontend/src/views/HomeView.vue`) dan desain visual yang disetujui, mengikuti template PRD tim di Confluence (acuan: PRD-SHOPCO-LOGIN-v1.0, page 360465) agar dapat langsung digunakan sebagai baseline dokumentasi produk._

---

### A. User Stories

| # | Sebagai | Saya ingin | Supaya |
| --- | --- | --- | --- |
| US-1 | Pengunjung anonim | melihat highlight produk & brand di homepage | tertarik menjelajahi lebih lanjut |
| US-2 | Pengunjung anonim | klik tombol CTA dan diarahkan ke halaman Login | bisa mulai proses masuk/akun |
| US-3 | Pengguna yang sudah login | melihat status login saya tercermin di navbar (ikon akun, bukan tombol Masuk) | tahu saya sudah masuk tanpa perlu berpindah halaman |
| US-4 | Pengunjung | melihat testimoni pelanggan lain | lebih percaya untuk belanja di sini |

### B. Spesifikasi Teknis (ringkas)

**Komponen**: `frontend/src/views/HomeView.vue` (single view, route `/`).

**Ketergantungan backend**: `GET /api/assets/hero_banner` dan `GET /api/assets/hero_<style>_browse` (per kategori Dress Style) untuk gambar; `GET /api/products?section=new_arrivals|top_selling` dan `GET /api/dress-styles` untuk data katalog. Data testimoni dan daftar brand masih statis di dalam komponen — belum ada API untuk itu.

**Auth-aware routing**: fungsi `goToCta()` membaca `useAuthStore().isAuthenticated` — kalau anonim, redirect ke Login; kalau sudah login, CTA jadi no-op (tidak ada halaman tujuan terpisah lagi). Status login sendiri tercermin lewat perubahan navbar, bukan lewat redirect.

### C. Acceptance Criteria

- [ ] Homepage tampil lengkap sesuai desain yang disetujui (hero, brand strip, New Arrivals, Top Selling, Dress Style, testimoni, newsletter, footer)
- [ ] Hero banner menampilkan gambar dari backend; kalau asset gagal diambil, placeholder tampil tanpa error yang terlihat pengguna
- [ ] Tombol "Masuk"/"Daftar Sekarang"/"Shop Now" mengarahkan ke Login kalau belum login; navbar menampilkan ikon cart+akun (bukan tombol Masuk) kalau sudah login
- [ ] Layout tetap rapi & dapat digunakan di lebar layar mobile dan desktop

### D. Risiko & Pertanyaan Terbuka

* **Sebagian besar elemen interaktif masih dekoratif** — pencarian, keranjang, tombol "View All", kartu dress style, submit newsletter, dan tautan navbar/footer belum punya fungsi sungguhan. Perlu diprioritaskan fitur mana yang dibangun berikutnya.
* **Product API sudah menggantikan data statis** untuk New Arrivals/Top Selling/Dress Style — tapi data testimoni pelanggan dan daftar brand masih hardcoded di frontend, belum diputuskan apakah keduanya perlu API tersendiri juga.
* Gambar produk (New Arrivals/Top Selling) masih berupa emoji placeholder, belum foto produk asli. Kategori Dress Style sudah pakai foto asli lewat Asset Service, tapi 2 dari 4 foto (Casual, Gym) ter-crop cukup mepet di bagian wajah karena keterbatasan foto sumbernya — lihat detail di TRD.
* Belum ada strategi SEO/meta-tag maupun audit accessibility (alt text) di luar atribut `alt` pada gambar hero banner.

---

_Referensi desain: gambar mockup homepage SHOP.CO yang dibagikan pada 28 Agustus 2026. Dokumen ini melengkapi PRD-SHOPCO-LOGIN-v1.0 (Confluence page 360465) sebagai bagian dari dokumentasi produk SHOP.CO di Confluence._
