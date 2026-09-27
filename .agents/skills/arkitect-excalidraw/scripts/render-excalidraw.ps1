<#
.SYNOPSIS
  Render a .excalidraw scene to PNG locally, so the diagram can be looked at.

.DESCRIPTION
  A thin adapter over render-excalidraw.mjs, which is the tested renderer: it
  draws the SVG, rasterises it in memory with a local Edge, Chrome or Chromium
  it discovers itself, and only then replaces the previous preview, atomically.
  A failure never touches the file that is already there and exits non-zero.

  This script used to test only whether the PNG path existed, so a browser that
  produced nothing was reported as "rendered" over whatever PNG was already
  sitting there - and then deleted the good SVG on the way out (#157). A PNG
  that does not come out now leaves an SVG behind instead, which is the thing
  worth looking at when rasterisation is what broke.

  The PNG is a preview, not an export. Excalidraw's hand-drawn fonts are not
  installed outside the app, so text is substituted and fills are flat. Use it
  to judge layout, spacing, routing and label fit; open the scene in the local
  Excalidraw container when exact appearance matters.

  Every parameter maps to one renderer flag:

    -Path        <scene>          -Style       --style
    -OutDir      the directory <name>.png is written in
    -Width       --width          -Padding     --padding
    -BrowserExe  --browser        -KeepSvg     also writes <name>.svg

  Browser discovery, and the ARKITECT_BROWSER environment variable, now come
  from the renderer rather than from a second list of paths kept here. A run
  that finds no browser exits 1 saying so, where it used to exit 0.

.EXAMPLE
  ./render-excalidraw.ps1 -Path architecture.excalidraw -OutDir .analysis/renders
  ./render-excalidraw.ps1 -Path architecture.excalidraw -Style clean -Width 2400
  ./render-excalidraw.ps1 -Path architecture.excalidraw -KeepSvg
#>
param(
  [Parameter(Mandatory = $true)][string]$Path,
  [string]$OutDir = '.',
  [ValidateSet('rough', 'clean')][string]$Style = 'rough',
  [int]$Width = 2200,
  [int]$Padding = 40,
  [switch]$KeepSvg,
  [string]$BrowserExe = ''
)

$ErrorActionPreference = 'Stop'

$renderer = Join-Path $PSScriptRoot 'render-excalidraw.mjs'
if (-not (Test-Path $renderer)) { throw "Renderer missing: $renderer" }
if (-not (Test-Path $OutDir)) { New-Item -ItemType Directory -Force $OutDir | Out-Null }

$outDirFull = (Resolve-Path $OutDir).Path
$base = [IO.Path]::GetFileNameWithoutExtension($Path)
$png = Join-Path $outDirFull "$base.png"
$svg = Join-Path $outDirFull "$base.svg"

$shared = @('--style', $Style, '--padding', "$Padding")
$pngArgv = @($Path, '--out', $png, '--width', "$Width") + $shared
if ($BrowserExe) { $pngArgv += @('--browser', $BrowserExe) }

$prev = $ErrorActionPreference
$ErrorActionPreference = 'Continue'
& node $renderer @pngArgv
$code = $LASTEXITCODE
$ErrorActionPreference = $prev

# On failure, so there is still something to look at; on -KeepSvg, because that
# is what it asks for. Never otherwise, and never by deleting one just made.
if ($code -ne 0 -or $KeepSvg) {
  $svgArgv = @($Path, '--out', $svg) + $shared
  $prev = $ErrorActionPreference
  $ErrorActionPreference = 'Continue'
  & node $renderer @svgArgv | Out-Null
  $svgCode = $LASTEXITCODE
  $ErrorActionPreference = $prev
  if ($svgCode -eq 0) { Write-Output "svg -> $svg" }
}

exit $code
