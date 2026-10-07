(() => {
  const DATA_URL='data/extra-shlokas.json';
  let data={_instructions:'',sections:[]};
  let selectedSection=-1;
  let selectedVerse=-1;
  let dirty=false;

  const $=id=>document.getElementById(id);
  const els={
    sectionList:$('sectionList'),verseList:$('verseList'),empty:$('emptyState'),editor:$('editorArea'),verseEditor:$('verseEditor'),
    statusText:$('statusText'),statusDot:$('statusDot'),
    sectionId:$('sectionId'),sectionTitle:$('sectionTitle'),sectionNav:$('sectionNav'),sectionSubtitle:$('sectionSubtitle'),
    verseId:$('verseId'),verseNumber:$('verseNumber'),verseLabel:$('verseLabel'),roman:$('roman'),iast:$('iast'),
    devanagari:$('devanagari'),meaning:$('meaning'),sourceRoman:$('sourceRoman'),sourceDevanagari:$('sourceDevanagari'),
    audioPath:$('audioPath'),audioType:$('audioType'),audioFile:$('audioFile'),previewPanel:$('previewPanel')
  };

  const lines=v => String(v||'').split(/\r?\n/).map(s=>s.trimEnd()).filter((s,i,a)=>s!=='' || (i>0 && i<a.length-1));
  const text=v => Array.isArray(v)?v.join('\n'):(v||'');

  function setStatus(msg,state='ok'){
    els.statusText.textContent=msg;
    els.statusDot.className='status-dot '+state;
  }
  function markDirty(){
    dirty=true; setStatus('Unsaved changes — export JSON when ready','dirty');
  }
  function cleanId(v){return String(v||'').trim().toLowerCase().replace(/[^a-z0-9\-]+/g,'-').replace(/^-+|-+$/g,'');}
  function currentSection(){return data.sections?.[selectedSection]||null}
  function currentVerse(){return currentSection()?.verses?.[selectedVerse]||null}

  function renderSections(){
    els.sectionList.innerHTML='';
    (data.sections||[]).forEach((s,i)=>{
      const b=document.createElement('button');b.className='section-item'+(i===selectedSection?' active':'');b.type='button';
      b.innerHTML='<span><span class="item-title"></span><br><span class="item-meta"></span></span><span>›</span>';
      b.querySelector('.item-title').textContent=s.title||s.id||'Untitled';
      b.querySelector('.item-meta').textContent=(s.verses?.length||0)+' shloka'+((s.verses?.length||0)===1?'':'s');
      b.addEventListener('click',()=>selectSection(i));
      els.sectionList.appendChild(b);
    });
  }
  function selectSection(i){
    selectedSection=i;selectedVerse=-1;
    els.empty.hidden=true;els.editor.hidden=false;els.verseEditor.hidden=true;els.previewPanel.hidden=true;
    const s=currentSection();
    els.sectionId.value=s.id||'';els.sectionTitle.value=s.title||'';els.sectionNav.value=s.navLabel||'';els.sectionSubtitle.value=s.subtitle||'';
    renderSections();renderVerses();
  }
  function renderVerses(){
    els.verseList.innerHTML='';
    const s=currentSection(); if(!s) return;
    (s.verses||[]).forEach((v,i)=>{
      const b=document.createElement('button');b.className='verse-item'+(i===selectedVerse?' active':'');b.type='button';
      b.innerHTML='<span><span class="item-title"></span><br><span class="item-meta"></span></span><span>›</span>';
      b.querySelector('.item-title').textContent=v.label||('Shloka '+(v.number??(i+1)));
      b.querySelector('.item-meta').textContent=v.audio?'Audio attached':'No audio';
      b.addEventListener('click',()=>selectVerse(i));
      els.verseList.appendChild(b);
    });
  }
  function selectVerse(i){
    selectedVerse=i;els.verseEditor.hidden=false;els.previewPanel.hidden=false;
    const v=currentVerse();
    els.verseId.value=v.id||'';els.verseNumber.value=v.number??'';els.verseLabel.value=v.label||'';
    els.roman.value=text(v.roman);els.iast.value=text(v.iast);els.devanagari.value=text(v.devanagari);els.meaning.value=v.meaning||'';
    els.sourceRoman.value=v.sourceRoman||'';els.sourceDevanagari.value=v.sourceDevanagari||'';els.audioPath.value=v.audio||'';els.audioType.value=v.audioType||'';
    renderVerses();renderPreview();
  }
  function updateSectionFromForm(){
    const s=currentSection();if(!s)return;
    s.id=cleanId(els.sectionId.value)||s.id||'section';
    s.title=els.sectionTitle.value.trim();s.navLabel=els.sectionNav.value.trim();s.subtitle=els.sectionSubtitle.value.trim();
    renderSections();markDirty();
  }
  function updateVerseFromForm(){
    const v=currentVerse();if(!v)return;
    v.id=cleanId(els.verseId.value)||v.id||'shloka';
    const n=els.verseNumber.value.trim(); v.number=n===''?null:Number(n);
    v.label=els.verseLabel.value.trim();
    v.roman=lines(els.roman.value);v.iast=lines(els.iast.value);v.devanagari=lines(els.devanagari.value);
    v.meaning=els.meaning.value.trim();v.sourceRoman=els.sourceRoman.value.trim();v.sourceDevanagari=els.sourceDevanagari.value.trim();
    v.audio=els.audioPath.value.trim();v.audioType=els.audioType.value;
    Object.keys(v).forEach(k=>{
      if((v[k]==='' || v[k]===null || (Array.isArray(v[k])&&v[k].length===0)) && !['number'].includes(k)) delete v[k];
    });
    renderVerses();renderPreview();markDirty();
  }
  function renderPreview(){
    const v=currentVerse();if(!v)return;
    $('previewRoman').textContent=text(v.roman);
    $('previewIast').textContent=text(v.iast);
    $('previewDevanagari').textContent=text(v.devanagari);
    $('previewMeaning').textContent=v.meaning||'';
    $('previewSourceRoman').textContent=v.sourceRoman||'';
    $('previewSourceDevanagari').textContent=v.sourceDevanagari||'';
  }

  $('newSectionBtn').addEventListener('click',()=>{
    data.sections=data.sections||[];
    const n=data.sections.length+1;
    data.sections.push({id:'new-section-'+n,title:'New Section',navLabel:'New Section',subtitle:'',verses:[]});
    selectSection(data.sections.length-1);markDirty();
  });
  $('deleteSectionBtn').addEventListener('click',()=>{
    const s=currentSection();if(!s)return;
    if(!confirm('Delete section "'+(s.title||s.id)+'" and all of its shlokas?'))return;
    data.sections.splice(selectedSection,1);selectedSection=-1;selectedVerse=-1;
    els.editor.hidden=true;els.empty.hidden=false;renderSections();markDirty();
  });
  $('newVerseBtn').addEventListener('click',()=>{
    const s=currentSection();if(!s)return;
    s.verses=s.verses||[];const n=s.verses.length+1;
    s.verses.push({id:(s.id||'section')+'-'+n,number:n,roman:[],iast:[],devanagari:[],meaning:''});
    selectVerse(s.verses.length-1);markDirty();
  });
  $('deleteVerseBtn').addEventListener('click',()=>{
    const s=currentSection(),v=currentVerse();if(!s||!v)return;
    if(!confirm('Delete this shloka?'))return;
    s.verses.splice(selectedVerse,1);selectedVerse=-1;els.verseEditor.hidden=true;els.previewPanel.hidden=true;renderVerses();markDirty();
  });

  [els.sectionId,els.sectionTitle,els.sectionNav,els.sectionSubtitle].forEach(x=>x.addEventListener('input',updateSectionFromForm));
  [els.verseId,els.verseNumber,els.verseLabel,els.roman,els.iast,els.devanagari,els.meaning,els.sourceRoman,els.sourceDevanagari,els.audioPath,els.audioType]
    .forEach(x=>x.addEventListener('input',updateVerseFromForm));

  els.audioFile.addEventListener('change',()=>{
    const file=els.audioFile.files?.[0];if(!file)return;
    const section=currentSection();
    const folder=section?.id||'uploads';
    els.audioPath.value='audio/'+folder+'/'+file.name;
    if(file.type) els.audioType.value=file.type;
    $('audioHint').textContent='Suggested path filled. The actual audio file still needs to be uploaded to GitHub.';
    updateVerseFromForm();
  });

  function jsonText(){return JSON.stringify(data,null,2)+'\n'}
  $('downloadBtn').addEventListener('click',()=>{
    const blob=new Blob([jsonText()],{type:'application/json'});
    const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='extra-shlokas.json';a.click();URL.revokeObjectURL(a.href);
    dirty=false;setStatus('JSON downloaded','ok');
  });
  $('copyBtn').addEventListener('click',async()=>{
    try{await navigator.clipboard.writeText(jsonText());setStatus('JSON copied to clipboard','ok');}
    catch{setStatus('Could not copy automatically — use Download JSON','error');}
  });
  $('importBtn').addEventListener('click',()=>$('importFile').click());
  $('importFile').addEventListener('change',async e=>{
    const file=e.target.files?.[0];if(!file)return;
    try{
      const parsed=JSON.parse(await file.text());
      if(!Array.isArray(parsed.sections))throw new Error('JSON must contain a sections array');
      data=parsed;selectedSection=-1;selectedVerse=-1;els.editor.hidden=true;els.empty.hidden=false;renderSections();markDirty();
      setStatus('Imported '+file.name+' — review and export when ready','dirty');
    }catch(err){setStatus('Import failed: '+err.message,'error')}
  });

  window.addEventListener('beforeunload',e=>{if(dirty){e.preventDefault();e.returnValue='';}});

  async function init(){
    try{
      const res=await fetch(DATA_URL,{cache:'no-store'});
      if(!res.ok) throw new Error('HTTP '+res.status);
      data=await res.json();
      if(!Array.isArray(data.sections)) data.sections=[];
      renderSections();setStatus('Loaded current JSON data','ok');
      if(data.sections.length) selectSection(0);
    }catch(err){
      setStatus('Could not load '+DATA_URL+': '+err.message,'error');
    }
  }
  init();
})();