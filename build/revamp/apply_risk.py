# -*- coding: utf-8 -*-
"""为关键时刻选择注入 risk/fail 分支：高奖励操作可能失误。
每条替换断言精确命中一次，失败即报错退出。"""
import io, os, sys

REV = os.path.dirname(os.path.abspath(__file__))

def patch(fname, pairs):
    p = os.path.join(REV, fname)
    s = io.open(p, encoding="utf-8").read()
    for old, new in pairs:
        n = s.count(old)
        if n != 1:
            print("FAIL %s: match count %d for: %s..." % (fname, n, old[:60]))
            sys.exit(1)
        s = s.replace(old, new)
    io.open(p, "w", encoding="utf-8", newline="\n").write(s)
    print("OK", fname, len(pairs), "patches")

# ---------------- js4a.js：通用比赛/杯赛/洲际/门将 ----------------
A = []
# m1 推射远角
A.append(("consequence:'你瞄准球门右下角，用脚弓推射。皮球贴着草皮滚入网窝！门将鞭长莫及。你冲向角旗区庆祝，看台上传来雷鸣般的欢呼。',formChange:2,goals:1},",
          "consequence:'你瞄准球门右下角，用脚弓推射。皮球贴着草皮滚入网窝！门将鞭长莫及。你冲向角旗区庆祝，看台上传来雷鸣般的欢呼。',formChange:2,goals:1,risk:{attr:'SHO.finishing',base:.68},fail:{effects:{'DRI.composure':1},consequence:'你瞄准球门右下角推射，可惜触球瞬间脚踝稍紧，皮球贴着立柱滑出底线！门将起身拍了拍手套向你示意，看台上一片惋惜的叹息。机会溜走了——下一次，你必须更冷静。',formChange:-1}},"))
# m2 c1 大力射中路
A.append(("consequence:'你选择大力抽射中路！皮球呼啸着飞入球网，门将已经向左侧扑去，完全判断错了方向。绝平！你振臂高呼，队友们疯狂扑向你。',formChange:2,goals:1},",
          "consequence:'你选择大力抽射中路！皮球呼啸着飞入球网，门将已经向左侧扑去，完全判断错了方向。绝平！你振臂高呼，队友们疯狂扑向你。',formChange:2,goals:1,risk:{attr:'SHO.penalties',base:.62},fail:{effects:{'DRI.composure':1},consequence:'你大力抽射中路，可惜发力过猛，皮球高出横梁直上看台！全场发出难以置信的惊呼，门将甚至没来得及做出扑救动作。你低着头走回半场——点球，丢了。',formChange:-1}},"))
# m2 c2 冷静推射左下角
A.append(("consequence:'你深呼一口气，用脚弓精准推射左下角。皮球擦着门柱内侧入网，门将虽然判断对了方向但无力回天。稳稳命中！',formChange:2,goals:1},",
          "consequence:'你深呼一口气，用脚弓精准推射左下角。皮球擦着门柱内侧入网，门将虽然判断对了方向但无力回天。稳稳命中！',formChange:2,goals:1,risk:{attr:'SHO.penalties',base:.72},fail:{effects:{'SHO.penalties':1},consequence:'你推向左下角，方向判断对了，但脚法稍欠——皮球速度太慢，门将倒地将它扑了出去！补射的队友也没能抢到落点。点球失手，你把球衣蒙在了头上。',formChange:-1}},"))
# m2 c3 挑射中路
A.append(("consequence:'你选择大胆的挑射！门将果然提前移动扑向一侧，皮球轻巧地飘入球门中路。这粒进球让全场惊叹不已。',formChange:2,goals:1},",
          "consequence:'你选择大胆的挑射！门将果然提前移动扑向一侧，皮球轻巧地飘入球门中路。这粒进球让全场惊叹不已。',formChange:2,goals:1,risk:{attr:'SHO.penalties',base:.5},fail:{effects:{'DRI.composure':1},consequence:'你想赌门将提前移动，选择了一记轻巧的挑射——但门将根本没有动！他轻松把皮球抱进怀里，还冲你笑了笑。看台的嘘声一浪高过一浪。',formChange:-1}},"))
