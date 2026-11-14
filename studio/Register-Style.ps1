$ErrorActionPreference = 'Stop'
$repo = (Resolve-Path (Split-Path $PSScriptRoot -Parent)).Path
$stylesHome = Join-Path $env:USERPROFILE 'lemo-my-styles'
$skillHome = Join-Path $env:USERPROFILE '.agents/skills/cloud-ink-studio'
$index = Join-Path $stylesHome 'README.md'
New-Item -ItemType Directory -Path $stylesHome -Force | Out-Null
New-Item -ItemType Directory -Path $skillHome -Force | Out-Null
$sourceSkill = Join-Path $PSScriptRoot 'skill/SKILL.md'
$targetSkill = Join-Path $skillHome 'SKILL.md'
$rootFile = Join-Path $skillHome 'library-root.txt'
$hashFile = Join-Path $skillHome 'installed-skill.sha256'
if ((Test-Path -LiteralPath $rootFile) -and (Get-Content -LiteralPath $rootFile -Raw).Trim() -ne $repo) { throw 'Skill already points to another library.' }
if ((Test-Path -LiteralPath $targetSkill) -and (Get-FileHash -LiteralPath $sourceSkill).Hash -ne (Get-FileHash -LiteralPath $targetSkill).Hash) {
    $previousHash = '70F86747737D847C2EE60A893613E975F190E0184BAD3124B1B842BE8BCFC3A3'
    if (Test-Path -LiteralPath $hashFile) { $previousHash = (Get-Content -LiteralPath $hashFile -Raw).Trim() }
    if (-not (Test-Path -LiteralPath $rootFile) -or (Get-FileHash -LiteralPath $targetSkill).Hash -ne $previousHash) {
        throw 'Installed skill has local changes or another owner; it was not overwritten.'
    }
}
Copy-Item -LiteralPath $sourceSkill -Destination $targetSkill
Set-Content -LiteralPath $hashFile -Value (Get-FileHash -LiteralPath $targetSkill).Hash -Encoding utf8
Set-Content -LiteralPath $rootFile -Value $repo -Encoding utf8
if (-not (Test-Path -LiteralPath $index)) {
    @('# My styles · 我的风格', '', '| Style | Slug | Base | Description |', '|---|---|---|---|') | Set-Content -LiteralPath $index -Encoding utf8
}
$existingIndex = Get-Content -LiteralPath $index -Raw
foreach ($slug in @('cloud-ink', 'chinese-editorial', 'dark-product')) {
    $stylePath = Join-Path $repo "personal-styles/$slug"
    $meta = Get-Content -LiteralPath (Join-Path $stylePath 'style.json') -Raw | ConvertFrom-Json
    if ($existingIndex.Contains(('`' + $slug + '`'))) { continue }
    $styleLink = $stylePath.Replace('\', '/')
    Add-Content -LiteralPath $index -Value "| $($meta.cn) / $($meta.en) | ``$slug`` | ``$($meta.based_on)`` | $($meta.line_cn) 目录：[$slug]($styleLink/STYLE.md) |" -Encoding utf8
    Write-Output "Registered style: $slug"
}
Write-Output "Installed skill: $targetSkill"
