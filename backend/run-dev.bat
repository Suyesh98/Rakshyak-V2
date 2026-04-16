@echo off
setlocal

set "SCRIPT_DIR=%~dp0"
set "PYTHON=%SCRIPT_DIR%.venv\Scripts\python.exe"

if not exist "%PYTHON%" (
  echo Backend virtual environment not found at "%PYTHON%".
  echo Create it with:
  echo   cd /d "%SCRIPT_DIR%"
  echo   python -m venv .venv
  echo   .venv\Scripts\python.exe -m pip install -r requirements.txt
  exit /b 1
)

pushd "%SCRIPT_DIR%"
"%PYTHON%" -m uvicorn app.main:app --reload %*
set "EXIT_CODE=%ERRORLEVEL%"
popd

exit /b %EXIT_CODE%