# m3 c1 高速前插
A.append(("consequence:'你像离弦之箭般冲向对方禁区，队友的直塞球恰到好处。你利用速度甩开后卫，面对门将冷静施射——球进了！德比战锁定胜局！',formChange:2,goals:1},",
          "consequence:'你像离弦之箭般冲向对方禁区，队友的直塞球恰到好处。你利用速度甩开后卫，面对门将冷静施射——球进了！德比战锁定胜局！',formChange:2,goals:1,risk:{attr:'PAC.sprintSpeed',base:.62},fail:{effects:{'PAC.sprintSpeed':1},consequence:'你像离弦之箭般冲向对方禁区，但队友的直塞力道稍大，皮球先一步滚出了底线。反击机会白白浪费，你双手抱头跪在草皮上，德比的僵局还在继续。',formChange:-1}},"))
# m7 c2 长途奔袭
A.append(("consequence:'你决定自己来！带球从中场一路狂奔，连续变向晃过两名防守球员，面对门将冷静施射——球进了！这是一粒足以载入赛季最佳的进球！',formChange:3,goals:1},",
          "consequence:'你决定自己来！带球从中场一路狂奔，连续变向晃过两名防守球员，面对门将冷静施射——球进了！这是一粒足以载入赛季最佳的进球！',formChange:3,goals:1,risk:{attr:'DRI.dribbling',base:.55},fail:{effects:{'DRI.dribbling':1},consequence:'你决定自己来！但连续的变向消耗了太多时间，第三名防守球员赶在射门瞬间把球铲出边线。看台上一片懊恼的叹息，教练在场边摊开了双手。',formChange:-1}},"))
# m8 c1 用进球回应
A.append(("consequence:'你深吸一口气，将怒火压在心底。第88分钟，你在禁区内抢点破门！进球后你跑向那个后卫，指了指记分牌。这才是最好的回应。',formChange:2,goals:1},",
          "consequence:'你深吸一口气，将怒火压在心底。第88分钟，你在禁区内抢点破门！进球后你跑向那个后卫，指了指记分牌。这才是最好的回应。',formChange:2,goals:1,risk:{attr:'SHO.finishing',base:.6},fail:{effects:{'DRI.composure':1},consequence:'你深吸一口气想用进球回应，但愤怒让动作变了形——射门软绵无力，被门将轻松没收。对方后卫凑过来嘲讽：就这？你攥紧了拳头，却无可奈何。',formChange:-1}},"))
# m14 c1 强行内切
A.append(("consequence:'你连续两个变向晃开防守，在禁区线上果断起脚！皮球贴着草皮钻入死角！1-0！全场客队球迷瞬间安静，随队远征的你方球迷在看台上炸开了锅。',formChange:2,goals:1},",
          "consequence:'你连续两个变向晃开防守，在禁区线上果断起脚！皮球贴着草皮钻入死角！1-0！全场客队球迷瞬间安静，随队远征的你方球迷在看台上炸开了锅。',formChange:2,goals:1,risk:{attr:'DRI.dribbling',base:.58},fail:{effects:{'DRI.agility':1},consequence:'你连续两个变向试图晃开防守，但铁桶阵前空间太小，皮球被第三名后卫断下，对方顺势打出快速反击！好在回防及时没有丢球，教练在场边吼着让你冷静。',formChange:-1}},"))
# m15 c1 爆射近角
A.append(("consequence:p=>'你抡起右脚爆射近角！皮球炮弹般入网，门将毫无反应！这是决定冠军归属的进球！你脱下球衣疯狂庆祝，队友们把你扑倒在地。最终你们1-0捧起'+domesticCupName(p)+'冠军！',formChange:3,goals:1,flag:'cup_winner'},",
          "consequence:p=>'你抡起右脚爆射近角！皮球炮弹般入网，门将毫无反应！这是决定冠军归属的进球！你脱下球衣疯狂庆祝，队友们把你扑倒在地。最终你们1-0捧起'+domesticCupName(p)+'冠军！',formChange:3,goals:1,flag:'cup_winner',risk:{attr:'SHO.shotPower',base:.58},fail:{effects:{'SHO.shotPower':1},consequence:'你抡起右脚爆射近角！可惜发力时支撑脚一滑，皮球高出横梁飞入看台。全场整齐地发出一声长叹——决赛最好的机会就这样溜走，你跪在地上久久没有起身。',formChange:-1}},"))
