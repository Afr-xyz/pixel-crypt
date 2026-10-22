# Uji asap: muat game di Chromium headless (landscape 800x360), cek error, ambil screenshot.
import sys, json
from playwright.sync_api import sync_playwright
URL = 'http://localhost:8099/?nosw'
with sync_playwright() as p:
    b = p.chromium.launch(args=['--no-sandbox'])
    pg = b.new_page(viewport={'width': 800, 'height': 360}, has_touch=True)
    errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.on('console', lambda m: errs.append('console.' + m.type + ': ' + m.text) if m.type == 'error' else None)
    pg.goto(URL); pg.wait_for_timeout(800)
    pg.screenshot(path='/tmp/s_menu.png')
    pg.click('#m-play'); pg.wait_for_timeout(300)
    pg.screenshot(path='/tmp/s_help.png')
    pg.click('#help-back'); pg.wait_for_timeout(1500)
    pg.screenshot(path='/tmp/s_play.png')
    print('state', pg.evaluate('PC.G.state'), 'errors', errs)
    b.close()
