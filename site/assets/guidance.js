import {slides,colabUrl,smokeCode,commandGroups,localCommands,faq} from './guidance-content.js';

const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const external=(url,label,classes='')=>`<a class="${classes}" href="${escape(url)}" target="_blank" rel="noreferrer">${escape(label)} ↗</a>`;
const timeRange=index=>{const start=slides.slice(0,index).reduce((sum,s)=>sum+s.minutes,0);return `${String(start).padStart(2,'0')}–${String(start+slides[index].minutes).padStart(2,'0')} min`;};
const block=(id,label,where,code)=>`<div class="command-block"><div class="command-header"><div><strong>${escape(label)}</strong><span>${escape(where)}</span></div><button class="btn copy-command" data-copy="${id}">Copy code</button></div><pre id="${id}"><code>${escape(code)}</code></pre></div>`;
const notebookLinks=()=>[1,2,3].map(day=>`<div class="colab-card"><span>Day ${day}</span>${external(colabUrl(day),['Python & ODEs','Balances & control','Fermentation models'][day-1],'btn')}</div>`).join('');
const heading=(title,lead)=>`<div class="lesson-hero"><h1>${title}</h1><p>${lead}</p></div>`;
const slideIndex=route=>{const number=Number(route.split('/')[2]);return Number.isInteger(number)&&number>=1&&number<=slides.length?number-1:0;};

export function renderGuidance(route,target,{toast}){
  const presenting=route.startsWith('orientation/present/');
  const orientation=route==='orientation'||presenting;
  document.body.classList.toggle('presenting',presenting);
  document.title=(orientation?'Course introduction':'Help & setup')+' · UAB';
  document.querySelector('#breadcrumb-day').textContent=orientation?'Introduction':'Help';
  document.querySelector('#breadcrumb-lesson').textContent='';
  if(orientation) renderOrientation(target,presenting,route);
  else renderHelp(target,route.split('/')[1]||'colab');
  target.querySelectorAll('[data-copy]').forEach(button=>button.onclick=async()=>{
    const code=document.getElementById(button.dataset.copy).textContent;
    try{await navigator.clipboard.writeText(code);button.textContent='Copied';toast('Code copied.');setTimeout(()=>{if(button.isConnected)button.textContent='Copy code';},2000);}
    catch{const selection=window.getSelection();const range=document.createRange();range.selectNodeContents(document.getElementById(button.dataset.copy));selection.removeAllRanges();selection.addRange(range);toast('Press Ctrl+C or ⌘C to copy the selected code.');}
  });
  if(!presenting)return()=>document.body.classList.remove('presenting');
  const index=slideIndex(route);
  const keyboard=event=>{
    if(event.target.matches('input,textarea,[contenteditable="true"]')||event.ctrlKey||event.metaKey||event.altKey)return;
    const next=['ArrowRight','PageDown'].includes(event.key)?Math.min(index+1,slides.length-1):['ArrowLeft','PageUp'].includes(event.key)?Math.max(index-1,0):event.key==='Home'?0:event.key==='End'?slides.length-1:null;
    if(event.key==='Escape'){event.preventDefault();location.hash='orientation';}
    else if(next!==null){event.preventDefault();location.hash=`orientation/present/${next+1}`;}
  };
  document.addEventListener('keydown',keyboard);
  target.querySelector('h1').focus({preventScroll:true});
  return()=>{document.removeEventListener('keydown',keyboard);document.body.classList.remove('presenting');};
}

