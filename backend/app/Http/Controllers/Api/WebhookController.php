<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class WebhookController extends Controller
{
    public function handle(Request $request, string $provider)
    {
        Log::info("Received inbound webhook from {$provider}", [
            'headers' => $request->headers->all(),
            'payload' => $request->all()
        ]);

        switch ($provider) {
            case 'shopify':
                // Handle orders/create or fulfillments/update
                return response()->json(['success' => true, 'status' => 'processed_shopify_webhook']);

            case 'google':
                // Handle calendar event notifications
                return response()->json(['success' => true, 'status' => 'processed_google_webhook']);

            case 'hubspot':
                // Handle contact lifecycle updates
                return response()->json(['success' => true, 'status' => 'processed_hubspot_webhook']);

            case 'whatsapp':
                // Handle incoming WhatsApp Cloud API message
                return response()->json(['success' => true, 'status' => 'processed_whatsapp_webhook']);

            default:
                return response()->json(['success' => true, 'status' => 'acknowledged']);
        }
    }
}
