# E-Commerce Integration QA Verification Script
# Tests WooCommerce (http://smilekashii.local) and Shopify (z67p7e-ux.myshopify.com)

$baseUrl = "http://localhost:3000/api/v1"
$passed = 0
$failed = 0

function Report-Result {
    param([string]$Name, [bool]$Condition, [string]$Details = "")
    if ($Condition) {
        Write-Host " [PASS] $Name" -ForegroundColor Green
        if ($Details) { Write-Host "        $Details" -ForegroundColor DarkGray }
        $script:passed++
    } else {
        Write-Host " [FAIL] $Name" -ForegroundColor Red
        if ($Details) { Write-Host "        $Details" -ForegroundColor Yellow }
        $script:failed++
    }
}

Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host " Testing WooCommerce & Shopify Live E-Commerce API Integrations  " -ForegroundColor Cyan
Write-Host "=================================================================" -ForegroundColor Cyan

# Load credentials dynamically from backend/.env if available
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

# ---------------------------------------------------------
# Test 1: WooCommerce API Connection & Diagnostics
# ---------------------------------------------------------
Write-Host "`n[1] Testing WooCommerce Integration..." -ForegroundColor White
try {
    $wooTest = @{
        testOnly = $true
        storeUrl = $envMap["WOOCOMMERCE_STORE_URL"]
        consumerKey = $envMap["WOOCOMMERCE_CONSUMER_KEY"]
        consumerSecret = $envMap["WOOCOMMERCE_CONSUMER_SECRET"]
    } | ConvertTo-Json

    $wooRes = Invoke-RestMethod -Uri "$baseUrl/integrations/woocommerce/connect" -Method Post -Body $wooTest -ContentType "application/json"
    Report-Result -Name "WooCommerce Connection & Consumer Auth Diagnostics" -Condition ($wooRes.success -eq $true) -Details $wooRes.diagnostic.message
} catch {
    Report-Result -Name "WooCommerce Connection Exception" -Condition $false -Details $_.Exception.Message
}

# ---------------------------------------------------------
# Test 2: Shopify API Connection & Diagnostics
# ---------------------------------------------------------
Write-Host "`n[2] Testing Shopify Integration..." -ForegroundColor White
try {
    $shopifyTest = @{
        testOnly = $true
        shopDomain = $envMap["SHOPIFY_STORE_DOMAIN"]
        clientId = $envMap["SHOPIFY_CLIENT_ID"]
        accessToken = $envMap["SHOPIFY_CLIENT_SECRET"]
    } | ConvertTo-Json

    $shopifyRes = Invoke-RestMethod -Uri "$baseUrl/integrations/shopify/connect" -Method Post -Body $shopifyTest -ContentType "application/json"
    Report-Result -Name "Shopify Admin API Connection & Secret Diagnostics" -Condition ($shopifyRes.success -eq $true) -Details $shopifyRes.diagnostic.message
} catch {
    Report-Result -Name "Shopify Connection Exception" -Condition $false -Details $_.Exception.Message
}

# ---------------------------------------------------------
# Test 3: Laravel Codebase Structure Verification
# ---------------------------------------------------------
Write-Host "`n[3] Verifying Laravel E-Commerce Architecture..." -ForegroundColor White
$servicesExist = (Test-Path "backend/app/Services/Ecommerce/WooCommerceService.php") -and (Test-Path "backend/app/Services/Ecommerce/ShopifyService.php")
Report-Result -Name "Laravel WooCommerceService & ShopifyService Classes" -Condition $servicesExist -Details "Located in backend/app/Services/Ecommerce/"

$controllersExist = (Test-Path "backend/app/Http/Controllers/Api/WooCommerceController.php") -and (Test-Path "backend/app/Http/Controllers/Api/ShopifyController.php")
Report-Result -Name "Laravel WooCommerceController & ShopifyController Classes" -Condition $controllersExist -Details "Located in backend/app/Http/Controllers/Api/"

$configExists = (Test-Path "backend/config/ecommerce.php") -and (Test-Path "backend/.env")
Report-Result -Name "Laravel Config & Environment Credentials Binding" -Condition $configExists -Details "Configured in backend/config/ecommerce.php and backend/.env"

Write-Host "`n=================================================================" -ForegroundColor Cyan
Write-Host " Results: $passed Passed, $failed Failed" -ForegroundColor $(if ($failed -eq 0) { "Green" } else { "Red" })
Write-Host "=================================================================" -ForegroundColor Cyan
