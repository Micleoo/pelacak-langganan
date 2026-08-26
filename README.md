# 💳 Pelacak Langganan

> **Alat web pribadi untuk melacak semua biaya berulang—langganan digital maupun tagihan rutin—dalam satu tempat.**

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38bdf8?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Database%20%26%20Edge%20Functions-3ecf8e?style=flat-square&logo=supabase)](https://supabase.com/)
[![Vitest](https://img.shields.io/badge/Vitest-Unit%20Tests-729b1b?style=flat-square&logo=vitest)](https://vitest.dev/)
[![Deploy with Vercel](https://img.shields.io/badge/Deploy-Vercel-black?style=flat-square&logo=vercel)](https://pelacak-langganan.vercel.app)

🔗 **Live Demo:** [https://pelacak-langganan.vercel.app](https://pelacak-langganan.vercel.app)  
📁 **Repository:** [https://github.com/Micleoo/pelacak-langganan](https://github.com/Micleoo/pelacak-langganan)

---

## 📌 Mengapa Pelacak Langganan?

Biaya langganan seperti Netflix, Spotify, tool AI (ChatGPT, Claude), iCloud, hingga tagihan internet dan listrik tersebar di banyak penyedia dengan siklus tagihan yang berbeda-beda (bulanan, tahunan, kuartalan, atau mingguan). 

Tanpa satu tampilan terpadu:
- ❌ Sulit mengetahui berapa total uang yang keluar setiap bulannya.
- ❌ Kerap kaget saat saldo terpotong tiba-tiba.
- ❌ Lupa membatalkan langganan yang sudah tidak terpakai.

**Pelacak Langganan** hadir untuk menyelesaikan masalah ini dengan menormalisasi seluruh biaya ke angka bulanan dalam IDR, menyajikan insight visual rincian per kategori, dan mengirimkan notifikasi pengingat sebelum tagihan jatuh tempo.

---

## ✨ Fitur Utama

- 📊 **Dashboard Insight:**
  - **Total Biaya Bulanan (IDR)** yang dinormalisasi secara presisi dengan tabular numerals.
  - **Daftar Jatuh Tempo (Upcoming Renewals)** langsung di posisi teratas dashboard agar Anda segera tahu tagihan mana yang harus dibayar.
  - **Rincian per Kategori** lengkap dengan persentase dan progress bar visual multi-warna.
- 📝 **CRUD Biaya Berulang:**
  - Tambah, ubah, dan hapus biaya dengan informasi: nama, nominal (IDR), siklus tagihan (Bulanan, Tahunan, Kuartalan, Mingguan), kategori, status (Aktif / Dibatalkan), dan tanggal tagihan berikutnya.
  - Normalisasi otomatis ke biaya bulanan (misal: langganan tahunan Rp 1.200.000 otomatis dihitung sebagai Rp 100.000/bulan).
- 🔄 **Auto-Advance Tanggal Tagihan:**
  - Tanggal tagihan yang telah lewat otomatis dimajukan ke siklus berikutnya melalui backend cron job Supabase (`advance_past_due_expenses()`), tanpa perlu update manual.
- 🏷️ **Manajemen Kategori Kustom:**
  - Buat, ganti nama, atau hapus kategori.
  - Tiap kategori memiliki identitas warna token unik dan ikon representatif dari Lucide Icons.
- 🔔 **Sistem Notifikasi Pengingat Fleksibel:**
  - **Notifikasi In-App:** Banner pengingat informatif di dashboard.
  - **Notifikasi Email:** Pengingat otomatis berisi rekap tagihan terdekat via **Resend API** & Supabase Edge Function (`send-reminders`) yang dijadwalkan setiap jam 07:00 pagi via `pg_cron`.
  - **Timing Fleksibel:** Atur timing pengingat global (H-1 s.d. H-7, default H-3) atau sesuaikan per masing-masing biaya.
  - **Fitur Uji Coba Email:** Tombol interaktif *Kirim Email Uji Coba* untuk mengonfirmasi integrasi email secara instan.

---

## 🛠️ Stack & Arsitektur

| Komponen | Pilihan Teknologi | Keterangan |
|---|---|---|
| **Frontend & API** | Next.js 16 (App Router) + TypeScript | React Server/Client Components |
| **Styling** | Tailwind CSS v4 + Geist Font | Impeccable design tokens, AA contrast |
| **Database** | Supabase (PostgreSQL) | Managed Postgres, Migrations, Realtime |
| **Background Cron** | Supabase `pg_cron` + `pg_net` | Auto-advance & trigger reminder harian |
| **Edge Function** | Supabase Edge Function (Deno) | `send-reminders` (integrasi Resend API) |
| **Email Service** | Resend | Pengiriman email transaksional modern |
| **Testing** | Vitest | Unit test domain logika recurring & store |
| **Hosting** | Vercel (Hobby) | Free-tier deployment |

> 💡 **Free Tier Friendly:** Seluruh stack ini 100% dapat dijalankan pada free tier permanen tanpa biaya bulanan.

---

## 🚀 Panduan Memulai (Local Development)

### 1. Clone Repository
```bash
git clone https://github.com/Micleoo/pelacak-langganan.git
cd pelacak-langganan
```

### 2. Install Dependensi
```bash
npm install
```

### 3. Konfigurasi Environment Variables
Salin file `.env.example` menjadi `.env.local`:
```bash
cp .env.example .env.local
```

Isi variabel lingkungan pada `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"

# Opsional untuk testing lokal langsung:
RESEND_API_KEY="re_your_resend_api_key"
EMAIL_FROM="Pelacak Langganan <onboarding@resend.dev>"
```

### 4. Jalankan Development Server
```bash
npm run dev
```
Buka browser di [http://localhost:3000](http://localhost:3000).

### 5. Jalankan Unit Tests
```bash
npm test
```

---

## 🗄️ Database & Edge Functions (Supabase)

### Migrasi Database
Migrasi SQL berada pada folder `supabase/migrations/`:
```bash
npx supabase db push --project-ref <your-project-ref>
```

### Deploy Edge Functions
Deploy fungsi pengirim email pengingat:
```bash
npx supabase functions deploy send-reminders --project-ref <your-project-ref>
```

### Konfigurasi Secret Resend di Supabase
Simpan API Key Resend ke dalam brankas Supabase Secrets agar Edge Function dapat mengirim email pengingat:
```bash
npx supabase secrets set RESEND_API_KEY=re_your_api_key --project-ref <your-project-ref>
```

---

## 📁 Struktur Direktori

```text
├── app/
│   ├── api/
│   │   └── send-test-email/    # API Route uji coba kirim email
│   ├── categories/             # Halaman kelola kategori
│   ├── expenses/               # Halaman daftar biaya & form tambah/edit
│   ├── settings/               # Halaman pengaturan notifikasi & email
│   ├── globals.css             # Desain token & Tailwind v4
│   ├── layout.tsx              # Root layout aplikasi
│   └── page.tsx                # Halaman Dashboard utama
├── components/
│   ├── ui/                     # Reusable UI components (Button, Input, Badge, Card)
│   ├── CategoryIcon.tsx        # Dynamic category icons & color mapping
│   ├── ExpenseForm.tsx         # Form input & edit biaya
│   ├── SiteHeader.tsx          # Navigasi utama
│   └── StoreProvider.tsx       # Context provider data store
├── lib/
│   ├── categories.ts           # Logika kategori bawaan & custom
│   ├── format.ts               # Formatter IDR & tanggal lokal
│   ├── recurring.ts            # Logika perhitungan siklus & falling due dates
│   └── store.tsx               # Supabase data store adapter
├── supabase/
│   ├── functions/
│   │   └── send-reminders/     # Deno Edge Function pengirim email via Resend
│   └── migrations/             # Database schema migrations & pg_cron setup
└── coldstart.md                # Catatan & dokumentasi internal project
```

---

## 📄 Lisensi

Didistribusikan di bawah lisensi MIT. Silakan gunakan dan kembangkan sesuai kebutuhan pribadi Anda.
