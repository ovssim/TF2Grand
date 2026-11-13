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
const loadedIds = new Set();
inventory.forEach(item => { if (loadedIds.has(item.uid)) item.uid = makeItemId(); loadedIds.add(item.uid); });
let cases = [];
let currentCase = null;
let isSpinning = false;
let isFlipping = false;
let activeCoinflipUid = null;
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
  if (open) open.disabled = isSpinning || !currentCase || coins < Number(currentCase.price);
}
function updateBackpackValue() {
  const value = inventory.reduce((sum, item) => sum + (Number(item.price) || 0), 0);
  if ($('backpack-value')) $('backpack-value').textContent = `⛃ ${money(value)}`;
  if ($('inventory-count')) $('inventory-count').textContent = String(inventory.length);
  if ($('inventory-total-label')) $('inventory-total-label').textContent = `${inventory.length} ITEMS`;
}
function isItemLocked(item) {
  return Boolean(item && ((Upgrader.upgrading && Upgrader.selectedWagers.some(entry => entry.uid === item.uid)) || activeCoinflipUid === item.uid));
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
  if (!(await checkAdminPassword())) return;
  const input = await sitePrompt('Add virtual coins to your local wallet:', '20', 'ADD DEMO COINS');
  if (input === null) return;
  const amount = Number(input);
  if (!Number.isFinite(amount) || amount <= 0 || cents(amount) <= 0 || cents(amount) > 1e12) return siteAlert('Enter a valid amount of at least 0.01 virtual coins.');
  coins = fromCents(cents(coins) + cents(amount)); updateCoins();
  siteAlert(`Added ⛃ ${money(amount)} to your demo wallet.`);
}
async function removeCoinsAdmin() {
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
  const art = createElement('div', 'item-card-image'); art.appendChild(itemImage(item)); card.appendChild(art);
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
  const item = inventory[index]; if (!item) return;
  if (item.favorite || isItemLocked(item)) return siteAlert('This item is protected or being used in another game.');
  coins = fromCents(cents(coins) + cents(item.price)); inventory.splice(index,1); refreshEconomy();
}
async function sellAllItems() {
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
  const box = $('top-drops'); if (!box) return;
  const frag = document.createDocumentFragment();
  const list = [...recentDrops].sort((a,b) => b.price - a.price).slice(0,8);
  if (!list.length) frag.appendChild(createEmptyState('No drops yet.', 'Open a case and your best finds will appear here.'));
  list.forEach(item => frag.appendChild(createItemCard(item)));
  box.replaceChildren(frag);
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
  if (isSpinning || !currentCase || !$('spinner-strip')) return;
  const quantity = Math.max(1,Math.min(10,Math.floor(Number(count) || 1)));
  isSpinning = true; updateCoins();
  try {
    for (let run=0;run<quantity;run++) {
      if (cents(coins) < cents(currentCase.price)) { await siteAlert('Not enough virtual coins.'); break; }
      const winner = getRandomItem(currentCase.items);
      if (!winner) { await siteAlert('This case has no valid rewards.'); break; }
      coins = fromCents(cents(coins)-cents(currentCase.price)); updateCoins();
      await spinToItem(winner);
      showWinner(winner);
    }
  } finally { isSpinning = false; updateCoins(); }
}
function spinToItem(winningItem) {
  return new Promise(resolve => {
    const strip = $('spinner-strip'); const windowEl = $('spinner-container');
    const entries = 50; const winIndex = 36; const frag = document.createDocumentFragment();
    for (let i=0;i<entries;i++) {
      const item = i === winIndex ? winningItem : currentCase.items[Math.floor(Math.random()*currentCase.items.length)];
      const tile = createElement('div',`spinner-item ${qualityClass(item.rarity)}`);
      tile.appendChild(itemImage(item)); tile.title = item.name; frag.appendChild(tile);
    }
    strip.replaceChildren(frag); strip.style.transition = 'none'; strip.style.transform = 'translateX(0px)';
    const duration = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 25 : 3200;
    const winner = strip.children[winIndex];
    const center = windowEl.clientWidth/2;
    const targetCenter = winner.offsetLeft + winner.offsetWidth/2;
    const jitter = (Math.random()-.5) * winner.offsetWidth * .3;
    const offset = Math.round(center - targetCenter + jitter);
    requestAnimationFrame(() => requestAnimationFrame(() => {
      strip.style.transition = `transform ${duration}ms cubic-bezier(.11,.62,.14,1)`;
      strip.style.transform = `translateX(${offset}px)`;
    }));
    window.setTimeout(() => {
      winner.classList.add('winning');
      resolve();
    }, duration + 60);
  });
}
function showWinner(item) {
  const copy = normalizedItem(item); inventory.push(copy);
  recentDrops.push(normalizedItem(item)); if (recentDrops.length > 40) recentDrops = recentDrops.slice(-40);
  const box = $('winner-name'); box.className = `winner-active ${qualityClass(item.rarity)}`;
  box.textContent = `✦ ${item.name}  ·  ⛃ ${money(item.price)}`;
  refreshEconomy();
}

