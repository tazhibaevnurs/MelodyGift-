$venvActivate = Join-Path $PSScriptRoot "..\backend\venv\Scripts\Activate.ps1"
if (Test-Path $venvActivate) {
    & $venvActivate
} else {
    Write-Host "venv not found: $venvActivate" -ForegroundColor Yellow
}
