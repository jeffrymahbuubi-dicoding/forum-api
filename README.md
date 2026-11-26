# Forum API V2

REST API untuk forum diskusi, dibangun dengan Node.js, Express, dan PostgreSQL menggunakan Clean Architecture.
Proyek ini dikembangkan dari starter project kelas (registrasi pengguna, login, refresh token, dan logout), lalu
ditambah fitur thread, komentar, balasan komentar, dan menyukai komentar. Pada versi kedua ini API dilengkapi
Continuous Integration dan Continuous Deployment dengan GitHub Actions, pembatasan akses dengan NGINX, dan
akses melalui HTTPS.

## Fitur

- Registrasi pengguna, login, refresh token, dan logout.
- Menambahkan thread (perlu autentikasi).
- Melihat detail thread beserta komentar dan balasannya (tanpa autentikasi). Setiap komentar menampilkan jumlah
  suka (`likeCount`).
- Menambahkan dan menghapus komentar pada thread (hapus bersifat soft delete; isi komentar yang dihapus
  ditampilkan sebagai `**komentar telah dihapus**`).
- Menambahkan dan menghapus balasan pada komentar (soft delete; isi balasan yang dihapus ditampilkan sebagai
  `**balasan telah dihapus**`).
- Menyukai dan membatalkan suka pada komentar melalui satu route yang sama. Bila pengguna belum menyukai komentar,
  aksinya adalah menyukai; bila sudah, aksinya adalah membatalkan suka.
- Hanya pemilik komentar atau balasan yang dapat menghapusnya.

## Struktur

```
src/
  Commons/           exception, konfigurasi, utilitas
  Domains/           entities dan interface repository per bagian (users, authentications, threads, comments, replies, likes)
  Applications/      use case dan interface layanan (security)
  Infrastructures/   repository PostgreSQL, JWT, bcrypt, container, server Express
  Interfaces/        routes dan handler HTTP, middleware autentikasi
migrations/          migrasi database (node-pg-migrate)
tests/               helper tabel untuk pengujian
.github/workflows/   ci.yml dan cd.yml (GitHub Actions)
nginx.conf           konfigurasi NGINX (reverse proxy, limit access, HTTPS)
```

## Kebutuhan

- Node.js 22
- PostgreSQL (dua database: satu untuk aplikasi, satu untuk pengujian)

## Menyiapkan lingkungan

1. Pasang dependensi:

   ```
   npm install
   ```

2. Buat dua database kosong di PostgreSQL, misalnya `forumapi` dan `forumapi_test`.

3. Buat berkas `.env` di folder proyek (berkas ini tidak disertakan). Isi dengan variabel berikut dan ganti
   nilainya sesuai lingkungan Anda:

   ```
   PORT=5000
   PGHOST=localhost
   PGPORT=5432
   PGUSER=<pengguna postgres>
   PGPASSWORD=<kata sandi postgres>
   PGDATABASE=<nama database aplikasi>
   ACCESS_TOKEN_KEY=<string acak>
   REFRESH_TOKEN_KEY=<string acak lain>
   ACCESS_TOKEN_AGE=<masa berlaku access token>
   ```

4. Buat berkas `.test.env` (juga tidak disertakan) dengan nama variabel yang sama. Bedanya, `PGDATABASE` menunjuk
   ke database pengujian. Pengujian dan `npm run migrate:test` hanya membaca berkas ini.

   Catatan: nama variabel masa berlaku token yang dibaca kode adalah `ACCESS_TOKEN_AGE` (starter project menulisnya
   `ACCCESS_TOKEN_AGE` dengan tiga huruf C; nama itu tidak dibaca oleh kode). Port `5000` dipakai oleh Postman
   Collection Forum API (`localhost:5000`).

5. Jalankan migrasi pada kedua database:

   ```
   npm run migrate up
   npm run migrate:test up
   ```

## Perintah

| Perintah | Fungsi |
|----------|--------|
| `npm start` | menjalankan server |
| `npm run start:dev` | menjalankan server dengan nodemon |
| `npm test` | menjalankan seluruh pengujian (memakai database pengujian dari `.test.env`) |
| `npm run test:coverage` | menjalankan pengujian beserta laporan coverage |
| `npm run lint` | memeriksa gaya penulisan dengan ESLint |
| `npm run migrate up` / `down` | menjalankan atau membatalkan migrasi database aplikasi |
| `npm run migrate:test up` / `down` | menjalankan atau membatalkan migrasi database pengujian |

