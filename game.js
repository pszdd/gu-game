/* 蛊真人 · 魔道长生 —— Demo 游戏逻辑
   基于小说《蛊真人》核心设定：资质四等、蛊师转数、元海元石、五行蛊虫、春秋蝉重生。
*/

/* ============ 数据定义 ============ */
const APTITUDE = {
  甲: { mult: 2.0, seaFactor: 1.5, desc: "甲等资质，惊才绝艳，家族百年之幸。" },
  乙: { mult: 1.4, seaFactor: 1.2, desc: "乙等资质，未来家老之选。" },
  丙: { mult: 1.0, seaFactor: 1.0, desc: "丙等资质，中人之姿，但魔心不改。" },
  丁: { mult: 0.7, seaFactor: 0.7, desc: "丁等资质，修行维艰，唯有坚毅破局。" },
};
const APT_WEIGHT = { 丁: 35, 丙: 40, 乙: 20, 甲: 5 }; // 资质随机权重

const RANKS = [
  { name: "凡人", seaBase: 0,   hpBase: 80,  cultNeed: 100 },
  { name: "一转蛊师", seaBase: 12, hpBase: 120, cultNeed: 280 },
  { name: "二转蛊师", seaBase: 26, hpBase: 170, cultNeed: 680 },
  { name: "三转蛊师", seaBase: 44, hpBase: 230, cultNeed: 1600 },
  { name: "四转蛊师", seaBase: 70, hpBase: 320, cultNeed: 99999 },
];

// 蛊虫图鉴（element 五行: 金木水火土；灵=无克制；时=特殊）
const GU_DEFS = {
  moonOrchid:  { name:"月兰花", el:"灵", power:5,  cost:1, type:"攻", desc:"花海所生，蛊虫常见食材，亦可发出微光伤敌。" },
  ironhide:    { name:"铁皮蛊", el:"金", power:4,  cost:2, type:"防", desc:"使皮肤坚如铁皮，减免伤害。" },
  fireTill:    { name:"火耕蛊", el:"火", power:9,  cost:3, type:"攻", desc:"纵火灼敌，攻势凌厉。" },
  greenwood:   { name:"青木蛊", el:"木", power:7,  cost:3, type:"治", desc:"木气滋养，回复气血。" },
  waterFlow:   { name:"流水蛊", el:"水", power:7,  cost:2, type:"攻", desc:"水刃割敌，柔中带刚。" },
  thickEarth:  { name:"厚土蛊", el:"土", power:5,  cost:2, type:"防", desc:"土气护身，稳固如山。" },
  moonShadow:  { name:"月影蛊", el:"灵", power:13, cost:5, type:"攻", desc:"月华凝刃，伤敌于无形。" },
  bloodBlade:  { name:"血刃蛊", el:"火", power:16, cost:6, type:"攻", desc:"以血饲蛊，锋芒嗜血。" },
  springAutumn:{ name:"春秋蝉", el:"时", power:0,  cost:0, type:"奇", desc:"十大奇蛊第七，逆转光阴，可重生一次。" },
};
// 五行克制：key 克 value
const OVERCOME = { 金:"木", 木:"土", 土:"水", 水:"火", 火:"金" };

// 敌人
function makeEnemy(key){
  const E = {
    boar:     { name:"青毛山猪", hp:60,  atk:8,  el:"土", stone:[2,4],  cult:6 },
    wolf:     { name:"独眼山狼", hp:55,  atk:12, el:"金", stone:[2,5],  cult:8 },
    bandit:   { name:"山贼流寇", hp:90,  atk:14, el:"火", stone:[4,7],  cult:12 },
    apprentice:{name:"蛊师学徒", hp:120, atk:16, el:"木", stone:[5,9],  cult:18 },
    rival:    { name:"古月方正", hp:150, atk:20, el:"金", stone:[6,10], cult:25, story:true },
    master:   { name:"邪修蛊师", hp:220, atk:26, el:"水", stone:[8,14], cult:35 },
    beast:    { name:"百年妖兽", hp:300, atk:34, el:"土", stone:[12,20],cult:50 },
  };
  const e = { ...E[key] };
  e.maxHp = e.hp;
  e.cultReward = e.cult;
  e.stoneReward = randInt(e.stone[0], e.stone[1]);
  e.dropGu = e.story ? null : (Math.random() < 0.35 ? randEl(["moonOrchid","ironhide","fireTill","greenwood","waterFlow","thickEarth","moonShadow"]) : null);
  return e;
}

