import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {serve} from '../scripts/serve.mjs';
import {lessons} from '../site/assets/lessons.js';
import {reuseRuntimeCache} from './runtime-cache.mjs';
const server=await serve(0);
const url=`http://127.0.0.1:${server.address().port}`;
const executablePath=process.env.BROWSER_EXECUTABLE || (process.platform==='win32'?'C:/Program Files/Google/Chrome/Application/chrome.exe':undefined);
const browser=await chromium.launch({headless:true,...(executablePath?{executablePath}:{})});
const context=await browser.newContext({viewport:{width:1440,height:1050},acceptDownloads:true});
await reuseRuntimeCache(context);
const page=await context.newPage();
const errors=[];page.on('pageerror',e=>errors.push(e.message));
fs.mkdirSync('test-results',{recursive:true});
try{
  await page.goto(url,{waitUntil:'domcontentloaded'});
  await page.locator('h1').waitFor();
  assert.equal(await page.locator('.nav-lesson').count(),18);
  await page.screenshot({path:'test-results/day1-desktop.png',fullPage:true});
  await page.locator('#editor').fill('print("saved draft")');
  await page.reload({waitUntil:'domcontentloaded'});
  assert.equal(await page.locator('#editor').inputValue(),'print("saved draft")');
  await page.locator('#reset').click();
  await page.locator('#check').click();
  try{await page.waitForFunction(()=>!document.querySelector('#check').disabled,{},{timeout:190000});}
  catch(error){console.log('Runtime status:',await page.locator('#runtime-status').textContent());console.log('Output:',await page.locator('#output').innerText());throw error;}
  assert.match(await page.locator('#output').innerText(),/AssertionError/);
  console.log('PASS real browser: runtime loaded; incomplete exercise fails checks; drafts survive reload');
  for(const lesson of lessons){
    await page.goto(url+'/#'+lesson.id,{waitUntil:'domcontentloaded'});
    await page.locator('h1').waitFor();
    assert.equal(await page.locator('h1').innerText(),lesson.title);
    await page.locator('#editor').fill(lesson.solution);
    await page.locator('#check').click();
    await page.waitForFunction(()=>!document.querySelector('#check').disabled,{},{timeout:180000});
    const output=await page.locator('#output').innerText();
    assert.match(output,/All numerical checks passed/,`${lesson.id}: ${output}`);
    if(lesson.id==='sensitivity')assert.equal(await page.locator('.download-files a').getAttribute('download'),'fermentation.csv');
    if(lesson.id==='fed-batch'){
      assert.ok(await page.locator('.plot').count()>0);
      const source=page.locator('[data-source="course_source/DAY3/model.py"]');
      await source.locator('summary').click();
      await page.waitForFunction(()=>document.querySelector('[data-source="course_source/DAY3/model.py"] pre').textContent.includes('def fedbatch'));
      await source.locator('summary').click();
      await page.evaluate(()=>window.scrollTo(0,0));
      await page.screenshot({path:'test-results/day3-desktop.png',fullPage:true});
    }
    console.log('PASS real browser: '+lesson.id);
  }
  // Exercise the worker termination/restart path without cross-origin isolation.
  await page.locator('#editor').fill('while True:\n    pass');
  await page.locator('#run').click();await page.waitForTimeout(200);await page.locator('#stop').click();
  assert.match(await page.locator('#output').innerText(),/Execution stopped/);
  await page.locator('#editor').fill('print("runtime restarted")');await page.locator('#run').click();
  await page.waitForFunction(()=>!document.querySelector('#run').disabled,{},{timeout:180000});
  assert.match(await page.locator('#output').innerText(),/runtime restarted/);
  await page.goto(url+'/#resources',{waitUntil:'domcontentloaded'});
  const [backup]=await Promise.all([page.waitForEvent('download'),page.locator('#export-work').click()]);
  const backupPath=await backup.path();const work=JSON.parse(fs.readFileSync(backupPath,'utf8'));
  assert.equal(Object.values(work.completed).filter(Boolean).length,18);
  for(const link of await page.locator('a[download]').all()){
    const href=await link.getAttribute('href');if(href){const response=await context.request.get(url+'/'+href);assert.equal(response.status(),200,href);}
  }
  const mobile=await context.newPage();
  await mobile.setViewportSize({width:390,height:844});
  await mobile.goto(url+'/#fed-batch',{waitUntil:'domcontentloaded'});
  await mobile.locator('h1').waitFor();
  assert.ok(await mobile.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'No horizontal page overflow on a phone');
  await mobile.locator('#menu').click();assert.equal(await mobile.locator('#menu').getAttribute('aria-expanded'),'true');
  await mobile.locator('.nav-day-title').first().click();
  await mobile.locator('#course-nav a[href="#python"]').click();
  await mobile.waitForFunction(()=>document.querySelector('#menu').getAttribute('aria-expanded')==='false');
  await mobile.screenshot({path:'test-results/mobile.png',fullPage:true});
  assert.deepEqual(errors,[]);
  console.log('PASS real browser: stop/restart, export backup, downloadable files, mobile navigation, no JavaScript errors');
}finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
