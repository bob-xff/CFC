#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
把 assets/logos/manifest.json 内联进主 HTML 的 const LOGOS={...}; 单行常量。
用法：python build/update_logos_manifest.py
"""
import io
import json
import os
import re

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
HTML = os.path.join(BASE, "football-career-simulator.html")
MANIFEST = os.path.join(BASE, "assets", "logos", "manifest.json")

with io.open(MANIFEST, encoding="utf-8") as fh:
    man = json.load(fh)

# 紧凑单行 JSON（键不引号不符合 JS 安全性——统一带引号，JSON 即合法 JS 字面量）
inline = json.dumps({"teams": man.get("teams", {}), "leagues": man.get("leagues", {})},
                    ensure_ascii=False, separators=(",", ": "))

with io.open(HTML, encoding="utf-8") as fh:
    html = fh.read()

new_const = "const LOGOS=" + inline + ";"
pat = re.compile(r"const LOGOS=\{.*?\};", re.S)
if not pat.search(html):
    raise SystemExit("未找到 const LOGOS={...}; 常量")
html2, n = pat.subn(lambda m: new_const, html, count=1)
if n != 1:
    raise SystemExit("替换异常：%d 处" % n)

with io.open(HTML, "w", encoding="utf-8", newline="") as fh:
    fh.write(html2)

print("LOGOS 内联完成：teams=%d leagues=%d" % (len(man.get("teams", {})), len(man.get("leagues", {}))))
