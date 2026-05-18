# Тест Suno API из PowerShell. Запуск: cd backend; .\test_suno.ps1
# Ключ возьми из .env (SUNO_API_KEY) или подставь свой ниже
$key = "YOUR_SUNO_API_KEY"
if (Test-Path .env) { Get-Content .env | ForEach-Object { if ($_ -match '^\s*SUNO_API_KEY=(.+)$') { $key = $matches[1].Trim() } } }
if ($key -eq "YOUR_SUNO_API_KEY") { Write-Host "Задай ключ в .env или в переменной key в скрипте"; exit 1 }
$headers = @{
    "Authorization" = "Bearer $key"
    "Content-Type"  = "application/json"
}
# Suno требует callBackUrl; можно указать свой URL или заглушку
$callbackUrl = "https://example.com/callback"
$body = "{`"prompt`":`"test`",`"customMode`":false,`"instrumental`":true,`"model`":`"V4_5ALL`",`"callBackUrl`":`"$callbackUrl`"}"
try {
    $r = Invoke-RestMethod -Uri "https://api.sunoapi.org/api/v1/generate" -Method Post -Headers $headers -Body $body
    $r | ConvertTo-Json -Depth 5
} catch {
    $_.Exception.Response
    $_.ErrorDetails.Message
}
