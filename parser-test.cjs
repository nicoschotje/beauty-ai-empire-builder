/* Content-aware intent parser test for elementor-angie.html */
const fs=require('fs');
const {JSDOM}=require('jsdom');
const html=fs.readFileSync('elementor-angie.html','utf8');

function boot(){
  const dom=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,
    url:'http://localhost/'});
  const w=dom.window;
  w.Element.prototype.scrollIntoView=function(){};
  w.IntersectionObserver=class{constructor(){}observe(){}unobserve(){}disconnect(){}};
  w.URL.createObjectURL=()=>'blob:x'; w.URL.revokeObjectURL=()=>{};
  w.addEventListener('error',e=>console.log('  [uncaught] '+(e.error&&e.error.message||e.message)));
  return new Promise(res=>w.addEventListener('load',()=>setTimeout(()=>res(w),650)));
}
const wait=ms=>new Promise(r=>setTimeout(r,ms));

async function run(prompt){
  const w=await boot();
  const D=w.document;
  if(!D.getElementById('tour').classList.contains('hide'))
    D.getElementById('tourSkip').click();
  await wait(40);
  const inp=D.getElementById('agInput');
  inp.value=prompt;
  inp.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Enter',bubbles:true,cancelable:true}));
  await wait(120);
  // collect every piece of editable text rendered on the canvas
  const texts=[...D.querySelectorAll('#page [data-edit]')].map(e=>e.textContent.trim());
  const sections=[...D.querySelectorAll('#page > .blk-section')]
    .map(s=>(s.querySelector(':scope > .blk-tag')||{}).textContent);
  return {texts,sections,D};
}
function has(texts,s){
  return texts.some(t=>t===s) || texts.some(t=>t.includes(s));
}

const results=[];
function check(name,texts,expected,sections,note){
  const missing=expected.filter(e=>!has(texts,e));
  const pass=missing.length===0;
  results.push(pass);
  console.log((pass?'PASS':'FAIL')+' · '+name);
  console.log('       parser: '+note);
  console.log('       sections: ['+sections.join(', ')+']');
  if(!pass) console.log('       MISSING: '+missing.map(m=>JSON.stringify(m)).join(', '));
}

