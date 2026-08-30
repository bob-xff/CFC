# -*- coding: utf-8 -*-
import io, re
src = io.open(r"C:\Users\Administrator\Desktop\CFC1.0\football-career-simulator.html", encoding="utf-8").read()
m = re.search(r"<script>(.*)</script>", src, re.S)
js = m.group(1)
dbg = ('<!DOCTYPE html><html><head><meta charset="UTF-8">'
       '<script>window.__errs=[];window.onerror=function(m,s,l,c){window.__errs.push(m+" @line "+l+":"+c);return false;};</script>'
       '</head><body><script>' + js + '\n;window.__done=true;</script></body></html>')
io.open(r"C:\Users\Administrator\Desktop\CFC1.0\build\revamp\debug.html", "w", encoding="utf-8").write(dbg)
print("written", len(dbg))