# m16 c1 油炸丸子
A.append(("consequence:'你一个油炸丸子过掉中卫，顺势推射远角！皮球绕过门将滚入网窝！2-1！你指着看台上的客场球迷怒吼，这场比赛成为亚冠历史上值得铭记的一夜。',formChange:3,goals:1,flag:'acl_hero'},",
          "consequence:'你一个油炸丸子过掉中卫，顺势推射远角！皮球绕过门将滚入网窝！2-1！你指着看台上的客场球迷怒吼，这场比赛成为亚冠历史上值得铭记的一夜。',formChange:3,goals:1,flag:'acl_hero',risk:{attr:'DRI.dribbling',base:.6},fail:{effects:{'DRI.agility':1},consequence:'你尝试用油炸丸子过掉中卫，但对方没有吃晃——皮球被断，对方直接发起快速反击！你拼命回追，好在队友补位化解。洲际赛场，容错率就是这么低。',formChange:-1}},"))
# m17 c1 冲击防线
A.append(("consequence:'你上场后连续两次高速冲刺撕开防线。第82分钟，你反越位成功单刀赴会，冷静推射破门！4-3总比分逆转晋级！全场爆发出山呼海啸般的欢呼，你在角旗区滑跪，泪水与汗水混在一起。',formChange:3,goals:1,flag:'acl_reverse'},",
          "consequence:'你上场后连续两次高速冲刺撕开防线。第82分钟，你反越位成功单刀赴会，冷静推射破门！4-3总比分逆转晋级！全场爆发出山呼海啸般的欢呼，你在角旗区滑跪，泪水与汗水混在一起。',formChange:3,goals:1,flag:'acl_reverse',risk:{attr:'PAC.sprintSpeed',base:.6},fail:{effects:{'PAC.sprintSpeed':1},consequence:'你上场后全力冲击防线，可惜身体还没完全热开，第一次加速就被边卫卡住身位，随后的传中也被门将没收。逆转的希望随时间流逝，你喘着粗气告诉自己别慌。',formChange:-1}},"))
# m19 c1 突然远射
A.append(("consequence:'你假装组织，突然起脚远射！皮球穿过人墙缝隙直挂死角！1-0！铁桶阵被一把钥匙打开，全场瞬间沸腾。',formChange:2,goals:1},",
          "consequence:'你假装组织，突然起脚远射！皮球穿过人墙缝隙直挂死角！1-0！铁桶阵被一把钥匙打开，全场瞬间沸腾。',formChange:2,goals:1,risk:{attr:'SHO.longShots',base:.5},fail:{effects:{'SHO.longShots':1},consequence:'你假装组织，突然起脚远射！可惜人墙的缝隙比想象中小，皮球结结实实砸在人墙身上弹出，对方趁势打出反击，你的心一下子提到了嗓子眼。',formChange:-1}},"))
# g1 c1 门将扑点
A.append(("consequence:'你判断正确！向右下角飞身扑去，双手精准地将球挡了出去！全场沸腾，队友们冲过来将你抱起。这是一次教科书般的扑救！',formChange:2,flag:'penalty_save'},",
          "consequence:'你判断正确！向右下角飞身扑去，双手精准地将球挡了出去！全场沸腾，队友们冲过来将你抱起。这是一次教科书般的扑救！',formChange:2,flag:'penalty_save',risk:{attr:'GK.reflexes',base:.55},fail:{effects:{'GK.reflexes':1},consequence:'你判断对方会射右下角，飞身扑去——但他射向了左下角！皮球贴着立柱滚入网窝。你趴在草皮上捶了一下，门将教练在场边摇头：分析报告只是参考。',formChange:-1}},"))

