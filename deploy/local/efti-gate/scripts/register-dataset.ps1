#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Registers a dataset in the identifier registry via the platform simulator API.

.DESCRIPTION
    This script uploads a consignment XML file to the platform simulator, which then
    registers the dataset identifiers in the gate's identifier registry. This is required
    before UIL queries can find the dataset.

.PARAMETER DatasetId
    The UUID of the dataset to register (e.g., "12345678-ab12-4ab6-8999-123456789abc")

.PARAMETER XmlFile
    Path to the XML consignment file. If not specified, will look for {datasetId}.xml in the cda folder.

.PARAMETER PlatformPort
    Port of the platform simulator (default: 8070 for ACME/Croatia)

.PARAMETER Realm
    Keycloak realm name (default: "eFTI_HR" for Croatia)

.PARAMETER KeycloakUrl
    Keycloak base URL (default: "http://auth.gate.croatia.eu:8080")

.EXAMPLE
    .\register-dataset.ps1 -DatasetId "12345678-ab12-4ab6-8999-123456789abc"

.EXAMPLE
    .\register-dataset.ps1 -DatasetId "12345678-ab12-4ab6-8999-123456789abc" -XmlFile "C:\path\to\file.xml"
#>

param(
    [Parameter(Mandatory=$true)]
    [string]$DatasetId,
    
    [Parameter(Mandatory=$false)]
    [string]$XmlFile,
    
    [Parameter(Mandatory=$false)]
    [int]$PlatformPort = 8070,
    
    [Parameter(Mandatory=$false)]
    [string]$Realm = "eFTI_HR",
    
    [Parameter(Mandatory=$false)]
    [string]$KeycloakUrl = "http://auth.gate.croatia.eu:8080",
    
    [Parameter(Mandatory=$false)]
    [string]$ClientId = "simulator",
    
    [Parameter(Mandatory=$false)]
    [string]$ClientSecret = "vr2J90y53Uhcuvb5jJJp7e3txxDhTvbc"
)

# Script directory - handle both direct execution and dot-sourcing
if ($MyInvocation.MyCommand.Path) {
    $ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
} else {
    $ScriptDir = $PSScriptRoot
}

# Find project root (deploy/local/efti-gate)
$CurrentPath = $ScriptDir
while ($CurrentPath -and (Split-Path -Leaf $CurrentPath) -ne "efti-gate") {
    $CurrentPath = Split-Path -Parent $CurrentPath
}

if ($CurrentPath) {
    $ProjectRoot = $CurrentPath
    $DefaultCdaPath = Join-Path $ProjectRoot "platform\cda"
} else {
    # Fallback: assume we're in deploy/local/efti-gate/scripts
    $ProjectRoot = Split-Path -Parent (Split-Path -Parent $ScriptDir)
    $DefaultCdaPath = Join-Path $ProjectRoot "platform\cda"
}

# Determine XML file path
if ([string]::IsNullOrEmpty($XmlFile)) {
    $XmlFile = Join-Path $DefaultCdaPath "$DatasetId.xml"
}

# Check if file exists
if (-not (Test-Path $XmlFile)) {
    Write-Error "XML file not found: $XmlFile"
    exit 1
}

Write-Host "Registering dataset: $DatasetId" -ForegroundColor Cyan
Write-Host "XML file: $XmlFile" -ForegroundColor Gray
Write-Host "Platform port: $PlatformPort" -ForegroundColor Gray
Write-Host ""

# Step 1: Get OAuth token from Keycloak
Write-Host "Step 1: Getting OAuth token from Keycloak..." -ForegroundColor Yellow
try {
    $tokenUrl = "$KeycloakUrl/realms/$Realm/protocol/openid-connect/token"
    $tokenBody = @{
        grant_type = "client_credentials"
        client_id = $ClientId
        client_secret = $ClientSecret
    }
    
    $tokenResponse = Invoke-RestMethod -Uri $tokenUrl -Method Post -Body $tokenBody -ContentType "application/x-www-form-urlencoded"
    $accessToken = $tokenResponse.access_token
    
    if ([string]::IsNullOrEmpty($accessToken)) {
        Write-Error "Failed to obtain access token"
        exit 1
    }
    
    Write-Host "✓ Token obtained successfully" -ForegroundColor Green
} catch {
    Write-Error "Failed to get OAuth token: $_"
    exit 1
}

# Step 2: Upload consignment to platform
Write-Host "Step 2: Uploading consignment to platform simulator..." -ForegroundColor Yellow

$uploadUrl = "http://localhost:$PlatformPort/identifiers/upload/consignment/$DatasetId"

# Use curl for multipart form upload (more reliable on Windows)
$filePath = (Resolve-Path $XmlFile).Path
$curlCommand = "curl.exe -X PUT `"$uploadUrl`" -H `"Authorization: Bearer $accessToken`" -F `"consignmentFile=@$filePath`""

Write-Host "Executing: curl PUT $uploadUrl" -ForegroundColor Gray

try {
    $result = Invoke-Expression $curlCommand
    $exitCode = $LASTEXITCODE
    
    if ($exitCode -eq 0) {
        Write-Host "✓ Dataset registered successfully!" -ForegroundColor Green
        Write-Host $result
        Write-Host ""
        Write-Host "You can now query this dataset using UIL:" -ForegroundColor Cyan
        Write-Host "  Dataset ID: $DatasetId" -ForegroundColor White
        exit 0
    } else {
        Write-Error "Failed to register dataset. Exit code: $exitCode"
        if ($result) { Write-Host $result }
        exit 1
    }
} catch {
    Write-Error "Failed to upload consignment: $_"
    exit 1
}

