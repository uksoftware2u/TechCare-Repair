$ErrorActionPreference = "Stop"

$projectPath = "C:\Repair\repair-system"
$nodePath = "C:\Users\Repair\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
$vitePath = Join-Path $projectPath "node_modules\vite\bin\vite.js"
$logPath = Join-Path $projectPath "system-startup.log"

if (-not (Test-Path -LiteralPath $nodePath -PathType Leaf)) {
    "$(Get-Date -Format s) Node.js not found: $nodePath" | Add-Content -LiteralPath $logPath
    exit 1
}

if (-not (Test-Path -LiteralPath $vitePath -PathType Leaf)) {
    "$(Get-Date -Format s) Vite not found: $vitePath" | Add-Content -LiteralPath $logPath
    exit 1
}

$startInfo = [System.Diagnostics.ProcessStartInfo]::new()
if (-not (Get-NetTCPConnection -LocalPort 8091 -State Listen -ErrorAction SilentlyContinue)) {
    $startInfo.FileName = $nodePath
    $startInfo.Arguments = '--env-file=.env.local server/index.mjs'
    $startInfo.WorkingDirectory = $projectPath
    $startInfo.UseShellExecute = $true
    $startInfo.WindowStyle = [System.Diagnostics.ProcessWindowStyle]::Hidden
    $apiProcess = [System.Diagnostics.Process]::Start($startInfo)
    "$(Get-Date -Format s) Started SQL Server API (PID $($apiProcess.Id))" | Add-Content -LiteralPath $logPath
}

if (-not (Get-NetTCPConnection -LocalPort 8080 -State Listen -ErrorAction SilentlyContinue)) {
    $viteStartInfo = [System.Diagnostics.ProcessStartInfo]::new()
    $viteStartInfo.FileName = $nodePath
    $viteStartInfo.Arguments = '"' + $vitePath + '" --host 0.0.0.0 --port 8080 --strictPort'
    $viteStartInfo.WorkingDirectory = $projectPath
    $viteStartInfo.UseShellExecute = $true
    $viteStartInfo.WindowStyle = [System.Diagnostics.ProcessWindowStyle]::Hidden
    $process = [System.Diagnostics.Process]::Start($viteStartInfo)
    "$(Get-Date -Format s) Started repair system (PID $($process.Id))" | Add-Content -LiteralPath $logPath
}
