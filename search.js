const $=(selector,root=document)=>root.querySelector(selector);

function fold(value){
  let text=String(value||'').toLowerCase();
  try{
    text=text.normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  }catch(e){}
  return text.replace(/[–—]/g,'-').replace(/\s+/g,' ').trim();
}

function foldChar(ch){
  let value=String(ch||'').toLowerCase();
  try{
    value=value.normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  }catch(e){}
  if(value==='–'||value==='—') value='-';
  return value;
}

function termsFor(query){
  return fold(query).split(' ').filter(Boolean);
}

function field(label,text){
  const value=String(text||'').trim();
  return value?{label,text:value,folded:fold(value)}:null;
}

function fieldsFor(item,title){
  return [
    field('Title',title),
    field('Simplified',item.roman),
    field('Devanagari',item.devanagari),
    field('IAST',item.iast),
    field('Meaning',item.meaning),
    field('Source',[item.sourceRoman,item.sourceDevanagari].filter(Boolean).join(' '))
  ].filter(Boolean);
}

function countTerm(text,term){
  if(!text||!term) return 0;
  let count=0;
  let pos=0;
  while(true){
    const found=text.indexOf(term,pos);
    if(found===-1) break;
    count++;
    pos=found+Math.max(1,term.length);
  }
  return count;
}

function countOccurrences(record,terms){
  let total=0;
  record.fields.forEach(f=>{
    terms.forEach(term=>{ total+=countTerm(f.folded,term); });
  });
  return total;
}

function matchesRecord(record,terms){
  return terms.every(term=>record.fields.some(f=>f.folded.includes(term)));
}

function phraseScore(record,query){
  const phrase=fold(query);
  if(!phrase) return 0;
  let score=0;
  record.fields.forEach((f,index)=>{
    const count=countTerm(f.folded,phrase);
    if(count) score+=count*(index===0?30:12);
  });
  return score;
}

function foldWithMap(value){
  const text=String(value||'');
  let folded='';
  const map=[];
  let originalIndex=0;

  for(const ch of text){
    const part=foldChar(ch);
    for(const out of part){
      folded+=out;
      map.push(originalIndex);
    }
    originalIndex+=ch.length;
  }

  return {text,folded,map};
}

function matchRanges(value,terms){
  const info=foldWithMap(value);
  const ranges=[];

  terms.forEach(term=>{
    let pos=0;
    while(term && pos<info.folded.length){
      const found=info.folded.indexOf(term,pos);
      if(found===-1) break;

      const start=info.map[found];
      const next=found+term.length;
      const end=next<info.map.length?info.map[next]:info.text.length;
      if(Number.isFinite(start)&&Number.isFinite(end)&&end>start){
        ranges.push([start,end]);
      }
      pos=found+Math.max(1,term.length);
    }
  });

  ranges.sort((a,b)=>a[0]-b[0]||b[1]-a[1]);
  const merged=[];
  ranges.forEach(range=>{
    const last=merged[merged.length-1];
    if(last&&range[0]<=last[1]){
      last[1]=Math.max(last[1],range[1]);
    }else{
      merged.push(range.slice());
    }
  });
  return merged;
}

function appendHighlighted(parent,value,terms){
  const text=String(value||'');
  const ranges=matchRanges(text,terms);
  if(!ranges.length){
    parent.appendChild(document.createTextNode(text));
    return;
  }

  let pos=0;
  ranges.forEach(([start,end])=>{
    if(start>pos) parent.appendChild(document.createTextNode(text.slice(pos,start)));
    const mark=document.createElement('mark');
    mark.className='search-match';
    mark.textContent=text.slice(start,end);
    parent.appendChild(mark);
    pos=end;
  });
  if(pos<text.length) parent.appendChild(document.createTextNode(text.slice(pos)));
}

function contextText(value,terms){
  const text=String(value||'').replace(/\s+/g,' ').trim();
  if(text.length<=280) return text;

  const ranges=matchRanges(text,terms);
  if(!ranges.length) return text.slice(0,260)+'…';

  const windows=ranges.map(([start,end])=>[
    Math.max(0,start-45),
    Math.min(text.length,end+55)
  ]);

  const merged=[];
  windows.forEach(window=>{
    const last=merged[merged.length-1];
    if(last&&window[0]<=last[1]+12){
      last[1]=Math.max(last[1],window[1]);
    }else{
      merged.push(window.slice());
    }
  });

  return merged.map(([start,end])=>
    (start>0?'…':'')+text.slice(start,end)+(end<text.length?'…':'')
  ).join(' ');
}

