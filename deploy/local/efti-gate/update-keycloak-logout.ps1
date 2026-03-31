# Script to update Keycloak portal client with post-logout redirect URI via REST API
# This ensures the change is applied even if Keycloak doesn't re-import the realm

$KEYCLOAK_URL = "http://localhost:8080"
$REALM = "eFTI_HR"
$CLIENT_ID = "portal"
$ADMIN_USER = "admin"
$ADMIN_PASSWORD = "secret"

Write-Host "=========================================="
Write-Host "Updating Keycloak Portal Client Logout Configuration"
Write-Host "Realm: $REALM"
Write-Host "Client: $CLIENT_ID"
Write-Host "=========================================="
Write-Host ""

Write-Host "Step 1: Getting admin access token..."

# Get admin access token
$tokenParams = @{
    client_id = "admin-cli"
    username = $ADMIN_USER
    password = $ADMIN_PASSWORD
    grant_type = "password"
}

try {
    $tokenResponse = Invoke-RestMethod -Uri "$KEYCLOAK_URL/realms/master/protocol/openid-connect/token" `
        -Method Post `
        -ContentType "application/x-www-form-urlencoded" `
        -Body $tokenParams
    
    $accessToken = $tokenResponse.access_token
    Write-Host "Access token obtained"
} catch {
    Write-Host "Error getting access token: $_"
    Write-Host "Make sure Keycloak is running on $KEYCLOAK_URL"
    exit 1
}

Write-Host ""
Write-Host "Step 2: Getting client details for '$CLIENT_ID' in realm '$REALM'..."

# Get client details
try {
    $clientResponse = Invoke-RestMethod -Uri "$KEYCLOAK_URL/admin/realms/$REALM/clients?clientId=$CLIENT_ID" `
        -Method Get `
        -Headers @{
            Authorization = "Bearer $accessToken"
        }
    
    if ($clientResponse.Count -eq 0) {
        Write-Host "Error: Client '$CLIENT_ID' not found in realm '$REALM'!"
        Write-Host "Available clients:"
        $allClients = Invoke-RestMethod -Uri "$KEYCLOAK_URL/admin/realms/$REALM/clients" `
            -Method Get `
            -Headers @{
                Authorization = "Bearer $accessToken"
            }
        $allClients | ForEach-Object { Write-Host "  - $($_.clientId)" }
        exit 1
    }
    
    $client = $clientResponse[0]
    $clientUuid = $client.id
    Write-Host "Found client with UUID: $clientUuid"
    Write-Host "  Client ID: $($client.clientId)"
    Write-Host "  Current attributes:"
    if ($client.attributes) {
        $client.attributes.PSObject.Properties | ForEach-Object {
            Write-Host "    $($_.Name) = $($_.Value)"
        }
    } else {
        Write-Host "    (no attributes set)"
    }
} catch {
    Write-Host "Error getting client: $_"
    if ($_.Exception.Response.StatusCode -eq 404) {
        Write-Host "  Realm '$REALM' might not exist. Check if Keycloak imported it correctly."
    }
    exit 1
}

Write-Host ""
Write-Host "Step 3: Updating client attributes..."

# Ensure attributes object exists
if (-not $client.attributes) {
    $client.attributes = @{}
}

# Set the post-logout redirect URIs to "+" (allows all redirect URIs)
$client.attributes."post.logout.redirect.uris" = "+"

Write-Host "  Setting post.logout.redirect.uris = '+'"

# Remove the id property before sending (Keycloak doesn't like it in PUT)
$clientToUpdate = $client.PSObject.Copy()
$clientToUpdate.PSObject.Properties.Remove('id')

# Convert to JSON
$jsonBody = $clientToUpdate | ConvertTo-Json -Depth 20

Write-Host ""
Write-Host "Step 4: Sending update request to Keycloak..."

# Update the client
try {
    $updateResponse = Invoke-RestMethod -Uri "$KEYCLOAK_URL/admin/realms/$REALM/clients/$clientUuid" `
        -Method Put `
        -Headers @{
            Authorization = "Bearer $accessToken"
            "Content-Type" = "application/json"
        } `
        -Body $jsonBody
    
    Write-Host "Client updated successfully!"
    Write-Host ""
    Write-Host "=========================================="
    Write-Host "SUCCESS!"
    Write-Host "=========================================="
    Write-Host "The post.logout.redirect.uris attribute is now set to '+'"
    Write-Host "This allows all redirect URIs to be used for logout."
    Write-Host ""
    Write-Host "You can now test the logout functionality."
    Write-Host "=========================================="
} catch {
    Write-Host "Error updating client: $_"
    Write-Host ""
    Write-Host "Error details:"
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host $responseBody
    }
    Write-Host ""
    Write-Host "Exception message:"
    Write-Host $_.Exception.Message
    exit 1
}
