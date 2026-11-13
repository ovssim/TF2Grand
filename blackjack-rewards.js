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
    claimed:Array.isArray(saved.claimed)?[...new Set(saved.claimed.map(Number).filter(n=>Number.isInteger(n)&&n>0&&n%5===0))].slice(0,500):[]
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
  saveRewardTrack(); renderRewardPath();
  if(gained>0 && $('reward-claim-message')) {
    $('reward-claim-message').textContent=`★ LEVEL UP! Reached level ${RewardTrack.level}. Claim any unlocked checkpoints below.`;
    $('reward-claim-message').classList.add('reward-leveled');
  }
}
function rewardCaseForLevel(level) {
  if(!cases.length)return null;
  const sorted=[...cases].sort((a,b)=>a.price-b.price);
  const tier=Math.min(5,Math.max(1,Math.floor(level/20)));
  const tierFraction=[0,.1,.3,.5,.72,.93][tier];
  const idx=Math.max(0,Math.min(sorted.length-1,Math.round((sorted.length-1)*tierFraction)));
  return sorted[idx];
}
function rewardBonusCoins(level) {
  return fromCents(cents(.6+Math.pow(level/5,1.25)*.35));
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
  const next=Math.max(5,Math.floor((level-1)/5)*5+5);
  const pending=[];
  for(let n=5;n<=Math.min(level,200);n+=5){if(!claimed.includes(n))pending.push(n);}
  const targets=[...pending];
  for(let n=next;targets.length<Math.min(7,pending.length+5)&&n<=200;n+=5){if(!targets.includes(n))targets.push(n);}
  if(targets.length===0)targets.push(200);
  const frag=document.createDocumentFragment();
  targets.slice(0,9).forEach(n=>{
    const unlocked=level>=n,got=claimed.includes(n),box=n%20===0,rewardCase=box?rewardCaseForLevel(n):null;
    const card=createElement('article',`reward-milestone ${box?'is-case':''} ${unlocked?'unlocked':'locked'} ${got?'claimed':''}`);
    const progressTag=createElement('span','reward-step',`LVL ${n}`);card.appendChild(progressTag);
    const art=createElement('div','reward-milestone-art');
    if(box){ if(rewardCase)art.appendChild(itemImage(rewardCase)); else art.textContent='▣'; }
    else art.innerHTML='<span class="reward-coins-icon">⛃</span>';
    card.appendChild(art);
    card.appendChild(createElement('strong','reward-title',box?`${['','BRONZE','SILVER','GOLD','PLATINUM','DIAMOND'][Math.min(5,n/20)]} BONUS CASE`: 'COIN BONUS'));
    card.appendChild(createElement('span','reward-description',box?(rewardCase?rewardCase.name:'Bonus case loads with your case library'):`+⛃ ${money(rewardBonusCoins(n))}`));
    const btn=createElement('button',unlocked&&!got?'reward-claim-btn':'reward-claim-btn disabled',got?'✓ CLAIMED':unlocked?'OPEN REWARD':`LOCKED · LVL ${n}`);
    btn.type='button';btn.disabled=!unlocked||got||Boolean(box&&!rewardCase);
    btn.onclick=()=>claimReward(n);
    card.appendChild(btn);frag.appendChild(card);
  });
  $('reward-milestones').replaceChildren(frag);
}
async function claimReward(level){
  if(!Number.isInteger(level)||level%5!==0||level<=0||level>200||level>RewardTrack.level||RewardTrack.claimed.includes(level))return;
  const box=level%20===0,gameCase=box?rewardCaseForLevel(level):null;
  if(box&&!gameCase)return siteAlert('The case catalog has not loaded yet.');
  if((typeof Champion!=='undefined'&&Champion.battleRunning)||Upgrader.upgrading||isSpinning||isFlipping||Blackjack.running||(typeof CaseBattle!=='undefined'&&CaseBattle.running))return siteAlert('Finish your current game before claiming a reward.');
  // Mark claimed alongside credit before updating the UI; duplicate clicks cannot double-claim.
  RewardTrack.claimed.push(level);
  if(box){
    const item=getRandomItem(gameCase.items);
    if(!item){RewardTrack.claimed=RewardTrack.claimed.filter(n=>n!==level);return siteAlert('The bonus case could not produce an item.');}
    inventory.push(normalizedItem(item));
    recentDrops.push(normalizedItem(item));recentDrops=recentDrops.slice(-40);
    saveInventory();
    $('reward-claim-message').textContent=`★ LEVEL ${level} ${gameCase.name} OPENED — ${item.name} (⛃ ${money(item.price)})`;
    saveRewardTrack();refreshEconomy();
    siteAlert(`LEVEL ${level} REWARD CASE OPENED!\n\n${gameCase.name}\n\nYou unboxed: ${item.name}\nQuality: ${String(item.rarity).toUpperCase()}\nValue: ⛃ ${money(item.price)}\n\nThe item was added to your backpack.`, 'MILESTONE REWARD');
  }else{
    const bonus=rewardBonusCoins(level);
    coins=fromCents(cents(coins)+cents(bonus));
    $('reward-claim-message').textContent=`★ LEVEL ${level} BONUS CLAIMED — +⛃ ${money(bonus)}`;
    saveRewardTrack();updateCoins();
    siteAlert(`LEVEL ${level} BONUS CLAIMED!\n\nReceived ⛃ ${money(bonus)} virtual coins.`, 'MILESTONE REWARD');
  }
  renderRewardPath();
}

