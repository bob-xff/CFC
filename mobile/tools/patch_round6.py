#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""V2.2.4 修复批次：GK 事件补全 + 剧情漏标 + 转会叙事去重 + 菜单/双列扩展"""
import re
p='football-career-simulator.html'
s=open(p,encoding='utf-8').read()
ok=[]
def rep(old,new,label,count=1):
    global s
    c=s.count(old)
    assert c==count, "FAIL %s: found %d, expected %d"%(label,c,count)
    s=s.replace(old,new); ok.append(label)

NL=chr(92)+'n'  # JS 源码里的字面 \n 转义

# ===== 1. GK 杯赛/洲际专属事件 =====
gk89 = """{ id:'gk8',cat:'cup',gkOnly:true,minAge:17,
  narrative:p=>{const cup=LEAGUES[p.league]?LEAGUES[p.league].cup:'杯赛';return `${cup}淘汰赛，点球大战。前八轮双方门将各扑出两粒——你已经创造了个人生涯扑点纪录。%(NL)s%(NL)s第九轮，对方中场主罚。你扑向了他的习惯方向吗？球探报告上他的记录是三罚全中。%(NL)s%(NL)s全场安静得能听见你的呼吸：`},
  choices:[
    {text:'再赌一次 — 相信自己的判断',effects:{'GK.reflexes':3,'GK.handling':2,'DRI.composure':3},consequence:'他射向右下角，你像被磁铁吸过去一样把球扑出！第十轮队友一锤定音，全队从角旗区冲向你——点球大战的英雄，就是你。',formChange:3,risk:{attr:'GK.reflexes',base:.5},fail:{effects:{'GK.reflexes':1},consequence:'他射向了另一侧。皮球入网，下一轮对手罚进，你们出局了。队友们安慰你：扑出两个点球已经足够骄傲。但你记得的，只有那一颗皮球入网的声音。',formChange:-1}},
    {text:'观察助跑节奏 — 用细节读他',effects:{'GK.gkPositioning':2,'DRI.composure':3,'PAS.vision':1},consequence:'你注意到他助跑最后一步总是放慢——那是改方向的信号。他果然推射反方向，你早有准备侧身将球按在身下！细节，是门将最好的武器。',formChange:2},
    {text:'干扰战术 — 捡球拖延磨他心态',effects:{'DRI.composure':2,'PHY.aggression':2,'GK.handling':1},consequence:'你慢悠悠把球摆正、又擦了擦手套，主裁两次催促。他明显被搅乱了节奏，射门绵软无力，你轻松扑出！队友一锤定音——心理战的大师。',formChange:2}
  ]},
{ id:'gk9',cat:'continental',gkOnly:true,minAge:19,
  narrative:p=>{const cont=LEAGUES[p.league]?LEAGUES[p.league].continental:'洲际赛事';return `${cont}客场，你的球队必须净胜两球才能晋级。全场你的队友都在压上，身后只剩你一人——对方前锋的速度是全联赛最快的。%(NL)s%(NL)s第88分钟，比分2-0。对方断球打出极速反击，一记直塞穿透了你所有的队友。这将是决定晋级的最后一扑：`},
  choices:[
    {text:'弃门出击 — 在禁区外解决战斗',effects:{'GK.reflexes':2,'GK.diving':1,'DRI.composure':3,'PAS.vision':1},consequence:'你读懂了直塞的线路，在他接球前的一瞬冲出禁区，抢先用身体把球挡出边线！解说员疯了一样喊你的名字——这一扑，价值一个晋级名额！',formChange:3,risk:{attr:'DRI.composure',base:.55},fail:{effects:{'DRI.composure':1},consequence:'你出击慢了半步，他把球一趟从你身边掠过，推射空门。2-1，总比分晋级没被翻盘，但你的冒进差点毁掉一切。赛后你反复回看了二十遍。',formChange:-1}},
    {text:'沉着回撤 — 守住近角等他犯错',effects:{'GK.positioning':3,'DRI.composure':2,'GK.handling':1},consequence:'你不慌不忙地回撤封堵近角。他仓促间起脚，皮球正中你的怀里！终场哨响，晋级达成——你抱紧皮球跪在地上，队友们从半场跑过来压在你身上。',formChange:2},
    {text:'大声指挥 — 让回追队友关门',effects:{'PAS.vision':2,'GK.gkPositioning':2,'DRI.composure':1},consequence:'你声嘶力竭地喊着中卫的名字和落位方向，回追的队友心领神会，在禁区内完成了一次教科书级的关门合围！危机解除，你的指挥功不可没。',formChange:1}
  ]},
// --- 社交 ---""" % {'NL':NL}
rep("// --- 社交 ---",gk89,'gk8 gk9 events')

