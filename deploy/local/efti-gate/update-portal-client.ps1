# Script to update Keycloak portal client with post-logout redirect URI
# This updates the client via Keycloak Admin REST API

$KEYCLOAK_URL = "http://localhost:8080"
$REALM = "eFTI_HR"
$CLIENT_ID = "portal"
$ADMIN_USER = "admin"
$ADMIN_PASSWORD = "secret"

Write-Host "Getting admin access token..."

# Get admin access token
$tokenResponse = Invoke-RestMethod -Uri "$KEYCLOAK_URL/realms/master/protocol/openid-connect/token" `
    -Method Post `
    -ContentType "application/x-www-form-urlencoded" `
    -Body @{
        client_id = "admin-cli"
        username = $ADMIN_USER
        password = $ADMIN_PASSWORD
        grant_type = "password"
    }

$accessToken = $tokenResponse.access_token
Write-Host "Access token obtained"

# Get client details
Write-Host "Getting client details for '$CLIENT_ID'..."
$clientResponse = Invoke-RestMethod -Uri "$KEYCLOAK_URL/admin/realms/$REALM/clients?clientId=$CLIENT_ID" `
    -Method Get `
    -Headers @{
        Authorization = "Bearer $accessToken"
    }

if ($clientResponse.Count -eq 0) {
    Write-Host "Error: Client '$CLIENT_ID' not found!"
    exit 1
}

$client = $clientResponse[0]
$clientUuid = $client.id
Write-Host "Found client with UUID: $clientUuid"

# Update client attributes
Write-Host "Updating client attributes..."
if (-not $client.attributes) {
    $client.attributes = @{}
}

$client.attributes."post.logout.redirect.uris" = "+"

# Update the client
Invoke-RestMethod -Uri "$KEYCLOAK_URL/admin/realms/$REALM/clients/$clientUuid" `
    -Method Put `
    -Headers @{
        Authorization = "Bearer $accessToken"
        "Content-Type" = "application/json"
    } `
    -Body ($client | ConvertTo-Json -Depth 10 -Compress)

Write-Host "Client updated successfully!"
Write-Host "The 'post.logout.redirect.uris' attribute is now set to '+' (allows all redirect URIs)"



