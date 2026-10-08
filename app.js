/* AH Sloka Chanting — single UI controller
   All collection content is rendered from data/*.json.
   This file intentionally replaces the older accumulated handlers. */

const $=(sel,root=document)=>root.querySelector(sel);
const $$=(sel,root=document)=>Array.from(root.querySelectorAll(sel));

function el(tag,cls,text){
  const n=document.createElement(tag);
  if(cls) n.className=cls;
  if(text!==undefined && text!==null) n.textContent=String(text);
  return n;
}

function addSource(parent,text){
  if(text) parent.appendChild(el('div','source-attribution',text));
}

function makeScriptPair(item,{wrapRoman=false,verified=false}={}){
  const pair=el('div','script-pair');

  const romanWrap=wrapRoman?el('div','roman-wrap'):null;
  const romanTarget=romanWrap||pair;
  if(wrapRoman) romanWrap.appendChild(el('div','roman-reading-label','Simplified English / Phonetic'));
  romanTarget.appendChild(el('pre',wrapRoman?'':'roman-text',item.roman||''));
  addSource(romanTarget,item.sourceRoman);
  if(romanWrap) pair.appendChild(romanWrap);

  const dev=el('div',(verified?'chapter-source-verified ':'')+'devanagari-wrap');
  dev.appendChild(el('div','devanagari-label','Devanagari'));
  dev.appendChild(el('pre','devanagari-text',item.devanagari||''));
  addSource(dev,item.sourceDevanagari);
  pair.appendChild(dev);

  if(item.iast){
    const iast=el('div','iast-transliteration');
    iast.appendChild(el('div','iast-label','IAST'));
    iast.appendChild(el('div','iast-text',item.iast));
    pair.appendChild(iast);
  }
  return pair;
}

function addMeaning(parent,item){
  if(!item.meaning) return;
  const box=el('div','simple-meaning');
  box.appendChild(el('div','simple-meaning-label','Simple Meaning'));
  box.appendChild(el('div','simple-meaning-body',item.meaning));
  parent.appendChild(box);
}

function makeAudioWrap(audio,label,kind='verse-audio'){
  if(!audio || !audio.src) return null;
  const wrap=el(kind==='verse-audio'?'span':'div',kind);
  if(label) wrap.appendChild(el('span','chant-label',label));

  const btn=el('button','mobile-play','▶ Chanting');
  btn.type='button';
  btn.setAttribute('aria-label','Play chanting'+(label?' — '+label:''));
  wrap.appendChild(btn);

  const progress=el('div','audio-progress');
  const elapsed=el('span','audio-elapsed','0:00');
  const range=document.createElement('input');
  range.type='range'; range.min='0'; range.max='1000'; range.step='1'; range.value='0';
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
    const audio=makeAudioWrap(inv.audio,inv.audioLabel||'Dhanvantari Invocation','attached-audio');
    if(audio) card.appendChild(audio);
    if(inv.title) card.appendChild(el('div','shloka-title',inv.title));
    card.appendChild(makeScriptPair(inv,{wrapRoman:true}));
    addMeaning(card,inv);
    root.appendChild(card);
  }
  const general=items.filter(x=>x.kind!=='invocation');
  if(general.length) root.appendChild(el('h3','general-shlokas-title','General Shlokas'));
  general.forEach(item=>{
    const card=el('div','intro-card general-shloka searchable');
    card.id=item.id||'';
    card.appendChild(makeScriptPair(item,{wrapRoman:true}));
    addMeaning(card,item);
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
    const audio=makeAudioWrap(item.audio,item.audioLabel||'Chanting','attached-audio');
    if(audio) head.appendChild(audio);
    card.appendChild(head);
    card.appendChild(makeScriptPair(item,{wrapRoman:true}));
    addMeaning(card,item);
    grid.appendChild(card);
  });
  root.appendChild(grid);
}

