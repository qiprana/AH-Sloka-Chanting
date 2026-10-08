/* ============================================================
   STRUCTURED CONTENT RENDERER
   The collection content lives in data/*.json. Render it first,
   then let the existing search/audio/sticky-index code initialize.
   ============================================================ */
function ce(tag, cls, text){
  const n=document.createElement(tag);
  if(cls) n.className=cls;
  if(text!==undefined && text!==null) n.textContent=String(text);
  return n;
}
function addAudio(parent, audio, label, kind){
  if(!audio || !audio.src) return;
  const wrap=ce('div',kind);
  if(label) wrap.appendChild(ce('span','chant-label',label));
  if(kind==='attached-audio' || kind==='chapter-audio-item'){
    const b=ce('button','mobile-play','▶ Chanting');
    b.type='button';
    b.setAttribute('aria-label','Play chanting '+(label||'Chanting'));
    wrap.appendChild(b);
  }
  const a=document.createElement('audio');
  a.controls=true;
  a.preload=kind==='verse-audio'?'none':'metadata';
  const src=document.createElement('source');
  src.src=audio.src;
  if(audio.type) src.type=audio.type;
  a.appendChild(src);
  wrap.appendChild(a);
  parent.appendChild(wrap);
}
function addSource(parent, value){
  if(value) parent.appendChild(ce('div','source-attribution',value));
}
function makeScriptPair(item, opts={}){
  const pair=ce('div','script-pair');
  if(opts.wrapRoman){
    const rw=ce('div','roman-wrap');
    rw.appendChild(ce('div','roman-reading-label','Simplified English / Phonetic'));
    rw.appendChild(ce('pre','',item.roman||''));
    addSource(rw,item.sourceRoman);
    pair.appendChild(rw);
  }else{
    pair.appendChild(ce('pre','',item.roman||''));
  }

  const dw=ce('div',(opts.verified?'chapter-source-verified ':'')+'devanagari-wrap');
  dw.appendChild(ce('div','devanagari-label','Devanagari'));
  dw.appendChild(ce('pre','devanagari-text',item.devanagari||''));
  addSource(dw,item.sourceDevanagari);
  pair.appendChild(dw);

  if(item.iast){
    const iw=ce('div','iast-transliteration');
    iw.appendChild(ce('div','iast-label','IAST'));
    iw.appendChild(ce('div','iast-text',item.iast));
    pair.appendChild(iw);
  }
  return pair;
}
function renderOpening(root,data){
  root.innerHTML='';
  root.appendChild(ce('h2','section-title',data.title||'Invocations & Foundational Shlokas'));
  const items=data.items||[];
  const invocation=items.find(x=>x.kind==='invocation');
  if(invocation){
    const card=ce('div','intro-card searchable');
    addAudio(card,invocation.audio,invocation.audioLabel||'Dhanvantari Invocation','attached-audio');
    if(invocation.title) card.appendChild(ce('div','shloka-title',invocation.title));
    card.appendChild(makeScriptPair(invocation,{wrapRoman:true}));
    root.appendChild(card);
  }
  const generals=items.filter(x=>x.kind!=='invocation');
  if(generals.length){
    root.appendChild(ce('h3','general-shlokas-title','General Shlokas'));
    generals.forEach(item=>{
      const card=ce('div','intro-card general-shloka searchable');
      if(item.id) card.id=item.id;
      card.appendChild(makeScriptPair(item,{wrapRoman:true}));
      root.appendChild(card);
    });
  }
}
function renderHerbs(root,data){
  root.innerHTML='';
  root.appendChild(ce('h2','section-title',data.title||'Herbs'));
  const lookup=ce('div','lookup');
  lookup.appendChild(ce('h3','','Quick Herb Lookup'));
  const links=ce('div','lookup-links');
  (data.items||[]).forEach(item=>{
    const a=ce('a','',item.title||item.id);
    a.href='#'+item.id;
    links.appendChild(a);
  });
  lookup.appendChild(links); root.appendChild(lookup);

  const grid=ce('div','herb-grid');
  (data.items||[]).forEach(item=>{
    const card=ce('article','card herb-card searchable'); card.id=item.id||'';
    const head=ce('div','herb-head');
    head.appendChild(ce('h3','',item.title||item.id));
    addAudio(head,item.audio,item.audioLabel||'Chanting','attached-audio');
    card.appendChild(head);
    card.appendChild(makeScriptPair(item,{wrapRoman:true}));
    grid.appendChild(card);
  });
  root.appendChild(grid);
}
function renderChapter(root,data){
  root.innerHTML='';
  root.appendChild(ce('h2','section-title',data.title||('Chapter '+data.chapter)));
  if(data.subtitle) root.appendChild(ce('div','chapter-subtitle',data.subtitle));
  if(data.note) root.appendChild(ce('div','devanagari-source-note',data.note));

  if((data.chapterAudio||[]).length){
    const suite=ce('div','chapter-audio-suite');
    suite.appendChild(ce('h3','',data.chapter===11?'Chapter 11 Chanting':'Chapter Chanting'));
    const items=ce('div','chapter-audio-items');
    data.chapterAudio.forEach(x=>addAudio(items,x.audio,x.label,'chapter-audio-item'));
    suite.appendChild(items); root.appendChild(suite);
  }

  const numbered=(data.verses||[]).filter(v=>Number.isFinite(v.number));
  if(numbered.length){
    const index=ce('div','shloka-index'); index.id=data.id+'-index';
    index.appendChild(ce('h3','','Shloka Index'));
    const links=ce('div','shloka-index-links');
    numbered.forEach(v=>{
      const a=ce('a','',v.number); a.href='#'+v.id; links.appendChild(a);
    });
    index.appendChild(links); root.appendChild(index);
    root.appendChild(ce('p','audio-ready-note','Chanting audio is available beside the shlokas where a recording has been provided.'));
  }

  const grid=ce('div','verse-grid');
  (data.verses||[]).forEach(v=>{
    let cls='verse searchable';
    if(v.kind==='introduction') cls+=' intro-verse';
    else if(v.kind==='note') cls+=' note-verse';
    else if(v.kind==='closing') cls+=' closing-verse';
    const card=ce('div',cls); card.id=v.id||'';

    const head=ce('div','verse-head');
    if(Number.isFinite(v.number)) head.appendChild(ce('span','verse-number','Shloka '+v.number));
    else head.appendChild(ce('span','verse-label',v.label||v.kind||''));
    const audioWrap=ce('span','verse-audio');
    if(v.audio && v.audio.src){
      if(v.audioLabel) audioWrap.appendChild(ce('span','chant-label',v.audioLabel));
      const a=document.createElement('audio'); a.controls=true; a.preload='none';
      const src=document.createElement('source'); src.src=v.audio.src; if(v.audio.type)src.type=v.audio.type;
      a.appendChild(src); audioWrap.appendChild(a);
    }else{
      audioWrap.dataset.audioSlot='true';
    }
    head.appendChild(audioWrap); card.appendChild(head);
    card.appendChild(makeScriptPair(v,{verified:v.kind!=='closing'}));
    grid.appendChild(card);
  });
  root.appendChild(grid);
}
async function renderStructuredCollection(){
  const specs=[
    ['opening','data/opening.json','opening'],
    ['herbs','data/herbs.json','herbs'],
    ['doshaadi','data/chapter-11.json','chapter'],
    ['doshabhediyam','data/chapter-12.json','chapter']
  ];
  for(const [id,url,type] of specs){
    const root=document.getElementById(id);
    if(!root) continue;
    const res=await fetch(url,{cache:'no-store'});
    if(!res.ok) throw new Error('Could not load '+url+' ('+res.status+')');
    const data=await res.json();
    if(type==='opening') renderOpening(root,data);
    else if(type==='herbs') renderHerbs(root,data);
    else renderChapter(root,data);
  }
}
try{
  await renderStructuredCollection();
}catch(err){
  console.error('Structured collection render failed:',err);
  const main=document.querySelector('main');
  if(main){
    const msg=ce('div','no-results','The collection data could not be loaded. Please refresh the page.');
    msg.style.display='block';
    main.prepend(msg);
  }
}

