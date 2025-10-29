# SkyScope Weather

Website prakiraan cuaca multipage untuk praktikum **Pemrograman Web – Modul 3** yang dikembangkan oleh **Wiji Fiko Teren (202310370311437)**.

## Profil Pengembang

- **Nama:** Wiji Fiko Teren  
- **NIM:** 202310370311437  
- **Email:** tobellord@gmail.com · wijifikoteren@webmail.umm.ac.id  
- **Web Resume:** [https://resume.tobelsoft.my.id](https://resume.tobelsoft.my.id)

## Ringkasan Proyek

SkyScope Weather menghadirkan prakiraan cuaca berbasis data Open-Meteo dan Nominatim (OpenStreetMap) tanpa kebutuhan API key. Aplikasi dibangun dengan stack ringan—HTML statis, Tailwind CSS CDN, jQuery untuk interaksi, dan Fetch API + async/await untuk komunikasi HTTP. Fokus utamanya adalah pengalaman pengguna mobile-first, aksesibilitas, serta responsivitas.

## Fitur Utama

- **Pencarian kota** dengan geocoding Nominatim (GET request) dan validasi kesalahan.
- **Kartu cuaca saat ini** menampilkan suhu, kondisi, peluang hujan, kecepatan angin, dan kelembapan.
- **Prakiraan 7 hari** dengan ikon cuaca dinamis, suhu minimum/maksimum, dan peluang hujan harian.
- **Hourly glance 12 jam** beserta sparkline SVG sederhana untuk tren suhu.
- **Skeleton loading & toast** untuk memberi balikan status pemuatan dan error.
- **Caching lokal** (localStorage) selama 10 menit dan fallback offline-friendly.
- **Tombol geolokasi** yang menawarkan prakiraan di sekitar pengguna ketika diizinkan.
- **Navigasi multipage** (Home & About) dengan navbar sticky serta dukungan mobile toggle.

## Teknologi & API

| Kebutuhan               | Implementasi                                             |
|-------------------------|----------------------------------------------------------|
| Markup & styling        | HTML5 semantik, Tailwind CSS CDN (gradient slate).       |
| Interaksi UI            | jQuery 3.7.x (DOM, animasi, toggling).                   |
| HTTP & async/await      | Fetch API native (GET only) dengan guard `response.ok`.  |
| Data cuaca              | [Open-Meteo Forecast API](https://open-meteo.com/).       |
| Geocoding kota          | [Nominatim OSM](https://nominatim.openstreetmap.org/).   |
| Visual ikon             | SVG custom dalam folder `assets/icons`.                  |

## Struktur Proyek

```
/
├─ index.html        # Halaman Home + pencarian & hasil cuaca
├─ about.html        # Penjelasan API, alur fetch, dan teknologi
├─ README.md         # Dokumentasi proyek
├─ assets/
│  ├─ favicon.svg
│  └─ icons/         # Ikon kondisi cuaca (clear, cloud, rain, dst)
└─ js/
   ├─ ui.js          # Helper UI, render kartu, toast, sparkline
   └─ app.js         # Logika fetch, caching, geolokasi, event handler
```

## Alur Data

1. **Input pengguna / geolokasi** → ambil query kota atau koordinat navigator.
2. **Fetch Nominatim** (`async/await`) → dapatkan `lat`, `lon`, dan `display_name`.
3. **Fetch Open-Meteo** → request current, daily, dan hourly forecast sesuai koordinat.
4. **Transformasi data** → map weathercode → label + ikon, normalisasi angka.
5. **Render UI dengan jQuery** → skeleton disembunyikan, elemen DOM diisi konten.
6. **Cache localStorage** → simpan payload + timestamp (maksimal 10 menit).
7. **Fallback offline** → gunakan cache jika koneksi terputus dan data masih valid.

## Panduan Penggunaan

1. Akses versi live di [https://skyscope-weater-web-programming-modul3-task.serverkosfiko.my.id](https://skyscope-weater-web-programming-modul3-task.serverkosfiko.my.id).
2. Alternatifnya, buka `index.html` langsung di browser (tidak memerlukan server tambahan).
3. Masukkan nama kota (contoh: *Malang*, *Jakarta*, *Tokyo*) lalu klik **Cari**.
4. Tekan **Gunakan lokasiku** untuk memanfaatkan geolokasi (memerlukan izin browser).
5. Navigasi ke halaman **About** untuk membaca penjelasan implementasi dan API.

## Uji Fungsional yang Direkomendasikan

- **Pencarian kota populer:** “Malang” → pastikan kartu current/daily/hourly terisi.
- **Pengujian cache:** Setelah pencarian, matikan internet dan ulangi query ≤10 menit.
- **Error handling:** Masukkan kota fiktif untuk memicu toast kesalahan.
- **Responsivitas:** Coba lebar layar <400px dan >1200px untuk memastikan layout adaptif.
- **Aksesibilitas:** Gunakan keyboard (Tab + Enter) untuk menavigasi form dan tombol.

## Lisensi Data & Kredit

- Data cuaca: Open-Meteo (gratis, tanpa API key).  
- Geocoding: OpenStreetMap Nominatim (dipakai sesuai usage policy).  
- Ikon SVG: dibuat khusus untuk tugas ini.

---

Dibuat dengan semangat belajar untuk memenuhi tugas Modul 3 Pemrograman Web. Kritik dan saran sangat dihargai — silakan hubungi melalui email yang tertera! ✨
