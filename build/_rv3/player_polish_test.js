// 球员模式完善专项验证（build/_rv3/player_polish_test.js）
// 覆盖：生涯里程碑计算、退役总结最佳赛季、竖屏 CSS 规则存在性（静态检查）、
//       退役单选项居中（solo）、创建向导分步逻辑、赛季结算-退役链路回归
// stub 方案与 cm_smoke_test.js / verify_portrait_bugs.js 一致（vm + globalThis 访问器）
const fs = require('fs');
const path = require('path');

let passed = 0, failed = 0;
function ok(cond, msg) { if (cond) { passed++; } else { failed++; console.log('  [FAIL] ' + msg); } }
function section(t) { console.log('== ' + t); }

const ROOT = path.join(__dirname, '..', '..');
const raw = fs.readFileSync(path.join(ROOT, 'football-career-simulator.html'), 'utf-8').replace(/\r\n/g, '\n');
const js = raw.slice(raw.indexOf('<script>') + 8, raw.lastIndexOf('</script>'));
const cssRaw = raw.slice(raw.indexOf('<style>') + 7, raw.indexOf('</style>'));

// ---------- DOM stub（带类别记录，可断言 classList.toggle 结果） ----------
function makeEl() {
  const cls = new Set();
  const el = {
    innerHTML: '', textContent: '', value: '', style: {}, dataset: {}, offsetHeight: 64,
    src: '', _cls: cls,
    classList: {
      add: (...cs) => cs.forEach(c => cls.add(c)),
      remove: (...cs) => cs.forEach(c => cls.delete(c)),
      toggle: (c, force) => {
        const want = force === undefined ? !cls.has(c) : !!force;
        if (want) cls.add(c); else cls.delete(c);
        return want;
      },
      contains: c => cls.has(c)
    },
    querySelector() { return makeEl() }, querySelectorAll() { return [] },
    appendChild() {}, setAttribute() {}, getAttribute() { return null },
    addEventListener() {}, remove() {}, focus() {}, blur() {}, click() {}
  };
  return el;
}
const elCache = {};
global.document = {
  getElementById: id => (elCache[id] = elCache[id] || makeEl()),
  querySelector: () => makeEl(),
  querySelectorAll: () => [],
  addEventListener() {}, createElement: () => makeEl(),
  body: makeEl(), documentElement: { setAttribute() {}, getAttribute() { return 'dark' } },
  activeElement: null
};
global.window = { Capacitor: null, scrollTo() {} };
global.localStorage = { _d: {}, getItem(k) { return this._d[k] || null }, setItem(k, v) { this._d[k] = v }, removeItem(k) { delete this._d[k] } };
global.navigator = { userAgent: 'rv3-player' };
global.location = { reload() {} };
global.requestAnimationFrame = f => f();

// ---------- 加载游戏脚本（game/wizStep 为 let 绑定 → 访问器暴露） ----------
const vm = require('vm');
vm.runInThisContext(js + `
;globalThis.__pg={
  get game(){return game}, set game(v){game=v},
  get wizStep(){return wizStep}
};`);

// ---------- 工具 ----------
function newPlayerPatch(patch) {
  __pg.game = newGameState();
  const p = __pg.game.player;
  Object.assign(p, patch || {});
  return p;
}
function mkLog() {
  return [ // 最新在前（addLog unshift 语义）
    { season: 3, age: 19, year: 2028, text: 'S3赛季结束：31场 15球 9助攻，场均评分 7.10' },
    { season: 3, age: 19, year: 2028, text: '国家队：本赛季代表国足出战 3 场' },
    { season: 2, age: 18, year: 2027, text: 'S2赛季结束：30场 14球 8助攻，场均评分 7.42' },
    { season: 2, age: 18, year: 2027, text: '国家队：本赛季代表国足出战 4 场' },
    { season: 1, age: 17, year: 2026, text: 'S1赛季结束：28场 12球 6助攻，场均评分 6.85' },
    { season: 1, age: 17, year: 2026, text: '国家队：本赛季代表国足出战 5 场' }
  ];
}

