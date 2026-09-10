<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('integrations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('organization_id')->constrained('organizations')->cascadeOnDelete();
            $table->string('provider'); // google_calendar, shopify, woocommerce, hubspot, whatsapp, twilio, outlook
            $table->string('type'); // calendar, crm, ecommerce, messaging
            $table->string('external_account_id')->nullable();
            $table->string('status')->default('available'); // connected, available, error, disconnected
            $table->json('scopes_json')->nullable();
            $table->json('configuration_json')->nullable();
            $table->timestamps();

            $table->unique(['organization_id', 'provider']);
            $table->index(['organization_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('integrations');
    }
};
