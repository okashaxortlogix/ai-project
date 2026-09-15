<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response()->json([
        'status' => 'healthy',
        'service' => 'AI Conversation & Sales Suite Backend API',
        'version' => '1.0.0',
        'database' => config('database.default'),
        'timestamp' => now()->toISOString(),
    ]);
});
