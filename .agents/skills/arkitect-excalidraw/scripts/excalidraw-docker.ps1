<#
.SYNOPSIS
  Manage the local Excalidraw container and open scenes in it.

.DESCRIPTION
  The container is the ground truth for how a scene looks: it is the real app,
  with the real fonts and the real Rough.js renderer. Everything else in this
  kit - the SVG preview, the validator - exists so you do not have to open it
  for every small check.

  The app has no backend. It cannot fetch a file off your disk, so -Open starts
  the container, opens the browser, and reveals the file in Explorer ready to
  drag onto the canvas. Dropping a .excalidraw file replaces the canvas;
  dropping a .excalidrawlib file adds it to the library sidebar.

.EXAMPLE
  ./excalidraw-docker.ps1 -Up
  ./excalidraw-docker.ps1 -Open -Path architecture.excalidraw
  ./excalidraw-docker.ps1 -Library          # reveal the house icon library
  ./excalidraw-docker.ps1 -Status
  ./excalidraw-docker.ps1 -Down
#>
param(
  [switch]$Up,
  [switch]$Down,
  [switch]$Status,
  [switch]$Logs,
  [switch]$Open,
  [switch]$Library,
  [string]$Path = '',
  [int]$Port = 3000,
  [int]$TimeoutSeconds = 60
)

$ErrorActionPreference = 'Stop'

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot '..\..\..')
$compose = Join-Path $repoRoot 'docker\docker-compose.yml'
$url = "http://localhost:$Port"

function Test-Docker {
  & docker version --format '{{.Server.Version}}' | Out-Null
  if ($LASTEXITCODE -ne 0) { throw "Docker is not available. Start Docker Desktop, then retry." }
}

function Test-Up {
  try {
    $r = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 3
    return $r.StatusCode -eq 200
  } catch { return $false }
}

function Start-Excalidraw {
  Test-Docker
  if (-not (Test-Path $compose)) { throw "No compose file at $compose" }
  if (Test-Up) { Write-Output "already serving -> $url"; return }

  $env:EXCALIDRAW_PORT = "$Port"
  # docker writes pull progress to stderr; redirecting it under Windows
  # PowerShell turns every line into a NativeCommandError, so let it through.
  & docker compose -f $compose up -d
  if ($LASTEXITCODE -ne 0) { throw "docker compose up failed (exit $LASTEXITCODE)" }

  # The image is a few hundred MB on a cold pull, so poll rather than assume.
  $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
  while ((Get-Date) -lt $deadline) {
    if (Test-Up) { Write-Output "excalidraw is up -> $url"; return }
    Start-Sleep -Milliseconds 800
  }
  throw "container started but $url did not answer within $TimeoutSeconds s"
}

function Show-InExplorer([string]$file) {
  if (-not (Test-Path $file)) { throw "No such file: $file" }
  $full = (Resolve-Path $file).Path
  Set-Clipboard -Value $full
  & explorer.exe "/select,`"$full`""
  Write-Output "path copied to clipboard: $full"
  Write-Output "drag it from the Explorer window onto the Excalidraw canvas"
}

if ($Down) {
  Test-Docker
  $env:EXCALIDRAW_PORT = "$Port"
  & docker compose -f $compose down
  exit 0
}

if ($Logs) {
  Test-Docker
  & docker compose -f $compose logs --tail 50
  exit 0
}

if ($Status) {
  $running = Test-Up
  Write-Output "url:       $url"
  Write-Output "reachable: $running"
  & docker ps --filter "name=arkitect-excalidraw" --format "container: {{.Names}}  {{.Status}}  {{.Ports}}"
  exit 0
}

if ($Library) {
  Start-Excalidraw
  # Made icons live in the store (#257); before that, inside the plugin.
  $store = if ($env:ARKITECT_HOME) { $env:ARKITECT_HOME } else { Join-Path $HOME '.arkitect' }
  $lib = Join-Path $store 'excalidraw\icons\house.excalidrawlib'
  if (-not (Test-Path $lib)) { $lib = Join-Path $PSScriptRoot '..\assets\icons\house.excalidrawlib' }
  if (-not (Test-Path $lib)) {
    Write-Output "no house library yet - build an icon first:"
    Write-Output "  node `"$PSScriptRoot\make-icon.mjs`" --url <logo url> --name <product>"
    exit 0
  }
  Start-Process $url
  Show-InExplorer $lib
  exit 0
}

if ($Open) {
  Start-Excalidraw
  Start-Process $url
  if ($Path) { Show-InExplorer $Path }
  else { Write-Output "opened $url  (pass -Path <file.excalidraw> to also reveal a scene)" }
  exit 0
}

if ($Up -or -not ($Down -or $Status -or $Logs -or $Open -or $Library)) {
  Start-Excalidraw
  exit 0
}
