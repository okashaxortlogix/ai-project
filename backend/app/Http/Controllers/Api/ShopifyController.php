<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\Ecommerce\ShopifyService;
use Illuminate\Http\Request;
use Exception;

class ShopifyController extends Controller
{
    protected ShopifyService $shopifyService;

    public function __construct(ShopifyService $shopifyService)
    {
        $this->shopifyService = $shopifyService;
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
    public function getProduct($id)
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
    public function getOrder($id)
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
}