# ---------------- js4b.js：章节剧情/大赛 ----------------
B = []
# ch3_cup_run c1 突然远射挂死角
B.append(("consequence:'皮球像装了导航一样贴着横梁下沿入网！1-0！全场疯狂！这一球让你一战成名，\"远射机器\"的外号从今天开始流传。',formChange:3,goals:1,flag:'cup_semifinal_hero'},",
          "consequence:'皮球像装了导航一样贴着横梁下沿入网！1-0！全场疯狂！这一球让你一战成名，\"远射机器\"的外号从今天开始流传。',formChange:3,goals:1,flag:'cup_semifinal_hero',risk:{attr:'SHO.longShots',base:.55},fail:{effects:{'SHO.longShots':1},consequence:'皮球像装了导航一样——飞向了死角的看台！远射高出横梁整整三米。你懊恼地抓了抓头发，对方门将善意地朝你鼓了鼓掌。一战成名，还差一脚准头。',formChange:-1}},"))
# cal_asian_cup c1 一击致命
B.append(("consequence:'你突入禁区小角度爆射近角得手！1-0！中国队小组出线！终场哨响时你跪地怒吼，这一球将被反复播放十年。亚洲杯最佳进球候选，就是它。',formChange:4,goals:1,intlGoals:1,caps:1,flag:'asian_cup_hero'},",
          "consequence:'你突入禁区小角度爆射近角得手！1-0！中国队小组出线！终场哨响时你跪地怒吼，这一球将被反复播放十年。亚洲杯最佳进球候选，就是它。',formChange:4,goals:1,intlGoals:1,caps:1,flag:'asian_cup_hero',risk:{attr:'SHO.finishing',base:.6},fail:{effects:{'SHO.finishing':1},consequence:'你突入禁区小角度爆射——被对方门将用腿挡出！紧接着的补射也被后卫用身体封堵。终场哨响，0-0，出线的悬念留到了最后一轮。你把球衣蒙在头上，久久没有说话。',formChange:-1,caps:1}},"))
# cal_quali_2029 c1 直接任意球
B.append(("consequence:'你深吸一口气，助跑、摆腿——皮球划出完美弧线，越过人墙，擦着门柱内侧坠入死角！！！3分钟后的终场哨，是中国足球十六年等待的终点。你疯了般奔跑，队友在身后追。这一夜，无数人泪流满面——中国队，晋级2030世界杯！！！',formChange:5,goals:1,intlGoals:1,caps:1,flag:'wc_qualified'},",
          "consequence:'你深吸一口气，助跑、摆腿——皮球划出完美弧线，越过人墙，擦着门柱内侧坠入死角！！！3分钟后的终场哨，是中国足球十六年等待的终点。你疯了般奔跑，队友在身后追。这一夜，无数人泪流满面——中国队，晋级2030世界杯！！！',formChange:5,goals:1,intlGoals:1,caps:1,flag:'wc_qualified',risk:{attr:'PAS.freeKickAccuracy',base:.45},fail:{effects:{'PAS.freeKickAccuracy':1},consequence:'你深吸一口气，助跑、摆腿——皮球越过人墙，却偏出了立柱！五万客场球迷的叹息声像潮水一样涌来。终场哨响，1-1，晋级的答案要留给下一场比赛了。',formChange:-2,caps:1}},"))
# cal_wc_2030 c1 世界杯首球
B.append(("consequence:'你晃开防守，禁区内冷静推射远角——球进了！！！中国男足世界杯历史性进球！你亲吻队徽，泪流满面。解说员哽咽：\"这一球，几代中国球员的梦。\"比赛1-0，中国队世界杯首胜！',formChange:5,goals:1,intlGoals:1,caps:1,flag:'wc_goal'},",
          "consequence:'你晃开防守，禁区内冷静推射远角——球进了！！！中国男足世界杯历史性进球！你亲吻队徽，泪流满面。解说员哽咽：\"这一球，几代中国球员的梦。\"比赛1-0，中国队世界杯首胜！',formChange:5,goals:1,intlGoals:1,caps:1,flag:'wc_goal',risk:{attr:'SHO.finishing',base:.6},fail:{effects:{'SHO.finishing':1},consequence:'你晃开防守推射远角——门将的手指改变了一切！皮球被他指尖一蹭击中立柱弹出。中国队错失世界杯历史上最好的进球机会，你抱着头望向天空，不甘写满了脸。',formChange:-1,caps:1}},"))
