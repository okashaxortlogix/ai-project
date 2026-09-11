<?php

namespace App\Http\Middleware;

use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken as Middleware;

class VerifyCsrfToken extends Middleware
{
    /**
     * The URIs that should be excluded from CSRF verification.
     *
     * @var array<int, string>
     */
    protected array $except = [
        'api/v1/woocommerce/webhook',
        'api/v1/shopify/webhook',
        'api/v1/webhooks/*',
        'v1/woocommerce/webhook',
        'v1/shopify/webhook',
        'woocommerce/webhook',
        'shopify/webhook',
    ];
}