// 探索事件池
const EXPLORE_EVENTS = [
  { w:18, type:"stone", txt:"你循着前世记忆，在一处隐蔽岩缝中找到一枚遗落的元石。", stone:[1,3] },
  { w:14, type:"gu", txt:"记忆中的某株月兰花下，藏有一只野生蛊虫。", gu:"moonOrchid" },
  { w:10, type:"gu", txt:"枯木洞中，你以经验诱得一只铁皮蛊。", gu:"ironhide" },
  { w:8,  type:"gu", txt:"山涧溪流深处，一只流水蛊现形。", gu:"waterFlow" },
  { w:6,  type:"gu", txt:"你记得此处生有厚土蛊的食料，果然诱得一只。", gu:"thickEarth" },
  { w:5,  type:"stone", txt:"前世的藏宝点尚无人开启，得元石若干。", stone:[3,6] },
  { w:5,  type:"gu", txt:"月升时分，月影蛊循光而来。", gu:"moonShadow" },
  { w:3,  type:"rare", txt:"你于一处幽谷秘地，竟寻得一只春秋蝉——十大奇蛊第七！可于身死时逆转光阴重生。", gu:"springAutumn" },
  { w:15, type:"enemy", txt:"探索途中，一头凶兽拦路！", enemy:"boar" },
  { w:10, type:"enemy", txt:"遇上一伙山贼，拔刀相向！", enemy:"bandit" },
  { w:8,  type:"enemy", txt:"林中跃出一只独眼山狼！", enemy:"wolf" },
  { w:6,  type:"enemy", txt:"一名蛊师学徒觊觎你的蛊虫！", enemy:"apprentice" },
  { w:4,  type:"enemy", txt:"竟撞见一名邪修蛊师！", enemy:"master" },
  { w:8,  type:"empty", txt:"此处机缘未到，徒劳无功。" },
];

/* ============ 游戏状态 ============ */
let S = null;
function newState(){
  return {
    name:"方源",
    apt:null,
    rank:0,
    day:1,
    sea:0,        // 当前元海
    stone:5,      // 元石
    cult:0,       // 修为进度
    hp:80, maxHp:80,
    gu:[],        // 蛊袋
    guCap:3,      // 蛊袋容量
    flags:{ hasCicada:false, rebirthUsed:false, fangZhengMet:false },
  };
}

/* ============ 工具 ============ */
const $ = id => document.getElementById(id);
const randInt = (a,b) => a + Math.floor(Math.random()*(b-a+1));
const randEl = arr => arr[Math.floor(Math.random()*arr.length)];
function weightedPick(list){
  const total = list.reduce((s,e)=>s+e.w,0);
  let r = Math.random()*total;
  for(const e of list){ if((r-=e.w)<=0) return e; }
  return list[list.length-1];
}
function aptMult(){ return APTITUDE[S.apt].mult; }
function seaMax(){ return Math.round(RANKS[S.rank].seaBase * APTITUDE[S.apt].seaFactor); }
function cultMax(){ return RANKS[S.rank].cultNeed; }
function guById(id){ return GU_DEFS[id]; }
function hasGu(id){ return S.gu.some(g=>g.id===id); }

function showScreen(id){
  document.querySelectorAll(".screen").forEach(s=>s.classList.remove("active"));
  $(id).classList.add("active");
}
function logMsg(html, cls=""){
  const box = $("log-box");
  const p = document.createElement("p");
  if(cls) p.className = cls;
  p.innerHTML = html;
  box.appendChild(p);
  box.scrollTop = box.scrollHeight;
}
function clearLog(){ $("log-box").innerHTML=""; }
function battleLog(txt, cls=""){
  const b = $("battle-log");
  const p = document.createElement("p");
  if(cls) p.className=cls;
  p.textContent = txt;
  b.appendChild(p);
  b.scrollTop = b.scrollHeight;
}
function showModal(title, body, actions=[]){
  $("modal-title").textContent = title;
  $("modal-body").innerHTML = body;
  const ab = $("modal-actions"); ab.innerHTML="";
  actions.forEach(a=>{
    const b = document.createElement("button");
    b.className="btn "+(a.cls||""); b.textContent=a.label;
    b.onclick=()=>{ if(a.fn) a.fn(); if(!a.keep) hideModal(); };
    ab.appendChild(b);
  });
  $("modal").classList.remove("hidden");
}
function hideModal(){ $("modal").classList.add("hidden"); }
function elColor(el){ return "el-"+el; }
function elName(el){ return ({金:"金",木:"木",水:"水",火:"火",土:"土",灵:"灵",时:"时"})[el]||el; }
function multBetween(atkEl, defEl){
  if(OVERCOME[atkEl]===defEl) return 1.6;       // 攻克防
  if(OVERCOME[defEl]===atkEl) return 0.55;      // 被克
  return 1;
}

