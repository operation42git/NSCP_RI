#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Registers a dataset in the identifier registry via the platform simulator API.
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

# Find XML file
if ([string]::IsNullOrEmpty($XmlFile)) {
    $scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
    $projectRoot = Split-Path -Parent $scriptDir
    $XmlFile = Join-Path $projectRoot "platform\cda\$DatasetId.xml"
}

if (-not (Test-Path $XmlFile)) {
    Write-Error "XML file not found: $XmlFile"
    exit 1
}

$XmlFile = (Resolve-Path $XmlFile).Path

Write-Host "Registering dataset: $DatasetId" -ForegroundColor Cyan
Write-Host "XML file: $XmlFile" -ForegroundColor Gray
Write-Host ""

# Get OAuth token
Write-Host "Getting OAuth token..." -ForegroundColor Yellow
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

Write-Host "Token obtained" -ForegroundColor Green

# Upload consignment
Write-Host "Uploading consignment..." -ForegroundColor Yellow
$uploadUrl = "http://127.0.0.1:$PlatformPort/identifiers/upload/consignment/$DatasetId"

try {
    # Use .NET HttpClient for proper multipart form upload
    Add-Type -AssemblyName System.Net.Http
    
    $httpClientHandler = New-Object System.Net.Http.HttpClientHandler
    $httpClient = New-Object System.Net.Http.HttpClient($httpClientHandler)
    $httpClient.DefaultRequestHeaders.Authorization = New-Object System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", $accessToken)
    
    $multipartContent = New-Object System.Net.Http.MultipartFormDataContent
    $fileStream = [System.IO.File]::OpenRead($XmlFile)
    $fileName = Split-Path -Leaf $XmlFile
    $streamContent = New-Object System.Net.Http.StreamContent($fileStream)
    $streamContent.Headers.ContentType = New-Object System.Net.Http.Headers.MediaTypeHeaderValue("application/xml")
    $multipartContent.Add($streamContent, "consignmentFile", $fileName)
    
    $request = New-Object System.Net.Http.HttpRequestMessage([System.Net.Http.HttpMethod]::Put, $uploadUrl)
    $request.Content = $multipartContent
    
    $response = $httpClient.SendAsync($request).Result
    $responseBody = $response.Content.ReadAsStringAsync().Result
    
    $fileStream.Close()
    $httpClient.Dispose()
    
    if ($response.IsSuccessStatusCode) {
        Write-Host "Dataset registered successfully!" -ForegroundColor Green
        if ($responseBody) {
            Write-Host $responseBody
        }
        Write-Host ""
        Write-Host "You can now query this dataset using UIL:" -ForegroundColor Cyan
        Write-Host "  Dataset ID: $DatasetId" -ForegroundColor White
    } else {
        Write-Error "Failed to register dataset. HTTP Status: $($response.StatusCode.value__)"
        Write-Host "Response: $responseBody" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Error "Failed to register dataset: $_"
    exit 1
}




