<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\OrganizationController;
use App\Http\Controllers\Api\ConversationController;
use App\Http\Controllers\Api\CustomerController;
use App\Http\Controllers\Api\LeadController;
use App\Http\Controllers\Api\AppointmentController;
use App\Http\Controllers\Api\KnowledgeController;
use App\Http\Controllers\Api\AgentController;
use App\Http\Controllers\Api\IntegrationController;
use App\Http\Controllers\Api\AnalyticsController;
use App\Http\Controllers\Api\WebhookController;
use App\Http\Controllers\Api\WooCommerceController;
use App\Http\Controllers\Api\ShopifyController;

/*
|--------------------------------------------------------------------------
| API Routes - AI Conversation & Sales Suite (v1)
|--------------------------------------------------------------------------
| Adheres strictly to docs/06_API_SPEC.md
*/

Route::prefix('v1')->group(function () {
    // Authentication
    Route::post('/auth/login', [AuthController::class, 'login']);
    Route::post('/auth/register', [AuthController::class, 'register']);
    Route::post('/auth/logout', [AuthController::class, 'logout'])->middleware('auth:sanctum');
    Route::get('/auth/me', [AuthController::class, 'me'])->middleware('auth:sanctum');

    // Public Widget API
    Route::prefix('widget')->group(function () {
        Route::get('/config/{orgSlug}', [ConversationController::class, 'getWidgetConfig']);
        Route::post('/conversation/start', [ConversationController::class, 'startWidgetConversation']);
        Route::post('/conversation/{conversation}/message', [ConversationController::class, 'sendWidgetMessage']);
    });

    // Authenticated API (Tenant Scoped)
    Route::middleware(['auth:sanctum'])->group(function () {
        // Organizations
        Route::get('/organizations', [OrganizationController::class, 'index']);
        Route::get('/organizations/{organization}', [OrganizationController::class, 'show']);
        Route::patch('/organizations/{organization}', [OrganizationController::class, 'update']);

        // Conversations
        Route::get('/conversations', [ConversationController::class, 'index']);
        Route::post('/conversations', [ConversationController::class, 'store']);
        Route::get('/conversations/{conversation}', [ConversationController::class, 'show']);
        Route::get('/conversations/{conversation}/messages', [ConversationController::class, 'messages']);
        Route::post('/conversations/{conversation}/messages', [ConversationController::class, 'sendMessage']);
        Route::post('/conversations/{conversation}/handoff', [ConversationController::class, 'handoff']);
        Route::post('/conversations/{conversation}/resolve', [ConversationController::class, 'resolve']);

        // Customers
        Route::get('/customers', [CustomerController::class, 'index']);
        Route::post('/customers', [CustomerController::class, 'store']);
        Route::get('/customers/{customer}', [CustomerController::class, 'show']);
        Route::patch('/customers/{customer}', [CustomerController::class, 'update']);

        // Leads
        Route::get('/leads', [LeadController::class, 'index']);
        Route::post('/leads', [LeadController::class, 'store']);
        Route::get('/leads/{lead}', [LeadController::class, 'show']);
        Route::patch('/leads/{lead}', [LeadController::class, 'update']);

        // Appointments
        Route::get('/appointments', [AppointmentController::class, 'index']);
        Route::get('/appointments/availability', [AppointmentController::class, 'availability']);
        Route::post('/appointments', [AppointmentController::class, 'store']);
        Route::patch('/appointments/{appointment}', [AppointmentController::class, 'update']);
        Route::post('/appointments/{appointment}/cancel', [AppointmentController::class, 'cancel']);

        // Knowledge Base & RAG
        Route::get('/knowledge/documents', [KnowledgeController::class, 'index']);
        Route::post('/knowledge/documents', [KnowledgeController::class, 'store']);
        Route::get('/knowledge/documents/{document}', [KnowledgeController::class, 'show']);
        Route::delete('/knowledge/documents/{document}', [KnowledgeController::class, 'destroy']);
        Route::post('/knowledge/documents/{document}/reindex', [KnowledgeController::class, 'reindex']);
        Route::post('/knowledge/query', [KnowledgeController::class, 'semanticQuery']);

        // Agents
        Route::get('/agents', [AgentController::class, 'index']);
        Route::get('/agents/{agent}', [AgentController::class, 'show']);
        Route::patch('/agents/{agent}', [AgentController::class, 'update']);

        // Integrations
        Route::get('/integrations', [IntegrationController::class, 'index']);
        Route::post('/integrations/{provider}/connect', [IntegrationController::class, 'connect']);
        Route::delete('/integrations/{integration}', [IntegrationController::class, 'disconnect']);
        Route::get('/integrations/{integration}/status', [IntegrationController::class, 'status']);

        // Analytics & Usage
        Route::get('/analytics/overview', [AnalyticsController::class, 'overview']);
        Route::get('/analytics/conversations', [AnalyticsController::class, 'conversations']);
        Route::get('/analytics/leads', [AnalyticsController::class, 'leads']);
        Route::get('/analytics/appointments', [AnalyticsController::class, 'appointments']);
        Route::get('/usage', [AnalyticsController::class, 'usage']);

        // WooCommerce E-Commerce Endpoints
        Route::prefix('woocommerce')->group(function () {
            Route::get('/status', [WooCommerceController::class, 'status']);
            Route::get('/products', [WooCommerceController::class, 'getProducts']);
            Route::post('/products', [WooCommerceController::class, 'createProduct']);
            Route::get('/products/{id}', [WooCommerceController::class, 'getProduct']);
            Route::get('/orders', [WooCommerceController::class, 'getOrders']);
            Route::post('/orders', [WooCommerceController::class, 'createOrder']);
            Route::get('/orders/{id}', [WooCommerceController::class, 'getOrder']);
        });

        // Shopify E-Commerce Endpoints
        Route::prefix('shopify')->group(function () {
            Route::get('/status', [ShopifyController::class, 'status']);
            Route::get('/products', [ShopifyController::class, 'getProducts']);
            Route::post('/products', [ShopifyController::class, 'createProduct']);
            Route::get('/products/{id}', [ShopifyController::class, 'getProduct']);
            Route::get('/orders', [ShopifyController::class, 'getOrders']);
            Route::post('/orders', [ShopifyController::class, 'createOrder']);
            Route::get('/orders/{id}', [ShopifyController::class, 'getOrder']);
        });
    });

    // Public / Direct Test E-Commerce Endpoints
    Route::prefix('woocommerce')->group(function () {
        Route::get('/status', [WooCommerceController::class, 'status']);
        Route::get('/products', [WooCommerceController::class, 'getProducts']);
        Route::post('/products', [WooCommerceController::class, 'createProduct']);
        Route::get('/products/{id}', [WooCommerceController::class, 'getProduct']);
        Route::get('/orders', [WooCommerceController::class, 'getOrders']);
        Route::post('/orders', [WooCommerceController::class, 'createOrder']);
        Route::get('/orders/{id}', [WooCommerceController::class, 'getOrder']);
        Route::post('/webhook', [WooCommerceController::class, 'handleWebhook']);
    });

    Route::prefix('shopify')->group(function () {
        Route::get('/status', [ShopifyController::class, 'status']);
        Route::get('/products', [ShopifyController::class, 'getProducts']);
        Route::post('/products', [ShopifyController::class, 'createProduct']);
        Route::get('/products/{id}', [ShopifyController::class, 'getProduct']);
        Route::get('/orders', [ShopifyController::class, 'getOrders']);
        Route::post('/orders', [ShopifyController::class, 'createOrder']);
        Route::get('/orders/{id}', [ShopifyController::class, 'getOrder']);
        Route::post('/webhook', [ShopifyController::class, 'handleWebhook']);
    });

    // Webhooks
    Route::post('/webhooks/{provider}', [WebhookController::class, 'handle']);
});
