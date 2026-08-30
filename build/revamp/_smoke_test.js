// 修复点运行时冒烟测试：以最小 DOM 桩在全局脚本语义下加载游戏，验证核心逻辑
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const html = fs.readFileSync(path.join(__dirname, '..', '..', 'football-career-simulator.html'), 'utf8');
const m = html.match(/<script>([\s\S]*)<\/script>/);
if (!m) { console.error('FAIL: script block not found'); process.exit(1); }

const __fakeEls = {};
globalThis.__cfcTheme='dark';
const stubDocument = { addEventListener() {}, documentElement: { setAttribute(k,v){ globalThis.__cfcTheme=v; }, getAttribute() { return globalThis.__cfcTheme || 'dark'; } }, getElementById(id) { if (!__fakeEls[id]) __fakeEls[id] = { innerHTML: '', textContent: '', style: {}, classList: { add() {}, remove() {}, contains() { return false; } }, appendChild() {}, remove() {}, setAttribute() {} }; return __fakeEls[id]; }, querySelector() { return null; }, querySelectorAll() { return []; }, createElement() { return { style: {}, classList: { add() {}, remove() {}, toggle() {} }, appendChild() {}, remove() {}, setAttribute() {} }; }, body: { appendChild() {} } };
const stubStorage = { getItem() { return null; }, setItem() {}, removeItem() {} };
global.document = stubDocument;
global.window = {};
global.localStorage = stubStorage;
global.navigator = { userAgent: 'node-smoke' };

let exported = null;
let __realShowSeasonEnd = null;
global.__export = o => { exported = o; };
vm.runInThisContext(m[1] + '\n;__export({interpolateEventText,eventPassesNow,competitionName,newGameState,getEventById,nextStep,pickEvent});', { timeout: 20000 });
if (!exported) { console.error('FAIL: export hook not called'); process.exit(1); }
__realShowSeasonEnd = showSeasonEnd; // 备份真函数（后续测试会用桩覆盖）
const { interpolateEventText, competitionName, newGameState, getEventById, nextStep, pickEvent } = exported;

// 转会窗/风险测试需要更多导出：直接用全局作用域访问（vm 注入全局 let/const/function）
const { transferWindows, generateSeasonEvents, generateTransferOffers, processChoice, showConsequenceFromState, startNewSeason, chooseRetire, acceptTransfer, seasonOvrGain } = global;

let pass = 0, fail = 0;
function t(name, cond) { if (cond) { pass++; console.log('PASS', name); } else { fail++; console.log('FAIL', name); } }

// 通用的"在某状态下校验事件"工具：game 是脚本全局 let，可直接赋值
function passesAt(id, stage, league, age, ovr, flags) {
  game = newGameState();
  game.player.careerStage = stage; game.player.league = league;
  game.player.age = age; game.player.season = 6; game.player.ovr = ovr;
  if (flags) Object.assign(game.player.flags, flags);
  return exported.eventPassesNow(getEventById(id));
}

// ---- Bug1：占位符插值 ----
const P = { name: 'bob', team: '里昂', league: 'LIGUE_1' };
t('B1 ${p.name} 插值', interpolateEventText('如何评价${p.name}的表现', P, {}) === '如何评价bob的表现');
t('B1 ${ctx.ntCoach} 插值', interpolateEventText('${ctx.ntCoach}赛后点评', P, { ntCoach: '邵佳一' }) === '邵佳一赛后点评');
t('B1 ${starLine(p.team)} 全局函数', !interpolateEventText('你向${starLine(p.team)}请教', P, {}).includes('${'));
t('B1 ${NT_COACH} 全局常量', interpolateEventText('${NT_COACH}看着你', P, {}).includes('邵佳一'));
t('B1 无占位符原样返回', interpolateEventText('普通文本', P, {}) === '普通文本');
t('B1 非法表达式安全回退', interpolateEventText('坏的${p.__x__.y.z}占位', P, {}) === '坏的${p.__x__.y.z}占位');
t('B1 真实文案 ch6_asian_poty', !interpolateEventText(getEventById('ch6_asian_poty').choices[0].consequence, P, {}).includes('${'));
t('B1 真实文案 ch3_nt_callup', !interpolateEventText(getEventById('ch3_nt_callup').choices[0].consequence, P, { ntCoach: '邵佳一' }).includes('${'));
t('B1 真实文案 cal_asian_cup', !interpolateEventText(getEventById('cal_asian_cup').choices[2].consequence, P, { ntCoach: '邵佳一' }).includes('${'));
t('B1 真实文案 ch4_scout_offer(starLine 模板串)', (() => { const c = getEventById('ch4_scout_offer').choices[2].consequence; return typeof c === 'string' && !interpolateEventText(c, P, {}).includes('${'); })());

