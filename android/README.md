# NEXUS Android WebView

Wrapper Android ringan yang membuka web app NEXUS di dalam WebView.

## Mengganti URL production

Edit `app/src/main/java/id/penguruspgrijabar/nexus/MainActivity.java`:

```java
private static final String APP_URL = "https://domain-production-anda/login";
```

Jangan memakai `localhost` atau IP komputer untuk APK production.

## Build

Buka folder `android/` dengan Android Studio, tunggu Gradle sync, lalu pilih **Build > Build APK(s)**.

Dari terminal setelah Android SDK/JDK terpasang:

```bash
./gradlew assembleDebug
```

APK akan berada di `app/build/outputs/apk/debug/app-debug.apk`.

## Catatan

- `DATABASE_URL`, JWT secret, dan credential lain tetap berada di server web.
- Android wrapper hanya membutuhkan akses HTTPS ke web app.
- Saat ini `APP_URL` masih placeholder sampai URL production Vercel tersedia.
