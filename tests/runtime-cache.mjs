import fs from 'node:fs';
import path from 'node:path';

// Reuse the exact pinned runtime artifacts downloaded by test:python.
// This avoids repeating large CDN downloads for each browser regression run.
export async function reuseRuntimeCache(context){
  await context.route('https://cdn.jsdelivr.net/pyodide/v0.27.7/full/**',async route=>{
    const name=new URL(route.request().url()).pathname.split('/').pop();
    const file=path.resolve('node_modules/pyodide',name);
    if(!fs.existsSync(file))return route.continue();
    const contentType=name.endsWith('.wasm')?'application/wasm':/\.(m?js)$/.test(name)?'text/javascript':name.endsWith('.json')?'application/json':'application/octet-stream';
    await route.fulfill({body:fs.readFileSync(file),contentType,headers:{'Access-Control-Allow-Origin':'*'}});
  });
}
