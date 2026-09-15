<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Align messages table
        if (Schema::hasTable('messages')) {
            Schema::table('messages', function (Blueprint $table) {
                if (!Schema::hasColumn('messages', 'sender')) {
                    $table->string('sender')->nullable()->after('sender_type');
                }
                if (!Schema::hasColumn('messages', 'agent_type')) {
                    $table->string('agent_type')->nullable()->after('sender');
                }
                if (!Schema::hasColumn('messages', 'timestamp')) {
                    $table->string('timestamp')->nullable()->after('content');
                }
                if (!Schema::hasColumn('messages', 'metadata')) {
                    $table->json('metadata')->nullable()->after('metadata_json');
                }
            });
        }

        // 2. Align leads table
        if (Schema::hasTable('leads')) {
            Schema::table('leads', function (Blueprint $table) {
                if (!Schema::hasColumn('leads', 'name')) {
                    $table->string('name')->nullable()->after('customer_id');
                }
                if (!Schema::hasColumn('leads', 'email')) {
                    $table->string('email')->nullable()->after('name');
                }
                if (!Schema::hasColumn('leads', 'phone')) {
                    $table->string('phone')->nullable()->after('email');
                }
                if (!Schema::hasColumn('leads', 'company')) {
                    $table->string('company')->nullable()->after('phone');
                }
                if (!Schema::hasColumn('leads', 'status')) {
                    $table->string('status')->default('Qualified')->after('stage');
                }
                if (!Schema::hasColumn('leads', 'avatar')) {
                    $table->string('avatar')->nullable()->after('status');
                }
            });
        }

        // 3. Align appointments table
        if (Schema::hasTable('appointments')) {
            Schema::table('appointments', function (Blueprint $table) {
                if (!Schema::hasColumn('appointments', 'title')) {
                    $table->string('title')->nullable()->after('lead_id');
                }
                if (!Schema::hasColumn('appointments', 'date')) {
                    $table->string('date')->nullable()->after('title');
                }
                if (!Schema::hasColumn('appointments', 'time')) {
                    $table->string('time')->nullable()->after('date');
                }
                if (!Schema::hasColumn('appointments', 'customer_name')) {
                    $table->string('customer_name')->nullable()->after('time');
                }
                if (!Schema::hasColumn('appointments', 'avatar')) {
                    $table->string('avatar')->nullable()->after('customer_name');
                }
            });
        }

        // 4. Align integrations table
        if (Schema::hasTable('integrations')) {
            Schema::table('integrations', function (Blueprint $table) {
                if (!Schema::hasColumn('integrations', 'name')) {
                    $table->string('name')->nullable()->after('provider');
                }
                if (!Schema::hasColumn('integrations', 'category')) {
                    $table->string('category')->nullable()->after('name');
                }
                if (!Schema::hasColumn('integrations', 'connected')) {
                    $table->boolean('connected')->default(false)->after('category');
                }
                if (!Schema::hasColumn('integrations', 'icon')) {
                    $table->string('icon')->nullable()->after('connected');
                }
                if (!Schema::hasColumn('integrations', 'credentials')) {
                    $table->json('credentials')->nullable()->after('configuration_json');
                }
                if (!Schema::hasColumn('integrations', 'last_synced_at')) {
                    $table->timestamp('last_synced_at')->nullable()->after('credentials');
                }
            });
        }

        // 5. Align conversations table
        if (Schema::hasTable('conversations')) {
            Schema::table('conversations', function (Blueprint $table) {
                if (!Schema::hasColumn('conversations', 'last_message')) {
                    $table->text('last_message')->nullable()->after('metadata_json');
                }
                if (!Schema::hasColumn('conversations', 'assigned_agent')) {
                    $table->string('assigned_agent')->nullable()->after('active_agent_id');
                }
            });
        }

        // 6. Align knowledge_documents table
        if (Schema::hasTable('knowledge_documents')) {
            Schema::table('knowledge_documents', function (Blueprint $table) {
                if (!Schema::hasColumn('knowledge_documents', 'type')) {
                    $table->string('type')->nullable()->after('source_type');
                }
                if (!Schema::hasColumn('knowledge_documents', 'size')) {
                    $table->string('size')->nullable()->after('type');
                }
                if (!Schema::hasColumn('knowledge_documents', 'content')) {
                    $table->longText('content')->nullable()->after('size');
                }
            });
        }

        // 7. Align users table
        if (Schema::hasTable('users')) {
            Schema::table('users', function (Blueprint $table) {
                if (!Schema::hasColumn('users', 'organization_id')) {
                    $table->foreignUuid('organization_id')->nullable()->after('id');
                }
                if (!Schema::hasColumn('users', 'password')) {
                    $table->string('password')->nullable()->after('email');
                }
                if (!Schema::hasColumn('users', 'role')) {
                    $table->string('role')->default('Admin')->after('password');
                }
                if (!Schema::hasColumn('users', 'avatar')) {
                    $table->string('avatar')->nullable()->after('role');
                }
                if (!Schema::hasColumn('users', 'is_active')) {
                    $table->boolean('is_active')->default(true)->after('avatar');
                }
            });
        }

        // 8. Align knowledge_chunks table
        if (Schema::hasTable('knowledge_chunks')) {
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
    }

    public function down(): void
    {
        // Reversible table column drops
    }
};
