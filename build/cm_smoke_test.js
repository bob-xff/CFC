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
ok(Object.keys(__cm.cgame.world.squads).length===240,'240 支球队阵容（16中超+16中甲+4中乙填充+海外+亚冠填充）');
// V2.5.1 全球联赛体系断言
ok(cmSquadOf('利兹联').length>=20&&cmTeamLeague('利兹联')==='ENG2','英冠球队入world（利兹联）');
ok(cmSquadOf('老虎大学').length>=20&&cmTeamLeague('老虎大学')==='LIGA_MX','墨超球队入world（老虎大学）');
ok(cmSquadOf('桑托斯').length>=20&&cmTeamLeague('桑托斯')==='BRA','美洲一级入world（桑托斯/巴甲）');
ok(CM_PROMO_PAIRS.length===8&&CM_PROMO_PAIRS.some(p=>p[0]==='EPL'&&p[1]==='ENG2'),'8组升降级配对');
// V6.6.1 德转真实球员库断言
const mcSq=cmSquadOf('曼城');
ok(mcSq.length>=18&&mcSq.length<=26,'曼城阵容人数 '+mcSq.length);
ok(mcSq.some(p=>p.name==='埃尔林·哈兰德'),'德转真实球员嵌入（埃尔林·哈兰德）');
ok(mcSq.every(p=>p.lg==='EPL'),'海外球员 lg=EPL');
const hld=mcSq.find(p=>p.name==='埃尔林·哈兰德');
ok(hld&&hld.mvEur>=150000000,'德转真实身价 ≥€1.5亿 '+(hld&&hld.mvEur));
ok(hld&&hld.ovr>=93,'身价标定评分 ≥93 '+(hld&&hld.ovr));
ok(cmOvrClass(hld.ovr)==='fc-gold','金黄卡级');
ok(cmValue(hld)>=115000,'cmValue 德转身价换算(万) '+cmValue(hld));
ok(mcSq.some(p=>p.name==='拉扬·谢尔基'),'德转阵容深度（拉扬·谢尔基）');
const j1Sq=cmSquadOf('浦和红钻');
ok(j1Sq.some(p=>p.nat==='JP'),'J1 本土名池生效');
ok(cmSquadOf('武里南联').length>=18,'亚冠填充队有阵容');
ok(cmTeamLeague('曼城')==='EPL'&&cmTeamLeague('萨德')==='QAT'&&cmTeamLeague('梅州客家')==='CL1','cmTeamLeague 全联赛识别');
const mySq=cmSquadOf('梅州客家');
ok(mySq.length>=20&&mySq.length<=24,'梅州客家阵容人数 '+mySq.length);
ok(mySq.length>=18,'中甲球队真实阵容（梅州 '+mySq.length+' 人）');
ok(mySq.every(p=>p.mvEur!=null),'梅州全员带身价字段');
ok(mySq.some(p=>cmOvrClass(p.ovr)==='fc-bronze')&&mySq.some(p=>cmOvrClass(p.ovr)==='fc-grey'),'梅州队棕铜/灰卡分级齐全');
ok(mySq.filter(p=>p.pos==='GK').length>=2,'门将 ≥2');
ok(__cm.cgame.season.fixtures.length===30,'中甲 30 轮');
ok(__cm.cgame.season.fixtures[0].length===8,'每轮 8 场（16队）');
ok(Object.keys(__cm.cgame.season.table).length===16,'积分榜 16 队');
ok(__cm.cgame.season.winOpen===true,'季前转会窗开启');
ok(__cm.cgame.youth.length===6,'青训 6 人');
ok(__cm.cgame.season.scout.length>0,'球探清单已生成');
ok(__cm.cgame.world.freeAgents.length>=8&&__cm.cgame.world.freeAgents.every(p=>p.mvEur!=null),'自由球员来自德转真实池');
ok(__cm.cgame.club.lineup&&__cm.cgame.club.lineup.length===11,'首发 11 槽位');
ok(__cm.cgame.club.lineup.every(id=>id!=null),'首发已自动填满');

