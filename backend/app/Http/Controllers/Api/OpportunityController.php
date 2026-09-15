<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Opportunity;
use App\Models\OpportunityStageHistory;
use App\Models\Pipeline;
use App\Models\PipelineStage;
use App\Models\Activity;
use App\Services\Workflow\WorkflowEngine;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class OpportunityController extends Controller
{
    /**
     * List opportunities with stage, pipeline, contact, company filtering.
     */
    public function index(Request $request)
    {
        $orgId = $request->user()->organization_id ?? $request->header('X-Organization-Id');
        $query = Opportunity::with(['contact', 'company', 'pipeline', 'stage', 'owner'])->where('organization_id', $orgId);

        if ($pipelineId = $request->query('pipeline_id')) {
            $query->where('pipeline_id', $pipelineId);
        }

        if ($stageId = $request->query('stage_id')) {
            $query->where('stage_id', $stageId);
        }

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        $opportunities = $query->orderBy('created_at', 'desc')->get();

        return response()->json([
            'success' => true,
            'data' => $opportunities,
            'meta' => [
                'total' => $opportunities->count(),
                'total_value' => $opportunities->sum('value'),
                'weighted_forecast' => $opportunities->sum(function ($o) {
                    return $o->value * ($o->probability / 100.0);
                })
            ]
        ]);
    }

    /**
     * Create opportunity.
     */
    public function store(Request $request, WorkflowEngine $workflowEngine)
    {
        $orgId = $request->user()->organization_id ?? $request->header('X-Organization-Id');

        $pipelineId = $request->input('pipeline_id');
        $stageId = $request->input('stage_id');

        // Resolve pipeline if invalid UUID or slug provided
        if (!Str::isUuid($pipelineId) || !Pipeline::where('id', $pipelineId)->where('organization_id', $orgId)->exists()) {
            $defaultPipe = Pipeline::where('organization_id', $orgId)->first();
            if (!$defaultPipe) {
                $defaultPipe = Pipeline::create([
                    'id' => (string) Str::uuid(),
                    'organization_id' => $orgId,
                    'name' => 'Sales Pipeline',
                    'is_default' => true
                ]);
                PipelineStage::create([
                    'id' => (string) Str::uuid(),
                    'pipeline_id' => $defaultPipe->id,
                    'name' => 'New Lead',
                    'order' => 0,
                    'probability' => 20,
                    'color' => '#3B82F6'
                ]);
            }
            $pipelineId = $defaultPipe->id;
            $request->merge(['pipeline_id' => $pipelineId]);
        }

        // Resolve stage if invalid UUID or slug provided
        if (!Str::isUuid($stageId) || !PipelineStage::where('id', $stageId)->where('pipeline_id', $pipelineId)->exists()) {
            $firstStage = PipelineStage::where('pipeline_id', $pipelineId)->orderBy('order', 'asc')->first();
            $stageId = $firstStage ? $firstStage->id : null;
            $request->merge(['stage_id' => $stageId]);
        }

        // Auto-create or resolve contact if contact_name provided
        $contactId = $request->input('contact_id');
        if ((!$contactId || !Str::isUuid($contactId)) && $request->filled('contact_name')) {
            $names = explode(' ', trim($request->contact_name), 2);
            $contact = \App\Models\Contact::firstOrCreate(
                [
                    'organization_id' => $orgId,
                    'email' => $request->input('contact_email') ?: (Str::slug($request->contact_name) . '@example.com')
                ],
                [
                    'id' => (string) Str::uuid(),
                    'first_name' => $names[0],
                    'last_name' => $names[1] ?? '',
                    'source' => 'Opportunity'
                ]
            );
            $contactId = $contact->id;
            $request->merge(['contact_id' => $contactId]);
        }

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'pipeline_id' => 'required|uuid|exists:pipelines,id',
            'stage_id' => 'required|uuid|exists:pipeline_stages,id',
            'value' => 'nullable|numeric|min:0',
            'probability' => 'nullable|integer|min:0|max:100',
            'status' => 'nullable|string|in:open,won,lost,abandoned',
            'contact_id' => 'nullable|uuid|exists:contacts,id',
            'company_id' => 'nullable|uuid|exists:companies,id',
            'owner_id' => 'nullable|uuid',
            'expected_close_date' => 'nullable|date',
            'custom_attributes' => 'nullable|array'
        ]);

        $stage = PipelineStage::find($validated['stage_id']);

        $opportunity = Opportunity::create([
            'id' => (string) Str::uuid(),
            'organization_id' => $orgId,
            'title' => $validated['title'],
            'pipeline_id' => $validated['pipeline_id'],
            'stage_id' => $validated['stage_id'],
            'value' => $validated['value'] ?? 0.00,
            'probability' => $validated['probability'] ?? ($stage->probability ?? 50),
            'status' => $validated['status'] ?? 'open',
            'contact_id' => $validated['contact_id'] ?? null,
            'company_id' => $validated['company_id'] ?? null,
            'owner_id' => $validated['owner_id'] ?? null,
            'expected_close_date' => $validated['expected_close_date'] ?? null,
            'custom_attributes' => $validated['custom_attributes'] ?? []
        ]);

        OpportunityStageHistory::create([
            'id' => (string) Str::uuid(),
            'opportunity_id' => $opportunity->id,
            'from_stage_id' => null,
            'to_stage_id' => $opportunity->stage_id,
            'moved_by_user_id' => $request->user()->id ?? null
        ]);

        Activity::create([
            'id' => (string) Str::uuid(),
            'organization_id' => $orgId,
            'opportunity_id' => $opportunity->id,
            'contact_id' => $opportunity->contact_id,
            'company_id' => $opportunity->company_id,
            'type' => 'deal_created',
            'description' => "Opportunity '{$opportunity->title}' created with value \${$opportunity->value}."
        ]);

        // Dispatch OpportunityCreated
        $workflowEngine->dispatchEvent($orgId, 'OpportunityCreated', 'opportunity', $opportunity->id, [
            'title' => $opportunity->title,
            'value' => $opportunity->value,
            'stage_id' => $opportunity->stage_id,
            'pipeline_id' => $opportunity->pipeline_id
        ]);

        return response()->json(['success' => true, 'data' => $opportunity->load(['stage', 'pipeline'])], 201);
    }

    /**
     * Show opportunity details.
     */
    public function show(Request $request, Opportunity $opportunity)
    {
        $orgId = $request->user()->organization_id ?? $request->header('X-Organization-Id');
        if ($opportunity->organization_id !== $orgId) {
            return response()->json(['success' => false, 'message' => 'Opportunity not found.'], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $opportunity->load(['contact', 'company', 'pipeline', 'stage', 'owner', 'stageHistory.fromStage', 'stageHistory.toStage', 'tasks', 'activities'])
        ]);
    }

    /**
     * Update opportunity and record stage transitions if stage changed.
     */
    public function update(Request $request, Opportunity $opportunity, WorkflowEngine $workflowEngine)
    {
        $orgId = $request->user()->organization_id ?? $request->header('X-Organization-Id');
        if ($opportunity->organization_id !== $orgId) {
            return response()->json(['success' => false, 'message' => 'Opportunity not found.'], 404);
        }

        $validated = $request->validate([
            'title' => 'sometimes|string|max:255',
            'pipeline_id' => 'sometimes|uuid|exists:pipelines,id',
            'stage_id' => 'sometimes|uuid|exists:pipeline_stages,id',
            'value' => 'nullable|numeric|min:0',
            'probability' => 'nullable|integer|min:0|max:100',
            'status' => 'nullable|string|in:open,won,lost,abandoned',
            'contact_id' => 'nullable|uuid|exists:contacts,id',
            'company_id' => 'nullable|uuid|exists:companies,id',
            'owner_id' => 'nullable|uuid',
            'expected_close_date' => 'nullable|date',
            'custom_attributes' => 'nullable|array'
        ]);

        $fromStageId = $opportunity->stage_id;
        $opportunity->update($validated);

        if (isset($validated['stage_id']) && $validated['stage_id'] !== $fromStageId) {
            OpportunityStageHistory::create([
                'id' => (string) Str::uuid(),
                'opportunity_id' => $opportunity->id,
                'from_stage_id' => $fromStageId,
                'to_stage_id' => $opportunity->stage_id,
                'moved_by_user_id' => $request->user()->id ?? null
            ]);

            $toStage = PipelineStage::find($opportunity->stage_id);

            Activity::create([
                'id' => (string) Str::uuid(),
                'organization_id' => $opportunity->organization_id,
                'opportunity_id' => $opportunity->id,
                'contact_id' => $opportunity->contact_id,
                'company_id' => $opportunity->company_id,
                'type' => 'stage_change',
                'description' => "Stage moved to {$toStage->name}."
            ]);

            // Dispatch OpportunityStageChanged
            $workflowEngine->dispatchEvent($opportunity->organization_id, 'OpportunityStageChanged', 'opportunity', $opportunity->id, [
                'title' => $opportunity->title,
                'value' => $opportunity->value,
                'from_stage_id' => $fromStageId,
                'to_stage_id' => $opportunity->stage_id,
                'to_stage_name' => $toStage->name
            ]);
        }

        \App\Services\Audit\AuditLogger::log(
            $opportunity->organization_id,
            'opportunity_updated',
            'user',
            $request->user()->id ?? null,
            'opportunity',
            $opportunity->id,
            ['stage_id' => $opportunity->stage_id, 'status' => $opportunity->status]
        );

        return response()->json(['success' => true, 'data' => $opportunity->load(['stage', 'pipeline'])]);
    }

    public function destroy(Request $request, Opportunity $opportunity)
    {
        $orgId = $request->user()->organization_id ?? $request->header('X-Organization-Id');
        if ($opportunity->organization_id !== $orgId) {
            return response()->json(['success' => false, 'message' => 'Opportunity not found.'], 404);
        }

        $opportunity->delete();

        \App\Services\Audit\AuditLogger::log(
            $orgId,
            'opportunity_deleted',
            'user',
            $request->user()->id ?? null,
            'opportunity',
            $opportunity->id
        );

        return response()->json(['success' => true, 'message' => 'Opportunity deleted successfully.']);
    }

    /**
     * Pipelines & Stages listing.
     */
    public function pipelines(Request $request)
    {
        $orgId = $request->user()->organization_id ?? $request->header('X-Organization-Id');
        $pipelines = Pipeline::with('stages')->where('organization_id', $orgId)->get();

        return response()->json(['success' => true, 'data' => $pipelines]);
    }

    /**
     * Create pipeline.
     */
    public function storePipeline(Request $request)
    {
        $orgId = $request->user()->organization_id ?? $request->header('X-Organization-Id');
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'stages' => 'required|array|min:1',
            'stages.*.name' => 'required|string',
            'stages.*.probability' => 'nullable|integer',
            'stages.*.color' => 'nullable|string'
        ]);

        $pipeline = Pipeline::create([
            'id' => (string) Str::uuid(),
            'organization_id' => $orgId,
            'name' => $validated['name'],
            'is_default' => false
        ]);

        foreach ($validated['stages'] as $index => $s) {
            PipelineStage::create([
                'id' => (string) Str::uuid(),
                'pipeline_id' => $pipeline->id,
                'name' => $s['name'],
                'order' => $index,
                'probability' => $s['probability'] ?? 50,
                'color' => $s['color'] ?? '#3B82F6'
            ]);
        }

        return response()->json(['success' => true, 'data' => $pipeline->load('stages')], 201);
    }

    /**
     * Update pipeline.
     */
    public function updatePipeline(Request $request, Pipeline $pipeline)
    {
        $orgId = $request->user()->organization_id ?? $request->header('X-Organization-Id');
        if ($pipeline->organization_id !== $orgId) {
            return response()->json(['success' => false, 'message' => 'Pipeline not found.'], 404);
        }

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'is_default' => 'nullable|boolean',
        ]);

        $pipeline->update($validated);

        return response()->json(['success' => true, 'data' => $pipeline->load('stages')]);
    }
}
