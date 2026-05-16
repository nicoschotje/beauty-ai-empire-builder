/* Regression smoke test for elementor-angie.html via jsdom */
const fs=require('fs');
const {JSDOM}=require('jsdom');
const html=fs.readFileSync('elementor-angie.html','utf8');
const results=[];
function rec(name,pass,note){results.push({name,pass,note});
  console.log((pass?'PASS':'FAIL')+' · '+name+(note?'  — '+note:''));}

function boot(seed){
  const dom=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,
    url:'http://localhost/angie'});
  const w=dom.window;
  w.Element.prototype.scrollIntoView=function(){};
  w.IntersectionObserver=class{constructor(c){this.c=c;}observe(){}unobserve(){}disconnect(){}};
  const blobs=[];
  w.URL.createObjectURL=b=>{blobs.push(b);return 'blob:'+blobs.length;};
  w.URL.revokeObjectURL=()=>{};
  let clip=null;
  w.navigator.clipboard={writeText:t=>{clip=t;return Promise.resolve();}};
  if(seed) for(const k in seed) w.localStorage.setItem(k,seed[k]);
  return new Promise(res=>w.addEventListener('load',()=>
    setTimeout(()=>res({w,blobs,getClip:()=>clip}),700)));
}
const wait=ms=>new Promise(r=>setTimeout(r,ms));
function key(w,k,o){w.document.dispatchEvent(new w.KeyboardEvent('keydown',
  Object.assign({key:k,bubbles:true,cancelable:true},o)));}
function send(w,t){const i=w.document.getElementById('agInput');i.value=t;
  i.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Enter',bubbles:true,cancelable:true}));}

(async()=>{
  const {w,blobs,getClip}=await boot();
  const D=w.document,$=s=>D.querySelector(s),$$=s=>[...D.querySelectorAll(s)];

  rec('Onboarding tour auto-shows on first run',
    !D.getElementById('tour').classList.contains('hide'));
  D.getElementById('tourSkip').click();
  await wait(40);

  rec('App boots & renders seeded demo page',
    $$('#page > .blk-section').length===9, $$('#page > .blk-section').length+' sections');

  send(w,'hero with gradient'); await wait(50);
  rec('Section prompt appends a block',
    $$('#page > .blk-section').length===10,
    'last='+($('#page').lastElementChild.querySelector(':scope > .blk-tag')||{}).textContent);

  const b1=$$('#page > .blk-section').length;
  key(w,'z',{metaKey:true}); await wait(40);
  const b2=$$('#page > .blk-section').length;
  key(w,'z',{metaKey:true,shiftKey:true}); await wait(40);
  const b3=$$('#page > .blk-section').length;
  rec('Undo / redo (⌘Z / ⌘⇧Z)', b2===b1-1&&b3===b1, `${b1}→${b2}→${b3}`);

  const em=D.getElementById('exportMenu');
  D.getElementById('btnExport').click();
  em.querySelector('[data-x="html"]').click(); await wait(20);
  const htmlOut=blobs.length?await blobs[blobs.length-1].text():'';
  rec('Export HTML', htmlOut.startsWith('<!doctype html>')&&htmlOut.includes('<section'),
    htmlOut.length+' bytes');

  D.getElementById('btnExport').click();
  em.querySelector('[data-x="json"]').click(); await wait(20);
  let jsonOk=false;
  try{const p=JSON.parse(await blobs[blobs.length-1].text());
    jsonOk=!!p.root&&Array.isArray(p.root.children);}catch(e){}
  rec('Export JSON', jsonOk);

  D.getElementById('btnExport').click();
  em.querySelector('[data-x="embed"]').click(); await wait(20);
  const embed=getClip();
  rec('Copy Embed Snippet', !!embed&&embed.includes('<iframe')&&embed.includes('srcdoc='));

  const saved=w.localStorage.getItem('angie_page_v1');
  const savedCount=JSON.parse(saved).root.children.length;
  const b2nd=await boot({angie_page_v1:saved,angie_tour_done:'1'});
  rec('Persistence — page restored after reload',
    b2nd.w.document.querySelectorAll('#page > .blk-section').length===savedCount,
    savedCount+' sections');

  D.getElementById('btnTour').click(); await wait(30);
  for(let i=0;i<4;i++){D.getElementById('tourNext').click();await wait(20);}
  D.getElementById('tourNext').click(); await wait(140);
  const secs=$$('#page > .blk-section').map(s=>
    (s.querySelector(':scope > .blk-tag')||{}).textContent);
  rec('Onboarding tour auto-builds SaaS sample',
    JSON.stringify(secs)===JSON.stringify(
      ['Navbar','Hero','Features','Stats','Testimonials','Pricing','FAQ','CTA','Footer']),
    secs.length+' sections');

  D.querySelector('#agTabs [data-t="speed"]').click(); await wait(60);
  const score=D.querySelector('#agBody .score-ring .num');
  rec('PageSpeed optimizer computes score',
    !!score&&+score.textContent>0, 'score='+(score&&score.textContent));

  const firstSec=$('#page > .blk-section');
  firstSec.dispatchEvent(new w.MouseEvent('click',{bubbles:true})); await wait(40);
  const dBefore=$$('#page > .blk-section').length;
  key(w,'d',{metaKey:true}); await wait(40);
  const dAfter=$$('#page > .blk-section').length;
  key(w,'Delete'); await wait(40);
  const dDel=$$('#page > .blk-section').length;
  rec('Duplicate (⌘D) & Delete', dAfter===dBefore+1&&dDel===dBefore,
    `${dBefore}→${dAfter}→${dDel}`);

  D.getElementById('btnPreview').click(); await wait(50);
  const inPrev=!$('#page').classList.contains('editing');
  D.getElementById('btnPreview').click(); await wait(50);
  rec('Preview mode toggle', inPrev&&$('#page').classList.contains('editing'));

  const span=$('#page').querySelector('.blk-edit[contenteditable="true"]');
  let clean=false;
  if(span){span.textContent='Edited';
    span.dispatchEvent(new w.Event('input',{bubbles:true}));await wait(20);
    clean=span.textContent==='Edited';}
  rec('Inline edit writes clean content', clean);

  const pass=results.filter(r=>r.pass).length;
  console.log('\n──────────────────────────────');
  console.log('RESULT: '+pass+'/'+results.length+' passed');
  if(pass!==results.length){
    results.filter(r=>!r.pass).forEach(r=>console.log('  ✗ '+r.name));
    process.exit(1);
  }
  process.exit(0);
})().catch(e=>{console.error('HARNESS ERROR:',e);process.exit(2);});
