# Chạy backend GymFlow trên máy local, tự nạp biến từ .env.
# Yêu cầu: Docker MySQL đang chạy (docker compose up -d mysql) và Java 21.
# Dùng:  powershell -ExecutionPolicy Bypass -File scripts\run-backend.ps1
#        powershell -ExecutionPolicy Bypass -File scripts\run-backend.ps1 test

param([string]$Task = "bootRun")

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$envFile = Join-Path $root ".env"

if (Test-Path -LiteralPath $envFile) {
    Get-Content -LiteralPath $envFile | ForEach-Object {
        $line = $_.Trim()
        if (-not $line -or $line.StartsWith('#') -or -not $line.Contains('=')) { return }
        $idx = $line.IndexOf('=')
        $key = $line.Substring(0, $idx).Trim()
        $val = $line.Substring($idx + 1).Trim()
        if ($val.Length -ge 2 -and $val.StartsWith('"') -and $val.EndsWith('"')) {
            $val = $val.Substring(1, $val.Length - 2)
        }
        Set-Item -Path "Env:$key" -Value $val
    }
}

$dbName = if ($env:MYSQL_DATABASE) { $env:MYSQL_DATABASE } else { "gymflow" }
$dbPort = if ($env:MYSQL_PORT) { $env:MYSQL_PORT } else { "3307" }
if (-not $env:SPRING_DATASOURCE_URL) {
    $env:SPRING_DATASOURCE_URL = "jdbc:mysql://localhost:${dbPort}/${dbName}?useSSL=false&allowPublicKeyRetrieval=true&connectionTimeZone=Asia/Ho_Chi_Minh"
}
if (-not $env:SPRING_DATASOURCE_USERNAME -and $env:MYSQL_USER) { $env:SPRING_DATASOURCE_USERNAME = $env:MYSQL_USER }
if (-not $env:SPRING_DATASOURCE_PASSWORD -and $env:MYSQL_PASSWORD) { $env:SPRING_DATASOURCE_PASSWORD = $env:MYSQL_PASSWORD }
if (-not $env:TZ) { $env:TZ = "Asia/Ho_Chi_Minh" }

$exe = $null
$cmd = Get-Command gradle -ErrorAction SilentlyContinue
if ($cmd) {
    $exe = $cmd.Source
} else {
    $dist = Join-Path $env:USERPROFILE ".gradle\wrapper\dists"
    $candidates = @(Get-ChildItem -LiteralPath $dist -Recurse -Filter gradle.bat -ErrorAction SilentlyContinue)
    if ($candidates.Count -eq 0) {
        throw "Không tìm thấy Gradle. Cài Gradle hoặc mở project bằng IntelliJ/VS Code để tải Gradle wrapper."
    }
    $preferred = $candidates | Where-Object { $_.FullName -match '\\gradle-8\.' } | Select-Object -First 1
    $exe = if ($preferred) { $preferred.FullName } else { $candidates[0].FullName }
}

Write-Host "Backend: $env:SPRING_DATASOURCE_URL"
Write-Host "Gradle : $exe"
Write-Host "Task   : $Task"
Write-Host "Frontend dev: cd frontend; npm run dev  -> http://localhost:5173"
Write-Host "API         : http://localhost:8080  (Swagger: /swagger-ui.html)"

Push-Location (Join-Path $root "backend")
try {
    & $exe $Task --no-daemon
} finally {
    Pop-Location
}