/* ---------- Coinflip ---------- */
function populateCoinflipDropdown() {
  const box = $('coinflip-select'); if (!box) return;
  const selected = box.value; box.replaceChildren();
  const available = inventory.filter(item => !isPureItem(item) && !item.favorite && !isItemLocked(item));
  if (!available.length) { const opt = createElement('option','','No unlocked items available'); opt.value = ''; box.appendChild(opt); box.disabled = true; $('coinflip-btn').disabled = true; return; }
  box.disabled = false;
  available.forEach(item => { const opt = createElement('option','',`${item.name} (⛃ ${money(item.price)})`); opt.value = item.uid; box.appendChild(opt); });
  if (available.some(item => item.uid === selected)) box.value = selected;
  $('coinflip-btn').disabled = isFlipping;
}
async function coinflipItem(uidOrIndex) {
  if (isFlipping) return;
  const item = typeof uidOrIndex === 'number' ? inventory[uidOrIndex] : inventory.find(entry => entry.uid === uidOrIndex);
  if (!item || item.favorite || isPureItem(item) || isItemLocked(item)) return siteAlert('This item is not available for coinflip.');
  isFlipping = true; activeCoinflipUid = item.uid; $('coinflip-btn').disabled = true;
  const win = Math.random() < .5;
  const coin = $('coin'); coin.classList.remove('flipping'); coin.style.transition = 'none'; coin.style.transform = 'rotateY(0deg)';
  void coin.offsetHeight;
  const duration = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 25 : 2400;
  coin.classList.add('flipping'); coin.style.transitionDuration = `${duration}ms`;
  coin.style.transform = `rotateY(${win ? 1800 : 1980}deg)`;
  await new Promise(resolve => setTimeout(resolve,duration+50));
  // Item remains protected while the flip animates because the input is disabled,
  // but might be affected by other game actions, so re-find by stable ID.
  const index = inventory.findIndex(entry => entry.uid === item.uid);
  if (index < 0 || inventory[index].favorite) { isFlipping = false; activeCoinflipUid = null; refreshEconomy(); return siteAlert('Coinflip canceled because the selected item changed.'); }
  if (win) inventory.push(normalizedItem({ ...item, uid: undefined, favorite: false }));
  else inventory.splice(index,1);
  isFlipping = false; activeCoinflipUid = null; refreshEconomy();
  siteAlert(win ? `HEADS — YOU WON!\nAnother ${item.name} was added to your backpack.` : `TAILS — YOU LOST!\nYour ${item.name} was destroyed.`, 'COINFLIP RESULT');
}

/* ---------- Demo shop ---------- */
function setShopOpen(open) {
  const panel = $('admin-give-panel'); if (!panel) return;
  panel.hidden = !open;
  if (!open) adminMode = false;
  document.body.style.overflow = open ? 'hidden' : '';
}
async function adminGiveItem() {
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
    const row = createElement('div','admin-give-item'); row.appendChild(itemImage(item));
    const copy = createElement('div','admin-give-info'); copy.append(createElement('span','name',item.name),createElement('span','price',`⛃ ${money(item.price)}`)); row.appendChild(copy);
    const buy = createElement('button','','TRADE'); buy.type = 'button'; buy.disabled = cents(coins) < cents(item.price);
    buy.onclick = () => {
      if (cents(coins) < cents(item.price)) return siteAlert('Not enough virtual coins.');
      coins = fromCents(cents(coins)-cents(item.price)); inventory.push(normalizedItem(item)); refreshEconomy(); renderTradeShop();
    };
    row.appendChild(buy); frag.appendChild(row);
  }); box.replaceChildren(frag);
}

