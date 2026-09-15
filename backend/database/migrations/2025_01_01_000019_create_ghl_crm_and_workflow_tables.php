<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Contacts
        Schema::create('contacts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('organization_id')->index();
            $table->uuid('owner_id')->nullable()->index();
            $table->string('first_name');
            $table->string('last_name')->nullable();
            $table->string('email')->nullable()->index();
            $table->string('phone')->nullable()->index();
            $table->string('source')->default('Direct');
            $table->string('status')->default('Lead');
            $table->integer('score')->default(0);
            $table->string('avatar')->nullable();
            $table->json('dnd_settings')->nullable();
            $table->json('custom_attributes')->nullable();
            $table->timestamps();

            $table->foreign('organization_id')->references('id')->on('organizations')->onDelete('cascade');
        });

        // 2. Companies
        Schema::create('companies', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('organization_id')->index();
            $table->uuid('owner_id')->nullable()->index();
            $table->string('name');
            $table->string('domain')->nullable();
            $table->string('industry')->nullable();
            $table->string('size')->nullable();
            $table->string('phone')->nullable();
            $table->json('address')->nullable();
            $table->timestamps();

            $table->foreign('organization_id')->references('id')->on('organizations')->onDelete('cascade');
        });

        // 3. Contact ↔ Company Many-to-Many
        Schema::create('contact_company', function (Blueprint $table) {
            $table->id();
            $table->uuid('contact_id')->index();
            $table->uuid('company_id')->index();
            $table->string('role')->nullable();
            $table->boolean('is_primary')->default(false);
            $table->timestamps();

            $table->foreign('contact_id')->references('id')->on('contacts')->onDelete('cascade');
            $table->foreign('company_id')->references('id')->on('companies')->onDelete('cascade');
        });

        // 4. Tags & Contact Tags
        Schema::create('tags', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('organization_id')->index();
            $table->string('name');
            $table->string('color')->default('#3B82F6');
            $table->timestamps();

            $table->foreign('organization_id')->references('id')->on('organizations')->onDelete('cascade');
        });

        Schema::create('contact_tags', function (Blueprint $table) {
            $table->id();
            $table->uuid('contact_id')->index();
            $table->uuid('tag_id')->index();
            $table->timestamps();

            $table->foreign('contact_id')->references('id')->on('contacts')->onDelete('cascade');
            $table->foreign('tag_id')->references('id')->on('tags')->onDelete('cascade');
        });

        // 5. Pipelines & Stages
        Schema::create('pipelines', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('organization_id')->index();
            $table->string('name');
            $table->boolean('is_default')->default(false);
            $table->timestamps();

            $table->foreign('organization_id')->references('id')->on('organizations')->onDelete('cascade');
        });

        Schema::create('pipeline_stages', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('pipeline_id')->index();
            $table->string('name');
            $table->integer('order')->default(0);
            $table->integer('probability')->default(100);
            $table->string('color')->default('#64748B');
            $table->timestamps();

            $table->foreign('pipeline_id')->references('id')->on('pipelines')->onDelete('cascade');
        });

        // 6. Opportunities
        Schema::create('opportunities', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('organization_id')->index();
            $table->uuid('contact_id')->nullable()->index();
            $table->uuid('company_id')->nullable()->index();
            $table->uuid('pipeline_id')->index();
            $table->uuid('stage_id')->index();
            $table->uuid('owner_id')->nullable()->index();
            $table->string('title');
            $table->decimal('value', 15, 2)->default(0.00);
            $table->string('currency', 3)->default('USD');
            $table->integer('probability')->default(50);
            $table->string('status')->default('open'); // open, won, lost, abandoned
            $table->dateTime('expected_close_date')->nullable();
            $table->json('custom_attributes')->nullable();
            $table->timestamps();

            $table->foreign('organization_id')->references('id')->on('organizations')->onDelete('cascade');
            $table->foreign('pipeline_id')->references('id')->on('pipelines')->onDelete('cascade');
            $table->foreign('stage_id')->references('id')->on('pipeline_stages')->onDelete('cascade');
        });

        Schema::create('opportunity_stage_history', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('opportunity_id')->index();
            $table->uuid('from_stage_id')->nullable();
            $table->uuid('to_stage_id');
            $table->uuid('moved_by_user_id')->nullable();
            $table->timestamps();

            $table->foreign('opportunity_id')->references('id')->on('opportunities')->onDelete('cascade');
        });

        // 7. Tasks
        Schema::create('tasks', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('organization_id')->index();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('priority')->default('medium'); // low, medium, high, urgent
            $table->string('status')->default('pending'); // pending, in_progress, completed, cancelled
            $table->dateTime('due_date')->nullable();
            $table->uuid('assignee_id')->nullable()->index();
            $table->uuid('contact_id')->nullable()->index();
            $table->uuid('opportunity_id')->nullable()->index();
            $table->uuid('company_id')->nullable()->index();
            $table->timestamps();

            $table->foreign('organization_id')->references('id')->on('organizations')->onDelete('cascade');
        });

        // 8. Notes
        Schema::create('notes', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('organization_id')->index();
            $table->uuid('author_id')->nullable();
            $table->string('notable_type');
            $table->uuid('notable_id')->index();
            $table->text('body');
            $table->timestamps();

            $table->foreign('organization_id')->references('id')->on('organizations')->onDelete('cascade');
        });

        // 9. Activities Timeline
        Schema::create('activities', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('organization_id')->index();
            $table->uuid('user_id')->nullable();
            $table->uuid('contact_id')->nullable()->index();
            $table->uuid('company_id')->nullable()->index();
            $table->uuid('opportunity_id')->nullable()->index();
            $table->string('type'); // call, email, meeting, note, stage_change, task_created, system
            $table->text('description');
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->foreign('organization_id')->references('id')->on('organizations')->onDelete('cascade');
        });

        // 10. Smart Lists
        Schema::create('smart_lists', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('organization_id')->index();
            $table->string('name');
            $table->string('entity_type')->default('contact');
            $table->json('filters');
            $table->json('columns')->nullable();
            $table->uuid('created_by')->nullable();
            $table->timestamps();

            $table->foreign('organization_id')->references('id')->on('organizations')->onDelete('cascade');
        });

        // 11. Generic Custom Objects Engine
        Schema::create('custom_objects', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('organization_id')->index();
            $table->string('name'); // e.g. "Property"
            $table->string('slug'); // e.g. "property"
            $table->string('singular_name');
            $table->text('description')->nullable();
            $table->string('icon')->default('Box');
            $table->timestamps();

            $table->foreign('organization_id')->references('id')->on('organizations')->onDelete('cascade');
        });

        Schema::create('custom_object_fields', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('custom_object_id')->index();
            $table->string('field_name');
            $table->string('field_key');
            $table->string('field_type'); // text, number, date, select, currency
            $table->json('options')->nullable();
            $table->boolean('is_required')->default(false);
            $table->timestamps();

            $table->foreign('custom_object_id')->references('id')->on('custom_objects')->onDelete('cascade');
        });

        Schema::create('custom_object_records', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('custom_object_id')->index();
            $table->uuid('organization_id')->index();
            $table->json('data');
            $table->uuid('created_by')->nullable();
            $table->timestamps();

            $table->foreign('custom_object_id')->references('id')->on('custom_objects')->onDelete('cascade');
            $table->foreign('organization_id')->references('id')->on('organizations')->onDelete('cascade');
        });

        // 12. Associations
        Schema::create('associations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('organization_id')->index();
            $table->string('source_type');
            $table->uuid('source_id')->index();
            $table->string('target_type');
            $table->uuid('target_id')->index();
            $table->string('relationship_name')->default('associated');
            $table->timestamps();

            $table->foreign('organization_id')->references('id')->on('organizations')->onDelete('cascade');
        });

        // 13. Production Workflow Engine
        Schema::create('workflows', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('organization_id')->index();
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('trigger_type'); // ContactCreated, OpportunityStageChanged, TagAdded, AppointmentBooked, Webhook
            $table->json('trigger_config')->nullable();
            $table->string('status')->default('draft'); // draft, published, paused, archived
            $table->boolean('is_active')->default(false);
            $table->uuid('created_by')->nullable();
            $table->timestamps();

            $table->foreign('organization_id')->references('id')->on('organizations')->onDelete('cascade');
        });

        Schema::create('workflow_versions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('workflow_id')->index();
            $table->integer('version_number')->default(1);
            $table->json('nodes');
            $table->json('edges');
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->foreign('workflow_id')->references('id')->on('workflows')->onDelete('cascade');
        });

        Schema::create('workflow_executions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('workflow_id')->index();
            $table->uuid('workflow_version_id')->index();
            $table->uuid('organization_id')->index();
            $table->string('trigger_event');
            $table->string('entity_type');
            $table->uuid('entity_id');
            $table->string('status')->default('running'); // running, completed, failed, paused
            $table->string('current_node_id')->nullable();
            $table->json('context')->nullable();
            $table->integer('retry_count')->default(0);
            $table->text('error_message')->nullable();
            $table->timestamp('started_at')->useCurrent();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->foreign('workflow_id')->references('id')->on('workflows')->onDelete('cascade');
            $table->foreign('workflow_version_id')->references('id')->on('workflow_versions')->onDelete('cascade');
            $table->foreign('organization_id')->references('id')->on('organizations')->onDelete('cascade');
        });

        Schema::create('workflow_execution_steps', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('workflow_execution_id')->index();
            $table->string('node_id');
            $table->string('node_name');
            $table->string('node_type'); // trigger, condition, action, wait, goal
            $table->string('status'); // success, failed, waiting, skipped
            $table->json('input_payload')->nullable();
            $table->json('output_payload')->nullable();
            $table->text('error_message')->nullable();
            $table->timestamp('executed_at')->useCurrent();
            $table->timestamps();

            $table->foreign('workflow_execution_id')->references('id')->on('workflow_executions')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('workflow_execution_steps');
        Schema::dropIfExists('workflow_executions');
        Schema::dropIfExists('workflow_versions');
        Schema::dropIfExists('workflows');
        Schema::dropIfExists('associations');
        Schema::dropIfExists('custom_object_records');
        Schema::dropIfExists('custom_object_fields');
        Schema::dropIfExists('custom_objects');
        Schema::dropIfExists('smart_lists');
        Schema::dropIfExists('activities');
        Schema::dropIfExists('notes');
        Schema::dropIfExists('tasks');
        Schema::dropIfExists('opportunity_stage_history');
        Schema::dropIfExists('opportunities');
        Schema::dropIfExists('pipeline_stages');
        Schema::dropIfExists('pipelines');
        Schema::dropIfExists('contact_tags');
        Schema::dropIfExists('tags');
        Schema::dropIfExists('contact_company');
        Schema::dropIfExists('companies');
        Schema::dropIfExists('contacts');
    }
};
