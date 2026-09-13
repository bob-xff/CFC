# -*- coding: utf-8 -*-
"""全量复核主教练（第三轮）：对 240 支球队逐个重新解析 SofaScore 主队与主帅。

前两轮的问题：
  - 第一轮查询名用俱乐部全称，且未排除预备队 -> 拜仁慕尼黑匹配到「Bayern München II」(主帅 Dante)
  - 第二轮改为 token 相似度，但遇到同名候选直接判歧义 -> 拜仁 remain 旧值

本轮策略：对每支球队，取搜索候选中「非预备队/非女足 + 国家匹配 + 名称最像」的前 3 个，
         逐个拉 team/<id> 实测，接受第一个 gender=M、有 manager、且名称不含预备队特征的球队。

用法：python build/verify_coaches.py            # 全量
     python build/verify_coaches.py 拜仁慕尼黑   # 指定球队
"""
import urllib.request, urllib.parse, json, ssl, time, os, io, re, sys

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BUILD = os.path.join(BASE, 'build')
UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122.0 Safari/537.36'
ctx = ssl.create_default_context(); ctx.check_hostname = False; ctx.verify_mode = ssl.CERT_NONE

BAD_TEAM = re.compile(r'\b(II|III|IV|B|U1[5-9]|U2[0-3]|Reserve|Reserves|Youth|Academy|'
                      r'Legends|Women|Feminino|Femenino|Campus|SAD)\b', re.I)
STOP = {'fc', 'cf', 'ac', 'as', 'sc', 'sv', 'sk', 'nk', 'bk', 'if', 'ff', 'cs', 'ss', 'fk',
        'club', 'cd', 'ca', 'sd', 'ud', 'rc', 'de', 'do', 'da', 'the', 'calcio', 'sad'}


def get(u, t=25, tries=3):
    for i in range(tries):
        try:
            r = urllib.request.Request(u, headers={'User-Agent': UA, 'Accept': 'application/json'})
            with urllib.request.urlopen(r, timeout=t, context=ctx) as resp:
                return json.loads(resp.read())
        except Exception as e:
            if i == tries - 1:
                return {'_err': f'{type(e).__name__}: {str(e)[:60]}'}
            time.sleep(2.0 * (i + 1))
    return {'_err': 'fail'}


FOLD = str.maketrans({'ü':'u','ö':'o','ä':'a','é':'e','è':'e','ê':'e','í':'i','ó':'o',
                      'á':'a','à':'a','ñ':'n','ç':'c','ß':'ss','ø':'o','å':'a','æ':'ae',
                      'š':'s','ć':'c','č':'c','ž':'z','đ':'d','ł':'l','ş':'s','ğ':'g','ı':'i'})
# 注意：不能把 BAD_TEAM 用到球场名上 —— 'Stade Louis II' 里的 II 会误杀摩纳哥


def norm(s):
    return re.sub(r'[^a-z0-9]', '', (s or '').lower().translate(FOLD))


def toks(s):
    return [w for w in re.split(r'[^a-z0-9]+', (s or '').lower().translate(FOLD))
            if w and w not in STOP]


def jac(a, b):
    A, B = set(a), set(b)
    if not A or not B:
        return 0.0
    if A <= B or B <= A:
        return 0.75
    return len(A & B) / len(A | B)


def search(q):
    d = get('https://api.sofascore.com/api/v1/search/all?q=' + urllib.parse.quote(q))
    if '_err' in d:
        return []
    out = []
    for r in d.get('results', []):
        e = r.get('entity') or {}
        if (e.get('sport') or {}).get('slug') != 'football' or e.get('national'):
            continue
        gt = ((e.get('country') or {}).get('name'))
        out.append({'id': e['id'], 'name': e.get('name') or '', 'country': gt})
    return out


