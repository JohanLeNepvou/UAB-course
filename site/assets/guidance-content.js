export const colabUrl = day => `https://colab.research.google.com/github/JohanLeNepvou/UAB-course/blob/main/site/notebooks/day${day}.ipynb`;
export const smokeCode = `import sys
import numpy as np
import scipy
import matplotlib
from scipy.integrate import solve_ivp

def rhs(t, y):
    return [y[0]]

sol = solve_ivp(rhs, (0, 1), [1.], rtol=1e-8, atol=1e-10)
assert sol.success, sol.message
assert np.isclose(sol.y[0, -1], np.e, rtol=1e-6)
print("Python:", sys.version.split()[0])
print("NumPy / SciPy / Matplotlib:", np.__version__, scipy.__version__, matplotlib.__version__)
print("y(1) =", round(sol.y[0, -1], 6), "— setup works")`;

export {slides} from './presentation.js';

export const commandGroups = [
  {id:'smoke',label:'Verify the scientific Python environment',where:'Site: Run Python · Colab/Jupyter: code cell',code:smokeCode},
  {id:'inspect',label:'Inspect a solver result',where:'Python cell, after creating sol',code:`print("Success:", sol.success)
print("State/time shape:", sol.y.shape)
print("Final state:", sol.y[:, -1])
print("Function evaluations:", sol.nfev)`},
  {id:'documentation',label:'Look up the ODE solver',where:'Python cell',code:`from scipy.integrate import solve_ivp
help(solve_ivp)`},
  {id:'working-folder',label:'Find your files',where:'Python cell',code:`from pathlib import Path
print("Working folder:", Path.cwd())
print("Files:", [p.name for p in Path.cwd().iterdir()])`},
  {id:'csv',label:'Write a CSV for the scalar setup-check solution',where:'Python cell, after the setup check above',code:`import numpy as np
np.savetxt("ode-result.csv", np.column_stack([sol.t, sol.y[0]]),
           delimiter=",", header="time_dimensionless,y", comments="")`},
  {id:'colab-download',label:'Download a generated file from Colab',where:'Google Colab only, after creating ode-result.csv',code:`from google.colab import files
files.download("ode-result.csv")`},
  {id:'install-notebook',label:'Install a missing scientific package',where:'Colab/Jupyter code cell only · use only if imports fail',code:`%pip install numpy scipy matplotlib`}
];
export const localCommands={
  windows:String.raw`py -3.12 --version
py -3.12 -m venv .venv
.\.venv\Scripts\python.exe -m pip install --upgrade pip
.\.venv\Scripts\python.exe -m pip install -r requirements-course.txt
.\.venv\Scripts\python.exe -m jupyterlab`,
  unix:`python3.12 --version
python3.12 -m venv .venv
.venv/bin/python -m pip install --upgrade pip
.venv/bin/python -m pip install -r requirements-course.txt
.venv/bin/python -m jupyterlab`
};
export const faq=[
  {group:'site',question:'Why does the starter fail its check?',answer:'The TODO is intentionally incomplete. Run the code, read the final assertion message, and compare it with the model equation. Complete the exercise before expecting a pass. A successful solver call alone does not mean the intended equation was implemented.'},
  {group:'site',question:'Can I use Colab without installing Python or creating a GitHub account?',answer:'Use the Open in Colab link for a student notebook and sign in to Google to work in a personal copy. You do not need a GitHub account for the public notebook. If your institution blocks Colab access, the course site runs its exercises without a student account.'},
  {group:'site',question:'Does the site submit work or synchronize my edits with Colab?',answer:'No. The site stores code drafts and completion flags in this browser. Export work saves a JSON backup; Colab uses separate .ipynb notebooks. Copy edited exercise code into the matching notebook cell explicitly. Follow the teacher’s instructions for handing in your notebook, explanations, and data files.'},
  {group:'site',question:'The first Python run is slow or Python cannot load. What should I do?',answer:'The first run downloads Python and scientific packages from cdn.jsdelivr.net. Wait for initialization and check your connection. If loading fails, retry Run; ask for network access to that domain or switch to the Colab notebook. A run times out after 180 seconds. A previously downloaded notebook can also be used in local Jupyter.'},
  {group:'site',question:'Why did variables or CSV files disappear between runs on the site?',answer:'Each site execution starts with a fresh namespace and working directory. Include imports and definitions in the exercise code. Download generated files from the output immediately. Code drafts are saved separately in browser storage; export a backup before changing browser, laptop, or clearing site data.'},
  {group:'colab',question:'NameError: name np, par, sol, or another variable is not defined',answer:'Run the cell that imports or defines the name before the cell that uses it. After changing parameters, rerun the parameter cell, the model/solve cell, and the plot/check cells. In a notebook, the order you execute cells matters more than their position on the page. After a runtime restart, rerun setup and imports too.'},
  {group:'colab',question:'ModuleNotFoundError: No module named course_models or course_source',answer:'Run the day notebook’s first support-file setup cell. It writes course_models.py and the original DAY3 model files into the notebook’s working folder. If you restarted the Colab runtime, run it again. Use the adapted student notebook from Course files rather than the unmodified original BDG notebook.'},
  {group:'colab',question:'ModuleNotFoundError for numpy, scipy, or matplotlib',answer:'In Colab/Jupyter, run the missing-package installation command below in a code cell, then retry the imports. Follow any runtime-restart prompt and rerun setup afterwards. In local Python, install requirements-course.txt with the same .venv interpreter that starts Jupyter. The course website loads its supported packages automatically; do not paste %pip into the site editor.'},
  {group:'colab',question:'Colab disconnected, or my generated CSV is missing',answer:'Reconnect, run the notebook setup cell, and rerun your completed cells in order. Notebook content saved in Drive is separate from files generated on the temporary runtime. Recreate the CSV, then use the Colab Files panel or files.download to save it to your laptop.'},
  {group:'colab',question:'Do I need a GPU, paid Colab, or Google Drive mounting?',answer:'These course examples use CPU-based NumPy/SciPy calculations. Use a normal Python runtime with no hardware accelerator. The notebook’s setup cell embeds its model support files, so Drive mounting is not required. Save a personal notebook copy in Drive and download generated results separately.'},
  {group:'local',question:'Windows says Python was not found, or py -3.12 is not recognized',answer:'Install Python 3.12 from python.org, open a new terminal, and check the interpreter again. The local instructions use the Windows py launcher. If your installation provides python instead, confirm python --version reports 3.12 before substituting python for py -3.12. Continue in the course site or Colab while resolving installation issues.'},
  {group:'local',question:'PowerShell blocks Activate.ps1. Must I change execution policy?',answer:'The provided Windows commands do not activate the environment. Run .\\.venv\\Scripts\\python.exe directly for installation and for starting JupyterLab. This uses the correct environment without changing PowerShell’s execution policy.'},
  {group:'local',question:'My local Jupyter notebook uses the wrong Python environment',answer:'Stop the Jupyter server and restart it using the exact .venv interpreter in the local setup commands. In a notebook cell, run import sys followed by print(sys.executable). It should point into your course .venv folder. Run the setup check and record the package versions.'},
  {group:'local',question:'My local .py script runs but no plot appears',answer:'The website and notebook interfaces display Matplotlib figures for you. In a standalone Python script, add plt.show() after plotting. Save a figure with plt.savefig("result.png", dpi=150, bbox_inches="tight") before plt.show(). Keep notebook-based work as the default workflow for the course.'},
  {group:'numerics',question:'SyntaxError or IndentationError: where should I look?',answer:'Read the last traceback line and the indicated code line. Check the colon after def, for, if, or else; matching parentheses; and consistent four-space indentation. Write powers as **, not ^. Copy code without terminal prompts such as >>> or $. %pip is notebook syntax, not ordinary Python syntax.'},
  {group:'numerics',question:'TypeError or a solve_ivp warning when passing parameters',answer:'Match the derivative signature rhs(t, y, par) with args=(par,). The comma creates a one-item tuple. Do not pass par=par as a solve_ivp keyword. Make sure the derivative returns one number per state, in the same order as y0.'},
  {group:'numerics',question:'ValueError about shapes or broadcasting',answer:'Print np.asarray(y0).shape and the derivative’s output shape. For n states, y0 and rhs(t,y,...) should each have length n. sol.y has shape (n_states, n_times); use sol.y[i] for one trajectory and sol.y.T when plotting all states against sol.t.'},
  {group:'numerics',question:'The solve is slow, fails, or produces negative concentrations',answer:'Inspect sol.success and sol.message before using the result. Check signs, units, initial values, and state order. Oxygen dynamics can be stiff: try BDF or Radau with suitable absolute tolerances. Split feed or setpoint discontinuities as in the teaching adapters. Do not hide a faulty balance by clipping the plotted result to zero.'},
  {group:'numerics',question:'My answer changes after I change tolerances or the random seed',answer:'Small numerical changes are expected; compare them with a refined solution and the scale of each state. A different seed changes the simulated experiment. Keep the seed, initial conditions, parameter set, solver, and tolerances in your report. In Day 3 the source kinetic variations are one-sided +2–5%, not symmetric noise.'},
  {group:'site',question:'What information should I bring when asking a teacher for help?',answer:'Give the day/session, environment (site, Colab, or local), the smallest code example that fails, the full error’s final lines, and the result you expected. For numerical problems, include y0, parameters, units, method, tolerances, and sol.message. State which cells you ran after the most recent runtime restart.'}
];
