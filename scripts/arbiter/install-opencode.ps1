$ErrorActionPreference = "Stop"

param(
  [string]$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path,
  [string]$OpenCodeDir = "$env:USERPROFILE\.config\opencode"
)

$defaultRepoUrl = "https://github.com/0possum-eth/arbiter-os-v1.git"
$pluginSource = Join-Path $RepoRoot ".opencode\plugins\arbiter-os.js"
$pluginTargetDir = Join-Path $OpenCodeDir "superpowers\.opencode\plugins"
$pluginLinkPath = Join-Path $OpenCodeDir "plugins\arbiter-os.js"
$skillsLinkPath = Join-Path $OpenCodeDir "skills\superpowers"
$skillsTargetPath = Join-Path $OpenCodeDir "superpowers\skills"

if (-not (Test-Path -LiteralPath $pluginSource -PathType Leaf)) {
  throw "Missing $pluginSource. Clone from $defaultRepoUrl and retry."
}

New-Item -ItemType Directory -Force -Path (Join-Path $OpenCodeDir "plugins") | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $OpenCodeDir "skills") | Out-Null
New-Item -ItemType Directory -Force -Path $pluginTargetDir | Out-Null

$pluginTarget = Join-Path $pluginTargetDir "arbiter-os.js"
Copy-Item -LiteralPath $pluginSource -Destination $pluginTarget -Force

Remove-Item -LiteralPath $pluginLinkPath -Force -ErrorAction SilentlyContinue
Remove-Item -LiteralPath $skillsLinkPath -Force -ErrorAction SilentlyContinue

New-Item -ItemType SymbolicLink -Path $pluginLinkPath -Target $pluginTarget | Out-Null
New-Item -ItemType Junction -Path $skillsLinkPath -Target $skillsTargetPath | Out-Null

Write-Output "Arbiter OS plugin installed to $pluginLinkPath"