// ---- Bug5：荣誉赛事名 ----
function compOf(stage, league) { const g = newGameState(); g.player.careerStage = stage; g.player.league = league; return competitionName(g.player); }
t('B5 U21 → U21联赛', compOf('u21', 'CSL') === 'U21联赛');
t('B5 U17 → U17联赛', compOf('u17', 'CSL') === 'U17联赛');
t('B5 U19 → U19联赛', compOf('u19', 'CSL') === 'U19联赛');
t('B5 一线队CSL → 中超联赛', compOf('core', 'CSL') === '中超联赛');
t('B5 一线队LIGUE_1 → 法甲联赛', compOf('core', 'LIGUE_1') === '法甲联赛');

// ---- Bug2/3/4：触发时校验 ----
t('B2 m16 亚冠：里昂(法甲)不通过', passesAt('m16', 'core', 'LIGUE_1', 21, 79) === false);
t('B2 m16 亚冠：中超通过', passesAt('m16', 'core', 'CSL', 21, 79) === true);
t('B2 ch3_acl_debut：法甲不通过', passesAt('ch3_acl_debut', 'starter', 'LIGUE_1', 20, 72) === false);
t('B2 ch6_acl_title：法甲+acl_final 不通过', passesAt('ch6_acl_title', 'core', 'LIGUE_1', 22, 80, { acl_final: true }) === false);
t('B2 ch6_acl_title：中超+acl_final 通过', passesAt('ch6_acl_title', 'core', 'CSL', 22, 80, { acl_final: true }) === true);
t('B4 x3 球探：法甲(留洋后)不通过', passesAt('x3', 'core', 'LIGUE_1', 21, 79) === false);
t('B4 x3 球探：中超(留洋前)通过', passesAt('x3', 'u21', 'CSL', 18, 60) === true);
t('B3 m7(minAge21)：20岁不过/21岁过', passesAt('m7', 'core', 'LIGUE_1', 20, 75) === false && passesAt('m7', 'core', 'LIGUE_1', 21, 75) === true);

// ---- nextStep：失效事件跳过（法甲无 continental 事件可顶替） ----
function runSeason(setup) {
  game = newGameState();
  setup(game);
  game.season.usedEventIds = [];
  const shown = [];
  showEvent = id => shown.push(id);
  switchView = () => {};
  showSeasonEnd = () => shown.push('__season_end__');
  showTransferWindow = () => shown.push('__transfer__');
  nextStep();
  return { shown, events: game.season.events, idx: game.season.currentEventIndex };
}
const r = runSeason(g => {
  g.player.careerStage = 'core'; g.player.league = 'LIGUE_1'; g.player.age = 21; g.player.ovr = 79; g.player.season = 6;
  g.season.events = [{ type: 'event', eventId: 'm16' }, { type: 'season_end' }];
  g.season.currentEventIndex = -1;
});
t('B2 nextStep 跳过失效亚冠事件直达结算', r.idx === 1 && r.shown.indexOf('__season_end__') >= 0 && r.shown.indexOf('m16') < 0);

// ---- nextStep：同 cat 合格事件顶替（u16 遇到 minAge21 的 m7） ----
const r4 = runSeason(g => {
  g.player.careerStage = 'u17'; g.player.league = 'CSL'; g.player.age = 16; g.player.ovr = 45; g.player.season = 1;
  g.season.events = [{ type: 'event', eventId: 'm7' }, { type: 'season_end' }];
  g.season.currentEventIndex = -1;
});
const rep = getEventById(r4.events[0].eventId);
t('B2 nextStep 顶替为同 cat 合格事件 (m7→' + r4.events[0].eventId + ')',
  r4.events[0].eventId !== 'm7' && rep && rep.cat === 'match' && (!rep.minAge || rep.minAge <= 16) && r4.shown.indexOf('__season_end__') < 0);

