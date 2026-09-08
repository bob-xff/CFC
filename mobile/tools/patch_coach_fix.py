#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""V2.2.5 评审修复：5 代理发现的 P1/P2 全量处置"""
import re
p='football-career-simulator.html'
s=open(p,encoding='utf-8').read()
ok=[]
def rep(old,new,label,count=1):
    global s
    c=s.count(old)
    assert c==count, "FAIL %s: found %d, expected %d"%(label,c,count)
    s=s.replace(old,new); ok.append(label)

# ===== P1-1/P1-2: lead 效果表错位 + 防守反向加失球 + dec 文案按局势 =====
rep("""    lead:[{g:-0.35,ga:-0.5},{g:0.5,ga:0.55},{d:0}],""",
    """    lead:[{d:0},{g:-0.35,ga:-0.5},{g:0.5,ga:0.55}],""",'lead table')
rep("""  const m=table[sit][i];
  const gf60=coach.live.gf1,ga60=coach.live.ga1;
  let gf=gf60,ga=ga60;
  if(m.g)gf+=Math.random()<Math.min(0.85,(coach.live.expGf*0.5)*m.g)?1:0;
  if(m.ga)ga+=Math.random()<Math.min(0.8,(coach.live.expGa*0.4)*Math.abs(m.ga))?1:0;
  gf=Math.max(0,Math.min(5,gf));ga=Math.max(0,Math.min(5,ga));
  const win=gf>ga,draw=gf===ga;
  const decText=['对位换人','强化攻势','稳定局面','搏命变阵','针对性奇兵','收缩防守'][i]||'临场调整';
  coachMatchResult({gf:gf,ga:ga,win:win,draw:draw,dec:decText,sit:sit});""",
"""  const m=table[sit][i];
  const gf60=coach.live.gf1,ga60=coach.live.ga1;
  let gf=gf60,ga=ga60;
  if(m.g>0&&Math.random()<Math.min(0.85,(coach.live.expGf*0.5)*m.g))gf+=1;
  if(m.g<0&&gf>0&&Math.random()<Math.min(0.6,(coach.live.expGf*0.3)*(-m.g)))gf-=1;
  if(m.ga>0&&Math.random()<Math.min(0.75,(coach.live.expGa*0.4)*m.ga))ga+=1;
  if(m.ga<0&&ga>gf60&&Math.random()<Math.min(0.6,(coach.live.expGa*0.35)*(-m.ga)))ga-=1;
  gf=Math.max(0,Math.min(5,gf));ga=Math.max(0,Math.min(5,ga));
  const win=gf>ga,draw=gf===ga;
  const decMap={lead:['对位换人','防守换人','换上前锋'],draw:['边路突击','维持现状','收缩防线'],trail:['双前锋搏命','替补奇兵','稳定军心']};
  const dec=(decMap[sit]||['临场调整'])[i]||'临场调整';
  coachMatchResult({gf:gf,ga:ga,win:win,draw:draw,dec:dec,sit:sit});""",'live decision math')

# ===== P1-3: 比分分布扩展（两次伯努利） =====
rep("""  const gf1=Math.random()<expGf*0.55?1+(Math.random()<expGf*0.2?1:0):0;
  const ga1=Math.random()<expGa*0.5?1:0;""",
"""  const gf1=(Math.random()<expGf*0.5?1:0)+(Math.random()<expGf*0.28?1:0);
  const ga1=(Math.random()<expGa*0.42?1:0)+(Math.random()<expGa*0.16?1:0);""",'score spread')

# ===== P1-4: 中超冠军可达 + 连续两季升迁 + NT 死亡螺旋 =====
rep("""    const pos=Math.max(1,Math.min(16,17-Math.round(coach.rep/100*13+2+(Math.random()*4-2))));""",
"""    const pos=coach.teamIdx>=3?Math.max(1,Math.min(16,17-Math.round(coach.rep/100*16+1)+(Math.random()<0.2?1:0))):Math.max(1,Math.min(16,17-Math.round(coach.rep/100*13+2+(Math.random()*4-2))));""",'pos formula')
rep("""    if(coach.rep>=78&&coach.teamIdx<4){
      coach.teamIdx++;
      coach.rep=Math.max(45,coach.rep-15);
      html+='赛季末，'+COACH_LADDER[coach.teamIdx].name+'向你发出邀约——你接受了'+COACH_LADDER[coach.teamIdx].pos+'的职位。';
    }else if(coach.rep<20&&coach.teamIdx>0){""",
"""    coach.hot=(coach.rep>=78)?(coach.hot||0)+1:0;
    if(coach.hot>=2&&coach.teamIdx<4){
      coach.teamIdx++;
      coach.rep=(coach.teamIdx===4)?Math.max(62,coach.rep-15):Math.max(45,coach.rep-15);
      coach.hot=0;
      html+='连续两个赛季的稳定输出让豪门坐不住了——赛季末，'+COACH_LADDER[coach.teamIdx].name+'正式向你发出邀约，你接受了'+COACH_LADDER[coach.teamIdx].pos+'的职位。';
    }else if(coach.rep<20&&coach.teamIdx>0){""",'promotion hot streak')

