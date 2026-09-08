#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# 同步冒烟测试 R8/R9 到新教练流程 API
p='build/revamp/_smoke_test.js'
s=open(p,encoding='utf-8').read()
old="""showCoachMode();
t('R8 高声望退役 → 直接出任争冠球队主教练', coach.teamIdx === 3 && fakeExtra.innerHTML.indexOf('执教生涯开始') >= 0);
const _rr = Math.random; Math.random = () => 0;
coachNextSeason();
const evOk = fakeExtra.innerHTML.indexOf('choice-btn') > 0;
coachChoose(0);
const repAfter = coach.rep;
coachResult();
Math.random = _rr;
t('R9 执教赛季流程：事件→抉择→结算，声望变动且可升迁', evOk && typeof repAfter === 'number' && (coach.teamIdx === 4 || coach.teamIdx === 3));"""
new="""showCoachMode();
t('R8 高声望退役 → 直接出任争冠球队主教练（指挥台）', coach.teamIdx === 3 && fakeExtra.innerHTML.indexOf('coach-hub') >= 0);
const _rr = Math.random; Math.random = () => 0;
coachStartSeason();
const evOk = fakeExtra.innerHTML.indexOf('choice-btn') > 0;
coachChoose(0);
const repAfter = coach.rep;
coachTactics();
coachConfirmTactics();
coachLiveChoice(0);
coachResult();
Math.random = _rr;
t('R9 执教赛季流程：事件→抉择→排兵→临场→结算，声望变动且战绩入账', evOk && typeof repAfter === 'number' && coach.stats && (coach.stats.w + coach.stats.d + coach.stats.l) >= 1 && (coach.teamIdx === 4 || coach.teamIdx === 3));"""
c=s.count(old)
assert c==1,c
s=s.replace(old,new)
open(p,'w',encoding='utf-8',newline='').write(s)
print('smoke R8/R9 updated')
