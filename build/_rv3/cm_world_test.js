// V2.4.0 教练模式·走向世界 专项测试：世界扩容 / 老档迁移 / 海外邀约 / 执教欧洲 / 亚冠 / 欧冠
const fs=require('fs');
const path=require('path');

const elStub=()=>({
  innerHTML:'',textContent:'',value:'',style:{},dataset:{},
  classList:{add(){},remove(){},toggle(){},contains(){return false}},
  querySelector(){return elStub()},querySelectorAll(){return[]},
  appendChild(){},setAttribute(){},getAttribute(){return null},
  addEventListener(){},remove(){},focus(){},blur(){},click(){}
});
global.document={
  getElementById:()=>elStub(),
  querySelector:()=>elStub(),
  querySelectorAll:()=>[],
  addEventListener(){},
  createElement:()=>elStub(),
  body:elStub(),
  documentElement:{setAttribute(){},getAttribute(){return 'dark'}},
  activeElement:null
};
global.window={Capacitor:null,scrollTo(){}};
global.localStorage={_d:{},getItem(k){return this._d[k]||null},setItem(k,v){this._d[k]=v},removeItem(k){delete this._d[k]}};
global.navigator={userAgent:'smoke'};
global.location={reload(){global.__reloaded=true}};
global.requestAnimationFrame=f=>f();

const html=fs.readFileSync(path.join(__dirname,'..','..','football-career-simulator.html'),'utf-8');
const start=html.indexOf('<script>')+8;
const end=html.lastIndexOf('</script>');
const js=html.slice(start,end);
const vm=require('vm');
vm.runInThisContext(js+`;
;globalThis.__cm={
  get cgame(){return cgame}, set cgame(v){cgame=v},
  get cmMatch(){return cmMatch}, set cmMatch(v){cmMatch=v},
  get cmSelTok(){return cmSelTok}, set cmSelTok(v){cmSelTok=v},
  get cmSelBench(){return cmSelBench}, set cmSelBench(v){cmSelBench=v}
};`);

let passed=0,failed=0;
function ok(cond,msg){
  if(cond){passed++;}
  else{failed++;console.log('  [FAIL] '+msg);}
}
function section(t){console.log('== '+t)}

// ------- 通用：打一场当前待赛比赛（含事件/快速模拟/结算） -------
function playOne(){
  cmPlayNext();
  if(!__cm.cmMatch)return false;
  if(__cm.cmMatch.phase==='event')cmEventChoice(0);
  if(__cm.cmMatch.phase!=='pre')return false;
  cmQuickSim();
  if(__cm.cmMatch.phase!=='ft')return false;
  cmMatchDone();
  cmPostClose();
  return true;
}
// ------- 通用：洲际赛全程打完（强制 pending） -------
function playContToWinner(compKey){
  const g=__cm.cgame;let guard=0,played=0;
  while(guard++<40){
    const comp=g.season[compKey];
    if(!comp||comp.winner)break;
    if(comp.eliminated&&!comp.winner){ok(false,compKey+' 被淘汰但无 winner');break}
    cmContPrepareStage(comp);
    comp.pending=true;
    const before=comp.myTrail.length;
    if(!playOne()){ok(false,compKey+' 第'+(played+1)+'场待赛比赛无法进行');break}
    played++;
    if(comp.myTrail.length===before){ok(false,compKey+' 打完一场但轨迹未增长');break}
  }
  const comp=g.season?g.season[compKey]:null;
  return{comp:comp,played:played};
}

// 赛季结算并推进休赛期：留任；若下课则接一份回聘邀约（保证世界时钟推进）
function endSeasonAndAdvance(rejoinTeam,rejoinLgKey){
  cmSeasonEnd();
  cmSettleNext();
  if(__cm.cgame.club){cmOfferStay();return}
  __cm.cmMatch.offers=[{team:rejoinTeam,lgKey:rejoinLgKey,desc:'回聘'}];
  cmOfferJoin(0);
}

