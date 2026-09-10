// 竖屏改造 + 真机 bug 修复 专项验证脚本（build/_rv3）
// 验证：P0-2 杯赛点球决胜（主/客×胜/负）、P1-4 亚洲杯6场赛制、
//       P0-1 浅色主题浮层显式色（CSS 文本级检查）、竖屏 manifest、NT 徽章、zone/rkz、退役 solo
const fs = require('fs');
const path = require('path');

let passed = 0, failed = 0;
function ok(cond, msg) { if (cond) { passed++; } else { failed++; console.log('  [FAIL] ' + msg); } }
function section(t) { console.log('== ' + t); }

const ROOT = path.join(__dirname, '..', '..');
const html = fs.readFileSync(path.join(ROOT, 'football-career-simulator.html'), 'utf-8');

// ---------- DOM stub（与 cm_smoke_test.js 同款，支持 innerHTML 捕获） ----------
function makeEl() {
  const el = {
    innerHTML: '', textContent: '', value: '', style: {}, dataset: {}, offsetHeight: 64,
    classList: { add() {}, remove() {}, toggle() {}, contains() { return false } },
    querySelector() { return makeEl() }, querySelectorAll() { return [] },
    appendChild() {}, setAttribute() {}, getAttribute() { return null },
    addEventListener() {}, remove() {}, focus() {}, blur() {}, click() {}
  };
  return el;
}
const elCache = {};
global.document = {
  getElementById: (id) => (elCache[id] = elCache[id] || makeEl()),
  querySelector: () => makeEl(),
  querySelectorAll: () => [],
  addEventListener() {}, createElement: () => makeEl(),
  body: makeEl(), documentElement: { setAttribute() {}, getAttribute() { return 'dark' } },
  activeElement: null
};
global.window = { Capacitor: null, scrollTo() {} };
global.localStorage = { _d: {}, getItem(k) { return this._d[k] || null }, setItem(k, v) { this._d[k] = v }, removeItem(k) { delete this._d[k] } };
global.navigator = { userAgent: 'rv3' };
global.location = { reload() {} };
global.requestAnimationFrame = f => f();

// ---------- 提取并加载游戏脚本 ----------
const raw = html.replace(/\r\n/g, '\n');
const start = raw.indexOf('<script>') + 8;
const end = raw.lastIndexOf('</script>');
const js = raw.slice(start, end);
const vm = require('vm');
vm.runInThisContext(js + `;
;globalThis.__cm={
  get cgame(){return cgame}, set cgame(v){cgame=v},
  get cmMatch(){return cmMatch}, set cmMatch(v){cmMatch=v}
};`);

// ================= 1. cmShootout 点球决胜 =================
section('cmShootout 点球决胜');
let bad = 0, hWins = 0;
for (let i = 0; i < 2000; i++) {
  const [ph, pa] = cmShootout(76, 58);
  if (ph === pa || ph < 2 || pa < 2 || ph > 5 || pa > 5) bad++;
  if (ph > pa) hWins++;
}
ok(bad === 0, '2000 次点球比分全部合法且不同分（异常 ' + bad + '）');
const pStrong = hWins / 2000;
ok(pStrong > 0.5 && pStrong < 0.68, '强队(76 vs 58)胜率符合实力概率 ' + pStrong.toFixed(3));
hWins = 0;
for (let i = 0; i < 2000; i++) { const [ph, pa] = cmShootout(66, 66); if (ph > pa) hWins++; }
ok(Math.abs(hWins / 2000 - 0.5) < 0.06, '均势(66 vs 66)胜率≈50% 实际 ' + (hWins / 2000).toFixed(3));