# ===== P1-5: 国家队死亡螺旋（ok 门槛下调 + 下课出口） =====
rep("""    const ok=coach.rep>=65&&Math.random()<0.65;
    coach.rep=Math.max(0,Math.min(100,coach.rep+(ok?6:-4)));
    html+='<div class="consequence-text">'+(ok?'国家队在世预赛关键战打出了血性，球迷重新为你欢呼，足协公开表达支持。':'热身赛与预选赛成绩不佳，舆论开始讨论换帅。你熬过了艰难的一年。')+'</div>';""",
"""    const ok=coach.rep>=60&&Math.random()<0.65;
    coach.rep=Math.max(0,Math.min(100,coach.rep+(ok?6:-4)));
    html+='<div class="consequence-text">'+(ok?'国家队在世预赛关键战打出了血性，球迷重新为你欢呼，足协公开表达支持。':'热身赛与预选赛成绩不佳，舆论开始讨论换帅。你熬过了艰难的一年。')+'</div>';
    if(!ok&&coach.rep<25&&coach.teamIdx===4){
      coach.teamIdx=2;coach.rep=42;coach.hot=0;
      html+='<div class="consequence-text">足协最终按下了换帅按钮。你交出国家队教鞭，沉寂半年后在中超重新出山——这一次，你要证明那些质疑都错了。</div>';
    }""",'NT spiral exit')

# ===== P2 群：seasonStats + 文案 + 持久化 + 布局 =====
rep("""  coach.age++;
  coach.lastEvent=Math.floor(Math.random()*COACH_EVENTS.length);""",
"""  coach.age++;
  coach.seasonStats={w:0,d:0,l:0};
  let evIdx=Math.floor(Math.random()*COACH_EVENTS.length);
  if(lad.tier==='国家队'){const clubOnly=[2,3,4];do{evIdx=Math.floor(Math.random()*COACH_EVENTS.length)}while(clubOnly.includes(evIdx));}
  else{let guard=0;while(evIdx===coach.lastEvent&&guard<6){evIdx=Math.floor(Math.random()*COACH_EVENTS.length);guard++}}
  coach.lastEvent=evIdx;""",'season stats + event filter')
rep("""  const seasons=coach.age-(coach.startAge||coach.age)+1;""",
"""  const seasons=coach.age-(coach.startAge||coach.age);""",'seasons off-by-one')
rep("""coach.age+'岁赛季收官：焦点战与全季合计 <b style="color:var(--volt)">'+st.w+'胜 '+st.d+'平 '+st.l+'负</b>（'+pts+' 分）。""",
"""coach.age+'岁赛季收官：焦点战与本季合计 <b style="color:var(--volt)">'+(coach.seasonStats?coach.seasonStats.w:0)+'胜 '+(coach.seasonStats?coach.seasonStats.d:0)+'平 '+(coach.seasonStats?coach.seasonStats.l:0)+'负</b>；生涯总计 '+st.w+'胜 '+st.d+'平 '+st.l+'负（'+pts+' 分）。""",'result text career')
rep("""  const changes=applyEffects(outcome.effects);
  if(outcome.formChange)""","""  const changes=applyEffects(outcome.effects);
  if(outcome.formChange)""",'noop') if False else None
# coachChoose/coachMatchResult 同步 seasonStats
rep("""  coach.stats.w+=res.win?1:0;coach.stats.d+=res.draw?1:0;coach.stats.l+=res.win||res.draw?0:1;""",
"""  coach.stats.w+=res.win?1:0;coach.stats.d+=res.draw?1:0;coach.stats.l+=res.win||res.draw?0:1;
  if(!coach.seasonStats)coach.seasonStats={w:0,d:0,l:0};
  coach.seasonStats.w+=res.win?1:0;coach.seasonStats.d+=res.draw?1:0;coach.seasonStats.l+=res.win||res.draw?0:1;""",'seasonStats sync')

# 原始键值泄漏 + NT 事件过滤后的 opponent/label
rep("""  const opp=isNT?(coach.rep>=60?'亚洲区头号劲旅':'西亚劲旅'):(coach.teamIdx>=3?'争冠直接竞争对手':coach.teamIdx===2?'积分榜 nearest 对手':'青训联赛对手');""",
"""  const opp=isNT?(coach.rep>=60?'亚洲区头号劲旅':'西亚劲旅'):(coach.teamIdx>=3?'争冠直接竞争对手':coach.teamIdx===2?'积分榜咬得最紧的对手':'联赛同龄梯队');""",'opp wording')
rep("""  html+='<div class="event-narrative">'+head+'\\\\n\\\\n阵型 '+coach.focus.fmt+' · 策略 '+coach.focus.str+' · 你还有最后一个换人名额：</div>';""",
"""  const fmtName=(COACH_FMT.find(f=>f.k===coach.focus.fmt)||{}).t||coach.focus.fmt;
  const strName=(COACH_STR.find(f=>f.k===coach.focus.str)||{}).t||coach.focus.str;
  html+='<div class="event-narrative">'+head+'\\n\\n阵型 '+fmtName+' · 策略 '+strName+' · 你还有最后一个换人名额：</div>';""",'fmt/str display')