// ================= 1. 世界生成 =================
section('世界生成（欧洲+亚洲联赛阵容）');
cmCreateGame({team:'梅州客家',lgKey:'CL1',rep:40},'世界测试教练');
ok(!!__cm.cgame,'建档成功');
const squadKeys=Object.keys(__cm.cgame.world.squads);
ok(squadKeys.length===236,'236 支球队阵容（28中国+全球联赛+填充，实际 '+squadKeys.length+'）');
CM_WORLD_LEAGUES.forEach(k=>{
  const okLg=Array.isArray(__cm.cgame.world.leagues[k])&&__cm.cgame.world.leagues[k].length===LEAGUES[k].teams.length;
  if(!okLg)ok(false,'world.leagues.'+k+' 缺失或数量不符');
});
ok(CM_WORLD_LEAGUES.every(k=>Array.isArray(__cm.cgame.world.leagues[k])),'world.leagues 含全部 11 个海外联赛');
const mcSq=cmSquadOf('曼城');
ok(mcSq.length===22,'曼城 22 人');
ok(mcSq.some(p=>p.name==='哈兰德')&&mcSq.some(p=>p.name==='福登'),'曼城真名球星');
const rmSq=cmSquadOf('皇家马德里');
ok(rmSq.some(p=>p.name==='姆巴佩'),'皇马真名球星');
const hld=mcSq.find(p=>p.name==='哈兰德');
ok(hld&&hld.ovr>=84,'哈兰德 OVR '+((hld&&hld.ovr)||0));
ok(hld&&hld.wage>=300&&hld.wage<=2400,'哈兰德年薪在欧洲档 '+((hld&&hld.wage)||0));
ok(mcSq.every(p=>p.lg==='EPL'),'曼城球员 lg=EPL');
ok(cmSquadOf('浦和红钻').some(p=>p.nat==='JP'),'J1 本土名池生效');
ok(cmSquadOf('蔚山HD').some(p=>p.nat==='KR'),'K1 本土名池生效');
ok(cmSquadOf('利雅得新月').every(p=>p.lg==='SAU'),'沙特球员 lg=SAU');
ok(cmSquadOf('武里南联').length>=18&&cmSquadOf('悉尼FC').length>=18,'亚冠填充队（泰国/澳大利亚）有阵容');
// 全库 id 唯一
{
  const ids=new Set();let dup=0;
  Object.values(__cm.cgame.world.squads).forEach(sq=>sq.forEach(p=>{if(ids.has(p.id))dup++;ids.add(p.id)}));
  __cm.cgame.world.freeAgents.forEach(p=>{if(ids.has(p.id))dup++;ids.add(p.id)});
  ok(dup===0,'全库球员 id 唯一（重复 '+dup+'）');
}
const jsonLen=JSON.stringify(__cm.cgame).length;
ok(jsonLen>150000&&jsonLen<1500000,'存档体积合理 '+Math.round(jsonLen/1024)+'KB');
ok(cmTeamLeague('曼城')==='EPL'&&cmTeamLeague('巴黎圣日耳曼')==='LIGUE_1'&&cmTeamLeague('萨德')==='QAT'&&cmTeamLeague('武里南联')==='ETH','cmTeamLeague 全联赛识别');
ok(cmWageCap('EPL')===2400&&cmWageCap('CL1')===130,'年薪档常量');

