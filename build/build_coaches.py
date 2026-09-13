# -*- coding: utf-8 -*-
"""组装最终主教练表（中国区用中足联官方实名；海外用 SofaScore 实时数据 + 中译）
输出 build/team_coaches.json  {游戏队名: 中文主教练}
"""
import urllib.request, urllib.parse, json, ssl, time, os, io, re, sys

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BUILD = os.path.join(BASE, 'build')
sys.path.insert(0, BUILD)
import translit

UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122.0 Safari/537.36'
ctx = ssl.create_default_context(); ctx.check_hostname = False; ctx.verify_mode = ssl.CERT_NONE
SS = os.path.join(BUILD, 'coach_ss.json')
CFL = os.path.join(BUILD, 'coach_cfl.json')


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


FINAL = [('博阿维斯塔', 'Boavista FC', 'Portugal'),
         ('卡迪夫城', 'Cardiff City', 'Wales'),
         ('布雷西亚', 'Brescia Calcio', 'Italy')]


def fix_last(cache):
    for team, q, want in FINAL:
        if (cache.get(team, {}).get('match') or {}).get('manager'):
            continue
        d = get('https://api.sofascore.com/api/v1/search/all?q=' + urllib.parse.quote(q))
        time.sleep(1.2)
        cands = [{'id': e['id'], 'name': e.get('name'), 'country': (e.get('country') or {}).get('name')}
                 for r in d.get('results', []) for e in [r.get('entity', {})]
                 if e.get('sport', {}).get('slug') == 'football' and not e.get('national')]
        pick = next((c for c in cands if c['country'] == want), None)
        if not pick:
            print(f'  {team}: 未找到 {want} 的候选 {cands[:3]}')
            continue
        t = get(f"https://api.sofascore.com/api/v1/team/{pick['id']}")
        time.sleep(1.2)
        mg = (t.get('team', {}).get('manager') or {}) if '_err' not in t else {}
        if not mg.get('name'):
            print(f'  {team}: {pick["name"]} 无主帅')
            continue
        cache[team]['match'] = {'id': pick['id'], 'name': pick['name'], 'country': pick['country'],
                                'manager': mg['name'],
                                'manager_country': (mg.get('country') or {}).get('name')}
        print(f'  {team}: {pick["name"]} -> {mg["name"]}')
    json.dump(cache, io.open(SS, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)


def main():
    ss = json.load(io.open(SS, encoding='utf-8'))
    fix_last(ss)
    cfl = json.load(io.open(CFL, encoding='utf-8'))

    out, src = {}, {}
    for team, v in cfl.items():
        if v:
            out[team] = v
            src[team] = 'CFL官方'
    miss = []
    for team, v in ss.items():
        m = v.get('match') or {}
        en = m.get('manager')
        if not en:
            miss.append(team)
            continue
        if team in out:
            continue
        cit = m.get('manager_country') or ''
        zh = translit.to_zh(en, cit)
        out[team] = zh
        src[team] = f'SofaScore({en})'
    print(f'教练总数 {len(out)}   中国官方 {sum(1 for s in src.values() if s=="CFL官方")}   '
          f'SofaScore {sum(1 for s in src.values() if s.startswith("Sofa"))}')
    print('仍缺主帅:', miss)
    json.dump({'coaches': out, 'src': src}, io.open(os.path.join(BUILD, 'team_coaches.json'), 'w',
                                                    encoding='utf-8'), ensure_ascii=False, indent=1)
    print()
    print('=== 中国区 ===')
    for t in cfl:
        print(f'   {t:<12}{out.get(t,"—")}')
    print()
    print('=== 海外抽查 ===')
    for t in ('曼城', '皇家马德里', '拜仁慕尼黑', '巴黎圣日耳曼', '利物浦', '阿森纳',
              '拉齐奥', '罗马', '考文垂', '蔚山HD', '萨德', '弗拉门戈', '迈阿密国际',
              '神户胜利船', '利雅得新月', '瓜达拉哈拉', '马赛', '摩纳哥'):
        print(f'   {t:<12}{out.get(t,"—")}   ({src.get(t,"")})')


if __name__ == '__main__':
    main()
