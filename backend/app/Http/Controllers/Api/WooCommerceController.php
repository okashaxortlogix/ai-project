<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\Ecommerce\WooCommerceService;
use Illuminate\Http\Request;
use Exception;

class WooCommerceController extends Controller
{
    protected WooCommerceService $wooService;

    public function __construct(WooCommerceService $wooService)
    {
        $this->wooService = $wooService;
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
    public function getProduct($id)
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
    public function getOrder($id)
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
}
