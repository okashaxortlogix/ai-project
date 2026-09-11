<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        api: __DIR__ . '/../routes/api.php',
        commands: __DIR__ . '/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        // Exclude cross-platform webhooks from CSRF token validation
        $middleware->validateCsrfTokens(except: [
            'api/v1/woocommerce/webhook',
            'api/v1/shopify/webhook',
            'api/v1/webhooks/*',
            'v1/woocommerce/webhook',
            'v1/shopify/webhook',
            'woocommerce/webhook',
            'shopify/webhook',
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })->create();
