# PIXEL CRYPT — Dungeon RPG Pixel Art (Landscape, Android)

Dungeon RPG top-down bergaya pixel art, tingkat kesulitan **Sulit**. **7 lantai, 28 ruangan (3 ruang tempur + 1 ruang boss per lantai), 7 boss** berfase,
3 skill, dodge dengan *perfect dodge*, perk roguelite, dan upgrade permanen (Forge).
Semua gambar & suara dibuat lewat kode: **tidak ada file aset**, tidak butuh internet saat bermain.

## Menjalankan di Android

### Cara A — Komputer + Wi-Fi yang sama (paling mudah)
1. Pasang [Node.js](https://nodejs.org) (v16+) di komputer. Tidak perlu `npm install` untuk bermain.
2. Buka terminal di folder ini lalu jalankan: `node server.js`
3. Terminal menampilkan alamat seperti `http://192.168.1.10:8080`. Buka alamat itu di **Chrome Android**
   (HP dan komputer harus satu Wi-Fi; jika gagal, izinkan Node.js di firewall komputer).
4. Ketuk **MAIN**. Game otomatis masuk layar penuh dan mengunci landscape.
5. Opsional: menu Chrome ⋮ → **Tambahkan ke layar utama** agar tampil seperti aplikasi.

### Cara B — Langsung di HP dengan Termux (tanpa komputer)
1. Pasang **Termux** (dari F-Droid). Jalankan: `pkg install nodejs unzip`
2. Salin `pixel-crypt.zip` ke HP, lalu: `unzip pixel-crypt.zip -d pixel-crypt && cd pixel-crypt && node server.js`
3. Buka `http://localhost:8080` di Chrome. Karena `localhost`, service worker aktif sehingga game
   bisa **dimainkan offline** setelah dibuka sekali dan bisa di-*install* sebagai PWA.

### Cara C — Satu file, tanpa server
File `dist/pixel-crypt.html` sudah berisi HTML+CSS+JS. Salin ke HP lalu buka dengan Chrome
(File manager → buka dengan Chrome). Bila file manager tidak mau membukanya, gunakan Cara A/B.
Kekurangan: tidak ada fitur PWA/offline cache, tapi game tetap berjalan penuh.

> Catatan: Service worker/PWA hanya aktif di HTTPS atau `localhost`. Lewat alamat IP Wi-Fi (Cara A) game tetap
> jalan normal, hanya tanpa cache offline.

## Kontrol sentuh
| Kontrol | Fungsi |
|---|---|
| Geser di sisi kiri | Joystick melayang (muncul di tempat jempol menyentuh) |
| **SERANG** | Kombo 3 pukulan; auto-bidik musuh terdekat; tahan untuk beruntun |
| **DODGE** | Guling singkat dengan kebal sesaat (memakai stamina, bar hijau) |
| Skill 1 (spiral) | **Whirlwind**: tebasan putar 3x, menebas peluru kecil — 20 MP |
| Skill 2 (petir) | **Lance**: tembakan tembus — 14 MP |
| Skill 3 (perisai) | **Aegis**: perisai penyerap; saat pecah meledak & membuat musuh pingsan — 25 MP |
| Botol | Ramuan pemulih HP |
| Tombol jeda | Jeda / ulangi / menu |

Keyboard (untuk uji di PC): WASD/Panah, `J` serang, `K`/Spasi dodge, `U`/`I`/`O` skill, `H` ramuan, `Esc` jeda.

## Cara bermain & mekanik
- **Area merah = telegraf serangan.** Keluar dari area atau guling saat isinya penuh.
- **Perfect dodge**: guling tepat saat serangan mengenai → slow-motion, +MP, +stamina.
- Tiap ruang tempur ada 2 gelombang musuh. Setelah bersih pilih **1 dari 3 perk**; ruangan ke-3 tiap lantai memberi istirahat (pulih sebagian). Ruangan ke-4 = boss; lantai: Ruang Bawah Tanah Terlupakan, Katakombe Busuk, Jurang Bara, Kuil Batu Terlarang, Gerbang Neraka, Labirin Raja, Takhta Langit.
- **Boss** (satu per lantai, semua berfase dan bertelegraf):
  1. **Bone Colossus** — raja tulang; hantaman dan celah saat lelah.
  2. **Morgana** — ratu wabah (penyihir); proyektil & zona sihir.
  3. **Ashgor** — naga bara, 3 fase.
  4. **Medusa** — tatapan bertelegraf: berlindung di balik pilar; terkena = **MEMBATU** (tekan tombol berulang untuk lepas; Aegis menahan).
  5. **Cerberus** — tiga kepala (Api/Taring/Roh), serangan multi-arah; cari celah di antara lajur.
  6. **Minotaur** — seruduk terarah (lajur peringatan terkunci): hindari ke samping; boss pusing jika menabrak dinding/pilar.
  7. **Zeus** — boss terakhir, 3 fase: petir terarah, lajur, hujan/gelombang/jari-jari petir, lalu murka. Boss lelah setelah serangan — celah menyerang balik.
  Layar **KEMENANGAN** muncul hanya setelah Zeus dikalahkan.
- Emas disimpan permanen; belanjakan di **FORGE** (HP, damage, MP, ramuan, kelincahan).
- Mati = run berakhir, emas tetap dibawa (roguelite).

## Struktur proyek
```
index.html            Halaman utama
css/style.css         Gaya kustom (pixel UI, kontrol sentuh)
css/tailwind.css      Hasil build Tailwind (sudah disertakan)
src/input.css         Sumber Tailwind
js/util.js config.js  Utilitas, simpanan, data balancing (angka kesulitan ada di config.js)
js/sprites.js         Pixel art prosedural, tile, font bitmap, ikon
js/audio.js           Efek suara & musik chiptune (WebAudio)
js/input.js           Joystick, tombol, keyboard
js/world.js           Grid, tabrakan, render ruangan
js/entities.js        Pemain, skill, zona telegraf, proyektil, damage
js/enemies.js         8 jenis musuh (AI generator)
js/bosses.js          7 boss + fase (Colossus, Morgana, Ashgor, Medusa, Cerberus, Minotaur, Zeus)
js/game.js            Alur run, gelombang, loop, render
js/ui.js main.js      HUD/menu DOM, boot
server.js             Server statis Node (tanpa dependensi)
sw.js manifest.webmanifest icons/   PWA
tools/                build-css.mjs, bundle.js, make-icons.js
test/                 Uji Playwright (smoke, bot, touch, shots, cp1–cp6)
```

## Build (opsional — hasil build sudah disertakan)
```
npm install            # memasang tailwindcss v4
npm run build:css      # css/tailwind.css dari kelas di index.html & js/*.js
npm run bundle         # dist/pixel-crypt.html (satu file)
npm run icons          # icons/*.png
```
`tools/build-css.mjs` memakai API `compile()` Tailwind v4 dengan pemindai kelas sendiri, jadi tidak butuh CLI terpisah.

## Pengujian yang sudah dilakukan (jujur)
Semua di Chromium headless 800×360 (landscape), server `node server.js 8099` (`python3 test/<nama>.py`):
- `cp1`–`cp6.py`: fondasi 7 lantai, tiap boss (Medusa, Cerberus, Minotaur, Zeus: pola, telegraph, titik aman, dodge, fase, kematian), integrasi 28 ruangan/urutan boss/bundel `dist`.
- `smoke.py`, `touch.py` (joystick, DODGE, SERANG via pointer event; versi server **dan** `file://` satu-file).
- `bot.py`: bot **kebal** memainkan seluruh game 7 lantai sampai layar KEMENANGAN tanpa error JS; bot agresif **tanpa dodge** kalah di lantai awal–tengah (diharapkan).
- Boss Zeus tidak memicu kemenangan saat pergantian fase; menang hanya setelah Zeus mati (`cp5.py`).

**Belum teruji:** perangkat Android fisik (rasa sentuhan, performa/FPS, getar, kunci landscape, layar penuh, audio Chrome Android),
instalasi PWA, dan keseimbangan kesulitan oleh pemain manusia (HP/damage lantai 4–7 hanya diatur lewat simulasi). Jika terasa terlalu mudah/sulit,
ubah angka di `js/config.js` (mis. `PLAYER.dmgTaken`, HP boss di `BOSS`, `FLOORS[].budget`).

### Uji manual yang masih diperlukan di Android
1. Joystick, SERANG, DODGE, skill, ramuan responsif; tidak ada jempol yang menutupi tombol.
2. FPS stabil di boss dengan banyak zona (Zeus fase 3, Cerberus rotor).
3. Medusa: tombol mash saat MEMBATU terasa wajar di layar sentuh.
4. Kesulitan tiap boss 4–7 adil; perubahan fase terbaca.
5. Layar penuh/landscape lock, audio, simpanan emas (Forge) setelah menutup browser.
6. Layar KEMENANGAN setelah mengalahkan Zeus pada run sungguhan.