/* ============ 开场打字机 ============ */
const INTRO_TEXT = `青山落日，秋月春风。

方源一身残破的碧绿大袍，披头散发，浑身浴血，环顾四周。
群敌环伺——正道各大派联手围攻，山风吹得血袍飘荡如战旗。
他脚下积了一大滩血水，五百年的纵横，终究走到了尽头。

"方源，乖乖交出春秋蝉，我给你个痛快！"

面对死亡，方源面不改色，目光幽幽如古井深潭。
他看着青山落日，轻声一笑："终究是失败了呀……"
"若是刚炼成的春秋蝉有效，来生还是要做邪魔！"

轰的一声——他悍然自爆。

……

再睁眼时，窗外是青茅山的春雨。
方源低头看着自己稚嫩苍白的手掌，慢慢握紧。
"古月山寨……这是五百年前？！春秋蝉果真起作用了……"
"五百年的经历，真像是个梦啊。"
但他清楚知道，这绝不是梦。
明日，便是开窍大典。`;

function typeIntro(){
  const el = $("intro-text");
  el.innerHTML = "";
  let i=0;
  const span = document.createElement("span");
  el.appendChild(span);
  const cursor = document.createElement("span");
  cursor.className="cursor"; cursor.textContent="▌";
  el.appendChild(cursor);
  const timer = setInterval(()=>{
    span.textContent = INTRO_TEXT.slice(0,i);
    i+=2;
    el.scrollTop = el.scrollHeight;
    if(i>INTRO_TEXT.length){ clearInterval(timer); }
  }, 28);
  $("intro-next").onclick = ()=>{ clearInterval(timer); span.textContent=INTRO_TEXT; showScreen("ceremony-screen"); initCeremony(); };
}

/* ============ 开窍大典 ============ */
let ceremonyTimer = null;
function initCeremony(){
  $("ceremony-result").innerHTML = "";
  $("ceremony-start").classList.remove("hidden");
  $("ceremony-confirm").classList.add("hidden");
  $("sea-player").style.left = "0%";
  $("ceremony-start").onclick = startCeremony;
}
function startCeremony(){
  $("ceremony-start").classList.add("hidden");
  // 抽资质
  const pick = weightedPick(Object.entries(APT_WEIGHT).map(([k,w])=>({w,grade:k})));
  const grade = pick.grade;
  // 步数映射：丁<3, 丙3-10, 乙10-30, 甲>30
  let target;
  if(grade==="丁") target = randInt(1,2);
  else if(grade==="丙") target = randInt(3,9);
  else if(grade==="乙") target = randInt(10,29);
  else target = randInt(30,55);
  const maxStep = 55;
  const targetPct = Math.min(100, (target/maxStep)*100);

  let step = 0;
  ceremonyTimer = setInterval(()=>{
    step += 1;
    const pct = Math.min(targetPct, (step/maxStep)*100);
    $("sea-player").style.left = pct+"%";
    if(step >= target){
      clearInterval(ceremonyTimer);
      finishCeremony(grade, step);
    }
  }, 120);
}
function finishCeremony(grade, steps){
  S = newState();
  S.apt = grade;
  // 起手蛊：人人一只月兰花
  S.gu.push({ id:"moonOrchid", power:5, fed:0 });
  const txt = `<span class="grade">${grade}等资质</span>（${steps}步）<br>${APTITUDE[grade].desc}<br><span class="fail">族人议论纷纷——谁也不知道，这具少年躯壳里，是一个五百年老魔的灵魂。</span>`;
  $("ceremony-result").innerHTML = txt;
  $("ceremony-confirm").classList.remove("hidden");
  $("ceremony-confirm").onclick = ()=>{
    showScreen("game-screen");
    startGame();
  };
}

