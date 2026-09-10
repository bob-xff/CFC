# -*- coding: utf-8 -*-
"""竖屏 390x844 走查：起 http 服务，注入教练档，截取关键页面（含浅色主题）"""
import http.server, threading, os, sys, socketserver
from playwright.sync_api import sync_playwright

ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'shots')
os.makedirs(OUT, exist_ok=True)

class H(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw): super().__init__(*a, directory=ROOT, **kw)
    def log_message(self, *a): pass

srv = socketserver.TCPServer(('127.0.0.1', 8642), H)
threading.Thread(target=srv.serve_forever, daemon=True).start()

SHOTS = []
def shot(page, name):
    p = os.path.join(OUT, name + '.png')
    page.screenshot(path=p, full_page=False)
    SHOTS.append(p)
    print('shot:', name)

with sync_playwright() as pw:
    b = pw.chromium.launch()
    ctx = b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, is_mobile=True, has_touch=True)
    page = ctx.new_page()
    errors = []
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.goto('http://127.0.0.1:8642/football-career-simulator.html')
    page.wait_for_timeout(3200)  # splash

    # 注入教练档（浅色主题走查在切主题后重截）
    page.evaluate("""() => {
        cmCreateGame({team:'梅州客家', lgKey:'CL1', rep:40}, '走查教练');
        cmEnterGame();
    }""")
    page.wait_for_timeout(600)
    shot(page, '01_home_390')
    page.evaluate("() => cmSwitchTab('league')")
    page.wait_for_timeout(400)
    shot(page, '02_league_table_390')
    page.evaluate("() => { cmLeagueSeg='cup'; cmRenderLeague(); }")
    page.wait_for_timeout(400)
    shot(page, '03_cup_390')
    # 打一场快速比赛看战报+比赛浮层（若下一场为杯赛则更能看点球展示）
    page.evaluate("""() => {
        const fx = cmNextFixtureInfo();
        if (fx.type !== 'none') {
            cmPlayNext();
            if (cmMatch.phase === 'event') cmEventChoice(0);
            if (cmMatch.phase === 'pre') { cmStartLive(); cmMatch.quick = true; cmMatch.phase = 'ft'; cmRenderMatch(); }
        }
    }""")
    page.wait_for_timeout(400)
    shot(page, '04_match_ft_390')
    page.evaluate("() => { if (cmMatch) { cmMatchDone(); } }")
    page.wait_for_timeout(400)
    shot(page, '05_report_390')
    page.evaluate("() => { if (cmMatch && cmMatch.phase === 'post') cmPostClose(); }")
    page.wait_for_timeout(300)
    # 菜单浮层
    page.evaluate("() => cmToggleMenu()")
    page.wait_for_timeout(300)
    shot(page, '06_menu_390')
    page.evaluate("() => cmToggleMenu()")
    # 浅色主题重复关键页
    page.evaluate("() => document.documentElement.setAttribute('data-theme','light')")
    page.wait_for_timeout(200)
    page.evaluate("() => cmSwitchTab('home')")
    page.wait_for_timeout(300)
    shot(page, '07_home_light')
    page.evaluate("() => cmSwitchTab('league')")
    page.wait_for_timeout(300)
    shot(page, '08_table_light')
    # 比赛浮层（浅色，终场页）
    page.evaluate("""() => {
        const fx = cmNextFixtureInfo();
        if (fx.type !== 'none') {
            cmPlayNext();
            if (cmMatch.phase === 'event') cmEventChoice(0);
            if (cmMatch.phase === 'pre') { cmStartLive(); cmMatch.quick = true; cmMatch.phase = 'ft'; cmRenderMatch(); }
        }
    }""")
    page.wait_for_timeout(400)
    shot(page, '09_ft_light')
    # 浮层文字颜色实测（浅色主题下 cm-match-content 计算色应为浅色）
    ink = page.evaluate("""() => {
        const el = document.getElementById('cm-match-content');
        return getComputedStyle(el).color;
    }""")
    print('match-content color (light):', ink)
    rgb = ink.replace(/[rgb() ]/g, '').split(',')
    lum = 0.2126*int(rgb[0]) + 0.7152*int(rgb[1]) + 0.0722*int(rgb[2])
    print('luminance:', round(lum, 1), '=>', 'OK 浅色文字' if lum > 160 else 'FAIL 深色文字')
    # tabs 与 topbar 重叠检测
    overlap = page.evaluate("""() => {
        const tb = document.querySelector('.cm-topbar');
        const tabs = document.getElementById('cm-tabs');
        return {topbarH: tb.offsetHeight, tabsTop: tabs.style.top || '(css default)',
                tabsRectTop: Math.round(tabs.getBoundingClientRect().top)};
    }""")
    print('topbar/tabs:', overlap)
    # 首页在窄屏是否出现横向溢出
    overflow = page.evaluate("() => document.documentElement.scrollWidth - document.documentElement.clientWidth")
    print('horizontal overflow px:', overflow)
    print('page errors:', errors if errors else 'none')
    b.close()
srv.shutdown()
print('DONE', len(SHOTS), 'shots ->', OUT)
