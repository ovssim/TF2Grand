'use strict';
(()=>{
const $=id=>document.getElementById(id);
const games=[['coinflip','◉','Coinflip','#D9AD58'],['upgrader','↗','Upgrader','#D75D65'],['blackjack','♠','Blackjack','#4DA77C'],['casebattle','▣','Case Battles','#9875D5'],['champion','⚔','Champion','#D98547'],['roulette','♛','Roulette','#BB4657'],['jackpot','✦','Jackpot','#DAB968'],['mines','◆','Mines','#4DA9A8'],['tower','▥','Tower','#648FD7'],['mvm','⚙','Mann vs. Machine','#8796A6']];
const root=document.documentElement;
const main=$('top'); if(!main)return;
const profile=document.createElement('section');profile.id='grand-profile';profile.className='feature-section grand-profile';profile.innerHTML='<div class="section-heading"><div><div class="eyebrow">WORMYARD / YOUR ACCOUNT</div><h2>YOUR INVENTORY & REWARDS</h2><p>Backpack, Pure storage and level rewards in one place.</p></div></div><div class="grand-profile-tabs" role="tablist" aria-label="Inventory and rewards"><button type="button" data-profile="inventory-section" role="tab">Backpack</button><button type="button" data-profile="pure-currency-section" role="tab">Pure</button><button type="button" data-profile="rewards-section" role="tab">Rewards</button></div><div class="grand-profile-content"></div>';
const profileContent=profile.querySelector('.grand-profile-content');const sections=['inventory-section','pure-currency-section','rewards-section'].map($).filter(Boolean);sections[0]?.before(profile);sections.forEach(s=>profileContent.append(s));
let activeProfile='inventory-section';function showProfile(id){activeProfile=id;sections.forEach(s=>{s.classList.toggle('grand-profile-hidden',s.id!==id);});profile.querySelectorAll('[data-profile]').forEach(b=>{let yes=b.dataset.profile===id;b.classList.toggle('active',yes);b.setAttribute('aria-selected',String(yes));});}
profile.querySelectorAll('[data-profile]').forEach(b=>b.onclick=()=>{showProfile(b.dataset.profile);location.hash='grand-profile';});showProfile(activeProfile);
const nav=document.createElement('aside');nav.className='grand-sidebar';nav.setAttribute('aria-label','Site navigation');
const links=[['top','⌂','Home'],['case-section','▣','Cases'],['grand-profile','▦','Inventory & Rewards'],...games.map(([id,icon,name,color])=>[id+'-section',icon,name,color]),['drops-section','◷','Latest wins']];
for(const [id,icon,name,color] of links){const a=document.createElement('a');a.href='#'+id;a.dataset.page=id;if(color){a.classList.add('grand-game-link');a.style.setProperty('--link-accent',color);}const i=document.createElement('span');i.textContent=icon;a.append(i,document.createTextNode(name));nav.append(a);}document.body.insertBefore(nav,document.querySelector('main'));
const home=document.createElement('section');home.className='grand-home';home.innerHTML='<div class="home-header"><div><span>WORMYARD / FREE PLAY</span><h2>Choose your game</h2></div><div class="grand-home-settings"><label for="grand-font">Font</label><select id="grand-font" aria-label="Site font"><option value="inter">Modern</option><option value="condensed">Condensed</option><option value="industrial">Industrial</option><option value="classic">Classic</option></select><button type="button" id="perf-toggle">Performance: Off</button></div></div><div class="home-tiles"></div>';document.querySelector('.intro-grid')?.after(home);
for(const [id,icon,name,color] of games){const a=document.createElement('a');a.href='#'+id+'-section';a.style.setProperty('--tile',color);const art=document.createElement('span');art.className='tile-art';art.textContent=icon;const label=document.createElement('strong');label.textContent=name;a.append(art,label);home.querySelector('.home-tiles').append(a);}
const font=$('grand-font');const fonts=['inter','condensed','industrial','classic'];function applyFont(v){const value=fonts.includes(v)?v:'inter';root.dataset.grandFont=value;font.value=value;localStorage.setItem('grand-font-choice',value);}font.onchange=()=>applyFont(font.value);applyFont(localStorage.getItem('grand-font-choice')||'inter');
let perf=localStorage.getItem('grand-performance')==='on';const perfBtn=$('perf-toggle');function applyPerf(){root.classList.toggle('grand-performance',perf);perfBtn.textContent='Performance: '+(perf?'On':'Off');perfBtn.setAttribute('aria-pressed',String(perf));}perfBtn.onclick=()=>{perf=!perf;localStorage.setItem('grand-performance',perf?'on':'off');applyPerf();};applyPerf();
// A single, very slowly translating background layer. The motif is an original simple TF-style circular cross outline.
const backdrop=document.createElement('div');backdrop.className='grand-tf-pattern';backdrop.setAttribute('aria-hidden','true');document.body.prepend(backdrop);
const gameSection=$('games-section');const topSections=[...main.querySelectorAll(':scope > .feature-section')];
function route(){if(typeof CaseBattle!=='undefined'&&CaseBattle.running&&location.hash!=='#casebattle-section'){location.hash='casebattle-section';return;}let id=decodeURIComponent(location.hash.slice(1))||'top';if(['inventory-section','pure-currency-section','rewards-section'].includes(id)){showProfile(id);id='grand-profile';}if(id==='games-section')id='coinflip-section';const game=games.find(g=>g[0]+'-section'===id);if(!game&&id!=='top'&&!topSections.some(s=>s.id===id)&&id!=='grand-profile')id='top';for(const section of topSections)section.classList.toggle('grand-page-off',section.id!==(game?'games-section':id));profile.classList.toggle('grand-page-off',id!=='grand-profile');for(const el of [home,document.querySelector('.intro-grid'),document.querySelector('.notice-bar')])el?.classList.toggle('grand-page-off',id!=='top');for(const a of nav.querySelectorAll('a'))a.classList.toggle('current',a.dataset.page===id);if(game){const tab=document.querySelector('[data-game-tab="'+game[0]+'"]');if(tab&&(!tab.classList.contains('active')||game[0]==='jackpot'))tab.click();if(game[0]==='upgrader'&&typeof renderTarget==='function')requestAnimationFrame(()=>renderTarget());}window.scrollTo(0,0);renderModeWins();}
// Personal best wins are derived from the existing saved win history, not generated or duplicated.
const winPanels=new Map();games.forEach(([id])=>{const section=$(id+'-section');if(!section)return;const box=document.createElement('section');box.className='grand-mode-wins';box.innerHTML='<div class="grand-mode-wins-head"><h4>TOP WINS</h4><span>YOUR BEST RESULTS</span></div><div class="grand-mode-wins-list"></div>';section.append(box);winPanels.set(id,box.querySelector('.grand-mode-wins-list'));});
function normalizeMode(v){return String(v||'').toLowerCase().replace(/[^a-z]/g,'');}
function renderModeWins(){if(typeof recentWins==='undefined')return;for(const [id,panel] of winPanels){const matching=recentWins.filter(w=>{const m=normalizeMode(w.mode);return m===id||(id==='casebattle'&&m==='casebattles')||(id==='mvm'&&m.includes('mannvsmachine'));}).sort((a,b)=>Number(b.value)-Number(a.value)).slice(0,5);const frag=document.createDocumentFragment();if(!matching.length){const p=document.createElement('p');p.className='grand-wins-empty';p.textContent='No recorded wins yet. Your top five will appear here.';frag.append(p);}for(const w of matching){const line=document.createElement('div');line.className='grand-win-line';const item=document.createElement('span');item.textContent=(w.items||[]).slice(0,1).map(x=>x.name).join('')||(Number(w.coins)>0?'Coin prize':'Game win');const amount=document.createElement('strong');amount.textContent='⛃ '+Number(w.value||0).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2});line.append(item,amount);frag.append(line);}panel.replaceChildren(frag);}}
// Wallet values are rendered by the existing updateCoins() function.
// Do not observe and rewrite #coins: it causes a MutationObserver / animation
// feedback loop that can freeze Safari on mobile devices.
// Existing history can change after a game. Refresh only on the active game view.
setInterval(()=>{if(games.some(g=>location.hash==='#'+g[0]+'-section'))renderModeWins();},3500);
window.addEventListener('hashchange',route);document.addEventListener('DOMContentLoaded',route);route();
})();

