#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""V2.2.4 修复批次 B：UI 细则 + JS 清理"""
p='football-career-simulator.html'
s=open(p,encoding='utf-8').read()
ok=[]
def rep(old,new,label,count=1):
    global s
    c=s.count(old)
    assert c==count, "FAIL %s: found %d, expected %d"%(label,c,count)
    s=s.replace(old,new); ok.append(label)

# 1. continue/btn-ghost 块级居中（两端一致）
rep(""".continue-btn{""",
""".continue-btn{display:flex;width:max-content;""",1)
rep(""".btn-ghost{""",
""".btn-ghost{display:flex;width:max-content;""",1)

# 2. 退役选项横屏复位三列
rep("""  .position-grid{grid-template-columns:repeat(5,1fr)}
  /* 首页/创建/读档/退役横屏适配 */""",
"""  .position-grid{grid-template-columns:repeat(5,1fr)}
  .retire-options{grid-template-columns:repeat(3,1fr);gap:10px}
  .retire-option{padding:14px 10px}
  /* 首页/创建/读档/退役横屏适配 */""")

# 3. 浅色 volt 小字对比度（用更深的 volt-strong）
rep("""html[data-theme="light"] .chapter-banner{background:linear-gradient(160deg,#ffffff,#f2f5fa)}""",
"""html[data-theme="light"] .chapter-banner{background:linear-gradient(160deg,#ffffff,#f2f5fa)}
html[data-theme="light"] .m-chip.on,html[data-theme="light"] .lg-pts,html[data-theme="light"] .event-category{color:var(--volt-strong)}
html[data-theme="light"] .event-category.cat-match{color:#8a5a0d}""")

# 4. 触点增强（粗指针设备：星级/存档操作/分段芯片/hint 字号）
rep("""@media(pointer:coarse){
  button{transition:transform .08s ease}
  button:active{transform:scale(.97)}
  .choice-btn:active{transform:translateX(4px) scale(.985)}
  .save-slot:active{transform:scale(.985)}
  .pos-btn:active,.retire-option:active{transform:scale(.98)}
}""",
"""@media(pointer:coarse){
  button{transition:transform .08s ease}
  button:active{transform:scale(.97)}
  .choice-btn:active{transform:translateX(4px) scale(.985)}
  .save-slot:active{transform:scale(.985)}
  .pos-btn:active,.retire-option:active{transform:scale(.98)}
  .star{width:36px;height:36px}
  .star .svg-icon{width:24px;height:24px}
  .star:active{transform:scale(.92)}
  .slot-action-btn{padding:9px 12px}
  .m-chip{padding:8px 14px}
  .m-catbar .m-chip{padding:7px 12px}
}""")
rep("""  .choice-hint{font-size:.64rem;margin-top:1px}""",
"""  .choice-hint{font-size:.68rem;margin-top:1px}""")

# 5. 清理死变量 lastAutoSaveToast
rep("""let lastAutoSaveToast=0;
function autoSave(){""","""function autoSave(){""")

# 6. doLoad 去掉冗余 renderRailSeason（updateGameHeader 内部已调用）
rep("""              showScreen('game-screen');switchView('story');
              updateGameHeader();renderRailSeason();""",
"""              showScreen('game-screen');switchView('story');
              updateGameHeader();""")

# 7. 自由市场兜底报价用 salaryCap
rep("""salary:Math.min(125000,Math.round(p.salary*0.9))""",
"""salary:Math.min(salaryCap('CL1',p.ovr),Math.round(p.salary*0.9))""")

# 8. doLoad 薪资迁移提示
rep("""              const cap0=salaryCap(game.player.league,game.player.ovr);
              if(game.player.salary>cap0*1.5){game.player.salary=cap0;saveGame(i);}""",
"""              const cap0=salaryCap(game.player.league,game.player.ovr);
              if(game.player.salary>cap0*1.5){game.player.salary=cap0;saveGame(i);addLog('薪资数据已按联赛标准自动校准');}""")

# 9. 积分榜 GK 注脚 + 国家队高亮修正
rep("""  html+='</div><div class="form-note">榜单按球队实力与你的表现模拟：你的进球助攻会带动球队排名。</div></div>';""",
"""  html+='</div><div class="form-note">'+(p.isGK?'榜单按球队实力与你的零封、稳定发挥模拟：你守住球门，球队排名就会上升。':'榜单按球队实力与你的表现模拟：你的进球助攻会带动球队排名。')+'</div></div>';""")
rep("""    html+='<div class="stat-tile hot"><div class="stat-tile-val">'+(p.internationalGoals||0)+'</div><div class="stat-tile-label">国家队进球</div></div>';""",
"""    html+='<div class="stat-tile'+(p.isGK?'':' hot')+'"><div class="stat-tile-val">'+(p.internationalGoals||0)+'</div><div class="stat-tile-label">国家队进球</div></div>';""")

open(p,'w',encoding='utf-8',newline='').write(s)
print('APPLIED:',len(ok))
[print(' OK',x) for x in ok]
