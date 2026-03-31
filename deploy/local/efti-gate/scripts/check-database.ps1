#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Quick script to check database contents - ROI, consignment XML, controls, etc.
#>

param(
    [Parameter(Mandatory=$false)]
    [string]$Schema = "eftihr"
)

$containerName = "reference-gate-shared-db"
$dbName = "efti"
$dbUser = "postgres"

Write-Host "=== Database Quick Check ===" -ForegroundColor Cyan
Write-Host ""

# Check if container is running
$containerRunning = docker ps --filter "name=$containerName" --format "{{.Names}}"
if (-not $containerRunning) {
    Write-Host "ERROR: Container $containerName is not running!" -ForegroundColor Red
    Write-Host "Start it with: docker-compose up -d psql" -ForegroundColor Yellow
    exit 1
}

Write-Host "1. Consignment XML Storage (Platform Simulator):" -ForegroundColor Yellow
docker exec -i $containerName psql -U $dbUser -d $dbName -c "
SELECT 
    dataset_id, 
    LENGTH(xml_content) as xml_size_bytes,
    created_at,
    updated_at
FROM public.consignment_xml 
ORDER BY created_at DESC;
"

Write-Host ""
Write-Host "2. Controls in schema '$Schema':" -ForegroundColor Yellow
docker exec -i $containerName psql -U $dbUser -d $dbName -c "
SET search_path TO $Schema;
SELECT 
    id,
    datasetid,
    requestid,
    requesttype,
    status,
    platformid,
    gateid,
    createddate
FROM control
ORDER BY createddate DESC
LIMIT 10;
"

Write-Host ""
Write-Host "3. Requests in schema '$Schema':" -ForegroundColor Yellow
docker exec -i $containerName psql -U $dbUser -d $dbName -c "
SET search_path TO $Schema;
SELECT 
    r.id,
    r.status,
    r.edeliverymessageid,
    c.datasetid,
    c.requesttype
FROM request r
JOIN control c ON r.control = c.id
ORDER BY r.id DESC
LIMIT 10;
"

Write-Host ""
Write-Host "4. Check if ROI tables exist:" -ForegroundColor Yellow
docker exec -i $containerName psql -U $dbUser -d $dbName -c "
SET search_path TO $Schema;
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = '$Schema' AND table_name = 'consignment') 
        THEN 'EXISTS' 
        ELSE 'NOT CREATED YET' 
    END as consignment_table,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = '$Schema' AND table_name = 'main_carriage_transport_movement') 
        THEN 'EXISTS' 
        ELSE 'NOT CREATED YET' 
    END as transport_movement_table,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = '$Schema' AND table_name = 'used_transport_equipment') 
        THEN 'EXISTS' 
        ELSE 'NOT CREATED YET' 
    END as transport_equipment_table;
"

Write-Host ""
Write-Host "5. Summary counts:" -ForegroundColor Yellow
docker exec -i $containerName psql -U $dbUser -d $dbName -c "
SELECT 
    'public.consignment_xml' as table_name,
    COUNT(*) as row_count
FROM public.consignment_xml
UNION ALL
SELECT 
    '$Schema.control',
    COUNT(*)
FROM $Schema.control
UNION ALL
SELECT 
    '$Schema.request',
    COUNT(*)
FROM $Schema.request;
"

Write-Host ""
Write-Host "=== Done ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "To connect interactively, run:" -ForegroundColor Green
Write-Host "  docker exec -it $containerName psql -U $dbUser -d $dbName" -ForegroundColor White
Write-Host ""
Write-Host "Or use a database client:" -ForegroundColor Green
Write-Host "  Host: localhost" -ForegroundColor White
Write-Host "  Port: 9001" -ForegroundColor White
Write-Host "  Database: $dbName" -ForegroundColor White
Write-Host "  Username: $dbUser" -ForegroundColor White
Write-Host "  Password: root" -ForegroundColor White




