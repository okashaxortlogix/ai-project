<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('appointments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('organization_id')->constrained('organizations')->cascadeOnDelete();
            $table->foreignUuid('customer_id')->constrained('customers')->cascadeOnDelete();
            $table->foreignUuid('lead_id')->nullable()->constrained('leads')->nullOnDelete();
            $table->string('provider')->default('google_calendar'); // google_calendar, outlook, cal_com
            $table->string('external_event_id')->nullable();
            $table->string('service')->default('Demo Call'); // Demo Call, Client Call, Team Meeting, Follow Up, Product Demo
            $table->dateTime('start_at');
            $table->dateTime('end_at');
            $table->string('timezone')->default('UTC');
            $table->string('status')->default('confirmed'); // confirmed, pending, rescheduled, cancelled
            $table->json('metadata_json')->nullable();
            $table->timestamps();

            $table->index(['organization_id', 'start_at', 'status']);
            $table->index(['customer_id', 'start_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('appointments');
    }
};
