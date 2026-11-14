$ErrorActionPreference = 'Stop'
$stateFile = Join-Path (Split-Path $PSScriptRoot -Parent) '.studio/service.json'
if (-not (Test-Path -LiteralPath $stateFile)) { Write-Output 'Studio is not running.'; exit 0 }
$saved = Get-Content -LiteralPath $stateFile -Raw | ConvertFrom-Json
$process = Get-Process -Id $saved.pid -ErrorAction SilentlyContinue
if (-not $process) { Remove-Item -LiteralPath $stateFile; Write-Output 'Studio is already stopped.'; exit 0 }
if ($process.StartTime.ToUniversalTime().Ticks.ToString() -ne $saved.started) { throw 'PID was reused; refusing to stop an unrelated process.' }
$info = Get-CimInstance Win32_Process -Filter "ProcessId = $($saved.pid)"
$cli = Join-Path $PSScriptRoot 'src/cli.ts'
if (-not $info.CommandLine.Contains($cli)) { throw 'Process command does not match this studio.' }
$health = Invoke-RestMethod -Uri "http://127.0.0.1:$($saved.port)/api/health" -TimeoutSec 3
if ($health.app -ne 'cloud-ink-studio') { throw 'Unexpected service identity.' }
if ($health.active) { throw 'A render is active. Wait for it to finish before stopping.' }
Stop-Process -Id $process.Id
Remove-Item -LiteralPath $stateFile
Write-Output 'Studio stopped.'
