# -*- coding: utf-8 -*-
"""中足联官方主教练 -> 游戏队名 对齐
官方 club 名带赞助商后缀（浙江俱乐部绿城 / 河南俱乐部彩陶坊 / 辽宁铁人楠波湾 ...），
需按前缀规则映射；按 中乙 -> 中甲 -> 中超 顺序处理，高级别覆盖低级别，
避免"上海海港富盛经开"（中乙）顶掉"上海海港"（中超）的教练。
输出 build/coach_cfl.json
"""
import json, io, os, re

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BUILD = os.path.join(BASE, 'build')

h = io.open(os.path.join(BASE, 'football-career-simulator.html'), encoding='utf-8').read()
m2 = re.search(r'const LEAGUES=\{([\s\S]*?)\n\};', h)
LGE = {}
for k, tm in re.findall(r"(\w+):\{[^{}]*?teams:\[([^\]]*)\]", m2.group(1)):
    LGE[k] = re.findall(r"'([^']+)'", tm)
fillers = re.findall(r"'([^']+)'", re.search(r'const CM_FILLERS=\[([^\]]*)\]', h).group(1))

GAME = {}
for lg, ts in LGE.items():
    for t in ts:
        GAME[t] = lg
for t in fillers:
    GAME.setdefault(t, 'CL2')

# CFL 官方：club 名 -> {coach, lg}
CFL = {}
for code in ('CSL', 'CL1', 'CL2'):
    for x in json.load(io.open(os.path.join(BUILD, f'cfl_league_{code}.json'), encoding='utf-8')):
        if x.get('player_type') != 'coach':
            continue
        if '主教练' not in (x.get('position_name') or ''):
            continue
        CFL.setdefault(x['contestant_club_name'], {'lg': code}).setdefault('coach', x.get('player_name'))

CL2_OK = set(fillers)
ORDER = {'CL2': 0, 'CL1': 1, 'CSL': 2}


def core(s):
    return re.sub(r'(足球俱乐部|俱乐部|足球|股份|有限|公司|队)$', '', s or '')


def match(cfl_name):
    """官方队名 -> 游戏队名（无则 None）"""
    if cfl_name in GAME:
        return cfl_name
    c = core(cfl_name)
    if len(c) < 2:
        return None
    cands = [g for g in GAME if len(core(g)) >= 2 and (c.startswith(core(g)) or core(g).startswith(c))]
    if not cands:
        return None
    return max(cands, key=lambda g: len(core(g)))


out, prov = {}, {}
unmatched = []
for cfl_name, v in sorted(CFL.items(), key=lambda kv: ORDER[kv[1]['lg']]):
    if 'B队' in cfl_name:
        continue
    hit = match(cfl_name)
    # 中乙队只允许落到游戏内的 4 支中乙填充队（防止预备队/梯队顶掉一队）
    if v['lg'] == 'CL2' and hit and hit not in CL2_OK:
        hit = None
    if not hit:
        unmatched.append(f'{cfl_name}({v["lg"]})')
        continue
    out[hit] = v['coach']
    prov[hit] = f'{cfl_name}({v["lg"]})'

print('=== 中国区对齐结果 ===')
for g in [t for t in GAME if GAME[t] in ('CSL', 'CL1', 'CL2')]:
    print(f'   {g:<12} {GAME[g]:<5} {out.get(g,"—"):<14} <- {prov.get(g,"")}')
print()
print('未对齐的官方队名（游戏内无此队，正常）:', len(unmatched))
print('  ', ' | '.join(unmatched))
miss = [g for g in GAME if GAME[g] in ('CSL', 'CL1', 'CL2') and g not in out]
print()
print('游戏内中国区仍缺教练:', miss)
json.dump(out, io.open(os.path.join(BUILD, 'coach_cfl.json'), 'w', encoding='utf-8'),
          ensure_ascii=False, indent=1)
print('\n已写 build/coach_cfl.json  共', len(out), '队')
