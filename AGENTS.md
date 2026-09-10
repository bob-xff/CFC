# CFC2.0 智能体工作规范（ai-agent-workflow 5级工作流）

本项目所有 AI 开发任务统一执行 **5级使用方法工作流**（完整定义见 `.agents/skills/ai-agent-workflow/SKILL.md`，快速参考见 `assets/quick-reference.md`，检查清单见 `scripts/checklists/`）。来源：https://github.com/bob-xff/multi-level-comprehension-skill

## 每次任务必须执行的思考流程

在开始任何任务前，先在思考阶段完成以下判定，再动手：

### 1. 任务定级（5级框架）
| 级别 | CFC2.0 典型任务 |
|---|---|
| L1 基础生成 | 改文案、调数值、单函数小修 |
| L2 理解与修改 | Bug 修复、局部重构、UI 微调 |
| L3 多文件开发 | 新视图/新子系统（如教练模式单个玩法模块）、跨 HTML/CSS/JS 联动 |
| L4 架构设计 | 存档结构变更、引擎改造、模式解耦 |
| L5 自主交付 | 新版本整体交付（如 V2.3.0 教练模式）：设计→实现→测试→评审→打包→发布 |

### 2. 五步执行环（每任务必走）
1. **明确任务**：目标/输入输出/约束/验收标准，模糊处先探查代码再确认
2. **提供/收集上下文**：读本仓库关键结构（单文件 HTML 架构见下），相关函数与行号
3. **分阶段执行**：核心逻辑 → 错误处理 → 边界条件 → 性能 → 美化
4. **验证结果**：按下方验证矩阵执行，不通过不交付
5. **迭代优化**：评审/反馈 → 修复 → 再验证

### 3. CFC2.0 项目专用约束（每次任务检查）
- **单文件架构**：全部游戏代码在 `football-career-simulator.html`（约6800行）；改完必须 `node --check` 提取校验
- **禁止**运行 `build/revamp/assemble.py`（已加废弃守卫，会把主文件回退到 V2.1）
- **双端同步**：HTML 变更后必须 `python mobile/sync.py`；发版需重打三件套：
  exe（根目录 + `build/dist`）、APK/AAB（`mobile/android` gradle，版本号同步 bump）、并更新 `发布-安卓/`
- **存档兼容**：改动存档 schema 必须同步 `cmMigrateSave`（教练档）/读档容错（球员档），旧档读入不崩
- **模式隔离**：球员模式（全局 `game`）与教练模式（`cgame`，函数前缀 `cm/CM_`）互不引用全局状态
- **冒烟回归**：`node build/cm_smoke_test.js` 必须 0 FAIL 才能提交

### 4. 验证矩阵（按任务级别选用）
| 级别 | 必做验证 |
|---|---|
| L1-L2 | 语法校验 + 冒烟测试相关段落 + 手动走查改动点 |
| L3 | 上述 + 该子系统专项脚本验证（边界/异常路径） |
| L4 | 上述 + 存档兼容矩阵（缺字段组合）+ 幂等/重放测试 |
| L5 | 上述 + 多子代理独立评审（架构/引擎/经济/UI/状态机各一路）+ 浏览器真机走查 + 三端打包校验 |

### 5. 评审与质量清单
- 代码审查按 `scripts/checklists/code-review.md`（问题分 P0必须修/P1应修/P2可选，与项目现行 P0-P2 分级一致）
- 安全检查按 `scripts/checklists/security.md`（本项目重点：innerHTML 注入转义、localStorage 存档完整性）
- 测试验证按 `scripts/checklists/testing.md`（本项目重点：状态机幂等、随机流长时间压测、多端兼容）
- 问题修复后必须回归全部相关验证，并在提交信息中列明修复项

### 6. 提交与发布纪律
- 提交信息格式：`CFC V<版本>（测试版）：<主题>` + 分条列变更
- 发版三件套缺一不可：主 HTML、根目录 exe、`发布-安卓/` 的 APK+AAB
- 版本号四处同步：`GAME_VERSION`、splash 标签、`mobile/android/app/build.gradle`（versionName/versionCode）、`发布-安卓/` 文件名
