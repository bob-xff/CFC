#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""CFC V2.6.1 真实球员库生成器（取代 build/gen_tm_db.py）

数据源
------
1. 中国区：中足联官方接口 api.cfl-china.cn（2026 赛季在册实名）
   → 中超 16 队 / 中甲 16 队 / 中乙 4 队，中文实名 + 真位置 + 真生日 + 真国籍
2. 海外区：Kaggle davidcariboo/player-scores（德转官方数据管道镜像，快照 2026-07-06）
   → 真名 / 真位置 / 真年龄 / 真身价（market_value_in_eur）

分级策略（诚实标注）
------------------
A. 德转覆盖俱乐部（映射表球员数 ≥14）→ 全用德转真实数据
B. 德转覆盖不足 / 未覆盖 → 本队真实在册球员 + 「同国籍真实球员池」补位
   （姓名 / 位置 / 年龄均为真实数据；俱乐部归属为游戏编排，身价按球队档位标定）
C. 中国俱乐部 → 中足联官方实名，身价按德转阶梯标定

硬保证
------
* 绝不生成虚构姓名
* 一名球员全局只归属一支球队（旧脚本的跨队灌池缺陷已修复）
* eur↔ovr 采用与游戏内 TM_LADDER 一致的相邻档插值（修复旧脚本首档插值错误）