/* ---------- Blackjack table with refundable reload-safe stake ---------- */
const BLACKJACK_ESCROW_KEY='tf2grand_blackjack_escrow_v1';
const Blackjack={
  running:false,selectedUids:[],wagerItems:[],wagerCoins:0,
  playerHand:[],dealerHand:[],shoe:[],dealer:null,settled:false,hideDealer:true
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
  $('bj-hit').disabled=!Blackjack.running;
  $('bj-stand').disabled=!Blackjack.running;
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
  Blackjack.running=false;Blackjack.selectedUids=[];Blackjack.wagerItems=[];Blackjack.wagerCoins=0;
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
  Blackjack.running=true;Blackjack.settled=false;Blackjack.wagerItems=stake.map(item=>({...item}));Blackjack.wagerCoins=coinsBet;
  Blackjack.dealer=getRandomAquaticBot(Blackjack.dealer?.name||'');$('bj-dealer-name').textContent=Blackjack.dealer.name.toUpperCase();
  localStorage.setItem(BLACKJACK_ESCROW_KEY,JSON.stringify({status:'pending',coins:coinsBet,items:Blackjack.wagerItems}));
  coins=fromCents(cents(coins)-cents(coinsBet));
  inventory=inventory.filter(item=>!ids.has(item.uid));
  saveInventory();updateCoins();refreshEconomy();
  Blackjack.shoe=createBlackjackShoe();Blackjack.playerHand=[];Blackjack.dealerHand=[];Blackjack.hideDealer=true;
  // Deal two player cards and two dealer cards in alternating order.
  Blackjack.playerHand.push(blackjackDraw());Blackjack.dealerHand.push(blackjackDraw());
  Blackjack.playerHand.push(blackjackDraw());Blackjack.dealerHand.push(blackjackDraw());
  blackjackRenderHands();blackjackSetStatus('YOUR TURN · HIT OR STAND');
  renderBlackjackSelection();
  if(blackjackHandValue(Blackjack.playerHand)===21||blackjackHandValue(Blackjack.dealerHand)===21){
    // Both naturals push. Only player's natural is paid at 3:2.
    blackjackStand(true);
  }
}
function blackjackHit(){
  if(!Blackjack.running||Blackjack.settled)return;
  Blackjack.playerHand.push(blackjackDraw());blackjackRenderHands();
  if(blackjackHandValue(Blackjack.playerHand)>21)blackjackFinish('loss','BUST — OVER 21!');
  else if(blackjackHandValue(Blackjack.playerHand)===21)blackjackStand();
  else blackjackSetStatus('CARD DRAWN · HIT OR STAND');
}
function blackjackStand(fromNatural=false){
  if(!Blackjack.running||Blackjack.settled)return;
  Blackjack.hideDealer=false;blackjackRenderHands();
  const p=blackjackHandValue(Blackjack.playerHand),d=blackjackHandValue(Blackjack.dealerHand);
  const pNatural=Blackjack.playerHand.length===2&&p===21;
  const dNatural=Blackjack.dealerHand.length===2&&d===21;
  if(pNatural||dNatural){
    const result=pNatural&&dNatural?'push':pNatural?'win':'loss';
    return blackjackFinish(result, result==='push'?'BOTH BLACKJACK — PUSH':pNatural?'NATURAL BLACKJACK!':'DEALER HAS BLACKJACK',pNatural&&!dNatural);
  }
  while(blackjackHandValue(Blackjack.dealerHand)<17)Blackjack.dealerHand.push(blackjackDraw());
  blackjackRenderHands();const finalD=blackjackHandValue(Blackjack.dealerHand);
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
  renderRewardPath();
  // Send all subsequent inventory changes to the Blackjack wager list as well.
  const inventoryEvents=new MutationObserver(()=>{if(!Blackjack.running)renderBlackjackSelection();});
  if($('inventory'))inventoryEvents.observe($('inventory'),{childList:true});
});
