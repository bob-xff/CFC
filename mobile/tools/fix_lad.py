#!/usr/bin/env python3
# -*- coding: utf-8 -*-
p='football-career-simulator.html'
s=open(p,encoding='utf-8').read()
old="""function coachStartSeason(){
  coach.age++;"""
new="""function coachStartSeason(){
  const lad=COACH_LADDER[coach.teamIdx];
  coach.age++;"""
c=s.count(old)
assert c==1,'found %d'%c
s=s.replace(old,new)
open(p,'w',encoding='utf-8',newline='').write(s)
print('lad defined in coachStartSeason')
