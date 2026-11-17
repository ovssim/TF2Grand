(()=>{
'use strict';
// Edit bot personalities HERE on GitHub. No chat messages are added.
// Valid values: balanced, cautious, aggressive, high-roller, unpredictable.
const PERSONALITIES=Object.freeze({
  'FishBot': 'balanced',
  'Terry the Lobster': 'high-roller',
  'Its Shrimple': 'aggressive',
  'Frostbyte': 'cautious',
  'MentalHerbs': 'balanced',
  'Estrella': 'aggressive',
  'Барсик': 'cautious',
  'Milk Bag': 'high-roller',
  '24/7 Painted Hats': 'balanced',
  'Sovi': 'aggressive',
  'Mahoraga': 'unpredictable',
  'Great White': 'high-roller',
  'Anchovi Ace': 'aggressive',
  'bean': 'balanced',
  'Big Man Fred': 'cautious',
  'doomzics': 'aggressive',
  'mufat': 'high-roller',
  'ShrimpStacked': 'high-roller',
  'Crab Rangoon': 'unpredictable',
  'Turkey': 'unpredictable',
  'Foster': 'cautious',
  'King': 'high-roller',
  'dastard(ly)': 'aggressive',
  'Winston': 'aggressive',
  'Pootis': 'unpredictable',
  'Mack': 'aggressive',
  'Mackenzie': 'cautious',
  'William': 'balanced',
  'Nicole': 'balanced',
  'простак': 'cautious',
  'Tide Turner': 'aggressive',
  'grug': 'unpredictable',
  'Irislayla': 'balanced',
 });
const RULES=Object.freeze({
 'balanced':{label:'Balanced',min:1,max:1,topUp:.16,topMin:.25,topMax:.65},
 'cautious':{label:'Cautious',min:.5,max:.85,topUp:.06,topMin:.12,topMax:.32},
 'aggressive':{label:'Aggressive',min:1.25,max:1.8,topUp:.30,topMin:.3,topMax:.8},
 'high-roller':{label:'High Roller',min:1.6,max:2.6,topUp:.34,topMin:.35,topMax:.95},
 'unpredictable':{label:'Unpredictable',min:.4,max:2.5,topUp:.21,topMin:.15,topMax:.9}
});
function type(name){return Object.hasOwn(PERSONALITIES,name)?PERSONALITIES[name]:'balanced';}
function rules(name){return RULES[type(name)]||RULES.balanced;}
function initialRange(name,baseMin,baseMax){const p=rules(name),mult=p.min+Math.random()*(p.max-p.min);const min=Math.max(100,Math.min(20000,Math.round(baseMin*mult)));const max=Math.max(min,Math.min(20000,Math.round(baseMax*mult)));return [min,max];}
function topUp(name){const p=rules(name);return {chance:p.topUp,min:p.topMin,max:p.topMax};}
window.TF2BotPersonalities=Object.freeze({type,rules,initialRange,topUp});
// Add personality labels to bot cards only when the Bots panel is opened/updated.
const panel=document.getElementById('grand-bots');
const list=document.getElementById('grand-bots-list');
if(panel&&list){
 const decorate=()=>{for(const card of list.querySelectorAll('.grand-bot-card')){
   if(card.querySelector('.grand-bot-personality'))continue;
   const nameText=card.querySelector('.grand-bot-name strong')?.textContent||'';
   const names=Object.keys(PERSONALITIES);const name=names.find(n=>nameText.endsWith(n));
   if(!name)continue;
   const p=document.createElement('p');p.className='grand-bot-personality';p.textContent='Personality: '+rules(name).label;
   const description=card.querySelector('.grand-bot-description');if(description)card.insertBefore(p,description);else card.append(p);
 }};
 const observer=new MutationObserver(decorate);observer.observe(list,{childList:true});decorate();
}
})();