// ================= 2. 老档迁移 =================
section('老档迁移（V2.3 档惰性补生成海外世界）');
{
  const old=JSON.parse(JSON.stringify(__cm.cgame));
  CM_WORLD_LEAGUES.forEach(k=>{delete old.world.leagues[k]});
  CM_WORLD_LEAGUES.forEach(k=>LEAGUES[k].teams.forEach(t=>{delete old.world.squads[t]}));
  delete old.world.squads['武里南联'];delete old.world.squads['悉尼FC'];
  delete old.contHistory;
  // 模拟老档 nextId：取剩余球员最大 id
  let maxId=0;
  Object.values(old.world.squads).forEach(sq=>sq.forEach(p=>{if(p.id>maxId)maxId=p.id}));
  old.world.freeAgents.forEach(p=>{if(p.id>maxId)maxId=p.id});
  old.world.nextId=maxId;
  __cm.cgame=null; // 证明迁移不依赖活动会话
  const m=cmMigrateSave(old);
  ok(m&&m.world.leagues.EPL.length===12,'迁移后 EPL 联赛键补齐');
  ok(CM_WORLD_LEAGUES.every(k=>Array.isArray(m.world.leagues[k])),'迁移后全部海外联赛键补齐');
  ok(Object.keys(m.world.squads).length===236,'迁移后 236 支阵容（实际 '+Object.keys(m.world.squads).length+'）');
  ok(m.world.squads['曼城'].some(p=>p.name==='哈兰德'),'迁移后曼城球星就位');
  ok(m.world.squads['武里南联'].length>=18,'迁移后亚冠填充队补齐');
  ok(Array.isArray(m.contHistory),'contHistory 容错补齐');
  ok(m.club&&m.club.team==='梅州客家','迁移不破坏俱乐部归属');
  const ids=new Set();let dup=0;
  Object.values(m.world.squads).forEach(sq=>sq.forEach(p=>{if(ids.has(p.id))dup++;ids.add(p.id)}));
  m.world.freeAgents.forEach(p=>{if(ids.has(p.id))dup++;ids.add(p.id)});
  ok(dup===0,'迁移后 id 无冲突（重复 '+dup+'）');
  ok(m.world.nextId>maxId,'nextId 前移不回退');
  // 幂等：再迁移一次零变化
  const before=JSON.stringify(m.world.squads['曼城'].map(p=>p.id));
  cmMigrateSave(m);
  ok(JSON.stringify(m.world.squads['曼城'].map(p=>p.id))===before,'重复迁移幂等');
  __cm.cgame=m; // 恢复会话（迁移后继续用）
}

// ================= 3. 海外邀约门槛 =================
section('海外邀约门槛（rep 72/80/88 三档）');
__cm.cgame.slot=__cm.cgame.slot||0;
__cm.cgame.club=__cm.cgame.club||{team:'梅州客家',leagueKey:'CL1',morale:6,budget:1000,wageBudget:500,lineup:null,bench:[]};
{
  __cm.cgame.coach.rep=60;
  let overseas=0,guard=0;
  for(let i=0;i<25;i++){cmGenJobOffers(true).forEach(o=>{if(!['CSL','CL1'].includes(o.lgKey))overseas++})}
  ok(overseas===0,'rep60 无海外邀约（出现 '+overseas+'）');
  __cm.cgame.coach.rep=85;
  let seenOverseas=0,seenGiant=0,descOk=true;
  for(let i=0;i<40;i++){
    cmGenJobOffers(true).forEach(o=>{
      if(!['CSL','CL1'].includes(o.lgKey))seenOverseas++;
      if((CM_TEAM_BASE[o.team]||0)>=84)seenGiant++;
      if(o.desc.indexOf('·')<0)descOk=false;
    });
  }
  ok(seenOverseas>0,'rep85 有海外邀约（'+seenOverseas+' 个）');
  ok(seenGiant===0,'rep85 豪门仍被门槛挡住（'+seenGiant+' 个）');
  ok(descOk,'邀约卡描述含联赛/国家信息');
  __cm.cgame.coach.rep=92;
  let giant=0;
  for(let i=0;i<60;i++){cmGenJobOffers(true).forEach(o=>{if((CM_TEAM_BASE[o.team]||0)>=84)giant++})}
  ok(giant>0,'rep92 能收到豪门邀约（'+giant+' 个）');
  // 双向：欧洲声望下中超豪门仍在邀约池
  let cslGiant=0;
  for(let i=0;i<60;i++){cmGenJobOffers(true).forEach(o=>{if(o.lgKey==='CSL'&&cmSquadStrength(o.team)>=72)cslGiant++})}
  ok(cslGiant>0,'欧洲声望可回流中超豪门邀约（'+cslGiant+' 个）');
}