// Case-page backpack: interactive view of the SAME saved inventory.
// Reuse the core item-card factory so favorites, scrap and convert use the
// original handlers and safety checks. Do not clone DOM nodes: cloning loses
// event listeners and used to redirect every click to the main backpack.
(()=>{
  const casePage=document.getElementById('case-section');
  const mainInventory=document.getElementById('inventory');
  if(!casePage||!mainInventory)return;
  const section=document.createElement('section');
  section.className='grand-case-backpack';
  section.setAttribute('aria-label','Backpack beneath cases');
  section.innerHTML='<div class="grand-case-backpack-heading"><div><span class="eyebrow">YOUR INVENTORY</span><h3>BACKPACK</h3><p>Manage your items directly from the Cases page.</p></div></div><div class="grand-case-backpack-grid" id="grand-case-backpack-grid" aria-live="polite"></div><p class="grand-case-backpack-footnote">Favorites are protected from scrapping and conversion. Changes also appear in your main backpack.</p>';
  casePage.append(section);
  const preview=section.querySelector('#grand-case-backpack-grid');
  let queued=false;
  function refresh(){
    queued=false;
    // `inventory` and `createItemCard` are supplied by the core script.js.
    if(typeof inventory==='undefined'||typeof createItemCard!=='function')return;
    const frag=document.createDocumentFragment();
    const items=[...inventory].sort((a,b)=>Number(b.price||0)-Number(a.price||0));
    if(!items.length){
      const empty=document.createElement('p');
      empty.className='empty-small';
      empty.textContent='Your backpack is empty. Open cases to collect items.';
      frag.append(empty);
    }
    for(const item of items){
      frag.append(createItemCard(item,{inventoryId:item.uid,showActions:true}));
    }
    preview.replaceChildren(frag);
  }
  function schedule(){
    if(queued)return;
    queued=true;
    requestAnimationFrame(refresh);
  }
  // Core inventory updates rebuild the main inventory. Observe only that
  // container, never the preview, to avoid a self-triggering observer loop.
  new MutationObserver(schedule).observe(mainInventory,{childList:true});
  schedule();
})();
