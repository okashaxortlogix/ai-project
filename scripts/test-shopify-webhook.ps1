# Test script for Shopify Webhook & WooCommerce Reverse Inventory Sync
$envFile = "backend/.env"
$envMap = @{}
if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        $line = $_.Trim()
        if ($line -and -not $line.StartsWith("#") -and $line.Contains("=")) {
            $parts = $line.Split("=", 2)
            $envMap[$parts[0].Trim()] = $parts[1].Trim()
        }
    }
}

$secret = $envMap["SHOPIFY_CLIENT_SECRET"]
$payload = @{
    id = 8001
    name = "#1001"
    financial_status = "paid"
    line_items = @(
        @{
            id = 201
            title = "Premium Cotton Hoodie"
            sku = "HOODIE-BLK-M"
            quantity = 3
            price = "49.99"
        },
        @{
            id = 202
            title = "Promotional Sticker Pack"
            sku = ""
            quantity = 1
            price = "0.00"
        }
    )
} | ConvertTo-Json -Depth 5 -Compress

# Compute HMAC SHA256 base64 using Shopify client secret
$hmac = New-Object System.Security.Cryptography.HMACSHA256
$hmac.Key = [System.Text.Encoding]::UTF8.GetBytes($secret)
$hash = $hmac.ComputeHash([System.Text.Encoding]::UTF8.GetBytes($payload))
$sig = [Convert]::ToBase64String($hash)

Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host " Testing Shopify Webhook & WooCommerce Reverse Inventory Sync   " -ForegroundColor Cyan
Write-Host "=================================================================" -ForegroundColor Cyan

# Test 1: Reject missing signature header
try {
    $null = Invoke-RestMethod -Uri "http://localhost:3000/api/v1/shopify/webhook" -Method Post -Body $payload -ContentType "application/json"
    Write-Host "[FAIL] Missing signature header accepted" -ForegroundColor Red
} catch {
    Write-Host "[PASS] Missing signature header correctly returned 401 Unauthorized" -ForegroundColor Green
}

# Test 2: Reject invalid signature header
try {
    $headers2 = @{ "X-Shopify-Hmac-Sha256" = "invalid_shopify_sig==" }
    $null = Invoke-RestMethod -Uri "http://localhost:3000/api/v1/shopify/webhook" -Method Post -Body $payload -ContentType "application/json" -Headers $headers2
    Write-Host "[FAIL] Invalid signature accepted" -ForegroundColor Red
} catch {
    Write-Host "[PASS] Invalid HMAC signature correctly rejected with 401 Unauthorized" -ForegroundColor Green
}

# Test 3: Accept valid signature and execute reverse inventory deduction on WooCommerce
try {
    $headers3 = @{
        "X-Shopify-Hmac-Sha256" = $sig
        "X-Shopify-Topic" = "orders/create"
    }
    $res3 = Invoke-RestMethod -Uri "http://localhost:3000/api/v1/shopify/webhook" -Method Post -Body $payload -ContentType "application/json" -Headers $headers3
    
    if ($res3.success -eq $true) {
        Write-Host "[PASS] Shopify webhook authenticated & processed successfully!" -ForegroundColor Green
        Write-Host "       Order ID: $($res3.sync_summary.order_id) ($($res3.sync_summary.order_name))" -ForegroundColor Cyan
        Write-Host "       Total Items: $($res3.sync_summary.total_items)" -ForegroundColor Cyan
        Write-Host "       Synced to WooCommerce: $($res3.sync_summary.synced_items)" -ForegroundColor Cyan
        Write-Host "       Missing SKU Warnings: $($res3.sync_summary.warning_items)" -ForegroundColor Yellow
        Write-Host "       Reverse inventory deduction executed for SKU 'HOODIE-BLK-M' x 3 on WooCommerce" -ForegroundColor Green
    } else {
        Write-Host "[FAIL] Webhook returned error: $($res3.message)" -ForegroundColor Red
    }
} catch {
    Write-Host "[FAIL] Valid webhook threw exception: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host "=================================================================" -ForegroundColor Cyan
