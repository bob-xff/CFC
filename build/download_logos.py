#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
下载游戏内球队队徽与联赛标志：
- 欧洲俱乐部：github.com/luukhopman/football-logos（PNG）
- 其他俱乐部：TheSportsDB（searchteams -> strBadge）
- 联赛标志：media.api-sports.io/football/leagues/{id}.png
输出到 assets/logos/，并生成 manifest.json 供游戏内查找。
"""

import io
import json
import os
import time
import urllib.parse
import urllib.request

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LOGO_ROOT = os.path.join(BASE, "assets", "logos")
TEAM_DIR = os.path.join(LOGO_ROOT, "teams")
LEAGUE_DIR = os.path.join(LOGO_ROOT, "leagues")
os.makedirs(TEAM_DIR, exist_ok=True)
os.makedirs(LEAGUE_DIR, exist_ok=True)

UA = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) CFCGame/1.3"}


def http_get(url, timeout=25, binary=False):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=timeout) as r:
        data = r.read()
    return data


def http_json(url, timeout=25):
    data = http_get(url, timeout=timeout)
    return json.loads(data.decode("utf-8", "replace"))


# 联赛标志：API-Football CDN 的联赛 ID
LEAGUE_IDS = {
    "EPL": 39, "LALIGA": 140, "SERIE_A": 135, "BUNDESLIGA": 78, "LIGUE_1": 61,
    "EREDIVISIE": 88, "LIGA_PT": 94, "CSL": 169, "J1": 98, "K1": 292,
    "MLS": 253, "BRA": 71, "ARG": 128, "SAU": 307, "QAT": 313,
}

# 非欧洲球队：中文名 -> TheSportsDB 搜索词
TSDB_SEARCH = {
    # CSL
    "上海海港": "Shanghai Port", "上海申花": "Shanghai Shenhua", "山东泰山": "Shandong Taishan",
    "北京国安": "Beijing Guoan", "成都蓉城": "Chengdu Rongcheng", "天津津门虎": "Tianjin Jinmen Tiger",
    "浙江队": "Zhejiang", "武汉三镇": "Wuhan Three Towns", "河南队": "Henan",
    "长春亚泰": "Changchun Yatai", "青岛西海岸": "Qingdao West Coast", "青岛海牛": "Qingdao Hainiu",
    "深圳新鹏城": "Shenzhen Peng City", "大连英博": "Dalian Yingbo", "云南玉昆": "Yunnan Yukun",
    "梅州客家": "Meizhou Hakka",
    # CL1
    "广州队": "Guangzhou", "辽宁铁人": "Liaoning", "重庆铜梁龙": "Chongqing Tonglianglong",
    "苏州东吴": "Suzhou Dongwu", "南京城市": "Nanjing City", "佛山南狮": "Foshan Nanshi",
    "广西平果哈嘹": "Guangxi", "石家庄功夫": "Shijiazhuang", "上海嘉定汇龙": "Shanghai Jiading",
    "无锡吴钩": "Wuxi Wugou", "延边龙鼎": "Yanbian", "黑龙江冰城": "Heilongjiang",
    # J1
    "横滨水手": "Yokohama", "川崎前锋": "Kawasaki", "浦和红钻": "Urawa", "鹿岛鹿角": "Kashima",
    "神户胜利船": "Vissel Kobe", "广岛三箭": "Sanfrecce", "名古屋鲸八": "Nagoya", "大阪樱花": "Cerezo",
    # K1
    "蔚山HD": "Ulsan", "全北现代": "Jeonbuk", "浦项制铁": "Pohang", "首尔FC": "FC Seoul",
    "水原三星": "Suwon", "大邱FC": "Daegu", "光州FC": "Gwangju", "仁川联": "Incheon",
    # MLS
    "迈阿密国际": "Inter Miami", "洛杉矶FC": "Los Angeles FC", "纽约城": "New York City",
    "西雅图海湾人": "Seattle Sounders", "亚特兰大联": "Atlanta United", "多伦多FC": "Toronto",
    "温哥华白帽": "Vancouver Whitecaps", "芝加哥火焰": "Chicago Fire",
    # BRA
    "弗拉门戈": "Flamengo", "帕尔梅拉斯": "Palmeiras", "博塔弗戈": "Botafogo",
    "科林蒂安": "Corinthians", "圣保罗": "Sao Paulo", "米内罗竞技": "Atletico Mineiro",
    "格雷米奥": "Gremio", "巴西国际": "Internacional", "弗鲁米嫩塞": "Fluminense", "桑托斯": "Santos",
    # ARG
    "博卡青年": "Boca Juniors", "河床": "River Plate", "独立": "Independiente",
    "竞技俱乐部": "Racing Club", "圣洛伦索": "San Lorenzo", "纽维尔老男孩": "Newell",
    "萨斯菲尔德": "Velez", "拉努斯": "Lanus",
    # SAU
    "利雅得新月": "Al Hilal", "利雅得胜利": "Al Nassr", "吉达联合": "Al Ittihad",
    "吉达国民": "Al Ahli", "利雅得青年人": "Al Shabab", "布赖代合作": "Al Taawoun",
    "达曼协作": "Al Ettifaq",
    # QAT
    "萨德": "Al Sadd", "杜海勒": "Al Duhail", "赖扬": "Al Rayyan", "加拉法": "Al Gharafa",
    "沃克拉": "Al Wakrah", "乌姆沙拉尔": "Umm Salal",
}

# 欧洲球队：中文名 -> GitHub 仓库内文件名关键词
GH_SEARCH = {
    "曼城": ("England - Premier League", "Manchester City"),
    "利物浦": ("England - Premier League", "Liverpool"),
    "阿森纳": ("England - Premier League", "Arsenal"),
    "切尔西": ("England - Premier League", "Chelsea"),
    "曼联": ("England - Premier League", "Manchester United"),
    "热刺": ("England - Premier League", "Tottenham"),
    "纽卡斯尔": ("England - Premier League", "Newcastle"),
    "阿斯顿维拉": ("England - Premier League", "Aston Villa"),
    "布莱顿": ("England - Premier League", "Brighton"),
    "西汉姆联": ("England - Premier League", "West Ham"),
    "埃弗顿": ("England - Premier League", "Everton"),
    "富勒姆": ("England - Premier League", "Fulham"),
    "皇家马德里": ("Spain - La Liga", "Real Madrid"),
    "巴塞罗那": ("Spain - La Liga", "Barcelona"),
    "马德里竞技": ("Spain - La Liga", "Atletico Madrid"),
    "塞维利亚": ("Spain - La Liga", "Sevilla"),
    "皇家社会": ("Spain - La Liga", "Real Sociedad"),
    "比利亚雷亚尔": ("Spain - La Liga", "Villarreal"),
    "皇家贝蒂斯": ("Spain - La Liga", "Real Betis"),
    "瓦伦西亚": ("Spain - La Liga", "Valencia"),
    "毕尔巴鄂竞技": ("Spain - La Liga", "Athletic"),
    "赫罗纳": ("Spain - La Liga", "Girona"),
    "国际米兰": ("Italy - Serie A", "Inter"),
    "尤文图斯": ("Italy - Serie A", "Juventus"),
    "AC米兰": ("Italy - Serie A", "Milan"),
    "那不勒斯": ("Italy - Serie A", "Napoli"),
    "罗马": ("Italy - Serie A", "Roma"),
    "拉齐奥": ("Italy - Serie A", "Lazio"),
    "亚特兰大": ("Italy - Serie A", "Atalanta"),
    "佛罗伦萨": ("Italy - Serie A", "Fiorentina"),
    "博洛尼亚": ("Italy - Serie A", "Bologna"),
    "都灵": ("Italy - Serie A", "Torino"),
    "拜仁慕尼黑": ("Germany - Bundesliga", "Bayern"),
    "多特蒙德": ("Germany - Bundesliga", "Dortmund"),
    "RB莱比锡": ("Germany - Bundesliga", "RB Leipzig"),
    "勒沃库森": ("Germany - Bundesliga", "Leverkusen"),
    "法兰克福": ("Germany - Bundesliga", "Frankfurt"),
    "沃尔夫斯堡": ("Germany - Bundesliga", "Wolfsburg"),
    "门兴格拉德巴赫": ("Germany - Bundesliga", "Monchengladbach"),
    "弗赖堡": ("Germany - Bundesliga", "Freiburg"),
    "斯图加特": ("Germany - Bundesliga", "Stuttgart"),
    "美因茨": ("Germany - Bundesliga", "Mainz"),
    "巴黎圣日耳曼": ("France - Ligue 1", "Paris"),
    "马赛": ("France - Ligue 1", "Marseille"),
    "摩纳哥": ("France - Ligue 1", "Monaco"),
    "里昂": ("France - Ligue 1", "Lyon"),
    "里尔": ("France - Ligue 1", "Lille"),
    "尼斯": ("France - Ligue 1", "Nice"),
    "雷恩": ("France - Ligue 1", "Rennes"),
    "朗斯": ("France - Ligue 1", "Lens"),
    "斯特拉斯堡": ("France - Ligue 1", "Strasbourg"),
    "南特": ("France - Ligue 1", "Nantes"),
    "阿贾克斯": ("Netherlands - Eredivisie", "Ajax"),
    "PSV埃因霍温": ("Netherlands - Eredivisie", "PSV"),
    "费耶诺德": ("Netherlands - Eredivisie", "Feyenoord"),
    "阿尔克马尔": ("Netherlands - Eredivisie", "AZ"),
    "特温特": ("Netherlands - Eredivisie", "Twente"),
    "乌德勒支": ("Netherlands - Eredivisie", "Utrecht"),
    "海伦芬": ("Netherlands - Eredivisie", "Heerenveen"),
    "本菲卡": ("Portugal - Primeira Liga", "Benfica"),
    "波尔图": ("Portugal - Primeira Liga", "Porto"),
    "里斯本竞技": ("Portugal - Primeira Liga", "Sporting"),
    "布拉加": ("Portugal - Primeira Liga", "Braga"),
    "吉马良斯": ("Portugal - Primeira Liga", "Guimaraes"),
    "博阿维斯塔": ("Portugal - Primeira Liga", "Boavista"),
}

manifest = {"teams": {}, "leagues": {}}
failures = []


def safe_name(name):
    return name.replace("/", "-").replace("\\", "-").replace(":", "-")


def download(url, path):
    data = http_get(url)
    if data[:4] != b"\x89PNG" and data[:2] != b"\xff\xd8":
        raise ValueError("not an image: " + str(data[:8]))
    with open(path, "wb") as fh:
        fh.write(data)


# 1) 联赛标志
for key, lid in LEAGUE_IDS.items():
    path = os.path.join(LEAGUE_DIR, key + ".png")
    if os.path.exists(path):
        manifest["leagues"][key] = "assets/logos/leagues/" + key + ".png"
        continue
    try:
        download("https://media.api-sports.io/football/leagues/%d.png" % lid, path)
        manifest["leagues"][key] = "assets/logos/leagues/" + key + ".png"
        print("league OK", key)
    except Exception as exc:
        failures.append("league:" + key + ":" + repr(exc)[:60])
        print("league FAIL", key, repr(exc)[:60])
    time.sleep(0.2)


# 2) TheSportsDB 球队
for name, term in TSDB_SEARCH.items():
    path = os.path.join(TEAM_DIR, safe_name(name) + ".png")
    if os.path.exists(path):
        manifest["teams"][name] = "assets/logos/teams/" + safe_name(name) + ".png"
        continue
    try:
        j = http_json(
            "https://www.thesportsdb.com/api/v1/json/3/searchteams.php?t="
            + urllib.parse.quote(term)
        )
        lst = j.get("teams") or []
        hit = None
        for x in lst:
            if term.lower() in (x.get("strTeam") or "").lower():
                hit = x
                break
        if hit is None and lst:
            hit = lst[0]
        badge = (hit or {}).get("strBadge")
        if not badge:
            failures.append("team:" + name + ":no-badge")
            print("team FAIL", name, "no-badge")
            time.sleep(0.3)
            continue
        download(badge, path)
        manifest["teams"][name] = "assets/logos/teams/" + safe_name(name) + ".png"
        print("team OK", name)
    except Exception as exc:
        failures.append("team:" + name + ":" + repr(exc)[:60])
        print("team FAIL", name, repr(exc)[:60])
    time.sleep(0.3)


# 3) GitHub 欧洲球队
try:
    tree = http_json(
        "https://api.github.com/repos/luukhopman/football-logos/git/trees/master?recursive=1",
        timeout=40,
    )
    files = [t["path"] for t in tree.get("tree", []) if t["type"] == "blob"]
    gh_index = {}
    for p in files:
        if p.startswith("logos/") and p.endswith(".png"):
            parts = p.split("/")
            if len(parts) == 3:
                gh_index.setdefault(parts[1], []).append(parts[2])
except Exception as exc:
    gh_index = {}
    failures.append("github-tree:" + repr(exc)[:60])

for name, (league, token) in GH_SEARCH.items():
    path = os.path.join(TEAM_DIR, safe_name(name) + ".png")
    if os.path.exists(path):
        manifest["teams"][name] = "assets/logos/teams/" + safe_name(name) + ".png"
        continue
    matches = [f for f in gh_index.get(league, []) if token.lower() in f.lower()]
    if not matches:
        failures.append("team:" + name + ":github-no-match")
        print("team FAIL", name, "github no match in", league)
        continue
    try:
        raw = (
            "https://raw.githubusercontent.com/luukhopman/football-logos/master/logos/"
            + urllib.parse.quote(league)
            + "/"
            + urllib.parse.quote(matches[0])
        )
        download(raw, path)
        manifest["teams"][name] = "assets/logos/teams/" + safe_name(name) + ".png"
        print("team OK", name)
    except Exception as exc:
        failures.append("team:" + name + ":" + repr(exc)[:60])
        print("team FAIL", name, repr(exc)[:60])

with io.open(
    os.path.join(LOGO_ROOT, "manifest.json"), "w", encoding="utf-8"
) as fh:
    json.dump(manifest, fh, ensure_ascii=False, indent=1)

print("teams downloaded:", len(manifest["teams"]))
print("leagues downloaded:", len(manifest["leagues"]))
print("failures:", len(failures))
for f in failures[:60]:
    print("  FAIL", f)