function renderChapter(root,data){
  root.innerHTML='';
  root.appendChild(el('h2','section-title',data.title||('Chapter '+data.chapter)));
  if(data.subtitle) root.appendChild(el('div','chapter-subtitle',data.subtitle));
  if(data.note) root.appendChild(el('div','devanagari-source-note',data.note));

  if((data.chapterAudio||[]).length){
    const suite=el('div','chapter-audio-suite');
    suite.appendChild(el('h3','',data.chapter===11?'Chapter 11 Chanting':'Chapter Chanting'));
    const rows=el('div','chapter-audio-items');
    data.chapterAudio.forEach((entry,i)=>{
      const label=data.chapter===11
        ? (i===0?'Normal chanting':'Slow chanting')
        : (entry.label||'Chanting');
      const row=makeAudioWrap(entry.audio,label,'chapter-audio-item');
      if(row) rows.appendChild(row);
    });
    suite.appendChild(rows);
    root.appendChild(suite);
  }

  const numbered=(data.verses||[]).filter(v=>Number.isFinite(v.number));
  if(numbered.length){
    const index=el('div','shloka-index');
    index.id=(data.id||root.id)+'-index';
    index.appendChild(el('h3','','Shloka Index'));
    const links=el('div','shloka-index-links');
    numbered.forEach(v=>{
      const a=el('a','',String(v.number));
      a.href='#'+v.id;
      links.appendChild(a);
    });
    index.appendChild(links);
    root.appendChild(index);
  }

  const grid=el('div','verse-grid');
  (data.verses||[]).forEach(v=>{
    let cls='verse searchable';
    if(v.kind==='introduction') cls+=' intro-verse';
    if(v.kind==='note') cls+=' note-verse';
    if(v.kind==='closing') cls+=' closing-verse';

    const card=el('div',cls);
    card.id=v.id||'';

    const head=el('div','verse-head');
    const label=Number.isFinite(v.number)
      ? 'Shloka '+v.number+(v.kind==='introduction'?' · Introduction':'')
      : (v.label||v.kind||'');
    head.appendChild(el('span',Number.isFinite(v.number)?'verse-number':'verse-label',label));

    const audio=makeAudioWrap(v.audio,v.audioLabel||'', 'verse-audio');
    if(audio) head.appendChild(audio);
    card.appendChild(head);

    card.appendChild(makeScriptPair(v,{verified:true}));
    addMeaning(card,v);
    grid.appendChild(card);
  });
  root.appendChild(grid);
}

function renderExtraSection(sec){
  let root=document.getElementById(sec.id);
  if(!root){
    root=el('section','section');
    root.id=sec.id;
    const noResults=$('#noResults');
    const main=$('main');
    main.insertBefore(root,noResults||null);
  }
  root.innerHTML='';
  root.appendChild(el('h2','section-title',sec.title||sec.id));
  if(sec.subtitle) root.appendChild(el('div','chapter-subtitle',sec.subtitle));
  const grid=el('div','verse-grid');
  (sec.verses||[]).forEach(v=>{
    const card=el('div','verse searchable');
    card.id=v.id||'';
    const head=el('div','verse-head');
    head.appendChild(el('span','verse-number',v.label||('Shloka '+(v.number??''))));
    const audio=makeAudioWrap(
      v.audio ? {src:v.audio,type:v.audioType||'audio/mpeg'} : null,
      '',
      'verse-audio'
    );
    if(audio) head.appendChild(audio);
    card.appendChild(head);
    card.appendChild(makeScriptPair({
      ...v,
      roman:Array.isArray(v.roman)?v.roman.join('\n'):v.roman,
      iast:Array.isArray(v.iast)?v.iast.join('\n'):v.iast,
      devanagari:Array.isArray(v.devanagari)?v.devanagari.join('\n'):v.devanagari
    },{verified:true}));
    addMeaning(card,v);
    grid.appendChild(card);
  });
  root.appendChild(grid);
}

async function loadJSON(url){
  const res=await fetch(url,{cache:'no-store'});
  if(!res.ok) throw new Error(url+' returned '+res.status);
  return res.json();
}

async function renderCollection(){
  const [opening,herbs,ch11,ch12]=await Promise.all([
    loadJSON('data/opening.json'),
    loadJSON('data/herbs.json'),
    loadJSON('data/chapter-11.json'),
    loadJSON('data/chapter-12.json')
  ]);
  renderOpening($('#opening'),opening);
  renderHerbs($('#herbs'),herbs);
  renderChapter($('#doshaadi'),ch11);
  renderChapter($('#doshabhediyam'),ch12);

  try{
    const extra=await loadJSON('data/extra-shlokas.json');
    (extra.sections||[]).forEach(renderExtraSection);
  }catch(e){
    console.warn('Optional extra shlokas were not loaded:',e);
  }
}

function fmt(sec){
  if(!Number.isFinite(sec)||sec<0) return '0:00';
  sec=Math.floor(sec);
  return Math.floor(sec/60)+':'+String(sec%60).padStart(2,'0');
}

