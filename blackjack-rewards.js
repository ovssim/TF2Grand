/* ====================================================================
   TF2GRAND — Blackjack + Reward Pathway expansion
   Browser-local virtual items only. Uses script.js globals and case pools.
   ==================================================================== */
'use strict';

const AQUATIC_BOTS = Object.freeze([
  {name:'FishBot',emoji:'🐟'}, {name:'Lobster Larry',emoji:'🦞'},
  {name:'Clawbert',emoji:'🦀'}, {name:'Krilliam',emoji:'🦐'},
  {name:'OctoByte',emoji:'🐙'}, {name:'Captain Clam',emoji:'🐚'},
  {name:'Puffer Punk',emoji:'🐡'}, {name:'Manta Ace',emoji:'🌊'},
  {name:'ReefRunner',emoji:'🪸'}, {name:'Angler Ace',emoji:'🐟'},
  {name:'Squid Kid',emoji:'🦑'}, {name:'Eel Deal',emoji:'⚡'},
  {name:'Barnacle Bill',emoji:'⚓'}, {name:'The Lobsterman',emoji:'🦞'},
  {name:'ShrimpStack',emoji:'🦐'}, {name:'Crab Commander',emoji:'🦀'},
  {name:'Jelly Jester',emoji:'🪼'}, {name:'Great White',emoji:'🦈'},
  {name:'Tide Tyrant',emoji:'🌊'}, {name:'Coral Crusher',emoji:'🪸'}
]);
function getRandomAquaticBot(exclude='') {
  const choices=AQUATIC_BOTS.filter(entry=>entry.name!==exclude);
  return choices[Math.floor(Math.random()*choices.length)] || AQUATIC_BOTS[0];
}

