const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));

function el(tag,cls,text){
  const n=document.createElement(tag);
  if(cls) n.className=cls;
  if(text!==undefined&&text!==null) n.textContent=String(text);
  return n;
}

function source(parent,value){
  if(value) parent.appendChild(el('div','source-attribution',value));
}

function formatDevanagariLines(value){
  return String(value||'')
    .replace(/\s*\|\|\s*/g,'\u00A0||\n')
    .replace(/\s*\|\s*/g,'\u00A0|\n')
    .replace(/\s*॥\s*/g,'\u00A0॥\n')
    .replace(/\s*।\s*/g,'\u00A0।\n')
    .replace(/\n{2,}/g,'\n')
    .trim();
}

function scriptPair(item,{wrapRoman=false,verified=false}={}){
  const pair=el('div','script-pair');
  const rwrap=wrapRoman?el('div','roman-wrap'):null;
  const rt=rwrap||pair;
  if(rwrap) rwrap.appendChild(el('div','roman-reading-label','Simplified English / Phonetic'));
  rt.appendChild(el('pre',wrapRoman?'':'roman-text',item.roman||''));
  source(rt,item.sourceRoman);
  if(rwrap) pair.appendChild(rwrap);

  const dev=el('div',(verified?'chapter-source-verified ':'')+'devanagari-wrap');
  dev.appendChild(el('div','devanagari-label','Devanagari'));
  dev.appendChild(el('pre','devanagari-text',formatDevanagariLines(item.devanagari||'')));
  source(dev,item.sourceDevanagari);
  pair.appendChild(dev);

  if(item.iast){
    const iw=el('div','iast-transliteration');
    iw.appendChild(el('div','iast-label','IAST'));
    iw.appendChild(el('div','iast-text',item.iast));
    pair.appendChild(iw);
  }
  return pair;
}

function meaning(parent,item){
  if(!item.meaning) return;
  const box=el('div','simple-meaning');
  box.appendChild(el('div','simple-meaning-label','Simple Meaning'));
  box.appendChild(el('div','simple-meaning-body',item.meaning));
  parent.appendChild(box);
}

function audioWrap(audio,label,kind){
  if(!audio||!audio.src) return null;
  const wrap=el(kind==='verse-audio'?'span':'div',kind);
  if(label) wrap.appendChild(el('span','chant-label',label));
  const btn=el('button','mobile-play','▶ Chanting');
  btn.type='button';
  wrap.appendChild(btn);

  const progress=el('div','audio-progress');
  const elapsed=el('span','audio-elapsed','0:00');
  const range=document.createElement('input');
  range.type='range';range.min='0';range.max='1000';range.step='1';range.value='0';
  range.setAttribute('aria-label','Audio position');
  const remaining=el('span','audio-time','-0:00');
  progress.append(elapsed,range,remaining);
  wrap.appendChild(progress);

  const a=document.createElement('audio');
  a.preload='metadata';
  const src=document.createElement('source');
  src.src=audio.src;
  if(audio.type) src.type=audio.type;
  a.appendChild(src);
  wrap.appendChild(a);
  return wrap;
}

function renderOpening(root,data){
  root.innerHTML='';
  root.appendChild(el('h2','section-title',data.title||'Invocations & Foundational Shlokas'));
  const items=data.items||[];
  const inv=items.find(x=>x.kind==='invocation');
  if(inv){
    const card=el('div','intro-card searchable');
    const aw=audioWrap(inv.audio,inv.audioLabel||'Dhanvantari Invocation','attached-audio');
    if(aw) card.appendChild(aw);
    if(inv.title) card.appendChild(el('div','shloka-title',inv.title));
    card.appendChild(scriptPair(inv,{wrapRoman:true}));
    meaning(card,inv);
    root.appendChild(card);
  }
  const general=items.filter(x=>x.kind!=='invocation');
  if(general.length) root.appendChild(el('h3','general-shlokas-title','General Shlokas'));
  general.forEach(item=>{
    const card=el('div','intro-card general-shloka searchable');
    card.id=item.id||'';
    card.appendChild(scriptPair(item,{wrapRoman:true}));
    meaning(card,item);
    root.appendChild(card);
  });
}

function renderHerbs(root,data){
  root.innerHTML='';
  root.appendChild(el('h2','section-title',data.title||'Herbs'));
  const lookup=el('div','lookup');
  lookup.appendChild(el('h3','','Quick Herb Lookup'));
  const links=el('div','lookup-links');
  (data.items||[]).forEach(item=>{
    const a=el('a','',item.title||item.id);
    a.href='#'+item.id;
    links.appendChild(a);
  });
  lookup.appendChild(links);
  root.appendChild(lookup);

  const grid=el('div','herb-grid');
  (data.items||[]).forEach(item=>{
    const card=el('article','card herb-card searchable');
    card.id=item.id||'';
    const head=el('div','herb-head');
    head.appendChild(el('h3','',item.title||item.id));
    const aw=audioWrap(item.audio,item.audioLabel||'Chanting','attached-audio');
    if(aw) head.appendChild(aw);
    card.appendChild(head);
    card.appendChild(scriptPair(item,{wrapRoman:true}));
    meaning(card,item);
    grid.appendChild(card);
  });
  root.appendChild(grid);
}

