"""Verify the documented native Python environment and portable notebooks."""
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile

root = Path(__file__).resolve().parent.parent
environment = dict(os.environ, MPLBACKEND="Agg")
programs = [("setup check", (root / "site/downloads/setup-check.py").read_text(encoding="utf-8"))]
for day in (1, 2, 3):
    notebook = json.loads((root / f"site/notebooks/day{day}-solutions.ipynb").read_text(encoding="utf-8"))
    programs.append((f"Day {day} notebook", "\n\n".join("".join(c["source"]) for c in notebook["cells"] if c["cell_type"] == "code")))
for name, code in programs:
    with tempfile.TemporaryDirectory(prefix="uab-course-") as folder:
        result = subprocess.run([sys.executable, "-c", code], cwd=folder, env=environment, capture_output=True, text=True, timeout=180)
        if result.returncode:
            raise RuntimeError(f"{name} failed:\n{result.stdout[-3000:]}\n{result.stderr[-3000:]}")
        print(f"PASS native Python: {name}")
