# -*- coding: utf-8 -*-
"""补抓 SofaScore 教练：用简称重试失败项 + 降速"""
import urllib.request, urllib.parse, json, ssl, time, os, io, re

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BUILD = os.path.join(BASE, 'build')
CACHE = os.path.join(BUILD, 'coach_ss.json')
UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122.0 Safari/537.36'
ctx = ssl.create_default_context(); ctx.check_hostname = False; ctx.verify_mode = ssl.CERT_NONE

SHORT = {
    '佛罗伦萨': 'Fiorentina', '门兴格拉德巴赫': 'Borussia Monchengladbach', '马赛': 'Marseille',
    '摩纳哥': 'Monaco', '尼斯': 'Nice', '博阿维斯塔': 'Boavista', '弗拉门戈': 'Flamengo',
    '帕尔梅拉斯': 'Palmeiras', '博塔弗戈': 'Botafogo', '科林蒂安': 'Corinthians',
    '圣保罗': 'Sao Paulo', '米内罗竞技': 'Atletico Mineiro', '格雷米奥': 'Gremio',
    '巴西国际': 'Internacional Porto Alegre', '桑托斯': 'Santos FC', '独立': 'Independiente',
    '竞技俱乐部': 'Racing Club Avellaneda', '拉努斯': 'Lanus', '迈阿密国际': 'Inter Miami',
    '洛杉矶FC': 'Los Angeles FC', '纽约城': 'New York City FC', '西雅图海湾人': 'Seattle Sounders',
    '亚特兰大联': 'Atlanta United', '多伦多FC': 'Toronto FC', '温哥华白帽': 'Vancouver Whitecaps',
    '芝加哥火焰': 'Chicago Fire', '神户胜利船': 'Vissel Kobe', '利雅得新月': 'Al Hilal',
    '利雅得青年人': 'Al Shabab', '卡迪夫城': 'Cardiff City', '萨拉戈萨': 'Real Zaragoza',
    '桑坦德竞技': 'Racing Santander', '帕德博恩': 'Paderborn', '达姆施塔特': 'Darmstadt',
    '布雷西亚': 'Brescia', '特鲁瓦': 'Troyes', '冈山绿雉': 'Fagiano Okayama',
    '沙迦': 'Sharjah', '瓜达拉哈拉': 'Guadalajara', '蓝十字': 'Cruz Azul', '托卢卡': 'Toluca',
    '美洲狮': 'Pumas UNAM', '科里蒂巴': 'Coritiba', '沙佩科恩斯': 'Chapecoense',
}
# 这些队名与 SofaScore 的对应关系需精确指定国家
FORCE_COUNTRY = {'摩纳哥': 'Monaco', '多伦多FC': 'Canada', '温哥华白帽': 'Canada'}


def get(u, t=25, tries=5):
    for i in range(tries):
        try:
            r = urllib.request.Request(u, headers={'User-Agent': UA, 'Accept': 'application/json'})
            with urllib.request.urlopen(r, timeout=t, context=ctx) as resp:
                return json.loads(resp.read())
        except Exception as e:
            if i == tries - 1:
                return {'_err': f'{type(e).__name__}: {str(e)[:80]}'}
            time.sleep(3 * (i + 1))
    return {'_err': 'fail'}


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
    cache = json.load(io.open(CACHE, encoding='utf-8'))
    todo = [t for t, v in cache.items() if not (v.get('match') or {}).get('manager')]
    print('需补抓', len(todo))
    ok = 0
    for i, team in enumerate(todo, 1):
        q = SHORT.get(team) or cache[team]['q']
        want = FORCE_COUNTRY.get(team) or cache[team].get('want_country')
        cands, err = search(q)
        time.sleep(1.4)
        rec = cache[team]
        rec['retry_q'] = q
        if not cands:
            print(f'  [{i}/{len(todo)}] {team:<12} 无候选 ({q})')
            continue
        pick = next((c for c in cands if not want or c['country'] == want), cands[0])
        d = get(f"https://api.sofascore.com/api/v1/team/{pick['id']}")
        time.sleep(1.4)
        if '_err' in d:
            print(f'  [{i}/{len(todo)}] {team:<12} detail失败 {d["_err"]}')
            continue
        mg = d.get('team', {}).get('manager') or {}
        if not mg.get('name'):
            print(f'  [{i}/{len(todo)}] {team:<12} {pick["name"]} 无主帅字段')
            continue
        rec['match'] = {'id': pick['id'], 'name': pick['name'], 'country': pick['country'],
                        'manager': mg.get('name'),
                        'manager_country': (mg.get('country') or {}).get('name')}
        ok += 1
        print(f'  [{i}/{len(todo)}] {team:<12} -> {pick["name"]:<26} 主帅={mg["name"]}')
        json.dump(cache, io.open(CACHE, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    json.dump(cache, io.open(CACHE, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    got = sum(1 for v in cache.values() if (v.get('match') or {}).get('manager'))
    print(f'\n本次补到 {ok} 队；合计 {got}/{len(cache)}')


if __name__ == '__main__':
    main()
