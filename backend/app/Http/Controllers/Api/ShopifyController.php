<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\Ecommerce\ShopifyService;
use App\Services\Ecommerce\WooCommerceService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use function response;
use function config;
use function env;
use Exception;

class ShopifyController extends Controller
{
    protected ShopifyService $shopifyService;
    protected WooCommerceService $wooService;

    public function __construct(ShopifyService $shopifyService, WooCommerceService $wooService)
    {
        $this->shopifyService = $shopifyService;
        $this->wooService = $wooService;
    }

    /**
     * Test connection and get Shopify status
     */
    public function status()
    {
        $result = $this->shopifyService->testConnection();
        return response()->json($result, $result['success'] ? 200 : 502);
    }

    /**
     * Fetch products from Shopify
     */
    public function getProducts(Request $request)
    {
        try {
            $params = $request->only(['limit', 'since_id', 'title', 'vendor', 'product_type', 'status']);
            $products = $this->shopifyService->getProducts($params);

            return response()->json([
                'success' => true,
                'count' => count($products),
                'data' => $products
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Fetch single product by ID
     */
    public function getProduct(int|string $id)
    {
        try {
            $product = $this->shopifyService->getProduct($id);
            return response()->json([
                'success' => true,
                'data' => $product
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 404);
        }
    }

    /**
     * Create product in Shopify
     */
    public function createProduct(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'price' => 'nullable|numeric',
            'description' => 'nullable|string',
            'body_html' => 'nullable|string',
            'vendor' => 'nullable|string',
            'product_type' => 'nullable|string',
            'inventory_quantity' => 'nullable|integer',
            'images' => 'nullable|array'
        ]);

        try {
            $product = $this->shopifyService->createProduct($validated);
            return response()->json([
                'success' => true,
                'message' => 'Product successfully created in Shopify',
                'data' => $product
            ], 201);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Fetch orders from Shopify
     */
    public function getOrders(Request $request)
    {
        try {
            $params = $request->only(['limit', 'status', 'financial_status', 'fulfillment_status']);
            $orders = $this->shopifyService->getOrders($params);

            return response()->json([
                'success' => true,
                'count' => count($orders),
                'data' => $orders
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Fetch single order by ID
     */
    public function getOrder(int|string $id)
    {
        try {
            $order = $this->shopifyService->getOrder($id);
            return response()->json([
                'success' => true,
                'data' => $order
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 404);
        }
    }

    /**
     * Create order in Shopify
     */
    public function createOrder(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|email',
            'line_items' => 'required|array',
            'line_items.*.variant_id' => 'nullable|integer',
            'line_items.*.quantity' => 'required|integer|min:1',
            'financial_status' => 'nullable|string',
            'fulfillment_status' => 'nullable|string',
            'billing_address' => 'nullable|array',
            'shipping_address' => 'nullable|array',
            'note' => 'nullable|string'
        ]);

        try {
            $order = $this->shopifyService->createOrder($validated);
            return response()->json([
                'success' => true,
                'message' => 'Order successfully created in Shopify',
                'data' => $order
            ], 201);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Handle incoming Shopify Webhook with HMAC SHA256 verification
     *
     * Validates X-Shopify-Hmac-Sha256 header against SHOPIFY_CLIENT_SECRET
     */
    public function handleWebhook(Request $request, ?string $organization = null)
    {
        $signature = $request->header('X-Shopify-Hmac-Sha256') ?? $request->header('x-shopify-hmac-sha256');

        if (empty($signature)) {
            Log::warning("Shopify Webhook: Missing X-Shopify-Hmac-Sha256 header.");
            return response()->json([
                'success' => false,
                'message' => 'Missing X-Shopify-Hmac-Sha256 header.'
            ], 401);
        }

        $rawPayload = $request->getContent();

        // Resolve organization context
        $targetOrgId = $organization 
            ?? $request->route('organization') 
            ?? $request->route('organization_id') 
            ?? $request->query('organization_id')
            ?? $request->header('X-Organization-Id');

        $resolvedOrgId = null;
        if ($targetOrgId) {
            $org = \App\Models\Organization::find($targetOrgId);
            if (!$org) {
                return response()->json([
                    'success' => false,
                    'message' => 'Organization not found for webhook target.'
                ], 404);
            }
            $resolvedOrgId = $org->id;
        } else {
            $resolvedOrgId = \App\Models\Organization::first()?->id;
        }

        $secret = config('ecommerce.shopify.client_secret', env('SHOPIFY_CLIENT_SECRET', ''));

        // Compute Shopify HMAC SHA256 base64 signature
        $expectedSignature = base64_encode(hash_hmac('sha256', $rawPayload, $secret, true));

        if (!hash_equals($expectedSignature, (string)$signature)) {
            Log::warning("Shopify Webhook: HMAC signature mismatch.", [
                'received' => $signature,
                'expected' => $expectedSignature
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Invalid Shopify HMAC webhook signature.'
            ], 401);
        }

        $topic = $request->header('X-Shopify-Topic') ?? 'orders/create';
        $payload = $request->json()->all();

        if (empty($payload)) {
            $payload = json_decode($rawPayload, true) ?? [];
        }

        Log::info("Shopify Webhook Authenticated successfully for Org [{$resolvedOrgId}]. Topic: {$topic}");

        $payloadHash = hash('sha256', $rawPayload);
        $orderId = $payload['id'] ?? null;

        $webhookRecord = \App\Models\InboundWebhook::firstOrCreate(
            [
                'provider' => 'shopify', 
                'payload_hash' => $payloadHash,
                'organization_id' => $resolvedOrgId
            ],
            [
                'id' => (string) \Illuminate\Support\Str::uuid(),
                'organization_id' => $resolvedOrgId,
                'event_id' => (string) $orderId,
                'event_type' => $topic,
                'payload_json' => $payload,
                'status' => 'pending'
            ]
        );

        // Auto-Deduct Logic: Listen for orders/create or payload with line_items
        if ($topic === 'orders/create' || isset($payload['line_items']) || str_contains($topic, 'order')) {
            $syncSummary = $this->handleShopifyOrderCreated($payload);
            $webhookRecord->update(['status' => 'processed', 'processed_at' => now()]);

            return response()->json([
                'success' => true,
                'message' => 'Shopify order webhook processed and reverse synced with WooCommerce.',
                'topic' => $topic,
                'sync_summary' => $syncSummary
            ], 200);
        }

        return response()->json([
            'success' => true,
            'message' => "Webhook received for topic '{$topic}'. No inventory action required.",
            'topic' => $topic
        ], 200);
    }

    /**
     * Auto-Deduct Logic: Shopify Order -> WooCommerce Inventory
     *
     * Extracts ordered line items (SKU and quantity) and calls WooCommerceService
     * to deduct or update matching inventory in WooCommerce.
     */
    public function handleShopifyOrderCreated(array $payload): array
    {
        $orderId = $payload['id'] ?? 'unknown';
        $orderName = $payload['name'] ?? (isset($payload['order_number']) ? '#' . $payload['order_number'] : $orderId);
        $lineItems = $payload['line_items'] ?? [];

        $synced = [];
        $warnings = [];

        Log::info("Processing Shopify Order {$orderName} (ID: {$orderId}) for cross-platform WooCommerce reverse sync.", [
            'total_line_items' => count($lineItems)
        ]);

        foreach ($lineItems as $item) {
            $sku = trim($item['sku'] ?? '');
            $quantity = (int)($item['quantity'] ?? 1);
            $itemName = $item['name'] ?? $item['title'] ?? 'Unnamed Product';

            if (empty($sku)) {
                $warningMsg = "Shopify Order {$orderName}: Line item '{$itemName}' (ID: " . ($item['id'] ?? 'N/A') . ") is missing a SKU. Cannot sync with WooCommerce.";
                Log::warning($warningMsg);
                $warnings[] = [
                    'item_name' => $itemName,
                    'message' => $warningMsg
                ];
                continue;
            }

            try {
                // Deduct inventory in WooCommerce for matching SKU
                $deductResult = $this->wooService->deductInventoryBySku($sku, $quantity);

                if (!empty($deductResult['success'])) {
                    Log::info("Cross-Platform Reverse Sync Success: Shopify Order {$orderName} -> Deducted {$quantity} unit(s) for SKU '{$sku}' on WooCommerce.", [
                        'order_id' => $orderId,
                        'sku' => $sku,
                        'quantity' => $quantity,
                        'sync_details' => $deductResult
                    ]);

                    $synced[] = [
                        'sku' => $sku,
                        'quantity' => $quantity,
                        'status' => 'synced',
                        'sync_details' => $deductResult
                    ];
                } else {
                    $warnMsg = "Cross-Platform Reverse Sync Warning: Shopify Order {$orderName} -> Failed to deduct inventory for SKU '{$sku}' on WooCommerce: " . ($deductResult['message'] ?? 'Not found');
                    Log::warning($warnMsg);
                    $warnings[] = [
                        'sku' => $sku,
                        'quantity' => $quantity,
                        'message' => $warnMsg
                    ];
                }
            } catch (Exception $e) {
                $errorMsg = "Cross-Platform Reverse Sync Error for SKU '{$sku}': " . $e->getMessage();
                Log::error($errorMsg);
                $warnings[] = [
                    'sku' => $sku,
                    'quantity' => $quantity,
                    'message' => $errorMsg
                ];
            }
        }

        return [
            'order_id' => $orderId,
            'order_name' => $orderName,
            'total_items' => count($lineItems),
            'synced_items' => count($synced),
            'warning_items' => count($warnings),
            'synced' => $synced,
            'warnings' => $warnings
        ];
    }
}
