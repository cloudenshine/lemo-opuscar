param([string]$Library = (Resolve-Path (Join-Path $PSScriptRoot '../..')).Path)
$ErrorActionPreference = 'Stop'
$projectId = Split-Path $PSScriptRoot -Leaf
& node (Join-Path $Library 'studio/src/cli.ts') render $projectId
if ($LASTEXITCODE -ne 0) { throw 'Render failed.' }
