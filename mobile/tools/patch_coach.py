#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""V2.2.5 教练模式重做：指挥台 + 焦点战排兵布阵 + 临场决策换人 + 战绩体系 + 持久化"""
import re
p='football-career-simulator.html'
s=open(p,encoding='utf-8').read()
ok=[]
def rep(old,new,label,count=1):
    global s
    c=s.count(old)
    assert c==count, "FAIL %s: found %d, expected %d"%(label,c,count)
    s=s.replace(old,new); ok.append(label)

# ===== 1. 整体替换教练流程（showCoachMode → coachResult 全区间） =====
m=re.search(r"function showCoachMode\(\)\{.*?\n(?=function coachSummary\(\)\{)",s,re.S)
assert m,'coach block not found'
NEW_COACH = r'''function showCoachMode(){
  const p=game.player;
  if(game.coach){
    coach=game.coach;
    if(!coach.stats)coach.stats={w:0,d:0,l:0};
    if(!coach.titles)coach.titles=0;
  }else{
    let idx=0,rep=40;
    if(p.ovr>=84||p.honors.length>=6){idx=3;rep=55}
    else if(p.ovr>=76||p.honors.length>=3){idx=2;rep=50}
    else if(p.ovr>=68||p.honors.length>=1){idx=1;rep=45}
    coach={age:p.age+1,teamIdx:idx,rep:rep,honors:[],lastEvent:-1,playerName:p.name,startAge:p.age+1,stats:{w:0,d:0,l:0},titles:0};
    game.coach=coach;
  }
  document.getElementById('retire-screen').classList.add('coach-mode');
  setRetireBack('← 退出到主菜单',exitToMainMenu);
  coachDashboard();
  autoSave();
}
function coachDashboard(){
  const lad=COACH_LADDER[coach.teamIdx];
  const st=coach.stats;
  const seasons=coach.age-(coach.startAge||coach.age)+1;
  const extra=document.getElementById('retire-extra');
  let html='<div class="coach-hub">';
  html+='<div class="coach-head"><div class="coach-badge">'+lad.pos+'</div>';
  html+='<div class="coach-id"><b>'+escapeHtml(coach.playerName)+'</b><span>'+coach.age+'岁 · 执教'+lad.name+'</span></div></div>';
  html+='<div class="rep-wrap"><div class="rep-bar"><div class="rep-bar-fill" style="width:'+coach.rep+'%"></div></div><div class="rep-cap">执教声望 <b>'+coach.rep+'</b>/100'+(coach.rep>=78?' · 顶级名帅':coach.rep>=55?' · 声名鹊起':coach.rep>=35?' · 站稳脚跟':' · 摇摇欲坠')+'</div></div>';
  html+='<div class="stat-grid" style="margin-top:14px">';
  html+='<div class="stat-tile"><div class="stat-tile-val">'+seasons+'</div><div class="stat-tile-label">执教赛季</div></div>';
  html+='<div class="stat-tile"><div class="stat-tile-val">'+st.w+'</div><div class="stat-tile-label">胜</div></div>';
  html+='<div class="stat-tile"><div class="stat-tile-val">'+st.d+'</div><div class="stat-tile-label">平</div></div>';
  html+='<div class="stat-tile"><div class="stat-tile-val">'+st.l+'</div><div class="stat-tile-label">负</div></div>';
  html+='<div class="stat-tile hot"><div class="stat-tile-val">'+coach.titles+'</div><div class="stat-tile-label">冠军</div></div>';
  html+='</div>';
  if(coach.honors.length){
    html+='<div class="panel" style="margin-top:12px"><div class="panel-head"><h4>执教荣誉</h4></div>';
    coach.honors.slice(-3).forEach(h=>{html+='<div class="lg-row"><span class="lg-team">'+escapeHtml(h)+'</span></div>'});
    html+='</div>';
  }
  html+='<button class="continue-btn" onclick="coachStartSeason()">开始'+coach.age+'岁赛季 →</button>';
  html+='<button class="btn-ghost" style="margin-top:10px" onclick="coachSummary()">执教总结</button>';
  html+='</div>';
  extra.innerHTML=html;
}
function coachStartSeason(){
  coach.age++;
  coach.lastEvent=Math.floor(Math.random()*COACH_EVENTS.length);
  const e=COACH_EVENTS[coach.lastEvent];
  let html='<div class="event-card"><div class="event-topline"><span class="event-category cat-training">执教 · '+coach.age+'岁 · 赛季前</span><span class="event-meta" style="margin-left:auto">'+COACH_LADDER[coach.teamIdx].name+' · 声望 '+coach.rep+'/100</span></div>';
  html+='<div class="event-narrative">'+e.text+'</div><div class="choices">';
  e.choices.forEach((c,i)=>{
    html+='<button class="choice-btn" onclick="coachChoose('+i+')"><span class="choice-index">'+(i+1)+'</span><span class="choice-body"><div>'+c.t+'</div></span></button>';
  });
  html+='</div></div>';
  document.getElementById('retire-extra').innerHTML=html;
}
function coachChoose(i){
  const e=COACH_EVENTS[coach.lastEvent];
  const c=e.choices[i];
  const d=c.rep[0]+Math.floor(Math.random()*(c.rep[1]-c.rep[0]+1));
  coach.rep=Math.max(0,Math.min(100,coach.rep+d));
  game.coach=coach;autoSave();
  let html='<div class="consequence-box"><div class="consequence-title">执教 · 决定</div><div class="consequence-text">'+c.out+'</div>';
  html+='<div class="effect-list"><span class="effect-tag '+(d>=0?'effect-pos':'effect-neg')+'">声望 '+(d>=0?'+':'')+d+'（当前 '+coach.rep+'）</span></div>';
  html+='<button class="continue-btn" onclick="coachTactics()">进入焦点战排兵布阵 →</button></div>';
  document.getElementById('retire-extra').innerHTML=html;
}
// ===== 焦点战：排兵布阵 =====
const COACH_FMT=[{k:'433',t:'4-3-3 强攻',d:'锋线三人组全力施压，进球多但身后空当也大'},{k:'4231',t:'4-2-3-1 均衡',d:'攻守平衡，控制中场节奏'},{k:'541',t:'5-4-1 铁桶',d:'全员退防，压缩空间打反击'}];
const COACH_STR=[{k:'press',t:'高位逼抢',d:'在前场就展开争夺，体能消耗巨大'},{k:'counter',t:'防守反击',d:'让出球权，抓住对手身后的空当'},{k:'possess',t:'控球消耗',d:'用传控掌握节奏，磨垮对手'}];
function coachTactics(){
  const lad=COACH_LADDER[coach.teamIdx];
  const isNT=lad.tier==='国家队';
  const opp=isNT?(coach.rep>=60?'亚洲区头号劲旅':'西亚劲旅'):(coach.teamIdx>=3?'争冠直接竞争对手':coach.teamIdx===2?'积分榜 nearest 对手':'青训联赛对手');
  coach.focus={opp:opp,label:isNT?'大赛出线生死战':(coach.teamIdx>=3?'争冠六分大战':'联赛德比大战')};
  let html='<div class="event-card"><div class="event-topline"><span class="event-category cat-match">焦点战 · '+coach.focus.label+'</span><span class="event-meta" style="margin-left:auto">'+coach.age+'岁 · 声望 '+coach.rep+'</span></div>';
  html+='<div class="event-narrative">对手：'+opp+'。这场比赛的结果将直接影响你的帅位。\\n\\n赛前最后一课——排出你的首发阵型与比赛策略：</div>';
  html+='<div class="coach-tactic-sec"><h4>阵型</h4><div class="tactic-chips">';
  COACH_FMT.forEach((f,i)=>{html+='<button class="tactic-chip'+(i===1?' on':'')+'" data-fmt="'+f.k+'" onclick="coachPick(this,\'fmt\')"><b>'+f.t+'</b><small>'+f.d+'</small></button>'});
  html+='</div></div><div class="coach-tactic-sec"><h4>比赛策略</h4><div class="tactic-chips">';
  COACH_STR.forEach((f,i)=>{html+='<button class="tactic-chip'+(i===1?' on':'')+'" data-str="'+f.k+'" onclick="coachPick(this,\'str\')"><b>'+f.t+'</b><small>'+f.d+'</small></button>'});
  html+='</div></div>';
  html+='<button class="continue-btn" onclick="coachConfirmTactics()">排兵完毕 · 出发球场 →</button></div>';
  document.getElementById('retire-extra').innerHTML=html;
}
function coachPick(el,kind){
  el.parentElement.querySelectorAll('.tactic-chip').forEach(c=>c.classList.remove('on'));
  el.classList.add('on');
}
function coachConfirmTactics(){
  const fmt=document.querySelector('.tactic-chip.on[data-fmt]');
  const str=document.querySelector('.tactic-chip.on[data-str]');
  coach.focus.fmt=fmt?fmt.dataset.fmt:'4231';
  coach.focus.str=str?str.dataset.str:'counter';
  game.coach=coach;autoSave();
  coachMatchLive();
}
// ===== 焦点战：临场决策与换人 =====
function coachMatchLive(){
  const repF=0.45+coach.rep/220;                 // 0.45~0.90
  const FMT={'433':[1.45,1.2],'4231':[1.05,1.0],'541':[0.7,0.8]};
  const STR={press:[1.18,1.15],counter:[0.9,0.82],possess:[1.0,0.95]};
  const oppF=0.62+coach.teamIdx*0.16+(coach.teamIdx===4?0.4:0);
  const f=FMT[coach.focus.fmt]||FMT['4231'];
  const st=STR[coach.focus.str]||STR['counter'];
  const expGf=Math.max(0.2,f[0]*st[0]*repF);
  const expGa=Math.max(0.2,f[1]*st[1]*oppF*0.92);
  const gf1=Math.random()<expGf*0.55?1+(Math.random()<expGf*0.2?1:0):0;
  const ga1=Math.random()<expGa*0.5?1:0;
  coach.live={expGf:expGf,expGa:expGa,gf1:gf1,ga1:ga1};
  let sit,head;
  if(gf1>ga1){sit='lead';head='半场 '+gf1+'-'+ga1+' 领先。更衣室通道里，助教问你接下来的安排——对手中场休息一定会变阵反扑。'}
  else if(gf1===ga1){sit='draw';head='半场 '+gf1+'-'+ga1+'。僵局之下，对手的教练席先动了——他们换上了一名生力军前锋。'}
  else{sit='trail';head='半场 '+gf1+'-'+ga1+' 落后。球迷还在为你鼓掌，但积分不等人。最后一个换人名额，就是你的筹码。'}
  const opts={
    lead:[{t:'对位换人 — 保持场上强度',d:0,out:'换人平稳完成，球队按既定节奏继续控制比赛。'},
          {t:'换上防守型中场 — 巩固优势',g:-0.35,ga:-0.5,out:'防守型中场锁死了中场走廊，对手的反扑一次次撞在墙上。'},
          {t:'换上前锋 — 扩大比分',g:0.5,ga:0.55,out:'你选择再进一步，攻防转换提速，比赛进入对攻战。'}],
    draw:[{t:'换上生力军 — 加强边路突击',g:0.45,ga:0.15,out:'新生力量撕开了对手疲态尽显的边路，机会开始向你这侧倾斜。'},
          {t:'维持现状 — 等待对手犯错',d:0,out:'你相信球员的阅读能力。胶着的比赛里，谁先犯错谁付出代价。'},
          {t:'收缩防线 — 先保证不丢球',ga:-0.45,g:-0.3,out:'防线回收，对手的攻势一次次无功而返，但你的球队也失去了进攻的锐度。'}],
    trail:[{t:'双前锋搏命 — 撤下一名后卫',g:0.6,ga:0.5,out:'最后一张牌打出，禁区里多了一个火力点，也多了一个隐患。'},
           {t:'针对性换人 — 换上替补奇兵',g:0.35,ga:0.1,out:'替补奇兵登场，对手的防守布置被打乱了。'},
           {t:'稳定军心 — 战术不动',d:0,out:'你选择相信场上十一人。落后，但阵型不乱——机会会来的。'}]
  }[sit];
  coach.live.sit=sit;
  let html='<div class="event-card"><div class="event-topline"><span class="event-category cat-match">焦点战 · 临场指挥</span><span class="event-meta" style="margin-left:auto">'+coach.focus.opp+'</span></div>';
  html+='<div class="event-narrative">'+head+'\\n\\n阵型 '+coach.focus.fmt+' · 策略 '+coach.focus.str+' · 你还有最后一个换人名额：</div>';
  html+='<div class="choices">';
  opts.forEach((o,i)=>{
    html+='<button class="choice-btn" onclick="coachLiveChoice('+i+')"><span class="choice-index">'+(i+1)+'</span><span class="choice-body"><div>'+o.t+'</div></span></button>';
  });
  html+='</div></div>';
  document.getElementById('retire-extra').innerHTML=html;
}
function coachLiveChoice(i){
  const sit=coach.live.sit;
  const table={
    lead:[{g:-0.35,ga:-0.5},{g:0.5,ga:0.55},{d:0}],
    draw:[{g:0.45,ga:0.15},{d:0},{ga:-0.45,g:-0.3}],
    trail:[{g:0.6,ga:0.5},{g:0.35,ga:0.1},{d:0}]
  };
  const m=table[sit][i];
  const gf60=coach.live.gf1,ga60=coach.live.ga1;
  let gf=gf60,ga=ga60;
  if(m.g)gf+=Math.random()<Math.min(0.85,(coach.live.expGf*0.5)*m.g)?1:0;
  if(m.ga)ga+=Math.random()<Math.min(0.8,(coach.live.expGa*0.4)*Math.abs(m.ga))?1:0;
  gf=Math.max(0,Math.min(5,gf));ga=Math.max(0,Math.min(5,ga));
  const win=gf>ga,draw=gf===ga;
  const decText=['对位换人','强化攻势','稳定局面','搏命变阵','针对性奇兵','收缩防守'][i]||'临场调整';
  coachMatchResult({gf:gf,ga:ga,win:win,draw:draw,dec:decText,sit:sit});
}
function coachMatchResult(res){
  const lad=COACH_LADDER[coach.teamIdx];
  coach.stats.w+=res.win?1:0;coach.stats.d+=res.draw?1:0;coach.stats.l+=res.win||res.draw?0:1;
  let dRep=res.win?3:res.draw?0:-3;
  if(res.win&&(res.sit==='trail'))dRep+=2;
  coach.rep=Math.max(0,Math.min(100,coach.rep+dRep));
  const sitText={lead:'你在领先后',draw:'僵局之中',trail:'落后的绝境里'}[res.sit];
  const resText=res.win?'终场哨响，'+res.gf+'-'+res.ga+'！'+sitText+'你的'+res.dec+'收到了回报，'+coach.focus.opp+'被斩落马下。':
                 res.draw?'终场 '+res.gf+'-'+res.ga+'。'+sitText+'你的'+res.dec+'让比赛守在了可控的轨道上。':
                 '终场 '+res.gf+'-'+res.ga+'。'+sitText+'你的'+res.dec+'没能改写比分——失败会算账的。';
  let html='<div class="consequence-box"><div class="consequence-title">焦点战 · 终场</div>';
  html+='<div class="consequence-text">'+coach.focus.label+' vs '+coach.focus.opp+'——'+resText+'</div>';
  html+='<div class="effect-list"><span class="effect-tag '+(res.win?'effect-pos':res.draw?'effect-pos':'effect-neg')+'">'+res.gf+' - '+res.ga+' · 声望 '+coach.rep+'/100</span></div>';
  html+='<button class="continue-btn" onclick="coachResult()">赛季结算 →</button></div>';
  document.getElementById('retire-extra').innerHTML=html;
}
function coachResult(){
  const lad=COACH_LADDER[coach.teamIdx];
  const st=coach.stats;
  const pts=st.w*3+st.d;
  let html='<div class="consequence-box"><div class="consequence-title">执教 · 赛季结算</div>';
  html+='<div class="consequence-text">'+coach.age+'岁赛季收官：焦点战与全季合计 <b style="color:var(--volt)">'+st.w+'胜 '+st.d+'平 '+st.l+'负</b>（'+pts+' 分）。</div>';
  if(lad.tier==='国家队'){
    const ok=coach.rep>=65&&Math.random()<0.65;
    coach.rep=Math.max(0,Math.min(100,coach.rep+(ok?6:-4)));
    html+='<div class="consequence-text">'+(ok?'国家队在世预赛关键战打出了血性，球迷重新为你欢呼，足协公开表达支持。':'热身赛与预选赛成绩不佳，舆论开始讨论换帅。你熬过了艰难的一年。')+'</div>';
  }else{
    const pos=Math.max(1,Math.min(16,17-Math.round(coach.rep/100*13+2+(Math.random()*4-2))));
    html+='<div class="consequence-text">'+lad.name+'名列中超第<b style="color:var(--volt)">'+pos+'</b>位。';
    if(coach.teamIdx>=2&&pos===1){
      coach.honors.push(coach.age+'岁：率队夺得中超冠军');
      coach.titles++;
      coach.rep=Math.min(100,coach.rep+8);
      html+='你率队夺得中超冠军！名帅之名不胫而走。';
    }else if(coach.teamIdx>=2&&pos<=3){
      coach.rep=Math.min(100,coach.rep+4);
      html+='赛季结束，你的名字出现在年度最佳教练的候选名单上。';
    }
    if(coach.rep>=78&&coach.teamIdx<4){
      coach.teamIdx++;
      coach.rep=Math.max(45,coach.rep-15);
      html+='赛季末，'+COACH_LADDER[coach.teamIdx].name+'向你发出邀约——你接受了'+COACH_LADDER[coach.teamIdx].pos+'的职位。';
    }else if(coach.rep<20&&coach.teamIdx>0){
      coach.teamIdx=Math.max(0,coach.teamIdx-1);
      coach.rep=35;
      html+='战绩不佳，你黯然离开帅位。沉寂半年后，你从'+COACH_LADDER[coach.teamIdx].name+'重新出发。';
    }
  }
  html+='</div>';
  html+='<div class="effect-list"><span class="effect-tag effect-pos">声望 '+coach.rep+'/100 · '+COACH_LADDER[coach.teamIdx].pos+'</span></div>';
  html+='<button class="continue-btn" onclick="coachDashboard()">返回教练指挥台 →</button></div>';
  document.getElementById('retire-extra').innerHTML=html;
  game.coach=coach;autoSave();
}
'''
s=s[:m.start()]+NEW_COACH+'\n'+s[m.end():]
ok.append('coach flow rewrite')

