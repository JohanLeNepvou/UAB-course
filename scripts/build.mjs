import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {lessons,days} from '../site/assets/lessons.js';
import {slides,smokeCode} from '../site/assets/guidance-content.js';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const site=path.join(root,'site');
fs.mkdirSync(path.join(site,'downloads'),{recursive:true});
fs.writeFileSync(path.join(site,'downloads/setup-check.py'),smokeCode+'\n');
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let elapsed=0;
const teachingNotes=slides.map((slide,i)=>{const start=elapsed;elapsed+=slide.minutes;const link=slide.link?.href.startsWith('#')?'https://johanlenepvou.github.io/UAB-course/'+slide.link.href:slide.link?.href;return `<article><header><span>PART ${i+1} / 8</span><strong>${String(start).padStart(2,'0')}–${String(elapsed).padStart(2,'0')} MIN</strong></header><h1>${escape(slide.title)}</h1><p class="lead">${escape(slide.lead)}</p>${slide.html}<h2>Teacher script</h2><p>${escape(slide.notes)}</p><h2>Demonstrate</h2><p>${escape(slide.demo)}</p><h2>Student checkpoint</h2><p>${escape(slide.checkpoint)}</p>${link?`<p><a href="${escape(link)}">${escape(slide.link.label)}</a></p>`:''}</article>`;}).join('');
fs.writeFileSync(path.join(site,'teacher-guide.html'),`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>UAB · 20-minute teacher introduction</title><style>body{font:16px/1.7 system-ui,sans-serif;color:#183b32;background:#f5f7f0;margin:0;padding:30px}main{max-width:950px;margin:auto}article{background:white;padding:35px;margin:25px 0;border:1px solid #d7e0cf;border-radius:8px}header{display:flex;justify-content:space-between;font-size:12px;letter-spacing:1px}h1{font-size:29px;line-height:1.3}h2{font-size:19px}.lead{font-size:18px;color:#60715a}.equation,pre{background:#eff4e7;padding:18px;overflow:auto}pre{font-size:13px}table{width:100%;border-collapse:collapse}td,th{text-align:left;border:1px solid #d7e0cf;padding:8px}a{color:#164c43}button{padding:12px 20px;cursor:pointer}.slide-day-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}.slide-day-grid h2{font-size:17px}.slide-callout{font-weight:600}@media print{body{background:white;padding:0;font-size:11pt}button,.intro-links{display:none}article{break-before:page;border:0;padding:0;margin:0}h1{font-size:22pt}pre{white-space:pre-wrap;font-size:10pt}a{color:inherit}.slide-day-grid{display:block}}@media(max-width:650px){body{padding:15px}article{padding:20px}.slide-day-grid{display:block}}</style></head><body><main><h1>UAB · Teacher introduction</h1><p>20 minutes · 8 parts · original YeastFermentation Days 1–3.</p><p>Before class: pre-load the site's Python runtime, open the first ODE exercise in another tab, and have students sign in to Google. Agree on a hand-in route. This introduction is separate from the 300-minute exercise schedule.</p><p class="intro-links"><a href="https://johanlenepvou.github.io/UAB-course/#orientation/present/1">Present on the course website</a> · <a href="https://johanlenepvou.github.io/UAB-course/#help">Student help & setup</a></p><button onclick="window.print()">Print / save as PDF</button>${teachingNotes}<p>Platform references: <a href="https://github.com/googlecolab/colabtools/blob/main/notebooks/colab-github-demo.ipynb">Google Colab GitHub guide</a> · <a href="https://research.google.com/colaboratory/faq.html">Google Colab FAQ</a>. Model content follows the course’s original Day 1–3 notebooks.</p></main></body></html>\n`);
const supportFiles=['assets/course_models.py','course_source/DAY3/model.py','course_source/DAY3/parameters.py'];
const support=Object.fromEntries(supportFiles.map(p=>[p==='assets/course_models.py'?'course_models.py':p,fs.readFileSync(path.join(site,p),'utf8')]));
const cell=(type,text)=>({cell_type:type,metadata:{},...(type==='code'?{execution_count:null,outputs:[]}:{}),source:text.split(/(?<=\n)/)});
const bootstrap=`# These support files are embedded for portable, offline notebook use.
# Original files retain their source content; course_models.py documents adapters.
import json
from pathlib import Path
_support = json.loads(${JSON.stringify(JSON.stringify(support))})
for _name, _content in _support.items():
    _path = Path(_name)
    _path.parent.mkdir(parents=True, exist_ok=True)
    _path.write_text(_content, encoding='utf-8')
print('Model support ready. Requires numpy, scipy, matplotlib.')
`;
for(const day of days){
  for(const solved of [false,true]){
    const cells=[cell('markdown',`# UAB · Day ${day.n}: ${day.title}\n\n${solved?'**Worked solutions.**':'**Student exercises.** Replace the TODOs, then run the check cell after each exercise.'}\n\n${day.description}\n\n${day.outcome}\n\nTime is in hours unless specified; model concentrations are g/L and volume is L.\n\nSource: YeastFermentation Days 1–3. Python translation: Johan Le Nepvou De Carfort. Original MATLAB teaching material: Pedram Ramin and Krist Gernaey, PROSYS, DTU.\n\nRun the embedded support-file setup once. For local Jupyter install numpy, scipy, and matplotlib first.\n`),cell('code',bootstrap)];
    for(const l of lessons.filter(l=>l.day===day.n)){
      // Jupyter supports inline HTML, preserving the readable equation blocks.
      cells.push(cell('markdown',`## ${l.number}. ${l.title}\n\n**Objective:** ${l.objective}\n\n${l.theory}\n\n**Task:** ${l.task}\n\nSource: ${l.source}, original zero-based cells ${l.cells.join(', ')}.\n`));
      cells.push(cell('code',solved?l.solution:l.starter));
      cells.push(cell('markdown','### Check your result\nRun this after completing the exercise. An AssertionError indicates a result to investigate.\n'));
      cells.push(cell('code',l.checks+'\nprint("All numerical checks passed.")\n'));
      cells.push(cell('markdown',`**Interpretation:** ${l.interpretation}\n\n**Hand in:** ${l.deliverable}\n`));
    }
    const notebook={cells,metadata:{kernelspec:{display_name:'Python 3',language:'python',name:'python3'},language_info:{name:'python',version:'3.12'}},nbformat:4,nbformat_minor:5};
    // Stable cell IDs keep notebooks valid under nbformat 4.5+.
    notebook.cells.forEach((c,i)=>c.id=`day${day.n}-${solved?'solution':'student'}-${i}`);
    fs.writeFileSync(path.join(site,`notebooks/day${day.n}${solved?'-solutions':''}.ipynb`),JSON.stringify(notebook,null,1)+'\n');
  }
}
function list(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?list(path.join(dir,e.name)):[path.join(dir,e.name)]);}
const files=list(path.join(site,'course_source')).map(p=>({path:path.relative(site,p).replaceAll('\\','/'),sha256:crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex')}));
const manifest={source:'YeastFermentation DAY1, DAY2, DAY3',cell_numbering:'zero-based',files,lessons:lessons.map(({id,day,source,cells})=>({id,day,source,cells}))};
fs.writeFileSync(path.join(site,'source-manifest.json'),JSON.stringify(manifest,null,2)+'\n');
fs.mkdirSync(path.join(root,'dist'),{recursive:true});
fs.cpSync(site,path.join(root,'dist'),{recursive:true});
console.log(`Built ${lessons.length} lessons, 6 portable notebooks, and ${files.length} preserved source files into dist/.`);