// ================= 1. 生涯里程碑：解析 + 计算 =================
section('生涯里程碑（parseCareerSeasons / careerMilestones）');
const p1 = newPlayerPatch({ careerAppearances: 89, careerGoals: 41, careerAssists: 23, internationalCaps: 12, isGK: false, careerLog: mkLog() });
const parsed = parseCareerSeasons(p1);
ok(parsed.seasons.length === 3, '赛季结算行解析 3 季（实际 ' + parsed.seasons.length + '）');
ok(parsed.seasons[0].season === 1 && parsed.seasons[2].season === 3, '按时间序排列（最新在前履历反转）');
ok(parsed.seasons[1].rating === 7.42 && parsed.seasons[1].goals === 14, 'S2 行字段解析（14球 / 评分 7.42）');
ok(parsed.capsSeasons.length === 3 && parsed.capsSeasons[0].year === 2026 && parsed.capsSeasons[0].caps === 5, '国家队出战行解析（2026 年 5 场）');

const ms = careerMilestones(p1);
ok(ms.length === 11, '场上球员里程碑 11 项 = 出场3 + 进球3 + 助攻3 + 国家队2（实际 ' + ms.length + '）');
const find = (key, t) => ms.find(m => m.key === key && m.target === t);
ok(find('apps', 50).done && find('apps', 50).year === 2027, '50场：S2 累计 58 场达成（2027）');
ok(!find('apps', 100).done && find('apps', 100).value === 89, '100场：未达成，进度 89/100');
ok(find('goals', 25).done && find('goals', 25).year === 2027, '25球：S2 累计 26 球达成（2027）');
ok(!find('goals', 50).done && find('goals', 50).value === 41, '50球：进度 41/50');
ok(find('assists', 10).done && find('assists', 10).year === 2027, '10助：2027 达成');
ok(!find('assists', 25).done && find('assists', 25).value === 23, '25助：进度 23/25');
ok(find('caps', 10).done && find('caps', 10).year === 2028, '国家队10场：2028 达成（5+4+3）');
ok(!find('caps', 50).done, '国家队50场：未达成');
ok(ms.filter(m => m.done).length === 4, '达成数 4 / 11');

const pGK = newPlayerPatch({ isGK: true, careerAppearances: 120, internationalCaps: 8, careerLog: mkLog() });
const msGK = careerMilestones(pGK);
ok(msGK.length === 5, '门将里程碑 5 项（出场3 + 国家队2，无进球/助攻）（实际 ' + msGK.length + '）');
ok(!msGK.some(m => m.key === 'goals' || m.key === 'assists'), '门将不含进球/助攻条目');

const htmlMs = careerMilestonesHTML(p1);
ok(htmlMs.indexOf('生涯里程碑') >= 0 && htmlMs.indexOf('ms-grid') >= 0, '里程碑卡片 HTML（标题 + ms-grid）');
ok(htmlMs.indexOf('4 / 11 已达成') >= 0, '达成计数展示');
ok(htmlMs.indexOf('✓ 50场') >= 0 && htmlMs.indexOf('2027 达成') >= 0, '达成态展示（✓ + 达成赛季）');
ok(htmlMs.indexOf('89/100') >= 0, '未达成进度展示（89/100）');
ok((htmlMs.match(/ms-item done/g) || []).length === 4, 'done 高亮数量 4');

// 边界：空履历不崩
const pEmpty = newPlayerPatch({});
ok(careerMilestones(pEmpty).length === 11 && careerMilestones(pEmpty).every(m => !m.done), '空履历：全部未达成且不崩');