## Endpoint

| Method | Path | Autentikasi | Keterangan | Respons sukses |
|--------|------|-------------|------------|----------------|
| POST | `/users` | tidak | registrasi pengguna | 201 |
| POST | `/authentications` | tidak | login | 201 |
| PUT | `/authentications` | tidak | memperbarui access token | 200 |
| DELETE | `/authentications` | tidak | logout | 200 |
| POST | `/threads` | ya | menambahkan thread (`title`, `body`) | 201 `addedThread` |
| GET | `/threads/{threadId}` | tidak | detail thread, komentar (dengan `likeCount`), dan balasan | 200 `thread` |
| POST | `/threads/{threadId}/comments` | ya | menambahkan komentar (`content`) | 201 `addedComment` |
| DELETE | `/threads/{threadId}/comments/{commentId}` | ya | menghapus komentar | 200 |
| PUT | `/threads/{threadId}/comments/{commentId}/likes` | ya | menyukai atau membatalkan suka pada komentar (tanpa body) | 200 `{ "status": "success" }` |
| POST | `/threads/{threadId}/comments/{commentId}/replies` | ya | menambahkan balasan (`content`) | 201 `addedReply` |
| DELETE | `/threads/{threadId}/comments/{commentId}/replies/{replyId}` | ya | menghapus balasan | 200 |

Endpoint yang memerlukan autentikasi membaca header `Authorization: Bearer <access token>`. Tanpa token, server
menjawab 401. Kegagalan lain: 400 untuk payload yang tidak lengkap atau bertipe salah, 403 bila pengguna bukan
pemilik komentar atau balasan, dan 404 bila thread, komentar, atau balasan tidak ditemukan. Semua respons gagal
berbentuk `{ "status": "fail", "message": "..." }`.

Setiap komentar pada detail thread memiliki `likeCount` berupa angka (0 bila belum ada yang menyukai).

## CI/CD

Alur kerja GitHub Actions berada di folder `.github/workflows/`.

- `ci.yml` (Continuous Integration) berjalan pada event pull request ke branch `main`. Job-nya memakai Node.js 22
  dan service container PostgreSQL, lalu menjalankan `npm ci`, `npm run migrate up`, `npm run lint`, dan `npm test`
  (unit test, integration test, dan functional test). Nilai database dan kunci token di workflow ini hanya
  nilai sementara yang berlaku selama job berjalan.
- `cd.yml` (Continuous Deployment) berjalan pada event push ke branch `main`. Workflow ini masuk ke server lewat
  SSH (`appleboy/ssh-action`), lalu menjalankan `git pull`, `npm ci --omit=dev`, `npm run migrate up`, dan
  `pm2 restart`. Data koneksi disimpan sebagai repository secrets: `SSH_HOST`, `SSH_USERNAME`, `SSH_KEY`, dan
  `SSH_PORT`.

Karena `npm run migrate up` dijalankan di server dengan `npm ci --omit=dev`, paket `node-pg-migrate` berada di
`dependencies`, bukan `devDependencies`.

## Keamanan

Berkas `nginx.conf` di root proyek adalah konfigurasi NGINX yang dipakai server. NGINX berjalan sebagai reverse
proxy di depan aplikasi (port 5000), sehingga hanya port 80 dan 443 yang dibuka ke luar.

- Limit access: resource `/threads` dan semua path di bawahnya dibatasi 90 permintaan per menit untuk setiap
  alamat IP. Zona pembatas dibuat dengan `limit_req_zone $binary_remote_addr zone=threads:10m rate=90r/m;`
  dan dipasang pada `location /threads` dengan `limit_req zone=threads;`. Path lain tidak dibatasi.
  - `rate=90r/m` berarti satu permintaan setiap sekitar 0,67 detik (60/90 detik) untuk satu alamat IP.
  - Tidak ada kelonggaran tambahan: permintaan yang tiba sebelum jeda itu habis langsung ditolak dengan
    status 503.
  - Saat menjalankan Postman Collection terhadap server ini, beri jeda 1000 ms antar-request
    (Collection Runner: "Add a delay of"; Newman: `--delay-request 1000`).
- HTTPS: sertifikat diterbitkan oleh Let's Encrypt melalui certbot, dan permintaan HTTP dialihkan ke HTTPS
  sehingga lalu lintas tidak dapat disadap di jalan (serangan MITM).
