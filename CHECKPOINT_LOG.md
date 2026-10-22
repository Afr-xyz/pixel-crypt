# CHECKPOINT_LOG — Pixel Crypt

## CHECKPOINT 0 — Audit dan Rencana (2026-10-15)
- **Status:** selesai.
- **Pekerjaan:** ekstrak ZIP, audit seluruh struktur (config, game, world, entities, enemies, bosses, ui, input, save, build, PWA, tes), jalankan tes baseline, tulis PROJECT_STATE.md (peta arsitektur, bug, rencana).
- **File diubah:** tidak ada kode game. Ditambah: `PROJECT_STATE.md`, `CHECKPOINT_LOG.md`.
- **Masalah ditemukan:** lihat "Bug / temuan dari audit" di PROJECT_STATE.md (9 butir; belum ada yang diperbaiki — sengaja, menunggu CP yang relevan).
- **Tes:** sintaks 15/15 OK; smoke OK; bot GOD & NAIF menang tanpa error JS; touch OK (server & file://). Android nyata: belum diuji.
- **Cadangan:** `checkpoints/pixel-crypt-checkpoint-00.zip`.
- **Berikutnya:** CHECKPOINT 1 — Fondasi 7 Lantai.

## CHECKPOINT 1 — Fondasi 7 Lantai (2026-10-15)
- **Status:** selesai (fondasi; boss 4–7 masih PLACEHOLDER by design).
- **Temuan awal:** file proyek sudah memuat pekerjaan CP1 sebagian (diubah 15:39, setelah backup CP0) yang tidak tercatat. Di-review via diff terhadap `checkpoint-00.zip`, diverifikasi, lalu dilanjutkan tanpa pengulangan.
- **Perubahan:** FLOORS 4–7 (Kuil Batu Terlarang/Gerbang Neraka/Labirin Raja/Takhta Langit), BOSS medusa/cerberus/minotaur/zeus (placeholder), 4 tema visual baru, `placeholderLoop` aman, layar menang generik 7/7, cache SW v2, `test/cp1.py`, bundle dibangun ulang.
- **File diubah:** `js/config.js`, `js/sprites.js`, `js/world.js`, `js/bosses.js`, `js/ui.js`, `sw.js`, `test/cp1.py` (baru), `dist/pixel-crypt.html`, `PROJECT_STATE.md`, `CHECKPOINT_LOG.md`.
- **Tes:** cp1.py semua lulus; smoke, bot GOD, kompatibilitas save lama, screenshot, touch lulus (detail di PROJECT_STATE.md). Android nyata belum diuji.
- **Bug tersisa:** boss 4–7 placeholder; keseimbangan musuh/HP lantai 4–7 belum diatur; bot belum memakai dodge; `README.md` masih menyebut 3 lantai (diperbarui di CP7).
- **Cadangan:** `checkpoints/pixel-crypt-checkpoint-01.zip`.
- **Berikutnya:** CHECKPOINT 2 — Boss Medusa.

## CHECKPOINT 2 — Boss Medusa (2026-10-16)
- **Status:** selesai. (Dikerjakan bertahap A–D setelah pemulihan: diff vs CP1 kosong, jadi mulai dari awal.)
- **Perubahan:** Medusa lengkap (tatapan bertelegraf + LOS pilar, sapuan, volley, ekor, fase rentan, fase 2), status MEMBATU pemain (mash untuk bebas, pecahan bertelegraf, anti-rantai, Aegis menahan), arena kuil 5 pilar + patung, sprite Medusa.
- **File:** `js/entities.js`, `js/bosses.js`, `js/sprites.js`, `js/world.js`, `js/game.js`, `js/config.js`, `test/cp2.py` (baru), `dist/pixel-crypt.html`, `PROJECT_STATE.md`, `CHECKPOINT_LOG.md`.
- **Tes:** cp2.py 11/11; cp1.py, smoke, bot GOD, touch lulus; screenshot dilihat. Android nyata belum diuji.
- **Bug tersisa:** keseimbangan belum diuji manusia; bot NAIF tanpa dodge mati di L4 (diharapkan).
- **Cadangan:** `checkpoints/pixel-crypt-checkpoint-02.zip`.
- **Berikutnya:** CHECKPOINT 3 — Cerberus.

## CHECKPOINT 3 — Boss Cerberus (2026-10-16)
- **Status:** selesai. CP2 diverifikasi utuh (diff vs checkpoint-02.zip kosong) sebelum mulai.
- **Perubahan:** Cerberus 3 kepala (Api/Taring/Roh) dengan pola multi-arah triple/fireball/bite/crossfire/rotor, telegraph berwarna per kepala, variasi per fase (lajur 3→4→5, rotor fase ≥1), jendela serang balik tiap 2 serangan, arena 4 pilar, sprite baru.
- **File:** `js/bosses.js`, `js/sprites.js`, `js/world.js`, `js/config.js`, `test/cp3.py` (baru), `dist/pixel-crypt.html`, `PROJECT_STATE.md`, `CHECKPOINT_LOG.md`.
- **Tes:** cp3.py 12/12; cp1, cp2, smoke, bot GOD, touch lulus; screenshot dilihat. Android nyata belum diuji.
- **Bug tersisa:** keseimbangan belum diuji manusia; boss 6–7 masih placeholder.
- **Cadangan:** `checkpoints/pixel-crypt-checkpoint-03.zip`.
- **Berikutnya:** CHECKPOINT 4 — Minotaur.

## CHECKPOINT 4 — Boss Minotaur (2026-10-16)
- **Status:** selesai.
- **Perubahan:** Minotaur asli (charge terarah bertelegraf, charge2, stomp, punch; dizzy saat menabrak dinding/pilar; fase 1 cincin+puing), sprite baru, arena 7 pilar, navigasi anti-tersangkut pilar (pathDir/chase/retreat), HP 1000.
- **File:** `js/bosses.js`, `js/sprites.js`, `js/world.js`, `js/config.js`, `test/cp4.py` (baru), `dist/pixel-crypt.html`, `PROJECT_STATE.md`, `CHECKPOINT_LOG.md`.
- **Tes:** cp4.py 11/11 (3x), cp1, cp2, smoke, bot GOD, touch lulus. Android nyata belum diuji.
- **Bug tersisa:** cp3.py kadang gagal 1 cek acak (Cerberus, tidak diubah); keseimbangan belum diuji manusia; Zeus masih placeholder.
- **Cadangan:** `checkpoints/pixel-crypt-checkpoint-04.zip`.
- **Berikutnya:** CHECKPOINT 5 — Zeus.

## CHECKPOINT 5 — Boss Zeus (2026-10-16)
- **Status:** selesai. (Setelah pemulihan: CP4 terverifikasi utuh; hanya sprite Zeus yang tersimpan, sisanya dikerjakan dari awal.)
- **Perubahan:** Zeus final 3 fase (petir terarah, lajur, bola energi, gelombang petir, hujan petir, jari-jari petir, murka), sprite baru, jendela serang balik, config tanpa placeholder; kemenangan hanya setelah Zeus mati.
- **File:** `js/bosses.js`, `js/sprites.js`, `js/config.js`, `test/cp5.py` (baru), `dist/pixel-crypt.html`, `PROJECT_STATE.md`, `CHECKPOINT_LOG.md`.
- **Tes:** cp5.py 13/13 (2x), cp1, cp2, smoke lulus; screenshot dilihat. Android nyata belum diuji.
- **Bug tersisa:** cp3.py/cp4.py masing-masing 1 cek acak kadang gagal; bot GOD tidak sampai Zeus dalam batas waktu; keseimbangan belum diuji manusia; README masih menyebut 3 lantai.
- **Cadangan:** `checkpoints/pixel-crypt-checkpoint-05.zip`.
- **Berikutnya:** CHECKPOINT 6 — Integrasi & polish.

## CHECKPOINT 6 — Integrasi & Polish (2026-10-16)
- **Status:** selesai.
- **Verifikasi:** ZIP 05 identik dengan file aktual.
- **Perbaikan:** cek cp3 "titik aman" hanya menghitung damage lajur (penyebab flaky: proyektil ikut terhitung); `retreat` Minotaur dengan radius cadangan 130/95/60 (penyebab seruduk jarang); `test/touch.py` path relatif; komentar config usang.
- **File:** `js/bosses.js`, `js/config.js` (komentar), `test/cp3.py`, `test/touch.py`, `test/cp6.py` (baru), `dist/pixel-crypt.html`, `PROJECT_STATE.md`, `CHECKPOINT_LOG.md`.
- **Tes:** cp1–cp6, smoke, touch lulus (cp3 4x, cp4 3x berturut-turut). Android nyata belum diuji.
- **Bug tersisa:** keseimbangan belum diuji manusia; bot belum bisa tamat 7 lantai; README masih 3 lantai.
- **Cadangan:** `checkpoints/pixel-crypt-checkpoint-06.zip`.
- **Berikutnya:** CHECKPOINT 7 — QA akhir.

## CHECKPOINT 7 — Final QA & Rilis (2026-10-16)
- **Status:** selesai.
- **Perubahan:** README.md ditulis ulang (7 lantai/28 ruangan/7 boss, cara Android, uji manual), SW cache v3, bot GOD cap 6000 dtk, dist dibangun ulang.
- **File:** `README.md`, `sw.js`, `test/bot.py`, `dist/pixel-crypt.html`, `PROJECT_STATE.md`, `CHECKPOINT_LOG.md`.
- **Tes dijalankan:** bot GOD menamatkan 7 lantai → win (tanpa error JS); bot NAIF kalah (diharapkan); cp5, cp6, smoke, touch lulus. cp1–cp4 tidak diulang (kode tak berubah sejak CP6). Android fisik BELUM diuji.
- **Bug tersisa:** balans belum diuji manusia; kode placeholder mati; layar menang generik.
- **Cadangan:** `checkpoints/pixel-crypt-checkpoint-07.zip`.
- **Berikutnya:** tidak ada (opsional: uji Android).