/* ---------- Persistent XP and claimable milestones ---------- */
const REWARD_STORAGE_KEY = 'tf2grand_reward_path_v1';
const REWARD_XP_PER_COIN = 10;
function experienceNeeded(level) {
  const exponent=Math.max(0,Math.min(180,Math.floor(level)-1));
  return Math.min(1e12,Math.ceil(85*Math.pow(1.085,exponent)));
}
function loadRewardTrack() {
  const saved=safeJSON(REWARD_STORAGE_KEY,{});
  return {
    level:Math.max(1,Math.min(200,Math.floor(Number(saved.level)||1))),
    xp:Math.max(0,Math.min(1e13,Number(saved.xp)||0)),
    totalSpent:Math.max(0,Math.min(1e14,Number(saved.totalSpent)||0)),
    claimed:Array.isArray(saved.claimed)?[...new Set(saved.claimed.map(Number).filter(n=>Number.isInteger(n)&&n>=2&&n<=200))].slice(0,200):[]
  };
}
let RewardTrack=loadRewardTrack();
function saveRewardTrack(){localStorage.setItem(REWARD_STORAGE_KEY,JSON.stringify(RewardTrack));}
function awardSpendXP(amount,source='game') {
  const n=Number(amount);
  if(!Number.isFinite(n)||n<=0)return;
  const spent=fromCents(cents(n));
  if(spent<=0)return;
  RewardTrack.totalSpent=fromCents(cents(RewardTrack.totalSpent)+cents(spent));
  RewardTrack.xp=Math.round((RewardTrack.xp+spent*REWARD_XP_PER_COIN)*10)/10;
  let gained=0;
  // Maximum level is deliberately bounded for predictable display and saves.
  while (RewardTrack.level<200 && RewardTrack.xp+1e-8>=experienceNeeded(RewardTrack.level)) {
    RewardTrack.xp=Math.max(0,Math.round((RewardTrack.xp-experienceNeeded(RewardTrack.level))*10)/10);
    RewardTrack.level++; gained++;
  }
  if(RewardTrack.level===200) RewardTrack.xp=0;
  accrueRakeback(spent);
  saveRewardTrack(); renderRewardPath();
  if(gained>0 && $('reward-claim-message')) {
    $('reward-claim-message').textContent=`★ LEVEL UP! Reached level ${RewardTrack.level}. Claim any unlocked checkpoints below.`;
    $('reward-claim-message').classList.add('reward-leveled');
  }
}
function rewardCaseForLevel(level) {
  if(!cases.length)return null;
  const sorted=[...cases].filter(c=>Array.isArray(c.items)&&c.items.some(item=>item.weight>0)).sort((a,b)=>a.price-b.price);
  if(!sorted.length)return null;
  // Budget-friendly milestone cases, every 10th level.
  const percentile=Math.min(.46,.02+level*.0022);
  return sorted[Math.min(sorted.length-1,Math.floor((sorted.length-1)*percentile))];
}
function rewardBonusCoins(level) {
  // Smaller payouts than the old five-level reward schedule.
  return fromCents(cents(.13+.065*Math.sqrt(level)));
}
function rewardRankTitle(level) {
  if(level<20)return 'FRESH RECRUIT';
  if(level<40)return 'SUPPLY RUNNER';
  if(level<60)return 'VAULT BREAKER';
  if(level<80)return 'RELIC HUNTER';
  if(level<100)return 'MASTER UNBOXER';
  return 'DEPOT LEGEND';
}
function renderRewardPath(){
  if(!$('reward-milestones'))return;
  const {level,xp,totalSpent,claimed}=RewardTrack;
  const needed=experienceNeeded(level),portion=level===200?100:Math.min(100,xp/needed*100);
  $('reward-level').textContent=String(level);
  $('reward-level-title').textContent=rewardRankTitle(level);
  $('reward-xp-label').textContent=level===200?'MAX LEVEL':`${xp.toFixed(1)} / ${needed.toLocaleString()} XP`;
  $('reward-total-spent').textContent=`⛃ ${money(totalSpent)}`;
  $('reward-progress-fill').style.width=`${portion}%`;
  const progress=$('reward-progress-track');
  progress.setAttribute('aria-valuenow',String(Math.min(needed,xp)));
  progress.setAttribute('aria-valuemax',String(needed));
  const pending=[];
  for(let n=2;n<=level&&n<=200;n++)if(!claimed.includes(n))pending.push(n);
  const targets=pending.slice(0,7);
  let next=Math.max(2,level+1);
  while(targets.length<7&&next<=200)targets.push(next++);
  if(!targets.length)targets.push(200);
  const frag=document.createDocumentFragment();
  targets.forEach(n=>{
    const unlocked=level>=n,got=claimed.includes(n),box=n%10===0,rewardCase=box?rewardCaseForLevel(n):null;
    const card=createElement('article',`reward-milestone ${box?'is-case':''} ${unlocked?'unlocked':'locked'} ${got?'claimed':''}`);
    card.appendChild(createElement('span','reward-step',`LVL ${n}`));
    const art=createElement('div','reward-milestone-art');
    if(box){if(rewardCase)art.appendChild(itemImage(rewardCase));else art.textContent='▣';}
    else art.appendChild(createElement('span','reward-coins-icon','⛃'));
    card.appendChild(art);
    card.appendChild(createElement('strong','reward-title',box?'BONUS CASE':'COIN BONUS'));
    card.appendChild(createElement('span','reward-description',box?(rewardCase?rewardCase.name:'Requires case catalog'):`+⛃ ${money(rewardBonusCoins(n))}`));
    const btn=createElement('button',unlocked&&!got?'reward-claim-btn':'reward-claim-btn disabled',got?'✓ CLAIMED':unlocked?'CLAIM REWARD':`LOCKED · LVL ${n}`);
    btn.type='button';btn.disabled=!unlocked||got||Boolean(box&&!rewardCase);
    btn.onclick=()=>claimReward(n);
    card.appendChild(btn);frag.appendChild(card);
  });
  $('reward-milestones').replaceChildren(frag);
}
async function claimReward(level){
  if(!Number.isInteger(level)||level<2||level>200||level>RewardTrack.level||RewardTrack.claimed.includes(level))return;
  const box=level%10===0,gameCase=box?rewardCaseForLevel(level):null;
  if(box&&!gameCase)return siteAlert('The case catalog has not loaded yet.');
  if((typeof Champion!=='undefined'&&Champion.battleRunning)||Upgrader.upgrading||isSpinning||isFlipping||Blackjack.running||(typeof CaseBattle!=='undefined'&&CaseBattle.running))return siteAlert('Finish your current game before claiming a reward.');
  RewardTrack.claimed.push(level);
  if(box){
    const item=getRandomItem(gameCase.items);
    if(!item){RewardTrack.claimed=RewardTrack.claimed.filter(n=>n!==level);return siteAlert('The bonus case could not produce an item.');}
    inventory.push(normalizedItem(item));
    recentDrops.push(normalizedItem({...item,wonAt:Date.now()}));recentDrops=recentDrops.slice(-40);
    saveInventory();
    $('reward-claim-message').textContent=`★ LEVEL ${level} REWARD CASE — ${item.name} (⛃ ${money(item.price)})`;
    saveRewardTrack();refreshEconomy();
    await showRewardReel({title:`LEVEL ${level} BONUS CASE`,subtitle:`${gameCase.name} · Prize added to your backpack`,entries:gameCase.items,winner:item,kind:'items'});
  }else{
    const bonus=rewardBonusCoins(level);
    coins=fromCents(cents(coins)+cents(bonus));
    $('reward-claim-message').textContent=`★ LEVEL ${level} BONUS — +⛃ ${money(bonus)}`;
    saveRewardTrack();updateCoins();
    siteAlert(`LEVEL ${level} BONUS!\n\nReceived ⛃ ${money(bonus)} virtual coins.`, 'LEVEL REWARD');
  }
  renderRewardPath();
}


