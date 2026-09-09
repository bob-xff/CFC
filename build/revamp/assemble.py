# -*- coding: utf-8 -*-
"""组装新版 football-career-simulator.html
保留原文件的 3 行内嵌 Base64 常量（CFC_LOGO_DATA / CFC_LOGO_SPLASH / LOGOS），
替换 CSS、HTML 骨架与全部游戏 JS。
"""
import io, os, shutil, sys

# ⚠️ 废弃警告（V2.3.0）：本脚本由 V2.1 时代的模块源码(css.css/js1-5.js)组装，
# 会把主 HTML 就地回退到旧版，丢失 V2.2.x/V2.3.0 的全部工作（含独立教练模式）。
# 现行开发方式为直接修改 football-career-simulator.html，请勿再运行本脚本。
sys.exit(" assemble.py 已废弃：直接修改 football-career-simulator.html；此脚本会回退版本，已阻止执行。")

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
REV  = os.path.join(ROOT, "build", "revamp")
ORIG = os.path.join(ROOT, "football-career-simulator.html")
OUT  = ORIG  # 就地更新（先备份）
BAK  = ORIG + ".v1.bak"

def read(path):
    with io.open(path, "r", encoding="utf-8") as f:
        return f.read()

def write(path, s):
    with io.open(path, "w", encoding="utf-8", newline="\n") as f:
        f.write(s)

orig_lines = read(BAK if os.path.exists(BAK) else ORIG).split("\n")
# 行号(1-based): 7=<style> 312=</style> 313=</head> 528=<script> 529=注释 530-532=Base64常量
head = "\n".join(orig_lines[0:7])          # 行1-7（含 <style>）
logo_comment = orig_lines[528]             # 行529 注释
logo_lines = "\n".join(orig_lines[529:532])# 行530-532 三个常量

assert "<style>" in head, "head slice wrong"
assert logo_comment.strip().startswith("// CFC"), "logo comment anchor wrong"
assert orig_lines[529].startswith("const CFC_LOGO_DATA"), "LOGO_DATA anchor wrong"
assert orig_lines[531].startswith("const LOGOS="), "LOGOS anchor wrong"

css  = read(os.path.join(REV, "css.css"))
body = read(os.path.join(REV, "body.html"))
js   = "\n".join(read(os.path.join(REV, f)) for f in
       ["js1.js","js2.js","js3.js","js4a.js","js4b.js","js5.js"])

parts = [
    head, "\n",
    css, "\n",
    "</style>\n</head>\n<body>\n",
    body, "\n",
    "<script>\n",
    logo_comment, "\n",
    logo_lines, "\n",
    js, "\n",
    "</script>\n</body>\n</html>\n",
]
final = "".join(parts)

if not os.path.exists(BAK):
    shutil.copyfile(ORIG, BAK)

write(OUT, final)
print("OK  bytes:", len(final.encode("utf-8")))
print("backup:", BAK)
