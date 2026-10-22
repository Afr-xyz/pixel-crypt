from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch(args=['--no-sandbox']); pg=b.new_page(viewport={'width':800,'height':360},has_touch=True)
    errs=[]; pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.goto('http://localhost:8099/?nosw'); pg.wait_for_timeout(300); pg.click('#m-play'); pg.click('#help-back'); pg.wait_for_timeout(200)
    pg.evaluate("PC.G.godmode=true")
    # ruang tempur lantai 3
    pg.evaluate("PC.Game.loadRoom(2,1)"); pg.evaluate("PC.G.player.x=200;PC.G.player.y=120;PC.Game.step(5,60)"); pg.wait_for_timeout(100); pg.screenshot(path='/tmp/c_combat.png')
    for i,(f,name,adv) in enumerate([(0,'colossus',9),(1,'witch',9),(2,'dragon',10)]):
        pg.evaluate(f"PC.Game.loadRoom({f},3)"); pg.evaluate(f"PC.G.player.x=120;PC.G.player.y=120;PC.Game.step({adv},60)")
        pg.wait_for_timeout(100); pg.screenshot(path=f'/tmp/c_{name}.png')
    print(errs)
    b.close()