# ===== 2. coach-mode：隐藏退役卡片与决策头 =====
rep("""#retire-screen{display:none;padding:44px 20px;max-width:820px;margin:0 auto}
#retire-screen.active{display:block}""",
"""#retire-screen{display:none;padding:44px 20px;max-width:820px;margin:0 auto}
#retire-screen.active{display:block}
#retire-screen.coach-mode .screen-header,#retire-screen.coach-mode .retire-options{display:none}
#retire-screen.coach-mode{max-width:1080px}
.coach-hub{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-lg);padding:22px}
.coach-head{display:flex;align-items:center;gap:12px;margin-bottom:14px}
.coach-badge{background:var(--volt-soft);border:1px solid var(--volt);color:var(--volt);font-weight:800;font-size:.8rem;padding:6px 12px;border-radius:20px;white-space:nowrap}
.coach-id b{display:block;font-size:1.1rem}
.coach-id span{color:var(--text-dim);font-size:.8rem}
.rep-wrap{margin-bottom:6px}
.rep-bar{height:10px;background:var(--surface-3);border-radius:5px;overflow:hidden}
.rep-bar-fill{height:100%;background:linear-gradient(90deg,var(--volt),var(--volt-strong));border-radius:5px;transition:width .5s ease}
.rep-cap{font-size:.78rem;color:var(--text-dim);margin-top:5px}
.rep-cap b{color:var(--volt)}
.coach-tactic-sec{margin:14px 0}
.coach-tactic-sec h4{color:var(--text-dim);font-size:.78rem;letter-spacing:.1em;margin-bottom:8px}
.tactic-chips{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.tactic-chip{background:var(--surface-2);border:1px solid var(--border);border-radius:12px;padding:10px;color:var(--text);cursor:pointer;text-align:left;transition:all .18s}
.tactic-chip b{display:block;font-size:.84rem;font-weight:800}
.tactic-chip small{display:block;color:var(--text-dim);font-size:.68rem;margin-top:3px;line-height:1.4}
.tactic-chip.on{background:var(--volt-soft);border-color:var(--volt);color:var(--volt)}
.tactic-chip.on small{color:var(--text-2)}
@media(pointer:coarse){.tactic-chip:active{transform:scale(.97)}}
@media (orientation:landscape) and (max-height:540px) and (max-width:1024px){
  .tactic-chips{grid-template-columns:repeat(3,1fr);gap:6px}
  .tactic-chip{padding:8px}
  .coach-hub{padding:16px}
}""",'coach css')