// ================= 2. 生涯最佳赛季 =================
section('生涯最佳赛季（bestCareerSeason）');
const best = bestCareerSeason(p1);
ok(best.byRating.season === 2 && best.byRating.rating === 7.42, '评分最高 = S2（7.42）');
ok(best.byGoals.season === 3 && best.byGoals.goals === 15, '进球最多 = S3（15球）');
ok(best.byRating.year === 2027 && best.byGoals.year === 2028, '赛季年份推导（2027 / 2028）');

const pLP = newPlayerPatch({ season: 10, isGK: false, lastPerf: { matches: 30, goals: 18, assists: 7, cleanSheets: 0, rating: 7.21, isGK: false } });
const bestLP = bestCareerSeason(pLP);
ok(bestLP && bestLP.byRating.season === 9 && bestLP.byRating.year === 2034, '无履历时退回 lastPerf（S9 · 2034）');
ok(bestLP.byRating.goals === 18 && bestLP.byRating.rating === 7.21, 'lastPerf 字段映射正确');

const pGK2 = newPlayerPatch({ isGK: true, careerLog: mkLog() });
const bestGK = bestCareerSeason(pGK2);
ok(bestGK.byRating.season === 2 && bestGK.byGoals === null, '门将：仅评分类别，无进球最多行');

ok(bestCareerSeason(newPlayerPatch({})) === null, '无履历无 lastPerf → null（总结页自动隐藏）');

// ================= 3. 数据视图渲染（里程碑卡注入） =================
section('数据视图 / 成长视图渲染');
const pView = newPlayerPatch({ name: '小将', team: '上海海港', league: 'CSL', age: 17, careerStage: 'u17' });
pView.careerLog = mkLog(); pView.careerAppearances = 89; pView.careerGoals = 41; pView.careerAssists = 23; pView.internationalCaps = 12;
__pg.game.season.profile = generateSeasonProfile();
renderStatsView();
const statsHTML = elCache['view-stats'].innerHTML;
ok(statsHTML.indexOf('生涯里程碑') >= 0 && statsHTML.indexOf('ms-grid') >= 0, 'stats 视图含里程碑卡');
ok(statsHTML.indexOf('生涯数据') >= 0 && statsHTML.indexOf('m-seg') >= 0, 'stats 视图保留生涯数据与分段导航');
ok(statsHTML.indexOf('data-m="career"') >= 0, '里程碑卡归入生涯分段');

renderGrowthView();
const growthHTML = elCache['view-growth'].innerHTML;
ok(growthHTML.indexOf('m-seg') >= 0 && growthHTML.indexOf('data-m="card" class="m-on"') >= 0, 'growth 视图分段与球员卡初始段');
ok(growthHTML.indexOf('class="panel m-on" data-m="attr"') < 0, '属性面板无初始 m-on 残留（初始仅显示球员卡段）');

// ================= 4. 退役总结：生涯最佳赛季注入 =================
section('退役总结（showCareerSummary）');
const pRet = newPlayerPatch({ name: '传奇', age: 40, team: '利物浦', league: 'EPL', careerStage: 'legend' });
pRet.careerLog = mkLog(); pRet.careerAppearances = 89; pRet.careerGoals = 41; pRet.careerAssists = 23; pRet.internationalCaps = 12;
pRet.honors = ['英超金靴（2028）'];
pRet.ovrHistory = [{ age: 16, ovr: 54 }, { age: 19, ovr: 71 }];
pRet.retired = true;
showCareerSummary();
const sumHTML = elCache['retire-extra'].innerHTML;
ok(sumHTML.indexOf('生涯回顾') >= 0, '生涯回顾生成');
ok(sumHTML.indexOf('生涯最佳赛季') >= 0, '总结页含生涯最佳赛季段');
ok(sumHTML.indexOf('评分最高 · 2027赛季') >= 0, '评分最高行（2027）');
ok(sumHTML.indexOf('进球最多 · 2028赛季') >= 0, '进球最多行（2028，与评分最高不同季时双行）');
ok(sumHTML.indexOf('荣誉墙') >= 0, '荣誉墙保留（回归）');

