param([string]$Registry = 'https://registry.npmjs.org', [string]$PythonIndex = 'https://pypi.org/simple')
$ErrorActionPreference = 'Stop'
$repo = Split-Path $PSScriptRoot -Parent
Push-Location $repo
try {
    foreach ($tool in @('node', 'npm', 'ffmpeg', 'ffprobe', 'uv', 'sh')) {
        if (-not (Get-Command $tool -ErrorAction SilentlyContinue)) { throw "Missing system tool: $tool" }
    }
    & npm ci --registry=$Registry --no-audit --no-fund
    if ($LASTEXITCODE -ne 0) { throw 'Node dependency installation failed.' }
    & npm --prefix studio ci --registry=$Registry --no-audit --no-fund
    if ($LASTEXITCODE -ne 0) { throw 'Studio check-tool installation failed.' }
    if (-not (Test-Path -LiteralPath '.venv/Scripts/python.exe')) {
        & uv venv --python 3.12 .venv
        if ($LASTEXITCODE -ne 0) { throw 'Python environment creation failed.' }
    }
    & uv pip install --python .venv/Scripts/python.exe -r studio/requirements-lock.txt --index-url $PythonIndex
    if ($LASTEXITCODE -ne 0) { throw 'Python dependency installation failed.' }
    & node node_modules/playwright-core/cli.js install chromium-headless-shell
    if ($LASTEXITCODE -ne 0) { throw 'Chromium installation failed.' }
    & node studio/src/cli.ts doctor
    if ($LASTEXITCODE -ne 0) { throw 'Environment checks failed.' }
} finally { Pop-Location }