输出：build/real_db.json、build/real_pool.json、build/real_report.txt
"""
import collections
import csv
import io
import json
import os
import re
import sys
import unicodedata

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BUILD = os.path.join(BASE, 'build')
KG = os.path.join(os.path.expanduser('~'), '.cache', 'kagglehub',
                  'datasets', 'davidcariboo', 'player-scores', 'versions', '679')
SNAP, CN_REF = '2026-07-06', '2026-09-01'
MIN_SQUAD, TARGET = 16, 23

NEEDS = [('GK', 3), ('CB', 4), ('LB', 2), ('RB', 2), ('CDM', 2),
         ('CM', 3), ('CAM', 2), ('LW', 1), ('RW', 1), ('ST', 3)]
COARSE_OF = {'GK': 'GK', 'CB': 'DF', 'LB': 'DF', 'RB': 'DF',
             'CDM': 'MF', 'CM': 'MF', 'CAM': 'MF', 'LW': 'FW', 'RW': 'FW', 'ST': 'FW'}
# 中国联赛无德转身价，用「俱乐部基准分 - 队内实力排名衰减」折算评分
OVR_DROP = [0, 1, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 12, 13, 14]
RANK_MULT = [2.20, 1.70, 1.45, 1.30, 1.15, 1.05, 1.00, 0.95, 0.88, 0.80,
             0.72, 0.62, 0.50, 0.40, 0.33, 0.28, 0.24, 0.20, 0.17, 0.14,
             0.12, 0.10, 0.08]

CN_ALIAS = {'浙江队': '浙江俱乐部绿城', '河南队': '河南俱乐部彩陶坊',
            '大连英博': '大连英博海发', '辽宁铁人': '辽宁铁人楠波湾',
            '梅州客家': '梅州客家犀旺', '延边龙鼎': '延边龙鼎可喜安',
            '宁波队': '宁波俱乐部'}
CN_DOMESTIC = {'中国', '中国香港', '中国澳门', '中国台湾'}
CN_CB_SHIRTS = {2, 3, 4, 5, 6}          # 经典中卫号码（帮身高不足的中卫正名）


def _shirt(p):
    try:
        return int(str(p.get('player_shirt_number') or '').strip() or 0)
    except ValueError:
        return 0


# 中足联粗位置 → 游戏细位置（各粗位置给出「主力配额」所需的细位置序列）
# 注意：细位置是**推测**出来的，中足联只给 GK/DF/MF/FW。
# 旧版按身高直接排序贴标签，把 184cm 的国脚中卫朱辰杰挤成边后卫，
# 再被外援挤掉整份名单。现改为「先按实力取核心，再在核心内定细位置」。
CN_PLAN = {'GK': ['GK', 'GK', 'GK', 'GK'],
           'DF': ['CB', 'CB', 'CB', 'CB', 'LB', 'LB', 'RB', 'RB', 'CB', 'LB', 'RB'],
           'MF': ['CDM', 'CDM', 'CM', 'CM', 'CM', 'CAM', 'CAM', 'CM', 'CDM', 'CAM'],
           'FW': ['ST', 'ST', 'ST', 'LW', 'RW', 'ST', 'LW', 'RW']}

NAT_PREF = {
    'K1': ['Korea, South', 'Japan', 'Brazil', 'Australia'],
    'QAT': ['Qatar', 'United Arab Emirates', 'Saudi Arabia', 'Brazil', 'Portugal',
            'Morocco', 'Tunisia', 'France', 'Senegal', 'Algeria'],
    'UAE': ['United Arab Emirates', 'Qatar', 'Saudi Arabia', 'Brazil', 'Portugal',
            'Morocco', 'Tunisia', 'Egypt', 'France', 'Senegal'],
    'J2': ['Japan', 'Brazil', 'Korea, South'],
    'ENG2': ['England', 'Scotland', 'Ireland', 'Wales', 'Nigeria'],
    'ESP2': ['Spain', 'Argentina', 'Uruguay', 'Colombia', 'Brazil'],
    'GER2': ['Germany', 'Austria', 'Poland', 'Netherlands', 'Turkey'],
    'ITA2': ['Italy', 'Argentina', 'Brazil', 'Albania', 'Croatia'],
    'FRA2': ['France', 'Senegal', 'Ivory Coast', 'Algeria', 'Morocco', 'Cameroon'],
    'BRA2': ['Brazil', 'Argentina', 'Uruguay', 'Colombia'],
    'CONT': ['Thailand', 'Australia', 'Brazil', 'Japan', 'Korea, South'],
}

POS_MAP = {'goalkeeper': 'GK', 'centre-back': 'CB', 'left-back': 'LB', 'right-back': 'RB',
           'defensive midfield': 'CDM', 'central midfield': 'CM', 'attacking midfield': 'CAM',
           'left midfield': 'LW', 'right midfield': 'RW', 'left winger': 'LW',
           'right winger': 'RW', 'second striker': 'ST', 'centre-forward': 'ST'}
COARSE = {'goalkeeper': 'GK', 'defender': 'CB', 'midfielder': 'CM', 'attacker': 'ST'}

TM_LADDER = [(150000000, 93), (100000000, 91), (75000000, 90), (55000000, 89),
             (40000000, 88), (30000000, 87), (24000000, 86), (19000000, 85),
             (15000000, 84), (12000000, 83), (9000000, 82), (7000000, 81),
             (5500000, 80), (4200000, 79), (3200000, 78), (2500000, 77),
             (1900000, 76), (1500000, 75), (1150000, 74), (900000, 73),
             (700000, 72), (540000, 71), (420000, 70), (330000, 69),
             (260000, 68), (200000, 67), (160000, 66), (125000, 65),
             (100000, 64), (80000, 63), (62000, 62), (50000, 61),
             (40000, 60), (32000, 59), (26000, 58), (21000, 57),
             (17000, 56), (14000, 55), (11000, 54), (9000, 53),
             (7000, 52), (5500, 51), (4500, 50), (3500, 49),
             (2800, 48), (2200, 47), (1800, 46)]

# 快照校准：Kaggle 快照中 K 联赛无覆盖（KR1 实为克罗地亚），K1 走 POOL 合成路径，
# RANK_MULT 衰减比真实身价分布陡（中位评分 62 vs J1 71），设倍率下限压缩贫富差。
RANK_FLOOR = {'K1': 0.30}

# 中国区低评分段身价地板（保单调）：德转中国联赛球员最低身价 €1万~2.5万，
# 而共享阶梯在 ovr<58 段插值只有 €1.8k~21k，故按评分分档抬底（ovr↔eur 双向一致不破坏）。
CN_TAIL = [(42, 4500), (44, 6000), (46, 7500), (48, 10000), (50, 13000),
           (52, 16000), (54, 20000), (56, 24000), (57, 25500)]


def cn_tail_eur(ovr):
    if ovr < CN_TAIL[0][0] or ovr >= 58:
        return 0
    for (o0, e0), (o1, e1) in zip(CN_TAIL, CN_TAIL[1:]):
        if ovr <= o1:
            return int(e0 + (e1 - e0) * (ovr - o0) / (o1 - o0))
    return 0


def eur_to_ovr(eur):
    eur = eur or 0
    if eur >= TM_LADDER[0][0]:
        return 94
    for i, (e, o) in enumerate(TM_LADDER):
        if eur >= e:
            te, to = TM_LADDER[i - 1]
            return int(round(o + (eur - e) / (te - e) * (to - o)))
    le, lo = TM_LADDER[-1]
    return max(44, int(round(lo - (le - eur) / le * 2)))


def ovr_to_eur(ovr):
    """评分→身价（与游戏内 ovrToEur 同构）。

    旧 build/gen_tm_db.py 的 eur_for_ovr 把首档插值起点写成最低档 (900, 44)，
    于是 ovr=82 被算成 1.16 亿欧（武磊评级虚高到 92）。此处按相邻档正确插值。
    """
    ovr = max(44, min(94, ovr))
    if ovr >= TM_LADDER[0][1]:
        return int(round(TM_LADDER[0][0] * (1.35 ** (ovr - TM_LADDER[0][1]))))
    for i in range(1, len(TM_LADDER)):
        ce, co = TM_LADDER[i]
        pe, po = TM_LADDER[i - 1]
        if ovr >= co:
            return int(round(ce + (ovr - co) / (po - co) * (pe - ce)))
    le, lo = TM_LADDER[-1]
    return int(round(le * max(0.3, ovr / lo)))


def norm(s):
    s = unicodedata.normalize('NFKD', s or '')
    s = ''.join(c for c in s if not unicodedata.combining(c)).lower()
    return re.sub(r'[^a-z0-9]', '', s)


def nkey(n):
    return norm(n) or (n or '').strip()


def shash(s):
    h = 0
    for ch in s:
        h = (h * 31 + ord(ch)) & 0xFFFFFFFF
    return h


def age_of(dob, ref):
    try:
        y, m, d = map(int, dob[:10].split('-'))
        ry, rm, rd = map(int, ref.split('-'))
        a = ry - y - (1 if (rm, rd) < (m, d) else 0)
        return a if 14 <= a <= 46 else None
    except Exception:
        return None


def parse_eur(v):
    try:
        return int(float(v))
    except Exception:
        return 0


def age_mult(a):
    return (0.72 if a <= 20 else 0.92 if a <= 22 else 1.12 if a <= 24 else
            1.20 if a <= 28 else 1.00 if a <= 30 else 0.80 if a <= 32 else
            0.60 if a <= 34 else 0.42)


def nat_code(cit):
    c = (cit or '').lower()
    return 'CN' if 'china' in c else 'JP' if 'japan' in c else 'KR' if 'korea' in c else 'FOR'


def tm_pos(r):
    p = POS_MAP.get((r.get('sub_position') or '').strip().lower())
    return p or COARSE.get((r.get('position') or '').strip().lower(), 'CM')


def fill_squad(cands, make_row):
    """按 NEEDS 位置配额取人；cands 已按优先级排序。"""
    used, squad = set(), []
    for pos, n in NEEDS:
        for _ in range(n):
            pick = None
            for stage in (0, 1, 2):
                for c in cands:
                    if id(c) in used:
                        continue
                    if stage == 0 and c['pos'] != pos:
                        continue
                    if stage == 1 and COARSE_OF.get(c['pos']) != COARSE_OF[pos]:
                        continue
                    if stage == 2 and c['pos'] == 'GK' and pos != 'GK':
                        continue
                    pick = c
                    break
                if pick:
                    break
            if not pick:
                continue
            used.add(id(pick))
            squad.append(make_row(pick, len(squad)))
    return squad


def parse_html(html):
    """V2.6.1：改用花括号配对提取（旧懒惰正则在单行/双引号 JSON 上会跨块溢出或解析为空，
    导致重跑时静默丢失球星加成）。任何常量解析为空都直接抛错，禁止静默降级。"""
    def blk(name):
        m = re.search(r'const\s+' + name + r'\s*=\s*\{', html)
        if not m:
            raise ValueError('const %s 未找到' % name)
        i = m.end() - 1
        depth = 0
        in_str = False
        esc = False
        while i < len(html):
            ch = html[i]
            if in_str:
                if esc:
                    esc = False
                elif ch == '\\':
                    esc = True
                elif ch in '"\'':
                    in_str = False
            else:
                if ch in '"\'':
                    in_str = True
                elif ch == '{':
                    depth += 1
                elif ch == '}':
                    depth -= 1
                    if depth == 0:
                        return html[m.end():i]
            i += 1
        raise ValueError('const %s 花括号未闭合' % name)

    C = {}
    base_txt = blk('CM_TEAM_BASE')
    C['BASE'] = {k: int(v) for k, v in re.findall(r'"([^"]+)":\s*(\d+)', base_txt)}
    if not C['BASE']:
        C['BASE'] = {k: int(v) for k, v in re.findall(r"'([^']+)':\s*(\d+)", base_txt)}
    if not C['BASE']:
        raise ValueError('CM_TEAM_BASE 解析为空')

    stars_txt = blk('TEAM_STARS')
    stars = {}
    for mm in re.finditer(r'"([^"]+)":\s*\[(.*?)\]', stars_txt):
        stars[mm.group(1)] = re.findall(r'"([^"]+)"', mm.group(2))
    if not stars:
        for mm in re.finditer(r"'([^']+)':\[([^\]]*)\]", stars_txt):
            stars[mm.group(1)] = re.findall(r"'([^']+)'", mm.group(2))
    if not stars:
        raise ValueError('TEAM_STARS 解析为空')
    C['STARS'] = stars

    leagues = {}
    lg_txt = blk('LEAGUES')
    for mm in re.finditer(r'(\w+):\{name:[\'"]([^\'"]*)[\'"][\s\S]*?teams:\[(.*?)\]', lg_txt):
        leagues[mm.group(1)] = re.findall(r'[\'"]([^\'"]+)[\'"]', mm.group(3))
    if not leagues:
        raise ValueError('LEAGUES 解析为空')
    C['LEAGUES'] = leagues

    C['WORLD'] = re.findall(r'[\'"]([^\'"]+)[\'"]',
                            re.search(r'const CM_WORLD_LEAGUES=\[(.*?)\]', html, re.S).group(1))
    C['FILLERS'] = re.findall(r'[\'"]([^\'"]+)[\'"]',
                              re.search(r'const CM_FILLERS=\[(.*?)\]', html, re.S).group(1))
    C['CONT'] = re.findall(r'[\'"]([^\'"]+)[\'"]',
                           re.search(r'const CM_CONT_FILLERS=\[(.*?)\]', html, re.S).group(1))
    return C


def main():
    html = io.open(os.path.join(BASE, 'football-career-simulator.html'), encoding='utf-8').read()
    C = parse_html(html)
    BASEV, LEAGUES = C['BASE'], C['LEAGUES']
    tmmap = json.load(io.open(os.path.join(BUILD, '_tm_club_map.json'), encoding='utf-8')) \
        if os.path.exists(os.path.join(BUILD, '_tm_club_map.json')) else {}
    used, db, src, log = set(), {}, {}, []

    # ---------- 1. 德转原始 ----------
    allp = collections.defaultdict(list)
    with open(os.path.join(KG, 'players.csv'), encoding='utf-8') as fh:
        for r in csv.DictReader(fh):
            nm = (r.get('current_club_name') or '').strip()
            if not nm or (r.get('last_season') or '') < '2023':
                continue
            age = age_of(r.get('date_of_birth') or '', SNAP)
            if age is None:
                continue
            allp[nm].append({'name': r['name'], 'pos': tm_pos(r), 'age': age,
                             'eur': parse_eur(r.get('market_value_in_eur')),
                             'nat': nat_code(r.get('country_of_citizenship')),
                             'cit': r.get('country_of_citizenship') or '',
                             'pid': r.get('player_id'),
                             'ls': r.get('last_season') or '',
                             'comp': r.get('current_club_domestic_competition_id') or '',
                             'caps': int(r.get('international_caps') or 0)})
    # 同一 player_id 只保留一条（转会记录取最新赛季所属俱乐部）
    best_pid = {}
    for nm in allp:
        keep = []
        for p in allp[nm]:
            pid = p['pid']
            if not pid:
                keep.append(p)
                continue
            cur = best_pid.get(pid)
            if cur is None or p['ls'] > cur[1]:
                best_pid[pid] = (nm, p['ls'])
            keep.append(p)
        allp[nm] = keep
    for nm in list(allp):
        allp[nm] = [p for p in allp[nm]
                    if not p['pid'] or best_pid[p['pid']][0] == nm]
    for nm in allp:
        allp[nm].sort(key=lambda p: (-p['eur'], -p['caps']))
    log.append(f'德转快照 {SNAP}：覆盖俱乐部名 {len(allp)} 个')

    # ---------- 2. 中国区 ----------
    # 官方接口返回的是「转会历史」：同一 player_id 会有旧队（player_active=no）
    # 与新队（player_active=yes）两条记录。必须按 player_id 归并到当前俱乐部，
    # 否则会出现同一名球员同时挂在两支球队（例：胡睿宝 深圳新鹏城/云南玉昆）。
    latest = {}
    for code in ('CSL', 'CL1', 'CL2'):
        fp = os.path.join(BUILD, f'cfl_league_{code}.json')
        if not os.path.exists(fp):
            continue
        for r in json.load(io.open(fp, encoding='utf-8')):
            if r.get('player_type') != 'player':
                continue
            pid = r.get('player_id') or (r.get('player_name') + '|' + str(r.get('date_of_birth')))
            key = (1 if r.get('player_active') == 'yes' else 0, str(r.get('start_date') or ''))
            if pid not in latest or key > latest[pid][0]:
                latest[pid] = (key, {**r, '_lg': code})
    by_club = collections.defaultdict(list)
    for _, r in latest.values():
        by_club[r['contestant_club_name']].append(r)

    def resolve(team):
        for c in (CN_ALIAS.get(team), team):
            if c and c in by_club:
                return c
        for c in by_club:
            if c.startswith(team) or team.startswith(c):
                return c
        return None

    def cn_rank(p, stars):
        """中足联名单排序分。

        注意：**不能**对老将下重手。中足联只给在册名单，没有能力值，
        早期版本给 34+ 老将 -190 的年龄惩罚，结果把武磊（1991 年生、7 号）
        挤出了上海海港 23 人名单 —— 那是明显的数据缺陷。
        改用「球衣号」作为主力信号（1~11 号基本是首发），并把年龄曲线压平。
        """
        sc = 0.0
        nm = p['player_name']
        if nm in stars:
            sc += 3000 - stars.index(nm) * 25
        if p.get('nationality') not in CN_DOMESTIC:
            sc += 900
        a = age_of(p.get('date_of_birth', ''), CN_REF) or 25
        # 年龄曲线压平：老将只轻罚。中足联名单是"在册"，34 岁的武磊（7 号）
        # 显然该排在边缘球员之前，早期 -190 的重罚会把这种球员挤出名单。
        sc += 300 if 24 <= a <= 30 else 288 if a <= 23 else 280 if a <= 33 else 268 if a <= 36 else 210
        if p.get('player_active') == 'yes':
            sc += 60
        sn = _shirt(p)
        if 1 <= sn <= 30:
            sc += (31 - sn) * 12          # 7 号 -> +288；1 号主力门将 -> +360
        return sc + shash(nm) % 100

    def cn_cands(team, stars):
        out = [{'name': p['player_name'],
                'pos': (p.get('position_code') or 'MF').strip(),
                'age': age_of(p.get('date_of_birth', ''), CN_REF) or 25,
                'h': int(str(p.get('height') or 0).strip() or 0),
                'sn': _shirt(p),
                'nat': 'CN' if p.get('nationality') in CN_DOMESTIC else 'FOR'}
               for p in sorted(by_club[team], key=lambda p: -cn_rank(p, stars))]
        for idx, c in enumerate(out):
            c['rk'] = idx                      # 队内实力排名（cn_rank 降序）
        groups = collections.defaultdict(list)
        for c in out:
            groups[c['pos']].append(c)
        for g, plan in CN_PLAN.items():
            lst = groups.get(g, [])
            quota = sum(n for k, n in NEEDS if COARSE_OF[k] == g)
            if g == 'DF' and quota and len(lst) > quota:
                # 先在实力排名前 quota 名里定细位置：经典中卫号（2~6）视为中卫，
                # 其余按身高。这样国脚中卫不会被身高误判成边后卫而落选。
                core, rest = lst[:quota], lst[quota:]
                tall = sorted(core, key=lambda c: -(c['h'] + (9 if c['sn'] in CN_CB_SHIRTS else 0)))
                for i, c in enumerate(tall):
                    c['pos'] = plan[i] if i < len(plan) else plan[-1]
                for i, c in enumerate(rest):
                    c['pos'] = plan[(quota + i) % len(plan)]
            else:
                for i, c in enumerate(lst):
                    c['pos'] = plan[i] if i < len(plan) else plan[-1]
        return out

    def add_cn(team, lgk, official):
        cands = cn_cands(official, C['STARS'].get(team, []))
        if os.environ.get('CFC_DEBUG_TEAM') == team:
            print('  [DBG]', team, 'cands=', len(cands))
            for c in cands[:30]:
                print('      ', c['name'], c['pos'], c['age'], 'h=', c['h'], c['nat'])
        if not cands:
            return False

        def mk(c, i, _t=team):
            # 关键：档次必须按**实力排名**给，不能按 fill_squad 的填充顺序。
            # 旧写法用 i（= 已入队人数）查 RANK_MULT，而 fill_squad 是先门将后前锋，
            # 结果门将/后卫白拿最高档，前锋（含武磊）被压到最低档 → 评分完全失真。
            base = BASEV.get(_t, 58)
            rk = min(c.get('rk', i), len(OVR_DROP) - 1)
            ovr = max(42, base - OVR_DROP[rk])
            eur = int(ovr_to_eur(ovr) * age_mult(c['age']))
            eur = max(eur, cn_tail_eur(ovr))   # 中国区尾部身价地板（保单调，ovr 身份不变）
            return [c['name'], c['pos'], c['age'], eur, c['nat']]
        squad = fill_squad(cands, mk)
        db[team] = squad
        src[team] = 'CFL/' + official
        for e in squad:
            used.add(nkey(e[0]))
        return True

    for lgk in ('CSL', 'CL1'):
        for team in LEAGUES.get(lgk, []):
            off = resolve(team)
            if not off or not add_cn(team, lgk, off):
                log.append(f'  ! {team} 无中足联官方名单，跳过')
    for team in C['FILLERS']:
        if team not in by_club or not add_cn(team, 'ETH', team):
            log.append(f'  ! 中乙 {team} 无官方名单')

    # ---------- 3. 海外：德转完整覆盖 ----------
    own, short = {}, []
    for lgk in C['WORLD']:
        for team in LEAGUES.get(lgk, []):
            info = tmmap.get(team)
            rows = [dict(p) for p in allp.get(info['tm'], [])] if info else []
            own[team] = (lgk, rows)
            if len(rows) >= 14:
                def mk(c, i, _t=team):
                    b = BASEV.get(_t, 58)
                    return [c['name'], c['pos'], c['age'],
                            c['eur'] or ovr_to_eur(max(46, b - 12)), c['nat']]
                sq = fill_squad(rows, mk)
                db[team] = sq
                src[team] = 'TM:' + info['tm']
                for e in rows:
                    used.add(nkey(e['name']))
            else:
                short.append(team)
                for p in rows:          # 本队真实球员预约，防止被别的队抢走
                    used.add(nkey(p['name']))

    # ---------- 4. 补位池 ----------
    pool_nat = collections.defaultdict(list)
    general = []
    for nm, rows in allp.items():
        for p in rows:
            if nkey(p['name']) in used:
                continue
            pool_nat[p['cit']].append(p)
            general.append(p)
    for k in pool_nat:
        pool_nat[k].sort(key=lambda p: -p['eur'])
    general.sort(key=lambda p: -p['eur'])
    log.append(f'未选用真实球员池 {len(general)} 人')
    taken = set()

    def add_pool(team, lgk, extra):
        base = BASEV.get(team, 58)
        cap = ovr_to_eur(base) * 6
        cands, seen = [], set()
        for c in extra:
            k = nkey(c['name'])
            if k not in seen:
                seen.add(k)
                cands.append(c)
        for cit in NAT_PREF.get(lgk, []):
            for p in pool_nat.get(cit, []):
                k = nkey(p['name'])
                if k in seen or k in taken or (p['eur'] and p['eur'] > cap):
                    continue
                seen.add(k)
                cands.append(p)
        if len(cands) < TARGET:
            for p in general:
                k = nkey(p['name'])
                if k in seen or k in taken or (p['eur'] and p['eur'] > cap):
                    continue
                seen.add(k)
                cands.append(p)
                if len(cands) >= TARGET * 3:
                    break
        if not cands:
            return None

        def mk(c, i, _t=team, _fl=RANK_FLOOR.get(lgk, 0.0)):
            m = RANK_MULT[min(i, 22)]
            if _fl and m < _fl:
                m = _fl
            eur = int(ovr_to_eur(BASEV.get(_t, 58)) * m * age_mult(c['age']))
            return [c['name'], c['pos'], c['age'], eur, c['nat']]
        sq = fill_squad(cands, mk)
        for e in sq:
            taken.add(nkey(e[0]))
            used.add(nkey(e[0]))
        return sq

    for team in short:
        lgk, rows = own[team]
        sq = add_pool(team, lgk, rows)
        if sq:
            db[team] = sq
            src[team] = f'POOL/{lgk}'
        else:
            log.append(f'  ! {lgk}/{team} 无法补位')

    for team in C['CONT']:
        sq = add_pool(team, 'CONT', [])
        if sq:
            db[team] = sq
            src[team] = 'POOL/CONT'

    # ---------- 5. 联赛池（自由市场 / 深度补员）----------
    # 语义：该联赛「未被任何游戏球队选中」的真实球员（同赛事其他俱乐部 + 落选者），
    # 因此与各队阵容天然互斥，不会出现同一球员既在某队又在池中。
    # 注意：快照里赛事码 KR1 实际指向克罗地亚联赛，K 联赛无覆盖，故不映射。
    LG2COMP = {'EPL': 'GB1', 'ENG2': 'GB1', 'LALIGA': 'ES1', 'ESP2': 'ES1',
               'SERIE_A': 'IT1', 'ITA2': 'IT1', 'BUNDESLIGA': 'L1', 'GER2': 'L1',
               'LIGUE_1': 'FR1', 'FRA2': 'FR1', 'EREDIVISIE': 'NL1', 'LIGA_PT': 'PO1',
               'J1': 'JAP1', 'J2': 'JAP1', 'SAU': 'SA1',
               'BRA': 'BRA1', 'BRA2': 'BRA1', 'ARG': 'ARG1', 'MLS': 'MLS1',
               'LIGA_MX': 'MEX1'}
    pool = {}
    FA_CAP = ovr_to_eur(73)                 # 自由市场档位上限（约 90 万欧，中超引援量级）
    for lgk in C['WORLD'] + ['CSL', 'CL1']:
        lst, seen = [], set()
        want = LG2COMP.get(lgk)
        natset = set(NAT_PREF.get(lgk, []))
        for nm, rows in allp.items():
            for p in rows:
                if want:
                    if p.get('comp') != want:
                        continue
                elif natset:
                    if p.get('cit') not in natset:
                        continue
                else:
                    continue
                k = nkey(p['name'])
                if not k or k in seen or k in used:
                    continue
                eur = p['eur'] or ovr_to_eur(60)
                if eur > FA_CAP:
                    continue
                seen.add(k)
                lst.append([p['name'], p['pos'], p['age'], eur, p['nat']])
        lst.sort(key=lambda e: -(e[3] or 0))
        if lst:
            pool[lgk] = lst[:60]
    # 中国区池：中足联官方名单中未进入任何球队阵容的真实球员
    CN_FREE_OVR = 54                       # 自由球员档位（约等于中甲中游替补）
    cn_cands, cn_seen = [], set()
    for cname, rows in by_club.items():
        for p in rows:
            nm = p['player_name']
            k = nkey(nm)
            if not k or k in cn_seen or k in used:
                continue
            cn_seen.add(k)
            a = age_of(p.get('date_of_birth', ''), CN_REF) or 25
            cn_cands.append({'name': nm, 'pos': (p.get('position_code') or 'MF').strip(),
                             'age': a, 'h': int(str(p.get('height') or 0).strip() or 0),
                             'nat': 'CN' if p.get('nationality') in CN_DOMESTIC else 'FOR',
                             '_lg': p.get('_lg') or ''})
    groups = collections.defaultdict(list)
    for c in cn_cands:
        groups[c['pos']].append(c)
    for g, plan in CN_PLAN.items():
        lst = groups.get(g, [])
        if g == 'DF':
            lst = sorted(lst, key=lambda c: -c['h'])
        for i, c in enumerate(lst):
            c['pos'] = plan[i] if i < len(plan) else plan[-1]
    def _cn_row(c):
        eur = int(ovr_to_eur(CN_FREE_OVR) * age_mult(c['age']) * (1.35 if c['nat'] == 'FOR' else 1.0))
        return [c['name'], c['pos'], c['age'], max(eur, 10000), c['nat']]

    # V2.6.1：中超/中甲自由市场按球员当前所属联赛拆池（旧写法两池逐字节相同，
    # 同一批人同时挂在两个联赛市场）。CL2 及归属不明的球员作为公共填充，且保证两池互不重叠。
    lg_c = {'CSL': [], 'CL1': []}
    fill_cn = []
    for c in cn_cands:
        k = c.get('_lg')
        if k in lg_c:
            lg_c[k].append(c)
        else:
            fill_cn.append(c)
    for lgk in ('CSL', 'CL1'):
        out = [_cn_row(c) for c in lg_c[lgk]]
        while len(out) < 100 and fill_cn:
            out.append(_cn_row(fill_cn.pop(0)))
        pool[lgk] = out[:100]

    # ---------- 6. 姓名本地化（拉丁原名 -> 中文译名） ----------
    # 词典 + 音节引擎见 build/translit.py；语言提示取自德转 country_of_citizenship
    sys.path.insert(0, BUILD)
    import translit
    cit_of = {}
    _norm = lambda s: re.sub(r'\s+', ' ', s or '').strip()
    for nm in allp:
        for p in allp[nm]:
            cit_of.setdefault(_norm(p['name']), p.get('cit') or '')
    HAS_HAN = re.compile(r'[\u4e00-\u9fff]')

    def localize(rows):
        """就地中译；队内重名时保留原文以保证唯一性"""
        seen = set()
        for e in rows:
            raw = e[0]
            e[0] = re.sub(r'\s+', ' ', raw).strip()   # 统一清洗：API 中文名常带首尾/重复空白
            if HAS_HAN.search(e[0]):
                seen.add(e[0])
                continue
            zh = translit.to_zh(raw, cit_of.get(raw, cit_of.get(e[0], ''))).strip()
            if zh and zh not in seen:
                e[0] = zh
            seen.add(e[0])
        return rows

    for t in db:
        localize(db[t])
    for lgk in pool:
        localize(pool[lgk])

    # ---------- 7. 输出 ----------
    def lg_of(t):
        for lgk in list(LEAGUES) + ['ETH', 'CONT']:
            if t in LEAGUES.get(lgk, []) or (lgk == 'ETH' and t in C['FILLERS']) \
                    or (lgk == 'CONT' and t in C['CONT']):
                return lgk
        return 'ETH'
    out = {t: {'lg': lg_of(t), 'pl': v} for t, v in db.items()}
    json.dump(out, io.open(os.path.join(BUILD, 'real_db.json'), 'w', encoding='utf-8'),
              ensure_ascii=False, separators=(',', ':'))
    json.dump(pool, io.open(os.path.join(BUILD, 'real_pool.json'), 'w', encoding='utf-8'),
              ensure_ascii=False, separators=(',', ':'))

    # ---------- 7. 报告 ----------
    sizes = sorted(len(v) for v in db.values())
    log.append(f'')
    log.append(f'球队 {len(db)}   阵容人数 min/中位/max = {sizes[0]}/{sizes[len(sizes)//2]}/{sizes[-1]}')
    bad = sorted([(t, len(v)) for t, v in db.items() if len(v) < MIN_SQUAD], key=lambda x: x[1])
    log.append(f'不足 {MIN_SQUAD} 人：{len(bad)} 支 {bad[:15]}')
    n_tm = sum(1 for s in src.values() if s.startswith('TM:'))
    n_cn = sum(1 for s in src.values() if s.startswith('CFL'))
    n_pl = sum(1 for s in src.values() if s.startswith('POOL'))
    log.append(f'来源：德转完整 {n_tm} 队 | 中足联实名 {n_cn} 队 | 真实球员池补位 {n_pl} 队')
    c = collections.Counter(nkey(e[0]) for v in db.values() for e in v)
    dup = [(k, n) for k, n in c.items() if n > 1]
    log.append(f'全局重复球员 {len(dup)} 名' + (f'：{dup[:8]}' if dup else ' ✓'))
    log.append('身价量纲抽查：')
    for t in ('上海海港', '北京国安', '苏州东吴', '青岛红狮', '曼城', '皇家马德里',
              '利雅得新月', '蔚山HD', '萨德', '考文垂', '武里南联'):
        if t in db and db[t]:
            vs = sorted(e[3] for e in db[t])
            ov = [eur_to_ovr(x) for x in vs]
            log.append(f'   {t:<10}{len(db[t]):>3}人  身价 {vs[0]:>12,} ~ {vs[-1]:>12,} €   评分 {ov[0]}~{ov[-1]}')
    rep = '\n'.join(log)
    io.open(os.path.join(BUILD, 'real_report.txt'), 'w', encoding='utf-8').write(rep)
    print(rep)


if __name__ == '__main__':
    main()