# ===== 2. 章节/日历剧情补 noGK =====
n=0
for eid in ['ch1_youth_derby','ch3_starter_run','ch3_cup_run','ch3_nt_debut','ch6_acl_run','ch6_acl_title','ch7_ucl_final','cal_wc_2034','cal_wc_2034_final']:
    pat=re.compile(r"\{ id:'%s',once:true," % eid)
    m=pat.search(s)
    if m and s.count(m.group(0))==1:
        s=s.replace(m.group(0), m.group(0).replace('once:true,','once:true,noGK:true,')); n+=1
    else:
        print('SKIP',eid)
ok.append('story noGK x%d'%n)

# ===== 3. m5/c11/s12/t1 noGK =====
n2=0
for eid,cat in [('m5','match'),('c11','media'),('s12','social'),('t1','training')]:
    old="{ id:'%s',cat:'%s',minAge:" % (eid,cat)
    if s.count(old)==1:
        s=s.replace(old,"{ id:'%s',cat:'%s',noGK:true,minAge:" % (eid,cat)); n2+=1
    else:
        print('SKIP3',eid)
ok.append('m5/c11/s12/t1 noGK x%d'%n2)

# ===== 4. processChoice GK 进球安全网 =====
rep("""  }else{
    game.season.lastRiskFail=false;
  }
  const changes=applyEffects(outcome.effects);""",
"""  }else{
    game.season.lastRiskFail=false;
  }
  // 位置安全网：门将不累计任何进球数据（剧情文案若越界，数据不污染）
  if(game.player.isGK&&outcome.goals)outcome={...outcome,goals:0};
  if(game.player.isGK&&outcome.intlGoals)outcome={...outcome,intlGoals:0};
  const changes=applyEffects(outcome.effects);""",'GK goals safety net')

# ===== 5. gk7 修正 =====
rep("""    {text:'指挥防线 — 用组织化解攻势',effects:{'GK.gkPositioning':2,'DRI.composure':2,'PAS.vision':2},consequence:'你不断呼喊队友站位，三次攻势两次被造越瓦解，唯一一次射门也被你轻松没收。半场结束，转播镜头给到字幕："国足防线的指挥官。"零封，就是门将的首秀满分答卷。',formChange:2},""",
"""    {text:'指挥防线 — 用组织化解攻势',effects:{'GK.gkPositioning':2,'DRI.composure':2,'PAS.vision':2},consequence:'你不断呼喊队友落位，三次攻势两次被防线提前合围化解，剩下那记远射也被你稳稳没收。半场结束，转播镜头打出字幕："国足防线的指挥官。"零封，就是门将的首秀满分答卷。',formChange:2,caps:1,flag:'gk_nt_debut'},""",'gk7 c2')
rep("""五分钟三次扑救，解说员的声音都在颤抖："这位门将今天拒绝了比赛剧本！"',formChange:3,risk:""",
"""五分钟三次扑救，解说员的声音都在颤抖："这位门将今天拒绝了比赛剧本！"',formChange:3,caps:1,flag:'gk_nt_debut',risk:""",'gk7 c1')
rep("""赛后评分不算耀眼，但教练拍了拍你："首秀，稳字当头，很好。"',formChange:1}""",
"""赛后评分不算耀眼，但教练拍了拍你："首秀，稳字当头，很好。"',formChange:1,caps:1,flag:'gk_nt_debut'}""",'gk7 c3')
rep("""{ id:'ch3_nt_debut',once:true,noGK:true,chapter:3,priority:2,minAge:18,condition:p=>p.flags.nationalMember&&p.internationalCaps<6,""",
"""{ id:'ch3_nt_debut',once:true,noGK:true,chapter:3,priority:2,minAge:18,condition:p=>p.flags.nationalMember&&p.internationalCaps<6&&!p.flags.gk_nt_debut,""",'ch3_nt_debut gate')

