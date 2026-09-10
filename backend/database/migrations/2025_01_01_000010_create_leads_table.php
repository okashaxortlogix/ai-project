<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('leads', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('organization_id')->constrained('organizations')->cascadeOnDelete();
            $table->foreignUuid('customer_id')->constrained('customers')->cascadeOnDelete();
            $table->foreignUuid('owner_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('stage')->default('New'); // New, Contacted, Qualified, Hot, Won, Lost
            $table->string('source')->default('Website'); // Website, Facebook, Google Ads, Referral, Other
            $table->integer('score')->default(50); // 0 - 100 lead quality score
            $table->json('qualification_json')->nullable();
            $table->text('notes')->nullable();
            $table->json('external_ids_json')->nullable();
            $table->timestamps();

            $table->index(['organization_id', 'stage', 'created_at']);
            $table->index(['organization_id', 'score']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('leads');
    }
};
