// Pinned runtime: upgrades should be accompanied by the full Python/browser checks.
let ready;
function status(message,state='busy'){self.postMessage({type:'status',message,state});}
async function initialize(){
  status('Loading Python 3.12…');
  const {loadPyodide}=await import('https://cdn.jsdelivr.net/pyodide/v0.27.7/full/pyodide.mjs');
  const py=await loadPyodide({indexURL:'https://cdn.jsdelivr.net/pyodide/v0.27.7/full/'});
  status('Loading NumPy, SciPy & Matplotlib…');
  await py.loadPackage(['numpy','scipy','matplotlib']);
  for(const path of ['course_source/DAY3/model.py','course_source/DAY3/parameters.py','assets/course_models.py']){
    const response=await fetch(new URL('../'+path,import.meta.url));
    if(!response.ok)throw new Error('Could not load model support file: '+path);
    const dest=path==='assets/course_models.py'?'/course/course_models.py':'/course/'+path;
    py.FS.mkdirTree(dest.slice(0,dest.lastIndexOf('/')));py.FS.writeFile(dest,await response.text());
  }
  py.runPython(`import sys, os, matplotlib
sys.path.insert(0, '/course')
matplotlib.use('Agg')
os.makedirs('/runs', exist_ok=True)
`);
  return py;
}
self.onmessage=async({data})=>{
  try{
    ready??=initialize();
    const py=await ready;
    status('Running Python…');
    py.globals.set('_uab_code',data.code);py.globals.set('_uab_checks',data.checks);py.globals.set('_uab_id',data.id);
    const result=await py.runPythonAsync(`
import io, json, traceback, base64, contextlib, pathlib, os
import matplotlib.pyplot as _plt
_plt.close('all')
_run_dir = pathlib.Path('/runs') / _uab_id
_run_dir.mkdir(exist_ok=True)
os.chdir(_run_dir)
_namespace = {'__name__': '__main__'}
_stdout = io.StringIO()
_result = {'stdout':'', 'error':'', 'plots':[], 'files':[], 'passed':False}
with contextlib.redirect_stdout(_stdout), contextlib.redirect_stderr(_stdout):
    try:
        exec(compile(_uab_code, 'exercise.py', 'exec'), _namespace)
        if _uab_checks:
            exec(compile(_uab_checks, 'checks.py', 'exec'), _namespace)
            _result['passed'] = True
    except BaseException:
        _result['error'] = traceback.format_exc()
_result['stdout'] = _stdout.getvalue()[:100000]
for _num in _plt.get_fignums()[:12]:
    _buffer = io.BytesIO()
    _plt.figure(_num).savefig(_buffer, format='png', dpi=120, bbox_inches='tight')
    _result['plots'].append(base64.b64encode(_buffer.getvalue()).decode())
_plt.close('all')
for _path in sorted(_run_dir.iterdir()):
    if _path.is_file() and _path.suffix.lower() in ('.csv','.png','.txt','.json','.npy') and _path.stat().st_size <= 5000000:
        _result['files'].append({'name':_path.name, 'data':base64.b64encode(_path.read_bytes()).decode()})
os.chdir('/course')
import shutil
shutil.rmtree(_run_dir)
json.dumps(_result)
`);
    self.postMessage({type:'result',id:data.id,...JSON.parse(result)});
  }catch(error){ready=null;self.postMessage({type:'result',id:data.id,fatal:true,error:'Python could not complete this run. Check your network connection and retry.\n'+error.message});}
};
