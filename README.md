# Forum API V1

REST API untuk forum diskusi, dibangun dengan Node.js, Express, dan PostgreSQL menggunakan Clean Architecture.
Proyek ini dikembangkan dari starter project kelas (registrasi pengguna, login, refresh token, dan logout), lalu
ditambah fitur thread, komentar, dan balasan komentar.

## Fitur

- Registrasi pengguna, login, refresh token, dan logout.
- Menambahkan thread (perlu autentikasi).
- Melihat detail thread beserta komentar dan balasannya (tanpa autentikasi).
- Menambahkan dan menghapus komentar pada thread (hapus bersifat soft delete; isi komentar yang dihapus
  ditampilkan sebagai `**komentar telah dihapus**`).
- Menambahkan dan menghapus balasan pada komentar (soft delete; isi balasan yang dihapus ditampilkan sebagai
  `**balasan telah dihapus**`).
- Hanya pemilik komentar atau balasan yang dapat menghapusnya.

## Struktur

```
src/
  Commons/           exception, konfigurasi, utilitas
  Domains/           entities dan interface repository per bagian (users, authentications, threads, comments, replies)
  Applications/      use case dan interface layanan (security)
  Infrastructures/   repository PostgreSQL, JWT, bcrypt, container, server Express
  Interfaces/        routes dan handler HTTP, middleware autentikasi
migrations/          migrasi database (node-pg-migrate)
tests/               helper tabel untuk pengujian
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
   Collection Forum API V1 (`localhost:5000`).

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
| GET | `/threads/{threadId}` | tidak | detail thread, komentar, dan balasan | 200 `thread` |
| POST | `/threads/{threadId}/comments` | ya | menambahkan komentar (`content`) | 201 `addedComment` |
| DELETE | `/threads/{threadId}/comments/{commentId}` | ya | menghapus komentar | 200 |
| POST | `/threads/{threadId}/comments/{commentId}/replies` | ya | menambahkan balasan (`content`) | 201 `addedReply` |
| DELETE | `/threads/{threadId}/comments/{commentId}/replies/{replyId}` | ya | menghapus balasan | 200 |

Endpoint yang memerlukan autentikasi membaca header `Authorization: Bearer <access token>`. Tanpa token, server
menjawab 401. Kegagalan lain: 400 untuk payload yang tidak lengkap atau bertipe salah, 403 bila pengguna bukan
pemilik komentar atau balasan, dan 404 bila thread, komentar, atau balasan tidak ditemukan. Semua respons gagal
berbentuk `{ "status": "fail", "message": "..." }`.
