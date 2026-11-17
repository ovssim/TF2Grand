'use strict';
(()=>{
const $=id=>document.getElementById(id);
const games=[['coinflip','◉','Coinflip','#D9AD58'],['upgrader','↗','Upgrader','#D75D65'],['blackjack','♠','Blackjack','#4DA77C'],['casebattle','▣','Case Battles','#9875D5'],['champion','⚔','Champion','#D98547'],['roulette','♛','Roulette','#BB4657'],['jackpot','✦','Jackpot','#DAB968'],['mines','◆','Mines','#4DA9A8'],['tower','▥','Tower','#648FD7'],['mvm','⚙','Mann vs. Machine','#8796A6']];
const root=document.documentElement;
const main=$('top'); if(!main)return;
const profile=document.createElement('section');profile.id='grand-profile';profile.className='feature-section grand-profile';profile.innerHTML='<div class="section-heading"><div><div class="eyebrow">WORMYARD / YOUR ACCOUNT</div><h2>YOUR INVENTORY & REWARDS</h2><p>Backpack, Pure storage and level rewards in one place.</p></div></div><div class="grand-profile-content"></div>';
const profileContent=profile.querySelector('.grand-profile-content');const sections=['inventory-section','pure-currency-section','rewards-section'].map($).filter(Boolean);sections[0]?.before(profile);sections.forEach(s=>profileContent.append(s));
// Unified account: all three original live sections remain mounted and visible.
function showProfile(){sections.forEach(section=>section.classList.remove('grand-profile-hidden'));}
showProfile();
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
// Wallet is rendered directly by the game's updateCoins(); never replace or interpolate its text.
const wallet=$('coins');if(wallet){let previous=null;const parse=()=>Number((wallet.textContent||'').replace(/[^\d.-]/g,''));const observer=new MutationObserver(()=>{const current=parse();if(!Number.isFinite(current))return;if(previous!==null&&current!==previous){wallet.classList.remove('grand-wallet-gain','grand-wallet-loss');void wallet.offsetWidth;wallet.classList.add(current>previous?'grand-wallet-gain':'grand-wallet-loss');}previous=current;});previous=parse();observer.observe(wallet,{childList:true,characterData:true,subtree:true});}
// Existing history can change after a game. Refresh only on the active game view.
setInterval(()=>{if(games.some(g=>location.hash==='#'+g[0]+'-section'))renderModeWins();},3500);
window.addEventListener('hashchange',route);document.addEventListener('DOMContentLoaded',route);route();
})();

// Case-page backpack: a second, lightweight view of the same inventory.
// The original interactive inventory stays in the combined Profile area.
(()=>{
  const casePage=document.getElementById('case-section');
  const inventory=document.getElementById('inventory');
  if(!casePage||!inventory)return;
  const section=document.createElement('section');
  section.className='grand-case-backpack';
  section.setAttribute('aria-label','Backpack beneath cases');
  section.innerHTML='<div class="grand-case-backpack-heading"><div><span class="eyebrow">YOUR INVENTORY</span><h3>BACKPACK</h3><p>Your recently displayed items, right below case opening.</p></div><button type="button" class="theme-btn" id="grand-case-backpack-open">OPEN FULL BACKPACK</button></div><div class="grand-case-backpack-grid" id="grand-case-backpack-grid" aria-live="polite"></div><p class="grand-case-backpack-footnote">Scrap, convert and favorite items directly here, or open the full backpack.</p>';
  casePage.append(section);
  const preview=section.querySelector('#grand-case-backpack-grid');
  const open=()=>{location.hash='grand-profile';};
  section.querySelector('#grand-case-backpack-open').addEventListener('click',open);
  let queued=false;
  const refresh=()=>{
    queued=false;
    const items=[...inventory.children].filter(el=>el.nodeType===1);
    const frag=document.createDocumentFragment();
    if(!items.length){const empty=document.createElement('p');empty.className='empty-small';empty.textContent='Your backpack is empty. Open cases to collect items.';frag.append(empty);}
    for(const item of items.slice(0,12)){
      const card=item.cloneNode(true);
      card.removeAttribute('id');
      card.querySelectorAll('[id]').forEach(el=>el.removeAttribute('id'));
      // Forward actions to the original live card so Scrap/Convert/Favorite work here.
      const originalButtons=[...item.querySelectorAll('button')];
      card.querySelectorAll('button').forEach((btn,index)=>{
        const source=originalButtons[index];
        btn.disabled=source?.disabled??true;
        btn.removeAttribute('onclick');
        btn.addEventListener('click',event=>{event.stopPropagation();if(source&&!source.disabled)source.click();});
      });
      frag.append(card);
    }
    preview.replaceChildren(frag);
  };
  const schedule=()=>{if(queued)return;queued=true;requestAnimationFrame(refresh);};
  new MutationObserver(schedule).observe(inventory,{childList:true});
  schedule();
})();
