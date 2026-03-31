# Script to update Keycloak portal client with post-logout redirect URI via REST API
# Run this from: deploy/local/efti-gate

$KEYCLOAK_URL = "http://localhost:8080"
$REALM = "eFTI_HR"
$CLIENT_ID = "portal"
$ADMIN_USER = "admin"
$ADMIN_PASSWORD = "secret"

Write-Host "Step 1: Getting admin access token..."

# Get admin access token
$tokenBody = @{
    client_id = "admin-cli"
    username = $ADMIN_USER
    password = $ADMIN_PASSWORD
    grant_type = "password"
} | ConvertTo-Json

try {
    $tokenResponse = Invoke-RestMethod -Uri "$KEYCLOAK_URL/realms/master/protocol/openid-connect/token" `
        -Method Post `
        -ContentType "application/json" `
        -Body $tokenBody
    
    $accessToken = $tokenResponse.access_token
    Write-Host "✓ Access token obtained"
} catch {
    Write-Host "✗ Error getting access token: $_"
    exit 1
}

# Get client details
Write-Host "`nStep 2: Getting client details for '$CLIENT_ID'..."
try {
    $clientResponse = Invoke-RestMethod -Uri "$KEYCLOAK_URL/admin/realms/$REALM/clients?clientId=$CLIENT_ID" `
        -Method Get `
        -Headers @{
            Authorization = "Bearer $accessToken"
        }
    
    if ($clientResponse.Count -eq 0) {
        Write-Host "✗ Error: Client '$CLIENT_ID' not found in realm '$REALM'!"
        exit 1
    }
    
    $client = $clientResponse[0]
    $clientUuid = $client.id
    Write-Host "✓ Found client with UUID: $clientUuid"
} catch {
    Write-Host "✗ Error getting client: $_"
    exit 1
}

# Update client attributes
Write-Host "`nStep 3: Updating client attributes..."
if (-not $client.attributes) {
    $client.attributes = @{}
}

# Set the post-logout redirect URIs to "+" (allows all redirect URIs)
$client.attributes."post.logout.redirect.uris" = "+"

# Remove the id property before sending (Keycloak doesn't like it in PUT)
$client.PSObject.Properties.Remove('id')

# Convert to JSON
$jsonBody = $client | ConvertTo-Json -Depth 20

# Update the client
Write-Host "Sending update request..."
try {
    Invoke-RestMethod -Uri "$KEYCLOAK_URL/admin/realms/$REALM/clients/$clientUuid" `
        -Method Put `
        -Headers @{
            Authorization = "Bearer $accessToken"
            "Content-Type" = "application/json"
        } `
        -Body $jsonBody
    
    Write-Host "✓ Client updated successfully!"
    Write-Host "`nThe 'post.logout.redirect.uris' attribute is now set to '+' (allows all redirect URIs)"
    Write-Host "You can now test the logout functionality."
} catch {
    Write-Host "✗ Error updating client: $_"
    Write-Host "Response: $($_.Exception.Response)"
    exit 1
}