/* ============ 主游戏 ============ */
function startGame(){
  S.maxHp = RANKS[S.rank].hpBase + (S.apt==="甲"?40:S.apt==="乙"?20:0);
  S.hp = S.maxHp;
  S.sea = seaMax();
  S.guCap = 3 + S.rank;
  refreshUI();
  clearLog();
  logMsg(`<span class="sys">【重生】</span>你借春秋蝉之力重回五百年前，资质${S.apt}等。明日开窍大典已过，你正式踏上蛊师之路。`,"sys");
  logMsg(`<span class="sys">【提示】</span>修炼可积修为晋升转数；探索凭前世记忆寻宝遇敌；养蛊强化蛊虫；历练可战斗夺资源；家族可求助家老。`,"sys");
  renderGu();
  bindActions();
  checkStoryEvent();
}

function refreshUI(){
  $("st-name").textContent = S.name;
  $("st-rank").textContent = RANKS[S.rank].name;
  $("st-apt").textContent = S.apt+"等";
  $("st-day").textContent = S.day;
  $("st-sea").textContent = `${S.sea}/${seaMax()}`;
  $("st-stone").textContent = S.stone;
  const pct = Math.min(100, (S.cult/cultMax())*100);
  $("cult-fill").style.width = pct+"%";
  $("cult-num").textContent = `${S.cult}/${cultMax()}`;
  $("gu-count").textContent = `${S.gu.length}/${S.guCap}`;
}

function bindActions(){
  document.querySelectorAll(".action-btn").forEach(b=>{
    b.onclick = ()=>{
      const a = b.dataset.act;
      if(a==="cultivate") actCultivate();
      else if(a==="explore") actExplore();
      else if(a==="gu") actRaiseGu();
      else if(a==="battle") actBattle();
      else if(a==="clan") actClan();
      else if(a==="rest") actRest();
    };
  });
}

function advanceDay(n=1){
  S.day += n;
  // 元海每日自然恢复少量
  S.sea = Math.min(seaMax(), S.sea + Math.round(seaMax()*0.15));
}
function endTurn(){
  refreshUI();
  checkStoryEvent();
}

/* ---- 修炼 ---- */
function actCultivate(){
  const cost = 3;
  if(S.stone < cost){ showModal("元石不足", `修炼需消耗 ${cost} 元石以催动元气，当前仅 ${S.stone} 枚。`, [{label:"知晓",cls:"btn-warn"}]); return; }
  S.stone -= cost;
  const gain = Math.round(20 * aptMult());
  S.cult += gain;
  S.sea = Math.min(seaMax(), S.sea + Math.round(seaMax()*0.3));
  logMsg(`<span class="me">你盘膝吐纳，元气入体，修为+${gain}。</span>`,"me");
  // 检查晋升
  if(S.cult >= cultMax() && S.rank < RANKS.length-1){
    S.cult = 0;
    S.rank++;
    S.maxHp = RANKS[S.rank].hpBase + (S.apt==="甲"?40:S.apt==="乙"?20:0);
    S.hp = S.maxHp;
    S.sea = seaMax();
    S.guCap = 3 + S.rank;
    logMsg(`<span class="good">【突破】晋升为 ${RANKS[S.rank].name}！元海上限提升至 ${seaMax()}，蛊袋扩容至 ${S.guCap}。</span>`,"good");
  }
  advanceDay(1);
  endTurn();
}

/* ---- 探索 ---- */
function actExplore(){
  advanceDay(1);
  const ev = weightedPick(EXPLORE_EVENTS);
  switch(ev.type){
    case "stone":{
      const n = randInt(ev.stone[0], ev.stone[1]);
      S.stone += n;
      logMsg(`<span class="good">${ev.txt} +${n} 元石。</span>`,"good");
      break;
    }
    case "gu":{
      if(S.gu.length >= S.guCap){
        logMsg(`<span class="bad">${ev.txt} 然而蛊袋已满（${S.gu.length}/${S.guCap}），只得放生。</span>`,"bad");
      } else {
        addGu(ev.gu);
        logMsg(`<span class="good">${ev.txt}（获得 ${guById(ev.gu).name}）</span>`,"good");
      }
      break;
    }
    case "rare":{
      if(!S.flags.hasCicada && S.gu.length < S.guCap){
        addGu(ev.gu); S.flags.hasCicada = true;
        logMsg(`<span class="good">${ev.txt}</span>`,"good");
      } else {
        S.stone += 8;
        logMsg(`<span class="good">前世秘地开启，得元石 +8。</span>`,"good");
      }
      break;
    }
    case "enemy":{
      logMsg(`<span class="bad">${ev.txt}</span>`,"bad");
      startBattle(ev.enemy, true);
      return; // 战斗中不 endTurn
    }
    default:
      logMsg(ev.txt,"");
  }
  renderGu();
  endTurn();
}