// ---- G：转会窗赛制 ----
const cslWins = transferWindows('CSL');
const eplWins = transferWindows('EPL');
t('G1 中国联赛：季前冬窗 + 季中夏窗', cslWins[0].key === 'winter' && cslWins[0].pos === 'pre' && cslWins[1].key === 'summer' && cslWins[1].pos === 'mid');
t('G2 欧洲联赛：季前夏窗 + 季中冬窗', eplWins[0].key === 'summer' && eplWins[0].pos === 'pre' && eplWins[1].key === 'winter' && eplWins[1].pos === 'mid');
function seasonStructure(league) {
  game = newGameState();
  game.player.league = league; game.player.careerStage = 'core'; game.player.age = 24; game.player.ovr = 76; game.player.season = 5;
  game.season.usedEventIds = [];
  generateSeasonEvents();
  return game.season.events;
}
const evCSL = seasonStructure('CSL');
t('G3 赛季首项=季前转会窗（冬窗）', evCSL[0].type === 'transfer_window' && evCSL[0].windowKey === 'winter' && evCSL[0].windowPos === 'pre');
const midWin = evCSL.filter(e => e.type === 'transfer_window');
t('G4 每赛季两个转会窗 + 末尾结算', midWin.length === 2 && midWin[1].windowKey === 'summer' && midWin[1].windowPos === 'mid' && evCSL[evCSL.length - 1].type === 'season_end');
const evEPL = seasonStructure('LIGUE_1');
t('G5 法甲：季前夏窗、季中冬窗', evEPL[0].windowKey === 'summer' && evEPL.filter(e => e.type === 'transfer_window')[1].windowKey === 'winter');
// 季中窗触发时向 showTransferWindow 传窗期信息
const winCaptured = [];
showTransferWindow = o => winCaptured.push(o);
game.season.events = [{ type: 'transfer_window', windowKey: 'summer', windowLabel: '夏窗', windowPos: 'mid' }];
game.season.currentEventIndex = -1;
nextStep();
t('G6 nextStep 传递窗期信息给转会界面', winCaptured.length === 1 && winCaptured[0].windowKey === 'summer' && winCaptured[0].windowPos === 'mid');

// ---- I：风险判定 ----
function setupRisk(eventId, choiceIdx) {
  game = newGameState();
  game.player.careerStage = 'core'; game.player.league = 'CSL'; game.player.age = 24; game.player.ovr = 75; game.player.season = 5;
  game.player.attributes.SHO = { finishing: 85 };
  game.season.usedEventIds = []; game.season.seasonGoals = 0; game.season.seasonAssists = 0;
  const ev = getEventById(eventId);
  currentEvent = ev;
  const captured = [];
  showConsequence = (e, c, ch, o) => captured.push({ choice: c, outcome: o || c });
  return { ev, captured, choice: ev.choices[choiceIdx], idx: choiceIdx };
}
const c1 = getEventById('m1');
t('I1 m1 选择1已带 risk/fail', !!c1.choices[0].risk && !!c1.choices[0].fail && !c1.choices[0].fail.goals);
const rFail = setupRisk('m1', 0);
const _rand = Math.random; Math.random = () => 0.999; // 必然失败
processChoice(rFail.idx);
Math.random = _rand;
t('I2 失误分支：无进球、标题为失误、状态下降', rFail.captured[0].outcome === rFail.choice.fail && game.season.seasonGoals === 0 && game.season.lastRiskFail === true && rFail.choice.fail.formChange < 0);
// 读档一致性：lastRiskFail=true 时按 fail 渲染
const cap2 = [];
showConsequence = (e, c, ch, o) => cap2.push(o || c);
showConsequenceFromState();
t('I3 读档恢复走同一失误分支', cap2[0] === rFail.choice.fail);
const rWin = setupRisk('m1', 0);
Math.random = () => 0; // 必然成功
processChoice(rWin.idx);
Math.random = _rand;
t('I4 成功分支：进球+1', rWin.captured[0].outcome === rWin.choice && game.season.seasonGoals === 1 && game.season.lastRiskFail === false);
// 世预赛任意球失误 → 不设 wc_qualified 旗标（选择真实影响后续大赛）
const rNT = setupRisk('cal_quali_2029', 0);
game.player.flags.nationalMember = true;
Math.random = () => 0.999;
processChoice(rNT.idx);
Math.random = _rand;
t('I5 大赛剧情失误：旗标不置位（无缘世界杯的分支成立）', !game.player.flags.wc_qualified && rNT.captured[0].outcome !== rNT.choice);

