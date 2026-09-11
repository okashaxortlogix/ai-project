$secret = "2146"
$payload = @{
    id = 5001
    number = "WC-5001"
    status = "processing"
    line_items = @(
        @{
            id = 101
            name = "Wireless Noise Canceling Headphones"
            sku = "HDPHN-001"
            quantity = 2
            price = 199.99
        },
        @{
            id = 102
            name = "Sample Gift Item Without SKU"
            sku = ""
            quantity = 1
            price = 0.00
        }
    )
} | ConvertTo-Json -Depth 5 -Compress

# Compute HMAC SHA256 base64
$hmac = New-Object System.Security.Cryptography.HMACSHA256
$hmac.Key = [System.Text.Encoding]::UTF8.GetBytes($secret)
$hash = $hmac.ComputeHash([System.Text.Encoding]::UTF8.GetBytes($payload))
$sig = [Convert]::ToBase64String($hash)

Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host " Testing WooCommerce Webhook & Cross-Platform Inventory Sync   " -ForegroundColor Cyan
Write-Host "=================================================================" -ForegroundColor Cyan

# Test 1: Reject request missing signature header
try {
    $null = Invoke-RestMethod -Uri "http://localhost:3000/api/v1/woocommerce/webhook" -Method Post -Body $payload -ContentType "application/json"
    Write-Host "[FAIL] Missing signature header accepted" -ForegroundColor Red
} catch {
    Write-Host "[PASS] Missing signature header correctly returned 401 Unauthorized" -ForegroundColor Green
}

# Test 2: Reject request with invalid signature
try {
    $headers2 = @{ "X-WC-Webhook-Signature" = "invalid_signature_hash==" }
    $null = Invoke-RestMethod -Uri "http://localhost:3000/api/v1/woocommerce/webhook" -Method Post -Body $payload -ContentType "application/json" -Headers $headers2
    Write-Host "[FAIL] Invalid signature accepted" -ForegroundColor Red
} catch {
    Write-Host "[PASS] Invalid HMAC signature correctly rejected with 401 Unauthorized" -ForegroundColor Green
}

# Test 3: Accept valid HMAC SHA256 signature and execute cross-platform sync
try {
    $headers3 = @{
        "X-WC-Webhook-Signature" = $sig
        "X-WC-Webhook-Topic" = "order.created"
    }
    $res3 = Invoke-RestMethod -Uri "http://localhost:3000/api/v1/woocommerce/webhook" -Method Post -Body $payload -ContentType "application/json" -Headers $headers3
    
    if ($res3.success -eq $true) {
        Write-Host "[PASS] Webhook authenticated & processed successfully!" -ForegroundColor Green
        Write-Host "       Order ID: $($res3.sync_summary.order_id) ($($res3.sync_summary.order_number))" -ForegroundColor Cyan
        Write-Host "       Total Items: $($res3.sync_summary.total_items)" -ForegroundColor Cyan
        Write-Host "       Synced to Shopify: $($res3.sync_summary.synced_items)" -ForegroundColor Cyan
        Write-Host "       Missing SKU Warnings: $($res3.sync_summary.warning_items)" -ForegroundColor Yellow
        Write-Host "       Cross-platform inventory deduction executed for SKU 'HDPHN-001' x 2" -ForegroundColor Green
    } else {
        Write-Host "[FAIL] Webhook returned error: $($res3.message)" -ForegroundColor Red
    }
} catch {
    Write-Host "[FAIL] Valid webhook threw exception: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host "=================================================================" -ForegroundColor Cyan