let indexPromise=null;

async function loadJson(path){
  const response=await fetch(path,{cache:'no-store'});
  if(!response.ok) throw new Error(path+' '+response.status);
  return response.json();
}

function makeRecord(section,title,href,item){
  return {
    section,
    title,
    href,
    fields:fieldsFor(item,title)
  };
}

function buildIndex(){
  if(indexPromise) return indexPromise;

  indexPromise=Promise.all([
    loadJson('data/opening.json'),
    loadJson('data/herbs.json'),
    loadJson('data/chapter-11.json'),
    loadJson('data/chapter-12.json'),
    fetch('guide.html',{cache:'no-store'}).then(r=>r.ok?r.text():'')
  ]).then(([opening,herbs,ch11,ch12,guideHtml])=>{
    const records=[];

    (opening.items||[]).forEach((item,i)=>{
      const title=item.title || (item.kind==='invocation'?'Dhanvantari Japa':'Foundational Shloka '+i);
      records.push(makeRecord(
        'Invocations & Foundational Shlokas',
        title,
        'foundational.html#'+(item.id||'opening'),
        item
      ));
    });

    (herbs.items||[]).forEach(item=>{
      records.push(makeRecord('Herbs',item.title||item.id,'herbs.html#'+item.id,item));
    });

    (ch11.verses||[]).forEach(item=>{
      const title=Number.isFinite(item.number)?'Shloka '+item.number:(item.label||'Chapter 11');
      records.push(makeRecord(
        'Doshaadi Vignyaaneeyam · Chapter 11',
        title,
        'chapter-11.html#'+item.id,
        item
      ));
    });

    (ch12.verses||[]).forEach(item=>{
      const title=Number.isFinite(item.number)?'Shloka '+item.number:(item.label||'Chapter 12');
      records.push(makeRecord(
        'Doshabhediyam · Chapter 12',
        title,
        'chapter-12.html#'+item.id,
        item
      ));
    });

    if(guideHtml){
      const doc=new DOMParser().parseFromString(guideHtml,'text/html');
      const main=doc.querySelector('main');
      const text=main?main.textContent:'';
      records.push({
        section:'Reading Guide',
        title:'How to Read the Romanized Sanskrit',
        href:'guide.html',
        fields:[
          field('Title','How to Read the Romanized Sanskrit'),
          field('Guide',text)
        ].filter(Boolean)
      });
    }

    return records;
  }).catch(err=>{
    indexPromise=null;
    throw err;
  });

  return indexPromise;
}

function destinationHref(href,query){
  const hashAt=href.indexOf('#');
  const base=hashAt===-1?href:href.slice(0,hashAt);
  const hash=hashAt===-1?'':href.slice(hashAt);
  return base+'?q='+encodeURIComponent(query)+hash;
}

function matchingFields(record,terms){
  return record.fields
    .map(f=>({
      label:f.label,
      text:f.text,
      count:terms.reduce((total,term)=>total+countTerm(f.folded,term),0)
    }))
    .filter(f=>f.count>0);
}

