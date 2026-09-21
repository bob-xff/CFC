# CFC 足球职业生涯模拟器

> 中国足球题材的单机职业生涯模拟器 —— 一份 HTML + 一份野心

## 项目简介

一款单文件 HTML 足球生涯模拟游戏。**16 岁**从俱乐部 U17 梯队起步，走完
U19 → U21 预备队 → 一线队 → 留洋欧洲 → 国家队的完整阶梯，赶上一个真实的世界杯周期：
2027 亚洲杯(沙特) · 2028 洛杉矶奥运会 · 2027-2033 世预赛 ·
2030 世界杯(西葡摩) · 2034 世界杯(沙特)。

最终目标：成就一条史无前例的中国巨星之路（金球奖 / 欧冠 / 世界杯）。

### 双模式

| 模式 | 视角 | 核心玩法 |
|------|------|----------|
| **球员模式** | 第一人称球员 | 训练、比赛、剧情抉择、续约谈判、留洋、转会 |
| **教练模式** | 第一人称主帅 | 引援球探、阵型战术、续约合同、升降级、欧冠亚冠 |

两个模式**全局状态完全隔离**（`game` vs `cgame`），不互相干扰。

## 多端形态

| 平台 | 入口 | 文件 |
|------|------|------|
| **桌面端 exe** | 双击运行 | `CFC足球职业生涯模拟器.exe`（PyInstaller 单文件包） |
| **浏览器** | `启动游戏-浏览器版.bat` 或直接打开 | `football-career-simulator.html` |
| **桌面窗口** | `桌面窗口版.bat`（pywebview 包裹） | `football-career-simulator.html` |
| **安卓 APK** | 安装即用 | `发布-安卓/CFC足球生涯（测试版）-V*.apk`（Capacitor WebView） |

## 快速开始

```bash
# 1. 浏览器版（任何现代浏览器）
open football-career-simulator.html

# 2. 桌面端（Windows）
双击 CFC足球职业生涯模拟器.exe

# 3. 安卓
adb install 发布-安卓/CFC足球生涯（测试版）-V*.apk
```

## 数据来源

- **球队 / 球员 / 身价**：Transfermarkt（德转）2025/26 赛季最新数据，4 路并行 WebFetch 采集，覆盖 240 支球队 + 5500+ 名真实球员
- **中文名规范**：日本球员用汉字实名、韩国球员用韩文姓名、外援通行译名（克雷桑/奥斯卡/本泽马）、中国球员全汉字实名
- **身价单位**：内部以**万欧**为单位，显示走 EA FC 风格 `€X.XK` / `€X.XM`

## 当前版本

**V2.6.4（2026-09-21）** —— 教练模式全面升级

主要更新：
- ✅ **智能球探推荐**：基于本队阵型位置缺口（最薄弱位置优先 50%）+ 性价比 + 潜力多维推荐
- ✅ **教练模式续约系统**：合同剩余 ≤1 年的球员转入「待续约」清单，可谈判续约（涨薪 20-35%）、挂牌出售
- ✅ **全球合同倒计时**：赛季推进时全联赛球员合同自动扣减，到期自动进入自由市场
- ✅ **旧档兼容**：V2.6.x 旧档自动补 `contract` 字段（默认 3 年）
- ✅ **教练主页续约提醒**：合同即将到期时在主页突出提示
- ✅ **240 队真实阵容 + 5500+ 名球员**（V2.6.3 德转数据）

