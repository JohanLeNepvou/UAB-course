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

export const slides = [
  { minutes:2, title:'Three days, one engineering workflow',
    lead:'Turn a balance into Python, solve it, and check whether the result deserves your trust.',
    html:`<div class="slide-day-grid"><div><strong>DAY 1</strong><h2>Write & verify ODEs</h2><p>Python, solve_ivp, reversible reactions, and convergence.</p></div><div><strong>DAY 2</strong><h2>Balance & control</h2><p>Tank dynamics, P/PI control, and oxygen-limited growth.</p></div><div><strong>DAY 3</strong><h2>Simulate fermentation</h2><p>Nine states, feeding, inhibition, variability, and sensitivity.</p></div></div><div class="equation">Balance → derivative → solver → physical & numerical checks</div>`,
    notes:`Tell students: “By the end, you should be able to write and solve a basic engineering ODE and explain how you checked it.” The case study grows from a scalar derivative to the original yeast fermentation model. Emphasize state order and units from the beginning. A smooth curve is evidence of a calculation, not yet evidence of a correct model. The course follows YeastFermentation Days 1–3; the source notebook and cells are linked in every session.`,
    demo:'Point to the three day tabs and the final capstone in the sidebar. Ask students to name one quantity that could be an ODE state.',
    checkpoint:'Students can name a state, its unit, and a reason to check a numerical answer.' },
  { minutes:2, title:'Use a lesson from top to bottom',
    lead:'Read the model before changing the code. Finish by explaining the result.',
    html:`<ol class="slide-steps"><li><strong>Read:</strong> identify states, parameters, units, and initial conditions.</li><li><strong>Predict:</strong> sketch the direction of change or calculate a limiting result.</li><li><strong>Implement:</strong> edit the TODO and select Run Python.</li><li><strong>Verify:</strong> select Run & check; read a failing assertion as feedback.</li><li><strong>Interpret:</strong> write the requested engineering explanation and save your work.</li></ol><p class="slide-callout">A green check tests the code. The written deliverable tests your reasoning.</p>`,
    notes:`Open a lesson and locate the theory, task, editor, output, hint, solution, and hand-in requirement. Starter exercises are intentionally incomplete, so an initial failed check is expected. Run Python executes the code; Run & check executes the same code and then its assertions. Passing checks marks the lesson complete; students can also mark it manually. Neither action submits work to a teacher. Agree on your institution’s submission route before the course. Encourage students to predict, try, use a hint, and only then inspect a solution.`,
    demo:'Open the first ODE lesson in another tab. Point out Run Python, Run & check, the hint, and What to hand in.',
    link:{href:'#first-ode',label:'Open the ODE lesson for the live demo'},
    checkpoint:'Students can distinguish running code, checking it, and handing in the written work.' },
  { minutes:3, title:'Live demo: a derivative is not the next state',
    lead:'The first ODE is dy/dt = y with y(0) = 1. We know the answer before running Python.',
    html:`<div class="equation">dy/dt = y &nbsp; → &nbsp; y(t) = exp(t) &nbsp; → &nbsp; y(1) ≈ 2.718282</div><pre class="slide-code">def rhs(t, y):
    return [y[0]]

sol = solve_ivp(rhs, (0, 1), [1.], rtol=1e-8, atol=1e-10)
assert sol.success
assert np.isclose(sol.y[0, -1], np.e, rtol=1e-6)</pre><p><code>sol.y[0]</code> is the first state's trajectory. The function returns its derivative.</p>`,
    notes:`Use the prepared first-ODE tab. Run the starter, whose derivative is zero, and show that a solver can finish successfully while solving the wrong equation. Run & check should fail. Replace the derivative with [y[0]], then rerun and compare the numerical and exact trajectories. Explain that the derivative function receives the current state from the solver. It does not manually advance time. The checks compare the answer with exp(t); sol.success alone cannot establish that the intended equation was implemented. The slide snippet assumes the NumPy and solve_ivp imports already present in the exercise.`,
    demo:'Run the wrong derivative, inspect the failed assertion, change one line, then rerun. Point to the analytical comparison and the terminal value.',
    link:{href:'#first-ode',label:'Run the first-ODE demonstration'},
    checkpoint:'Ask: “If sol.success is True, could the model still be wrong?” Expected answer: yes.' },
  { minutes:3, title:'Check engineering structure, not only a plot',
    lead:'In the reversible reaction A ⇌ B, every loss from A is a gain to B.',
    html:`<div class="equation">dA/dt = −k₁A + k₂B<br>dB/dt = +k₁A − k₂B<br>d(A + B)/dt = 0</div><div class="slide-day-grid"><div><strong>INITIAL CONDITION</strong><h2>A + B = 4 mol/L</h2><p>A₀ = 3, B₀ = 1.</p></div><div><strong>EQUILIBRIUM</strong><h2>Aeq = 8/3 mol/L</h2><p>k₁ = 1, k₂ = 2 h⁻¹.</p></div><div><strong>NUMERICS</strong><h2>Refine & compare</h2><p>Check tolerances and conserved totals.</p></div></div>`,
    notes:`Add the two balances on the board: the reaction terms cancel. This gives a test independent of the numerical method. At equilibrium k1*A equals k2*B, and the total remains four. Students should later use this pattern for tank volumes and fed-batch amount balances. Distinguish verifying the implementation from validating biology against data. A conservation check can find a sign error but cannot prove that all chosen kinetic laws describe a real organism. Ask whether doubling both rate constants changes the equilibrium; it changes the speed, not the ratio.`,
    demo:'Show the coupled-reaction lesson and its conservation residual. Ask students to identify which derivative sign makes the total constant.',
    link:{href:'#isomerization',label:'Open the coupled-reaction lesson'},
    checkpoint:'Students can explain why A+B is a stronger check than “the curves look reasonable.”' },
  { minutes:4, title:'Move to your own Google Colab notebook',
    lead:'Keep the course open for instructions; work in a personal day notebook for your report.',
    html:`<ol class="slide-steps"><li>Open the Day 1 student notebook with <strong>Open in Colab</strong>.</li><li>Sign in and choose <strong>File → Save a copy in Drive</strong>. Rename your copy.</li><li>Connect to a Python runtime; use CPU / no hardware accelerator.</li><li>Run the first support-file setup cell. It creates the model helper files.</li><li>Run imports and exercise cells in order; use <strong>Shift+Enter</strong> to execute a selected cell.</li></ol><p class="slide-callout">Use the student notebook. The worked-solution notebook is a separate reference.</p>`,
    notes:`Demonstrate the direct Day 1 link and save a personal copy before making edits. The public GitHub notebook is the starting template; students do not need to push to the course repository. Point out the Connect control, a code cell, a text cell, and the execution button. The first setup cell contains the model files, so beginners do not need to clone a repository or mount Drive. CPU execution is sufficient for the course examples. Show the equivalent upload route in the help section if a direct link fails. Students should already be signed in before this four-minute segment; if an account is blocked, they can continue on the course site.`,
    demo:'Save and rename a copy, connect, run the setup cell, then run the first exercise. Show where a student adds an explanatory text cell.',
    link:{href:colabUrl(1),label:'Open Day 1 in Google Colab'},
    checkpoint:'Students have a named personal notebook and have executed its setup cell.' },
  { minutes:2, title:'Know what survives the next run',
    lead:'The course site starts each execution fresh. A notebook keeps variables until its kernel restarts.',
    html:`<div class="table-scroll"><table><thead><tr><th>This site</th><th>Colab / Jupyter</th></tr></thead><tbody><tr><td>Each execution uses a fresh namespace.</td><td>Executed cells share the active kernel's variables.</td></tr><tr><td>Imports are included in each exercise.</td><td>Run setup and imports before dependent cells.</td></tr><tr><td>Run & check reruns the edited code and tests.</td><td>Run the edited exercise cell, then its check cell.</td></tr><tr><td>Stop / restart Python terminates the worker.</td><td>Interrupt a running cell; rerun setup after a restart.</td></tr></tbody></table></div>`,
    notes:`Demonstrate a notebook NameError by referring to a variable before running the cell that defines it. Cell position is not execution order: changing a parameter cell has no effect until it is rerun. After changing a derivative, rerun the solve and plot cells too. If a runtime restarts, recreate support files and rerun imports. Once a completed notebook is ready, restart its kernel and run it from top to bottom to check reproducibility. Do not start an incomplete student notebook with Run all: its first intentional assertion failure will interrupt the sequence.`,
    demo:'Change a parameter, rerun its definition, rerun the solve, then rerun the check. Explain why an old output may still show an old result.',
    checkpoint:'Students can explain a NameError and know which cells to rerun after changing a parameter.' },
  { minutes:2, title:'Save code, notebooks, and generated files separately',
    lead:'A notebook, a browser backup, and a CSV are different deliverables.',
    html:`<div class="table-scroll"><table><thead><tr><th>Work</th><th>How to keep it</th></tr></thead><tbody><tr><td>Site edits & completion</td><td>Course files → Export work → JSON backup.</td></tr><tr><td>Personal Colab notebook</td><td>Save in Drive; download an .ipynb copy for hand-in.</td></tr><tr><td>CSV data & PNG plots</td><td>Download the generated file before the runtime resets.</td></tr><tr><td>Engineering reasoning</td><td>Add labelled plots, units, assumptions, and interpretation to the notebook.</td></tr></tbody></table></div><p class="slide-callout">Site drafts and Colab copies do not synchronize. Transfer edited code explicitly.</p>`,
    notes:`Show the site's Export work control. That JSON restores site drafts; it is not a Jupyter notebook. Download the current exercise as .py if moving a specific implementation, then paste its code into the corresponding notebook cell. In Colab, saving a notebook preserves notebook content, not every CSV on the temporary runtime filesystem. Demonstrate downloading one generated file from the Files panel, or show the files.download helper. The notebook and data files belong together in the final submission. The teacher should specify the actual hand-in system; this site does not collect submissions.`,
    demo:'Show a JSON backup and a student .ipynb download. Explain which one opens in Colab and which one restores site drafts.',
    link:{href:'#resources',label:'Open course files and backup controls'},
    checkpoint:'Students know which file to use to resume editing and which files to submit.' },
  { minutes:2, title:'Two-minute readiness check',
    lead:'Run a known ODE in your chosen environment, then explain the answer to your neighbour.',
    html:`<ol class="slide-steps"><li>Run the setup-check code in Help & setup.</li><li>Confirm it reports <strong>y(1) = 2.718282</strong> and displays the package versions.</li><li>Explain what the derivative returns and why this particular answer can be checked.</li><li>Locate the Day 1 exercise, the help page, and your saved notebook or backup.</li></ol><div class="equation">Ready? Start with Python → ODEs → balances → verification.</div>`,
    notes:`Ask students to run the shared setup check rather than install software during this final segment. The check uses dy/dt=y, so it exercises NumPy, SciPy, imports, and a known numerical answer without depending on the fermentation support files. Students on the site can paste it into an exercise editor and choose Run Python, not Run & check, because lesson checks expect that lesson's variables. Colab/local students add a code cell. Check for two common blockers: missing imports and a notebook setup cell that was never run. Students can use the help FAQ or continue in the browser while an account or local setup issue is resolved.`,
    demo:'Open Help & setup → Google Colab, copy the setup check, and have students run it. Finish by returning to Day 1.',
    link:{href:'#help/colab',label:'Open the setup check and student guide'},
    checkpoint:'Every student has one working Python environment and can locate their work.' }
];

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