function renderOrientation(target,presenting,route){
  if(presenting){
    const index=slideIndex(route), slide=slides[index];
    target.innerHTML=`<section class="presentation-panel" data-slide="${index+1}" aria-label="Course introduction">
      <div class="slide-top"><a href="#orientation" class="text-link">← Back</a><div class="slide-brand" aria-label="DTU and UAB"><img src="assets/dtu-logo.png" alt="DTU"><img src="assets/uab-logo.svg" alt="UAB"></div></div>
      <div class="slide-body"><h1 class="slide-title" tabindex="-1">${escape(slide.title)}</h1><p class="slide-lead">${escape(slide.lead)}</p><div class="slide-content">${slide.html}</div>${slide.link?external(slide.link.href,slide.link.label,'btn primary demo-link'):''}</div>
      <div class="slide-controls">${index?`<a class="btn" href="#orientation/present/${index}">← Previous</a>`:'<button class="btn" disabled>← Previous</button>'}<span id="slide-count" aria-live="polite">${index+1} / ${slides.length}</span><a class="btn primary" href="${index===slides.length-1?'#python':`#orientation/present/${index+2}`}">${index===slides.length-1?'Start Day 1 →':'Next →'}</a></div>
      <progress class="slide-progress" value="${index+1}" max="${slides.length}" aria-label="Presentation progress"></progress>
    </section><div class="presentation-footer"><span>← → to navigate · Esc to exit</span><a href="teacher-guide.html#slide-${index+1}" target="_blank" rel="noreferrer">Teacher notes ↗</a></div>`;
    return;
  }
  target.innerHTML=`${heading('Welcome to the course','Three days of hands-on Python for chemical and biochemical engineering.')}
    <div class="guide-actions"><a class="btn primary" id="start-presentation" href="#orientation/present/1">Start presentation →</a><a class="btn" href="#python">Go to Day 1</a></div>
    <section class="concept"><h2>Getting started</h2><div class="agenda">${slides.map((slide,i)=>`<a class="agenda-item" href="#orientation/present/${i+1}"><span class="agenda-time">${timeRange(i)}</span><span>${escape(slide.title)}</span><span aria-hidden="true">↗</span></a>`).join('')}</div></section>
    <details class="teacher-preparation"><summary>For teachers</summary><p>Allow 20 minutes. Run the first Python exercise once before class, have students sign in to Google, and open the Day 1 Colab notebook.</p><p>Keep the teaching notes on a second screen or print them. They include the timing, demonstrations, and questions for each slide.</p><div class="guide-actions"><a class="btn" href="teacher-guide.html" target="_blank" rel="noreferrer">Teaching notes / print to PDF ↗</a><a class="btn" href="#help/colab">Colab setup</a></div></details>`;
}

function renderHelp(target,requested){
  const topics=[['colab','Google Colab'],['workflow','Using the site'],['local','Local Python'],['commands','Commands'],['faq','FAQ']];
  const topic=topics.some(([id])=>id===requested)?requested:'colab';
  target.innerHTML=`${heading('Help & setup','Set up Python, find a command, or work through an error.')}
    <nav class="help-jumps" aria-label="Help topics">${topics.map(([id,label])=>`<a href="#help/${id}" ${id===topic?'aria-current="page"':''}>${label}</a>`).join('')}</nav>
    <section class="concept help-topic" id="help-${topic}">${helpTopic(topic)}</section>`;
  target.querySelectorAll('[data-os]').forEach(button=>button.onclick=()=>{target.querySelectorAll('[data-os]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));target.querySelectorAll('[data-os-panel]').forEach(panel=>panel.hidden=panel.dataset.osPanel!==button.dataset.os);});
  if(topic==='local'&&!navigator.userAgent.includes('Windows'))target.querySelector('[data-os="unix"]').click();
  if(topic==='faq')bindFaq(target);
}

function helpTopic(topic){
  if(topic==='workflow')return `<h2>Work through a lesson</h2><ol class="guide-list"><li><strong>Read the model.</strong> Identify the states, units, and initial conditions. Predict what should happen.</li><li><strong>Edit the TODO.</strong> Click Run Python to see your output and plots.</li><li><strong>Check the result.</strong> Run & check tests your current code. Read the last error line if a check fails.</li><li><strong>Explain your answer.</strong> Complete What to hand in, including labelled plots and numerical evidence.</li></ol><h3>Keep your work</h3><p>Drafts stay in this browser. Use <a href="#resources">Course files → Export work</a> for a backup. Download generated CSVs and plots before running again.</p><details><summary>How is this different from a notebook?</summary><p>Each site execution starts fresh. Colab and Jupyter keep variables from previously executed cells until the runtime restarts. Rerun setup and imports after restarting a notebook. Site drafts and Colab copies do not synchronize.</p></details><details><summary>Keyboard shortcuts</summary><p>Ctrl/⌘+Enter runs the site editor. Tab inserts indentation; Shift+Tab or Escape leaves the editor. In a notebook, Shift+Enter runs the selected cell.</p></details>`;
  if(topic==='colab')return `<h2>Run the course in Google Colab</h2><p>Choose a student notebook. Keep the course page open for the explanations.</p><div class="colab-grid">${notebookLinks()}</div><ol class="guide-list"><li><strong>Save your own copy.</strong> Sign in to Google and choose File → Save a copy in Drive. Give it your name.</li><li><strong>Connect and run setup.</strong> Use a normal CPU runtime. Run the first setup cell to create the model files.</li><li><strong>Work from top to bottom.</strong> Edit an exercise, press Shift+Enter, then run its check cell. Add a text cell for your explanation.</li><li><strong>Save your results.</strong> Save the notebook in Drive. Download an .ipynb copy and any CSVs or plots you need to hand in.</li></ol><details><summary>Test your Python setup</summary>${block('colab-smoke','Solve a known ODE','Paste into a Colab/Jupyter code cell, or use Run Python on the site',smokeCode)}<p>The result should include <code>y(1) = 2.718282</code>.</p></details><details><summary>Upload a downloaded notebook instead</summary><p>Download a student .ipynb from <a href="#resources">Course files</a>. In ${external('https://colab.research.google.com/','Colab')}, choose File → Upload notebook. Run the setup cell before the exercises.</p></details><p class="guide-source">${external('https://research.google.com/colaboratory/faq.html','Colab reference')} · <a href="#help/faq">Troubleshooting</a></p>`;
  if(topic==='local')return `<h2>Local Python <span class="muted">· optional</span></h2><p>Use Python 3.12 and JupyterLab. Put a <a href="#resources">student notebook</a> and the requirements file in a course folder, then open a terminal there.</p><div class="guide-actions"><a href="downloads/requirements-course.txt" download class="btn">Download requirements-course.txt</a>${external('https://www.python.org/downloads/','Get Python','text-link')}</div><div class="os-tabs" role="group" aria-label="Local setup operating system"><button class="btn" data-os="windows" aria-pressed="true">Windows</button><button class="btn" data-os="unix" aria-pressed="false">macOS / Linux</button></div><div data-os-panel="windows">${block('windows-setup','Create the environment and open JupyterLab','Windows PowerShell · run in your course folder',localCommands.windows)}</div><div data-os-panel="unix" hidden>${block('unix-setup','Create the environment and open JupyterLab','macOS/Linux terminal · run in your course folder',localCommands.unix)}</div><p>Open the URL printed in your terminal, select the notebook, and run its first setup cell. Save with Ctrl/⌘+S. Next time, only run the final JupyterLab command.</p><details><summary>Environment details</summary><p>The requirements match the site’s NumPy, SciPy, and Matplotlib versions. The commands use the virtual environment directly, so activation is unnecessary. In a notebook, <code>import sys; print(sys.executable)</code> should point into <code>.venv</code>. Colab may use different versions; record them in your report.</p><p>${external('https://docs.python.org/3.12/library/venv.html','Python environments')} · ${external('https://jupyterlab.readthedocs.io/en/stable/getting_started/starting.html','JupyterLab reference')}</p></details>`;
  if(topic==='commands')return `<h2>Useful commands</h2><p>Check the environment label before pasting. Terminal commands and notebook commands run in different places.</p>${commandGroups.map(c=>`<details class="command-item"><summary>${escape(c.label)}</summary>${block('command-'+c.id,c.label,c.where,c.code)}</details>`).join('')}<p class="guide-source">${external('https://github.com/googlecolab/colabtools/blob/main/google/colab/files.py','Colab file helpers')} · ${external('https://ipython.readthedocs.io/en/stable/interactive/magics.html#magic-pip','Notebook package installation')}</p>`;
  return `<h2>Questions & common errors</h2><label class="faq-search-label" for="faq-search">Search by error message or topic</label><input type="search" id="faq-search" class="faq-search" placeholder="NameError, CSV, parameters…"><div class="faq-filters" role="group" aria-label="Filter help by environment">${[['all','All'],['site','Site'],['colab','Colab'],['local','Local'],['numerics','Python & ODEs']].map(([id,label])=>`<button class="btn" data-faq-filter="${id}" aria-pressed="${id==='all'}">${label}</button>`).join('')}</div><p id="faq-count" class="storage-note" role="status"></p><div class="faq-list">${faq.map(f=>`<details data-faq-group="${f.group}"><summary>${escape(f.question)}</summary><p>${escape(f.answer)}</p></details>`).join('')}</div><p id="faq-empty" class="notice" hidden>No matching question. Try a shorter search or choose All.</p>`;
}

function bindFaq(target){
  let group='all';
  const filter=()=>{
    const query=target.querySelector('#faq-search').value.trim().toLowerCase();let count=0;
    target.querySelectorAll('[data-faq-group]').forEach(item=>{const show=(group==='all'||item.dataset.faqGroup===group)&&item.textContent.toLowerCase().includes(query);item.hidden=!show;if(show)count++;});
    target.querySelector('#faq-count').textContent=`${count} questions`;
    target.querySelector('#faq-empty').hidden=count!==0;
  };
  target.querySelector('#faq-search').oninput=filter;
  target.querySelectorAll('[data-faq-filter]').forEach(button=>button.onclick=()=>{group=button.dataset.faqFilter;target.querySelectorAll('[data-faq-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));filter();});
  filter();
}
