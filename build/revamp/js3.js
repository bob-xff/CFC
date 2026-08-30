// ============ SEASON SIMULATION（按位置/联赛/年龄真实化） ============
function generateSeasonProfile(){
  const p=game.player;
  const attrs=p.attributes||{};
  const A=(cat,attr)=>(attrs[cat]&&attrs[cat][attr])||50;
  // 出场次数由梯队决定
  const stageApps={u17:[10,18],u19:[14,22],u21:[16,26],first_team:[18,30],starter:[26,33],core:[30,38],legend:[24,34]}[p.careerStage]||[20,30];
  let matches=Math.round(stageApps[0]+Math.random()*(stageApps[1]-stageApps[0]));
  if(p.flags.onLoan)matches+=4+Math.floor(Math.random()*5);
  const tier=LEAGUES[p.league]?LEAGUES[p.league].tier:3;
  const lgFactor=leagueMeta(p).factor||0.9;
  // 年龄成熟度：青年比赛攻防开放，成年后按经验回落
  const ageF=p.age<=17?0.82:p.age<=19?0.9:p.age<=22?0.95:p.age<=29?1.0:p.age<=32?0.92:p.age<=35?0.8:0.68;
  const formF=1+(p.form-5)*0.05;
  const moraleF=1+(p.morale-5)*0.04;
  // 角色权重：轮换出场时间少、核心无限开火权
  const roleF={u17:1,u19:1,u21:1,first_team:0.72,starter:1.0,core:1.0,legend:0.9}[p.careerStage]||1;
  // 综合质量（能力+联赛水平）
  const qual=Math.max(0.3,Math.min(1.6,lgFactor*ageF*formF*moraleF*(0.8+(p.ovr-50)/70)));
  const youthBoost=isYouthStage(p)?1.3:1;
  const pos=p.isGK?'GK':p.position;
  const off=(A('SHO','finishing')+A('SHO','positioning')+A('PAC','acceleration'))/150;
  const cre=(A('PAS','vision')+A('PAS','shortPassing')+A('DRI','ballControl'))/150;
  const def=(A('DEF','defensiveAwareness')+A('DEF','interceptions'))/100;
  const gk=(A('GK','reflexes')+A('GK','handling')+A('GK','gkPositioning'))/150;
  const sim={
    matches,goals:0,assists:0,shots:0,keyPasses:0,tackles:0,interceptions:0,
    cleanSheets:0,saves:0,conceded:0,yellows:0,reds:0,motm:0,rating:0
  };
  if(p.isGK){
    sim.cleanSheets=Math.round(matches*(0.18+0.35*gk)*qual);
    sim.saves=Math.round(matches*(1.6+1.8*gk)*qual);
    sim.conceded=Math.round(matches*(1.6-0.8*gk)*qual);
  }else{
    const posRates={
      ST:{g:0.52,a:0.16,s:2.8,kp:0.7,t:0.2,i:0.2},
      LW:{g:0.33,a:0.28,s:2.3,kp:1.5,t:0.4,i:0.3},
      RW:{g:0.33,a:0.28,s:2.3,kp:1.5,t:0.4,i:0.3},
      CAM:{g:0.21,a:0.36,s:1.7,kp:2.3,t:0.5,i:0.4},
      CM:{g:0.11,a:0.26,s:1.1,kp:2.0,t:1.5,i:1.1},
      CDM:{g:0.05,a:0.12,s:0.7,kp:1.2,t:2.7,i:2.1},
      LB:{g:0.045,a:0.2,s:0.6,kp:1.4,t:2.2,i:1.7},
      RB:{g:0.045,a:0.2,s:0.6,kp:1.4,t:2.2,i:1.7},
      CB:{g:0.05,a:0.03,s:0.4,kp:0.4,t:2.5,i:2.2}
    }[pos]||{g:0.12,a:0.15,s:1,kp:1.2,t:1,i:1};
    // 进球率：位置基准 × 联赛水平 × 能力 × 年龄成熟 × 角色 × 比赛环境
    // 校准基准：中超顶级射手 0.65-0.75 球/场（联赛纪录 34球/30场），青训比赛攻防开放
    const gpm=posRates.g*lgFactor*(0.45+0.65*off)*ageF*roleF*youthBoost;
    const apm=posRates.a*lgFactor*(0.45+0.65*cre)*ageF*roleF*youthBoost;
    sim.goals=Math.round(gpm*matches);
    sim.assists=Math.round(apm*matches);
    sim.shots=Math.round(posRates.s*matches*qual*(0.5+off));
    sim.keyPasses=Math.round(posRates.kp*matches*qual*(0.5+cre));
    sim.tackles=Math.round(posRates.t*matches*qual*(0.5+def));
    sim.interceptions=Math.round(posRates.i*matches*qual*(0.5+def));
  }
  sim.yellows=Math.round(matches*(0.05+Math.max(0,(A('PHY','aggression')-50))/160));
  sim.reds=Math.random()<0.12?1:0;
  let baseRating=p.isGK?6.4+0.8*gk:6.3+0.7*Math.max(0,(p.ovr-50)/50);
  const perf=p.isGK?(sim.cleanSheets/(matches*0.25)):Math.min(1,sim.goals/(matches*0.6))*0.8+Math.min(1,sim.assists/(matches*0.4))*0.4;
  sim.rating=Math.max(5.8,Math.min(8.8,baseRating+perf+(Math.random()*0.35-0.17)));
  sim.rating=Math.round(sim.rating*100)/100;
  sim.motm=Math.round(Math.max(0,(sim.rating-6.5))*matches*0.15);
  return sim;
}
function seasonProgress(){
  const s=game.season;
  const n=s.events.length-1;
  if(n<=0)return 1;
  return Math.max(0,Math.min(1,(s.currentEventIndex+1)/n));
}
function seasonSnapshot(){
  const s=game.season;
  if(!s.profile)s.profile=generateSeasonProfile();
  const pr=s.profile;
  const prg=seasonProgress();
  return{
    apps:Math.round(pr.matches*prg),
    goals:Math.round(pr.goals*prg)+(s.seasonGoals||0),
    assists:Math.round(pr.assists*prg)+(s.seasonAssists||0),
    rating:pr.rating,
    motm:Math.round(pr.motm*prg),
    cleanSheets:Math.round(pr.cleanSheets*prg),
    conceded:Math.round(pr.conceded*prg),
    saves:Math.round(pr.saves*prg),
    shots:Math.round(pr.shots*prg),
    keyPasses:Math.round(pr.keyPasses*prg),
    tackles:Math.round(pr.tackles*prg),
    interceptions:Math.round(pr.interceptions*prg),
    yellows:Math.round(pr.yellows*prg),
    reds:pr.reds
  };
}
// ============ 章节制剧情引擎 ============
const CHAPTERS=[
  {id:1,name:'青训星火',desc:'16岁，你走进了U17梯队。这里是千军万马的独木桥，也是所有巨星梦开始的地方。'},
  {id:2,name:'破土而出',desc:'U19、U21的对抗升级了，租借、跳级、一线队大名单——职业世界的大门正在打开。'},
  {id:3,name:'立足中超',desc:'一线队的替补席到主力位置，杯赛、亚冠与国家队的召唤接踵而至。'},
  {id:4,name:'留洋风云',desc:'跨越八千公里，语言、饮食、战术、孤寂——在欧洲站稳脚跟是另一场修行。'},
  {id:5,name:'国家使命',desc:'2027亚洲杯、2028奥运会、2030世界杯周期——整个中国在等你扛旗。'},
  {id:6,name:'亚洲之巅',desc:'亚洲足球先生、亚冠冠军、打破武磊的中超纪录——你已是这片大陆的顶级存在。'},
  {id:7,name:'世界之巅',desc:'金球奖名单首次出现中国人的名字。这条从中国青训走出的路，正在改写历史。'}
];
function storyCtx(){
  const p=game.player;
  return{
    year:seasonYear(p),
    chapter:CHAPTERS[game.story.chapter-1]||CHAPTERS[0],
    coach:coachLine(p.team),
    city:clubCity(p.team),
    lang:LEAGUE_LANG[p.league]?LEAGUE_LANG[p.league].lang:'普通话',
    ntCoach:NT_COACH
  };
}
function chapterForState(p){
  if(p.ovr>=86&&isEuropeLeague(p))return 7;
  if(p.ovr>=80||(p.flags.asian_poy))return 6;
  if(p.flags.nationalMember)return 5;
  if(isEuropeLeague(p))return 4;
  if(p.careerStage==='first_team'||p.careerStage==='starter'||p.careerStage==='core'||p.careerStage==='legend')return 3;
  if(p.careerStage==='u19'||p.careerStage==='u21')return 2;
  return 1;
}
function isStoryUsed(id){return game.story.usedStoryIds.includes(id)}
function markStoryUsed(id){if(!isStoryUsed(id))game.story.usedStoryIds.push(id)}
function pendingStoryEvents(){
  const p=game.player;
  const ctx=storyCtx();
  const out=[];
  for(const ev of STORY_EVENTS){
    if(isStoryUsed(ev.id))continue;
    // 日历事件（cal_*，亚洲杯/奥运/世预赛/世界杯）只由 pickCalendarEvents 按真实年份触发，
    // 禁止混入章节剧情池，否则会出现"2030年踢2034世预赛"的年份错乱
    if(ev.id.indexOf('cal_')===0)continue;
    // 章节事件：当前章之前的章节事件仍可触发（防止章节跳升导致剧情永久错过）
    if(ev.chapter&&ev.chapter>game.story.chapter)continue;
    if(ev.minAge&&p.age<ev.minAge)continue;
    if(ev.maxAge&&p.age>ev.maxAge)continue;
    if(ev.condition&&!ev.condition(p,ctx))continue;
    out.push(ev);
  }
  // 章节事件按优先级（越早的章节事件优先触发）
  out.sort((a,b)=>(a.priority||5)-(b.priority||5));
  return out.slice(0,3);
}
function pickStoryEvent(){
  const pend=pendingStoryEvents();
  if(!pend.length)return null;
  return pend[Math.floor(Math.random()*Math.min(2,pend.length))];
}
function pickCalendarEvents(){
  const p=game.player;
  const ctx=storyCtx();
  const y=ctx.year;
  const list=[];
  if(p.flags.nationalMember&&CALENDAR.asianCupYears.includes(y)){
    const ev=EVENT_BY_ID('cal_asian_cup');
    if(ev&&!isStoryUsed(ev.id))list.push(ev);
  }
  if(CALENDAR.olympicYear===y&&p.age<=23&&p.ovr>=60&&!p.flags.olympicDone){
    const ev=EVENT_BY_ID('cal_olympics');
    if(ev&&!isStoryUsed(ev.id))list.push(ev);
  }
  if(p.flags.nationalMember&&CALENDAR.qualiYears.includes(y)){
    const ev=EVENT_BY_ID('cal_quali_'+y);
    if(ev&&!isStoryUsed(ev.id))list.push(ev);
  }
  if(p.flags.wcQualified&&CALENDAR.wcYears.includes(y)){
    const ev=EVENT_BY_ID('cal_wc_'+y);
    if(ev&&!isStoryUsed(ev.id))list.push(ev);
  }
  return list;
}
// ============ 通用事件选取（一次一季、冷却5季、绝不连季重复） ============
function getEventById(id){
  return EVENT_POOL.find(e=>e.id===id)||null;
}
function EVENT_BY_ID(id){return getEventById(id)}
// 触发时校验：事件生成于赛季初，赛季中状态（年龄/联赛/梯队/旗帜）可能已变化
function eventPassesNow(ev){
  if(!ev)return false;
  const p=game.player;
  if(ev.minAge&&p.age<ev.minAge)return false;
  if(ev.maxAge&&p.age>ev.maxAge)return false;
  if(ev.condition&&!ev.condition(p,storyCtx()))return false;
  return true;
}
function getAvailableEvents(){
  const p=game.player;
  const ctx=storyCtx();
  return EVENT_POOL.filter(ev=>{
    if(ev.once)return false;
    if(ev.minAge&&p.age<ev.minAge)return false;
    if(ev.maxAge&&p.age>ev.maxAge)return false;
    if(ev.condition&&!ev.condition(p,ctx))return false;
    if(game.season.usedEventIds.includes(ev.id))return false;
    const last=p.recentEvents[ev.id];
    if(last!==undefined&&p.season-last<5)return false;
    return true;
  });
}
function pickEvent(category){
  let avail=getAvailableEvents().filter(e=>!category||e.cat===category);
  if(avail.length===0){
    // 冷却放宽到 3 季
    const p=game.player;
    avail=EVENT_POOL.filter(ev=>{
      if(ev.once)return false;
      if(ev.minAge&&p.age<ev.minAge)return false;
      if(ev.maxAge&&p.age>ev.maxAge)return false;
      if(ev.condition&&!ev.condition(p,ctxSafe()))return false;
      if(game.season.usedEventIds.includes(ev.id))return false;
      const last=p.recentEvents[ev.id];
      return last===undefined||p.season-last>=3;
    }).filter(e=>!category||e.cat===category);
  }
  if(avail.length===0)return null;
  return avail[Math.floor(Math.random()*avail.length)];
}
function ctxSafe(){return game?storyCtx():{}}
function generateSeasonEvents(){
  const events=[];
  const wins=transferWindows(p0League());
  // 季前转会窗（中国=冬窗 / 欧洲=夏窗）：合同到期必须在此处理
  const preWin=wins.find(w=>w.pos==='pre');
  events.push({type:'transfer_window',windowKey:preWin.key,windowLabel:preWin.label,windowRange:preWin.range,windowPos:'pre'});
  // 国家队 / 大赛日历事件放在窗后（国家队比赛日）
  pickCalendarEvents().forEach(ev=>events.push({type:'event',eventId:ev.id}));
  const slots=['training','match','training','social','cup','media','match','continental','special','training'];
  let inserted=0;
  slots.forEach((cat,i)=>{
    // 章节剧情优先挤占训练/特殊槽位
    if(inserted<2&&(cat==='training'||cat==='special')){
      const se=pickStoryEvent();
      if(se){events.push({type:'event',eventId:se.id});markStoryUsed(se.id);inserted++;return}
    }
    const ev=pickEvent(cat);
    if(ev)events.push({type:'event',eventId:ev.id});
    if(i===4){
      // 季中转会窗（中国=夏窗 / 欧洲=冬窗）
      const midWin=wins.find(w=>w.pos==='mid');
      events.push({type:'transfer_window',windowKey:midWin.key,windowLabel:midWin.label,windowRange:midWin.range,windowPos:'mid'});
    }
  });
  // 若仍未触发任何章节剧情，赛季末补一章
  if(inserted===0){
    const se=pickStoryEvent();
    if(se){events.push({type:'event',eventId:se.id});markStoryUsed(se.id)}
  }
  events.push({type:'season_end'});
  game.season.events=events;
}
function p0League(){return game&&game.player?game.player.league:'CSL'}
function scheduleText(p){
  const meta=leagueMeta(p);
  const name=LEAGUES[p.league]?LEAGUES[p.league].name:p.league;
  const rounds={1:'38轮',2:'34轮',3:'30轮',4:'30轮'}[meta.tier]||'30轮';
  return seasonYear(p)+'赛季 · '+name+rounds+' · '+meta.cup+(meta.continental?' · '+meta.continental:'');
}
// ============ EVENT SYSTEM ============
// 事件文案占位符插值：老文案里存在单引号字符串内嵌 ${p.name}/${ctx.ntCoach} 等写法，
// 不会像模板字符串那样求值，这里在渲染时统一兜底（表达式可引用 p、ctx 及全局常量/函数）
function interpolateEventText(text,p,ctx){
  if(typeof text!=='string'||text.indexOf('${')<0)return text;
  try{
    return new Function('p','ctx','return `'+text+'`')(p,ctx||storyCtx());
  }catch(e){return text}
}
function applyEffects(effects){
  if(!effects)return[];
  const changes=[];
  for(const key in effects){
    const parts=key.split('.');
    const cat=parts[0];const attr=parts[1];
    if(game.player.attributes[cat]&&game.player.attributes[cat][attr]!==undefined){
      const old=game.player.attributes[cat][attr];
      game.player.attributes[cat][attr]=Math.max(1,Math.min(99,old+effects[key]));
      changes.push({cat,attr,diff:effects[key]});
    }
  }
  return changes;
}
function processChoice(choiceIdx){
  const event=currentEvent;
  if(!event)return;
  const choice=event.choices[choiceIdx];
  if(!choice)return;
  // 关键时刻风险判定：高风险选择按相关属性/状态/总评掷成功率，
  // 失误走 fail 分支（无进球/助攻/旗标），成败会写入存档保证读档一致
  let outcome=choice;
  if(choice.risk){
    const r=choice.risk;
    const parts=(r.attr||'').split('.');
    const attrVal=parts.length===2?((game.player.attributes[parts[0]]||{})[parts[1]]||50):50;
    let chance=(r.base||0.6)+(attrVal-70)/150+(game.player.form-5)*0.02+(game.player.ovr-65)/220;
    chance=Math.max(0.25,Math.min(0.92,chance));
    if(Math.random()>=chance&&choice.fail)outcome=choice.fail;
    game.season.lastRiskFail=(outcome!==choice);
  }else{
    game.season.lastRiskFail=false;
  }
  const changes=applyEffects(outcome.effects);
  if(outcome.formChange)game.player.form=Math.max(1,Math.min(10,game.player.form+outcome.formChange));
  if(outcome.goals){game.season.seasonGoals+=outcome.goals}
  if(outcome.assists){game.season.seasonAssists+=outcome.assists}
  if(outcome.flag){game.player.flags[outcome.flag]=true}
  if(outcome.caps){game.player.internationalCaps+=outcome.caps}
  if(outcome.intlGoals){game.player.internationalGoals+=outcome.intlGoals}
  if(outcome.morale)game.player.morale=Math.max(1,Math.min(10,game.player.morale+outcome.morale));
  game.season.usedEventIds.push(event.id);
  if(!event.once)game.player.recentEvents[event.id]=game.player.season;
  game.season.phase='consequence';
  game.season.lastEventId=event.id;
  game.season.lastChoiceIndex=choiceIdx;
  game.season.lastChanges=changes;
  calculateOVR();
  calculateMarketValue();
  showConsequence(event,choice,changes,outcome);
}
function showConsequence(event,choice,changes,outcome){
  const p=game.player;
  const used=outcome||choice;
  const area=document.getElementById('view-story');
  let html='<div class="consequence-box">';
  html+='<div class="consequence-title">'+(used!==choice?'剧情 · 失误':'剧情 · 后续')+'</div>';
  const conseqText=interpolateEventText(typeof used.consequence==='function'?used.consequence(p):used.consequence,p,storyCtx());
  html+='<div class="consequence-text">'+conseqText+'</div>';
  html+='<div class="effect-list">';
  changes.forEach(c=>{
    const label=ATTR_LABELS[c.attr]||c.attr;
    if(c.diff>0)html+='<span class="effect-tag effect-pos">'+label+' +'+c.diff+'</span>';
    else if(c.diff<0)html+='<span class="effect-tag effect-neg">'+label+' '+c.diff+'</span>';
  });
  if(used.formChange){
    const fc=used.formChange;
    if(fc>0)html+='<span class="effect-tag effect-pos">状态 +'+fc+'</span>';
    else html+='<span class="effect-tag effect-neg">状态 '+fc+'</span>';
  }
  if(used.goals)html+='<span class="effect-tag effect-pos">进球 +'+used.goals+'</span>';
  if(used.assists)html+='<span class="effect-tag effect-pos">助攻 +'+used.assists+'</span>';
  if(used.caps)html+='<span class="effect-tag effect-pos">国家队出场 +'+used.caps+'</span>';
  if(used.intlGoals)html+='<span class="effect-tag effect-pos">国家队进球 +'+used.intlGoals+'</span>';
  if(used.morale){
    if(used.morale>0)html+='<span class="effect-tag effect-pos">士气 +'+used.morale+'</span>';
    else html+='<span class="effect-tag effect-neg">士气 '+used.morale+'</span>';
  }
  html+='</div>';
  html+='<button class="continue-btn" onclick="nextStep()">继续 <span class="svg-icon" style="width:15px;height:15px">'+ICONS['chevron-right']+'</span></button>';
  html+='</div>';
  area.innerHTML=html;
  document.querySelector('.stage').scrollTop=0;
  updateGameHeader();
  autoSave();
}
function showConsequenceFromState(){
  const s=game.season;
  const ev=getEventById(s.lastEventId);
  if(!ev){nextStep();return}
  const choice=ev.choices[s.lastChoiceIndex];
  if(!choice){nextStep();return}
  const outcome=(s.lastRiskFail&&choice.fail)?choice.fail:choice;
  showConsequence(ev,choice,s.lastChanges||[],outcome);
}