# ===== 6. 文案修正 =====
rep("""对方高中锋在你面前两米处甩头攻门，皮球直奔球门上角。这是门线技术的终极考验。""",
    """对方高中锋在你面前两米处甩头攻门，皮球带着强烈的弧线直奔球门。这是门线技术的终极考验。""",'gk3 narrative')
rep("""    {text:'抱住球 — 犯规也绝不冒险',effects:{'DRI.composure':2,'GK.handling':1},consequence:'你干脆将球抱入怀中，任凭对方前锋在你面前跳脚。对方获得了一个位置极差的前场任意球，你亲自排人墙指挥——最终有惊无险。稳，有时就是最好的选择。',formChange:0}""",
"""    {text:'大脚解围 — 先破坏再重组',effects:{'GK.kicking':1,'DRI.composure':2,'PHY.strength':1},consequence:'你抢在他伸脚之前把球大脚解围出边线，化解了这次险情。虽然球权交还给了对方，但防线借机落位。稳，有时就是最好的选择。',formChange:0}""",'gk4 c3 rule')
rep("""你是本赛季联赛零封榜的第一名，媒体开始称你为"防线的指挥官"。""",
    """你的名字高居联赛零封榜前列，媒体开始称你为"防线的指挥官"。""",'gk5 wording')
rep("""首发出售制""","""首发竞聘制""",'g6 typo')

# ===== 7. 转会报价双列 + 叙事去重 =====
dedup_old = """    html+='有 '+offers.length+' 家俱乐部向你发出邀请：%(N)s%(N)s';
    offers.forEach(o=>{
      html+='▸ '+o.team+'（'+o.leagueName+'）%(N)s';
      html+='  '+(o.fee>0?'转会费：'+formatValue(o.fee)+' | ':'自由转会 | ')+'年薪：'+formatSalary(o.salary)+' | 合同：'+o.years+'年%(N)s';
      const st=TEAM_STARS[o.team];
      if(st&&st.length)html+='  队内核心：'+st.slice(0,2).join('、')+'%(N)s';
    });""" % {'N':NL}
dedup_new = """    html+='有 '+offers.length+' 家俱乐部向你发出邀请——具体条件见下方报价：%(N)s%(N)s';""" % {'N':NL}
rep(dedup_old,dedup_new,'transfer narrative dedup')
rep("""  html+='</div>';
  html+='<div class="choices">';
  offers.forEach((o,i)=>{
    html+='<button class="choice-btn" onclick="acceptTransfer('+i+')">';""",
"""  html+='</div>';
  html+='<div class="choices'+(offers.length<=4?' choices-2col':'')+'">';
  offers.forEach((o,i)=>{
    html+='<button class="choice-btn" onclick="acceptTransfer('+i+')">';""",'offer 2col')

# ===== 8. 教练选择双列 + CSS 扩展 =====
rep("""  html+='<div class="event-narrative">'+e.text+'</div><div class="choices">';""",
"""  html+='<div class="event-narrative">'+e.text+'</div><div class="choices choices-2col">';""",'coach 2col js')
rep("""#view-story .choices.choices-2col{display:grid;grid-template-columns:1fr 1fr;gap:8px}""",
"""#view-story .choices.choices-2col,#retire-extra .choices.choices-2col{display:grid;grid-template-columns:1fr 1fr;gap:8px}""",'coach css base')
rep("""  #view-story .choices.choices-2col{gap:6px}
  #view-story .choices.choices-2col .choice-btn{padding:8px;font-size:.74rem;gap:7px;line-height:1.4}
  #view-story .choices.choices-2col .choice-index{width:20px;height:20px;font-size:.64rem}""",
"""  .choices.choices-2col{gap:6px}
  .choices.choices-2col .choice-btn{padding:8px;font-size:.74rem;gap:7px;line-height:1.4}
  .choices.choices-2col .choice-index{width:20px;height:20px;font-size:.64rem}""",'coach css landscape')

open(p,'w',encoding='utf-8',newline='').write(s)
print('APPLIED:',len(ok))
[print(' OK',x) for x in ok]