def team_info(tid):
    t = get(f'https://api.sofascore.com/api/v1/team/{tid}')
    if '_err' in t:
        return None
    tm = t.get('team') or {}
    mg = tm.get('manager') or {}
    ven = ((tm.get('venue') or {}).get('stadium') or {}).get('name')
    return {'name': tm.get('name') or '', 'gender': tm.get('gender'),
            'manager': mg.get('name'), 'manager_country': (mg.get('country') or {}).get('name'),
            'venue': ven}


def resolve(team, qs, want):
    best = None
    tried = set()
    for q in qs:
        for kind, val in [('name', q)] + [('cand', c) for c in qs if c != q]:
            pass
        cands = search(q)
        time.sleep(0.8)
        if not cands:
            cands = search(' '.join(toks(q)) or q)
            time.sleep(0.8)
        # 打分排序
        scored = []
        for c in cands:
            sc = 0.0
            if norm(c['name']) == norm(q):
                sc += 6
            if norm(c['name']) == norm(team):
                sc += 2
            sc += 4 * jac(toks(q), toks(c['name']))
            if want and c['country'] == want:
                sc += 3
            if BAD_TEAM.search(c['name']):
                sc -= 8
            scored.append((sc, c))
        scored.sort(key=lambda x: -x[0])
        for sc, c in scored[:3]:
            if c['id'] in tried:
                continue
            tried.add(c['id'])
            info = team_info(c['id'])
            time.sleep(0.8)
            if not info or not info['manager']:
                continue
            if info['gender'] == 'F' or BAD_TEAM.search(info['name']):
                continue
            # 至少共享一个实义 token（Bayern / Madrid / Monaco...），
            # 否则判为匹配到了别的球队。拼写差异（München/Munich）由 FOLD 抹平。
            if not (set(toks(q)) & set(toks(info['name']))):
                continue
            rec = {'q': q, 'want_country': want,
                   'match': {'id': c['id'], 'name': info['name'], 'country': c['country'],
                             'manager': info['manager'],
                             'manager_country': info['manager_country'], 'score': round(sc, 3)},
                   'cands': [{'id': c['id'], 'name': info['name'], 'country': c['country']}],
                   'err': None}
            score = (sc, 1 if (want and c['country'] == want) else 0)
            if best is None or score > best[0]:
                best = (score, rec)
        if best and best[0][0] >= 6:
            return best[1]            # 已经是精确同名匹配，不必再试更差的查询名
    return best[1] if best else None


def main():
    p = os.path.join(BUILD, 'coach_ss.json')
    cache = json.load(io.open(p, encoding='utf-8'))
    only = sys.argv[1:] if len(sys.argv) > 1 else None
    teams = [t for t in cache if not only or t in only]
    print(f'待复核 {len(teams)} 队')

    changed, failed = [], []
    for i, team in enumerate(teams, 1):
        v = cache[team]
        q = v.get('q') or team
        want = v.get('want_country')
        qs, seen = [], set()
        for x in [q, ' '.join(toks(q)) or q] + [toks(q)[-1] if toks(q) else q]:
            if x and x.lower() not in seen:
                seen.add(x.lower()); qs.append(x)
        rec = resolve(team, qs[:3], want)
        old = (v.get('match') or {}).get('manager')
        if not rec:
            failed.append(team)
            print(f'  [{i}/{len(teams)}] ✗ {team}  旧={old}')
            continue
        new = rec['match']['manager']
        mark = '=' if new == old else '≠'
        if new != old:
            changed.append((team, old, new))
        cache[team] = rec
        print(f'  [{i}/{len(teams)}] {mark} {team:<12} {old} -> {new}  [{rec["match"]["name"]}]')
        if i % 20 == 0:
            json.dump(cache, io.open(p, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)

    json.dump(cache, io.open(p, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print(f'\n变更 {len(changed)} 队:')
    for t, o, n in changed:
        print(f'   {t:<14}{o}  ->  {n}')
    print(f'失败 {len(failed)}: {failed}')


if __name__ == '__main__':
    main()