/* Extracted from index.html to make the site easier to maintain. */

(function(){
  var search=document.getElementById('search');
  var noResults=document.getElementById('noResults');
  var countEl=document.getElementById('searchCount');
  if(!search) return;
  var sections=Array.prototype.slice.call(document.querySelectorAll('main section'));

  function fold(s){
    s=String(s||'').toLowerCase();
    try{s=s.normalize('NFD').replace(/[\u0300-\u036f]/g,'');}catch(e){}
    return s.replace(/[–—]/g,'-').replace(/[^a-z0-9\u0900-\u097f]+/g,' ').replace(/\s+/g,' ').trim();
  }
  function aliases(section){
    var a=[];
    var h=section.querySelector('.section-title, h2');
    var sub=section.querySelector('.chapter-subtitle');
    if(h) a.push(h.textContent||'');
    if(sub) a.push(sub.textContent||'');
    a.push(section.id||'');
    if(section.id==='doshaadi') a.push('dosha doshaadi doshaadi vignyaaneeyam chapter 11 11th chapter ashtanga hridayam');
    if(section.id==='doshabhediyam') a.push('dosha doshabhediyam dosha bhediyam chapter 12 12th chapter ashtanga hridayam');
    if(section.id==='herbs') a.push('herb herbs');
    if(section.id==='reading-guide') a.push('how to read pronunciation alphabet varnamala');
    return fold(a.join(' '));
  }
  function removeHighlights(root){
    var spans=(root||document).querySelectorAll('span.search-match');
    Array.prototype.forEach.call(spans,function(span){
      var p=span.parentNode;if(!p)return;
      p.replaceChild(document.createTextNode(span.textContent),span);p.normalize();
    });
  }
  function highlightLiteral(root,raw){
    if(!root||!raw)return 0;
    var q=raw.toLowerCase(),made=0;
    var walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode:function(node){
      var p=node.parentElement;if(!p)return NodeFilter.FILTER_REJECT;
      if(p.closest('script,style,audio,button,input,source'))return NodeFilter.FILTER_REJECT;
      if(p.classList.contains('search-match'))return NodeFilter.FILTER_REJECT;
      return node.nodeValue&&node.nodeValue.toLowerCase().indexOf(q)!==-1?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_REJECT;
    }});
    var nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);
    nodes.forEach(function(node){
      var text=node.nodeValue,low=text.toLowerCase(),pos=0,frag=document.createDocumentFragment(),idx;
      while((idx=low.indexOf(q,pos))!==-1){
        if(idx>pos)frag.appendChild(document.createTextNode(text.slice(pos,idx)));
        var m=document.createElement('span');m.className='search-match';m.textContent=text.slice(idx,idx+raw.length);frag.appendChild(m);made++;pos=idx+raw.length;
      }
      if(pos<text.length)frag.appendChild(document.createTextNode(text.slice(pos)));
      node.parentNode.replaceChild(frag,node);
    });
    return made;
  }
  function reset(){
    removeHighlights(document);
    sections.forEach(function(section){
      section.hidden=false;section.classList.remove('search-section-hidden');
      Array.prototype.forEach.call(section.querySelectorAll('.searchable'),function(card){card.hidden=false;card.classList.remove('hidden','search-hit');});
    });
    if(noResults)noResults.style.display='none';
    if(countEl)countEl.textContent='';
  }
  function runSearch(){
    removeHighlights(document);
    var raw=(search.value||'').trim(),q=fold(raw);
    if(!q){reset();return;}
    var cardHits=0,sectionHits=0;
    sections.forEach(function(section){
      var cards=Array.prototype.slice.call(section.querySelectorAll('.searchable'));
      var sectionMatch=aliases(section).indexOf(q)!==-1;
      var visibleCards=0;
      cards.forEach(function(card){
        var hay=fold((card.textContent||'')+' '+(card.id||'')+' '+aliases(section));
        var ok=sectionMatch||hay.indexOf(q)!==-1;
        card.hidden=!ok;card.classList.toggle('hidden',!ok);card.classList.toggle('search-hit',ok);
        if(ok){visibleCards++;cardHits++;highlightLiteral(card,raw);}
      });
      var visible=cards.length?visibleCards>0:(sectionMatch||fold(section.textContent||'').indexOf(q)!==-1);
      section.hidden=!visible;section.classList.toggle('search-section-hidden',!visible);
      if(visible){sectionHits++;highlightLiteral(section.querySelector('.section-title, h2'),raw);}
    });
    Array.prototype.forEach.call(document.querySelectorAll('nav a'),function(a){if(fold(a.textContent).indexOf(q)!==-1)highlightLiteral(a,raw);});
    if(noResults)noResults.style.display=(cardHits||sectionHits)?'none':'block';
    if(countEl)countEl.textContent=(cardHits||sectionHits)?(cardHits+' match'+(cardHits===1?'':'es')):'No matches';
  }
  search.addEventListener('input',runSearch);
  search.addEventListener('search',runSearch);
  search.addEventListener('change',runSearch);
  search.addEventListener('keydown',function(e){
    if(e.key==='Escape'){search.value='';reset();search.blur();}
    else if(e.key==='Enter'){
      var first=document.querySelector('main .search-hit:not([hidden]), main span.search-match');
      if(first){e.preventDefault();first.scrollIntoView({behavior:'smooth',block:'center'});}
    }
  });
  window.addEventListener('pageshow',runSearch);
})();

