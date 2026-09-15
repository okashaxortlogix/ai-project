<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('knowledge_chunks', function (Blueprint $table) {
            if (!Schema::hasColumn('knowledge_chunks', 'content')) {
                $table->mediumText('content')->nullable()->after('chunk_index');
            }
            if (!Schema::hasColumn('knowledge_chunks', 'embedding')) {
                $table->json('embedding')->nullable()->after('content');
            }
            if (!Schema::hasColumn('knowledge_chunks', 'metadata')) {
                $table->json('metadata')->nullable()->after('embedding');
            }
        });
    }

    public function down(): void
    {
        Schema::table('knowledge_chunks', function (Blueprint $table) {
            $table->dropColumn(['content', 'embedding', 'metadata']);
        });
    }
};
