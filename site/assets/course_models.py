"""Teaching adapters. Original equations/parameters remain in course_source.

Time: h; concentration: g/L; volume: L; feed: L/h.
The event/phase handling here corrects integration across feed discontinuities.
"""
import random
import numpy as np
from scipy.integrate import solve_ivp
from course_source.DAY3.parameters import Parameters as YeastParameters
from course_source.DAY3.model import initial_values, feed_values
from course_source.DAY3 import model as source_model

STATE_NAMES = ['Glucose', 'Xylose', 'Furfural', 'Furfuryl alcohol',
               '5-HMF', 'Acetic acid', 'Ethanol', 'Biomass', 'Volume']

def yeast_rhs(t, y, par, feed, feeding=False):
    # At t=0 the original Feed function is zero: recover reaction terms exactly.
    dy = source_model.fedbatch(0, y, par, feed)
    F = 0.1 + 0.005*(t-2) if feeding else 0.0
    dy[:8] += F * (np.asarray(feed[:8]) - y[:8]) / y[8]
    dy[8] = F
    return dy

def simulate_yeast(par=None, initial=None, end=50., method='BDF',
                   rtol=1e-7, atol=1e-9, feed=None):
    """Integrate batch, feeding, and full-vessel phases on separate intervals.

    Volume capacity is 2 L. The feed polynomial can be integrated analytically;
    split at the exact filling time instead of stepping over a state switch.
    """
    from types import SimpleNamespace
    par = YeastParameters() if par is None else par
    y0 = np.asarray(initial_values() if initial is None else initial, dtype=float)
    if y0.shape != (9,) or not np.all(np.isfinite(y0)) or np.any(y0 < 0) or not 0 < y0[8] <= 2:
        raise ValueError('Use nine finite nonnegative states and 0 < V0 <= 2 L.')
    if not np.isfinite(end) or end <= 0:
        raise ValueError('end must be a finite positive time in hours.')
    feed = feed_values(y0.tolist()) if feed is None else list(feed)
    fill = 2 + (-0.1 + np.sqrt(0.1**2 + 0.01*(2-y0[8])))/0.005
    edges = sorted(set([0., float(end)] + [v for v in [2., fill] if 0 < v < end]))
    times, states, nfev = [], [], 0
    for a, b in zip(edges[:-1], edges[1:]):
        feeding = a >= 2 and a < fill and y0[8] < 2-1e-10
        grid = np.linspace(a, b, max(3, int((b-a)*12)+1))
        sol = solve_ivp(yeast_rhs, (a,b), y0, args=(par,feed,feeding),
                        method=method, t_eval=grid, rtol=rtol, atol=atol)
        if not sol.success:
            raise RuntimeError(sol.message)
        start = 1 if times else 0
        times.extend(sol.t[start:])
        states.extend(sol.y[:, start:].T)
        y0 = sol.y[:, -1].copy()
        nfev += sol.nfev
    return SimpleNamespace(t=np.array(times), y=np.array(states).T,
                           success=True, nfev=nfev, fill_time=fill)

def variable_feedstock(seed):
    """BDG cell 7 ranges, local RNG; preserves zero-width FA draw."""
    rng = random.Random(seed)
    bounds = [(35,40),(18,28),(0.6,2),(0,0),(0.5,2),(2,3),(0.2,0.9)]
    return [rng.uniform(lo,hi) for lo,hi in bounds] + [5.,0.7]

def variable_growth_parameters(seed):
    """BDG cell 9: six independent +2 to +5% changes (one-sided)."""
    rng = random.Random(seed)
    par = YeastParameters()
    for name, baseline in [('numaxG',1.7271),('numaxX',1.6222),
                           ('YPSg',0.42),('YPSx',0.24),('YXSg',0.115),('YXSx',0.162)]:
        setattr(par, name, baseline*(1+rng.uniform(0.02,0.05)))
    return par

class ChemostatParameters:
    """Values from DAY2/Control_Exercise_2, cell 3; no substituted mu_max."""
    Ks, Ko, Yxs = 0.1, 0.2e-3, 0.4
    A, B, Eg, Gd, R, T = 1e10, 3e90, 58., 550., 8.314e-3, 293.15
    kla, Sf, V, F = 250., 10., 2., 0.5
    def __init__(self):
        self.mux = self.A*np.exp(-self.Eg/(self.R*self.T))/(1+self.B*np.exp(-self.Gd/(self.R*self.T)))
        self.O_sat = 0.21*0.027*np.exp(1142/self.T)*32/1000

def chemostat(t, y, par, kla=None):
    X, S, O = y
    mu = par.mux*S/(par.Ks+S)*O/(par.Ko+O)
    D = par.F/par.V
    transfer = par.kla if kla is None else kla
    return [ (mu-D)*X, D*(par.Sf-S)-mu*X/par.Yxs,
             transfer*(par.O_sat-O)-D*O-(1/par.Yxs-1)*mu*X ]

def oxygen_setpoint(t):
    return 0.003 if t > 10 else (0.006 if t > 5 else 0.005)

def oxygen_control(end=20., Kc=-50000., tauI=0.02):
    """Original unsaturated PI; split at setpoint steps; returns actual actuation."""
    from types import SimpleNamespace
    par = ChemostatParameters()
    if end <= 0 or tauI <= 0:
        raise ValueError('end and tauI must be positive.')
    y0 = [3.,0.,0.,0.]
    times, states = [], []
    edges = sorted(set([0., float(end)] + [v for v in [5.,10.] if v < end]))
    for a,b in zip(edges[:-1],edges[1:]):
        sp = oxygen_setpoint((a+b)/2)
        def rhs(t,y):
            X,S,O,I = y
            u = par.kla + Kc*(O-sp) + I
            return [*chemostat(t,[X,S,O],par,u), Kc/tauI*(O-sp)]
        sol = solve_ivp(rhs,(a,b),y0,method='BDF',t_eval=np.linspace(a,b,151),
                        rtol=1e-7,atol=[1e-9,1e-9,1e-11,1e-7])
        if not sol.success:
            raise RuntimeError(sol.message)
        start=1 if times else 0
        times.extend(sol.t[start:]); states.extend(sol.y[:,start:].T)
        y0=sol.y[:,-1]
    t=np.array(times); y=np.array(states).T
    sp=np.array([oxygen_setpoint(v) for v in t])
    u=par.kla + Kc*(y[2]-sp) + y[3]
    return SimpleNamespace(t=t,y=y,sp=sp,kla=u,success=True)