/* ---- next original script block ---- */

(function(){
  const root=document.documentElement;
  const nav=document.querySelector('nav');
  function setNavHeight(){
    const h=nav ? Math.ceil(nav.getBoundingClientRect().height) : 64;
    root.style.setProperty('--nav-h', h+'px');
  }
  setNavHeight();
  window.addEventListener('resize', setNavHeight, {passive:true});
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(setNavHeight);

  const sections=['doshaadi','doshabhediyam'];
  sections.forEach(sectionId=>{
    const section=document.getElementById(sectionId);
    if(!section) return;
    const index=section.querySelector('.shloka-index');
    if(!index) return;
    const links=[...index.querySelectorAll('a[href^="#"]')];
    const byId=new Map(links.map(a=>[a.getAttribute('href').slice(1),a]));
    const verses=[...section.querySelectorAll('.verse[id]')].filter(v=>byId.has(v.id));
    if(!verses.length) return;
    const observer=new IntersectionObserver(entries=>{
      const visible=entries.filter(e=>e.isIntersecting).sort((a,b)=>a.boundingClientRect.top-b.boundingClientRect.top);
      if(!visible.length) return;
      const active=byId.get(visible[0].target.id);
      if(!active) return;
      links.forEach(a=>a.classList.toggle('is-current',a===active));
      active.scrollIntoView({block:'nearest',inline:'center',behavior:'smooth'});
    },{rootMargin:'-25% 0px -62% 0px',threshold:[0,0.01]});
    verses.forEach(v=>observer.observe(v));
  });
})();