/* ---------- Upgrader ---------- */
const Upgrader = { selectedWagers: [], selectedTargets: [], upgrading: false, targetCatalog: [], cases: [] };
function getKey(item,index) { return `${item.name}|${item.price}|${item.image}|${index}`; }
function renderWager() {
  const box = $('wager-list'); if (!box) return;
  Upgrader.selectedWagers = Upgrader.selectedWagers.filter(entry => inventory.some(item => item.uid === entry.uid && !item.favorite && !isPureItem(item)));
  const frag = document.createDocumentFragment(); const eligible = inventory.filter(item => !isPureItem(item) && !item.favorite);
  if (!eligible.length) frag.appendChild(createElement('div','empty-small','No unlocked wager items.'));
  eligible.forEach(item => {
    const selected = Upgrader.selectedWagers.some(entry => entry.uid === item.uid);
    const row = createElement('button',`upgrade-item ${selected ? 'selected' : ''}`); row.type = 'button'; row.disabled = Upgrader.upgrading;
    row.appendChild(itemImage(item)); row.append(createElement('span','upgrade-item-name',item.name),createElement('span','upgrade-item-price',`⛃${money(item.price)}`));
    row.setAttribute('aria-pressed',String(selected));
    row.onclick = () => {
      if (selected) Upgrader.selectedWagers = Upgrader.selectedWagers.filter(entry => entry.uid !== item.uid);
      else Upgrader.selectedWagers.push({uid:item.uid});
      renderWager(); updateUI();
    }; frag.appendChild(row);
  }); box.replaceChildren(frag); updateUI();
}
function renderTarget() {
  const box = $('target-list'); if (!box) return;
  Upgrader.cases = cases;
  Upgrader.targetCatalog = cases.flatMap(gameCase => gameCase.items.map((item,i) => ({ ...item, catalogId: `${gameCase.id}:${i}` })));
  const targets = Upgrader.targetCatalog;
  const frag = document.createDocumentFragment();
  if (!targets.length) frag.appendChild(createElement('div','empty-small','Loading rewards...'));
  targets.forEach(item => {
    const selected = Upgrader.selectedTargets.some(entry => entry.catalogId === item.catalogId);
    const row = createElement('button',`upgrade-item ${selected ? 'selected' : ''}`); row.type = 'button'; row.disabled = Upgrader.upgrading;
    row.appendChild(itemImage(item)); row.append(createElement('span','upgrade-item-name',item.name),createElement('span','upgrade-item-price',`⛃${money(item.price)}`));
    row.setAttribute('aria-pressed',String(selected));
    row.onclick = () => {
      if (selected) Upgrader.selectedTargets = Upgrader.selectedTargets.filter(entry => entry.catalogId !== item.catalogId);
      else Upgrader.selectedTargets.push({ catalogId:item.catalogId });
      renderTarget(); updateUI();
    }; frag.appendChild(row);
  }); box.replaceChildren(frag); updateUI();
}
function getUpgradeWagerItems() { return Upgrader.selectedWagers.map(entry => inventory.find(item => item.uid === entry.uid)).filter(Boolean); }
function getUpgradeTargetItems() { return Upgrader.selectedTargets.map(entry => Upgrader.targetCatalog.find(item => item.catalogId === entry.catalogId)).filter(Boolean); }
function upgradeOdds() {
  const wagerCents = getUpgradeWagerItems().reduce((n,item) => n + cents(item.price),0);
  const targetCents = getUpgradeTargetItems().reduce((n,item) => n + cents(item.price),0);
  return { wager: fromCents(wagerCents), target: fromCents(targetCents), chance: targetCents > 0 && wagerCents > 0 ? Math.min(100,(wagerCents*.95/targetCents)*100) : 0 };
}
function updateUI() {
  const { wager,target,chance } = upgradeOdds();
  if ($('upgrade-chance')) $('upgrade-chance').textContent = `CHANCE: ${chance.toFixed(2)}%`;
  if ($('upgrade-value')) $('upgrade-value').textContent = `${money(wager)} ⛃ → ${money(target)} ⛃`;
  updateUpgradeCircle(chance);
  if ($('upgrade-btn')) $('upgrade-btn').disabled = Upgrader.upgrading || !Upgrader.selectedWagers.length || !Upgrader.selectedTargets.length || target <= 0 || wager <= 0;
}
function updateUpgradeCircle(chance) {
  const circle = $('upgrade-circle'); if (!circle || Upgrader.upgrading) return;
  circle.classList.remove('win','lose'); circle.style.setProperty('--chance',`${Math.min(100,Math.max(0,chance))}%`);
  $('upgrade-circle-text').textContent = `${chance.toFixed(1)}%`;
  if ($('chance-fill')) $('chance-fill').style.width = `${chance}%`;
}
async function attemptUpgrade() {
  if (Upgrader.upgrading) return;
  const { chance,target,wager } = upgradeOdds();
  if (!target || !wager || !Upgrader.selectedWagers.length || !Upgrader.selectedTargets.length) return;
  const sources = getUpgradeWagerItems(); const rewards = getUpgradeTargetItems();
  if (sources.length !== Upgrader.selectedWagers.length || sources.some(item => item.favorite || isPureItem(item))) return siteAlert('Wager has changed. Refresh your selections.');
  Upgrader.upgrading = true; updateUI(); renderWager(); renderTarget();
  const ids = new Set(sources.map(item => item.uid));
  const roll = Math.random()*100; const win = roll < chance;
  const circle = $('upgrade-circle'); circle.classList.remove('win','lose');
  $('upgrade-circle-text').textContent = '...';
  await new Promise(resolve => setTimeout(resolve, window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 75 : 1800));
  // Take selected wager only after confirming the item still exists.
  const live = inventory.filter(item => ids.has(item.uid));
  if (live.length !== ids.size || live.some(item => item.favorite)) {
    Upgrader.upgrading = false; Upgrader.selectedWagers = []; updateUI(); renderWager(); return siteAlert('Upgrade canceled because the wager changed.');
  }
  inventory = inventory.filter(item => !ids.has(item.uid));
  if (win) rewards.forEach(item => inventory.push(normalizedItem(item)));
  Upgrader.selectedWagers = []; Upgrader.selectedTargets = []; Upgrader.upgrading = false;
  refreshEconomy(); renderTarget(); updateUI();
  circle.classList.toggle(win ? 'win':'lose',true);
  $('upgrade-circle-text').textContent = win ? 'WIN!' : 'LOSE';
  siteAlert(win ? `UPGRADE SUCCESS!\nYou won ${rewards.map(item => item.name).join(' + ')}.` : `UPGRADE FAILED.\nYou lost ⛃ ${money(wager)} in wagered items.`, 'UPGRADER RESULT');
}

