#!/usr/bin/env node
// 手机端适配量化审计：真实小横屏视口下逐页测量溢出 + 截图
// 目标：找出所有"需要滚动"的页面（scrollHeight > clientHeight）
const path = require('path');
const fs = require('fs');
const puppeteer = require('puppeteer-core');

const ROOT = path.resolve(__dirname, '..', '..');
const OUT = path.join(__dirname, 'shots_audit');
const VIEWPORTS = [
  { name: 'small', width: 712, height: 360 },  // 紧凑小屏横屏（最差情况）
  { name: 'mid', width: 800, height: 378 },    // 主流（Pixel 4 类）
];

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await puppeteer.launch({
    executablePath: 'D:/Android/chrome-win64/chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu'],
  });

  for (const vp of VIEWPORTS) {
    const page = await browser.newPage();
    await page.setViewport({ width: vp.width, height: vp.height, deviceScaleFactor: 2 });
    await page.goto('file:///' + path.join(ROOT, 'football-career-simulator.html').replace(/\\/g, '/'), { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 3200));
    const tag = vp.name;
    const shot = async n => fs.writeFileSync(path.join(OUT, `${tag}-${n}.png`), await page.screenshot());

    const measure = label => page.evaluate(lab => {
      const de = document.documentElement;
      const overflowers = [];
      document.querySelectorAll('.view.active, .screen.active, .stage, body').forEach(el => {
        if (el.scrollHeight > el.clientHeight + 2 && el.clientHeight > 0)
          overflowers.push(`${el.id || el.className || el.tagName}: ${el.scrollHeight}>${el.clientHeight}`);
      });
      return { label: lab, win: `${window.innerWidth}x${window.innerHeight}`, docScroll: `${de.scrollHeight}>${de.clientHeight}`, overflowers };
    }, label);

    const results = [];

    // 开始页
    results.push(await measure('start'));
    await shot('01-start');

    // 创建页（顶部 + 底部）
    await page.evaluate(() => showScreen('create-screen'));
    await new Promise(r => setTimeout(r, 400));
    results.push(await measure('create'));
    await shot('02-create-top');
    await page.evaluate(() => window.scrollTo(0, 99999));
    await new Promise(r => setTimeout(r, 300));
    await shot('02-create-bottom');

    // 读档页
    await page.evaluate(() => showScreen('load-screen'));
    await new Promise(r => setTimeout(r, 400));
    results.push(await measure('load'));
    await shot('03-load');

    // 进入游戏
    await page.evaluate(() => { showScreen('create-screen'); });
    await page.evaluate(() => { document.getElementById('player-name').value = '审计员'; });
    await page.evaluate(() => createPlayer());
    await new Promise(r => setTimeout(r, 600));
    await page.evaluate(() => { const s = document.querySelector('#save-slots-container .save-slot'); if (s) s.click(); });
    await new Promise(r => setTimeout(r, 500));
    await page.evaluate(() => { if (document.getElementById('confirm-overlay').classList.contains('active')) document.getElementById('confirm-yes-btn').click(); });
    await new Promise(r => setTimeout(r, 800));

    for (const v of ['story', 'growth', 'stats', 'honors', 'log']) {
      await page.evaluate(name => switchView(name), v);
      await new Promise(r => setTimeout(r, 500));
      results.push(await measure('view-' + v));
      await shot('04-' + v);
      // 滚到中段/底部各截一张，看滚动后内容
      await page.evaluate(() => { const st = document.querySelector('.stage'); if (st) st.scrollTop = st.scrollHeight; });
      await new Promise(r => setTimeout(r, 300));
      await shot('04-' + v + '-bottom');
      await page.evaluate(() => { const st = document.querySelector('.stage'); if (st) st.scrollTop = 0; });
    }

    // 游戏菜单
    await page.evaluate(() => toggleGameMenu());
    await new Promise(r => setTimeout(r, 400));
    results.push(await measure('menu'));
    await shot('05-menu');

    console.log(`\n===== 视口 ${tag} ${vp.width}x${vp.height} =====`);
    for (const r of results) {
      const flag = (r.docScroll !== 'false' && r.docScroll.split('>')[0] !== r.docScroll.split('>')[1]) || r.overflowers.length;
      console.log(`${flag ? '★★溢出' : '——正常'}  ${r.label}  doc[${r.docScroll}]  ${r.overflowers.join(' | ')}`);
    }
    await page.close();
  }
  await browser.close();
  console.log('\nshots →', OUT);
})();
