# NEXUS Android WebView

Wrapper Android native yang membuka seluruh web app NEXUS di dalam satu WebView.

## Production URL

`MainActivity.java` memulai aplikasi dari:

```text
https://nexus-iota-drab.vercel.app/login
```

Setelah login, semua route web—dashboard, barang, ruangan, mutasi, laporan, dan users—tetap dinavigasikan di dalam WebView yang sama.

Jangan memakai `localhost` atau IP komputer untuk APK production.

## Build debug

Dengan Android Studio, buka folder project `android/`, tunggu Gradle sync, lalu pilih **Build > Build Bundle(s) / APK(s) > Build APK(s)**.

Dengan terminal:

```bash
./gradlew assembleDebug
```

Windows:

```bat
gradlew.bat assembleDebug
```

Output:

```text
app/build/outputs/apk/debug/app-debug.apk
```

## Build release signed

```bash
./gradlew assembleRelease
```

Output:

```text
app/build/outputs/apk/release/app-release.apk
```

Keystore dan `keystore.properties` hanya disimpan lokal dan di-ignore Git. Jangan menghapus atau membagikan keystore tanpa pengamanan karena diperlukan untuk update aplikasi berikutnya.

## Implementasi

- Native Android Java
- Android WebView
- Android SDK 35
- Minimum API 23
- JavaScript dan DOM storage aktif untuk kebutuhan Next.js/authentication
- Tombol Back mengikuti riwayat navigasi WebView
- System-bar insets diterapkan agar konten tidak tertutup status bar atau navigation bar
- Ikon launcher menggunakan `res/drawable/nexus_logo.xml`

## Keamanan

- `DATABASE_URL`, JWT secret, password, API key, token, dan credential tetap berada di server web.
- APK hanya memuat URL HTTPS publik web app.
- Jangan commit `.env`, keystore, password signing, APK, atau folder build.
