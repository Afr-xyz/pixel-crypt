# CP6: integrasi 7 lantai / 28 ruangan / boss / bundel. Pakai: node server.js 8099 & lalu python3 test/cp6.py
import sys, json, os, glob
from playwright.sync_api import sync_playwright
URL = 'http://localhost:%s/?nosw' % (sys.argv[1] if len(sys.argv) > 1 else '8099')
fails = []
def check(n, ok, info=''):
    print(('PASS ' if ok else 'FAIL ') + n + (' | ' + str(info) if info else ''))
    if not ok: fails.append(n)
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
JS = """() => {
  const C = PC.C, G = PC.G, step = () => PC.Game.step(1/60, 60), R = { floors: C.FLOORS.length, rpf: C.ROOMS_PER_FLOOR + 1, bosses: C.FLOORS.map(f => f.boss), rooms: [], adv: [], ph: C.BOSS };
  for (let f = 0; f < C.FLOORS.length; f++) for (let i = 0; i <= C.ROOMS_PER_FLOOR; i++) {
    PC.Game.loadRoom(f, i); G.godmode = true; G.player.hp = G.player.maxHp = 9999; for (let k = 0; k < 300; k++) step();
    const b = G.boss, p = G.player;
    R.rooms.push({ f, i, boss: !!G.rm.boss, bt: b ? b.type : null, nan: [p.x, p.y, b ? b.x : 0, b ? b.y : 0].some(v => !isFinite(v)), ph: b ? b.name : '', st: G.state });
  }
  for (let f = 0; f < C.FLOORS.length - 1; f++) { PC.Game.loadRoom(f, C.ROOMS_PER_FLOOR); G.godmode = true; G.rm.cleared = true; G.rm.perkT = undefined; PC.Game.nextRoom(); for (let k = 0; k < 90; k++) step(); R.adv.push([G.rm.floor, G.rm.idx, G.state]); }
  PC.Game.loadRoom(6, 3); G.godmode = true; for (let k = 0; k < 900; k++) step(); R.zeusState = G.state; R.err = G.lastError || null;
  return R;
}"""
with sync_playwright() as pw:
    b = pw.chromium.launch(args=['--no-sandbox']); errs = []
    pg = b.new_page(viewport={'width': 800, 'height': 360}, has_touch=True); pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto(URL); pg.wait_for_timeout(400); pg.click('#m-play'); pg.wait_for_timeout(200); pg.click('#help-back'); pg.wait_for_timeout(300)
    R = pg.evaluate(JS); pg.close()
kinds = ['colossus', 'witch', 'dragon', 'medusa', 'cerberus', 'minotaur', 'zeus']
check('7 lantai x 4 ruangan = 28', R['floors'] == 7 and R['floors'] * R['rpf'] == 28 and len(R['rooms']) == 28, (R['floors'], R['rpf']))
check('boss per lantai berurutan 7 boss berbeda', R['bosses'] == kinds, R['bosses'])
check('ruang boss hanya ruangan ke-4; boss muncul sesuai lantai', all((r['bt'] == kinds[r['f']]) if r['i'] == 3 else (r['bt'] is None and not r['boss']) for r in R['rooms']), [(r['f'], r['bt']) for r in R['rooms'] if r['i'] == 3])
check('tak ada NaN / state selalu play di 28 ruangan', all(not r['nan'] and r['st'] == 'play' for r in R['rooms']))
check('tak ada boss placeholder (nama tanpa SEMENTARA)', all('SEMENTARA' not in r['ph'] for r in R['rooms']) and not any(v.get('placeholder') for v in R['ph'].values()))
check('nextRoom dari ruang boss -> lantai berikut ruang 0', R['adv'] == [[f + 1, 0, 'play'] for f in range(6)], R['adv'])
check('Zeus hidup (tidak menang sendiri) setelah 15 dtk', R['zeusState'] == 'play', R['zeusState'])
# bundel dist = sumber
order = [l.split('"')[1] for l in open(os.path.join(ROOT, 'index.html')).read().splitlines() if '<script src="js/' in l]
dist = open(os.path.join(ROOT, 'dist/pixel-crypt.html')).read()
missing = [f for f in order if open(os.path.join(ROOT, f)).read().strip() not in dist]
check('dist/pixel-crypt.html memuat semua sumber js terbaru', order and not missing, missing or len(order))
check('tanpa error JS', not errs and not R['err'], errs[:2])
print('\nHASIL:', 'SEMUA LULUS' if not fails else 'GAGAL: %s' % fails)