// ---- H：选择影响后续 ----
// ovr 60 档的基础报价池只有 CSL/CL1，欧洲报价只能来自剧情旗标 → 断言有意义
const gEur = newGameState();
gEur.player.league = 'CSL'; gEur.player.careerStage = 'starter'; gEur.player.age = 20; gEur.player.ovr = 60; gEur.player.salary = 90000; gEur.player.marketValue = 1500000;
gEur.player.flags.ajax_interest = true;
game = gEur;
const offersEu2 = generateTransferOffers({});
t('H1 阿贾克斯考察 → 转会市场出现欧洲报价', offersEu2.some(o => o.league === 'EREDIVISIE' || o.league === 'LIGA_PT'));
game = newGameState();
game.player.league = 'CSL'; game.player.ovr = 60; game.player.salary = 90000; game.player.marketValue = 1500000;
const offersPlain = generateTransferOffers({});
t('H2 无旗标时不出欧洲报价', offersPlain.every(o => o.league !== 'EREDIVISIE' && o.league !== 'LIGA_PT'));
const pRecover = newGameState().player;
pRecover.age = 31; pRecover.potential = 90; pRecover.ovr = 80; pRecover.morale = 7; pRecover.form = 5; pRecover.flags.recovery_pro = true;
game = newGameState(); game.player = pRecover;
const gRec = seasonOvrGain(pRecover);
pRecover.flags.recovery_pro = false;
const gNo = seasonOvrGain(pRecover);
t('H3 recovery_pro 延缓衰退 (+1)', gRec === gNo + 1);

// ---- J：40 岁强制退役 ----
const retireCalled = [];
showRetirement = () => retireCalled.push(game.player.age);
game = newGameState();
game.player.age = 39; game.player.season = 24; game.player.potential = 88; game.player.ovr = 82;
startNewSeason();
t('J1 满40岁强制触发退役流程', retireCalled.length === 1 && game.player.age === 40);
chooseRetire('continue');
t('J2 40岁"继续征战"被拒绝并退回退役界面', !game.player.retired && !game.player.coaching && retireCalled.length === 2);

// ---- R3：荣誉评判标准（第二轮） ----
const { pendingStoryEvents, calculateMarketValue, toggleTheme, showCoachMode, coachNextSeason, coachChoose, coachResult } = global;
function honorFor(age, stage, league, rating, goals, assists) {
  game = newGameState();
  game.player.careerStage = stage; game.player.league = league; game.player.age = age;
  game.player.ovr = 76; game.player.season = 5; game.player.team = '本菲卡';
  game.season.usedEventIds = [];
  const _r = Math.random; Math.random = () => 0;
  game.season.endProcessed = false;
  game.season.profile = { matches: 24, goals: goals, assists: assists, shots: 76, keyPasses: 128, tackles: 19, interceptions: 15, cleanSheets: 0, saves: 0, conceded: 0, yellows: 4, reds: 0, motm: 3, rating: rating };
  game.player.flags.nationalMember = true;
  showSeasonEnd = __realShowSeasonEnd; // 恢复真实结算函数
  showSeasonEnd();
  Math.random = _r;
  document.getElementById('summary-modal').classList.remove('active');
  const txt = String(document.getElementById('summary-content').innerHTML).replace(/<[^>]*>/g, '');
  const m = txt.match(/荣誉(.+?)进入/);
  return m ? m[1] : '';
}
const honorYoung = honorFor(19, 'core', 'LIGA_PT', 7.37, 6, 9);
t('R1 19岁6球9助 → 最佳年轻球员（而非最佳球员）', honorYoung.indexOf('最佳年轻球员') >= 0 && honorYoung.indexOf('最佳球员（') < 0 && !/最佳球员$/.test(honorYoung.trim()));
const honorAdult = honorFor(26, 'core', 'LIGA_PT', 7.37, 6, 9);
t('R2 26岁6球9助 → 最佳阵容（合理档位）', honorAdult.indexOf('最佳阵容') >= 0);
const honorBoot = honorFor(26, 'legend', 'LIGA_PT', 7.6, 16, 4);
t('R3a 16球7.6评分 → 金靴（射手王优先于MVP）', honorBoot.indexOf('金靴') >= 0);
const honorMVP = honorFor(26, 'legend', 'LIGA_PT', 7.6, 8, 12);
t('R3b 8球12助7.6评分 → 联赛最佳球员（MVP门槛）', honorMVP.indexOf('最佳球员') >= 0 && honorMVP.indexOf('年轻') < 0);
const honorNone = honorFor(24, 'starter', 'CSL', 6.85, 2, 3);
t('R4 2球3助低评分 → 最多队内荣誉/无荣誉', honorNone === '' || honorNone.indexOf('队内') >= 0);

