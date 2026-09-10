<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('knowledge_chunks', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('organization_id')->constrained('organizations')->cascadeOnDelete();
            $table->foreignUuid('document_id')->constrained('knowledge_documents')->cascadeOnDelete();
            $table->integer('chunk_index');
            $table->mediumText('text');
            $table->string('vector_point_id')->nullable(); // reference in Qdrant
            $table->json('metadata_json')->nullable();
            $table->string('status')->default('ready'); // ready, pending, failed
            $table->timestamps();

            $table->index(['organization_id', 'document_id']);
            $table->index(['document_id', 'chunk_index']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('knowledge_chunks');
    }
};