function renderChapter(root,data){
  root.innerHTML='';
  root.appendChild(el('h2','section-title',data.title));
  if(data.subtitle) root.appendChild(el('div','chapter-subtitle',data.subtitle));
  if(data.note) root.appendChild(el('div','devanagari-source-note',data.note));

  if((data.chapterAudio||[]).length){
    const suite=el('div','chapter-audio-suite');
    suite.appendChild(el('h3','','Chapter 11 Chanting'));
    const items=el('div','chapter-audio-items');
    data.chapterAudio.forEach((entry,i)=>{
      const row=audioWrap(entry.audio,i===0?'Normal chanting':'Slow chanting','chapter-audio-item');
      if(row) items.appendChild(row);
    });
    suite.appendChild(items);
    root.appendChild(suite);
  }

  const verses=data.verses||[];
  const numbered=verses.filter(v=>Number.isFinite(v.number));
  const index=el('div','shloka-index');
  index.appendChild(el('h3','','Shloka Index'));
  const links=el('div','shloka-index-links');
  numbered.forEach(v=>{
    const a=el('a','',String(v.number));
    a.href='#'+v.id;
    links.appendChild(a);
  });
  index.appendChild(links);
  root.appendChild(index);

  const grid=el('div','verse-grid');
  verses.forEach(v=>{
    const card=el('div','verse searchable');
    card.id=v.id||'';
    const head=el('div','verse-head');
    const label='Shloka '+v.number+(v.kind==='introduction'?' · Introduction':'');
    head.appendChild(el('span','verse-number',label));
    const aw=audioWrap(v.audio,'','verse-audio');
    if(aw) head.appendChild(aw);
    card.appendChild(head);
    card.appendChild(scriptPair(v,{verified:true}));
    meaning(card,v);
    grid.appendChild(card);
  });
  root.appendChild(grid);
}

async function loadJson(path){
  const r=await fetch(path,{cache:'no-store'});
  if(!r.ok) throw new Error(path+' '+r.status);
  return r.json();
}

async function renderPage(){
  const page=document.body.dataset.page;
  if(page==='opening') return renderOpening($('#opening'),await loadJson('data/opening.json'));
  if(page==='herbs') return renderHerbs($('#herbs'),await loadJson('data/herbs.json'));
  if(page==='chapter11') return renderChapter($('#doshaadi'),await loadJson('data/chapter-11.json'));
  if(page==='chapter12') return renderChapter($('#doshabhediyam'),await loadJson('data/chapter-12.json'));
}

function fmt(sec){
  if(!Number.isFinite(sec)||sec<0) return '0:00';
  sec=Math.floor(sec);
  return Math.floor(sec/60)+':'+String(sec%60).padStart(2,'0');
}

function initAudio(){
  const audios=$$('audio');
  const sync=(a)=>{
    const wrap=a.closest('.verse-audio,.attached-audio,.chapter-audio-item');
    if(!wrap)return;
    const b=$('.mobile-play',wrap),range=$('input[type=range]',wrap),e=$('.audio-elapsed',wrap),r=$('.audio-time',wrap);
    const playing=!a.paused&&!a.ended;
    if(b){b.textContent=playing?'❚❚ Pause':'▶ Chanting';b.classList.toggle('is-playing',playing);}
    const d=a.duration,c=a.currentTime||0;
    if(e)e.textContent=fmt(c);
    if(r)r.textContent=Number.isFinite(d)?'-'+fmt(Math.max(0,d-c)):'-0:00';
    if(range&&Number.isFinite(d)&&d>0)range.value=String(Math.round(c/d*1000));
  };
  $$('.mobile-play').forEach(btn=>btn.addEventListener('click',()=>{
    const a=$('audio',btn.closest('.verse-audio,.attached-audio,.chapter-audio-item'));
    if(!a)return;
    audios.forEach(o=>{if(o!==a&&!o.paused)o.pause();});
    if(a.paused){const p=a.play();if(p&&p.catch)p.catch(()=>{});}else a.pause();
  }));
  audios.forEach(a=>{
    ['loadedmetadata','durationchange','timeupdate','play','pause','ended'].forEach(ev=>a.addEventListener(ev,()=>sync(a)));
    const wrap=a.closest('.verse-audio,.attached-audio,.chapter-audio-item');
    const range=wrap&&$('input[type=range]',wrap);
    if(range)range.addEventListener('input',()=>{
      if(Number.isFinite(a.duration)&&a.duration>0)a.currentTime=(Number(range.value)/1000)*a.duration;
    });
    sync(a);
  });
}

