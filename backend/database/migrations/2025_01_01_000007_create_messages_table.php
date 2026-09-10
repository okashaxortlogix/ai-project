<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('messages', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('organization_id')->constrained('organizations')->cascadeOnDelete();
            $table->foreignUuid('conversation_id')->constrained('conversations')->cascadeOnDelete();
            $table->string('sender_type'); // customer, agent, human, system
            $table->uuid('sender_id')->nullable();
            $table->text('content');
            $table->string('content_type')->default('text'); // text, image, file, product_card, order_status, appointment_picker
            $table->json('metadata_json')->nullable();
            $table->string('model')->nullable();
            $table->integer('input_tokens')->nullable();
            $table->integer('output_tokens')->nullable();
            $table->integer('latency_ms')->nullable();
            $table->string('status')->default('completed'); // pending, processing, completed, failed
            $table->timestamps();

            $table->index(['conversation_id', 'created_at']);
            $table->index(['organization_id', 'sender_type', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('messages');
    }
};
