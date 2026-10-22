# CP1: uji fondasi 7 lantai. Pakai: node server.js 8099 &  lalu  python3 test/cp1.py
import re, json, sys, os
from playwright.sync_api import sync_playwright
HERE = os.path.dirname(os.path.abspath(__file__))
BOT = re.search(r'BOT = """(.*?)"""', open(os.path.join(HERE, 'bot.py')).read(), re.S).group(1)
URL = 'http://localhost:%s/?nosw' % (sys.argv[1] if len(sys.argv) > 1 else '8099')
fails = []
def check(name, ok, info=''):
    print(('PASS ' if ok else 'FAIL ') + name + (' | ' + str(info) if info else '')); 
    if not ok: fails.append(name)

LABELS = """
() => {
  const out = [];
  for (let f = 0; f < PC.C.FLOORS.length; f++) for (let i = 0; i <= PC.C.ROOMS_PER_FLOOR; i++) {
    PC.Game.loadRoom(f, i); PC.Game.step(i === PC.C.ROOMS_PER_FLOOR ? 4 : 0.2, 60); PC.UI.updateHud();
    const b = document.getElementById('boss-name');
    out.push({ f, i, label: document.getElementById('room-label').textContent, boss: G_boss(), hp: document.getElementById('hp-text').textContent, bossName: PC.G.boss ? PC.G.boss.name : null, theme: PC.World.room.theme, state: PC.G.state, err: PC.G.lastError || null });
  }
  function G_boss() { return PC.G.boss ? PC.G.boss.type : null; }
  return out;
}
"""
SKIP = """
() => {
  const r = [];
  for (const [f, i] of [[0, 0], [3, 1], [6, 3]]) {
    PC.Game.loadRoom(f, i); PC.Game.step(0.3, 60); const p = PC.G.player; p.x = PC.C.ROOM_W - 8; p.y = 112; PC.Game.step(2.5, 60);
    r.push({ f, i, now: PC.G.run.floor + '-' + PC.G.run.room, fade: !!PC.G.fadeT });
  }
  return r;
}
"""
with sync_playwright() as p:
    b = p.chromium.launch(args=['--no-sandbox']); errs = []
    pg = b.new_page(viewport={'width': 800, 'height': 360}, has_touch=True)
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto(URL); pg.wait_for_timeout(500)
    cfg = pg.evaluate("({n: PC.C.FLOORS.length, rpf: PC.C.ROOMS_PER_FLOOR, bosses: PC.C.FLOORS.map(f => f.boss), themes: PC.C.FLOORS.map(f => f.theme), names: PC.C.FLOORS.map(f => f.name), hasBossCfg: PC.C.FLOORS.every(f => !!PC.C.BOSS[f.boss]), pools: PC.C.FLOORS.every(f => f.pool.every(t => !!PC.C.ENEMY[t]))})")
    check('7 lantai', cfg['n'] == 7, cfg['n']); check('total 28 ruangan', cfg['n'] * (cfg['rpf'] + 1) == 28)
    check('urutan boss', cfg['bosses'] == ['colossus', 'witch', 'dragon', 'medusa', 'cerberus', 'minotaur', 'zeus'], cfg['bosses'])
    check('semua boss & pool terdefinisi', cfg['hasBossCfg'] and cfg['pools'])
    pg.click('#m-play'); pg.wait_for_timeout(200); pg.click('#help-back'); pg.wait_for_timeout(300)
    lab = pg.evaluate(LABELS)
    check('28 ruangan termuat tanpa error', len(lab) == 28 and all(x['err'] is None for x in lab))
    exp = ['L%d-%s' % (x['f'] + 1, 'BOSS' if x['i'] == 3 else '%d/3' % (x['i'] + 1)) for x in lab]
    check('label HUD', [x['label'] for x in lab] == exp, [x['label'] for x in lab if x['label'] not in exp][:3])
    check('boss muncul di tiap ruang boss', all((x['boss'] is not None) == (x['i'] == 3) for x in lab), [(x['f'], x['boss']) for x in lab if x['i'] == 3])
    check('tidak ada NaN di HUD', all('NaN' not in x['hp'] for x in lab))
    check('tema per lantai unik (7 tema)', len(set(x['theme'] for x in lab)) == 7, sorted(set(x['theme'] for x in lab)))
    print('  nama boss:', [x['bossName'] for x in lab if x['i'] == 3])
    sk = pg.evaluate(SKIP)
    check('pintu tertutup tidak bisa dilewati', all(x['now'] == '%d-%d' % (x['f'], x['i']) and not x['fade'] for x in sk), sk)
    pg.close()
    # bot GOD main penuh dari lantai 1
    pg = b.new_page(viewport={'width': 800, 'height': 360}, has_touch=True); pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto(URL); pg.wait_for_timeout(400); pg.click('#m-play'); pg.wait_for_timeout(200); pg.click('#help-back'); pg.wait_for_timeout(300)
    r = pg.evaluate(BOT, {'god': True, 'maxSec': 4000, 'dodge': False})
    seq = [x.split('@')[0] for x in r['rooms']]; expseq = ['%d-%d' % (f, i) for f in range(7) for i in range(4)]
    check('bot: urutan 28 ruangan benar', seq == expseq, seq if seq != expseq else len(seq))
    check('bot: state win di L7 boss', r['state'] == 'win' and r['floor'] == 6 and r['room'] == 3, (r['state'], r['floor'], r['room']))
    check('bot: tanpa error JS', r['err'] is None, r['err']); print('  bosses terakhir:', r['bosses'], 'waktu', r['sec'], 'dtk')
    pg.wait_for_timeout(300); txt = pg.inner_text('#over-box')
    check('layar KEMENANGAN muncul', 'KEMENANGAN' in txt and '7/7' in txt and 'NaN' not in txt, txt.replace('\n', ' | ')[:120])
    pg.screenshot(path=os.environ.get('SHOT', '/tmp/cp1_win.png')); pg.close()
    check('tanpa pageerror', not errs, errs); b.close()
print('\nHASIL:', 'SEMUA LULUS' if not fails else 'GAGAL: %s' % fails); sys.exit(1 if fails else 0)
