$ErrorActionPreference = 'Stop'
$repo = (Resolve-Path (Split-Path $PSScriptRoot -Parent)).Path
$stylesHome = Join-Path $env:USERPROFILE 'lemo-my-styles'
$skillHome = Join-Path $env:USERPROFILE '.agents/skills/cloud-ink-studio'
$index = Join-Path $stylesHome 'README.md'
$stylePath = Join-Path $repo 'personal-styles/cloud-ink'
New-Item -ItemType Directory -Path $stylesHome -Force | Out-Null
New-Item -ItemType Directory -Path $skillHome -Force | Out-Null
$sourceSkill = Join-Path $PSScriptRoot 'skill/SKILL.md'
$targetSkill = Join-Path $skillHome 'SKILL.md'
if ((Test-Path -LiteralPath $targetSkill) -and (Get-FileHash -LiteralPath $sourceSkill).Hash -ne (Get-FileHash -LiteralPath $targetSkill).Hash) {
    throw 'A different cloud-ink-studio skill already exists; it was not overwritten.'
}
Copy-Item -LiteralPath $sourceSkill -Destination $targetSkill
$rootFile = Join-Path $skillHome 'library-root.txt'
if ((Test-Path -LiteralPath $rootFile) -and (Get-Content -LiteralPath $rootFile -Raw).Trim() -ne $repo) { throw 'Skill already points to another library.' }
Set-Content -LiteralPath $rootFile -Value $repo -Encoding utf8
if (-not (Test-Path -LiteralPath $index)) {
    @('# My styles · 我的风格', '', '| Style | Slug | Base | Description |', '|---|---|---|---|') | Set-Content -LiteralPath $index -Encoding utf8
}
$existingIndex = Get-Content -LiteralPath $index -Raw
if ($existingIndex -notmatch '`cloud-ink`') {
    $styleLink = $stylePath.Replace('\', '/')
    Add-Content -LiteralPath $index -Value "| 云山墨序 / Cloud & Ink | ``cloud-ink`` | ``ink-wash`` | 五色墨、暖宣纸与中文题跋。目录：[$styleLink]($styleLink/STYLE.md) |" -Encoding utf8
}
Write-Output "Registered style: $stylePath"
Write-Output "Installed skill: $targetSkill"