(async()=>{
  let r;

  r=await run('add a hero with headline "Hello World" and subtext "Welcome to my site"');
  check('1. Single block with content',r.texts,
    ['Hello World','Welcome to my site'],r.sections,
    'hero → headline + subtext slots filled from quoted strings');

  r=await run('3-column feature grid: "Fast", "Secure", "Affordable"');
  check('2. Feature grid with labels',r.texts,
    ['Fast','Secure','Affordable'],r.sections,
    'features → 3 comma-separated quoted titles become 3 cards');

  r=await run('FAQ with items: "Is it free?", "How do I cancel?", "Do you ship abroad?"');
  check('3. FAQ with questions',r.texts,
    ['Is it free?','How do I cancel?','Do you ship abroad?'],r.sections,
    'faq → quoted strings become accordion questions');

  r=await run('pricing with three tiers: Basic $9, Pro $29, Enterprise $99');
  check('4. Pricing with values',r.texts,
    ['Basic','Pro','Enterprise','$9','$29','$99'],r.sections,
    'pricing → bare tier names + $prices parsed per chunk');

  r=await run('navbar with brand "Acme Corp"');
  check('5. Brand name',r.texts,['Acme Corp'],r.sections,
    'navbar → quoted brand becomes the logo');

  const brewbox="Build a landing page for 'BrewBox', a monthly artisan coffee subscription. "
    +"Add a navbar with the brand name BrewBox. Add a hero with the headline "
    +"'Fresh-Roasted Coffee, Delivered Monthly' and the subtext 'Hand-picked beans "
    +"from small farms, roasted the week we ship them to your door.' Add two CTAs: "
    +"'Start My Subscription' and 'See How It Works'. Then a 3-column feature grid "
    +"with icons: 'Sourced Directly' with text 'We buy from farmers, not middlemen.', "
    +"'Roasted Fresh' with text 'Shipped within 48 hours of roasting.', and 'Pause "
    +"Anytime' with text 'Skip a month or cancel in one click.' Then a pricing section "
    +"with three tiers: 'Taster' at $14/month for 1 bag, 'Regular' at $24/month for 2 "
    +"bags, and 'Pro' at $42/month for 4 bags. Then an FAQ with 4 items: 'How fresh is "
    +"the coffee?', 'Can I choose the roast level?', 'When will my order ship?', 'How "
    +"do I cancel?'. Finish with a footer that says 'BrewBox Coffee Co. · Brewed "
    +"with care since 2026.'";
  r=await run(brewbox);
  check('6. Long compound BrewBox prompt',r.texts,[
    'BrewBox',
    'Fresh-Roasted Coffee, Delivered Monthly',
    'Hand-picked beans from small farms, roasted the week we ship them to your door.',
    'Start My Subscription','See How It Works',
    'Sourced Directly','We buy from farmers, not middlemen.',
    'Roasted Fresh','Shipped within 48 hours of roasting.',
    'Pause Anytime','Skip a month or cancel in one click.',
    'Taster','$14','Regular','$24','Pro','$42',
    'How fresh is the coffee?','Can I choose the roast level?',
    'When will my order ship?','How do I cancel?',
    'BrewBox Coffee Co. · Brewed with care since 2026.',
  ],r.sections,
    'compound prompt split into 6 ordered segments, each parsed for its own content');

  /* ---- regression-limitation fixes ---- */

  r=await run('FAQ with "Is it free?" answer "Yes, completely free." '
    +'and "How do I cancel?" answer "Go to Settings."');
  const lastSec=r.D.querySelector('#page > .blk-section:last-child');
  const faqqs=[...lastSec.querySelectorAll('[data-edit="faqq"]')].map(e=>e.textContent.trim());
  check('7. FAQ answers parsed',r.texts,
    ['Is it free?','Yes, completely free.','How do I cancel?','Go to Settings.'],
    r.sections,'answer-labelled quotes attach to the prior question — '
    +faqqs.length+' questions parsed (expected 2)');
  results[results.length-1]=results[results.length-1]&&faqqs.length===2;
  if(faqqs.length!==2) console.log('       FAIL: got '+faqqs.length+' questions, expected 2');

  r=await run('3-column feature grid: "🔒" "Secure", "⚡" "Fast", "🎯" "Precise"');
  check('8. Feature emoji icons parsed',r.texts,
    ['🔒','Secure','⚡','Fast','🎯','Precise'],r.sections,
    'emoji-only quotes become the card icon, the next quote its title');

  r=await run('add a hero, then add another hero for the mobile app');
  const heroes=r.sections.filter(s=>s==='Hero').length;
  const dupPass=heroes===3;   /* 1 seeded + 2 generated */
  results.push(dupPass);
  console.log((dupPass?'PASS':'FAIL')+' · 9. Duplicate section types');
  console.log('       parser: repeated "hero" with an introducer word in between '
    +'yields separate blocks — '+heroes+' Hero sections (1 seeded + 2 new)');
  console.log('       sections: ['+r.sections.join(', ')+']');

  r=await run("our company's hero with headline 'Big News'");
  const apostroPass=has(r.texts,'Big News')
    && !r.texts.some(t=>/hero with headline/.test(t));
  results.push(apostroPass);
  console.log((apostroPass?'PASS':'FAIL')+' · 10. Apostrophe in unquoted prose');
  console.log('       parser: "company\\u2019s" apostrophe ignored, \\u2018Big News\\u2019 '
    +'parsed as the headline (no garbage quote)');
  console.log('       sections: ['+r.sections.join(', ')+']');
  if(!apostroPass) console.log('       texts: '+JSON.stringify(r.texts.slice(0,8)));

  const pass=results.filter(Boolean).length;
  console.log('\n──────────────────────────────');
  console.log('RESULT: '+pass+'/'+results.length+' content tests passed');
  process.exit(pass===results.length?0:1);
})().catch(e=>{console.error('HARNESS ERROR:',e);process.exit(2);});
