# Maven Installation Script for Windows
# This script downloads and installs Apache Maven

Write-Host "Maven Installation Script" -ForegroundColor Green
Write-Host "========================" -ForegroundColor Green

# Check if Java is installed
Write-Host "`nChecking Java installation..." -ForegroundColor Yellow
try {
    $javaVersion = java -version 2>&1 | Select-Object -First 1
    Write-Host "Java found: $javaVersion" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Java is not installed or not in PATH!" -ForegroundColor Red
    Write-Host "Please install Java 17+ first." -ForegroundColor Red
    exit 1
}

# Maven version and download URL
$mavenVersion = "3.9.6"
$mavenUrl = "https://archive.apache.org/dist/maven/maven-3/$mavenVersion/binaries/apache-maven-$mavenVersion-bin.zip"
# Install to user directory (no admin required)
$installDir = "$env:USERPROFILE\Tools\maven"
$mavenHome = "$installDir\apache-maven-$mavenVersion"
$zipFile = "$env:TEMP\apache-maven-$mavenVersion-bin.zip"

# Check if Maven is already installed
if (Test-Path "$mavenHome\bin\mvn.cmd") {
    Write-Host "`nMaven $mavenVersion is already installed at $mavenHome" -ForegroundColor Yellow
    $response = Read-Host "Do you want to reinstall? (y/N)"
    if ($response -ne "y" -and $response -ne "Y") {
        Write-Host "Installation cancelled." -ForegroundColor Yellow
        exit 0
    }
}

# Create installation directory
Write-Host "`nCreating installation directory..." -ForegroundColor Yellow
if (-not (Test-Path $installDir)) {
    New-Item -ItemType Directory -Path $installDir -Force | Out-Null
}

# Download Maven
Write-Host "Downloading Maven $mavenVersion..." -ForegroundColor Yellow
Write-Host "URL: $mavenUrl" -ForegroundColor Gray
try {
    Invoke-WebRequest -Uri $mavenUrl -OutFile $zipFile -UseBasicParsing
    Write-Host "Download completed!" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Failed to download Maven!" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

# Extract Maven
Write-Host "`nExtracting Maven..." -ForegroundColor Yellow
try {
    if (Test-Path $mavenHome) {
        Remove-Item -Path $mavenHome -Recurse -Force
    }
    Expand-Archive -Path $zipFile -DestinationPath $installDir -Force
    Write-Host "Extraction completed!" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Failed to extract Maven!" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

# Clean up zip file
Remove-Item -Path $zipFile -Force -ErrorAction SilentlyContinue

# Set environment variables
Write-Host "`nSetting environment variables..." -ForegroundColor Yellow

# Set MAVEN_HOME (requires admin for machine-level)
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if ($isAdmin) {
    # Set machine-level environment variables
    [System.Environment]::SetEnvironmentVariable("MAVEN_HOME", $mavenHome, [System.EnvironmentVariableTarget]::Machine)
    Write-Host "MAVEN_HOME set to: $mavenHome (Machine level)" -ForegroundColor Green
    
    # Add to PATH
    $currentPath = [System.Environment]::GetEnvironmentVariable("Path", [System.EnvironmentVariableTarget]::Machine)
    $mavenBin = "$mavenHome\bin"
    
    if ($currentPath -notlike "*$mavenBin*") {
        $newPath = "$currentPath;$mavenBin"
        [System.Environment]::SetEnvironmentVariable("Path", $newPath, [System.EnvironmentVariableTarget]::Machine)
        Write-Host "Added Maven to PATH (Machine level)" -ForegroundColor Green
    } else {
        Write-Host "Maven already in PATH" -ForegroundColor Yellow
    }
} else {
    # Set user-level environment variables
    [System.Environment]::SetEnvironmentVariable("MAVEN_HOME", $mavenHome, [System.EnvironmentVariableTarget]::User)
    Write-Host "MAVEN_HOME set to: $mavenHome (User level)" -ForegroundColor Green
    
    # Add to PATH
    $currentPath = [System.Environment]::GetEnvironmentVariable("Path", [System.EnvironmentVariableTarget]::User)
    $mavenBin = "$mavenHome\bin"
    
    if ($currentPath -notlike "*$mavenBin*") {
        $newPath = "$currentPath;$mavenBin"
        [System.Environment]::SetEnvironmentVariable("Path", $newPath, [System.EnvironmentVariableTarget]::User)
        Write-Host "Added Maven to PATH (User level)" -ForegroundColor Green
    } else {
        Write-Host "Maven already in PATH" -ForegroundColor Yellow
    }
    
    Write-Host "`nNOTE: Script was run without admin privileges." -ForegroundColor Yellow
    Write-Host "Environment variables were set for current user only." -ForegroundColor Yellow
    Write-Host "For system-wide installation, run PowerShell as Administrator." -ForegroundColor Yellow
}

# Refresh environment variables in current session
$env:MAVEN_HOME = $mavenHome
$env:Path = "$env:Path;$mavenHome\bin"

# Verify installation
Write-Host "`nVerifying installation..." -ForegroundColor Yellow
try {
    $mvnVersion = & "$mavenHome\bin\mvn.cmd" -version 2>&1 | Select-Object -First 3
    Write-Host "`nMaven Installation Successful!" -ForegroundColor Green
    Write-Host "================================" -ForegroundColor Green
    $mvnVersion | ForEach-Object { Write-Host $_ }
    Write-Host "`nMaven installed at: $mavenHome" -ForegroundColor Green
    Write-Host "`nIMPORTANT: Please close and reopen your terminal/PowerShell" -ForegroundColor Yellow
    Write-Host "for the PATH changes to take effect in new sessions." -ForegroundColor Yellow
} catch {
    Write-Host "`nWARNING: Could not verify Maven installation." -ForegroundColor Yellow
    Write-Host "Please close and reopen your terminal, then run: mvn -version" -ForegroundColor Yellow
}

Write-Host "`nInstallation completed!" -ForegroundColor Green