/* ---- next original script block ---- */

(function(){
 function setLabel(btn,a){btn.textContent=a.paused?'▶ Play Chanting':'❚❚ Pause';btn.classList.toggle('is-playing',!a.paused)}
 function init(){
  document.querySelectorAll('.verse-audio audio').forEach(function(a){
   a.setAttribute('preload','metadata');
   var wrap=a.closest('.verse-audio'); if(!wrap||wrap.querySelector('.mobile-play'))return;
   var b=document.createElement('button'); b.type='button'; b.className='mobile-play'; b.textContent='▶ Play Chanting';
   var help=document.createElement('span'); help.className='audio-help'; help.textContent='If the player below is hidden by your phone, use Play Chanting.';
   wrap.insertBefore(b,a); wrap.appendChild(help);
   b.addEventListener('click',function(){
    document.querySelectorAll('.verse-audio audio').forEach(function(o){if(o!==a&&!o.paused)o.pause()});
    if(a.paused){var p=a.play(); if(p&&p.catch)p.catch(function(){a.controls=true; help.textContent='Your phone blocked embedded playback. Tap the native player below.';});} else a.pause();
   });
   a.addEventListener('play',function(){setLabel(b,a)});a.addEventListener('pause',function(){setLabel(b,a)});a.addEventListener('ended',function(){setLabel(b,a)});
  });
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init); else init();
})();