// ================= 4. 执教欧洲 =================
section('执教欧洲（跳槽切尔西 → 赛季结构 → 欧洲杯赛）');
__cm.cgame.coach.rep=85;
cmOffseasonAdvance({team:'切尔西',lgKey:'EPL'});
ok(__cm.cgame.club.team==='切尔西'&&__cm.cgame.club.leagueKey==='EPL','执教切尔西（英超）');
ok(__cm.cgame.season.fixtures.length===22,'英超 22 轮（12队双循环）');
ok(Object.keys(__cm.cgame.season.table).length===12,'英超积分榜 12 队');
ok(__cm.cgame.season.cup.name==='足总杯','英格兰杯赛名（足总杯）');
ok(__cm.cgame.season.cup.stages.length===4,'欧式杯赛 4 阶段');
ok(__cm.cgame.season.cup.alive.length===16,'欧式杯赛 16 队参赛池');
ok(__cm.cgame.season.cup.boundaries.join(',')==='4,8,12,16','欧式杯赛边界 '+__cm.cgame.season.cup.boundaries.join(','));
ok(__cm.cgame.season.objective.desc.indexOf('欧战区')>=0||__cm.cgame.season.objective.desc.indexOf('冠军')>=0,'欧洲赛季目标：'+__cm.cgame.season.objective.desc);
ok(__cm.cgame.club.budget>=20000,'欧洲 tier1 预算档 '+__cm.cgame.club.budget);
ok(__cm.cgame.season.acl===null&&__cm.cgame.season.ucl===null,'无资历首季无洲际赛');
ok(cmBaseBudget('J1',1,50)>3000&&cmBaseBudget('SAU',1,50)>cmBaseBudget('J1',1,50),'亚洲联赛预算档');
// 打 6 轮联赛（第4轮后足总杯边界触发）
{
  const g=__cm.cgame;let guard=0;
  while(g.season.round<6&&guard++<30){
    if(g.season.winOpen)cmCloseWindow(true);
    const fx=cmNextFixtureInfo();
    if(fx.type==='none')break;
    if(!playOne()){ok(false,'欧洲赛季第'+(g.season.round+1)+'轮比赛无法进行');break}
  }
  ok(g.season.round>=6,'英超完成 6 轮（实际 '+g.season.round+'）');
  let sumP=0;Object.values(g.season.table).forEach(r=>sumP+=r.p);
  ok(sumP===g.season.round*12,'英超积分榜记账一致（Σ队场次='+sumP+'）');
  const cp=g.season.cup;
  ok(cp.pairs&&cp.pairs.length===Math.pow(2,cp.stages.length-1-cp.stageIdx),'足总杯对阵数与阶段一致（stageIdx='+cp.stageIdx+' pairs='+(cp.pairs&&cp.pairs.length)+'）');
  ok(cp.stageIdx>=1||cp.pending||cp.winner,'足总杯边界触发推进（stageIdx='+cp.stageIdx+'）');
}

// ================= 5. 亚冠精英赛 =================
section('亚冠精英赛（8队单循环7轮 → 半决赛/决赛）');
cmCreateGame({team:'上海海港',lgKey:'CSL',rep:44},'亚冠测试教练');
__cm.cgame.slot=0;
__cm.cgame._lastSeason={year:2025,leagueKey:'CSL',team:'上海海港',rank:1,champion:true,cupWinner:'上海海港'};
cmNewSeason();
{
  const acl=__cm.cgame.season.acl;
  ok(!!acl,'获得亚冠参赛资格');
  ok(acl.teams.length===8,'亚冠 8 队');
  ok(acl.teams.includes('上海海港')&&acl.teams.includes('武里南联')&&acl.teams.includes('悉尼FC'),'中超/泰国/澳大利亚队就位');
  ok(acl.fixtures.length===7&&acl.fixtures.every(rd=>rd.length===4),'单循环 7 轮 × 4 场');
  ok(Object.keys(acl.table).length===8,'亚冠积分榜 8 队');
  ok(acl.stages.length===9&&acl.stages[7]==='半决赛'&&acl.stages[8]==='决赛','阶段标签 7小组+半决赛+决赛');
  ok(acl.boundaries.length===9&&acl.boundaries.every((b,i)=>i===0||b>acl.boundaries[i-1])&&acl.boundaries[8]<=29,'边界严格递增且不超 30 轮');
  ok(__cm.cgame.season.news.some(n=>n.t.indexOf('亚冠精英赛抽签')>=0),'抽签新闻播报');
  const r=playContToWinner('acl');
  ok(r.comp&&r.comp.winner,'亚冠产生冠军：'+(r.comp&&r.comp.winner));
  ok(r.comp.myTrail.length>=7,'我队亚冠出场 ≥7 场（实际 '+r.comp.myTrail.length+'）');
  if(r.comp.winner==='上海海港'){
    ok(__cm.cgame.coach.honors.some(h=>h.indexOf('亚冠精英赛冠军')>=0),'亚冠冠军荣誉入墙');
  }
  ok(Array.isArray(__cm.cgame.contHistory),'洲际冠军史已记录');
}

