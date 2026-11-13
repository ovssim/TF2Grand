/* ==============================================================
   TF2GRAND — CASE BATTLES
   Virtual-only, browser-local. Requires script.js and blackjack-rewards.js.
   Shared (regular): everyone gets an equal share of the total.
   Shared (teams): winning team splits total between its members.
   Normal (regular or teams): user's win pays the whole total pool.
   ============================================================= */
'use strict';
const CASEBATTLE_DRAFT_KEY = 'tf2grand_casebattle_draft_v1';
const CASEBATTLE_ESCROW_KEY = 'tf2grand_casebattle_escrow_v1';
const cbDraft = safeJSON(CASEBATTLE_DRAFT_KEY, {});
const CaseBattle = {
  queue: Array.isArray(cbDraft.queue) ? cbDraft.queue.filter(id => typeof id === 'string').slice(0, 600) : [],
  mode: ['regular','team2','team3'].includes(cbDraft.mode) ? cbDraft.mode : 'regular',
  bots: [1,2,3,4,5].includes(Number(cbDraft.bots)) ? Number(cbDraft.bots) : 1,
  shared: cbDraft.shared === true,
  cursed: cbDraft.cursed === true,
  fast: cbDraft.fast === true,
  running: false,
  participants: [],
  lineup: [],
  roundsPlayed: 0,
  entryCostCents: 0,
  poolCents: 0,
  payoutCents: 0,
  settled: false
};
function cbSaveDraft(){
  localStorage.setItem(CASEBATTLE_DRAFT_KEY,JSON.stringify({queue:CaseBattle.queue,mode:CaseBattle.mode,bots:CaseBattle.bots,shared:CaseBattle.shared,cursed:CaseBattle.cursed,fast:CaseBattle.fast}));
}
function cbMoney(c){return `⛃ ${money(fromCents(c))}`;}
function cbCaseById(id){return cases.find(entry => entry.id === id);}
function cbCostCents(){return CaseBattle.queue.reduce((sum,id)=>sum+cents(cbCaseById(id)?.price || 0),0);}
function cbBotCount(){return CaseBattle.mode==='regular' ? CaseBattle.bots : CaseBattle.mode==='team2' ? 3 : 5;}
function cbGroupSize(){return CaseBattle.mode==='team2' ? 2 : CaseBattle.mode==='team3' ? 3 : 1;}
function cbValidLineup(){return CaseBattle.queue.map(cbCaseById).filter(Boolean);}
function cbAtRisk(){return CaseBattle.running || isSpinning || isFlipping || Upgrader.upgrading || (typeof Champion!=='undefined'&&Champion.battleRunning) || (typeof Blackjack!=='undefined'&&Blackjack.running);}

function cbRecoverEscrow(){
  const receipt=safeJSON(CASEBATTLE_ESCROW_KEY,null);
  if(!receipt||typeof receipt!=='object'){localStorage.removeItem(CASEBATTLE_ESCROW_KEY);return;}
  const current=cents(coins);
  if(receipt.status==='pending' && Number.isSafeInteger(receipt.chargedCents) && Number.isSafeInteger(receipt.originalCents)){
    // Charging may have been interrupted before writing coins. Refund only when
    // the wallet actually shows the charged balance (prevents double refund).
    if(current===receipt.chargedCents){coins=fromCents(receipt.originalCents);updateCoins();}
  }else if(receipt.status==='settling' && Number.isSafeInteger(receipt.finalCents)){
    // If a settled game was interrupted after the receipt but before wallet
    // update, apply its recorded final balance once.
    if(current===receipt.chargedCents){coins=fromCents(receipt.finalCents);updateCoins();}
  }
  localStorage.removeItem(CASEBATTLE_ESCROW_KEY);
}