// ================= 2. 我队杯赛平局 → 点球决胜（主/客 × 胜/负） =================
section('我队杯赛平局点球决胜（cmMatchDone cup 分支）');
const fourPaths = { homeWin: 0, homeLoss: 0, awayWin: 0, awayLoss: 0 };
let iter = 0, guardAll = 0;
const pathsDone = () => fourPaths.homeWin >= 1 && fourPaths.homeLoss >= 1 && fourPaths.awayWin >= 1 && fourPaths.awayLoss >= 1;
while (!pathsDone() && guardAll++ < 4000) {
  cmCreateGame({ team: '梅州客家', lgKey: 'CL1', rep: 40 }, 'rv3教练');
  const s = __cm.cgame.season;
  // 主/客交替构造我的杯赛对阵
  const home = (iter++ % 2) === 0;
  const myPair = home ? { h: '梅州客家', a: '上海海港', hg: null, ag: null, done: false, penH: 0, penA: 0 }
    : { h: '上海海港', a: '梅州客家', hg: null, ag: null, done: false, penH: 0, penA: 0 };
  s.round = s.cup.boundaries[0];
  s.cup.alive = ['梅州客家', '上海海港'];
  s.cup.pairs = [myPair];
  s.cup.pending = true;
  s.fixtures.forEach(rd => rd.forEach(m => { if (m.h === '梅州客家' || m.a === '梅州客家') m.done = true; }));
  const fx = cmNextFixtureInfo();
  if (fx.type !== 'cup') continue;
  cmPlayNext();
  if (__cm.cmMatch.phase === 'event') cmEventChoice(0);
  // 强制平局 1-1：pre 相位还没有 myTag，按主客补齐后写入进球事件
  const myTag = __cm.cmMatch.myIsHome ? 'h' : 'a';
  const oppTag = myIsHomeTag(myTag);
  function myIsHomeTag(t) { return t === 'h' ? 'a' : 'h'; }
  __cm.cmMatch.myTag = myTag;
  __cm.cmMatch.oppTag = oppTag;
  __cm.cmMatch.h1 = [{ team: myTag, min: 10, scorer: '球员' }];
  __cm.cmMatch.h2 = [{ team: oppTag, min: 60, scorer: '球员' }];
  __cm.cmMatch.keyEvent = null;
  __cm.cmMatch.quick = true;
  __cm.cmMatch.phase = 'ft';
  const myIsHome = __cm.cmMatch.myIsHome;
  cmMatchDone();
  const m = myPair; // 引用我队对局本体（后续阶段重抽不会影响该引用）
  ok(m.hg === 1 && m.ag === 1, '平局比分已写入 1-1');
  ok(m.penH !== m.penA && m.penH >= 2 && m.penA >= 2, '点球比分已写入且不同分 ' + m.penH + '-' + m.penA);
  const iWon = myIsHome ? (m.penH > m.penA) : (m.penA > m.penH);
  const trail = __cm.cgame.season.cup.myTrail;
  ok(Array.isArray(trail) && trail.length === 1 && trail[0].win === iWon && trail[0].penH === m.penH,
    '我队轨迹已记录且胜负判定一致（' + (myIsHome ? '主' : '客') + ' ' + (iWon ? '胜' : '负') + '）');
  const winners = cmCupWinners();
  ok(winners[0] === (iWon ? '梅州客家' : '上海海港'), 'cmCupWinners 晋级方 = 点球胜方');
  ok(__cm.cmMatch.shootout && __cm.cmMatch.shootout.win === iWon && __cm.cmMatch.shootout.my === (myIsHome ? m.penH : m.penA),
    'cmMatch.shootout 战报叙事数据正确');
  if (iWon) { if (myIsHome) fourPaths.homeWin++; else fourPaths.awayWin++; }
  else { if (myIsHome) fourPaths.homeLoss++; else fourPaths.awayLoss++; }
  __cm.cmMatch = null;
}
ok(fourPaths.homeWin >= 1 && fourPaths.homeLoss >= 1 && fourPaths.awayWin >= 1 && fourPaths.awayLoss >= 1,
  '主/客 × 胜/负 四条路径全部覆盖：' + JSON.stringify(fourPaths));

// ================= 3. AI 杯赛对阵（cmSimCupPair）平局同样有点球 =================
section('AI 杯赛对阵点球（cmSimCupPair 回归）');
let aiDraws = 0, aiBad = 0;
for (let i = 0; i < 300 && aiDraws < 40; i++) {
  const m = { h: '梅州客家', a: '青岛海牛', hg: null, ag: null, done: false, penH: 0, penA: 0 };
  cmSimCupPair(m, false);
  if (!m.done) continue;
  if (m.hg === m.ag) {
    aiDraws++;
    if (m.penH === m.penA) aiBad++;
  } else if (m.penH !== 0 || m.penA !== 0) aiBad++;
}
ok(aiDraws >= 5 && aiBad === 0, 'AI 平局 ' + aiDraws + ' 场全部有点球且胜负场无点球残留');

