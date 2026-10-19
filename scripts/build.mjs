import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {lessons,days} from '../site/assets/lessons.js';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const site=path.join(root,'site');
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