// ================= 6. 欧冠 =================
section('欧冠（32队瑞士轮4轮 → 淘汰赛至决赛）');
cmCreateGame({team:'切尔西',lgKey:'EPL',rep:60},'欧冠测试教练');
__cm.cgame.slot=0;
__cm.cgame._lastSeason={year:2025,leagueKey:'EPL',team:'切尔西',rank:2,champion:false,cupWinner:null};
cmNewSeason();
{
  const ucl=__cm.cgame.season.ucl;
  ok(!!ucl,'英超前4获得欧冠资格');
  ok(ucl.teams.length===32&&ucl.teams.includes('切尔西'),'欧冠 32 队含我队');
  ok(ucl.groupRounds===4&&ucl.stages.length===8,'4轮小组+4轮淘汰=8阶段');
  ok(Object.keys(ucl.table).length===32,'瑞士轮积分榜 32 队');
  ok(ucl.boundaries.length===8&&ucl.boundaries.every((b,i)=>i===0||b>ucl.boundaries[i-1])&&ucl.boundaries[7]<=21,'欧冠边界递增且 ≤21 轮');
  ok(ucl.fixtures.length===0,'欧冠瑞士轮按轮生成（惰性）');
  const r=playContToWinner('ucl');
  ok(r.comp&&r.comp.winner,'欧冠产生冠军：'+(r.comp&&r.comp.winner));
  ok(r.comp.myTrail.length>=4,'我队欧冠出场 ≥4 场（实际 '+r.comp.myTrail.length+'）');
  if(r.comp.winner==='切尔西'){
    ok(__cm.cgame.coach.honors.some(h=>h.indexOf('欧冠冠军')>=0),'欧冠冠军荣誉入墙');
  }
  // 小组赛首轮在触发时已按实力配对生成
  ok(ucl.fixtures[0]&&ucl.fixtures[0].length===16,'瑞士轮首轮 16 场');
  // 资格否定性用例：rank>4 无欧冠；中甲永无洲际赛
  __cm.cgame._lastSeason={year:2025,leagueKey:'EPL',team:'切尔西',rank:6,champion:false,cupWinner:null};
  cmNewSeason();
  ok(__cm.cgame.season.ucl===null,'上季第6名无缘欧冠');
  ok(__cm.cgame.season.acl===null,'英超球队无亚冠');
}