function cbAddCases(id, quantity){
  if(CaseBattle.running)return;
  const item=cbCaseById(id);
  if(!item)return;
  const n=Number(quantity);
  if(!Number.isSafeInteger(n)||n<1||n>100)return siteAlert('Enter a whole number from 1 to 100 cases per add. You can add the same case more than once.');
  // Avoid a runaway browser if extremely large batches are accidentally added.
  if(CaseBattle.queue.length+n>600)return siteAlert('A single browser-local case battle supports up to 600 rounds. Reduce your selection to continue.');
  for(let i=0;i<n;i++)CaseBattle.queue.push(id);
  cbSaveDraft();cbRenderQueue();
}
function cbRenderCatalog(){
  const box=$('cb-case-catalog');if(!box)return;
  const query=($('cb-case-search')?.value||'').trim().toLowerCase();
  const filtered=[...cases].filter(item=>item.name.toLowerCase().includes(query)).sort((a,b)=>a.price-b.price);
  const frag=document.createDocumentFragment();
  if(!filtered.length)frag.appendChild(createElement('div','empty-small',cases.length?'No cases found.':'Case catalog is loading...'));
  filtered.forEach(gameCase=>{
    const btn=createElement('button','cb-case-choice');btn.type='button';btn.disabled=CaseBattle.running;
    const image=itemImage(gameCase);image.className='cb-case-thumb';
    const info=createElement('span','cb-case-copy');info.append(createElement('strong','',gameCase.name),createElement('small','',`${money(gameCase.price)} ⛃ · ${gameCase.items.length} possible rewards`));
    const plus=createElement('span','cb-case-add','+ ADD');
    btn.append(image,info,plus);
    btn.onclick=()=>{
      const n=Number($('cb-add-qty')?.value || 1);
      cbAddCases(gameCase.id,n);
    };
    frag.appendChild(btn);
  });box.replaceChildren(frag);
}
function cbRenderQueue(){
  const box=$('cb-queue');if(!box)return;
  const frag=document.createDocumentFragment();
  if(!CaseBattle.queue.length)frag.appendChild(createElement('div','empty-small','No rounds selected. Add any case above.'));
  CaseBattle.queue.forEach((id,i)=>{
    const gameCase=cbCaseById(id);
    if(!gameCase)return;
    const row=createElement('div','cb-queue-row');
    row.append(createElement('span','cb-queue-number',String(i+1).padStart(2,'0')),itemImage(gameCase));
    const details=createElement('div','cb-queue-details');
    details.append(createElement('strong','',gameCase.name),createElement('small','',cbMoney(cents(gameCase.price))));
    row.appendChild(details);
    const actions=createElement('div','cb-queue-actions');
    const buttons=[
      ['↑','Move earlier',()=>cbMove(i,-1),i===0],
      ['↓','Move later',()=>cbMove(i,1),i===CaseBattle.queue.length-1],
      ['+','Duplicate this round',()=>cbAddAt(i,id),false],
      ['×','Remove this round',()=>cbRemove(i),false]
    ];
    buttons.forEach(([label,title,fn,disabled])=>{
      const b=createElement('button','cb-queue-button',label);b.type='button';b.title=title;b.setAttribute('aria-label',title);b.disabled=Boolean(disabled)||CaseBattle.running;b.onclick=fn;actions.appendChild(b);
    });row.appendChild(actions);frag.appendChild(row);
  });
  box.replaceChildren(frag);
  $('cb-cost').textContent=cbMoney(cbCostCents());
  $('cb-round-count').textContent=`${CaseBattle.queue.length} ROUND${CaseBattle.queue.length===1?'':'S'}`;
  const team=cbGroupSize(),botCount=cbBotCount();
  $('cb-participants').textContent=`YOU + ${botCount} BOT${botCount===1?'':'S'}`;
  $('cb-team-preview').textContent=team===1?'REGULAR · FREE-FOR-ALL':`${team} vs ${team} · TEAMS`;
  $('cb-start').disabled=CaseBattle.running||!CaseBattle.queue.length||cbCostCents()>cents(coins);
  $('cb-start').textContent=cbCostCents()>cents(coins)?'NOT ENOUGH COINS':'⚔ START CASE BATTLE';
  cbSaveDraft();
}
function cbRemove(index){if(CaseBattle.running)return;CaseBattle.queue.splice(index,1);cbRenderQueue();}
function cbAddAt(index,id){if(CaseBattle.running)return;if(CaseBattle.queue.length>=600)return siteAlert('The case battle queue supports up to 600 rounds.');CaseBattle.queue.splice(index+1,0,id);cbRenderQueue();}
function cbMove(index,offset){if(CaseBattle.running)return;const n=index+offset;if(n<0||n>=CaseBattle.queue.length)return;[CaseBattle.queue[index],CaseBattle.queue[n]]=[CaseBattle.queue[n],CaseBattle.queue[index]];cbRenderQueue();}
function cbUpdateOptions(){
  if(CaseBattle.running)return;
  CaseBattle.mode=$('cb-mode').value;
  CaseBattle.bots=Math.max(1,Math.min(5,Number($('cb-bots').value)||1));
  CaseBattle.shared=$('cb-shared').checked;
  CaseBattle.cursed=$('cb-cursed').checked;
  CaseBattle.fast=$('cb-fast').checked;
  $('cb-bots-field').hidden=CaseBattle.mode!=='regular';
  cbSaveDraft();cbRenderQueue();
}
function cbPickParticipants(){
  const group=cbGroupSize();const total=1+cbBotCount();
  const names=AQUATIC_BOTS.slice();for(let i=names.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[names[i],names[j]]=[names[j],names[i]];}
  const result=[{id:'you',name:'YOU',emoji:'🏆',team:'red',player:true,items:[],totalCents:0}];
  for(let i=1;i<total;i++){
    const chosen=names[(i-1)%names.length];
    result.push({id:`bot-${i}`,name:chosen.name,emoji:chosen.emoji,team:group===1?'neutral':i<group?'red':'blue',player:false,items:[],totalCents:0});
  }
  return result;
}
function cbRenderParticipants(){
  const box=$('cb-players');const frag=document.createDocumentFragment();
  CaseBattle.participants.forEach(entry=>{
    const card=createElement('article',`cb-player-card ${entry.player?'is-you':''} team-${entry.team}`);
    card.id=`cb-card-${entry.id}`;
    const head=createElement('div','cb-player-head');
    head.append(createElement('span','cb-player-emoji',entry.emoji));
    const title=createElement('div','cb-player-title');title.append(createElement('strong','',entry.name),createElement('small','',entry.team==='red'?'RED TEAM':entry.team==='blue'?'BLUE TEAM':entry.player?'CHALLENGER':'BOT CHALLENGER'));
    head.appendChild(title);head.appendChild(createElement('strong','cb-player-total',cbMoney(0)));
    const reel=createElement('div','cb-reel-window');reel.appendChild(createElement('div','cb-reel-strip'));reel.appendChild(createElement('div','cb-reel-center'));
    const latest=createElement('div','cb-latest','WAITING TO UNBOX...');
    card.append(head,reel,latest);frag.appendChild(card);
  });box.replaceChildren(frag);
}
function cbRenderTeamTotals(){
  const box=$('cb-team-totals');if(!box)return;
  if(cbGroupSize()===1){box.hidden=true;box.replaceChildren();return;}
  box.hidden=false;
  const red=CaseBattle.participants.filter(p=>p.team==='red').reduce((n,p)=>n+p.totalCents,0);
  const blue=CaseBattle.participants.filter(p=>p.team==='blue').reduce((n,p)=>n+p.totalCents,0);
  const r=createElement('div','cb-team-chip cb-team-red',`RED TEAM · ${cbMoney(red)}`),b=createElement('div','cb-team-chip cb-team-blue',`BLUE TEAM · ${cbMoney(blue)}`);
  box.replaceChildren(r,b);
}
function cbUpdatePlayerTotals(){
  CaseBattle.participants.forEach(p=>{
    const box=$(`cb-card-${p.id}`)?.querySelector('.cb-player-total');if(box)box.textContent=cbMoney(p.totalCents);
  });cbRenderTeamTotals();
}
function cbCreateReel(participant,gameCase,winner,duration){
  const card=$(`cb-card-${participant.id}`);const strip=card?.querySelector('.cb-reel-strip');const windowEl=card?.querySelector('.cb-reel-window');
  if(!strip||!windowEl)return Promise.resolve();
  card.classList.remove('cb-landed');
  const frag=document.createDocumentFragment(),winningIndex=12;
  for(let i=0;i<20;i++){
    const item=i===winningIndex?winner:getRandomItem(gameCase.items)||winner;
    const tile=createElement('div',`cb-reel-item ${qualityClass(item.rarity)}`);tile.title=item.name;
    tile.appendChild(itemImage(item));frag.appendChild(tile);
  }
  strip.replaceChildren(frag);strip.style.transition='none';strip.style.transform='translate3d(0px,0,0)';
  // offsetLeft and dimensions come from the actual rendered tiles, so center
  // always lands inside the previously rolled winner, even on mobile.
  const tile=strip.children[winningIndex];
  const center=tile.offsetLeft+tile.offsetWidth/2;
  const jitter=(Math.random()-.5)*Math.min(18,tile.offsetWidth*.32);
  const offset=windowEl.clientWidth/2-center+jitter;
  const ease=['cubic-bezier(.09,.64,.16,1)','cubic-bezier(.17,.71,.13,1)','cubic-bezier(.12,.77,.22,1)'][Math.floor(Math.random()*3)];
  return new Promise(resolve=>{
    requestAnimationFrame(()=>requestAnimationFrame(()=>{
      strip.style.transition=`transform ${duration}ms ${ease}`;
      strip.style.transform=`translate3d(${offset}px,0,0)`;
    }));
    window.setTimeout(()=>{tile.classList.add('cb-reel-winner');card.classList.add('cb-landed');resolve();},duration+80);
  });
}
function cbCreateHistory(round,gameCase,results){
  const history=$('cb-history');const row=createElement('div','cb-history-row');
  const heading=createElement('strong','',`#${round} ${gameCase.name}`);row.appendChild(heading);
  const rewards=createElement('div','cb-history-rewards');
  results.forEach((item,i)=>{
    const chip=createElement('span','cb-history-chip');chip.append(itemImage(item),createElement('span','',`${CaseBattle.participants[i].name} · ${cbMoney(cents(item.price))}`));
    chip.title=item.name;rewards.appendChild(chip);
  });row.appendChild(rewards);history.prepend(row);
  // Avoid building thousands of history rows in a marathon round queue.
  while(history.children.length>35)history.lastElementChild.remove();
}
async function cbAnimateRound(gameCase,index){
  $('cb-round-label').textContent=`ROUND ${index+1} / ${CaseBattle.lineup.length}`;
  $('cb-current-case').textContent=gameCase.name.toUpperCase();
  const participants=CaseBattle.participants;
  const results=participants.map(()=>getRandomItem(gameCase.items));
  // Stop if any reward pool becomes invalid; this guards corrupt input data.
  if(results.some(item=>!item))throw new Error(`Invalid drop pool: ${gameCase.name}`);
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const base=reduced?110:CaseBattle.fast?520:1800;
  const promises=participants.map((p,j)=>{
    const duration=base+(reduced?j*5:Math.floor(Math.random()*(CaseBattle.fast?250:850)));
    const latest=$(`cb-card-${p.id}`)?.querySelector('.cb-latest');
    if(latest){latest.className='cb-latest';latest.textContent='UNBOXING...';}
    return cbCreateReel(p,gameCase,results[j],duration);
  });
  await Promise.all(promises);
  results.forEach((item,i)=>{
    const p=participants[i];p.items.push(item);p.totalCents+=cents(item.price);CaseBattle.poolCents+=cents(item.price);
    const latest=$(`cb-card-${p.id}`).querySelector('.cb-latest');
    latest.className=`cb-latest ${qualityClass(item.rarity)}`;
    latest.textContent=`${item.name} · ${cbMoney(cents(item.price))}`;
  });
  CaseBattle.roundsPlayed=index+1;cbUpdatePlayerTotals();cbCreateHistory(index+1,gameCase,results);
  const progress=(index+1)/CaseBattle.lineup.length;
  $('cb-progress-fill').style.width=`${progress*100}%`;
  $('cb-progress-label').textContent=`${index+1} / ${CaseBattle.lineup.length} ROUNDS`;
  if(index+1<CaseBattle.lineup.length)await new Promise(resolve=>setTimeout(resolve,reduced?20:CaseBattle.fast?180:580));
}

