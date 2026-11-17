(()=>{
'use strict';
const KEY='tf2grand_player_profile_v1';
const $=id=>document.getElementById(id);
let profile={username:'You',showcase:[]};
try{const saved=JSON.parse(localStorage.getItem(KEY)||'{}');if(typeof saved.username==='string')profile.username=saved.username.slice(0,24)||'You';if(Array.isArray(saved.showcase))profile.showcase=saved.showcase.slice(0,6).map(String);}catch{}
function save(){try{localStorage.setItem(KEY,JSON.stringify(profile));}catch{}}
function name(){return profile.username||'You';}
function allItems(){try{return typeof inventory!=='undefined'&&Array.isArray(inventory)?inventory:[];}catch{return [];}}
function uid(item){return String(item.uid??item.id??'');}
function botFor(n){try{return typeof AQUATIC_BOTS!=='undefined'?AQUATIC_BOTS.find(x=>x.name===n):null;}catch{return null;}}
function botEmoji(n){return botFor(n)?.emoji||'🐟';}
const parent=$('grand-profile');if(!parent)return;
const card=document.createElement('section');card.className='grand-user-profile';card.innerHTML=`<h3>★ PLAYER PROFILE</h3><p>Choose your name and showcase up to six items from your backpack. Saved in this browser.</p><form class="grand-user-form" id="grand-user-form"><label>USERNAME <input id="grand-user-name" maxlength="24" autocomplete="off" placeholder="Choose a username"/></label><button type="submit">SAVE USERNAME</button></form><h3 style="margin-top:22px">ITEM SHOWCASE</h3><div class="grand-user-showcase" id="grand-user-showcase"></div><div class="grand-showcase-controls"><select id="grand-showcase-add" aria-label="Choose showcase item"></select><button type="button" id="grand-showcase-add-btn">ADD ITEM</button></div><p class="grand-profile-note" id="grand-profile-message">Showcased items remain in your normal backpack. Sold or lost items are automatically removed from the display.</p>`;
parent.querySelector('.grand-profile-content')?.prepend(card);
$('grand-user-name').value=name()==='You'?'':name();
$('grand-user-form').addEventListener('submit',e=>{e.preventDefault();const v=$('grand-user-name').value.trim().replace(/\s+/g,' ');if(!v){$('grand-profile-message').textContent='Enter a username first.';return;}profile.username=v.slice(0,24);save();updateLabels();$('grand-profile-message').textContent='Username saved.';});
function renderShowcase(){const items=allItems();const byUid=new Map(items.map(i=>[uid(i),i]));const filtered=profile.showcase.filter(id=>byUid.has(id));if(filtered.length!==profile.showcase.length){profile.showcase=filtered;save();}
const wrap=$('grand-user-showcase');wrap.replaceChildren();if(!filtered.length){const p=document.createElement('p');p.textContent='No showcased items yet. Pick one from your backpack below.';wrap.append(p);}
for(const id of filtered){const item=byUid.get(id);const tile=document.createElement('div');tile.className='grand-showcase-card';const img=document.createElement('img');img.loading='eager';img.alt=item.name||'Item';img.src=item.image||item.img||'';img.onerror=()=>{img.style.display='none';};const title=document.createElement('strong');title.textContent=item.name||'Unnamed item';const remove=document.createElement('button');remove.type='button';remove.textContent='Remove';remove.onclick=()=>{profile.showcase=profile.showcase.filter(x=>x!==id);save();renderShowcase();};tile.append(img,title,remove);wrap.append(tile);}
const select=$('grand-showcase-add');const old=select.value;select.replaceChildren();for(const item of items){const id=uid(item);if(!id||filtered.includes(id))continue;const option=document.createElement('option');option.value=id;option.textContent=(item.name||'Item')+' · ⛃ '+Number(item.price||0).toFixed(2);select.append(option);}if([...select.options].some(o=>o.value===old))select.value=old;
$('grand-showcase-add-btn').disabled=filtered.length>=6||!select.options.length;
}
$('grand-showcase-add-btn').onclick=()=>{const id=$('grand-showcase-add').value;if(!id||profile.showcase.includes(id)||profile.showcase.length>=6)return;profile.showcase.push(id);save();renderShowcase();};
// Update only player identity labels, not game result text or wager logic.
const playerSelectors=['.coinflip-duelist-name.player','.player-combatant .coinflip-duelist-name','.bj-person-tag strong','.arena-player .arena-hp-core small','#cb-participants'];
function updateLabels(){for(const selector of playerSelectors){for(const el of document.querySelectorAll(selector)){if(el.id==='cb-participants'){el.textContent=el.textContent.replace(/^YOU\b/i,name().toUpperCase());continue;}if(el.classList.contains('coinflip-duelist-name')){for(const node of el.childNodes)if(node.nodeType===3&&node.textContent.trim()){node.textContent=name().toUpperCase()+' ';break;}}else el.textContent=name().toUpperCase();}}
const rivals=[['coinflip-rival-name','.bot-combatant .coinflip-ring span'],['champion-arena-bot-name','.arena-bot .arena-hp-core'],['bj-dealer-name',null]];
for(const [id,avatarSelector] of rivals){const el=$(id);if(!el)continue;const n=el.textContent.trim();const emoji=botEmoji(n);if(avatarSelector){const avatar=document.querySelector(avatarSelector);if(avatar){if(id==='champion-arena-bot-name'){const small=avatar.querySelector('small');avatar.firstChild.textContent=emoji;if(small)small.textContent=n.toUpperCase();}else avatar.textContent=emoji;}}}
try{if(typeof Champion!=='undefined'&&Champion.botName){const n=Champion.botName;const emoji=botEmoji(n);document.querySelectorAll('.champion-avatar.bot-avatar').forEach(el=>el.textContent=emoji);const heading=$('champion-bot-preview')?.querySelector('h4');if(heading)heading.textContent=emoji+' '+n.toUpperCase()+"'S WAGER";}}catch{}
}
// Observe only opponent-name nodes. No observer on the entire game UI or item images.
function watchOpponent(id){const el=$(id);if(!el)return;const obs=new MutationObserver(()=>updateLabels());obs.observe(el,{childList:true,characterData:true,subtree:true});}
watchOpponent('coinflip-rival-name');watchOpponent('champion-arena-bot-name');watchOpponent('bj-dealer-name');
let lastInventory='';setInterval(()=>{const signature=allItems().map(i=>uid(i)).join('|');if(signature!==lastInventory){lastInventory=signature;renderShowcase();}updateLabels();},1500);
// Give the unified account a visible profile navigation link.
const nav=document.querySelector('.grand-sidebar');if(nav){const a=document.createElement('a');a.href='#grand-profile';a.className='grand-profile-nav';a.innerHTML='<span>★</span> Player Profile';nav.insertBefore(a,nav.querySelector('a:nth-child(4)'));}
renderShowcase();updateLabels();
})();