// ================= 7. 完整中超赛季 + 亚冠（自然边界触发） =================
section('完整中超赛季+亚冠（自然边界）');
cmCreateGame({team:'上海海港',lgKey:'CSL',rep:44},'全季测试教练');
__cm.cgame.slot=0;
__cm.cgame._lastSeason={year:2025,leagueKey:'CSL',team:'上海海港',rank:1,champion:true,cupWinner:'上海海港'};
cmNewSeason();
{
  const g=__cm.cgame;let guard=0;
  ok(g.season.acl,'本季有亚冠');
  while(!cmSeasonComplete()&&guard++<120){
    if(g.season.winOpen)cmCloseWindow(true);
    if(!playOne()){ok(false,'全季停滞：round='+g.season.round+' acl='+JSON.stringify({i:g.season.acl.stageIdx,p:g.season.acl.pending,e:g.season.acl.eliminated,w:g.season.acl.winner}));break}
  }
  ok(cmSeasonComplete(),'中超全季完成（联赛+足协杯+亚冠，guard='+guard+'）');
  const acl=g.season.acl;
  ok(acl.winner,'亚冠冠军已产生：'+acl.winner);
  ok(acl.myTrail.length===7+2||acl.myTrail.length===7+1||acl.eliminated&&acl.myTrail.length>=7,'亚冠轨迹合理（'+acl.myTrail.length+' 场）');
  ok(g.season.round===30&&g.season.cup.winner,'联赛 30 轮 + 杯赛冠军：'+g.season.cup.winner);
  cmSeasonEnd();
  ok(__cm.cmMatch&&__cm.cmMatch.phase==='settle','进入结算');
  ok(g.coach.log.length&&g.coach.log[g.coach.log.length-1].text.indexOf('执教上海海港')===0,'履历写入');
  cmSettleNext();
  ok(__cm.cmMatch.phase==='offers','进入休赛期');
  endSeasonAndAdvance('上海海港','CSL');
  ok(g.season&&g.season.year===2027&&g.world.year===2027,'休赛期后进入 2027 赛季');
  const ls7=g._lastSeason;
  ok(ls7&&ls7.year===2026&&ls7.team==='上海海港','_lastSeason 记录 2026 赛季');
  ok(!!g.season.acl===(ls7.rank<=2||ls7.cupWinner==='上海海港'),'亚冠资格与上季成绩一致（rank='+ls7.rank+' cup='+ls7.cupWinner+'）');
}

// ================= 8. 完整英超赛季 + 欧冠（自然边界触发） =================
section('完整英超赛季+欧冠（自然边界）');
{
  const g=__cm.cgame;
  // 当前已在 2027 赛季（上海海港）。跳槽切尔西：
  g.coach.rep=90;
  cmOffseasonAdvance({team:'切尔西',lgKey:'EPL'});
  ok(g.club.team==='切尔西'&&g.season.year===2028,'2028 赛季执教切尔西');
  ok(g.season.ucl===null,'刚到队上季成绩不属于英超 → 首季无欧冠');
  g._lastSeason={year:2027,leagueKey:'EPL',team:'切尔西',rank:2,champion:false,cupWinner:null};
  cmNewSeason();
  ok(g.season.ucl,'获得欧冠资格');
  let guard=0;
  while(!cmSeasonComplete()&&guard++<120){
    if(g.season.winOpen)cmCloseWindow(true);
    if(!playOne()){ok(false,'欧洲全季停滞：round='+g.season.round+' ucl='+JSON.stringify({i:g.season.ucl.stageIdx,p:g.season.ucl.pending,e:g.season.ucl.eliminated,w:g.season.ucl.winner}));break}
  }
  ok(cmSeasonComplete(),'英超全季完成（联赛+足总杯+欧冠，guard='+guard+'）');
  const ucl=g.season.ucl;
  ok(ucl.winner,'欧冠冠军已产生：'+ucl.winner);
  ok(g.season.round===22&&g.season.cup.winner,'英超 22 轮 + 足总杯冠军：'+g.season.cup.winner);
  cmSeasonEnd();
  ok(g._lastSeason.year===2028&&g._lastSeason.leagueKey==='EPL','_lastSeason 记录 2028 赛季');
  cmSettleNext();
  endSeasonAndAdvance('切尔西','EPL');
  ok(g.season&&g.season.year===2029,'休赛期后进入 2029 赛季（英超无升降级守卫不报错）');
  ok(!!g.season.ucl===(g._lastSeason.rank<=4),'欧冠资格与上季排名一致（rank='+g._lastSeason.rank+'）');
  // 回流：欧洲名帅收到中超邀约
  g.coach.rep=95;
  let cslOffer=0;
  for(let i=0;i<40;i++){cmGenJobOffers(true).forEach(o=>{if(o.lgKey==='CSL')cslOffer++})}
  ok(cslOffer>0,'欧洲执教后仍可收中超邀约（'+cslOffer+' 个）');
}

// ================= 9. 存档往返 =================
section('存档往返');
ok(cSaveGame(3),'保存');
__cm.cgame=null;
const ld=cLoadGame(3);
ok(ld&&ld.world.leagues.EPL,'读档后海外世界完整');
__cm.cgame=ld;

console.log('\n结果: '+passed+' 通过, '+failed+' 失败');
process.exit(failed?1:0);
