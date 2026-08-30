# -*- coding: utf-8 -*-
import io, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
REV = os.path.join(ROOT, "build", "revamp")
src = io.open(os.path.join(ROOT, "football-career-simulator.html"), encoding="utf-8").read()
m = re.search(r"<script>(.*)</script>", src, re.S)
js = m.group(1)
io.open(os.path.join(REV, "_check.js"), "w", encoding="utf-8").write(js)
print("JS chars:", len(js))

import esprima
try:
    esprima.parseScript(js)
    print("SYNTAX OK")
except Exception as e:
    print("SYNTAX ERROR: line", getattr(e, "lineNumber", "?"), "col", getattr(e, "column", "?"), "-", getattr(e, "description", e))
    sys.exit(1)
