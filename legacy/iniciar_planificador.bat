@echo off
set "APP_DIR=%~dp0"
cd /d "%APP_DIR%"

set "PYTHON_CMD=python"
python --version >nul 2>nul
if errorlevel 1 (
  set "PYTHON_CMD=C:\Users\Usuario\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe"
)

start "Planificador mesas" "%PYTHON_CMD%" "%APP_DIR%servidor_planificador.py"
timeout /t 1 /nobreak >nul
start "" http://127.0.0.1:8765/planificador-mesas-boda.html
