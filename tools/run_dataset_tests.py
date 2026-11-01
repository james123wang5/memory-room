"""Prefer the project-local Python environment; keep test scratch files on Lexar."""
from pathlib import Path
import os
import subprocess
import sys

root = Path(__file__).resolve().parents[1]
python = root / '.venv' / ('Scripts/python.exe' if os.name == 'nt' else 'bin/python')
sys.exit(subprocess.call([str(python) if python.is_file() else sys.executable,
                         '-m', 'unittest', 'discover', '-s', 'tools/dataset', '-p', 'test_*.py'], cwd=root))