/* Reward-opening reel: prize is determined once, before animation. */
function showRewardReel({title,subtitle='',entries=[],winner,kind='coins'}) {
  return new Promise(resolve => {
    const existing=document.getElementById('reward-reel-overlay');
    if(existing)existing.remove();
    const overlay=createElement('div','reward-reel-overlay');overlay.id='reward-reel-overlay';
    const dialog=createElement('div','reward-reel-dialog');dialog.setAttribute('role','dialog');dialog.setAttribute('aria-modal','true');
    const eyebrow=createElement('span','reward-reel-eyebrow','✦ TF2GRAND / SUPPLY DROP');
    const heading=createElement('h2','',title);
    const sub=createElement('p','',subtitle);
    const close=createElement('button','reward-reel-close','×');close.type='button';close.setAttribute('aria-label','Close reward popup');
    const windowBox=createElement('div','reward-reel-window');
    const pointer=createElement('div','reward-reel-pointer');
    const strip=createElement('div','reward-reel-strip');windowBox.append(strip,pointer);
    const result=createElement('div','reward-reel-result','OPENING REWARD...');result.setAttribute('role','status');
    const done=createElement('button','cta-btn compact reward-reel-done','COLLECT REWARD');done.type='button';done.disabled=true;
    dialog.append(eyebrow,heading,sub,close,windowBox,result,done);overlay.append(dialog);document.body.append(overlay);
    const clean=()=>{overlay.remove();document.removeEventListener('keydown',escape);resolve();};
    const escape=e=>{if(e.key==='Escape'&& !done.disabled)clean();};
    document.addEventListener('keydown',escape);
    close.onclick=()=>{if(!done.disabled)clean();};
    done.onclick=clean;
    overlay.onclick=e=>{if(e.target===overlay&&!done.disabled)clean();};
    const choices=entries.length?entries:[winner];
    const tiles=37,winningIndex=31;
    for(let i=0;i<tiles;i++){
      const entry=i===winningIndex?winner:choices[Math.floor(Math.random()*choices.length)];
      const tile=createElement('div',`reward-reel-tile ${kind==='items'?qualityClass(entry.rarity):'reward-reel-coin'}`);
      if(kind==='items'&&entry.image){tile.appendChild(itemImage(entry,'reward-reel-image'));}
      else tile.appendChild(createElement('strong','reward-reel-symbol','⛃'));
      tile.appendChild(createElement('span','',kind==='items'?entry.name:`⛃ ${money(entry.coins)}`));
      strip.appendChild(tile);
    }
    const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const finish=()=>{
      result.textContent=kind==='items'?`✦ YOU WON ${winner.name} · ⛃ ${money(winner.price)}`:`✦ YOU WON ⛃ ${money(winner.coins)}!`;
      result.classList.add('is-winner');done.disabled=false;
      close.textContent='×';
    };
    requestAnimationFrame(()=>requestAnimationFrame(()=>{
      const tile=strip.children[winningIndex];
      const target=tile.offsetLeft+tile.offsetWidth/2-windowBox.clientWidth/2;
      strip.style.transition=reduced?'none':'transform 3.4s cubic-bezier(.12,.68,.12,1)';
      strip.style.transform=`translateX(${-target}px)`;
      if(reduced){finish();return;}
      strip.addEventListener('transitionend',finish,{once:true});
      setTimeout(()=>{if(done.disabled)finish();},3800);
    }));
  });
}