/* ---- 养蛊 ---- */
function actRaiseGu(){
  if(S.gu.length===0){ showModal("蛊袋空空", "你尚无蛊虫可养。可先去探索寻蛊。", [{label:"退下",cls:"btn-warn"}]); return; }
  const cost = 2;
  const list = S.gu.map((g,idx)=>{
    const def = guById(g.id);
    return `<div class="gu-card" style="cursor:pointer" data-idx="${idx}">
      <span><span class="${elColor(def.el)}">${def.name}</span> <span class="gu-meta">威力${g.power} · 喂养${g.fed}次</span></span>
      <span class="gu-meta">-${cost}元石</span>
    </div>`;
  }).join("");
  showModal("养蛊 · 选择蛊虫喂养", `以 ${cost} 元石饲蛊，提升其威力。<br>当前元石：${S.stone}<br><div class="gu-list" style="margin-top:.5rem">${list}</div>`, [
    {label:"关闭",cls:"btn-warn", fn:()=>{}}
  ]);
  // 绑定点击
  setTimeout(()=>{
    document.querySelectorAll("#modal-body .gu-card").forEach(c=>{
      c.onclick = ()=>{
        const idx = +c.dataset.idx;
        if(S.stone < cost){ hideModal(); showModal("元石不足","元石不足以饲蛊。",[{label:"知晓",cls:"btn-warn"}]); return; }
        S.stone -= cost;
        const g = S.gu[idx];
        const def = guById(g.id);
        const inc = def.type==="治" ? 3 : (def.type==="防" ? 2 : 4);
        g.power += inc; g.fed++;
        hideModal();
        logMsg(`<span class="me">你以元石饲喂 ${def.name}，威力+${inc}（${g.power}）。</span>`,"me");
        renderGu(); refreshUI();
      };
    });
  },20);
}

/* ---- 历练（主动战斗）---- */
function actBattle(){
  // 按转数选敌人
  const pool = ["boar","wolf","bandit","apprentice","master","beast"];
  const pick = pool[Math.min(pool.length-1, S.rank+1)];
  logMsg(`<span class="me">你外出历练，寻敌斗法。</span>`,"me");
  advanceDay(1);
  startBattle(pick, false);
}

/* ---- 家族 ---- */
const CLAN_NPC = [
  { who:"族长古月方西", txt:"族长沉吟片刻，拨给你几枚族中元石以作修行之用。", stone:[4,7], cd:2 },
  { who:"学堂家老", txt:"学堂家老见你天资尚可，赠你一只蛊虫以助修行。", gu:"ironhide", cd:3 },
  { who:"古月漠尘家老", txt:"漠尘家老正在与赤练家老争斗，无暇顾及你。", empty:true, cd:1 },
  { who:"古月赤练家老", txt:"赤练家老冷冷看你一眼，并不待见。", empty:true, cd:1 },
  { who:"族中长老", txt:"长老指点你吐纳之法，修为精进。", cult:[15,25], cd:2 },
];
let clanIdx = 0;
function actClan(){
  advanceDay(1);
  const npc = CLAN_NPC[clanIdx % CLAN_NPC.length];
  clanIdx++;
  let extra = "";
  if(npc.empty){
    logMsg(`<span class="me">${npc.who}：${npc.txt}</span>`,"");
  } else if(npc.stone){
    const n = randInt(npc.stone[0], npc.stone[1]); S.stone += n;
    logMsg(`<span class="good">${npc.who}：${npc.txt} +${n} 元石。</span>`,"good");
  } else if(npc.gu){
    if(S.gu.length >= S.guCap){
      const n=4; S.stone+=n;
      logMsg(`<span class="good">${npc.who}：蛊袋已满，改赠元石 +${n}。</span>`,"good");
    } else {
      addGu(npc.gu);
      logMsg(`<span class="good">${npc.who}：${npc.txt}（获得 ${guById(npc.gu).name}）</span>`,"good");
    }
  } else if(npc.cult){
    const n = Math.round(randInt(npc.cult[0],npc.cult[1]) * aptMult());
    S.cult += n;
    logMsg(`<span class="good">${npc.who}：${npc.txt} 修为+${n}。</span>`,"good");
    if(S.cult >= cultMax() && S.rank < RANKS.length-1){
      S.cult=0; S.rank++;
      S.maxHp = RANKS[S.rank].hpBase + (S.apt==="甲"?40:S.apt==="乙"?20:0);
      S.hp=S.maxHp; S.sea=seaMax(); S.guCap=3+S.rank;
      logMsg(`<span class="good">【突破】晋升为 ${RANKS[S.rank].name}！</span>`,"good");
    }
  }
  renderGu();
  endTurn();
}

