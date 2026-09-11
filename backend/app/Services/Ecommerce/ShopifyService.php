<?php

namespace App\Services\Ecommerce;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use function config;
use function env;
use Exception;

class ShopifyService
{
    protected string $storeDomain;
    protected string $clientId;
    protected string $clientSecret;
    protected string $apiVersion;
    protected int $timeout;

    public function __construct(?array $config = null)
    {
        $this->storeDomain = rtrim($config['store_domain'] ?? config('ecommerce.shopify.store_domain', env('SHOPIFY_STORE_DOMAIN', 'z67p7e-ux.myshopify.com')), '/');
        $this->clientId = $config['client_id'] ?? config('ecommerce.shopify.client_id', env('SHOPIFY_CLIENT_ID', ''));
        $this->clientSecret = $config['client_secret'] ?? config('ecommerce.shopify.client_secret', env('SHOPIFY_CLIENT_SECRET', ''));
        $this->apiVersion = $config['api_version'] ?? config('ecommerce.shopify.api_version', env('SHOPIFY_API_VERSION', '2024-01'));
        $this->timeout = (int)($config['timeout'] ?? config('ecommerce.shopify.timeout', 15));
    }

    /**
     * Test connection to Shopify Admin API
     */
    public function testConnection(): array
    {
        try {
            $shop = $this->sendRequest('get', 'shop.json');

            return [
                'success' => true,
                'message' => 'Successfully connected to Shopify Admin API',
                'store' => $shop['shop']['name'] ?? $this->storeDomain,
                'domain' => $this->storeDomain,
                'data' => $shop
            ];
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => 'Shopify connection error: ' . $e->getMessage(),
                'domain' => $this->storeDomain
            ];
        }
    }

    /**
     * Get products list
     */
    public function getProducts(array $params = []): array
    {
        $res = $this->sendRequest('get', 'products.json', $params);
        return $res['products'] ?? $res;
    }

    /**
     * Get single product by ID
     */
    public function getProduct(int|string $id): array
    {
        $res = $this->sendRequest('get', "products/{$id}.json");
        return $res['product'] ?? $res;
    }

    /**
     * Create a new product in Shopify
     */
    public function createProduct(array $data): array
    {
        $payload = [
            'product' => [
                'title' => $data['title'] ?? $data['name'],
                'body_html' => $data['description'] ?? $data['body_html'] ?? '',
                'vendor' => $data['vendor'] ?? 'AI Suite Store',
                'product_type' => $data['product_type'] ?? 'General',
                'status' => $data['status'] ?? 'active',
                'variants' => $data['variants'] ?? [
                    [
                        'price' => (string)($data['price'] ?? '0.00'),
                        'sku' => $data['sku'] ?? 'SKU-' . time(),
                        'inventory_management' => 'shopify',
                        'inventory_quantity' => (int)($data['inventory_quantity'] ?? 10)
                    ]
                ],
                'images' => isset($data['images']) ? array_map(function($img) {
                    return is_string($img) ? ['src' => $img] : $img;
                }, (array)$data['images']) : []
            ]
        ];

        $res = $this->sendRequest('post', 'products.json', $payload);
        return $res['product'] ?? $res;
    }

    /**
     * Get orders list
     */
    public function getOrders(array $params = []): array
    {
        $res = $this->sendRequest('get', 'orders.json', $params);
        return $res['orders'] ?? $res;
    }

    /**
     * Get single order by ID
     */
    public function getOrder(int|string $id): array
    {
        $res = $this->sendRequest('get', "orders/{$id}.json");
        return $res['order'] ?? $res;
    }

    /**
     * Create a new order in Shopify
     */
    public function createOrder(array $data): array
    {
        $payload = [
            'order' => [
                'email' => $data['email'] ?? 'customer@example.com',
                'fulfillment_status' => $data['fulfillment_status'] ?? null,
                'financial_status' => $data['financial_status'] ?? 'paid',
                'line_items' => $data['line_items'] ?? [],
                'customer' => $data['customer'] ?? null,
                'billing_address' => $data['billing_address'] ?? null,
                'shipping_address' => $data['shipping_address'] ?? null,
                'note' => $data['note'] ?? 'Created by AI Sales Suite'
            ]
        ];

        $res = $this->sendRequest('post', 'orders.json', $payload);
        return $res['order'] ?? $res;
    }

    /**
     * Find a variant across Shopify products by SKU
     */
    public function findVariantBySku(string $sku): ?array
    {
        try {
            $products = $this->getProducts(['limit' => 50]);
            foreach ($products as $product) {
                if (!empty($product['variants'])) {
                    foreach ($product['variants'] as $variant) {
                        if (isset($variant['sku']) && strcasecmp(trim($variant['sku']), trim($sku)) === 0) {
                            $variant['product_title'] = $product['title'] ?? '';
                            return $variant;
                        }
                    }
                }
            }
        } catch (Exception $e) {
            Log::error("ShopifyService::findVariantBySku failed for SKU {$sku}: " . $e->getMessage());
        }

        return null;
    }

    /**
     * Fetch primary/active store location ID
     */
    public function getPrimaryLocationId(): ?int
    {
        try {
            $locations = $this->sendRequest('get', 'locations.json');
            if (!empty($locations['locations'][0]['id'])) {
                return (int)$locations['locations'][0]['id'];
            }
        } catch (Exception $e) {
            Log::warning("Could not fetch Shopify locations: " . $e->getMessage());
        }
        return null;
    }

    /**
     * Adjust inventory level for an inventory item
     */
    public function adjustInventory(int|string $inventoryItemId, int $adjustment, ?int $locationId = null): array
    {
        $locId = $locationId ?? $this->getPrimaryLocationId();
        if (!$locId) {
            throw new Exception("No active Shopify location available for inventory adjustment.");
        }

        $payload = [
            'location_id' => $locId,
            'inventory_item_id' => (int)$inventoryItemId,
            'available_adjustment' => $adjustment
        ];

        return $this->sendRequest('post', 'inventory_levels/adjust.json', $payload);
    }

    /**
     * Deduct inventory by SKU (e.g. triggered by WooCommerce order)
     */
    public function deductInventoryBySku(string $sku, int $quantity = 1): array
    {
        $variant = $this->findVariantBySku($sku);
        if (!$variant) {
            return [
                'success' => false,
                'sku' => $sku,
                'message' => "SKU '{$sku}' not found in Shopify product catalog."
            ];
        }

        $variantId = $variant['id'];
        $inventoryItemId = $variant['inventory_item_id'] ?? null;
        $currentStock = $variant['inventory_quantity'] ?? 0;
        $newStock = max(0, $currentStock - $quantity);

        // Try adjusting via inventory_levels API first if inventory_item_id exists
        if ($inventoryItemId) {
            try {
                $adjustResult = $this->adjustInventory($inventoryItemId, -$quantity);
                return [
                    'success' => true,
                    'sku' => $sku,
                    'variant_id' => $variantId,
                    'inventory_item_id' => $inventoryItemId,
                    'deducted' => $quantity,
                    'new_available' => $adjustResult['inventory_level']['available'] ?? null,
                    'method' => 'inventory_levels_adjust'
                ];
            } catch (Exception $e) {
                Log::info("inventory_levels adjust failed, falling back to direct variant quantity update: " . $e->getMessage());
            }
        }

        // Fallback: update variant inventory_quantity directly
        try {
            $this->sendRequest('put', "variants/{$variantId}.json", [
                'variant' => [
                    'id' => $variantId,
                    'inventory_quantity' => $newStock
                ]
            ]);

            return [
                'success' => true,
                'sku' => $sku,
                'variant_id' => $variantId,
                'deducted' => $quantity,
                'previous_stock' => $currentStock,
                'new_stock' => $newStock,
                'method' => 'variant_update'
            ];
        } catch (Exception $e) {
            return [
                'success' => false,
                'sku' => $sku,
                'variant_id' => $variantId,
                'message' => "Failed to update Shopify inventory for SKU '{$sku}': " . $e->getMessage()
            ];
        }
    }

    /**
     * Send HTTP request to Shopify REST Admin API
     */
    protected function sendRequest(string $method, string $endpoint, array $data = []): array
    {
        $baseUrl = "https://{$this->storeDomain}/admin/api/{$this->apiVersion}/" . ltrim($endpoint, '/');

        // Support both X-Shopify-Access-Token and Basic Auth
        $http = Http::timeout($this->timeout)
            ->withHeaders([
                'Content-Type' => 'application/json',
                'Accept' => 'application/json',
                'X-Shopify-Access-Token' => $this->clientSecret,
            ]);

        if ($method === 'get') {
            $response = $http->get($baseUrl, $data);
        } elseif ($method === 'post') {
            $response = $http->post($baseUrl, $data);
        } elseif ($method === 'put') {
            $response = $http->put($baseUrl, $data);
        } elseif ($method === 'delete') {
            $response = $http->delete($baseUrl, $data);
        } else {
            $response = $http->send($method, $baseUrl, ['json' => $data]);
        }

        // If Access Token header failed, retry with Basic Auth (client_id:client_secret)
        if ($response->status() === 401 && !empty($this->clientId)) {
            Log::info("Retrying Shopify request with basic auth credentials");
            $retryHttp = Http::timeout($this->timeout)
                ->withBasicAuth($this->clientId, $this->clientSecret)
                ->withHeaders([
                    'Content-Type' => 'application/json',
                    'Accept' => 'application/json',
                ]);

            $response = ($method === 'get') 
                ? $retryHttp->get($baseUrl, $data) 
                : $retryHttp->send($method, $baseUrl, ['json' => $data]);
        }

        if (!$response->successful()) {
            Log::error("Shopify API Error: [{$response->status()}] " . $response->body());
            throw new Exception("Shopify API error [{$response->status()}]: " . ($response->json('errors') ? json_encode($response->json('errors')) : $response->body()));
        }

        return $response->json() ?? [];
    }
}
