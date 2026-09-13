#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
生成 build/tm_db.json：把德转（Transfermarkt）真实球员库合并进游戏 230 队。
数据源（优先级）：
1. Kaggle davidcariboo/player-scores（德转官方数据管道镜像，快照 2026-07-06）——姓名/位置/年龄/身价全真
2. TheSportsDB 免费层（每队≤10 名真实球员：姓名/位置/生日）——补 Kaggle 未覆盖球队
3. 游戏内 TEAM_STARS 真实球星表（中文实名）——再补缺口
仍不足 20 人的球队用「同联赛真实球员池」填充（真名，俱乐部归属为游戏编排）。
输出：tm_db.json = {球队:{lg,players:[[name,pos,age,eur]...]}} + {league pools}
"""
import csv, gzip, io, json, os, re, unicodedata, collections

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
KG = os.path.join(os.path.expanduser('~'), '.cache', 'kagglehub', 'datasets', 'davidcariboo', 'player-scores', 'versions', '679')
SNAP = '2026-07-06'

teams = json.load(io.open(os.path.join(BASE, 'build', '_leagues_snapshot.json'), encoding='utf-8'))
terms = json.load(io.open(os.path.join(BASE, 'build', '_logo_terms.json'), encoding='utf-8'))
TSDB_TERMS = terms['tsdb']
GH_TERMS = terms['gh']
tsdb_cache = json.load(io.open(os.path.join(BASE, 'build', '_tsdb_cache.json'), encoding='utf-8'))
html = io.open(os.path.join(BASE, 'football-career-simulator.html'), encoding='utf-8').read()

TEAM_STARS = {}
ms = re.search(r'const TEAM_STARS=\{([\s\S]*?)\n\};', html)
for m in re.finditer(r"'([^']+)':\[([^\]]*)\]", ms.group(1)):
    TEAM_STARS[m.group(1)] = re.findall(r"'([^']+)'", m.group(2))

CM_TEAM_BASE = {}
mb = re.search(r'const CM_TEAM_BASE=\{([\s\S]*?)\n\};', html)
for k, v in re.findall(r"'([^']+)':(\d+)", mb.group(1)):
    CM_TEAM_BASE[k] = int(v)

# 德转身价⇄评分阶梯（与游戏内 TM_LADDER 一致）
TM_LADDER = [(150000000,93),(100000000,91),(75000000,90),(55000000,89),(40000000,88),(30000000,87),(24000000,86),(19000000,85),(15000000,84),(12000000,83),(9000000,82),(7000000,81),(5500000,80),(4200000,79),(3200000,78),(2500000,77),(1900000,76),(1500000,75),(1150000,74),(900000,73),(700000,72),(540000,71),(420000,70),(330000,69),(260000,68),(200000,67),(160000,66),(125000,65),(100000,64),(80000,63),(62000,62),(50000,61),(40000,60),(32000,59),(26000,58),(21000,57),(17000,56),(14000,55),(11000,54),(9000,53),(7000,52),(5500,51),(4500,50),(3500,49),(2800,48),(2200,47),(1800,46)]


def eur_for_ovr(ovr):
    ovr = max(44, min(94, ovr))
    prev = (TM_LADDER[-1][0] * 0.5, 44)
    for eur, o in TM_LADDER:
        if ovr <= o:
            if ovr == o:
                return eur
            lo = (prev[0], prev[1])
            t = (ovr - lo[1]) / (o - lo[1])
            return int(lo[0] + t * (eur - lo[0]))
        prev = (eur, o)
    return 150000000


def est_eur(age, seedv):
    base = 5500.0  # 德转无身价记录者的灰卡基线（€）
    if age <= 21: base *= 1.25
    elif age <= 24: base *= 1.6
    elif age <= 29: base *= 1.45
    elif age <= 32: base *= 0.9
    elif age >= 34: base *= 0.55
    base *= (0.9 + ((seedv * 37) % 21) / 100.0)
    return int(base)


CM_STAR_POS = {}
mp = re.search(r'const CM_STAR_POS=\{([\s\S]*?)\};', html)
for k, v in re.findall(r"'([^']+)':'([A-Z]+)'", mp.group(1)):
    CM_STAR_POS[k] = v


def norm(s):
    s = unicodedata.normalize('NFKD', s or '')
    s = ''.join(c for c in s if not unicodedata.combining(c)).lower()
    return re.sub(r'[^a-z0-9]', '', s)


POS_MAP = {
    'goalkeeper': 'GK', 'centre-back': 'CB', 'left-back': 'LB', 'right-back': 'RB',
    'defensive midfield': 'CDM', 'central midfield': 'CM', 'attacking midfield': 'CAM',
    'left midfield': 'LW', 'right midfield': 'RW', 'left winger': 'LW', 'right winger': 'RW',
    'second striker': 'ST', 'centre-forward': 'ST',
}
COARSE = {'goalkeeper': 'GK', 'defender': 'CB', 'midfielder': 'CM', 'attacker': 'ST'}


def tm_pos(sub, coarse):
    p = POS_MAP.get((sub or '').strip().lower())
    if p:
        return p
    return COARSE.get((coarse or '').strip().lower(), 'CM')


def age_from(dob, ref=SNAP):
    try:
        d = dob[:10]
        y, m, dd = map(int, d.split('-'))
        ry, rm, rd = map(int, ref.split('-'))
        a = ry - y - (1 if (rm, rd) < (m, dd) else 0)
        return a if 14 <= a <= 45 else None
    except Exception:
        return None


def parse_eur(v):
    try:
        return int(float(v))
    except Exception:
        return 0


def nat_of(cit):
    c = (cit or '').lower()
    if 'china' in c:
        return 'CN'
    if 'japan' in c:
        return 'JP'
    if 'korea' in c:
        return 'KR'
    return 'FOR'


# ---------- Kaggle 侧 ----------
kclubs = list(csv.DictReader(open(os.path.join(KG, 'clubs.csv'), encoding='utf-8')))
nidx = {}
for c in kclubs:
    nidx.setdefault(norm(c['name']), []).append(c)
by_id = {c['club_id']: c for c in kclubs}

kplayers = collections.defaultdict(list)
with open(os.path.join(KG, 'players.csv'), encoding='utf-8') as fh:
    for row in csv.DictReader(fh):
        if row['last_season'] and row['last_season'] >= '2023' and row['current_club_id']:
            kplayers[row['current_club_id']].append(row)


def match_club(english):
    n = norm(english)
    if not n:
        return None
    hits = nidx.get(n)
    if hits:
        return hits[0]
    # 双向包含打分
    best, bs = None, 0
    for nn, lst in nidx.items():
        sc = 0
        if n in nn:
            sc = len(n) / max(1, len(nn)) + 0.1
        elif nn in n:
            sc = len(nn) / max(1, len(n))
        if sc > bs:
            bs, best = sc, lst[0]
    return best if bs >= 0.55 else None


def english_of(team, lg):
    return TSDB_TERMS.get(team) or GH_TERMS.get(team) or team


# ---------- TSDB 侧 ----------
def tsdb_players(team):
    e = tsdb_cache.get(team) or {}
    out = []
    for x in e.get('players', [])[:10]:
        pos = (x.get('pos') or '').strip().lower()
        pos = COARSE.get(pos, None) or (tm_pos(pos, pos))
        if pos not in ('GK', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'LW', 'RW', 'ST'):
            pos = 'CM'
        age = age_from(x.get('dob') or '')
        nat = (x.get('nat') or '')
        a = age or 25
        out.append({'n': x['n'], 'pos': pos, 'age': age, 'eur': est_eur(a, sum(ord(c) for c in x['n'])),
                    'nat': 'CN' if 'china' in nat.lower() else ('JP' if 'japan' in nat.lower() else ('KR' if 'korea' in nat.lower() else 'FOR'))})
    return out


db = {}
stats = collections.Counter()
used_names = set()


def nkey(name):
    k=norm(name)
    return k or (name or '')  # 中文姓名 norm 后为空：保留原名作去重键


for lg, info in teams.items():
    for team in info['teams']:
        entries = []          # (name,pos,age,eur,src)
        # 1) Kaggle
        en = english_of(team, lg)
        c = match_club(en)
        kag = []
        if c:
            cid = c['club_id']
            rows = kplayers.get(cid, [])
            rows.sort(key=lambda r: parse_eur(r['market_value_in_eur']), reverse=True)
            for r in rows[:26]:
                age = age_from(r['date_of_birth'])
                if age is None:
                    continue
                kag.append({'n': r['name'], 'pos': tm_pos(r['sub_position'], r['position']),
                            'age': age, 'eur': parse_eur(r['market_value_in_eur']) or 0, 'src': 'tm',
                            'nat': nat_of(r['country_of_citizenship'])})
            if kag:
                stats['kaggle_teams'] += 1
        entries += kag
        # 2) TSDB
        if len(entries) < 20:
            entries += [{'n': p['n'], 'pos': p['pos'], 'age': p['age'] or 25, 'eur': p['eur'], 'src': 'tsdb'}
                        for p in tsdb_players(team)]
        # 3) TEAM_STARS（中文实名）——仅在真实球员不足时并入
        if len(entries) < 20:
            sbase = CM_TEAM_BASE.get(team, 58)
            for si, sname in enumerate(TEAM_STARS.get(team, [])):
                pos = CM_STAR_POS.get(sname, 'CM')
                boost = 6 if si == 0 else 4 if si == 1 else 3
                ovr0 = max(50, min(88, sbase + boost))
                entries.append({'n': sname, 'pos': pos, 'age': None, 'eur': eur_for_ovr(ovr0), 'src': 'star',
                                'nat': 'FOR' if '·' in sname else 'CN'})
        # 去重 + 空值年龄兜底
        seen = set()
        clean = []
        for e in entries:
            k = nkey(e['n'])
            if not k or k in seen:
                continue
            seen.add(k)
            if e['age'] is None:
                e['age'] = 27
            if not e.get('nat'):
                e['nat'] = 'FOR'
            clean.append(e)
        db[team] = {'lg': lg, 'players': clean, 'matched': bool(kag)}
        stats['real_' + ('full' if len(clean) >= 20 else 'part')] += 1
        for e in clean:
            used_names.add(nkey(e['n']))

# ---------- 联赛池（真名补员用） ----------
pool = {}
for lg, info in teams.items():
    names = []
    seen = set()
    for team in info['teams']:
        for e in db[team]['players']:
            k = nkey(e['n'])
            if k not in seen:
                seen.add(k)
                names.append([e['n'], e['pos'], e['age'], e['eur'], e.get('nat') or 'FOR'])
    pool[lg] = names[:60]

# ---------- 二阶段：真实球员过少的球队用联赛池预填（保证零假名回退） ----------
for lg, info in teams.items():
    for team in info['teams']:
        v = db[team]
        if len(v['players']) < 18:
            seen2 = {nkey(e['n']) for e in v['players']}
            for e2 in (pool.get(lg) or []):
                if len(v['players']) >= 18:
                    break
                k2 = nkey(e2[0])
                if k2 in seen2 or not k2:
                    continue
                seen2.add(k2)
                v['players'].append({'n': e2[0], 'pos': e2[1], 'age': e2[2], 'eur': e2[3] or 0,
                                     'src': 'pool', 'nat': e2[4] if len(e2) > 4 else 'FOR'})

out = {t: {'lg': v['lg'], 'pl': [[e['n'], e['pos'], e['age'], e['eur'], e.get('nat') or 'FOR'] for e in v['players']]} for t, v in db.items()}
json.dump(out, io.open(os.path.join(BASE, 'build', 'tm_db.json'), 'w', encoding='utf-8'), ensure_ascii=False)
json.dump(pool, io.open(os.path.join(BASE, 'build', 'tm_pool.json'), 'w', encoding='utf-8'), ensure_ascii=False)
sizes = sorted(len(v['players']) for v in db.values())
print('teams:', len(db), '| sizes min/med/max:', sizes[0], sizes[len(sizes) // 2], sizes[-1])
print('kaggle matched teams:', stats['kaggle_teams'], '| full>=20:', stats['real_full'], '| part:', stats['real_part'])
under = [(t, len(v['players'])) for t, v in db.items() if len(v['players']) < 18]
print('teams under 18:', len(under), under[:12])