function cbCalculateResult(){
  const players=CaseBattle.participants,teamSize=cbGroupSize(),cursed=CaseBattle.cursed,shared=CaseBattle.shared;
  const pool=CaseBattle.poolCents;
  let userWon=false,winLabel='',isTie=false;
  if(teamSize===1){
    const sorted=[...players].sort((a,b)=>cursed?a.totalCents-b.totalCents:b.totalCents-a.totalCents);
    const best=sorted[0].totalCents;
    const tied=sorted.filter(p=>p.totalCents===best);
    const winner=tied[Math.floor(Math.random()*tied.length)];
    isTie=tied.length>1;userWon=winner.player;
    winLabel=`${winner.name} ${cursed?'had the lowest':'had the highest'} total (${cbMoney(best)})`;
  }else{
    const red=players.filter(p=>p.team==='red').reduce((n,p)=>n+p.totalCents,0);
    const blue=players.filter(p=>p.team==='blue').reduce((n,p)=>n+p.totalCents,0);
    isTie=red===blue;
    userWon=isTie?Math.random()<.5:(cursed?red<blue:red>blue);
    winLabel=`${userWon?'RED TEAM':'BLUE TEAM'} ${cursed?'had the lower':'had the higher'} total (${cbMoney(userWon?red:blue)})`;
  }
  const payout=shared?(teamSize===1?Math.floor(pool/players.length):(userWon?Math.floor(pool/teamSize):0)):(userWon?pool:0);
  const description=teamSize===1&&shared?
    `SHARED: ${players.length} participants each receive ${cbMoney(payout)} from ${cbMoney(pool)} in unboxed value. ${winLabel}${isTie?' (tie-break draw)':''}.`:
    teamSize>1&&shared?
      `${winLabel}${isTie?' (tie-break draw)':''}. SHARED: the winning team divides the ${cbMoney(pool)} pool between ${teamSize} teammates.`:
      `${winLabel}${isTie?' (tie-break draw)':''}. ${userWon?'You receive the full unboxed value.':'Your entry fee is lost.'}`;
  return {userWon,payoutCents:payout,description,tie:isTie};
}
function cbSettle(result){
  if(CaseBattle.settled)return;
  CaseBattle.settled=true;
  CaseBattle.payoutCents=result.payoutCents;
  const original=cents(coins),final=original+result.payoutCents;
  const savedReceipt=safeJSON(CASEBATTLE_ESCROW_KEY,{});
  // Write a settlement receipt before crediting winnings. Recovery applies
  // payout exactly once if navigation interrupts the final save.
  localStorage.setItem(CASEBATTLE_ESCROW_KEY,JSON.stringify({status:'settling',chargedCents:original,finalCents:final,entryCents:CaseBattle.entryCostCents,session:savedReceipt.session||''}));
  coins=fromCents(final);updateCoins();
  localStorage.removeItem(CASEBATTLE_ESCROW_KEY);
  awardSpendXP(fromCents(CaseBattle.entryCostCents),'casebattle');
  CaseBattle.running=false;
  const win=result.userWon;
  const resultBox=$('cb-result');resultBox.hidden=false;resultBox.classList.toggle('cb-result-win',win);resultBox.classList.toggle('cb-result-lose',!win);
  $('cb-result-heading').textContent=CaseBattle.shared && cbGroupSize()===1?'SHARED POOL DISTRIBUTED':win?'⚔ VICTORY — YOU WIN!':'☠ DEFEAT — BATTLE LOST';
  $('cb-result-description').textContent=result.description;
  const breakdown=$('cb-result-breakdown');breakdown.replaceChildren();
  const stats=[['ROUNDS',String(CaseBattle.roundsPlayed)],['TOTAL UNBOXED',cbMoney(CaseBattle.poolCents)],['YOUR ENTRY',`− ${cbMoney(CaseBattle.entryCostCents)}`],['PAYOUT',`+ ${cbMoney(result.payoutCents)}`],['NET CHANGE',`${result.payoutCents-CaseBattle.entryCostCents<0?'−':'+'} ${cbMoney(Math.abs(result.payoutCents-CaseBattle.entryCostCents))}`]];
  stats.forEach(([label,value])=>{const row=createElement('div','cb-result-stat');row.append(createElement('span','',label),createElement('strong','',value));breakdown.appendChild(row);});
  $('cb-running-note').hidden=true;
  cbRenderQueue();
  $('cb-result').scrollIntoView({behavior:'smooth',block:'nearest'});
}
async function cbStart(){
  if(cbAtRisk())return siteAlert('Finish the current game before starting a Case Battle.');
  const lineup=cbValidLineup();
  if(!lineup.length||lineup.length!==CaseBattle.queue.length)return siteAlert('Choose one or more valid cases before starting.');
  const cost=cbCostCents();
  if(!Number.isSafeInteger(cost)||cost<=0)return siteAlert('Choose a lineup that has a positive total entry price.');
  if(cost>cents(coins))return siteAlert(`Insufficient virtual coins. Battle costs ${cbMoney(cost)}; wallet contains ${money(coins)}.`);
  if(lineup.length>50){
    const confirmed=await siteConfirm(`This battle contains ${lineup.length} rounds. All participants will spin once per round. Continue for ${cbMoney(cost)}?`,'LONG CASE BATTLE');
    if(!confirmed||cbAtRisk())return;
  }
  CaseBattle.running=true;CaseBattle.settled=false;
  CaseBattle.lineup=lineup;CaseBattle.participants=cbPickParticipants();CaseBattle.roundsPlayed=0;
  CaseBattle.poolCents=0;CaseBattle.payoutCents=0;CaseBattle.entryCostCents=cost;
  const original=cents(coins),charged=original-cost;
  localStorage.setItem(CASEBATTLE_ESCROW_KEY,JSON.stringify({status:'pending',originalCents:original,chargedCents:charged,session:`${Date.now()}-${Math.random()}`}));
  coins=fromCents(charged);updateCoins();
  $('cb-setup').hidden=true;$('cb-arena').hidden=false;$('cb-result').hidden=true;$('cb-running-note').hidden=false;
  $('cb-format-tag').textContent=cbGroupSize()===1?`${CaseBattle.participants.length} PLAYERS · REGULAR`:`${cbGroupSize()} vs ${cbGroupSize()} · TEAMS`;
  $('cb-modifier-tags').textContent=[CaseBattle.shared?'SHARED':'',CaseBattle.cursed?'CURSED':''].filter(Boolean).join(' + ')||'STANDARD';
  $('cb-progress-fill').style.width='0%';$('cb-progress-label').textContent=`0 / ${lineup.length} ROUNDS`;
  $('cb-history').replaceChildren();cbRenderParticipants();cbRenderTeamTotals();
  try{
    for(let i=0;i<lineup.length;i++)await cbAnimateRound(lineup[i],i);
    cbSettle(cbCalculateResult());
  }catch(error){
    console.error('Case Battle stopped unexpectedly:',error);
    const receipt=safeJSON(CASEBATTLE_ESCROW_KEY,null);
    if(receipt?.status==='pending'&&cents(coins)===receipt.chargedCents){coins=fromCents(receipt.originalCents);updateCoins();}
    localStorage.removeItem(CASEBATTLE_ESCROW_KEY);
    CaseBattle.running=false;CaseBattle.settled=true;
    $('cb-result').hidden=false;$('cb-result-heading').textContent='BATTLE CANCELLED';
    $('cb-result-description').textContent='A case could not be opened. Your entry was refunded. No XP was awarded.';
    $('cb-result-breakdown').replaceChildren();$('cb-running-note').hidden=true;
    cbRenderQueue();
  }
}
function cbAgain(){
  if(CaseBattle.running)return;
  $('cb-arena').hidden=true;$('cb-setup').hidden=false;
  $('cb-result').hidden=true;$('cb-running-note').hidden=false;
  cbRenderQueue();cbRenderCatalog();
}
function setupCaseBattle(){
  if(!$('casebattle-section'))return;
  cbRecoverEscrow();
  $('cb-mode').value=CaseBattle.mode;$('cb-bots').value=String(CaseBattle.bots);
  $('cb-shared').checked=CaseBattle.shared;$('cb-cursed').checked=CaseBattle.cursed;$('cb-fast').checked=CaseBattle.fast;
  ['cb-mode','cb-bots','cb-shared','cb-cursed','cb-fast'].forEach(id=>$(id).addEventListener('change',cbUpdateOptions));
  $('cb-case-search').addEventListener('input',cbRenderCatalog);
  $('cb-add-qty').addEventListener('change',()=>{const n=Number($('cb-add-qty').value);if(!Number.isInteger(n)||n<1)$('cb-add-qty').value='1';});
  $('cb-clear').onclick=()=>{if(!CaseBattle.running){CaseBattle.queue=[];cbRenderQueue();}};
  $('cb-start').onclick=cbStart;$('cb-again').onclick=cbAgain;
  $('cb-bots-field').hidden=CaseBattle.mode!=='regular';
  cbRenderCatalog();cbRenderQueue();
  window.addEventListener('tf2grand:casesloaded',()=>{
    CaseBattle.queue=CaseBattle.queue.filter(id=>Boolean(cbCaseById(id)));
    cbRenderCatalog();cbRenderQueue();
  });
}
document.addEventListener('DOMContentLoaded',setupCaseBattle);
