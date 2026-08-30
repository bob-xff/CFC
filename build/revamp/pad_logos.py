# -*- coding: utf-8 -*-
"""队徽适配：把 assets/logos/teams 下所有非方形队徽居中填充为正方形透明底画布。
联赛标志（leagues/）为宽幅字标，保留原比例，由 CSS .crest-league 宽框展示。
幂等：已是方形的文件跳过。
"""
import os
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
TEAMS = os.path.join(ROOT, "assets", "logos", "teams")

changed, skipped = [], []
for f in sorted(os.listdir(TEAMS)):
    if not f.lower().endswith(".png"):
        continue
    p = os.path.join(TEAMS, f)
    img = Image.open(p)
    w, h = img.size
    if w == h:
        skipped.append(f)
        continue
    side = max(w, h)
    canvas = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    rgba = img.convert("RGBA")
    canvas.paste(rgba, ((side - w) // 2, (side - h) // 2), rgba)
    canvas.save(p, "PNG")
    changed.append((f, (w, h), (side, side)))

print("padded:", len(changed), "already-square:", len(skipped))
for c in changed[:10]:
    print(" ", c)
