/* ===================================================================
   TF2GRAND — supply depot engine
   Client-side, virtual-currency simulator. Works with existing cases.json.
   Keeps original localStorage keys: coins, inventory, recentDrops, pures.
   =================================================================== */
'use strict';

const $ = (id) => document.getElementById(id);
const money = (n) => (Number.isFinite(Number(n)) ? Number(n) : 0).toFixed(2);
const cents = (n) => Math.round((Number(n) || 0) * 100);
const fromCents = (n) => Math.round(n) / 100;
const validAmount = (n) => Number.isFinite(Number(n)) && Number(n) >= 0;
let nextItemId = 1;
const makeItemId = () => `item-${Date.now().toString(36)}-${(nextItemId++).toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

function safeJSON(key, fallback) {
  try { const parsed = JSON.parse(localStorage.getItem(key)); return parsed ?? fallback; }
  catch { return fallback; }
}
function normalizedItem(item) {
  if (!item || typeof item !== 'object') return null;
  return {
    ...item,
    uid: (typeof item.uid === 'string' && item.uid) ? item.uid : makeItemId(),
    name: String(item.name || 'Unknown Item'),
    image: String(item.image || ''),
    rarity: String(item.rarity || 'common').toLowerCase(),
    price: validAmount(item.price) ? Number(item.price) : 0,
    favorite: item.favorite === true
  };
}
const qualityClass = (value) => {
  const known = ['common', 'rare', 'top', 'voro', 'strange', 'unusual', 'legendary', 'mythical', 'genuine', 'vintage', 'collector', 'haunted', 'pure'];
  const name = String(value || 'common').toLowerCase();
  return known.includes(name) ? name : 'common';
};
function qualityLabel(item) { return isPureItem(item) ? 'PURE' : String(item.rarity || 'common').toUpperCase(); }
function createElement(tag, className, text) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text !== undefined && text !== null) el.textContent = String(text);
  return el;
}
function itemImage(item, className) {
  const img = createElement('img', className);
  img.src = String(item.image || '');
  img.alt = String(item.name || 'Item');
  img.loading = 'lazy';
  img.decoding = 'async';
  img.onerror = () => { img.onerror = null; img.style.opacity = '.18'; img.alt = 'Image unavailable'; };
  return img;
}

const savedCoins = localStorage.getItem('coins');
let coins = savedCoins === null ? NaN : Number(savedCoins);
if (!Number.isFinite(coins) || coins < 0) coins = 20;
coins = fromCents(cents(coins));
let inventory = (Array.isArray(safeJSON('inventory', [])) ? safeJSON('inventory', []) : []).map(normalizedItem).filter(Boolean);
let recentDrops = (Array.isArray(safeJSON('recentDrops', [])) ? safeJSON('recentDrops', []) : []).map(normalizedItem).filter(Boolean);
// Prizes from ALL game modes, separate from the actual inventory.
const RECENT_WINS_KEY = 'tf2grand_recent_wins_v1';
let recentWins = (Array.isArray(safeJSON(RECENT_WINS_KEY, [])) ? safeJSON(RECENT_WINS_KEY, []) : [])
  .filter(x => x && typeof x.mode === 'string' && Number.isFinite(x.at)).slice(-80);
function recordWin(mode, {prizeItems = [], prizeCoins = 0, totalValue = null} = {}) {
  const items = (Array.isArray(prizeItems) ? prizeItems : []).filter(x => x && typeof x.name === 'string')
    .map(item => ({ name:item.name, image:item.image || '', rarity:qualityClass(item.rarity), price:Number(item.price)||0 }));
  const value = totalValue === null ? items.reduce((sum,i)=>sum+i.price,0)+Math.max(0,Number(prizeCoins)||0) : Number(totalValue);
  if (!Number.isFinite(value) || value <= 0) return;
  recentWins.push({ id:makeItemId(), mode:String(mode), at:Date.now(), items:items.slice(0,40), coins:Math.max(0,Number(prizeCoins)||0), value });
  recentWins = recentWins.slice(-80);
  localStorage.setItem(RECENT_WINS_KEY,JSON.stringify(recentWins));
  renderTopDrops();
}

const loadedIds = new Set();
inventory.forEach(item => { if (loadedIds.has(item.uid)) item.uid = makeItemId(); loadedIds.add(item.uid); });
let cases = [];
let currentCase = null;
let isSpinning = false;
let isFlipping = false;
let activeCoinflipUid = null;
const activeCoinflipUids = new Set();
const Coinflip = { selectedUids: [], opponent: { items: [], coins: 0, total: 0 }, matchKey: '', botName: '' };
let activeSitePopup = null;
let adminMode = false;
const ADMIN_PASSWORD = 'feign'; // Cosmetic local passkey, NOT secure authentication.

const PURE_TYPES = {
  maxhead: { id: 'maxhead', name: "Max's Severed Head", value: 78.56, image: 'images/items/maxhead.png' },
  earbuds: { id: 'earbuds', name: 'Earbuds', value: 18.72, image: 'images/items/earbuds.png' },
  key: { id: 'key', name: 'Mann Co. Supply Crate Key', value: 2.65, image: 'images/items/key.png' },
  refined: { id: 'refined', name: 'Refined Metal', value: .04, image: 'images/items/refined.png' }
};
const PURE_CRAFT_RECIPES = {
  key: { inputs: { refined: 75 }, label: '75 Refined → 1 Key' },
  earbuds: { inputs: { key: 7, refined: 64 }, label: '7 Keys + 64 Refined → 1 Earbuds' },
  maxhead: { inputs: { earbuds: 3, key: 6, refined: 55 }, label: "3 Earbuds + 6 Keys + 55 Refined → 1 Max's Head" }
};
const PURE_ORDER = ['maxhead', 'earbuds', 'key', 'refined'];
const PURE_CONVERSION_RATE = .85;
function loadPures() {
  const stored = safeJSON('pures', {});
  return Object.fromEntries(PURE_ORDER.map(id => [id, Math.max(0, Math.floor(Number(stored && stored[id]) || 0))]));
}
let pures = loadPures();
function savePures() { localStorage.setItem('pures', JSON.stringify(pures)); }
function getPureId(item) {
  if (!item) return null;
  if (item.pureId && PURE_TYPES[item.pureId]) return item.pureId;
  const name = String(item.name || '').trim().toLowerCase();
  return PURE_ORDER.find(id => PURE_TYPES[id].name.toLowerCase() === name) || null;
}
function isPureItem(item) { return Boolean(getPureId(item)); }
function saveInventory() {
  localStorage.setItem('inventory', JSON.stringify(inventory));
  localStorage.setItem('recentDrops', JSON.stringify(recentDrops));
}
function updateCoins() {
  coins = Math.max(0, fromCents(cents(coins)));
  if ($('coins')) $('coins').textContent = `⛃ ${money(coins)}`;
  localStorage.setItem('coins', money(coins));
  const open = $('open-btn');
  if (open) open.disabled = isSpinning || (typeof CaseBattle!=='undefined'&&CaseBattle.running) || !currentCase || coins < Number(currentCase.price);
}
function updateBackpackValue() {
  const value = inventory.reduce((sum, item) => sum + (Number(item.price) || 0), 0);
  if ($('backpack-value')) $('backpack-value').textContent = `⛃ ${money(value)}`;
  if ($('inventory-count')) $('inventory-count').textContent = String(inventory.length);
  if ($('inventory-total-label')) $('inventory-total-label').textContent = `${inventory.length} ITEMS`;
}
function isItemLocked(item) {
  return Boolean(item && (((typeof CaseBattle!=='undefined'&&CaseBattle.running)) || (Upgrader.upgrading && Upgrader.selectedWagers.some(entry => entry.uid === item.uid)) || activeCoinflipUid === item.uid || activeCoinflipUids.has(item.uid)));
}
function refreshEconomy() {
  saveInventory(); updateCoins(); updateBackpackValue(); renderInventory(); populateCoinflipDropdown();
  renderTopDrops(); renderWager();
  if (typeof renderChampionItemList === 'function') renderChampionItemList();
  if (typeof updateChampionWagerDisplay === 'function') updateChampionWagerDisplay();
}

/* ---------- Local modal system ---------- */
function setupPopupSystem() {
  if ($('site-popup-root')) return;
  const root = createElement('div'); root.id = 'site-popup-root';
  root.innerHTML = '<div id="site-popup-box" role="dialog" aria-modal="true" aria-labelledby="site-popup-title"><button id="site-popup-close" type="button" aria-label="Close">×</button><h2 id="site-popup-title">TF2GRAND</h2><div id="site-popup-message"></div><input id="site-popup-input" autocomplete="off"><div id="site-popup-buttons"></div></div>';
  document.body.appendChild(root);
  root.addEventListener('click', event => { if (event.target === root) activeSitePopup?.cancel(); });
}
function siteDialog({ title = 'TF2GRAND', message = '', mode = 'alert', defaultValue = '' } = {}) {
  setupPopupSystem();
  if (activeSitePopup) activeSitePopup.cancel();
  return new Promise(resolve => {
    const root = $('site-popup-root');
    $('site-popup-title').textContent = String(title);
    $('site-popup-message').textContent = String(message);
    const input = $('site-popup-input');
    input.style.display = mode === 'prompt' ? 'block' : 'none';
    input.value = String(defaultValue);
    input.type = /passkey|password/i.test(title) ? 'password' : 'text';
    const buttons = $('site-popup-buttons'); buttons.replaceChildren();
    let done = false;
    const finish = result => {
      if (done) return;
      done = true; root.classList.remove('open'); activeSitePopup = null;
      document.removeEventListener('keydown', onKey); resolve(result);
    };
    const onKey = e => {
      if (e.key === 'Escape') { e.preventDefault(); finish(mode === 'confirm' ? false : null); }
      if (e.key === 'Enter') { e.preventDefault(); finish(mode === 'prompt' ? input.value : true); }
    };
    if (mode !== 'alert') {
      const cancel = createElement('button', 'theme-btn secondary', 'CANCEL');
      cancel.type = 'button'; cancel.onclick = () => finish(mode === 'confirm' ? false : null);
      buttons.appendChild(cancel);
    }
    const ok = createElement('button', 'theme-btn', mode === 'alert' ? 'OK' : 'CONFIRM');
    ok.type = 'button'; ok.onclick = () => finish(mode === 'prompt' ? input.value : true);
    buttons.appendChild(ok);
    $('site-popup-box').dataset.kind = /won|victory|success|reward|claimed|unbox|win/i.test(title) ? 'win' : /lost|failed|defeat|error/i.test(title) ? 'loss' : 'info';
    $('site-popup-close').onclick = () => finish(mode === 'confirm' ? false : null);
    root.classList.add('open');
    activeSitePopup = { cancel: () => finish(mode === 'confirm' ? false : null) };
    document.addEventListener('keydown', onKey);
    requestAnimationFrame(() => { if (!done) { (mode === 'prompt' ? input : ok).focus(); if (mode === 'prompt') input.select(); } });
  });
}
function siteAlert(message, title) { return siteDialog({ message, title: title || 'TF2GRAND' }); }
function sitePrompt(message, defaultValue = '', title = 'TF2GRAND') { return siteDialog({ mode: 'prompt', message, defaultValue, title }); }
function siteConfirm(message, title = 'CONFIRM ACTION') { return siteDialog({ mode: 'confirm', message, title }); }
async function checkAdminPassword() {
  const answer = await sitePrompt('Enter the local demo passkey:', '', 'DEMO PASSKEY');
  if (answer === null) return false;
  if (answer !== ADMIN_PASSWORD) { await siteAlert('Incorrect passkey.'); return false; }
  return true;
}
async function addCoinsAdmin() {
  if(typeof CaseBattle!=='undefined'&&CaseBattle.running)return siteAlert('Finish your active Case Battle before changing coins or items.');
  if (!(await checkAdminPassword())) return;
  const input = await sitePrompt('Add virtual coins to your local wallet:', '20', 'ADD DEMO COINS');
  if (input === null) return;
  const amount = Number(input);
  if (!Number.isFinite(amount) || amount <= 0 || cents(amount) <= 0 || cents(amount) > 1e12) return siteAlert('Enter a valid amount of at least 0.01 virtual coins.');
  coins = fromCents(cents(coins) + cents(amount)); updateCoins();
  siteAlert(`Added ⛃ ${money(amount)} to your demo wallet.`);
}
async function removeCoinsAdmin() {
  if(typeof CaseBattle!=='undefined'&&CaseBattle.running)return siteAlert('Finish your active Case Battle before changing coins or items.');
  if (!(await checkAdminPassword())) return;
  const input = await sitePrompt('Remove virtual coins from your local wallet:', '20', 'REMOVE DEMO COINS');
  if (input === null) return;
  const amount = Number(input);
  if (!Number.isFinite(amount) || cents(amount) <= 0 || cents(amount) > cents(coins)) return siteAlert('Enter a positive amount no larger than your wallet.');
  coins = fromCents(cents(coins) - cents(amount)); updateCoins();
  siteAlert(`Removed ⛃ ${money(amount)} from your demo wallet.`);
}

/* ---------- Shared item cards ---------- */
function createItemCard(item, { inventoryId = null, showChance = null, showActions = false } = {}) {
  const pure = isPureItem(item);
  const card = createElement('article', `item-card ${pure ? 'pure' : qualityClass(item.rarity)}`);
  const art = createElement('div', 'item-card-image');
  art.appendChild(createElement('span','rarity-hex-frame'));
  art.appendChild(itemImage(item)); card.appendChild(art);
  const icon = createElement('span','rarity-gem','✦'); icon.title=qualityLabel(item); icon.setAttribute('aria-label',qualityLabel(item));card.appendChild(icon);
  card.appendChild(createElement('div', 'quality-tag', qualityLabel(item)));
  card.appendChild(createElement('div', 'item-card-name', item.name));
  const meta = createElement('div', 'item-card-meta');
  meta.appendChild(createElement('span', '', 'VALUE'));
  meta.appendChild(createElement('b', '', `⛃ ${money(item.price)}`)); card.appendChild(meta);
  if (showChance !== null) card.appendChild(createElement('div', 'drop-chance', `${showChance.toFixed(3).replace(/0+$/, '').replace(/\.$/, '')}% DROP CHANCE`));
  if (showActions && inventoryId !== null) {
    const favorite = createElement('button', `favorite-btn ${item.favorite ? 'active' : ''}`, item.favorite ? '★' : '☆');
    favorite.type = 'button'; favorite.disabled = isItemLocked(item); favorite.title = item.favorite ? 'Remove favorite protection' : 'Protect as favorite';
    favorite.setAttribute('aria-label', favorite.title);
    favorite.onclick = () => {
      const live = inventory.find(entry => entry.uid === inventoryId); if (!live || isItemLocked(live)) return;
      live.favorite = !live.favorite; saveInventory(); renderInventory(); renderWager();
      if (typeof renderChampionItemList === 'function') renderChampionItemList();
    };
    card.appendChild(favorite);
    const actions = createElement('div', 'item-card-actions');
    const sell = createElement('button', 'sell-btn', 'SCRAP'); sell.type = 'button';
    sell.disabled = item.favorite || isItemLocked(item); sell.title = item.favorite ? 'Unfavorite to scrap' : 'Scrap this item';
    sell.onclick = () => sellItem(inventory.findIndex(entry => entry.uid === inventoryId));
    const convert = createElement('button', 'convert-btn', 'CONVERT'); convert.type = 'button';
    convert.disabled = item.favorite || isItemLocked(item); convert.title = item.favorite ? 'Unfavorite to convert' : 'Convert to Pure';
    convert.onclick = () => convertInventoryItem(inventory.findIndex(entry => entry.uid === inventoryId));
    actions.append(sell, convert); card.appendChild(actions);
  }
  return card;
}
let inventorySortDescending = true;
function renderInventory() {
  const box = $('inventory'); if (!box) return;
  const query = ($('inventory-search')?.value || '').trim().toLowerCase();
  const filter = $('inventory-rarity')?.value || 'all';
  const filtered = inventory.filter(item => {
    if (!item.name.toLowerCase().includes(query)) return false;
    const rarity = qualityClass(item.rarity);
    if (filter === 'all') return true;
    if (filter === 'favorites') return item.favorite;
    if (filter === 'unusual') return ['mythical', 'unusual', 'top', 'voro'].includes(rarity);
    if (filter === 'other') return !['strange', 'legendary', 'mythical', 'unusual', 'top', 'voro'].includes(rarity);
    return rarity === filter;
  }).sort((a,b) => inventorySortDescending ? b.price - a.price : a.price - b.price);
  const frag = document.createDocumentFragment();
  if (!filtered.length) frag.appendChild(createEmptyState('Nothing in this backpack view.', inventory.length ? 'Try another search or quality filter.' : 'Open a case to get started.'));
  filtered.forEach(item => frag.appendChild(createItemCard(item, { inventoryId: item.uid, showActions: true })));
  box.replaceChildren(frag);
  updateBackpackValue();
}
function createEmptyState(title, message = '') {
  const box = createElement('div','empty-state'); box.appendChild(createElement('strong','',title));
  if (message) box.appendChild(createElement('span','',message)); return box;
}
function sortInventoryByPriceDesc() {
  inventorySortDescending = !inventorySortDescending;
  if ($('sort-inv-btn')) $('sort-inv-btn').textContent = inventorySortDescending ? 'PRICE: HIGH ↓' : 'PRICE: LOW ↑';
  renderInventory();
}
function sellItem(index) {
  if(typeof CaseBattle!=='undefined'&&CaseBattle.running)return siteAlert('Finish your active Case Battle before changing coins or items.');
  const item = inventory[index]; if (!item) return;
  if (item.favorite || isItemLocked(item)) return siteAlert('This item is protected or being used in another game.');
  coins = fromCents(cents(coins) + cents(item.price)); inventory.splice(index,1); refreshEconomy();
}
async function sellAllItems() {
  if(typeof CaseBattle!=='undefined'&&CaseBattle.running)return siteAlert('Finish Case Battle before scrapping items.');
  if (!inventory.length) return siteAlert('Your backpack is empty.');
  const toSell = inventory.filter(item => !item.favorite && !isItemLocked(item));
  if (!toSell.length) return siteAlert('All items are favorites or currently locked.');
  const total = toSell.reduce((n,item) => n + cents(item.price),0);
  const ok = await siteConfirm(`Scrap ${toSell.length} unlocked items for ⛃ ${money(fromCents(total))}?\n\nFavorited items will be kept.`, 'SCRAP BACKPACK');
  if (!ok) return;
  const ids = new Set(toSell.map(item => item.uid));
  const actuallySold = inventory.filter(item => ids.has(item.uid) && !item.favorite && !isItemLocked(item));
  coins = fromCents(cents(coins) + actuallySold.reduce((sum,item) => sum + cents(item.price),0));
  const liveIds = new Set(actuallySold.map(item => item.uid)); inventory = inventory.filter(item => !liveIds.has(item.uid));
  refreshEconomy(); siteAlert(`Scrapped ${actuallySold.length} items. Your favorites were preserved.`);
}
function renderTopDrops() {
  const box=$('top-drops');if(!box)return;
  const merged=[
    ...recentDrops.map((item,i)=>({kind:'case',item,at:Number(item.wonAt)||i})),
    ...recentWins.map((win,i)=>({kind:'win',win,at:win.at+i/10000}))
  ].sort((a,b)=>b.at-a.at).slice(0,8);
  const frag=document.createDocumentFragment();
  if(!merged.length)frag.appendChild(createEmptyState('No wins yet.','Open a case or win a game to fill your gallery.'));
  merged.forEach(entry=>{
    if(entry.kind==='case') {
      const card=createItemCard(entry.item);card.classList.add('recent-win-card');
      card.appendChild(createElement('div','win-mode-tag','▣ CASE OPENING'));frag.appendChild(card);return;
    }
    const win=entry.win,top=[...(win.items||[])].sort((a,b)=>Number(b.price||0)-Number(a.price||0))[0];
    const card=createElement('article',`item-card recent-win-card game-win ${top?qualityClass(top.rarity):'coins-win'}`);
    const art=createElement('div','item-card-image');art.appendChild(createElement('span','rarity-hex-frame'));
    if(top)art.appendChild(itemImage(top));else art.appendChild(createElement('span','win-coins-glyph','⛃'));
    card.append(art,createElement('span','rarity-gem','✦'));
    card.appendChild(createElement('div','item-card-name',top?top.name:`${win.mode} coin prize`));
    const meta=createElement('div','item-card-meta');meta.append(createElement('span','',`${(win.items||[]).length} ITEMS`),createElement('b','',`⛃ ${money(win.value)}`));card.appendChild(meta);
    if(top && win.items.length>1)card.appendChild(createElement('div','win-extra',`MOST VALUABLE · +${win.items.length-1} other item(s)`));
    if(!top)card.appendChild(createElement('div','win-extra',`+⛃ ${money(win.coins)} VIRTUAL COINS`));
    card.appendChild(createElement('div','win-mode-tag',`★ ${win.mode.toUpperCase()} WIN`));
    frag.appendChild(card);
  });box.replaceChildren(frag);
}

/* ---------- Pure system ---------- */
function renderPureBalances() {
  const box = $('pure-balances'); if (!box) return;
  const frag = document.createDocumentFragment();
  PURE_ORDER.forEach(id => {
    const info = PURE_TYPES[id];
    const entry = createElement('div','pure-balance-entry');
    const img = itemImage(info,'pure-balance-icon'); img.alt = info.name; entry.appendChild(img);
    const text = createElement('div','pure-info');
    text.appendChild(createElement('strong','',`${pures[id]} ×`));
    text.appendChild(createElement('span','pure-title', info.name)); entry.appendChild(text);
    const actions = createElement('div','pure-balance-actions');
    if (PURE_CRAFT_RECIPES[id]) {
      const craft = createElement('button','theme-btn','CRAFT UP'); craft.type = 'button'; craft.title = PURE_CRAFT_RECIPES[id].label;
      craft.onclick = () => craftPure(id); actions.appendChild(craft);
    }
    const withdraw = createElement('button','theme-btn','TAKE OUT'); withdraw.type = 'button'; withdraw.disabled = pures[id] <= 0;
    withdraw.onclick = () => withdrawPure(id); actions.appendChild(withdraw);
    entry.appendChild(actions); frag.appendChild(entry);
  }); box.replaceChildren(frag);
}
function addPure(id, amount) {
  const n = Number(amount);
  if (!PURE_TYPES[id] || !Number.isSafeInteger(n) || n <= 0) return;
  pures[id] += n; savePures(); renderPureBalances();
}
async function craftPure(id) {
  if(typeof CaseBattle!=='undefined'&&CaseBattle.running)return siteAlert('Finish your active Case Battle before changing coins or items.');
  const recipe = PURE_CRAFT_RECIPES[id]; if (!recipe) return;
  const inputs = Object.entries(recipe.inputs);
  const max = Math.min(...inputs.map(([source,count]) => Math.floor(pures[source] / count)));
  if (max < 1) return siteAlert(`Not enough Pure.\n\nRecipe: ${recipe.label}`);
  const str = await sitePrompt(`${recipe.label}\n\nYou can craft up to ${max}. Enter the number to craft.`, '1', `CRAFT ${PURE_TYPES[id].name}`);
  if (str === null) return;
  const amount = Number(str);
  if (!Number.isSafeInteger(amount) || amount <= 0 || amount > max) return siteAlert(`Enter a whole number from 1 to ${max}.`);
  inputs.forEach(([source,count]) => { pures[source] -= count * amount; });
  pures[id] += amount; savePures(); renderPureBalances(); siteAlert(`Crafted ${amount} × ${PURE_TYPES[id].name}.`);
}
async function withdrawPure(id) {
  if(typeof CaseBattle!=='undefined'&&CaseBattle.running)return siteAlert('Finish your active Case Battle before changing coins or items.');
  const info = PURE_TYPES[id]; if (!info || pures[id] < 1) return;
  const input = await sitePrompt(`How many ${info.name} would you like to withdraw?`, String(pures[id]), 'PURE WITHDRAWAL');
  if (input === null) return;
  const amount = Number(input);
  if (!Number.isSafeInteger(amount) || amount < 1 || amount > pures[id] || amount > 5000) return siteAlert('Enter a whole amount you own (maximum 5,000 at a time).');
  for (let i=0;i<amount;i++) inventory.push(normalizedItem({ name:info.name,rarity:'pure',price:info.value,image:info.image,isPure:true,pureId:id }));
  pures[id] -= amount; savePures(); renderPureBalances(); refreshEconomy(); siteAlert(`Withdrew ${amount} × ${info.name}.`);
}
function calculatePureBreakdown(value) {
  let remaining = Math.max(0, cents(value));
  const result = Object.fromEntries(PURE_ORDER.map(id => [id,0]));
  PURE_ORDER.forEach(id => {
    const unit = cents(PURE_TYPES[id].value);
    result[id] = Math.floor(remaining / unit);
    remaining -= result[id] * unit;
  }); return result;
}
function formatPureBreakdown(breakdown) {
  return PURE_ORDER.filter(id => breakdown[id] > 0).map(id => `${breakdown[id]} × ${PURE_TYPES[id].name}`).join(' + ') || 'no whole Pure units';
}
async function convertInventoryItem(index) {
  if(typeof CaseBattle!=='undefined'&&CaseBattle.running)return siteAlert('Finish your active Case Battle before changing coins or items.');
  const item = inventory[index]; if (!item) return;
  if (item.favorite || isItemLocked(item)) return siteAlert('Unfavorite the item or finish the current game first.');
  const uid = item.uid; const pureId = getPureId(item);
  if (pureId) {
    const ok = await siteConfirm(`Store 1 ${PURE_TYPES[pureId].name} in your Pure balance?`, 'STORE PURE'); if (!ok) return;
    const freshIndex = inventory.findIndex(entry => entry.uid === uid); if (freshIndex < 0 || inventory[freshIndex].favorite) return;
    inventory.splice(freshIndex,1); addPure(pureId,1); refreshEconomy(); return;
  }
  if (cents(item.price) < 1) return siteAlert('This item has no convertible coin value.');
  const value = fromCents(Math.floor(cents(item.price) * PURE_CONVERSION_RATE));
  const breakdown = calculatePureBreakdown(value);
  if (Object.values(breakdown).every(n => n === 0)) return siteAlert('After the 15% conversion fee, this item is worth less than 1 Refined Metal.');
  const ok = await siteConfirm(`Convert ${item.name}?\n\nItem value: ⛃ ${money(item.price)}\nAfter 15% fee: ⛃ ${money(value)}\nYou receive: ${formatPureBreakdown(breakdown)}\n\nAny remainder is discarded.`, 'CONVERT TO PURE');
  if (!ok) return;
  const liveIndex = inventory.findIndex(entry => entry.uid === uid);
  if (liveIndex < 0 || inventory[liveIndex].favorite || isItemLocked(inventory[liveIndex])) return siteAlert('That item is no longer available.');
  inventory.splice(liveIndex,1);
  PURE_ORDER.forEach(id => { pures[id] += breakdown[id]; }); savePures(); renderPureBalances(); refreshEconomy();
}

/* ---------- Case browser and weighted drops ---------- */
function normalizeCase(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const id = String(raw.id || '').trim();
  if (!id || !Array.isArray(raw.items)) return null;
  const items = raw.items.map(item => ({
    name: String(item?.name || 'Unknown Item'), rarity: qualityClass(item?.rarity),
    price: Number(item?.price), weight: Number(item?.weight), image: String(item?.image || '')
  })).filter(item => Number.isFinite(item.price) && item.price >= 0 && Number.isFinite(item.weight) && item.weight > 0);
  const price = Number(raw.price);
  if (!Number.isFinite(price) || price < 0 || !items.length) return null;
  return { id, name: String(raw.name || id), price, image: String(raw.image || ''), items };
}
async function loadCases() {
  const display = $('case-select-display');
  try {
    const response = await fetch('data/cases.json', { cache: 'no-cache' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (!Array.isArray(data.cases)) throw new Error('Missing cases array in JSON');
    cases = data.cases.map(normalizeCase).filter(Boolean);
    if (!cases.length) throw new Error('No valid cases found');
    $('case-count-badge').textContent = `${cases.length} CASES AVAILABLE`;
    selectCase(cases[0].id); renderCaseOptions(); renderTarget();
    window.dispatchEvent(new Event('tf2grand:casesloaded'));
    if(typeof renderRewardPath==='function')renderRewardPath();
    if ($('case-search')) $('case-search').placeholder = `Search ${cases.length} cases...`;
  } catch (error) {
    console.error('Failed loading case data:', error);
    if (display) display.textContent = 'Unable to load cases — check data/cases.json';
    $('case-count-badge').textContent = 'CASE LIBRARY ERROR';
    $('case-description').textContent = 'Serve the project through GitHub Pages or a local web server and check data/cases.json.';
    siteAlert('Case data could not load. Make sure data/cases.json exists and the site is served through a web server (not opened as a file).');
  }
}
function renderCaseOptions() {
  const box = $('case-select-options'); if (!box) return;
  const q = ($('case-search')?.value || '').toLowerCase().trim();
  const order = $('case-order')?.value || 'price-asc';
  const list = cases.filter(c => c.name.toLowerCase().includes(q)).sort((a,b) => order === 'price-desc' ? b.price - a.price : order === 'name' ? a.name.localeCompare(b.name) : a.price - b.price);
  const frag = document.createDocumentFragment();
  if (!list.length) frag.appendChild(createElement('div','case-option-empty','No cases match your search.'));
  list.forEach(gameCase => {
    const option = createElement('button','case-option'); option.type = 'button'; option.setAttribute('role','option'); option.setAttribute('aria-selected',String(currentCase?.id === gameCase.id));
    option.appendChild(itemImage(gameCase));
    const copy = createElement('span','case-option-copy'); copy.append(createElement('strong','',gameCase.name),createElement('small','',`${gameCase.items.length} possible drops`));
    option.append(copy,createElement('span','case-option-price',`⛃ ${money(gameCase.price)}`));
    option.onclick = () => { selectCase(gameCase.id); closeCaseOptions(); };
    frag.appendChild(option);
  }); box.replaceChildren(frag);
}
function toggleCaseOptions() {
  const box = $('case-select-options'); if (!box) return;
  const open = !box.classList.contains('open'); box.classList.toggle('open',open);
  $('case-select-display').setAttribute('aria-expanded',String(open));
}
function closeCaseOptions() { $('case-select-options')?.classList.remove('open'); $('case-select-display')?.setAttribute('aria-expanded','false'); }
function selectCase(id) {
  if (isSpinning) return;
  const selected = cases.find(c => c.id === id); if (!selected) return;
  currentCase = selected;
  const display = $('case-select-display'); display.replaceChildren();
  display.appendChild(itemImage(selected));
  const copy = createElement('span','case-select-text'); copy.append(createElement('strong','',selected.name),createElement('small','',`⛃ ${money(selected.price)}  ·  ${selected.items.length} possible drops`)); display.appendChild(copy);
  $('case-image').src = selected.image; $('case-image').alt = selected.name;
  $('case-name').textContent = selected.name;
  $('case-current-index').textContent = String(cases.indexOf(selected)+1).padStart(3,'0');
  $('case-item-count').textContent = String(selected.items.length);
  $('case-top-value').textContent = `⛃ ${money(Math.max(...selected.items.map(item => item.price)))}`;
  $('case-description').textContent = `Custom TF2-inspired rewards with ${selected.items.length} possible items. View the drop list to see each exact weight-based chance.`;
  $('case-open-price').textContent = `⛃ ${money(selected.price)}`;
  $('winner-name').replaceChildren(createElement('span','winner-idle','YOUR NEXT DROP AWAITS')); $('winner-name').className = '';
  $('spinner-strip').replaceChildren(); $('case-items-list').hidden = true;
  $('show-case-items-btn').setAttribute('aria-expanded','false'); $('show-case-items-btn').textContent = 'VIEW ALL POTENTIAL DROPS ⌄';
  updateCoins(); renderCaseOptions();
}
function toggleCaseItems() {
  if (!currentCase) return;
  const box = $('case-items-list');
  const open = box.hidden; box.hidden = !open;
  $('show-case-items-btn').setAttribute('aria-expanded',String(open));
  $('show-case-items-btn').textContent = open ? 'HIDE POTENTIAL DROPS ⌃' : 'VIEW ALL POTENTIAL DROPS ⌄';
  if (!open) return;
  const total = currentCase.items.reduce((sum,item) => sum+item.weight,0);
  const sorted = [...currentCase.items].sort((a,b) => b.price-a.price);
  const frag = document.createDocumentFragment();
  sorted.forEach(item => frag.appendChild(createItemCard(item,{showChance: item.weight / total * 100})));
  box.replaceChildren(frag);
}
function getRandomItem(items) {
  const valid = items.filter(item => Number.isFinite(item.weight) && item.weight > 0);
  if (!valid.length) return null;
  const total = valid.reduce((sum,item) => sum+item.weight,0);
  let roll = Math.random() * total;
  for (const item of valid) { roll -= item.weight; if (roll < 0) return item; }
  return valid[valid.length-1];
}
async function openCases(count = 1) {
  if (isSpinning || (typeof CaseBattle!=='undefined'&&CaseBattle.running) || !currentCase || !$('spinner-strip')) return;
  const quantity = Math.max(1,Math.min(10,Math.floor(Number(count) || 1)));
  isSpinning = true; updateCoins();
  try {
    for (let run=0;run<quantity;run++) {
      if (cents(coins) < cents(currentCase.price)) { await siteAlert('Not enough virtual coins.'); break; }
      const winner = getRandomItem(currentCase.items);
      if (!winner) { await siteAlert('This case has no valid rewards.'); break; }
      coins = fromCents(cents(coins)-cents(currentCase.price)); updateCoins();
      awardSpendXP(currentCase.price,'cases');
      await spinToItem(winner);
      showWinner(winner);
    }
  } finally { isSpinning = false; updateCoins(); }
}
function spinToItem(winningItem) {
  return new Promise(resolve => {
    const strip = $('spinner-strip'); const windowEl = $('spinner-container');
    if (!strip || !windowEl) { resolve(); return; }
    const entries = 52, winIndex = 39, frag = document.createDocumentFragment();
    for (let i=0; i<entries; i++) {
      // Every decorative tile uses the same weighted pool, but the center
      // winner is always the reward decided before the animation starts.
      const item = i === winIndex ? winningItem : getRandomItem(currentCase.items) || winningItem;
      const tile = createElement('div', `spinner-item ${qualityClass(item.rarity)}`);
      tile.appendChild(itemImage(item)); tile.title = item.name; frag.appendChild(tile);
    }
    strip.replaceChildren(frag);
    strip.style.transition = 'none'; strip.style.transform = 'translateX(0px)';
    void strip.offsetWidth;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const duration = reduced ? 90 : 2850 + Math.round(Math.random() * 1850);
    const easing = [
      'cubic-bezier(.12,.64,.15,1)',
      'cubic-bezier(.16,.72,.12,1)',
      'cubic-bezier(.08,.59,.18,1)',
      'cubic-bezier(.14,.76,.20,1)'
    ][Math.floor(Math.random()*4)];
    const winner = strip.children[winIndex];
    const winnerCenter = winner.offsetLeft + winner.offsetWidth/2;
    // Keep all timing / offset variation inside the actual winning tile.
    const jitter = (Math.random() - .5) * Math.min(44, winner.offsetWidth*.42);
    const finishAt = Math.round(windowEl.clientWidth/2 - winnerCenter + jitter);
    if ($('spinner-speed-label')) $('spinner-speed-label').textContent = `${(duration/1000).toFixed(1)}s REEL`;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      strip.style.transition = `transform ${duration}ms ${easing}`;
      strip.style.transform = `translateX(${finishAt}px)`;
    }));
    window.setTimeout(() => {
      winner.classList.add('winning');
      if ($('spinner-speed-label')) $('spinner-speed-label').textContent = 'REEL COMPLETE';
      resolve();
    }, duration + 75);
  });
}

function showWinner(item) {
  const copy = normalizedItem(item); inventory.push(copy);
  recentDrops.push(normalizedItem({...item,wonAt:Date.now()})); if (recentDrops.length > 40) recentDrops = recentDrops.slice(-40);
  const box = $('winner-name'); box.className = `winner-active ${qualityClass(item.rarity)}`;
  box.textContent = `✦ ${item.name}  ·  ⛃ ${money(item.price)}`;
  refreshEconomy();
}

function setupKunaiCoin(){
  const coin=$('coin');if(!coin)return;
  const kunaiSvg=`<svg viewBox="0 0 100 112" class="kunai-emblem" aria-hidden="true"><path d="M50 7 L69 56 L50 65 L31 56 Z" fill="currentColor" stroke="rgba(255,255,255,.65)" stroke-width="2"/><path d="M50 7 L50 65 L31 56 Z" fill="rgba(255,255,255,.32)"/><rect x="46" y="62" width="8" height="29" rx="2" fill="currentColor"/><path d="M47 67 L53 72 M47 76 L53 81 M47 85 L53 90" stroke="#241622" stroke-width="3"/><circle cx="50" cy="99" r="9" fill="none" stroke="currentColor" stroke-width="5"/></svg>`;
  for(const [side,caption] of [['.head','WIN'],['.tail','LOSE']]){
    const face=coin.querySelector(side);if(!face)continue;
    face.replaceChildren();
    const icon=createElement('span','kunai-icon');icon.innerHTML=kunaiSvg;
    const label=createElement('span','kunai-face-label',caption);
    face.append(icon,label);
  }
}

/* ---------- Coinflip: selectable item wagers & variable bot rewards ---------- */
function coinflipWagerItems() {
  return Coinflip.selectedUids.map(uid => inventory.find(item => item.uid === uid)).filter(Boolean);
}
function coinflipEligible(item) {
  return Boolean(item && !item.favorite && !isPureItem(item) &&
    (!isItemLocked(item) || (isFlipping && activeCoinflipUids.has(item.uid))) &&
    !(typeof Champion !== 'undefined' && Champion.battleRunning));
}
function buildCoinflipOpponent(wager) {
  const w = cents(wager);
  if (w <= 0) return {items:[],coins:0,total:0};
  const lower = Math.max(1, Math.ceil(w*.75));
  const upper = Math.max(lower, Math.floor(w*1.25));
  const aim = lower + Math.floor(Math.random() * (upper-lower+1));
  // Only in-game case rewards are drawn. No fabricated TF2 item names or prices.
  const known = new Set();
  const pool = cases.flatMap(gameCase => gameCase.items).filter(item => {
    const price = cents(item.price);
    const key = `${item.name}\t${price}\t${item.image}`;
    if (price <= 0 || price > upper || known.has(key)) return false;
    known.add(key); return true;
  });
  if (!pool.length) return {items:[],coins:fromCents(aim),total:fromCents(aim)};
  // Try varied combinations of 1–4 real items. The final coin remainder
  // makes the bot's total stake exactly match a random 75–125% target.
  let best = [], bestSum = 0, bestScore = Infinity;
  const eligible = pool.sort((a,b) => b.price-a.price);
  for (let trial=0; trial<95; trial++) {
    const picks = [], used = new Set(); let sum = 0;
    const desiredCount = 1 + Math.floor(Math.random()*4);
    for (let slot=0; slot<desiredCount; slot++) {
      const remaining = aim-sum;
      if (remaining <= 0) break;
      const ideal = remaining / (desiredCount-slot);
      const options = eligible.map((item,index) => ({item,index,price:cents(item.price)}))
        .filter(entry => entry.price <= remaining && !used.has(entry.index))
        .sort((a,b) => Math.abs(a.price-ideal)-Math.abs(b.price-ideal));
      if (!options.length) break;
      const choice = options[Math.floor(Math.random()*Math.min(15,options.length))];
      used.add(choice.index); picks.push(choice.item); sum += choice.price;
    }
    if (!picks.length) continue;
    const score = Math.abs(aim-sum) + (picks.length-1)*2 + Math.random()*Math.max(1,w*.09);
    if (score < bestScore) { bestScore=score; best=picks; bestSum=sum; }
  }
  if (!best.length) {
    const item=eligible[eligible.length-1]; best=[item]; bestSum=cents(item.price);
  }
  const coinsNeeded = Math.max(0,aim-bestSum);
  return {items: best.map(item => ({...item})),coins:fromCents(coinsNeeded),total:fromCents(bestSum+coinsNeeded)};
}
function coinflipMiniCard(item, className='duel-stake-item') {
  const tile = createElement('div', `${className} ${qualityClass(item.rarity)}`);
  tile.appendChild(itemImage(item));
  tile.append(createElement('div','duel-stake-name',item.name),createElement('strong','duel-stake-price',`⛃ ${money(item.price)}`));
  tile.title = `${item.name} · ⛃ ${money(item.price)}`;
  return tile;
}
function renderCoinflipSelection() {
  if (!Coinflip.botName) Coinflip.botName=getRandomAquaticBot().name;
  if ($('coinflip-rival-name')) $('coinflip-rival-name').textContent=Coinflip.botName.toUpperCase();
  if (!$('coinflip-item-list')) return;
  if (!isFlipping) Coinflip.selectedUids = Coinflip.selectedUids.filter(uid => {
    const item=inventory.find(entry=>entry.uid===uid); return coinflipEligible(item);
  });
  const items=coinflipWagerItems(), key=Coinflip.selectedUids.join('|');
  if (Coinflip.matchKey !== key && !isFlipping) {
    Coinflip.opponent = buildCoinflipOpponent(fromCents(items.reduce((sum,item)=>sum+cents(item.price),0)));
    Coinflip.matchKey=key;
  }
  const list=$('coinflip-item-list'), frag=document.createDocumentFragment();
  const query=($('coinflip-search')?.value||'').trim().toLowerCase();
  const available=inventory.filter(item=>coinflipEligible(item) || Coinflip.selectedUids.includes(item.uid));
  const matches=available.filter(item=>item.name.toLowerCase().includes(query)).sort((a,b)=>b.price-a.price);
  if (!matches.length) frag.appendChild(createElement('div','empty-small',available.length ? 'No matching items.' : 'No available items in your backpack.'));
  matches.forEach(item=>{
    const selected=Coinflip.selectedUids.includes(item.uid);
    const card=createElement('button',`duel-inventory-item ${qualityClass(item.rarity)} ${selected?'selected':''}`);
    card.type='button'; card.disabled=isFlipping || (isItemLocked(item) && !selected);
    card.setAttribute('aria-pressed',String(selected));
    card.appendChild(itemImage(item));
    card.append(createElement('span','duel-inventory-name',item.name),createElement('strong','duel-inventory-price',`⛃ ${money(item.price)}`));
    card.appendChild(createElement('span','duel-inventory-check',selected?'✓':'+'));
    card.onclick=()=>{
      if (isFlipping) return;
      Coinflip.selectedUids=selected ? Coinflip.selectedUids.filter(uid=>uid!==item.uid) : [...Coinflip.selectedUids,item.uid];
      renderCoinflipSelection();
    };
    frag.appendChild(card);
  }); list.replaceChildren(frag);
  const total=fromCents(items.reduce((sum,item)=>sum+cents(item.price),0));
  if ($('coinflip-wager-value')) $('coinflip-wager-value').textContent=`⛃ ${money(total)}`;
  if ($('coinflip-wager-count')) $('coinflip-wager-count').textContent=`${items.length} ITEMS`;
  if ($('coinflip-selection-label')) $('coinflip-selection-label').textContent=`${items.length} SELECTED`;
  const yourItems=$('coinflip-selected-items'); yourItems.replaceChildren();
  if (items.length) items.forEach(item=>yourItems.appendChild(coinflipMiniCard(item)));
  else yourItems.appendChild(createElement('div','duel-empty','Select items from your backpack below'));
  const rival=$('coinflip-bot-items'); rival.replaceChildren();
  if (items.length) {
    Coinflip.opponent.items.forEach(item=>rival.appendChild(coinflipMiniCard(item)));
    if (Coinflip.opponent.coins>0) rival.appendChild(createElement('div','duel-stake-item duel-stake-coins',`🪙 ${money(Coinflip.opponent.coins)} coins`));
  } else rival.appendChild(createElement('div','duel-empty',`${Coinflip.botName} awaits a wager`));
  if ($('coinflip-bot-value')) $('coinflip-bot-value').textContent=`⛃ ${money(Coinflip.opponent.total)}`;
  if ($('coinflip-bot-count')) $('coinflip-bot-count').textContent=`${items.length?Coinflip.opponent.items.length:0} ITEMS`;
  const canFlip=items.length>0 && cents(total)>0 && !isFlipping;
  if ($('coinflip-btn')) $('coinflip-btn').disabled=!canFlip;
  if ($('coinflip-clear-btn')) $('coinflip-clear-btn').disabled=isFlipping || !items.length;
  if ($('coinflip-status') && !isFlipping) $('coinflip-status').textContent=items.length ? 'THE MATCH IS READY' : 'SELECT YOUR WAGER';
}
function populateCoinflipDropdown() {
  const select=$('coinflip-select');
  if (select) {
    const opts=document.createDocumentFragment();
    coinflipWagerItems().forEach(item=>{const opt=createElement('option','',item.name); opt.value=item.uid; opts.appendChild(opt);});
    select.replaceChildren(opts);
  }
  renderCoinflipSelection();
}
async function coinflipItem(uidOrIndex) {
  if (isFlipping || (typeof CaseBattle!=='undefined'&&CaseBattle.running)) return;
  // Accept old API calls while the new interface supports multi-item stakes.
  if (!Coinflip.selectedUids.length && uidOrIndex !== undefined) {
    const item=typeof uidOrIndex==='number' ? inventory[uidOrIndex] : inventory.find(entry=>entry.uid===uidOrIndex);
    if (coinflipEligible(item)) {Coinflip.selectedUids=[item.uid]; renderCoinflipSelection();}
  }
  const stake=coinflipWagerItems();
  if (!stake.length || stake.some(item=>!coinflipEligible(item))) return siteAlert('Select at least one unlocked, non-Pure item.');
  const opponent=Coinflip.opponent;
  if (opponent.total<=0) return siteAlert('The coinflip opponent could not match this wager.');
  const selectedIds=stake.map(item=>item.uid), selectedSet=new Set(selectedIds);
  if (selectedSet.size!==stake.length) return siteAlert('Duplicate wager detected; please reselect your items.');
  isFlipping=true; selectedIds.forEach(uid=>activeCoinflipUids.add(uid));
  renderCoinflipSelection();
  $('coinflip-btn').disabled=true;
  $('coinflip-status').textContent='THE COIN IS FLIPPING...';
  const coin=$('coin'), win=Math.random()<.5;
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const duration=reduced?120:2950;
  const turns=4+Math.floor(Math.random()*2); // fewer full turns, longer perceived arc
  const station=$('coin-container');
  station?.classList.remove('coin-airborne','coin-settled');
  coin.classList.remove('flipping');coin.style.transition='none';coin.style.transform='rotateY(0deg)';
  void coin.offsetWidth;
  await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
  coin.classList.add('flipping');station?.classList.add('coin-airborne');
  coin.style.transition=`transform ${duration}ms cubic-bezier(.11,.32,.19,1)`;
  coin.style.transform=`rotateY(${turns*360+(win?0:180)}deg)`;
  await new Promise(resolve=>setTimeout(resolve,duration));
  station?.classList.remove('coin-airborne');station?.classList.add('coin-settled');
  $('coinflip-status').textContent='THE COIN HAS LANDED...';
  await new Promise(resolve=>setTimeout(resolve,reduced?35:230));
  const live=inventory.filter(item=>selectedSet.has(item.uid));
  const valid=live.length===selectedSet.size && !live.some(item=>item.favorite || isPureItem(item));
  if (valid) {
    if (win) opponent.items.forEach(item=>inventory.push(normalizedItem(item)));
    else inventory=inventory.filter(item=>!selectedSet.has(item.uid));
    if (win && opponent.coins>0) coins=fromCents(cents(coins)+cents(opponent.coins));
  }
  isFlipping=false; activeCoinflipUids.clear(); Coinflip.selectedUids=[]; Coinflip.matchKey='';
  if(valid)awardSpendXP(fromCents(stake.reduce((sum,item)=>sum+cents(item.price),0)),'coinflip');
  if(valid&&win)recordWin('Coinflip',{prizeItems:opponent.items,prizeCoins:opponent.coins,totalValue:opponent.total});
  Coinflip.botName=getRandomAquaticBot(Coinflip.botName).name;
  refreshEconomy();
  if ($('coinflip-status')) $('coinflip-status').textContent=valid ? (win?'★ HEADS — VICTORY!':'✕ TAILS — DEFEAT') : 'COINFLIP CANCELED';
  if (!valid) return siteAlert('The wager changed during the flip. No items were awarded or removed.');
  const rewardSummary=opponent.items.length ? opponent.items.map(item=>item.name).join(', ') : 'no items';
  siteAlert(win
    ? `HEADS — YOU WIN!\nYour ${stake.length} wagered item(s) were kept.\nYou received: ${rewardSummary}${opponent.coins>0?` plus ⛃ ${money(opponent.coins)} coins`:''}.\nTotal extra prize: ⛃ ${money(opponent.total)}.`
    : `TAILS — YOU LOSE!\nYou lost ${stake.length} wagered item(s) worth ⛃ ${money(stake.reduce((n,item)=>n+item.price,0))}.`, 'COINFLIP RESULT');
}

/* ---------- Demo shop ---------- */
function setShopOpen(open) {
  const panel = $('admin-give-panel'); if (!panel) return;
  panel.hidden = !open;
  if (!open) adminMode = false;
  document.body.style.overflow = open ? 'hidden' : '';
}
async function adminGiveItem() {
  if(typeof CaseBattle!=='undefined'&&CaseBattle.running)return siteAlert('Finish your active Case Battle before changing coins or items.');
  if (!cases.length) return siteAlert('Wait for the case library to load.');
  if (!adminMode) {
    if (!(await checkAdminPassword())) return;
    adminMode = true;
  }
  setShopOpen(true); renderTradeShop(); $('trade-search')?.focus();
}
function renderTradeShop() {
  const box = $('admin-give-items'); if (!box) return;
  const q = ($('trade-search')?.value || '').toLowerCase();
  const all = new Map();
  cases.forEach(gameCase => gameCase.items.forEach(item => {
    const key = `${item.name}|${item.price}`; if (!all.has(key)) all.set(key,item);
  }));
  const filtered = [...all.values()].filter(item => item.name.toLowerCase().includes(q)).sort((a,b) => a.price-b.price).slice(0,250);
  const frag = document.createDocumentFragment();
  if (!filtered.length) frag.appendChild(createEmptyState('No matching trade items.'));
  filtered.forEach(item => {
    const row = createElement('div',`admin-give-item ${qualityClass(item.rarity)}`); row.appendChild(itemImage(item));
    const copy = createElement('div','admin-give-info'); copy.append(createElement('span','name',item.name),createElement('span','price',`⛃ ${money(item.price)}`)); row.appendChild(copy);
    const buy = createElement('button','','TRADE'); buy.type = 'button'; buy.disabled = cents(coins) < cents(item.price);
    buy.onclick = () => {
      if (cents(coins) < cents(item.price)) return siteAlert('Not enough virtual coins.');
      coins = fromCents(cents(coins)-cents(item.price)); inventory.push(normalizedItem(item)); refreshEconomy(); renderTradeShop();
    };
    row.appendChild(buy); frag.appendChild(row);
  }); box.replaceChildren(frag);
}

/* ---------- Upgrader: draggable win arc and a real random pointer ---------- */
const Upgrader = { selectedWagers: [], selectedTargets: [], upgrading: false, targetCatalog: [], cases: [], zoneStart: 0, pointerAngle: 0 };
function getKey(item,index) { return `${item.name}|${item.price}|${item.image}|${index}`; }
function renderWager() {
  const box = $('wager-list'); if (!box) return;
  Upgrader.selectedWagers = Upgrader.selectedWagers.filter(entry => inventory.some(item => item.uid === entry.uid && !item.favorite && !isPureItem(item)));
  const frag=document.createDocumentFragment(), query=($('upgrade-wager-search')?.value||'').toLowerCase().trim();
  const eligible=inventory.filter(item=>!isPureItem(item) && !item.favorite && !isItemLocked(item)).filter(item=>item.name.toLowerCase().includes(query)).sort((a,b)=>b.price-a.price);
  if (!eligible.length) frag.appendChild(createElement('div','empty-small',query ? 'No matching wager items.' : 'No unlocked wager items.'));
  eligible.forEach(item => {
    const selected=Upgrader.selectedWagers.some(entry=>entry.uid===item.uid);
    const row=createElement('button',`upgrade-item ${qualityClass(item.rarity)} ${selected?'selected':''}`); row.type='button'; row.disabled=Upgrader.upgrading;
    row.appendChild(itemImage(item)); row.append(createElement('span','upgrade-item-name',item.name),createElement('span','upgrade-item-price',`⛃ ${money(item.price)}`));
    row.setAttribute('aria-pressed',String(selected));
    row.onclick=()=>{if (selected) Upgrader.selectedWagers=Upgrader.selectedWagers.filter(entry=>entry.uid!==item.uid); else Upgrader.selectedWagers.push({uid:item.uid}); renderWager();updateUI();};
    frag.appendChild(row);
  }); box.replaceChildren(frag);updateUI();
}
function renderTarget() {
  const box=$('target-list'); if (!box) return;
  Upgrader.cases=cases;
  Upgrader.targetCatalog=cases.flatMap(gameCase=>gameCase.items.map((item,i)=>({...item,catalogId:`${gameCase.id}:${i}`})));
  const query=($('upgrade-target-search')?.value||'').toLowerCase().trim(), order=$('upgrade-target-sort')?.value||'price-desc';
  const targets=Upgrader.targetCatalog.filter(item=>item.name.toLowerCase().includes(query)).sort((a,b)=>order==='price-asc'?a.price-b.price:b.price-a.price);
  const frag=document.createDocumentFragment();
  if (!targets.length) frag.appendChild(createElement('div','empty-small',cases.length?'No matching target rewards.':'Loading case rewards...'));
  targets.forEach(item=>{
    const selected=Upgrader.selectedTargets.some(entry=>entry.catalogId===item.catalogId);
    const row=createElement('button',`upgrade-item ${qualityClass(item.rarity)} ${selected?'selected':''}`);row.type='button';row.disabled=Upgrader.upgrading;
    row.appendChild(itemImage(item));row.append(createElement('span','upgrade-item-name',item.name),createElement('span','upgrade-item-price',`⛃ ${money(item.price)}`));
    row.setAttribute('aria-pressed',String(selected));
    row.onclick=()=>{if(selected) Upgrader.selectedTargets=Upgrader.selectedTargets.filter(entry=>entry.catalogId!==item.catalogId);else Upgrader.selectedTargets.push({catalogId:item.catalogId});renderTarget();updateUI();};
    frag.appendChild(row);
  });box.replaceChildren(frag);updateUI();
}
function getUpgradeWagerItems(){return Upgrader.selectedWagers.map(entry=>inventory.find(item=>item.uid===entry.uid)).filter(Boolean);}
function getUpgradeTargetItems(){return Upgrader.selectedTargets.map(entry=>Upgrader.targetCatalog.find(item=>item.catalogId===entry.catalogId)).filter(Boolean);}
function upgradeOdds(){
  const wagerCents=getUpgradeWagerItems().reduce((n,item)=>n+cents(item.price),0);
  const targetCents=getUpgradeTargetItems().reduce((n,item)=>n+cents(item.price),0);
  return {wager:fromCents(wagerCents),target:fromCents(targetCents),chance:targetCents>0&&wagerCents>0?Math.min(100,(wagerCents*.95/targetCents)*100):0};
}
function renderUpgradeItemPreview(id,items){
  const el=$(id);if(!el)return; const frag=document.createDocumentFragment();
  items.slice(0,5).forEach(item=>{const tile=createElement('div',`upgrade-preview-item ${qualityClass(item.rarity)}`);tile.appendChild(itemImage(item));tile.title=`${item.name} · ⛃ ${money(item.price)}`;frag.appendChild(tile);});
  if(items.length>5)frag.appendChild(createElement('span','upgrade-preview-more',`+${items.length-5}`));
  if(!items.length)frag.appendChild(createElement('div','duel-empty','No items selected'));
  el.replaceChildren(frag);
}
function updateUI(){
  const {wager,target,chance}=upgradeOdds();
  if($('upgrade-chance'))$('upgrade-chance').textContent=`CHANCE: ${chance.toFixed(2)}%`;
  if($('upgrade-value'))$('upgrade-value').textContent=`${money(wager)} ⛃ → ${money(target)} ⛃`;
  if($('upgrade-wager-total'))$('upgrade-wager-total').textContent=`⛃ ${money(wager)}`;
  if($('upgrade-target-total'))$('upgrade-target-total').textContent=`⛃ ${money(target)}`;
  if($('upgrade-wager-count'))$('upgrade-wager-count').textContent=`${Upgrader.selectedWagers.length} ITEMS`;
  if($('upgrade-target-count'))$('upgrade-target-count').textContent=`${Upgrader.selectedTargets.length} ITEMS`;
  renderUpgradeItemPreview('upgrade-wager-preview',getUpgradeWagerItems());
  renderUpgradeItemPreview('upgrade-target-preview',getUpgradeTargetItems());
  updateUpgradeCircle(chance);
  if($('upgrade-btn'))$('upgrade-btn').disabled=Upgrader.upgrading||!Upgrader.selectedWagers.length||!Upgrader.selectedTargets.length||target<=0||wager<=0;
}
function updateUpgradeCircle(chance){
  const dial=$('upgrade-circle');if(!dial)return;
  if(!Upgrader.upgrading)dial.classList.remove('win','lose');
  dial.style.setProperty('--chance',`${Math.min(100,Math.max(0,chance))}%`);
  dial.style.setProperty('--zone-start',`${(Upgrader.zoneStart*3.6).toFixed(2)}deg`);
  if(!Upgrader.upgrading)$('upgrade-circle-text').textContent=`${chance.toFixed(2)}%`;
  if($('upgrade-zone-value'))$('upgrade-zone-value').textContent=`${Upgrader.zoneStart.toFixed(1)}%`;
  if($('upgrade-zone-slider'))$('upgrade-zone-slider').value=String(Upgrader.zoneStart);
  dial.setAttribute('aria-valuenow',String(Upgrader.zoneStart));
  if($('chance-fill'))$('chance-fill').style.width=`${chance}%`;
}
function setUpgradeZonePosition(position){
  if(Upgrader.upgrading)return;
  Upgrader.zoneStart=Math.max(0,Math.min(100,Number(position)||0));
  updateUpgradeCircle(upgradeOdds().chance);
}
function initUpgradeDialControl(){
  const dial=$('upgrade-circle'), slider=$('upgrade-zone-slider'); if(!dial||!slider)return;
  slider.addEventListener('input',()=>setUpgradeZonePosition(slider.value));
  let dragging=false;
  const updateFromPointer=event=>{
    const bounds=dial.getBoundingClientRect(),cx=bounds.left+bounds.width/2,cy=bounds.top+bounds.height/2;
    const angle=(Math.atan2(event.clientX-cx,cy-event.clientY)*180/Math.PI+360)%360;
    setUpgradeZonePosition(Math.round(angle/360*1000)/10);
  };
  dial.addEventListener('pointerdown',event=>{if(Upgrader.upgrading||event.button!==0)return;dragging=true;dial.setPointerCapture(event.pointerId);updateFromPointer(event);});
  dial.addEventListener('pointermove',event=>{if(dragging&&!Upgrader.upgrading)updateFromPointer(event);});
  dial.addEventListener('pointerup',()=>{dragging=false;});
  dial.addEventListener('pointercancel',()=>{dragging=false;});
  dial.addEventListener('keydown',event=>{
    if(Upgrader.upgrading)return;
    const step=event.shiftKey?5:1;
    if(event.key==='ArrowRight'||event.key==='ArrowUp')setUpgradeZonePosition(Math.min(100,Upgrader.zoneStart+step));
    else if(event.key==='ArrowLeft'||event.key==='ArrowDown')setUpgradeZonePosition(Math.max(0,Upgrader.zoneStart-step));
    else if(event.key==='Home')setUpgradeZonePosition(0);
    else if(event.key==='End')setUpgradeZonePosition(100);
    else return;
    event.preventDefault();
  });
}
async function animateUpgradePointer(stopAngle){
  const rotor=$('upgrade-pointer-rotor');if(!rotor)return;
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const start=Upgrader.pointerAngle;
  const travel=(5+Math.floor(Math.random()*2))*360+(stopAngle-start+360)%360;
  const duration=reduced?125:3800;
  rotor.style.transition='none';
  // A continuous ease-out curve: no speed jumps between keyframes.
  if(!reduced&&typeof rotor.animate==='function'){
    const animation=rotor.animate([
      {transform:`rotate(${start}deg)`},
      {transform:`rotate(${start+travel}deg)`}
    ],{duration,easing:'cubic-bezier(.14,.73,.19,1)',fill:'forwards'});
    try{await animation.finished;}catch{}
    rotor.style.transform=`rotate(${stopAngle}deg)`;
    animation.cancel();
  }else if(!reduced){
    rotor.style.transform=`rotate(${start}deg)`;void rotor.offsetWidth;
    rotor.style.transition=`transform ${duration}ms cubic-bezier(.14,.73,.19,1)`;
    rotor.style.transform=`rotate(${start+travel}deg)`;
    await new Promise(resolve=>setTimeout(resolve,duration+30));
    rotor.style.transition='none';rotor.style.transform=`rotate(${stopAngle}deg)`;
  }else{
    rotor.style.transform=`rotate(${stopAngle}deg)`;
    await new Promise(resolve=>setTimeout(resolve,duration));
  }
  Upgrader.pointerAngle=stopAngle;
}

async function attemptUpgrade(){
  if(typeof CaseBattle!=='undefined'&&CaseBattle.running)return siteAlert('Finish Case Battle first.');
  if(Upgrader.upgrading)return;
  const {chance,target,wager}=upgradeOdds();
  if(!target||!wager||!Upgrader.selectedWagers.length||!Upgrader.selectedTargets.length)return;
  const sources=getUpgradeWagerItems(),rewards=getUpgradeTargetItems();
  if(sources.length!==Upgrader.selectedWagers.length||sources.some(item=>item.favorite||isPureItem(item)))return siteAlert('Your wager has changed; reselect your items.');
  const ids=new Set(sources.map(item=>item.uid));if(ids.size!==sources.length)return;
  Upgrader.upgrading=true;updateUI();renderWager();renderTarget();
  $('upgrade-btn').textContent='◉ SPINNING...';
  $('upgrade-zone-slider').disabled=true;
  $('upgrade-circle').classList.remove('win','lose');
  $('upgrade-result-status').textContent='SPINNING — WATCH WHERE THE POINTER STOPS';
  // One uniform landing angle, independent of the chosen win-zone position.
  // Visual result and actual payout use the SAME angle.
  const stopAngle=Math.random()*360;
  const stopPercent=stopAngle/3.6;
  const arcPosition=(stopPercent-Upgrader.zoneStart+100)%100;
  const win=arcPosition<chance;
  await animateUpgradePointer(stopAngle);
  const live=inventory.filter(item=>ids.has(item.uid));
  const stillValid=live.length===ids.size&&!live.some(item=>item.favorite||isPureItem(item));
  Upgrader.upgrading=false;
  $('upgrade-zone-slider').disabled=false;
  $('upgrade-btn').textContent='⚡ ATTEMPT UPGRADE';
  if(!stillValid){Upgrader.selectedWagers=[];renderWager();updateUI();return siteAlert('Upgrade canceled because your wager changed.');}
  inventory=inventory.filter(item=>!ids.has(item.uid));
  awardSpendXP(wager,'upgrader');
  if(win)rewards.forEach(item=>inventory.push(normalizedItem(item)));
  if(win)recordWin('Upgrader',{prizeItems:rewards,totalValue:target});
  Upgrader.selectedWagers=[];Upgrader.selectedTargets=[];
  refreshEconomy();renderTarget();updateUI();
  $('upgrade-circle').classList.add(win?'win':'lose');
  $('upgrade-circle-text').textContent=win?'WIN!':'LOSE';
  $('upgrade-result-status').textContent=win?`★ POINTER LANDED IN THE WIN ZONE — +⛃ ${money(target)} PRIZES`:'✕ POINTER LANDED OUTSIDE THE WIN ZONE — WAGER LOST';
  siteAlert(win?`UPGRADE SUCCESS!\nYou won ${rewards.map(item=>item.name).join(' + ')}.`:`UPGRADE FAILED.\nYou lost ⛃ ${money(wager)} in wagered items.`, 'UPGRADER RESULT');
}

/* ---------- Save backups (does not touch your original case data) ---------- */
function exportSave() {
  const backup = {
    format: 'tf2grand-save', version: 2, exportedAt: new Date().toISOString(),
    coins, inventory, recentDrops, recentWins, pures, rewardTrack: RewardTrack,
    rakeback: typeof Rakeback!=='undefined'?Rakeback:null,
    freeCoinsCase: typeof FreeCoinsCase!=='undefined'?FreeCoinsCase:null
  };
  const blob = new Blob([JSON.stringify(backup,null,2)], {type:'application/json'});
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.href = url; link.download = `TF2GRAND-backup-${new Date().toISOString().slice(0,10)}.json`;
  document.body.appendChild(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url),2000);
}
async function importSave(file) {
  if (!file) return;
  try {
    if (file.size > 12*1024*1024) throw new Error('The save is too large.');
    const data = JSON.parse(await file.text());
    if (data.format !== 'tf2grand-save' || !Array.isArray(data.inventory) || !Number.isFinite(data.coins) || !data.pures || typeof data.pures !== 'object')
      throw new Error('This is not a supported TF2GRAND backup.');
    if (data.inventory.length > 30000 || data.coins < 0 || data.coins > 1e12) throw new Error('Save totals are invalid.');
    const ok = await siteConfirm(`Restore ${data.inventory.length} items and ⛃ ${money(data.coins)}?\n\nThis will replace the current local coins, backpack, recent drops, and Pure balances.`, 'RESTORE SAVE');
    if (!ok) return;
    if (Champion?.battleRunning || Upgrader.upgrading || isFlipping || isSpinning || (typeof Blackjack!=='undefined'&&Blackjack.running) || (typeof CaseBattle!=='undefined'&&CaseBattle.running)) return siteAlert('Finish any running game before restoring a save.');
    inventory = data.inventory.map(normalizedItem).filter(Boolean);
    const known = new Set(); inventory.forEach(item => { if (known.has(item.uid)) item.uid=makeItemId(); known.add(item.uid); });
    recentDrops = (Array.isArray(data.recentDrops) ? data.recentDrops : []).slice(-40).map(normalizedItem).filter(Boolean);
    recentWins = (Array.isArray(data.recentWins)?data.recentWins:[]).filter(x=>x&&typeof x.mode==='string'&&Number.isFinite(x.at)).slice(-80);
    localStorage.setItem(RECENT_WINS_KEY,JSON.stringify(recentWins));
    if(data.rakeback&&typeof data.rakeback==='object'){
      Rakeback.pendingUnits=Math.max(0,Math.min(1e15,Math.floor(Number(data.rakeback.pendingUnits)||0)));
      localStorage.setItem(RAKEBACK_STORAGE_KEY,JSON.stringify(Rakeback));
    }
    if(data.freeCoinsCase&&typeof data.freeCoinsCase==='object'){
      FreeCoinsCase.nextAt=Math.max(0,Math.min(Date.now()+86400000,Number(data.freeCoinsCase.nextAt)||0));
      localStorage.setItem(FREE_CASE_STORAGE_KEY,JSON.stringify(FreeCoinsCase));
    }
    updateBonusPanels();
    coins = fromCents(cents(data.coins));
    pures = Object.fromEntries(PURE_ORDER.map(id => [id,Math.max(0,Math.min(100000000,Math.floor(Number(data.pures[id])||0)))]));
    if(data.rewardTrack && typeof data.rewardTrack==='object') {
      const next=data.rewardTrack;
      RewardTrack={level:Math.max(1,Math.min(200,Math.floor(Number(next.level)||1))),xp:Math.max(0,Number(next.xp)||0),totalSpent:Math.max(0,Number(next.totalSpent)||0),claimed:Array.isArray(next.claimed)?next.claimed.map(Number).filter(n=>Number.isInteger(n)&&n>=2&&n<=200):[]};
    } else RewardTrack={level:1,xp:0,totalSpent:0,claimed:[]};
    saveRewardTrack(); renderRewardPath();
    Upgrader.selectedWagers=[]; Upgrader.selectedTargets=[];
    savePures(); renderPureBalances(); refreshEconomy(); renderTarget(); updateUI();
    siteAlert('Backup restored successfully.');
  } catch (error) { console.error('Restore failed:',error); siteAlert(`Could not restore save: ${error.message}`); }
}

/* ---------- Game mode tabs and shareable deep links ---------- */
function setupGameModeTabs(){
  const buttons=[...document.querySelectorAll('[data-game-tab]')];
  const ids={coinflip:'coinflip-section',upgrader:'upgrader-section',blackjack:'blackjack-section',casebattle:'casebattle-section',champion:'champion-section'};
  function activate(mode,changeHash=false){
    if(!ids[mode])return;
    if(typeof CaseBattle!=='undefined'&&CaseBattle.running&&mode!=='casebattle')return;
    buttons.forEach(button=>{
      const active=button.dataset.gameTab===mode;
      button.classList.toggle('active',active);button.setAttribute('aria-selected',String(active));button.tabIndex=active?0:-1;
    });
    Object.entries(ids).forEach(([name,id])=>{const panel=$(id);if(panel)panel.hidden=name!==mode;});
    if(changeHash){
      const id=ids[mode];
      if(location.hash!==`#${id}`)location.hash=id;
      else $(id)?.scrollIntoView({behavior:'smooth',block:'start'});
    }
  }
  buttons.forEach((button,index)=>{
    button.onclick=()=>activate(button.dataset.gameTab,true);
    button.onkeydown=event=>{
      if(event.key!=='ArrowLeft'&&event.key!=='ArrowRight'&&event.key!=='Home'&&event.key!=='End')return;
      event.preventDefault();
      const n=event.key==='Home'?0:event.key==='End'?buttons.length-1:(index+(event.key==='ArrowRight'?1:-1)+buttons.length)%buttons.length;
      buttons[n].focus();activate(buttons[n].dataset.gameTab,true);
    };
  });
  const syncHash=()=>{
    const mode=Object.keys(ids).find(key=>location.hash===`#${ids[key]}`);
    if(mode)activate(mode,false);
    else if(location.hash==='#games-section')activate('coinflip',false);
  };
  window.addEventListener('hashchange',syncHash);
  document.querySelectorAll('a[href="#champion-section"]').forEach(link=>link.addEventListener('click',()=>activate('champion',false)));
  document.querySelectorAll('a[href="#games-section"]').forEach(link=>link.addEventListener('click',()=>activate('coinflip',false)));
  syncHash();
  if(!Object.values(ids).some(id=>location.hash===`#${id}`))activate('coinflip',false);
}

