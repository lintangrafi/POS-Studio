# POS Studio

Sistem Point of Sale untuk studio foto di Indonesia. Mendukung multi-studio dengan kustomisasi nama bisnis dan tema warna.

## Fitur

- **POS Kasir** — Transaksi cepat dengan split payment (Cash, QRIS, Transfer)
- **Manajemen Shift** — Buka/tutup shift dengan rekonsiliasi kas
- **Open Bills** — Simpan transaksi tertunda dengan down payment
- **Inventori** — Kelola produk, stok, dan kategori
- **Laporan Keuangan** — Revenue, COGS, laba, pengeluaran
- **Invoice** — Riwayat semua transaksi dengan filter
- **Kustomisasi** — Ubah nama bisnis, logo, dan tema warna (6 pilihan)
- **Multi-Role** — CASHIER, ADMIN, SUPERADMIN dengan akses berbeda

## Tech Stack

- **Framework**: Next.js 15 (App Router, React 19)
- **Database**: PostgreSQL via Supabase
- **ORM**: Drizzle ORM
- **Auth**: Custom JWT (jose) + httpOnly cookies
- **State**: Zustand (persisted to localStorage)
- **Styling**: Tailwind CSS v4
- **UI**: Radix UI + Lucide Icons

## Setup

### 1. Clone & Install

```bash
git clone <repo-url>
cd pos-studio
npm install
```

### 2. Setup Supabase

1. Buat project di [supabase.com](https://supabase.com)
2. Copy connection string dari Dashboard > Settings > Database > Connection string (Transaction mode, port 6543)

### 3. Environment Variables

Buat file `.env.local`:

```env
DATABASE_URL="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=require"
AUTH_SECRET="random-secret-minimal-32-karakter"
NODE_ENV=development
```

### 4. Push Schema & Seed

```bash
npm run db:push
npm run db:seed
```

### 5. Run Development

```bash
npm run dev
```

## Default Accounts

| Role | Email | Password |
|------|-------|----------|
| Super Admin | admin@studio.com | admin123 |
| Kasir | kasir@studio.com | cashier123 |

## Deploy ke Netlify

1. Push ke GitHub
2. Connect repository di Netlify
3. Set environment variables di Netlify:
   - `DATABASE_URL` — Supabase connection string
   - `AUTH_SECRET` — Random secret key
4. Deploy otomatis via `netlify.toml`

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run db:push` | Push schema ke database |
| `npm run db:seed` | Seed data awal |
| `npm run db:studio` | Buka Drizzle Studio |

## Kustomisasi

Setelah login sebagai Admin/Super Admin:
1. Buka menu **Kustomisasi** di sidebar
2. Ubah nama bisnis, subtitle, dan inisial logo
3. Pilih tema warna (Indigo, Emerald, Rose, Amber, Violet, Sky)
4. Klik **Simpan Perubahan**

Perubahan langsung terlihat di seluruh aplikasi termasuk halaman login.
