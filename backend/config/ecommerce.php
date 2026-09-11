<?php

return [
    /*
    |--------------------------------------------------------------------------
    | WooCommerce Integration Configuration
    |--------------------------------------------------------------------------
    */
    'woocommerce' => [
        'store_url' => env('WOOCOMMERCE_STORE_URL', 'http://smilekashii.local'),
        'consumer_key' => env('WOOCOMMERCE_CONSUMER_KEY', ''),
        'consumer_secret' => env('WOOCOMMERCE_CONSUMER_SECRET', ''),
        'version' => env('WOOCOMMERCE_API_VERSION', 'wc/v3'),
        'verify_ssl' => env('WOOCOMMERCE_VERIFY_SSL', false),
        'timeout' => 15,
    ],

    /*
    |--------------------------------------------------------------------------
    | Shopify Integration Configuration
    |--------------------------------------------------------------------------
    */
    'shopify' => [
        'store_domain' => env('SHOPIFY_STORE_DOMAIN', 'z67p7e-ux.myshopify.com'),
        'client_id' => env('SHOPIFY_CLIENT_ID', ''),
        'client_secret' => env('SHOPIFY_CLIENT_SECRET', ''),
        'api_version' => env('SHOPIFY_API_VERSION', '2024-01'),
        'timeout' => 15,
    ],
];
