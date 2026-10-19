# UAB · Python for chemical & biochemical engineering

A three-day, hands-on university course built from **YeastFermentation DAY1, DAY2, and DAY3**. Students edit and execute Python in their browser using a pinned Pyodide runtime with NumPy, SciPy, and Matplotlib. No Python installation or account is required for the website.

Course: **https://johanlenepvou.github.io/UAB-course/**

## Teaching sequence

Each day has six sessions and 300 minutes of practical work. A suggested 09:00–16:00 teaching day adds lunch, breaks, and discussion. The intended audience is university students with limited to moderate Python and numerical modelling experience.

| Day | Technical work | Assessed outcome |
| --- | --- | --- |
| 1 | Python functions and arrays; initial-value problems; parameter passing; RK45/BDF; reversible isomerization; Euler convergence and stability | A verified coupled ODE model with analytical, conservation, and convergence checks |
| 2 | Tank accumulation; P/PI feedback; three-state oxygen-limited chemostat; oxygen PI control; stiffness and solver diagnostics | Correct balances, controller signs, actuator reconstruction, and a justified solver choice |
| 3 | Five-reaction/eight-component kinetics; nine-state fed-batch model; feed phase transitions; seeded feedstock/growth variability; sensitivity and CSV export | A reproducible fermentation study with extensive balance tests and numerical verification |

Each session includes derivation, state/units explanations, an incomplete executable exercise, numerical checks, a hint, worked solution, interpretation, and a written deliverable. Checks rerun the student's current code in a fresh namespace. They are learning aids, not secure examination grading; solutions are intentionally available.

## Source fidelity

The original material is preserved under `site/course_source/`. Lesson metadata maps to original notebooks and zero-based cell numbers. `site/source-manifest.json` records source-file SHA-256 hashes. Only Days 1–3 are included; Days 4–5 and unrelated top-level notebooks are excluded.

`site/assets/course_models.py` supplies explicitly documented teaching adapters. It reuses the original DAY3 reaction implementation and parameter class. It separates feed phases to resolve discontinuities without changing the reaction equations, feed policy, or source parameter values. The course describes the original simplified oxygen consumption law and the incompleteness of the yeast model's elemental balance.

Documented corrections:

- DAY1: replace invalid `par=par` solver usage and a captured default parameter list with explicit `args`.
- DAY2: reconstruct oxygen-controller actuation using the actual gain (−50000) and integral state; the original plotting expression used −60000 and omitted integral action. Use the temperature-dependent `mux` and calculated `O_sat` actually read by the source derivative.
- DAY3: correct time labels to hours and volume to litres. Split integration at 2 h and the analytical 2 L filling time. Retain the five implemented reactions, source feed composition, one-sided +2–5% kinetic variations, and original seeded draw order/coupling.
- Preserve the original source files, including their comments and unused parameters. The standalone DAY3 demo omits `Cfeed`; the teaching adapter supplies it correctly.

Attribution: Python translation by **Johan Le Nepvou De Carfort**. Original MATLAB teaching material by **Pedram Ramin and Krist Gernaey**, PROSYS, Department of Chemical and Biochemical Engineering, Technical University of Denmark. Original notebook attribution is retained.

## Develop and verify

Requires Node.js 22 or later. Python is not required for the build or automated checks.

```sh
npm ci
npm run build
npm test
npm run test:python
npm start
```

Open `http://127.0.0.1:4173`. The browser must load the page over HTTP, not as a `file://` URL. The static build is written to `dist/` and works under the `/UAB-course/` GitHub Pages path. Source lives in `site/`; edit that directory, then rebuild. No backend, credentials, or database are needed by the course.

`npm run test:python` runs every solution and check in the exact pinned browser Python runtime, confirms each starter needs completion, compares teaching/source derivatives, checks solver convergence and feed boundaries, and executes all three exported solution notebooks.

`npm run test:browser` uses Playwright with an installed Chrome on Windows (or set `BROWSER_EXECUTABLE`), and runs all 18 solutions through the actual browser worker. On Linux install Playwright's Chromium first. Screenshots are written to ignored `test-results/`.

The build generates six portable Jupyter notebooks: a student and a worked-solution notebook for each day. They embed the model support files, so downloaded notebooks do not depend on network access to this repository. Local Jupyter requires `numpy scipy matplotlib jupyterlab`; Colab normally provides these packages. Run the setup cell before the lessons.

## Publish with GitHub Pages

The included `.github/workflows/pages.yml` builds, verifies the course and Python exercises, and deploys `dist/` when `main` is pushed. Repository **Settings → Pages → Source** must be **GitHub Actions**. The workflow uses the repository's `GITHUB_TOKEN`; no manually created deployment secret is needed. See [GitHub's custom-workflow documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

## Student persistence and runtime limits

- Draft code and completion flags stay in this browser's local storage. Export/import a JSON backup from Course files & reference to move between devices. No student work is uploaded to the course repository.
- Each execution has a fresh Python namespace and working directory. All imports are included in the exercise. Python module imports and the runtime itself are reused until restart.
- CSV/PNG/TXT/JSON/NPY files up to 5 MB each are offered for download after a run. Plots are rendered with Matplotlib's Agg backend. Download artifacts before another run replaces the output.
- Python and scientific packages download from `cdn.jsdelivr.net` on first use. Google Fonts is optional; local font fallbacks are supplied. An initial network connection is required; the website is not an offline PWA.
- Stop/restart terminates the worker, including infinite loops, without requiring shared memory or cross-origin isolation headers. A run is automatically terminated after 180 seconds, including initialization.

Runtime reference: [Pyodide 0.27.7](https://pyodide.org/en/0.27.7/), [SciPy solve_ivp](https://docs.scipy.org/doc/scipy/reference/generated/scipy.integrate.solve_ivp.html).
