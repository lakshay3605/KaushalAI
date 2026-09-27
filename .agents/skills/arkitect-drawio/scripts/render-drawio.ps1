<#
.SYNOPSIS
  Render .drawio pages to local PNG with Draw.io Desktop. Never uses the hosted editor.

.DESCRIPTION
  A thin adapter over render-drawio.mjs, which is the tested renderer. It copies
  any existing output to a collision-safe sibling backup and removes it before
  the export, then judges success by a fresh non-empty file - not by the
  exporter's exit status, not by mtime, and not by a file that was already
  there. A failed export puts the previous output back and exits non-zero.

  This script used to test only whether the output path existed, so an export
  that produced nothing was reported as "rendered page 0" over whatever PNG was
  already sitting there, and the run still exited 0 (#157).

  Every parameter maps to one renderer flag, and page indexes stay 0-based:

    -Path       <file>            -PageIndex  --page-index
    -All        --all             -Width      --width
    -OutDir     --out-dir         -Format     --format
    -DrawioExe  --drawio-exe      -Padding    --padding

  -DrawioExe now defaults to empty, which lets the renderer find Draw.io on
  PATH, at DRAWIO_EXE, or in the usual install locations on any platform. Pass
  it to pin one build, as before - page indexing differs between builds, so a
  pin that is not executable fails naming it rather than falling through.

.EXAMPLE
  ./render-drawio.ps1 -Path diagram.drawio -OutDir .analysis/renders
  ./render-drawio.ps1 -Path diagram.drawio -PageIndex 0 -Width 2400
  ./render-drawio.ps1 -Path diagram.drawio -All            # every page
#>
param(
  [Parameter(Mandatory = $true)][string]$Path,
  [int]$PageIndex = 0,
  [switch]$All,
  [int]$Width = 2200,
  [int]$Padding = 20,
  [string]$OutDir = '.',
  [string]$Format = 'png',
  [string]$DrawioExe = ''
)

$ErrorActionPreference = 'Stop'

$renderer = Join-Path $PSScriptRoot 'render-drawio.mjs'
if (-not (Test-Path $renderer)) { throw "Renderer missing: $renderer" }

$argv = @($Path, '--page-index', "$PageIndex", '--width', "$Width", '--padding', "$Padding", '--out-dir', $OutDir, '--format', $Format)
if ($All) { $argv += '--all' }
if ($DrawioExe) { $argv += @('--drawio-exe', $DrawioExe) }

# Draw.io Desktop writes Chromium cache warnings to stderr even on a good
# export. Under Windows PowerShell those surface as NativeCommandError, so the
# call is made with error handling relaxed; the renderer's own exit status is
# the answer, and it is 0 only when every requested page came out.
$prev = $ErrorActionPreference
$ErrorActionPreference = 'Continue'
& node $renderer @argv
$code = $LASTEXITCODE
$ErrorActionPreference = $prev

exit $code