历史版本：见 [CHANGELOG](#changelog)

## 开发与构建

### 环境要求
- Node.js ≥ 22（用于 JS 语法检查 + 回归测试）
- Python 3.13+（用于提取/校验 HTML 内嵌脚本）
- （可选）PyInstaller 6.x（打包 exe）
- （可选）JDK 17 + Android SDK + Gradle（打包 APK/AAB）

### 回归测试

```bash
# 提取 HTML 内嵌脚本
"C:/Users/henfy/.workbuddy/binaries/python/envs/default/Scripts/python.exe" -c "
import re
src=open('football-career-simulator.html',encoding='utf-8').read()
m=re.search(r'<script[^>]*>(.*?)</script>',src,re.S)
open('build/_syn.js','w',encoding='utf-8').write(m.group(1))"

# 语法检查
"C:/Users/henfy/.workbuddy/binaries/node/versions/22.22.2-2/node.exe" --check build/_syn.js

# 四套回归（必须全部 0 失败）
node build/cm_smoke_test.js          # 教练模式冒烟
node build/_rv3/cm_world_test.js     # 世界生成
node build/_rv3/player_polish_test.js
node build/_rv3/_baseline_test.js
```

### 打包发布

```bash
# 桌面 exe（PyInstaller）
pyinstaller --noconfirm --onefile --windowed \
  --name "CFC足球职业生涯模拟器" \
  --icon "assets/ui/logo.ico" \
  --add-data "football-career-simulator.html;." \
  --add-data "assets/logos;assets/logos" \
  build/cfc_game_app.py

# 安卓 APK/AAB（Capacitor）
python mobile/sync.py
cd mobile/android && ./gradlew assembleRelease bundleRelease
```

### 内嵌校验

打包后必须验证游戏内嵌 HTML sha256 与主文件一致：

```python
from PyInstaller.archive.readers import CArchiveReader
import hashlib
r = CArchiveReader('CFC足球职业生涯模拟器.exe')
data = r.extract('football-career-simulator.html')[0] if isinstance(r.extract('football-career-simulator.html'), tuple) else r.extract('football-career-simulator.html')
h = hashlib.sha256(data).hexdigest()
assert h == hashlib.sha256(open('football-career-simulator.html','rb').read()).hexdigest()
```

## 项目结构

```
CFC2.0/
├── football-career-simulator.html    # 核心单文件 HTML（约 8800 行）
├── CFC足球职业生涯模拟器.exe          # 桌面端单文件包（PyInstaller）
├── 启动游戏-浏览器版.bat
├── 桌面窗口版.bat
├── assets/
│   ├── ui/logo.ico                   # 桌面图标
│   └── logos/teams/                  # 240 个队徽 PNG（部分球队用文字徽章兜底）
├── 发布-安卓/                        # 历史 APK/AAB 归档
│   └── CFC足球生涯（测试版）-V*.{apk,aab}
├── mobile/                           # Capacitor 安卓工程
│   ├── www/                          # 同步产物（gitignored）
│   └── android/                      # Gradle 项目
├── build/
│   ├── _rv3/                         # 回归测试脚本（教练模式）
│   ├── apply_tm_data.py              # 德转数据装配脚本
│   ├── strip_editor_inject.py        # ZCode 编辑器注入剥离
│   ├── data/                         # 采集的德转原始数据（JSON）
│   └── cm_smoke_test.js              # 教练模式冒烟测试
├── cfc_game_app.py                   # pywebview 入口（用于 exe 打包）
└── README.md
```

## CHANGELOG

### V2.6.4（2026-09-21）— 教练模式全面升级
- **智能球探**：基于本队阵型位置缺口（最薄弱位置优先 50%）+ 性价比 + 潜力多维推荐；UI 显示推荐理由标签（补位置缺口 / 高潜新星 / 性价比 / 对位加强 / 补深度）
- **教练模式续约系统**：合同剩余 ≤1 年的本队球员自动进入「待续约」清单；可按要价续约（涨薪 20-35%，延长 2-3 年，谈判式成功率）；可挂牌出售；教练主页顶部加「X 名球员合同即将到期」提醒卡
- **全球合同倒计时**：赛季推进（`cmOffseasonWorld`）时遍历所有球队扣减 `contract`，到期球员自动进入自由球员池
- **旧档兼容**：`cmMigrateSave` 自动补 `contract` 字段（默认 3 年）、`season.renewals` 数组（默认空）
- 三路独立审计：架构/算法/UI 全部 P0/P1 修复
- 四套回归测试 0 失败（~620 通过）

### V2.6.3（2026-09-21）— 德转真实球员/身价全面更新
- 75 支球队、约 1800 名球员真实替换（CSL16 + CL1 16 + J1/J2 16 + K1 8 + SAU 7 + QAT 6 + UAE 6）
- 中文名规范（日本汉字实名 / 韩国汉字姓名 / 外交通行译名）
- 球队升降级：水原三星→金泉尚武、大邱FC→大田韩亚市民、乌姆沙拉尔→阿拉比
- 3 位主帅联网核实（金泉尚武=朱承镇、大田韩亚民众=黄善洪、阿拉比=科斯明·孔特拉）

### V2.6.2（2026-09-15）— 美术风格优化 + BGM 系统
- 美术：球场网格氛围背景、触屏按压回弹、卡片悬浮抬升、标题渐变字
- BGM：Web Audio 程序化合成四首场景曲目（主菜单 92bpm / 球员 112bpm / 教练 84bpm / 比赛 140bpm）
- 自定义背景音乐：游戏内导入本机音频（mp3/ogg/m4a/wav），IndexedDB 持久化

### V2.6.1（2026-09-11）— 经济加固 + 全真实数据
- 经济漏洞封堵：免签即卖同窗套利、关窗后操作、AI 报价倒挂、预算膨胀、解约欠款
- 引擎修复：声望 88+ 传奇可获豪门邀约、声望谷底强制挂印
- 中超 16 队 + 欧洲豪门主帅 2026 年 9 月真实在任快照

## 许可证

本项目为非商业个人项目，所有球队队徽版权归原俱乐部所有。
游戏内球员姓名 / 身价数据来自 Transfermarkt 公开页面，仅供学习使用。

## 致谢

- Transfermarkt（德转）公开数据
- TheSportsDB（部分队徽来源）
- EA FC 系列（视觉风格参考）
- Web Audio API（程序化 BGM 引擎）

---

**GitHub**: https://github.com/bob-xff/CFC
**当前最新**: V2.6.4