/* ---------- Rakeback and free coin case ---------- */
const RAKEBACK_STORAGE_KEY='tf2grand_rakeback_v1';
const FREE_CASE_STORAGE_KEY='tf2grand_free_case_v1';
const RAKEBACK_UNITS_PER_COIN=100000;
const FREE_CASE_COOLDOWN_MS=15*60*1000;
const Rakeback={pendingUnits:Math.max(0,Math.floor(Number(safeJSON(RAKEBACK_STORAGE_KEY,{}).pendingUnits)||0))};
const FreeCoinsCase={nextAt:Math.max(0,Number(safeJSON(FREE_CASE_STORAGE_KEY,{}).nextAt)||0),opening:false};
// User's weights add to 101%; treating them as relative weights gives valid odds.
const FREE_CASE_WEIGHTS=[{coins:1,weight:73},{coins:10,weight:20},{coins:50,weight:4},{coins:100,weight:2},{coins:200,weight:1},{coins:500,weight:.5},{coins:750,weight:.3},{coins:1000,weight:.2}];
function accrueRakeback(wagerValue){
  const amount=Number(wagerValue);
  if(!Number.isFinite(amount)||amount<=0)return;
  // 0.1% of wager value, retained to 1/100,000 coin rather than rounding to cents.
  Rakeback.pendingUnits+=Math.max(0,Math.round(amount*100));
  localStorage.setItem(RAKEBACK_STORAGE_KEY,JSON.stringify(Rakeback));
  updateBonusPanels();
}
function claimRakeback(){
  if(typeof CaseBattle!=='undefined'&&CaseBattle.running || Upgrader.upgrading || isFlipping || isSpinning || Blackjack.running || typeof Champion!=='undefined'&&Champion.battleRunning)return;
  const payableCents=Math.floor(Rakeback.pendingUnits/(RAKEBACK_UNITS_PER_COIN/100));
  if(payableCents<1)return siteAlert('Your rakeback is still below ⛃ 0.01. Keep wagering to accumulate it.');
  const amount=fromCents(payableCents);
  coins=fromCents(cents(coins)+payableCents);
  Rakeback.pendingUnits=0;
  localStorage.setItem(RAKEBACK_STORAGE_KEY,JSON.stringify(Rakeback));
  updateCoins();updateBonusPanels();
  siteAlert(`CLAIMED!\n\n+⛃ ${money(amount)} virtual coins.\nYour rakeback has been cleared.`, 'RAKEBACK');
}
function chooseFreeCaseAmount(){
  const total=FREE_CASE_WEIGHTS.reduce((sum,x)=>sum+x.weight,0);
  let roll=Math.random()*total;
  for(const tier of FREE_CASE_WEIGHTS){roll-=tier.weight;if(roll<0)return tier.coins;}
  return FREE_CASE_WEIGHTS[FREE_CASE_WEIGHTS.length-1].coins;
}
async function openFreeCoinsCase(){
  if(FreeCoinsCase.opening||Date.now()<FreeCoinsCase.nextAt)return;
  if(typeof CaseBattle!=='undefined'&&CaseBattle.running || Upgrader.upgrading || isFlipping || isSpinning || Blackjack.running || typeof Champion!=='undefined'&&Champion.battleRunning)return siteAlert('Finish the active game before opening your free coin case.');
  FreeCoinsCase.opening=true;
  const prize=chooseFreeCaseAmount();
  // Commit cooldown and reward immediately so a refresh cannot grant a second roll.
  FreeCoinsCase.nextAt=Date.now()+FREE_CASE_COOLDOWN_MS;
  localStorage.setItem(FREE_CASE_STORAGE_KEY,JSON.stringify({nextAt:FreeCoinsCase.nextAt}));
  coins=fromCents(cents(coins)+cents(prize));
  updateCoins();recordWin('Free Coin Case',{prizeCoins:prize});
  const result=$('free-case-result');
  if(result)result.textContent='✦ OPENING YOUR FREE COIN CASE...';
  try {
    await showRewardReel({title:'FREE COIN CASE',subtitle:'Your free reward · Next case available in 15 minutes',entries:FREE_CASE_WEIGHTS,winner:{coins:prize},kind:'coins'});
  } finally {
    if(result)result.textContent=`✦ YOU UNBOXED ⛃ ${money(prize)}!`;
    FreeCoinsCase.opening=false;updateBonusPanels();
  }
}
function updateBonusPanels(){
  const rake=$('rakeback-balance');
  if(rake)rake.textContent=`⛃ ${(Rakeback.pendingUnits/RAKEBACK_UNITS_PER_COIN).toFixed(5)}`;
  const rb=$('rakeback-claim');if(rb)rb.disabled=Rakeback.pendingUnits<1000;
  const remaining=Math.max(0,FreeCoinsCase.nextAt-Date.now());
  const timer=$('free-case-timer');
  if(timer){
    const secs=Math.ceil(remaining/1000);
    timer.textContent=secs>0?`NEXT FREE CASE IN ${Math.floor(secs/60).toString().padStart(2,'0')}:${(secs%60).toString().padStart(2,'0')}`:'YOUR FREE CASE IS READY';
  }
  const button=$('free-case-claim');if(button){button.disabled=remaining>0||FreeCoinsCase.opening;button.textContent=FreeCoinsCase.opening?'OPENING...':remaining>0?'COOLDOWN ACTIVE':'✦ OPEN FREE COIN CASE';}
}
function setupBonusPanels(){
  const rewards=$('rewards-section');const summary=rewards?.querySelector('.reward-summary');if(!summary||$('rewards-extra-grid'))return;
  const intro=rewards.querySelector('.section-heading p');if(intro)intro.textContent='Earn XP from every wager. Claim a smaller reward at every level, plus bonus cases at every 10th level.';
  const heading=rewards.querySelector('.reward-pathway-top h3');if(heading)heading.textContent='YOUR NEXT LEVEL REWARDS';
  const grid=createElement('div','rewards-extra-grid');grid.id='rewards-extra-grid';
  const rake=createElement('div','rewards-extra-panel');
  rake.innerHTML='<span class="eyebrow">CASHBACK / 0.1% OF WAGERS</span><h3>RAKEBACK</h3><strong class="extra-big-amount" id="rakeback-balance">⛃ 0.00000</strong><p>Every virtual coin or item wager adds 0.1% of its value. Accumulates until claimed.</p><button type="button" class="theme-btn" id="rakeback-claim">CLAIM RAKEBACK</button><small>Claims start at ⛃ 0.01. Unpayable fractions are cleared on claim.</small>';
  const free=createElement('div','rewards-extra-panel free-case-panel');
  free.innerHTML='<span class="eyebrow">ONE CASE / EVERY 15 MINUTES</span><h3>FREE COIN CASE</h3><div class="free-case-coin" aria-hidden="true">⛃</div><p>Win 1, 10, 50, 100, 200, 500, 750 or 1,000 virtual coins.</p><button type="button" class="cta-btn compact" id="free-case-claim">✦ OPEN FREE COIN CASE</button><strong id="free-case-timer">YOUR FREE CASE IS READY</strong><span id="free-case-result" role="status" aria-live="polite"></span>';
  grid.append(rake,free);summary.insertAdjacentElement('afterend',grid);
  $('rakeback-claim').onclick=claimRakeback;
  $('free-case-claim').onclick=openFreeCoinsCase;
  updateBonusPanels();setInterval(updateBonusPanels,1000);
}

