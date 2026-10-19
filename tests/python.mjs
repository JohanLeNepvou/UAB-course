// Execute the actual student code/checks in the same pinned scientific runtime.
import fs from 'node:fs';
import path from 'node:path';
import {loadPyodide} from 'pyodide';
import {lessons} from '../site/assets/lessons.js';
console.log('Loading pinned Python/NumPy/SciPy/Matplotlib runtime…');
const py=await loadPyodide();
await py.loadPackage(['numpy','scipy','matplotlib']);
for(const [from,to] of [
  ['site/assets/course_models.py','/course/course_models.py'],
  ['site/course_source/DAY3/model.py','/course/course_source/DAY3/model.py'],
  ['site/course_source/DAY3/parameters.py','/course/course_source/DAY3/parameters.py']]){
  py.FS.mkdirTree(path.posix.dirname(to));py.FS.writeFile(to,fs.readFileSync(from,'utf8'));
}
py.runPython(`import sys, os, matplotlib
sys.path.insert(0,'/course')
matplotlib.use('Agg')
os.makedirs('/test-output', exist_ok=True)
os.chdir('/test-output')
`);
let failures=0;
for(const lesson of lessons){
  py.globals.set('_code',lesson.solution);py.globals.set('_checks',lesson.checks);py.globals.set('_starter',lesson.starter);
  const report=JSON.parse(py.runPython(`
import json, traceback, contextlib, io
import matplotlib.pyplot as plt
report = {'solution': False, 'starter_fails': False, 'error': ''}
try:
    with contextlib.redirect_stdout(io.StringIO()):
        ns = {'__name__':'__main__'}
        exec(compile(_code,'solution.py','exec'),ns)
        exec(compile(_checks,'checks.py','exec'),ns)
        report['solution'] = True
        plt.close('all')
        ns = {'__name__':'__main__'}
        exec(compile(_starter,'starter.py','exec'),ns)
        try:
            exec(compile(_checks,'checks.py','exec'),ns)
        except AssertionError:
            report['starter_fails'] = True
except BaseException:
    report['error'] = traceback.format_exc()
plt.close('all')
json.dumps(report)
`));
  const okay=report.solution&&report.starter_fails;
  console.log(`${okay?'PASS':'FAIL'} ${lesson.id} — solution ${report.solution?'passes':'fails'}, starter ${report.starter_fails?'needs completion':'unexpectedly passes'}`);
  if(!okay){failures++;if(report.error)console.log(report.error);}
}
// Verify the numerical adapter independently of the exercise implementations.
try{
  py.runPython(`
import numpy as np
from course_models import *
from course_source.DAY3.model import fedbatch as original
par=YeastParameters()
y=np.array(initial_values())
feed=feed_values(y.tolist())
assert np.allclose(yeast_rhs(0,y,par,feed,False), original(0,y,par,feed))
assert np.allclose(yeast_rhs(3,y,par,feed,True), original(3,y,par,feed))
bdf=simulate_yeast(method='BDF',rtol=1e-8,atol=1e-10)
radau=simulate_yeast(method='Radau',rtol=1e-8,atol=1e-10)
assert np.array_equal(bdf.t,radau.t)
assert np.max(abs(bdf.y-radau.y)) < 1e-4
for end in [1.,2.,3.,12.3315017762,20.]:
    sol=simulate_yeast(end=end)
    assert np.isclose(sol.t[-1],end)
    assert np.all(np.diff(sol.t)>0)
    assert np.max(sol.y[8])<=2+1e-6
for seed in range(10):
    ini=variable_feedstock(seed)
    par=variable_growth_parameters(seed)
    assert 35<=ini[0]<=40 and 18<=ini[1]<=28 and ini[7:]==[5.,0.7]
    assert 1.02<=par.numaxG/1.7271<=1.05
    sol=simulate_yeast(par=par,initial=ini)
    assert np.min(sol.y[:8])>-1e-6
    assert np.max(sol.y[8])<=2+1e-6
`);
  console.log('PASS model/source equivalence, BDF–Radau convergence, phase boundaries, ten-run physical bounds');
}catch(error){failures++;console.log('FAIL independent model checks\n'+error.message);}
// Execute an entire exported solution notebook, including its embedded setup.
for(const day of [1,2,3]){
  try{
    py.globals.set('_notebook_dir',`/notebook-day${day}`);
    py.runPython(`
os.makedirs(_notebook_dir, exist_ok=True)
os.chdir(_notebook_dir)
sys.path = [_notebook_dir] + [p for p in sys.path if p != '/course' and not p.startswith('/notebook-day')]
for name in list(sys.modules):
    if name == 'course_models' or name == 'course_source' or name.startswith('course_source.'):
        del sys.modules[name]
`);
    const notebook=JSON.parse(fs.readFileSync(`site/notebooks/day${day}-solutions.ipynb`,'utf8'));
    for(const cell of notebook.cells.filter(c=>c.cell_type==='code')){
      py.globals.set('_cell',cell.source.join(''));
      py.runPython(`with contextlib.redirect_stdout(io.StringIO()):\n    exec(compile(_cell,'notebook.py','exec'))\nplt.close('all')`);
    }
    console.log(`PASS portable Day ${day} solution notebook`);
  }catch(error){failures++;console.log(`FAIL Day ${day} notebook\n${error.message}`);}
}
if(failures)process.exitCode=1;
console.log(`Python verification complete: ${failures} failure(s).`);
