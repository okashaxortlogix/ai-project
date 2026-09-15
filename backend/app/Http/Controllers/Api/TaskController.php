<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Task;
use App\Models\Activity;
use App\Services\Workflow\WorkflowEngine;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class TaskController extends Controller
{
    public function index(Request $request)
    {
        $orgId = $request->user()->organization_id ?? $request->header('X-Organization-Id');
        $query = Task::with(['contact', 'opportunity', 'company', 'assignee'])->where('organization_id', $orgId);

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        if ($priority = $request->query('priority')) {
            $query->where('priority', $priority);
        }

        if ($assigneeId = $request->query('assignee_id')) {
            $query->where('assignee_id', $assigneeId);
        }

        return response()->json([
            'success' => true,
            'data' => $query->orderBy('due_date', 'asc')->get()
        ]);
    }

    public function store(Request $request, WorkflowEngine $workflowEngine)
    {
        $orgId = $request->user()->organization_id ?? $request->header('X-Organization-Id');

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'priority' => 'nullable|string|in:low,medium,high,urgent',
            'due_date' => 'nullable|date',
            'assignee_id' => 'nullable|uuid',
            'contact_id' => 'nullable|uuid|exists:contacts,id',
            'opportunity_id' => 'nullable|uuid|exists:opportunities,id',
            'company_id' => 'nullable|uuid|exists:companies,id'
        ]);

        $task = Task::create([
            'id' => (string) Str::uuid(),
            'organization_id' => $orgId,
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'priority' => $validated['priority'] ?? 'medium',
            'status' => 'pending',
            'due_date' => $validated['due_date'] ?? null,
            'assignee_id' => $validated['assignee_id'] ?? null,
            'contact_id' => $validated['contact_id'] ?? null,
            'opportunity_id' => $validated['opportunity_id'] ?? null,
            'company_id' => $validated['company_id'] ?? null
        ]);

        Activity::create([
            'id' => (string) Str::uuid(),
            'organization_id' => $orgId,
            'contact_id' => $task->contact_id,
            'opportunity_id' => $task->opportunity_id,
            'type' => 'task_created',
            'description' => "Task '{$task->title}' created with priority {$task->priority}."
        ]);

        $workflowEngine->dispatchEvent($orgId, 'TaskCreated', 'task', $task->id, $task->toArray());

        return response()->json(['success' => true, 'data' => $task->load(['contact', 'opportunity'])], 201);
    }

    public function show(Request $request, Task $task)
    {
        $orgId = $request->user()->organization_id ?? $request->header('X-Organization-Id');
        if ($task->organization_id !== $orgId) {
            return response()->json(['success' => false, 'message' => 'Task not found.'], 404);
        }

        return response()->json(['success' => true, 'data' => $task->load(['contact', 'opportunity', 'company', 'assignee'])]);
    }

    public function update(Request $request, Task $task, WorkflowEngine $workflowEngine)
    {
        $orgId = $request->user()->organization_id ?? $request->header('X-Organization-Id');
        if ($task->organization_id !== $orgId) {
            return response()->json(['success' => false, 'message' => 'Task not found.'], 404);
        }

        $validated = $request->validate([
            'title' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'priority' => 'nullable|string|in:low,medium,high,urgent',
            'status' => 'nullable|string|in:pending,in_progress,completed,cancelled',
            'due_date' => 'nullable|date',
            'assignee_id' => 'nullable|uuid',
            'contact_id' => 'nullable|uuid|exists:contacts,id',
            'opportunity_id' => 'nullable|uuid|exists:opportunities,id',
            'company_id' => 'nullable|uuid|exists:companies,id'
        ]);

        $oldStatus = $task->status;
        $task->update($validated);

        if (isset($validated['status']) && $validated['status'] === 'completed' && $oldStatus !== 'completed') {
            Activity::create([
                'id' => (string) Str::uuid(),
                'organization_id' => $task->organization_id,
                'contact_id' => $task->contact_id,
                'opportunity_id' => $task->opportunity_id,
                'type' => 'task_completed',
                'description' => "Task '{$task->title}' marked as completed."
            ]);

            $workflowEngine->dispatchEvent($task->organization_id, 'TaskCompleted', 'task', $task->id, $task->toArray());
        }

        return response()->json(['success' => true, 'data' => $task->load(['contact', 'opportunity', 'assignee'])]);
    }

    public function destroy(Request $request, Task $task)
    {
        $orgId = $request->user()->organization_id ?? $request->header('X-Organization-Id');
        if ($task->organization_id !== $orgId) {
            return response()->json(['success' => false, 'message' => 'Task not found.'], 404);
        }

        $task->delete();
        return response()->json(['success' => true, 'message' => 'Task deleted successfully.']);
    }
}
