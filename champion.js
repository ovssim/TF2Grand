/* ===================================================================
   TF2GRAND — CHAMPION MODE / FISHBOT
   Keeps the classic 125-HP, random TF2-weapon battle and 0.25–1.75x
   FishBot wager. Uses item UIDs (instead of array indices) for safety.
   =================================================================== */
'use strict';
const CHAMPION_MAX_HP = 125;
const CHAMPION_CRIT_CHANCE = 0.05;
const CHAMPION_CRIT_MULTIPLIER = 3;
const CHAMPION_MISS_CHANCE = 0.10;
const CHAMPION_MINI_CRIT_CHANCE = 0.20;
const CHAMPION_MINI_CRIT_MULTIPLIER = 1.33;
const CHAMPION_TURN_DELAY = 1600;
const MAX_BATTLE_LOG_ENTRIES = 6;
const CHAMPION_HP_BAR_LENGTH = 20;
const BOT_MIN_MULTIPLIER = .25;
const BOT_MAX_MULTIPLIER = 1.75;
const BOT_ITEM_SEARCH_ATTEMPTS = 48;
const BOT_MAX_ITEMS = 8;
const BOT_TARGET_TOLERANCE = .01;
const BOT_EXPENSIVE_ITEM_BIAS = 1.75;
const CHAMPION_ESCROW_KEY = 'tf2grand_champion_escrow';

const CHAMPION_WEAPONS = [
  'The Force-a-Nature','The Shortstop','The Minigun','The Shotgun','The Sniper Rifle',
  'The Sentry','The Huntsman','The Syringe Gun','The Loose Cannon','The Frontier Justice',
  'The Awper Hand','The Cow Mangler 5000',"The Cleaner's Carbine",'The Ambassador',
  'The Lugermorph','The Panic Attack','The Iron Curtain',
  "The Horseless Headless Horsemann's Headtaker",'The Direct Hit',
  'The ✨Golden Frying Pan','The Holy Mackerel'
];
const CHAMPION_DAMAGE_PHRASES = {
  'The Force-a-Nature':['meatshots the enemy for','launches the opponent for','blasts the enemy for'],
  'The Shortstop':['rapid-fires pellets for','chips away health dealing'],
  'The Minigun':['shreds the opponent for','unleashes a rain of bullets for'],
  'The Holy Mackerel':['lands a wet fish slap for','delivers a fish-powered smack for','bonks the opponent for'],
  'The Shotgun':['lands a direct blast for','fires a shell dealing'],
  'The Sniper Rifle':['lines up a perfect shot for','fires a charged round for'],
  'The Sentry':['locks on and shoots for','beeps aggressively and deals'],
  'The Huntsman':['pins the opponent with an arrow for','fires an arrow dealing'],
  'The Syringe Gun':['fires a hail of needles for','sends syringes flying for'],
  'The Loose Cannon':['double donks the opponent for','fires a cannonball for'],
  'The Frontier Justice':['fires a revenge shot for','lands a vengeful blast for'],
  'The Awper Hand':['lands an impressive headshot for','quickscopes the enemy for'],
  'The Cow Mangler 5000':['fires an exploding ray for','charges up a laser for'],
  "The Cleaner's Carbine":['sprays bullets for','empties a magazine for'],
  'The Ambassador':['lands a flawless headshot for','fires one precise shot for'],
  'The Lugermorph':['fires a vintage bullet for','lands a stylish shot for'],
  'The Panic Attack':['fires wildly but connects for','unloads a shell dealing'],
  'The Iron Curtain':['unleashes a wall of bullets for','riddles the enemy for'],
  "The Horseless Headless Horsemann's Headtaker":['swings its giant blade for','lands a mighty chop for'],
  'The Direct Hit':['airshots the opponent for','lands a direct rocket for'],
  'The ✨Golden Frying Pan':['✨ bonks the opponent for','✨ gives a golden smack for']
};
const CHAMPION_CRIT_PHRASES = ['💥 CRITICAL HIT!','💥 DEVASTATING CRIT!','💥 MASSIVE CRIT!'];
const CHAMPION_MINI_CRIT_PHRASES = ['⚡ MINI-CRIT!','⚡ MINI CRITICAL HIT!'];
const CHAMPION_MISS_PHRASES = ['forgot to reload!','completely whiffed!','tripped at the worst possible moment!','aimed at a passing bird instead!','misfired dramatically!','ate their weapon!'];
const Champion = {
  coinWager:0, selectedItems:[], playerWagerItems:[], playerWagerCoins:0,
  botItems:[],botCoins:0,totalPlayerWager:0,totalBotWager:0,
  battleRunning:false,playerHP:CHAMPION_MAX_HP,botHP:CHAMPION_MAX_HP,
  turn:'player',round:1,battleTimer:null,payoutComplete:false
};

