$ErrorActionPreference = 'Stop'

$RootDir = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$ElectronDistDir = Join-Path $RootDir 'node_modules\electron\dist'
$BaseOutputDir = Join-Path $RootDir 'release\desktop-ranch-win-unpacked'

function Assert-InsideRoot {
  param([string]$TargetPath)

  $resolvedRoot = [System.IO.Path]::GetFullPath($RootDir)
  $resolvedTarget = [System.IO.Path]::GetFullPath($TargetPath)
  if (-not $resolvedTarget.StartsWith($resolvedRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw "Refusing to write outside project root: $resolvedTarget"
  }
}

function Require-Path {
  param(
    [string]$TargetPath,
    [string]$Label
  )

  if (-not (Test-Path -LiteralPath $TargetPath)) {
    throw "Missing ${Label}: $TargetPath"
  }
}

function Copy-DirectoryContents {
  param(
    [string]$Source,
    [string]$Destination
  )

  Require-Path $Source 'source directory'
  New-Item -ItemType Directory -Force -Path $Destination | Out-Null
  Copy-Item -Path (Join-Path $Source '*') -Destination $Destination -Recurse -Force
}

$PackageJsonPath = Join-Path $RootDir 'package.json'
$DistDir = Join-Path $RootDir 'dist'
$DistElectronDir = Join-Path $RootDir 'dist-electron'
$ConnectorPolicyPath = Join-Path $RootDir 'docs\orchestration\connectors.json'
$RootPackage = Get-Content -LiteralPath $PackageJsonPath -Raw -Encoding UTF8 | ConvertFrom-Json
$ProductName = if ($RootPackage.productName) { [string]$RootPackage.productName } else { 'desktop-ranch' }

Require-Path (Join-Path $ElectronDistDir 'electron.exe') 'Electron runtime'
Require-Path (Join-Path $DistDir 'index.html') 'renderer build'
Require-Path (Join-Path $DistDir 'ranch.html') 'ranch renderer build'
Require-Path (Join-Path $DistElectronDir 'main.cjs') 'main process build'
Require-Path (Join-Path $DistElectronDir 'preload.cjs') 'preload build'

Assert-InsideRoot $BaseOutputDir
$OutputDir = $BaseOutputDir
if (Test-Path -LiteralPath $OutputDir) {
  try {
    Remove-Item -LiteralPath $OutputDir -Recurse -Force
  } catch {
    $Stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
    $OutputDir = Join-Path $RootDir "release\desktop-ranch-win-unpacked-$Stamp"
    Assert-InsideRoot $OutputDir
    Write-Warning "Previous output is locked; writing to $OutputDir"
  }
}

$AppDir = Join-Path $OutputDir 'resources\app'
Copy-DirectoryContents $ElectronDistDir $OutputDir
Rename-Item -LiteralPath (Join-Path $OutputDir 'electron.exe') -NewName "$ProductName.exe" -Force

New-Item -ItemType Directory -Force -Path $AppDir | Out-Null
$AppPackage = [ordered]@{
  name = $RootPackage.name
  version = $RootPackage.version
  description = $RootPackage.description
  productName = $ProductName
  type = $RootPackage.type
  main = $RootPackage.main
}

$AppPackageJson = ($AppPackage | ConvertTo-Json -Depth 5) + [Environment]::NewLine
$Utf8NoBom = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText((Join-Path $AppDir 'package.json'), $AppPackageJson, $Utf8NoBom)

Copy-DirectoryContents $DistDir (Join-Path $AppDir 'dist')
Copy-DirectoryContents $DistElectronDir (Join-Path $AppDir 'dist-electron')

if (Test-Path -LiteralPath $ConnectorPolicyPath) {
  $TargetPolicyPath = Join-Path $AppDir 'docs\orchestration\connectors.json'
  New-Item -ItemType Directory -Force -Path (Split-Path $TargetPolicyPath -Parent) | Out-Null
  Copy-Item -LiteralPath $ConnectorPolicyPath -Destination $TargetPolicyPath -Force
}

Write-Host "Windows executable ready: $(Join-Path $OutputDir "$ProductName.exe")"
