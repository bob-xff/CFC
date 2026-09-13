# -*- coding: utf-8 -*-
"""SofaScore 全量主教练抓取（实时在任快照）
输出 build/coach_ss.json = {游戏队名: {q, ss_id, ss_name, manager, mg_country, lg, country}}
"""
import urllib.request, urllib.parse, json, ssl, time, os, io, re, unicodedata, sys

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BUILD = os.path.join(BASE, 'build')
UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122.0 Safari/537.36'
ctx = ssl.create_default_context(); ctx.check_hostname = False; ctx.verify_mode = ssl.CERT_NONE
CACHE = os.path.join(BUILD, 'coach_ss.json')

# 联赛 -> 预期国家（用于校验匹配到的球队）
LG_COUNTRY = {
    'EPL': 'England', 'ENG2': 'England', 'LALIGA': 'Spain', 'ESP2': 'Spain',
    'SERIE_A': 'Italy', 'ITA2': 'Italy', 'BUNDESLIGA': 'Germany', 'GER2': 'Germany',
    'LIGUE_1': 'France', 'FRA2': 'France', 'EREDIVISIE': 'Netherlands', 'LIGA_PT': 'Portugal',
    'J1': 'Japan', 'J2': 'Japan', 'K1': 'South Korea', 'SAU': 'Saudi Arabia',
    'QAT': 'Qatar', 'UAE': 'United Arab Emirates', 'BRA': 'Brazil', 'BRA2': 'Brazil',
    'ARG': 'Argentina', 'MLS': 'United States', 'LIGA_MX': 'Mexico',
    'CSL': 'China', 'CL1': 'China', 'CL2': 'China',
}
# SofaScore 国家名与预期名的差异
COUNTRY_EQ = {'United States': {'USA', 'United States'}, 'China': {'China'},
              'South Korea': {'South Korea'}, 'Qatar': {'Qatar'},
              'United Arab Emirates': {'United Arab Emirates'}}


def get(u, t=25, tries=4):
    for i in range(tries):
        try:
            r = urllib.request.Request(u, headers={'User-Agent': UA, 'Accept': 'application/json'})
            with urllib.request.urlopen(r, timeout=t, context=ctx) as resp:
                return json.loads(resp.read())
        except Exception as e:
            if i == tries - 1:
                return {'_err': f'{type(e).__name__}: {str(e)[:80]}'}
            time.sleep(1.5 * (i + 1))
    return {'_err': 'fail'}


def norm(s):
    s = unicodedata.normalize('NFKD', s or '')
    s = ''.join(c for c in s if not unicodedata.combining(c)).lower()
    return re.sub(r'[^a-z0-9]', '', s)


def search(q):
    d = get('https://api.sofascore.com/api/v1/search/all?q=' + urllib.parse.quote(q))
    if '_err' in d:
        return [], d['_err']
    out = []
    for r in d.get('results', []):
        e = r.get('entity', {})
        if e.get('sport', {}).get('slug') != 'football' or e.get('national'):
            continue
        out.append({'id': e['id'], 'name': e.get('name'),
                    'country': (e.get('country') or {}).get('name')})
    return out, None


def main():
    qs = json.load(io.open(os.path.join(BUILD, '_coach_query.json'), encoding='utf-8'))
    cache = json.load(io.open(CACHE, encoding='utf-8')) if os.path.exists(CACHE) else {}
    todo = [t for t, v in qs.items() if v['q'] and t not in cache]
    print(f'待抓 {len(todo)} / 共 {len(qs)}（已缓存 {len(cache)}）')
    for i, team in enumerate(todo, 1):
        v = qs[team]; q, lg = v['q'], v['lg']
        want = LG_COUNTRY.get(lg)
        cands, err = search(q)
        rec = {'q': q, 'lg': lg, 'want_country': want, 'match': None, 'cands': cands[:4], 'err': err}
        if cands:
            nq = norm(q)
            pick = None
            # 优先：国家一致 且 名称前缀匹配
            for c in cands:
                okc = (not want) or (c['country'] == want)
                nc = norm(c['name'])
                if okc and (nc == nq or nc.startswith(nq[:max(6, len(nq) * 3 // 4)]) or nq.startswith(nc[:max(6, len(nc) * 3 // 4)])):
                    pick = c; break
            if not pick:
                for c in cands:
                    if (not want) or c['country'] == want:
                        pick = c; break
            if pick:
                time.sleep(0.45)
                d = get(f"https://api.sofascore.com/api/v1/team/{pick['id']}")
                if '_err' not in d:
                    mg = d.get('team', {}).get('manager') or {}
                    rec['match'] = {'id': pick['id'], 'name': pick['name'], 'country': pick['country'],
                                    'manager': mg.get('name'),
                                    'manager_country': (mg.get('country') or {}).get('name')}
        cache[team] = rec
        if i % 10 == 0 or i == len(todo):
            json.dump(cache, io.open(CACHE, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
            m = rec['match'] or {}
            print(f'  [{i}/{len(todo)}] {team:<12} -> {m.get("name","?")!r:<34} 主帅={m.get("manager")!r}')
        time.sleep(0.6)
    json.dump(cache, io.open(CACHE, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    ok = sum(1 for v in cache.values() if v.get('match') and v['match'].get('manager'))
    print(f'\n完成：{len(cache)} 队，其中拿到主教练 {ok} 队 -> {CACHE}')


if __name__ == '__main__':
    main()
