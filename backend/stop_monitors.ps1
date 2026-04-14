$baseUrl = "http://localhost:9000"
$targetId = 358

$response = Invoke-RestMethod -Uri "$baseUrl/video/" -Method Get
$devices = $response

Write-Host "========================================"
Write-Host "Stopping all AI monitors except ID=$targetId"
Write-Host "========================================"

$stoppedCount = 0
$skippedCount = 0

foreach ($device in $devices) {
    $deviceId = $device.id
    $deviceName = $device.name

    if ($deviceId -eq [int]$targetId) {
        Write-Host "[SKIP] ID: $deviceId, Name: $deviceName (target device)"
        $skippedCount++
        continue
    }

    try {
        $json = @{device_id="$deviceId"} | ConvertTo-Json
        $stopResponse = Invoke-RestMethod -Uri "$baseUrl/video/ai/stop?device_id=$deviceId" -Method Post -ContentType "application/json"
        Write-Host "[STOP] ID: $deviceId, Name: $deviceName - $($stopResponse.message)"
        $stoppedCount++
    } catch {
        Write-Host "[ERROR] ID: $deviceId, Name: $deviceName - $($_.Exception.Message)"
    }
}

Write-Host "========================================"
Write-Host "Done: Stopped=$stoppedCount, Skipped=$skippedCount"
Write-Host "========================================"
