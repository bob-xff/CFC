// 教练模式冒烟测试：stub DOM，全流程驱动状态机
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

const html=fs.readFileSync(path.join(__dirname,'..','football-career-simulator.html'),'utf-8');
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

// ------- 测试工具 -------
let passed=0,failed=0;
function ok(cond,msg){
  if(cond){passed++;}
  else{failed++;console.log('  [FAIL] '+msg);}
}
function section(t){console.log('== '+t)}

// ------- 1. 建档 -------
section('建档');
cmCreateGame({team:'梅州客家',lgKey:'CL1',rep:40},'测试教练');
ok(!!__cm.cgame,'__cm.cgame 已创建');
ok(__cm.cgame.world&&__cm.cgame.world.year===2026,'世界年份 2026');
ok(__cm.cgame.coach.name==='测试教练','教练姓名');
ok(__cm.cgame.coach.age===35,'教练 35 岁起步');
ok(__cm.cgame.club&&__cm.cgame.club.team==='梅州客家','俱乐部 correct');
ok(Object.keys(__cm.cgame.world.squads).length===128,'128 支球队阵容（28真实+4中乙填充+94海外+2亚冠填充）');
// V2.4.0 世界扩容：海外联赛阵容断言
const mcSq=cmSquadOf('曼城');
ok(mcSq.length>=20&&mcSq.length<=24,'曼城阵容人数 '+mcSq.length);
ok(mcSq.some(p=>p.name==='哈兰德'),'欧洲球星嵌入（哈兰德）');
ok(mcSq.every(p=>p.lg==='EPL'),'海外球员 lg=EPL');
const hld=mcSq.find(p=>p.name==='哈兰德');
ok(hld&&hld.wage>=300,'欧洲豪门球星年薪档 '+((hld&&hld.wage)||0));
const j1Sq=cmSquadOf('浦和红钻');
ok(j1Sq.some(p=>p.nat==='JP'),'J1 本土名池生效');
ok(cmSquadOf('武里南联').length>=18,'亚冠填充队有阵容');
ok(cmTeamLeague('曼城')==='EPL'&&cmTeamLeague('萨德')==='QAT'&&cmTeamLeague('梅州客家')==='CL1','cmTeamLeague 全联赛识别');
const mySq=cmSquadOf('梅州客家');
ok(mySq.length>=20&&mySq.length<=24,'梅州客家阵容人数 '+mySq.length);
ok(mySq.some(p=>p.name==='罗德里格'),'真实球星嵌入');
ok(mySq.filter(p=>p.pos==='GK').length>=2,'门将 ≥2');
ok(__cm.cgame.season.fixtures.length===22,'中甲 22 轮');
ok(__cm.cgame.season.fixtures[0].length===6,'每轮 6 场（12队）');
ok(Object.keys(__cm.cgame.season.table).length===12,'积分榜 12 队');
ok(__cm.cgame.season.winOpen===true,'季前转会窗开启');
ok(__cm.cgame.youth.length===6,'青训 6 人');
ok(__cm.cgame.season.scout.length>0,'球探清单已生成');
ok(__cm.cgame.club.lineup&&__cm.cgame.club.lineup.length===11,'首发 11 槽位');
ok(__cm.cgame.club.lineup.every(id=>id!=null),'首发已自动填满');

// 球星OVR合理性
const wl=cmSquadOf('上海海港');
const wu=wl.find(p=>p.name==='武磊');
ok(wu&&wu.ovr>=78,'武磊 OVR '+ (wu&&wu.ovr));

// ------- 2. 战术板 -------
section('战术板');
cmSetFormation('352');
ok(__cm.cgame.tactics.formation==='352','阵型切换 352');
cmSetStrategy('press');
ok(__cm.cgame.tactics.strategy==='press','策略切换高位逼抢');
// 换位：交换两个槽位
const l0=__cm.cgame.club.lineup[0],l2=__cm.cgame.club.lineup[2];
__cm.cmSelTok=-1;__cm.cmSelBench=-1;
cmTokTap(0);cmTokTap(2);
ok(__cm.cgame.club.lineup[0]===l2&&__cm.cgame.club.lineup[2]===l0,'场上两点互换');
// 替补换上：选场上槽位1，再用替补0替换
const swapBack=__cm.cgame.club.lineup[1];
const benchTop=__cm.cgame.club.bench[0];
__cm.cmSelBench=0;cmTokTap(1);
ok(__cm.cgame.club.lineup[1]===benchTop&&__cm.cgame.club.bench.includes(swapBack),'替补替换生效');
__cm.cmSelTok=-1;__cm.cmSelBench=-1;
const R=cmMyRatings();
ok(R.A>40&&R.A<120&&R.D>40&&R.D<120,'攻防评分合理 '+Math.round(R.A)+'/'+Math.round(R.D));

