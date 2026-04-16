$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$python = Join-Path $scriptDir ".venv\Scripts\python.exe"

if (-not (Test-Path $python)) {
    Write-Host "Backend virtual environment not found at `"$python`"."
    Write-Host "Create it with:"
    Write-Host "  cd `"$scriptDir`""
    Write-Host "  python -m venv .venv"
    Write-Host "  .venv\Scripts\python.exe -m pip install -r requirements.txt"
    exit 1
}

Push-Location $scriptDir
try {
    & $python -m uvicorn app.main:app --reload @args
}
finally {
    Pop-Location
}