# cal_wc_2034_final c1 挑射
B.append(("consequence:'你看看门将站位，突然起脚挑射——皮球越过门将指尖，缓缓坠入网窝！！！2-1！！！终场哨响，你是世界杯冠军成员！！！中国足球——世界之巅！！！你的名字，从此刻起写进了这个星球上所有语言的足球词典。',formChange:6,goals:1,intlGoals:1,caps:1,flag:'wc_champion'},",
          "consequence:'你看看门将站位，突然起脚挑射——皮球越过门将指尖，缓缓坠入网窝！！！2-1！！！终场哨响，你是世界杯冠军成员！！！中国足球——世界之巅！！！你的名字，从此刻起写进了这个星球上所有语言的足球词典。',formChange:6,goals:1,intlGoals:1,caps:1,flag:'wc_champion',risk:{attr:'SHO.finishing',base:.55},fail:{effects:{'PAS.curve':1},consequence:'你突然起脚挑射——门将根本没有起跳，稳稳把皮球抱进怀里！决赛最宝贵的一次机会被浪费，你盯着自己的鞋钉，不敢相信这就是结果。',formChange:-1,caps:1}},"))
# ch6_acl_run c1 梅开二度
B.append(("consequence:'第78分钟你远射扳平总比分，第90+3分钟你抢断后卫推射绝杀！3-2总比分晋级决赛！你跪在草皮上，看台的Tifo是你的头像——这一夜属于你。',formChange:4,goals:2,flag:'acl_final'},",
          "consequence:'第78分钟你远射扳平总比分，第90+3分钟你抢断后卫推射绝杀！3-2总比分晋级决赛！你跪在草皮上，看台的Tifo是你的头像——这一夜属于你。',formChange:4,goals:2,flag:'acl_final',risk:{attr:'SHO.finishing',base:.55},fail:{effects:{'SHO.finishing':1,'PHY.stamina':-1},consequence:'第78分钟你的远射被门将神扑，第90+3分钟的单刀也被出击的门将用身体挡出！2-2，总比分憾平，比赛被拖入加时。你还有时间，但双腿已经开始报警。',formChange:-1}},"))
# ch6_acl_title c1 绝杀
B.append(("consequence:'你在两人包夹下强行转身抽射——皮球应声入网！2-1！亚冠冠军！！！你被全队抛向夜空，彩带落在你的肩上。中国球员作为绝对核心捧起亚冠——史无前例！',formChange:5,goals:1,flag:'acl_champion'},",
          "consequence:'你在两人包夹下强行转身抽射——皮球应声入网！2-1！亚冠冠军！！！你被全队抛向夜空，彩带落在你的肩上。中国球员作为绝对核心捧起亚冠——史无前例！',formChange:5,goals:1,flag:'acl_champion',risk:{attr:'SHO.finishing',base:.6},fail:{effects:{'DRI.composure':1},consequence:'你在两人包夹下强行转身抽射——皮球蹭着横梁飞出！终场哨响，1-1，比赛进入加时。你跪在草皮上大口喘气，亚洲之巅的最后一击，失手了。',formChange:-1}},"))
# ch7_ucl_final c1 世界波
B.append(("consequence:'你晃开角度，起脚——世界波！！！皮球直挂死角！2-1！欧冠冠军！！！中国球员第一次站在欧洲之巅！你冲向看台，泪飞如雨。这一天，被写进了所有语言的足球史。',formChange:6,goals:1,flag:'ucl_champion'},",
          "consequence:'你晃开角度，起脚——世界波！！！皮球直挂死角！2-1！欧冠冠军！！！中国球员第一次站在欧洲之巅！你冲向看台，泪飞如雨。这一天，被写进了所有语言的足球史。',formChange:6,goals:1,flag:'ucl_champion',risk:{attr:'SHO.longShots',base:.55},fail:{effects:{'SHO.longShots':1},consequence:'你晃开角度起脚——皮球被人墙挡出！对方顺势打出快速反击，全队回追到抽筋才化解险情。世界波变成了角球，你抹了一把脸上的汗水：还有时间，还有机会。',formChange:-1}},"))

patch("js4a.js", A)
patch("js4b.js", B)
print("ALL RISK PATCHES APPLIED")