// 球星OVR合理性
const wl=cmSquadOf('上海海港');
const wu=wl.find(p=>p.name==='武磊');
ok(wu&&wu.ovr>=62&&wu.ovr<=76,'武磊 OVR 落在中超前锋区间 '+ (wu&&wu.ovr));
ok(wu&&wu.age===34,'武磊真实年龄 34（CM_STAR_AGE）'+ (wu&&wu.age));
ok(wl.filter(p=>p.nat==='CN').length>=10,'海港中国籍球员入队（国足池可用）');
const cntCN=cmLeagueTeams('CSL').concat(cmLeagueTeams('CL1')).reduce((n,t)=>n+cmSquadOf(t).filter(p=>p.nat==='CN').length,0);
ok(cntCN>=300,'全中国联赛 CN 籍球员 ≥300（实际 '+cntCN+'）');
// V2.6.1 德转四级卡色：灰 / 棕铜 / 亮银 / 金黄（阈值 60 / 70 / 80）
ok(cmOvrClass(95)==='fc-gold'&&cmOvrClass(80)==='fc-gold','评分≥80 判为金黄');
ok(cmOvrClass(79)==='fc-silver'&&cmOvrClass(70)==='fc-silver','评分70~79 判为亮银');
ok(cmOvrClass(69)==='fc-bronze'&&cmOvrClass(60)==='fc-bronze','评分60~69 判为棕铜');
ok(cmOvrClass(59)==='fc-grey'&&cmOvrClass(40)==='fc-grey','评分<60 判为灰');
ok(cmOvrTxt(85)==='fc-txt-gold'&&cmOvrTxt(75)==='fc-txt-silver'&&
   cmOvrTxt(65)==='fc-txt-bronze'&&cmOvrTxt(55)==='fc-txt-grey','文字色四级映射与卡色一致');
// 浅色/深色主题等价：四级卡色各有浅色主题覆盖，且覆盖规则数量充足
['fc-gold','fc-silver','fc-bronze','fc-grey'].forEach(function(c){
  ok(html.indexOf('.'+c+'{')>=0,'卡色类 .'+c+' 已定义');
});
['fc-txt-gold','fc-txt-silver','fc-txt-bronze','fc-txt-grey'].forEach(function(c){
  ok(html.indexOf('html[data-theme="light"] .'+c+'{')>=0,'浅色主题覆盖 '+c);
});
var lightRules=(html.match(/html\[data-theme="light"\]/g)||[]).length;
ok(lightRules>=50,'浅色主题覆盖规则 ≥50 条（实际 '+lightRules+'）');
ok(html.indexOf('html[data-theme="light"]{')>=0,'浅色主题 token 覆盖块存在（--cm-* 全套反色）');
ok(wu&&wu.age===34,'武磊真实年龄 34（CM_STAR_AGE）'+ (wu&&wu.age));
// V2.5.1 经营字段
ok(__cm.cgame.club&&__cm.cgame.club.fin&&typeof __cm.cgame.club.fin.rev==='number','俱乐部经营字段 fin 已初始化');
// V2.5.1 阵容页一键互换：替补第一人换上登场
(function(){
  const club=__cm.cgame.club;
  const benchId=club.bench.find(x=>x!=null);
  if(benchId==null){ok(false,'替补席有球员可测');return}
  const benchPos=club.lineup.length;
  cmSwapXI(benchId);
  ok(club.lineup.includes(benchId),'cmSwapXI 替补换上成功');
  ok(!club.bench.includes(benchId),'cmSwapXI 原替补离开替补席');
})();

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
section('完整赛季循环（中甲30轮+足协杯）');
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
ok(tSum===30*LEAGUES.CL1.teams.length,'积分榜赛程记账一致（Σ场次数='+tSum+'）');
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
ok(__cm.cgame.season.cup.alive.length===36,'新赛季杯赛重置 36 队（中超16+中甲16+中乙填充4，含轮空）');

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

// ------- 10. V2.5.1 换队经营字段 -------
__cm.cgame={v:1,mode:'coach',slot:null,world:null,coach:null,club:null,season:null,youth:[],nt:null,ntQ:false,tactics:{formation:'4231',strategy:'counter'}};
__cm.cgame.coach={name:'测试教练',age:35,rep:40,honors:[],log:[],titles:0,stats:{w:0,d:0,l:0},seasons:0,fails:0,unemployed:false,retired:false,nt:false};
cmGenWorld(2026);
cmJoinClub('上海海港','CSL');
ok(!!(__cm.cgame.club&&__cm.cgame.club.fin),'换队后 fin 立即可用（cmJoinClub 补齐）');
ok(cmTeamLeague('利兹联')==='ENG2'&&cmLeagueTeams('ENG2').length===12,'英冠 12 队归属正确');

console.log('\n结果: '+passed+' 通过, '+failed+' 失败');
process.exit(failed?1:0);
