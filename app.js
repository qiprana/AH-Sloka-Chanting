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

