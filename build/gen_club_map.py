#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""构建「游戏队名 → 德转俱乐部」映射（v3 · 严格模式）。

v2 教训：模糊匹配产生假阳性（考文垂→斯旺西、巴里→那不勒斯、维拉诺瓦→阿斯顿维拉），
会把完全不相干的球员灌进球队。v3 规则：

  1. 人工别名表 _tm_alias.json 为**权威**：命中即用，未命中则判定无覆盖，不再模糊兜底。
  2. 无别名时，只接受「归一化精确相等」，或「difflib ≥ 0.90 且赛事代码一致」。
  3. 输出同时登记该俱乐部的真实在册球员数，供下游决定是否走真实数据。

输出
----
build/_tm_club_map.json  {游戏队名:{"tm":..,"comp":..,"n":球员数,"how":匹配方式}}
build/_tm_club_map.txt   人工复核清单
"""
import collections
import csv
import difflib
import io
import json
import os
import re
import unicodedata

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BUILD = os.path.join(BASE, 'build')
KG = os.path.join(os.path.expanduser('~'), '.cache', 'kagglehub',
                  'datasets', 'davidcariboo', 'player-scores', 'versions', '679')

LG2COMP = {
    'EPL': 'GB1', 'ENG2': 'GB1', 'LALIGA': 'ES1', 'ESP2': 'ES1',
    'SERIE_A': 'IT1', 'ITA2': 'IT1', 'BUNDESLIGA': 'L1', 'GER2': 'L1',
    'LIGUE_1': 'FR1', 'FRA2': 'FR1', 'EREDIVISIE': 'NL1', 'LIGA_PT': 'PO1',
    'J1': 'JAP1', 'J2': 'JAP1', 'K1': 'KR1', 'SAU': 'SA1',
    'BRA': 'BRA1', 'BRA2': 'BRA1', 'ARG': 'ARG1', 'MLS': 'MLS1', 'LIGA_MX': 'MEX1',
}
ALIAS_FILE = os.path.join(BUILD, '_tm_alias.json')


def norm(s):
    s = unicodedata.normalize('NFKD', s or '')
    s = ''.join(c for c in s if not unicodedata.combining(c)).lower()
    return re.sub(r'[^a-z0-9]', '', s)


def main():
    html = io.open(os.path.join(BASE, 'football-career-simulator.html'), encoding='utf-8').read()
    m = re.search(r'const LEAGUES=\{([\s\S]*?)\n\};', html)
    leagues = {}
    for mm in re.finditer(r"(\w+):\{name:'([^']*)'[\s\S]*?teams:\[([^\]]*)\]", m.group(1)):
        leagues[mm.group(1)] = re.findall(r"'([^']+)'", mm.group(3))
    world = re.findall(r"'([^']+)'", re.search(r"const CM_WORLD_LEAGUES=\[([^\]]*)\]", html).group(1))

    terms = json.load(io.open(os.path.join(BUILD, '_logo_terms.json'), encoding='utf-8'))
    EN = {}
    for k in ('gh', 'tsdb'):
        for t, v in terms.get(k, {}).items():
            EN.setdefault(t, v)
    ALIAS = json.load(io.open(ALIAS_FILE, encoding='utf-8')) if os.path.exists(ALIAS_FILE) else {}
    print(f'别名表 {len(ALIAS)} 条')

    # ---- 索引：德转队名 → (球员数, 赛事码) ----
    idx = collections.defaultdict(lambda: {'n': 0, 'comp': ''})
    with open(os.path.join(KG, 'players.csv'), encoding='utf-8') as fh:
        for r in csv.DictReader(fh):
            nm = (r.get('current_club_name') or '').strip()
            if not nm or (r.get('last_season') or '') < '2023':
                continue
            e = idx[nm]
            e['n'] += 1
            if not e['comp']:
                e['comp'] = r.get('current_club_domestic_competition_id') or ''
    by_norm = collections.defaultdict(list)
    for nm in idx:
        by_norm[norm(nm)].append(nm)
    allbase = list(by_norm.keys())

    def pick(nm, how):
        return {'tm': nm, 'comp': idx[nm]['comp'], 'n': idx[nm]['n'], 'how': how}

    def match(team, lg):
        # 1) 别名权威
        if team in ALIAS:
            a = ALIAS[team]
            if not a:
                return None
            hits = by_norm.get(norm(a))
            if hits:
                return pick(hits[0], 'alias')
            return None
        # 2) 精确
        for src in (EN.get(team), team):
            if not src:
                continue
            hits = by_norm.get(norm(src))
            if hits:
                return pick(hits[0], 'exact')
        # 3) 高置信模糊（需赛事一致）
        want = LG2COMP.get(lg)
        best, bs = None, 0.0
        for src in {EN.get(team), team}:
            if not src or not any('a' <= ch.lower() <= 'z' for ch in src):
                continue
            n = norm(src)
            if len(n) < 5:
                continue
            for cand in difflib.get_close_matches(n, allbase, n=4, cutoff=0.88):
                if LG2COMP and idx[by_norm[cand][0]]['comp'] not in ('', want):
                    continue
                r = difflib.SequenceMatcher(None, n, cand).ratio()
                if r > bs:
                    bs, best = r, by_norm[cand][0]
        if best and bs >= 0.90:
            return pick(best, f'fuzzy{bs:.2f}')
        return None

    mapping, report = {}, []
    for lg in world:
        for team in leagues.get(lg, []):
            r = match(team, lg)
            if r:
                mapping[team] = {**r, 'lg': lg}
                flag = '✓' if r['n'] >= 14 else '△'
                report.append(f"{flag} {lg:<12}{team:<14}→ {r['tm']:<36}{r['comp']:<6}n={r['n']:<4}{r['how']}")
            else:
                report.append(f"✗ {lg:<12}{team:<14}  —  无德转覆盖")

    io.open(os.path.join(BUILD, '_tm_club_map.json'), 'w', encoding='utf-8').write(
        json.dumps(mapping, ensure_ascii=False, indent=1))
    io.open(os.path.join(BUILD, '_tm_club_map.txt'), 'w', encoding='utf-8').write('\n'.join(report))
    good = [k for k, v in mapping.items() if v['n'] >= 14]
    print(f'匹配 {len(mapping)} 队，其中球员数≥14 的 {len(good)} 队')
    print('未匹配 / 覆盖不足:')
    for l in report:
        if not l.startswith('✓'):
            print('  ', l)


if __name__ == '__main__':
    main()
