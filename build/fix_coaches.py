# -*- coding: utf-8 -*-
"""合并 / 修复 SofaScore 主教练缓存 -> build/coach_ss.json

背景：
  coach_ss.json   第一轮抓取（查询名用俱乐部全称，44 队失败、部分误配）
  coach_ss2.json  第二轮抓取（排除预备队 + token 相似度，226 队中 180 命中）
本轮做三件事：
  1. ss2 覆盖 ss（新结果更准）
  2. ss2 判定"歧义"的（如同名两个 FC Bayern München）逐个候选实测，取有主帅的非预备队
  3. 仍无结果的，用逐级简化的查询名重试

输出前先备份到 coach_ss.json.bak_premerge
"""
import urllib.request, urllib.parse, json, ssl, time, os, io, re, sys, shutil

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BUILD = os.path.join(BASE, 'build')
UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122.0 Safari/537.36'
ctx = ssl.create_default_context(); ctx.check_hostname = False; ctx.verify_mode = ssl.CERT_NONE

RESERVE = re.compile(r'\b(II|III|B|U19|U20|U21|U23|Reserve|Reserves|Youth|Academy|Legends|'
                     r'Women|Feminino|Femenino|Pinar|Steindl|Romain)\b', re.I)
STOP = {'fc', 'cf', 'ac', 'as', 'sc', 'sv', 'sk', 'nk', 'bk', 'if', 'ff', 'cs', 'ss',
        'club', 'cd', 'ca', 'sd', 'ud', 'rc', 'real', 'de', 'do', 'da', 'the'}


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


def norm(s):
    return re.sub(r'[^a-z0-9 ]', '', (s or '').lower())


def search(q):
    d = get('https://api.sofascore.com/api/v1/search/all?q=' + urllib.parse.quote(q))
    if '_err' in d:
        return []
    out = []
    for r in d.get('results', []):
        e = r.get('entity') or {}
        if (e.get('sport') or {}).get('slug') != 'football' or e.get('national'):
            continue
        out.append({'id': e['id'], 'name': e.get('name'),
                    'country': (e.get('country') or {}).get('name')})
    return out


def manager_of(tid):
    t = get(f'https://api.sofascore.com/api/v1/team/{tid}')
    if '_err' in t:
        return None, None
    tm = t.get('team') or {}
    mg = tm.get('manager') or {}
    return (mg.get('name'), (mg.get('country') or {}).get('name'),
            tm.get('name'), tm.get('category'))


def candidates_for(team, q, want):
    """按查询名搜候选；按"完全同名 + 国家匹配 + 非预备队 + id 小"排序"""
    cands = search(q)
    if not cands and ' ' in q:
        cands = search(' '.join(w for w in q.split() if norm(w) not in STOP)) or search(q.split()[-1])
    scored = []
    for c in cands:
        sc = 0.0
        if norm(c['name']) == norm(team) or norm(c['name']) == norm(q):
            sc += 5
        if want and c['country'] == want:
            sc += 3
        if RESERVE.search(c['name'] or ''):
            sc -= 6
        sc -= c['id'] / 1e9                      # 同分取 id 小者（一般是主队）
        scored.append((sc, c))
    scored.sort(key=lambda x: -x[0])
    return [c for _, c in scored]


def resolve(team, want, queries, cache):
    for q in queries:
        cands = candidates_for(team, q, want)
        for c in cands[:3]:
            mg, mgc, tmname, cat = manager_of(c['id'])
            time.sleep(0.9)
            if not mg:
                continue
            if RESERVE.search(tmname or '') or RESERVE.search(c['name'] or ''):
                continue
            cache[team] = {'q': q, 'want_country': want,
                           'match': {'id': c['id'], 'name': tmname or c['name'],
                                     'country': c['country'], 'manager': mg,
                                     'manager_country': mgc, 'score': 1.0},
                           'cands': [c], 'err': None}
            return f'{tmname or c["name"]} -> {mg}'
        time.sleep(0.6)
    return None


def main():
    p_old = os.path.join(BUILD, 'coach_ss.json')
    p_new = os.path.join(BUILD, 'coach_ss2.json')
    if not os.path.exists(p_old + '.bak_premerge'):
        shutil.copy2(p_old, p_old + '.bak_premerge')

    old = json.load(io.open(p_old, encoding='utf-8'))
    new = json.load(io.open(p_new, encoding='utf-8'))

    merged = dict(old)
    upgraded = 0
    for team, v in new.items():
        if (v.get('match') or {}).get('manager'):
            if team not in merged or (merged[team].get('match') or {}).get('manager') != v['match']['manager']:
                upgraded += 1
            merged[team] = {**old.get(team, {}), **v}
    print(f'ss2 覆盖 ss 后升级 {upgraded} 队，总 {len(merged)} 队')

    # 需要修复的：没有 match，或 match 有 manager 但可能误配（这里只补无 match 的）
    todo = []
    for team, v in merged.items():
        if not (v.get('match') or {}).get('manager'):
            q = v.get('q') or team
            want = v.get('want_country')
            cands = [c['name'] for c in (v.get('cands') or [])]
            todo.append((team, q, want, cands))

    only = sys.argv[1:] if len(sys.argv) > 1 else None
    if only:
        todo = [t for t in todo if t[0] in only]
    print(f'待修复 {len(todo)} 队:', [t[0] for t in todo])

    fixed = 0
    for team, q, want, cands in todo:
        qs = [q]
        # 逐级简化查询名：全称 -> 去通名 -> 关键词 -> 末词
        if cands:
            qs += [c for c in cands if c != q]
        base = q.replace('Clube de Regatas do ', '').replace('FC ', '').replace(' Calcio', '')
        qs.append(base)
        toks = [w for w in re.split(r'\s+', base) if norm(w) not in STOP]
        if toks:
            qs.append(' '.join(toks))
            qs.append(toks[-1])
        seen, uniq = set(), []
        for x in qs:
            if x and x.lower() not in seen:
                seen.add(x.lower()); uniq.append(x)
        r = resolve(team, want, uniq[:6], merged)
        if r:
            fixed += 1
            print(f'  ✓ {team}: {r}')
        else:
            print(f'  ✗ {team}: 仍未找到 (queries={uniq[:4]})')

    print(f'修复 {fixed} / {len(todo)}')
    json.dump(merged, io.open(p_old, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    still = [t for t, v in merged.items() if not (v.get('match') or {}).get('manager')]
    print('仍无主帅:', len(still), still)


if __name__ == '__main__':
    main()
