<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tool_executions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('organization_id')->constrained('organizations')->cascadeOnDelete();
            $table->foreignUuid('conversation_id')->nullable()->constrained('conversations')->nullOnDelete();
            $table->foreignUuid('agent_id')->nullable()->constrained('agents')->nullOnDelete();
            $table->string('tool_name'); // search_knowledge, get_order_status, create_lead, etc.
            $table->json('input_json');
            $table->json('output_json')->nullable();
            $table->string('status')->default('success'); // success, failed, rate_limited
            $table->string('error_code')->nullable();
            $table->integer('latency_ms')->default(0);
            $table->timestamps();

            $table->index(['organization_id', 'tool_name', 'status']);
            $table->index(['conversation_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tool_executions');
    }
};
