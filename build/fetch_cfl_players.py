#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""按联赛精确拉取中足联官方球员名单（中超 CSL / 中甲 CL1）。

数据源：https://api.cfl-china.cn/frontweb/api/players/page?competition_code=CSL
输出：build/cfl_league_<CODE>.json
"""
import json
import os
import sys
import time
import urllib.parse
import urllib.request

API = 'https://api.cfl-china.cn/frontweb/api/players/page'
BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UA = ('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 '
      '(KHTML, like Gecko) Chrome/120.0 Safari/537.36')


def fetch(code, page_num, page_size=200):
    qs = urllib.parse.urlencode({
        'competition_code': code, 'pageNum': page_num, 'pageSize': page_size,
    })
    req = urllib.request.Request(API + '?' + qs, headers={
        'User-Agent': UA, 'Referer': 'https://www.cfl-china.cn/',
        'Accept': 'application/json',
    })
    with urllib.request.urlopen(req, timeout=40) as r:
        return json.loads(r.read().decode('utf-8'))


def pull(code):
    """一次取全。

    实测（2026-09）：
      - pageNum 参数被服务端忽略，curPage 恒为 1；
      - pageSize 有效区间 1~1000，超过 1000（如 3000）会被回落成默认 10 条。
    因此用 pageSize=1000 单次拉全（CSL 615 / CL1 603 均在限内）。
    """
    d = fetch(code, 1, page_size=1000)
    rows = list(d['data']['dataList'])
    total = d['data']['count']
    if len(rows) < total:
        print(f'  ! 警告：仅取到 {len(rows)}/{total} 条，需检查 pageSize 上限')
    print(f'{code}: 官方计 {total} 条 -> 实拉 {len(rows)} 条')
    out = os.path.join(BASE, 'build', f'cfl_league_{code}.json')
    with open(out, 'w', encoding='utf-8') as f:
        json.dump(rows, f, ensure_ascii=False, indent=1)
    print(f'  -> {out}')
    return rows


if __name__ == '__main__':
    for c in (sys.argv[1:] or ['CSL', 'CL1']):
        pull(c)
