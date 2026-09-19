# WeMONEY Release Rules

## Tujuan

Dokumen ini adalah aturan release resmi WeMONEY dan menjadi pengingat untuk menjaga release Web dan Android tetap terpisah.

## Aturan Utama

### 1. Web dan Android adalah dua release terpisah

Release Web dan Android **tidak boleh digabung** menjadi satu release.

Format yang digunakan:

- Web: `vX.Y.Z`
- Android: `android-vX.Y.Z`

Contoh:

- Web: `v1.7.4`
- Android: `android-v1.7.4`

Pola ini mengikuti format Android release historis `android-v1.4.19`.

### 2. Sumber Android

Android release mengambil source dari Web release yang sudah diverifikasi.

Alur resmi:

**Web Release berhasil**
→ ambil commit Web yang sudah diverifikasi
→ build Vite
→ generate Capacitor Android
→ sync Capacitor
→ signing
→ build APK
→ build AAB
→ publish Android release

### 3. Artifact Android Production

Setiap Android production release wajib menghasilkan:

- `app-release.apk`
- `app-release.aab`

Keduanya harus merupakan **signed release artifact**.

Debug APK bukan pengganti production release.

### 4. Format Android Release

Judul:

`WeMONEY Android vX.Y.Z`

Tag:

`android-vX.Y.Z`

Isi release minimal:

- Public Android release
- Capacitor Android build
- Signed release APK
- Signed release AAB
- Web release tetap terpisah

### 5. Contoh Target V1.7.4

Untuk Web `v1.7.4`, target Android adalah:

- Release: **WeMONEY Android v1.7.4**
- Tag: `android-v1.7.4`
- Artifact: `app-release.apk`
- Artifact: `app-release.aab`
- Web release `v1.7.4` tetap terpisah.

### 6. Signing

Production Android release menggunakan secret signing repository yang tersedia.

Workflow wajib memvalidasi keberadaan:

- `ANDROID_KEYSTORE_BASE64`
- `ANDROID_KEYSTORE_PASSWORD`
- `ANDROID_KEY_ALIAS`
- `ANDROID_KEY_PASSWORD`

Keystore sementara hanya digunakan selama build dan wajib dihapus setelah proses selesai.

### 7. Verifikasi Sebelum Menyatakan Release Selesai

Android release hanya boleh dinyatakan **Released/Complete** setelah:

1. Workflow production selesai dengan status success.
2. APK signed berhasil dibuat.
3. AAB signed berhasil dibuat.
4. Tag `android-vX.Y.Z` tersedia.
5. GitHub Release tersedia dengan judul yang sesuai.
6. APK dan AAB terpasang sebagai release assets.

Jangan menyatakan Android production release selesai hanya berdasarkan keberhasilan **Android Capacitor debug build**.

### 8. Versioning

`package.json` adalah single source of truth untuk versi aplikasi.

Versioning mengikuti:

**MAJOR.MINOR.PATCH**

Web dan Android menggunakan nomor versi yang sama, tetapi tag/release tetap berbeda.

## Pipeline Referensi

```
Web Release vX.Y.Z
       |
       v
Verified Web Commit
       |
       v
Vite Build
       |
       v
Capacitor Android
       |
       v
Sync
       |
       v
Signing
       |
       +----> app-release.apk
       |
       +----> app-release.aab
       |
       v
Android Release
WeMONEY Android vX.Y.Z
tag: android-vX.Y.Z
```

## Catatan V1.7.4

Status target:

- Web `v1.7.4`: release terpisah.
- resources/icon.png menjadi satu-satunya master icon
- Android `android-v1.7.4`: target production berikutnya.
- Android Capacitor debug build: berhasil.
- Android production signed APK/AAB: wajib diverifikasi sebelum dinyatakan selesai.

Dokumen ini menjadi panduan release untuk perubahan berikutnya.