/* ---- 歇息 ---- */
function actRest(){
  advanceDay(1);
  S.sea = seaMax();
  S.hp = Math.min(S.maxHp, S.hp + Math.round(S.maxHp*0.4));
  logMsg(`<span class="me">你静养歇息，元海回满，气血渐复。</span>`,"me");
  endTurn();
}

/* ---- 蛊虫管理 ---- */
function addGu(id){
  const def = GU_DEFS[id];
  S.gu.push({ id, power:def.power, fed:0 });
  renderGu();
}
function renderGu(){
  const el = $("gu-list");
  el.innerHTML = "";
  if(S.gu.length===0){
    el.innerHTML = `<div class="gu-card empty">蛊袋空空如也</div>`;
    return;
  }
  S.gu.forEach(g=>{
    const def = guById(g.id);
    const card = document.createElement("div");
    card.className = "gu-card";
    card.innerHTML = `<span><span class="${elColor(def.el)}">${def.name}</span> <span class="gu-meta">[${elName(def.el)}·${def.type}] 威力${g.power}</span></span>
      <span class="gu-meta">${def.cost}元海</span>`;
    el.appendChild(card);
  });
}

/* ============ 战斗系统 ============ */
let BATTLE = null;
function startBattle(enemyKey, fromExplore){
  BATTLE = {
    enemy: makeEnemy(enemyKey),
    fromExplore,
    over:false,
  };
  const e = BATTLE.enemy;
  $("battle-title").textContent = "战斗 · " + e.name;
  $("enemy-name").textContent = e.name;
  $("enemy-hp-text").textContent = `${e.hp}/${e.maxHp}`;
  $("enemy-hp-fill").style.width = "100%";
  $("player-battle-name").textContent = S.name;
  $("player-hp-text").textContent = `${S.hp}/${S.maxHp}`;
  $("player-hp-fill").style.width = (S.hp/S.maxHp*100)+"%";
  $("battle-sea-val").textContent = S.sea;
  $("battle-log").innerHTML = "";
  battleLog(`你遭遇了 ${e.name}（${elName(e.el)}属），拔蛊迎敌！`, "sys");
  battleLog(`提示：五行相克——金克木、木克土、土克水、水克火、火克金。克制方伤害×1.6。`, "sys");
  renderBattleGu();
  $("battle-flee").onclick = tryFlee;
  $("battle-screen").classList.add("active");
  enemyIntent();
}

function renderBattleGu(){
  const grid = $("battle-gu-grid");
  grid.innerHTML = "";
  if(S.gu.length===0){
    grid.innerHTML = `<div class="gu-card empty">你尚无蛊虫可用！</div>`;
    return;
  }
  S.gu.forEach((g,idx)=>{
    const def = guById(g.id);
    const btn = document.createElement("button");
    btn.className = "battle-gu-btn";
    const usable = def.cost<=S.sea && def.type!=="奇";
    btn.disabled = !usable;
    btn.innerHTML = `<span class="bg-name"><span class="${elColor(def.el)}">${def.name}</span></span>
      <span class="bg-cost">[${elName(def.el)}·${def.type}] 威${g.power} · ${def.cost}元海</span>`;
    btn.onclick = ()=> playerAct(idx);
    grid.appendChild(btn);
  });
}

function enemyIntent(){
  const e = BATTLE.enemy;
  const intents = [
    `蓄势待发，${elName(e.el)}气涌动。`,
    `凶相毕露，利齿森森。`,
    `伺机而动，环伺不前。`,
    `怒吼一声，杀意凌人。`,
  ];
  $("enemy-intent").textContent = randEl(intents);
}

