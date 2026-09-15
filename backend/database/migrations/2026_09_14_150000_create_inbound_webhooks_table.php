<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('inbound_webhooks', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('provider'); // woocommerce, shopify, stripe, google, etc.
            $table->string('event_id')->nullable(); // External event or order ID
            $table->string('event_type')->nullable(); // order.created, etc.
            $table->string('payload_hash', 64)->index(); // SHA256 of raw payload for idempotency
            $table->json('payload_json')->nullable();
            $table->string('status')->default('pending'); // pending, processed, duplicate, failed
            $table->timestamp('processed_at')->nullable();
            $table->timestamps();

            $table->unique(['provider', 'payload_hash']);
            $table->index(['provider', 'event_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inbound_webhooks');
    }
};
