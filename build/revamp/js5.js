// ============ 职业阶段（梯队晋升） ============
function updateCareerStage(){
  const p=game.player;
  const oldStage=p.careerStage;
  // U17梯队 → U19梯队 → U21预备队 → 一线队 → 主力 → 核心 → 传奇
  if(p.age<=17&&p.ovr<54){p.careerStage='u17'}
  else if(p.age<=18&&p.ovr<58){p.careerStage='u19'}
  else if(p.age<=19&&p.ovr<62){p.careerStage='u21'}
  else if(p.ovr<68){p.careerStage='first_team'}
  else if(p.ovr<75){p.careerStage='starter'}
  else if(p.ovr<82){p.careerStage='core'}
  else{p.careerStage='legend'}
  const leagueTier=LEAGUES[p.league]?LEAGUES[p.league].tier:3;
  const stageSalary={
    u17:3600,u19:9000,u21:15000,first_team:50000,starter:150000,core:400000,legend:800000
  };
  const leagueSalaryMult={1:3.5,2:1.8,3:1,4:0.7}[leagueTier]||1;
  const ageBonus=p.age>=23&&p.age<=30?1.3:1.0;
  let newSalary=Math.round(stageSalary[p.careerStage]*leagueSalaryMult*ageBonus);
  if(p.league==='CSL'&&newSalary>375000){
    newSalary=375000;
    if(!p.flags.salaryCapped){p.flags.salaryCapped=true;addLog('中超限薪政策：国内球员顶薪为税前300万人民币/年')}
  }
  if(p.league==='CL1'&&newSalary>125000)newSalary=125000;
  if(newSalary>p.salary||p.careerStage!==oldStage){
    if(newSalary>p.salary)p.salary=newSalary;
  }
  if(p.careerStage!==oldStage){
    addLog('梯队晋升：'+getStageName(oldStage)+' → '+getStageName(p.careerStage));
    if(p.careerStage==='u19')addLog('你跳入 U19 梯队，参加U19联赛');
    if(p.careerStage==='u21')addLog('你进入 U21 预备队，冲击一线队名单');
    if(p.careerStage==='first_team')addLog('你升入一线队，正式注册职业联赛大名单');
  }
}
// ============ LOG ============
function addLog(entry){
  if(!game)return;
  const p=game.player;
  p.careerLog.unshift({season:p.season,age:p.age,year:seasonYear(p),text:entry});
  if(p.careerLog.length>120)p.careerLog.pop();
}
// ============ SEASON FLOW ============
function startNewSeason(){
  const p=game.player;
  p.age++;
  p.season++;
  // 职业生涯上限：满40岁强制退役（不再提供"继续征战"选项）
  if(p.age>=40){
    updateCareerStage();calculateOVR();calculateMarketValue();
    showRetirement();return;
  }
  // 剧情后果：赛季初状态受此前选择影响
  p.form=p.flags.pro_lifestyle?6:5;
  if(p.flags.injured_play){
    p.flags.injured_play=false;
    p.form=4;
    addLog('上一季打封闭硬撑的旧患复发，赛季初状态平平——当时的选择留下了后果');
  }
  p.contractYears=Math.max(0,p.contractYears-1);
  if(p.contractYears===0)p.flags.contractExpired=true;
  game.season={events:[],currentEventIndex:-1,phase:'start',seasonGoals:0,seasonAssists:0,seasonApps:0,teamPosition:0,usedEventIds:[],endProcessed:false,profile:null};
  updateCareerStage();
  const g=applyGrowth();
  if(g>0)addLog(p.age+'岁成长期：总评 +'+g+' → '+p.ovr);
  checkNationalTeam();
  generateSeasonEvents();
  showSeasonStart();
}
function showSeasonStart(){
  const p=game.player;
  const ctx=storyCtx();
  if(!game.season.profile)game.season.profile=generateSeasonProfile();
  const pr=game.season.profile;
  const area=document.getElementById('view-story');
  let html='<div class="season-banner">';
  html+='<div class="banner-tag"><span class="dot"></span>'+ctx.year+'赛季 · '+getStageName(p.careerStage)+'</div>';
  html+='<h3>'+p.name+' · '+p.age+'岁</h3>';
  html+='<p>你的每一条发展路线，都由你自己的选择书写。</p>';
  html+='</div>';
  html+='<div class="season-hero">';
  html+='<h3>'+ctx.year+' 赛季开始</h3>';
  html+='<div class="season-meta">'+p.position+(p.isGK?' 门将':'')+' · '+getStageName(p.careerStage)+'</div>';
  // 球队 × 赛事信息条：俱乐部与所征战赛事并列展示（不再使用"VS"对垒式排版）
  html+='<div class="season-clubline">';
  html+='<div class="cl-club">'+crestHTML('team',p.team,'crest-xxl')+'<b>'+p.team+'</b><small>你的球队'+(clubCity(p.team)?' · '+clubCity(p.team):'')+'</small></div>';
  html+='<div class="cl-info">';
  html+='<div class="cl-league-name">'+crestHTML('league',p.league,'crest-md')+'<span>'+(LEAGUES[p.league]?LEAGUES[p.league].name:p.league)+'</span></div>';
  html+='<small>'+scheduleText(p).split('·').slice(1).join('·').trim()+'</small>';
  html+='<small>赛季目标：'+(isYouthStage(p)?'立足梯队，冲击一线队':p.ovr>=78?'联赛冠军与洲际荣誉':p.ovr>=70?'稳定主力位置':'争取更多出场机会')+'</small>';
  html+='</div>';
  html+='</div>';
  html+='<div class="season-facts">';
  html+='<div class="season-fact"><b class="volt">'+pr.matches+'场</b>预计出战</div>';
  html+='<div class="season-fact"><b>'+p.ovr+'</b>当前总评</div>';
  html+='<div class="season-fact"><b>'+formatValue(p.marketValue)+'</b>当前身价</div>';
  html+='<div class="season-fact"><b>'+getStageName(p.careerStage)+'</b>所在梯队</div>';
  html+='</div>';
  html+='</div>';
  html+='<div class="event-card">';
  html+='<div class="event-narrative">';
  const intros=[
    '新赛季的号角已经吹响。训练基地的草皮刚刚修剪过，空气中弥漫着青草的气息。你系好鞋带，踏入球场——这是你职业生涯的第'+p.season+'个赛季。',
    '更衣室里挂好了新赛季的球衣，号码还是那个熟悉的数字。教练在战术板前写写画画，队友们陆续到来。又一个赛季开始了。',
    '季前集训的第一天，阳光洒在训练场上。你的身体状态不错，对新赛季充满期待。主教练拍了拍你的肩膀："'+p.name+'，这个赛季我对你有更高的期待。"',
    '新赛季的备战开始了。体检报告显示你的身体状况良好。训练基地门口，几个球迷举着你的海报在等候。你微笑着签了名，然后大步走向更衣室。'
  ];
  html+=intros[Math.floor(Math.random()*intros.length)];
  html+='</div>';
  html+='<button class="continue-btn" onclick="nextStep()">开始赛季 →</button>';
  html+='<div class="skip-row"><button class="btn-ghost" onclick="skipSeasonRest()"><span class="btn-icon" style="margin:0" data-icon="fast"></span>快进 · 跳过剩余剧情直接结算</button></div>';
  html+='</div>';
  area.innerHTML=html;
  document.querySelector('.stage').scrollTop=0;
  updateGameHeader();
  renderRailSeason();
}
function nextStep(){
  const s=game.season;
  s.currentEventIndex++;
  while(s.currentEventIndex<s.events.length){
    const item=s.events[s.currentEventIndex];
    if(item.type!=='event')break;
    const ev=getEventById(item.eventId);
    // 事件列表在赛季开始时生成；赛季中转会/晋升会让部分事件失效（如亚洲球队踢亚冠的剧情），
    // 触发时按当前状态二次校验，失效则用同类合格事件顶替，凑不出就跳过
    if(!ev||!eventPassesNow(ev)){
      const rep=pickEvent(ev?ev.cat:null);
      if(rep){item.eventId=rep.id}
      else{s.currentEventIndex++;continue}
    }
    showEvent(item.eventId);switchView('story');return;
  }
  if(s.currentEventIndex>=s.events.length){showSeasonEnd();return}
  const item=s.events[s.currentEventIndex];
  if(item.type==='transfer_window')showTransferWindow({windowKey:item.windowKey,windowLabel:item.windowLabel,windowRange:item.windowRange,windowPos:item.windowPos});
  else if(item.type==='season_end')showSeasonEnd();
}
function skipSeasonRest(){
  showConfirm('快进本赛季','跳过剩余剧情，直接按当前能力结算本赛季数据并进入下一赛季？',function(){
    const s=game.season;
    s.currentEventIndex=s.events.length-1;
    showSeasonEnd();
  });
}
function showEvent(eventId){
  const event=getEventById(eventId);
  if(!event){nextStep();return}
  // 读档恢复/赛季中状态变化时兜底：失效事件不再展示
  if(!eventPassesNow(event)){nextStep();return}
  const p=game.player;
  const area=document.getElementById('view-story');
  const catLabels={training:'训练',match:'比赛',social:'社交',transfer:'转会',special:'特殊',media:'媒体',cup:'杯赛',continental:'洲际',national:'国家队',story:'剧情'};
  const catKey=event.cat||'story';
  const ctx=storyCtx();
  const meta=[];
  meta.push(ctx.year+'赛季');
  if(ctx.city)meta.push(ctx.city);
  let html='<div class="event-card">';
  html+='<div class="event-topline">';
  html+='<span class="event-category cat-'+catKey+'">'+(catLabels[catKey]||'剧情')+'</span>';
  if(event.once)html+='<span class="event-meta">剧情 · 章节事件</span>';
  html+='<span class="event-meta" style="margin-left:auto">'+meta.join(' · ')+' · '+p.age+'岁</span>';
  html+='</div>';
  const narrative=interpolateEventText(typeof event.narrative==='function'?event.narrative(p,ctx):event.narrative,p,ctx);
  html+='<div class="event-narrative">'+narrative+'</div>';
  html+='<div class="choices">';
  event.choices.forEach((choice,i)=>{
    html+='<button class="choice-btn" onclick="processChoice('+i+')">';
    html+='<span class="choice-index">'+(i+1)+'</span>';
    html+='<span class="choice-body"><div>'+(typeof choice.text==='function'?choice.text(p):choice.text)+'</div>';
    if(choice.hint)html+='<div class="choice-hint">'+choice.hint+'</div>';
    html+='</span>';
    html+='</button>';
  });
  html+='</div>';
  html+='</div>';
  area.innerHTML=html;
  document.querySelector('.stage').scrollTop=0;
  currentEvent=event;
  game.season.phase='event';
  switchView('story');
}
// ============ TRANSFER SYSTEM ============
function showTransferWindow(opts){
  // 兼容旧调用：showTransferWindow(offersArray) / showTransferWindow()
  if(Array.isArray(opts))opts={offers:opts};
  opts=opts||{};
  const p=game.player;
  const area=document.getElementById('view-story');
  const expired=p.flags.contractExpired||p.contractYears<=0;
  const offers=opts.offers||generateTransferOffers({force:expired});
  currentOffers=offers;
  // 窗期信息：季前窗（中国冬窗/欧洲夏窗）与季中窗（中国夏窗/欧洲冬窗）
  const wins=transferWindows(p.league);
  const win=opts.windowKey?wins.find(w=>w.key===opts.windowKey)||wins[0]:(opts.windowPos==='pre'?wins[0]:wins[1]);
  const winPosLabel=win.pos==='pre'?'季前':'季中';
  currentWindowInfo={windowKey:win.key,windowLabel:win.label,windowRange:win.range,windowPos:win.pos};
  const winTitle='转会窗 · '+win.label+'（'+winPosLabel+' · '+win.range+'）';
  let html='<div class="event-card">';
  html+='<div class="event-topline"><span class="event-category cat-transfer">'+winTitle+'</span><span class="event-meta" style="margin-left:auto">'+seasonYear(p)+'年 · '+p.age+'岁</span></div>';
  html+='<div class="event-narrative">';
  html+=(expired?'你的合同已经到期！'+win.label+'是解决合同的最后机会，经纪人催促你尽快做出决定，俱乐部和几支球队都在等待你的答复：\n\n':(win.key==='winter'?'冬窗开启，各队为赛季目标做最后补强。':win.key==='summer'?'夏窗开启，各队招兵买马迎接新赛季。':'转会窗开启。')+'经纪人打来电话，通报了当前的市场情况：\n\n');
  html+='当前球队：'+p.team+'（'+(LEAGUES[p.league]?LEAGUES[p.league].name:p.league)+'）\n';
  html+='职业阶段：'+getStageName(p.careerStage)+'\n';
  html+='合同剩余：'+(expired?'已到期':p.contractYears+'年')+'\n';
  html+='当前身价：'+formatValue(p.marketValue)+'\n\n';
  if(offers.length>0){
    html+='有 '+offers.length+' 家俱乐部向你发出邀请：\n\n';
    offers.forEach(o=>{
      html+='▸ '+o.team+'（'+o.leagueName+'）\n';
      html+='  '+(o.fee>0?'转会费：'+formatValue(o.fee)+' | ':'自由转会 | ')+'年薪：'+formatSalary(o.salary)+' | 合同：'+o.years+'年\n';
      const st=TEAM_STARS[o.team];
      if(st&&st.length)html+='  队内核心：'+st.slice(0,2).join('、')+'\n';
    });
  }else{
    html+=(expired?'目前没有俱乐部报价。你必须与俱乐部续约，或进入自由市场等待机会。':'目前没有俱乐部主动报价。你可以留在球队，也可以主动让经纪人联系下家。');
  }
  html+='</div>';
  html+='<div class="choices">';
  offers.forEach((o,i)=>{
    html+='<button class="choice-btn" onclick="acceptTransfer('+i+')">';
    html+='<span class="choice-index">'+(i+1)+'</span>';
    html+='<span class="choice-body"><div style="display:flex;align-items:center;gap:10px">'+crestHTML('team',o.team,'crest crest-sm')+'<span>加盟 '+o.team+'</span></div>';
    html+='<div class="choice-hint">'+o.leagueName+' · '+(o.fee>0?'转会费 '+formatValue(o.fee):'自由转会')+' · 年薪 '+formatSalary(o.salary)+' · '+o.role+'</div></span>';
    html+='</button>';
  });
  if(expired){
    html+='<button class="choice-btn" onclick="renewContract()">';
    html+='<span class="choice-index">'+(offers.length+1)+'</span>';
    html+='<span class="choice-body"><div>续约谈判</div><div class="choice-hint">与 '+p.team+' 续签合同，结束合同到期状态</div></span></button>';
    html+='<button class="choice-btn" onclick="enterFreeAgency()">';
    html+='<span class="choice-index">'+(offers.length+2)+'</span>';
    html+='<span class="choice-body"><div>进入自由市场</div><div class="choice-hint">成为自由球员，经纪人将为你联系更多球队</div></span></button>';
  }else{
    html+='<button class="choice-btn" onclick="seekTransfer()">';
    html+='<span class="choice-index">'+(offers.length+1)+'</span>';
    html+='<span class="choice-body"><div>主动寻求转会</div><div class="choice-hint">让经纪人主动联系国内外俱乐部</div></span></button>';
    html+='<button class="choice-btn" onclick="stayAtClub()">';
    html+='<span class="choice-index">'+(offers.length+2)+'</span>';
    html+='<span class="choice-body"><div>留在 '+p.team+'</div><div class="choice-hint">继续为当前球队效力</div></span></button>';
    if(p.contractYears<=1){
      html+='<button class="choice-btn" onclick="renewContract()">';
      html+='<span class="choice-index">'+(offers.length+3)+'</span>';
      html+='<span class="choice-body"><div>续约谈判</div><div class="choice-hint">与当前球队续签合同</div></span></button>';
    }
  }
  html+='</div></div>';
  area.innerHTML=html;
  document.querySelector('.stage').scrollTop=0;
  game.season.phase='transfer';
  switchView('story');
}
function generateTransferOffers(opts){
  opts=opts||{};
  const p=game.player;
  const offers=[];
  // 未成年球员（U17/U19）不允许转会：中国足协未成年人转会保护
  if((p.careerStage==='u17'||p.careerStage==='u19'))return offers;
  if(isYouthStage(p)&&!opts.force&&!opts.proactive)return offers;
  let numOffers=0;
  if(p.ovr>=80)numOffers=2+Math.floor(Math.random()*2);
  else if(p.ovr>=72)numOffers=1+Math.floor(Math.random()*2);
  else if(p.ovr>=65)numOffers=Math.random()<0.75?1:0;
  else if(p.ovr>=58)numOffers=Math.random()<0.5?1:0;
  else numOffers=Math.random()<0.25?1:0;
  if(opts.force)numOffers=Math.max(1,numOffers+1);
  if(opts.proactive)numOffers=Math.max(1,Math.min(4,numOffers+1+Math.floor(Math.random()*2)));
  // 剧情后果：阿贾克斯球探考察（x3）或留洋决心（ch4_scout_offer）会带来真实的欧洲门路
  const wantsEurope=!isEuropeLeague(p)&&isChinaLeague(p)&&(p.flags.ajax_interest||p.flags.go_abroad_intent)&&p.ovr>=58;
  if(numOffers===0&&!wantsEurope)return offers;
  const usedTeams=new Set([p.team]);
  for(let i=0;i<numOffers;i++){
    let leagueKeys;
    if(p.ovr>=78){
      leagueKeys=['EPL','LALIGA','SERIE_A','BUNDESLIGA','LIGUE_1','EREDIVISIE','LIGA_PT','BRA','ARG','SAU','QAT'];
    }else if(p.ovr>=70){
      leagueKeys=['EREDIVISIE','LIGA_PT','BUNDESLIGA','J1','K1','BRA','ARG','MLS','SAU','QAT','CSL'];
    }else if(p.ovr>=62){
      leagueKeys=['CSL','J1','K1','MLS','CL1','EREDIVISIE','LIGA_PT'];
    }else{
      leagueKeys=['CL1','CSL'];
    }
    // 中国球员更容易获得东亚/欧洲中游机会；已留洋的不再去中甲
    if(isEuropeLeague(p))leagueKeys=leagueKeys.filter(k=>k!=='CL1'&&k!=='CSL');
    leagueKeys=leagueKeys.filter(k=>k!==p.league);
    if(leagueKeys.length===0)leagueKeys=['CSL','CL1'];
    let attempts=0;
    while(attempts<12){
      const lk=leagueKeys[Math.floor(Math.random()*leagueKeys.length)];
      const league=LEAGUES[lk];
      const team=league.teams[Math.floor(Math.random()*league.teams.length)];
      if(usedTeams.has(team)){attempts++;continue}
      usedTeams.add(team);
      const fee=opts.force?0:Math.round(p.marketValue*(0.7+Math.random()*0.5));
      let salary=Math.round(p.salary*(1.0+Math.random()*0.9));
      if(lk==='CSL'&&salary>375000)salary=375000;
      if(lk==='CL1'&&salary>125000)salary=125000;
      const years=2+Math.floor(Math.random()*3);
      const roles=p.ovr>=78?['核心球员','关键引援','主力球员']:(p.ovr>=68?['主力球员','轮换球员']:['轮换球员','潜力新星']);
      offers.push({team,league:lk,leagueName:league.name,fee,salary,years,role:roles[Math.floor(Math.random()*roles.length)]});
      break;
    }
  }
  if(wantsEurope){
    const lk=Math.random()<0.5?'EREDIVISIE':'LIGA_PT';
    const league=LEAGUES[lk];
    const cands=league.teams.filter(t=>!usedTeams.has(t));
    if(cands.length){
      const team=cands[Math.floor(Math.random()*cands.length)];
      usedTeams.add(team);
      offers.push({team,league:lk,leagueName:league.name,fee:Math.round(p.marketValue*(0.8+Math.random()*0.5)),salary:Math.round(Math.max(p.salary,15000)*(1.1+Math.random()*0.8)),years:2+Math.floor(Math.random()*2),role:p.ovr>=68?'主力球员':'潜力新星'});
    }
  }
  if(opts.force&&offers.length===0){
    const league=LEAGUES.CL1;
    offers.push({team:league.teams[Math.floor(Math.random()*league.teams.length)],league:'CL1',leagueName:league.name,fee:0,salary:Math.min(125000,Math.round(p.salary*0.9)),years:2,role:'轮换球员'});
  }
  return offers;
}
function mergeOffers(a,b){
  const seen=new Set(a.map(o=>o.team));
  b.forEach(o=>{if(!seen.has(o.team)){seen.add(o.team);a.push(o)}});
  return a;
}
function seekTransfer(){
  if(!game)return;
  const more=generateTransferOffers({proactive:true});
  currentOffers=mergeOffers(currentOffers,more);
  showTransferWindow(Object.assign({offers:currentOffers.slice()},currentWindowInfo||{}));
}
function enterFreeAgency(){
  if(!game)return;
  const p=game.player;
  const offers=generateTransferOffers({force:true,proactive:true});
  currentOffers=offers;
  const area=document.getElementById('view-story');
  let html='<div class="event-card">';
  html+='<div class="event-topline"><span class="event-category cat-transfer">自由市场</span></div>';
  html+='<div class="event-narrative">你宣布离开 '+p.team+'，成为自由球员。经纪人连夜奔走，最终为你带来 '+offers.length+' 份正式报价。自由转会没有转会费，谈判只看年薪与合同年限：\n\n';
  offers.forEach(o=>{
    html+='▸ '+o.team+'（'+o.leagueName+'）· 年薪 '+formatSalary(o.salary)+' · '+o.years+'年 · '+o.role+'\n';
  });
  html+='</div><div class="choices">';
  offers.forEach((o,i)=>{
    html+='<button class="choice-btn" onclick="acceptTransfer('+i+')">';
    html+='<span class="choice-index">'+(i+1)+'</span>';
    html+='<span class="choice-body"><div style="display:flex;align-items:center;gap:10px">'+crestHTML('team',o.team,'crest crest-sm')+'<span>签约 '+o.team+'</span></div>';
    html+='<div class="choice-hint">'+o.leagueName+' · 年薪 '+formatSalary(o.salary)+' · '+o.role+'</div></span></button>';
  });
  html+='<button class="choice-btn" onclick="renewContract()">';
  html+='<span class="choice-index">'+(offers.length+1)+'</span>';
  html+='<span class="choice-body"><div>回心转意，与 '+p.team+' 续约</div><div class="choice-hint">俱乐部愿意重新谈判</div></span></button>';
  html+='</div></div>';
  area.innerHTML=html;
  document.querySelector('.stage').scrollTop=0;
  game.season.phase='transfer';
}
function acceptTransfer(idx){
  const offer=currentOffers[idx];
  if(!offer)return;
  const p=game.player;
  const goingAbroad=isEuropeLeague({league:offer.league})&&!isEuropeLeague(p);
  // 季前窗（尚未踢任何正式比赛）完成转会：赛季数据按新联赛重新模拟
  const preSeasonMove=game.season.currentEventIndex===0;
  p.team=offer.team;
  p.league=offer.league;
  p.salary=offer.salary;
  p.contractYears=offer.years;
  delete p.flags.contractExpired;
  delete p.flags.onLoan;
  if(goingAbroad){
    p.flags.moved_abroad=true;
    addLog('留洋！转会至'+offer.team+'（'+offer.leagueName+'）——中国足球的新火种');
  }else{
    addLog('转会至'+offer.team+'（'+offer.leagueName+'），'+(offer.fee>0?'转会费'+formatValue(offer.fee):'自由转会'));
  }
  if(preSeasonMove){
    game.season.profile=null;
    addLog('赛季开始前改换门庭，本赛季数据将按'+offer.leagueName+'水准重新模拟');
  }
  updateCareerStage();
  p.form=Math.max(3,p.form-1);
  showTransferResult(offer,true);
}
function stayAtClub(){
  showTransferResult(null,false);
}
function renewContract(){
  const p=game.player;
  const expired=p.flags.contractExpired;
  p.contractYears=2+Math.floor(Math.random()*2);
  let newSalary=Math.round(p.salary*1.15);
  if(p.league==='CSL'&&newSalary>375000)newSalary=375000;
  if(p.league==='CL1'&&newSalary>125000)newSalary=125000;
  p.salary=newSalary;
  delete p.flags.contractExpired;
  addLog('与'+p.team+'续约，合同'+p.contractYears+'年');
  const area=document.getElementById('view-story');
  area.innerHTML='<div class="consequence-box"><div class="consequence-title">转会窗 · 结果</div><div class="consequence-text">'+(expired?'合同到期后，':'')+p.team+'与你续签了'+p.contractYears+'年合同，年薪为'+formatSalary(p.salary)+'。俱乐部对你展现了充分的信任。</div><button class="continue-btn" onclick="nextStep()">继续 →</button></div>';
  updateGameHeader();
  autoSave();
}
function showTransferResult(offer,accepted){
  const area=document.getElementById('view-story');
  let html='<div class="consequence-box">';
  html+='<div class="consequence-title">转会窗 · 结果</div>';
  if(accepted){
    html+='<div class="consequence-text">你正式加盟'+offer.team+'！新球衣、新更衣室、新队友——一切都要从头开始。'+(offer.fee>0?'转会费'+formatValue(offer.fee)+'创造了你个人转会纪录。':'作为自由球员加盟，你把全部精力放在了新的征程上。')+'</div>';
  }else{
    html+='<div class="consequence-text">你选择留在'+game.player.team+'。这里的球迷、队友、这座城市——你已经融入了这里的一切。新赛季，继续为这支球队而战。</div>';
  }
  html+='<button class="continue-btn" onclick="nextStep()">继续 →</button></div>';
  area.innerHTML=html;
  updateGameHeader();
  autoSave();
}
// ============ SEASON END ============
function showSeasonEnd(){
  const p=game.player;
  const s=game.season;
  if(!s.endProcessed){
    s.endProcessed=true;
    const profile=s.profile||generateSeasonProfile();
    s.seasonProfile=profile;
    const apps=profile.matches;
    const goals=profile.goals+(s.seasonGoals||0);
    const assists=profile.assists+(s.seasonAssists||0);
    s.seasonApps=apps;
    s.finalGoals=goals;
    s.finalAssists=assists;
    p.careerAppearances+=apps;
    p.careerGoals+=goals;
    p.careerAssists+=assists;
    const prevOvr=p.ovrHistory.length>0?p.ovrHistory[p.ovrHistory.length-1].ovr:p.ovr;
    s.endPrevOvr=prevOvr;
    p.ovrHistory.push({age:p.age,ovr:p.ovr});
    p.valueHistory.push({age:p.age,value:p.marketValue});
    if(p.flags.nationalMember){
      const nc=3+Math.floor(Math.random()*6)+(p.ovr>=75?2:0);
      p.internationalCaps+=nc;
      if(!p.isGK){
        const ng=Math.floor(Math.random()*3)+(p.ovr>=75?1:0);
        if(ng>0){p.internationalGoals+=ng;addLog('国家队：世预赛/大赛期间攻入 '+ng+' 球')}
      }
      addLog('国家队：本赛季代表国足出战 '+nc+' 场');
    }
    let honor=null;
    const leagueName=competitionName(p);
    // —— 荣誉评判标准（由高到低逐档判定，命中即停；产出门槛硬性化，杜绝低产出拿大奖）——
    const bootThreshold={CSL:16,CL1:13,EPL:17,LALIGA:17,SERIE_A:16,BUNDESLIGA:17,LIGUE_1:16,EREDIVISIE:16,LIGA_PT:15,BRA:15,ARG:13,MLS:15,J1:14,K1:14,SAU:16,QAT:15};
    const boot=bootThreshold[p.league]||14;
    if(p.isGK){
      // 门将：最佳门将看零封，最佳阵容看评分
      if(profile.cleanSheets>=12&&profile.rating>=7.0&&Math.random()<0.5)honor=leagueName+' 最佳门将';
      else if(profile.rating>=7.2&&Math.random()<0.4)honor=leagueName+' 最佳阵容';
    }else if(goals>=boot&&Math.random()<0.55){
      // 金靴：达到该联赛射手王水准（中超16球/葡超15球/英超17球…）
      honor=leagueName+' 金靴';
    }else if(profile.rating>=7.45&&(goals>=14||assists>=10||goals+assists>=18)&&Math.random()<0.5){
      // 联赛最佳球员（MVP）：评分与产出双门槛，缺一不可
      honor=leagueName+' 最佳球员';
    }else if(assists>=10&&assists>goals&&Math.random()<0.45){
      // 助攻王：助攻上双且多于进球
      honor=leagueName+' 助攻王';
    }else if(p.age<=21&&profile.rating>=6.95&&goals+assists>=8&&Math.random()<0.6){
      // 最佳年轻球员：U21 + 合格表现，年轻球员的主要荣誉出口
      honor=leagueName+' 最佳年轻球员';
    }else if(profile.rating>=7.2&&(goals+assists)>=8&&Math.random()<0.4){
      // 最佳阵容：高评分且有一定产出
      honor=leagueName+' 最佳阵容';
    }else if(profile.rating>=6.8&&Math.random()<0.2){
      // 队内最佳：球队级荣誉，门槛最低
      honor=p.team+' 队内赛季最佳';
    }
    // 中国金球奖（真实奖项，面向职业一线队球员；需评分与产出双达标）
    if(isChinaLeague(p)&&!isYouthStage(p)&&!p.isGK&&profile.rating>=7.4&&(goals>=14||assists>=9||goals+assists>=16)&&Math.random()<0.5){
      honor=(honor?honor+'；':'')+'中国金球奖';
    }
    s.endHonor=honor;
    if(honor){
      p.honors.push(honor+'（'+seasonYear(p)+'）');
      addLog('获得荣誉：'+honor);
    }
    if(p.flags.cup_winner&&!p.flags.cup_honored){
      p.flags.cup_honored=true;
      const cupH=domesticCupName(p)+'冠军';
      p.honors.push(cupH+'（'+seasonYear(p)+'）');
      addLog('捧起 '+cupH);
    }
    if(p.flags.acl_champion&&!p.flags.acl_honored){
      p.flags.acl_honored=true;
      p.honors.push('亚冠精英赛冠军（'+seasonYear(p)+'）');
      addLog('亚冠冠军！亚洲之巅');
    }
    if(p.flags.ucl_champion&&!p.flags.ucl_honored){
      p.flags.ucl_honored=true;
      p.honors.push('欧冠冠军（'+seasonYear(p)+'）');
      addLog('欧冠冠军！欧洲之巅！');
    }
    if(p.flags.wc_champion&&!p.flags.wc_honored){
      p.flags.wc_honored=true;
      p.honors.push('世界杯冠军（'+seasonYear(p)+'）');
      addLog('世界杯冠军！！！史无前例');
    }
    addLog('S'+p.season+'赛季结束：'+apps+'场 '+goals+'球 '+assists+'助攻，场均评分 '+profile.rating.toFixed(2));
    // 记录赛季表现：供身价评估参考（表现系数让身价变化贴合现实）
    p.lastPerf={matches:apps,goals:goals,assists:assists,cleanSheets:profile.cleanSheets,rating:profile.rating,isGK:!!p.isGK};
    // 赛季回响：场外选择的长期后果进入履历
    const echo=[];
    if(p.flags.recovery_pro)echo.push('坚持科学康复，身体底子依旧扎实');
    if(p.flags.pro_lifestyle)echo.push('自律的生活方式获得队内认可');
    if(p.flags.viral)echo.push('网络热度带来商业关注');
    if(echo.length)addLog('赛季回响：'+echo.join('；'));
    calculateMarketValue();
  }
  const profile=s.seasonProfile||s.profile||generateSeasonProfile();
  const apps=s.seasonApps||0;
  const goals=s.finalGoals!==undefined?s.finalGoals:(profile.goals+(s.seasonGoals||0));
  const assists=s.finalAssists!==undefined?s.finalAssists:(profile.assists+(s.seasonAssists||0));
  const prevOvr=s.endPrevOvr!==undefined?s.endPrevOvr:p.ovr;
  const honor=s.endHonor||null;
  const modal=document.getElementById('summary-modal');
  const content=document.getElementById('summary-content');
  const ovrDiff=p.ovr-prevOvr;
  const valDiff=p.valueHistory.length>1?p.marketValue-p.valueHistory[p.valueHistory.length-2].value:0;
  let html='<h2>'+seasonYear(p)+' 赛季总结</h2>';
  html+='<div class="summary-row"><span class="summary-label">年龄 / 梯队</span><span class="summary-val">'+p.age+'岁 · '+getStageName(p.careerStage)+'</span></div>';
  html+='<div class="summary-row"><span class="summary-label">球队</span><span class="summary-val">'+p.team+'</span></div>';
  html+='<div class="summary-row"><span class="summary-label">出场次数</span><span class="summary-val">'+apps+'场</span></div>';
  if(p.isGK){
    html+='<div class="summary-row"><span class="summary-label">零封 / 扑救 / 失球</span><span class="summary-val">'+profile.cleanSheets+' / '+profile.saves+' / '+profile.conceded+'</span></div>';
  }else{
    html+='<div class="summary-row"><span class="summary-label">赛季进球</span><span class="summary-val">'+goals+'</span></div>';
    html+='<div class="summary-row"><span class="summary-label">赛季助攻</span><span class="summary-val">'+assists+'</span></div>';
    html+='<div class="summary-row"><span class="summary-label">射门 / 关键传球</span><span class="summary-val">'+profile.shots+' / '+profile.keyPasses+'</span></div>';
    html+='<div class="summary-row"><span class="summary-label">抢断 / 拦截</span><span class="summary-val">'+profile.tackles+' / '+profile.interceptions+'</span></div>';
  }
  html+='<div class="summary-row"><span class="summary-label">场均评分 / 全场最佳</span><span class="summary-val">'+profile.rating.toFixed(2)+' / '+profile.motm+'次</span></div>';
  html+='<div class="summary-row"><span class="summary-label">黄牌 / 红牌</span><span class="summary-val">'+profile.yellows+' / '+profile.reds+'</span></div>';
  html+='<div class="summary-row"><span class="summary-label">总评变化</span><span class="summary-val '+(ovrDiff>=0?'pos-change':'neg-change')+'">'+(ovrDiff>=0?'+':'')+ovrDiff+'（当前 '+p.ovr+'）</span></div>';
  html+='<div class="summary-row"><span class="summary-label">身价变化</span><span class="summary-val '+(valDiff>=0?'pos-change':'neg-change')+'">'+(valDiff>=0?'+':'')+formatValue(Math.abs(valDiff))+'（当前 '+formatValue(p.marketValue)+'）</span></div>';
  if(honor)html+='<div class="summary-row"><span class="summary-label">荣誉</span><span class="summary-val" style="color:var(--gold)">'+honor+'</span></div>';
  html+='<button class="continue-btn" onclick="closeSummary()" style="margin-top:20px">进入'+(seasonYear(p)+1)+'赛季 →</button>';
  content.innerHTML=html;
  modal.classList.add('active');
  s.phase='summary';
  updateGameHeader();
  autoSave();
}
function closeSummary(){
  document.getElementById('summary-modal').classList.remove('active');
  startNewSeason();
}
// ============ RETIREMENT ============
function showRetirement(){
  showScreen('retire-screen');
  document.getElementById('retire-back').style.display='none';
  document.getElementById('retire-extra').innerHTML='';
  // 40岁为职业生涯上限：不提供"继续征战"
  const cont=document.getElementById('retire-continue');
  if(cont)cont.style.display=(game&&game.player&&game.player.age>=40)?'none':'';
}
function chooseRetire(choice){
  const p=game.player;
  if(choice==='continue'&&p.age>=40){showToast('40岁是职业生涯的终点');showRetirement();return}
  if(choice==='retire'){
    p.retired=true;
    addLog(p.age+'岁正式挂靴退役');
    showCareerSummary();
  }else if(choice==='coach'){
    p.coaching=true;
    p.retired=true;
    addLog(p.age+'岁退役，转战教练岗位');
    showCoachMode();
  }else if(choice==='continue'){
    document.getElementById('retire-extra').innerHTML='<div class="career-summary"><p style="text-align:center;font-size:1rem;line-height:1.8">你决定继续征战！老将的经验和智慧是你最宝贵的财富。新赛季的哨声即将吹响。</p><button class="continue-btn" onclick="continuePlaying()">继续职业生涯 →</button></div>';
    document.getElementById('retire-back').style.display='none';
  }
  autoSave();
}
function continuePlaying(){
  showScreen('game-screen');
  switchView('story');
  game.season={events:[],currentEventIndex:-1,phase:'start',seasonGoals:0,seasonAssists:0,seasonApps:0,teamPosition:0,usedEventIds:[],endProcessed:false,profile:null};
  updateCareerStage();
  generateSeasonEvents();
  showSeasonStart();
}
function backToGame(){
  showScreen('game-screen');
  renderRailSeason();
  switchView(activeView);
}
function showCareerSummary(){
  const p=game.player;
  const extra=document.getElementById('retire-extra');
  let html='<div class="career-summary">';
  html+='<h2 style="color:var(--volt);text-align:center;margin-bottom:16px">生涯回顾</h2>';
  html+='<div class="season-vs"><div class="vs-club">'+crestHTML('team',p.team,'crest-lg')+'<span>'+p.name+'</span><small>'+p.position+' · '+getStageName(p.careerStage)+'</small></div></div>';
  html+='<div class="career-stat-grid">';
  html+='<div class="career-stat-box"><div class="val">'+p.age+'</div><div class="lbl">退役年龄</div></div>';
  html+='<div class="career-stat-box"><div class="val">'+p.season+'</div><div class="lbl">赛季数</div></div>';
  html+='<div class="career-stat-box"><div class="val">'+p.careerGoals+'</div><div class="lbl">生涯进球</div></div>';
  html+='<div class="career-stat-box"><div class="val">'+p.careerAssists+'</div><div class="lbl">生涯助攻</div></div>';
  html+='<div class="career-stat-box"><div class="val">'+p.careerAppearances+'</div><div class="lbl">总出场</div></div>';
  html+='<div class="career-stat-box"><div class="val">'+p.ovr+'</div><div class="lbl">最终总评</div></div>';
  html+='<div class="career-stat-box"><div class="val">'+p.internationalCaps+'</div><div class="lbl">国家队出场</div></div>';
  html+='<div class="career-stat-box"><div class="val">'+p.internationalGoals+'</div><div class="lbl">国家队进球</div></div>';
  html+='</div>';
  if(p.honors.length>0){
    html+='<div style="margin-top:16px"><div style="color:var(--volt);font-weight:800;margin-bottom:8px">荣誉墙</div>';
    p.honors.forEach(h=>{html+='<div class="trophy-item"><span class="t-ico"><span class="svg-icon">'+ICONS.trophy+'</span></span><span class="t-name">'+escapeHtml(h)+'</span></div>'});
    html+='</div>';
  }
  if(p.ovrHistory.length>0){
    html+='<div style="margin-top:16px"><div style="color:var(--volt);font-weight:800;margin-bottom:8px">成长曲线</div>';
    p.ovrHistory.forEach(h=>{
      html+='<div class="timeline-item"><span class="timeline-season">'+h.age+'岁</span><span>OVR '+h.ovr+'</span></div>';
    });
    html+='</div>';
  }
  if(p.careerLog.length>0){
    html+='<div style="margin-top:16px"><div style="color:var(--volt);font-weight:800;margin-bottom:8px">生涯大事记</div>';
    p.careerLog.slice(0,20).forEach(log=>{
      html+='<div class="timeline-item"><span class="timeline-season">'+(log.year||('S'+log.season))+'</span><span>'+escapeHtml(log.text)+'</span></div>';
    });
    html+='</div>';
  }
  html+='<button class="create-btn" style="margin-top:20px" onclick="location.reload()">重新开始</button>';
  html+='</div>';
  extra.innerHTML=html;
  setRetireBack('← 返回主菜单',exitToMainMenu);
}
// ============ 教练生涯（退役后剧情模式：梯队 → 助教 → 中超 → 豪门 → 国家队） ============
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
function setRetireBack(label,fn){
  const b=document.getElementById('retire-back');
  if(!b)return;
  b.textContent=label;
  b.onclick=fn;
  b.style.display='inline-block';
}
// ============ RENDERING ============
function attrColor(val){
  if(val>=85)return'#9fdc1f';
  if(val>=75)return'#4cc3ff';
  if(val>=65)return'#f0b23e';
  if(val>=50)return'#a8b3c4';
  return'#ff5b5f';
}
function updateGameHeader(){
  if(!game)return;
  updateCareerStage();
  const p=game.player;
  const leagueName=LEAGUES[p.league]?LEAGUES[p.league].name:p.league;
  const logoEl=document.getElementById('hdr-logo');
  if(logoEl&&typeof CFC_LOGO_DATA!=='undefined'&&!logoEl.src)logoEl.src=CFC_LOGO_DATA;
  const crestWrap=document.getElementById('hdr-crest-wrap');
  if(crestWrap)crestWrap.innerHTML=crestHTML('team',p.team,'crest-lg')+crestHTML('league',p.league,'crest');
  document.getElementById('hdr-name').textContent=p.name;
  document.getElementById('hdr-team').textContent=p.team+' · '+leagueName+(clubCity(p.team)&&clubCity(p.team)!==p.team?' · '+clubCity(p.team):'');
  const stageEl=document.getElementById('hdr-stage');
  if(stageEl){
    stageEl.textContent=getStageName(p.careerStage);
    stageEl.style.background=getStageColor(p.careerStage);
    stageEl.style.color=['u17','u19','u21','starter','legend'].includes(p.careerStage)?'#0d1119':'#f2f5fa';
  }
  document.getElementById('hdr-age').textContent=p.age;
  document.getElementById('hdr-ovr').textContent=p.ovr;
  document.getElementById('hdr-value').textContent=formatValue(p.marketValue);
  document.getElementById('hdr-season-chip').textContent='S'+p.season+' · '+seasonYear(p);
  renderRailSeason();
}
function renderRailSeason(){
  const el=document.getElementById('rail-season-val');
  const el2=document.getElementById('rail-season-age');
  if(!el)return;
  const p=game.player;
  el.textContent='S'+p.season;
  if(el2)el2.textContent=p.age+'岁 · '+seasonYear(p);
}
function renderGrowthView(){
  const p=game.player;
  const area=document.getElementById('view-growth');
  let html='<div class="view-head"><h2>球员成长</h2><span class="sub">潜力评价：'+potentialBand(p.potential)+'</span></div>';
  html+='<div class="growth-layout">';
  // FUT卡
  html+='<div>';
  html+='<div class="fut-card">';
  html+='<div class="fut-top">';
  html+='<div class="fut-ovr"><b>'+p.ovr+'</b><span>OVR</span></div>';
  html+='<div class="fut-id">';
  html+='<div class="fut-name">'+escapeHtml(p.name)+'</div>';
  html+='<div class="fut-pos-row"><span class="fut-pos">'+p.position+'</span><span class="fut-pos" style="background:var(--surface-3);border-color:var(--border-strong);color:var(--text-2)">'+getStageName(p.careerStage)+'</span></div>';
  html+='<div class="fut-meta"><b>'+p.team+'</b> · '+(LEAGUES[p.league]?LEAGUES[p.league].name:'')+'<br>'+p.age+'岁 · '+p.height+'cm · '+(p.preferredFoot==='right'?'右脚':'左脚')+'</div>';
  html+='</div>';
  html+='<div style="margin-left:auto">'+crestHTML('team',p.team,'crest crest-md')+'</div>';
  html+='</div>';
  html+='<div class="fut-stars">';
  html+='<div class="pair"><span class="stars-display">'+starRow(p.skillMoves)+'</span><small>花式</small></div>';
  html+='<div class="pair"><span class="stars-display">'+starRow(p.weakFoot)+'</span><small>逆足</small></div>';
  html+='<div class="pair"><span class="stars-display" style="color:var(--volt)">'+p.form+'/10</span><small>状态</small></div>';
  html+='</div>';
  html+='</div>';
  // 梯队晋升链
  html+='<div class="ladder" style="margin-top:18px">';
  html+='<h4>梯队晋升链</h4>';
  const idx=ladderIndex(p.careerStage);
  LADDER.forEach((l,i)=>{
    const cls=i<idx?'ladder-node done':i===idx?'ladder-node current':'ladder-node locked';
    html+='<div class="'+cls+'"><span class="ladder-ico">'+l.ico+'</span><span>'+l.name+'</span><span class="ladder-sub">'+l.desc+'</span></div>';
  });
  html+='</div>';
  // 国字号阶梯
  html+='<div class="ladder" style="margin-top:18px">';
  html+='<h4>国字号阶梯</h4>';
  const ntSteps=[
    {name:'U17国少队',done:!!p.flags.national_youth},
    {name:'U20国青队',done:!!p.flags.national_youth&&p.age>=18},
    {name:'U23国奥队',done:!!p.flags.olympic_goal},
    {name:'国家队',done:!!p.flags.nationalMember}
  ];
  ntSteps.forEach(s=>{
    const cls=s.done?'ladder-node done':p.flags.nationalMember||s.name==='U17国少队'?'ladder-node current':'ladder-node locked';
    html+='<div class="'+cls+'"><span class="ladder-ico">'+(s.done?'✓':'·')+'</span><span>'+s.name+'</span></div>';
  });
  html+='</div>';
  html+='</div>';
  // 属性
  html+='<div>';
  const snap=seasonSnapshot();
  html+='<div class="panel"><div class="panel-head"><h4>竞技状态</h4><span class="hint">状态与士气影响赛季数据</span></div>';
  html+='<div class="meter-label"><span>竞技状态</span><b>'+p.form+'/10</b></div><div class="form-bar"><div class="form-bar-fill" style="width:'+(p.form*10)+'%;background:'+attrColor(40+p.form*6)+'"></div></div>';
  html+='<div class="meter-label" style="margin-top:10px"><span>士气</span><b>'+p.morale+'/10</b></div><div class="morale-bar"><div class="morale-bar-fill" style="width:'+(p.morale*10)+'%;background:'+attrColor(40+p.morale*6)+'"></div></div>';
  html+='</div>';
  const cats=p.isGK?['GK']:['PAC','SHO','PAS','DRI','DEF','PHY'];
  cats.forEach(cat=>{
    const attrs=p.attributes[cat]||{};
    let sum=0,count=0;
    ALL_ATTRS[cat].forEach(a=>{sum+=attrs[a]||0;count++});
    const avg=count>0?Math.round(sum/count):0;
    html+='<div class="panel">';
    html+='<div class="panel-head"><h4>'+ATTR_LABELS[cat]+'</h4><span style="color:'+attrColor(avg)+';font-weight:800;font-size:1.1rem">'+avg+'</span></div>';
    ALL_ATTRS[cat].forEach(attr=>{
      const val=attrs[attr]||0;
      html+='<div class="attr-row">';
      html+='<span class="attr-name">'+ATTR_LABELS[attr]+'</span>';
      html+='<div class="attr-bar"><div class="attr-bar-fill" style="width:'+val+'%;background:'+attrColor(val)+'"></div></div>';
      html+='<span class="attr-val" style="color:'+attrColor(val)+'">'+val+'</span>';
      html+='</div>';
    });
    html+='</div>';
  });
  html+='<div class="panel"><div class="panel-head"><h4>合同</h4></div>';
  html+='<div class="attr-row"><span class="attr-name">年薪</span><div style="flex:1"></div><span class="attr-val">'+formatSalary(p.salary)+'</span></div>';
  html+='<div class="attr-row"><span class="attr-name">合同剩余</span><div style="flex:1"></div><span class="attr-val">'+(p.contractYears>0?p.contractYears+'年':'已到期')+'</span></div>';
  html+='</div>';
  html+='</div>';
  html+='</div>';
  area.innerHTML=html;
}
function renderStatsView(){
  const p=game.player;
  const area=document.getElementById('view-stats');
  const snap=seasonSnapshot();
  let html='<div class="view-head"><h2>赛季数据</h2><span class="sub">'+seasonYear(p)+'赛季 · '+p.team+'</span></div>';
  html+='<div class="stat-grid">';
  if(p.isGK){
    html+='<div class="stat-tile hot"><div class="stat-tile-val">'+snap.apps+'</div><div class="stat-tile-label">出场</div></div>';
    html+='<div class="stat-tile"><div class="stat-tile-val">'+snap.cleanSheets+'</div><div class="stat-tile-label">零封</div></div>';
    html+='<div class="stat-tile"><div class="stat-tile-val">'+snap.saves+'</div><div class="stat-tile-label">扑救</div></div>';
    html+='<div class="stat-tile"><div class="stat-tile-val">'+snap.conceded+'</div><div class="stat-tile-label">失球</div></div>';
    html+='<div class="stat-tile"><div class="stat-tile-val">'+snap.rating.toFixed(2)+'</div><div class="stat-tile-label">场均评分</div></div>';
    html+='<div class="stat-tile"><div class="stat-tile-val">'+snap.motm+'</div><div class="stat-tile-label">全场最佳</div></div>';
  }else{
    html+='<div class="stat-tile hot"><div class="stat-tile-val">'+snap.goals+'</div><div class="stat-tile-label">进球</div></div>';
    html+='<div class="stat-tile hot"><div class="stat-tile-val">'+snap.assists+'</div><div class="stat-tile-label">助攻</div></div>';
    html+='<div class="stat-tile"><div class="stat-tile-val">'+snap.apps+'</div><div class="stat-tile-label">出场</div></div>';
    html+='<div class="stat-tile"><div class="stat-tile-val">'+snap.rating.toFixed(2)+'</div><div class="stat-tile-label">场均评分</div></div>';
    html+='<div class="stat-tile"><div class="stat-tile-val">'+snap.motm+'</div><div class="stat-tile-label">全场最佳</div></div>';
    html+='<div class="stat-tile"><div class="stat-tile-val">'+snap.shots+'</div><div class="stat-tile-label">射门</div></div>';
    html+='<div class="stat-tile"><div class="stat-tile-val">'+snap.keyPasses+'</div><div class="stat-tile-label">关键传球</div></div>';
    html+='<div class="stat-tile"><div class="stat-tile-val">'+snap.tackles+'</div><div class="stat-tile-label">抢断</div></div>';
  }
  html+='</div>';
  // 生涯数据
  html+='<div class="panel" style="margin-top:20px"><div class="panel-head"><h4>生涯数据</h4><span class="hint">第'+p.season+'赛季</span></div>';
  html+='<div class="stat-grid">';
  html+='<div class="stat-tile"><div class="stat-tile-val">'+p.careerAppearances+'</div><div class="stat-tile-label">总出场</div></div>';
  html+='<div class="stat-tile"><div class="stat-tile-val">'+p.careerGoals+'</div><div class="stat-tile-label">总进球</div></div>';
  html+='<div class="stat-tile"><div class="stat-tile-val">'+p.careerAssists+'</div><div class="stat-tile-label">总助攻</div></div>';
  html+='<div class="stat-tile"><div class="stat-tile-val">'+p.internationalCaps+'</div><div class="stat-tile-label">国家队出场</div></div>';
  html+='<div class="stat-tile"><div class="stat-tile-val">'+p.internationalGoals+'</div><div class="stat-tile-label">国家队进球</div></div>';
  html+='<div class="stat-tile"><div class="stat-tile-val">'+p.ovr+'</div><div class="stat-tile-label">当前总评</div></div>';
  html+='</div></div>';
  // OVR曲线
  if(p.ovrHistory.length>1){
    const maxOvr=Math.max.apply(null,p.ovrHistory.map(h=>h.ovr).concat([90]));
    html+='<div class="panel" style="margin-top:20px"><div class="panel-head"><h4>总评成长曲线</h4><span class="hint">当前 '+p.ovr+' / 潜力 '+p.potential+'</span></div><div class="trend-list">';
    p.ovrHistory.forEach(h=>{
      const w=Math.round(h.ovr/maxOvr*100);
      html+='<div class="trend-item"><span>'+h.age+'岁</span><div class="trend-bar"><i style="width:'+w+'%"></i></div><b>'+h.ovr+'</b></div>';
    });
    html+='</div></div>';
  }
  area.innerHTML=html;
}
function renderHonorsView(){
  const p=game.player;
  const area=document.getElementById('view-honors');
  let html='<div class="view-head"><h2>荣誉殿堂</h2><span class="sub">共 '+p.honors.length+' 项荣誉</span></div>';
  if(p.honors.length===0){
    html+='<div class="empty-hint">荣誉墙还空着。<br>金靴、冠军、金球奖——都在前面的赛季里等你。</div>';
  }else{
    html+='<div class="trophy-list">';
    p.honors.forEach(h=>{
      html+='<div class="trophy-item"><span class="t-ico"><span class="svg-icon">'+ICONS.trophy+'</span></span><span class="t-name">'+escapeHtml(h)+'</span></div>';
    });
    html+='</div>';
  }
  area.innerHTML=html;
}
function renderLogView(){
  const p=game.player;
  const area=document.getElementById('view-log');
  let html='<div class="view-head"><h2>职业履历</h2><span class="sub">大事记 · 最新在前</span></div>';
  if(p.careerLog.length===0){
    html+='<div class="empty-hint">生涯从写下第一笔开始。</div>';
  }else{
    html+='<div class="timeline">';
    p.careerLog.forEach(log=>{
      html+='<div class="timeline-item"><span class="timeline-season">'+(log.year||('S'+log.season))+'</span><span>'+escapeHtml(log.text)+'</span></div>';
    });
    html+='</div>';
  }
  area.innerHTML=html;
}
// ============ THEME（浅色/深色） ============
function currentTheme(){
  return document.documentElement.getAttribute('data-theme')==='light'?'light':'dark';
}
function applyTheme(t){
  document.documentElement.setAttribute('data-theme',t);
  try{localStorage.setItem('fcs_theme',t)}catch(e){}
  updateThemeLabels();
}
function initTheme(){
  let t='dark';
  try{t=localStorage.getItem('fcs_theme')||'dark'}catch(e){}
  document.documentElement.setAttribute('data-theme',t==='light'?'light':'dark');
  updateThemeLabels();
}
function toggleTheme(){
  applyTheme(currentTheme()==='light'?'dark':'light');
  showToast(currentTheme()==='light'?'已切换到浅色主题':'已切换到深色主题');
}
function updateVersionLabels(){
  document.querySelectorAll('[data-version]').forEach(el=>{
    el.textContent=GAME_VERSION+' · 2026赛季版';
  });
  const mv=document.getElementById('menu-version');
  if(mv)mv.textContent='CFC '+GAME_VERSION;
}
function updateThemeLabels(){
  const t=currentTheme();
  document.querySelectorAll('[data-theme-label]').forEach(el=>{
    el.textContent=t==='light'?'切换深色主题':'切换浅色主题';
  });
}
function menuQuitApp(){
  toggleGameMenu();
  showConfirm('退出游戏','确定要退出 CFC 足球职业生涯模拟器吗？未保存的进度将回退到上次自动保存。',function(){
    // 桌面版（pywebview）：调用原生接口直接退出整个程序
    try{
      if(window.pywebview&&window.pywebview.api&&window.pywebview.api.quit){
        window.pywebview.api.quit();return;
      }
    }catch(e){}
    try{window.close()}catch(e){}
    if(!window.closed)showToast('浏览器模式下请直接关闭本标签页');
  });
}
// ============ INIT ============
document.addEventListener('DOMContentLoaded',function(){
  injectIcons();
  initTheme();
  updateVersionLabels();
  initStarRatings();
  // 填充青训俱乐部下拉框（按青训加成排序）
  const academySel=document.getElementById('player-academy');
  if(academySel){
    const clubs=ACADEMY_CLUBS.slice().sort((a,b)=>(ACADEMY_BONUS[b]||0)-(ACADEMY_BONUS[a]||0));
    clubs.forEach(c=>{
      const opt=document.createElement('option');
      opt.value=c;
      opt.textContent=c+'（青训评级 '+'★'.repeat(Math.max(1,ACADEMY_BONUS[c]||1))+'）';
      academySel.appendChild(opt);
    });
  }
  if(typeof CFC_LOGO_DATA!=='undefined'&&CFC_LOGO_DATA){
    const logoEl=document.getElementById('start-logo');
    if(logoEl)logoEl.src=CFC_LOGO_DATA;
    const markEl=document.getElementById('brand-mark');
    if(markEl)markEl.src=CFC_LOGO_DATA;
  }
  initSplash();
  const defaultPos=document.querySelector('.pos-btn[data-pos="ST"]');
  if(defaultPos){defaultPos.classList.add('selected');selectedPosition='ST'}
  document.addEventListener('keydown',function(e){
    if(e.ctrlKey&&(e.key==='s'||e.key==='S')){
      e.preventDefault();
      manualSave();
      return;
    }
    if(e.key==='Escape'){
      if(document.getElementById('confirm-overlay').classList.contains('active')){
        closeConfirm();
      }else if(document.getElementById('game-menu-overlay').classList.contains('active')){
        toggleGameMenu();
      }else if(document.getElementById('summary-modal').classList.contains('active')){
        // 结算窗口不允许 ESC 关闭，防止误触
      }else if(document.getElementById('game-screen').classList.contains('active')){
        toggleGameMenu();
      }
    }
  });
});