/* ---------- Save backups (does not touch your original case data) ---------- */
function exportSave() {
  const backup = {
    format: 'tf2grand-save', version: 2, exportedAt: new Date().toISOString(),
    coins, inventory, recentDrops, pures
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
    if (Champion?.battleRunning || Upgrader.upgrading || isFlipping || isSpinning) return siteAlert('Finish any running game before restoring a save.');
    inventory = data.inventory.map(normalizedItem).filter(Boolean);
    const known = new Set(); inventory.forEach(item => { if (known.has(item.uid)) item.uid=makeItemId(); known.add(item.uid); });
    recentDrops = (Array.isArray(data.recentDrops) ? data.recentDrops : []).slice(-40).map(normalizedItem).filter(Boolean);
    coins = fromCents(cents(data.coins));
    pures = Object.fromEntries(PURE_ORDER.map(id => [id,Math.max(0,Math.min(100000000,Math.floor(Number(data.pures[id])||0)))]));
    Upgrader.selectedWagers=[]; Upgrader.selectedTargets=[];
    savePures(); renderPureBalances(); refreshEconomy(); renderTarget(); updateUI();
    siteAlert('Backup restored successfully.');
  } catch (error) { console.error('Restore failed:',error); siteAlert(`Could not restore save: ${error.message}`); }
}

/* ---------- App initialization ---------- */
document.addEventListener('DOMContentLoaded', () => {
  setupPopupSystem();
  if (typeof recoverChampionEscrow === 'function') recoverChampionEscrow();
  updateCoins(); updateBackpackValue(); renderInventory(); renderTopDrops(); renderPureBalances(); populateCoinflipDropdown();
  loadCases();

  $('export-save-btn').onclick = exportSave;
  $('import-save-btn').onclick = () => $('import-save-input').click();
  $('import-save-input').addEventListener('change',e => { const file=e.target.files?.[0]; e.target.value=''; if (file) importSave(file); });
  $('toggle-inv-btn').onclick = () => siteAlert('This is a free-play simulation, not a real-money gambling site.\n\nCASE ODDS: Every case item has a weight. Its exact probability is weight ÷ sum of all item weights. You can see these odds under Potential Drops.\n\nCOINFLIP: 50% per flip.\nUPGRADER: min(100%, wager value × 0.95 ÷ target value × 100).\nCHAMPION: Random alternating attacks and custom bot wagers.\n\nRANDOMNESS: Results use your browser\'s Math.random(). There is no cryptographic commitment, third-party audit, or independently verifiable seed. The project is therefore NOT provably fair.', 'ODDS & FAIRNESS');
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
  $('coinflip-btn').onclick = () => coinflipItem($('coinflip-select').value);
  $('load-wager-btn').onclick = renderWager;
  $('load-target-btn').onclick = renderTarget;
  $('upgrade-btn').onclick = attemptUpgrade;
  $('admin-give-close').onclick = () => setShopOpen(false);
  $('admin-give-panel').addEventListener('click',event => { if (event.target === $('admin-give-panel')) setShopOpen(false); });
  $('trade-search').addEventListener('input',renderTradeShop);
  $('pure-convert-close').onclick = () => { $('pure-convert-modal').hidden = true; };
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
  // Preserve past saves with unique instance IDs so selecting duplicate items is safe.
  saveInventory();
});
