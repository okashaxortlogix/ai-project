<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Workflow;
use App\Models\WorkflowVersion;
use App\Models\WorkflowExecution;
use App\Services\Workflow\WorkflowEngine;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class WorkflowController extends Controller
{
    /**
     * List workflows.
     */
    public function index(Request $request)
    {
        $orgId = $request->user()->organization_id ?? $request->header('X-Organization-Id');
        $workflows = Workflow::with(['activeVersion', 'executions' => function ($q) {
            $q->latest()->limit(5);
        }])->where('organization_id', $orgId)->get();

        return response()->json(['success' => true, 'data' => $workflows]);
    }

    /**
     * Create workflow.
     */
    public function store(Request $request)
    {
        $orgId = $request->user()->organization_id ?? $request->header('X-Organization-Id');

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'trigger_type' => 'required|string',
            'trigger_config' => 'nullable|array',
            'nodes' => 'present|array',
            'edges' => 'present|array'
        ]);

        $workflow = Workflow::create([
            'id' => (string) Str::uuid(),
            'organization_id' => $orgId,
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'trigger_type' => $validated['trigger_type'],
            'trigger_config' => $validated['trigger_config'] ?? [],
            'status' => 'draft',
            'is_active' => false,
            'created_by' => $request->user()->id ?? null
        ]);

        WorkflowVersion::create([
            'id' => (string) Str::uuid(),
            'workflow_id' => $workflow->id,
            'version_number' => 1,
            'nodes' => $validated['nodes'],
            'edges' => $validated['edges'],
            'is_active' => true
        ]);

        return response()->json(['success' => true, 'data' => $workflow->load('activeVersion')], 201);
    }

    /**
     * Show workflow.
     */
    public function show(Request $request, Workflow $workflow)
    {
        if ($workflow->organization_id !== $request->user()->organization_id) {
            return response()->json(['success' => false, 'message' => 'Workflow not found.'], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $workflow->load(['activeVersion', 'executions.steps'])
        ]);
    }

    /**
     * Update workflow & save a new version.
     */
    public function update(Request $request, Workflow $workflow)
    {
        if ($workflow->organization_id !== $request->user()->organization_id) {
            return response()->json(['success' => false, 'message' => 'Workflow not found.'], 404);
        }

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'trigger_type' => 'sometimes|string',
            'trigger_config' => 'nullable|array',
            'nodes' => 'nullable|array',
            'edges' => 'nullable|array',
            'status' => 'nullable|string|in:draft,published,paused,archived',
            'is_active' => 'nullable|boolean'
        ]);

        $workflow->update(collect($validated)->except(['nodes', 'edges'])->toArray());

        if (!empty($validated['nodes']) && !empty($validated['edges'])) {
            $latestVersionNumber = $workflow->versions()->max('version_number') ?? 0;
            // Deactivate older versions
            $workflow->versions()->update(['is_active' => false]);

            WorkflowVersion::create([
                'id' => (string) Str::uuid(),
                'workflow_id' => $workflow->id,
                'version_number' => $latestVersionNumber + 1,
                'nodes' => $validated['nodes'],
                'edges' => $validated['edges'],
                'is_active' => true
            ]);
        }

        return response()->json(['success' => true, 'data' => $workflow->load('activeVersion')]);
    }

    /**
     * Publish or Unpublish workflow.
     */
    public function togglePublish(Request $request, Workflow $workflow)
    {
        if ($workflow->organization_id !== $request->user()->organization_id) {
            return response()->json(['success' => false, 'message' => 'Workflow not found.'], 404);
        }

        $isPublished = $workflow->status === 'published';
        $newStatus = $isPublished ? 'draft' : 'published';

        $workflow->update([
            'status' => $newStatus,
            'is_active' => !$isPublished
        ]);

        return response()->json([
            'success' => true,
            'status' => $newStatus,
            'is_active' => $workflow->is_active,
            'data' => $workflow
        ]);
    }

    /**
     * Execute workflow manually or for testing (Real server-side execution, NOT a simulation).
     */
    public function execute(Request $request, Workflow $workflow, WorkflowEngine $workflowEngine)
    {
        if ($workflow->organization_id !== $request->user()->organization_id) {
            return response()->json(['success' => false, 'message' => 'Workflow not found.'], 404);
        }

        $validated = $request->validate([
            'entity_type' => 'nullable|string|in:contact,lead,opportunity,task',
            'entity_id' => 'nullable|uuid',
            'context' => 'nullable|array'
        ]);

        $entityType = $validated['entity_type'] ?? 'contact';
        $entityId = $validated['entity_id'] ?? (string) Str::uuid();
        $context = $validated['context'] ?? ['source' => 'Manual Execution'];

        $execution = $workflowEngine->startExecution(
            $workflow,
            'ManualTrigger',
            $entityType,
            $entityId,
            $context
        );

        return response()->json([
            'success' => true,
            'message' => 'Workflow executed successfully with persistent step audit.',
            'data' => $execution->load('steps')
        ]);
    }

    /**
     * Get executions list for a workflow.
     */
    public function executions(Request $request, Workflow $workflow)
    {
        if ($workflow->organization_id !== $request->user()->organization_id) {
            return response()->json(['success' => false, 'message' => 'Workflow not found.'], 404);
        }

        $executions = WorkflowExecution::with('steps')
            ->where('workflow_id', $workflow->id)
            ->orderBy('started_at', 'desc')
            ->paginate(20);

        return response()->json([
            'success' => true,
            'data' => $executions->items(),
            'meta' => ['total' => $executions->total()]
        ]);
    }
}
