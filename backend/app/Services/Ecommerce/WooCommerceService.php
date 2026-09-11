<?php

namespace App\Services\Ecommerce;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use function config;
use function env;
use Exception;

class WooCommerceService
{
    protected string $storeUrl;
    protected string $consumerKey;
    protected string $consumerSecret;
    protected string $version;
    protected bool $verifySsl;
    protected int $timeout;
    protected mixed $client = null;

    public function __construct(?array $config = null)
    {
        $this->storeUrl = rtrim($config['store_url'] ?? config('ecommerce.woocommerce.store_url', env('WOOCOMMERCE_STORE_URL', 'http://smilekashii.local')), '/');
        $this->consumerKey = $config['consumer_key'] ?? config('ecommerce.woocommerce.consumer_key', env('WOOCOMMERCE_CONSUMER_KEY', ''));
        $this->consumerSecret = $config['consumer_secret'] ?? config('ecommerce.woocommerce.consumer_secret', env('WOOCOMMERCE_CONSUMER_SECRET', ''));
        $this->version = $config['version'] ?? config('ecommerce.woocommerce.version', env('WOOCOMMERCE_API_VERSION', 'wc/v3'));
        $this->verifySsl = (bool)($config['verify_ssl'] ?? config('ecommerce.woocommerce.verify_ssl', false));
        $this->timeout = (int)($config['timeout'] ?? config('ecommerce.woocommerce.timeout', 15));

        // Initialize official Automattic\WooCommerce\Client if class is present
        if (class_exists('\Automattic\WooCommerce\Client')) {
            try {
                $this->client = new \Automattic\WooCommerce\Client(
                    $this->storeUrl,
                    $this->consumerKey,
                    $this->consumerSecret,
                    [
                        'version' => $this->version,
                        'verify_ssl' => $this->verifySsl,
                        'timeout' => $this->timeout,
                    ]
                );
            } catch (Exception $e) {
                Log::warning("WooCommerce Client init warning: " . $e->getMessage());
            }
        }
    }

