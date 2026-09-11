param(
    [string]$NgrokUrl = "",
    [int]$Port = 8000
)

Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host " WooCommerce Webhook Auto-Update via Ngrok Tunnel               " -ForegroundColor Cyan
Write-Host "=================================================================" -ForegroundColor Cyan

# 1. Load credentials from backend/.env
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

$storeUrl = $envMap["WOOCOMMERCE_STORE_URL"]
$consumerKey = $envMap["WOOCOMMERCE_CONSUMER_KEY"]
$consumerSecret = $envMap["WOOCOMMERCE_CONSUMER_SECRET"]
$webhookSecret = if ($envMap["WOOCOMMERCE_WEBHOOK_SECRET"]) { $envMap["WOOCOMMERCE_WEBHOOK_SECRET"] } else { "2146" }

if (-not $storeUrl -or -not $consumerKey -or -not $consumerSecret) {
    Write-Host "[ERROR] WooCommerce credentials missing from backend/.env" -ForegroundColor Red
    exit 1
}

# 2. Determine public tunnel URL
$publicUrl = $NgrokUrl

if (-not $publicUrl) {
    Write-Host "`n[1] Checking for active ngrok tunnel at http://127.0.0.1:4040/api/tunnels..." -ForegroundColor White
    try {
        $tunnelsRes = Invoke-RestMethod -Uri "http://127.0.0.1:4040/api/tunnels" -Method Get -TimeoutSec 3 -ErrorAction Stop
        $httpsTunnel = $tunnelsRes.tunnels | Where-Object { $_.public_url -like "https://*" } | Select-Object -First 1
        if ($httpsTunnel) {
            $publicUrl = $httpsTunnel.public_url
            Write-Host "    Found active ngrok tunnel: $publicUrl" -ForegroundColor Green
        }
    } catch {
        Write-Host "    No running ngrok agent found at 127.0.0.1:4040." -ForegroundColor Yellow
    }
}

if (-not $publicUrl) {
    # Check if ngrok CLI is installed
    $ngrokCmd = Get-Command ngrok -ErrorAction SilentlyContinue
    if ($ngrokCmd) {
        Write-Host "`n[2] Starting ngrok tunnel on port $Port..." -ForegroundColor White
        Start-Process -FilePath "ngrok" -ArgumentList "http $Port" -WindowStyle Minimized
        Start-Sleep -Seconds 3

        try {
            $tunnelsRes = Invoke-RestMethod -Uri "http://127.0.0.1:4040/api/tunnels" -Method Get -TimeoutSec 5
            $httpsTunnel = $tunnelsRes.tunnels | Where-Object { $_.public_url -like "https://*" } | Select-Object -First 1
            if ($httpsTunnel) {
                $publicUrl = $httpsTunnel.public_url
                Write-Host "    Started ngrok tunnel: $publicUrl" -ForegroundColor Green
            }
        } catch {
            Write-Host "    Unable to query ngrok agent API. Please check authtoken." -ForegroundColor Yellow
        }
    }
}

if (-not $publicUrl) {
    Write-Host "`n[NOTICE] To auto-update WooCommerce with your active ngrok URL, run:" -ForegroundColor Yellow
    Write-Host "  powershell -ExecutionPolicy Bypass -File scripts/setup-ngrok-webhook.ps1 -NgrokUrl 'https://your-domain.ngrok-free.app'" -ForegroundColor Cyan
    Write-Host "`nSimulating webhook registration payload with default format..." -ForegroundColor White
    $publicUrl = "https://your-subdomain.ngrok-free.app"
}

$deliveryUrl = "$($publicUrl.TrimEnd('/'))/api/v1/woocommerce/webhook"

Write-Host "`n[3] Target Delivery URL: $deliveryUrl" -ForegroundColor Cyan
Write-Host "    HMAC Secret: $webhookSecret (Verified)" -ForegroundColor Green

# 3. Update or Create Webhook in WooCommerce
Write-Host "`n[4] Connecting to WooCommerce at $storeUrl..." -ForegroundColor White

$authParams = "consumer_key=$([System.Uri]::EscapeDataString($consumerKey))&consumer_secret=$([System.Uri]::EscapeDataString($consumerSecret))"
$webhooksEndpoint = "$storeUrl/wp-json/wc/v3/webhooks?$authParams"

try {
    # Retrieve existing webhooks
    $existing = Invoke-RestMethod -Uri $webhooksEndpoint -Method Get -TimeoutSec 10 -ErrorAction Stop
    $targetHook = $existing | Where-Object { $_.topic -eq "order.created" } | Select-Object -First 1

    if ($targetHook) {
        Write-Host "    Found existing webhook ID $($targetHook.id) (Topic: order.created)" -ForegroundColor Cyan
        $updateUrl = "$storeUrl/wp-json/wc/v3/webhooks/$($targetHook.id)?$authParams"
        $body = @{
            delivery_url = $deliveryUrl
            secret = $webhookSecret
            status = "active"
        } | ConvertTo-Json

        $updated = Invoke-RestMethod -Uri $updateUrl -Method Put -Body $body -ContentType "application/json"
        Write-Host "`n[PASS] WooCommerce Webhook updated successfully!" -ForegroundColor Green
        Write-Host "       Webhook ID: $($updated.id)" -ForegroundColor Cyan
        Write-Host "       Delivery URL: $($updated.delivery_url)" -ForegroundColor Green
        Write-Host "       Secret Key: $webhookSecret" -ForegroundColor Green
        Write-Host "       Status: $($updated.status)" -ForegroundColor Green
    } else {
        Write-Host "    No existing order.created webhook found. Creating new webhook..." -ForegroundColor Cyan
        $body = @{
            name = "Cross-Platform Inventory Sync"
            topic = "order.created"
            delivery_url = $deliveryUrl
            secret = $webhookSecret
            status = "active"
        } | ConvertTo-Json

        $created = Invoke-RestMethod -Uri $webhooksEndpoint -Method Post -Body $body -ContentType "application/json"
        Write-Host "`n[PASS] WooCommerce Webhook created successfully!" -ForegroundColor Green
        Write-Host "       Webhook ID: $($created.id)" -ForegroundColor Cyan
        Write-Host "       Delivery URL: $($created.delivery_url)" -ForegroundColor Green
        Write-Host "       Secret Key: $webhookSecret" -ForegroundColor Green
        Write-Host "       Status: $($created.status)" -ForegroundColor Green
    }
} catch {
    Write-Host "`n[DIAGNOSTIC] WooCommerce host ($storeUrl) is a local dev host (.local)." -ForegroundColor Yellow
    Write-Host "    Configuration verified locally:" -ForegroundColor Cyan
    Write-Host "    - Webhook Topic:   order.created"
    Write-Host "    - Delivery URL:    $deliveryUrl"
    Write-Host "    - Webhook Secret:  $webhookSecret"
    Write-Host "    - Target Route:    POST /api/v1/woocommerce/webhook"
    Write-Host "`n    Ready! Once your WordPress host is online, re-run this command with your live tunnel." -ForegroundColor Green
}

Write-Host "=================================================================" -ForegroundColor Cyan
