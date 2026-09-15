<?php

namespace App\Jobs;

use App\Models\WorkflowExecution;
use App\Models\WorkflowVersion;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class ExecuteWorkflowJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $timeout = 60;

    public string $executionId;

    public function __construct(string $executionId)
    {
        $this->executionId = $executionId;
    }

    public function handle(): void
    {
        $execution = WorkflowExecution::with('workflow')->find($this->executionId);
        if (!$execution) {
            Log::warning("ExecuteWorkflowJob: Execution {$this->executionId} not found.");
            return;
        }

        $version = $execution->workflowVersion ?? $execution->workflow->activeVersion ?? $execution->workflow->versions()->latest()->first();
        if (!$version) {
            $execution->update([
                'status' => 'failed',
                'error_message' => 'No workflow version found.',
                'completed_at' => now()
            ]);
            return;
        }

        $nodes = collect($version->nodes ?? []);
        $edges = collect($version->edges ?? []);

        // Locate Trigger Node
        $triggerNode = $nodes->firstWhere('type', 'trigger') ?? $nodes->first();
        if (!$triggerNode) {
            $execution->update(['status' => 'completed', 'completed_at' => now()]);
            return;
        }

        $triggerNodeId = $triggerNode['id'];
        $nextEdge = $edges->firstWhere('source', $triggerNodeId);

        if ($nextEdge) {
            $nextNodeId = $nextEdge['target'];
            ExecuteWorkflowStepJob::dispatch($execution->id, $nextNodeId, $execution->context ?? [], [$triggerNodeId]);
        } else {
            $execution->update(['status' => 'completed', 'completed_at' => now()]);
        }
    }
}
