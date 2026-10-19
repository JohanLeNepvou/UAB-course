import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {lessons,days} from '../site/assets/lessons.js';
import {slides,colabUrl,localCommands} from '../site/assets/guidance-content.js';

test('the three-day curriculum has unique lessons, real source cells, and executable tasks',()=>{
  assert.equal(lessons.length,18);assert.equal(new Set(lessons.map(l=>l.id)).size,18);
  for(const d of days){const sequence=lessons.filter(l=>l.day===d.n);assert.equal(sequence.length,6);assert.equal(sequence.reduce((s,l)=>s+l.duration,0),300);}
  for(const l of lessons){
    const nb=JSON.parse(fs.readFileSync('site/course_source/'+l.source,'utf8'));
    for(const n of l.cells) assert.ok(nb.cells[n],`${l.id} references missing cell ${n}`);
    assert.match(l.source,/^DAY[123]\//);
    for(const field of ['theory','objective','task','starter','solution','checks','hint','interpretation','deliverable'])assert.ok(l[field],`${l.id} lacks ${field}`);
    assert.match(l.checks,/assert /);assert.notEqual(l.starter,l.solution);
  }
});
test('preserved sources match their manifest and original workspace files when available',()=>{
  const manifest=JSON.parse(fs.readFileSync('site/source-manifest.json','utf8'));
  for(const entry of manifest.files){
    const bytes=fs.readFileSync('site/'+entry.path);
    assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),entry.sha256);
    const original=path.join('../YeastFermentation',entry.path.replace('course_source/',''));
    if(fs.existsSync(original))assert.deepEqual(bytes,fs.readFileSync(original));
  }
});
test('portable notebooks contain support files, all six exercises, and valid cell IDs',()=>{
  for(const d of days)for(const suffix of ['','-solutions']){
    const nb=JSON.parse(fs.readFileSync(`site/notebooks/day${d.n}${suffix}.ipynb`,'utf8'));
    assert.equal(nb.nbformat,4);assert.equal(nb.nbformat_minor,5);
    assert.equal(new Set(nb.cells.map(c=>c.id)).size,nb.cells.length);
    assert.equal(nb.cells.filter(c=>c.cell_type==='code').length,13);
    assert.match(nb.cells[1].source.join(''),/course_source\/DAY3\/model.py/);
  }
});
test('all deployment paths are relative and packaged assets exist',()=>{
  const html=fs.readFileSync('site/index.html','utf8');
  for(const [,url] of html.matchAll(/(?:src|href)="(assets\/[^\"]+)"/g))assert.ok(fs.existsSync('dist/'+url),url);
  assert.ok(fs.existsSync('dist/.nojekyll'));
  assert.ok(fs.existsSync('dist/source-manifest.json'));
  assert.doesNotMatch(html,/(?:href|src)="\/assets/);
});
test('teacher introduction lasts 20 minutes and setup artifacts target real student notebooks',()=>{
  assert.equal(slides.reduce((sum,s)=>sum+s.minutes,0),20);
  for(const slide of slides){assert.ok(slide.notes&&slide.demo&&slide.checkpoint);if(slide.link?.href.startsWith('#')&&!slide.link.href.startsWith('#help')&&slide.link.href!=='#resources')assert.ok(lessons.find(l=>'#'+l.id===slide.link.href));}
  for(const day of [1,2,3]){
    const target=new URL(colabUrl(day)).pathname.replace('/github/JohanLeNepvou/UAB-course/blob/main/','');
    const notebook=JSON.parse(fs.readFileSync(target,'utf8'));
    assert.match(notebook.cells[0].source.join(''),/Student exercises/);
  }
  assert.ok(!localCommands.windows.includes('Activate.ps1'));
  const guide=fs.readFileSync('dist/teacher-guide.html','utf8');
  assert.equal((guide.match(/<article>/g)||[]).length,8);
  assert.ok(fs.existsSync('dist/downloads/requirements-course.txt'));
  assert.ok(fs.existsSync('dist/downloads/setup-check.py'));
});
