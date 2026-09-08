#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# 修正 patch_coach_fix.py：把失败的那条 rep 改为按行重写（chr(92) 构造，杜绝转义歧义）
p='mobile/tools/patch_coach_fix.py'
s=open(p,encoding='utf-8').read()
# 定位失败的 rep 块并删除（从 rep("""  html+='<div class="event-narrative">'+head+ 开始到 ,'fmt/str display') 结束）
import re
pat=re.compile(r"rep\(\"\"\"  html\+='<div class=\"event-narrative\">\+'\+head\+.*?'fmt/str display'\)\)\n",re.S)
s2,cnt=pat.subn('',s)
assert cnt==1,cnt
# 在 open(p,'w'... 之前插入按行重写逻辑
anchor="open(p,'w',encoding='utf-8',newline='').write(s)\nprint('APPLIED:',len(ok))"
inject='''# fmt/str 显示修复（按行重写，HTML 现状为字面双反斜杠，需改为 JS 单反斜杠转义）
B=chr(92)
lines=s.split(chr(10))
for i,l in enumerate(lines):
    if '你还有最后一个换人名额：</div>' in l and 'coach.focus.fmt' in l:
        lines[i] = "  const fmtName=(COACH_FMT.find(f=>f.k===coach.focus.fmt)||{}).t||coach.focus.fmt;\\n  const strName=(COACH_STR.find(f=>f.k===coach.focus.str)||{}).t||coach.focus.str;\\n  html+='<div class=\\"event-narrative\\">'+head+'"+B+"n"+B+"n阵型 '+fmtName+' · 策略 '+strName+' · 你还有最后一个换人名额：</div>';"
s=chr(10).join(lines)
''' + chr(10) + anchor
s2=s2.replace(anchor,inject)
open(p,'w',encoding='utf-8',newline='').write(s2)
print('patch_coach_fix.py updated')
