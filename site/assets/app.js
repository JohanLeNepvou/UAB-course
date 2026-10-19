import {days, lessons} from './lessons.js';

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
const outputs=new Map();
const outputUrls=[];
function runtime(text,state){runtimeState=state;$('#runtime-status').textContent=text;$('#runtime-dot').className='status-dot '+state;}
function navigation(){
  const count=Object.values(work.completed).filter(Boolean).length;
  $('#progress').value=count;$('#progress-text').textContent=`${count} / ${lessons.length}`;
  $('#course-nav').innerHTML=days.map(day=>`<section class="nav-day"><div class="nav-day-title">DAY ${day.n} · ${day.short.toUpperCase()}<span>${lessons.filter(l=>l.day===day.n&&work.completed[l.id]).length}/6</span></div>${lessons.filter(l=>l.day===day.n).map(l=>`<a class="nav-lesson ${current?.id===l.id?'active':''} ${work.completed[l.id]?'completed':''}" href="#${l.id}" ${current?.id===l.id?'aria-current="page"':''}><span class="num">${work.completed[l.id]?'✓':l.number}</span><span>${escape(l.title)}</span></a>`).join('')}</section>`).join('');
  $('#day-tabs').innerHTML=days.map(d=>`<a class="day-tab ${current?.day===d.n?'active':''}" href="#${lessons.find(l=>l.day===d.n).id}"><strong>0${d.n}</strong> ${escape(d.short)}</a>`).join('');
}
function render(){
  const hash=decodeURIComponent(location.hash.slice(1)||'python');
  if(hash==='resources'){current=null;renderResources();navigation();return;}
  const lesson=lessons.find(l=>l.id===hash);
  if(!lesson){location.hash='python';return;}
  current=lesson;
  const day=days.find(d=>d.n===lesson.day),index=lessons.indexOf(lesson);
  document.title=`${lesson.title} · UAB course`;
  $('#breadcrumb-day').textContent=`DAY ${lesson.day}`;$('#breadcrumb-lesson').textContent=lesson.number;
  $('#lesson').innerHTML=`
    <div class="eyebrow">DAY ${lesson.day} &nbsp; / &nbsp; ${escape(day.title)}</div>
    <div class="lesson-hero"><div><h1>${escape(lesson.title)}</h1><p>${escape(lesson.objective)}</p></div><div class="lesson-stamp" aria-hidden="true"><strong>${lesson.number}</strong><span>SESSION / 06</span></div></div>
    <div class="lesson-meta"><span class="pill">${escape(lesson.tag)}</span><span>◷ &nbsp; ${lesson.duration} MIN</span><span>◇ &nbsp; EXPLAIN → IMPLEMENT → VERIFY</span></div>
    <nav class="lesson-jumps" aria-label="Within this lesson"><a href="#concept" data-jump="concept">01 &nbsp; The model</a><a href="#practice" data-jump="practice">02 &nbsp; Python lab</a><a href="#interpret" data-jump="interpret">03 &nbsp; Interpret</a></nav>
    ${lesson.number==='01'?`<p class="day-summary"><strong>Today's target:</strong> ${escape(day.outcome)} Six sessions · ${lessons.filter(l=>l.day===day.n).reduce((s,l)=>s+l.duration,0)} minutes of practical work. Add breaks and discussion.</p>`:''}
    <section id="concept" class="concept"><div class="section-heading"><span class="section-number">01</span><h2>The model & the mathematics</h2></div><div class="theory">${lesson.theory}</div>${lesson.day===3?`<div class="model-reader"><p>Read the actual equations and parameter values alongside the derivation:</p>${[['course_source/DAY3/model.py','Original DAY3 reaction and balance implementation'],['course_source/DAY3/parameters.py','Original DAY3 parameter set'],['assets/course_models.py','Teaching adapter: phase handling and reproducible runs']].map(([file,label])=>`<details data-source="${file}"><summary>${label}</summary><pre>Loading source…</pre><a href="${file}" download class="btn">↓ Download Python source</a></details>`).join('')}</div>`:''}</section>
    <section id="practice"><div class="section-heading"><span class="section-number">02</span><h2>Make the model run</h2></div>
    <div class="exercise-intro"><span class="icon" aria-hidden="true">↳</span><div><h3>Your task</h3><p>${escape(lesson.task)}</p></div></div>
    <div class="notebook"><div class="editor-toolbar"><span class="file-label"><span class="file-dot"></span>exercise_${lesson.day}_${lesson.number}.py</span><span class="editor-actions"><button class="text-button" id="reset">Reset</button><button class="text-button" id="download-code">↓ .py</button></span></div>
    <div class="editor-wrap"><div class="line-numbers" id="line-numbers" aria-hidden="true"></div><textarea class="code-editor" id="editor" spellcheck="false" autocapitalize="off" autocomplete="off" autocorrect="off" wrap="off" aria-label="Editable Python exercise for ${escape(lesson.title)}"></textarea></div>
    <div class="editor-controls"><div class="button-group"><button class="btn primary" id="run">▶ &nbsp; Run Python</button><button class="btn" id="check">✓ &nbsp; Run & check</button><button class="btn stop" id="stop" hidden>■ &nbsp; Stop / restart Python</button></div><span class="shortcut">CTRL / ⌘ + ENTER TO RUN</span></div>
    <div class="output" id="output" aria-live="polite"><div class="output-heading"><span>OUTPUT</span><span>NUMPY · SCIPY · MATPLOTLIB</span></div><p class="output-placeholder">Edit the TODO, then run your code. Python runs on your laptop, in this browser.</p></div></div>
    <p class="check-caption">Run & check executes your current code, then tests the result. Exercises start incomplete. Passing checks marks this lesson complete; the written deliverable still needs your explanation.</p>
    <div class="feedback-grid"><details><summary>Need a hint?</summary><p>${escape(lesson.hint)}</p></details><details><summary>Inspect a worked solution</summary><p>Try the exercise first. Compare the equations and reasoning with your implementation.</p><pre>${escape(lesson.solution)}</pre><button class="btn" id="use-solution">Load solution into editor</button></details></div></section>
    <section id="interpret" class="interpretation"><h3>Read the result as an engineer</h3><p>${escape(lesson.interpretation)}</p></section>
    ${lesson.quiz?`<section class="quiz"><div class="eyebrow" style="margin-bottom:12px">CHECK YOUR UNDERSTANDING</div><h3>${escape(lesson.quiz.question)}</h3><div class="quiz-options">${lesson.quiz.options.map((o,i)=>`<button data-answer="${i}">${escape(o)}</button>`).join('')}</div><p class="quiz-feedback" id="quiz-feedback" aria-live="polite"></p></section>`:''}
    <section class="submission"><h3>What to hand in</h3><p>${escape(lesson.deliverable)}</p></section>
    <div class="source-reference"><span>↗</span><div>ADAPTED FROM <a href="course_source/${lesson.source}" download>${escape(lesson.source)}</a><br>Original zero-based cells ${lesson.cells.join(', ')}. <a href="#resources">Source notes, corrections & full notebooks</a></div></div>
    <div class="lesson-footer"><label class="completion-label"><input type="checkbox" id="complete" ${work.completed[lesson.id]?'checked':''}> Mark lesson complete</label><div class="button-group">${index>0?`<a class="btn" href="#${lessons[index-1].id}">← Previous</a>`:''}<a class="btn primary" href="#${index<lessons.length-1?lessons[index+1].id:'resources'}">${index<lessons.length-1?'Next session →':'Course files →'}</a></div></div>`;
  const editor=$('#editor');editor.value=work.drafts[lesson.id]??lesson.starter;
  function sizeEditor(){const lines=editor.value.split('\n').length;$('#line-numbers').textContent=Array.from({length:lines},(_,i)=>i+1).join('\n');editor.style.height=`${Math.min(Math.max(lines*21.6+38,245),600)}px`;}
  sizeEditor();
  editor.addEventListener('input',()=>{work.drafts[lesson.id]=editor.value;save();sizeEditor();});
  editor.addEventListener('scroll',()=>{$('#line-numbers').scrollTop=editor.scrollTop;});
  editor.addEventListener('keydown',event=>{
    if(event.key==='Tab'){event.preventDefault();editor.setRangeText('    ',editor.selectionStart,editor.selectionEnd,'end');editor.dispatchEvent(new Event('input'));}
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
  if(!data){const p=document.createElement('p');p.className='output-placeholder';p.textContent='Edit the TODO, then run your code. Python runs on your laptop, in this browser.';target.append(p);return;}
  if(data.running){const p=document.createElement('p');p.className='output-placeholder';p.textContent='Running… The first run downloads Python and scientific packages. You can keep reading or stop execution.';target.append(p);return;}
  if(data.stdout){const pre=document.createElement('pre');pre.textContent=data.stdout;target.append(pre);}
  if(data.error){const pre=document.createElement('pre');pre.className='error';pre.textContent=data.error;target.append(pre);}
  else if(data.checked){const pre=document.createElement('pre');pre.className='pass';pre.textContent='✓ All numerical checks passed. Complete the written deliverable to finish the session.';target.append(pre);}
  else if(!data.stdout&&!data.plots?.length){const p=document.createElement('p');p.className='output-placeholder';p.textContent='Code executed successfully. Use print(...) to inspect values or plot a trajectory.';target.append(p);}
  for(const [i,plot] of (data.plots||[]).entries()){const img=document.createElement('img');img.className='plot';img.src='data:image/png;base64,'+plot;img.alt=`Python figure ${i+1} for ${current.title}`;target.append(img);}
  if(data.files?.length){const row=document.createElement('div');row.className='download-files';for(const file of data.files){const bytes=Uint8Array.from(atob(file.data),c=>c.charCodeAt(0));const url=URL.createObjectURL(new Blob([bytes]));outputUrls.push(url);const a=document.createElement('a');a.className='btn';a.href=url;a.download=file.name;a.textContent='↓ '+file.name;row.append(a);}target.append(row);}
}
function renderResources(){
  document.title='Course files & reference · UAB';$('#breadcrumb-day').textContent='RESOURCES';$('#breadcrumb-lesson').textContent='';
  $('#lesson').innerHTML=`<div class="eyebrow">THE COURSE WORKBENCH</div><div class="lesson-hero"><div><h1>Course files & reference</h1><p>Executable notebooks, original sources, and the numerical details behind this three-day course.</p></div></div>
  <div class="resource-grid">
  ${days.map(d=>`<section class="resource-card"><h2>Day ${d.n} · ${escape(d.short)}</h2><p>${escape(d.description)}</p><a class="btn primary" download href="notebooks/day${d.n}.ipynb">↓ Student notebook</a><a class="btn" download href="notebooks/day${d.n}-solutions.ipynb">↓ Worked solutions</a><p>${escape(d.outcome)}</p></section>`).join('')}
  <section class="resource-card"><h2>Keep your work</h2><p>Code and completion are saved in this browser. Export a backup to move to another laptop or browser. Import restores editable code; it never executes it.</p><button class="btn primary" id="export-work">↓ Export work</button><button class="btn" id="import-work">↑ Import work</button><input type="file" id="work-file" accept="application/json,.json" hidden><p class="storage-note">${storageAvailable?'Browser storage is available.':'Browser storage is unavailable; export to keep changes.'} Files and plots in Python memory reset between runs. Each exercise runs independently.</p></section>
  <section class="resource-card wide"><h2>Schedule & deliverables</h2><p>Each day has 300 minutes of guided practical work. Suggested teaching day: 09:00–16:00, with 60 minutes for lunch, 30 minutes of breaks, and 30 minutes for discussion. The six session durations are estimates; use the final lab to consolidate unfinished work.</p><div class="table-scroll"><table><thead><tr><th>Day</th><th>Practical sequence</th><th>Evidence of learning</th></tr></thead><tbody>${days.map(d=>`<tr><td>${d.n}</td><td>${lessons.filter(l=>l.day===d.n).map(l=>escape(l.title)).join(' → ')}</td><td>${escape(d.outcome)}</td></tr>`).join('')}</tbody></table></div></section>
  <section class="resource-card wide"><h2>Run locally or in a notebook service</h2><p>Browser exercises need a network connection for the first Python and scientific-package download. No Python installation or student account is required. On a restricted network, ask for access to <code>cdn.jsdelivr.net</code>. The page fonts have local fallbacks.</p><p>The downloadable day notebooks embed the exact model support files. Open them in Jupyter or upload them to Google Colab, run their first setup cell, then work through the exercises. For local Python install <code>numpy scipy matplotlib jupyterlab</code>. Run exercise cells before their check cells. Solution notebooks are separately labelled.</p><p>Use <strong>Stop / restart Python</strong> for a long-running cell. The runner isolates each execution: imports and variables do not carry between lessons. Code edits persist; generated CSV/PNG files should be downloaded before another run.</p></section>
  <section class="resource-card wide"><h2>The source of truth</h2><p>Only YeastFermentation DAY1, DAY2, and DAY3 inform the course. Original notebooks and supporting Python files are preserved in <code>course_source/</code>. Each lesson identifies the original notebook cells. The manifest records SHA-256 hashes so source copies can be verified.</p><ul class="source-list">${[...new Set(lessons.map(l=>l.source))].map(path=>`<li><a download href="course_source/${path}">↓ ${escape(path)}</a></li>`).join('')}</ul><a class="btn" download href="source-manifest.json">↓ Source & lesson manifest</a><a class="btn" download href="assets/course_models.py">↓ Teaching model adapters</a><p>Original Python translation: Johan Le Nepvou De Carfort. Original MATLAB teaching material: Pedram Ramin and Krist Gernaey, PROSYS, Department of Chemical and Biochemical Engineering, Technical University of Denmark. Original attribution remains in the notebook.</p></section>
  <section class="resource-card wide"><h2>Documented teaching corrections</h2><div class="table-scroll"><table><thead><tr><th>Source issue</th><th>Course treatment</th></tr></thead><tbody>
  <tr><td>DAY1 isomerization passes <code>par=par</code> and captures an earlier default parameter list.</td><td>Explicit parameters through <code>args=(k1,k2)</code>; transient, equilibrium, and conservation tests.</td></tr>
  <tr><td>DAY2 oxygen actuator plot uses −60000 and omits the integral state.</td><td>Plot the actual simulated −50000 PI gain and integral contribution.</td></tr>
  <tr><td>DAY2 defines both <code>mux</code>/<code>mu_max</code> and <code>O_sat</code>/<code>Osat</code>.</td><td>Use the computed <code>mux</code> and <code>O_sat</code> that the original derivative actually reads.</td></tr>
  <tr><td>DAY3 labels time in seconds and initial volume as g/L in some places.</td><td>Use hours for time, litres for volume, L/h for feed, and g/L for concentrations, consistent with parameter values.</td></tr>
  <tr><td>DAY3 feed has switches at 2 h and 2 L; an adaptive step can overshoot a switch.</td><td>Integrate three continuous phases, splitting at feed start and analytical filling time. Kinetics and feed policy are unchanged.</td></tr>
  <tr><td>DAY3 model's standalone demo omits required Cfeed; comments mention six reactions.</td><td>Always pass feed composition; teach the implemented five-reaction matrix. The original files remain untouched.</td></tr>
  <tr><td>DAY3 randomly increases six parameters by 2–5%, and reseeds both generators with the same index.</td><td>Preserve the one-sided distribution, seed coupling, and draw order; explain their implications. Use fresh objects for each run.</td></tr>
  </tbody></table></div></section>
  <section class="resource-card wide"><h2>Python & solver reference</h2><div class="table-scroll"><table><thead><tr><th>Pattern</th><th>Meaning</th></tr></thead><tbody><tr><td><code>def rhs(t,y,*parameters)</code></td><td>Return one derivative per state in the same order as y0.</td></tr><tr><td><code>args=(par,)</code></td><td>Pass a single parameter object as a one-item tuple.</td></tr><tr><td><code>sol.y[i, :]</code></td><td>State i at all returned times.</td></tr><tr><td><code>t_eval=...</code></td><td>Output times, not fixed integration steps.</td></tr><tr><td><code>atol + rtol*abs(y)</code></td><td>Approximate per-state error scale; choose units and state magnitudes thoughtfully.</td></tr><tr><td><code>sol.success</code></td><td>Check successful completion before interpreting outputs.</td></tr></tbody></table></div><ul class="reference-list"><li><a href="https://docs.scipy.org/doc/scipy/reference/generated/scipy.integrate.solve_ivp.html" target="_blank" rel="noreferrer">SciPy: solve_ivp and solver diagnostics</a></li><li><a href="https://numpy.org/doc/stable/user/absolute_beginners.html" target="_blank" rel="noreferrer">NumPy: arrays and indexing</a></li><li><a href="https://matplotlib.org/stable/users/explain/quick_start.html" target="_blank" rel="noreferrer">Matplotlib: figures and axes</a></li><li><a href="https://pyodide.org/en/0.27.7/usage/webworker.html" target="_blank" rel="noreferrer">Pyodide: Python in a browser worker</a></li></ul></section></div>`;
  $('#export-work').onclick=()=>download('uab-course-work.json',JSON.stringify({version:1,...work},null,2),'application/json');
  $('#import-work').onclick=()=>$('#work-file').click();
  $('#work-file').onchange=async e=>{
    try{const file=e.target.files[0];if(!file)return;if(file.size>2000000)throw new Error('Work file is too large.');work=validateWork(JSON.parse(await file.text()));save();navigation();toast('Work imported. Your saved code is ready in each lesson.');}
    catch(error){toast('Could not import work: '+error.message);}
  };
}
$('#menu').onclick=()=>{const open=$('#sidebar').classList.toggle('open');$('#menu').setAttribute('aria-expanded',String(open));};
document.addEventListener('click',event=>{if(event.target.closest('.sidebar a')){$('#sidebar').classList.remove('open');$('#menu').setAttribute('aria-expanded','false');}});
window.addEventListener('hashchange',()=>{render();window.scrollTo({top:0,behavior:'instant'});});
render();