    /**
     * Test connection to WooCommerce REST API
     */
    public function testConnection(): array
    {
        try {
            $endpoint = "{$this->storeUrl}/wp-json/{$this->version}/system_status";
            $response = $this->sendRequest('get', 'system_status');

            return [
                'success' => true,
                'message' => 'Successfully connected to WooCommerce store',
                'store_url' => $this->storeUrl,
                'data' => $response
            ];
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => 'WooCommerce connection error: ' . $e->getMessage(),
                'store_url' => $this->storeUrl
            ];
        }
    }

    /**
     * Get list of products
     */
    public function getProducts(array $params = []): array
    {
        return $this->sendRequest('get', 'products', $params);
    }

    /**
     * Get a single product by ID
     */
    public function getProduct(int $id): array
    {
        return $this->sendRequest('get', "products/{$id}");
    }

    /**
     * Create a new product
     */
    public function createProduct(array $data): array
    {
        $payload = [
            'name' => $data['name'],
            'type' => $data['type'] ?? 'simple',
            'regular_price' => (string)($data['regular_price'] ?? $data['price'] ?? '0.00'),
            'description' => $data['description'] ?? '',
            'short_description' => $data['short_description'] ?? '',
            'categories' => isset($data['categories']) ? (array)$data['categories'] : [],
            'images' => isset($data['images']) ? (array)$data['images'] : []
        ];

        return $this->sendRequest('post', 'products', $payload);
    }

    /**
     * Get list of orders
     */
    public function getOrders(array $params = []): array
    {
        return $this->sendRequest('get', 'orders', $params);
    }

    /**
     * Get single order by ID
     */
    public function getOrder(int $id): array
    {
        return $this->sendRequest('get', "orders/{$id}");
    }

    /**
     * Create a new order
     */
    public function createOrder(array $data): array
    {
        $payload = [
            'payment_method' => $data['payment_method'] ?? 'bacs',
            'payment_method_title' => $data['payment_method_title'] ?? 'Direct Bank Transfer',
            'set_paid' => $data['set_paid'] ?? false,
            'billing' => $data['billing'] ?? [],
            'shipping' => $data['shipping'] ?? [],
            'line_items' => $data['line_items'] ?? [],
            'shipping_lines' => $data['shipping_lines'] ?? []
        ];

        return $this->sendRequest('post', 'orders', $payload);
    }

    /**
     * Find a product or variation by SKU on WooCommerce
     */
    public function findProductBySku(string $sku): ?array
    {
        try {
            $products = $this->getProducts(['sku' => $sku]);
            if (!empty($products[0])) {
                return $products[0];
            }

            // Fallback: search across products
            $searchResults = $this->getProducts(['search' => $sku, 'per_page' => 20]);
            foreach ($searchResults as $product) {
                if (isset($product['sku']) && strcasecmp(trim($product['sku']), trim($sku)) === 0) {
                    return $product;
                }
            }
        } catch (Exception $e) {
            Log::error("WooCommerceService::findProductBySku failed for SKU {$sku}: " . $e->getMessage());
        }

        return null;
    }

    /**
     * Update stock level for a WooCommerce product
     */
    public function updateStock(int $productId, int $newQuantity): array
    {
        return $this->sendRequest('put', "products/{$productId}", [
            'manage_stock' => true,
            'stock_quantity' => $newQuantity
        ]);
    }

    /**
     * Deduct inventory by SKU on WooCommerce (triggered by Shopify order)
     */
    public function deductInventoryBySku(string $sku, int $quantity = 1): array
    {
        $product = $this->findProductBySku($sku);
        if (!$product) {
            return [
                'success' => false,
                'sku' => $sku,
                'message' => "SKU '{$sku}' not found in WooCommerce store catalog."
            ];
        }

        $productId = (int)$product['id'];
        $currentStock = isset($product['stock_quantity']) ? (int)$product['stock_quantity'] : 0;
        $newStock = max(0, $currentStock - $quantity);

        try {
            $updated = $this->updateStock($productId, $newStock);
            return [
                'success' => true,
                'sku' => $sku,
                'product_id' => $productId,
                'product_name' => $product['name'] ?? '',
                'deducted' => $quantity,
                'previous_stock' => $currentStock,
                'new_stock' => $newStock,
                'response' => $updated
            ];
        } catch (Exception $e) {
            return [
                'success' => false,
                'sku' => $sku,
                'product_id' => $productId,
                'message' => "Failed to update WooCommerce stock for SKU '{$sku}': " . $e->getMessage()
            ];
        }
    }

    /**
     * Fetch webhooks list from WooCommerce
     */
    public function getWebhooks(): array
    {
        return $this->sendRequest('get', 'webhooks');
    }

    /**
     * Create a webhook in WooCommerce
     */
    public function createWebhook(array $data): array
    {
        return $this->sendRequest('post', 'webhooks', $data);
    }

    /**
     * Update an existing webhook in WooCommerce
     */
    public function updateWebhook(int $id, array $data): array
    {
        return $this->sendRequest('put', "webhooks/{$id}", $data);
    }

    /**
     * Sync or create the delivery URL for WooCommerce order webhook
     */
    public function syncWebhookUrl(string $deliveryUrl, string $secret = '2146'): array
    {
        try {
            $webhooks = $this->getWebhooks();
            foreach ($webhooks as $hook) {
                if (($hook['topic'] ?? '') === 'order.created') {
                    $updated = $this->updateWebhook((int)$hook['id'], [
                        'delivery_url' => $deliveryUrl,
                        'secret' => $secret,
                        'status' => 'active'
                    ]);
                    return [
                        'success' => true,
                        'action' => 'updated',
                        'webhook_id' => $hook['id'],
                        'delivery_url' => $deliveryUrl,
                        'data' => $updated
                    ];
                }
            }

            // Create new if none exists
            $created = $this->createWebhook([
                'name' => 'Cross-Platform Inventory Sync',
                'topic' => 'order.created',
                'delivery_url' => $deliveryUrl,
                'secret' => $secret,
                'status' => 'active'
            ]);

            return [
                'success' => true,
                'action' => 'created',
                'webhook_id' => $created['id'] ?? null,
                'delivery_url' => $deliveryUrl,
                'data' => $created
            ];
        } catch (Exception $e) {
            return [
                'success' => false,
                'delivery_url' => $deliveryUrl,
                'message' => 'Failed to sync WooCommerce webhook URL: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Centralized request dispatcher supporting Automattic client and Laravel Http facade
     */
    protected function sendRequest(string $method, string $endpoint, array $data = []): array
    {
        // 1. Try Automattic\WooCommerce\Client if available
        if ($this->client !== null) {
            try {
                if ($method === 'get') {
                    $result = $this->client->get($endpoint, $data);
                } elseif ($method === 'post') {
                    $result = $this->client->post($endpoint, $data);
                } elseif ($method === 'put') {
                    $result = $this->client->put($endpoint, $data);
                } elseif ($method === 'delete') {
                    $result = $this->client->delete($endpoint, $data);
                } else {
                    $result = [];
                }
                return json_decode(json_encode($result), true) ?? [];
            } catch (Exception $e) {
                Log::warning("Automattic SDK error on {$endpoint}, falling back to direct HTTP: " . $e->getMessage());
            }
        }

        // 2. Direct HTTP implementation via Laravel Http / Guzzle
        $url = "{$this->storeUrl}/wp-json/{$this->version}/" . ltrim($endpoint, '/');

        $http = Http::timeout($this->timeout);
        if (!$this->verifySsl) {
            $http = $http->withoutVerifying();
        }

        // WooCommerce supports Basic Auth over HTTPS, or query parameters on HTTP
        if (str_starts_with($this->storeUrl, 'https://')) {
            $http = $http->withBasicAuth($this->consumerKey, $this->consumerSecret);
            $queryParams = ($method === 'get') ? $data : [];
        } else {
            $authParams = [
                'consumer_key' => $this->consumerKey,
                'consumer_secret' => $this->consumerSecret
            ];
            $queryParams = ($method === 'get') ? array_merge($data, $authParams) : $authParams;
            $url .= (str_contains($url, '?') ? '&' : '?') . http_build_query($authParams);
        }

        if ($method === 'get') {
            $response = $http->get($url, $data);
        } elseif ($method === 'post') {
            $response = $http->post($url, $data);
        } else {
            $response = $http->send($method, $url, ['json' => $data]);
        }

        if (!$response->successful()) {
            Log::error("WooCommerce API error: [{$response->status()}] " . $response->body());
            throw new Exception("WooCommerce API request failed [{$response->status()}]: " . ($response->json('message') ?? $response->body()));
        }

        return $response->json() ?? [];
    }
}