function setHeights(){
  const nav=$('.site-nav');
  document.documentElement.style.setProperty('--site-nav-h',(nav?nav.offsetHeight:58)+'px');
  const player=$('.chapter-audio-suite');
  document.documentElement.style.setProperty('--chapter-player-h',(player?player.offsetHeight:0)+'px');
  const index=$('.shloka-index');
  document.documentElement.style.setProperty('--chapter-index-h',(index?index.offsetHeight:0)+'px');
}

function scrollToId(id,smooth=true){
  const t=document.getElementById(id);
  if(!t)return;
  const navH=parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--site-nav-h'))||58;
  const playerH=parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--chapter-player-h'))||0;
  const indexH=parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--chapter-index-h'))||0;
  const extra=document.body.dataset.page==='chapter11'?(playerH+indexH+18):(document.body.dataset.page==='chapter12'?(indexH+16):12);
  const y=t.getBoundingClientRect().top+window.scrollY-navH-extra;
  window.scrollTo({top:Math.max(0,y),behavior:smooth?'smooth':'auto'});
}

function initAnchors(){
  $$('a[href^="#"]').forEach(a=>a.addEventListener('click',e=>{
    const id=a.getAttribute('href').slice(1);
    if(!document.getElementById(id))return;
    e.preventDefault();
    history.pushState(null,'','#'+id);
    scrollToId(id,true);
  }));
  if(location.hash){
    requestAnimationFrame(()=>scrollToId(decodeURIComponent(location.hash.slice(1)),false));
  }
}

function initActiveIndex(){
  const strip=$('.shloka-index-links');
  if(!strip)return;
  const links=Array.from(strip.querySelectorAll('a'));
  const rows=links.map(a=>({a,el:document.getElementById(a.getAttribute('href').slice(1))})).filter(x=>x.el);
  if(!rows.length)return;

  let current=null;
  let ticking=false;

  function setActive(row){
    if(!row||row===current)return;
    current=row;
    links.forEach(a=>a.classList.toggle('is-current',a===row.a));

    // Keep the active number visible without moving the page itself.
    const left=row.a.offsetLeft;
    const right=left+row.a.offsetWidth;
    const viewLeft=strip.scrollLeft;
    const viewRight=viewLeft+strip.clientWidth;
    if(left<viewLeft+12){
      strip.scrollTo({left:Math.max(0,left-12),behavior:'auto'});
    }else if(right>viewRight-12){
      strip.scrollTo({left:Math.max(0,right-strip.clientWidth+12),behavior:'auto'});
    }
  }

  function update(){
    ticking=false;
    const navH=parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--site-nav-h'))||58;
    const playerH=parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--chapter-player-h'))||0;
    const indexH=parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--chapter-index-h'))||0;
    const probeY=navH+playerH+indexH+18;

    // Prefer the verse physically underneath the sticky bars.
    let active=rows.find(row=>{
      const r=row.el.getBoundingClientRect();
      return r.top<=probeY && r.bottom>probeY;
    });

    // Between cards, keep the most recently passed verse active.
    if(!active){
      const passed=rows.filter(row=>row.el.getBoundingClientRect().top<=probeY);
      active=passed.length?passed[passed.length-1]:rows[0];
    }
    setActive(active);
  }

  links.forEach(link=>{
    link.addEventListener('click',()=>{
      const row=rows.find(r=>r.a===link);
      if(row)setActive(row);
    });
  });

  window.addEventListener('scroll',()=>{
    if(!ticking){
      ticking=true;
      requestAnimationFrame(update);
    }
  },{passive:true});
  window.addEventListener('resize',update,{passive:true});
  update();
}

function initSearch(){
  const q=$('#search'),count=$('#searchCount'),none=$('#noResults');
  if(!q)return;
  const cards=$$('.searchable');
  q.addEventListener('input',()=>{
    const term=q.value.trim().toLowerCase();
    let hits=0;
    cards.forEach(c=>{
      const ok=!term||(c.textContent||'').toLowerCase().includes(term);
      c.hidden=!ok;
      if(ok&&term)hits++;
    });
    if(count)count.textContent=term?(hits+' match'+(hits===1?'':'es')):'';
    if(none)none.style.display=term&&hits===0?'block':'none';
  });
}

async function init(){
  try{
    await renderPage();
  }catch(err){
    console.error('Collection data could not be loaded:',err);
    const main=$('main');
    if(main){
      const m=el('div','no-results','The collection data could not be loaded. Please refresh.');
      m.style.display='block';
      main.prepend(m);
    }
    return;
  }

  const enhancements=[
    ['layout',setHeights],
    ['audio',initAudio],
    ['anchors',initAnchors],
    ['active index',initActiveIndex],
    ['search',initSearch]
  ];
  enhancements.forEach(([name,fn])=>{
    try{fn();}catch(err){console.warn(name+' enhancement failed:',err);}
  });
  window.addEventListener('resize',()=>{try{setHeights();}catch(e){}},{passive:true});
}

init();