/* ---------- App initialization ---------- */
document.addEventListener('DOMContentLoaded', () => {
  setupPopupSystem();
  setupKunaiCoin();
  if (typeof recoverChampionEscrow === 'function') recoverChampionEscrow();
  updateCoins(); updateBackpackValue(); renderInventory(); renderTopDrops(); renderPureBalances(); populateCoinflipDropdown();
  loadCases();

  $('export-save-btn').onclick = exportSave;
  $('import-save-btn').onclick = () => $('import-save-input').click();
  $('import-save-input').addEventListener('change',e => { const file=e.target.files?.[0]; e.target.value=''; if (file) importSave(file); });
  $('toggle-inv-btn').onclick = () => siteAlert('This is a free-play simulation, not a real-money gambling site.\n\nCASE ODDS: Every case item has a weight. Its exact probability is weight ÷ sum of all item weights. You can see these odds under Potential Drops.\n\nCOINFLIP: 50% per flip. FishBot prizes have a total virtual value between 75% and 125% of the item wager, with virtual coin remainder when needed.\nUPGRADER: min(100%, wager value × 0.95 ÷ target value × 100). The draggable win-zone position does not change the chance.\nCHAMPION: Random alternating attacks and custom bot wagers.\nBLACKJACK: Four decks, dealer stands on 17.\nCASE BATTLE: Each participant rolls independently with the case weights. Standard: highest value wins, Cursed: lowest value wins. Shared regular splits the total among all players; Shared teams divide the prize among the winning team.\n\nRANDOMNESS: Results use your browser\'s Math.random(). There is no cryptographic commitment, third-party audit, or independently verifiable seed. The project is therefore NOT provably fair.', 'ODDS & FAIRNESS');
  $('add-coins-btn').onclick = addCoinsAdmin;
  $('remove-coins-btn').onclick = removeCoinsAdmin;
  $('admin-give-btn').onclick = adminGiveItem;
  $('sort-inv-btn').onclick = sortInventoryByPriceDesc;
  $('refresh-inventory-btn').onclick = () => { renderInventory(); renderWager(); };
  $('sell-all-btn').onclick = sellAllItems;
  $('inventory-search').addEventListener('input',renderInventory);
  $('inventory-rarity').addEventListener('change',renderInventory);
  $('open-btn').onclick = () => openCases(1);
  $('show-case-items-btn').onclick = toggleCaseItems;
  $('case-select-display').onclick = toggleCaseOptions;
  $('case-search').addEventListener('input', () => { renderCaseOptions(); $('case-select-options').classList.add('open'); $('case-select-display').setAttribute('aria-expanded','true'); });
  $('case-order').addEventListener('change', renderCaseOptions);
  document.addEventListener('click',event => { if (!event.target.closest('.custom-dropdown') && event.target !== $('case-search')) closeCaseOptions(); });
  document.addEventListener('keydown',event => { if (event.key === 'Escape') { closeCaseOptions(); if (!$('admin-give-panel').hidden) setShopOpen(false); } });
  $('coinflip-btn').onclick = () => coinflipItem();
  $('coinflip-search')?.addEventListener('input',renderCoinflipSelection);
  $('coinflip-clear-btn')?.addEventListener('click',()=>{ if(isFlipping)return; Coinflip.selectedUids=[]; renderCoinflipSelection(); });
  $('upgrade-wager-search')?.addEventListener('input',renderWager);
  $('upgrade-target-search')?.addEventListener('input',renderTarget);
  $('upgrade-target-sort')?.addEventListener('change',renderTarget);
  initUpgradeDialControl();
  setupGameModeTabs();
  $('load-wager-btn').onclick = renderWager;
  $('load-target-btn').onclick = renderTarget;
  $('upgrade-btn').onclick = attemptUpgrade;
  $('admin-give-close').onclick = () => setShopOpen(false);
  $('admin-give-panel').addEventListener('click',event => { if (event.target === $('admin-give-panel')) setShopOpen(false); });
  $('trade-search').addEventListener('input',renderTradeShop);
  $('pure-convert-close').onclick = () => { $('pure-convert-modal').hidden = true; };
  $('pure-convert-modal').addEventListener('click', e => { if (e.target === $('pure-convert-modal')) $('pure-convert-modal').hidden = true; });
  // Highlight the navigation link for the currently visible section.
  if ('IntersectionObserver' in window) {
    const nav = [...document.querySelectorAll('.nav-links a')];
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        nav.forEach(link => link.classList.toggle('active', link.getAttribute('href') === `#${entry.target.id}`));
      });
    }, {rootMargin: '-110px 0px -65% 0px', threshold:0});
    nav.forEach(link => { const section = document.querySelector(link.getAttribute('href')); if (section) observer.observe(section); });
  }
  // Rename the gallery in-place so users can keep their edited HTML file.
  const galleryHeading=$('drops-section')?.querySelector('h2');
  if(galleryHeading)galleryHeading.textContent='LATEST WINS & TOP DROPS';
  const galleryCaption=$('drops-section')?.querySelector('.section-heading p');
  if(galleryCaption)galleryCaption.textContent='Your latest case openings and victories across all game modes.';
  // Preserve past saves with unique instance IDs so selecting duplicate items is safe.
  saveInventory();
});
