#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
TheSportsDB 免费层抓取：每支球队最多 10 名真实球员（姓名/位置/生日）。
结果缓存 build/_tsdb_cache.json（断点续传）；免费 key 限速按 2.2s/请求。
"""
import io, json, os, time, urllib.request, urllib.parse

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CACHE = os.path.join(BASE, 'build', '_tsdb_cache.json')
K = 'https://www.thesportsdb.com/api/v1/json/3/'
H = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) CFCGame/2.0'}

teams = json.load(io.open(os.path.join(BASE, 'build', '_leagues_snapshot.json'), encoding='utf-8'))
terms = json.load(io.open(os.path.join(BASE, 'build', '_logo_terms.json'), encoding='utf-8'))
TSDB = terms['tsdb']
GH = terms['gh']

# 组装 目标队名→搜索词（tsdb 优先，其次 gh 英文名，再次英文名即搜索词）
plan = {}
for lg, info in teams.items():
    for t in info['teams']:
        term = TSDB.get(t) or GH.get(t) or t
        plan[t] = term
io.open(os.path.join(BASE, 'build', '_tsdb_plan.json'), 'w', encoding='utf-8').write(
    json.dumps(plan, ensure_ascii=False, indent=1))
print('plan teams:', len(plan))

cache = {}
if os.path.exists(CACHE):
    cache = json.load(io.open(CACHE, encoding='utf-8'))


def get_json(url):
    req = urllib.request.Request(url, headers=H)
    return json.loads(urllib.request.urlopen(req, timeout=25).read())


done = 0
for t, term in plan.items():
    if t in cache:
        continue
    try:
        s = get_json(K + 'searchteams.php?t=' + urllib.parse.quote(term))
        lst = s.get('teams') or []
        hit = None
        for x in lst:
            if term.lower() in (x.get('strTeam') or '').lower():
                hit = x
                break
        if hit is None and lst:
            hit = lst[0]
        if not hit:
            cache[t] = {'teamId': None, 'players': []}
            print('NO-TEAM', t, term)
        else:
            tid = hit['idTeam']
            p = get_json(K + 'lookup_all_players.php?id=' + tid)
            pl = p.get('player') or []
            slim = [{'n': x.get('strPlayer'), 'pos': x.get('strPosition') or '',
                     'dob': x.get('dateBorn') or '', 'nat': x.get('strNationality') or ''}
                    for x in pl if x.get('strPlayer')]
            cache[t] = {'teamId': tid, 'players': slim}
            print('OK', t, tid, len(slim))
    except Exception as exc:
        print('ERR', t, repr(exc)[:70])
        time.sleep(3)
    io.open(CACHE, 'w', encoding='utf-8').write(json.dumps(cache, ensure_ascii=False))
    time.sleep(2.2)
    done += 1
print('fetched new:', done, 'cached total:', len(cache))
