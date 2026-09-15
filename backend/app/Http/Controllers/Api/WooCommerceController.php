<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\Ecommerce\WooCommerceService;
use App\Services\Ecommerce\ShopifyService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use function response;
use function config;
use function env;
use Exception;

class WooCommerceController extends Controller
{
    protected WooCommerceService $wooService;
    protected ShopifyService $shopifyService;

    public function __construct(WooCommerceService $wooService, ShopifyService $shopifyService)
    {
        $this->wooService = $wooService;
        $this->shopifyService = $shopifyService;
    }

    /**
     * Test connection and get WooCommerce status
     */
    public function status()
    {
        $result = $this->wooService->testConnection();
        return response()->json($result, $result['success'] ? 200 : 502);
    }

    /**
     * Fetch products from WooCommerce
     */
    public function getProducts(Request $request)
    {
        try {
            $params = $request->only(['per_page', 'page', 'search', 'category', 'status', 'order', 'orderby']);
            $products = $this->wooService->getProducts($params);

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
            $product = $this->wooService->getProduct((int)$id);
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
     * Create product in WooCommerce
     */
    public function createProduct(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'regular_price' => 'nullable|numeric',
            'price' => 'nullable|numeric',
            'description' => 'nullable|string',
            'short_description' => 'nullable|string',
            'categories' => 'nullable|array',
            'images' => 'nullable|array'
        ]);

        try {
            $product = $this->wooService->createProduct($validated);
            return response()->json([
                'success' => true,
                'message' => 'Product successfully created in WooCommerce',
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
     * Fetch orders from WooCommerce
     */
    public function getOrders(Request $request)
    {
        try {
            $params = $request->only(['per_page', 'page', 'status', 'customer', 'search']);
            $orders = $this->wooService->getOrders($params);

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
            $order = $this->wooService->getOrder((int)$id);
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
     * Create order in WooCommerce
     */
    public function createOrder(Request $request)
    {
        $validated = $request->validate([
            'payment_method' => 'nullable|string',
            'payment_method_title' => 'nullable|string',
            'set_paid' => 'nullable|boolean',
            'billing' => 'nullable|array',
            'shipping' => 'nullable|array',
            'line_items' => 'required|array',
            'line_items.*.product_id' => 'required|integer',
            'line_items.*.quantity' => 'required|integer|min:1'
        ]);

        try {
            $order = $this->wooService->createOrder($validated);
            return response()->json([
                'success' => true,
                'message' => 'Order successfully created in WooCommerce',
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
     * Handle incoming WooCommerce Webhook with HMAC SHA256 verification
     *
     * Validates X-WC-Webhook-Signature header against WOOCOMMERCE_WEBHOOK_SECRET
     */
    public function handleWebhook(Request $request, ?string $organization = null)
    {
        $signature = $request->header('X-WC-Webhook-Signature') ?? $request->header('x-wc-webhook-signature');

        if (empty($signature)) {
            Log::warning("WooCommerce Webhook: Missing X-WC-Webhook-Signature header.");
            return response()->json([
                'success' => false,
                'message' => 'Missing X-WC-Webhook-Signature header.'
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
        // Timestamp Freshness / Replay Attack Mitigation (MISSING-015)
        $timestamp = $request->header('X-WC-Webhook-Timestamp') ?? $request->header('X-Webhook-Timestamp');
        if ($timestamp) {
            $eventTime = is_numeric($timestamp) ? (int)$timestamp : strtotime($timestamp);
            if ($eventTime && abs(time() - $eventTime) > 300) {
                Log::warning("WooCommerce Webhook rejected: Stale timestamp detected ({$timestamp})");
                return response()->json([
                    'success' => false,
                    'message' => 'Webhook rejected: Timestamp expired (potential replay attack).'
                ], 401);
            }
        }

        $secret = config('ecommerce.woocommerce.webhook_secret', env('WOOCOMMERCE_WEBHOOK_SECRET', '2146'));

        // Compute HMAC SHA256 base64-encoded signature
        $expectedSignature = base64_encode(hash_hmac('sha256', $rawPayload, $secret, true));

        if (!hash_equals($expectedSignature, (string)$signature)) {
            Log::warning("WooCommerce Webhook: HMAC signature mismatch.", [
                'received' => $signature,
                'expected' => $expectedSignature
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Invalid HMAC webhook signature.'
            ], 401);
        }

        $topic = $request->header('X-WC-Webhook-Topic') ?? 'order.created';
        $payload = $request->json()->all();

        if (empty($payload)) {
            $payload = json_decode($rawPayload, true) ?? [];
        }

        Log::info("WooCommerce Webhook Authenticated successfully for Org [{$resolvedOrgId}]. Topic: {$topic}");

        $payloadHash = hash('sha256', $rawPayload);
        $orderId = $payload['id'] ?? ($payload['number'] ?? null);

        // Idempotency: Deduplicate identical webhook deliveries scoped to organization
        $existing = \App\Models\InboundWebhook::where('provider', 'woocommerce')
            ->where(function ($q) use ($resolvedOrgId) {
                if ($resolvedOrgId) {
                    $q->where('organization_id', $resolvedOrgId);
                }
            })
            ->where('payload_hash', $payloadHash)
            ->first();

        if ($existing && $existing->status === 'processed') {
            Log::info("WooCommerce Webhook: Duplicate event ignored for payload hash {$payloadHash}");
            return response()->json([
                'success' => true,
                'message' => 'Duplicate webhook already processed.',
                'topic' => $topic,
                'idempotent' => true
            ], 200);
        }

        $webhookRecord = \App\Models\InboundWebhook::firstOrCreate(
            [
                'provider' => 'woocommerce', 
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

        // If order payload, trigger cross-platform sync asynchronously
        if (isset($payload['line_items']) || str_contains($topic, 'order')) {
            \App\Jobs\ProcessInboundWebhookJob::dispatch($webhookRecord->id);

            // Also execute immediate sync summary for HTTP response
            $syncSummary = $this->handleWooCommerceOrderCreated($payload);
            $webhookRecord->update(['status' => 'processed', 'processed_at' => now()]);

            return response()->json([
                'success' => true,
                'message' => 'WooCommerce order webhook processed and cross-platform sync completed.',
                'topic' => $topic,
                'sync_summary' => $syncSummary,
                'idempotent' => false
            ], 200);
        }

        return response()->json([
            'success' => true,
            'message' => "Webhook received for topic '{$topic}'. No inventory action required.",
            'topic' => $topic
        ], 200);
    }

    /**
     * Auto-Sync Logic: WooCommerce Order -> Shopify Inventory
     *
     * Parses the order payload, extracts ordered line items (SKU and quantity),
     * and calls ShopifyService to deduct or update matching inventory on Shopify.
     */
    public function handleWooCommerceOrderCreated(array $payload): array
    {
        $orderId = $payload['id'] ?? 'unknown';
        $orderNumber = $payload['number'] ?? $orderId;
        $lineItems = $payload['line_items'] ?? [];

        $synced = [];
        $warnings = [];

        Log::info("Processing WooCommerce Order #{$orderNumber} (ID: {$orderId}) for cross-platform Shopify sync.", [
            'total_line_items' => count($lineItems)
        ]);

        foreach ($lineItems as $item) {
            $sku = trim($item['sku'] ?? '');
            $quantity = (int)($item['quantity'] ?? 1);
            $itemName = $item['name'] ?? 'Unnamed Product';

            if (empty($sku)) {
                $warningMsg = "WooCommerce Order #{$orderNumber}: Line item '{$itemName}' (ID: " . ($item['id'] ?? 'N/A') . ") is missing a SKU. Cannot sync with Shopify.";
                Log::warning($warningMsg);
                $warnings[] = [
                    'item_name' => $itemName,
                    'message' => $warningMsg
                ];
                continue;
            }

            try {
                // Call ShopifyService to deduct inventory for the matching SKU
                $deductResult = $this->shopifyService->deductInventoryBySku($sku, $quantity);

                if (!empty($deductResult['success'])) {
                    Log::info("Cross-Platform Sync Success: WooCommerce Order #{$orderNumber} -> Deducted {$quantity} unit(s) for SKU '{$sku}' on Shopify.", [
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
                    $warnMsg = "Cross-Platform Sync Warning: WooCommerce Order #{$orderNumber} -> Failed to deduct inventory for SKU '{$sku}' on Shopify: " . ($deductResult['message'] ?? 'Not found');
                    Log::warning($warnMsg);
                    $warnings[] = [
                        'sku' => $sku,
                        'quantity' => $quantity,
                        'message' => $warnMsg
                    ];
                }
            } catch (Exception $e) {
                $errorMsg = "Cross-Platform Sync Error for SKU '{$sku}': " . $e->getMessage();
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
            'order_number' => $orderNumber,
            'total_items' => count($lineItems),
            'synced_items' => count($synced),
            'warning_items' => count($warnings),
            'synced' => $synced,
            'warnings' => $warnings
        ];
    }
}