// ================= 5. 退役决策页 solo 居中（球员路径） =================
section('退役决策页（showRetirement / solo）');
const p40 = newPlayerPatch({ name: '老将', age: 40 });
showRetirement();
ok(elCache['retire-options'].classList.contains('solo'), '40 岁强制退役 → retire-options 加 solo（单列居中）');
ok(elCache['retire-continue'].style.display === 'none', '"继续征战"选项隐藏');
const p39 = newPlayerPatch({ name: '中坚', age: 39 });
showRetirement();
ok(!elCache['retire-options'].classList.contains('solo'), '非强制退役 → 双选项布局（solo 移除）');
ok(elCache['retire-continue'].style.display === '', '"继续征战"选项可见');

// ================= 6. 创建向导分步（竖屏启用路径） =================
section('创建向导（wizSet / showScreen 复位）');
showScreen('create-screen');
ok(__pg.wizStep === 1, '进入创建屏复位到第 1 步');
wizGo(1);
ok(__pg.wizStep === 1, '第 1 步未填姓名时不放行');
elCache['player-name'].value = '球王';
wizGo(1);
ok(__pg.wizStep === 2, '填写姓名后进入第 2 步');
wizGo(1); wizGo(1);
ok(__pg.wizStep === 3, '推进到第 3 步');
wizGo(-1);
ok(__pg.wizStep === 2, '回退到第 2 步');

// ================= 7. 赛季结算 → 退役链路回归 =================
section('赛季结算 → 退役链路（集成回归）');
__pg.game = newGameState();
const pi = __pg.game.player;
pi.name = '链路'; pi.team = '上海海港'; pi.league = 'CSL'; pi.age = 17; pi.careerStage = 'u21'; pi.ovr = 62; pi.potential = 90;
generateStartingAttributes(2); calculateOVR(); calculateMarketValue();
__pg.game.season.profile = generateSeasonProfile();
const prof = __pg.game.season.profile;
showSeasonEnd();
ok(pi.careerAppearances === prof.matches, '赛季结算：出场累计 = 模拟出场 ' + pi.careerAppearances);
ok(pi.careerLog.some(l => l.text.indexOf('赛季结束') >= 0), '赛季结算行已写入履历（里程碑数据源）');
ok(elCache['summary-modal'].classList.contains('active'), '赛季总结弹窗打开');
closeSummary();
ok(pi.age === 18 && pi.season === 2, '进入下一赛季（18 岁 / S2）');
ok(elCache['view-story'].innerHTML.indexOf('赛季开始') >= 0, '新赛季开始页渲染');
pi.age = 39;
startNewSeason();
ok(pi.age === 40, '39 岁 → startNewSeason 触发 40 岁上限');
ok(elCache['retire-options'].classList.contains('solo'), '链路退役页进入 solo 布局');
chooseRetire('retire');
ok(pi.retired === true, '挂靴标记');
ok(elCache['retire-extra'].innerHTML.indexOf('生涯最佳赛季') >= 0, '链路退役总结含最佳赛季');
ok(elCache['retire-extra'].innerHTML.indexOf('生涯大事记') >= 0, '链路退役总结含生涯大事记（回归）');

