# Extract all fields from consignment-common.xsd
$xsdFile = "schema\xsd\consignment-common.xsd"
$output = @()

$content = Get-Content $xsdFile -Raw

# Pattern to match element definitions with their eFTI IDs
$pattern = '<xsd:element name="([^"]+)"[^>]*>[\s\S]*?<efti id="([^"]*)"[^>]*(?:definition="([^"]*)")?[^>]*(?:format="([^"]*)")?'

$matches = [regex]::Matches($content, $pattern)

Write-Host "Found $($matches.Count) elements with eFTI IDs"
Write-Host ""

$output += "CONSIGNMENT-COMMON.XSD - COMPLETE FIELD LIST"
$output += "=" * 80
$output += ""

foreach ($match in $matches) {
    $elementName = $match.Groups[1].Value
    $eftiId = $match.Groups[2].Value
    $definition = $match.Groups[3].Value
    $format = $match.Groups[4].Value
    
    $line = "Field: $elementName"
    if ($eftiId) {
        $line += " | eFTI ID: $eftiId"
    }
    if ($format) {
        $line += " | Format: $format"
    }
    if ($definition) {
        $line += " | Definition: $definition"
    }
    $output += $line
}

# Also get elements without eFTI IDs
$elementPattern = '<xsd:element name="([^"]+)"'
$allElements = [regex]::Matches($content, $elementPattern)
$allElementNames = $allElements | ForEach-Object { $_.Groups[1].Value } | Sort-Object -Unique

$elementsWithEfti = $matches | ForEach-Object { $_.Groups[1].Value }
$elementsWithoutEfti = $allElementNames | Where-Object { $_ -notin $elementsWithEfti }

if ($elementsWithoutEfti) {
    $output += ""
    $output += "ELEMENTS WITHOUT eFTI IDs:"
    $output += "-" * 80
    foreach ($elem in $elementsWithoutEfti) {
        $output += "Field: $elem"
    }
}

$output | Out-File -FilePath "consignment-common-fields-list.txt" -Encoding UTF8
Write-Host "Output written to consignment-common-fields-list.txt"