function playerAct(idx){
  if(BATTLE.over) return;
  const g = S.gu[idx];
  const def = guById(g.id);
  if(def.cost > S.sea) return;
  S.sea -= def.cost;
  const e = BATTLE.enemy;

  if(def.type==="治"){
    const heal = g.power;
    S.hp = Math.min(S.maxHp, S.hp + heal);
    battleLog(`你催动 ${def.name}，回复气血 ${heal}。`, "me");
  } else if(def.type==="防"){
    BATTLE.playerDef = (BATTLE.playerDef||0) + g.power;
    battleLog(`你催动 ${def.name}，护体罡气+${g.power}（本回合减伤）。`, "me");
  } else if(def.type==="奇"){
    battleLog(`春秋蝉非战斗之蛊，无法用于此。`, "sys");
    renderBattleGu(); updateBattleUI(); return;
  } else {
    // 攻击
    const mult = multBetween(def.el, e.el);
    let dmg = Math.max(1, Math.round(g.power * mult));
    // 转数压制：高转打低伤减免
    dmg = Math.round(dmg * (1 + S.rank*0.1));
    e.hp -= dmg;
    const tag = mult>1 ? "（克制！）" : mult<1 ? "（被克）" : "";
    battleLog(`你催动 ${def.name} 击中 ${e.name}，造成 ${dmg} 伤害${tag}。`, "me");
  }

  updateBattleUI();
  if(e.hp <= 0){ winBattle(); return; }
  // 敌人反击
  setTimeout(enemyAct, 350);
}

function enemyAct(){
  if(BATTLE.over) return;
  const e = BATTLE.enemy;
  const mult = multBetween(e.el, elOfPlayerDominant());
  let dmg = Math.max(1, Math.round(e.atk * mult));
  if(BATTLE.playerDef){ dmg = Math.max(1, dmg - BATTLE.playerDef); }
  S.hp -= dmg;
  const tag = mult>1 ? "（克制你！）" : mult<1 ? "（你抵抗）" : "";
  battleLog(`${e.name} 反扑，对你造成 ${dmg} 伤害${tag}。`, "foe");
  BATTLE.playerDef = 0;
  updateBattleUI();
  if(S.hp <= 0){ loseBattle(); return; }
  enemyIntent();
  renderBattleGu();
}
function elOfPlayerDominant(){
  // 以第一只攻击蛊的属性为参照
  const atk = S.gu.find(g=>{ const d=guById(g.id); return d.type==="攻"; });
  return atk ? guById(atk.id).el : "灵";
}

function updateBattleUI(){
  const e = BATTLE.enemy;
  $("enemy-hp-text").textContent = `${Math.max(0,e.hp)}/${e.maxHp}`;
  $("enemy-hp-fill").style.width = Math.max(0,e.hp/e.maxHp*100)+"%";
  $("player-hp-text").textContent = `${Math.max(0,S.hp)}/${S.maxHp}`;
  $("player-hp-fill").style.width = Math.max(0,S.hp/S.maxHp*100)+"%";
  $("battle-sea-val").textContent = S.sea;
  renderBattleGu();
}

function winBattle(){
  BATTLE.over = true;
  const e = BATTLE.enemy;
  battleLog(`你击败了 ${e.name}！`, "sys");
  S.stone += e.stoneReward;
  S.cult += Math.round(e.cultReward * aptMult());
  let drops = [];
  drops.push(`元石 +${e.stoneReward}`);
  drops.push(`修为 +${Math.round(e.cultReward*aptMult())}`);
  if(e.dropGu && S.gu.length < S.guCap){
    addGu(e.dropGu); drops.push(`蛊虫 ${guById(e.dropGu).name}`);
  }
  if(e.story){ S.flags.fangZhengMet = true; drops.push("剧情：方正之怨，自此结下"); }
  // 检查晋升
  let promoted = false;
  while(S.cult >= cultMax() && S.rank < RANKS.length-1){
    S.cult = 0; S.rank++;
    S.maxHp = RANKS[S.rank].hpBase + (S.apt==="甲"?40:S.apt==="乙"?20:0);
    S.hp = S.maxHp; S.sea = seaMax(); S.guCap = 3+S.rank;
    promoted = true;
  }
  logMsg(`<span class="good">【历练胜】击败 ${e.name}：${drops.join("， ")}。</span>`,"good");
  if(promoted) logMsg(`<span class="good">【突破】晋升为 ${RANKS[S.rank].name}！</span>`,"good");
  setTimeout(()=>{
    $("battle-screen").classList.remove("active");
    renderGu(); refreshUI();
    checkStoryEvent();
  }, 900);
}

