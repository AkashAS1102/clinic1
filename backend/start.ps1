param([switch]$SkipBuild)

$ErrorActionPreference = "Stop"
$BackendDir  = $PSScriptRoot
$MavenVer    = "3.9.9"
$MavenHome   = Join-Path $BackendDir ".mvn-local\apache-maven-$MavenVer"
$MvnCmd      = Join-Path $MavenHome "bin\mvn.cmd"
$Jar         = Join-Path $BackendDir "target\clinic-backend-1.0.0.jar"

function Step($msg)  { Write-Host "`n$msg" -ForegroundColor Cyan }
function OK($msg)    { Write-Host "  OK  $msg" -ForegroundColor Green }
function Fail($msg)  { Write-Host "  FAIL  $msg" -ForegroundColor Red; exit 1 }

Step "Checking Java..."
$oldError = $ErrorActionPreference
$ErrorActionPreference = "Continue"
try {
    $jv = (& java -version 2>&1) | Select-Object -First 1
    if (-not $?) { throw "fail" }
    OK "Java found: $jv"
} catch {
    $ErrorActionPreference = $oldError
    Fail "Java not found. Install Java 17+ from https://adoptium.net and retry."
}
$ErrorActionPreference = $oldError

if (-not (Test-Path $MvnCmd)) {
    Step "Apache Maven $MavenVer not found - downloading (~9 MB)..."
    $zipUrl  = "https://dlcdn.apache.org/maven/maven-3/$MavenVer/binaries/apache-maven-$MavenVer-bin.zip"
    $zipFile = Join-Path $env:TEMP "apache-maven-$MavenVer-bin.zip"
    $destDir = Join-Path $BackendDir ".mvn-local"

    try {
        Invoke-WebRequest -Uri $zipUrl -OutFile $zipFile -UseBasicParsing
    } catch {
        Write-Host "  Primary mirror failed, trying archive.apache.org..." -ForegroundColor Yellow
        $zipUrl = "https://archive.apache.org/dist/maven/maven-3/$MavenVer/binaries/apache-maven-$MavenVer-bin.zip"
        Invoke-WebRequest -Uri $zipUrl -OutFile $zipFile -UseBasicParsing
    }

    if (-not (Test-Path $destDir)) { New-Item -ItemType Directory -Path $destDir | Out-Null }
    Expand-Archive -Path $zipFile -DestinationPath $destDir -Force
    Remove-Item $zipFile -Force -ErrorAction SilentlyContinue
    OK "Maven $MavenVer installed to $MavenHome"
} else {
    OK "Maven found at $MavenHome"
}

if (-not $SkipBuild) {
    Step "Building clinic-backend (this takes ~1 min on first run)..."
    Push-Location $BackendDir
    & $MvnCmd clean package -DskipTests --no-transfer-progress
    if ($LASTEXITCODE -ne 0) { Pop-Location; Fail "Maven build failed!" }
    Pop-Location
    OK "Build complete -> $Jar"
}

if (-not (Test-Path $Jar)) {
    Fail "JAR not found: $Jar`nRun without -SkipBuild first."
}

Step "Starting Clinic Backend..."
Write-Host ""
Write-Host "  Health : http://localhost:8080/api/health" -ForegroundColor Yellow
Write-Host "  Patients: http://localhost:8080/api/patients" -ForegroundColor Yellow
Write-Host ""

# Load .env variables if present
$EnvFile = Join-Path $BackendDir ".env"
if (Test-Path $EnvFile) {
    Get-Content $EnvFile | ForEach-Object {
        if ($_ -match "^\s*([^#][^=]+)=(.*)$") {
            [System.Environment]::SetEnvironmentVariable($Matches[1].Trim(), $Matches[2].Trim(), "Process")
        }
    }
    OK "Loaded .env"
}

Set-Location $BackendDir
& java -jar $Jar