/* ---- next original script block ---- */

(function(){
  const stopOthers = (current) => {
    document.querySelectorAll('audio').forEach(a => { if(a!==current && !a.paused){ a.pause(); } });
    document.querySelectorAll('.mobile-play').forEach(b=>{ if(b._audio!==current) b.textContent='▶ Play'; });
  };
  document.addEventListener('play', function(e){ if(e.target && e.target.tagName==='AUDIO') stopOthers(e.target); }, true);
  document.querySelectorAll('.attached-audio,.chapter-audio-item,.verse-audio').forEach(wrap=>{
    const btn=wrap.querySelector('.mobile-play'); const audio=wrap.querySelector('audio');
    if(!btn || !audio) return; btn._audio=audio;
    btn.addEventListener('click', async ()=>{
      stopOthers(audio);
      if(audio.paused){ try{ await audio.play(); btn.textContent='❚❚ Pause'; }catch(e){ btn.textContent='▶ Play'; } }
      else{ audio.pause(); btn.textContent='▶ Play'; }
    });
    audio.addEventListener('pause',()=>btn.textContent='▶ Play');
    audio.addEventListener('ended',()=>btn.textContent='▶ Play');
    audio.addEventListener('play',()=>btn.textContent='❚❚ Pause');
  });
})();

/* ---- next original script block ---- */

(function(){
  function sync(){
    document.querySelectorAll('audio').forEach(function(a){
      var wrap=a.closest('.attached-audio,.verse-audio,.chapter-audio-item');
      if(!wrap)return;
      var b=wrap.querySelector('.mobile-play');
      if(b)b.textContent=a.paused?'▶ Play Chanting':'❚❚ Pause';
    });
  }
  document.addEventListener('play',function(e){
    if(!e.target||e.target.tagName!=='AUDIO')return;
    document.querySelectorAll('audio').forEach(function(a){if(a!==e.target&&!a.paused)a.pause();});
    sync();
  },true);
  document.addEventListener('pause',function(e){if(e.target&&e.target.tagName==='AUDIO')sync();},true);
  document.addEventListener('ended',function(e){if(e.target&&e.target.tagName==='AUDIO')sync();},true);
})();

/* ---- next original script block ---- */

document.addEventListener('DOMContentLoaded', function(){
  const audios=[...document.querySelectorAll('audio')];
  function syncButtons(){
    document.querySelectorAll('.mobile-play').forEach(btn=>{
      const box=btn.closest('.verse-audio,.attached-audio,.chapter-audio-item');
      const a=box && box.querySelector('audio');
      if(!a) return;
      const playing=!a.paused && !a.ended;
      btn.textContent=playing?'❚❚ Pause':'▶ Chanting';
      btn.classList.toggle('is-playing',playing);
    });
  }
  audios.forEach(a=>{
    a.addEventListener('play',()=>{audios.forEach(o=>{if(o!==a&&!o.paused)o.pause();});syncButtons();});
    a.addEventListener('pause',syncButtons);
    a.addEventListener('ended',syncButtons);
  });
  document.querySelectorAll('.mobile-play').forEach(btn=>{
    btn.addEventListener('click',function(e){
      e.preventDefault();
      const box=btn.closest('.verse-audio,.attached-audio,.chapter-audio-item');
      const a=box && box.querySelector('audio');
      if(!a) return;
      if(a.paused){ const p=a.play(); if(p&&p.catch)p.catch(()=>{}); } else { a.pause(); }
    });
  });
  syncButtons();
});

/* ---- next original script block ---- */

