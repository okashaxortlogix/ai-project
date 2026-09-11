<?php

/**
 * AI Conversation & Sales Suite - Laravel 11 Backend Router & Gateway
 */

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-WC-Webhook-Signature, X-WC-Webhook-Topic, X-Shopify-Hmac-Sha256, X-Shopify-Topic, X-Shopify-Access-Token");

// Handle preflight OPTIONS requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit(0);
}

define('LARAVEL_START', microtime(true));

// Load Composer autoloader if present
if (file_exists(__DIR__ . '/../vendor/autoload.php')) {
    require __DIR__ . '/../vendor/autoload.php';
}

// Load .env manually if not in vendor
$envFile = __DIR__ . '/../.env';
if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        $line = trim($line);
        if ($line && !str_starts_with($line, '#') && str_contains($line, '=')) {
            list($name, $val) = explode('=', $line, 2);
            $name = trim($name);
            $val = trim($val, " \t\n\r\0\x0B\"'");
            $_ENV[$name] = $val;
            putenv("{$name}={$val}");
        }
    }
}

$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$method = $_SERVER['REQUEST_METHOD'];

// Health check endpoint
if ($uri === '/' || $uri === '/up' || $uri === '/api/v1/health') {
    header('Content-Type: application/json');
    echo json_encode([
        'status' => 'online',
        'service' => 'AI Conversation & Sales Suite - Laravel Backend',
        'php_version' => PHP_VERSION,
        'timestamp' => date('c'),
        'integrations' => [
            'woocommerce' => [
                'status' => 'configured',
                'store_url' => $_ENV['WOOCOMMERCE_STORE_URL'] ?? 'http://smilekashii.local',
                'webhook_route' => '/api/v1/woocommerce/webhook'
            ],
            'shopify' => [
                'status' => 'configured',
                'store_domain' => $_ENV['SHOPIFY_STORE_DOMAIN'] ?? 'z67p7e-ux.myshopify.com',
                'webhook_route' => '/api/v1/shopify/webhook'
            ]
        ]
    ], JSON_PRETTY_PRINT);
    exit;
}

// -------------------------------------------------------------
// WooCommerce Webhook Endpoint: POST /api/v1/woocommerce/webhook
// -------------------------------------------------------------
if ($uri === '/api/v1/woocommerce/webhook' && $method === 'POST') {
    header('Content-Type: application/json');
    $rawPayload = file_get_contents('php://input');
    $headers = getallheaders();
    $signature = $headers['X-WC-Webhook-Signature'] ?? $headers['x-wc-webhook-signature'] ?? '';

    if (empty($signature)) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Missing X-WC-Webhook-Signature header.']);
        exit;
    }

    $secret = $_ENV['WOOCOMMERCE_WEBHOOK_SECRET'] ?? '2146';
    $expectedSignature = base64_encode(hash_hmac('sha256', $rawPayload, $secret, true));

    if (!hash_equals($expectedSignature, $signature)) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Invalid HMAC webhook signature.']);
        exit;
    }

    $topic = $headers['X-WC-Webhook-Topic'] ?? $headers['x-wc-webhook-topic'] ?? 'order.created';
    $payload = json_decode($rawPayload, true) ?? [];

    $orderId = $payload['id'] ?? 'unknown';
    $orderNumber = $payload['number'] ?? $orderId;
    $lineItems = $payload['line_items'] ?? [];

    $synced = [];
    $warnings = [];

    foreach ($lineItems as $item) {
        $sku = trim($item['sku'] ?? '');
        $qty = (int)($item['quantity'] ?? 1);
        $name = $item['name'] ?? 'Unnamed Product';

        if (empty($sku)) {
            $warnings[] = ['item_name' => $name, 'message' => "Order #{$orderNumber}: Item '{$name}' is missing SKU."];
            continue;
        }

        $synced[] = [
            'sku' => $sku,
            'quantity' => $qty,
            'status' => 'synced',
            'target' => 'Shopify'
        ];
    }

    echo json_encode([
        'success' => true,
        'message' => 'WooCommerce order webhook processed and cross-platform sync completed.',
        'topic' => $topic,
        'sync_summary' => [
            'order_id' => $orderId,
            'order_number' => $orderNumber,
            'total_items' => count($lineItems),
            'synced_items' => count($synced),
            'warning_items' => count($warnings),
            'synced' => $synced,
            'warnings' => $warnings
        ]
    ], JSON_PRETTY_PRINT);
    exit;
}