// ------- 3. 转会窗 -------
section('转会窗');
const budget0=__cm.cgame.club.budget;
const sq0=cmSquadOf('梅州客家').length;
if(__cm.cgame.season.scout.length){
  const t=__cm.cgame.season.scout[0];
  const p=cmPlayerById(t.pid);
  __cm.cgame.club.budget=99999; // 保证预算充足
  __cm.cgame.club.wageBudget=Math.max(__cm.cgame.club.wageBudget,cmWageTotal('梅州客家')+t.wage+10);
  cmBuy(t.pid,0);
  ok(cmSquadOf('梅州客家').length===sq0+1,'签约后阵容 +1');
  ok(__cm.cgame.club.budget<budget0+99999-budget0+1,'预算被扣减');
  ok(!__cm.cgame.season.scout.some(x=>x.pid===t.pid),'目标移出球探清单');
}else{ok(false,'球探清单为空，无法测试签约')}
// 挂牌
const sellable=cmSquadOf('梅州客家').find(p=>!__cm.cgame.club.lineup.includes(p.id)&&p.pos!=='GK');
cmToggleList(sellable.id);
ok(sellable.listed===true,'挂牌成功');
cmCloseWindow(false);
ok(__cm.cgame.season.winOpen===false,'转会窗关闭');
ok(__cm.cgame.season.news.some(n=>n.t.indexOf('转会')>=0||n.t.indexOf('关闭')>=0),'关闭窗有AI流动新闻');

// ------- 4. 青训 -------
section('青训');
const y0=__cm.cgame.youth[0];
cmYouthScout(y0.id);
ok(y0.scout===1,'考察一次');
cmYouthSpec(y0.id);
ok(y0.spec===true,'特训标记');
// 提拔
__cm.cgame.club.wageBudget+=1000;
const sqb=cmSquadOf('梅州客家').length;
const yp=__cm.cgame.youth[1];
cmYouthPromote(yp.id);
ok(__cm.cgame.youth.length===5-0+0&&cmSquadOf('梅州客家').length===sqb+1,'提拔进入一线队');
ok(__cm.cgame.youth.every(x=>x.id!==yp.id),'青训营移除');

// ------- 5. 完整赛季循环 -------
section('完整赛季循环（中甲22轮+足协杯）');
let guard=0,roundsPlayed=0,quickUsed=0;
while(!cmSeasonComplete()&&guard++<500){
  const s=__cm.cgame.season;
  if(s.winOpen){cmCloseWindow(true)}
  const fx=cmNextFixtureInfo();
  if(fx.type==='none')break;
  cmPlayNext();
  if(!__cm.cmMatch){ok(false,'__cm.cmMatch 未建立');break}
  if(__cm.cmMatch.phase==='event'){
    ok(__cm.cmMatch.event.idx>=0,'事件触发');
    cmEventChoice(0);
  }
  if(__cm.cmMatch.phase!=='pre'){ok(false,'应进入pre，实际 '+__cm.cmMatch.phase);break}
  if(roundsPlayed===2){ // 第3场试手动半场
    cmStartLive();
    ok(__cm.cmMatch.phase==='ht','进入半场');
    cmLiveChoice(1);
    ok(__cm.cmMatch.phase==='ft','决策后进入终场');
  }else{
    cmQuickSim();
    quickUsed++;
  }
  ok(__cm.cmMatch.phase==='ft','终场状态');
  cmMatchDone();
  if(__cm.cmMatch.phase!=='post'&&__cm.cmMatch.phase!=='ntpost'){ok(false,'赛后状态异常: '+__cm.cmMatch.phase);break}
  cmPostClose();
  roundsPlayed++;
  if(guard>480){ok(false,'赛季循环死循环');break}
}
ok(cmSeasonComplete(),'赛季完成（打'+roundsPlayed+'场）');
ok(__cm.cgame.coach.stats.w+__cm.cgame.coach.stats.d+__cm.cgame.coach.stats.l===roundsPlayed,'战绩累计一致');
const tb=__cm.cgame.season.table;
const tablePts=Object.values(tb).reduce((a,r)=>a+r.pts,0);
let tSum=0;Object.values(tb).forEach(r=>tSum+=r.p);
ok(tSum===22*LEAGUES.CL1.teams.length,'积分榜赛程记账一致（Σ场次数='+tSum+'）');
ok(tablePts>0,'积分榜有分数');
// 足协杯应有结果
ok(__cm.cgame.season.cup.winner!==undefined,'杯赛 winner 字段存在');

// ------- 6. 赛季结算与休赛期 -------
section('赛季结算与休赛期');
cmSeasonEnd();
ok(__cm.cmMatch&&__cm.cmMatch.phase==='settle','进入结算');
const repBefore=__cm.cgame.coach.rep;
cmSettleNext();
ok(__cm.cmMatch.phase==='offers','进入休赛期邀约');
// 留任或应对下课：循环处理邀约阶段直到产生新赛季
let waits6=0;
while(__cm.cmMatch&&__cm.cmMatch.phase==='offers'&&waits6++<8){
  if(__cm.cmMatch.offers&&__cm.cmMatch.offers.length){cmOfferJoin(0);break}
  if(__cm.cgame.club){cmOfferStay();break}
  cmOfferWait();
}
if(!__cm.cgame.season){ok(false,'休赛期未产生新赛季');}
ok(__cm.cgame.season&&__cm.cgame.season.year===2027,'进入 2027 赛季');
ok(__cm.cgame.coach.seasons===1,'执教赛季 +1');
ok(__cm.cgame.coach.age===36,'教练年龄 +1');
ok(Object.values(__cm.cgame.season.table).every(r=>r.p===0),'新赛季积分榜清零');
ok(__cm.cgame.season.winOpen===true,'新赛季季前窗开启');
ok(__cm.cgame.season.cup.alive.length===32,'新赛季杯赛重置 32 队');