function initAudio(){
  const audios=$$('audio');

  function syncButton(audio){
    const wrap=audio.closest('.verse-audio,.attached-audio,.chapter-audio-item');
    const btn=wrap&&$('.mobile-play',wrap);
    if(!btn) return;
    const playing=!audio.paused&&!audio.ended;
    btn.textContent=playing?'❚❚ Pause':'▶ Chanting';
    btn.classList.toggle('is-playing',playing);
  }
  function syncProgress(audio){
    const wrap=audio.closest('.verse-audio,.attached-audio,.chapter-audio-item');
    if(!wrap) return;
    const range=$('input[type="range"]',wrap);
    const elapsed=$('.audio-elapsed',wrap);
    const remaining=$('.audio-time',wrap);
    const d=audio.duration,c=audio.currentTime||0;
    if(elapsed) elapsed.textContent=fmt(c);
    if(remaining) remaining.textContent=Number.isFinite(d)?('-'+fmt(Math.max(0,d-c))):'-0:00';
    if(range&&Number.isFinite(d)&&d>0) range.value=String(Math.round(c/d*1000));
  }

  $$('.mobile-play').forEach(btn=>{
    btn.addEventListener('click',e=>{
      e.preventDefault();
      const wrap=btn.closest('.verse-audio,.attached-audio,.chapter-audio-item');
      const audio=wrap&&$('audio',wrap);
      if(!audio) return;
      audios.forEach(a=>{if(a!==audio&&!a.paused)a.pause();});
      if(audio.paused){
        const p=audio.play();
        if(p&&p.catch) p.catch(()=>{});
      }else audio.pause();
    });
  });

  audios.forEach(audio=>{
    ['loadedmetadata','durationchange','timeupdate'].forEach(ev=>audio.addEventListener(ev,()=>syncProgress(audio)));
    audio.addEventListener('play',()=>{
      audios.forEach(a=>{if(a!==audio&&!a.paused)a.pause();});
      audios.forEach(syncButton);
    });
    audio.addEventListener('pause',()=>syncButton(audio));
    audio.addEventListener('ended',()=>{syncButton(audio);syncProgress(audio);});

    const wrap=audio.closest('.verse-audio,.attached-audio,.chapter-audio-item');
    const range=wrap&&$('input[type="range"]',wrap);
    if(range){
      range.addEventListener('input',()=>{
        if(Number.isFinite(audio.duration)&&audio.duration>0){
          audio.currentTime=(Number(range.value)/1000)*audio.duration;
        }
      });
    }
    syncButton(audio);
    syncProgress(audio);
  });
}

function setNavHeight(){
  const nav=$('nav');
  document.documentElement.style.setProperty('--nav-h',(nav?Math.ceil(nav.getBoundingClientRect().height):64)+'px');
}

function sectionTop(id){
  const target=document.getElementById(id);
  if(!target) return null;
  const navH=parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nav-h'))||64;
  return Math.max(0,target.getBoundingClientRect().top+window.scrollY-navH-10);
}

function goTo(id,{smooth=true}={}){
  const y=sectionTop(id);
  if(y===null) return;
  window.scrollTo({top:y,behavior:smooth?'smooth':'auto'});
}

function initNavigation(){
  $$('nav a[href^="#"], .lookup a[href^="#"], .shloka-index a[href^="#"]').forEach(a=>{
    a.addEventListener('click',e=>{
      const id=decodeURIComponent(a.getAttribute('href').slice(1));
      if(!document.getElementById(id)) return;
      e.preventDefault();
      history.pushState(null,'','#'+id);
      goTo(id,{smooth:true});
    });
  });

  window.addEventListener('popstate',()=>{
    if(location.hash) goTo(decodeURIComponent(location.hash.slice(1)),{smooth:false});
  });
}

function routeToRequestedSection(){
  const params=new URLSearchParams(location.search);
  const requested=params.get('section') || (location.hash?decodeURIComponent(location.hash.slice(1)):'');
  if(requested && document.getElementById(requested)){
    goTo(requested,{smooth:false});
    if(params.get('section')){
      history.replaceState(null,'',location.pathname+'#'+requested);
    }
  }
  document.documentElement.classList.remove('route-loading');
}

function initChapter11Player(){
  const section=$('#doshaadi');
  const suite=section&&$('.chapter-audio-suite',section);
  if(!section||!suite) return;

  function update(){
    const navH=parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nav-h'))||64;
    const top=section.offsetTop;
    const bottom=top+section.offsetHeight;
    const y=window.scrollY+navH+8;
    const active=y>=top && y<bottom-suite.offsetHeight-16;
    suite.classList.toggle('chapter-audio-pinned',active);
    document.documentElement.style.setProperty('--chapter-audio-h',active?(suite.offsetHeight+'px'):'0px');
  }
  update();
  window.addEventListener('scroll',update,{passive:true});
  window.addEventListener('resize',update,{passive:true});
}

