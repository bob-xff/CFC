// ============ 章节剧情（一次性，永不重复）+ 真实赛历事件 + 里程碑 ============
const STORY_EVENTS=[
// ========== 第一章 青训星火 ==========
{ id:'ch1_intro',once:true,chapter:1,priority:1,minAge:16,
  narrative:(p,ctx)=>`${ctx.year}年春天，${clubCity(p.team)}训练基地。\n\n你拖着行李箱站在U17宿舍楼下，胸口印着${p.team}队徽的训练服还是崭新的。这是你签下青训培训协议后的第一天。\n\n${coachLine(p.team)?'主教练'+coachLine(p.team)+'恰好在场边驻足，看了你几组颠球后对青训总监说："这孩子的球感，留着重点观察。"':'青训总监在名单上圈了你的名字："重点观察。"'}\n\n更衣室里，同批入队的孩子们互相打量，都憋着一股劲。宿舍门上贴着梯队规矩第一条：\n\n"从今天起，你的每一个选择都算数。"`,
  choices:[
    {text:'在鞋柜里贴上纸条，写下自己的誓言',effects:{'PHY.aggression':2,'SHO.positioning':1},consequence:'你写下一句只属于自己的誓言。此后每天早上，这句纸条是你看到的第一个东西。梦想具体化了，动力就不一样了。',formChange:1},
    {text:'主动邀请室友去加练',effects:{'PAS.shortPassing':2,'DRI.reactions':1},consequence:'你和室友约好每晚加练一小时。互相喂球、互相纠错，你们成了彼此最早的"陪练"，后来也成了职业赛场上的对手和挚友。',formChange:1},
    {text:'默默记下训练馆的作息表 — 先观察再发力',effects:{'DRI.composure':2,'PAS.vision':1},consequence:'你把梯队里每位教练的偏好、每次体测的时间都记在小本子上。细心的你在第一次测评中打出了超预期的数据，青训总监眼前一亮。',formChange:1}
  ]},
{ id:'ch1_u17_debut',once:true,chapter:1,priority:2,minAge:16,
  narrative:p=>`U17联赛揭幕战，${p.team}U17对阵同组对手。青训总监排首发名单时，你的名字出现在了其中——虽然只是临场决定，但机会来了。\n\n对手是去年青超的前四，他们开场就压得你们喘不过气。第20分钟，你第一次拿球就遭遇凶狠逼抢。\n\n看台上，球探和家长们举着本子记录。这是你人生第一场正式梯队比赛：`,
  choices:[
    {text:'用行动回应 — 敢拿球、敢对抗',effects:{'DRI.ballControl':2,'DRI.composure':2,'PHY.strength':1},consequence:'你顶住了逼抢，连续几次成功摆脱让看台上的球探点了点头。半场结束前你送出一记助攻，球队2-1逆转。首秀惊艳！',formChange:2,assists:1},
    {text:'简单出球 — 稳字当先',effects:{'PAS.shortPassing':2,'DRI.composure':1},consequence:'你用简洁的一脚出球度过了首秀，没有失误也没有闪光。教练赛后说："稳，是好事。但记得，你是踢球的天才，不是安全的搬运工。"',formChange:0},
    {text:'紧张过度 — 一次次躲开球权',effects:{'DRI.composure':-1,'PHY.aggression':-1},consequence:'你下意识地避开对抗和球权，最终在第55分钟被换下。回宿舍的路上你把自己骂了个遍——但你知道，首秀的坎，迈过去就没了。',formChange:-1}
  ]},
{ id:'ch1_youth_derby',once:true,chapter:1,priority:3,minAge:16,
  narrative:(p,ctx)=>{const r=rivalOf(p);return r?`U17联赛迎来青年德比——${p.team}U17对阵${r.team}U17（${r.name}的青春版）。\n\n虽然只是梯队比赛，但两家俱乐部的青训营憋了好几年的劲。赛前对方教练放话："我们青训 never 输给${clubCity(p.team)}。"\n\n更衣室里，队长敲着战术板："今天不用多说了吧？"\n\n比赛第65分钟，1-1，你在前场拿球：`:`青年联赛关键战，对手是积分榜身前的直接竞争者。\n\n比赛第65分钟，1-1，你在前场拿球：`},
  choices:[
    {text:'长途奔袭 — 一条龙解决战斗',effects:{'DRI.dribbling':3,'PAC.acceleration':2,'DRI.composure':1},consequence:'你从中场开始加速，连过两人后冷静推射远角！绝杀！青训德比的英雄诞生了。赛后你的名字第一次出现在媒体的青训观察名单上。',formChange:3,goals:1},
    {text:'喂出绝杀助攻 — 成全队友',effects:{'PAS.vision':3,'PAS.shortPassing':2},consequence:'你吸引了两人包夹后送出直塞，插上的队友单刀破门！2-1！青训教练在总结会上点名表扬："个人英雄和团队大脑，我更稀罕后者。"',formChange:2,assists:1},
    {text:'稳住局面 — 把1分先拿住',effects:{'DRI.composure':3,'DEF.defensiveAwareness':1},consequence:'你选择控制节奏，最终2-1被顽强扳平成2-2。虽然遗憾，但你的大局观得到了教练认可。德比的故事，来日方长。',formChange:0}
  ]},
{ id:'ch1_mentor_visit',once:true,chapter:1,priority:3,minAge:16,
  narrative:(p)=>{const m=MENTORS[Math.floor(Math.random()*MENTORS.length)];return `训练基地来了一位重量级嘉宾——${m}。\n\n作为从中国足球黄金年代走出来的名宿，他被俱乐部请来给U17梯队上一堂"人生课"。训练结束后，他把你单独留了下来。\n\n"我看了你两堂课，"他开门见山，"天赋，有。但中国孩子天赋再好，到了18岁就见分晓——拼的是心气。"\n\n他从包里拿出一个旧足球："这是我当年在海外用过的。今天送你一个问题：你练球，是喜欢，还是要踢出来？"\n\n你怎么回答？`},
  choices:[
    {text:'"喜欢，也必须踢出来"— 把热爱和野心都说出来',effects:{'PHY.aggression':2,'SHO.finishing':2,'DRI.composure':1},consequence:'名宿笑了："好，记住今天这句话。"那个旧足球被你摆在床头。后来每当想放弃时，你都会想起这个下午。',formChange:2},
    {text:'"我想成为第一个站上世界之巅的中国球员"',effects:{'PHY.aggression':3,'SHO.positioning':1,'DRI.composure':1},consequence:'更衣室安静了两秒。名宿拍着你的肩膀大笑："狂！我喜欢。当年我们那批人就是太不狂了。"这句话传遍了整个基地，也成了你的标签。',formChange:2},
    {text:'"我还没想好，但我会一直练下去"',effects:{'PHY.stamina':2,'DRI.composure':2},consequence:'名宿点点头："诚实。练下去，答案会在路上等你。"他没有多说什么，但离开前给青训总监打了电话："那个孩子，重点带。"',formChange:1}
  ]},
{ id:'ch1_nt_youth',once:true,chapter:1,priority:4,minAge:16,condition:p=>p.ovr>=48,
  narrative:p=>`重磅消息：中国足协公布U17国少队集训名单，你的名字在列！\n\n集训基地里，来自全国各地的同龄天才齐聚一堂——其中有几个名字你早有耳闻，都是同龄人里的"成名角色"。\n\n第一堂训练课，国少教练就宣布："两周后出国拉练，打欧洲同年龄段的强队。谁的状态好谁上。"\n\n这是你第一次穿上印着国旗的训练服：`,
  choices:[
    {text:'拿出全部 — 在国少站稳主力',effects:{'DRI.reactions':2,'SHO.finishing':1,'PHY.stamina':2,'DRI.composure':1},consequence:'你在对抗中毫不逊色，热身赛贡献了关键传球和进球。拉练归来，你成了国少常客，"国家队常客"的剧本，从U17就写下了第一页。',formChange:2,flag:'national_youth'},
    {text:'专注观察欧洲同龄人的差距',effects:{'PAS.vision':3,'DRI.reactions':1},consequence:'欧洲同龄人的压迫速度让你印象深刻。你把差距一条条记在本子上：第一脚触球、无球跑动、身体对抗……回来的训练里，你针对性恶补。',formChange:1,flag:'national_youth'},
    {text:'训练强度太大 — 保留体力防受伤',effects:{'PHY.stamina':1,'DRI.composure':1},consequence:'你在集训中有所保留，虽然没有受伤，但也没能打动教练。国少的大门没有关上，但主力位置，你得用下一次机会去争了。',formChange:0}
  ]},
{ id:'ch1_leapfrog',once:true,chapter:1,priority:5,minAge:16,maxAge:17,condition:p=>p.ovr>=53,
  narrative:p=>`训练场上出现了有趣的画面——U19梯队教练在场边看了你整整一堂课。\n\n第二天，青训总监把你叫到办公室："U19教练组点名要你跳级。这意味着更快的节奏、更强的对抗，也可能坐一年冷板凳。"\n\n"当然，你也可以留在U17当绝对核心，踢舒服的足球。"\n\n跳级，还是留级？`,
  choices:[
    {text:'跳级U19 — 越级挑战',effects:{'DRI.composure':2,'PHY.strength':2,'PAC.sprintSpeed':1},consequence:'第一周你被撞了十几次，但第三周你就抢到了轮换位置，第五周首发登场并助攻绝杀。跳级的孩子，天赋藏不住。',formChange:2},
    {text:'留在U17 — 先当核心再走',effects:{'SHO.finishing':2,'PAS.vision':2,'DRI.composure':1},consequence:'你在U17大杀四方，包揽了队内最佳射手和助攻王，带队拿下青超分组头名。核心的角色让你的技术在实战里飞速进化。',formChange:1},
    {text:'两边兼顾 — U17首发、U19替补',effects:{'DRI.reactions':2,'PHY.stamina':1},consequence:'你跟教练组申请"两头跑"：周末踢U17联赛保持状态，平时跟U19训练涨经验。忙碌的一年，进步却是最扎实的。',formChange:1}
  ]},
// ========== 第二章 破土而出 ==========
{ id:'ch2_u21_step',once:true,chapter:2,priority:1,minAge:18,
  narrative:p=>`新赛季梯队名单公布，你被正式列入U21预备队——这是通往一线队前的最后一站。\n\n预备队联赛的对抗强度和U19完全不是一个概念：这里的对手是曾经的一线队弃将、外援替补、和他队租借来的"潜力股"，每个人都在为一纸一线队合同拼命。\n\n首堂训练课，一位25岁的老预备队员撞翻了你："小孩，想上位？先学会爬起来。"`,
  choices:[
    {text:'用表现让老队员闭嘴',effects:{'PHY.strength':2,'SHO.finishing':2,'DRI.composure':1},consequence:'分组对抗你独造三球，把预备队后防线冲得七零八落。那位老队员赛后主动过来击掌："小孩，有点东西。我罩你。"',formChange:2},
    {text:'跟着老队员学门道',effects:{'PAS.vision':2,'DRI.composure':2,'DEF.defensiveAwareness':1},consequence:'你放低姿态跟老队员请教"职业联赛的潜规则"：怎么保护自己、怎么和裁判打交道、怎么读比赛。一个月后你踢得像个老油条。',formChange:1},
    {text:'申请加练 — 用天赋碾压',effects:{'PHY.stamina':2,'SHO.positioning':2,'PAC.acceleration':1},consequence:'你每天最早到最晚走，加练到保安来锁门。预备队教练把你加练的视频发给了一线队教练组——"这个孩子，值得报名单。"',formChange:1}
  ]},
{ id:'ch2_loan_offer',once:true,chapter:2,priority:2,minAge:18,maxAge:21,condition:(p,ctx)=>p.ovr>=50&&(p.careerStage==='u19'||p.careerStage==='u21'),
  narrative:(p,ctx)=>{const clubs=LEAGUES.CL1.teams.slice();const dest=clubs[Math.floor(Math.random()*clubs.length)];return `经纪人的电话带来了一个真实的选项：中甲球队${dest}希望租借你半年，承诺"至少25场首发"。\n\n"租借是双刃剑，"经纪人分析道，"离开${p.team}的舒适区去${clubCity(dest)}，练出来就是主力履历，练不出来就是在外漂着。俱乐部这边也有点犹豫。"\n\n"你自己决定。"\n\n${dest}的队徽出现在手机屏幕上：`},
  choices:[
    {text:'接受租借 — 去中甲真刀真枪',effects:{'PHY.strength':2,'DRI.composure':3,'SHO.finishing':1},consequence:'你收拾行李奔赴新球队。头一个月确实难熬，但两轮进球之后，这座城市的球迷开始喊你的名字。半年租借期满，你带着两双位数的数据回来了——再也不是当年的少年。',formChange:2,flag:'onLoan'},
    {text:'婉拒 — 在梯队拿数据等机会',effects:{'SHO.finishing':2,'PAS.vision':1},consequence:'你选择留下，在U21联赛大杀四方。一线队教练每场都关注你的数据——但你也清楚，没有职业联赛的履历，信任来得会慢一些。',formChange:1},
    {text:'找主教练摊牌 — "给我一线队机会"',effects:{'PHY.aggression':3,'DRI.composure':1},consequence:'你鼓起勇气敲开了主教练办公室的门。他被你的胆量逗笑了，在接下来的热身赛里给了你两次替补机会。虽然时间不长，但你的名字第一次出现在了一线队备选名单上。',formChange:1,flag:'coach_notice'}
  ]},
{ id:'ch2_first_squad',once:true,chapter:2,priority:3,minAge:17,condition:p=>p.ovr>=54,
  narrative:p=>`联赛第X轮，一线队遭遇伤病潮。赛前一天傍晚，你正在U21宿舍刷视频，手机突然弹出一封邮件：\n\n"兹通知：${p.name}明日进入一线队比赛大名单。请于18:00前到一线队更衣室报到。"\n\n你盯着屏幕看了十秒钟，然后原地跳了起来。\n\n一线队更衣室里，你的更衣柜在角落——那是"边缘人"的位置。但柜门上印着你的名字，和你的号码。`,
  choices:[
    {text:'把队徽摸了一遍 — "记住今晚的感觉"',effects:{'DRI.composure':2,'PHY.aggression':1},consequence:'你安静地把每样装备摆放整齐，在心里说："这只是开始。"比赛日你虽然没有出场，但替补席的热身和更衣室的氛围，你都刻在了脑子里。',formChange:1},
    {text:'主动找一线队大哥们请教',effects:{'PAS.vision':1,'DRI.reactions':1,'DRI.composure':1},consequence:'你向${starLine(p.team)}请教了"第一次进大名单该注意什么"。老大哥很意外你的主动，把自己热身的节奏倾囊相授。你的职业分+100。',formChange:1},
    {text:'失眠一整夜 — 反复复盘战术板',effects:{'DRI.reactions':2,'PAS.vision':1,'PHY.stamina':-1},consequence:'你把一线队近五场的录像看到凌晨四点。第二天虽然顶着黑眼圈，但你对球队的战术跑位已经烂熟于心——这份准备迟早会派上用场。',formChange:0}
  ]},
{ id:'ch2_pro_debut',once:true,chapter:2,priority:4,minAge:17,condition:p=>p.ovr>=56&&(p.careerStage!=='u17'),
  narrative:p=>`比赛第80分钟，${p.team}2-0领先。第四官员举牌换人——屏幕上是你的号码。\n\n"${p.name}！${clubCity(p.team)?'全场'+clubCity(p.team)+'的球迷':'全场球迷'}第一次为这个名字欢呼！"\n\n你小跑入场，草皮的气息扑面而来。这是你的职业联赛首秀！${coachLine(p.team)?coachLine(p.team)+'在场边喊："别紧张，做你自己。"':'教练在场边喊："别紧张，做你自己。"'}\n\n第一次触球就在眼前——队友的回传，身后是对方前锋，看台在燃烧：`,
  choices:[
    {text:'一脚出球 — 然后大胆前插',effects:{'PAS.shortPassing':2,'DRI.reactions':2,'SHO.positioning':1},consequence:'你用一脚安全的出球完成了职业首触，随后连续两次前插制造威胁。10分钟的出场时间，你完成了一次射门和三脚传递。首秀，合格且亮眼！',formChange:2},
    {text:'炫一下 — 接球转身过人',effects:{'DRI.dribbling':3,'DRI.agility':2},consequence:'你接球顺势转身，一记克鲁伊夫转身过掉扑抢的前锋！全场"喔——"的一声。虽然后续传球被断，但这个镜头进了当日五佳球。少年，胆子不小！',formChange:2},
    {text:'紧张发抖 — 蜷在边路不敢接球',effects:{'DRI.composure':-1},consequence:'你的双腿像灌了铅，几次跑位都慢了半拍。10分钟很快过去，首秀就在懵懂中结束了。没关系，每个巨星的第一步都走得磕磕绊绊。',formChange:-1}
  ]},
{ id:'ch2_first_goal',once:true,chapter:2,priority:5,minAge:17,condition:p=>p.ovr>=57&&(p.careerStage!=='u17'),
  narrative:p=>`足协杯首轮，${p.team}对阵低级别球队，你获得了职业生涯第一次首发！\n\n全队都憋着劲要大胜，机会一次次砸向你脚下。第38分钟，边路传中，皮球越过所有人飞向你——禁区中央，无人盯防，门前五米！\n\n这是你职业生涯最近的进球机会，也可能是最远的——因为全世界都在看着你：`,
  choices:[
    {text:'一脚定音 — 推射空门',effects:{'SHO.finishing':3,'DRI.composure':2},consequence:'皮球应声入网！你职业生涯的第一球！你狂奔向角旗区，队友们把你扑倒，看台上的横幅突然亮了——上面写着你的名字和"未来可期"。这一夜，你梦到了16岁的自己。',formChange:3,goals:1},
    {text:'停球晃过门将再推',effects:{'DRI.dribbling':2,'DRI.composure':2,'SHO.finishing':2},consequence:'你胸部停下高球，虚晃过出击的门将，面对空门轻松推入！教科书般的处理！解说说："这个进球的质量，说明这孩子的冷静远超年龄！"',formChange:3,goals:1},
    {text:'错失良机 — 打飞了',effects:{'SHO.finishing':-1,'DRI.composure':-1},consequence:'你太想发上力，皮球高高飞出横梁。全场一阵惋惜的抽气声。下半场你加倍奔跑，最终用一次助攻将功补过。第一球还在路上，但没人怀疑它快来了。',formChange:0,assists:1}
  ]},
{ id:'ch2_pro_contract',once:true,chapter:2,priority:6,minAge:18,
  narrative:p=>`俱乐部办公室里，体育总监把一份文件推到你面前。\n\n"职业生涯第一份职业合同。 ${p.contractYears}年，青训A类条款，年薪${formatSalary(12000)}起步——每一步都写清楚了。"\n\n"薪水不高，但这是门内和门外的区别。签了它，你就是职业球员了。"\n\n笔就在桌上。你想起16岁拖着行李箱走进基地的那个下午：`,
  choices:[
    {text:'签下 — 按手印都行',effects:{'DRI.composure':2,'PHY.stamina':1},consequence:'你在签名栏写下名字。体育总监握着你的手："欢迎来到职业世界。"当晚你给爸妈打了电话，说了三分钟，哭了两次。梦想，正式开工。',formChange:1,flag:'pro_contract'},
    {text:'认真读完全部条款再签',effects:{'PAS.vision':2,'DRI.composure':2},consequence:'你逐字读完合同，就出场激励条款提了一个问题。总监愣了一下，笑了："好小子，还有法律意识。"细节争取到了，合同也签了。',formChange:1,flag:'pro_contract'},
    {text:'让经纪人先审一遍',effects:{'DRI.composure':1,'PAS.vision':1},consequence:'经纪人审完确认没问题，你顺利签字。俱乐部觉得你"挺成熟"。职业世界的第一课：合同即人生，稳一点没坏处。',formChange:0,flag:'pro_contract'}
  ]},
// ========== 第三章 立足中超 ==========
{ id:'ch3_starter_run',once:true,chapter:3,priority:2,minAge:19,condition:p=>p.careerStage==='starter'||p.careerStage==='core',
  narrative:p=>`连续五场首发，两球一助攻——教练在队会上宣布："${p.name}，从现在起，你就是常规首发。"\n\n主力位置不是荣誉，是责任：每周末的对手研究你，媒体盯着你，替补席上的年轻人等着你失误。\n\n下一轮，球队客场挑战强敌。赛前发布会，记者问${coachLine(p.team)?coachLine(p.team):'主教练'}："连续首发的新人，会不会被针对？"\n\n教练笑了："那要看他让不让别人针对。"\n\n你听懂了——这场比赛，就是你的"转正考试"：`,
  choices:[
    {text:'打进关键球 — 让所有质疑闭嘴',effects:{'SHO.finishing':3,'DRI.composure':2,'SHO.positioning':1},consequence:'第61分钟你用一记刁钻的抢点破门打响了名号。赛后发布会记者们的提问变成了"如何评价${p.name}的表现"。转正考试，满分通过。',formChange:3,goals:1},
    {text:'攻防两端全勤跑 — 用贡献度说话',effects:{'PHY.stamina':3,'DEF.defensiveAwareness':1,'PAS.vision':1},consequence:'你跑出了全场最高的12公里，一次门线解围+一次助攻。数据不耀眼，但教练在更衣室当众说："这才是主力该有的样子。"',formChange:2},
    {text:'被针对了 — 表现挣扎',effects:{'DRI.composure':-1,'PHY.stamina':-1},consequence:'对方派专人贴防你，全场你只有一次射门机会。比赛结束后教练拍拍你："被针对说明你有威胁。下次，学会带动队友解套。"',formChange:-1}
  ]},
{ id:'ch3_cup_run',once:true,chapter:3,priority:3,minAge:18,condition:p=>!isYouthStage(p),
  narrative:p=>`${domesticCupName(p)}四分之一决赛，${p.team}主场迎战联赛争冠对手——这是含金量最高的一场杯赛。\n\n杯赛是一场定胜负的舞台，赢了进四强，输了就回家。更衣室里气氛凝重，${coachLine(p.team)?coachLine(p.team)+'教练布置完战术，最后看着你："禁区前沿那块区域，是你的。放手去打。"':'教练布置完战术，最后看着你："放手去打。"'}\n\n第72分钟，比分0-0。你在禁区弧顶拿球，面前三个人：`,
  choices:[
    {text:'突然远射 — 挂死角',effects:{'SHO.longShots':3,'SHO.shotPower':2,'DRI.composure':2},consequence:'皮球像装了导航一样贴着横梁下沿入网！1-0！全场疯狂！这一球让你一战成名，"远射机器"的外号从今天开始流传。',formChange:3,goals:1,flag:'cup_semifinal_hero',risk:{attr:'SHO.longShots',base:.55},fail:{effects:{'SHO.longShots':1},consequence:'皮球像装了导航一样——飞向了死角的看台！远射高出横梁整整三米。你懊恼地抓了抓头发，对方门将善意地朝你鼓了鼓掌。一战成名，还差一脚准头。',formChange:-1}},
    {text:'直塞肋部 — 撕开防线',effects:{'PAS.vision':3,'PAS.shortPassing':2,'DRI.composure':1},consequence:'你的直塞球精准找到了反越位的前锋，他推射破门！1-0！团队足球的胜利，你是这场胜利的发起者。',formChange:2,assists:1},
    {text:'控制节奏 — 拖入对手失误',effects:{'DRI.composure':3,'DEF.defensiveAwareness':1},consequence:'你稳稳地梳理着中场，对方越踢越急。终场前对手后卫送点，队友点球绝杀！你贡献了全场最高的传球成功率。',formChange:1}
  ]},
{ id:'ch3_acl_debut',once:true,chapter:3,priority:4,minAge:19,condition:p=>canPlayContinental(p)&&['CSL','J1','K1','SAU','QAT'].includes(p.league),
  narrative:(p)=>`${continentalName(p)}小组赛首轮，${p.team}客场挑战沙特豪门。亚洲俱乐部层面的最高舞台，你来了。\n\n赛前新闻发布会上，对方主帅被问及${p.team}时轻笑："我们尊重每一个对手。"\n\n尊重个鬼——队长在更衣室把手机摔在桌上："都听见了吧？"\n\n第58分钟，比分1-1，你替补登场，亚洲的聚光灯打在你的身上：`,
  choices:[
    {text:'用亚洲级的速度冲击他们',effects:{'PAC.sprintSpeed':3,'DRI.dribbling':2,'SHO.positioning':1},consequence:'你上场后连续两次生吃对方边卫，第87分钟横传助攻队友完成绝杀！2-1！洲际首秀即高光，亚洲媒体记住了你的名字。',formChange:3,assists:1},
    {text:'冷静串联 — 打出中国球员的传控',effects:{'PAS.vision':3,'PAS.shortPassing':2,'DRI.composure':2},consequence:'你的传控让球队在客场稳住了局面，传球成功率全队最高。虽然1-1收场，但亚足联官网的赛后评分里，你是全队最高分。',formChange:1},
    {text:'紧张 — 亚洲舞台太大',effects:{'DRI.composure':-1,'DRI.ballControl':-1},consequence:'洲际比赛的节奏快得让你不适应，几次处理球都慢了半拍。赛后你把录像看了三遍——差距在哪，你比谁都清楚。',formChange:-1}
  ]},
{ id:'ch3_nt_callup',once:true,chapter:3,priority:1,minAge:18,condition:p=>!p.flags.nationalMember&&p.ovr>=60,
  narrative:(p,ctx)=>`手机在训练结束后疯狂震动——足协的官方征调函来了。\n\n"兹征调${p.team}球员${p.name}参加国家队集训，备战世预赛。"\n\n${ctx.ntCoach}——这位球员时代留洋德国的名宿，如今的国家队主教练——在集训名单发布会上点名了你："我看了他很多场，我要的是敢拿球的中国球员。"\n\n国家队集训基地，你的柜子上第一次挂上了那件红色的球衣。${NT_CAPTAIN}走过来跟你击掌："来了？练起来。"\n\n这是每个中国球员的终极梦想时刻：`,
  choices:[
    {text:'告诉全世界 — 我来了',effects:{'PHY.aggression':3,'SHO.positioning':2,'DRI.composure':1},consequence:'你在社交媒体发出国家队球衣的照片，配文只有一个词："梦想。"转发破十万。集训中你拼到抽筋，${ctx.ntCoach}在战术板上写下了你的名字——首发。',formChange:3,flag:'nationalMember',caps:1},
    {text:'低调入队 — 用训练说话',effects:{'PHY.stamina':2,'PAS.vision':2,'DRI.composure':2},consequence:'你一言不发地投入训练，第一周就赢得了国家队老队员的认可。分组对抗中你的一脚直塞让全场安静了一秒——${ctx.ntCoach}在场边记了一笔。',formChange:2,flag:'nationalMember',caps:1},
    {text:'压力太大 — 训练放不开',effects:{'DRI.composure':-1},consequence:'国家队的强度和 scrutiny 让你一度束手束脚。好在老队长们不断给你减压："小子，国家队也是踢球，不是上刑。"慢慢你放开了。',formChange:0,flag:'nationalMember',caps:1}
  ]},
{ id:'ch3_nt_debut',once:true,chapter:3,priority:2,minAge:18,condition:p=>p.flags.nationalMember&&p.internationalCaps<6,
  narrative:(p,ctx)=>`国家队友谊赛，${ctx.ntCoach}在首发名单上写下了你的名字——国家队生涯首次先发！\n\n开场仪式上，你站在${NT_CAPTAIN}身边，国歌响彻球场的瞬间，你的眼眶湿了。\n\n对手是亚洲二流球队，但在数万主场球迷面前，任何对手都不好打。第30分钟，你获得了国家队生涯第一次射门机会：`,
  choices:[
    {text:'打入国家队处子球！',effects:{'SHO.finishing':3,'DRI.composure':3,'SHO.positioning':1},consequence:'球进了！！你转身狂吼，指向胸前的国旗。队友们扑上来把你压在身下。解说员嘶吼："这一球，他等了一辈子！中国足球的新答案出现了！"',formChange:4,intlGoals:1,caps:1,flag:'nt_debut_goal'},
    {text:'送出国家队首次助攻',effects:{'PAS.vision':3,'PAS.shortPassing':2},consequence:p=>`你的直塞助攻${NT_CAPTAIN}破门！老队长跑过来指着你大笑："我就说这小子行！"国家队首秀即助攻，球迷论坛已经把你捧上了天。`,formChange:3,caps:1},
    {text:'处理球偏保守 — 完成任务',effects:{'DRI.composure':2,'PAS.shortPassing':1},consequence:'你稳定完成了70分钟的比赛任务，没有失误也没有惊喜。${ctx.ntCoach}赛后点评："中规中矩。但我知道他还有更多没拿出来。"',formChange:1,caps:1}
  ]},
// ========== 第四章 留洋风云 ==========
{ id:'ch4_scout_offer',once:true,chapter:3,priority:5,minAge:19,condition:p=>isChinaLeague(p)&&p.ovr>=64,
  narrative:p=>`经纪人连夜飞来${clubCity(p.team)}，带着一台平板电脑。\n\n"三家欧洲俱乐部——荷兰的、葡萄牙的、德国的——都发来了正式问价。其中阿贾克斯的开价最有诚意，他们想让你先去二队过渡，半年内升一线队。"\n\n"中国球员留洋，过去十年几乎绝迹。你可能是下一个打破僵局的人——或者，又一个失败案例。"\n\n"欧洲不等人，转会窗还有三天。你的答案？"\n\n窗外，训练基地的灯火通明。这里是你的一切，也是你的一切的天花板：`,
  choices:[
    {text:'走吧 — 去欧洲闯出一条路',effects:{'DRI.composure':2,'PAS.vision':2,'PHY.aggression':1},consequence:'你说出了那个改变一生的字："去。"经纪人连夜飞往荷兰谈判——下一个转会窗，欧洲的正式报价就会摆上桌面。中国足球的留洋火种，重新点燃了。',formChange:2,flag:'go_abroad_intent'},
    {text:'再等一年 — 在中超把数据刷到极致',effects:{'SHO.finishing':2,'SHO.positioning':2,'PHY.stamina':1},consequence:'你决定用一年时间把联赛数据刷到顶。中超金靴、联赛最佳——当你带着满级数据再去欧洲时，谈判桌上的筹码重了十倍。欧洲的大门，永远为强者敞开。',formChange:1},
    {text:'咨询前辈的意见',effects:{'DRI.composure':2,'PAS.vision':1},consequence:`你拨通了${MENTORS[1]}的电话——中国球员留洋的拓荒者。他只说了一句话："别等准备好了再去，去了才能准备好。"你沉默了很久，挂了电话，做出了决定。`,formChange:1,flag:'go_abroad_intent'}
  ]},
{ id:'ch4_arrival',once:true,chapter:4,priority:1,condition:p=>isEuropeLeague(p)&&p.flags.moved_abroad,
  narrative:(p,ctx)=>{const c=clubCity(p.team);return `降落${ctx.country==='中国'?'':c}时，天空下着${['EPL'].includes(p.league)?'冷雨':'细雨'}。\n\n${c}——你的新城市。${p.team}的体检已经通过，官宣视频播放量在中国破千万，评论区都是"八年了，终于又有中国人去五大联赛级别舞台了"。\n\n俱乐部公寓比你想象的小，冰箱是空的，桌上放着俱乐部准备的花和欢迎卡。手机里存着家人朋友的祝福，你搓了搓手——\n\n新的战场，新的规则。第一天，你想做什么？`},
  choices:[
    {text:'先把城市摸熟 — 找超市、找球场、找中餐馆',effects:{'DRI.composure':2,'PHY.stamina':1},consequence:'你花三天把住处到训练场的路线摸得滚瓜烂熟，还找到了一家地道的中餐馆。老板娘听说你是新来的球员，激动地多送了一碟饺子。"想家了就来。"',formChange:1},
    {text:'直奔训练基地 — 先加练给教练看',effects:{'PHY.stamina':2,'DRI.composure':1,'SHO.finishing':1},consequence:'你提前两天报到，主动申请体测和加练。体测数据出来时，体能教练挑了挑眉："比名单上写的还好。"第一天，你已经赢下了第一印象。',formChange:2},
    {text:'视频连线家人朋友 — 聊到深夜',effects:{'DRI.composure':2,'DRI.reactions':1},consequence:'你跟爸妈视频到深夜，妈妈在屏幕那头抹眼泪，爸爸嘴上嫌你"矫情"却一直没挂。挂断后你对着天花板深吸一口气——为了他们，也要在这站稳。',formChange:1}
  ]},
{ id:'ch4_language',once:true,chapter:4,priority:2,condition:p=>isEuropeLeague(p)&&p.flags.moved_abroad,
  narrative:(p,ctx)=>{const l=LEAGUE_LANG[p.league];return `战术课上，教练的${l?l.lang:'外语'}语速快得像机关枪。你勉强听懂了"高位逼抢"，后面三分钟的细节全靠队友用翻译软件转达。\n\n分组对抗时，后卫对你喊了三遍"回防"，你愣在原地——对手打穿了你身后的空当。\n\n训练结束，队长拍了拍你的肩："你的技术没问题，问题在嘴巴。 语言不通，战术就上不了身。"\n\n俱乐部可以安排语言课，但你得选强度：`},
  choices:[
    {text:'每天两小时强化课 + 请私教',effects:{'PAS.vision':2,'DRI.reactions':2,'DRI.composure':1},consequence:'你像当年练球一样死磕语言。三个月后，你已经能听懂教练全部的战术细节，甚至能和裁判"友好交流"了。场上，你像换了一个人。',formChange:2},
    {text:'跟着队友实战学 — 足球黑话优先',effects:{'DRI.composure':2,'PAS.shortPassing':2},consequence:'你放弃了教科书，专攻"球场黑话"。两个月后，队友喊"漏！"你比谁都反应快。语言这关，球场上反而过得最快。',formChange:1},
    {text:'请翻译随队 — 先熬过这季',effects:{'DRI.ballControl':1,'DRI.composure':1},consequence:'翻译帮你撑过了最难的适应期，但你也知道，隔着一层语言，你和更衣室始终有距离。下个阶段，必须靠自己。',formChange:0}
  ]},
{ id:'ch4_euro_debut',once:true,chapter:4,priority:3,condition:p=>isEuropeLeague(p)&&p.flags.moved_abroad,
  narrative:p=>{const rd=5+Math.floor(Math.random()*28);return `${LEAGUES[p.league].country}联赛第${rd}轮，${p.team}客场作战。第68分钟，比分0-1，教练喊你的名字——\n\n中国球员在这片联赛的出场记录，上一次被刷新还是多年前。今天，你来改写。\n\n登场后的第一次触球，对方球迷发出巨大的嘘声——这里是欧洲，没有人会为你的"梦想"鼓掌。你只值一个首发替补的名额，直到你证明更多。\n\n皮球滚到你的脚下：`;},
  choices:[
    {text:'对抗全开 — 用身体回应嘘声',effects:{'PHY.strength':2,'DRI.composure':3,'SHO.positioning':1},consequence:'你连续赢下三次对抗，用一记强硬的护球造成对方犯规。欧洲的第一课：这里尊重力量。赛后队内评分，你拿到了替补席最高分。',formChange:2},
    {text:'秀脚下 — 让欧洲看到中超技术',effects:{'DRI.dribbling':3,'DRI.agility':2},consequence:'你在两人包夹下完成连续变向过人，看台的嘘声瞬间变成了惊叹声！解说惊呼："来自中国的技术流！"首秀片段登上了欧洲社交媒体。',formChange:2},
    {text:'按部就班 — 完成战术任务',effects:{'DRI.composure':2,'PAS.shortPassing':1},consequence:'你安静地完成了22分钟的出场，传球成功率100%。没有高光也没有失误。教练赛后点头："职业。这就是我要的替补态度。"',formChange:1}
  ]},
{ id:'ch4_euro_goal',once:true,chapter:4,priority:4,condition:p=>isEuropeLeague(p)&&p.flags.moved_abroad&&!p.isGK,
  narrative:p=>{const rd=5+Math.floor(Math.random()*28);return `联赛第${rd}轮，${p.team}主场。第55分钟你替补登场，第78分钟——机会来了。\n\n队友右路突破传中，皮球划过禁区，你鬼魅般出现在前点——这个跑位你练过一万次。\n\n距球门六米，唯一的门将，全场的寂静：`;},
  choices:[
    {text:'打进！让全欧洲听见中国名字',effects:{'SHO.finishing':3,'SHO.positioning':2,'DRI.composure':2},consequence:'皮球入网的瞬间，整个球场炸了！你冲向角旗区，看台上的一片中国红旗帜格外醒目——那是当地华人球迷会。欧洲赛场的第一球，你做到了！国内热搜第一：#中国球员欧洲破门#',formChange:4,goals:1,flag:'euro_goal'},
    {text:'头球摆渡 — 成全队友绝杀',effects:{'PAS.vision':2,'PHY.jumping':2,'DRI.composure':1},consequence:'你高高跃起，头球摆渡到点球点，队友凌空抽射破门！你收获欧洲首次助攻。虽然没有自己进球，但"中国助攻"同样登上了欧洲媒体版面。',formChange:2,assists:1},
    {text:'错失 — 门将神扑',effects:{'SHO.finishing':-1,'DRI.composure':1},consequence:'你的补射被门将用腿挡出！全场惋惜的叹息声。回防的路上，队长拍了拍你："这个位置跑对了，进球是迟早的事。"你点头——欧洲的第一球，下次一定。',formChange:0}
  ]},
{ id:'ch4_cn_fans',once:true,chapter:4,priority:5,condition:p=>isEuropeLeague(p)&&p.flags.moved_abroad,
  narrative:p=>`比赛日早上，俱乐部通知你："赛后有一群从中国飞来的球迷想见你。他们组织了三个月，包了客队看台一个角。"\n\n赛后，你走向客队看台。二十多个中国球迷举着"万里追随"的横幅，有人红着眼眶喊你的名字。\n\n领头的球迷大哥递给你一面五星红旗："在欧洲的球场上，能看见自己国家的球员，是我们在外的底气。"\n\n你接过旗帜的瞬间，相机快门声连成一片：`,
  choices:[
    {text:'合影签名 — 聊到安保来催',effects:{'DRI.composure':2,'PHY.aggression':2},consequence:'你跟每个球迷合影、签名，听他们讲"为了看你一场球攒了半年假"。回酒店的路上你在车里坐了很久。这一天，你知道了自己踢球的意义比想象中重。',formChange:2,flag:'diaspora_bond'},
    {text:'把比赛用球送给他们',effects:{'PAS.vision':2,'DRI.composure':1},consequence:'你把比赛用球郑重地交给了球迷会："这是我在这的第一份记忆，放在你们的陈列柜里吧。"球迷们当场泪目。这个球后来成了球迷会的镇会之宝。',formChange:1,flag:'diaspora_bond'},
    {text:'约定下场比赛送他们门票',effects:{'DRI.composure':1,'PAS.vision':1},consequence:'你和球迷们约好："下场主场，我来弄票。"后来那个角落每次都坐满了中国红，俱乐部干脆在那里立了中文助威区。',formChange:1,flag:'diaspora_bond'}
  ]},
{ id:'ch4_ucl_debut',once:true,chapter:4,priority:6,minAge:20,condition:p=>isEuropeLeague(p)&&p.ovr>=70,
  narrative:p=>`欧冠！${p.team}的欧冠正赛名单里，出现了你的名字。\n\n小组赛首轮，${p.team}客场挑战一支传统豪门。十万人球场，欧冠主题曲响起的瞬间，你的手臂上起了一层鸡皮疙瘩。\n\n第72分钟，你替补登场。欧冠处子秀——这是中国男足球员时隔十余年再次站上这个舞台。\n\n第一次防守，对位的是身价上亿的世界级边锋：`,
  choices:[
    {text:'不怕他 — 逐帧研究过他的习惯',effects:{'DEF.defensiveAwareness':2,'DRI.reactions':3,'DRI.composure':2},consequence:'你把他近十场的录像全看了：变向前必先降速、内切前看一眼门将。你识破了他两次招牌动作，甚至完成了一次干净的抢断。欧冠处子秀，零失误！国内媒体炸了。',formChange:3},
    {text:'全力奔跑 — 用态度补差距',effects:{'PHY.stamina':3,'DEF.defensiveAwareness':1,'PHY.aggression':1},consequence:'15分钟你跑了2.1公里，每一次回追都拼到极限。终场哨响时你瘫坐在地上，对方球迷竟然给你鼓了掌——这里，尊重拼到底的人。',formChange:2},
    {text:'纯粹感受 — 记住这个夜晚',effects:{'DRI.composure':2,'PAS.vision':1},consequence:'你贪婪地记住每一秒：主题曲、灯光、节奏。虽然表现平淡，但种子已经种下——下一次站上这个舞台，你不想再只是感受。',formChange:1}
  ]},
{ id:'ch4_settle',once:true,chapter:4,priority:7,condition:p=>isEuropeLeague(p)&&p.flags.moved_abroad&&(p.ovr>=66),
  narrative:(p,ctx)=>{const c=clubCity(p.team);return `加盟${p.team}的第二个学期。${c}的冬天来得早，下午四点天就黑了。\n\n你数了数这个赛季：出场时间稳定，但距离主力还有一步。当地媒体对你的评价从"中国来的神秘新援"变成了"值得更多时间的年轻人"。\n\n更衣室里，你听队友们讨论圣诞假期去哪滑雪。你想起了去年这个时候，自己还在${ctx.country==='中国'?'中超的冬训场上':'国内的球场上'}。\n\n一年过去，你在这里扎根了吗？教练找你谈话了：`},
  choices:[
    {text:'"给我一个常规首发的机会"',effects:{'PHY.aggression':2,'SHO.finishing':2,'DRI.composure':1},consequence:'教练欣赏你的直接："那用训练说服我。"接下来的四周，你的训练数据全面领先同位置球员，首发名单上开始频繁出现你的名字。',formChange:2},
    {text:'"我想留下来，长住在这里"',effects:{'DRI.composure':3,'PAS.vision':1},consequence:'你表达了长期效力的意愿，俱乐部深受感动，把你列进了"未来核心培养名单"。定居的确定性让你彻底放开手脚，场上表现稳步上升。',formChange:1},
    {text:'"如果打不上主力，我考虑转会"',effects:{'PHY.aggression':2,'PAC.sprintSpeed':1},consequence:'经纪人开始暗中活动，几家中游球队迅速表达了兴趣。消息传到主教练耳朵里，他反手给了你连续三场首发——"机会给你了，看你的。"',formChange:1}
  ]},
// ========== 真实赛历事件 ==========
{ id:'cal_asian_cup',once:true,priority:2,minAge:18,condition:p=>p.flags.nationalMember,
  narrative:(p,ctx)=>`亚洲杯在沙特打响，中国队列入小组第二档。\n\n${ctx.ntCoach}的集训名单里，你是进攻端的常备人选。这是中国足球在低谷后的第一次洲际大赛，全国球迷的关注度拉满。\n\n小组赛第二轮，对阵小组最强对手，赢球基本出线，输了就危险。\n\n第75分钟，0-0。你在前场拿球，全中国都在屏幕前：`,
  choices:[
    {text:'一击致命 — 打入制胜球',effects:{'SHO.finishing':3,'DRI.composure':3,'SHO.positioning':1},consequence:'你突入禁区小角度爆射近角得手！1-0！中国队小组出线！终场哨响时你跪地怒吼，这一球将被反复播放十年。亚洲杯最佳进球候选，就是它。',formChange:4,goals:1,intlGoals:1,caps:1,flag:'asian_cup_hero',risk:{attr:'SHO.finishing',base:.6},fail:{effects:{'SHO.finishing':1},consequence:'你突入禁区小角度爆射——被对方门将用腿挡出！紧接着的补射也被后卫用身体封堵。终场哨响，0-0，出线的悬念留到了最后一轮。你把球衣蒙在头上，久久没有说话。',formChange:-1,caps:1}},
    {text:'助攻队长 — 团队制胜',effects:{'PAS.vision':3,'PAS.shortPassing':2},consequence:p=>`你吸引三人防守后横敲中路，${NT_CAPTAIN}推射破门！1-0出线！老队长抱着你转了三圈："小伙子，国家队需要你这样的大心脏！"`,formChange:3,assists:1,caps:1,flag:'asian_cup_hero'},
    {text:'憾平 — 点球大战惜败',effects:{'DRI.composure':2,'PHY.stamina':2},consequence:'120分钟0-0，点球大战你顶住压力罚进，但队友失手——中国队止步十六强。更衣室里一片沉默，${ctx.ntCoach}挨个拍肩膀："抬起头，两年后世预赛，我们再来。"',formChange:0,caps:1}
  ]},
{ id:'cal_olympics',once:true,priority:3,condition:p=>p.ovr>=60,
  narrative:(p,ctx)=>`洛杉矶奥运会男足抽签出炉——时隔二十年，中国国奥队再次站上奥运舞台！\n\n作为适龄球员里的头号球星，你被国奥队列为超龄方案外的核心 U23 战力。全队平均年龄21岁，你带着"老大哥"的头衔入队。\n\n小组赛首战对阵南美劲旅。奥运会——这个世界最大的舞台——从未有过中国男足的胜利，更别说进球。\n\n第60分钟，0-0，你在反击中拿到球权：`,
  choices:[
    {text:'创造历史 — 打入中国男足奥运首球',effects:{'SHO.finishing':3,'DRI.composure':3,'PAC.sprintSpeed':1},consequence:'你单刀赴会，冷静推射！中国男足奥运会历史上第一粒进球诞生了！全中国刷屏，国际奥委会官网都在播报。赛后你把比赛用球珍重收好——它属于历史。',formChange:4,flag:'olympic_goal',caps:1},
    {text:'率领队友拼出八强',effects:{'PHY.stamina':3,'DRI.composure':2,'PAS.vision':1},consequence:'你带队小组出线，淘汰赛虽然憾负东道主，但"中国男足奥运八强"已经是奇迹。回国的机场，你们被围得水泄不通。',formChange:3,flag:'olympic_goal',caps:1},
    {text:'收获经验 — 小组出局',effects:{'DRI.reactions':2,'PAS.vision':1},consequence:'奥运会的高强度让年轻的中国队交了学费，小组出局。但你和队友们都成长了——四年后，这批人会更强。',formChange:1,flag:'olympic_goal',caps:1}
  ]},
{ id:'cal_quali_2027',once:true,priority:2,minAge:18,condition:p=>p.flags.nationalMember,
  narrative:(p,ctx)=>`2030世界杯亚洲区预选赛拉开战幕——这是中国足球的又一个四年周期。\n\n${ctx.ntCoach}在动员会上没有讲大道理，他只放了一段视频：2001年，五里河，中国第一次冲进世界杯。视频结束，全场寂静。\n\n"那一年我坐在电视机前，"他说，"现在轮到你们了。"\n\n首战客场，面对东南亚劲旅，第80分钟0-1落后，你替补登场：`,
  choices:[
    {text:'吹响反击号角',effects:{'PHY.aggression':2,'PAS.vision':2,'DRI.composure':2},consequence:'你登场后两次突破制造险情，补时阶段你的传中造成对方乌龙——2-1绝杀逆转！世预赛开门红！更衣室像过年一样。',formChange:3,assists:1,caps:1},
    {text:'打进扳平球',effects:{'SHO.finishing':3,'DRI.composure':2},consequence:p=>`第86分钟，你接角球抢前点头球破门！1-1！客场拿到宝贵的一分。赛后${NT_COACH}说："这孩子的头球，我练了半年，值了。"`,formChange:2,goals:1,intlGoals:1,caps:1},
    {text:'遗憾输球 — 首战失利',effects:{'DRI.composure':2,'PHY.stamina':1},consequence:'1-2，世预赛首战折戟。回程的航班上，全队没有人说话。${ctx.ntCoach}只说了一句："下一场，必须赢。"你把这句话记在了手机备忘录里。',formChange:-1,caps:1}
  ]},
{ id:'cal_quali_2028',once:true,priority:2,minAge:19,condition:p=>p.flags.nationalMember,
  narrative:(p,ctx)=>`世预赛进入主循环，中国队坐镇主场迎战小组头名之争的关键对手。\n\n积分榜上，你和队友们把悬念留到了最后四轮。这一战，赢了就是小组第一。\n\n赛前，主教练宣布了一个消息："本轮，${p.name}担任前场自由人。"\n\n自由人——进攻的绝对核心。第65分钟，1-1，你在前场游弋：`,
  choices:[
    {text:'接管比赛 — 独造两球',effects:{'SHO.finishing':3,'DRI.dribbling':2,'DRI.composure':2},consequence:'一传一射！你在15分钟内主宰了比赛！3-1！中国队登顶小组！赛后你当选全场最佳，球衣被球迷撕成碎片"收藏"——每一片都是荣耀。',formChange:4,goals:1,assists:1,intlGoals:1,caps:1},
    {text:'组织调度 — 盘活全场',effects:{'PAS.vision':3,'PAS.longPassing':2},consequence:'你像节拍器一样调度着进攻，全场关键传球上双。3-1！中国队登顶小组！你是这场胜利的隐形发动机。',formChange:3,assists:1,caps:1},
    {text:'被重点盯防 — 铩羽而归',effects:{'DRI.composure':1,'PHY.stamina':2},consequence:p=>`对方用三人包夹锁死了你，1-2，小组头名旁落。更衣室里，${NT_COACH}看着你："被人这么防，说明你真的成了。下次，学会用跑动带走防守人。"`,formChange:-1,caps:1}
  ]},
{ id:'cal_quali_2029',once:true,priority:1,minAge:20,condition:p=>p.flags.nationalMember,
  narrative:(p,ctx)=>`世预赛亚洲区最后一轮。中国队客场作战，赢球=直接晋级2030世界杯；打平=附加赛；输球=回家。\n\n十六年了。整个中国都在等待这一夜。\n\n${ctx.ntCoach}在更衣室的战术板上只写了两个字："敢赢。"\n\n比赛第88分钟，1-1。对手全线退守，中国队获得前场右侧任意球。距离球门25米，你的位置。${NT_CAPTAIN}看着你："来吗？"\n\n看台上，五万客场球迷区里那一抹中国红突然安静下来。你把球放好，后退四步——`,
  choices:[
    {text:'直接任意球 — 一战封神',effects:{'PAS.freeKickAccuracy':3,'PAS.curve':2,'DRI.composure':3},consequence:'你深吸一口气，助跑、摆腿——皮球划出完美弧线，越过人墙，擦着门柱内侧坠入死角！！！3分钟后的终场哨，是中国足球十六年等待的终点。你疯了般奔跑，队友在身后追。这一夜，无数人泪流满面——中国队，晋级2030世界杯！！！',formChange:5,goals:1,intlGoals:1,caps:1,flag:'wc_qualified',risk:{attr:'PAS.freeKickAccuracy',base:.45},fail:{effects:{'PAS.freeKickAccuracy':1},consequence:'你深吸一口气，助跑、摆腿——皮球越过人墙，却偏出了立柱！五万客场球迷的叹息声像潮水一样涌来。终场哨响，1-1，晋级的答案要留给下一场比赛了。',formChange:-2,caps:1}},
    {text:'助跑假射真传 — 骗过所有人',effects:{'PAS.vision':3,'PAS.shortPassing':2,'DRI.composure':3},consequence:'所有人都以为你要射门，你却把球轻推给了后插上的队友——他一脚世界波直挂死角！2-1！终场哨响，中国队晋级世界杯！你的名字和这记"世纪助攻"永远绑在了一起。',formChange:5,assists:1,caps:1,flag:'wc_qualified'},
    {text:'憾平 — 进附加赛',effects:{'DRI.composure':3,'PHY.stamina':2},consequence:'1-1，附加赛。次回合加时赛，中国队凭借你的关键进球绝杀对手，惊险晋级！虽然之路曲折，但结局圆满——世界杯，中国队来了！',formChange:3,goals:1,intlGoals:1,caps:1,flag:'wc_qualified'},
    {text:'命运弄人 — 惜败出局',effects:{'DRI.composure':2,'PHY.aggression':1},consequence:'第93分钟，对手一次反击绝杀。1-2。终场哨响，你跪在草皮上久久不起。四年，又是四年。但你在心里发誓：下一次，不会有下一次的失望。',formChange:-2,caps:1}
  ]},
{ id:'cal_wc_2030',once:true,priority:1,condition:p=>p.flags.wcQualified,
  narrative:(p,ctx)=>`${ctx.year}年夏天。世界杯小组赛，中国队的更衣室通道口，队友们在互相整理球衣。\n\n你的职业生涯至今所有的一切——青训、梯队、中超、留洋、世预赛——都为了此刻：站上世界杯的赛场。\n\n小组赛首战，对手是欧洲劲旅。解说员念首发名单念到你名字时，中国无数家庭的电视机前爆发了欢呼。\n\n第63分钟，0-0，你拿球突进：`,
  choices:[
    {text:'世界杯首球 — 载入史册',effects:{'SHO.finishing':3,'DRI.composure':3,'SHO.positioning':2},consequence:'你晃开防守，禁区内冷静推射远角——球进了！！！中国男足世界杯历史性进球！你亲吻队徽，泪流满面。解说员哽咽："这一球，几代中国球员的梦。"比赛1-0，中国队世界杯首胜！',formChange:5,goals:1,intlGoals:1,caps:1,flag:'wc_goal',risk:{attr:'SHO.finishing',base:.6},fail:{effects:{'SHO.finishing':1},consequence:'你晃开防守推射远角——门将的手指改变了一切！皮球被他指尖一蹭击中立柱弹出。中国队错失世界杯历史上最好的进球机会，你抱着头望向天空，不甘写满了脸。',formChange:-1,caps:1}},
    {text:'盘活进攻 — 虽败犹荣',effects:{'PAS.vision':3,'DRI.composure':2},consequence:'你的几次盘带撕开对方防线，可惜锋线队友错失良机，0-1惜败。但中国队的面貌让世界眼前一亮——"亚洲新势力"，外媒如此评价。',formChange:2,caps:1,flag:'wc_group_pass'},
    {text:'学习大赛 — 积累经验',effects:{'DRI.reactions':2,'DRI.composure':2},consequence:'世界杯的强度还是让你交了学费，0-2。但你把每一帧画面都刻进脑海——下一届，你不会再是学生。',formChange:1,caps:1}
  ]},
{ id:'cal_wc_2030_ko',once:true,priority:1,condition:p=>p.flags.wc_group_pass||p.flags.wc_goal,
  narrative:(p,ctx)=>`世界杯16强淘汰赛。中国队——历史上第二次从世界杯小组出线——对阵南美豪强。\n\n赛前博彩公司一边倒，媒体戏称这是"作业题"。但更衣室里，${NT_CAPTAIN}把队长袖标拍在桌上："作业题？让他们做做我们的题。"\n\n比赛打得难解难分。第90分钟，1-1，你获得单刀球——裁判没有吹越位：`,
  choices:[
    {text:'杀死比赛 — 疯狂之夜',effects:{'SHO.finishing':3,'DRI.composure':3,'PAC.sprintSpeed':2},consequence:'你晃过出击的门将，推射空门！2-1！中国队晋级世界杯八强！！！创造历史的一夜！国内朋友圈被同一句话刷屏："我们见证了历史！"',formChange:5,goals:1,intlGoals:1,caps:1,flag:'wc_quarter'},
    {text:'横传队友 — 集体英雄主义',effects:{'PAS.vision':3,'DRI.composure':3},consequence:'你吸引了门将和后卫，横敲中路——队友空门得手！2-1！中国队晋级八强！你们在角旗区叠罗汉，全中国为这个夜晚不眠。',formChange:4,assists:1,caps:1,flag:'wc_quarter'},
    {text:'越位误判 — 心碎出局',effects:{'DRI.composure':2},consequence:'进球后VAR响起——越位，毫米级！最终点球大战憾负。球员通道里，你们相顾无言。但全世界都看到了：中国队，不一样了。',formChange:0,caps:1}
  ]},
{ id:'cal_wc_2034',once:true,priority:1,condition:p=>p.flags.wcQualified,
  narrative:(p,ctx)=>`${ctx.year}年，沙特世界杯。这是你的第二次世界杯，也可能是最后一次巅峰期机会。\n\n中国队不再是看客——上届八强的底子，加上你和其他留洋球员的成熟，国际媒体把中国队列为"潜在黑马"第一位。\n\n小组赛末轮，打平即出线。第80分钟，1-1。你带球杀入对方腹地：`,
  choices:[
    {text:'绝杀出线 — 王者之姿',effects:{'SHO.finishing':3,'DRI.dribbling':3,'DRI.composure':3},consequence:'你连续变向后兜射远角得手！2-1！小组第一晋级！看台上的中国球迷区的歌声响彻多哈的夜空。你已经不是四年前那个学生了——你是这支球队的王。',formChange:5,goals:1,intlGoals:1,caps:1,flag:'wc_group_pass'},
    {text:'盘活全局 — 平稳出线',effects:{'PAS.vision':3,'DRI.composure':3},consequence:'你用大师级的控场稳住了比赛，1-1的结果足以出线。四年后，没人再敢小看中国队——因为我们有王。',formChange:3,caps:1,flag:'wc_group_pass'},
    {text:'悲情出局 — 英雄迟暮前夜',effects:{'DRI.composure':2},consequence:'终场前对手远射绝杀，1-2。你的第二次世界杯止步小组赛。回程航班上，你望着窗外的云海：下一个四年，我还在吗？',formChange:-1,caps:1}
  ]},
{ id:'cal_wc_2034_final',once:true,priority:1,condition:p=>p.flags.wc_group_pass,
  narrative:(p,ctx)=>`淘汰赛一路过关斩将——16强、8强、半决赛点球大战——中国队杀进了${ctx.year}世界杯决赛！！！\n\n对手是世界排名第一、卫冕冠军。赛前全球媒体标题高度一致：《不可能的决赛》。\n\n更衣室里安静得可怕。${NT_CAPTAIN}（如今已40岁，作为教练组成员随队）最后一个发言："我这辈子，两次站在世界杯的门口。第一次我哭了。今天，我不想再哭第二次。"\n\n决赛第75分钟，1-1。你在禁区前沿拿到球，面对世界上最好的中卫组合：`,
  choices:[
    {text:'挑射 — 世界之巅的最后一击',effects:{'SHO.finishing':3,'DRI.composure':3,'PAS.curve':2},consequence:'你看看门将站位，突然起脚挑射——皮球越过门将指尖，缓缓坠入网窝！！！2-1！！！终场哨响，你是世界杯冠军成员！！！中国足球——世界之巅！！！你的名字，从此刻起写进了这个星球上所有语言的足球词典。',formChange:6,goals:1,intlGoals:1,caps:1,flag:'wc_champion',risk:{attr:'SHO.finishing',base:.55},fail:{effects:{'PAS.curve':1},consequence:'你突然起脚挑射——门将根本没有起跳，稳稳把皮球抱进怀里！决赛最宝贵的一次机会被浪费，你盯着自己的鞋钉，不敢相信这就是结果。',formChange:-1,caps:1}},
    {text:'助攻绝杀 — 把荣耀分给兄弟们',effects:{'PAS.vision':3,'PAS.shortPassing':3,'DRI.composure':3},consequence:'你吸引了三名防守人，在倒地瞬间把球捅给后插上的队友——他推射破门！2-1！中国队，世界杯冠军！！！你被队友们抛向天空，泪水混着彩带落下。这枚金牌，属于14亿人。',formChange:6,assists:1,intlGoals:1,caps:1,flag:'wc_champion'},
    {text:'加时憾负 — 亚军的泪水',effects:{'DRI.composure':3,'PHY.stamina':2},consequence:'加时赛第112分钟，对方一次角球绝杀。2-1。你们获得了世界杯亚军——这已经是亚洲足球的历史最佳战绩。领奖台上你哭了，但全中国都为你骄傲：下一次，冠军会是中国。',formChange:3,caps:1,flag:'wc_runnerup'}
  ]},
{ id:'cal_quali_2033',once:true,priority:1,minAge:20,condition:p=>p.flags.nationalMember&&!p.flags.wcQualified,
  narrative:(p,ctx)=>`2034世界杯亚洲区预选赛收官战。上一次倒在终点线前的滋味，你从未忘记。\n\n四年过去，你已经从当年的新星变成了这支国家队的绝对核心。${NT_COACH}的战术板围着你画——对手主教练赛前直言："冻结${p.name}，等于冻结中国队。"\n\n这场胜利直接决定世界杯门票。第85分钟，1-1，球权来到你的脚下：`,
  choices:[
    {text:'用王者的方式终结悬念',effects:{'SHO.finishing':3,'DRI.dribbling':2,'DRI.composure':3},consequence:'你连续变向后突施冷箭——皮球直挂死角！2-1！终场哨响，中国队晋级2034世界杯！你脱下球衣怒吼，看台上你的巨幅Tifo缓缓展开——这一幕，将成为中国足球的永恒镜头。',formChange:5,goals:1,intlGoals:1,caps:1,flag:'wc_qualified'},
    {text:'大师级控场 — 稳稳出线',effects:{'PAS.vision':3,'DRI.composure':3,'PAS.shortPassing':2},consequence:'你用教科书般的控场把比赛节奏握在手中，2-1保持到终场！中国队晋级2034世界杯！以核心身份率队闯进世界杯——你是名副其实的国家队旗帜。',formChange:4,assists:1,caps:1,flag:'wc_qualified'},
    {text:'双拳难敌四手 — 再次惜败',effects:{'DRI.composure':2,'PHY.stamina':2},consequence:'对手的防守 sacrificed 一切冻结你，补时阶段被打进反超一球，1-2。你又跪在了这片草皮上。两届世预赛，两次差一步。但请记住——四年后，你还有第三次机会。',formChange:-2,caps:1}
  ]},
// ========== 第六章 亚洲之巅 ==========
{ id:'ch6_acl_run',once:true,chapter:6,priority:2,minAge:21,condition:p=>['CSL','J1','K1','SAU','QAT'].includes(p.league)&&p.ovr>=72,
  narrative:p=>`${continentalName(p)}淘汰赛，${p.team}一路杀入半决赛。首回合客场0-1告负，次回合主场背水一战。\n\n你已经不是当年那个替补席上的少年——你是这支球队进攻端的第一选择，对方教练赛前点名："防住${p.name}，就赢了一半。"\n\n第70分钟，总比分1-2，你还需要一个进球。禁区前沿，球权在你脚下：`,
  choices:[
    {text:'梅开二度 — 一人扛着球队晋级',effects:{'SHO.finishing':3,'DRI.dribbling':2,'DRI.composure':2},consequence:'第78分钟你远射扳平总比分，第90+3分钟你抢断后卫推射绝杀！3-2总比分晋级决赛！你跪在草皮上，看台的Tifo是你的头像——这一夜属于你。',formChange:4,goals:2,flag:'acl_final',risk:{attr:'SHO.finishing',base:.55},fail:{effects:{'SHO.finishing':1,'PHY.stamina':-1},consequence:'第78分钟你的远射被门将神扑，第90+3分钟的单刀也被出击的门将用身体挡出！2-2，总比分憾平，比赛被拖入加时。你还有时间，但双腿已经开始报警。',formChange:-1}},
    {text:'组织核心 — 全队开花',effects:{'PAS.vision':3,'PAS.shortPassing':2,'DRI.composure':2},consequence:'你上演助攻帽子戏法！3-1，总比分晋级决赛！赛后亚足联官方把"本轮最佳球员"颁给了你。决赛门票，拿到了。',formChange:3,assists:2,flag:'acl_final'},
    {text:'憾负 — 距离决赛一步之遥',effects:{'DRI.composure':2,'PHY.stamina':2},consequence:'对方门将开挂，你四次必进球被扑出。2-2，总比分憾负。回更衣室的路上你一言不发——这个舞台，你还会回来。',formChange:0}
  ]},
{ id:'ch6_acl_title',once:true,chapter:6,priority:2,condition:p=>p.flags.acl_final&&['CSL','J1','K1','SAU','QAT'].includes(p.league),
  narrative:p=>`${continentalName(p)}决赛！亚洲俱乐部足球的最高领奖台，一步之遥。\n\n决赛对阵西亚豪门。赛前，全国的足球频道都在直播，解说嘉宾阵容豪华。"中国球员作为核心出战亚冠决赛"——上一次出现这个说法，还是上个十年。\n\n第88分钟，1-1。你获得了改变历史的最后一次进攻机会：`,
  choices:[
    {text:'绝杀 — 亚洲之巅！',effects:{'SHO.finishing':3,'DRI.composure':3,'PHY.aggression':2},consequence:'你在两人包夹下强行转身抽射——皮球应声入网！2-1！亚冠冠军！！！你被全队抛向夜空，彩带落在你的肩上。中国球员作为绝对核心捧起亚冠——史无前例！',formChange:5,goals:1,flag:'acl_champion',risk:{attr:'SHO.finishing',base:.6},fail:{effects:{'DRI.composure':1},consequence:'你在两人包夹下强行转身抽射——皮球蹭着横梁飞出！终场哨响，1-1，比赛进入加时。你跪在草皮上大口喘气，亚洲之巅的最后一击，失手了。',formChange:-1}},
    {text:'助攻绝杀 — 圆满句号',effects:{'PAS.vision':3,'PAS.shortPassing':2,'DRI.composure':2},consequence:'你精妙直塞撕开最后防线，队友单刀绝杀！2-1！亚冠冠军！你以决赛助攻王的身份捧起奖杯，赛事MVP实至名归！',formChange:4,assists:1,flag:'acl_champion'},
    {text:'点球憾负 — 无冕之王',effects:{'DRI.composure':3,'PHY.stamina':2},consequence:'120分钟战平，点球大战4-5憾负。你罚进了自己的点球，但命运没有站在你们这边。领奖台上你捧着银牌，心里只有一句话：明年再来。',formChange:1}
  ]},
{ id:'ch6_asian_poty',once:true,chapter:6,priority:3,minAge:23,condition:p=>p.flags.nationalMember&&p.ovr>=76,
  narrative:p=>`亚足联年度颁奖晚会在吉隆坡举行。亚洲足球先生候选名单公布——你的名字，第一次出现在中国人的位置上。\n\n和你竞争的，是日本的旅欧王牌和韩国的英超主力。中国球员上次获得这个奖项，要追溯到十几年前。\n\n颁奖前，主持人念出获奖者名字前的最后一句："他改变了世界对亚洲足球东部的认知——"\n\n你屏住呼吸：`,
  choices:[
    {text:'当选 — 中国足球的里程碑',effects:{'DRI.composure':3,'PHY.aggression':2,'SHO.finishing':1},consequence:'"获奖者是——来自中国的${p.name}！！！"全场掌声雷动。你走上台接过奖杯，用中英双语发表了感言："这座奖杯属于所有还在坚持的中国足球人。亚洲之巅，我们来了。"国内热搜爆了整整三天。',formChange:4,flag:'asian_poy'},
    {text:'以微弱差距惜败',effects:{'DRI.composure':2,'PAS.vision':1},consequence:'奖项最终归属了日本球员，但你的名字已经进入了亚洲足球的核心叙事。颁奖嘉宾特意对你说："明年，希望你站在这里。"你点头——一定。',formChange:1},
    {text:'缺席颁奖 — 专注备战',effects:{'PHY.stamina':2,'DRI.composure':2},consequence:'你因为关键战役缺席了颁奖礼，队友代为出席。虽然错过了聚光灯，但你的选择赢得了教练组的最高敬意："职业，太职业了。"',formChange:0}
  ]},
{ id:'ch6_csl_record',once:true,chapter:6,priority:3,minAge:22,condition:p=>isChinaLeague(p)&&!p.isGK&&p.ovr>=74,
  narrative:p=>`联赛还剩五轮，你的赛季进球数来到了29球——距离${'武磊'}保持的中超单赛季进球纪录，只差不到一场球的距离。\n\n全国的体育媒体都开始倒数。"武磊34球的神迹能被打破吗？"成了每轮赛前的保留话题。\n\n第28轮，${p.team}主场。第60分钟，你已经在禁区里等到了那个球——扳平比分的绝佳机会，也是追平纪录的一球：`,
  choices:[
    {text:'两连击 — 追平并反超纪录',effects:{'SHO.finishing':3,'SHO.positioning':2,'DRI.composure':2},consequence:'第60分钟推射扳平（30球），第87分钟单刀反超（31球）！中超单赛季进球纪录正式易主！终场哨响后，武磊本人发来视频祝贺："纪录就是用来打破的，恭喜！中国足球需要你这样的射手。"',formChange:5,goals:2,flag:'csl_record'},
    {text:'全力冲击 — 单场帽子戏法',effects:{'SHO.finishing':3,'DRI.dribbling':2,'PHY.stamina':2},consequence:'你上演帽子戏法！！单赛季32球！！纪录是你的了！赛后你被记者围了半小时，全中国的体育版头条只有一个名字。',formChange:5,goals:3,flag:'csl_record'},
    {text:'团队优先 — 纪录随缘',effects:{'PAS.vision':3,'DRI.composure':2},consequence:'你选择为团队输送炮弹，两场比赛送出三次助攻，球队提前夺冠。纪录虽然没有破，但你赢得了"大局观"的最高评价。来日方长。',formChange:2,assists:2}
  ]},
// ========== 第七章 世界之巅 ==========
{ id:'ch7_ballon_nominee',once:true,chapter:7,priority:1,minAge:23,condition:p=>p.ovr>=84&&isEuropeLeague(p),
  narrative:(p,ctx)=>`巴黎，夏特莱剧院。《法国足球》公布年度金球奖30人候选名单——\n\n "${p.name}（中国，${p.team}）"\n\n金球奖候选人名单历史上，第一次出现中国球员的名字。全球媒体炸锅：BBC："中国足球的历史性一夜"；队报："他凭什么？用20个进球和欧冠四强回答你"。\n\n${ctx.year}年，你的赛季数据：联赛+欧冠的两双成绩单，领跑欧洲助攻榜。\n\n经纪人的电话打来时，你正在加练："记者会、颁奖典礼、时装周邀请……你的生活要变了。准备好了吗？"`,
  choices:[
    {text:'全盘接受 — 让世界看见中国球员',effects:{'DRI.composure':3,'PAS.vision':2,'DRI.reactions':1},consequence:'你走上巴黎的红毯，用三种语言接受了采访。中国足球第一次站在了世界足球的最高舞台上。当晚，国内转播金球奖的收视率超过了春晚。',formChange:3,flag:'ballon_nominee'},
    {text:'低调出席 — 把光环留给球场',effects:{'PHY.stamina':2,'DRI.composure':3},consequence:'你婉拒了大部分活动，只在颁奖夜出现。"球场上的${p.name}才是真正的${p.name}"——这种专注让你在接下来的比赛里连续四场进球。',formChange:2,flag:'ballon_nominee'},
    {text:'婉拒所有 — 我只在乎冠军',effects:{'PHY.aggression':3,'SHO.finishing':2},consequence:'你没有去巴黎，当晚你在健身房加练。队友把现场照片发给你，你只回了一句："把奖杯换成冠军戒指，我就去。"狂，但没人觉得你狂。',formChange:2,flag:'ballon_nominee'}
  ]},
{ id:'ch7_ballon_night',once:true,chapter:7,priority:1,condition:p=>p.flags.ballon_nominee,
  narrative:p=>`金球奖颁奖之夜，夏特莱剧院。\n\n你坐在第三排——这是金球奖历史上中国球员的最高座位。主持人念完第三名、第二名……你的手心全是汗。\n\n"2029年金球奖得主是——"\n\n无论结果如何，这个夜晚已经写进历史。你整理了一下西装：`,
  choices:[
    {text:'登顶 — 亚洲第一人的加冕',effects:{'DRI.composure':3,'PHY.aggression':3,'SHO.finishing':2},consequence:'你听到了自己的名字！金球奖！！！你起身时腿是软的，走上台时全场的亚洲面孔都在起立鼓掌。你举起奖杯，用中文说了最后一句话："谢谢每一个没有放弃中国足球的人。"这一夜，属于14亿人。',formChange:6,flag:'ballon_winner'},
    {text:'第四名 — 与奖杯擦肩',effects:{'DRI.composure':3,'PAS.vision':2},consequence:'第四名——亚洲球员在金球奖的历史最高排名。颁奖嘉宾握着你的手说："你会回来的，带着奖杯。"你微笑点头。欧洲的下一个赛季，已经在你心里排好了片单。',formChange:3,flag:'ballon_top5'},
    {text:'第12名 — 初次登台',effects:{'DRI.composure':2,'PHY.stamina':2},consequence:'第12名——对第一次入围来说已是里程碑。你在后台遇到了儿时偶像，他对你说的那句话你记了一辈子："我看过你的比赛，你比我当年强。"',formChange:2,flag:'ballon_top12'}
  ]},
{ id:'ch7_ucl_final',once:true,chapter:7,priority:2,minAge:23,condition:p=>isEuropeLeague(p)&&p.ovr>=82,
  narrative:p=>`欧冠决赛！${p.team}一路淘汰豪门杀入决赛，你是本季欧冠的助攻王兼射手榜前三。\n\n决赛对手是另一支超级豪门。全球20亿人观看，赛前发布会上记者们的问题只有一个："中国球员能站上欧洲之巅吗？"\n\n第85分钟，1-1。你获得了决定历史的最后机会——禁区前沿，三名防守人：`,
  choices:[
    {text:'封神一战 — 世界波绝杀',effects:{'SHO.longShots':3,'SHO.finishing':3,'DRI.composure':3},consequence:'你晃开角度，起脚——世界波！！！皮球直挂死角！2-1！欧冠冠军！！！中国球员第一次站在欧洲之巅！你冲向看台，泪飞如雨。这一天，被写进了所有语言的足球史。',formChange:6,goals:1,flag:'ucl_champion',risk:{attr:'SHO.longShots',base:.55},fail:{effects:{'SHO.longShots':1},consequence:'你晃开角度起脚——皮球被人墙挡出！对方顺势打出快速反击，全队回追到抽筋才化解险情。世界波变成了角球，你抹了一把脸上的汗水：还有时间，还有机会。',formChange:-1}},
    {text:'助攻绝杀 — 最伟大的一次传球',effects:{'PAS.vision':3,'PAS.shortPassing':3,'DRI.composure':3},consequence:'你吸引了全部三名防守人，在失去平衡瞬间送出贴地直塞——队友推射绝杀！2-1！欧冠冠军！你以决赛MVP的身份捧起大耳朵杯，历史铭记这个助攻。',formChange:6,assists:1,flag:'ucl_champion'},
    {text:'点球大战 — 心跳到底',effects:{'DRI.composure':3,'PHY.stamina':2},consequence:'你顶住压力罚进关键点球，最终点球大战4-3！欧冠冠军！！队友们在草皮上疯狂庆祝，你跪地久久不起——这一刻，所有的坚持都值了。',formChange:5,flag:'ucl_champion'},
    {text:'憾负决赛 — 虽败犹荣',effects:{'DRI.composure':3},consequence:'对手在补时阶段完成绝杀，1-2。你坐在草皮上看着他们庆祝，把这份痛刻进心里。领奖台上的银牌很重，但你知道——明年，这块台子还会等你。',formChange:1,flag:'ucl_final_loss'}
  ]},
{ id:'ch7_legacy',once:true,chapter:7,priority:5,minAge:30,condition:p=>p.ovr>=88,
  narrative:p=>`你的经纪人给你看了一份报告——你的球衣销量连续三年全球前十，你的名字在青少年球员注册数据里被提到最多的位置。\n\n中国的足球学校里，十万个孩子穿着你的号码踢球。解说员的口头禅从"像武磊那样"变成了"像${p.name}那样"。\n\n联赛官方准备为你办一场致敬仪式。${'武磊'}主动提出要来给你颁奖："中国足球等这一天，等了三十年。"\n\n仪式上，主持人问你："这一路，最难的是什么？"`,
  choices:[
    {text:'"是从没有人走过的路"',effects:{'DRI.composure':3,'PAS.vision':3,'PHY.aggression':2},consequence:'你的回答被印在了全国青训营的墙上。从16岁到今天，你走的每一步都是无人区的第一步。史无前例——这四个字，就是你的传记书名。',formChange:3,flag:'living_legend'},
    {text:'"是每个赛季都要回答同一个问题：够不够？"',effects:{'PHY.stamina':3,'SHO.finishing':2,'DRI.composure':2},consequence:'你说出了职业球员最真实的孤独：永远不够好，永远要更好。台下的年轻球员听哭了。这份坦诚，让你的人格魅力更上一层楼。',formChange:3,flag:'living_legend'},
    {text:'"最难的是让后来人相信：路是通的"',effects:{'PAS.vision':3,'DRI.composure':3,'PHY.stamina':1},consequence:'你宣布设立青少年足球基金，把商业收入的10%捐给偏远地区青训。掌声雷动。从球员到图腾，你完成了最后的蜕变。',formChange:3,flag:'living_legend'}
  ]},
// ========== 里程碑（生涯数据驱动，一次性） ==========
{ id:'ms_50_apps',once:true,priority:6,condition:p=>p.careerAppearances>=50,
  narrative:p=>`对阵老对手的比赛日，赛前俱乐部为你举行了简短仪式——职业生涯第50场！\n\n大屏幕播放了你从梯队到一线队的进球集锦，看台打出Tifo："50场，才刚刚开始。"\n\n${coachLine(p.team)?coachLine(p.team)+'在更衣室说："50场是职业球员的成人礼。有人50场就退役了，有人50场才开始封神。你是哪种？"':'教练在更衣室说："50场是职业球员的成人礼。你是哪种？"'}\n\n这场比赛，你想怎么踢？`,
  choices:[
    {text:'用进球致敬里程碑',effects:{'SHO.finishing':2,'DRI.composure':2,'SHO.positioning':1},consequence:'你打入了里程碑之夜的制胜球！赛后把球袜脱下来扔给看台上的孩子——这颗球的故事，又多了一章。',formChange:2,goals:1},
    {text:'两助攻 — 团队之夜',effects:{'PAS.vision':3,'PAS.shortPassing':1},consequence:'你用两次助攻庆祝了自己的50场。"最好的里程碑礼物，是让队友进球"——这句话上了赛后新闻标题。',formChange:2,assists:2},
    {text:'零封/零失误的稳健之夜',effects:{'DEF.defensiveAwareness':2,'DRI.composure':2},consequence:'你贡献了零失误的一夜，球队的胜利有你的一半。50场，稳稳当当，未来可期。',formChange:1}
  ]},
{ id:'ms_100_apps',once:true,priority:6,condition:p=>p.careerAppearances>=100,
  narrative:p=>`职业生涯第100场！俱乐部的致敬视频里，剪入了你签约那天青涩的采访——"我的目标是踢上职业联赛。"\n\n如今你已是这支球队的中流砥柱。看台上，你的父母第一次同时来到现场——妈妈举着灯牌，爸爸假装淡定却在抹眼角。\n\n百场之夜，恰好又是一场硬仗：`,
  choices:[
    {text:'一锤定音 — 百场之夜绝杀',effects:{'SHO.finishing':3,'DRI.composure':3},consequence:'第89分钟你完成绝杀！！百场之夜的完美剧本！你跑向看台和父母拥抱，妈妈哭成了泪人。这一晚的照片，后来成了你社交媒体的置顶。',formChange:4,goals:1},
    {text:'队长级表现 — 攻防全能',effects:{'PAS.vision':2,'DEF.defensiveAwareness':2,'PHY.stamina':2},consequence:'你跑动全场第一、传球成功率最高、还有一次门线解围。百场之夜，你像队长一样扛着球队前行。',formChange:3},
    {text:'把主角位置让给新人',effects:{'PAS.vision':3,'DRI.composure':2},consequence:'你多次为年轻队友做饼，他打入职业生涯首球后第一个跑向你拥抱。传承，是百场老将最帅的样子。',formChange:2,assists:1}
  ]},
{ id:'ms_50_goals',once:true,priority:6,condition:p=>!p.isGK&&p.careerGoals>=50,
  narrative:p=>`生涯50球达成之夜，一个特殊嘉宾出现在你的更衣室——${'武磊'}。\n\n"50球，我当年也经过，"他笑着说，"接下来你会知道，进球会越来越难，也会越来越爽。"\n\n他送了你一双签名球鞋，鞋盒上写着一行字："中国前锋的接力棒，交给你了。"\n\n当晚的比赛中，你距离51球只差一次射门的机会：`,
  choices:[
    {text:'接住接力棒 — 打进第51球',effects:{'SHO.finishing':3,'DRI.composure':2,'SHO.positioning':1},consequence:'球进了！51球！你对着转播镜头举起那双签名球鞋——接力棒，接住了。武磊在看台上为你鼓掌的画面，成了中国足球的传承名场面。',formChange:3,goals:1},
    {text:'送出两次助攻 — 另一种传承',effects:{'PAS.vision':3,'PAS.shortPassing':2},consequence:'你把进球机会分给了队友，自己收获两次助攻。"50球先生"的团队之夜，同样被媒体盛赞。',formChange:2,assists:2},
    {text:'零射门机会 — 憋着一股劲',effects:{'DRI.composure':2,'PHY.aggression':1},consequence:'对方把你防得严严实实，你全场只有一次勉强的射门。赛后你留在场内加练到深夜——51球，就在下一场。',formChange:1}
  ]},
{ id:'ms_100_goals',once:true,priority:6,condition:p=>!p.isGK&&p.careerGoals>=100,
  narrative:p=>`生涯第100球！中国男足球员百球俱乐部的新成员——而且你的进球含金量被数据机构评为"近二十年最高"：欧冠、世预赛、亚洲杯、亚冠、联赛淘汰赛，样样都有。\n\n赛前，大屏幕上播放了你的百球全纪录，最后一个镜头是你16岁青训时期的采访："我想成为世界级球员。"\n\n全场起立鼓掌。你走进球场，百球之夜正式开始：`,
  choices:[
    {text:'101球 — 用标志性方式庆祝',effects:{'SHO.finishing':3,'DRI.composure':3,'SHO.positioning':2},consequence:'你用最擅长的标志性问题打入第101球！庆祝动作是你16岁时的招牌——那个从青训场带出来的庆祝。时光跨越十年，初心未改。',formChange:4,goals:1},
    {text:'大四喜 — 百球之夜封神',effects:{'SHO.finishing':3,'DRI.dribbling':2,'PHY.stamina':2},consequence:'四球！！！你上演大四喜把百球之夜变成了个人表演赛！赛后对方主帅都来要你的球衣："这是会被写进历史的夜晚，谢谢你的表演。"',formChange:5,goals:4},
    {text:'助攻+让点 — 温柔的百球夜',effects:{'PAS.vision':3,'DRI.composure':2},consequence:'你把点球让给了状态低迷的年轻队友，又助攻他打入第二球。年轻人的信心回来了，而你的百球之夜，因为他而更加特别。',formChange:2,assists:2}
  ]}
];
const EVENT_POOL=GENERIC_EVENTS.concat(STORY_EVENTS);
