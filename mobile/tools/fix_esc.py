#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# 修正 patch_coach_fix.py 中 fmt/str display 补丁的反斜杠层级：
# HTML 源码里是字面双反斜杠（\\n\\n），修复后应为 JS 单反斜杠转义（\n\n）
p='mobile/tools/patch_coach_fix.py'
s=open(p,encoding='utf-8').read()
B=chr(92)
dbl=B+B+'n'+B+B+'n'   # 字面 \\n\\n（HTML 现状）
sgl=B+'n'+B+'n'       # 目标 \n\n（JS 转义）
head_old="html+='<div class=\"event-narrative\">'+head+'"+dbl+"阵型 '+coach.focus.fmt+' · 策略 '+coach.focus.str+' · 你还有最后一个换人名额：</div>';"
head_new="html+='<div class=\"event-narrative\">'+head+'"+sgl+"阵型 '+fmtName+' · 策略 '+strName+' · 你还有最后一个换人名额：</div>';"
c=s.count(head_old)
print('found head_old:',c)
assert c==1
s=s.replace(head_old,head_new)
open(p,'w',encoding='utf-8',newline='').write(s)
print('fixed')