/* ---------- Blackjack table with refundable reload-safe stake ---------- */
const BLACKJACK_ESCROW_KEY='tf2grand_blackjack_escrow_v1';
const Blackjack={
  running:false,selectedUids:[],wagerItems:[],wagerCoins:0,
  playerHand:[],dealerHand:[],shoe:[],dealer:null,settled:false,hideDealer:true,busy:false
};
function recoverBlackjackEscrow(){
  const escrow=safeJSON(BLACKJACK_ESCROW_KEY,null);
  if(!escrow||escrow.status!=='pending'||!Array.isArray(escrow.items)||!Number.isFinite(escrow.coins)){localStorage.removeItem(BLACKJACK_ESCROW_KEY);return;}
  const owned=new Set(inventory.map(item=>item.uid));
  escrow.items.forEach(item=>{
    const copy=normalizedItem(item);if(copy&&!owned.has(copy.uid)){inventory.push(copy);owned.add(copy.uid);}
  });
  coins=fromCents(cents(coins)+Math.max(0,cents(escrow.coins)));
  localStorage.removeItem(BLACKJACK_ESCROW_KEY);
  refreshEconomy();
}
function blackjackEligible(item){
  return Boolean(item&&!item.favorite&&!isPureItem(item)&&!isItemLocked(item) &&
    !(typeof Champion!=='undefined'&&Champion.battleRunning));
}
function blackjackSelection(){return Blackjack.selectedUids.map(uid=>inventory.find(item=>item.uid===uid)).filter(Boolean);}
function blackjackCoinWager(){
  const value=Number($('bj-coin-bet')?.value||0);
  return Number.isFinite(value)&&value>=0?fromCents(cents(value)):0;
}
function renderBlackjackSelection(){
  const list=$('bj-item-list');if(!list)return;
  if(!Blackjack.running)Blackjack.selectedUids=Blackjack.selectedUids.filter(uid=>blackjackEligible(inventory.find(item=>item.uid===uid)));
  const stake=blackjackSelection(),query=($('bj-search')?.value||'').trim().toLowerCase();
  const available=inventory.filter(blackjackEligible).filter(item=>item.name.toLowerCase().includes(query)).sort((a,b)=>b.price-a.price);
  const frag=document.createDocumentFragment();
  if(!available.length)frag.appendChild(createElement('div','empty-small','No eligible items match.'));
  available.forEach(item=>{
    const selected=Blackjack.selectedUids.includes(item.uid);
    const btn=createElement('button',`duel-inventory-item ${qualityClass(item.rarity)} ${selected?'selected':''}`);
    btn.type='button';btn.disabled=Blackjack.running;btn.setAttribute('aria-pressed',String(selected));
    btn.append(itemImage(item),createElement('span','duel-inventory-name',item.name),createElement('strong','duel-inventory-price',`⛃ ${money(item.price)}`),createElement('span','duel-inventory-check',selected?'✓':'+'));
    btn.onclick=()=>{
      if(Blackjack.running)return;
      Blackjack.selectedUids=selected?Blackjack.selectedUids.filter(uid=>uid!==item.uid):[...Blackjack.selectedUids,item.uid];
      renderBlackjackSelection();
    };
    frag.appendChild(btn);
  });list.replaceChildren(frag);
  const itemValue=fromCents(stake.reduce((n,item)=>n+cents(item.price),0));
  const coinBet=blackjackCoinWager();
  $('bj-item-bet-value').textContent=`⛃ ${money(itemValue)}`;
  $('bj-total-bet-value').textContent=`⛃ ${money(itemValue+coinBet)}`;
  $('bj-item-count').textContent=`${stake.length} ITEMS`;
  $('bj-selected-label').textContent=`${stake.length} SELECTED`;
  $('bj-coin-bet').disabled=Blackjack.running;
  $('bj-max-coins').disabled=Blackjack.running;
  $('bj-clear').disabled=Blackjack.running||!stake.length;
  $('bj-deal').disabled=Blackjack.running||coinBet>coins||itemValue+coinBet<=0;
  $('bj-hit').disabled=!Blackjack.running||Blackjack.busy;
  $('bj-stand').disabled=!Blackjack.running||Blackjack.busy;
  const panel=$('bj-current-wager');
  if(panel){
    const view=Blackjack.running?Blackjack.wagerItems:stake;
    const wrap=document.createDocumentFragment();
    view.slice(0,10).forEach(item=>wrap.appendChild(coinflipMiniCard(item,'duel-stake-item')));
    const activeCoins=Blackjack.running?Blackjack.wagerCoins:coinBet;
    if(activeCoins>0)wrap.appendChild(createElement('div','duel-stake-item duel-stake-coins',`⛃ ${money(activeCoins)} coins`));
    if(!wrap.childNodes.length)wrap.appendChild(createElement('div','empty-small','Choose item or coin wagers above.'));
    panel.replaceChildren(wrap);
  }
}
function createBlackjackShoe(){
  const suits=['♠','♥','♦','♣'],ranks=['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
  const deck=[];
  for(let d=0;d<4;d++)for(const suit of suits)for(const rank of ranks)deck.push({suit,rank});
  for(let i=deck.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[deck[i],deck[j]]=[deck[j],deck[i]];}
  return deck;
}
function blackjackDraw(){if(!Blackjack.shoe.length)Blackjack.shoe=createBlackjackShoe();return Blackjack.shoe.pop();}
function blackjackHandValue(hand){
  let value=0,aces=0;
  for(const card of hand){if(card.rank==='A'){value+=11;aces++;}else if(['J','Q','K'].includes(card.rank))value+=10;else value+=Number(card.rank);}
  while(value>21&&aces){value-=10;aces--;}
  return value;
}
function blackjackRenderHands(){
  for(const side of ['dealer','player']){
    const cards=Blackjack[`${side}Hand`];const box=$(`bj-${side}-cards`);const frag=document.createDocumentFragment();
    cards.forEach((card,index)=>{
      const faceDown=side==='dealer'&&Blackjack.hideDealer&&index===1;
      const tile=createElement('div',`bj-playing-card ${faceDown?'face-down':''} ${['♥','♦'].includes(card.suit)?'red-suit':'black-suit'}`);
      if(faceDown)tile.append(createElement('div','bj-card-back','♠'));
      else{
        tile.append(createElement('span','bj-card-corner',`${card.rank}${card.suit}`),createElement('span','bj-card-suit',card.suit),createElement('span','bj-card-bottom',`${card.rank}${card.suit}`));
      }
      frag.appendChild(tile);
    });
    if(!cards.length)frag.appendChild(createElement('div','bj-table-placeholder',side==='player'?'Your hand will appear here.':'Waiting for the dealer...'));
    box.replaceChildren(frag);
    const score=$(`bj-${side}-score`);
    if(score){const visible=side==='player'||!Blackjack.hideDealer;score.textContent=visible?String(cards.length?blackjackHandValue(cards):'—'):cards.length?`${blackjackHandValue(cards.slice(0,1))} + ?`:'—';}
  }
}
function blackjackSetStatus(label){const status=$('bj-status');if(status)status.textContent=label;}
function blackjackResetAfter(){
  Blackjack.running=false;Blackjack.busy=false;Blackjack.selectedUids=[];Blackjack.wagerItems=[];Blackjack.wagerCoins=0;
  $('bj-coin-bet').value='0';
  renderBlackjackSelection();
}
async function blackjackDeal(){
  if(Blackjack.running || (typeof CaseBattle!=='undefined'&&CaseBattle.running))return;
  const stake=blackjackSelection();const coinsBet=blackjackCoinWager();
  const itemValue=fromCents(stake.reduce((n,item)=>n+cents(item.price),0));
  if(cents(coinsBet)>cents(coins)||cents(coinsBet)<0||cents(itemValue+coinsBet)<1)return siteAlert('Choose an affordable virtual coin wager or one or more items.');
  if(stake.length!==Blackjack.selectedUids.length||stake.some(item=>!blackjackEligible(item)))return siteAlert('Some of your selected items are no longer available.');
  const ids=new Set(stake.map(item=>item.uid));if(ids.size!==stake.length)return siteAlert('Duplicate wager selections are not allowed.');
  Blackjack.running=true;Blackjack.busy=true;Blackjack.settled=false;Blackjack.wagerItems=stake.map(item=>({...item}));Blackjack.wagerCoins=coinsBet;
  Blackjack.dealer=getRandomAquaticBot(Blackjack.dealer?.name||'');$('bj-dealer-name').textContent=Blackjack.dealer.name.toUpperCase();
  localStorage.setItem(BLACKJACK_ESCROW_KEY,JSON.stringify({status:'pending',coins:coinsBet,items:Blackjack.wagerItems}));
  coins=fromCents(cents(coins)-cents(coinsBet));
  inventory=inventory.filter(item=>!ids.has(item.uid));
  saveInventory();updateCoins();refreshEconomy();
  Blackjack.shoe=createBlackjackShoe();Blackjack.playerHand=[];Blackjack.dealerHand=[];Blackjack.hideDealer=true;
  // Animated, turn-by-turn dealing and dealer play; prevents double-actions.
  const delay=(ms)=>new Promise(resolve=>setTimeout(resolve,window.matchMedia('(prefers-reduced-motion: reduce)').matches?25:ms));
  blackjackRenderHands();renderBlackjackSelection();blackjackSetStatus('DEALING THE OPENING HAND...');
  for(const side of ['player','dealer','player','dealer']){
    Blackjack[`${side}Hand`].push(blackjackDraw());
    blackjackRenderHands();await delay(560);
  }
  if(blackjackHandValue(Blackjack.playerHand)===21||blackjackHandValue(Blackjack.dealerHand)===21){
    blackjackSetStatus('CHECKING BLACKJACK...');await delay(700);
    await blackjackStand(true,true);
  }else{
    Blackjack.busy=false;blackjackSetStatus('YOUR TURN · HIT OR STAND');renderBlackjackSelection();
  }
}
async function blackjackHit(){
  if(!Blackjack.running||Blackjack.settled||Blackjack.busy)return;
  Blackjack.busy=true;renderBlackjackSelection();blackjackSetStatus('DRAWING A CARD...');
  await new Promise(resolve=>setTimeout(resolve,window.matchMedia('(prefers-reduced-motion: reduce)').matches?25:420));
  Blackjack.playerHand.push(blackjackDraw());blackjackRenderHands();
  await new Promise(resolve=>setTimeout(resolve,window.matchMedia('(prefers-reduced-motion: reduce)').matches?25:780));
  const p=blackjackHandValue(Blackjack.playerHand);
  if(p>21){blackjackSetStatus('BUST!');await new Promise(resolve=>setTimeout(resolve,700));blackjackFinish('loss','BUST — OVER 21!');}
  else if(p===21)await blackjackStand(false,true);
  else{Blackjack.busy=false;blackjackSetStatus('CARD DRAWN · HIT OR STAND');renderBlackjackSelection();}
}
async function blackjackStand(fromNatural=false,alreadyBusy=false){
  if(!Blackjack.running||Blackjack.settled||(!alreadyBusy&&Blackjack.busy))return;
  Blackjack.busy=true;renderBlackjackSelection();
  const delay=ms=>new Promise(resolve=>setTimeout(resolve,window.matchMedia('(prefers-reduced-motion: reduce)').matches?25:ms));
  blackjackSetStatus('DEALER REVEALS THE HIDDEN CARD...');await delay(660);
  Blackjack.hideDealer=false;blackjackRenderHands();await delay(820);
  const p=blackjackHandValue(Blackjack.playerHand),d=blackjackHandValue(Blackjack.dealerHand);
  const pNatural=Blackjack.playerHand.length===2&&p===21;
  const dNatural=Blackjack.dealerHand.length===2&&d===21;
  if(pNatural||dNatural){
    const result=pNatural&&dNatural?'push':pNatural?'win':'loss';
    blackjackSetStatus('CHECKING NATURAL BLACKJACK...');await delay(750);
    return blackjackFinish(result,result==='push'?'BOTH BLACKJACK — PUSH':pNatural?'NATURAL BLACKJACK!':'DEALER HAS BLACKJACK',pNatural&&!dNatural);
  }
  while(blackjackHandValue(Blackjack.dealerHand)<17){
    blackjackSetStatus('DEALER DRAWS...');await delay(800);
    Blackjack.dealerHand.push(blackjackDraw());blackjackRenderHands();await delay(760);
  }
  const finalD=blackjackHandValue(Blackjack.dealerHand);
  blackjackSetStatus('COUNTING THE CARDS...');await delay(840);
  if(finalD>21)blackjackFinish('win','DEALER BUSTS — YOU WIN!');
  else if(p>finalD)blackjackFinish('win','YOU BEAT THE DEALER!');
  else if(p===finalD)blackjackFinish('push','PUSH — WAGER RETURNED');
  else blackjackFinish('loss','DEALER WINS THE HAND');
}

function blackjackFinish(result,headline,natural=false){
  if(Blackjack.settled||!Blackjack.running)return;
  Blackjack.settled=true;Blackjack.hideDealer=false;blackjackRenderHands();
  let reward=null,profit=0;
  if(result!=='loss'){
    inventory.push(...Blackjack.wagerItems.map(item=>normalizedItem(item)));
    coins=fromCents(cents(coins)+cents(Blackjack.wagerCoins));
  }
  if(result==='win'){
    profit=fromCents(Math.round(cents(Blackjack.wagerCoins)*(natural?1.5:1)));
    coins=fromCents(cents(coins)+cents(profit));
    const itemValue=fromCents(Blackjack.wagerItems.reduce((n,item)=>n+cents(item.price),0));
    if(itemValue>0){
      reward=buildCoinflipOpponent(itemValue);
      reward.items.forEach(item=>inventory.push(normalizedItem(item)));
      coins=fromCents(cents(coins)+cents(reward.coins));
    }
  }
  if(result==='win')recordWin('Blackjack',{prizeItems:reward?.items||[],prizeCoins:profit+(reward?.coins||0)});
  // Persist a finished round before clearing escrow, so refresh does not refund it twice.
  saveInventory();updateCoins();
  localStorage.removeItem(BLACKJACK_ESCROW_KEY);
  const wagerValue=fromCents(cents(Blackjack.wagerCoins)+Blackjack.wagerItems.reduce((n,item)=>n+cents(item.price),0));
  awardSpendXP(wagerValue,'blackjack');
  const msg=result==='loss'?`You lost ⛃ ${money(wagerValue)} in virtual wagers.`:
    result==='push'?`Your stake of ⛃ ${money(wagerValue)} was returned.`:
    `Your wager was returned! Coin profit: ⛃ ${money(profit)}. Item prize: ${reward?.items.map(item=>item.name).join(', ')||'none'}${reward?.coins?` plus ⛃ ${money(reward.coins)} coins`:''}.`;
  blackjackSetStatus(headline);
  $('blackjack-section').classList.remove('bj-win','bj-loss','bj-push');
  $('blackjack-section').classList.add(`bj-${result}`);
  blackjackResetAfter();refreshEconomy();
  siteAlert(`${headline}\n\n${msg}`, 'BLACKJACK RESULT');
}
function setupBlackjack(){
  if(!$('blackjack-section'))return;
  recoverBlackjackEscrow();
  Blackjack.dealer=getRandomAquaticBot();$('bj-dealer-name').textContent=Blackjack.dealer.name.toUpperCase();
  $('bj-coin-bet').addEventListener('input',renderBlackjackSelection);
  $('bj-search').addEventListener('input',renderBlackjackSelection);
  $('bj-max-coins').onclick=()=>{$('bj-coin-bet').value=money(coins);renderBlackjackSelection();};
  $('bj-clear').onclick=()=>{Blackjack.selectedUids=[];renderBlackjackSelection();};
  $('bj-deal').onclick=blackjackDeal;
  $('bj-hit').onclick=blackjackHit;
  $('bj-stand').onclick=()=>blackjackStand();
  blackjackRenderHands();renderBlackjackSelection();
}

document.addEventListener('DOMContentLoaded',()=>{
  setupBlackjack();
  setupBonusPanels();
  renderRewardPath();
  // Send all subsequent inventory changes to the Blackjack wager list as well.
  const inventoryEvents=new MutationObserver(()=>{if(!Blackjack.running)renderBlackjackSelection();});
  if($('inventory'))inventoryEvents.observe($('inventory'),{childList:true});
});
