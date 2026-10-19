// Every lesson points to the original notebook and zero-based cell numbers.
const imports = `import numpy as np
import matplotlib.pyplot as plt
from scipy.integrate import solve_ivp
`;
const day1 = 'DAY1/Introduction.ipynb';
const tank = 'DAY2/Control_Exercise_1.ipynb';
const chemo = 'DAY2/Control_Exercise_2.ipynb';
const fed = 'DAY3/BDG.ipynb';
export const days = [
  { n: 1, title: 'From Python to differential equations', short: 'Python & ODEs', description: 'Write a derivative, solve an initial-value problem, and verify the result against mathematics and conservation.', outcome: 'Deliver a verified two-state reaction model with a convergence study.' },
  { n: 2, title: 'Balances, dynamics & control', short: 'Balances & control', description: 'Build a tank balance, add P and PI control, then solve the coupled oxygen-limited chemostat.', outcome: 'Deliver tank and chemostat simulations with a justified solver and controller sign.' },
  { n: 3, title: 'Build a fermentation simulator', short: 'Fermentation models', description: 'Assemble the original nine-state yeast model, handle feed transitions, and quantify feedstock and parameter variability.', outcome: 'Deliver a reproducible fed-batch study with balances, sensitivity, and exported data.' }
];
export const lessons = [
{
 id:'python', day:1, number:'01', title:'Python as an engineering calculator', duration:40,
 source:day1, cells:[1,3,5,7], tag:'Python essentials',
 objective:'Use variables, units, functions, and NumPy arrays to express a calculation you can inspect and reuse.',
 theory:`<p>Start with the original hypotenuse calculation: <code>a = 4.32</code>, <code>b = 3.51</code>, and <code>c = np.sqrt(a**2 + b**2)</code>. Python uses <code>**</code> for powers. Assigning <code>a = 4.32</code> stores a number; it does not attach a unit.</p>
 <div class="equation">c = √(a² + b²)</div>
 <p>If both inputs are metres, the result is metres. A function isolates a calculation from its inputs. <code>return</code> sends a value back; <code>print</code> only displays it. Indentation defines the function body. A NumPy array applies arithmetic element by element.</p>
 <p>The notebook also sums powers using <code>range(1, n+1)</code>. The final bound is excluded, and Python indexing starts at zero. We will use this same indexing convention for concentration states throughout the course.</p>`,
 task:'Complete hypotenuse(a, b), evaluate the original inputs, and calculate lengths for three pairs using arrays. Keep the function general: the tests also pass different inputs.',
 starter:imports+`
def hypotenuse(a, b):
    # TODO: replace this placeholder with the equation above.
    return a

c = hypotenuse(4.32, 3.51)
lengths = hypotenuse(np.array([3., 5., 8.]), np.array([4., 12., 15.]))
print("Original length:", c)
print("Array of lengths:", lengths)
`,
 solution:imports+`
def hypotenuse(a, b):
    return np.sqrt(a**2 + b**2)

c = hypotenuse(4.32, 3.51)
lengths = hypotenuse(np.array([3., 5., 8.]), np.array([4., 12., 15.]))
print("Original length:", c)
print("Array of lengths:", lengths)
`,
 checks:`assert np.isclose(c, np.sqrt(4.32**2+3.51**2)), 'Check the square root and powers.'
assert np.isclose(hypotenuse(6,8),10), 'The function must work for other inputs.'
assert np.allclose(lengths,[5,13,17]), 'Use elementwise array operations.'`,
 hint:'Use np.sqrt(a**2 + b**2). NumPy handles both scalar inputs and arrays without a Python loop.',
 interpretation:'The original result is approximately 5.5662. Distinguish a Python list from a NumPy array: multiplying a list repeats it, while multiplying an array scales its entries.',
 deliverable:'Save your function and state why its inputs must have the same physical units.',
 quiz:{question:'With y = [glucose, biomass, volume], which expression selects biomass?',options:['y[1]','y[2]','y(1)'],answer:0,explanation:'Index zero is glucose; index one is biomass. Parentheses call a function.'}
},
{
 id:'first-ode',day:1,number:'02',title:'Your first initial-value problem',duration:50,source:day1,cells:[8,9,10,11,12,13,14],tag:'solve_ivp',
 objective:'Translate dy/dt = y into a derivative function and test the numerical solution against exp(t).',
 theory:`<p>An initial-value problem specifies a derivative and a starting value. Here time is dimensionless and <code>y(0) = 1</code>. The derivative function receives <code>(t, y)</code> and returns <em>dy/dt</em>, not the next value of y.</p><div class="equation">dy/dt = y &nbsp; · &nbsp; y(0) = 1 &nbsp; → &nbsp; y(t) = eᵗ</div><p><code>solve_ivp</code> expects the initial state as a sequence, even for one equation. <code>sol.t</code> is a one-dimensional time array; <code>sol.y</code> has shape <code>(n_states, n_times)</code>. Therefore <code>sol.y[0]</code> is the entire trajectory of the first state.</p><p><code>t_eval</code> requests output times. It does not fix the solver's internal step size. Always inspect <code>sol.success</code> before using the result. The original notebook's SymPy solution is an optional symbolic cross-check; the known analytical solution is sufficient here.</p>`,
 task:'Replace the zero derivative with y, integrate from 0 to 1 at 51 output times, and compute the maximum absolute error against exp(t).',
 starter:imports+`
def rhs(t, y):
    return [0.]  # TODO: dy/dt = y

t = np.linspace(0, 1, 51)
sol = solve_ivp(rhs, (0,1), [1.], t_eval=t, rtol=1e-8, atol=1e-10)
exact = np.exp(sol.t)
error = np.max(np.abs(sol.y[0]-exact))
print("Success:", sol.success, "Maximum error:", error)
plt.plot(sol.t, sol.y[0], label="Numerical")
plt.plot(sol.t, exact, "--", label="Analytical")
plt.xlabel("Dimensionless time"); plt.ylabel("y"); plt.legend()
`,
 solution:imports+`
def rhs(t, y):
    return [y[0]]

t = np.linspace(0, 1, 51)
sol = solve_ivp(rhs, (0,1), [1.], t_eval=t, rtol=1e-8, atol=1e-10)
exact = np.exp(sol.t)
error = np.max(np.abs(sol.y[0]-exact))
print("Success:", sol.success, "Maximum error:", error)
plt.plot(sol.t, sol.y[0], label="Numerical")
plt.plot(sol.t, exact, "--", label="Analytical")
plt.xlabel("Dimensionless time"); plt.ylabel("y"); plt.legend()
`,
 checks:`assert sol.success, sol.message
assert sol.y.shape == (1,51), 'Check the output shape.'
assert np.allclose(rhs(0,[2.]),[2.]), 'Return the derivative evaluated at the supplied state.'
assert np.isclose(sol.y[0,-1],np.e,rtol=1e-6), 'At t=1, y must be e.'
assert error < 1e-6, 'Compare numerical and analytical solutions.'`,
 hint:'Inside rhs, y is an array. Return [y[0]]. Evaluate exp at sol.t, not at the initial condition.',
 interpretation:'A visually matching plot is insufficient evidence of accuracy. Report the error and tolerances. This analytical comparison is your first regression test for an ODE calculation.',
 deliverable:'A labelled numerical/analytical plot, solver status, and maximum error.',
 quiz:{question:'What does t_eval control?',options:['The times returned in sol.t','Every internal integration step','The derivative tolerance'],answer:0,explanation:'The adaptive solver chooses internal steps; t_eval specifies requested output times.'}
},
{
 id:'parameters',day:1,number:'03',title:'Parameters, tolerances & solver choice',duration:45,source:day1,cells:[15,16],tag:'Numerical accuracy',
 objective:'Pass parameters correctly and distinguish output spacing from numerical accuracy.',
 theory:`<p>The second example adds a constant A to the derivative. With <code>A = -0.7</code> and <code>y(0) = 1</code>, an integrating factor gives the exact solution below.</p><div class="equation">dy/dt = y + A &nbsp; → &nbsp; y(t) = (y₀ + A)eᵗ − A</div><p>For a function <code>rhs(t, y, A)</code>, pass <code>args=(A,)</code>. The comma makes a one-item tuple. A keyword such as <code>par=par</code> does not pass a model parameter to <code>solve_ivp</code>.</p><p>The error scale for each state is approximately <code>atol + rtol * abs(y)</code>. RK45 is a useful first choice for nonstiff problems; BDF uses an implicit multistep method suited to stiff dynamics. This single equation does not need BDF, but reproducing both methods makes their interface clear.</p>`,
 task:'Implement the parameterized derivative. Compare RK45 and BDF at rtol = 1e-7, and record terminal errors and nfev. Then repeat with rtol = 1e-4 and 1e-9 in your own experiment.',
 starter:imports+`
A = -0.7
def rhs(t, y, A):
    return [y[0]]  # TODO: include A

errors = {}
for method in ["RK45", "BDF"]:
    sol = solve_ivp(rhs, (0,1), [1.], args=(A,), method=method,
                    rtol=1e-7, atol=1e-10)
    exact_end = (1+A)*np.exp(1)-A
    errors[method] = abs(sol.y[0,-1]-exact_end)
    print(method, "error =", errors[method], "nfev =", sol.nfev)
`,
 solution:imports+`
A = -0.7
def rhs(t, y, A):
    return [y[0]+A]

errors = {}
for method in ["RK45", "BDF"]:
    sol = solve_ivp(rhs, (0,1), [1.], args=(A,), method=method,
                    rtol=1e-7, atol=1e-10)
    exact_end = (1+A)*np.exp(1)-A
    errors[method] = abs(sol.y[0,-1]-exact_end)
    print(method, "error =", errors[method], "nfev =", sol.nfev)
`,
 checks:`assert np.allclose(rhs(0,[1.],-0.7),[0.3]), 'Include the parameter in the derivative.'
assert set(errors)=={'RK45','BDF'}
assert max(errors.values()) < 2e-5, 'Check args and the analytical solution.'`,
 hint:'Use return [y[0] + A]. Tighter tolerances usually increase work; nfev alone is not total runtime for an implicit method.',
 interpretation:'The terminal value is approximately 1.51548. Neither method should give 2.71828: that would solve the previous equation and ignore A.',
 deliverable:'A table of method, tolerance, terminal error, and function evaluations. Explain why more output points do not necessarily reduce integration error.'
},
{
 id:'isomerization',day:1,number:'04',title:'Coupled balances: reversible isomerization',duration:60,source:day1,cells:[17,18],tag:'Chemical engineering',
 objective:'Construct a coupled species balance and verify mass conservation and equilibrium.',
 theory:`<p>Consider a closed, constant-volume system with the reversible reaction A ⇌ B. Both species have the same molar mass, and the model has no inlet, outlet, or side reaction. Use concentrations in mol/L and time in hours.</p><div class="equation">dA/dt = −k₁A + k₂B<br>dB/dt = +k₁A − k₂B</div><p>The two derivatives sum to zero, so A + B stays at its initial value, 4 mol/L. At equilibrium <code>k1*A = k2*B</code>, giving <code>Aeq = 8/3</code> and <code>Beq = 4/3</code> for the original rates <code>k1=1</code>, <code>k2=2</code> h⁻¹ and initial states <code>[3,1]</code>.</p><p><strong>Source correction:</strong> the notebook uses <code>par=par</code> in the solver call and captures an old parameter list in a default argument. Here the function receives explicit rates through <code>args=(k1,k2)</code>.</p>`,
 task:'Complete the missing B balance. Solve for 10 h, calculate the maximum conservation residual, and verify the equilibrium composition. Plot both concentrations.',
 starter:imports+`
def reaction(t, y, k1, k2):
    A, B = y
    return [-k1*A+k2*B, 0.]  # TODO: balance B

k1, k2 = 1., 2.
sol = solve_ivp(reaction, (0,10), [3.,1.], args=(k1,k2),
                t_eval=np.linspace(0,10,201), rtol=1e-8, atol=1e-10)
residual = np.max(np.abs(sol.y.sum(axis=0)-4))
print("Conservation residual [mol/L]:", residual)
print("Final A, B [mol/L]:", sol.y[:,-1])
plt.plot(sol.t, sol.y.T, label=["A", "B"])
plt.xlabel("Time [h]"); plt.ylabel("Concentration [mol/L]"); plt.legend()
`,
 solution:imports+`
def reaction(t, y, k1, k2):
    A, B = y
    return [-k1*A+k2*B, k1*A-k2*B]

k1, k2 = 1., 2.
sol = solve_ivp(reaction, (0,10), [3.,1.], args=(k1,k2),
                t_eval=np.linspace(0,10,201), rtol=1e-8, atol=1e-10)
residual = np.max(np.abs(sol.y.sum(axis=0)-4))
print("Conservation residual [mol/L]:", residual)
print("Final A, B [mol/L]:", sol.y[:,-1])
plt.plot(sol.t, sol.y.T, label=["A", "B"])
plt.xlabel("Time [h]"); plt.ylabel("Concentration [mol/L]"); plt.legend()
`,
 checks:`assert sol.success, sol.message
assert np.allclose(reaction(0,[3,1],1,2),[-1,1]), 'Check the forward and reverse signs.'
assert residual < 1e-7, 'A+B must be constant.'
assert np.allclose(sol.y[:,-1],[8/3,4/3],atol=1e-6), 'Check the equilibrium ratio.'`,
 hint:'Each mole lost by A is gained by B. The B derivative is the negative of the A derivative.',
 interpretation:'A falls from 3 toward 2.6667 mol/L; B rises toward 1.3333 mol/L. Conservation tests detect missing signs and terms even when a plot looks plausible.',
 deliverable:'Your two-state model, concentration plot, conservation residual, and an independently derived equilibrium.',
 quiz:{question:'If both rate constants double, what happens?',options:['The same equilibrium is reached faster','The equilibrium A/B ratio doubles','The total concentration doubles'],answer:0,explanation:'The equilibrium ratio is k2/k1. Doubling both rates leaves it unchanged and halves the relaxation time.'}
},
{
 id:'euler',day:1,number:'05',title:'What a numerical integrator actually does',duration:55,source:day1,cells:[20,22,23,24],tag:'Euler & convergence',
 objective:'Implement forward Euler and measure how the time step changes the integration error.',
 theory:`<p>The harmonic-signal example integrates a sine wave using the previous slope. With a unit amplitude, zero bias, and initial integral zero, the exact accumulated signal is <code>1 - cos(t)</code>.</p><div class="equation">dz/dt = sin(t), z(0) = 0<br>zₙ₊₁ = zₙ + Δt sin(tₙ)</div><p>Forward Euler uses one slope per step. Its global error is generally proportional to Δt, so halving the step should approximately halve the error in this smooth example. Evaluating the signal at the new time instead would implement a different rule.</p><p>Allocate arrays before a loop and start updating at index 1; the first entry is the initial condition. The notebook's plotting and subplot examples are used here to compare numerical trajectories and their errors on aligned axes.</p>`,
 task:'Complete the Euler update. Integrate to 10 with dt = 0.2, 0.1, 0.05, and 0.025. Compare maximum errors and plot the finest trajectory against the exact integral.',
 starter:imports+`
def euler(dt):
    t = np.linspace(0,10,round(10/dt)+1)
    z = np.zeros(len(t))
    for i in range(1,len(t)):
        z[i] = z[i-1]  # TODO: add previous slope times dt
    return t,z

steps = [0.2,0.1,0.05,0.025]
errors = []
for dt in steps:
    t,z = euler(dt)
    errors.append(np.max(np.abs(z-(1-np.cos(t)))))
print("dt / max error:", list(zip(steps,errors)))
plt.plot(t,z,label="Euler"); plt.plot(t,1-np.cos(t),"--",label="Exact")
plt.xlabel("Dimensionless time"); plt.ylabel("Integrated signal"); plt.legend()
`,
 solution:imports+`
def euler(dt):
    t = np.linspace(0,10,round(10/dt)+1)
    z = np.zeros(len(t))
    for i in range(1,len(t)):
        z[i] = z[i-1] + dt*np.sin(t[i-1])
    return t,z

steps = [0.2,0.1,0.05,0.025]
errors = []
for dt in steps:
    t,z = euler(dt)
    errors.append(np.max(np.abs(z-(1-np.cos(t)))))
print("dt / max error:", list(zip(steps,errors)))
plt.plot(t,z,label="Euler"); plt.plot(t,1-np.cos(t),"--",label="Exact")
plt.xlabel("Dimensionless time"); plt.ylabel("Integrated signal"); plt.legend()
`,
 checks:`assert len(errors)==4
assert errors[-1] < 0.02, 'Use the previous derivative in the Euler update.'
assert 1.7 < errors[0]/errors[1] < 2.3, 'The global error should approximately halve.'
assert np.all(np.diff(errors)<0), 'Refining the step should improve this example.'`,
 hint:'The update is z[i-1] + dt*np.sin(t[i-1]). Compare errors across the entire trajectory, not just the endpoint.',
 interpretation:'A fine output grid and a fine integration step are different concepts. Euler directly uses dt; solve_ivp chooses its own steps. This distinction matters when fast oxygen transfer enters the model on Day 2.',
 deliverable:'An error-versus-step table and a one-sentence explanation of first-order convergence.'
},
{
 id:'day1-lab',day:1,number:'06',title:'Day 1 lab: verify a dynamic model',duration:50,source:day1,cells:[18,25,26],tag:'Independent lab',
 objective:'Apply the solve–inspect–verify workflow independently, and recognize when an explicit scheme becomes unstable.',
 theory:`<p>Use the reversible reaction as your assessed model. Its transient decays with rate <code>k1+k2</code>. Subtracting the equilibrium gives <code>d(A-Aeq)/dt = -(k1+k2)(A-Aeq)</code>.</p><div class="equation">A(t) = Aeq + (A₀ − Aeq)e<sup>−(k₁+k₂)t</sup><br>Euler stability: |1 − (k₁+k₂)Δt| &lt; 1</div><p>For the original rates, Euler needs Δt &lt; 2/3 h for linear stability. This is a stability condition, not an accuracy guarantee. A stable simulation can still have substantial error.</p><p>The notebook ends with a class-based Van der Pol oscillator. That is an optional extension: <code>dx1/dt=x2</code>, <code>dx2/dt=mu*(1-x1**2)*x2-x1</code>, with <code>mu=10</code> and initial <code>[2,0]</code>. Re-implement it with <code>solve_ivp(method='BDF')</code> after completing the core lab.</p>`,
 task:'Write the reaction derivative without copying the previous cell. Compute Aeq and the exact trajectory. Compare RK45 and BDF, and verify both errors and total concentration.',
 starter:imports+`
k1, k2 = 1., 2.
def rhs(t,y):
    # TODO: return both species balances
    return [0.,0.]

t = np.linspace(0,10,201)
Aeq = 8/3
exact = Aeq+(3-Aeq)*np.exp(-(k1+k2)*t)
results = {}
for method in ["RK45","BDF"]:
    sol = solve_ivp(rhs,(0,10),[3.,1.],method=method,t_eval=t,rtol=1e-8,atol=1e-10)
    results[method] = np.max(np.abs(sol.y[0]-exact))
    print(method, "A error:", results[method], "total residual:", np.max(abs(sol.y.sum(axis=0)-4)))
`,
 solution:imports+`
k1, k2 = 1., 2.
def rhs(t,y):
    A,B = y
    rate = k1*A-k2*B
    return [-rate,rate]

t = np.linspace(0,10,201)
Aeq = 4*k2/(k1+k2)
exact = Aeq+(3-Aeq)*np.exp(-(k1+k2)*t)
results = {}
for method in ["RK45","BDF"]:
    sol = solve_ivp(rhs,(0,10),[3.,1.],method=method,t_eval=t,rtol=1e-8,atol=1e-10)
    results[method] = np.max(np.abs(sol.y[0]-exact))
    print(method, "A error:", results[method], "total residual:", np.max(abs(sol.y.sum(axis=0)-4)))
`,
 checks:`assert np.allclose(rhs(0,[3.,1.]),[-1,1]), 'Implement both balances.'
assert max(results.values()) < 2e-6, 'Your model must match the transient, not just equilibrium.'
assert np.max(abs(sol.y.sum(axis=0)-4)) < 1e-7`,
 hint:'Compute one net reaction rate and return its negative for A and its positive for B. Derive Aeq using the total concentration and the equilibrium rate condition.',
 interpretation:'Verification requires three independent facts: the initial condition, the transient solution, and the conserved total. Passing only an equilibrium check can hide an incorrect rate constant.',
 deliverable:'Submit a short notebook containing the balances, units, exact solution, solver comparison, and an Euler stability argument. Extension: compare RK45/BDF on the oscillator.'
},
{
 id:'tank',day:2,number:'01',title:'A tank is an accumulation balance',duration:40,source:tank,cells:[3,5,6,7,8],tag:'Open-loop balance',
 objective:'Derive a volume balance, solve it numerically, and verify the result against a straight-line solution.',
 theory:`<p>For an incompressible liquid with no volume change on mixing, accumulation equals inflow minus outflow. The original example uses <code>Fi = 3</code>, <code>Fo = 2</code> m³/h and <code>V0 = 4</code> m³.</p><div class="equation">dV/dt = Fᵢ − Fₒ &nbsp; → &nbsp; V(t) = V₀ + (Fᵢ − Fₒ)t</div><p>The tank gains 1 m³ every hour. With no upper capacity constraint in this exercise, V(10) is 14 m³. An ODE solver does not know a vessel's capacity: if your model omits a physical boundary, the solver cannot impose it.</p><p>Use a parameter class or explicit function arguments to keep values out of the equation. These constant flows will become a manipulated outlet and disturbance inlet in the next exercise.</p>`,
 task:'Complete the volume derivative, solve for 10 hours, and compare with the analytical trajectory. Then predict the slope when Fi = Fo before editing the parameters.',
 starter:imports+`
Fi, Fo, V0 = 3., 2., 4.
def tank_rhs(t,y,Fi,Fo):
    return [0.]  # TODO: accumulation

sol = solve_ivp(tank_rhs,(0,10),[V0],args=(Fi,Fo),t_eval=np.linspace(0,10,101))
exact = V0+(Fi-Fo)*sol.t
print("Final volume [m3]:",sol.y[0,-1])
plt.plot(sol.t,sol.y[0],label="Numerical"); plt.plot(sol.t,exact,"--",label="Balance")
plt.xlabel("Time [h]"); plt.ylabel("Volume [m³]"); plt.legend()
`,
 solution:imports+`
Fi, Fo, V0 = 3., 2., 4.
def tank_rhs(t,y,Fi,Fo):
    return [Fi-Fo]

sol = solve_ivp(tank_rhs,(0,10),[V0],args=(Fi,Fo),t_eval=np.linspace(0,10,101))
exact = V0+(Fi-Fo)*sol.t
print("Final volume [m3]:",sol.y[0,-1])
plt.plot(sol.t,sol.y[0],label="Numerical"); plt.plot(sol.t,exact,"--",label="Balance")
plt.xlabel("Time [h]"); plt.ylabel("Volume [m³]"); plt.legend()
`,
 checks:`assert sol.success
assert np.allclose(tank_rhs(0,[4],3,2),[1]), 'Inflow adds volume; outflow removes it.'
assert np.allclose(sol.y[0],exact,atol=1e-8)
assert np.isclose(sol.y[0,-1],14)`,
 hint:'The derivative is Fi - Fo. Its units are volume/time, which match dV/dt.',
 interpretation:'The state changes even though the derivative does not depend on V. This is an integrating process: a persistent flow imbalance causes unbounded volume drift in this ideal model.',
 deliverable:'A volume balance, an analytical check, and the predicted response to balanced flows.'
},
{
 id:'p-control',day:2,number:'02',title:'Close the loop with proportional control',duration:45,source:tank,cells:[9,10,12],tag:'Feedback & offset',
 objective:'Choose the correct feedback sign and quantify steady-state offset.',
 theory:`<p>The controlled variable is V; the manipulated variable is outlet flow. Follow the notebook convention <code>e = Vsp - V</code>. Increasing outlet flow decreases V, so the controller gain must be negative.</p><div class="equation">Fₒ = Fₒ₀ + Kc(Vsp − V)<br>dV/dt = Fᵢ − Fₒ</div><p>At steady state, inlet and outlet must match. Thus <code>Vss = Vsp - (Fi-Fo0)/Kc</code>. For <code>Kc=-1</code> h⁻¹, the controller settles at 5 m³ even though the setpoint is 4 m³. Proportional feedback requires a persistent error to generate the extra 1 m³/h of outlet flow.</p><p>The local dynamic equation has eigenvalue Kc. A positive Kc gives the wrong feedback sign for this outlet convention. No actuator saturation is included in the source model.</p>`,
 task:'Implement the outlet controller. Solve the closed-loop balance, compute Vss from the steady-state equation, and plot both volume and outlet flow.',
 starter:imports+`
Fi, Fo0, Vsp, Kc = 3., 2., 4., -1.
def rhs(t,y):
    Fo = Fo0  # TODO: add proportional action
    return [Fi-Fo]

sol = solve_ivp(rhs,(0,10),[4.],t_eval=np.linspace(0,10,201),rtol=1e-8,atol=1e-10)
Fo = Fo0+Kc*(Vsp-sol.y[0])
Vss = Vsp-(Fi-Fo0)/Kc
print("Predicted steady volume:",Vss,"Simulated:",sol.y[0,-1])
fig,ax=plt.subplots(2,1,sharex=True)
ax[0].plot(sol.t,sol.y[0]); ax[0].axhline(Vsp,ls="--",color="gray"); ax[0].set_ylabel("V [m³]")
ax[1].plot(sol.t,Fo); ax[1].set(xlabel="Time [h]",ylabel="Outlet [m³/h]")
fig.tight_layout()
`,
 solution:imports+`
Fi, Fo0, Vsp, Kc = 3., 2., 4., -1.
def rhs(t,y):
    Fo = Fo0+Kc*(Vsp-y[0])
    return [Fi-Fo]

sol = solve_ivp(rhs,(0,10),[4.],t_eval=np.linspace(0,10,201),rtol=1e-8,atol=1e-10)
Fo = Fo0+Kc*(Vsp-sol.y[0])
Vss = Vsp-(Fi-Fo0)/Kc
print("Predicted steady volume:",Vss,"Simulated:",sol.y[0,-1])
fig,ax=plt.subplots(2,1,sharex=True)
ax[0].plot(sol.t,sol.y[0]); ax[0].axhline(Vsp,ls="--",color="gray"); ax[0].set_ylabel("V [m³]")
ax[1].plot(sol.t,Fo); ax[1].set(xlabel="Time [h]",ylabel="Outlet [m³/h]")
fig.tight_layout()
`,
 checks:`assert np.allclose(rhs(0,[5.]),[0.]), 'At V=5, outlet must equal inlet.'
assert abs(sol.y[0,-1]-5) < 1e-3
assert abs(Fo[-1]-3) < 1e-3`,
 hint:'Use Fo0 + Kc*(Vsp-y[0]). When volume rises above the setpoint, the negative gain increases the outlet.',
 interpretation:'A stable controller can still miss its setpoint. Increasing |Kc| reduces offset but may demand stronger actuation; integral action addresses the offset directly.',
 deliverable:'The controlled response and an algebraic prediction of its nonzero offset.',
 quiz:{question:'V rises above its setpoint. What must the outlet controller do?',options:['Increase Fo','Decrease Fo','Keep Fo fixed'],answer:0,explanation:'Increasing outlet flow removes more liquid and opposes the volume rise.'}
},
{
 id:'pi-control',day:2,number:'03',title:'Integral action is another ODE',duration:55,source:tank,cells:[11,12],tag:'Coupled controller states',
 objective:'Represent a PI controller as an extra state and explain why it removes offset.',
 theory:`<p>Store the accumulated controller contribution as state I with units m³/h. The notebook adds I directly to the proportional action, so its derivative includes the gain.</p><div class="equation">Fₒ = Fₒ₀ + Kc(Vsp − V) + I<br>dI/dt = (Kc/τI)(Vsp − V)</div><p>The state vector is now <code>[V,I]</code>; its derivatives must appear in the same order. The original values are <code>Kc=-1</code> h⁻¹, <code>tauI=1</code> h, and <code>I0=0</code> m³/h. At steady state dI/dt=0 forces V=Vsp, and I supplies the missing outlet flow: I=1 m³/h.</p><p>This is an ideal unsaturated PI controller. Physical valves have bounds; adding clipping without anti-windup can make the integral grow while the actuator is saturated. Treat that as an extension, not an assumption hidden in this model.</p>`,
 task:'Complete both derivatives. Run for 20 h, compare final V and I to their steady-state predictions, and plot the manipulated outlet alongside volume.',
 starter:imports+`
Fi, Fo0, Vsp, Kc, tauI = 3.,2.,4.,-1.,1.
def rhs(t,y):
    V,I=y
    e=Vsp-V
    Fo=Fo0+Kc*e+I
    return [Fi-Fo, 0.]  # TODO: integral-state derivative

sol=solve_ivp(rhs,(0,20),[4.,0.],method="BDF",t_eval=np.linspace(0,20,301),rtol=1e-8,atol=1e-10)
Fo=Fo0+Kc*(Vsp-sol.y[0])+sol.y[1]
print("Final V [m3], I [m3/h]:",sol.y[:,-1])
fig,ax=plt.subplots(2,1,sharex=True)
ax[0].plot(sol.t,sol.y[0]); ax[0].axhline(Vsp,ls="--",color="gray"); ax[0].set_ylabel("V [m³]")
ax[1].plot(sol.t,Fo); ax[1].set(xlabel="Time [h]",ylabel="Outlet [m³/h]")
fig.tight_layout()
`,
 solution:imports+`
Fi, Fo0, Vsp, Kc, tauI = 3.,2.,4.,-1.,1.
def rhs(t,y):
    V,I=y
    e=Vsp-V
    Fo=Fo0+Kc*e+I
    return [Fi-Fo, Kc/tauI*e]

sol=solve_ivp(rhs,(0,20),[4.,0.],method="BDF",t_eval=np.linspace(0,20,301),rtol=1e-8,atol=1e-10)
Fo=Fo0+Kc*(Vsp-sol.y[0])+sol.y[1]
print("Final V [m3], I [m3/h]:",sol.y[:,-1])
fig,ax=plt.subplots(2,1,sharex=True)
ax[0].plot(sol.t,sol.y[0]); ax[0].axhline(Vsp,ls="--",color="gray"); ax[0].set_ylabel("V [m³]")
ax[1].plot(sol.t,Fo); ax[1].set(xlabel="Time [h]",ylabel="Outlet [m³/h]")
fig.tight_layout()
`,
 checks:`assert sol.success
assert np.allclose(rhs(0,[5.,0.]),[0.,1.]), 'The integral derivative includes Kc/tauI.'
assert abs(sol.y[0,-1]-4) < 1e-3, 'PI should remove the volume offset.'
assert abs(sol.y[1,-1]-1) < 1e-3, 'Integral action supplies the missing flow.'`,
 hint:'Return Kc/tauI*e as the second derivative. Do not integrate I inside rhs; solve_ivp integrates every state.',
 interpretation:'The small overshoot is a dynamic consequence of the two-state feedback system. The steady integral value is an actuator contribution, not an integrated volume.',
 deliverable:'Overlay open-loop, P, and PI volumes using your earlier code; explain the final integral value using the flow balance.'
},
{
 id:'chemostat',day:2,number:'04',title:'A continuous fermentation with oxygen limitation',duration:60,source:chemo,cells:[2,3,4,5,6,7],tag:'Three-state bioreactor',
 objective:'Relate biomass, substrate, and dissolved oxygen balances to dilution, reaction, and mass transfer.',
 theory:`<p>A well-mixed chemostat has equal inlet and outlet flows and constant volume. Its states are biomass X, substrate S, and oxygen O, all in g/L. Dilution is <code>D=F/V=0.25</code> h⁻¹, and the feed contains <code>Sf=10</code> g/L with no biomass or dissolved oxygen in this model.</p><div class="equation">μ = μx · S/(Ks + S) · O/(Ko + O)<br>dX/dt = (μ − D)X<br>dS/dt = D(Sf − S) − μX/Yxs<br>dO/dt = kLa(O* − O) − DO − (1/Yxs − 1)μX</div><p>The helper uses the notebook's temperature-dependent <code>mux</code> and computed <code>O_sat</code>, not its unused <code>mu_max=2.16</code> or <code>Osat=0.008</code>. At 293.15 K, <code>O_sat ≈ 0.00893</code> g/L. <code>Ks=0.1</code>, <code>Ko=0.0002</code> g/L, <code>Yxs=0.4</code> g/g, and <code>kLa=250</code> h⁻¹.</p><p>The oxygen-transfer time scale is roughly 1/kLa = 0.004 h, much faster than the 4 h residence time. This scale separation motivates an implicit solver and a small oxygen absolute tolerance.</p>`,
 task:'Complete the biomass derivative in your own implementation. Compare it with the source-derived reference at a test state, then solve from [3,0,0] for 20 h and plot all three concentrations.',
 starter:imports+`
from course_models import ChemostatParameters, chemostat
par=ChemostatParameters()
def rhs(t,y,par):
    X,S,O=y
    D=par.F/par.V
    mu=par.mux*S/(par.Ks+S)*O/(par.Ko+O)
    dX=0.  # TODO: growth minus dilution
    dS=D*(par.Sf-S)-mu*X/par.Yxs
    dO=par.kla*(par.O_sat-O)-D*O-(1/par.Yxs-1)*mu*X
    return [dX,dS,dO]

sol=solve_ivp(rhs,(0,20),[3.,0.,0.],args=(par,),method="BDF",
              t_eval=np.linspace(0,20,401),rtol=1e-7,atol=[1e-9,1e-9,1e-11])
print("mux [1/h]:",par.mux,"O_sat [g/L]:",par.O_sat)
fig,ax=plt.subplots(3,1,sharex=True)
for i,name in enumerate(["Biomass","Substrate","Oxygen"]):
    ax[i].plot(sol.t,sol.y[i]); ax[i].set_ylabel(name+" [g/L]")
ax[-1].set_xlabel("Time [h]"); fig.tight_layout()
`,
 solution:imports+`
from course_models import ChemostatParameters, chemostat
par=ChemostatParameters()
def rhs(t,y,par):
    X,S,O=y
    D=par.F/par.V
    mu=par.mux*S/(par.Ks+S)*O/(par.Ko+O)
    dX=(mu-D)*X
    dS=D*(par.Sf-S)-mu*X/par.Yxs
    dO=par.kla*(par.O_sat-O)-D*O-(1/par.Yxs-1)*mu*X
    return [dX,dS,dO]

sol=solve_ivp(rhs,(0,20),[3.,0.,0.],args=(par,),method="BDF",
              t_eval=np.linspace(0,20,401),rtol=1e-7,atol=[1e-9,1e-9,1e-11])
print("mux [1/h]:",par.mux,"O_sat [g/L]:",par.O_sat)
fig,ax=plt.subplots(3,1,sharex=True)
for i,name in enumerate(["Biomass","Substrate","Oxygen"]):
    ax[i].plot(sol.t,sol.y[i]); ax[i].set_ylabel(name+" [g/L]")
ax[-1].set_xlabel("Time [h]"); fig.tight_layout()
`,
 checks:`assert sol.success, sol.message
assert np.allclose(rhs(0,[2.,1.,0.004],par),chemostat(0,[2.,1.,0.004],par)), 'Verify all three balances.'
assert np.min(sol.y)>-1e-7, 'Concentrations must stay nonnegative within numerical tolerance.'
assert np.max(sol.y[2])<=par.O_sat+1e-7
assert np.isclose(par.F/par.V,0.25)`,
 hint:'Biomass grows at mu*X and leaves at D*X. At t=0 substrate and oxygen are zero, so growth is initially zero.',
 interpretation:'Biomass initially declines because there is dilution before substrate/oxygen support growth. The oxygen consumption coefficient is the simplified relation used in the original model; it is not a universal yield law.',
 deliverable:'Annotated species balances, three labelled trajectories, and a comparison of oxygen-transfer and residence times.'
},
{
 id:'oxygen-control',day:2,number:'05',title:'Control dissolved oxygen through kLa',duration:55,source:chemo,cells:[8,9,10,11],tag:'PI & stiffness',
 objective:'Simulate an oxygen PI controller and reconstruct the actual actuator signal consistently.',
 theory:`<p>Use the notebook's oxygen-error convention <code>O - Osp</code>. Increasing kLa raises oxygen, so its gain is negative with this error definition. The setpoint changes from 0.005 to 0.006 g/L after 5 h, then to 0.003 g/L after 10 h.</p><div class="equation">kLa = 250 + Kc(O − Osp) + I<br>dI/dt = (Kc/τI)(O − Osp)</div><p>The original gain is <code>Kc=-50000</code> L/(g·h), and <code>tauI=0.02</code> h. The fourth state is the integral contribution in h⁻¹. The adapter integrates separate intervals at 5 and 10 h, keeping all states continuous at each setpoint jump.</p><p><strong>Source correction:</strong> the original actuator plot uses −60000 and omits I, even though the simulation uses −50000 and includes I. Always reconstruct the actuator with exactly the equation and parameters used in the derivative. This source model has no kLa limits or anti-windup.</p>`,
 task:'Run the source-derived closed loop. Replace the placeholder actuator expression with the complete PI law. Plot oxygen/setpoint and kLa. Then halve the gain magnitude and compare tracking and actuation.',
 starter:imports+`
from course_models import oxygen_control
Kc, tauI = -50000., 0.02
sol=oxygen_control(Kc=Kc,tauI=tauI)
actual_kla=np.full_like(sol.t,250.)  # TODO: full PI expression
print("Final oxygen [g/L]:",sol.y[2,-1])
print("kLa range [1/h]:",actual_kla.min(),actual_kla.max())
fig,ax=plt.subplots(2,1,sharex=True)
ax[0].plot(sol.t,sol.y[2],label="Oxygen"); ax[0].plot(sol.t,sol.sp,"--",label="Setpoint")
ax[0].set_ylabel("O [g/L]"); ax[0].legend()
ax[1].plot(sol.t,actual_kla); ax[1].set(xlabel="Time [h]",ylabel="kLa [1/h]")
fig.tight_layout()
`,
 solution:imports+`
from course_models import oxygen_control
Kc, tauI = -50000., 0.02
sol=oxygen_control(Kc=Kc,tauI=tauI)
actual_kla=250+Kc*(sol.y[2]-sol.sp)+sol.y[3]
print("Final oxygen [g/L]:",sol.y[2,-1])
print("kLa range [1/h]:",actual_kla.min(),actual_kla.max())
fig,ax=plt.subplots(2,1,sharex=True)
ax[0].plot(sol.t,sol.y[2],label="Oxygen"); ax[0].plot(sol.t,sol.sp,"--",label="Setpoint")
ax[0].set_ylabel("O [g/L]"); ax[0].legend()
ax[1].plot(sol.t,actual_kla); ax[1].set(xlabel="Time [h]",ylabel="kLa [1/h]")
fig.tight_layout()
`,
 checks:`assert np.allclose(actual_kla,sol.kla), 'Include the proportional AND integral terms with the simulated gain.'
assert abs(sol.y[2,-1]-0.003)<2e-5, 'Check final setpoint tracking.'
assert np.all(np.isfinite(actual_kla))`,
 hint:'Use 250 + Kc*(sol.y[2]-sol.sp) + sol.y[3]. The integral state already contains its gain; do not multiply it by Kc again.',
 interpretation:'The actuator can jump when the setpoint changes, while oxygen and the integral state remain continuous. Evaluate both tracking and actuator demands before judging a controller.',
 deliverable:'A correctly reconstructed actuator plot, tracking comparison for two gains, and a discussion of physical kLa limits.'
},
{
 id:'day2-lab',day:2,number:'06',title:'Day 2 lab: a solver you can defend',duration:45,source:chemo,cells:[3,5,6,9,10],tag:'Independent lab',
 objective:'Use solver diagnostics and tolerance refinement to justify a stiff-system simulation.',
 theory:`<p>The chemostat couples fast oxygen transfer with slower growth and dilution. Compare methods on the <em>same equations, initial states, tolerances, and requested output times</em>. A solver comparison is meaningless if each method solves a different model.</p><div class="equation">εⱼ = maxₜ |yⱼ,test(t) − yⱼ,reference(t)|</div><p>Use BDF with <code>rtol=1e-9</code> and state-specific absolute tolerances as a refined numerical reference. This is a convergence check, not proof that the physical model is correct. The reference should be independently checked using balance residuals and physical bounds.</p><p>RK45 can solve a stiff problem but may take many small steps. Record <code>nfev</code>, <code>njev</code>, and <code>nlu</code> when available. Implicit methods pay for Jacobian calculations and linear solves, so function evaluations are only one part of their cost.</p>`,
 task:'Add a Radau comparison to the existing RK45 and BDF runs. Record statewise deviations from the refined reference and compare function evaluations. Explain which solver you would use for a longer study.',
 starter:imports+`
from course_models import ChemostatParameters,chemostat
par=ChemostatParameters()
t=np.linspace(0,20,201)
ref=solve_ivp(chemostat,(0,20),[3.,0.,0.],args=(par,),method="BDF",t_eval=t,
              rtol=1e-9,atol=[1e-11,1e-11,1e-13])
results={}
methods=["RK45","BDF"]  # TODO: also compare Radau
for method in methods:
    sol=solve_ivp(chemostat,(0,20),[3.,0.,0.],args=(par,),method=method,t_eval=t,
                  rtol=1e-6,atol=[1e-8,1e-8,1e-10])
    if not sol.success:
        raise RuntimeError(sol.message)
    results[method]=np.max(abs(sol.y-ref.y),axis=1)
    print(method,"state errors:",results[method],"nfev:",sol.nfev,"nlu:",sol.nlu)
`,
 solution:imports+`
from course_models import ChemostatParameters,chemostat
par=ChemostatParameters()
t=np.linspace(0,20,201)
ref=solve_ivp(chemostat,(0,20),[3.,0.,0.],args=(par,),method="BDF",t_eval=t,
              rtol=1e-9,atol=[1e-11,1e-11,1e-13])
results={}
methods=["RK45","BDF","Radau"]
for method in methods:
    sol=solve_ivp(chemostat,(0,20),[3.,0.,0.],args=(par,),method=method,t_eval=t,
                  rtol=1e-6,atol=[1e-8,1e-8,1e-10])
    if not sol.success:
        raise RuntimeError(sol.message)
    results[method]=np.max(abs(sol.y-ref.y),axis=1)
    print(method,"state errors:",results[method],"nfev:",sol.nfev,"nlu:",sol.nlu)
`,
 checks:`assert ref.success
assert set(results)=={'RK45','BDF','Radau'}, 'Compare all three methods.'
assert all(np.max(e[:2])<2e-4 and e[2]<2e-6 for e in results.values()), 'Solutions should agree under refinement.'`,
 hint:'Append "Radau" to methods. Absolute errors for oxygen must be judged on its much smaller concentration scale.',
 interpretation:'Solver agreement verifies numerical implementation under refinement. It does not validate yields, kinetic laws, or biological assumptions against experimental data.',
 deliverable:'Submit the solver comparison and an explanation of stiffness, absolute tolerances, controller sign conventions, and state order.'
},
{
 id:'yeast-states',day:3,number:'01',title:'Read the yeast model before running it',duration:45,source:fed,cells:[1,2,3,4],tag:'States & stoichiometry',
 objective:'Identify the nine states, five reaction rates, and source parameter values in the fed-batch model.',
 theory:`<p>The original DAY3 model contains eight concentration states followed by volume. Keep this order everywhere: glucose, xylose, furfural, furfuryl alcohol, 5-HMF, acetic acid, ethanol, biomass, volume. Initial concentrations are <code>[39.7,23.5,0.56,0,0.2,3.05,0.62,1.75]</code> g/L; volume is 0.7 L.</p><div class="equation">r<sub>reaction</sub> = Nᵀv &nbsp; · &nbsp; N shape = (5, 8)</div><p>Rows of N correspond to glucose uptake, xylose uptake, furfural conversion, HMF conversion, and acetic-acid uptake. For glucose uptake, the row is <code>[-1,0,0,0,0,0,YPSg,YXSg]</code>. DAY3 uses <code>YPSg=0.42</code> and <code>YXSg=0.115</code> g/g.</p><p>The sugar reactions produce both ethanol and biomass. This reduced matrix omits CO₂ and other products, so the sum of the eight concentrations is <strong>not</strong> a conserved mass. The model does not explicitly close carbon or elemental balances.</p>`,
 task:'Construct the 5×8 stoichiometric matrix and calculate reaction derivatives for the supplied uptake-rate vector. Fill in the glucose product yields from the DAY3 parameter object.',
 starter:imports+`
from course_models import YeastParameters,initial_values,STATE_NAMES
par=YeastParameters()
N=np.array([
    [-1,0,0,0,0,0,0,0],  # TODO: glucose -> ethanol + biomass
    [0,-1,0,0,0,0,par.YPSx,par.YXSx],
    [0,0,-1,par.Y_FA_Fur,0,0,0,0],
    [0,0,0,0,-1,par.Y_HAc_HMF,0,0],
    [0,0,0,0,0,-1,0,0]],dtype=float)
rates=np.array([1.,0.5,0.01,0.02,0.001])  # g/L/h
reaction=N.T@rates
print("State order:",STATE_NAMES)
print("Initial states:",initial_values())
print("Reaction derivatives [g/L/h]:",reaction)
`,
 solution:imports+`
from course_models import YeastParameters,initial_values,STATE_NAMES
par=YeastParameters()
N=np.array([
    [-1,0,0,0,0,0,par.YPSg,par.YXSg],
    [0,-1,0,0,0,0,par.YPSx,par.YXSx],
    [0,0,-1,par.Y_FA_Fur,0,0,0,0],
    [0,0,0,0,-1,par.Y_HAc_HMF,0,0],
    [0,0,0,0,0,-1,0,0]],dtype=float)
rates=np.array([1.,0.5,0.01,0.02,0.001])
reaction=N.T@rates
print("State order:",STATE_NAMES)
print("Initial states:",initial_values())
print("Reaction derivatives [g/L/h]:",reaction)
`,
 checks:`assert N.shape==(5,8)
assert np.isclose(reaction[6],0.54), 'Ethanol comes from both sugars.'
assert np.isclose(reaction[7],0.196), 'Include both biomass yields.'
assert np.isclose(reaction[5],0.00968), 'Acetate is formed from HMF and consumed.'`,
 hint:'Put par.YPSg and par.YXSg in columns 6 and 7 of row zero. Multiplying N.T by rates returns eight concentration derivatives.',
 interpretation:'The source comments mention six reactions, but the implemented matrix has five rows. Teach and inspect the implemented equations; unused comments and parameters do not add reaction pathways.',
 deliverable:'A state/units table and an annotated stoichiometric matrix. Explain why summing these concentrations is not a valid conservation test.'
},
{
 id:'yeast-kinetics',day:3,number:'02',title:'From uptake kinetics to inhibited reaction rates',duration:55,source:fed,cells:[1,4,9],tag:'Fermentation kinetics',
 objective:'Implement the original glucose uptake law and separate base uptake from inhibition factors.',
 theory:`<p>The glucose uptake law combines substrate saturation and substrate inhibition with biomass concentration. Its coefficient is <code>numaxG=1.7271</code> h⁻¹, <code>KSPG=0.565</code> g/L, and <code>KiPG=4890</code> g/L in DAY3. DAY1 has different fitted parameters; do not mix parameter sets.</p><div class="equation">vG,base = νmax,G · G · X / (Ks,G + G + G²/Ki,G)<br>vG = vG,base · IFA · IFur · IHMF · IHAc · IEtOH</div><p>Each soluble inhibitor contributes <code>1/(1+C/Ki)</code>. Ethanol contributes <code>max(0, 1-(P/PMPg)**gammaG)</code>. For xylose, an extra factor <code>1/(1+G/KiGlu)</code> accounts for glucose repression. The kinetic helper always uses the exact DAY3 source equations.</p><p>These are empirical kinetics. The product of inhibition factors can be much smaller than each individual factor. A high substrate concentration does not guarantee a high uptake rate.</p>`,
 task:'Complete the base glucose uptake rate. Apply all five inhibitors and compare the result with the glucose derivative from the original model at t=0, when feed is off.',
 starter:imports+`
from course_models import YeastParameters,initial_values,feed_values
from course_source.DAY3.model import fedbatch
par=YeastParameters()
y=np.array(initial_values())
G,_,Fur,FA,HMF,HAc,P,X,V=y
base=0.  # TODO: glucose uptake before soluble/product inhibition
inhibition=(1/(1+FA/par.KiFAg) * 1/(1+Fur/par.KiFurg)
            * 1/(1+HMF/par.KiHMFg) * 1/(1+HAc/par.KiHAcg)
            * max(0,1-(P/par.PMPg)**par.gammaG))
uptake=base*inhibition
reference=-fedbatch(0,y,par,feed_values(y.tolist()))[0]
print("Base:",base,"Inhibition:",inhibition,"Actual uptake:",uptake)
print("Source uptake [g/L/h]:",reference)
`,
 solution:imports+`
from course_models import YeastParameters,initial_values,feed_values
from course_source.DAY3.model import fedbatch
par=YeastParameters()
y=np.array(initial_values())
G,_,Fur,FA,HMF,HAc,P,X,V=y
base=par.numaxG*G*X/(par.KSPG+G+G**2/par.KiPG)
inhibition=(1/(1+FA/par.KiFAg) * 1/(1+Fur/par.KiFurg)
            * 1/(1+HMF/par.KiHMFg) * 1/(1+HAc/par.KiHAcg)
            * max(0,1-(P/par.PMPg)**par.gammaG))
uptake=base*inhibition
reference=-fedbatch(0,y,par,feed_values(y.tolist()))[0]
print("Base:",base,"Inhibition:",inhibition,"Actual uptake:",uptake)
print("Source uptake [g/L/h]:",reference)
`,
 checks:`assert base>0
assert 0<inhibition<=1
assert np.isclose(uptake,reference,rtol=1e-10), 'Use DAY3 parameters and all inhibition factors.'
assert uptake<base`,
 hint:'The base law includes biomass X. The glucose derivative at t=0 is minus its uptake, because feed is off and no other implemented reaction makes glucose.',
 interpretation:'Clamping each uptake rate to nonnegative values is part of the original implementation. It does not guarantee that a poorly resolved numerical trajectory cannot step into negative concentrations.',
 deliverable:'A factor-by-factor inhibition table. Set each inhibitor concentration to zero in turn and explain which change most affects initial glucose uptake.'
},
{
 id:'fed-batch',day:3,number:'03',title:'Derive and solve the fed-batch balance',duration:60,source:fed,cells:[1,3,4],tag:'Nine-state simulation',
 objective:'Derive dilution from an extensive balance and resolve feed-start and vessel-capacity transitions.',
 theory:`<p>Start with the amount balance <code>d(Ci*V)/dt = ri*V + F*Cif</code> and the volume balance <code>dV/dt=F</code>. Applying the product rule produces the concentration dilution term; adding feed concentration alone would be incorrect.</p><div class="equation">dCi/dt = ri + (F/V)(Cif − Ci)<br>dV/dt = F</div><p>The original feed is zero before 2 h, then <code>F=0.1+0.005*(t-2)</code> L/h until V reaches 2 L. After capacity, feed stays off. The feed composition equals the initial composition except that feed biomass is zero. It includes the original nonzero ethanol concentration.</p><p>During feeding, <code>V=V0+0.1τ+0.0025τ²</code> with τ=t−2. For V0=0.7 L, capacity is reached at approximately 12.3315 h. The adapter splits integration at 2 h and this analytically calculated filling time so an adaptive step cannot overshoot the volume switch.</p>`,
 task:'Run the complete model and reconstruct the analytical volume trajectory. Replace the placeholder volume expression with the integrated feed law, clipped at the 2 L capacity. Plot glucose, xylose, ethanol, biomass, and volume.',
 starter:imports+`
from course_models import simulate_yeast
sol=simulate_yeast()
tau=np.maximum(sol.t-2,0)
expected_volume=np.full_like(sol.t,0.7)  # TODO: integrate feed, then limit to 2 L
print("Fill time [h]:",sol.fill_time)
print("Final ethanol [g/L]:",sol.y[6,-1])
fig,ax=plt.subplots(2,1,sharex=True)
for i,label in [(0,"Glucose"),(1,"Xylose"),(6,"Ethanol"),(7,"Biomass")]:
    ax[0].plot(sol.t,sol.y[i],label=label)
ax[0].set_ylabel("Concentration [g/L]"); ax[0].legend()
ax[1].plot(sol.t,sol.y[8],label="Numerical"); ax[1].plot(sol.t,expected_volume,"--",label="Balance")
ax[1].set(xlabel="Time [h]",ylabel="Volume [L]"); ax[1].legend(); fig.tight_layout()
`,
 solution:imports+`
from course_models import simulate_yeast
sol=simulate_yeast()
tau=np.maximum(sol.t-2,0)
expected_volume=np.minimum(0.7+0.1*tau+0.0025*tau**2,2.)
print("Fill time [h]:",sol.fill_time)
print("Final ethanol [g/L]:",sol.y[6,-1])
fig,ax=plt.subplots(2,1,sharex=True)
for i,label in [(0,"Glucose"),(1,"Xylose"),(6,"Ethanol"),(7,"Biomass")]:
    ax[0].plot(sol.t,sol.y[i],label=label)
ax[0].set_ylabel("Concentration [g/L]"); ax[0].legend()
ax[1].plot(sol.t,sol.y[8],label="Numerical"); ax[1].plot(sol.t,expected_volume,"--",label="Balance")
ax[1].set(xlabel="Time [h]",ylabel="Volume [L]"); ax[1].legend(); fig.tight_layout()
`,
 checks:`assert sol.success
assert np.max(abs(sol.y[8]-expected_volume))<1e-6, 'Integrate F and stop at vessel capacity.'
assert np.max(sol.y[8])<=2+1e-6
assert np.min(sol.y[:8])>-1e-6
assert np.isclose(sol.fill_time,12.3315017762,atol=1e-7)`,
 hint:'Use np.minimum(0.7 + 0.1*tau + 0.0025*tau**2, 2.). The 0.005 slope integrates to 0.0025*tau**2.',
 interpretation:'Concentration and amount can move in opposite directions during feeding. Biomass concentration is diluted by sterile feed even when biomass amount increases. Time is in hours; the original notebook incorrectly labels some plots in seconds.',
 deliverable:'A product-rule derivation, a volume-balance check, and labelled concentration/volume plots.',
 quiz:{question:'What is the feed contribution to dX/dt for sterile feed?',options:['−F*X/V','+F*X/V','Zero'],answer:0,explanation:'With Xfeed=0, the dilution term F/V*(Xfeed-X) equals -F*X/V.'}
},
{
 id:'variability',day:3,number:'04',title:'Reproducible variability across fermentation runs',duration:55,source:fed,cells:[5,6,7,8,9,10,11],tag:'Simulation experiments',
 objective:'Separate feedstock variation from kinetic variation and reproduce the original seeded experiment.',
 theory:`<p>The original generator draws glucose from 35–40, xylose from 18–28, furfural from 0.6–2, HMF from 0.5–2, acetic acid from 2–3, and ethanol from 0.2–0.9 g/L. Initial biomass is 5 g/L and volume is 0.7 L. Furfuryl alcohol is zero. The helper preserves the original random draw order.</p><p>Six kinetic parameters are each multiplied by <code>1 + uniform(0.02,0.05)</code>: the two maximum sugar uptake coefficients, the two ethanol yields, and the two biomass yields. These changes are <strong>all positive</strong>, not ±5% noise.</p><div class="equation">pᵢ,run = pᵢ,baseline (1 + δᵢ) &nbsp; · &nbsp; δᵢ ∈ [0.02, 0.05]</div><p>The notebook reseeds feedstock and growth draws separately with the same run index. This makes results reproducible but couples the streams. The adapters reproduce this design with local random generators and fresh parameter objects. For uncertainty estimation, you would usually design independent streams and justify the parameter distributions.</p>`,
 task:'Run the ten original seeds, applying both feedstock and growth variability. Replace the placeholder initial state with variable_feedstock(seed). Report final ethanol for each run and overlay its trajectories.',
 starter:imports+`
from course_models import simulate_yeast,variable_feedstock,variable_growth_parameters,initial_values
final=[]
for seed in range(10):
    initial=initial_values()  # TODO: use the seeded feedstock generator
    par=variable_growth_parameters(seed)
    sol=simulate_yeast(par=par,initial=initial)
    final.append(sol.y[6,-1])
    plt.plot(sol.t,sol.y[6],alpha=0.6)
final=np.array(final)
print("Final ethanol [g/L]:",final)
print("Mean, sample SD:",final.mean(),final.std(ddof=1))
plt.xlabel("Time [h]"); plt.ylabel("Ethanol [g/L]")
`,
 solution:imports+`
from course_models import simulate_yeast,variable_feedstock,variable_growth_parameters,initial_values
final=[]
for seed in range(10):
    initial=variable_feedstock(seed)
    par=variable_growth_parameters(seed)
    sol=simulate_yeast(par=par,initial=initial)
    final.append(sol.y[6,-1])
    plt.plot(sol.t,sol.y[6],alpha=0.6)
final=np.array(final)
print("Final ethanol [g/L]:",final)
print("Mean, sample SD:",final.mean(),final.std(ddof=1))
plt.xlabel("Time [h]"); plt.ylabel("Ethanol [g/L]")
`,
 checks:`assert len(final)==10 and np.all(np.isfinite(final))
assert np.allclose(initial,variable_feedstock(9)), 'Apply the variable feedstock, not the baseline initial state.'
assert variable_feedstock(3)==variable_feedstock(3), 'The same seed must reproduce the same feedstock.'
assert final.std(ddof=1)>0`,
 hint:'Use initial=variable_feedstock(seed). Feed composition follows each run’s initial composition with biomass set to zero inside simulate_yeast.',
 interpretation:'A ten-run spread is a simulation study under chosen assumptions. It is not a calibrated confidence interval for a real fermenter. Compare feedstock-only, growth-only, and combined variation to interpret its causes.',
 deliverable:'A reproducible run table with seeds and parameters; compare sources of variability using three separate experiments.'
},
{
 id:'sensitivity',day:3,number:'05',title:'Sensitivity, amount balances & data export',duration:45,source:fed,cells:[3,4,9,11],tag:'Engineering analysis',
 objective:'Quantify a parameter sensitivity without confounding it with random changes, and export simulation data.',
 theory:`<p>A controlled sensitivity study changes one parameter while holding all other values fixed. Use terminal ethanol amount <code>M=P*V</code> rather than concentration alone. A centred finite difference estimates a dimensionless local sensitivity.</p><div class="equation">Sₚ ≈ [M(p(1+δ)) − M(p(1−δ))] / (2δM(p))</div><p>Use δ=0.01, then repeat at 0.005 to check finite-difference stability. This sensitivity includes the effects of the entire nonlinear model, including ethanol inhibition. It need not equal the sensitivity suggested by a single yield term.</p><p>Export time, the eight concentration states, and volume with explicit column units. Generated files live in the browser's Python filesystem until you download them. The course runner exposes CSV and PNG files created in the current exercise.</p>`,
 task:'Calculate the centred normalized sensitivity of terminal ethanol amount to YPSg. Replace the placeholder terminal metric with P*V. Export the baseline trajectory to fermentation.csv.',
 starter:imports+`
from course_models import YeastParameters,simulate_yeast
delta=0.01
metrics=[]
for scale in [1-delta,1.,1+delta]:
    par=YeastParameters()
    par.YPSg*=scale
    sol=simulate_yeast(par=par)
    metric=sol.y[6,-1]  # TODO: terminal ethanol AMOUNT in grams
    metrics.append(metric)
    if scale==1.:
        baseline=sol
sensitivity=(metrics[2]-metrics[0])/(2*delta*metrics[1])
header="time_h,glucose_g_L,xylose_g_L,furfural_g_L,FA_g_L,HMF_g_L,HAc_g_L,ethanol_g_L,biomass_g_L,volume_L"
np.savetxt("fermentation.csv",np.column_stack([baseline.t,baseline.y.T]),delimiter=",",header=header,comments="")
print("Terminal ethanol amounts [g]:",metrics)
print("Normalized YPSg sensitivity:",sensitivity)
`,
 solution:imports+`
from course_models import YeastParameters,simulate_yeast
delta=0.01
metrics=[]
for scale in [1-delta,1.,1+delta]:
    par=YeastParameters()
    par.YPSg*=scale
    sol=simulate_yeast(par=par)
    metric=sol.y[6,-1]*sol.y[8,-1]
    metrics.append(metric)
    if scale==1.:
        baseline=sol
sensitivity=(metrics[2]-metrics[0])/(2*delta*metrics[1])
header="time_h,glucose_g_L,xylose_g_L,furfural_g_L,FA_g_L,HMF_g_L,HAc_g_L,ethanol_g_L,biomass_g_L,volume_L"
np.savetxt("fermentation.csv",np.column_stack([baseline.t,baseline.y.T]),delimiter=",",header=header,comments="")
print("Terminal ethanol amounts [g]:",metrics)
print("Normalized YPSg sensitivity:",sensitivity)
`,
 checks:`assert np.isclose(metrics[1],baseline.y[6,-1]*baseline.y[8,-1]), 'Amount equals concentration times volume.'
assert np.isfinite(sensitivity)
data=np.loadtxt('fermentation.csv',delimiter=',',skiprows=1)
assert data.shape[1]==10 and np.allclose(data[:,0],baseline.t), 'Export time and all nine states.'`,
 hint:'Ethanol is state 6; volume is state 8. Multiplying g/L by L gives grams. The file download appears below the plots after a successful run.',
 interpretation:'The normalization makes sensitivity unitless: an S near 0.5 means a 1% parameter increase produces approximately a 0.5% change in this output near the baseline.',
 deliverable:'A sensitivity comparison for δ=0.01 and 0.005, a clearly defined output metric, and a CSV with units.'
},
{
 id:'capstone',day:3,number:'06',title:'Final lab: defend your fermentation simulation',duration:40,source:fed,cells:[1,3,4,7,9,11],tag:'Capstone',
 objective:'Deliver a model study with explicit assumptions, numerical verification, reproducibility, and engineering interpretation.',
 theory:`<p>Your final deliverable is a small technical report and executable notebook. Use the original DAY3 kinetics, initial states, and feed policy. Your numerical implementation should handle the two feed transitions explicitly.</p><div class="equation">d(CᵢV)/dt = rᵢV + FCᵢf</div><p>For a controlled balance test, turn off all reaction coefficients. Glucose amount must then equal its initial amount plus glucose added with feed: <code>G*V = G0*V0 + Gfeed*(V-V0)</code>. For sterile feed, biomass amount stays constant when reaction is off. These extensive balances are stronger tests than expecting the sum of modelled concentrations to be constant.</p><p>For the reacting model, compare BDF and Radau with tight tolerances on the same output grid. Report the largest statewise differences, investigate negativity beyond roundoff, and state which physical effects the model omits. Keep Days 4 and 5 outside the study.</p>`,
 task:'Disable all five uptake coefficients, run the no-reaction model, and verify glucose and biomass amount balances. Then run the reacting baseline separately and prepare the report described below.',
 starter:imports+`
from course_models import YeastParameters,simulate_yeast,initial_values
par=YeastParameters()
# TODO: turn off numaxG, numaxX, numaxFur, numaxHMF, numaxHAc

ini=np.array(initial_values())
sol=simulate_yeast(par=par,initial=ini)
Gmass=sol.y[0]*sol.y[8]
Gexpected=ini[0]*ini[8]+ini[0]*(sol.y[8]-ini[8])
Xmass=sol.y[7]*sol.y[8]
glucose_residual=np.max(abs(Gmass-Gexpected))
biomass_residual=np.max(abs(Xmass-ini[7]*ini[8]))
print("No-reaction glucose amount residual [g]:",glucose_residual)
print("No-reaction biomass amount residual [g]:",biomass_residual)
plt.plot(sol.t,Xmass); plt.xlabel("Time [h]"); plt.ylabel("Biomass amount [g]")
`,
 solution:imports+`
from course_models import YeastParameters,simulate_yeast,initial_values
par=YeastParameters()
for name in ["numaxG","numaxX","numaxFur","numaxHMF","numaxHAc"]:
    setattr(par,name,0.)

ini=np.array(initial_values())
sol=simulate_yeast(par=par,initial=ini)
Gmass=sol.y[0]*sol.y[8]
Gexpected=ini[0]*ini[8]+ini[0]*(sol.y[8]-ini[8])
Xmass=sol.y[7]*sol.y[8]
glucose_residual=np.max(abs(Gmass-Gexpected))
biomass_residual=np.max(abs(Xmass-ini[7]*ini[8]))
print("No-reaction glucose amount residual [g]:",glucose_residual)
print("No-reaction biomass amount residual [g]:",biomass_residual)
plt.plot(sol.t,Xmass); plt.xlabel("Time [h]"); plt.ylabel("Biomass amount [g]")
`,
 checks:`assert all(getattr(par,n)==0 for n in ['numaxG','numaxX','numaxFur','numaxHMF','numaxHAc']), 'Disable all five reaction-rate coefficients.'
assert glucose_residual<1e-5, 'Check the extensive glucose balance.'
assert biomass_residual<1e-5, 'With no growth and sterile feed, biomass amount is conserved.'
assert np.max(sol.y[8])<=2+1e-6`,
 hint:'Set each listed uptake coefficient to zero on a fresh parameter object. Do not remove dilution: feeding still changes concentrations.',
 interpretation:'A correct no-reaction balance isolates flow and dilution from kinetics. The baseline study then combines these verified balances with the original reaction model. Neither a solver success flag nor a smooth plot replaces this verification.',
 deliverable:'Submit: (1) state table and units; (2) reaction and feed equations; (3) phase handling; (4) no-reaction balance residuals; (5) BDF/Radau comparison; (6) ten seeded runs; (7) one parameter sensitivity; (8) CSV and reproducible notebook; (9) model limitations. Assessment: formulation 25%, numerical verification 30%, reproducibility 20%, engineering interpretation 25%.'
}
];
