// ============ GAME STATE ============
let game=null;
let currentEvent=null;
let currentOffers=[];
let currentWindowInfo=null;
let coachOptions=[];
let selectedPosition='';
let activeView='story';
function newGameState(){
  return{
    saveSlot:null,
    story:{usedStoryIds:[]},
    player:{
      name:'',age:16,height:175,weight:68,position:'ST',preferredFoot:'right',region:'北京',
      skillMoves:3,weakFoot:3,team:'',league:'CSL',contractYears:3,salary:3600,
      careerStage:'u17',potential:0,
      attributes:{},ovr:0,marketValue:0,form:5,morale:7,
      season:1,goals:0,assists:0,appearances:0,
      careerGoals:0,careerAssists:0,careerAppearances:0,
      internationalCaps:0,internationalGoals:0,
      honors:[],careerLog:[],ovrHistory:[],valueHistory:[],flags:{},recentEvents:{},
      isGK:false,retired:false,coaching:false
    },
    season:{events:[],currentEventIndex:-1,phase:'start',seasonGoals:0,seasonAssists:0,seasonApps:0,teamPosition:0,usedEventIds:[],endProcessed:false,profile:null},
    coaching:null
  };
}
// ============ 梯队体系（明确的晋升链） ============
const LADDER=[
  {key:'u17',name:'俱乐部U17梯队',ico:'U17',desc:'青年联赛 / 中国青少年足球联赛'},
  {key:'u19',name:'俱乐部U19梯队',ico:'U19',desc:'U19联赛 / 跳级培养'},
  {key:'u21',name:'U21预备队',ico:'U21',desc:'U21联赛 / 一线队预备'},
  {key:'first_team',name:'一线队轮换',ico:'1T',desc:'联赛大名单 / 替补登场'},
  {key:'starter',name:'一线队主力',ico:'S',desc:'联赛主力 / 杯赛首发'},
  {key:'core',name:'核心球员',ico:'C',desc:'球队核心 / 战术支点'},
  {key:'legend',name:'传奇球星',ico:'L',desc:'旗帜 / 史册书写者'}
];
function getStageName(stage){
  return{u17:'U17梯队',u19:'U19梯队',u21:'U21预备队',first_team:'一线队轮换',starter:'一线队主力',core:'核心球员',legend:'传奇球星'}[stage]||'未知';
}
function getStageColor(stage){
  return{u17:'#8b949e',u19:'#58a6ff',u21:'#58a6ff',first_team:'#d29922',starter:'#3fb950',core:'#bc8cff',legend:'#f0b23e'}[stage]||'#8b949e';
}
function ladderIndex(stage){return LADDER.findIndex(l=>l.key===stage)}
// ============ SAVE/LOAD ============
function saveGame(slot){
  if(!game)return false;
  game.saveSlot=slot;
  try{localStorage.setItem('fcs_save_'+slot,JSON.stringify(game));return true}catch(e){return false}
}
function loadGame(slot){
  try{const data=localStorage.getItem('fcs_save_'+slot);if(!data)return null;return JSON.parse(data)}catch(e){return null}
}
function getSaveInfo(slot){
  try{
    const data=localStorage.getItem('fcs_save_'+slot);if(!data)return null;
    const g=JSON.parse(data);
    return{name:g.player.name,age:g.player.age,team:g.player.team,ovr:g.player.ovr,position:g.player.position,league:g.player.league,season:g.player.season,careerStage:g.player.careerStage||'u17'};
  }catch(e){return null}
}
function deleteSave(slot){localStorage.removeItem('fcs_save_'+slot)}
function manualSave(){
  if(!game){showToast('请先开始游戏');return}
  if(!game.saveSlot){showLoadScreen(true);return}
  if(saveGame(game.saveSlot))showToast('已保存到存档 '+game.saveSlot);
  else showToast('存档失败');
}
function autoSave(){if(game&&game.saveSlot)saveGame(game.saveSlot)}
// ============ GAME MENU ============
function toggleGameMenu(){
  const overlay=document.getElementById('game-menu-overlay');
  if(overlay.classList.contains('active')){
    overlay.classList.remove('active');
  }else{
    if(!game||!document.getElementById('game-screen').classList.contains('active'))return;
    const p=game.player;
    const leagueName=LEAGUES[p.league]?LEAGUES[p.league].name:p.league;
    document.getElementById('menu-sub-info').textContent=seasonYear(p)+'赛季 · S'+p.season+' · '+p.name+' · '+p.age+'岁 · '+p.team;
    const mv=document.getElementById('menu-version');
    if(mv)mv.textContent='CFC '+GAME_VERSION;
    overlay.classList.add('active');
  }
}
function menuSave(){
  toggleGameMenu();
  if(!game.saveSlot){
    showLoadScreen(true);
  }else{
    if(saveGame(game.saveSlot))showToast('已保存到存档 '+game.saveSlot);
    else showToast('存档失败');
  }
}
function menuLoad(){
  toggleGameMenu();
  showLoadScreen(false);
}
function menuManageSaves(){
  toggleGameMenu();
  showManageSaves();
}
function menuSaveAndExit(){
  toggleGameMenu();
  if(!game)return;
  if(!game.saveSlot){
    showLoadScreen(true);
    showToast('请先选择一个存档槽');
    return;
  }
  const slot=game.saveSlot;
  if(saveGame(slot))showToast('已保存到存档 '+slot);
  else showToast('存档失败');
  showLoadScreen(false);
}
function confirmExitGame(){
  toggleGameMenu();
  showConfirm('退出游戏','未保存的进度将会丢失，确定要退出到主菜单吗？',function(){
    exitToMainMenu();
    showToast('已返回主菜单');
  });
}
function exitToMainMenu(){
  clearViews();
  game=null;currentEvent=null;currentOffers=[];coachOptions=[];
  showScreen('start-screen');
}
function clearViews(){
  ['view-story','view-growth','view-stats','view-honors','view-log'].forEach(id=>{
    const el=document.getElementById(id);if(el)el.innerHTML='';
  });
}
// ============ CONFIRM DIALOG ============
let confirmCallback=null;
function showConfirm(title,message,callback){
  document.getElementById('confirm-title').textContent=title;
  document.getElementById('confirm-message').textContent=message;
  confirmCallback=callback;
  document.getElementById('confirm-yes-btn').onclick=function(){
    const cb=confirmCallback;
    closeConfirm();
    if(cb)cb();
  };
  document.getElementById('confirm-overlay').classList.add('active');
}
function closeConfirm(){
  document.getElementById('confirm-overlay').classList.remove('active');
  confirmCallback=null;
}
// ============ MANAGE SAVES ============
function showManageSaves(){
  showScreen('load-screen');
  const header=document.querySelector('#load-screen .screen-header');
  header.querySelector('h2').textContent='管理存档';
  header.querySelector('p').textContent='查看或删除你的存档';
  const container=document.getElementById('save-slots-container');
  container.innerHTML='';
  for(let i=1;i<=3;i++){
    const info=getSaveInfo(i);
    const slot=document.createElement('div');
    slot.className='save-slot'+(info?'':' empty');
    if(info){
      const leagueName=LEAGUES[info.league]?LEAGUES[info.league].name:info.league;
      slot.innerHTML='<div class="save-slot-info"><div><div class="slot-crests">'+crestHTML('team',info.team,'crest crest-sm')+crestHTML('league',info.league,'crest crest-xs')+'</div><div class="save-slot-name">存档 '+i+' - '+escapeHtml(info.name)+'</div><div class="save-slot-detail">'+seasonYear({season:info.season})+'赛季 · '+info.age+'岁 · '+getStageName(info.careerStage)+' · '+escapeHtml(info.team)+' · '+info.position+' · '+leagueName+'</div></div><div class="save-slot-ovr">'+info.ovr+'<span class="ovr-caption">OVR</span></div></div>';
      const actions=document.createElement('div');
      actions.className='save-slot-actions';
      const delBtn=document.createElement('button');
      delBtn.className='slot-action-btn delete';
      delBtn.textContent='删除';
      delBtn.onclick=function(e){
        e.stopPropagation();
        showConfirm('删除存档','确定要删除存档 '+i+'（'+info.name+'）吗？此操作不可恢复。',function(){
          deleteSave(i);
          showToast('存档 '+i+' 已删除');
          showManageSaves();
        });
      };
      actions.appendChild(delBtn);
      slot.appendChild(actions);
    }else{
      slot.innerHTML='<div class="save-slot-info"><div><div class="save-slot-name">存档 '+i+'</div><div class="save-slot-detail">空存档</div></div></div>';
    }
    container.appendChild(slot);
  }
  const backBtn=document.querySelector('#load-screen .back-btn');
  if(backBtn){
    backBtn.textContent='← 返回';
    backBtn.onclick=function(){
      if(game)showScreen('game-screen');
      else showScreen('start-screen');
      header.querySelector('h2').textContent='读取存档';
      header.querySelector('p').textContent='选择一个存档槽继续你的职业生涯';
    };
  }
}
function showToast(msg){
  const t=document.createElement('div');t.className='toast';t.textContent=msg;
  document.body.appendChild(t);
  setTimeout(()=>t.remove(),2500);
}
// ============ SCREEN MANAGEMENT ============
function showScreen(id){
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  const el=document.getElementById(id);
  if(el)el.classList.add('active');
}
function showLoadScreen(forSave){
  showScreen('load-screen');
  const header=document.querySelector('#load-screen .screen-header');
  if(forSave){
    header.querySelector('h2').textContent='保存游戏';
    header.querySelector('p').textContent='选择一个存档槽来保存当前进度';
  }else{
    header.querySelector('h2').textContent='读取存档';
    header.querySelector('p').textContent='选择一个存档槽继续你的职业生涯';
  }
  const container=document.getElementById('save-slots-container');
  container.innerHTML='';
  for(let i=1;i<=3;i++){
    const info=getSaveInfo(i);
    const slot=document.createElement('div');
    slot.className='save-slot'+(info?'':' empty');
    if(info){
      const leagueName=LEAGUES[info.league]?LEAGUES[info.league].name:info.league;
      slot.innerHTML='<div class="save-slot-info"><div><div class="slot-crests">'+crestHTML('team',info.team,'crest crest-sm')+crestHTML('league',info.league,'crest crest-xs')+'</div><div class="save-slot-name">存档 '+i+' - '+escapeHtml(info.name)+'</div><div class="save-slot-detail">'+seasonYear({season:info.season})+'赛季 · '+info.age+'岁 · '+getStageName(info.careerStage)+' · '+escapeHtml(info.team)+' · '+info.position+' · '+leagueName+'</div></div><div class="save-slot-ovr">'+info.ovr+'<span class="ovr-caption">OVR</span></div></div>';
      if(forSave){
        slot.onclick=()=>{
          const doSave=()=>{
            game.saveSlot=i;saveGame(i);
            showToast('已保存到存档 '+i);
            showScreen('game-screen');switchView('story');
          };
          if(info&&game.saveSlot!==i){
            showConfirm('覆盖存档','存档 '+i+'（'+info.name+'）已有内容，确定覆盖吗？',doSave);
          }else{
            doSave();
          }
        };
      }else{
        slot.onclick=()=>{
          const doLoad=()=>{
            const data=loadGame(i);
            if(data){
              game=data;
              currentEvent=null;currentOffers=[];
              clearViews();
              showScreen('game-screen');switchView('story');
            }else{
              showToast('读取失败');
            }
          };
          if(game&&game.saveSlot!==i){
            showConfirm('读取存档','当前游戏进度尚未保存，读取该存档将替换当前进度。确定继续吗？',doLoad);
          }else{
            doLoad();
          }
        };
      }
      const actions=document.createElement('div');
      actions.className='save-slot-actions';
      const delBtn=document.createElement('button');
      delBtn.className='slot-action-btn delete';
      delBtn.textContent='删除';
      delBtn.onclick=function(e){
        e.stopPropagation();
        showConfirm('删除存档','确定要删除存档 '+i+'（'+info.name+'）吗？此操作不可恢复。',function(){
          deleteSave(i);
          showToast('存档 '+i+' 已删除');
          showLoadScreen(forSave);
        });
      };
      actions.appendChild(delBtn);
      slot.appendChild(actions);
    }else{
      slot.innerHTML='<div class="save-slot-info"><div><div class="save-slot-name">存档 '+i+'</div><div class="save-slot-detail">'+(forSave?'点击此处保存':'空存档')+'</div></div></div>';
      if(forSave&&game){
        slot.onclick=()=>{game.saveSlot=i;saveGame(i);showToast('已保存到存档 '+i);showScreen('game-screen');switchView('story')};
      }
    }
    container.appendChild(slot);
  }
  const backBtn=document.querySelector('#load-screen .back-btn');
  if(backBtn){
    if(forSave&&game){
      backBtn.textContent='← 取消';
      backBtn.onclick=function(){showScreen('game-screen');switchView(activeView)};
    }else if(game){
      backBtn.textContent='← 返回游戏';
      backBtn.onclick=function(){showScreen('game-screen');switchView(activeView)};
    }else{
      backBtn.textContent='← 返回';
      backBtn.onclick=function(){showScreen('start-screen')};
    }
  }
}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
// ============ VIEW SWITCHING ============
function switchView(name){
  activeView=name;
  document.querySelectorAll('.rail-btn').forEach(b=>{
    b.classList.toggle('active',b.dataset.view===name);
    const badge=b.querySelector('.badge');
    if(badge)badge.remove();
  });
  document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
  const el=document.getElementById('view-'+name);
  if(el)el.classList.add('active');
  if(!game)return;
  if(name==='story')resumeStory();
  else if(name==='growth')renderGrowthView();
  else if(name==='stats')renderStatsView();
  else if(name==='honors')renderHonorsView();
  else if(name==='log')renderLogView();
}
// 读档/切回剧情页时，按当前存档相位恢复画面
function resumeStory(){
  if(!game)return;
  const area=document.getElementById('view-story');
  if(!area)return;
  if(area.innerHTML.trim())return;
  const phase=game.season.phase||'start';
  if(phase==='consequence'){showConsequenceFromState();return}
  if(game.season.currentEventIndex===-1||phase==='start'){showSeasonStart();return}
  const item=game.season.events[game.season.currentEventIndex];
  if(!item){showSeasonStart();return}
  if(phase==='summary'||item.type==='season_end'){showSeasonEnd();return}
  if(item.type==='transfer_window'||phase==='transfer'){showTransferWindow({windowKey:item.windowKey,windowLabel:item.windowLabel,windowRange:item.windowRange,windowPos:item.windowPos});return}
  if(item.type==='event'){showEvent(item.eventId);return}
  showSeasonStart();
}
function notifyView(name){
  const b=document.querySelector('.rail-btn[data-view="'+name+'"]');
  if(b&&!b.classList.contains('active')&&!b.querySelector('.badge')){
    const d=document.createElement('span');d.className='badge';d.textContent='!';b.appendChild(d);
  }
}
// ============ PLAYER CREATION ============
function selectPosition(el){
  document.querySelectorAll('.pos-btn').forEach(b=>b.classList.remove('selected'));
  el.classList.add('selected');
  selectedPosition=el.dataset.pos;
}
function initStarRatings(){
  document.querySelectorAll('.star-rating').forEach(rating=>{
    rating.querySelectorAll('.star').forEach(star=>{
      star.innerHTML=ICONS.star;
      star.onclick=()=>{
        const val=parseInt(star.dataset.val);
        rating.querySelectorAll('.star').forEach(s=>{s.classList.toggle('active',parseInt(s.dataset.val)<=val)});
      };
    });
  });
}
function createPlayer(){
  const name=document.getElementById('player-name').value.trim();
  if(!name){showToast('请输入球员姓名');return}
  if(!selectedPosition){showToast('请选择场上位置');return}
  const height=parseInt(document.getElementById('player-height').value)||175;
  const weight=parseInt(document.getElementById('player-weight').value)||68;
  const foot=document.getElementById('player-foot').value;
  const region=document.getElementById('player-region').value;
  const academy=document.getElementById('player-academy').value;
  const skillMoves=document.querySelectorAll('#skill-rating .star.active').length;
  const weakFoot=document.querySelectorAll('#weakfoot-rating .star.active').length;
  game=newGameState();
  const p=game.player;
  p.name=name;p.height=height;p.weight=weight;p.position=selectedPosition;
  p.preferredFoot=foot;p.region=region;p.skillMoves=skillMoves;p.weakFoot=weakFoot;
  p.team=academy;p.league='CSL';p.isGK=(selectedPosition==='GK');
  p.contractYears=3;p.salary=3600;p.season=1;p.careerStage='u17';
  // 潜力：决定成长上限（84-97），青训豪门/花式加成 — 目标：史无前例的中国巨星
  const bonus=ACADEMY_BONUS[academy]||1;
  p.potential=Math.min(97,Math.max(84,84+Math.floor(Math.random()*9)+bonus));
  generateStartingAttributes(bonus);
  calculateOVR();
  calculateMarketValue();
  p.ovrHistory.push({age:16,ovr:p.ovr});
  p.valueHistory.push({age:16,value:p.marketValue});
  addLog('16岁加入'+academy+' U17梯队，开启职业生涯');
  game.season={events:[],currentEventIndex:-1,phase:'start',seasonGoals:0,seasonAssists:0,seasonApps:0,teamPosition:0,usedEventIds:[],endProcessed:false,profile:null};
  generateSeasonEvents();
  showLoadScreen(true);
}
function generateStartingAttributes(bonus){
  const pos=game.player.position;
  const baseVals={
    ST:{PAC:[36,46],SHO:[34,44],PAS:[28,38],DRI:[34,44],DEF:[18,26],PHY:[32,42]},
    LW:{PAC:[40,50],SHO:[28,38],PAS:[32,42],DRI:[38,48],DEF:[18,26],PHY:[27,37]},
    RW:{PAC:[40,50],SHO:[28,38],PAS:[32,42],DRI:[38,48],DEF:[18,26],PHY:[27,37]},
    CAM:{PAC:[32,42],SHO:[30,40],PAS:[38,48],DRI:[36,46],DEF:[24,32],PHY:[29,39]},
    CM:{PAC:[32,42],SHO:[28,38],PAS:[36,46],DRI:[34,44],DEF:[29,37],PHY:[32,42]},
    CDM:{PAC:[31,41],SHO:[22,32],PAS:[34,44],DRI:[31,41],DEF:[36,46],PHY:[34,44]},
    LB:{PAC:[36,46],SHO:[22,32],PAS:[31,41],DRI:[31,41],DEF:[31,41],PHY:[31,41]},
    RB:{PAC:[36,46],SHO:[22,32],PAS:[31,41],DRI:[31,41],DEF:[31,41],PHY:[31,41]},
    CB:{PAC:[29,39],SHO:[19,29],PAS:[26,36],DRI:[26,36],DEF:[36,46],PHY:[36,46]},
    GK:{GK:[36,46]}
  };
  const bv=baseVals[pos]||baseVals.ST;
  const attrs={};
  for(const cat in ALL_ATTRS){
    attrs[cat]={};
    const range=bv[cat]||[30,40];
    ALL_ATTRS[cat].forEach(attr=>{
      let val=Math.floor(Math.random()*(range[1]-range[0]+1))+range[0];
      val+=Math.floor(bonus*0.5);
      val=Math.max(18,Math.min(70,val));
      attrs[cat][attr]=val;
    });
  }
  game.player.attributes=attrs;
}
// ============ OVR & VALUE ============
function calculateOVR(){
  const p=game.player;
  const weights=POS_OVR_WEIGHTS[p.position]||POS_OVR_WEIGHTS.ST;
  let ovr=0;
  if(p.isGK){
    const gkAttrs=p.attributes.GK||{};
    const sw=SUB_ATTR_WEIGHTS.GK;
    let gkSum=0;
    for(const a in sw)gkSum+=(gkAttrs[a]||50)*sw[a];
    ovr=Math.round(gkSum);
  }else{
    for(const cat in weights){
      if(weights[cat]===0)continue;
      const attrs=p.attributes[cat]||{};
      const sw=SUB_ATTR_WEIGHTS[cat];
      let catSum=0;
      for(const a in sw)catSum+=(attrs[a]||50)*sw[a];
      ovr+=catSum*weights[cat];
    }
    ovr=Math.round(ovr);
  }
  // 未满18岁总评上限（天才可以更高，为巨星之路留空间）
  if(p.age<18)ovr=Math.min(70,ovr);
  p.ovr=Math.max(1,Math.min(99,ovr));
}
function calculateMarketValue(){
  const p=game.player;
  const ovr=p.ovr;const age=p.age;
  let base=0;
  if(ovr<35) base=1500;
  else if(ovr<40) base=3000+Math.pow(ovr-35,2)*300;
  else if(ovr<45) base=8000+Math.pow(ovr-40,2)*600;
  else if(ovr<50) base=20000+Math.pow(ovr-45,2)*1200;
  else if(ovr<55) base=50000+Math.pow(ovr-50,2)*2500;
  else if(ovr<60) base=110000+Math.pow(ovr-55,2)*5000;
  else if(ovr<65) base=250000+Math.pow(ovr-60,2)*10000;
  else if(ovr<70) base=500000+Math.pow(ovr-65,2)*20000;
  else if(ovr<75) base=1000000+Math.pow(ovr-70,2)*40000;
  else if(ovr<80) base=2000000+Math.pow(ovr-75,2)*80000;
  else if(ovr<85) base=4000000+Math.pow(ovr-80,2)*160000;
  else if(ovr<90) base=8000000+Math.pow(ovr-85,2)*320000;
  else base=16000000+Math.pow(Math.max(0,ovr-90),2)*600000;
  let ageMult=1;
  if(age<=17)ageMult=0.35;        // 天才新星的溢价
  else if(age<=19)ageMult=0.6;
  else if(age<=21)ageMult=0.85;
  else if(age<=24)ageMult=1.0;
  else if(age<=27)ageMult=1.1;
  else if(age<=29)ageMult=1.0;
  else if(age<=31)ageMult=0.75;
  else if(age<=34)ageMult=0.45;
  else if(age<=37)ageMult=0.2;
  else ageMult=0.08;
  let formBonus=1+(p.form-5)*0.03;
  let value=base*ageMult*formBonus;
  if(p.internationalCaps>0)value*=1.1;
  // 荣誉溢价封顶：荣誉是加分项而非无限通胀
  if(p.honors.length>0)value*=(1+Math.min(0.12,p.honors.length*0.015));
  // 赛季表现系数：身价对上一季实际输出做出有界的现实反应（约 ±15%）
  if(p.lastPerf){
    const q=p.lastPerf;
    const out=q.isGK?q.cleanSheets:q.goals*1.15+q.assists;
    const expected=Math.max(3,q.matches*(q.isGK?0.32:0.5));
    let perfF=1+Math.max(-0.12,Math.min(0.18,(out-expected)/expected*0.3))+(q.rating-6.9)*0.05;
    perfF=Math.max(0.86,Math.min(1.2,perfF));
    value*=perfF;
  }
  // 剧情后果：网络热度与商业代言提升市场价值
  if(p.flags.viral)value*=1.05;
  if(p.flags.sponsor)value*=1.05;
  const leagueTier=LEAGUES[p.league]?LEAGUES[p.league].tier:3;
  const leagueMult={1:1.8,2:1.0,3:0.4,4:0.18}[leagueTier]||1;
  value*=leagueMult;
  // 潜力溢价：球探愿意为高潜新星支付溢价
  if(p.potential-p.ovr>=8)value*=1.25;
  value=Math.max(1500,value);
  p.marketValue=Math.round(value);
}
function formatValue(v){
  if(v>=100000000)return'€'+(v/1000000).toFixed(0)+'M';
  if(v>=1000000)return'€'+(v/1000000).toFixed(1)+'M';
  if(v>=1000)return'€'+Math.round(v/1000)+'K';
  return'€'+v;
}
function formatSalary(v){
  const rmb=Math.round(v*8);
  if(rmb>=10000)return (rmb/10000).toFixed(0)+'万/年';
  return rmb+'元/年';
}
function potentialBand(pot){
  if(pot>=95)return'世界级天才 ★★★★★';
  if(pot>=90)return'洲际级天才 ★★★★★';
  if(pot>=86)return'亚洲顶级 ★★★★';
  return'国内顶级 ★★★★';
}
// ============ 成长引擎（潜力驱动；一般 27~30 岁前后达峰，潜力/选择不同节奏不同） ============
function seasonOvrGain(p){
  let g;
  if(p.age<=17)g=6;
  else if(p.age<=21)g=5;
  else if(p.age<=24)g=4;
  else if(p.age<=27)g=2;
  else if(p.age<=29)g=1;
  else if(p.age<=31)g=0;
  else if(p.age<=33)g=-1;
  else if(p.age<=35)g=-2;
  else g=-3;
  if(p.morale<=3)g-=1;
  if(p.form>=8)g+=1;
  // 剧情后果：此前选择的成长回响
  if(p.flags.recovery_pro&&g<0)g+=1;      // 科学康复延缓衰退
  if(p.flags.weakfoot_boost&&p.age<=21)g+=1; // 弱脚强化期额外成长
  if(p.flags.mentor_technique&&p.age<=19)g+=1; // 名宿亲授夯实基本功
  const room=p.potential-p.ovr;
  if(room<=0)g=Math.min(g,0);
  else if(room<=2)g=Math.round(g*0.4);
  else if(room<=5)g=Math.round(g*0.7);
  return g;
}
function applyGrowth(){
  const p=game.player;
  const g=seasonOvrGain(p);
  if(g===0){return 0}
  const cats=p.isGK?['GK']:Object.keys(POS_OVR_WEIGHTS[p.position]).filter(c=>POS_OVR_WEIGHTS[p.position][c]>0);
  const weights=POS_OVR_WEIGHTS[p.position];
  cats.forEach(cat=>{
    const w=p.isGK?1:(weights[cat]||0);
    let d;
    if(g>0){
      d=Math.round(g*(0.55+Math.min(0.9,w*2.2)));
    }else{
      // 衰退：速度身体掉得快，技术意识更持久
      if(cat==='PAC'||cat==='PHY')d=Math.round(g*1.25);
      else if(cat==='DEF')d=Math.round(g*1.0);
      else d=Math.round(g*0.75);
    }
    const attrs=p.attributes[cat]||{};
    ALL_ATTRS[cat].forEach(attr=>{
      if(attrs[attr]===undefined)return;
      let delta=d;
      if(delta>0&&Math.random()<0.35)delta+=Math.random()<0.5?1:0;
      if(delta<0&&Math.random()<0.3)delta+=1;
      attrs[attr]=Math.max(1,Math.min(99,attrs[attr]+delta));
    });
  });
  // 花式/逆足随总评提升
  if(!p.isGK){
    if(p.ovr>=72&&p.skillMoves<5&&Math.random()<0.5)p.skillMoves++;
    if(p.ovr>=78&&p.weakFoot<5&&Math.random()<0.4)p.weakFoot++;
  }
  calculateOVR();
  calculateMarketValue();
  return g;
}
function applyAgeProgression(){
  applyGrowth();
}
function checkNationalTeam(){
  const p=game.player;
  if(p.flags.nationalMember)return;
  if(p.age<18||isYouthStage(p))return;
  // 国家队首征优先走 ch3_nt_callup 剧情事件；只有剧情已消耗或实力特别突出时才自动入选
  const storyDone=game.story&&game.story.usedStoryIds.includes('ch3_nt_callup');
  let chance=0;
  if(p.ovr>=70)chance=storyDone?0.92:0.35;
  else if(p.ovr>=66&&storyDone)chance=0.7;
  else if(p.ovr>=62&&storyDone)chance=0.45;
  if(chance>0&&Math.random()<chance){
    p.flags.nationalMember=true;
    p.internationalCaps=1;
    addLog('首次入选国家队，'+NT_COACH+'召你进入成年集训队');
  }
}