function randomArrayItem(items) { return items[Math.floor(Math.random()*items.length)] || ''; }
function randomInteger(min,max) { return Math.floor(Math.random()*(max-min+1))+min; }
function getChampionDamagePhrase(weapon) { return randomArrayItem(CHAMPION_DAMAGE_PHRASES[weapon] || ['hits the enemy for']); }
function escapeChampionHTML(value) { return String(value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function escapeChampionAttribute(value) { return escapeChampionHTML(value).replace(/"/g,'&quot;'); }
function championItem(uid) { return inventory.find(item => item.uid === uid); }
function availableChampionItem(item) { return item && !item.favorite && !isPureItem(item) && !isItemLocked(item); }

function recoverChampionEscrow() {
  let escrow = null;
  try { escrow = JSON.parse(localStorage.getItem(CHAMPION_ESCROW_KEY) || 'null'); } catch {}
  if (!escrow || !Array.isArray(escrow.items) || !Number.isFinite(escrow.coins)) return;
  // An interrupted, unfinished browser-local battle is refunded on reload.
  if (escrow.status === 'pending') {
    const owned = new Set(inventory.map(item => item.uid));
    escrow.items.forEach(item => { const copy = normalizedItem(item); if (copy && !owned.has(copy.uid)) { inventory.push(copy); owned.add(copy.uid); } });
    coins = fromCents(cents(coins) + cents(escrow.coins));
    saveInventory(); updateCoins();
  }
  localStorage.removeItem(CHAMPION_ESCROW_KEY);
}

function setupChampion() {
  const input = $('champion-coin-input');
  if (input) input.addEventListener('keydown', event => { if (event.key === 'Enter') addChampionCoins(); });
  $('champion-add-coins')?.addEventListener('click',addChampionCoins);
  $('champion-start-btn')?.addEventListener('click',startChampionBattle);
  $('champion-close-result')?.addEventListener('click',resetChampion);
  $('champion-refresh-inventory')?.addEventListener('click',refreshChampionInventory);
  renderChampionItemList(); updateChampionWagerDisplay(); updateChampionHP();
}
function refreshChampionInventory() {
  Champion.selectedItems = Champion.selectedItems.filter(uid => availableChampionItem(championItem(uid)));
  renderChampionItemList(); updateChampionWagerDisplay();
}
function renderChampionItemList() {
  const box = $('champion-item-list'); if (!box) return;
  const frag = document.createDocumentFragment();
  const items = inventory.filter(availableChampionItem);
  if (!items.length) frag.appendChild(createElement('div','empty-small','No unlocked items available.'));
  items.forEach(item => {
    const chosen = Champion.selectedItems.includes(item.uid);
    const row = createElement('button',`champion-wager-item ${qualityClass(item.rarity)} ${chosen ? 'selected':''}`); row.type = 'button';
    row.disabled = Champion.battleRunning;
    row.setAttribute('aria-pressed',String(chosen)); row.appendChild(itemImage(item));
    const copy = createElement('div','champion-wager-item-info');
    copy.append(createElement('span','',item.name),createElement('small','',`${money(item.price)} ⛃`));
    row.append(copy,createElement('div','champion-item-check',chosen?'✓':'+'));
    row.onclick = () => toggleChampionItem(item.uid); frag.appendChild(row);
  }); box.replaceChildren(frag);
}
function toggleChampionItem(uid) {
  if (Champion.battleRunning || !availableChampionItem(championItem(uid))) return;
  if (Champion.selectedItems.includes(uid)) Champion.selectedItems = Champion.selectedItems.filter(id => id !== uid);
  else Champion.selectedItems.push(uid);
  renderChampionItemList(); updateChampionWagerDisplay();
}
async function addChampionCoins() {
  if (Champion.battleRunning) return;
  const input = $('champion-coin-input'); if (!input) return;
  const amount = Number(input.value);
  if (!Number.isFinite(amount) || cents(amount) <= 0 || cents(amount) > cents(coins)) return siteAlert(`Enter a virtual coin amount between 0.01 and ${money(coins)}.`);
  Champion.coinWager = fromCents(cents(amount)); input.value = ''; updateChampionWagerDisplay();
}
function calculatePlayerWager() {
  const items = Champion.selectedItems.map(championItem).filter(availableChampionItem);
  return fromCents(cents(Champion.coinWager) + items.reduce((n,item) => n+cents(item.price),0));
}
function updateChampionWagerDisplay() {
  const total = calculatePlayerWager();
  if ($('champion-wager-value')) $('champion-wager-value').textContent = `${money(total)} ⛃`;
  const box = $('champion-selected-items'); if (!box) return;
  const frag = document.createDocumentFragment();
  if (Champion.coinWager > 0) {
    const row = createElement('div','champion-selected-entry');
    row.append(createElement('span','',`🪙 ${money(Champion.coinWager)} coins`));
    const remove = createElement('button','','×'); remove.type = 'button'; remove.title = 'Remove coin wager';
    remove.onclick = () => { Champion.coinWager = 0; updateChampionWagerDisplay(); }; row.appendChild(remove); frag.appendChild(row);
  }
  Champion.selectedItems.forEach(uid => {
    const item = championItem(uid); if (!availableChampionItem(item)) return;
    const row = createElement('div','champion-selected-entry');
    row.append(itemImage(item),createElement('span','',`${item.name} · ${money(item.price)} ⛃`));
    const remove = createElement('button','','×'); remove.type = 'button'; remove.title = 'Remove wager item';
    remove.onclick = () => toggleChampionItem(uid); row.appendChild(remove); frag.appendChild(row);
  });
  if (!frag.childNodes.length) frag.appendChild(createElement('div','empty-small','No wager selected.'));
  box.replaceChildren(frag);
}

/* FishBot picks a random total in [0.25x,1.75x] and tries to make it
   from high-value case items, then fills the remainder with coins. */
function getChampionItemPool() {
  return cases.flatMap(gameCase => gameCase.items.filter(item => Number.isFinite(item.price) && item.price > 0).map(item => ({ ...item })));
}
function createBotWager(playerWager) {
  const pool = getChampionItemPool();
  const multiplier = BOT_MIN_MULTIPLIER + Math.random() * (BOT_MAX_MULTIPLIER-BOT_MIN_MULTIPLIER);
  const targetCents = Math.max(1,Math.round(cents(playerWager)*multiplier));
  const fits = pool.filter(item => cents(item.price) <= targetCents).sort((a,b)=>b.price-a.price);
  if (!fits.length) return { coins:fromCents(targetCents),items:[],total:fromCents(targetCents) };
  let best = [], bestScore = -Infinity, bestTotal = 0;
  for (let attempt=0;attempt<BOT_ITEM_SEARCH_ATTEMPTS;attempt++) {
    let total=0; const candidate=[]; const used = new Set();
    const shuffled = fits.map(item => ({item, key:Math.random() / Math.pow(Math.max(.01,item.price),BOT_EXPENSIVE_ITEM_BIAS)})).sort((a,b)=>a.key-b.key);
    for (const {item} of shuffled) {
      if (candidate.length >= BOT_MAX_ITEMS) break;
      const key = `${item.name}|${item.image}|${item.price}`;
      if (used.has(key) || total+cents(item.price)>targetCents) continue;
      if (Math.random() < .60 || candidate.length===0) {
        candidate.push({...item}); total += cents(item.price); used.add(key);
      }
      if (targetCents-total<=1) break;
    }
    const largest = fits.find(item => cents(item.price)<=targetCents-total && !used.has(`${item.name}|${item.image}|${item.price}`));
    if (largest && candidate.length<BOT_MAX_ITEMS) { candidate.push({...largest}); total += cents(largest.price); }
    const average = candidate.length ? total/candidate.length : 0;
    const score = -(targetCents-total)*2 - candidate.length*900 + average*.3 + Math.random()*75;
    if (score > bestScore) { bestScore=score;best=candidate;bestTotal=total; }
    if (targetCents-total<=1 && candidate.length<=2) break;
  }
  // If no items fit well, let the bot wager its entire amount as coins.
  const botCoins = fromCents(Math.max(0,targetCents-bestTotal));
  return { coins:botCoins,items:best,total:fromCents(bestTotal+cents(botCoins)) };
}
function displayBotWager(wager) {
  const box = $('champion-bot-items'); if (!box) return;
  $('champion-bot-preview').hidden = false;
  $('champion-bot-value').textContent = `${money(wager.total)} ⛃`;
  const heading=$('champion-bot-preview')?.querySelector('h4'); if(heading)heading.textContent=`🐟 ${Champion.botName.toUpperCase()}'S WAGER`;
  const frag = document.createDocumentFragment();
  if (wager.coins>0) frag.appendChild(createElement('div','champion-bot-entry',`🪙 ${money(wager.coins)} virtual coins`));
  wager.items.sort((a,b)=>b.price-a.price).forEach(item => {
    const row = createElement('div',`champion-bot-entry ${qualityClass(item.rarity)}`);
    row.append(itemImage(item),createElement('span','',item.name),createElement('small','',`${money(item.price)} ⛃`)); frag.appendChild(row);
  }); box.replaceChildren(frag);
}
function startChampionBattle() {
  if(typeof CaseBattle!=='undefined'&&CaseBattle.running)return siteAlert('Finish Case Battle before challenging the arena.');
  if (Champion.battleRunning) return;
  Champion.selectedItems = Champion.selectedItems.filter(uid => availableChampionItem(championItem(uid)));
  const wager = calculatePlayerWager();
  if (cents(wager)<=0) return siteAlert('Select some coins or at least one unlocked item.');
  if (cents(Champion.coinWager)>cents(coins)) return siteAlert('You do not have enough coins for this wager.');
  Champion.botName=getRandomAquaticBot(Champion.botName).name;
  const bot = createBotWager(wager);
  if (!bot.total) return siteAlert(`${Champion.botName} could not assemble a valid wager.`);
  Champion.playerWagerItems = Champion.selectedItems.map(uid => ({...championItem(uid)}));
  Champion.playerWagerCoins = Champion.coinWager;
  Champion.totalPlayerWager = wager; Champion.totalBotWager = bot.total;
  Champion.botItems = bot.items.map(item => ({...item})); Champion.botCoins = bot.coins;
  Champion.payoutComplete = false;
  // Save a refundable escrow before removing anything. Reloading during
  // a fight restores the wager rather than silently destroying it.
  localStorage.setItem(CHAMPION_ESCROW_KEY,JSON.stringify({status:'pending',coins:Champion.playerWagerCoins,items:Champion.playerWagerItems}));
  const selected = new Set(Champion.selectedItems);
  coins = fromCents(cents(coins)-cents(Champion.coinWager));
  inventory = inventory.filter(item => !selected.has(item.uid));
  Champion.selectedItems=[]; Champion.coinWager=0;
  saveInventory(); updateCoins(); refreshEconomy();
  displayBotWager(bot); beginChampionBattle();
}
function renderChampionBattleStake(side,items,coinTotal){
  const box=$(`champion-${side}-battle-items`);
  if(!box)return;
  const frag=document.createDocumentFragment();
  if(coinTotal>0){
    const coinsCard=createElement('div','arena-stake-item arena-stake-coins');
    coinsCard.append(createElement('span','arena-coin-icon','⛃'),createElement('strong','',`${money(coinTotal)} coins`));
    frag.appendChild(coinsCard);
  }
  items.forEach(item=>{
    const card=createElement('div',`arena-stake-item ${qualityClass(item.rarity)}`);
    card.appendChild(itemImage(item));
    card.append(createElement('span','arena-stake-item-name',item.name),createElement('strong','arena-stake-item-value',`⛃ ${money(item.price)}`));
    card.title=`${item.name} · ⛃ ${money(item.price)}`;
    frag.appendChild(card);
  });
  if(!frag.childNodes.length)frag.appendChild(createElement('div','duel-empty','No items or coins wagered'));
  box.replaceChildren(frag);
  const count=$(`champion-${side}-stake-count`);
  if(count)count.textContent=`${items.length} ITEMS${coinTotal>0?' + COINS':''}`;
}

function beginChampionBattle() {
  Champion.battleRunning = true;
  Champion.playerHP=CHAMPION_MAX_HP; Champion.botHP=CHAMPION_MAX_HP;
  Champion.turn='player'; Champion.round=1;
  $('champion-menu').hidden = true; $('champion-battle').hidden = false; $('champion-result').hidden = true;
  $('champion-battle-player-stake').textContent = `${money(Champion.totalPlayerWager)} ⛃`;
  $('champion-battle-bot-stake').textContent = `${money(Champion.totalBotWager)} ⛃`;
  if($('champion-arena-bot-name')) $('champion-arena-bot-name').textContent=Champion.botName.toUpperCase();
  if($('champion-arena-bot-tag')) $('champion-arena-bot-tag').textContent=Champion.botName.toUpperCase();
  renderChampionBattleStake('player',Champion.playerWagerItems,Champion.playerWagerCoins);
  renderChampionBattleStake('bot',Champion.botItems,Champion.botCoins);
  clearChampionBattleLog(); updateChampionHP(); updateChampionStatus();
  addChampionLog('⚔️ The battle begins!');
  addChampionLog(`Your wager: ${money(Champion.totalPlayerWager)} ⛃ · ${Champion.botName} wager: ${money(Champion.totalBotWager)} ⛃`);
  Champion.battleTimer = setTimeout(championTurn,850);
}
function championTurn() {
  if (!Champion.battleRunning) return;
  if (Champion.playerHP<=0 || Champion.botHP<=0) return finishChampionBattle();
  championAttack(Champion.turn);
}
function championAttack(attacker) {
  if (!Champion.battleRunning) return;
  const weapon = randomArrayItem(CHAMPION_WEAPONS);
  const attackerName = attacker==='player' ? '🏆 Champion':`🐟 ${Champion.botName}`;
  const defenderName = attacker==='player' ? Champion.botName:'Champion';
  const roll = Math.random();
  if (roll < CHAMPION_MISS_CHANCE) {
    addChampionLog(`${attackerName} tries ${weapon}, but ${randomArrayItem(CHAMPION_MISS_PHRASES)}`,'miss');
    return finishTurn(attacker);
  }
  const crit = roll<CHAMPION_MISS_CHANCE+CHAMPION_CRIT_CHANCE;
  const mini = !crit && roll<CHAMPION_MISS_CHANCE+CHAMPION_CRIT_CHANCE+CHAMPION_MINI_CRIT_CHANCE;
  const baseDamage = randomInteger(1,60);
  const damage = Math.floor(baseDamage*(crit?CHAMPION_CRIT_MULTIPLIER:mini?CHAMPION_MINI_CRIT_MULTIPLIER:1));
  if (attacker==='player') Champion.botHP = Math.max(0,Champion.botHP-damage);
  else Champion.playerHP = Math.max(0,Champion.playerHP-damage);
  updateChampionHP();
  if (crit) addChampionLog(`${attackerName}: ${randomArrayItem(CHAMPION_CRIT_PHRASES)}`,'crit');
  else if (mini) addChampionLog(`${attackerName}: ${randomArrayItem(CHAMPION_MINI_CRIT_PHRASES)}`,'mini-crit');
  addChampionLog(`${attackerName} uses ${weapon} and ${getChampionDamagePhrase(weapon)} ${damage} damage to ${defenderName}!`);
  if (Champion.botHP<=0 || Champion.playerHP<=0) Champion.battleTimer = setTimeout(finishChampionBattle,900);
  else finishTurn(attacker);
}
function finishTurn(attacker) {
  if (!Champion.battleRunning) return;
  Champion.turn = attacker==='player' ? 'bot':'player';
  if (attacker==='bot') Champion.round++;
  updateChampionStatus();
  Champion.battleTimer = setTimeout(championTurn,CHAMPION_TURN_DELAY);
}
function updateChampionStatus() {
  if ($('champion-battle-status')) $('champion-battle-status').textContent = `${Champion.turn==='player'?'🏆 Your turn':`🐟 ${Champion.botName}'s turn`} — Round ${Champion.round}`;
}
function updateChampionHP() {
  const circumference=2*Math.PI*76;
  [['player',Champion.playerHP],['bot',Champion.botHP]].forEach(([side,hp])=>{
    const value=Math.min(CHAMPION_MAX_HP,Math.max(0,hp));
    const blocks=Math.round(value/CHAMPION_MAX_HP*CHAMPION_HP_BAR_LENGTH);
    const bar=$(`champion-${side}-hp-bar`);
    if(bar)bar.textContent='█'.repeat(blocks)+'░'.repeat(CHAMPION_HP_BAR_LENGTH-blocks);
    const text=$(`champion-${side}-hp-text`);
    if(text)text.textContent=`${value} / ${CHAMPION_MAX_HP} HP`;
    const ring=$(`champion-${side}-ring`);
    if(ring){
      ring.style.strokeDasharray=String(circumference);
      ring.style.strokeDashoffset=String(circumference*(1-value/CHAMPION_MAX_HP));
    }
  });
}
function clearChampionBattleLog() { $('champion-battle-log')?.replaceChildren(); }
function addChampionLog(message,type='') {
  const box = $('champion-battle-log'); if (!box) return;
  const row = createElement('div',`champion-log-entry ${type}`,message);
  box.appendChild(row);
  while (box.children.length>MAX_BATTLE_LOG_ENTRIES) box.firstElementChild.remove();
  box.scrollTop = box.scrollHeight;
}
function finishChampionBattle() {
  if (!Champion.battleRunning) return;
  Champion.battleRunning=false; clearTimeout(Champion.battleTimer); Champion.battleTimer=null;
  if (Champion.playerHP>0 && Champion.botHP<=0) finishChampionWin();
  else finishChampionLoss();
}
function returnPlayerWager() {
  if (Champion.playerWagerCoins>0) coins = fromCents(cents(coins)+cents(Champion.playerWagerCoins));
  Champion.playerWagerItems.forEach(item => inventory.push(normalizedItem({...item})));
}
function giveBotWinnings() {
  if (Champion.botCoins>0) coins = fromCents(cents(coins)+cents(Champion.botCoins));
  Champion.botItems.forEach(item => inventory.push(normalizedItem(item)));
}
function saveChampionPayout() { refreshEconomy(); }
function buildWinningsHTML() {
  const box = document.createDocumentFragment();
  const row = (prefix,label,item) => {
    const div=createElement('div','champion-winning-entry');
    div.appendChild(createElement('span','',prefix));
    if (item) div.appendChild(itemImage(item));
    const text=createElement('span','',label);
    if (item) text.appendChild(createElement('small','',`${money(item.price)} ⛃`));
    div.appendChild(text); box.appendChild(div);
  };
  if (Champion.playerWagerCoins>0) row('↩',`Your ${money(Champion.playerWagerCoins)} coins returned`);
  Champion.playerWagerItems.forEach(item => row('↩',`Returned: ${item.name}`,item));
  if (Champion.botCoins>0) row('🪙',`${Champion.botName}'s ${money(Champion.botCoins)} coins won`);
  Champion.botItems.forEach(item => row('🎁',`Won: ${item.name}`,item));
  return box;
}
function finishChampionWin() {
  if (Champion.payoutComplete) return;
  Champion.payoutComplete=true;
  returnPlayerWager(); giveBotWinnings();
  // Update saved wallet/backpack before clearing refundable escrow.
  saveChampionPayout(); localStorage.removeItem(CHAMPION_ESCROW_KEY);
  awardSpendXP(Champion.totalPlayerWager,'champion');
  recordWin('Champion',{prizeItems:Champion.botItems,prizeCoins:Champion.botCoins,totalValue:Champion.totalBotWager});
  addChampionLog(`🏆 VICTORY! You won ${Champion.botName}'s ${money(Champion.totalBotWager)} ⛃ wager.`,'crit');
  $('champion-result-title').textContent='🏆 VICTORY!'; $('champion-result-title').classList.remove('loss');
  $('champion-result-message').textContent=`${Champion.botName} has been defeated! Your own wager was returned, plus the bot's prizes.`;
  $('champion-result-winnings').replaceChildren(buildWinningsHTML());
  $('champion-result').hidden=false;
}
function finishChampionLoss() {
  if (Champion.payoutComplete) return;
  Champion.payoutComplete=true;
  localStorage.removeItem(CHAMPION_ESCROW_KEY);
  awardSpendXP(Champion.totalPlayerWager,'champion');
  addChampionLog(`☠ DEFEAT! ${Champion.botName} claimed your ${money(Champion.totalPlayerWager)} ⛃ wager.`,'miss');
  $('champion-result-title').textContent='☠ DEFEAT'; $('champion-result-title').classList.add('loss');
  $('champion-result-message').textContent=`${Champion.botName} secured the victory. Better luck next duel.`;
  $('champion-result-winnings').replaceChildren(createElement('div','champion-winning-entry',`You lost ${money(Champion.totalPlayerWager)} ⛃ in virtual coins and items.`));
  $('champion-result').hidden=false;
}
function resetChampion() {
  clearTimeout(Champion.battleTimer);
  Object.assign(Champion, {coinWager:0,selectedItems:[],playerWagerItems:[],playerWagerCoins:0,botItems:[],botCoins:0,totalPlayerWager:0,totalBotWager:0,battleRunning:false,playerHP:CHAMPION_MAX_HP,botHP:CHAMPION_MAX_HP,botName:'FishBot',turn:'player',round:1,battleTimer:null,payoutComplete:false});
  $('champion-menu').hidden=false; $('champion-battle').hidden=true; $('champion-result').hidden=true;
  const heading=$('champion-bot-preview')?.querySelector('h4');if(heading)heading.textContent=`🐟 RIVAL'S WAGER`;
  $('champion-bot-preview').hidden=true;
  renderChampionItemList(); updateChampionWagerDisplay(); updateChampionHP(); updateChampionStatus();
}

document.addEventListener('DOMContentLoaded',setupChampion);