rep("""  html+='<button class="continue-btn" onclick="coachConfirmTactics()">排兵完毕 · 出发球场 →</button></div>';""",
"""  html+='<button class="continue-btn" onclick="coachConfirmTactics()">排兵完毕 · 前往球场 →</button></div>';""",'wording')
# 转会窗/董事会/研修班事件国家队过滤配合（coachStartSeason 已过滤 2/3/4 号事件）
rep("""  let evIdx=Math.floor(Math.random()*COACH_EVENTS.length);
  if(lad.tier==='国家队'){const clubOnly=[2,3,4];do{evIdx=Math.floor(Math.random()*COACH_EVENTS.length)}while(clubOnly.includes(evIdx));}""",
"""  let evIdx=Math.floor(Math.random()*COACH_EVENTS.length);
  if(lad.tier==='国家队'){const clubOnly=[2,3,4];do{evIdx=Math.floor(Math.random()*COACH_EVENTS.length)}while(clubOnly.includes(evIdx));}
  """,'noop marker') if False else None

# ===== gk9 GK.positioning 键修复 =====
rep("""{text:'沉着回撤 — 守住近角等他犯错',effects:{'GK.positioning':3,'DRI.composure':2,'GK.handling':1},""",
"""{text:'沉着回撤 — 守住近角等他犯错',effects:{'GK.gkPositioning':3,'DRI.composure':2,'GK.handling':1},""",'gk9 key')

# ===== 浅色主题对比度 + hot 边框 =====
rep("""html[data-theme="light"] .m-chip.on,html[data-theme="light"] .lg-pts,html[data-theme="light"] .event-category{color:var(--volt-strong)}""",
"""html[data-theme="light"] .m-chip.on,html[data-theme="light"] .lg-pts,html[data-theme="light"] .event-category,html[data-theme="light"] .coach-badge,html[data-theme="light"] .tactic-chip.on,html[data-theme="light"] .rep-cap b{color:var(--volt-strong)}
html[data-theme="light"] .stat-tile.hot{border-color:rgba(77,124,15,.45)}
html[data-theme="light"] .rep-bar{background:linear-gradient(90deg,#4d7c0f,#3f6212)}""",'light contrast ext')

# ===== 横屏：retire-extra 页内滚动 + 5 列瓦片 + 卡片紧凑 =====
rep("""  .position-grid{grid-template-columns:repeat(5,1fr)}
  .retire-options{grid-template-columns:repeat(3,1fr);gap:10px}""",
"""  .position-grid{grid-template-columns:repeat(5,1fr)}
  #retire-screen.active{display:flex;flex-direction:column}
  #retire-screen.coach-mode.active{max-width:none;width:100%}
  #retire-extra{flex:1 1 0;min-height:0;overflow-y:auto;scrollbar-width:thin}
  #retire-back{flex:0 0 auto}
  #retire-extra .event-card{padding:12px 14px}
  #retire-extra .event-narrative{margin-bottom:8px}
  #retire-extra .continue-btn{margin-top:8px}
  .coach-hub .stat-grid{grid-template-columns:repeat(5,1fr)}
  .retire-options{grid-template-columns:repeat(3,1fr);gap:10px}""",'landscape coach layout')

# ===== coachSummary 修正 =====
rep("""终点站位""","""执教终点""",'summary wording')
rep("""'执教的最后时光，"+coach.playerName+""","""'执教的最后时光，"+escapeHtml(coach.playerName)+""") if "'执教的最后时光，" in s else None

# ===== 读档分支：教练存档回台 =====
rep("""          const doLoad=()=>{
            const data=loadGame(i);
            if(data){
              game=data;
              resetSessionState();""",
"""          const doLoad=()=>{
            const data=loadGame(i);
            if(data){
              game=data;
              resetSessionState();
              if(data.player&&data.player.retired&&data.coach){
                showScreen('retire-screen');showCoachMode();return;
              }""",'doLoad coach branch')

# ===== chooseRetire 幂等 + createPlayer 清 coach =====
rep("""  }else if(choice==='coach'){
    p.coaching=true;
    p.retired=true;
    addLog(p.age+'岁退役，转战教练岗位');
    showCoachMode();""",
"""  }else if(choice==='coach'){
    if(!p.coaching){p.coaching=true;addLog(p.age+'岁退役，转战教练岗位')}
    p.retired=true;
    showCoachMode();""",'chooseRetire idempotent')
rep("""  game=newGameState();
  const p=game.player;""",
"""  game=newGameState();
  game.coach=null;
  const p=game.player;""",'createPlayer clear coach')

# ===== startNewSeason 教练存档防循环 =====
rep("""function continuePlaying(){""",
"""function continuePlaying(){
  if(game.player&&game.player.retired){showRetirement();return}
""",'continuePlaying retired guard')

open(p,'w',encoding='utf-8',newline='').write(s)
print('APPLIED:',len(ok))
[print(' OK',x) for x in ok]
