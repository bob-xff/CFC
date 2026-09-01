// ============ ICONS (SVG, no emoji) ============
const ICONS={
  plus:'<svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>',
  folder:'<svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>',
  trash:'<svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6"/></svg>',
  back:'<svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M11 18l-6-6 6-6"/></svg>',
  menu:'<svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M3 12h18M3 18h18"/></svg>',
  save:'<svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><path d="M17 21v-8H7v8M7 3v5h8"/></svg>',
  'save-exit':'<svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><path d="M17 21v-8H7v8"/><path d="M13 12h6m-2-2 2 2-2 2"/></svg>',
  logout:'<svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>',
  power:'<svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M18.4 6.6a9 9 0 1 1-12.8 0M12 2v10"/></svg>',
  flag:'<svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 21V4M5 5h13l-3 4 3 4H5"/></svg>',
  clipboard:'<svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h3a1 1 0 0 1 1 1v15a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h3"/><path d="M9 12h6M9 16h4"/></svg>',
  football:'<svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7.2l3.4 2.4-1.3 4.2h-4.2l-1.3-4.2z"/><path d="M12 7.2V3.8M15.4 9.6l3.2-1.5M14.1 13.8l2.7 2.7M9.9 13.8l-2.7 2.7M8.6 9.6 5.4 8.1"/></svg>',
  star:'<svg class="svg-icon" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 2.6l2.9 6 6.6.8-4.9 4.5 1.3 6.5-5.9-3.2-5.9 3.2 1.3-6.5L2.5 9.4l6.6-.8z"/></svg>',
  check:'<svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>',
  'chevron-right':'<svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>',
  home:'<svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h5v-6h4v6h5V9.5"/></svg>',
  trend:'<svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/></svg>',
  chart:'<svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20V10M10 20V4M16 20v-7M21 20H3"/></svg>',
  trophy:'<svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M8 21h8M12 17v4M7 4h10v6a5 5 0 0 1-10 0z"/><path d="M7 6H4a3 3 0 0 0 3 5M17 6h3a3 3 0 0 1-3 5"/></svg>',
  clock:'<svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>',
  target:'<svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/></svg>',
  globe:'<svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.6 4 5.6 4 9s-1.5 6.4-4 9c-2.5-2.6-4-5.6-4-9s1.5-6.4 4-9z"/></svg>',
  shirt:'<svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3 4 6l2 4 2-1v12h8V9l2 1 2-4-4-3a4 4 0 0 1-8 0z"/></svg>',
  calendar:'<svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 10h18"/></svg>',
  users:'<svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.5 3.4-5.5 6.5-5.5s5.7 2 6.5 5.5"/><circle cx="17.5" cy="9" r="2.5"/><path d="M17 14.6c2.4.4 4 2 4.5 4.4"/></svg>',
  medal:'<svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 15a5 5 0 1 0 0-10 5 5 0 0 0 0 10z"/><path d="M8.5 13.5 6 22l6-3 6 3-2.5-8.5"/></svg>',
  fast:'<svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5l7 7-7 7M13 5l7 7-7 7"/></svg>'
};
function injectIcons(){
  document.querySelectorAll('[data-icon]').forEach(el=>{
    const name=el.getAttribute('data-icon');
    if(ICONS[name])el.innerHTML=ICONS[name];
  });
}
function starRow(n){
  let s='';
  for(let i=0;i<Math.max(0,Math.min(5,n||0));i++)s+=ICONS.star;
  return s;
}
function getLogo(kind,key){
  try{
    if(kind==='team'&&LOGOS.teams&&LOGOS.teams[key])return LOGOS.teams[key];
    if(kind==='league'&&LOGOS.leagues&&LOGOS.leagues[key])return LOGOS.leagues[key];
  }catch(e){}
  return null;
}
function monoText(name){
  if(!name)return'FC';
  const s=name.trim();
  if(/[\u4e00-\u9fff]/.test(s))return s.slice(0,2);
  const letters=s.replace(/[^A-Za-z]/g,'');
  return (letters.slice(0,3)||s.slice(0,2)).toUpperCase();
}
function monoHTML(name,cls){
  return '<span class="mono '+cls+'">'+monoText(name)+'</span>';
}
function crestHTML(kind,key,cls){
  cls=cls||'crest';
  // 联赛标志为宽幅字标（非方形），用专用宽框避免压扁/留白失衡
  if(kind==='league')cls+=' crest-league';
  const path=getLogo(kind,key);
  const name=key||'';
  if(path){
    return '<img class="'+cls+'" src="'+path+'" alt="" loading="lazy" onerror="this.outerHTML=monoHTML('+JSON.stringify(name)+',\''+cls+'\')">';
  }
  return monoHTML(name,cls);
}
function initSplash(){
  const logo=document.getElementById('splash-logo');
  if(logo&&typeof CFC_LOGO_SPLASH!=='undefined'&&CFC_LOGO_SPLASH)logo.src=CFC_LOGO_SPLASH;
  const splash=document.getElementById('splash-screen');
  if(!splash)return;
  setTimeout(function(){
    splash.classList.add('fade-out');
    setTimeout(function(){
      splash.classList.remove('active');
      splash.classList.remove('fade-out');
      showScreen('start-screen');
    },560);
  },2350);
}
// ============ DATA ============
const LEAGUES={
  CSL:{name:'中超联赛',country:'中国',tier:3,cup:'足协杯',continental:'亚冠精英赛',factor:.95,teams:['上海海港','上海申花','山东泰山','北京国安','成都蓉城','天津津门虎','浙江队','武汉三镇','河南队','青岛西海岸','青岛海牛','深圳新鹏城','大连英博','云南玉昆','辽宁铁人','重庆铜梁龙']},
  CL1:{name:'中甲联赛',country:'中国',tier:4,cup:'足协杯',continental:null,factor:.8,teams:['长春亚泰','梅州客家','广州队','广东广州豹','苏州东吴','南京城市','佛山南狮','石家庄功夫','无锡吴钩','延边龙鼎','黑龙江冰城','上海嘉定汇龙']},
  EPL:{name:'英超联赛',country:'英格兰',tier:1,cup:'足总杯',continental:'欧冠',factor:1.0,teams:['曼城','利物浦','阿森纳','切尔西','曼联','热刺','纽卡斯尔','阿斯顿维拉','布莱顿','西汉姆联','埃弗顿','富勒姆']},
  LALIGA:{name:'西甲联赛',country:'西班牙',tier:1,cup:'国王杯',continental:'欧冠',factor:1.0,teams:['皇家马德里','巴塞罗那','马德里竞技','塞维利亚','皇家社会','比利亚雷亚尔','皇家贝蒂斯','瓦伦西亚','毕尔巴鄂竞技','赫罗纳']},
  SERIE_A:{name:'意甲联赛',country:'意大利',tier:1,cup:'意大利杯',continental:'欧冠',factor:1.0,teams:['国际米兰','尤文图斯','AC米兰','那不勒斯','罗马','拉齐奥','亚特兰大','佛罗伦萨','博洛尼亚','都灵']},
  BUNDESLIGA:{name:'德甲联赛',country:'德国',tier:1,cup:'德国杯',continental:'欧冠',factor:.98,teams:['拜仁慕尼黑','多特蒙德','RB莱比锡','勒沃库森','法兰克福','沃尔夫斯堡','门兴格拉德巴赫','弗赖堡','斯图加特','美因茨']},
  LIGUE_1:{name:'法甲联赛',country:'法国',tier:1,cup:'法国杯',continental:'欧冠',factor:.95,teams:['巴黎圣日耳曼','马赛','摩纳哥','里昂','里尔','尼斯','雷恩','朗斯','斯特拉斯堡','南特']},
  EREDIVISIE:{name:'荷甲联赛',country:'荷兰',tier:2,cup:'荷兰杯',continental:'欧冠/欧联',factor:.95,teams:['阿贾克斯','PSV埃因霍温','费耶诺德','阿尔克马尔','特温特','乌德勒支','海伦芬']},
  LIGA_PT:{name:'葡超联赛',country:'葡萄牙',tier:2,cup:'葡萄牙杯',continental:'欧冠/欧联',factor:.9,teams:['本菲卡','波尔图','里斯本竞技','布拉加','吉马良斯','博阿维斯塔']},
  BRA:{name:'巴西甲级联赛',country:'巴西',tier:2,cup:'巴西杯',continental:'南美解放者杯',factor:.9,teams:['弗拉门戈','帕尔梅拉斯','博塔弗戈','科林蒂安','圣保罗','米内罗竞技','格雷米奥','巴西国际','弗鲁米嫩塞','桑托斯']},
  ARG:{name:'阿根廷甲级联赛',country:'阿根廷',tier:2,cup:'阿根廷杯',continental:'南美解放者杯',factor:.9,teams:['博卡青年','河床','独立','竞技俱乐部','圣洛伦索','纽维尔老男孩','萨斯菲尔德','拉努斯']},
  MLS:{name:'美国职业大联盟',country:'美国',tier:2,cup:'美国公开杯',continental:'中北美冠军杯',factor:.95,teams:['迈阿密国际','洛杉矶FC','纽约城','西雅图海湾人','亚特兰大联','多伦多FC','温哥华白帽','芝加哥火焰']},
  J1:{name:'日本J联赛',country:'日本',tier:2,cup:'天皇杯',continental:'亚冠精英赛',factor:.85,teams:['横滨水手','川崎前锋','浦和红钻','鹿岛鹿角','神户胜利船','广岛三箭','名古屋鲸八','大阪樱花']},
  K1:{name:'韩国K联赛',country:'韩国',tier:2,cup:'韩国足协杯',continental:'亚冠精英赛',factor:.85,teams:['蔚山HD','全北现代','浦项制铁','首尔FC','水原三星','大邱FC','光州FC','仁川联']},
  SAU:{name:'沙特职业联赛',country:'沙特阿拉伯',tier:2,cup:'沙特国王杯',continental:'亚冠精英赛',factor:.9,teams:['利雅得新月','利雅得胜利','吉达联合','吉达国民','利雅得青年人','布赖代合作','达曼协作']},
  QAT:{name:'卡塔尔星联赛',country:'卡塔尔',tier:2,cup:'卡塔尔酋长杯',continental:'亚冠精英赛',factor:.85,teams:['萨德','杜海勒','赖扬','加拉法','沃克拉','乌姆沙拉尔']}
};
const ACADEMY_CLUBS=['上海海港','山东泰山','上海申花','北京国安','成都蓉城','武汉三镇','浙江队','天津津门虎','河南队','青岛西海岸','深圳新鹏城','大连英博','云南玉昆','重庆铜梁龙','辽宁铁人','青岛海牛'];
const ACADEMY_BONUS={'上海海港':5,'山东泰山':5,'上海申花':5,'北京国安':4,'成都蓉城':4,'浙江队':3,'武汉三镇':3,'天津津门虎':3,'河南队':2,'青岛西海岸':2,'深圳新鹏城':2,'大连英博':2,'云南玉昆':2,'重庆铜梁龙':2,'辽宁铁人':2,'青岛海牛':1};
// ============ 真实球星数据（2026 现实阵容快照） ============
const TEAM_STARS={
  '上海海港':['武磊','蒋光太','蒯纪闻'],'上海申花':['朱辰杰','刘诚宇','安德烈·路易斯'],'山东泰山':['克雷桑','谢文能','王大雷'],
  '北京国安':['法比奥','张玉宁','塞尔吉尼奥'],'成都蓉城':['韦世豪','胡荷韬','罗慕洛'],'天津津门虎':['王秋明','谢维军','哈达斯'],
  '浙江队':['王钰栋','弗兰克','程进'],'武汉三镇':['马尔康','邓涵文','刘殿座'],'河南队':['王上源','黄紫昌','纳萨里奥'],
  '青岛西海岸':['阿兰','张修维','戴维森'],'青岛海牛':['牟鹏飞','王建明'],'深圳新鹏城':['拜合拉木','安德拉德','姜至鹏'],
  '大连英博':['毛伟杰','吕鹏','阎相闯'],'云南玉昆':['侯永永','穆谢奎','陈宇浩'],'辽宁铁人':['姆本扎','桂宏','安以恩'],'重庆铜梁龙':['向余望','宋攀'],
  '长春亚泰':['谭龙','么旭辰'],'梅州客家':['罗德里格','陈哲超'],'广州队':['侯煜','杨浩'],'广东广州豹':['陈国抗','夏达龙'],
  '苏州东吴':['张凌峰','唐创'],'南京城市':['马龙','邓宇彪'],'佛山南狮':['张兴博','宋润潼'],
  '石家庄功夫':['奥拉维奥'],'无锡吴钩':['龚正','同乐'],'延边龙鼎':['金泰延','李龙'],'黑龙江冰城':['范博健','任江隆'],'上海嘉定汇龙':['林创利'],
  '曼城':['哈兰德','罗德里','福登'],'利物浦':['萨拉赫','维尔茨','范戴克'],'阿森纳':['萨卡','约克雷斯','厄德高'],
  '切尔西':['帕尔默','若昂·佩德罗','恩佐'],'曼联':['布鲁诺·费尔南德斯','库尼亚','塞斯科'],'热刺':['西蒙斯','罗梅罗','麦迪逊'],
  '纽卡斯尔':['沃尔特马德','吉马良斯','托纳利'],'阿斯顿维拉':['沃特金斯','麦金'],'布莱顿':['三笘薰','鲁特'],
  '西汉姆联':['鲍恩','帕奎塔'],'埃弗顿':['格拉利什','皮克福德','恩迪亚耶'],'富勒姆':['希门尼斯','伊沃比'],
  '皇家马德里':['姆巴佩','维尼修斯','贝林厄姆'],'巴塞罗那':['亚马尔','佩德里','拉什福德'],'马德里竞技':['阿尔瓦雷斯','格列兹曼'],
  '塞维利亚':['卢克巴基奥','苏索'],'皇家社会':['久保建英','奥亚萨瓦尔'],'比利亚雷亚尔':['帕雷霍','杰拉德·莫雷诺'],
  '皇家贝蒂斯':['伊斯科','安东尼'],'瓦伦西亚':['佩佩卢','杜罗'],'毕尔巴鄂竞技':['尼科·威廉姆斯','伊纳基·威廉姆斯'],
  '赫罗纳':['齐甘科夫','斯图亚尼'],
  '国际米兰':['劳塔罗','巴雷拉','图拉姆'],'尤文图斯':['伊尔迪兹','弗拉霍维奇'],'AC米兰':['莱奥','特奥','普利希奇'],
  '那不勒斯':['德布劳内','麦克托米奈','卢卡库'],'罗马':['迪巴拉','佩莱格里尼'],'拉齐奥':['扎卡尼','贡多齐'],
  '亚特兰大':['卢克曼','德凯特拉雷'],'佛罗伦萨':['基恩','古德蒙德松'],'博洛尼亚':['奥索利尼','卡斯特罗'],'都灵':['亚当斯','弗拉西奇'],
  '拜仁慕尼黑':['凯恩','穆西亚拉','奥利塞'],'多特蒙德':['吉拉西','布兰特','拜尔'],'RB莱比锡':['班萨','奥尔班'],
  '勒沃库森':['格里马尔多','蒂尔曼','帕拉西奥斯'],'法兰克福':['格策','图塔'],'沃尔夫斯堡':['温德','阿诺德'],
  '门兴格拉德巴赫':['克莱因丁斯特','普莱亚'],'弗赖堡':['格里福','堂安律'],'斯图加特':['温达夫','米约'],'美因茨':['伯卡特','阿米里'],
  '巴黎圣日耳曼':['登贝莱','克瓦拉茨赫利亚','巴尔科拉'],'马赛':['格林伍德','霍伊别尔'],'摩纳哥':['恩博洛','扎卡里亚'],
  '里昂':['拉卡泽特','托利索'],'里尔':['安德烈','哈拉尔德松'],'尼斯':['拉博德','盖桑'],
  '雷恩':['布拉斯','古伊里'],'朗斯':['索托卡','弗兰科夫斯基'],'斯特拉斯堡':['埃梅加','巴夸'],'南特':['西蒙','莫莱'],
  '阿贾克斯':['泰勒','贝尔赫伊斯'],'PSV埃因霍温':['佩里西奇','卢克·德容'],'费耶诺德':['派尚','哈吉·穆萨'],
  '阿尔克马尔':['帕罗特','克拉西'],'特温特':['斯滕斯','范沃尔夫斯温克尔'],'乌德勒支':['斯特鲁克'],'海伦芬':['尼古拉森'],
  '本菲卡':['帕夫利季斯','奥塔门迪'],'波尔图':['加莱诺','萨穆·阿格霍瓦'],'里斯本竞技':['佩德罗·贡萨尔维斯','特林康'],
  '布拉加':['布鲁马','霍塔'],'吉马良斯':['若塔·席尔瓦'],'博阿维斯塔':['雷西尼奥'],
  '弗拉门戈':['佩德罗','德阿拉斯卡埃塔'],'帕尔梅拉斯':['罗克','埃斯特瓦奥'],'博塔弗戈':['阿尔马达','伊戈尔·赫苏斯'],
  '科林蒂安':['德佩','尤里·阿尔贝托'],'圣保罗':['卢西亚诺','卡莱里'],'米内罗竞技':['胡尔克','保利尼奥'],
  '格雷米奥':['克里斯塔尔多','布莱斯维特'],'巴西国际':['阿兰·帕特里克','恩内里'],'弗鲁米嫩塞':['甘索','阿里亚斯'],'桑托斯':['内马尔','吉列尔梅'],
  '博卡青年':['卡瓦尼','罗霍'],'河床':['博尔哈'],'独立':['弗塔'],'竞技俱乐部':['西加里尼'],
  '圣洛伦索':['巴尔加斯'],'纽维尔老男孩':['贝尼特斯'],'萨斯菲尔德':['博乌'],'拉努斯':['佩蒂特'],
  '迈阿密国际':['梅西','德保罗','阿尔巴'],'洛杉矶FC':['孙兴慜','博安加'],'纽约城':['圣地亚哥·罗德里格斯'],
  '西雅图海湾人':['鲁伊迪亚斯','莫里斯'],'亚特兰大联':['阿尔马达','蒂亚戈'],'多伦多FC':['贝尔纳代斯基','因西涅'],
  '温哥华白帽':['穆勒','高尔德'],'芝加哥火焰':['沙奇里','阿科斯塔'],
  '横滨水手':['安德森·洛佩斯','马特乌斯'],'川崎前锋':['马尔西尼奥','家长昭博'],'浦和红钻':['酒井宏树','蒂亚戈'],
  '鹿岛鹿角':['铃木优磨','三竿健斗'],'神户胜利船':['大迫勇也','武藤嘉纪'],'广岛三箭':['满田诚','加藤陆次树'],
  '名古屋鲸八':['永井谦佑'],'大阪樱花':['香川真司'],
  '蔚山HD':['周敏圭','严原上'],'全北现代':['文宣民','金镇圭'],'浦项制铁':['郑在熙'],'首尔FC':['林加德','奇诚庸'],
  '水原三星':['千成熏'],'大邱FC':['塞西尼亚'],'光州FC':['阿萨尼'],'仁川联':['穆戈萨'],
  '利雅得新月':['内维斯','努涅斯','米林科维奇'],'利雅得胜利':['C罗','马内'],'吉达联合':['本泽马','坎特','迪亚比'],
  '吉达国民':['马赫雷斯','伊万·托尼'],'利雅得青年人':['博纳文图拉'],'布赖代合作':['梅德兰'],'达曼协作':['维纳尔杜姆'],
  '萨德':['阿克拉姆·阿菲夫','乌姆蒂蒂'],'杜海勒':['阿尔莫埃兹·阿里'],'赖扬':['罗杰·格德斯'],
  '加拉法':['约韦尔季奇'],'沃克拉':['洛伦西'],'乌姆沙拉尔':['穆罕默德·瓦利德']
};
// ============ 真实主教练（2026 在任快照） ============
const TEAM_COACHES={
  '上海海港':'穆斯卡特','上海申花':'斯卢茨基','山东泰山':'韩鹏','北京国安':'塞蒂恩','天津津门虎':'于根伟',
  '浙江队':'卡内达','武汉三镇':'邓卓翔','河南队':'拉莫斯','青岛西海岸':'前田浩二','青岛海牛':'亚森',
  '深圳新鹏城':'拉坦齐奥','大连英博':'李国旭','云南玉昆':'安德森','辽宁铁人':'徐正源','重庆铜梁龙':'刘建业','长春亚泰':'谢晖',
  '曼城':'瓜迪奥拉','利物浦':'斯洛特','阿森纳':'阿尔特塔','切尔西':'马雷斯卡','曼联':'阿莫林','热刺':'弗兰克',
  '纽卡斯尔':'埃迪·豪','阿斯顿维拉':'埃梅里','皇家马德里':'哈维·阿隆索','巴塞罗那':'弗里克','马德里竞技':'西蒙尼',
  '国际米兰':'齐沃','尤文图斯':'图多尔','AC米兰':'阿莱格里','那不勒斯':'孔蒂','罗马':'加斯佩里尼',
  '拜仁慕尼黑':'孔帕尼','多特蒙德':'科瓦奇','勒沃库森':'许尔曼德','巴黎圣日耳曼':'恩里克','马赛':'德泽尔比',
  'PSV埃因霍温':'博斯','费耶诺德':'范佩西','阿贾克斯':'海廷加','里斯本竞技':'博尔热斯',
  '利雅得新月':'因扎吉','迈阿密国际':'马斯切拉诺'
};
// 游戏版本号：每次发版更新此处，右上角/加载页/游戏菜单自动同步
const GAME_VERSION='V2.1.1';
const NT_COACH='邵佳一';
const NT_CAPTAIN='王大雷';
// ============ 真实名宿 / 媒体 / 同辈新星 ============
const MENTORS=['范志毅','杨晨','孙继海','郑智','蒿俊闵','李玮锋'];
const MEDIA_PEOPLE={commentator:['詹俊','黄健翔','刘建宏'],journalist:['马德兴'],pundit:['董路']};
const PEER_GENIUSES=[['王钰栋','浙江队'],['刘诚宇','上海申花'],['蒯纪闻','上海海港'],['胡荷韬','成都蓉城'],['依木兰','山东泰山'],['毛伟杰','大连英博'],['向余望','重庆铜梁龙'],['李新翔','上海海港'],['拜合拉木','深圳新鹏城'],['谢文能','山东泰山']];
// ============ 地理：俱乐部所在城市 / 德比 / 语言 ============
const CLUB_CITY={
  '上海海港':'上海','上海申花':'上海','山东泰山':'济南','北京国安':'北京','成都蓉城':'成都','天津津门虎':'天津','浙江队':'杭州','武汉三镇':'武汉','河南队':'郑州','青岛西海岸':'青岛','青岛海牛':'青岛','深圳新鹏城':'深圳','大连英博':'大连','云南玉昆':'昆明','辽宁铁人':'沈阳','重庆铜梁龙':'重庆',
  '长春亚泰':'长春','梅州客家':'梅州','广州队':'广州','广东广州豹':'广州','苏州东吴':'苏州','南京城市':'南京','佛山南狮':'佛山','石家庄功夫':'石家庄','无锡吴钩':'无锡','延边龙鼎':'延吉','黑龙江冰城':'哈尔滨','上海嘉定汇龙':'上海',
  '皇家马德里':'马德里','巴塞罗那':'巴塞罗那','马德里竞技':'马德里','塞维利亚':'塞维利亚','皇家社会':'圣塞巴斯蒂安','比利亚雷亚尔':'比利亚雷亚尔','皇家贝蒂斯':'塞维利亚','瓦伦西亚':'瓦伦西亚','毕尔巴鄂竞技':'毕尔巴鄂','赫罗纳':'赫罗纳',
  '曼城':'曼彻斯特','利物浦':'利物浦','阿森纳':'伦敦','切尔西':'伦敦','曼联':'曼彻斯特','热刺':'伦敦','纽卡斯尔':'纽卡斯尔','阿斯顿维拉':'伯明翰','布莱顿':'布莱顿','西汉姆联':'伦敦','埃弗顿':'利物浦','富勒姆':'伦敦',
  '国际米兰':'米兰','尤文图斯':'都灵','AC米兰':'米兰','那不勒斯':'那不勒斯','罗马':'罗马','拉齐奥':'罗马','亚特兰大':'贝加莫','佛罗伦萨':'佛罗伦萨','博洛尼亚':'博洛尼亚','都灵':'都灵',
  '拜仁慕尼黑':'慕尼黑','多特蒙德':'多特蒙德','RB莱比锡':'莱比锡','勒沃库森':'勒沃库森','法兰克福':'法兰克福','沃尔夫斯堡':'沃尔夫斯堡','门兴格拉德巴赫':'门兴格拉德巴赫','弗赖堡':'弗赖堡','斯图加特':'斯图加特','美因茨':'美因茨',
  '巴黎圣日耳曼':'巴黎','马赛':'马赛','摩纳哥':'摩纳哥','里昂':'里昂','里尔':'里尔','尼斯':'尼斯','雷恩':'雷恩','朗斯':'朗斯','斯特拉斯堡':'斯特拉斯堡','南特':'南特',
  '阿贾克斯':'阿姆斯特丹','PSV埃因霍温':'埃因霍温','费耶诺德':'鹿特丹','阿尔克马尔':'阿尔克马尔','特温特':'恩斯赫德','乌德勒支':'乌德勒支','海伦芬':'海伦芬',
  '本菲卡':'里斯本','波尔图':'波尔图','里斯本竞技':'里斯本','布拉加':'布拉加','吉马良斯':'吉马良斯','博阿维斯塔':'波尔图',
  '弗拉门戈':'里约热内卢','帕尔梅拉斯':'圣保罗','博塔弗戈':'里约热内卢','科林蒂安':'圣保罗','圣保罗':'圣保罗','米内罗竞技':'贝洛奥里藏特','格雷米奥':'阿雷格里港','巴西国际':'阿雷格里港','弗鲁米嫩塞':'里约热内卢','桑托斯':'桑托斯',
  '博卡青年':'布宜诺斯艾利斯','河床':'布宜诺斯艾利斯','独立':'阿韦亚内达','竞技俱乐部':'阿韦亚内达','圣洛伦索':'布宜诺斯艾利斯','纽维尔老男孩':'罗萨里奥','萨斯菲尔德':'布宜诺斯艾利斯','拉努斯':'拉努斯',
  '迈阿密国际':'迈阿密','洛杉矶FC':'洛杉矶','纽约城':'纽约','西雅图海湾人':'西雅图','亚特兰大联':'亚特兰大','多伦多FC':'多伦多','温哥华白帽':'温哥华','芝加哥火焰':'芝加哥',
  '横滨水手':'横滨','川崎前锋':'川崎','浦和红钻':'埼玉','鹿岛鹿角':'鹿岛','神户胜利船':'神户','广岛三箭':'广岛','名古屋鲸八':'名古屋','大阪樱花':'大阪',
  '蔚山HD':'蔚山','全北现代':'全州','浦项制铁':'浦项','首尔FC':'首尔','水原三星':'水原','大邱FC':'大邱','光州FC':'光州','仁川联':'仁川',
  '利雅得新月':'利雅得','利雅得胜利':'利雅得','吉达联合':'吉达','吉达国民':'吉达','利雅得青年人':'利雅得','布赖代合作':'布赖代','达曼协作':'达曼',
  '萨德':'多哈','杜海勒':'多哈','赖扬':'赖扬','加拉法':'多哈','沃克拉':'沃克拉','乌姆沙拉尔':'乌姆沙拉尔'
};
const DERBIES={
  '上海海港|上海申花':'上海德比','北京国安|天津津门虎':'京津德比','山东泰山|青岛海牛':'齐鲁德比','山东泰山|青岛西海岸':'齐鲁德比',
  '青岛西海岸|青岛海牛':'青岛德比','成都蓉城|重庆铜梁龙':'成渝德比','大连英博|辽宁铁人':'东北德比','广州队|广东广州豹':'广州德比',
  '长春亚泰|辽宁铁人':'东北德比','皇家马德里|巴塞罗那':'国家德比','皇家马德里|马德里竞技':'马德里德比','皇家马德里|赫罗纳':'加泰罗尼亚客战',
  '巴塞罗那|西班牙人':'加泰德比','曼城|曼联':'曼彻斯特德比','利物浦|曼联':'双红会','利物浦|埃弗顿':'默西塞德德比',
  '阿森纳|热刺':'北伦敦德比','阿森纳|切尔西':'伦敦德比','阿森纳|富勒姆':'伦敦德比','阿森纳|西汉姆联':'伦敦德比',
  '切尔西|富勒姆':'伦敦德比','切尔西|西汉姆联':'伦敦德比','热刺|西汉姆联':'伦敦德比','西汉姆联|富勒姆':'伦敦德比',
  '国际米兰|AC米兰':'米兰德比','国际米兰|尤文图斯':'意大利国家德比','国际米兰|拉齐奥':'蓝黑对决','AC米兰|尤文图斯':'意甲双雄会',
  '拜仁慕尼黑|多特蒙德':'德国国家德比','勒沃库森|多特蒙德':'鲁尔区旁的对决','巴黎圣日耳曼|马赛':'法国国家德比',
  '里昂|圣埃蒂安':'罗讷河畔德比','阿贾克斯|PSV埃因霍温':'荷兰国家德比','阿贾克斯|费耶诺德':'荷兰经典战',
  '本菲卡|波尔图':'葡萄牙国家德比','本菲卡|里斯本竞技':'里斯本德比','博卡青年|河床':'阿根廷超级德比',
  '弗拉门戈|博塔弗戈':'里约德比','弗拉门戈|弗鲁米嫩塞':'里约德比','科林蒂安|帕尔梅拉斯':'圣保罗州德比','科林蒂安|圣保罗':'圣保罗德比',
  '利雅得新月|利雅得胜利':'利雅得德比','利雅得新月|吉达联合':'沙特天王山','川崎前锋|横滨水手':'神奈川德比',
  '浦和红钻|川崎前锋':'埼玉神奈川对决','蔚山HD|全北现代':'现代德比','首尔FC|水原三星':'京畿道德比'
};
function derbyKey(a,b){return [a,b].sort().join('|')}
function rivalOf(p){
  const lg=LEAGUES[p.league];if(!lg)return null;
  const cands=lg.teams.filter(t=>t!==p.team&&DERBIES[derbyKey(t,p.team)]);
  if(!cands.length)return null;
  return{team:cands[Math.floor(Math.random()*cands.length)],name:DERBIES[derbyKey(cands[0],p.team)]};
}
const LEAGUE_LANG={CSL:{lang:'普通话',diff:0},CL1:{lang:'普通话',diff:0},EPL:{lang:'英语',diff:1},LALIGA:{lang:'西班牙语',diff:2},SERIE_A:{lang:'意大利语',diff:2},BUNDESLIGA:{lang:'德语',diff:2},LIGUE_1:{lang:'法语',diff:2},EREDIVISIE:{lang:'荷兰语',diff:2},LIGA_PT:{lang:'葡萄牙语',diff:2},BRA:{lang:'葡萄牙语',diff:2},ARG:{lang:'西班牙语',diff:3},MLS:{lang:'英语',diff:1},J1:{lang:'日语',diff:2},K1:{lang:'韩语',diff:2},SAU:{lang:'阿拉伯语',diff:3},QAT:{lang:'阿拉伯语',diff:3}};
// ============ 真实赛历（2026 起步的现实周期） ============
// 中国队已无缘2026世界杯 → 主角赶上的周期：2027亚洲杯(沙特) → 2028洛杉矶奥运会 → 2027-29世预赛 → 2030世界杯(西葡摩) → 2031亚洲杯 → 2034世界杯(沙特)
const CALENDAR={
  asianCupYears:[2027,2031],olympicYear:2028,wcYears:[2030,2034],qualiYears:[2027,2028,2029,2033]
};
function seasonYear(p){return 2025+(p.season||1)}
const POS_OVR_WEIGHTS={
  ST:{PAC:.25,SHO:.35,DRI:.2,PHY:.1,PAS:.05,DEF:.05},
  LW:{PAC:.3,DRI:.3,SHO:.15,PAS:.15,PHY:.05,DEF:.05},
  RW:{PAC:.3,DRI:.3,SHO:.15,PAS:.15,PHY:.05,DEF:.05},
  CAM:{PAS:.3,DRI:.25,SHO:.15,PHY:.1,PAC:.1,DEF:.1},
  CM:{PAS:.3,DRI:.25,PHY:.1,SHO:.15,PAC:.1,DEF:.1},
  CDM:{DEF:.35,PAS:.2,PHY:.2,DRI:.1,PAC:.1,SHO:.05},
  LB:{PAC:.25,DEF:.25,DRI:.15,PAS:.15,PHY:.1,SHO:.1},
  RB:{PAC:.25,DEF:.25,DRI:.15,PAS:.15,PHY:.1,SHO:.1},
  CB:{DEF:.4,PHY:.3,PAC:.15,PAS:.1,DRI:.05,SHO:0},
  GK:{GK:1}
};
const SUB_ATTR_WEIGHTS={
  PAC:{acceleration:.55,sprintSpeed:.45},
  SHO:{positioning:.3,finishing:.3,shotPower:.1,longShots:.1,volleys:.1,penalties:.1},
  PAS:{vision:.25,shortPassing:.25,longPassing:.2,crossing:.1,curve:.1,freeKickAccuracy:.1},
  DRI:{agility:.2,balance:.15,reactions:.2,ballControl:.2,dribbling:.15,composure:.1},
  DEF:{defensiveAwareness:.3,interceptions:.3,headingAccuracy:.1,standingTackle:.15,slidingTackle:.15},
  PHY:{strength:.3,stamina:.25,jumping:.2,aggression:.25},
  GK:{reflexes:.3,handling:.15,diving:.25,gkPositioning:.2,kicking:.1}
};
const ATTR_LABELS={
  PAC:'PAC 速度',SHO:'SHO 射门',PAS:'PAS 传球',DRI:'DRI 盘带',DEF:'DEF 防守',PHY:'PHY 身体',GK:'GK 门将',
  acceleration:'加速',sprintSpeed:'冲刺速度',positioning:'站位',finishing:'射术',shotPower:'射门力量',
  longShots:'远射',volleys:'凌空',penalties:'点球',vision:'视野',shortPassing:'短传',longPassing:'长传',
  crossing:'传中',curve:'弧线',freeKickAccuracy:'任意球精度',agility:'敏捷',balance:'平衡',reactions:'反应',
  ballControl:'控球',dribbling:'盘带',composure:'沉着',defensiveAwareness:'防守意识',interceptions:'拦截',
  headingAccuracy:'头球精度',standingTackle:'立定抢断',slidingTackle:'滑铲',strength:'力量',stamina:'耐力',
  jumping:'跳跃',aggression:'侵略性',reflexes:'扑救反应',handling:'接球',diving:'鱼跃',gkPositioning:'门将站位',kicking:'开球'
};
const ALL_ATTRS={
  PAC:['acceleration','sprintSpeed'],
  SHO:['positioning','finishing','shotPower','longShots','volleys','penalties'],
  PAS:['vision','shortPassing','longPassing','crossing','curve','freeKickAccuracy'],
  DRI:['agility','balance','reactions','ballControl','dribbling','composure'],
  DEF:['defensiveAwareness','interceptions','headingAccuracy','standingTackle','slidingTackle'],
  PHY:['strength','stamina','jumping','aggression'],
  GK:['reflexes','handling','diving','gkPositioning','kicking']
};
function starOf(team,idx){
  idx=idx||0;
  const s=TEAM_STARS[team];
  return s&&s[idx]?s[idx]:null;
}
function starLine(team){
  const s=TEAM_STARS[team];
  return s&&s.length?s[0]:'队长';
}
function coachLine(team){
  const c=TEAM_COACHES[team];
  return c||null;
}
function clubCity(team){return CLUB_CITY[team]||''}
function leagueMeta(p){
  const l=LEAGUES[p.league]||{};
  return{cup:l.cup||'国内杯赛',continental:l.continental||null,tier:l.tier||3,country:l.country||'',factor:l.factor||1};
}
function domesticCupName(p){return leagueMeta(p).cup}
function continentalName(p){return leagueMeta(p).continental||'洲际赛事'}
// 转会窗赛制：中国/东亚/西亚/美洲为单自然年赛季 → 季前【冬窗】+ 季中【夏窗】；
// 欧洲跨年赛季（8月-次年5月）→ 季前【夏窗】+ 季中【冬窗（1月）】
function transferWindows(league){
  if(['EPL','LALIGA','SERIE_A','BUNDESLIGA','LIGUE_1','EREDIVISIE','LIGA_PT'].includes(league)){
    return[
      {key:'summer',label:'夏窗',pos:'pre',range:'6月10日 — 9月1日'},
      {key:'winter',label:'冬窗',pos:'mid',range:'1月1日 — 1月31日'}
    ];
  }
  return[
    {key:'winter',label:'冬窗',pos:'pre',range:'1月1日 — 2月28日'},
    {key:'summer',label:'夏窗',pos:'mid',range:'6月1日 — 7月15日'}
  ];
}
// 荣誉/数据所属赛事名：梯队球员的赛季在青年联赛进行，不应套用成年联赛名
function competitionName(p){
  if(isYouthStage(p))return{u17:'U17联赛',u19:'U19联赛',u21:'U21联赛'}[p.careerStage]||'青年联赛';
  return LEAGUES[p.league]?LEAGUES[p.league].name:(p.league||'联赛');
}
function canPlayContinental(p){
  const meta=leagueMeta(p);
  return !!meta.continental&&p.careerStage!=='u17'&&p.careerStage!=='u19'&&p.careerStage!=='u21';
}
function isChinaLeague(p){return p.league==='CSL'||p.league==='CL1'}
function isEuropeLeague(p){return ['EPL','LALIGA','SERIE_A','BUNDESLIGA','LIGUE_1','EREDIVISIE','LIGA_PT'].includes(p.league)}
function isYouthStage(p){return ['u17','u19','u21'].includes(p.careerStage)}
