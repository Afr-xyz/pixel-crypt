# PROJECT_STATE — Pixel Crypt (ekspansi 3 → 7 lantai)

## Checkpoint terakhir yang selesai
**CHECKPOINT 7 — Final QA & Rilis** (selesai; CP6 integrasi sebelumnya; CP0 audit, CP1 fondasi, CP2 Medusa, CP3 Cerberus, CP4 Minotaur sebelumnya). Semua 7 boss sudah asli — tidak ada placeholder tersisa.

## Status CP7 — Final QA & Rilis (SELESAI)
- README.md ditulis ulang sesuai kondisi aktual (7 lantai, 28 ruangan, 7 boss, cara Android A/B/C, uji manual Android yang masih perlu). `sw.js` cache `pixel-crypt-v3` (aset berubah sejak v2). `test/bot.py` batas GOD dinaikkan ke 6000 dtk.
- Uji end-to-end nyata: `bot.py` GOD (kebal) menamatkan 7 lantai → state `win`, tanpa error JS (786 dtk game). Bot NAIF (tanpa dodge) kalah di lantai awal (diharapkan).
- Dijalankan ulang setelah perubahan: cp5, cp6, smoke, touch (server & file://), bot. cp1–cp4 tidak diulang (kode tidak berubah sejak lulus di CP6).
- Konsistensi: `dist/pixel-crypt.html` dibangun ulang dari sumber & diverifikasi cp6; tidak ada boss placeholder (cp6); kemenangan hanya setelah Zeus mati (cp5, bot).
- **Belum diuji:** perangkat Android fisik (sentuhan, FPS, audio, landscape lock, PWA) dan keseimbangan oleh manusia — daftar uji manual ada di README.
- Bug/catatan tersisa: balans lantai 4–7 hanya via simulasi; `placeholderLoop`/`placeholderBoss` masih ada sebagai kode mati (tidak dipakai); layar menang teks generik.

## Status CP6 — Integrasi & Polish (SELESAI)
- Verifikasi: ZIP checkpoint-05 identik dengan file aktual (bosses/sprites/config/cp5/dist/docs).
- Flaky CP3 (penyebab ditemukan): cek "berdiri di titik aman" menghitung SEMUA damage (termasuk proyektil api/cincin) padahal hanya menguji lajur → kini hanya menghitung damage lajur (15). Bukan pelonggaran: kode Cerberus tidak berubah.
- Flaky CP4 (penyebab ditemukan): `retreat` Minotaur sering tak menemukan titik (radius tunggal 130 px) di arena 7 pilar → boss berulang stomp/punch, seruduk 1–5 per 200 dtk. Kini coba radius 130/95/60 → 7–14 seruduk per 200 dtk (8 sampel).
- Bug nyata lain: `test/touch.py` memakai path `/root/pixel-crypt` tetap → kini relatif; komentar config usang (placeholder) dibersihkan.
- `test/cp6.py` (baru): 7 lantai × 4 ruangan = 28, urutan 7 boss, boss hanya di ruang ke-4, tanpa NaN, tanpa placeholder, nextRoom antar lantai, Zeus tidak "menang sendiri", dist memuat semua sumber js terbaru, tanpa error JS → semua lulus.
- Tes terakhir: cp1, cp2, cp3 (4x), cp4 (3x), cp5, cp6, smoke, touch (server & file://) lulus. Android nyata BELUM diuji. `bot.py GOD` tidak diubah (belum memakai dodge; habis batas waktu di lantai 6).
- Bug tersisa: keseimbangan HP/damage lantai 4–7 belum diuji manusia; bot belum bisa menamatkan 7 lantai; README masih menyebut 3 lantai (CP7).

## Status CP5 — Zeus (SELESAI)
- Zeus asli (HP 1500, r12, fase di HP ≤66% dan ≤33%), sprite baru (pose idle/raise/slam/dizzy), tanpa tag [SEMENTARA]. Arena = layout boss default (4 pilar). Menjaga jarak ~110 px (`zeusDrift`), tidak melukai saat disentuh.
- Pola (`ZS` di `js/bosses.js`): **bolts** (petir terarah beruntun ke pemain, lingkaran r32 bertelegraf 0.9 dtk), **beam** (lajur dari Zeus, melacak 0.5 dtk lalu terkunci; fase 1 = 2 lajur, fase 2 = 3), **orbs** (kipas bola energi 5/7), **chain** (gelombang petir bergulir menuju pemain; geser menyamping), **rain** (hujan petir acak + satu di pemain, 2/3 ronde makin cepat), **spokes** (jari-jari petir 6/8; fase 2 set kedua digeser setengah langkah), **wrath** (fase 2, tiap serangan ke-4: ledakan r92 + cincin).
- Fase 0: bolts/beam/orbs. Fase 1: + rain/chain/spokes. Fase 2: bolts/beam/rain/chain/spokes + wrath, tempo lebih cepat.
- Jendela serang balik: setelah tiap serangan Zeus 'LELAH' (pose dizzy, damage ×1.3; ×1.5 setelah wrath) 1.5/1.25/1.0 dtk (1.6 dtk setelah wrath). Semua zona yang melukai bertelegraf ≥0.8 dtk (peringatan kerucut bola ≥0.55 dtk).
- Kemenangan: hanya lewat `onBossDeath` → ruang bersih → `Game.win()` (layar KEMENANGAN 7/7); ganti fase tidak memicu menang.
- File CP5: `js/bosses.js`, `js/sprites.js`, `js/config.js`, `test/cp5.py`, `dist/pixel-crypt.html`.
- Tes (headless; Android nyata BELUM): `test/cp5.py` 13/13 (2x lulus): 3 fase, jenis petir per fase, telegraph, titik aman ≤110 px (≥95%), dodge=0 damage vs diam=23 damage, ganti fase tanpa menang, Zeus kalah→layar menang, tanpa error JS. cp1, cp2 lulus; smoke OK. cp3/cp4 tiap kali ada 1 cek acak yang kadang gagal (lihat bug).
- Catatan: `bot.py GOD` kini habis batas waktu (545 dtk) di lantai 6 tanpa error; bot tidak memakai dodge dan belum bisa mencapai Zeus — perlu disesuaikan di CP6. Keseimbangan belum diuji manusia. Layar menang memakai teks generik.

## Status CP4 — Minotaur (SELESAI)
- Minotaur asli (HP 1000, r15, fase di HP ≤50%), sprite baru (pose idle/raise/slam/dizzy). Arena `BOSS_LAYOUTS.minotaur` 7 pilar.
- Pola: **charge** (lajur persegi bertelegraf ≥0.9 dtk, melacak pemain lalu terkunci putih 0.45 dtk sebelum lari; arah seruduk = lajur), **charge2** (fase ≥1, beruntun), **stomp** (lingkaran r64, fase ≥1 + cincin peluru), **punch** (kerucut jarak dekat).
- Tabrak dinding/pilar → boss 'dizzy' (rentan ×1.4 dinding 1.8 dtk, ×1.6 pilar 2.4 dtk; lebih singkat fase 1) + puing bertelegraf di fase ≥1. Seruduk meleset → rentan ×1.15 0.7 dtk.
- Navigasi anti-tersangkut: `clearPath/pathDir` (waypoint sudut pilar, radius = r asli, `e.blocked` dianggap tidak bebas), `chase` (dengan `stop`), `retreat` (mundur ke titik berlajur panjang; berantai ≤3x bila belum ada lajur).
- File CP4: `js/bosses.js`, `js/sprites.js`, `js/world.js`, `js/config.js`, `test/cp4.py`, `dist/pixel-crypt.html`.
- Tes (headless; Android nyata BELUM): `test/cp4.py` 11/11 (3x berturut-turut lulus; kriteria dodge/diam statistik karena AI acak), cp1, cp2 lulus, smoke, bot GOD menang, touch lulus. `cp3.py` kadang gagal 1 cek acak ("berdiri di titik aman -> 0 damage", Cerberus tidak diubah di CP4) — perlu diperiksa di CP6.
- Catatan: keseimbangan belum diuji manusia; bot belum memakai dodge; `test/touch.py` memakai path file:// tetap `/root/pixel-crypt`.

## Status CP3 — Cerberus (SELESAI)
- Cerberus asli (HP 1000, r16, fase di HP ≤66% dan ≤33%), sprite 3 kepala: **Api** (kiri, oranye), **Taring** (tengah, merah), **Roh** (kanan, biru); mata/mulut kepala yang menyerang menyala sesuai warna telegraph.
- Pola: **triple** (3/4/5 lajur per fase dari beberapa arah, melacak 0.5 dtk lalu terkunci, celah aman di antara lajur), **fireball** (kepala Api, kipas 3–5 peluru ×3–4; fase 2 + cincin), **bite** (gigitan kerucut jarak dekat + lompatan), **crossfire** (palang horizontal+vertikal di posisi pemain terprediksi; fase ≥1 dua palang), **rotor** (fase ≥1: 3 sapuan api berputar, celah 120°).
- Jeda serang balik: tiap 2 serangan Cerberus 'dizzy' (damage ×1.3) 1.5 dtk (1.1 dtk fase 2). Semua zona bertelegraf ≥0.55 dtk.
- Arena: `BOSS_LAYOUTS.cerberus` 4 pilar. File CP3: `js/bosses.js` (CER, cerberusLoop, draw), `js/sprites.js` (cerberus), `js/world.js`, `js/config.js`, `test/cp3.py`, `dist/pixel-crypt.html` (183 KB).
- Tes (simulasi headless, Android nyata BELUM): `test/cp3.py` 12/12 LULUS (3 warna kepala, fase 0/1/2, lajur 3→4→5, titik aman selalu ada [33 sampel], berdiri di titik aman = 0 damage, palang punya area aman, gigitan+api muncul, rotor hanya fase ≥1, jendela dizzy, boss mati → ruangan bersih tanpa crash, 0 error/NaN). Regresi: cp1 & cp2 LULUS, smoke OK, bot GOD menang, bot NAIF mati (diharapkan), touch 2/2 (server & file://). Screenshot dilihat.
- Catatan: keseimbangan (damage lajur 15, palang 14, rotor 6/tick) belum diuji manusia; bot belum memakai dodge.

## Ringkasan CP2 — Medusa (SELESAI, tidak diubah di CP3)
- Medusa asli menggantikan placeholder (HP 900, fase ≤50%). Pola: **Tatapan** (kerucut bertelegraf, melacak lalu mengunci 0.35 dtk terakhir; fase 2 = 2× berturut), **Sapuan tatapan** (busur terpratinjau), **Volley ular** (kerucut telegraf + tembakan kipas), **Tamparan ekor** (jarak dekat; fase 2 + cincin peluru).
- Garis pandang diblokir pilar/dinding (kerucut digambar terpotong; arena 5 pilar `BOSS_LAYOUTS.medusa`, 5 patung dekor).
- Pemain: meter membatu 0.5 dtk (0.42 fase 2) yang pulih jika keluar/berlindung/dodge/Aegis (perisai pecah menahan tatapan); membatu 1.5 dtk, tiap ketukan tombol apa pun −0.2 dtk; bila tidak bebas → pecahan bertelegraf 1.35 dtk (26 dmg), bebas → kebal membatu 1.5 dtk (anti-rantai).
- Fase rentan: tatapan terhindar → Medusa 'dizzy' (mata terpejam) vulnMul ×1.35 selama 1.0–1.3 dtk.
- File CP2: `js/entities.js` (gazeHit/petrify/releaseStone/updateStone, hook `z.draw`, `shatter`), `js/bosses.js` (MED, gazeRun, medusaLoop, draw), `js/sprites.js` (medusa, statue, `S.tint`), `js/world.js` (`BOSS_LAYOUTS`, `make(theme,boss,kind)`, patung), `js/game.js`, `js/config.js`, `test/cp2.py`, `dist/pixel-crypt.html` (176 KB).

## Fitur yang telah selesai (kondisi baseline, kode asli)
- 3 lantai × (3 ruang tempur + 1 ruang boss) = 12 ruangan.
- Boss: Bone Colossus (L1), Morgana (L2), Ashgor 3 fase (L3).
- 8 musuh, 3 skill (Whirlwind/Lance/Aegis), dodge + perfect dodge, perk 1-dari-3, Forge, telegraph zona, HUD, PWA, build satu-file.
## Status CP1 (kondisi sekarang)
- 7 lantai × 4 ruangan = 28 ruangan; urutan boss: Bone Colossus, Morgana, Ashgor, Medusa, Cerberus, Minotaur, Zeus.
- Tema visual baru: `temple`, `hell`, `maze`, `sky` (palet, tile, dekorasi lantai, pilar, pintu otomatis dari `THEMES`).
- Boss 4–7 = **PLACEHOLDER** (`C.BOSS[x].placeholder:true`): pola `placeholderLoop` (telegraph lingkaran + cincin peluru + jeda), sprite sementara, nama bertanda `[SEMENTARA]`. **Bukan implementasi final.** Mekanik asli: Medusa SELESAI (CP2), Cerberus SELESAI (CP3), Minotaur CP4, Zeus CP5.
- Pool musuh & budget lantai 4–7 sudah ada (12/14/16/18) tetapi **belum diseimbangkan** (CP6). HP boss 4–7 juga sementara.
- Layar KEMENANGAN generik: "Takhta Langit direbut. Zeus telah tumbang." + "Lantai dituntaskan 7/7", musuh, perfect dodge, emas, waktu. (Sudah dari sesi sebelumnya; statistik tambahan opsional di CP5.)
- Pintu terkunci sampai ruangan bersih; lantai berikutnya hanya lewat `nextRoom()` berurutan.

## File yang telah diubah
Tidak ada (hanya menambah `PROJECT_STATE.md` dan `CHECKPOINT_LOG.md`).
CP1: `js/config.js` (FLOORS 4–7, BOSS 4–7), `js/sprites.js` (THEMES 4 baru, tile per tema, sprite boss sementara), `js/world.js` (dekorasi tema baru), `js/bosses.js` (placeholderLoop, tabel LOOPS/TRANS/TCOL, nama boss `[SEMENTARA]`), `js/ui.js` (layar menang generik + "Lantai dituntaskan"), `sw.js` (cache v2), `test/cp1.py` (baru), `dist/pixel-crypt.html` (dibangun ulang, 162 KB).
Sesi ini hanya memverifikasi dan mendokumentasikan; tidak ada edit kode tambahan.

## Peta arsitektur (diverifikasi dari kode)
Semua modul berbagi namespace global `window.PC` (tanpa module/bundler). Urutan `<script>` di `index.html`:
`util → config → sprites → audio → input → world → entities → enemies → bosses → game → ui → main`.
Jika menambah file JS baru: daftarkan di `index.html`, `sw.js` (ASSETS + naikkan `CACHE`), dan otomatis ikut `tools/bundle.js` (membaca tag `<script src>`).

| Sistem | Lokasi | Catatan |
|---|---|---|
| Konfigurasi | `js/config.js` → `PC.C` | `FLOORS[]` {name, theme, boss, pool, budget}, `ROOMS_PER_FLOOR=3`, `ENEMY`, `BOSS` {name, sub, hp, r, speed, gold, phases[]}, `PERKS`, `FORGE`, `PLAYER` |
| Alur run/room | `js/game.js` | `loadRoom(floor, idx)` (idx 0..2 tempur, idx==ROOMS_PER_FLOOR boss), `nextRoom`, `clearRoom`, `win`. Menang saat boss lantai terakhir (`C.FLOORS.length-1`) mati → sudah generik terhadap jumlah lantai. |
| Dunia/tile | `js/world.js` | `World.make(theme, boss)`; layout pilar acak (`LAYOUTS`) / `BOSS_LAYOUT` tetap; grid 26×14 tile 16px; pilar = tile 2; pintu kanan baris 6–7. Tema hanya lewat `S.tiles[theme]`, `S.pillar[theme]`, `S.door[theme]`, `S.THEMES[theme]`. |
| Sprite/tema | `js/sprites.js` | `THEMES` = crypt/swamp/inferno (palet). Sprite boss prosedural (`colossus/witch/dragon`), `S.build()` membuat semuanya. Dekorasi lantai per tema ada di `World.renderBg`. |
| Combat/zona | `js/entities.js` | `G.addZone` (circle/cone/rect, `delay` telegraph → `dur` aktif, `follow`, `sweep`, `tick`, `persist`, `cancel`, `onFire`), `G.addProj`, `G.addRing`, `G.hurtPlayer` (=Player.hurt), `G.damageEnemy` (menghormati `invuln`, `untargetable`, `vulnMul`), `G.killEnemy`. Player: `Player.create/update/draw/hurt/useSkill`, state `free/attack/dodge/whirl/cast/dead`. |
| AI musuh | `js/enemies.js` | Generator per musuh (`BRAINS`), `E.spawn/update/draw`. HP musuh ×(1+0.22·lantai), dmg ×(1+0.1·lantai). Gerak: `W.move` (sapuan per-sumbu), tanpa pathfinding (hanya geser samping). |
| AI boss | `js/bosses.js` | `COL/WIT/DRG` = objek pola (generator), `*Loop` memilih pola via `pick()`, `B.spawn(kind)`, `B.checkPhase` (ganti generator saat HP ≤ ambang `C.BOSS[k].phases`), `B.draw` (sprite per pose). Tabel `LOOPS/TRANS/TCOL` harus ditambah per boss baru. |
| Input | `js/input.js` | joystick melayang, tombol, keyboard; `In.mx/my`, `In.held`, `In.buf`, `In.press`. |
| HUD/menu | `js/ui.js` + `index.html` | Label ruangan: `'L'+(floor+1)+'-'+(boss?'BOSS':(idx+1)+'/3')` → sudah sesuai format "L4-2/3". Bar boss + nomor fase (I/II/III) otomatis. |
| Simpanan | `js/util.js` `PC.Save` | key `pixelcrypt.save.v1`; `best:{floor,room}`, `bossKills{}`, `forge{}`, `gold`, `wins`. Penambahan lantai tidak merusak data lama (skor best = floor*10+room). |
| Build | `tools/bundle.js` (tanpa dependensi), `tools/build-css.mjs` (butuh `npm install tailwindcss`), `tools/make-icons.js` | `css/tailwind.css` sudah ter-build; kelas Tailwind BARU di JS/HTML hanya muncul jika CSS dibangun ulang atau memakai `css/style.css`. |

## Bug / temuan dari audit
1. `ui.js` `endBox(win)` — teks kemenangan hardcode "Ashgor telah tumbang" dan statistik belum ada "lantai tuntas". Harus diubah (CP5).
2. `bosses.js` — boss lain terikat nama: `fly: kind==='witch'`, `solid: kind!=='witch'`, `blood`, `B.draw` per tipe, `TRANS` menetapkan teks per fase; perlu tabel per boss baru.
3. `B.spawn` menaruh boss tetap di `x=ROOM_W*0.74, y=ROOM_H/2+8`; `BOSS_LAYOUT` (4 pilar) sama untuk semua boss. Medusa/Minotaur butuh layout arena sendiri (CP2/CP4).
4. (Tetap) `E.update` memanggil `PC.Bosses.checkPhase` dan `e.contactDmg`; musuh bergerak tanpa pathfinding — Minotaur charge harus memakai `W.rayEnd`/flag `blocked`.
5. `ui.js` showMenu/best: `REKOR: LANTAI x-y` memakai `b.room+1` (boss=ruang 4) — aman untuk 7 lantai.
6. `bot.py` tidak pernah memakai dodge (`if (0 && ...)`) → `perfects=0`; bot "kebal" memakai `G.godmode`. Bot menang tanpa dodge, jadi **keseimbangan boss baru tidak bisa dinilai dari bot lama** (perlu bot dengan dodge/hindari zona di CP6–7).
7. Skrip uji memakai port 8099 dan path `file:///root/pixel-crypt/...` (hardcode) — `touch.py` harus disesuaikan path-nya.
8. `sw.js` `CACHE = 'pixel-crypt-v1'` — wajib dinaikkan tiap rilis agar HP tidak memakai cache lama.
9. Tailwind CLI tidak terpasang / registry npm tidak terjangkau dari lingkungan ini (`npm view tailwindcss` gagal) → jangan bergantung pada build ulang `tailwind.css`; tambahkan gaya baru di `css/style.css`.

## Tes yang telah dijalankan (CP1) dan hasilnya
| Tes | Hasil |
|---|---|
| `node --check` semua `js/*.js` + `sw.js` | LULUS |
| `test/cp1.py` (14 pemeriksaan: 7 lantai, 28 ruangan, urutan boss, label HUD "L4-2/3"…"L7-BOSS", boss muncul di tiap ruang boss, tanpa NaN, 7 tema unik, pintu tertutup tak bisa dilewati, bot GOD urutan 28 ruangan, win di L7, layar KEMENANGAN 7/7, 0 pageerror) | LULUS semua (simulasi, 926 dtk waktu-game) |
| `test/smoke.py` | LULUS — state `play`, 0 error |
| `test/bot.py` GOD (regresi) | LULUS — `win`, 0 error |
| `test/bot.py` NAIF tanpa dodge | Tidak error; berhenti di L6 karena batas waktu simulasi 600 dtk (bukan kegagalan; game kini lebih panjang) |
| Data simpanan lama (v1, emas 321, forge, best L3-4, bossKills) | LULUS — termuat utuh, menu menampilkan "REKOR: LANTAI 3-4" |
| Screenshot headless L1, L4–L7 boss, L7-2/3 | Dilihat: tema berbeda, HUD tidak terpotong, boss placeholder tampil |
| `touch.py` (server & `file://`, disesuaikan path) | LULUS pada 5/5 ulangan terpisah; 1 kali berturut-turut tampak gagal saat CPU sibuk (flake pengujian, bundle CP0 asli stabil sama) |
| Android nyata | **BELUM DIUJI** |

Dibuktikan hanya lewat simulasi: semua di atas. Belum diverifikasi manusia: rasa kesulitan lantai 4–7.

## Tes CP2 (simulasi headless; Android nyata BELUM diuji)
- `test/cp2.py`: 11/11 LULUS (Medusa asli+5 pilar; telegraph; terkena→membatu; mash 3× bebas <1.0 dtk (0.9) tanpa kena pecahan; tanpa mash pecahan 26 dmg; berlindung di pilar→meter 0; fase rentan ×1.35; fase 2; semua 4 pola terlihat dalam 240 dtk sim; 0 error JS/NaN).
- Regresi: `cp1.py` SEMUA LULUS, smoke OK, bot GOD menang 0 error, touch 3/3 (server & file://) saat dijalankan sendiri (flake bila CPU sibuk, sudah dikenal).
- Bot NAIF tanpa dodge kini **mati** (state `over`, 0 error) — wajar: Medusa menuntut dodge/posisi.
- Screenshot kerucut tatapan terpotong pilar dilihat langsung.

## Bug / catatan CP2
- Pemain yang menahan tombol serang saat bebas dari batu langsung menyerang (tidak bergerak) — sesuai perilaku tombol, bukan bug.
- Belum diseimbangkan oleh manusia: lama tatapan/telegraph, HP 900, kerusakan pecahan. Perlu uji rasa di Android (CP6).
- Titik asal tatapan memakai posisi kaki boss (e.y), sprite 50 px lebih tinggi; kerucut digambar dari ±tengah badan.

## Langkah tepat untuk melanjutkan
1. Ketik **"LANJUTKAN CHECKPOINT"** → (proyek selesai; lanjutan opsional: uji Android & penyeimbangan).
2. Uji: `node server.js 8099 &` lalu `python3 test/cp1.py`, `cp2.py`, `cp3.py`, `cp4.py`, `cp5.py`, `cp6.py`, `bot.py`.

## Checkpoint berikutnya
Tidak ada checkpoint terjadwal. Opsional: uji manual Android, penyeimbangan HP/damage lantai 4–7 berdasarkan uji manusia, hapus kode placeholder mati.