(function(){
  function allAudio(){ return Array.from(document.querySelectorAll('audio')); }
  function buttonAudio(btn){
    var box=btn.closest('.verse-audio,.attached-audio,.chapter-audio-item');
    return box ? box.querySelector('audio') : null;
  }
  function sync(){
    document.querySelectorAll('.mobile-play').forEach(function(btn){
      var a=buttonAudio(btn);
      if(!a) return;
      var playing=!a.paused && !a.ended;
      btn.textContent=playing?'❚❚ Pause':'▶ Chanting';
      btn.classList.toggle('is-playing',playing);
      btn.setAttribute('aria-pressed', playing ? 'true' : 'false');
    });
  }
  // Capture phase deliberately takes ownership before older accumulated handlers.
  document.addEventListener('click',function(e){
    var btn=e.target.closest && e.target.closest('.mobile-play');
    if(!btn) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    var a=buttonAudio(btn);
    if(!a) return;
    allAudio().forEach(function(o){ if(o!==a && !o.paused) o.pause(); });
    if(a.paused){
      var promise=a.play();
      if(promise && promise.catch){
        promise.catch(function(){
          a.controls=true;
          a.style.position='static';
          a.style.width='100%';
          a.style.height='38px';
          a.style.opacity='1';
          a.style.pointerEvents='auto';
        });
      }
    } else {
      a.pause();
    }
    setTimeout(sync,0);
  },true);
  document.addEventListener('play',function(e){
    if(e.target && e.target.tagName==='AUDIO'){
      allAudio().forEach(function(o){ if(o!==e.target && !o.paused) o.pause(); });
      sync();
    }
  },true);
  document.addEventListener('pause',function(e){ if(e.target&&e.target.tagName==='AUDIO') sync(); },true);
  document.addEventListener('ended',function(e){ if(e.target&&e.target.tagName==='AUDIO') sync(); },true);
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',sync); else sync();
})();


/* ============================================================
   DATA-DRIVEN EXTENSIONS
   Add future shlokas in data/extra-shlokas.json instead of
   editing index.html. Existing content remains untouched.
   ============================================================ */