// ================= 4. 亚洲杯 6 场赛制 =================
section('亚洲杯 6 场赛制（cmGenNTMatches）');
cmCreateGame({ team: '梅州客家', lgKey: 'CL1', rep: 40 }, 'rv3教练');
for (const y of [2027, 2031]) {
  const gen = cmGenNTMatches(y);
  ok(gen.matches.length === 6, y + ' 亚洲杯 6 场（实际 ' + gen.matches.length + '）');
  ok(gen.matches[2].label.indexOf('第3轮') >= 0, y + ' 含小组赛第3轮');
  ok(gen.matches[5].label.indexOf('决赛') >= 0, y + ' 含决赛');
  ok(gen.matches.filter(m => m.ko).length === 3, y + ' 淘汰赛 3 场标记 ko');
  ok(gen.obj.targetWins === 3, y + ' targetWins=3');
  ok(gen.matches.every(m => m.h === CM_NT_TEAM && m.played === false), y + ' 对阵结构完整');
}
const genQ = cmGenNTMatches(2028);
ok(genQ.matches.length === 4, '对照：世预赛年仍为 4 场');
ok(CALENDAR.asianCupYears.includes(2027) && CALENDAR.asianCupYears.includes(2031), '亚洲杯年份定义未变');

// ================= 5. NT 淘汰赛平局点球 + cmNTMatchWon =================
section('NT 淘汰赛点球决胜 + cmNTMatchWon');
(function () {
  cmCreateGame({ team: '梅州客家', lgKey: 'CL1', rep: 40 }, 'rv3教练');
  const gen = cmGenNTMatches(2027);
  // 构造真实国脚池（否则 cmNTRatings 全 0，点球必败）
  const pool = [];
  cmLeagueTeams('CSL').concat(cmLeagueTeams('CL1')).forEach(t => {
    cmSquadOf(t).forEach(p => { if (p.nat === 'CN') pool.push(p.id); });
  });
  pool.sort((a, b) => cmPlayerById(b).ovr - cmPlayerById(a).ovr);
  __cm.cgame.nt = { year: 2027, idx: 0, matches: gen.matches, obj: gen.obj, poolIds: pool.slice(0, 26) };
  __cm.cgame.coach.nt = true;
  const myA = Math.round(cmNTRatings().A);
  ok(myA > 40 && myA < 110, 'NT 攻击评分合理 ' + myA);
  const finalM = gen.matches[5];
  const paths = { win: 0, loss: 0 };
  let guard = 0;
  while ((paths.win < 1 || paths.loss < 1) && guard++ < 400) {
    __cm.cmMatch = { phase: 'ft', fx: { type: 'nt', m: finalM }, myTeam: CM_NT_TEAM, myIsHome: true, myTag: 'h', oppTag: 'a', h1: [], h2: [], quick: true, keyEvent: null };
    __cm.cmMatch.h1 = [{ team: 'h', min: 10, scorer: null }];
    __cm.cmMatch.h2 = [{ team: 'a', min: 60, scorer: null }];
    __cm.cgame.nt.idx = 5;
    finalM.played = false; finalM.penH = 0; finalM.penA = 0;
    cmMatchDone();
    ok(finalM.penH !== finalM.penA, 'NT 决赛平局 → 点球不同分 ' + finalM.penH + '-' + finalM.penA);
    const won = cmNTMatchWon(finalM);
    ok(won === (finalM.penH > finalM.penA), 'cmNTMatchWon 与点球比分一致');
    if (won) paths.win++; else paths.loss++;
    if (__cm.cgame.nt) { __cm.cgame.nt.idx = 5; }
  }
  ok(paths.win >= 1 && paths.loss >= 1, 'NT 点球胜/负两路径覆盖：' + JSON.stringify(paths));
  // 小组赛平局不应有点球
  __cm.cmMatch = { phase: 'ft', fx: { type: 'nt', m: gen.matches[0] }, myTeam: CM_NT_TEAM, myIsHome: true, myTag: 'h', oppTag: 'a', h1: [{ team: 'h', min: 5, scorer: null }], h2: [{ team: 'a', min: 50, scorer: null }], quick: true, keyEvent: null };
  gen.matches[0].played = false; gen.matches[0].penH = 0; gen.matches[0].penA = 0;
  __cm.cgame.nt.idx = 0;
  cmMatchDone();
  ok(gen.matches[0].penH === 0 && gen.matches[0].penA === 0, '小组赛平局不触发点球');
  ok(!cmNTMatchWon(gen.matches[0]), '小组赛平局不计为胜');
  ok(!cmNTMatchWon({ played: false, hg: 3, ag: 0 }), '未赛不计为胜');
})();