function renderResults(panel,countEl,records,query){
  const terms=termsFor(query);
  const results=records
    .filter(record=>matchesRecord(record,terms))
    .map(record=>({
      ...record,
      occurrences:countOccurrences(record,terms),
      score:phraseScore(record,query),
      matchedFields:matchingFields(record,terms)
    }))
    .sort((a,b)=>b.score-a.score || b.occurrences-a.occurrences || a.title.localeCompare(b.title));

  panel.innerHTML='';

  const totalOccurrences=results.reduce((sum,result)=>sum+result.occurrences,0);
  if(countEl) countEl.textContent=results.length?String(totalOccurrences):'0';

  if(!results.length){
    const empty=document.createElement('div');
    empty.className='site-search-empty';
    empty.textContent='No exact content matches found.';
    panel.appendChild(empty);
    panel.hidden=false;
    return;
  }

  const summary=document.createElement('div');
  summary.className='site-search-summary';
  summary.textContent=totalOccurrences+' occurrence'+(totalOccurrences===1?'':'s')+
    ' across '+results.length+' result'+(results.length===1?'':'s');
  panel.appendChild(summary);

  const list=document.createElement('div');
  list.className='site-search-list';

  results.slice(0,18).forEach(result=>{
    const link=document.createElement('a');
    link.className='site-search-result';
    link.href=destinationHref(result.href,query);

    const top=document.createElement('div');
    top.className='site-search-result-top';

    const title=document.createElement('span');
    title.className='site-search-result-title';
    appendHighlighted(title,result.title,terms);

    const badge=document.createElement('span');
    badge.className='site-search-occurrence-badge';
    badge.textContent=result.occurrences+' match'+(result.occurrences===1?'':'es');

    top.append(title,badge);
    link.appendChild(top);

    const section=document.createElement('div');
    section.className='site-search-result-section';
    section.textContent=result.section;
    link.appendChild(section);

    const details=document.createElement('div');
    details.className='site-search-match-fields';

    result.matchedFields.forEach(match=>{
      const row=document.createElement('div');
      row.className='site-search-match-field';

      const label=document.createElement('span');
      label.className='site-search-field-label';
      label.textContent=match.label+(match.count>1?' · '+match.count:'');
      row.appendChild(label);

      const value=document.createElement('span');
      value.className='site-search-field-text';
      appendHighlighted(value,contextText(match.text,terms),terms);
      row.appendChild(value);

      details.appendChild(row);
    });

    link.appendChild(details);
    list.appendChild(link);
  });

  panel.appendChild(list);

  if(results.length>18){
    const more=document.createElement('div');
    more.className='site-search-more';
    more.textContent=(results.length-18)+' more results — refine your search';
    panel.appendChild(more);
  }

  panel.hidden=false;
}

function highlightDestination(){
  const query=new URLSearchParams(location.search).get('q');
  const terms=termsFor(query);
  if(!terms.length) return;

  let target=null;
  if(location.hash){
    try{
      target=document.getElementById(decodeURIComponent(location.hash.slice(1)));
    }catch(e){}
  }
  if(!target) target=document.querySelector('main');
  if(!target) return;

  const walker=document.createTreeWalker(target,NodeFilter.SHOW_TEXT);
  const nodes=[];

  while(walker.nextNode()){
    const node=walker.currentNode;
    const parent=node.parentElement;
    if(!parent) continue;
    if(parent.closest('script,style,input,textarea,audio,source,mark,button')) continue;

    const text=String(node.nodeValue||'');
    const folded=fold(text);
    if(terms.some(term=>folded.includes(term))) nodes.push(node);
  }

  nodes.forEach(node=>{
    const fragment=document.createDocumentFragment();
    appendHighlighted(fragment,node.nodeValue,terms);
    node.replaceWith(fragment);
  });
}

function initSiteSearch(){
  const input=$('#siteSearch');
  const panel=$('#siteSearchResults');
  const countEl=$('#siteSearchCount');
  if(!input||!panel) return;

  const incoming=new URLSearchParams(location.search).get('q')||'';
  if(incoming) input.value=incoming;

  let requestNumber=0;

  function close(){
    panel.hidden=true;
    panel.innerHTML='';
    input.setAttribute('aria-expanded','false');
    if(countEl) countEl.textContent='';
  }

  async function run(){
    const query=input.value.trim();
    if(!query){
      close();
      return;
    }

    const request=++requestNumber;
    if(countEl) countEl.textContent='…';

    try{
      const records=await buildIndex();
      if(request!==requestNumber) return;
      renderResults(panel,countEl,records,query);
      input.setAttribute('aria-expanded','true');
    }catch(err){
      console.warn('Site search could not load:',err);
      panel.innerHTML='';
      const message=document.createElement('div');
      message.className='site-search-empty';
      message.textContent='Search is temporarily unavailable.';
      panel.appendChild(message);
      panel.hidden=false;
      input.setAttribute('aria-expanded','true');
      if(countEl) countEl.textContent='';
    }
  }

  input.addEventListener('focus',()=>{
    if(input.value.trim()) run();
    else buildIndex().catch(()=>{});
  });
  input.addEventListener('input',run);
  input.addEventListener('keydown',event=>{
    if(event.key==='Escape'){
      input.value='';
      close();
      input.blur();
    }
    if(event.key==='Enter'){
      const first=panel.querySelector('.site-search-result');
      if(first){
        event.preventDefault();
        location.href=first.href;
      }
    }
  });

  document.addEventListener('click',event=>{
    if(!event.target.closest('.site-search-row')) close();
  });

  highlightDestination();
}

function start(){
  initSiteSearch();
}

if(document.documentElement.dataset.collectionReady==='true'){
  start();
}else{
  document.addEventListener('collection:ready',start,{once:true});
}