// ================= 8. 竖屏 CSS 规则存在性（静态检查） =================
section('竖屏 CSS 规则（静态检查）');
const css = cssRaw.replace(/\s*\n\s*/g, '');
const iStart = css.indexOf('玩家模式竖屏适配');
const iMid = css.indexOf('窄竖屏（≤480px）');
const iEnd = css.indexOf('============ 教练模式（独立视觉体系');
ok(iStart >= 0 && iMid > iStart && iEnd > iMid, '竖屏适配 CSS 段落定位');
if (iStart >= 0 && iMid > iStart && iEnd > iMid) {
  const block700 = css.slice(iStart, iMid);
  const block480 = css.slice(iMid, iEnd);
  ok(block700.includes('@media (max-width:700px)'), '≤700px 竖屏媒体查询存在');
  ok(block700.includes('.m-seg{display:flex') && block700.includes('.m-chip.on{'), '成长/数据页分段导航竖屏启用');
  ok(block700.includes('[data-m]{display:none}') && block700.includes('[data-m].m-on{display:block}') && block700.includes('.stat-grid.m-on{display:grid}'), '分段显隐机制（data-m / m-on）');
  ok(block700.includes('.m-body .growth-layout{display:block}') && block700.includes('.m-body .growth-col{display:block}'), '成长页双列摊平为单列');
  ok(block700.includes('.wizard-step{display:none}') && block700.includes('.wizard-step.on{display:block}'), '创建向导：单步显示');
  ok(block700.includes('.create-wizard-nav{display:flex') && block700.includes('.wiz-dots i.on{background:var(--volt)}'), '创建向导：步骤导航与进度点');
  ok(block700.includes('.create-wizard-nav .btn-ghost{padding:9px 14px'), '向导按钮收窄（360px 不挤压）');
  ok(block700.includes('#create-screen .create-form{padding:22px 18px}'), '创建表单竖屏内边距收紧');
  ok(block480.includes('@media (max-width:480px)'), '≤480px 窄竖屏媒体查询存在');
  ok(block480.includes('.chip .chip-label{display:none}'), '顶栏芯片去标签（360px 防换行挤压）');
  ok(block480.includes('.season-clubline{flex-direction:column') && block480.includes('.cl-info{border-left:none;padding-left:0;align-items:center;text-align:center}'), '赛季开始页球队/赛事信息竖排');
  ok(block480.includes('#view-story .choices.choices-2col,#retire-extra .choices.choices-2col{grid-template-columns:1fr}'), '双列选项窄屏回退单列（防按钮挤压）');
}
ok(css.includes('.ms-grid{display:grid;grid-template-columns:repeat(3,1fr)') && css.includes('.ms-item.done{'), '里程碑卡片样式（ms-grid / done 高亮）');
ok(css.includes('html[data-theme="light"] .ms-item.done{border-color:rgba(77,124,15,.45)}'), '浅色主题里程碑 done 高亮覆写');
ok(css.includes('.retire-options.solo{grid-template-columns:1fr;max-width:440px;margin-left:auto;margin-right:auto}'), '退役 solo 单列居中规则（含自动边距）');
ok(/@media \(orientation:landscape\) and \(max-height:540px\) and \(max-width:1024px\)/.test(css), '横屏兜底块保留（未破坏原横屏适配）');
ok(/@media \(max-width:700px\)\{\s*\.cm-rows/.test(css), '教练模式竖屏块保留（未触碰 cm 段）');

// ================= 9. JS 集成点静态检查 =================
section('JS 集成点（静态）');
ok((js.match(/careerMilestonesHTML\(p\)/g) || []).length >= 2, '里程碑卡已接入 renderStatsView（定义 + 调用）');
ok(/const best=bestCareerSeason\(p\)/.test(js), 'bestCareerSeason 已接入 showCareerSummary');
ok(/html\+=careerMilestonesHTML\(p\);/.test(js), 'renderStatsView 生涯分段后注入里程碑');
ok(!/class="panel'\+\(i===0\?' m-on':''\)/.test(js.replace(/\s/g, '')), '旧属性面板初始 m-on 已移除');
ok(/MILESTONE_TARGETS=\{apps:\[50,100,250\],goals:\[25,50,100\],assists:\[10,25,50\],caps:\[10,50\]\}/.test(js), '里程碑目标定义（50球/100球/50助/250场 等级差）');

// ================= 结果 =================
console.log('\n结果: ' + passed + ' 通过, ' + failed + ' 失败');
process.exit(failed ? 1 : 0);
