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
use App\Http\Controllers\Api\ContactController;
use App\Http\Controllers\Api\CompanyController;
use App\Http\Controllers\Api\OpportunityController;
use App\Http\Controllers\Api\TaskController;
use App\Http\Controllers\Api\CustomObjectController;
use App\Http\Controllers\Api\WorkflowController;
use App\Http\Controllers\Api\AiChatController;
use App\Http\Controllers\Api\SearchController;
use App\Http\Controllers\Api\ActivityController;
use App\Http\Controllers\Api\CustomFieldController;
use App\Http\Controllers\Api\SmartListController;
use App\Http\Controllers\Api\TeamController;
use App\Http\Controllers\Api\ContactImportExportController;

/*
|--------------------------------------------------------------------------
| API Routes - AI Conversation & Sales Suite (v1)
|--------------------------------------------------------------------------
| Adheres strictly to docs/06_API_SPEC.md
*/

Route::prefix('v1')->group(function () {
    // Authentication
    Route::post('/auth/login', [AuthController::class, 'login']);
    Route::get('/auth/login', fn() => response()->json(['success' => false, 'message' => 'Unauthenticated.'], 401))->name('login');
    Route::post('/auth/register', [AuthController::class, 'register']);
    Route::post('/auth/logout', [AuthController::class, 'logout'])->middleware('auth:sanctum');
    Route::get('/auth/me', [AuthController::class, 'me'])->middleware('auth:sanctum');

    // Live AI Chat & Function Calling
    Route::post('/ai/chat', [AiChatController::class, 'chat']);
    Route::post('/team/accept-invite', [TeamController::class, 'acceptInvite']);

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
        Route::post('/organizations', [OrganizationController::class, 'store'])->middleware('role:Admin');
        Route::get('/organizations/{organization}', [OrganizationController::class, 'show']);
        Route::patch('/organizations/{organization}', [OrganizationController::class, 'update'])->middleware('role:Admin');
        Route::delete('/organizations/{organization}', [OrganizationController::class, 'destroy'])->middleware('role:Admin');

        // Team Management & Role Delegation
        Route::get('/team/members', [TeamController::class, 'members']);
        Route::post('/team/invite', [TeamController::class, 'invite'])->middleware('role:Admin,Manager');
        Route::delete('/team/invitations/{id}', [TeamController::class, 'revokeInvite'])->middleware('role:Admin,Manager');

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

        // Contacts (GHL First-Class Entity)
        Route::get('/contacts', [ContactController::class, 'index']);
        Route::post('/contacts', [ContactController::class, 'store']);
        Route::post('/contacts/import', [ContactImportExportController::class, 'import']);
        Route::get('/contacts/export', [ContactImportExportController::class, 'export']);
        Route::get('/contacts/duplicates', [ContactController::class, 'duplicates']);
        Route::post('/contacts/merge', [ContactController::class, 'merge']);
        Route::get('/contacts/{contact}', [ContactController::class, 'show']);
        Route::patch('/contacts/{contact}', [ContactController::class, 'update']);
        Route::delete('/contacts/{contact}', [ContactController::class, 'destroy']);

        // Leads aliases
        Route::get('/leads', [ContactController::class, 'index']);
        Route::post('/leads', [ContactController::class, 'store']);
        Route::get('/leads/{contact}', [ContactController::class, 'show']);
        Route::patch('/leads/{contact}', [ContactController::class, 'update']);
        Route::delete('/leads/{contact}', [ContactController::class, 'destroy']);

        // Smart Lists (GHL Dynamic Segmentation Engine)
        Route::get('/smart-lists', [SmartListController::class, 'index']);
        Route::post('/smart-lists', [SmartListController::class, 'store']);
        Route::get('/smart-lists/{smartList}', [SmartListController::class, 'show']);
        Route::patch('/smart-lists/{smartList}', [SmartListController::class, 'update']);
        Route::delete('/smart-lists/{smartList}', [SmartListController::class, 'destroy'])->middleware('role:Admin,Manager');

        // Companies
        Route::get('/companies', [CompanyController::class, 'index']);
        Route::post('/companies', [CompanyController::class, 'store']);
        Route::get('/companies/{company}', [CompanyController::class, 'show']);
        Route::patch('/companies/{company}', [CompanyController::class, 'update']);
        Route::delete('/companies/{company}', [CompanyController::class, 'destroy'])->middleware('role:Admin,Manager');
        Route::post('/companies/{company}/attach-contact', [CompanyController::class, 'attachContact']);

        // Pipelines & Opportunities
        Route::get('/pipelines', [OpportunityController::class, 'pipelines']);
        Route::post('/pipelines', [OpportunityController::class, 'storePipeline'])->middleware('role:Admin,Manager');
        Route::patch('/pipelines/{pipeline}', [OpportunityController::class, 'updatePipeline'])->middleware('role:Admin,Manager');
        Route::get('/opportunities', [OpportunityController::class, 'index']);
        Route::post('/opportunities', [OpportunityController::class, 'store']);
        Route::get('/opportunities/{opportunity}', [OpportunityController::class, 'show']);
        Route::patch('/opportunities/{opportunity}', [OpportunityController::class, 'update']);
        Route::delete('/opportunities/{opportunity}', [OpportunityController::class, 'destroy'])->middleware('role:Admin,Manager');

        // Tasks
        Route::get('/tasks', [TaskController::class, 'index']);
        Route::post('/tasks', [TaskController::class, 'store']);
        Route::get('/tasks/{task}', [TaskController::class, 'show']);
        Route::patch('/tasks/{task}', [TaskController::class, 'update']);
        Route::delete('/tasks/{task}', [TaskController::class, 'destroy'])->middleware('role:Admin,Manager');

        // CRM Activity Timeline & Notes
        Route::get('/timeline', [ActivityController::class, 'index']);
        Route::post('/timeline', [ActivityController::class, 'store']);

        // Custom Fields & Global Search
        Route::get('/custom-fields', [CustomFieldController::class, 'index']);
        Route::post('/custom-fields', [CustomFieldController::class, 'store']);
        Route::get('/search', [SearchController::class, 'search']);

        // Custom Objects Engine & Associations
        Route::get('/custom-objects', [CustomObjectController::class, 'index']);
        Route::post('/custom-objects', [CustomObjectController::class, 'store'])->middleware('role:Admin,Manager');
        Route::get('/custom-objects/{customObject}', [CustomObjectController::class, 'show']);
        Route::get('/custom-objects/{customObject}/records', [CustomObjectController::class, 'records']);
        Route::post('/custom-objects/{customObject}/records', [CustomObjectController::class, 'storeRecord']);
        Route::post('/associations', [CustomObjectController::class, 'associate'])->middleware('role:Admin,Manager');

        // Production Workflow Engine
        Route::get('/workflows', [WorkflowController::class, 'index']);
        Route::post('/workflows', [WorkflowController::class, 'store'])->middleware('role:Admin,Manager');
        Route::get('/workflows/{workflow}', [WorkflowController::class, 'show']);
        Route::patch('/workflows/{workflow}', [WorkflowController::class, 'update'])->middleware('role:Admin,Manager');
        Route::post('/workflows/{workflow}/toggle-publish', [WorkflowController::class, 'togglePublish'])->middleware('role:Admin,Manager');
        Route::post('/workflows/{workflow}/execute', [WorkflowController::class, 'execute']);
        Route::get('/workflows/{workflow}/executions', [WorkflowController::class, 'executions']);

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
        Route::post('/knowledge/documents', [KnowledgeController::class, 'store'])->middleware('role:Admin,Manager');
        Route::get('/knowledge/documents/{document}', [KnowledgeController::class, 'show']);
        Route::patch('/knowledge/documents/{document}', [KnowledgeController::class, 'update'])->middleware('role:Admin,Manager');
        Route::delete('/knowledge/documents/{document}', [KnowledgeController::class, 'destroy'])->middleware('role:Admin,Manager');
        Route::post('/knowledge/documents/{document}/reindex', [KnowledgeController::class, 'reindex'])->middleware('role:Admin,Manager');
        Route::post('/knowledge/query', [KnowledgeController::class, 'semanticQuery']);

        // Agents
        Route::get('/agents', [AgentController::class, 'index']);
        Route::get('/agents/{agent}', [AgentController::class, 'show']);
        Route::patch('/agents/{agent}', [AgentController::class, 'update'])->middleware('role:Admin,Manager');

        // Integrations
        Route::get('/integrations', [IntegrationController::class, 'index']);
        Route::post('/integrations/{provider}/connect', [IntegrationController::class, 'connect'])->middleware('role:Admin');
        Route::delete('/integrations/{integration}', [IntegrationController::class, 'disconnect'])->middleware('role:Admin');
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

    // Public Dedicated Webhooks & Callback Endpoints
    Route::post('/woocommerce/webhook', [WooCommerceController::class, 'handleWebhook']);
    Route::post('/webhooks/{organization}/woocommerce', [WooCommerceController::class, 'handleWebhook']);
    Route::post('/shopify/webhook', [ShopifyController::class, 'handleWebhook']);
    Route::post('/webhooks/{organization}/shopify', [ShopifyController::class, 'handleWebhook']);
    Route::post('/webhooks/{provider}', [WebhookController::class, 'handle']);
});