function loseBattle(){
  BATTLE.over = true;
  logMsg(`<span class="bad">【战败】你不敌 ${BATTLE.enemy.name}，气绝倒地……</span>`,"bad");
  // 春秋蝉重生
  if(hasGu("springAutumn") && !S.flags.rebirthUsed){
    setTimeout(()=>{
      showModal("身陨 · 春秋蝉", `你身陨于 ${BATTLE.enemy.name} 之手。<br>危急关头，体内春秋蝉发动——<br><span class="grade" style="color:var(--gold2)">十大奇蛊第七，逆转光阴！</span><br>光阴倒流，你回到了今日清晨。`, [
        {label:"逆流重生", cls:"btn-primary", fn:()=>{
          S.flags.rebirthUsed = true;
          // 移除春秋蝉
          S.gu = S.gu.filter(g=>g.id!=="springAutumn");
          S.flags.hasCicada = false;
          // 回复状态
          S.hp = S.maxHp; S.sea = seaMax();
          $("battle-screen").classList.remove("active");
          renderGu(); refreshUI();
          logMsg(`<span class="good">【重生】春秋蝉逆转光阴，你回到了清晨。蛊已散，记忆犹存——这一世，再不可轻死。</span>`,"good");
        }}
      ]);
    }, 500);
    return;
  }
  // 真正死亡
  setTimeout(()=>{
    showModal("身陨道消", `五百年魔道巨擘，竟陨落于 ${BATTLE.enemy.name} 之手。<br>无春秋蝉可逆光阴，道消身灭。<br><span class="fail">在 ${RANKS[S.rank].name} 境界、第 ${S.day} 日终结。</span>`, [
      {label:"重新开始", cls:"btn-primary", fn:()=> location.reload() }
    ]);
  }, 500);
}

function tryFlee(){
  if(BATTLE.over) return;
  // 低转逃跑成功率低，高转高
  const chance = 0.4 + S.rank*0.12;
  if(Math.random() < chance){
    battleLog("你虚晃一蛊，抽身而退，逃离战斗。", "sys");
    BATTLE.over = true;
    logMsg(`<span class="bad">你从 ${BATTLE.enemy.name} 手中逃遁。</span>`,"bad");
    setTimeout(()=>{ $("battle-screen").classList.remove("active"); renderGu(); refreshUI(); }, 700);
  } else {
    battleLog("逃跑失败！敌人趁机反扑！", "foe");
    enemyAct();
  }
}

/* ============ 剧情事件 ============ */
function checkStoryEvent(){
  if(S.day===3 && !S.flags.ev3){
    S.flags.ev3 = true;
    logMsg(`<span class="sys">【剧情】</span>弟弟方正来找麻烦，话中带刺。你淡淡看他一眼，目光如冰刃，他诺诺而退。前世之怨，已埋下种子。`,"sys");
    showModal("剧情 · 兄弟", `弟弟方正站在门口，神色讪讪：<br>"那明天见，哥哥。"<br><br>你眼中幽光一闪——五百年记忆中，他测出甲等资质后，没少刁难你。<br>但此刻，你心冷似霜，无心敲打路人。<br><span class="fail">只要不阻碍我赶路，那就一边玩自己的蛋去。</span>`, [{label:"漠然",cls:"btn-primary"}]);
    return;
  }
  if(S.rank>=1 && !S.flags.evRank1){
    S.flags.evRank1 = true;
    logMsg(`<span class="sys">【剧情】</span>晋升一转蛊师！族中家老纷纷侧目。你心中冷笑：青茅山这牢笼，终有一日要踏破。`,"sys");
  }
  if(S.rank>=3 && !S.flags.evRank3){
    S.flags.evRank3 = true;
    showModal("剧情 · 离巢", `三转蛊师——已有自保之力。<br><br>你站在高脚吊楼的窗前，望着青茅山的夜色。<br>"短时间之内，姑且在这牢笼里折腾拳脚吧。晋升三转，便离开这穷山僻壤。"<br><br><span class="good">如今，时候到了。天地广阔，魔道长存。</span>`, [{label:"踏破牢笼",cls:"btn-primary"}]);
    logMsg(`<span class="good">【里程碑】三转蛊师！你已可踏破青茅山牢笼，纵横南疆。</span>`,"good");
  }
  if(S.day>=40 && !S.flags.evLate){
    S.flags.evLate = true;
    logMsg(`<span class="sys">【剧情】</span>白家寨的天才白凝冰，传闻已修至三转。前世中，此子将来与你有诸多纠葛。`,"sys");
  }
}

/* ============ 启动 ============ */
window.addEventListener("DOMContentLoaded", ()=>{
  typeIntro();
});
