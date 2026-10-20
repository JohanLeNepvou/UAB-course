import {days, lessons} from './lessons.js';
import {renderGuidance} from './guidance.js';
import {colabUrl} from './guidance-content.js';
import {resourceMarkup} from './resources.js';

const $ = s => document.querySelector(s);
const escape = value => String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const validIds = new Set(lessons.map(l=>l.id));
const storageKey='uab-course-work-v1';
let work={drafts:{},completed:{}};
let storageAvailable=true;
try { const saved=JSON.parse(localStorage.getItem(storageKey)||'null'); if(saved) work=validateWork(saved); }
catch { storageAvailable=false; }
function validateWork(input){
  if(!input || typeof input!=='object') throw new Error('Invalid work file.');
  const clean={drafts:{},completed:{}};
  for(const id of validIds){
    if(typeof input.drafts?.[id]==='string' && input.drafts[id].length<=100000) clean.drafts[id]=input.drafts[id];
    if(input.completed?.[id]===true) clean.completed[id]=true;
  }
  return clean;
}
function save(){try{localStorage.setItem(storageKey,JSON.stringify(work));}catch{storageAvailable=false;toast('Browser storage is unavailable. Export your work to keep it.');}}
let toastTimer;
function toast(message){$('#toast').textContent=message;$('#toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').hidden=true,5000);}
function download(name,data,type='text/plain'){
  const blob=data instanceof Blob?data:new Blob([data],{type});
  const url=URL.createObjectURL(blob), a=document.createElement('a');
  a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
let current=null,worker=null,busy=null,runtimeState='idle';
let guidanceCleanup=null;
const outputs=new Map();
const outputUrls=[];
function runtime(text,state){runtimeState=state;$('.runtime').hidden=state==='idle';$('#runtime-status').textContent=text;$('#runtime-dot').className='status-dot '+state;}
function navigation(){
  document.querySelectorAll('[data-guide]').forEach(a=>{const active=location.hash.slice(1).split('/')[0]===a.dataset.guide;a.classList.toggle('active',active);if(active)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
  const count=Object.values(work.completed).filter(Boolean).length;
  $('#progress').value=count;$('#progress-text').textContent=`${count} / ${lessons.length}`;
  $('#course-nav').innerHTML=days.map(day=>`<details class="nav-day" ${current?.day===day.n?'open':''}><summary class="nav-day-title"><span>Day ${day.n}<small>${escape(day.short)}</small></span><span class="nav-chevron" aria-hidden="true">⌄</span></summary><div class="nav-day-lessons">${lessons.filter(l=>l.day===day.n).map(l=>`<a class="nav-lesson ${current?.id===l.id?'active':''} ${work.completed[l.id]?'completed':''}" href="#${l.id}" ${current?.id===l.id?'aria-current="page"':''}><span class="num">${work.completed[l.id]?'✓':l.number}</span><span>${escape(l.title)}</span></a>`).join('')}</div></details>`).join('');
}
function render(){
  guidanceCleanup?.();guidanceCleanup=null;
  const hash=decodeURIComponent(location.hash.slice(1)||'python');
  document.body.dataset.view=hash.startsWith('orientation')?'orientation':hash.startsWith('help')?'help':hash==='resources'?'resources':'lesson';
  if(hash==='orientation'||hash.startsWith('orientation/present/')||hash==='help'||hash.startsWith('help/')){current=null;guidanceCleanup=renderGuidance(hash,$('#lesson'),{toast});navigation();return;}
  if(hash==='resources'){current=null;renderResources();navigation();return;}
  const lesson=lessons.find(l=>l.id===hash);
  if(!lesson){location.hash='python';return;}
  current=lesson;
  const index=lessons.indexOf(lesson);
  document.title=`${lesson.title} · UAB course`;
  $('#breadcrumb-day').textContent=`Day ${lesson.day}`;$('#breadcrumb-lesson').textContent=lesson.number;
  $('#lesson').innerHTML=`
    <div class="eyebrow">Lesson ${lesson.number} <span>· ${lesson.duration} min</span></div>
    <div class="lesson-hero"><h1>${escape(lesson.title)}</h1><p>${escape(lesson.objective)}</p></div>
    <nav class="lesson-jumps" aria-label="Within this lesson"><a href="#concept" data-jump="concept">Model</a><a href="#practice" data-jump="practice">Exercise</a><a href="#interpret" data-jump="interpret">Discussion</a><a href="${colabUrl(lesson.day)}" target="_blank" rel="noreferrer">Open in Colab ↗</a></nav>
    <section id="concept" class="concept"><h2>The model</h2><div class="theory">${lesson.theory}</div>${lesson.day===3?`<div class="model-reader">${[['course_source/DAY3/model.py','Original model'],['course_source/DAY3/parameters.py','Model parameters'],['assets/course_models.py','Simulation helpers']].map(([file,label])=>`<details data-source="${file}"><summary>${label}</summary><pre>Loading source…</pre><a href="${file}" download class="btn">Download Python source</a></details>`).join('')}</div>`:''}</section>
    <section id="practice"><h2>Try it in Python</h2>
    <p class="exercise-intro">${escape(lesson.task)}</p>
    <div class="notebook"><div class="editor-toolbar"><span class="file-label"><span class="file-dot"></span>exercise_${lesson.day}_${lesson.number}.py</span><span class="editor-actions"><button class="text-button" id="reset">Reset</button><button class="text-button" id="download-code">↓ .py</button></span></div>
    <div class="editor-wrap"><div class="line-numbers" id="line-numbers" aria-hidden="true"></div><textarea class="code-editor" id="editor" spellcheck="false" autocapitalize="off" autocomplete="off" autocorrect="off" wrap="off" aria-label="Editable Python exercise for ${escape(lesson.title)}"></textarea></div>
    <div class="editor-controls"><div class="button-group"><button class="btn primary" id="run">▶ &nbsp; Run Python</button><button class="btn" id="check">✓ &nbsp; Run & check</button><button class="btn stop" id="stop" hidden>■ &nbsp; Stop / restart Python</button></div><span class="shortcut">CTRL / ⌘ + ENTER TO RUN</span></div>
    <div class="output" id="output" aria-live="polite"><p class="output-placeholder">Your output will appear here.</p></div></div>
    <p class="check-caption">Edit the TODO, then run your code. Use Run & check to test your answer.</p>
    <div class="feedback-grid"><details><summary>Hint</summary><p>${escape(lesson.hint)}</p></details><details><summary>Worked solution</summary><pre>${escape(lesson.solution)}</pre><button class="btn" id="use-solution">Use this solution</button></details></div></section>
    <section id="interpret" class="interpretation"><h2>Discuss the result</h2><p>${escape(lesson.interpretation)}</p></section>
    ${lesson.quiz?`<section class="quiz"><h3>${escape(lesson.quiz.question)}</h3><div class="quiz-options">${lesson.quiz.options.map((o,i)=>`<button data-answer="${i}">${escape(o)}</button>`).join('')}</div><p class="quiz-feedback" id="quiz-feedback" aria-live="polite"></p></section>`:''}
    <section class="submission"><h3>What to hand in</h3><p>${escape(lesson.deliverable)}</p></section>
    <details class="source-reference"><summary>Source notebook</summary><p><a href="course_source/${lesson.source}" download>${escape(lesson.source)}</a> · cells ${lesson.cells.join(', ')} (zero-based). <a href="#resources">All course files and source notes</a>.</p></details>
    <div class="lesson-footer"><label class="completion-label"><input type="checkbox" id="complete" ${work.completed[lesson.id]?'checked':''}> Mark lesson complete</label><div class="button-group">${index>0?`<a class="btn" href="#${lessons[index-1].id}">← Previous</a>`:''}<a class="btn primary" href="#${index<lessons.length-1?lessons[index+1].id:'resources'}">${index<lessons.length-1?'Next session →':'Course files →'}</a></div></div>`;
  const editor=$('#editor');editor.value=work.drafts[lesson.id]??lesson.starter;
  function sizeEditor(){const lines=editor.value.split('\n').length;$('#line-numbers').textContent=Array.from({length:lines},(_,i)=>i+1).join('\n');const lineHeight=parseFloat(getComputedStyle(editor).lineHeight);editor.style.height=`${Math.min(Math.max(lines*lineHeight+38,245),560)}px`;}
  sizeEditor();
  editor.addEventListener('input',()=>{work.drafts[lesson.id]=editor.value;save();sizeEditor();});
  editor.addEventListener('scroll',()=>{$('#line-numbers').scrollTop=editor.scrollTop;});
  editor.addEventListener('keydown',event=>{
    if(event.key==='Tab'&&!event.shiftKey){event.preventDefault();editor.setRangeText('    ',editor.selectionStart,editor.selectionEnd,'end');editor.dispatchEvent(new Event('input'));}
    if(event.key==='Escape'){event.preventDefault();$('#run').focus();}
    if(event.key==='Enter'&&(event.ctrlKey||event.metaKey)){event.preventDefault();execute(false);}
  });
  $('#reset').onclick=()=>{work.drafts[lesson.id]=lesson.starter;save();editor.value=lesson.starter;outputs.delete(lesson.id);sizeEditor();showOutput();toast('Starter code restored.');};
  $('#download-code').onclick=()=>download(`day${lesson.day}_${lesson.id}.py`,editor.value);
  $('#run').onclick=()=>execute(false);$('#check').onclick=()=>execute(true);$('#stop').onclick=()=>stop();
  $('#use-solution').onclick=()=>{editor.value=lesson.solution;work.drafts[lesson.id]=editor.value;save();sizeEditor();outputs.delete(lesson.id);showOutput();toast('Solution loaded. Run & check to verify it.');};
  $('#complete').onchange=e=>{work.completed[lesson.id]=e.target.checked;save();navigation();};
  document.querySelectorAll('[data-jump]').forEach(a=>a.onclick=e=>{e.preventDefault();document.getElementById(a.dataset.jump).scrollIntoView({behavior:'smooth'});});
  document.querySelectorAll('[data-source]').forEach(details=>details.ontoggle=async()=>{
    if(!details.open || details.dataset.loaded)return;
    try{const response=await fetch(details.dataset.source);if(!response.ok)throw new Error('Source unavailable.');details.querySelector('pre').textContent=await response.text();details.dataset.loaded='true';}
    catch{details.querySelector('pre').textContent='Could not load this source file. Use the download link to try again.';}
  });
  document.querySelectorAll('[data-answer]').forEach(button=>button.onclick=()=>{
    document.querySelectorAll('[data-answer]').forEach(b=>b.classList.remove('correct','incorrect'));
    const correct=Number(button.dataset.answer)===lesson.quiz.answer;
    button.classList.add(correct?'correct':'incorrect');$('#quiz-feedback').textContent=(correct?'Correct. ':'Try again. ')+lesson.quiz.explanation;
  });
  navigation();showOutput();controls();
}
function controls(){
  for(const selector of ['#run','#check']) if($(selector))$(selector).disabled=!!busy;
  if($('#stop'))$('#stop').hidden=!busy;
}
function startWorker(){
  worker=new Worker(new URL('./python-worker.js',import.meta.url),{type:'module'});
  worker.onmessage=({data})=>{
    if(data.type==='status'){runtime(data.message,data.state);return;}
    if(data.type==='result' && busy && data.id===busy.id){
      const job=busy;clearTimeout(job.timeout);busy=null;
      outputs.set(job.lessonId,{...data,checked:job.check});
      if(job.check && data.passed && !data.error){work.completed[job.lessonId]=true;save();navigation();if(current?.id===job.lessonId)$('#complete').checked=true;}
      runtime(data.fatal?'Python unavailable · retry Run':'Python ready',data.fatal?'error':'ready');controls();if(current?.id===job.lessonId)showOutput();
    }
  };
  worker.onerror=e=>{
    e.preventDefault();const message=e.message||'Python could not load. Check your connection to cdn.jsdelivr.net, then try again.';
    failJob(message);worker?.terminate();worker=null;runtime('Python unavailable · retry Run','error');
  };
}
function failJob(message){
  if(busy){clearTimeout(busy.timeout);outputs.set(busy.lessonId,{error:message});busy=null;showOutput();}controls();
}
function execute(check){
  if(!current||busy)return;
  const code=$('#editor').value;
  work.drafts[current.id]=code;save();
  const id=crypto.randomUUID();
  busy={id,lessonId:current.id,check,timeout:setTimeout(()=>{
    stop('Execution exceeded 180 seconds. Python was restarted. Check for an infinite loop, or retry if the first package download was slow.');
  },180000)};
  outputs.set(current.id,{running:true});showOutput();controls();
  runtime(worker?'Running Python…':'Loading Python & scientific packages…','busy');
  if(!worker)startWorker();
  worker.postMessage({id,code,checks:check?current.checks:''});
}
function stop(message='Execution stopped. Run again to start a fresh Python runtime.'){
  worker?.terminate();worker=null;failJob(message);runtime('Python stopped · Run to restart','idle');
}
function showOutput(){
  const target=$('#output');if(!target||!current)return;
  for(const url of outputUrls)URL.revokeObjectURL(url);outputUrls.length=0;
  const data=outputs.get(current.id);
  target.replaceChildren();const heading=document.createElement('div');heading.className='output-heading';heading.textContent='OUTPUT';target.append(heading);
  if(!data){const p=document.createElement('p');p.className='output-placeholder';p.textContent='Your output will appear here.';target.append(p);return;}
  if(data.running){const p=document.createElement('p');p.className='output-placeholder';p.textContent='Running… The first run downloads Python and scientific packages. You can keep reading or stop execution.';target.append(p);return;}
  if(data.stdout){const pre=document.createElement('pre');pre.textContent=data.stdout;target.append(pre);}
  if(data.error){const pre=document.createElement('pre');pre.className='error';pre.textContent=data.error;target.append(pre);}
  else if(data.checked){const pre=document.createElement('pre');pre.className='pass';pre.textContent='✓ All numerical checks passed.';target.append(pre);}
  else if(!data.stdout&&!data.plots?.length){const p=document.createElement('p');p.className='output-placeholder';p.textContent='Code executed successfully. Use print(...) to inspect values or plot a trajectory.';target.append(p);}
  for(const [i,plot] of (data.plots||[]).entries()){const img=document.createElement('img');img.className='plot';img.src='data:image/png;base64,'+plot;img.alt=`Python figure ${i+1} for ${current.title}`;target.append(img);}
  if(data.files?.length){const row=document.createElement('div');row.className='download-files';for(const file of data.files){const bytes=Uint8Array.from(atob(file.data),c=>c.charCodeAt(0));const url=URL.createObjectURL(new Blob([bytes]));outputUrls.push(url);const a=document.createElement('a');a.className='btn';a.href=url;a.download=file.name;a.textContent='↓ '+file.name;row.append(a);}target.append(row);}
}
function renderResources(){
  document.title='Course files & reference · UAB';$('#breadcrumb-day').textContent='RESOURCES';$('#breadcrumb-lesson').textContent='';
  $('#lesson').innerHTML=resourceMarkup(days,lessons,storageAvailable);
  $('#export-work').onclick=()=>download('uab-course-work.json',JSON.stringify({version:1,...work},null,2),'application/json');
  $('#import-work').onclick=()=>$('#work-file').click();
  $('#work-file').onchange=async e=>{
    try{const file=e.target.files[0];if(!file)return;if(file.size>2000000)throw new Error('Work file is too large.');work=validateWork(JSON.parse(await file.text()));save();navigation();toast('Work imported. Your saved code is ready in each lesson.');}
    catch(error){toast('Could not import work: '+error.message);}
  };
}
function setMenu(open){$('#sidebar').classList.toggle('open',open);document.body.classList.toggle('nav-open',open);$('#nav-backdrop').hidden=!open;$('#menu').setAttribute('aria-expanded',String(open));$('#sidebar').inert=matchMedia('(max-width:800px)').matches&&!open;}
$('#menu').onclick=()=>setMenu(!$('#sidebar').classList.contains('open'));
$('#close-menu').onclick=()=>setMenu(false);$('#nav-backdrop').onclick=()=>setMenu(false);
document.addEventListener('click',event=>{if(event.target.closest('.sidebar a'))setMenu(false);});
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&$('#sidebar').classList.contains('open')){setMenu(false);$('#menu').focus();}});
matchMedia('(max-width:800px)').addEventListener('change',()=>setMenu(false));
setMenu(false);
function positionRoute(){window.scrollTo({top:0,behavior:'instant'});}
window.addEventListener('hashchange',()=>{render();positionRoute();});
render();positionRoute();
