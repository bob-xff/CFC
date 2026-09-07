#!/usr/bin/env node
// 横屏手机视口截图台：用 Edge 无头驱动本地 HTML，
// 截取开始页/创建页/读档页 + 游戏内五大视图 + 游戏菜单，供横屏适配验收。
const path = require('path');
const puppeteer = require('puppeteer-core');

const ROOT = path.resolve(__dirname, '..', '..');
const OUT = path.join(__dirname, 'shots');

(async () => {
  const fs = require('fs');
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await puppeteer.launch({
    executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu', '--force-device-scale-factor=2'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 800, height: 360, deviceScaleFactor: 2 }); // 横屏手机 ≈ S23
  await page.goto('file:///' + path.join(ROOT, 'football-career-simulator.html').replace(/\\/g, '/'), { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1200));

  const shot = async name => fs.writeFileSync(path.join(OUT, name + '.png'), await page.screenshot());
  await shot('01-start');

  await page.evaluate(() => showScreen('load-screen'));
  await new Promise(r => setTimeout(r, 400));
  await shot('02-load');

  await page.evaluate(() => showScreen('create-screen'));
  await new Promise(r => setTimeout(r, 400));
  await shot('03-create');

  // 直接创建球员进入游戏
  await page.evaluate(() => { showScreen('create-screen'); });
  await page.evaluate(() => createPlayer());
  await new Promise(r => setTimeout(r, 800));
  for (const v of ['story', 'growth', 'stats', 'honors', 'log']) {
    await page.evaluate(name => switchView(name), v);
    await new Promise(r => setTimeout(r, 500));
    await shot('04-view-' + v);
  }
  // 游戏菜单
  await page.evaluate(() => toggleGameMenu());
  await new Promise(r => setTimeout(r, 400));
  await shot('05-menu');
  // 横向滚动检查
  const overflow = await page.evaluate(() => ({
    scrollW: document.documentElement.scrollWidth, innerW: window.innerWidth,
    bodyScroll: document.body.scrollWidth,
  }));
  console.log('overflow check:', JSON.stringify(overflow));
  await browser.close();
  console.log('shots saved to', OUT);
})();
