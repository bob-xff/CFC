#!/usr/bin/env python3
# -*- coding: utf-8 -*-
p='football-career-simulator.html'
s=open(p,encoding='utf-8').read()
old="""  document.getElementById('retire-screen').classList.add('coach-mode');
  setRetireBack('← 退出到主菜单',exitToMainMenu);"""
new="""  const rs=document.getElementById('retire-screen');
  if(rs)rs.classList.add('coach-mode');
  setRetireBack('← 退出到主菜单',exitToMainMenu);"""
c=s.count(old)
assert c==1,c
s=s.replace(old,new)
open(p,'w',encoding='utf-8',newline='').write(s)
print('guard added')
