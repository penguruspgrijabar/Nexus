# NEXUS

NEXUS adalah aplikasi inventaris barang untuk lingkungan kantor. Web app menjadi sumber utama data dan fitur, sedangkan aplikasi Android menyediakan wrapper WebView untuk membuka seluruh web app dari perangkat mobile.

> **Satu barang, satu kode, satu kebenaran.**

## Production

- Web app: <https://nexus-iota-drab.vercel.app>
- Halaman awal Android: `https://nexus-iota-drab.vercel.app/login`
- Repository: <https://github.com/penguruspgrijabar/Nexus>

## Fitur utama

- Login berbasis JWT dengan cookie `httpOnly`
- Dashboard inventaris
- CRUD barang satu unit per baris dengan kode unik `BRG-YYYY-####`
- CRUD ruangan
- Mutasi barang antar-ruangan atau ke status tanpa ruangan
- Laporan inventaris
- Manajemen pengguna
- Searchable select untuk pemilihan barang dan ruangan
- Android WebView yang mempertahankan navigasi seluruh halaman web di dalam aplikasi

## Teknologi

### Web

- Next.js 16 App Router
- React 19 dan TypeScript
- TanStack Query
- `next-safe-action` untuk server actions
- Drizzle ORM dan PostgreSQL Supabase
- Zod
- `jose` untuk JWT
- Argon2 untuk password hashing
- Radix UI, cmdk, dan Tailwind CSS

### Android

- Native Android
- Java
- Android WebView
- Gradle
- Android SDK 35
- Minimum Android API 23

## Menjalankan web secara lokal

Prasyarat: Node.js, pnpm, dan PostgreSQL/Supabase.

Buat file `.env` berdasarkan konfigurasi lingkungan lokal. Jangan commit `.env` atau credential apa pun.

```bash
pnpm install
pnpm dev
```

Buka <http://localhost:3000/login>.

Perintah penting:

```bash
pnpm build
pnpm start
pnpm db:generate
pnpm db:migrate
pnpm db:push
pnpm db:seed
```

Jangan menjalankan `pnpm db:seed` pada database production tanpa persetujuan dan pemeriksaan yang sesuai.

## Build Android

Buka folder `android/` dengan Android Studio, atau gunakan Gradle wrapper dari terminal.

Debug APK:

```bash
cd android
./gradlew assembleDebug
```

Windows:

```bat
cd android
gradlew.bat assembleDebug
```

Release APK bertanda tangan:

```bash
cd android
./gradlew assembleRelease
```

Output release:

```text
android/app/build/outputs/apk/release/app-release.apk
```

Aplikasi dimulai dari `/login`. Setelah login, route `/dashboard`, `/barang`, `/ruangan`, `/mutasi`, `/laporan`, dan `/users` tetap dibuka di WebView yang sama. Tombol Back Android mengikuti riwayat navigasi web.

## Signing release

Keystore release bersifat lokal dan tidak boleh di-commit. File yang digunakan oleh konfigurasi signing:

- `secure/nexus-release-key.jks`
- `android/keystore.properties`

Keduanya sudah di-ignore oleh Git. Simpan backup keystore dan password secara aman; keduanya diperlukan untuk membuat update aplikasi dengan identitas signing yang sama.

## Keamanan

- Jangan masukkan `DATABASE_URL`, JWT secret, password, API key, token, atau credential ke source code Android.
- Android hanya memuat URL HTTPS publik web app.
- Jangan gunakan `localhost` atau alamat IP LAN sebagai URL production APK.
- Jangan commit `.env`, keystore, password signing, APK, atau folder build.

## Struktur proyek

Penjelasan struktur lengkap tersedia di [STRUCTURE.md](STRUCTURE.md).

