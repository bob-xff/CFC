// ============ 通用事件池（可复用，冷却5季；文本随人物/地域/时间动态生成） ============
const GENERIC_EVENTS=[
// --- 训练 ---
{ id:'t1',cat:'training',minAge:16,
  narrative:p=>`夕阳将训练基地染成金红色。大多数队友已经收拾完毕陆续离开，空旷的训练场上只剩下你和几堆足球。\n\n今天的训练课上，${coachLine(p.team)?coachLine(p.team)+'教练组':'教练组'}特意把你叫到一边："${p.name}，你的基本功不错，但想要进入一线队，还需要在某一项上做到极致。趁现在训练场还空着，想加练什么？"\n\n你低头看着脚下的足球，深吸一口气，做出了选择：`,
  choices:[
    {text:'加练射门 — 反复练习禁区内抢点射门',effects:{'SHO.finishing':2,'SHO.positioning':1,'PHY.stamina':-1},consequence:'暮色中你一遍遍练习禁区内射门，脚与球碰撞的闷响回荡在空旷的球场。虽然第二天大腿酸胀，但你的射术有了明显提升。',formChange:1},
    {text:'加练盘带 — 设置障碍物练习变向过人',effects:{'DRI.dribbling':2,'DRI.agility':1,'PHY.stamina':-1},consequence:'你在锥桶间穿梭，反复练习变向和急停。脚下越来越灵活，身体重心的控制也更加自如了。',formChange:1},
    {text:'加练体能 — 长跑和冲刺间歇训练',effects:{'PHY.stamina':2,'PAC.sprintSpeed':1,'PHY.strength':1},consequence:'你绕着训练场跑了整整四十分钟，最后几圈几乎是在咬牙坚持。汗水浸透了训练服，但你知道体能是足球的根基。',formChange:0},
    {text:'今天就算了，回去好好休息',effects:{'PHY.stamina':1,'DRI.composure':1},consequence:'你收拾好东西离开了训练场。合理的休息也是训练的一部分，明天的训练课你会以更好的状态投入。',formChange:0}
  ]},
{ id:'t2',cat:'training',minAge:16,
  narrative:p=>`训练基地来了一位新面孔——一位来自巴西的技术教练。他带来了全新的训练理念：VR虚拟现实训练系统。\n\n"这套设备可以模拟比赛场景，帮助你训练决策能力和反应速度。"他用带着口音的中文说道，"不过每天只能用30分钟，过度使用可能导致眩晕。你想试试吗？"\n\n几位队友已经在排队等候，你看了看这套充满科技感的设备：`,
  choices:[
    {text:'率先体验VR训练系统',effects:{'DRI.reactions':2,'DRI.composure':1,'PAS.vision':1},consequence:'你戴上VR头显，眼前瞬间出现了模拟球场的画面。虚拟防守球员向你逼来，你需要在毫秒之间做出决策。半小时后摘下头显，感觉大脑被彻底激活了。',formChange:1},
    {text:'让队友先试，我观察一下',effects:{'DRI.reactions':1,'DRI.composure':1},consequence:'你站在一旁仔细观察队友使用VR训练的过程，从中也学到了不少东西。等下次轮到你时，你会更加得心应手。',formChange:0},
    {text:'坚持传统训练方式',effects:{'DRI.ballControl':1,'SHO.finishing':1,'PHY.stamina':1},consequence:'你婉拒了新设备，坚持在球场上进行传统训练。脚踏实地的训练永远不会过时，你的基本功更加扎实了。',formChange:0}
  ]},
{ id:'t3',cat:'training',minAge:16,
  narrative:p=>`力量房的灯光有些刺眼。体能教练站在一旁，面前摆着两套训练方案。\n\n"${p.name}，你现在的身体对抗在同龄人里还吃亏。我建议你增加力量训练，但有两条路可以选——"他指了指左边的杠铃区，"爆发力训练，提升你的加速能力和对抗中的平衡"；又指了右边的器械区，"或者耐力训练，让你在90分钟内始终保持高强度跑动。"\n\n你看了看镜子里的自己：`,
  choices:[
    {text:'爆发力训练 — 深蹲、硬拉、爆发跳跃',effects:{'PHY.strength':2,'PAC.acceleration':1,'PHY.jumping':1},consequence:'杠铃的重量压在肩上，你咬紧牙关完成每一组。几周下来，你的爆发力明显增强，对抗中不再轻易被挤开。',formChange:0},
    {text:'耐力训练 — 长距离跑和间歇冲刺',effects:{'PHY.stamina':2,'PAC.sprintSpeed':1,'PHY.aggression':1},consequence:'你在跑步机上挥汗如雨，心率一直在高位徘徊。但你能感觉到，下半场不再像以前那样双腿灌铅了。',formChange:0},
    {text:'均衡训练 — 两者各做一半',effects:{'PHY.strength':1,'PHY.stamina':1,'PHY.jumping':1},consequence:'你选择了折中方案，虽然两项都没有练到极致，但整体身体素质的提升更加均衡。',formChange:0}
  ]},
{ id:'t4',cat:'training',minAge:18,
  narrative:p=>`你的经纪人联系了一位欧洲知名的个人技术教练——他曾经培养过多位西甲球星。他表示可以为你提供一对一的特训课程，但费用不菲，需要从你的薪水中支出一部分。\n\n"他的特训能让你的技术水平提升一个档次，"经纪人在电话里说，"但这也意味着这段时间你的收入会减少。而且训练强度很大，有受伤风险。"\n\n你思考了片刻：`,
  choices:[
    {text:'聘请他进行一对一特训',effects:{'DRI.dribbling':2,'DRI.ballControl':2,'DRI.agility':1,'SHO.finishing':1},consequence:'这位教练的训练严苛而精细，每一个触球动作都反复打磨。几周的特训后，你的脚下技术有了质的飞跃，队友们都说你像换了一个人。',formChange:1},
    {text:'跟随球队常规训练即可',effects:{'DRI.ballControl':1,'PAS.shortPassing':1},consequence:'你觉得目前跟随球队训练已经足够。虽然进步稍慢，但避免了额外开销和受伤风险。',formChange:0},
    {text:'找队友互相加练',effects:{'PAS.shortPassing':1,'DRI.reactions':1,'DRI.composure':1},consequence:'你和几位关系好的队友约好每天加练半小时。虽然没有专业教练指导，但互相切磋也让你们都有所提高。',formChange:1}
  ]},
{ id:'t5',cat:'training',minAge:17,
  narrative:p=>`俱乐部引进了一套全新的数据分析系统。技术人员给你看了一份详细的报告——你的传球成功率在高压逼抢下会下降15%，而且你的弱脚使用率只有8%。\n\n"如果你想上一个台阶，必须改善弱脚能力。"技术总监指着数据说，"我们设计了一套弱脚强化训练方案，每天额外40分钟。但这也意味着你的整体训练量会增加。"\n\n你看着数据，陷入了思考：`,
  choices:[
    {text:'执行弱脚强化训练方案',effects:{'DRI.ballControl':1,'PAS.shortPassing':1,'SHO.finishing':1,'PHY.stamina':-1},consequence:'你每天额外花40分钟专门练弱脚。一个月后，你在比赛中敢于用弱脚处理球了，传球选择更加多样化。',formChange:1,flag:'weakfoot_boost'},
    {text:'只强化优势脚的精度',effects:{'SHO.finishing':2,'PAS.shortPassing':2,'DRI.dribbling':1},consequence:'你决定把优势脚练到极致。虽然弱脚依然是短板，但优势脚的处理球精度达到了新的高度。',formChange:1},
    {text:'要求均衡训练计划',effects:{'DRI.ballControl':1,'PAS.shortPassing':1,'PAS.longPassing':1,'DRI.composure':1},consequence:'你和技术总监商量了一个均衡方案，既不忽视弱脚也不放弃优势。整体提升虽然不快，但更加全面。',formChange:0}
  ]},
{ id:'t6',cat:'training',minAge:19,
  narrative:p=>`休赛期，你有两个选择来安排你的训练计划。\n\n选项一：跟随球队在昆明海埂高原基地进行为期三周的高原训练，这能大幅提升你的体能储备，但训练过程会非常艰苦。\n\n选项二：前往欧洲，和欧洲球队进行为期两周的拉练，虽然体能提升有限，但能学习先进的战术理念。\n\n两个选择各有优劣：`,
  choices:[
    {text:'海埂高原训练 — 提升体能上限',effects:{'PHY.stamina':3,'PHY.strength':1,'PAC.sprintSpeed':1,'PAC.acceleration':1},consequence:'高原训练让你几近崩溃，每天在缺氧环境下跑步和训练。但回到平原后，你的体能有了质的飞跃，整场比赛都能保持高强度跑动。',formChange:1},
    {text:'欧洲拉练 — 学习战术理念',effects:{'PAS.vision':2,'PAS.shortPassing':2,'DRI.composure':2,'DRI.reactions':1},consequence:'在海外的两周让你大开眼界。欧洲球队的传球节奏和战术执行力让你深受启发，你的比赛阅读能力显著提升。',formChange:1,flag:'europe_stint'},
    {text:'留在基地自主训练',effects:{'DRI.ballControl':1,'SHO.finishing':1,'PHY.stamina':1,'DRI.composure':1},consequence:'你选择留在俱乐部基地自主训练。虽然没有特别的亮点，但各项能力都有小幅提升，也避免了旅途劳顿。',formChange:0}
  ]},
{ id:'t7',cat:'training',minAge:20,
  narrative:p=>`俱乐部引进了一位来自意大利的定位球教练。他的训练方法与众不同——不练射门，而是练"假装射门"的跑位和配合。\n\n"现代足球的定位球，不仅仅是把球踢进球门，"意大利教练用翻译说道，"而是通过精心设计的配合来创造机会。你们要学会思考。"\n\n训练中他给出了几个定位球战术选项让你选择执行：`,
  choices:[
    {text:'学习复杂的战术跑位配合',effects:{'PAS.vision':2,'SHO.positioning':2,'PAS.shortPassing':1,'DRI.reactions':1},consequence:'你认真学习了几套复杂的定位球战术。在接下来的比赛中，你利用这些跑位创造了多次得分机会。意大利教练对你的学习能力赞不绝口。',formChange:1},
    {text:'专注于直接射门技术',effects:{'PAS.freeKickAccuracy':2,'PAS.curve':2,'SHO.shotPower':1},consequence:'你更愿意把精力放在直接射门上。虽然战术配合学得一般，但你的任意球直接射门能力大幅提升。',formChange:1},
    {text:'学习传中战术 — 为队友做嫁衣',effects:{'PAS.crossing':3,'PAS.curve':1,'PAS.longPassing':1},consequence:'你选择学习传中战术，在定位球时为队友送出精准传中。你的助攻数在接下来的赛季明显增加。',formChange:1}
  ]},
{ id:'t8',cat:'training',minAge:16,
  narrative:p=>`训练基地来了一个特殊的访客——前国脚、曾经的"亚洲足球先生"候选人。他受邀来给青训球员做一次技术指导。\n\n他走到你面前，仔细观察了你的动作后说："你的触球方式有问题。每次接球时脚踝太紧，这会影响你下一步的动作连接。来，我教你一种放松脚踝的训练方法。"\n\n他示范了一个看起来简单但做起来很难的动作：`,
  choices:[
    {text:'认真请教 — 反复练习直到掌握',effects:{'DRI.ballControl':3,'DRI.dribbling':2,'DRI.agility':1},consequence:'你一遍遍练习前国脚教的动作，直到完全掌握。这种放松脚踝的技巧让你的触球质量大幅提升，停球和衔接动作更加流畅。前国脚满意地说："你小子有前途。"',formChange:2,flag:'mentor_technique'},
    {text:'简单学学 — 觉得自己方法也行',effects:{'DRI.ballControl':1,'DRI.dribbling':1},consequence:'你简单试了几下就觉得差不多了。虽然有所启发，但没有深入练习。前国脚看在眼里，微微摇了摇头。',formChange:0},
    {text:'不好意思请教 — 在一旁偷偷观察',effects:{'DRI.ballControl':1,'DRI.reactions':1,'PAS.vision':1},consequence:'你不好意思上前请教，在一旁仔细观察他的动作。虽然没有直接得到指导，但你的观察力让你也学到了一些东西。',formChange:0}
  ]},
{ id:'t10',cat:'training',minAge:21,
  narrative:p=>`俱乐部引进了一套AI动作分析系统。技术人员给你看了你的动作热力图——数据显示你在比赛中有很多无效跑动，体能消耗中有30%是浪费的。\n\n"如果你能优化跑动路线，同样的体能可以多跑15%的有效距离。"技术总监说。系统给出了三种优化方案，你选择先改进哪个方面：`,
  choices:[
    {text:'优化进攻跑位路线',effects:{'SHO.positioning':3,'PAS.vision':1,'PHY.stamina':1,'DRI.reactions':1},consequence:'你根据AI建议优化了进攻跑位路线。几场比赛后，你的有效跑动增加了15%，出现在危险区域的次数明显增多。进球和助攻数据也随之上涨。',formChange:1},
    {text:'优化防守回追路线',effects:{'DEF.defensiveAwareness':2,'DEF.interceptions':2,'PHY.stamina':1,'DRI.reactions':1},consequence:'你选择了优化防守回追路线。现在你在丢球后能更快地回到防守位置，拦截次数明显增加。你的攻防平衡性大幅提升。',formChange:1},
    {text:'优化体能分配策略',effects:{'PHY.stamina':3,'PAC.sprintSpeed':1,'PAC.acceleration':1,'DRI.composure':1},consequence:'你选择了优化体能分配。现在你在比赛中更加合理地分配体能，到了下半场依然能保持高强度跑动。第85分钟的你不再是软肋。',formChange:1}
  ]},
{ id:'t11',cat:'training',minAge:18,
  narrative:p=>`录像分析室里，教练组正在剪辑上周的比赛。屏幕上，你的一次丢球被放慢了四倍。\n\n"看这里，"分析师指着屏幕，"你的第一脚触球朝向了边线，而中路其实有空当。顶级球员会在接球前就把头转过来——也就是所谓的'扫描'。"\n\n他调出了${starLine(p.team)}的比赛录像做对比："同一位置的停球，人家接球前已经扫了三次。你打算怎么练？"\n\n三套方案摆在桌上：`,
  choices:[
    {text:'加练"接球前扫描" — 每次训练记录转头次数',effects:{'DRI.reactions':2,'PAS.vision':2,'DRI.composure':1},consequence:'你给自己定下规矩：每堂训练课接球前至少完成三次观察。一个月后，教练发现你拿球时的犹豫消失了，处理球的速度快了一拍。',formChange:1},
    {text:'专攻第一脚触球质量',effects:{'DRI.ballControl':3,'DRI.agility':1},consequence:'你用上百次重复打磨第一脚触球的角度和力度。现在皮球总能停在你想要的方向上，防守球员很难再预判你。',formChange:1},
    {text:'研究队内核心的一传一射录像',effects:{'PAS.vision':2,'PAS.longPassing':1,'SHO.positioning':1},consequence:'你把队内核心的比赛录像反复研究，模仿他的传球选择和跑动时机。录像课变成了你的"第二训练场"。',formChange:1}
  ]},
{ id:'t12',cat:'training',minAge:19,
  narrative:p=>`俱乐部康复中心引进了一批新设备：液氮冷疗舱、高压氧舱、反重力跑步机。队医向你介绍："现代球员的恢复和训练同样重要。每赛季的出勤率，一半靠练，一半靠恢复。"\n\n他给你制定了恢复套餐，但时间和精力有限，你需要选择优先级：`,
  choices:[
    {text:'液氮冷疗 — 每赛后必做',effects:{'PHY.stamina':2,'PHY.strength':1,'DRI.reactions':1},consequence:'零下140度的冷疗舱让你每次进去都要咬牙。但肌肉的疲劳感明显减轻了，一周双赛也能保持状态。',formChange:1,flag:'recovery_pro'},
    {text:'水中康复训练 — 温和但持续',effects:{'PHY.stamina':2,'DRI.agility':1,'DRI.balance':1},consequence:'你在泳池里完成了一整套康复性训练。低冲击的训练方式保护了你的膝盖和脚踝，伤病史大幅减少。',formChange:1},
    {text:'传统拉伸按摩就好',effects:{'PHY.stamina':1,'DRI.composure':1},consequence:'你婉拒了昂贵的新设备，坚持传统拉伸和按摩。恢复效果虽普通，但也够用，省下的精力都放在了场上。',formChange:0}
  ]},
// --- 比赛 ---
{ id:'m1',cat:'match',minAge:16,
  narrative:p=>{const y=isYouthStage(p);return `${y?'青年联赛':'联赛'}第8轮，${p.team}${y?'青年队':''}主场作战。比赛进行到第78分钟，比分1-1平。\n\n你的队友在中场断球后送出一记精准直塞，你反越位成功突入禁区！对方门将出击封堵角度，你面前只有一脚射门的机会——\n\n球迷的呐喊声在耳边轰鸣，你必须在瞬间做出决定：`},
  choices:[
    {text:'推射远角 — 冷静选择角度',effects:{'SHO.finishing':2,'DRI.composure':2,'SHO.positioning':1},consequence:'你瞄准球门右下角，用脚弓推射。皮球贴着草皮滚入网窝！门将鞭长莫及。你冲向角旗区庆祝，看台上传来雷鸣般的欢呼。',formChange:2,goals:1,risk:{attr:'SHO.finishing',base:.68},fail:{effects:{'DRI.composure':1},consequence:'你瞄准球门右下角推射，可惜触球瞬间脚踝稍紧，皮球贴着立柱滑出底线！门将起身拍了拍手套向你示意，看台上一片惋惜的叹息。机会溜走了——下一次，你必须更冷静。',formChange:-1}},
    {text:'大力抽射 — 用力量压倒门将',effects:{'SHO.shotPower':2,'SHO.finishing':1,'PHY.strength':1},consequence:'你抡起右脚全力抽射！皮球如炮弹般飞向球门，虽然角度不算刁钻，但力量太大，门将扑到了球却没能挡住。进球！',formChange:2,goals:1},
    {text:'过掉门将再射',effects:{'DRI.dribbling':2,'DRI.agility':1,'SHO.finishing':1},consequence:'你一个轻巧的变向晃过出击的门将，面对空门轻松推入。这粒进球展现了你超强的个人能力和冷静的头脑。',formChange:2,goals:1},
    {text:'横传给位置更好的队友',effects:{'PAS.vision':2,'PAS.shortPassing':2,'DRI.composure':1},consequence:'你看到队友在更好的位置，无私地横传。队友轻松推射空门得手！赛后教练称赞了你的团队意识和大局观。',formChange:1,assists:1}
  ]},
{ id:'m2',cat:'match',minAge:16,
  narrative:p=>`比赛第85分钟，你们0-1落后。裁判判给${p.team}一个点球！\n\n全场球迷屏住呼吸，队长把球递到你手中："${p.name}，你来罚。年轻人的第一次点球，别让我们失望。"\n\n你把球放在点球点上，退后几步。对方门将正在门线上跳来跳去，试图干扰你。裁判的哨声即将响起——`,
  choices:[
    {text:'大力射中路 — 不给门将反应时间',effects:{'SHO.penalties':2,'SHO.shotPower':1,'DRI.composure':2},consequence:'你选择大力抽射中路！皮球呼啸着飞入球网，门将已经向左侧扑去，完全判断错了方向。绝平！你振臂高呼，队友们疯狂扑向你。',formChange:2,goals:1,risk:{attr:'SHO.penalties',base:.62},fail:{effects:{'DRI.composure':1},consequence:'你大力抽射中路，可惜发力过猛，皮球高出横梁直上看台！全场发出难以置信的惊呼，门将甚至没来得及做出扑救动作。你低着头走回半场——点球，丢了。',formChange:-1}},
    {text:'冷静推射左下角',effects:{'SHO.penalties':2,'SHO.finishing':1,'DRI.composure':2},consequence:'你深呼一口气，用脚弓精准推射左下角。皮球擦着门柱内侧入网，门将虽然判断对了方向但无力回天。稳稳命中！',formChange:2,goals:1,risk:{attr:'SHO.penalties',base:.72},fail:{effects:{'SHO.penalties':1},consequence:'你推向左下角，方向判断对了，但脚法稍欠——皮球速度太慢，门将倒地将它扑了出去！补射的队友也没能抢到落点。点球失手，你把球衣蒙在了头上。',formChange:-1}},
    {text:'挑射中路 — 赌门将提前移动',effects:{'SHO.penalties':1,'DRI.composure':1,'SHO.finishing':1},consequence:'你选择大胆的挑射！门将果然提前移动扑向一侧，皮球轻巧地飘入球门中路。这粒进球让全场惊叹不已。',formChange:2,goals:1,risk:{attr:'SHO.penalties',base:.5},fail:{effects:{'DRI.composure':1},consequence:'你想赌门将提前移动，选择了一记轻巧的挑射——但门将根本没有动！他轻松把皮球抱进怀里，还冲你笑了笑。看台的嘘声一浪高过一浪。',formChange:-1}},
    {text:'让队长来罚 — 尊重老队员',effects:{'PAS.shortPassing':1,'DRI.composure':1},consequence:'你把球递给队长："您来吧，您更有经验。"队长拍了拍你的肩膀，稳稳将点球罚进。赛后他说这份信任让他很感动。',formChange:0}
  ]},
{ id:'m3',cat:'match',minAge:16,
  narrative:p=>{const r=rivalOf(p);return `${p.team}对阵${r?r.name:'死敌'}的德比大战，球场座无虚席。比赛进行到第60分钟，你们1-0领先。\n\n对方大举压上，后防线留出了大片空当。你的队友在中场拿球，抬头看到了你的跑位——一次完美的反击机会正在酝酿。\n\n对方后卫正在疯狂回追，你必须立刻做出决定：`},
  choices:[
    {text:'高速前插要球 — 用速度撕裂防线',effects:{'PAC.sprintSpeed':2,'PAC.acceleration':1,'SHO.positioning':1},consequence:'你像离弦之箭般冲向对方禁区，队友的直塞球恰到好处。你利用速度甩开后卫，面对门将冷静施射——球进了！德比战锁定胜局！',formChange:2,goals:1,risk:{attr:'PAC.sprintSpeed',base:.62},fail:{effects:{'PAC.sprintSpeed':1},consequence:'你像离弦之箭般冲向对方禁区，但队友的直塞力道稍大，皮球先一步滚出了底线。反击机会白白浪费，你双手抱头跪在草皮上，德比的僵局还在继续。',formChange:-1}},
    {text:'回撤接应 — 控制节奏消耗时间',effects:{'PAS.shortPassing':2,'PAS.vision':1,'DRI.ballControl':1},consequence:'你选择回撤接应，稳住球权。几次传递配合后，你成功消耗了对方急躁的情绪。最终球队守住了1-0的胜果。',formChange:1},
    {text:'拉边接球 — 拉开宽度再传中',effects:{'PAS.crossing':2,'PAS.longPassing':1,'PAC.acceleration':1},consequence:'你拉到边路接球，吸引了两名防守球员后送出精准传中。队友头球攻门稍稍偏出，但这次进攻的组织得到了教练的点头赞许。',formChange:1}
  ]},
{ id:'m5',cat:'match',minAge:16,
  narrative:p=>`训练赛结束后，主教练把你单独叫到了办公室。\n\n"上一场比赛你的跑位有问题，"他指着战术板上的几个标记点，"这几个位置你应该出现在前点而不是后点。你的无球跑动需要改进。"\n\n他递给你一份战术分析报告："回去好好研究，下次训练我要看到改变。另外，你平时是怎么练跑位的？`,
  choices:[
    {text:'认真研究录像 — 每天看2小时',effects:{'SHO.positioning':3,'PAS.vision':1,'DRI.reactions':1},consequence:'你把录像反复看了几十遍，一帧帧分析自己的跑位问题。下次训练课上，你的无球跑动判若两人，教练满意地点了点头。',formChange:1},
    {text:'请教队内老将 — 学习经验',effects:{'SHO.positioning':2,'DRI.composure':1,'PAS.vision':1},consequence:'你找到队内经验丰富的老队员请教。他耐心地给你讲解了跑位的诀窍和阅读比赛的方法，让你受益匪浅。',formChange:1},
    {text:'在训练中多加练习跑位',effects:{'SHO.positioning':2,'PHY.stamina':-1},consequence:'你在训练中反复练习跑位，虽然进步比看录像慢一些，但实战中的感觉更加真切。',formChange:0}
  ]},
{ id:'m7',cat:'match',minAge:21,
  narrative:p=>`联赛争冠关键战，${p.team}主场迎战联赛领头羊。全场球迷制造着震耳欲聋的氛围。\n\n比赛第75分钟，比分0-0。你拿球时看到对方后防线压得很靠上，身后留下了巨大空当。你的队友正在前插，但你也可以选择自己带球突破。\n\n这是一场可能决定联赛冠军归属的比赛：`,
  choices:[
    {text:'一脚直塞穿透防线',effects:{'PAS.vision':3,'PAS.shortPassing':2,'DRI.composure':2},consequence:'你的直塞球如手术刀般切开了对方防线，队友单刀赴会冷静推射——球进了！全场沸腾！你张开双臂享受球迷的欢呼。',formChange:2,assists:1},
    {text:'自己带球长途奔袭',effects:{'DRI.dribbling':3,'PAC.acceleration':2,'DRI.composure':2,'PHY.stamina':-1},consequence:'你决定自己来！带球从中场一路狂奔，连续变向晃过两名防守球员，面对门将冷静施射——球进了！这是一粒足以载入赛季最佳的进球！',formChange:3,goals:1,risk:{attr:'DRI.dribbling',base:.55},fail:{effects:{'DRI.dribbling':1},consequence:'你决定自己来！但连续的变向消耗了太多时间，第三名防守球员赶在射门瞬间把球铲出边线。看台上一片懊恼的叹息，教练在场边摊开了双手。',formChange:-1}},
    {text:'稳妥回传 — 控制比赛节奏',effects:{'PAS.shortPassing':1,'DRI.composure':1,'DEF.defensiveAwareness':1},consequence:'你选择稳妥回传，保持控球。虽然球迷有些着急，但最终比赛以0-0结束。一分也是一分，争冠形势依然复杂。',formChange:0}
  ]},
{ id:'m8',cat:'match',minAge:23,
  narrative:p=>`德比大战，全场气氛剑拔弩张。比赛进行到第80分钟，你们1-2落后。\n\n在一次拼抢中，对方后卫对你犯规后将你拉起来时说了一句挑衅的话："就你这水平也配踢首发？趁早回青训去吧。"\n\n你的血往头顶涌。裁判就在不远处，但没听清对方说了什么。你的拳头不自觉地握紧了——`,
  choices:[
    {text:'用进球回应 — 化愤怒为动力',effects:{'SHO.finishing':2,'DRI.composure':3,'SHO.positioning':1,'PHY.aggression':1},consequence:'你深吸一口气，将怒火压在心底。第88分钟，你在禁区内抢点破门！进球后你跑向那个后卫，指了指记分牌。这才是最好的回应。',formChange:2,goals:1,risk:{attr:'SHO.finishing',base:.6},fail:{effects:{'DRI.composure':1},consequence:'你深吸一口气想用进球回应，但愤怒让动作变了形——射门软绵无力，被门将轻松没收。对方后卫凑过来嘲讽：就这？你攥紧了拳头，却无可奈何。',formChange:-1}},
    {text:'推搡对方 — 被出示黄牌',effects:{'PHY.aggression':2,'DRI.composure':-1},consequence:'你没忍住推了对方一把。裁判向你出示了黄牌，对方反而得意地笑了。赛后教练批评了你："被挑衅就上钩，太不成熟了。"',formChange:-1},
    {text:'无视挑衅 — 专注比赛',effects:{'DRI.composure':3,'PAS.vision':1,'DRI.reactions':1},consequence:'你面无表情地转身离开。对方见你不接招，反而有些讪讪。虽然比赛输了，但你的冷静赢得了所有人的尊重。',formChange:1}
  ]},
{ id:'m13',cat:'match',minAge:16,condition:p=>!p.isGK,
  narrative:p=>`联赛中，你遭遇了本赛季最凶悍的对手——对方的中后卫身材魁梧，对抗能力极强。比赛开始后，他几乎每次身体接触都把你撞得东倒西歪。\n\n上半场你被他撞倒了5次，甚至有一次差点受伤。中场休息时，你坐在更衣室里，肩膀还在隐隐作痛。\n\n下半场你该如何应对这个"绞肉机"式的后卫？`,
  choices:[
    {text:'改变踢法 — 用灵活性避开对抗',effects:{'DRI.agility':2,'DRI.balance':2,'DRI.dribbling':1,'DRI.composure':1},consequence:'下半场你改变了策略，利用灵活的跑位和快速的触球避开和他硬碰硬。他抓不住你，反而因为急躁吃到了黄牌。你用智慧战胜了力量。',formChange:2},
    {text:'硬碰硬 — 在对抗中成长',effects:{'PHY.strength':2,'PHY.aggression':2,'DRI.balance':1,'DRI.composure':1},consequence:'你决定和他硬碰硬！虽然依然吃亏，但你不退缩的态度感染了全队。几次对抗后你逐渐适应了他的强度，甚至在一次拼抢中把他撞倒了。',formChange:1},
    {text:'寻求队友配合 — 不和他单挑',effects:{'PAS.shortPassing':2,'PAS.vision':2,'DRI.reactions':1},consequence:'你选择多和队友做配合，不和他正面交锋。通过快速的传递和跑位，你成功绕开了他的防守区域，在别处制造了威胁。',formChange:1}
  ]},
{ id:'m18',cat:'match',minAge:16,
  narrative:p=>`暴雨如注，${clubCity(p.team)?clubCity(p.team):'主场'}的球场积水已经没过了草皮纹理。这是典型的雨战，皮球在积水中会突然减速或跳起，技术动作大打折扣。\n\n比赛第30分钟，你们0-0僵持。你带球进入对方半场，积水让每一次触球都变得不可预测。看台上的球迷撑着雨伞声嘶力竭：`,
  choices:[
    {text:'少盘带多传递 — 用地面短传打穿',effects:{'PAS.shortPassing':2,'DRI.reactions':2,'PAS.vision':1},consequence:'你果断放弃了个人表演，用一脚脚简洁的地平传球组织进攻。雨战中你们的传控反而打出了威胁，最终凭借一次禁区内混战取胜。',formChange:1},
    {text:'加强远射 — 湿滑球速更快',effects:{'SHO.longShots':2,'SHO.shotPower':2},consequence:'你意识到湿滑的皮球在射门时会加速下沉，果断在禁区外连续起脚。第三次远射，门将脱手，你跟进补射入网！雨战英雄！',formChange:2,goals:1},
    {text:'稳守反击 — 不给对手机会',effects:{'DEF.defensiveAwareness':2,'DRI.composure':2},consequence:'你回撤帮助球队控制局面，用纪律性熬过了恶劣的条件。0-0虽然平淡，但一分拿得踏实。教练赛后表扬了你的战术执行力。',formChange:0}
  ]},
{ id:'m19',cat:'match',minAge:17,
  narrative:p=>`面对保级队的铁桶阵，${p.team}控球率高达75%，但比分依然是0-0。对方十一人全部退守禁区，连前锋都回撤到本方半场。\n\n比赛进行到第80分钟，球迷开始焦躁。你在禁区前沿再次拿球，对方的三层防线纹丝不动。这是比拼耐心的时刻：`,
  choices:[
    {text:'突然远射 — 打对方立足未稳',effects:{'SHO.longShots':3,'SHO.shotPower':1,'DRI.composure':1},consequence:'你假装组织，突然起脚远射！皮球穿过人墙缝隙直挂死角！1-0！铁桶阵被一把钥匙打开，全场瞬间沸腾。',formChange:2,goals:1,risk:{attr:'SHO.longShots',base:.5},fail:{effects:{'SHO.longShots':1},consequence:'你假装组织，突然起脚远射！可惜人墙的缝隙比想象中小，皮球结结实实砸在人墙身上弹出，对方趁势打出反击，你的心一下子提到了嗓子眼。',formChange:-1}},
    {text:'肋部直塞 — 用速度打身后',effects:{'PAS.vision':3,'PAS.shortPassing':2},consequence:'你用一记贴地直塞穿透了肋部空当，边锋插上横传，中锋推射破门！1-0！耐心最终换来了回报。',formChange:1,assists:1},
    {text:'尝试个人突破 — 吸引犯规造点',effects:{'DRI.dribbling':3,'DRI.agility':2},consequence:'你在禁区里连续变向，对方后卫伸腿绊倒了你——点球！队友主罚命中，1-0！你用勇敢的突破为球队赢下了关键三分。',formChange:1}
  ]},
{ id:'m20',cat:'match',minAge:20,
  narrative:p=>`第75分钟，${p.team}已经3-0领先，比赛失去悬念。教练席传来指令：把你换下保存体力。\n\n你走向边线，全场球迷起立鼓掌。可就在这时，队友在中场断球，一次绝佳的反击机会出现了——球正好传向你的方向。换人的牌子已经举起，你还有最后几秒钟：`,
  choices:[
    {text:'完成这次进攻再下场',effects:{'DRI.composure':2,'SHO.positioning':1,'PAS.vision':1},consequence:'你快速处理球，送出一脚妙传帮助队友再入一球！4-0！你才走下场，全场都在喊你的名字。教练哭笑不得："算你机灵。"',formChange:1,assists:1},
    {text:'直接下场 — 遵守战术安排',effects:{'DRI.composure':2,'PHY.stamina':1},consequence:'你和替补你的年轻人击掌，径直走下了场。体能教练在通道口竖起大拇指："这才是职业球员。"赛季漫长，你深知留力的智慧。',formChange:0},
    {text:'把机会让给替补上场的年轻人',effects:{'PAS.vision':2,'DRI.composure':1},consequence:'你放慢脚步，用眼神示意年轻队友去追那个球。他心领神会，完成了一次精彩进攻。赛后他特意感谢你，更衣室的氛围又好了几分。',formChange:0}
  ]},
// --- 社交 ---
{ id:'s1',cat:'social',minAge:16,
  narrative:p=>`训练结束后，你注意到更衣室的气氛有些微妙。\n\n队内的核心球员${starLine(p.team)}和另一位主力因为训练中的一次碰撞发生了口角，两人互不相让，更衣室的空气几乎凝固。\n\n其他队友都低着头装作没看见。作为队内最年轻的球员，你夹在中间不知如何是好。这时${starLine(p.team)}突然转向你："${p.name}，你来说说，刚才那球到底谁的错？"`,
  choices:[
    {text:'帮核心球员说话 — 维护老队员的地位',effects:{'DRI.composure':1,'PHY.aggression':1},consequence:'你委婉地站在了核心球员这边。虽然另一位主力脸色不太好看，但他事后对你另眼相看，在场上开始多给你传球。',formChange:0,flag:'align_senior'},
    {text:'保持中立 — "两位哥都别气了"',effects:{'PAS.vision':1,'DRI.composure':2},consequence:'你两边都不得罪，劝两人和气生财。虽然谁也没讨好，但也没有树敌。更衣室的气氛逐渐缓和了下来。',formChange:0},
    {text:'说出自己的真实看法',effects:{'DRI.composure':1,'PAS.vision':1},consequence:'你鼓起勇气说出了自己的判断。核心球员愣了一下，但随后拍了拍你的肩膀："小子有胆量。"对方虽然不高兴，但也尊重了你的坦诚。',formChange:1,flag:'honest'},
    {text:'低头不语 — 装作没听见',effects:{'DRI.composure':-1},consequence:'你低下头假装系鞋带，避免了卷入纷争。但你也感觉到，在队内的存在感又低了几分。',formChange:-1}
  ]},
{ id:'s2',cat:'social',minAge:16,
  narrative:p=>`周末，球队没有训练。几个队友约你一起聚餐。\n\n"来不来？${p.name}，就当团建了！"边路的队友热情地拍了拍你的背。你知道队内几位大哥都会去，但你也清楚——下周就是关键的联赛，营养师专门叮嘱过饮食要求。\n\n手机上，营养师发来消息："本周末严格控饮食，下周一我要检查你的体脂率。"`,
  choices:[
    {text:'去聚餐但只吃健康食物',effects:{'PAS.vision':1,'DRI.composure':2,'PHY.stamina':1},consequence:'你参加了聚餐但严格控制饮食，只吃了些蔬菜和瘦肉。队友们笑话你"养生少年"，但你感觉身体状态很好。',formChange:1},
    {text:'痛快地吃一顿 — 团建更重要',effects:{'PHY.stamina':-1,'PHY.strength':1,'DRI.composure':1},consequence:'你决定放开吃一顿。聚餐的气氛确实棒，和队友们的关系也更近了。不过周一的体脂检测确实高了一点点，营养师瞪了你一眼。',formChange:0},
    {text:'婉拒聚餐 — 专注饮食管理',effects:{'PHY.stamina':1,'DRI.ballControl':1},consequence:'你婉拒了聚餐邀请，在家按营养师的要求准备了餐食。虽然队友们有些失望，但你的身体状态保持得非常好。',formChange:0}
  ]},
{ id:'s4',cat:'social',minAge:16,
  narrative:p=>`深夜，你躺在床上辗转反侧。手机屏幕的光映在脸上——你刷到了一条关于自己的新闻：\n\n"${p.team}小将${p.name}表现亮眼，引发多支球队关注"\n\n评论区里有人夸你有天赋，也有人质疑你只是昙花一现。你的队友们可能也看到了这条新闻。明天训练时，你该如何面对？`,
  choices:[
    {text:'保持低调 — 用训练说话',effects:{'DRI.ballControl':1,'DRI.composure':2,'PHY.stamina':1},consequence:'你对新闻不予理会，训练中比以往更加卖力。队友们看到你的态度，纷纷竖起大拇指。低调做人，高调做事。',formChange:1},
    {text:'在社交媒体上感谢球迷',effects:{'PAS.vision':1,'DRI.composure':1},consequence:'你在社交平台上发了一条感谢球迷的动态。粉丝数涨了不少，但教练也提醒你别分心于场外的事。',formChange:0},
    {text:'有些飘了 — 训练中表现散漫',effects:{'DRI.composure':-1,'DRI.ballControl':-1},consequence:'你确实有些被捧飘了，训练中走神了好几次。教练当着全队的面批评了你："才几场好球就翘尾巴了？"你羞愧地低下了头。',formChange:-2}
  ]},
{ id:'s6',cat:'social',minAge:22,
  narrative:p=>`一位年轻的新援加入了球队——18岁的巴西小将。他天赋极高，但显然不太适应这里的生活和文化。\n\n训练中他经常独自一人，午餐时也是坐在角落看手机。你注意到他的情绪似乎很低落。主教练私下找到你："${p.name}，你是队内重要球员，帮我去关心一下这孩子。他离家万里，我怕他在这里撑不下去。"\n\n你找到了坐在更衣室角落的巴西小将：`,
  choices:[
    {text:'主动关心 — 帮他融入球队',effects:{'PAS.vision':2,'DRI.composure':2,'PAS.shortPassing':1},consequence:'你主动带他融入球队，请他吃饭、逛城市。几周后他变得开朗了许多，训练中的配合也越来越默契。你们成了好朋友。',formChange:2,flag:'bond_newgen'},
    {text:'在训练中多给他传球',effects:{'PAS.shortPassing':2,'PAS.vision':1,'DRI.reactions':1},consequence:'你没有说什么大道理，而是在训练和比赛中多给他传球，用行动让他感受到信任。他的表现越来越好，赛后特意找到你说了声"谢谢"。',formChange:1},
    {text:'交给教练处理 — 不是我的事',effects:{'DRI.composure':1},consequence:'你觉得这不是你的责任，交给了教练处理。新援的状态持续低迷，半个赛季后就被租借走了。有时候你想，如果当时主动一些，也许结果会不同。',formChange:0}
  ]},
{ id:'s8',cat:'social',minAge:18,
  narrative:p=>`你搬进了自己的第一套公寓。独立生活让你兴奋不已，但也面临新的挑战。\n\n今天训练结束后，你发现自己已经连续三天吃外卖了。冰箱空空如也，训练服也没洗。你意识到，职业球员的生活不仅仅是训练场上的事，生活中的自律同样重要。\n\n手机上弹出两条消息：一条是营养师推荐的私人厨师服务，一条是队友推荐的家政阿姨。你的预算有限：`,
  choices:[
    {text:'请营养师推荐的私人厨师',effects:{'PHY.stamina':2,'DRI.composure':1,'PHY.strength':1},consequence:'你咬牙请了私人厨师。虽然费用不低，但你的饮食质量大幅提升，身体状态明显变好。训练中的表现也随之提升。',formChange:1,flag:'pro_lifestyle'},
    {text:'自己学做饭 — 培养生活技能',effects:{'DRI.composure':2,'PHY.stamina':1,'DRI.reactions':1},consequence:'你决定自己学做饭。虽然一开始手忙脚乱，但逐渐也能做出像样的健康餐了。这种自律也体现在了训练场上。',formChange:1},
    {text:'继续外卖 — 方便省事',effects:{'PHY.stamina':-1,'DRI.composure':-1},consequence:'你继续吃外卖。虽然省事，但油腻的饮食让你的体脂率悄悄上升了。体能教练在下次检测时皱起了眉头。',formChange:-1}
  ]},
{ id:'s11',cat:'social',minAge:17,
  narrative:p=>`客场比赛，对手的城市距离${p.region}不远。赛前踩场时，看台上出现了一小片熟悉的横幅——是${p.region}老乡组织的助威团。\n\n"你是${p.region}出来的孩子！"领头的球迷大叔激动地喊道，"我们每场客场都跟，就为了看你踢球！"\n\n寒暄之后，大叔塞给你一面小旗："明天上场，替${p.region}争口气！"`,
  choices:[
    {text:'郑重收下旗帜 — 承诺为他们拼一场',effects:{'DRI.composure':2,'PHY.aggression':2,'SHO.positioning':1},consequence:'第二天你把这面旗子塞进了球袜里。整场比赛你像上了发条一样奔跑，一次不惜体的回追赢得了全场掌声。赛后你把球衣送给了那位大叔。',formChange:2},
    {text:'合影留念 — 邀请他们赛后聚餐',effects:{'DRI.composure':1,'PAS.vision':1},consequence:'你和大伙合影，比赛结束后还请他们吃了顿便饭。老乡球迷团越来越壮大，你走到哪里都有主场的感觉。',formChange:1},
    {text:'礼貌道谢 — 保持职业距离',effects:{'DRI.composure':2},consequence:'你微笑着感谢了他们的支持，随后专注到了比赛准备上。老球迷们看出了你的职业态度，纷纷点赞："这孩子，靠谱。"',formChange:0}
  ]},
{ id:'s12',cat:'social',minAge:18,
  narrative:p=>`一场平局后，你的社交账号私信炸了。\n\n原因是你第70分钟的一次"独"——明明有空当却选择了自己浪射，皮球偏出立柱。球迷分成两派在评论区激烈争吵，有人给你起了一个带讽刺意味的外号，正在全网发酵。\n\n热搜词条挂了两个小时。经纪人建议你回应一下，队里的老将则劝你别看手机：`,
  choices:[
    {text:'发一条诚恳的动态回应',effects:{'DRI.composure':2,'PAS.vision':1},consequence:'你写道："那脚选择确实不好，批评收下了，下次争取更合理。"—真诚的态度让大部分球迷消了气，点赞最高的一条评论是："敢认错，是成大事的苗子。"',formChange:1},
    {text:'不回应 — 用训练场表现说话',effects:{'DRI.composure':3,'PHY.stamina':1},consequence:'你卸载了社交软件两周，把所有情绪都倾泻在训练场上。两周后你用进球让所有争议烟消云散——外号也自动变成了褒义。',formChange:1},
    {text:'和球迷对线',effects:{'DRI.composure':-2,'DRI.ballControl':-1},consequence:'你在评论区逐条反驳，越辩越气。截图被搬运到各平台，"情商"成了新一轮热搜。教练找你谈了话："网络赢了，球场输了，值吗？"',formChange:-2}
  ]},
{ id:'s13',cat:'social',minAge:20,
  narrative:p=>`冬窗，俱乐部引进了一名和 你同位置的新外援。转会费不菲，俱乐部显然期待他直接顶替某个人的位置——而那个人很可能就是你。\n\n训练中，你们被安排在同一个小组。他技术细腻，跑位聪明，第一次合练就完成了一次漂亮的助攻。教练在场边频频点头。\n\n课后他主动伸出手："多多关照，我是来跟你学习的。"这句话听着客气，也听着挑衅：`,
  choices:[
    {text:'坦然接受竞争 — "练起来，看谁状态好"',effects:{'SHO.finishing':1,'DRI.composure':2,'PHY.stamina':2},consequence:'你把威胁变成了动力，训练强度拉满。一个月后，你用连续三场进球稳定了位置，外援成了你最好的替补和陪练。教练说这是他见过最良性的竞争。',formChange:2},
    {text:'主动带他适应 — 惺惺相惜',effects:{'PAS.shortPassing':2,'PAS.vision':1,'DRI.composure':1},consequence:'你带着他熟悉城市、战术和队友，两人很快成了朋友。场上你们的配合渐入佳境，双剑合璧让球队火力翻倍。',formChange:1,flag:'bond_rival'},
    {text:'压力山大 — 训练中动作变形',effects:{'DRI.composure':-1,'SHO.finishing':-1},consequence:'你开始失眠，训练中患得患失，几次简单的处理球都出了差错。老队长看出了你的心思："竞争是常态，怕输的人才真的会输。"',formChange:-1}
  ]},
// --- 媒体 ---
{ id:'c1',cat:'media',minAge:16,
  narrative:p=>`一场精彩的比赛后，你被带到混合采访区。记者的话筒几乎怼到了你脸上。\n\n"${p.name}，今天的表现非常出色！有人说你是中国足球未来的希望，你怎么看？"\n\n闪光灯不停闪烁，你看到几个熟悉的体育媒体记者正期待地看着你。你的回答会被全网传播：`,
  choices:[
    {text:'谦虚低调 — "感谢团队，我还有很多不足"',effects:{'DRI.composure':2,'PAS.vision':1},consequence:'你的回答得体而谦虚，赢得了媒体和球迷的好感。"不仅球踢得好，情商也高"成了热搜话题。',formChange:1},
    {text:'展现自信 — "我会成为最好的球员"',effects:{'PHY.aggression':1,'DRI.composure':1},consequence:'你的豪言壮语引发了争议。有人欣赏你的自信，也有人觉得你太狂妄。不过你的气势确实让更多人记住了你的名字。',formChange:0},
    {text:'回避采访 — 快速离开',effects:{'DRI.composure':1},consequence:'你简单说了句"谢谢"就快步离开了采访区。虽然避免了说错话的风险，但媒体对你有些不满，报道中称你"不善言辞"。',formChange:-1}
  ]},
{ id:'c2',cat:'media',minAge:17,
  narrative:p=>`你的经纪人打来电话，兴奋地说有一个运动品牌的赞助商想和你签约。\n\n"是国产品牌的子品牌，他们看中了你的潜力和形象。合同金额不算太大，每年30万，但这是个好的开始。不过——"经纪人顿了顿，"他们要求你在社交媒体上定期发布内容，可能会分散一些精力。"\n\n你思考着这个提议：`,
  choices:[
    {text:'签约 — 开始建立商业价值',effects:{'DRI.composure':1,'PAS.vision':1},consequence:'你签下了人生第一份商业合同。虽然金额不多，但这是你商业价值的起点。拍摄广告的过程也让你学会了如何在镜头前表现自己。',formChange:0,flag:'sponsor'},
    {text:'婉拒 — 专注足球本身',effects:{'DRI.ballControl':1,'PHY.stamina':1},consequence:'你决定暂时不接商业活动，把全部精力放在足球上。经纪人说你"太老实"，但你知道现在最重要的是提升球技。',formChange:1}
  ]},
{ id:'c4',cat:'media',minAge:16,
  narrative:p=>`深夜，你刷着手机，一条推送弹了出来：一位和你同龄的球员在社交平台上晒出了豪车和名表，配文"努力就是为了享受生活"。\n\n你的手机里也躺着一份来自夜店的VIP邀请函。你知道，作为一名开始小有名气的年轻球员，外面的诱惑越来越多。\n\n明天还有训练，但夜店的邀请确实诱人……`,
  choices:[
    {text:'拒绝诱惑 — 早早休息备战训练',effects:{'PHY.stamina':1,'DRI.composure':2,'DRI.reactions':1},consequence:'你把手机丢到一边，强迫自己入睡。第二天的训练课上你精力充沛，状态火热。自律，是你区别于普通球员的关键。',formChange:1},
    {text:'去夜店但只待一小会儿',effects:{'PHY.stamina':-1,'DRI.composure':1},consequence:'你去夜店待了两个小时就回来了。虽然没做什么出格的事，但第二天训练时确实有些精神不济。教练看了你一眼，没说什么。',formChange:-1},
    {text:'通宵狂欢 — 享受年轻人生',effects:{'PHY.stamina':-2,'DRI.composure':-1,'DRI.ballControl':-1},consequence:'你玩到凌晨才回来，第二天的训练简直是一场灾难。教练当众罚你跑圈，并在更衣室警告全队："谁再这样，直接下放梯队！"',formChange:-2}
  ]},
{ id:'c5',cat:'media',minAge:19,condition:p=>isChinaLeague(p),
  narrative:p=>`赛季开始前，中国足协公布了新一轮职业联赛治理方案：国内球员顶薪调整为税前300万人民币/年，俱乐部须在冬窗前完成球员合同整改。\n\n更衣室里议论纷纷。有老将摇头叹气："以前签的大合同说改就改……"也有年轻球员表示理解："联赛干净了，机会才会越来越多。"\n\n你的合同也在整改范围内，队友们都在看你的态度：`,
  choices:[
    {text:'理解并接受 — 把注意力放在球场上',effects:{'DRI.composure':2,'PHY.stamina':1},consequence:'你表态支持新政："球员的价值在场上，不在合同里。"俱乐部管理层对你刮目相看，更衣室里的年轻队友也以你为榜样。',formChange:1,flag:'policy_support'},
    {text:'私下发几句牢骚',effects:{'DRI.composure':-1,'PAS.vision':1},consequence:'你在小群里抱怨了几句，被队友转述到了教练耳朵里。教练没有公开批评你，但提醒你："别让场外的事影响场上表现。"',formChange:-1},
    {text:'专注提升自己 — 用表现争取更大平台',effects:{'SHO.finishing':1,'SHO.positioning':1,'DRI.composure':1},consequence:'你想得很清楚：顶薪是固定的，但平台可以更高。把数据打出来，未来无论是留洋还是商业代言，都靠自己争取。',formChange:1}
  ]},
{ id:'c9',cat:'media',minAge:22,
  narrative:p=>`一位知名体育记者联系了你，说有一个深度专访的机会。这家媒体的影响力很大，专访能让你的知名度大幅提升。\n\n但记者提前透露了一些问题方向——其中涉及你对${LEAGUES[p.league]?LEAGUES[p.league].name:''}现状的看法、对联赛管理政策的评价，以及你是否有出国踢球的打算。这些都是敏感话题，回答不当可能引发争议。`,
  choices:[
    {text:'接受专访 — 坦诚回答所有问题',effects:{'DRI.composure':2,'PAS.vision':1,'DRI.reactions':1},consequence:'你坦诚地回答了所有问题。专访发布后引发了巨大讨论，有人赞赏你的勇气，也有人批评你"不懂规矩"。但你的知名度确实大幅提升了。',formChange:1,flag:'controversial_interview'},
    {text:'接受专访 — 但回避敏感问题',effects:{'DRI.composure':1,'PAS.vision':1},consequence:'你接受了采访但巧妙地回避了敏感问题。专访效果平平，没有引发什么波澜。',formChange:0},
    {text:'婉拒专访',effects:{'DRI.ballControl':1,'PHY.stamina':1},consequence:'你婉拒了专访，选择保持低调。虽然少了一次曝光机会，但也避免了潜在的争议。',formChange:0}
  ]},
{ id:'c11',cat:'media',minAge:17,
  narrative:p=>`周末的比赛日，央视直播席上坐着大名鼎鼎的解说${MEDIA_PEOPLE.commentator[0]}。下半场你打入一记精彩的世界波，他的激情解说瞬间刷屏全网。\n\n"这脚射门，这就是中国足球需要的天赋啊！这孩子有前途！"\n\n赛后，#詹俊说看到了中国足球的未来# 冲上了热搜。节目组向你发来邀请——希望你去参加一档足球访谈节目：`,
  choices:[
    {text:'接受邀请 — 让更多孩子认识你',effects:{'DRI.composure':2,'PAS.vision':1},consequence:'访谈节目播出后反响热烈。你讲起了小时候踢球的经历，让无数小球员看到了一条真实可行的路。你的名字开始被全国球迷记住。',formChange:1,flag:'tv_show'},
    {text:'婉拒 — 赛季期间不想分心',effects:{'DRI.ballControl':1,'PHY.stamina':1},consequence:'你礼貌地婉拒了节目邀请："等赛季结束，我请您喝咖啡。"节目组欣赏你的分寸感，约定休赛期再合作。',formChange:0},
    {text:'先请教队内前辈再决定',effects:{'DRI.composure':2,'DRI.reactions':1},consequence:'老队长告诉你："曝光是把双刃剑，量力而行。"你最终选择赛季结束后再上节目。这份稳重让俱乐部很欣赏。',formChange:0}
  ]},
{ id:'c12',cat:'media',minAge:16,
  narrative:p=>`一档热门足球综艺节目里，"范大将军"${MENTORS[0]}被问到了现役年轻球员。\n\n他谈到了你："这个孩子我看过几场，身体、意识在同龄人里是冒尖的。但我丑话说前头——中国球员最缺的是自律！有了天赋不珍惜，我第一个骂他！"\n\n这段视频被疯狂转发，连带着你名字的搜索量翻了十倍。队友们起哄："范大将军点名了，有压力了吧？"`,
  choices:[
    {text:'公开回应 — "请范指导放心，我不给您丢人"',effects:{'PHY.aggression':2,'DRI.composure':2},consequence:p=>`你的回应上了热搜，${MENTORS[0]}回复了一个点赞的表情。这位"嘴最硬的球迷"成了你意外的精神监督者——你可不敢松懈了。`,formChange:1},
    {text:'默默收藏视频 — 当成座右铭',effects:{'PHY.stamina':2,'DRI.composure':1},consequence:'你把这段话设成了手机屏保。每次训练想偷懒时，仿佛都能听到那句"我第一个骂他"。自律属性+1，你的职业态度在教练组出了名。',formChange:1},
    {text:'置之不理 — 走自己的路',effects:{'DRI.composure':1,'DRI.ballControl':1},consequence:'你看完一笑置之。流量是别人的，球是自己的。这种超然的心态让你的训练质量丝毫不受外界影响。',formChange:0}
  ]},
{ id:'c13',cat:'media',minAge:20,
  narrative:p=>`《体坛周报》资深记者${MEDIA_PEOPLE.journalist[0]}约你做深度专访。他是中国足球报道的活化石，从甲A写到中超，见证过最黄金也最灰暗的年代。\n\n专访的问题很犀利："从你这一代往前数，为什么中国总出不了世界级球员？青训、联赛、留洋——你觉得问题出在哪个环节？"\n\n采访结束时他合上笔记本："说实话，我采访过的球员里，能把这个问题讲透的不超过三个。"\n\n这篇报道的基调取决于你的回答：`,
  choices:[
    {text:'尖锐直言 — 指出青训和联赛的真问题',effects:{'DRI.composure':2,'PAS.vision':2},consequence:p=>`报道标题是《${p.name}：我不想只做下一个谁》。文章对青训体系的剖析引发行业震动，多位足协人士转发。你被贴上了"有头脑的球员"标签。`,formChange:1,flag:'deep_interview'},
    {text:'谈自己 — "我解决不了系统问题，我只能练好自己"',effects:{'DRI.ballControl':2,'PHY.stamina':1},consequence:'报道充满了你从小到大的训练细节，朴实而动人。无数家长把文章转给了自己的孩子："看看人家是怎么练的。"',formChange:1},
    {text:'圆滑带过 — 不评价行业',effects:{'DRI.composure':2},consequence:'你巧妙地把话题引向了比赛本身。报道如期发出，不温不火。至少，你不担心任何争议。',formChange:0}
  ]},
// --- 特殊 ---
{ id:'x1',cat:'special',minAge:16,
  narrative:p=>`今天的训练赛中，你感到膝盖有些不适。一开始只是轻微的酸痛，但在一次冲刺后，一阵刺痛让你不由自主地倒在了地上。\n\n队医跑过来检查后皱起了眉头："可能是韧带轻微拉伤，需要做进一步检查。最好休息两周，但如果强行训练可能加重伤情。"\n\n下周就是一场重要的比赛，你很想上场：`,
  choices:[
    {text:'听从队医建议 — 休养两周',effects:{'PHY.stamina':1,'DRI.composure':1},consequence:'你乖乖休息了两周。虽然错过了比赛，但伤势完全恢复了。队医夸你是"最听话的球员"。',formChange:-1,flag:'injured_skip'},
    {text:'打封闭针坚持上场',effects:{'SHO.finishing':1,'PHY.aggression':1,'PHY.stamina':-2,'DRI.composure':1},consequence:'你打了封闭针咬牙上场。虽然比赛表现出色，但赛后膝盖肿得像个馒头。队医警告你："再这样会留下病根的！"',formChange:1,flag:'injured_play'},
    {text:'轻伤不下火线 — 只做轻度训练',effects:{'DRI.ballControl':1,'PAS.shortPassing':1,'PHY.stamina':-1},consequence:'你选择了折中方案——不做高强度训练但保持轻度活动。伤势恢复得还行，也没有完全脱离球队节奏。',formChange:0}
  ]},
{ id:'x2',cat:'special',minAge:17,
  narrative:p=>`最近几场比赛，你的状态陷入了低谷。射门总是差之毫厘，传球频频失误，连最简单的停球都会弹远。\n\n主教练在赛后把你叫到办公室："${p.name}，我看得出来你最近不在状态。是心理问题还是身体问题？你知道，连续的低迷会影响你在球队的位置。"\n\n你低下头，其实你自己也不知道问题出在哪里：`,
  choices:[
    {text:'主动找心理教练沟通',effects:{'DRI.composure':3,'DRI.reactions':1,'PAS.vision':1},consequence:'你和俱乐部的心理教练进行了深入交流。原来是因为最近的外界压力让你过于焦虑。调整心态后，你在下一场比赛就找回了状态。',formChange:2},
    {text:'加倍训练 — 用努力克服低谷',effects:{'DRI.ballControl':2,'SHO.finishing':1,'PHY.stamina':-1},consequence:'你选择用加练来找回状态。虽然身体更加疲惫，但大量的重复训练确实让你的肌肉记忆回来了。',formChange:1},
    {text:'请求休息一场 — 调整状态',effects:{'PHY.stamina':1,'DRI.composure':1},consequence:'你向教练申请休息一场。在看台上观看比赛让你有了新的视角，下一场复出时你的表现判若两人。',formChange:0},
    {text:'硬扛 — 状态总会回来的',effects:{'DRI.composure':-1,'DRI.ballControl':-1},consequence:'你选择硬扛过去，但低迷的状态又持续了几场。教练的耐心正在耗尽，你感到越来越焦虑。',formChange:-2}
  ]},
{ id:'x3',cat:'special',minAge:17,condition:p=>p.ovr>=56&&isChinaLeague(p),
  narrative:p=>`训练基地门口，一位穿着西装的外国人正在和你的经纪人交谈。你认出来了——那是来自荷兰阿贾克斯的首席球探。\n\n"${p.name}，"经纪人挂掉电话后激动地说，"阿贾克斯的球探专程从荷兰飞过来看你训练！他们对你的技术特点很感兴趣，说你适合欧洲的足球风格。如果表现出色，他们可能会在下一个转会窗报价！"\n\n这意味着你有可能踏上欧洲足球的舞台：`,
  choices:[
    {text:'在球探面前拼尽全力表现',effects:{'DRI.dribbling':1,'PAS.vision':1,'DRI.composure':2,'PHY.stamina':-1},consequence:'你知道机会难得，训练中拿出了120%的实力。几次精彩的盘带和传球让球探频频点头。他在离开前对你竖起了大拇指。',formChange:2,flag:'ajax_interest'},
    {text:'保持平常心 — 不给自己压力',effects:{'DRI.ballControl':1,'DRI.composure':2},consequence:'你决定不刻意表现，保持自己的节奏。虽然没有惊艳的发挥，但稳定的表现也让球探留下了不错的印象。',formChange:1},
    {text:'紧张到发挥失常',effects:{'DRI.composure':-1,'DRI.ballControl':-1},consequence:'你太想在球探面前表现了，结果反而紧张得频频失误。训练结束后，你看到球探摇了摇头。一次宝贵的机会可能就这样溜走了。',formChange:-1}
  ]},
{ id:'x4',cat:'special',minAge:16,
  narrative:p=>`今天是你${p.age+1}岁的生日。训练结束后，队友们给你准备了一个小蛋糕，更衣室里响起了生日歌。\n\n"许个愿吧，${p.name}！"队友们笑着说。\n\n你闭上眼睛，脑海中浮现出无数个画面——举起冠军奖杯、在世界大赛进球、身披国家队战袍……睁开眼时，你看到了面前的蜡烛。新的一岁，你想在哪个方面取得突破？`,
  choices:[
    {text:'许愿提升进攻能力',effects:{'SHO.finishing':2,'SHO.positioning':1,'SHO.shotPower':1},consequence:'吹灭蜡烛的那一刻，你在心里暗暗发誓要成为最致命的攻击手。这个赛季你的进球欲望格外强烈。',formChange:1},
    {text:'许愿提升身体素质',effects:{'PHY.strength':2,'PHY.stamina':1,'PHY.jumping':1},consequence:'你希望在新的一岁变得更加强壮。训练中你更加注重身体对抗，逐渐不再害怕和高大后卫硬碰硬。',formChange:1},
    {text:'许愿提升技术意识',effects:{'PAS.vision':2,'DRI.reactions':1,'PAS.shortPassing':1},consequence:'你渴望成为球场上最聪明的那个人。你开始更多地思考比赛，阅读场上的局势，传球选择越来越合理。',formChange:1},
    {text:'许愿保持健康远离伤病',effects:{'PHY.stamina':2,'DRI.composure':1,'DRI.reactions':1},consequence:'你最朴素的愿望就是远离伤病。这个赛季你格外注意身体管理，状态也因此更加稳定。',formChange:1}
  ]},
{ id:'x5',cat:'special',minAge:20,
  narrative:p=>`一个意想不到的电话打破了你平静的早晨。电话那头是你多年未见的父亲。\n\n"儿子，爸爸知道这些年亏欠了你……"父亲的声音有些哽咽，"你妈妈一直想去看你的比赛，但她身体不太好，出行不方便……"\n\n你握着手机沉默了。从小父亲因为工作常年在外，是母亲一个人把你拉扯大，送你去踢球。如今你有了收入，面临一个选择：`,
  choices:[
    {text:'给母亲买机票 — 请她来看你的比赛',effects:{'DRI.composure':2,'PHY.aggression':1,'SHO.positioning':1},consequence:'你立刻给母亲订了机票和酒店。比赛那天，你看台上母亲激动的身影，心中充满了力量。那场比赛你表现神勇，赛后把球衣送给了她。',formChange:2},
    {text:'寄钱回家 — 让父母生活更好',effects:{'DRI.composure':1,'PAS.vision':1},consequence:'你把一部分薪水寄回了家。虽然父母没能来现场，但知道他们过得更好，你在球场上也更加安心了。',formChange:1},
    {text:'专注比赛 — 赛季结束再回家',effects:{'DRI.ballControl':1,'PHY.stamina':1},consequence:'你决定等赛季结束后再回去看望父母。虽然有些遗憾，但你知道职业球员必须学会在关键时刻保持专注。',formChange:0}
  ]},
{ id:'x6',cat:'special',minAge:19,
  narrative:p=>`凌晨3点，你的手机疯狂震动。经纪人连续发了十几条消息：\n\n"你看到了吗？？"\n"你的集锦视频在国外社交媒体上火了！！"\n"已经500万播放量了！"\n\n你点开链接，是你上一场比赛的精彩集锦——那次连过三人的进球被配上了激昂的BGM，评论区全是外国球迷的惊叹："这小子是谁？""中国也有这样的球员？""求豪门带走他！"\n\n突然之间，你成了"网红"：`,
  choices:[
    {text:'趁热打铁 — 发布个人训练视频',effects:{'PAS.vision':1,'DRI.composure':1,'DRI.dribbling':1},consequence:'你趁机发布了更多个人训练视频，粉丝数暴涨。你的知名度从国内扩展到了国际，更多球探开始关注你。',formChange:1,flag:'viral'},
    {text:'保持低调 — 让足球说话',effects:{'DRI.ballControl':2,'DRI.composure':2,'PHY.stamina':1},consequence:'你没有被流量冲昏头脑，继续默默训练。教练在队会上表扬了你的态度："这才是职业球员该有的样子。"',formChange:2},
    {text:'沉迷于网络关注',effects:{'DRI.composure':-1,'DRI.ballControl':-1,'PHY.stamina':-1},consequence:'你花太多时间刷评论回复粉丝，训练时心不在焉。教练警告你："手机放更衣柜里，训练场上只需要专注足球。"',formChange:-1}
  ]},
{ id:'x9',cat:'special',minAge:23,
  narrative:p=>`一个意想不到的机会摆在了你面前——一家慈善基金会邀请你参加为期一周的足球公益活动，去偏远山区给孩子们送装备、上足球课。\n\n"那里的孩子连一块像样的场地都没有，"基金会的人说，"但他们对足球的热爱，和你小时候一模一样。"\n\n你的经纪人有些犹豫："一周时间虽然不长，但正好撞上休赛期恢复计划。"\n\n你看着宣传册上孩子们渴望的眼神：`,
  choices:[
    {text:'参加公益活动 — 用足球传递希望',effects:{'DRI.composure':3,'PAS.vision':2,'DRI.reactions':1,'PHY.stamina':-1},consequence:'你在山里度过了难忘的一周。和孩子们踢球的经历让你重新认识了足球的意义——它不仅仅是竞技，更是希望。这次经历让你的心态更加成熟。',formChange:2,flag:'charity'},
    {text:'捐款并捐赠一批装备',effects:{'DRI.composure':1,'PAS.vision':1},consequence:'你自掏腰包给山区学校捐了一批训练装备。孩子们寄来了手写的感谢信，你把它们贴在了更衣柜内侧。',formChange:0},
    {text:'婉拒 — 专注恢复训练',effects:{'PHY.stamina':1,'DRI.ballControl':1},consequence:'你婉拒了邀请，选择在休赛期恢复身体。虽然错过了公益活动的机会，但你的身体状态确实恢复得很好。',formChange:0}
  ]},
{ id:'x10',cat:'special',minAge:35,
  narrative:p=>`你在比赛中完成了一次精彩的表演——35岁的你依然能在关键时刻站出来。赛后，社交媒体上"#老兵不死"的话题冲上了热搜。\n\n球迷们纷纷留言："35岁还能这样踢，太不可思议了！""他就是中国足球的传奇！""希望他能踢到40岁！"\n\n你的手机也被各种采访请求和商业邀约塞满了。在这个年纪，你突然成了"现象级"话题：`,
  choices:[
    {text:'享受这一刻 — 感谢球迷的支持',effects:{'DRI.composure':2,'PAS.vision':1,'DRI.reactions':1},consequence:'你在社交媒体上发了一条感谢球迷的动态，配上了比赛的精彩瞬间。这条动态获得了上百万点赞，你的影响力在这个年纪反而达到了新的高度。',formChange:2,flag:'late_career_fame'},
    {text:'低调处理 — 继续默默训练',effects:{'DRI.ballControl':1,'PHY.stamina':1,'DRI.composure':1},consequence:'你没有被外界的赞美冲昏头脑，继续低调训练。你知道在这个年纪，保持状态比什么都重要。',formChange:1},
    {text:'趁机出版自传',effects:{'PAS.vision':1,'DRI.composure':1},consequence:'你趁着热度出版了自传，销量不错。虽然增加了一些收入，但写书的过程确实分散了一些精力。',formChange:0,flag:'autobiography'}
  ]},
{ id:'x11',cat:'special',minAge:16,
  narrative:p=>`今天在${isYouthStage(p)?'青年联赛':'联赛'}中，你对位的是另一位备受瞩目的同龄球员。媒体把你们称为"新双子星"。\n\n比赛中你们直接对位了好几次。他的速度很快，技术也很好。在第60分钟的一次对抗中，你被他穿裆过了——全场发出惊叹声。\n\n你感到一阵羞耻和愤怒。接下来的比赛中，你：`,
  choices:[
    {text:'更加拼命 — 用表现赢回尊严',effects:{'DRI.composure':2,'PHY.aggression':1,'DRI.dribbling':1,'SHO.finishing':1},consequence:'你咬牙加速，在接下来的比赛中表现更加拼命。你用一次精彩的过人回敬了他，并在最后时刻助攻队友绝杀。赛后你们交换了球衣，互相竖起了大拇指。',formChange:2},
    {text:'恶意犯规报复',effects:{'PHY.aggression':2,'DRI.composure':-2},consequence:'你一时冲动，从背后铲倒了他。裁判向你出示了红牌！赛后你被追加停赛3场。教练严厉批评了你："有血性是好事，但不能没有脑子。"',formChange:-2,flag:'red_card'},
    {text:'冷静调整 — 不被情绪左右',effects:{'DRI.composure':3,'PAS.vision':1,'DRI.reactions':1},consequence:'你深呼一口气，没有被羞耻感冲昏头脑。你调整了防守策略，在后续的对抗中不再吃亏。这种冷静的心态比任何技术都重要。',formChange:1}
  ]},
{ id:'x15',cat:'special',minAge:20,condition:p=>!p.isGK,
  narrative:p=>`今天的训练中，你尝试了一种新的射门方式——外脚背弧线球。这种技术难度很高，但如果练成，会让你的射门手段更加丰富。队友们看着你一次次尝试，有人嘲笑，有人鼓励。`,
  choices:[
    {text:'坚持练习外脚背射门',effects:{'PAS.curve':3,'SHO.finishing':2,'DRI.agility':1,'SHO.longShots':1},consequence:'你花了几周时间反复练习，终于掌握了外脚背弧线球的技巧。在下一场比赛中，你用这种方式打入了一粒惊艳的进球，全场球迷起立鼓掌！',formChange:2,flag:'trivela'},
    {text:'偶尔练练 — 不是主要方向',effects:{'PAS.curve':1,'SHO.finishing':1},consequence:'你偶尔练练外脚背，但没有深入。虽然比赛中偶尔能用出来，但稳定性不够。',formChange:0},
    {text:'放弃 — 专注常规射门',effects:{'SHO.finishing':2,'SHO.shotPower':1},consequence:'你决定不练这种花哨的技术，专注于常规射门。虽然射门手段单一了一些，但精度和力量都有提升。',formChange:0}
  ]},
{ id:'x16',cat:'special',minAge:16,condition:p=>isChinaLeague(p),
  narrative:p=>`冬训开始，全队开赴南方冬训基地。两个月里没有联赛，只有一天三练、体测、教学赛——这是中国足球延续几十年的传统。\n\n体能教练拿着体测数据找到你："YOYO体测你拿了全队第一，但肌肉量偏少。冬训是恶补身体的最佳窗口，你想怎么安排？"\n\n训练场的另一边，一线队的骨干们在进行十二分钟跑。所有人都在等你选择：`,
  choices:[
    {text:'跟一线队合练 — 直接对标最高强度',effects:{'PHY.strength':2,'DRI.reactions':2,'PAS.shortPassing':1},consequence:'你厚着脸皮申请跟一线队合练。头三天累到怀疑人生，但两周后你已经能跟上节奏了。冬训结束时，教练组把你的名字写进了一线队备选名单。',formChange:2,flag:'winter_train_ft'},
    {text:'按梯队计划稳扎稳打',effects:{'PHY.stamina':3,'PHY.strength':1},consequence:'你按照梯队教练的方案系统训练，体测成绩全面上涨。科学稳步的提升让你的身体基础打得非常扎实。',formChange:1},
    {text:'给自己加练技术 — 身体以后再说',effects:{'DRI.dribbling':2,'SHO.finishing':2,'PHY.stamina':-1},consequence:'全队练体能的时候，你泡在技术训练区加练。脚下功夫更细了，但春训开始后你一度跟不上高强度对抗。',formChange:0}
  ]},
{ id:'x17',cat:'special',minAge:24,condition:p=>p.ovr>=70,
  narrative:p=>`亚足联官网发布了一期专题：《亚洲新星观察》。你被和日本、韩国的两位同龄王牌放在了同一版面上对比。\n\n文章写道："中国的${p.name}正在以惊人的速度成长，但亚洲金元与留洋的十字路口，他将作何选择？"\n\n评论区里，日韩球迷开始认真讨论你的名字——这在以前的中国球员身上并不多见：`,
  choices:[
    {text:'剪下这篇文章 — 贴在更衣柜里',effects:{'SHO.positioning':2,'DRI.composure':2,'PHY.aggression':1},consequence:'每当训练想松懈时，你就看一眼这篇文章。亚洲的舞台很大，你想让世界记住中国球员的名字。这个赛季你踢得格外有杀气。',formChange:2},
    {text:'接受日韩媒体的连线采访',effects:{'DRI.composure':2,'PAS.vision':1},consequence:'你用流利而自信的回答赢得了日韩球迷的好感。亚洲范围内的知名度打开，你也开始收到更多国际品牌的合作意向。',formChange:1},
    {text:'不看这些 — 专注每一场比赛',effects:{'PHY.stamina':1,'DRI.ballControl':1},consequence:'经纪人把文章转给你，你只回了一句："帮我盯着下一场对手的录像。"心无旁骛的你，状态稳定得可怕。',formChange:1}
  ]},
// --- 老将 ---
{ id:'v1',cat:'special',minAge:33,
  narrative:p=>`训练结束后，你坐在更衣室里，感受到了以前从未有过的疲惫。膝盖的旧伤在阴天隐隐作痛，恢复时间也比年轻时长了太多。\n\n年轻的队友们在场上生龙活虎，而你发现自己越来越难以跟上他们的节奏。主教练找到你："${p.name}，你的经验无可替代，但身体状态确实在下滑。下赛季我们可以调整你的角色——你愿意改变踢法吗？"`,
  choices:[
    {text:'改变踢法 — 用经验弥补体能',effects:{'PAS.vision':3,'PAS.shortPassing':2,'DRI.composure':3,'SHO.positioning':2,'PHY.stamina':-1},consequence:'你开始改变踢法，减少无球跑动，更多地用传球和意识来影响比赛。虽然数据下降了，但你的战术价值反而提升了。年轻队友们把你当成场上的"教练"。',formChange:1,flag:'veteran_role'},
    {text:'坚持原有风格 — 和时间赛跑',effects:{'PHY.stamina':1,'PAC.sprintSpeed':1,'PHY.strength':1,'DRI.composure':-1},consequence:'你不服老，坚持用跑动和对抗来踢球。虽然偶尔还能有精彩表现，但伤病越来越频繁，恢复越来越慢。',formChange:-1},
    {text:'转型后卫/后腰 — 适应身体变化',effects:{'DEF.defensiveAwareness':3,'PAS.shortPassing':2,'DRI.composure':2,'PHY.strength':1},consequence:'你接受了位置后撤的建议，利用经验和阅读比赛的能力在防守端发挥余热。这个转变非常成功，你成为了一名出色的老将。',formChange:1,flag:'position_change'}
  ]},
{ id:'v2',cat:'special',minAge:36,
  narrative:p=>`更衣室里，一位18岁的新人怯生生地走到你面前。\n\n"${p.name}前辈，我从小就看您踢球长大……能和您合影吗？"他的眼中满是崇拜。\n\n你看着这个年轻人，仿佛看到了当年的自己。他是今年青训营最出色的苗子，和你当年的位置一样。主教练暗示过，希望你能带带他。\n\n你如何回应这个年轻人？`,
  choices:[
    {text:'主动担任他的导师',effects:{'PAS.vision':2,'DRI.composure':2,'DRI.reactions':1,'PAS.shortPassing':1},consequence:'你主动承担起了导师的角色，将自己的经验倾囊相授。年轻人进步神速，对你感激不尽。这份传承让你感到自己的足球生命在延续。',formChange:2,flag:'mentor'},
    {text:'简单鼓励几句',effects:{'DRI.composure':1,'PAS.vision':1},consequence:'你拍了拍他的肩膀说了几句鼓励的话。虽然没有深入指导，但你的认可已经给了他很大的信心。',formChange:0},
    {text:'合影但保持距离',effects:{'DRI.composure':1},consequence:'你欣然合影，但没有太多交流。你更愿意把精力放在自己的比赛上，指导新人的事交给教练组。',formChange:0}
  ]},
// --- 门将 ---
{ id:'g1',cat:'match',minAge:16,condition:p=>p.isGK,
  narrative:p=>`比赛第89分钟，对方获得一粒点球。你站在门线上，对方前锋把球放在点球点上，眼神凶狠地盯着你。\n\n全场几万名球迷鸦雀无声，你能听到自己的心跳声。门将教练在赛前给你分析过对方点球手的习惯——他喜欢射右下角，但也会偶尔变招。\n\n裁判哨声响起，对方开始助跑——`,
  choices:[
    {text:'赌右下角 — 扑向分析报告指出的方向',effects:{'GK.reflexes':2,'GK.gkPositioning':2,'DRI.composure':2},consequence:'你判断正确！向右下角飞身扑去，双手精准地将球挡了出去！全场沸腾，队友们冲过来将你抱起。这是一次教科书般的扑救！',formChange:2,flag:'penalty_save',risk:{attr:'GK.reflexes',base:.55},fail:{effects:{'GK.reflexes':1},consequence:'你判断对方会射右下角，飞身扑去——但他射向了左下角！皮球贴着立柱滚入网窝。你趴在草皮上捶了一下，门将教练在场边摇头：分析报告只是参考。',formChange:-1}},
    {text:'凭直觉扑救 — 不按套路出牌',effects:{'GK.reflexes':3,'GK.diving':1,'DRI.composure':1},consequence:'你抛弃了分析报告，凭直觉向左侧扑去——竟然扑对了方向！指尖触到了皮球，将其托出横梁！惊险而精彩！',formChange:2},
    {text:'留在中路 — 赌对方挑射',effects:{'GK.gkPositioning':2,'GK.handling':1,'DRI.composure':1},consequence:'你选择留在中路等待。对方果然想挑射，但你的站位封堵了角度，球打在你身上弹了出去！虽然没有扑救动作，但选位堪称完美。',formChange:1}
  ]},
{ id:'g2',cat:'match',minAge:16,condition:p=>p.isGK,
  narrative:p=>`比赛进行到第70分钟，你截获了对方一记软弱无力的射门，将球抱在怀中。你看到两名队友已经开始向前冲刺——一次快速反击的机会。\n\n你可以选择手抛球发动快攻，也可以大脚开向前场。对方的前锋正在逼抢你，你必须迅速做出决定：`,
  choices:[
    {text:'手抛球发动快攻',effects:{'GK.kicking':2,'PAS.vision':1,'DRI.reactions':2},consequence:'你一个精准的手抛球找到了边路的队友，球队瞬间形成反击！这次进攻最终转化为了进球，你的快速发动功不可没。',formChange:2,assists:1},
    {text:'大脚开向前场',effects:{'GK.kicking':2,'PAS.longPassing':1,'PHY.strength':1},consequence:'你选择大脚开球，皮球飞越半个球场。虽然落点稍偏，但你的开球距离和力量都得到了展现。',formChange:0},
    {text:'短传给后卫 — 稳妥处理',effects:{'PAS.shortPassing':1,'GK.gkPositioning':1,'DRI.composure':1},consequence:'你选择稳妥地短传给后卫，虽然错失了快攻机会，但保证了球权的安全。教练对你冷静的处理表示认可。',formChange:0}
  ]},
{ id:'g3',cat:'match',minAge:17,condition:p=>p.isGK,
  narrative:p=>`对方边路传中，一记弧线球飞向禁区。你判断来球路线，准备出击摘球。但与此同时，对方的高大中锋也在争抢这个落点。\n\n如果出击时机不对，可能被对方前锋抢点破门。如果不出击，后卫可能争不过对方的高点。这是一个考验门将决策的时刻：`,
  choices:[
    {text:'果断出击摘球',effects:{'GK.handling':2,'GK.gkPositioning':2,'PHY.jumping':1,'DRI.composure':2},consequence:'你果断冲出球门线，高高跃起在对方前锋头顶将球摘下！完美的出击时机和胆量，全场球迷为你鼓掌。',formChange:2},
    {text:'留在门线等待',effects:{'GK.reflexes':2,'GK.gkPositioning':1,'DRI.reactions':1},consequence:'你选择留在门线，后卫头球解围。虽然没有直接处理球，但你的站位让后卫有了信心去争顶。',formChange:0},
    {text:'出击拳击球解围',effects:{'GK.diving':1,'GK.handling':1,'PHY.strength':1,'PHY.jumping':1},consequence:'你冲出来用双拳将球击出禁区。虽然解围了，但球落到了对方球员脚下，好在他们的远射偏出了。',formChange:0}
  ]},
{ id:'g4',cat:'match',minAge:19,condition:p=>p.isGK,
  narrative:p=>`杯赛半决赛，120分钟战成0-0，进入点球大战。\n\n这是最考验门将意志力的时刻。你站在门线上，对方第一名主罚手正在摆放皮球。赛前门将教练给你看了对手的罚球习惯——有人习惯射左下角，有人喜欢打中路。\n\n第一个点球，对方助跑——`,
  choices:[
    {text:'扑向分析报告的方向',effects:{'GK.reflexes':2,'GK.diving':2,'DRI.composure':3},consequence:'你果断扑向右侧，指尖碰触到皮球将其托出横梁！对方球员抱头叹息。最终你在点球大战扑出两粒点球，帮助球队挺进决赛！赛后你被评为全场最佳。',formChange:3,flag:'penalty_hero'},
    {text:'猜中心思 — 留在中路',effects:{'GK.gkPositioning':2,'GK.handling':1,'DRI.composure':2},consequence:'你判断对方会打中路，稳稳站在原地把球抱住！这个大胆的站位让对方球员难以置信。最终球队在点球大战中胜出，你功不可没。',formChange:2,flag:'penalty_hero'},
    {text:'凭直觉左右扑',effects:{'GK.reflexes':2,'GK.diving':1,'DRI.composure':1},consequence:'你凭直觉扑向左侧，可惜对方打的是右边。虽然没能扑出，但你在接下来的轮次中逐渐找到了感觉，最终还是帮助球队晋级。',formChange:0}
  ]},
{ id:'g5',cat:'match',minAge:20,condition:p=>p.isGK,
  narrative:p=>`联赛关键战，对方的高空轰炸让你们的防线压力巨大。上半场对方已经通过角球制造了三次威胁。\n\n中场休息时，队长找到你："${p.name}，对方的角球战术很明确——后点摆渡到中路。你在门线上怎么指挥？"\n\n你需要在下半场调整防守策略：`,
  choices:[
    {text:'出击摘球 — 化解高空威胁',effects:{'GK.handling':2,'GK.gkPositioning':2,'PHY.jumping':2},consequence:'下半场你果断出击，连续三次抢在对方前锋之前摘走传中球。你的主动出击彻底压制了对方的高空战术，最终球队1-0取胜。',formChange:2},
    {text:'指挥防线造越位/盯人',effects:{'DEF.defensiveAwareness':2,'GK.gkPositioning':2,'DRI.composure':1},consequence:'你大声指挥防线调整盯人，成功化解了对方的定位球套路。虽然你没有直接扑救，但你的指挥让整条防线更加稳固。',formChange:1},
    {text:'保守站位 — 守住近门柱',effects:{'GK.reflexes':2,'DRI.composure':1},consequence:'你选择保守站位守住近门柱。对方几次角球都被你化解，但球队在下半场被对手用一次远射攻破球门，最终0-1惜败。',formChange:-1}
  ]},
{ id:'g6',cat:'match',minAge:18,condition:p=>p.isGK,
  narrative:p=>`联赛下半程，球队状态起伏，教练组开始讨论"门将轮换"。你和队内的老门将形成了直接竞争——他能给的是经验，你能给的是反应和出击范围。\n\n这周的训练课，门将教练宣布：周六的联赛首发出售制——"周三周四的训练表现，决定谁上场。"\n\n你知道，这是你抢班夺权的机会：`,
  choices:[
    {text:'两天训练全力封堵每一脚射门',effects:{'GK.reflexes':3,'GK.diving':2,'DRI.composure':1},consequence:'你像疯了一样扑出每一个来球，连续两天零封主力组的射手们。周六的首发名单上写下了你的名字——从这一刻起，主力门将的位子是你的了。',formChange:2,flag:'gk_starter'},
    {text:'研究老门将的录像 — 学他的站位',effects:{'GK.gkPositioning':3,'GK.handling':2},consequence:'你把老门将十年的扑救录像翻了个遍，学到了不少站位细节。训练中你的失误越来越少，教练满意地记下了笔记。',formChange:1},
    {text:'向老门将请教 — 以退为进',effects:{'GK.gkPositioning':2,'DRI.composure':2,'PAS.vision':1},consequence:'你主动请老门将吃饭，虚心求教。他被你的诚意打动，把毕生绝学倾囊相授。他甚至向教练建议："这小子，值得扶正。"',formChange:1}
  ]},
{ id:'m4',cat:'cup',minAge:17,condition:p=>isChinaLeague(p)&&p.ovr>=52&&!isYouthStage(p),
  narrative:p=>`${domesticCupName(p)}十六强赛，${p.team}客场挑战顶级联赛劲旅。你已经入选了一线队大名单，坐在替补席上。\n\n下半场第65分钟，球队0-2落后，${coachLine(p.team)?coachLine(p.team)+'教练':'主教练'}转头看向你："${p.name}，去热身，5分钟后上场。"\n\n你的心跳骤然加速。这是你第一次在正式比赛中为一线队出场。你脱下训练服走向热身区，教练走过来交代战术：`,
  choices:[
    {text:'主动请缨 — "教练，让我去进攻！"',effects:{'SHO.finishing':1,'DRI.composure':2,'PHY.aggression':1},consequence:'你眼中充满渴望地请战。教练被你的斗志打动："好，上去给我拼命跑！"你踏上球场的那一刻，感觉整个世界都不一样了。',formChange:2},
    {text:'认真听从教练战术安排',effects:{'PAS.shortPassing':1,'DRI.reactions':1,'DEF.defensiveAwareness':1},consequence:'你仔细聆听教练的战术安排，记住每一个细节。上场后你严格执行战术纪律，虽然紧张但表现稳健，几次处理球都很合理。',formChange:1},
    {text:'紧张得说不出话 — 默默上场',effects:{'DRI.ballControl':1,'DRI.composure':-1},consequence:'你紧张得手心冒汗，上场后几次触球都有些僵硬。不过随着比赛进行，你逐渐找到了节奏。第一次一线队杯赛出场，虽然不完美但意义非凡。',formChange:0}
  ]},
{ id:'m6',cat:'continental',minAge:19,condition:p=>p.league==='CSL'&&!isYouthStage(p),
  narrative:p=>`${continentalName(p)}小组赛，${p.team}客场挑战日本J联赛冠军。比赛进行到第92分钟，比分2-2。\n\n你们获得了一个前场任意球，距离球门约28米。这个位置不太好直接射门，但也不是完全没有可能。\n\n队内的任意球主罚手走到你身边："${p.name}，你来还是我来？这个位置你有信心吗？"全场日本球迷正在制造震耳欲聋的噪音：`,
  choices:[
    {text:'自己主罚 — 弧线球绕过人墙',effects:{'PAS.curve':2,'PAS.freeKickAccuracy':3,'SHO.shotPower':1,'DRI.composure':2},consequence:'你深吸一口气，助跑、摆腿、触球——皮球划出一道完美的弧线，越过人墙，擦着门柱飞入球网！绝杀！你疯狂奔向角旗区，队友们如潮水般涌来！',formChange:3,goals:1},
    {text:'让队友主罚 — 自己去禁区抢点',effects:{'SHO.positioning':2,'PHY.jumping':1,'SHO.finishing':1},consequence:'你让队友主罚，自己冲入禁区抢点。队友的任意球质量不错，你头球攻门稍稍高出。虽然没有进球，但你的跑位给对方防线制造了混乱。',formChange:0},
    {text:'战术配合 — 短传配合再传中',effects:{'PAS.shortPassing':2,'PAS.vision':2,'PAS.crossing':1},consequence:'你示意队友做战术配合。几脚传递后球被送入禁区，可惜最终射门被门将扑出。虽然没进球，但这次战术配合展现了你们的默契。',formChange:0}
  ]},
{ id:'m9',cat:'national',minAge:20,condition:p=>p.flags.nationalMember&&!CALENDAR.qualiYears.includes(seasonYear(p)),
  narrative:p=>`国际比赛日，中国队主场迎战亚洲劲旅。全场5万名球迷制造着震耳欲聋的声浪。\n\n比赛第89分钟，比分1-1。中国队获得最后一个角球。你站在禁区内，身边是比你高半个头的对方中卫。门将也冲到了对方禁区——这是最后的机会。\n\n角球开出，皮球划过一道弧线飞向禁区——`,
  choices:[
    {text:'前点头球攻门',effects:{'PHY.jumping':2,'SHO.positioning':2,'SHO.finishing':1,'DRI.composure':2},consequence:'你抢前点甩头攻门！皮球改变方向飞向球门远角——进了！！！全场5万人疯狂呐喊！你在角旗区被队友压在最下面，感受到了从未有过的狂喜！',formChange:3,goals:1,intlGoals:1,caps:1,flag:'wc_qualifier_goal'},
    {text:'后点包抄抢射',effects:{'SHO.positioning':2,'SHO.finishing':2,'PAC.acceleration':1,'DRI.reactions':1},consequence:'你快速移动到后点，抢在防守球员之前凌空抽射！球打在门柱上弹了出去——差之毫厘！全场发出遗憾的叹息。',formChange:0},
    {text:'扯动防守 — 为队友创造空间',effects:{'PAS.vision':2,'SHO.positioning':1,'DRI.composure':1},consequence:'你主动扯动防守球员，为队友创造了空当。队友头球攻门被门将扑出。虽然没有直接得分，但你的跑位价值被教练看在眼里。',formChange:1}
  ]},
{ id:'m14',cat:'cup',minAge:18,condition:p=>!isYouthStage(p),
  narrative:p=>`${domesticCupName(p)}十六强战，${p.team}客场对阵一支低级别联赛黑马。对手全场摆出铁桶阵，誓要拖入点球大战。\n\n比赛第88分钟，比分仍是0-0。你在禁区边缘接球，身前是三名防守球员。${coachLine(p.team)?coachLine(p.team)+'教练在场边大喊让你控制节奏':'教练在场边大喊让你控制节奏'}，但你知道——这是最后的机会。\n\n你抬头看了看球门，余光扫到队友的跑位：`,
  choices:[
    {text:'强行内切射门 — 用个人能力打破僵局',effects:{'SHO.finishing':2,'DRI.dribbling':2,'DRI.composure':1},consequence:'你连续两个变向晃开防守，在禁区线上果断起脚！皮球贴着草皮钻入死角！1-0！全场客队球迷瞬间安静，随队远征的你方球迷在看台上炸开了锅。',formChange:2,goals:1,risk:{attr:'DRI.dribbling',base:.58},fail:{effects:{'DRI.agility':1},consequence:'你连续两个变向试图晃开防守，但铁桶阵前空间太小，皮球被第三名后卫断下，对方顺势打出快速反击！好在回防及时没有丢球，教练在场边吼着让你冷静。',formChange:-1}},
    {text:'分边传中 — 信任队友抢点',effects:{'PAS.crossing':2,'PAS.vision':1,'DRI.composure':1},consequence:'你把球分到边路，队友下底传中，高中锋头球破门！1-0！这个进球是团队配合的成果，赛后教练特意表扬了你冷静的判断。',formChange:1,assists:1},
    {text:'回传控制 — 踢加时更稳妥',effects:{'PAS.shortPassing':1,'DRI.composure':2},consequence:'你选择回传稳住节奏，把比赛拖入加时。加时赛中你体能充沛，最终在第110分钟助攻队友绝杀晋级。',formChange:0}
  ]},
{ id:'m15',cat:'cup',minAge:20,condition:p=>!isYouthStage(p)&&p.ovr>=62,
  narrative:p=>`${domesticCupName(p)}决赛！通往冠军的最后90分钟。全场座无虚席，对手是联赛豪门，赛前普遍不看好你们。\n\n上半场0-0，对方控球率高达70%。中场休息时，主教练拍着战术板："他们看不起我们，那就让他们付出代价！下半场所有人向前！"\n\n下半场第60分钟，你们获得了一次快速反击的机会，你持球推进到对方禁区前沿：`,
  choices:[
    {text:'爆射近角 — 一锤定音',effects:{'SHO.shotPower':2,'SHO.finishing':2,'DRI.composure':2},consequence:p=>'你抡起右脚爆射近角！皮球炮弹般入网，门将毫无反应！这是决定冠军归属的进球！你脱下球衣疯狂庆祝，队友们把你扑倒在地。最终你们1-0捧起'+domesticCupName(p)+'冠军！',formChange:3,goals:1,flag:'cup_winner',risk:{attr:'SHO.shotPower',base:.58},fail:{effects:{'SHO.shotPower':1},consequence:'你抡起右脚爆射近角！可惜发力时支撑脚一滑，皮球高出横梁飞入看台。全场整齐地发出一声长叹——决赛最好的机会就这样溜走，你跪在地上久久没有起身。',formChange:-1}},
    {text:'假射真传 — 做给后插上队友',effects:{'PAS.vision':2,'PAS.shortPassing':2,'DRI.composure':1},consequence:'你做出射门动作骗过防守，脚腕一抖把球做给后插上的队友，他推射远角破门！1-0！你收获决赛助攻，和队友一起捧起冠军奖杯。',formChange:3,assists:1,flag:'cup_winner'},
    {text:'追求稳妥 — 打加时',effects:{'DRI.composure':2,'PHY.stamina':1},consequence:'你选择稳妥控制球权。比赛进入加时，第116分钟对手体能下降，你抓住机会助攻队友绝杀夺冠。捧杯时刻，你热泪盈眶。',formChange:2,flag:'cup_winner'}
  ]},
{ id:'m16',cat:'continental',minAge:19,condition:p=>['CSL','J1','K1','SAU','QAT'].includes(p.league)&&!isYouthStage(p),
  narrative:p=>`${continentalName(p)}小组赛，${p.team}主场迎战西亚劲旅。赛前新闻发布会上，对方主帅说："${LEAGUES[p.league].country}球队在亚冠的成绩一直不理想，我实在想不出他们怎么赢我们。"\n\n这番话传遍了更衣室。队长把手机摔在桌上："兄弟们，今天不为别的，就为争这口气！"\n\n比赛第70分钟，比分1-1。你在禁区外拿球，对方中卫扑了上来：`,
  choices:[
    {text:'过掉中卫直接打门',effects:{'DRI.dribbling':3,'DRI.agility':2,'SHO.finishing':1},consequence:'你一个油炸丸子过掉中卫，顺势推射远角！皮球绕过门将滚入网窝！2-1！你指着看台上的客场球迷怒吼，这场比赛成为亚冠历史上值得铭记的一夜。',formChange:3,goals:1,flag:'acl_hero',risk:{attr:'DRI.dribbling',base:.6},fail:{effects:{'DRI.agility':1},consequence:'你尝试用油炸丸子过掉中卫，但对方没有吃晃——皮球被断，对方直接发起快速反击！你拼命回追，好在队友补位化解。洲际赛场，容错率就是这么低。',formChange:-1}},
    {text:'和队友做二过一配合',effects:{'PAS.shortPassing':2,'PAS.vision':2,'DRI.reactions':1},consequence:'你和队友打出精妙二过一，突入禁区后被对方后卫放倒——点球！你亲自主罚命中，2-1拿下关键三分。',formChange:2,goals:1,flag:'acl_hero'},
    {text:'稳住节奏 — 客场拿到平局也不亏',effects:{'DRI.composure':2,'DEF.defensiveAwareness':1},consequence:'你选择控制节奏，最终1-1战平。客场带走一分虽然可以接受，但你也记住了对方主帅那番傲慢的话——回到主场一定要赢回来。',formChange:0}
  ]},
{ id:'m17',cat:'continental',minAge:21,condition:p=>['CSL','J1','K1','SAU','QAT'].includes(p.league)&&!isYouthStage(p),
  narrative:p=>`${continentalName(p)}淘汰赛，${p.team}首回合客场1-3落败，回到主场背水一战。\n\n赛前，球迷们在看台打出了巨大的Tifo："绝地反击！"整个体育场气氛近乎沸腾。\n\n比赛第75分钟，你们已经2-0领先，总比分3-3，只需要再进一球就能晋级。你刚刚替补登场，教练在场边喊："${p.name}，上去改变比赛！"`,
  choices:[
    {text:'刚上场就冲击对方防线',effects:{'PAC.sprintSpeed':2,'PAC.acceleration':2,'SHO.positioning':1},consequence:'你上场后连续两次高速冲刺撕开防线。第82分钟，你反越位成功单刀赴会，冷静推射破门！4-3总比分逆转晋级！全场爆发出山呼海啸般的欢呼，你在角旗区滑跪，泪水与汗水混在一起。',formChange:3,goals:1,flag:'acl_reverse',risk:{attr:'PAC.sprintSpeed',base:.6},fail:{effects:{'PAC.sprintSpeed':1},consequence:'你上场后全力冲击防线，可惜身体还没完全热开，第一次加速就被边卫卡住身位，随后的传中也被门将没收。逆转的希望随时间流逝，你喘着粗气告诉自己别慌。',formChange:-1}},
    {text:'串联全队 — 组织进攻',effects:{'PAS.vision':2,'PAS.shortPassing':2,'DRI.composure':1},consequence:'你上场后积极串联，用两脚精准直塞撕开对手防线，最终队友完成绝杀。你贡献了一次助攻，和全队一起创造了亚冠历史上的惊天逆转。',formChange:2,assists:1,flag:'acl_reverse'},
    {text:'稳住防守 — 拖入加时',effects:{'DEF.defensiveAwareness':2,'DRI.composure':2},consequence:'你选择先稳固防守。比赛进入加时，第114分钟你抓住对方体能崩溃的机会远射破门，完成逆转晋级！',formChange:2,goals:1,flag:'acl_reverse'}
  ]}
];
