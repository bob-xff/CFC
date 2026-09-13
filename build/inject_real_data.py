# -*- coding: utf-8 -*-
"""把重建后的真实数据注入 football-career-simulator.html

注入 6 张常量表：
  TM_DB / TM_POOL          —— 真实球员库（中文实名 + 德转身价）
  TEAM_STARS               —— 各队球星（末位固定为门将，供零封榜使用）
  CM_STAR_POS / CM_STAR_AGE —— 球星位置与年龄
  TEAM_COACHES             —— 真实主教练

安全：逐块正则校验必须命中恰好 1 次；写前备份到系统 Temp；写后语法自检。
用法：python build/inject_real_data.py [--apply]
"""
import json, io, os, re, sys, shutil, tempfile, collections

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BUILD = os.path.join(BASE, 'build')
TARGET = os.path.join(BASE, 'football-career-simulator.html')
APPLY = '--apply' in sys.argv

sys.path.insert(0, BUILD)
from gen_real_db import eur_to_ovr

db = json.load(io.open(os.path.join(BUILD, 'real_db.json'), encoding='utf-8'))
pool = json.load(io.open(os.path.join(BUILD, 'real_pool.json'), encoding='utf-8'))
coach_data = json.load(io.open(os.path.join(BUILD, 'team_coaches.json'), encoding='utf-8'))
coaches = coach_data['coaches']

html = io.open(TARGET, encoding='utf-8').read()


def blk_src(name, src):
    """定位 `const NAME={ ... };` 的完整原文（括号配对扫描，兼容单行/多行/美化格式）。

    返回 (start, end, value_text)，未找到返回 None。
    JSON 字面量中可能出现 `};`（如字符串里），故用花括号深度计数而非正则。
    """
    m = re.search(r'const\s+' + name + r'\s*=\s*\{', src)
    if not m:
        return None
    start = m.start()
    i = m.end() - 1                     # 指向 '{'
    depth = 0
    in_str = False
    esc = False
    while i < len(src):
        c = src[i]
        if in_str:
            if esc:
                esc = False
            elif c == '\\':
                esc = True
            elif c == '"':
                in_str = False
        else:
            if c == '"':
                in_str = True
            elif c == '{':
                depth += 1
            elif c == '}':
                depth -= 1
                if depth == 0:
                    j = i + 1
                    while j < len(src) and src[j] in ' \t\r\n':
                        j += 1
                    if j >= len(src) or src[j] != ';':
                        return None
                    return (start, j + 1, src[m.end() - 1:i + 1])
        i += 1
    return None


def blk(name):
    r = blk_src(name, html)
    return r[2] if r else None


# ---------- 保留原有星级数量（维持联赛强度模型），新队默认 3 ----------
old_stars_raw = blk('TEAM_STARS') or ''
OLD_CNT = {k: len(re.findall(r"'([^']+)'", v))
           for k, v in re.findall(r"'([^']+)':\[([^\]]*)\]", old_stars_raw)}

TEAM_STARS, STAR_POS, STAR_AGE = {}, {}, {}
for team, v in db.items():
    pl = v['pl']
    if not pl:
        continue
    scored = sorted(pl, key=lambda e: -eur_to_ovr(e[3]))
    gks = [e for e in scored if e[1] == 'GK']
    outfield = [e for e in scored if e[1] != 'GK']
    n = max(2, min(6, OLD_CNT.get(team, 3)))
    picks = outfield[:max(1, n - 1)]
    if not gks:
        continue
    picks = picks + [gks[0]]                      # 末位必须是门将（零封榜取 stars[last]）
    TEAM_STARS[team] = [e[0] for e in picks]
    for e in picks:
        STAR_POS.setdefault(e[0], e[1])
        STAR_AGE.setdefault(e[0], e[2])

# ---------- 与中国区官方教练表合并 ----------
print(f'数据源：TM_DB {len(db)} 队 / TM_POOL {len(pool)} 联赛 / 球星 {len(STAR_POS)} 人 / 教练 {len(coaches)} 队')
missing_coach = [t for t in db if t not in coaches]
print('无主教练的队:', len(missing_coach), missing_coach[:12])
missing_star = [t for t in db if t not in TEAM_STARS]
print('无球星的队:', len(missing_star), missing_star[:12])


def js(obj):
    return json.dumps(obj, ensure_ascii=False, separators=(',', ':'))


REPL = [
    ('TM_DB', js(db)),
    ('TM_POOL', js(pool)),
    ('TEAM_STARS', js(TEAM_STARS)),
    ('CM_STAR_POS', js(STAR_POS)),
    ('CM_STAR_AGE', js(STAR_AGE)),
    ('TEAM_COACHES', js(coaches)),
]

new_html = html
report = []
for name, val in REPL:
    found = blk_src(name, new_html)
    if not found:
        print(f'!! {name} 定位失败（未找到或括号不配对），中止')
        sys.exit(1)
    s, e, _ = found
    old_len = e - s
    new_html = new_html[:s] + 'const ' + name + '=' + val + ';' + new_html[e:]
    report.append((name, old_len, len(val) + len('const ') + 3))

print()
print(f'{"常量":<14}{"原长度":>10}{"新长度":>10}{"变化":>12}')
for n, o, w in report:
    print(f'{n:<14}{o:>10,}{w:>10,}{w-o:>+12,}')
print(f'HTML 总长 {len(html):,} -> {len(new_html):,}  ({len(new_html)-len(html):+,})')

# ---------- 回读校验：重定位每张表并确认可解析为合法 JSON、条目数一致 ----------
bad = []
for name, val in REPL:
    found = blk_src(name, new_html)
    if not found:
        bad.append((name, '定位失败'))
        continue
    try:
        back = json.loads(found[2])
    except Exception as ex:
        bad.append((name, f'JSON 解析失败: {ex}'))
        continue
    want = json.loads(val)
    if back != want:
        bad.append((name, f'内容不一致 ({len(back)} vs {len(want)})'))
if bad:
    print('!! 回读校验失败：')
    for n, why in bad:
        print(f'   {n}: {why}')
    sys.exit(1)
print('回读校验通过：6 张常量表均可解析且与源数据一致')

if not APPLY:
    print('\n[预览模式] 未写入。加 --apply 生效。')
    sys.exit(0)

bak = os.path.join(tempfile.gettempdir(), 'cfc_before_inject_real_data.html')
shutil.copy2(TARGET, bak)
io.open(TARGET, 'w', encoding='utf-8').write(new_html)
print(f'\n已写入 {TARGET}\n备份 {bak}')