// ---- R5：日历剧情年份闸门 ----
function calLeakAt(yearSeason) {
  game = newGameState();
  game.player.league = 'EPL'; game.player.careerStage = 'legend'; game.player.age = yearSeason; game.player.season = yearSeason - 2025;
  game.player.ovr = 85; game.player.flags.nationalMember = true;
  game.story.chapter = 5; game.story.usedStoryIds = [];
  return pendingStoryEvents().some(e => e.id.indexOf('cal_') === 0);
}
t('R5 2030赛季章节剧情池不再混入 2034世预赛（cal_*）', calLeakAt(2030) === false);

// ---- R6：身价表现系数 ----
function valueWithPerf(perf) {
  game = newGameState();
  const p = game.player;
  p.league = 'LIGA_PT'; p.age = 22; p.ovr = 76; p.marketValue = 0;
  p.attributes = { SHO: { finishing: 80 }, PAC: { acceleration: 80 }, DRI: { ballControl: 80 } };
  if (perf) p.lastPerf = perf;
  calculateMarketValue();
  return p.marketValue;
}
const vBase = valueWithPerf(null);
const vHot = valueWithPerf({ matches: 30, goals: 18, assists: 8, cleanSheets: 0, rating: 7.6, isGK: false });
const vCold = valueWithPerf({ matches: 30, goals: 1, assists: 1, cleanSheets: 0, rating: 6.4, isGK: false });
t('R6 赛季表现推动身价：爆发季 > 基准 > 疲软季', vHot > vBase && vBase > vCold && vHot / vBase <= 1.21 && vCold / vBase >= 0.85);

// ---- R7：主题切换 ----
toggleTheme();
t('R7 主题切换生效（light）', document.documentElement.getAttribute('data-theme') === 'light');
toggleTheme();
t('R7 主题切回（dark）', document.documentElement.getAttribute('data-theme') === 'dark');

// ---- R8：教练生涯模式 ----
const fakeExtra = { innerHTML: '' };
document.getElementById = id => (id === 'retire-extra' ? fakeExtra : null);
game = newGameState();
game.player.name = '名宿'; game.player.ovr = 86; game.player.age = 40; game.player.honors = ['a', 'b', 'c', 'd', 'e', 'f'];
showCoachMode();
t('R8 高声望退役 → 直接出任争冠球队主教练', coach.teamIdx === 3 && fakeExtra.innerHTML.indexOf('执教生涯开始') >= 0);
const _rr = Math.random; Math.random = () => 0;
coachNextSeason();
const evOk = fakeExtra.innerHTML.indexOf('choice-btn') > 0;
coachChoose(0);
const repAfter = coach.rep;
coachResult();
Math.random = _rr;
t('R9 执教赛季流程：事件→抉择→结算，声望变动且可升迁', evOk && typeof repAfter === 'number' && (coach.teamIdx === 4 || coach.teamIdx === 3));

console.log('\nRESULT: ' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