// ================= 6. P0-1 浅色主题：浮层文字显式色（CSS 文本级检查） =================
section('P0-1 浅色主题显式色（CSS 文本级）');
const css = raw.slice(raw.indexOf('<style>') + 7, raw.indexOf('</style>'));
function ruleHasColor(selFrag, extra) {
  // 找到包含 selFrag 的规则体，检查其中是否显式声明 color
  const re = new RegExp('([^{}]*' + selFrag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '[^{}]*)\\{([^}]*)\\}', 'g');
  let m;
  while ((m = re.exec(css)) !== null) {
    if (m[2].includes(extra || 'color:var(--cm-ink)')) return true;
  }
  return false;
}
ok(ruleHasColor('.cm-root', 'color:var(--cm-ink)'), '.cm-root 显式 color');
ok(ruleHasColor('.cm-match-content'), '.cm-match-content 显式 color');
ok(ruleHasColor('.cm-menu-card'), '.cm-menu-card 显式 color');
ok(ruleHasColor('.cm-card'), '.cm-card 显式 color');
ok(ruleHasColor('.cm-table'), '.cm-table 显式 color');
ok(ruleHasColor('.cm-minline'), '.cm-minline 显式 color');
ok(ruleHasColor('.cm-deal'), '.cm-deal 显式 color');
ok(ruleHasColor('.cm-offer'), '.cm-offer 显式 color');
ok(ruleHasColor('.cm-title h2'), '.cm-title h2 显式 color');
ok(ruleHasColor('.cm-choice'), '.cm-choice 显式 color');
ok(ruleHasColor('.cm-empty', 'color:'), '.cm-empty 显式 color（--cm-dim 亦可）');
ok(/\.cm-newsline\{[^}]*color:var\(--cm-ink\)/.test(css), '.cm-newsline 显式 color');
ok(/\.cm-score \.side b\{[^}]*color/.test(css), '.cm-score 队名显式 color');
ok(!/html\[data-theme="light"\]\s*\.cm-(root|match-content|menu-card)/.test(css), '浅色主题无对 cm 根容器的颜色覆写');

// ================= 7. 竖屏改造：manifest / 布局标记 =================
section('竖屏改造标记');
const manifest = fs.readFileSync(path.join(ROOT, 'mobile/android/app/src/main/AndroidManifest.xml'), 'utf-8');
ok(/android:screenOrientation="portrait"/.test(manifest), 'MainActivity 已锁竖屏 portrait');
ok(!/sensorLandscape/.test(manifest), 'sensorLandscape 已移除');
ok(/@media \(max-width:700px\)\{[^@]*\.cm-topbar\{flex-wrap:wrap/.test(css.replace(/\n/g, '')), '窄屏 topbar 两行布局规则存在');
ok(/cmSyncTabsTop/.test(js) && /addEventListener\('resize',cmSyncTabsTop\)/.test(js), 'tabs top 由 JS 实测 topbar 高度同步');
ok(!/\@media \(orientation:landscape\) and \(max-height:540px\)\{\s*\.cm-topbar/.test(raw), '教练模式横屏特化块已移除');
ok(/\.cm-body\{[^}]*max-width:720px/.test(css), 'cm-body 桌面收窄至 720px 居中');
ok(/\.cm-table \.opt\{display:none\}/.test(css), '窄屏积分榜隐藏 平/负/进失 列');
ok(/\.retire-options\.solo\{grid-template-columns:1fr/.test(css), '退役屏单选项 solo 单列居中');
ok(/\.mono\.nt-crest/.test(css) && /showRetirement[\s\S]{0,600}retire-options'\)\s*;/.test(js), 'NT 徽章样式与退役 solo 逻辑就位');
ok(/class="rkz/.test(js) && css.includes('.cm-table .rkz.acc'), '积分榜 zone 已融入名次徽章（rkz）');
ok(!/cm-zone/.test(js) && !/\.cm-zone\{/.test(css), '悬空 cm-zone 竖条已完全移除');
ok(/对手情报<\/h3><div style="display:flex;align-items:center;gap:9px/.test(js) &&
   /cmCrestHTML\('team',cmMatch\.opp,'crest crest-sm'\)/.test(js), '对手情报卡含对手徽章行');

// ================= 结果 =================
console.log('\n结果: ' + passed + ' 通过, ' + failed + ' 失败');
process.exit(failed ? 1 : 0);