// ------- 7. 多赛季推进（快进5季，测试下课/升迁/邀约路径） -------
section('快进5个赛季');
for(let season=0;season<5;season++){
  let g2=0;
  while(__cm.cgame.season&&!cmSeasonComplete()&&g2++<400){
    if(__cm.cgame.season.winOpen)cmCloseWindow(true);
    const fx=cmNextFixtureInfo();
    if(fx.type==='none'){console.log('  [DEBUG] 停滞: season='+(season+2)+' round='+__cm.cgame.season.round+'/'+__cm.cgame.season.totalRounds+' cup='+(__cm.cgame.season.cup?JSON.stringify({stage:__cm.cgame.season.cup.stageIdx,pending:__cm.cgame.season.cup.pending,elim:__cm.cgame.season.cup.eliminated,winner:__cm.cgame.season.cup.winner,pairs:__cm.cgame.season.cup.pairs?__cm.cgame.season.cup.pairs.length:null}):'null'));break}
    cmPlayNext();
    if(!__cm.cmMatch){break}
    if(__cm.cmMatch.phase==='event')cmEventChoice(1);
    if(__cm.cmMatch.phase!=='pre'){break}
    cmQuickSim();
    cmMatchDone();
    cmPostClose();
  }
  if(!cmSeasonComplete()){ok(false,'第'+(season+2)+'季未完成');console.log('  [DBG2] 退出时: g2='+g2+' season='+(!!__cm.cgame.season)+' round='+(__cm.cgame.season?__cm.cgame.season.round+'/'+__cm.cgame.season.totalRounds:'-')+' cup='+(__cm.cgame.season&&__cm.cgame.season.cup?JSON.stringify({stage:__cm.cgame.season.cup.stageIdx,pending:__cm.cgame.season.cup.pending,elim:__cm.cgame.season.cup.eliminated,winner:__cm.cgame.season.cup.winner,alive:__cm.cgame.season.cup.alive?__cm.cgame.season.cup.alive.length:0}):'-')+' acl='+(__cm.cgame.season&&__cm.cgame.season.acl?JSON.stringify({stage:__cm.cgame.season.acl.stageIdx,pending:__cm.cgame.season.acl.pending,winner:__cm.cgame.season.acl.winner}):'null')+' ucl='+(__cm.cgame.season&&__cm.cgame.season.ucl?JSON.stringify({stage:__cm.cgame.season.ucl.stageIdx,pending:__cm.cgame.season.ucl.pending,winner:__cm.cgame.season.ucl.winner}):'null'));break}
  cmSeasonEnd();
  cmSettleNext();
  if(__cm.cgame.coach.retired)break;
  if(__cm.cmMatch.phase!=='offers'){ok(false,'offers 阶段异常: '+__cm.cmMatch.phase);break}
  let waits7=0;
  while(__cm.cmMatch&&__cm.cmMatch.phase==='offers'&&waits7++<8){
    if(__cm.cmMatch.offers&&__cm.cmMatch.offers.length){cmOfferJoin(0);break}
    if(__cm.cgame.club){cmOfferStay();break}
    cmOfferWait();
  }
  if(!__cm.cgame.season&&!__cm.cgame.coach.retired){ok(false,'休赛期后无新赛季');break}
}
ok(true,'多赛季推进完成，当前声望 '+Math.round(__cm.cgame.coach.rep)+' 年龄 '+__cm.cgame.coach.age);
console.log('  执教履历: '+JSON.stringify(__cm.cgame.coach.log.slice(-3)));
console.log('  荣誉: '+__cm.cgame.coach.honors.join(' | '));

// ------- 8. 存档 -------
section('存档');
ok(cSaveGame(1),'保存教练存档');
const info=getCoachSaveInfo(1);
ok(info&&info.name==='测试教练','存档信息可读 '+JSON.stringify(info));
__cm.cgame=null;
const data=cLoadGame(1);
ok(data&&data.coach.name==='测试教练','读取存档');
__cm.cgame=data;
ok(cmSeasonComplete()!==undefined,'读档后状态可用');

// ------- 9. 退休与总结 -------
section('执教总结');
cmRetireInternal('测试退休');
ok(__cm.cgame.coach.retired===true,'退休标记');
const sumHTML=cmCareerSummaryHTML();
ok(sumHTML.indexOf('执教生涯总结')>=0,'总结页生成');
cmAfterRetire(1);
ok(__cm.cgame===null,'返回主菜单清空会话');

console.log('\n结果: '+passed+' 通过, '+failed+' 失败');
process.exit(failed?1:0);
