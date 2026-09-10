<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('conversations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('organization_id')->constrained('organizations')->cascadeOnDelete();
            $table->foreignUuid('customer_id')->constrained('customers')->cascadeOnDelete();
            $table->string('channel')->default('web_chat'); // web_chat, whatsapp, email, sms
            $table->string('status')->default('active'); // new, active, waiting_for_customer, waiting_for_human, resolved, archived
            $table->foreignUuid('assigned_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignUuid('active_agent_id')->nullable()->constrained('agents')->nullOnDelete();
            $table->string('external_thread_id')->nullable();
            $table->json('metadata_json')->nullable();
            $table->timestamp('started_at')->useCurrent();
            $table->timestamp('last_message_at')->useCurrent();
            $table->timestamp('resolved_at')->nullable();
            $table->timestamps();

            $table->index(['organization_id', 'status', 'last_message_at']);
            $table->index(['customer_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('conversations');
    }
};
