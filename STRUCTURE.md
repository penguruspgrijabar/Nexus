# Struktur Proyek NEXUS

Dokumen ini menjelaskan pembagian web app, server, database, dan aplikasi Android.

## Struktur tingkat atas

```text
Nexus/
├── android/                 # Native Android WebView wrapper
├── public/                  # Aset publik web
├── src/                     # Source code Next.js
├── drizzle/                 # Riwayat migrasi database
├── secure/                  # Keystore lokal, tidak di-commit
├── .env                     # Environment lokal, tidak di-commit
├── drizzle.config.ts        # Konfigurasi Drizzle Kit
├── next.config.ts           # Konfigurasi Next.js
├── package.json             # Script dan dependency web
├── README.md                # Panduan umum proyek
└── STRUCTURE.md             # Dokumentasi struktur proyek
```

## Web app: `src/`

```text
src/
├── app/
│   ├── (app)/               # Halaman yang membutuhkan autentikasi
│   │   ├── dashboard/       # Ringkasan statistik inventaris
│   │   ├── barang/          # Daftar dan CRUD unit barang
│   │   ├── ruangan/         # Daftar dan CRUD ruangan
│   │   ├── mutasi/          # Pemindahan barang dan histori mutasi
│   │   ├── laporan/         # Ringkasan laporan inventaris
│   │   └── users/           # Manajemen pengguna
│   ├── login/               # Halaman login
│   ├── layout.tsx           # Root layout aplikasi
│   ├── page.tsx             # Entry page
│   └── globals.css          # Style global, responsive, dan animasi
├── components/
│   ├── layout/              # Sidebar, header, dan shell aplikasi
│   ├── ui/                  # Komponen UI reusable
│   └── providers.tsx        # Provider TanStack Query dan UI
├── db/
│   └── seed.ts              # Seed data eksplisit untuk development
├── lib/                     # Utility umum dan helper client/server
└── server/
    ├── actions/             # Server actions untuk read/write aplikasi
    ├── db/
    │   ├── index.ts         # Koneksi PostgreSQL/Drizzle
    │   ├── schema.ts        # Schema tabel dan relasi
    │   └── validation.ts    # Schema validasi input Zod
    ├── queries.ts           # Query database dan filter inventaris
    └── auth.ts              # JWT, cookie, dan otorisasi
```

## Lapisan web

### UI layer

Berada di `src/app` dan `src/components`. Lapisan ini mengatur tampilan, form, tabel, modal, navigasi, dan interaksi pengguna.

### Query layer

Berada di `src/server/queries.ts`. Lapisan ini membaca data dari database dan menerapkan filter terpusat, termasuk status barang tanpa ruangan.

### Action layer

Berada di `src/server/actions`. Semua operasi perubahan data menggunakan server actions melalui `next-safe-action`. Tidak ada kredensial database di browser.

### Database layer

Berada di `src/server/db`. Drizzle ORM memetakan tabel PostgreSQL dan Zod memvalidasi input sebelum data diproses.

## Model data utama

```text
user
├── id
├── name
├── email
├── passwordHash
└── role

ruangan
├── id
├── nama
└── gedung

barang
├── id
├── kode                  # unik, pola BRG-YYYY-####
├── nama
├── kategori
├── kondisi
├── ruanganId             # nullable untuk tanpa ruangan
└── tanggalMasuk

mutasi_barang
├── id
├── barangId
├── ruanganAsal
├── ruanganTujuan         # nullable
├── userId
└── createdAt
```

Satu baris pada tabel `barang` mewakili satu unit fisik. Tidak ada kolom `jumlah` atau `satuan`.

## Android wrapper: `android/`

```text
android/
├── app/
│   ├── build.gradle       # SDK, signing, dan build type
│   └── src/main/
│       ├── AndroidManifest.xml
│       ├── java/id/penguruspgrijabar/nexus/
│       │   └── MainActivity.java
│       └── res/
│           ├── drawable/nexus_logo.xml
│           └── values/styles.xml
├── gradle/wrapper/        # Gradle wrapper
├── gradlew                # Wrapper Unix
├── gradlew.bat            # Wrapper Windows
├── build.gradle           # Plugin Android
├── settings.gradle        # Module dan repository Gradle
├── gradle.properties      # Pengaturan Gradle
├── README.md              # Panduan Android
└── .gitignore             # Cache dan signing lokal
```

### `MainActivity.java`

`MainActivity` membuat WebView dan memuat:

```text
https://nexus-iota-drab.vercel.app/login
```

Konfigurasi WebView mencakup JavaScript, DOM storage, cookie/session web, HTTPS-only mixed content policy, navigasi internal, tombol Back, dan system-bar insets agar konten tidak tertutup status bar.

Semua route web tetap berada di WebView yang sama. Android tidak mengakses database secara langsung.

### Ikon aplikasi

`res/drawable/nexus_logo.xml` berisi vector drawable dengan background biru dan kotak diagonal di tengah. Manifest menggunakan drawable ini sebagai `android:icon` dan `android:roundIcon`.

## Signing dan file lokal

File berikut sengaja tidak boleh masuk repository:

```text
secure/nexus-release-key.jks
android/keystore.properties
.env
android/app/build/
android/.gradle/
```

Keystore harus dibackup dengan aman. Mengganti atau kehilangan keystore akan menghalangi update aplikasi yang sudah terpasang karena Android memerlukan identitas signing yang sama.

## Alur data

```text
Browser / Android WebView
          │
          ▼
Next.js UI + TanStack Query
          │
          ▼
next-safe-action server actions
          │
          ▼
Drizzle ORM
          │
          ▼
PostgreSQL Supabase
```

Android hanya menjadi client untuk web app. Database, JWT secret, password hash, dan connection string tetap berada di server/environment deployment.
