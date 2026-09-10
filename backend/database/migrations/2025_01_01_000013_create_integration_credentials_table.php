<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('integration_credentials', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('integration_id')->constrained('integrations')->cascadeOnDelete();
            $table->text('encrypted_access_token');
            $table->text('encrypted_refresh_token')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->json('metadata_json')->nullable();
            $table->timestamps();

            $table->index('integration_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('integration_credentials');
    }
};
