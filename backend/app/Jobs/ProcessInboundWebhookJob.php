<?php

namespace App\Jobs;

use App\Models\InboundWebhook;
use App\Services\Ecommerce\ShopifyService;
use App\Services\Ecommerce\WooCommerceService;
use App\Services\Audit\AuditLogger;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class ProcessInboundWebhookJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public string $webhookId;

    public function __construct(string $webhookId)
    {
        $this->webhookId = $webhookId;
    }

    public function handle(ShopifyService $shopifyService): void
    {
        $webhook = InboundWebhook::find($this->webhookId);
        if (!$webhook || $webhook->status === 'processed') {
            return;
        }

        Log::info("Processing Inbound Webhook: {$webhook->provider} (Event: {$webhook->event_id})");

        $payload = $webhook->payload_json ?? [];
        $provider = $webhook->provider;

        if ($provider === 'woocommerce' && (isset($payload['line_items']) || str_contains($webhook->event_type ?? '', 'order'))) {
            $lineItems = $payload['line_items'] ?? [];
            foreach ($lineItems as $item) {
                $sku = trim($item['sku'] ?? '');
                $quantity = (int) ($item['quantity'] ?? 1);
                if (!empty($sku)) {
                    $shopifyService->deductInventoryBySku($sku, $quantity);
                }
            }
        }

        $webhook->update([
            'status' => 'processed',
            'processed_at' => now()
        ]);
    }
}
