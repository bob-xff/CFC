#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""补下载：修正 LaLiga/葡超目录名、重试超时项、补欧洲缺失队徽。"""

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
UA = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) CFCGame/1.3"}


def http_get(url, timeout=30, retries=2):
    last = None
    for _ in range(retries + 1):
        try:
            req = urllib.request.Request(url, headers=UA)
            with urllib.request.urlopen(req, timeout=timeout) as r:
                return r.read()
        except Exception as exc:
            last = exc
            time.sleep(1.5)
    raise last


def http_json(url, timeout=30, retries=2):
    return json.loads(http_get(url, timeout, retries).decode("utf-8", "replace"))


def download(url, path):
    data = http_get(url)
    if data[:4] != b"\x89PNG" and data[:2] != b"\xff\xd8":
        raise ValueError("not image")
    with open(path, "wb") as fh:
        fh.write(data)


def safe(name):
    return name.replace("/", "-").replace("\\", "-").replace(":", "-")


with io.open(os.path.join(LOGO_ROOT, "manifest.json"), encoding="utf-8") as fh:
    manifest = json.load(fh)
failures = []


# 1) 中超联赛标志重试
try:
    p = os.path.join(LEAGUE_DIR, "CSL.png")
    if not os.path.exists(p):
        download("https://media.api-sports.io/football/leagues/169.png", p)
    manifest["leagues"]["CSL"] = "assets/logos/leagues/CSL.png"
    print("league OK CSL")
except Exception as exc:
    failures.append("CSL:" + repr(exc)[:60])


# 2) LaLiga / 葡超（GitHub 精确文件名）
GH_EXACT = {
    "皇家马德里": ("Spain - LaLiga", "Real Madrid.png"),
    "巴塞罗那": ("Spain - LaLiga", "FC Barcelona.png"),
    "马德里竞技": ("Spain - LaLiga", "Atlético de Madrid.png"),
    "塞维利亚": ("Spain - LaLiga", "Sevilla FC.png"),
    "皇家社会": ("Spain - LaLiga", "Real Sociedad.png"),
    "比利亚雷亚尔": ("Spain - LaLiga", "Villarreal CF.png"),
    "皇家贝蒂斯": ("Spain - LaLiga", "Real Betis Balompié.png"),
    "瓦伦西亚": ("Spain - LaLiga", "Valencia CF.png"),
    "毕尔巴鄂竞技": ("Spain - LaLiga", "Athletic Bilbao.png"),
    "本菲卡": ("Portugal - Liga Portugal", "SL Benfica.png"),
    "波尔图": ("Portugal - Liga Portugal", "FC Porto.png"),
    "里斯本竞技": ("Portugal - Liga Portugal", "Sporting CP.png"),
    "布拉加": ("Portugal - Liga Portugal", "SC Braga.png"),
    "吉马良斯": ("Portugal - Liga Portugal", "Vitória Guimarães SC.png"),
}
for name, (folder, fname) in GH_EXACT.items():
    p = os.path.join(TEAM_DIR, safe(name) + ".png")
    if os.path.exists(p):
        manifest["teams"][name] = "assets/logos/teams/" + safe(name) + ".png"
        continue
    try:
        raw = (
            "https://raw.githubusercontent.com/luukhopman/football-logos/master/logos/"
            + urllib.parse.quote(folder)
            + "/"
            + urllib.parse.quote(fname)
        )
        download(raw, p)
        manifest["teams"][name] = "assets/logos/teams/" + safe(name) + ".png"
        print("team OK", name)
    except Exception as exc:
        failures.append(name + ":" + repr(exc)[:60])
        print("team FAIL", name, repr(exc)[:60])


# 3) 超时/缺失项 -> TheSportsDB
TSDB_EXTRA = {
    "帕尔梅拉斯": "Palmeiras", "曼联": "Manchester United", "尤文图斯": "Juventus",
    "那不勒斯": "Napoli", "RB莱比锡": "RB Leipzig", "尼斯": "Nice",
    "PSV埃因霍温": "PSV Eindhoven", "特温特": "FC Twente",
    "西汉姆联": "West Ham", "沃尔夫斯堡": "Wolfsburg", "门兴格拉德巴赫": "Monchengladbach",
    "雷恩": "Rennes", "南特": "Nantes", "赫罗纳": "Girona", "博阿维斯塔": "Boavista",
}
for name, term in TSDB_EXTRA.items():
    p = os.path.join(TEAM_DIR, safe(name) + ".png")
    if os.path.exists(p):
        manifest["teams"][name] = "assets/logos/teams/" + safe(name) + ".png"
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
            failures.append(name + ":no-badge")
            print("team FAIL", name, "no-badge")
            continue
        download(badge, p)
        manifest["teams"][name] = "assets/logos/teams/" + safe(name) + ".png"
        print("team OK", name)
    except Exception as exc:
        failures.append(name + ":" + repr(exc)[:60])
        print("team FAIL", name, repr(exc)[:60])
    time.sleep(0.4)


with io.open(os.path.join(LOGO_ROOT, "manifest.json"), "w", encoding="utf-8") as fh:
    json.dump(manifest, fh, ensure_ascii=False, indent=1)

print("teams total:", len(manifest["teams"]))
print("leagues total:", len(manifest["leagues"]))
print("failures:", len(failures))
for f in failures:
    print("  FAIL", f)
