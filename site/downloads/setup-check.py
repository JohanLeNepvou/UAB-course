import sys
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
print("y(1) =", round(sol.y[0, -1], 6), "— setup works")