(function(){
  function el(tag, cls, text){
    const n=document.createElement(tag);
    if(cls) n.className=cls;
    if(text!==undefined) n.textContent=text;
    return n;
  }
  function renderVerse(v){
    const card=el('article','verse searchable');
    if(v.id) card.id=v.id;

    const head=el('div','verse-head');
    head.appendChild(el('span','verse-number',v.label || (v.number ? 'Shloka '+v.number : 'Shloka')));
    if(v.audio){
      const wrap=el('div','verse-audio');
      const btn=el('button','mobile-play','▶ Chanting'); btn.type='button';
      const audio=document.createElement('audio'); audio.preload='metadata';
      const source=document.createElement('source'); source.src=v.audio; source.type=v.audioType || 'audio/mpeg';
      audio.appendChild(source); wrap.append(btn,audio); head.appendChild(wrap);
      btn.addEventListener('click',function(e){
        e.preventDefault();
        document.querySelectorAll('audio').forEach(a=>{if(a!==audio&&!a.paused)a.pause();});
        if(audio.paused){audio.play().catch(()=>{});} else audio.pause();
      });
      const sync=()=>{btn.textContent=(!audio.paused&&!audio.ended)?'❚❚ Pause':'▶ Chanting';};
      audio.addEventListener('play',sync); audio.addEventListener('pause',sync); audio.addEventListener('ended',sync);
    }
    card.appendChild(head);

    const pair=el('div','script-pair');
    const romanCol=el('div','roman-column');
    const roman=el('pre','roman-text',Array.isArray(v.roman)?v.roman.join('\n'):String(v.roman||''));
    romanCol.appendChild(roman);
    if(v.iast){
      const iast=el('div','iast-block');
      iast.appendChild(el('div','iast-label','IAST'));
      iast.appendChild(el('div','iast-text',Array.isArray(v.iast)?v.iast.join('\n'):String(v.iast)));
      romanCol.appendChild(iast);
    }
    if(v.sourceRoman) romanCol.appendChild(el('div','source-attribution',v.sourceRoman));

    const devWrap=el('div','devanagari-wrap');
    devWrap.appendChild(el('div','devanagari-label','Devanagari'));
    devWrap.appendChild(el('div','devanagari-text',Array.isArray(v.devanagari)?v.devanagari.join('\n'):String(v.devanagari||'')));
    if(v.sourceDevanagari) devWrap.appendChild(el('div','source-attribution',v.sourceDevanagari));
    pair.append(romanCol,devWrap);
    card.appendChild(pair);

    if(v.meaning){
      const meaning=el('div','simple-meaning');
      meaning.appendChild(el('div','simple-meaning-label','Simple Meaning'));
      meaning.appendChild(el('div','simple-meaning-body',v.meaning));
      card.appendChild(meaning);
    }
    return card;
  }

  async function loadExtraShlokas(){
    try{
      const res=await fetch('data/extra-shlokas.json',{cache:'no-store'});
      if(!res.ok) return;
      const data=await res.json();
      (data.sections||[]).forEach(sec=>{
        let section=document.getElementById(sec.id);
        if(!section){
          section=el('section','section'); section.id=sec.id;
          section.appendChild(el('h2','section-title',sec.title||sec.id));
          if(sec.subtitle) section.appendChild(el('p','chapter-subtitle',sec.subtitle));
          const grid=el('div','verse-grid'); grid.dataset.generated='true'; section.appendChild(grid);
          document.querySelector('main').appendChild(section);
          const nav=document.querySelector('.nav-inner');
          if(nav && !nav.querySelector('a[href="#'+sec.id+'"]')){
            const a=document.createElement('a'); a.href='#'+sec.id; a.textContent=sec.navLabel||sec.title||sec.id;
            const search=nav.querySelector('#search'); nav.insertBefore(a,search||null);
          }
        }
        let grid=section.querySelector('.verse-grid');
        if(!grid){grid=el('div','verse-grid');section.appendChild(grid);}
        (sec.verses||[]).forEach(v=>grid.appendChild(renderVerse(v)));
      });
    }catch(err){
      console.warn('Optional extra shloka data was not loaded:',err);
    }
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',loadExtraShlokas);
  else loadExtraShlokas();
})();



/* ===== Unified audio progress / seek controls and sticky Chapter 11 sizing ===== */
(function(){
  function fmt(sec){
    if(!Number.isFinite(sec)||sec<0) return '0:00';
    sec=Math.floor(sec);
    var m=Math.floor(sec/60), s=sec%60;
    return m+':'+String(s).padStart(2,'0');
  }
  function initAudioProgress(){
    document.querySelectorAll('audio').forEach(function(a){
      var wrap=a.closest('.attached-audio,.verse-audio,.chapter-audio-item');
      if(!wrap || wrap.querySelector('.audio-progress')) return;

      var box=document.createElement('div'); box.className='audio-progress';
      var elapsed=document.createElement('span'); elapsed.className='audio-elapsed'; elapsed.textContent='0:00';
      var range=document.createElement('input'); range.type='range'; range.min='0'; range.max='1000'; range.value='0'; range.step='1';
      range.setAttribute('aria-label','Audio position');
      var remaining=document.createElement('span'); remaining.className='audio-time'; remaining.textContent='-0:00';
      box.append(elapsed,range,remaining); wrap.appendChild(box);

      function sync(){
        var d=a.duration, c=a.currentTime||0;
        elapsed.textContent=fmt(c);
        remaining.textContent=Number.isFinite(d)?('-'+fmt(Math.max(0,d-c))):'-0:00';
        if(Number.isFinite(d)&&d>0) range.value=String(Math.round((c/d)*1000));
      }
      a.addEventListener('loadedmetadata',sync);
      a.addEventListener('durationchange',sync);
      a.addEventListener('timeupdate',sync);
      a.addEventListener('ended',sync);
      range.addEventListener('input',function(){
        if(Number.isFinite(a.duration)&&a.duration>0) a.currentTime=(Number(range.value)/1000)*a.duration;
      });
      sync();
    });
  }
  function sizeStickyAudio(){
    var suite=document.querySelector('#doshaadi .chapter-audio-suite');
    var h=suite?Math.ceil(suite.getBoundingClientRect().height):0;
    document.documentElement.style.setProperty('--chapter-audio-h',h+'px');
  }
  function init(){
    initAudioProgress();
    sizeStickyAudio();
    window.addEventListener('resize',sizeStickyAudio,{passive:true});
    if(document.fonts&&document.fonts.ready) document.fonts.ready.then(sizeStickyAudio);
    setTimeout(sizeStickyAudio,150);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init); else init();
})();