# ===== 3. 退出/新档时移除 coach-mode =====
rep("""function exitToMainMenu(){
  resetSessionState();""",
"""function exitToMainMenu(){
  const rs=document.getElementById('retire-screen');
  if(rs)rs.classList.remove('coach-mode');
  resetSessionState();""",'exit class')

# ===== 4. 文案修正 =====
rep("""{t:'放人 — 成全社会',rep:[-2,3],out:'你放走了他，舆论称赞你的胸怀，球队却实实在在少了顶梁柱。'}""",
"""{t:'放人 — 成全他的梦想',rep:[-2,3],out:'你放走了他，舆论称赞你的胸怀，球队却实实在在少了顶梁柱。'}""",'成全社会 typo')

# ===== 5. t7 定位球教练：加 GK 门槛 + 新增门将定位球事件 =====
rep("{ id:'t7',cat:'training',minAge:20,","{ id:'t7',cat:'training',noGK:true,minAge:20,","t7 noGK")
rep("""// --- 门将专属 ---""",
"""{ id:'tgk1',cat:'training',gkOnly:true,minAge:16,
  narrative:p=>`俱乐部引进了一位来自意大利的定位球防守教练。他的训练方法与众不同——不练扑救，而是练"站位、指挥与人墙博弈"。

"现代足球的定位球防守，不仅仅是反应，"他说道，"而是通过预判和指挥，让对手的战术还没开始就失败。"

他把战术板推到你面前，三种防守体系任选其一深入打磨：`,
  choices:[
    {text:'区域联防体系 — 每个人守自己的区',effects:{'GK.gkPositioning':2,'GK.handling':1,'PAS.vision':1},consequence:'你把禁区划成六个区域，用声音把每个队友钉在位置上。赛季进行到一半，你们的定位球失球联赛最少。',formChange:2},
    {text:'人墙博弈 — 研究每一名主罚者',effects:{'GK.reflexes':2,'DRI.composure':2,'PAS.vision':1},consequence:'你建立了全联赛主罚手的行为档案：习惯角度、助跑节奏、眼神破绽。下次面对点球，你比他自己还了解他。',formChange:2},
    {text:'出击体系 — 把禁区变成你的领地',effects:{'GK.gkPositioning':1,'DRI.composure':2,'PHY.strength':1},consequence:'你开始像清道夫一样统治禁区，每次传中都提前预判落点将球没收。对手的定位球教练对你的数据摇头叹息。',formChange:1}
  ]},
// --- 门将专属 ---""",'tgk1 event')

open(p,'w',encoding='utf-8',newline='').write(s)
print('APPLIED:',len(ok))
[print(' OK',x) for x in ok]
