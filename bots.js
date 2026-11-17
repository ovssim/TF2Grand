(()=>{
'use strict';
const KEY='tf2grand_bot_ledger_v1';
// EDIT BOT DESCRIPTIONS HERE IN GITHUB. Changes are visible to all visitors.
// Keep bot names exactly as they appear in AQUATIC_BOTS.
const BOT_DESCRIPTIONS = Object.freeze({
  'FishBot': 'The original fish in the casino. The first Bot, the best bot.',
  'Terry the Lobster': 'Has a taste for gambling, also tastes good. needs some salt though.',
  'Its Shrimple': 'Lets keep things shrimple. I. TOOK. YOUR. CASH.',
  'Frostbyte': "No, I'm not a money hungry goblin, just bored.",
  'MentalHerbs': 'Wow, checking up on me? What an honor.',
  'Estrella': "'Um, how about something like, I am just lucky?..'",
  'Барсик': 'Ваш любимый бот — к выполнению задачи готов!',
  'Milk Bags': 'Pretty big win? I love BIG things.',
  '24/7 Painted Hats': 'Selling painted hats! Send me an offer!',
  'Sovi': "I'M NOT GAY!!",
  'FreakyBot': 'This bot has been temporarily muted. Reason: Inappropriate subjects and topics discussed with a certain group of people here.', 
  'Jellyfish Jumper': 'Muggin n winnin',
  'zenith': 'Sovi is gay. I can confirm from experience.',
  'Mahoraga': 'M: With this treasure I summon...',
  'Great White': 'Taking Great Bites from your Balance since the start!',
  'Anchovi Ace': 'I flopping owned this place pretty boy!',
  'bean': "Nice one, I'm down for another game anytime.",
  'Big Man Fred': 'hehe, big man, he he...',
  'doomzics': 'Damn bro, that was ALL skill. Better luck next time 😂!',
  'mufat': 'I absolutely wasted you! I mean, look at you! HA HA!',
  'ShrimpStacked': "My stacks are taller than you, any excuses? I'm the best!",
  'Crab Rangoon': "Crabby bets, crappy bets. It's all talk.",
  'Turkey': 'Yeni bir arabayla Yemen`e sürdüm; şimdi bu lanet şeyi havaya uçuracağım.',
  'Foster': 'Have a nice stay. Down to slide a couple to a struggler?',
  'King': 'Backpack.tf account status: Banned. Reason: Suspected Scammer alt/fence',
  'dastard(ly)': "Hit big once and I'll hit big again.",
  'Winston': 'Thats right, its in the name. I WIN!',
  'Pootis': 'Poot! Poot!',
  'Mack': "I hate Mackenzie. She's such a bitch.",
  'Mackenzie': 'Who the hell names their kid Mack?..',
  'William': "Did I steal your money? Ahh sorry mate, You'll win it back next time.",
  'Nicole': 'I mean, its mine now.',
  'простак': 'Ты никудышный игрок',
  'Tide Turner': 'FRAYYYDOMMMM! HAA HAA!! Oh blimey, go and cry some more to your motha!',
  'grug': 'ryhmes with grug.',
  'Irislayla': 'The person reading this is very sexy. (ofc)'
  

  
  // 'Great White': 'Add your own description here',
});
const $=id=>document.getElementById(id);
const roster=()=>{try{return typeof AQUATIC_BOTS!=='undefined'?AQUATIC_BOTS:[]}catch{return []}};
const read=(key)=>{try{return JSON.parse(localStorage.getItem(key)||'{}')}catch{return {}}};
let saved=read(KEY), ledger=Object.create(null);
const randomWorth=()=>Math.round((10000+Math.random()*40000)*100)/100;
const now=Date.now();
for(const bot of roster()){
 let v=saved[bot.name];
 if(!v||!Number.isFinite(v.worth))v={worth:randomWorth(),pending:0};
 if(v.worth<100&&(!v.pending||v.pending<=now))v={worth:randomWorth(),pending:0};
 ledger[bot.name]={worth:Math.max(0,v.worth),pending:Number(v.pending)||0};
}
let pendingSave=false;
function save(){if(pendingSave)return;pendingSave=true;queueMicrotask(()=>{pendingSave=false;try{localStorage.setItem(KEY,JSON.stringify(ledger))}catch{};if(panel&&!panel.hidden)render();});}
function record(name,delta){if(!Object.prototype.hasOwnProperty.call(ledger,name)||!Number.isFinite(delta))return;const b=ledger[name];b.worth=Math.max(0,Math.round((b.worth+delta)*100)/100);if(b.worth<100&&!b.pending)b.pending=Date.now()+20000;save();schedule();}
function wager(name,amount){if(Number.isFinite(amount)&&amount>0)record(name,-amount);}
function payout(name,amount){if(Number.isFinite(amount)&&amount>0)record(name,amount);}
let timer=0;
function schedule(){if(timer)clearTimeout(timer);let soon=Infinity;for(const b of Object.values(ledger))if(b.pending)soon=Math.min(soon,b.pending);if(!Number.isFinite(soon))return;timer=setTimeout(()=>{timer=0;const t=Date.now();for(const b of Object.values(ledger))if(b.pending&&b.pending<=t){if(b.worth<100)b.worth=randomWorth();b.pending=0;}save();schedule();},Math.max(0,soon-Date.now()));}
schedule();
// Stable 90/10 status on each page load; not continuously randomized or polled.
const statuses=Object.create(null);for(const bot of roster())statuses[bot.name]=Math.random()<.9?'online':'away';
const panel=$('grand-bots'),list=$('grand-bots-list');
function render(){if(!list)return;const fragment=document.createDocumentFragment();for(const bot of roster()){
 const b=ledger[bot.name],entry=document.createElement('article');entry.className='grand-bot-card';
 const heading=document.createElement('div');heading.className='grand-bot-name';
 const dot=document.createElement('span');dot.className='grand-bot-dot '+statuses[bot.name];dot.title=statuses[bot.name]==='online'?'Active':'Away';
 const label=document.createElement('strong');label.textContent=bot.emoji+' '+bot.name;
 heading.append(dot,label);
 const value=document.createElement('p');value.textContent='Net worth: ⛃ '+b.worth.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})+(b.pending?' · Refill in '+Math.max(0,Math.ceil((b.pending-Date.now())/1000))+'s':'');
 const desc=document.createElement('p');desc.className='grand-bot-description';desc.textContent=BOT_DESCRIPTIONS[bot.name]||'No description yet.';
 entry.append(heading,value,desc);fragment.append(entry);
 }list.replaceChildren(fragment);}
const nav=document.querySelector('.grand-sidebar')||document.querySelector('.nav-links');
if(nav&&panel){const a=document.createElement('a');a.href='#grand-bots';a.className='grand-bots-link';a.textContent='◉ Bots';nav.append(a);a.addEventListener('click',e=>{e.preventDefault();panel.hidden=false;render();panel.scrollIntoView({behavior:'smooth',block:'start'});});$('grand-bots-close')?.addEventListener('click',()=>panel.hidden=true);}
window.TF2BotLedger=Object.freeze({wager,payout,record,worth:name=>ledger[name]?.worth??null});
})();
