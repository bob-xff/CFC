#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# 直接重写 patch_coach.py 中损坏的 t7 行（按行号 273，即 index 272）
p='mobile/tools/patch_coach.py'
lines=open(p,encoding='utf-8').read().split('\n')
q="'"  # JS 单引号
line = 'rep("{ id:' + q + 't7' + q + ',cat:' + q + 'training' + q + ',minAge:20,' + '","{ id:' + q + 't7' + q + ',cat:' + q + 'training' + q + ',noGK:true,minAge:20,' + '","t7 noGK")'
idx = 272  # 0-based
assert 't7 noGK' in lines[idx], 'line 273 does not contain t7 noGK: ' + lines[idx]
lines[idx] = line
open(p, 'w', encoding='utf-8', newline='').write('\n'.join(lines))
print('line 273 rewritten:')
print(lines[idx])
