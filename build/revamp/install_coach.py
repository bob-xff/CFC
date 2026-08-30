# -*- coding: utf-8 -*-
"""将静态教练页替换为互动执教生涯模式。"""
import io, os, sys

p = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'js5.js')
s = io.open(p, encoding='utf-8').read()
start = s.index('function showCoachMode(){')
end = s.index('function setRetireBack(label,fn){')

new_block = '''// ============ 教练生涯（退役后剧情模式：梯队 → 助教 → 中超 → 豪门 → 国家队） ============
let coach=null;
const COACH_LADDER=[
  {name:'俱乐部青训梯队',tier:'青训',pos:'U17梯队主教练'},
  {name:'中超俱乐部',tier:'中超',pos:'助理教练'},
  {name:'中超中游球队',tier:'中超',pos:'主教练'},
  {name:'中超争冠球队',tier:'中超',pos:'主教练'},
  {name:'中国国家男子足球队',tier:'国家队',pos:'国家队主教练'}
];
const COACH_EVENTS=[
  {text:'球队遭遇三连败，媒体开始质疑你的战术部署。发布会上记者直接发问："要不要变阵？"',
   choices:[
     {t:'坚持自己的体系，用训练说话',rep:[-2,4],out:'你顶住压力没有变阵。两周后球队逐渐找回状态，你的坚持得到了回报。'},
     {t:'主动变阵，求新求变',rep:[1,3],out:'变阵立竿见影，球队止住颓势，媒体改口称你"懂得变通"。'},
     {t:'公开承担责任，为球员减压',rep:[0,3],out:'发布会上你把责任揽到自己身上。更衣室看在眼里，球员们拼得更凶了。'}]},
  {text:'更衣室爆发矛盾：两名主力因训练冲突几乎动手，全队气氛降到冰点。',
   choices:[
     {t:'分别谈话，各打五十大板',rep:[0,2],out:'你当和事佬压下了事态，两人勉强握手言和。'},
     {t:'立规矩：违反纪律者坐替补席',rep:[1,4],out:'你果断把挑事者按在替补席三场。全队纪律焕然一新，但更衣室暗流涌动。'},
     {t:'让队长出面调解',rep:[-1,2],out:'你把难题交给队长。老队员压得住场面，但有人觉得你在逃避。'}]},
  {text:'转会窗最后一天，董事会突然给你一笔意外预算，但要求"本赛季必须进前四"。',
   choices:[
     {t:'签下即战力的老将',rep:[1,3],out:'老将即插即用，球队成绩立竿见影，董事会很满意。'},
     {t:'投资21岁以下的天才新星',rep:[-1,4],out:'新星还需要时间，短期成绩波动。但球探报告说，他们前途无量。'},
     {t:'一分不花，信任现有阵容',rep:[0,3],out:'你选择了信任。更衣室士气大涨，董事会半信半疑地看着你。'}]},
  {text:'德比大战前夜，核心球员找到你：他想去更大的舞台，希望你放人。',
   choices:[
     {t:'强留 — 德比之后再说',rep:[0,2],out:'他留下来了，德比战拼尽全力。但赛季结束的更衣室里，你们还需要一次长谈。'},
     {t:'放人 — 成全社会',rep:[-2,3],out:'你放走了他，舆论称赞你的胸怀，球队却实实在在少了顶梁柱。'},
     {t:'加薪续约 — 用诚意留人',rep:[1,3],out:'加薪续约成功。他在德比战中梅开二度，进球后冲到场边拥抱了你。'}]},
  {text:'足协邀请你参加精英教练研修班，为期一个月，会错过部分联赛备战。',
   choices:[
     {t:'参加 — 学习先进理念',rep:[2,3],out:'研修班让你接触到欧洲最新的训练体系，回队后训练质量明显提升。'},
     {t:'婉拒 — 赛季要紧',rep:[0,1],out:'你选择与球队共渡难关。教练组私下佩服你的担当。'}]},
  {text:'赛季关键战，对手核心赛前停赛缺席，媒体一片看好你们。',
   choices:[
     {t:'提醒球员切勿轻敌',rep:[1,3],out:'你反复给球员播放对手替补的录像。全队收起轻慢，稳稳拿下比赛。'},
     {t:'顺势轮换，锻炼替补',rep:[-1,3],out:'你大胆轮换，比赛惊险取胜。过程让董事会捏了一把汗，替补们却记住了你的信任。'}]}
];
function showCoachMode(){
  const p=game.player;
  // 执教起点由球员生涯声望（总评+荣誉）决定
  let idx=0,rep=40;
  if(p.ovr>=84||p.honors.length>=6){idx=3;rep=55}
  else if(p.ovr>=76||p.honors.length>=3){idx=2;rep=50}
  else if(p.ovr>=68||p.honors.length>=1){idx=1;rep=45}
  coach={age:p.age+1,teamIdx:idx,rep:rep,honors:[],lastEvent:-1,playerName:p.name};
  const lad=COACH_LADDER[coach.teamIdx];
  const extra=document.getElementById('retire-extra');
  let html='<div class="career-summary">';
  html+='<h2 style="color:var(--volt);text-align:center;margin-bottom:14px">执教生涯开始</h2>';
  html+='<p style="text-align:center;color:var(--text-2);line-height:1.9">'+coach.playerName+'挂靴后拿起了教鞭——'+coach.age+'岁出任<b style="color:var(--text)">'+lad.pos+'</b>，执教'+lad.name+'。<br>执教声望 '+coach.rep+'/100，声望决定你的仕途：带队夺冠、升迁国家队，或黯然下课。</p>';
  html+='<button class="continue-btn" onclick="coachNextSeason()">开始'+coach.age+'岁赛季 →</button>';
  html+='<button class="btn-ghost" style="margin-top:12px" onclick="coachSummary()">直接查看执教总结</button>';
  html+='</div>';
  extra.innerHTML=html;
  setRetireBack('← 返回主菜单',exitToMainMenu);
}
function coachNextSeason(){
  coach.age++;
  coach.lastEvent=Math.floor(Math.random()*COACH_EVENTS.length);
  const e=COACH_EVENTS[coach.lastEvent];
  let html='<div class="event-card"><div class="event-topline"><span class="event-category cat-training">执教 · '+coach.age+'岁</span><span class="event-meta" style="margin-left:auto">'+COACH_LADDER[coach.teamIdx].name+' · 声望 '+coach.rep+'/100</span></div>';
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
  let html='<div class="consequence-box"><div class="consequence-title">执教 · 决定</div><div class="consequence-text">'+c.out+'</div>';
  html+='<div class="effect-list"><span class="effect-tag '+(d>=0?'effect-pos':'effect-neg')+'">声望 '+(d>=0?'+':'')+d+'（当前 '+coach.rep+'）</span></div>';
  html+='<button class="continue-btn" onclick="coachResult()">赛季结算 →</button></div>';
  document.getElementById('retire-extra').innerHTML=html;
}
function coachResult(){
  const lad=COACH_LADDER[coach.teamIdx];
  let html='<div class="consequence-box"><div class="consequence-title">执教 · 赛季结算</div>';
  if(lad.tier==='国家队'){
    const ok=coach.rep>=65&&Math.random()<0.65;
    coach.rep=Math.max(0,Math.min(100,coach.rep+(ok?6:-4)));
    html+='<div class="consequence-text">'+(ok?'国家队在世预赛关键战打出了血性，球迷重新为你欢呼，足协公开表达支持。':'热身赛与预选赛成绩不佳，舆论开始讨论换帅。你熬过了艰难的一年。')+'</div>';
  }else{
    const pos=Math.max(1,Math.min(16,17-Math.round(coach.rep/100*13+2+(Math.random()*4-2))));
    html+='<div class="consequence-text">'+coach.age+'岁赛季：'+lad.name+'名列中超第<b style="color:var(--volt)">'+pos+'</b>位。';
    if(coach.teamIdx>=2&&pos===1){
      coach.honors.push(coach.age+'岁：率队夺得中超冠军');
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
    html+='</div>';
  }
  html+='<div class="effect-list"><span class="effect-tag effect-pos">声望 '+coach.rep+'/100 · '+COACH_LADDER[coach.teamIdx].pos+'</span></div>';
  html+='<button class="continue-btn" onclick="coachNextSeason()">继续执教 →</button>';
  html+='<button class="btn-ghost" style="margin-top:12px" onclick="coachSummary()">结束执教生涯，查看总结</button></div>';
  document.getElementById('retire-extra').innerHTML=html;
}
function coachSummary(){
  const lad=COACH_LADDER[coach.teamIdx];
  let html='<div class="career-summary">';
  html+='<h2 style="color:var(--volt);text-align:center;margin-bottom:14px">执教生涯回顾</h2>';
  html+='<div class="season-vs"><div class="vs-club">'+crestHTML('league','CSL','crest-lg')+'<span>'+lad.pos+'</span><small>'+coach.playerName+' · 执教生涯</small></div></div>';
  html+='<div class="career-stat-grid">';
  html+='<div class="career-stat-box"><div class="val">'+coach.age+'</div><div class="lbl">年龄</div></div>';
  html+='<div class="career-stat-box"><div class="val">'+coach.rep+'</div><div class="lbl">最终声望</div></div>';
  html+='<div class="career-stat-box"><div class="val">'+coach.honors.length+'</div><div class="lbl">执教荣誉</div></div>';
  html+='<div class="career-stat-box"><div class="val" style="font-size:1rem">'+lad.name+'</div><div class="lbl">终点站位</div></div>';
  html+='</div>';
  if(coach.honors.length){
    html+='<div style="margin-top:14px">'+coach.honors.map(h=>'<div class="trophy-item"><span class="t-ico"><span class="svg-icon">'+ICONS.trophy+'</span></span><span class="t-name">'+escapeHtml(h)+'</span></div>').join('')+'</div>';
  }
  html+='<p style="text-align:center;color:var(--text-dim);margin-top:14px;line-height:1.9">从球员到教练，你把职业生涯的后半程献给了战术板。<br>绿茵场的故事，由你亲手传给下一代。</p>';
  html+='<button class="create-btn" style="margin-top:16px" onclick="location.reload()">重新开始</button>';
  html+='</div>';
  document.getElementById('retire-extra').innerHTML=html;
  setRetireBack('← 返回主菜单',exitToMainMenu);
}
'''
s = s[:start] + new_block + s[end:]
io.open(p, 'w', encoding='utf-8', newline='\n').write(s)
print('coach mode installed, js5 size:', len(s))
