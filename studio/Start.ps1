param([int]$Port = 43821)
$ErrorActionPreference = 'Stop'
if ($Port -lt 1024 -or $Port -gt 65535) { throw 'Invalid port.' }
$repo = Split-Path $PSScriptRoot -Parent
$runtime = Join-Path $repo '.studio'
$stateFile = Join-Path $runtime 'service.json'
if (Test-Path -LiteralPath $stateFile) {
    $saved = Get-Content -LiteralPath $stateFile -Raw | ConvertFrom-Json
    $existing = Get-Process -Id $saved.pid -ErrorAction SilentlyContinue
    if ($existing -and $existing.StartTime.ToUniversalTime().Ticks.ToString() -eq $saved.started) {
        $health = Invoke-RestMethod -Uri "http://127.0.0.1:$($saved.port)/api/health" -TimeoutSec 3
        if ($health.app -ne 'cloud-ink-studio') { throw 'Recorded process is not the studio.' }
        Write-Output "Already running: http://127.0.0.1:$($saved.port)"
        exit 0
    }
}
if (Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue) { throw "Port $Port is occupied. No existing process was stopped." }
New-Item -ItemType Directory -Path $runtime -Force | Out-Null
$nodePath = (Get-Command node).Source
$cli = Join-Path $PSScriptRoot 'src/cli.ts'
$process = Start-Process -FilePath $nodePath -ArgumentList @(('"' + $cli + '"'), 'serve', $Port.ToString()) -WorkingDirectory $repo -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $runtime 'stdout.log') -RedirectStandardError (Join-Path $runtime 'stderr.log')
$state = @{ pid = $process.Id; port = $Port; started = $process.StartTime.ToUniversalTime().Ticks.ToString() }
$state | ConvertTo-Json | Set-Content -LiteralPath $stateFile -Encoding utf8
for ($attempt = 0; $attempt -lt 40; $attempt++) {
    if ($process.HasExited) { throw 'Studio exited; inspect .studio/stderr.log.' }
    try {
        $health = Invoke-RestMethod -Uri "http://127.0.0.1:$Port/api/health" -TimeoutSec 1
        if ($health.app -eq 'cloud-ink-studio') { Write-Output "Ready: http://127.0.0.1:$Port"; exit 0 }
    } catch { Start-Sleep -Milliseconds 250 }
}
throw 'Studio did not become ready; inspect .studio/stderr.log.'