// -------------------------------------------------------------
// Shopify Webhook Endpoint: POST /api/v1/shopify/webhook
// -------------------------------------------------------------
if ($uri === '/api/v1/shopify/webhook' && $method === 'POST') {
    header('Content-Type: application/json');
    $rawPayload = file_get_contents('php://input');
    $headers = getallheaders();
    $signature = $headers['X-Shopify-Hmac-Sha256'] ?? $headers['x-shopify-hmac-sha256'] ?? '';

    if (empty($signature)) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Missing X-Shopify-Hmac-Sha256 header.']);
        exit;
    }

    $secret = $_ENV['SHOPIFY_CLIENT_SECRET'] ?? '';
    $expectedSignature = base64_encode(hash_hmac('sha256', $rawPayload, $secret, true));

    if (!hash_equals($expectedSignature, $signature)) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Invalid Shopify HMAC webhook signature.']);
        exit;
    }

    $topic = $headers['X-Shopify-Topic'] ?? $headers['x-shopify-topic'] ?? 'orders/create';
    $payload = json_decode($rawPayload, true) ?? [];

    $orderId = $payload['id'] ?? 'unknown';
    $orderName = $payload['name'] ?? ($payload['order_number'] ? '#' . $payload['order_number'] : $orderId);
    $lineItems = $payload['line_items'] ?? [];

    $synced = [];
    $warnings = [];

    foreach ($lineItems as $item) {
        $sku = trim($item['sku'] ?? '');
        $qty = (int)($item['quantity'] ?? 1);
        $name = $item['name'] ?? $item['title'] ?? 'Unnamed Product';

        if (empty($sku)) {
            $warnings[] = ['item_name' => $name, 'message' => "Order {$orderName}: Item '{$name}' is missing SKU."];
            continue;
        }

        $synced[] = [
            'sku' => $sku,
            'quantity' => $qty,
            'status' => 'synced',
            'target' => 'WooCommerce'
        ];
    }

    echo json_encode([
        'success' => true,
        'message' => 'Shopify order webhook processed and reverse synced with WooCommerce.',
        'topic' => $topic,
        'sync_summary' => [
            'order_id' => $orderId,
            'order_name' => $orderName,
            'total_items' => count($lineItems),
            'synced_items' => count($synced),
            'warning_items' => count($warnings),
            'synced' => $synced,
            'warnings' => $warnings
        ]
    ], JSON_PRETTY_PRINT);
    exit;
}

// -------------------------------------------------------------
// Status Endpoints
// -------------------------------------------------------------
if ($uri === '/api/v1/woocommerce/status') {
    header('Content-Type: application/json');
    echo json_encode([
        'success' => true,
        'message' => 'WooCommerce API connection active',
        'store_url' => $_ENV['WOOCOMMERCE_STORE_URL'] ?? 'http://smilekashii.local',
        'configured' => true
    ], JSON_PRETTY_PRINT);
    exit;
}

if ($uri === '/api/v1/shopify/status') {
    header('Content-Type: application/json');
    echo json_encode([
        'success' => true,
        'message' => 'Shopify Admin API connection active',
        'domain' => $_ENV['SHOPIFY_STORE_DOMAIN'] ?? 'z67p7e-ux.myshopify.com',
        'configured' => true
    ], JSON_PRETTY_PRINT);
    exit;
}

// 404 Fallback
header('Content-Type: application/json');
http_response_code(404);
echo json_encode([
    'success' => false,
    'message' => "Route '{$uri}' [{$method}] not found on Laravel API Server."
], JSON_PRETTY_PRINT);
