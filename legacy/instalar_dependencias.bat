@echo off
python --version >nul 2>nul
if errorlevel 1 (
  echo Python no esta instalado o no esta en PATH.
  echo Instala Python desde https://www.python.org/downloads/ y vuelve a ejecutar este archivo.
  pause
  exit /b 1
)

python -m pip install openpyxl
pause