function initActiveIndexes(){
  ['doshaadi','doshabhediyam'].forEach(sectionId=>{
    const section=document.getElementById(sectionId);
    if(!section) return;
    const strip=$('.shloka-index-links',section);
    if(!strip) return;
    const links=$$('a[href^="#"]',strip);
    const rows=links.map(a=>({
      a,
      verse:document.getElementById(a.getAttribute('href').slice(1))
    })).filter(x=>x.verse);

    function update(){
      const navH=parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nav-h'))||64;
      const threshold=window.scrollY+navH+150;
      let active=rows[0];
      rows.forEach(row=>{
        if(row.verse.offsetTop<=threshold) active=row;
      });
      links.forEach(a=>a.classList.toggle('is-current',active&&a===active.a));
      if(active){
        const target=active.a.offsetLeft-strip.clientWidth/2+active.a.offsetWidth/2;
        strip.scrollTo({left:Math.max(0,target),behavior:'auto'});
      }
    }
    update();
    window.addEventListener('scroll',update,{passive:true});
  });
}

function clearHighlights(root=document){
  $$('mark.search-match',root).forEach(mark=>{
    mark.replaceWith(document.createTextNode(mark.textContent));
  });
  root.normalize();
}

function highlight(root,raw){
  if(!raw||!root) return;
  const q=raw.toLowerCase();
  const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{
    acceptNode(node){
      const p=node.parentElement;
      if(!p||p.closest('script,style,button,input,audio,source,mark')) return NodeFilter.FILTER_REJECT;
      return node.nodeValue.toLowerCase().includes(q)?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_REJECT;
    }
  });
  const nodes=[];
  while(walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach(node=>{
    const t=node.nodeValue,low=t.toLowerCase();
    let pos=0,idx;
    const frag=document.createDocumentFragment();
    while((idx=low.indexOf(q,pos))!==-1){
      if(idx>pos) frag.appendChild(document.createTextNode(t.slice(pos,idx)));
      const m=el('mark','search-match',t.slice(idx,idx+raw.length));
      frag.appendChild(m);
      pos=idx+raw.length;
    }
    if(pos<t.length) frag.appendChild(document.createTextNode(t.slice(pos)));
    node.replaceWith(frag);
  });
}

function initSearch(){
  const input=$('#search'),count=$('#searchCount'),noResults=$('#noResults');
  if(!input) return;

  function run(){
    clearHighlights();
    const raw=input.value.trim().toLowerCase();
    let hits=0;
    $$('.section').forEach(section=>{
      const cards=$$('.searchable',section);
      if(!raw){
        section.hidden=false;
        cards.forEach(c=>c.hidden=false);
        return;
      }
      let visible=0;
      cards.forEach(card=>{
        const ok=(card.textContent||'').toLowerCase().includes(raw) || (card.id||'').toLowerCase().includes(raw);
        card.hidden=!ok;
        if(ok){visible++;hits++;highlight(card,raw);}
      });
      const sectionTitle=(section.textContent||'').toLowerCase();
      const sectionMatch=sectionTitle.includes(raw);
      section.hidden=cards.length ? (visible===0&&!sectionMatch) : !sectionMatch;
    });
    if(count) count.textContent=raw?(hits+' match'+(hits===1?'':'es')):'';
    if(noResults) noResults.style.display=(raw&&hits===0)?'block':'none';
  }
  input.addEventListener('input',run);
  input.addEventListener('keydown',e=>{
    if(e.key==='Escape'){input.value='';run();input.blur();}
  });
}

async function init(){
  try{
    await renderCollection();
    setNavHeight();
    initAudio();
    initNavigation();
    initChapter11Player();
    initActiveIndexes();
    initSearch();

    // Layout is now complete; route exactly once and reveal.
    routeToRequestedSection();
    requestAnimationFrame(()=>routeToRequestedSection());
  }catch(err){
    console.error(err);
    document.documentElement.classList.remove('route-loading');
    const main=$('main');
    if(main){
      const msg=el('div','no-results','The collection could not be loaded. Please refresh the page.');
      msg.style.display='block';
      main.prepend(msg);
    }
  }
}

window.addEventListener('resize',setNavHeight,{passive:true});
init();
