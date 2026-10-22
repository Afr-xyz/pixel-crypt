import os
from playwright.sync_api import sync_playwright
DIST = 'file://' + os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'dist/pixel-crypt.html')
with sync_playwright() as p:
    b=p.chromium.launch(args=['--no-sandbox']); errs=[]
    # Uji versi bundel file:// (seperti dibuka dari penyimpanan HP)
    for url in ['http://localhost:8099/?nosw',DIST]:
        pg=b.new_page(viewport={'width':800,'height':360},has_touch=True); pg.on('pageerror',lambda e:errs.append(str(e)))
        pg.goto(url); pg.wait_for_timeout(400); pg.click('#m-play'); pg.click('#help-back'); pg.wait_for_timeout(300)
        # joystick: tekan di zona kiri lalu geser ke kanan
        pg.mouse.move(100,250); pg.mouse.down(); pg.mouse.move(150,250,steps=4); pg.wait_for_timeout(150)
        mx=pg.evaluate("PC.In.mx"); x0=pg.evaluate("PC.G.player.x"); pg.wait_for_timeout(500); x1=pg.evaluate("PC.G.player.x"); pg.mouse.up()
        # tombol dodge & serang
        bb=pg.locator('#btn-dodge').bounding_box(); pg.mouse.move(bb['x']+bb['width']/2,bb['y']+bb['height']/2); pg.mouse.down(); pg.wait_for_timeout(60)
        st=pg.evaluate("PC.G.player.state"); pg.mouse.up(); pg.wait_for_timeout(500)
        ba=pg.locator('#btn-attack').bounding_box(); pg.mouse.move(ba['x']+30,ba['y']+30); pg.mouse.down(); pg.wait_for_timeout(120)
        st2=pg.evaluate("PC.G.player.state"); pg.mouse.up()
        print(url.split('/')[-1] or url, '| In.mx=%.2f geser x %.0f->%.0f | dodge state=%s | attack state=%s'%(mx,x0,x1,st,st2))
        pg.close()
    print('pageerrors:',errs); b.close()
