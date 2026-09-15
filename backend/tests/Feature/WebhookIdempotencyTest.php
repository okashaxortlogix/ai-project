<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\Organization;
use App\Models\InboundWebhook;
use Illuminate\Foundation\Testing\RefreshDatabase;

class WebhookIdempotencyTest extends TestCase
{
    use RefreshDatabase;

    public function test_webhook_idempotency_prevents_duplicate_processing()
    {
        $org = Organization::create([
            'name' => 'Webhook Test Org',
            'slug' => 'webhook-test-org',
            'settings' => ['timezone' => 'UTC']
        ]);

        $payload = [
            'id' => 9999,
            'status' => 'completed',
            'total' => '250.00',
            'currency' => 'USD',
            'customer_id' => 101,
            'line_items' => [
                [
                    'id' => 1,
                    'name' => 'Premium Coaching Course',
                    'sku' => 'COURSE-101',
                    'quantity' => 1,
                    'price' => '250.00'
                ]
            ],
            'billing' => [
                'first_name' => 'Jane',
                'last_name' => 'Doe',
                'email' => 'jane.doe@webhooktest.com'
            ]
        ];

        $payloadJson = json_encode($payload);
        $secret = '2146';
        $signature = base64_encode(hash_hmac('sha256', $payloadJson, $secret, true));

        // First delivery: should be received and processed
        $response1 = $this->withHeaders([
            'x-wc-webhook-signature' => $signature,
            'x-wc-webhook-topic' => 'order.created',
            'x-wc-webhook-source' => 'https://teststore.local',
            'Content-Type' => 'application/json'
        ])->postJson('/api/v1/woocommerce/webhook', $payload);

        $response1->assertStatus(200);
        $this->assertFalse($response1->json('idempotent'));
        $this->assertDatabaseHas('inbound_webhooks', [
            'provider' => 'woocommerce',
            'event_type' => 'order.created',
            'status' => 'processed'
        ]);

        // Second delivery of exact same payload: should be detected as duplicate
        $response2 = $this->withHeaders([
            'x-wc-webhook-signature' => $signature,
            'x-wc-webhook-topic' => 'order.created',
            'x-wc-webhook-source' => 'https://teststore.local',
            'Content-Type' => 'application/json'
        ])->postJson('/api/v1/woocommerce/webhook', $payload);

        $response2->assertStatus(200);
        $this->assertTrue($response2->json('idempotent'));
        $this->assertStringContainsString('Duplicate webhook already processed', $response2->json('message'));

        // Verify only 1 webhook record was created in the database
        $this->assertEquals(1, InboundWebhook::where('provider', 'woocommerce')->count());
    }
}
