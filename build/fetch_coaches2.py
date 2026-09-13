# -*- coding: utf-8 -*-
"""SofaScore 主教练抓取 v2（修正匹配器）
修正点：
  1. 排除预备队/青年队（II / B / U19 / U21 / U23 / Reserve / Youth / Academy）
  2. 剥离俱乐部通名前缀后缀（FC / AC / AS / CF / SC / SV / CA / CR ...），避免 "FC Bayern München" 匹配失败
  3. 名称相似度用 token 级 Jaccard + 前缀，而非纯字符前缀（防 "Bayern München II" 顶掉 "FC Bayern München"）
输出 build/coach_ss2.json
"""
import urllib.request, urllib.parse, json, ssl, time, os, io, re, unicodedata

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BUILD = os.path.join(BASE, 'build')
OUT = os.path.join(BUILD, 'coach_ss2.json')
UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122.0 Safari/537.36'
ctx = ssl.create_default_context(); ctx.check_hostname = False; ctx.verify_mode = ssl.CERT_NONE

LG_COUNTRY = {
    'EPL': 'England', 'ENG2': 'England', 'LALIGA': 'Spain', 'ESP2': 'Spain',
    'SERIE_A': 'Italy', 'ITA2': 'Italy', 'BUNDESLIGA': 'Germany', 'GER2': 'Germany',
    'LIGUE_1': 'France', 'FRA2': 'France', 'EREDIVISIE': 'Netherlands', 'LIGA_PT': 'Portugal',
    'J1': 'Japan', 'J2': 'Japan', 'K1': 'South Korea', 'SAU': 'Saudi Arabia',
    'QAT': 'Qatar', 'UAE': 'United Arab Emirates', 'BRA': 'Brazil', 'BRA2': 'Brazil',
    'ARG': 'Argentina', 'MLS': 'USA', 'LIGA_MX': 'Mexico',
    'CSL': 'China', 'CL1': 'China', 'CL2': 'China',
}
COUNTRY_ALIAS = {'United States': 'USA', 'Wales': 'Wales'}

RESERVE = re.compile(
    r'\b(II|III|B|U1[5-9]|U2[0-3]|Reserve|Reserves|Youth|Academy|Juniors?|'
    r'Under\s?\d{2}|Amateur|Woman|Women|Ladies|Feminino|Femenino)\b', re.I)
CLUB_STOP = {
    'fc', 'ac', 'as', 'afc', 'cf', 'cd', 'sc', 'sv', 'vfb', 'vfl', 'tsv', 'ssc', 'ssa',
    'ca', 'cr', 'cs', 'fk', 'nk', 'hnk', 'bk', 'if', 'ik', 'sk', 'fk', 'us', 'ss',
    'club', 'de', 'futbol', 'football', 'calcio', 'sporting', 'sport', 'sports', 'sad',
    'sa', 'sl', 'sd', 'ud', 'rc', 'rcd', 'asd', 'a.s.', 's.p.a.', '1909', '1899', '1897',
    '1907', '1908', '1913', '1846', '1848', 'de', 'the', 'team', 'cf.', 'c.f.', 'pd',
}


def get(u, t=25, tries=4):
    for i in range(tries):
        try:
            r = urllib.request.Request(u, headers={'User-Agent': UA, 'Accept': 'application/json'})
            with urllib.request.urlopen(r, timeout=t, context=ctx) as resp:
                return json.loads(resp.read())
        except Exception as e:
            if i == tries - 1:
                return {'_err': f'{type(e).__name__}: {str(e)[:70]}'}
            time.sleep(2.5 * (i + 1))
    return {'_err': 'fail'}


def toks(s):
    s = unicodedata.normalize('NFKD', s or '')
    s = ''.join(c for c in s if not unicodedata.combining(c)).lower()
    s = re.sub(r'[^a-z0-9]', ' ', s)
    return {t for t in s.split() if t and t not in CLUB_STOP}


def score(q, name):
    a, b = toks(q), toks(name)
    if not a or not b:
        return 0.0
    inter = len(a & b)
    j = inter / len(a | b)
    # 一方完全包含另一方 token 集合 → 高分
    if a <= b or b <= a:
        j = max(j, 0.75)
    return j


def search(q):
    d = get('https://api.sofascore.com/api/v1/search/all?q=' + urllib.parse.quote(q))
    if '_err' in d:
        return [], d['_err']
    out = []
    for r in d.get('results', []):
        e = r.get('entity', {})
        if e.get('sport', {}).get('slug') != 'football' or e.get('national'):
            continue
        nm = e.get('name') or ''
        if RESERVE.search(nm):
            continue
        out.append({'id': e['id'], 'name': nm,
                    'country': (e.get('country') or {}).get('name')})
    return out, None


def main():
    qs = json.load(io.open(os.path.join(BUILD, '_coach_query.json'), encoding='utf-8'))
    old = json.load(io.open(os.path.join(BUILD, 'coach_ss.json'), encoding='utf-8'))
    # 补上 8 个无英文名队（有官方教练，无需抓）
    todo = [t for t, v in qs.items() if v['q']]
    print(f'开始重抓 {len(todo)} 队')
    out = {}
    for i, team in enumerate(todo, 1):
        v = qs[team]; q, lg = v['q'], v['lg']
        want = LG_COUNTRY.get(lg)
        cands, err = search(q)
        rec = {'q': q, 'lg': lg, 'want_country': want, 'match': None,
               'cands': cands[:5], 'err': err}
        if cands:
            ranked = sorted(cands, key=lambda c: -score(q, c['name']))
            pick = None
            for c in ranked:
                if want and c['country'] != want:
                    continue
                if score(q, c['name']) < 0.34:
                    continue
                pick = c; break
            if not pick:
                pick = ranked[0]
            time.sleep(0.4)
            d = get(f"https://api.sofascore.com/api/v1/team/{pick['id']}")
            if '_err' not in d:
                mg = (d.get('team', {}).get('manager') or {})
                if mg.get('name'):
                    rec['match'] = {'id': pick['id'], 'name': pick['name'],
                                    'country': pick['country'], 'manager': mg['name'],
                                    'manager_country': (mg.get('country') or {}).get('name'),
                                    'score': round(score(q, pick['name']), 3)}
        out[team] = rec
        if i % 20 == 0 or i == len(todo):
            json.dump(out, io.open(OUT, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
            m = rec['match'] or {}
            print(f'  [{i}/{len(todo)}] {team:<12} -> {m.get("name","?")!r:<32} {m.get("manager")!r}')
        time.sleep(0.5)
    json.dump(out, io.open(OUT, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    ok = sum(1 for v in out.values() if (v.get('match') or {}).get('manager'))
    print(f'\n完成 {ok}/{len(out)} -> {OUT}')
    # 与旧结果对比
    chg = [t for t in out if (out[t].get('match') or {}).get('manager') !=
           (old.get(t, {}).get('match') or {}).get('manager')]
    print(f'与旧结果不同 {len(chg)} 队：')
    for t in chg[:40]:
        o = (old.get(t, {}).get('match') or {}).get('manager')
        n = (out[t].get('match') or {}).get('name')
        nm = (out[t].get('match') or {}).get('manager')
        print(f'   {t:<12} {o!r:<28} -> {nm!r}  ({n})')


if __name__ == '__main__':
    main()
