<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('agents', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('organization_id')->constrained('organizations')->cascadeOnDelete();
            $table->string('type'); // support, sales, appointment, custom
            $table->string('name');
            $table->text('description')->nullable();
            $table->boolean('enabled')->default(true);
            $table->text('system_prompt');
            $table->json('configuration_json')->nullable(); // tone, model, temperature, allowed_tools
            $table->json('escalation_rules_json')->nullable();
            $table->timestamps();

            $table->index(['organization_id', 'type', 'enabled']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('agents');
    }
};
