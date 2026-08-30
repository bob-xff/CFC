# -*- coding: utf-8 -*-
"""审计：onclick 处理器 / JS 内部调用 是否都有定义"""
import io, os, re

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
src = io.open(os.path.join(ROOT, "football-career-simulator.html"), encoding="utf-8").read()
m = re.search(r"<script>(.*)</script>", src, re.S)
js = m.group(1)
body = src[:m.start()]

defined = set(re.findall(r"function\s+([A-Za-z_$][\w$]*)\s*\(", js))
defined |= set(re.findall(r"const\s+([A-Za-z_$][\w$]*)\s*=", js))
defined |= set(re.findall(r"let\s+([A-Za-z_$][\w$]*)", js))
# browser built-ins whitelist
builtin = set("switchView showScreen showLoadScreen showManageSaves toggleGameMenu menuSave menuSaveAndExit menuLoad menuManageSaves confirmExitGame menuQuitApp closeConfirm processChoice nextStep skipSeasonRest acceptTransfer renewContract enterFreeAgency seekTransfer stayAtClub chooseRetire continuePlaying backToGame selectPosition createPlayer closeSummary location reload escapeJson".split())

problems = []
# onclick handlers
for fn in re.findall(r'onclick="([A-Za-z_$][\w$]*)\(', body):
    if fn not in defined and fn not in builtin:
        problems.append("onclick missing: " + fn)
# function calls inside JS to undefined names (heuristic: name( preceded by non-dot/non-keyword)
kw = set("if for while switch return function catch new typeof delete in of do else try".split())
for name in set(re.findall(r"(?<![.\w$])([a-zA-Z_$][\w$]{2,})\s*\(", js)):
    if name in defined or name in kw or name in builtin:
        continue
    if name in ("Math","String","Number","Boolean","Array","Object","JSON","Date","parseInt","parseFloat","isNaN","Set","Map","RegExp","Error","Promise","Uint8Array","fetch","alert","setTimeout","setInterval","clearTimeout","requestAnimationFrame","parseInt"):
        continue
    problems.append("call to undefined?: " + name)

print("defined symbols:", len(defined))
if problems:
    print("PROBLEMS:")
    for p in sorted(set(problems)):
        print(" -", p)
else:
    print("NO REFERENCE PROBLEMS")
