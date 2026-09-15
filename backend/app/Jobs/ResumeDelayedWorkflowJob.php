<?php

namespace App\Jobs;

use App\Models\WorkflowExecution;
use App\Models\WorkflowExecutionStep;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class ResumeDelayedWorkflowJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public string $executionId;
    public string $stepId;
    public string $nextNodeId;
    public array $context;
    public array $visitedNodeIds;

    public function __construct(string $executionId, string $stepId, string $nextNodeId, array $context = [], array $visitedNodeIds = [])
    {
        $this->executionId = $executionId;
        $this->stepId = $stepId;
        $this->nextNodeId = $nextNodeId;
        $this->context = $context;
        $this->visitedNodeIds = $visitedNodeIds;
    }

    public function handle(): void
    {
        Log::info("Resuming delayed workflow execution {$this->executionId} after wait timer.");

        $execution = WorkflowExecution::find($this->executionId);
        if (!$execution || $execution->status === 'cancelled') {
            return;
        }

        $step = WorkflowExecutionStep::find($this->stepId);
        if ($step) {
            $step->update([
                'status' => 'success',
                'output_payload' => array_merge($step->output_payload ?? [], ['resumed_at' => now()->toIso8601String()])
            ]);
        }

        $execution->update(['status' => 'running']);

        // Dispatch downstream step
        ExecuteWorkflowStepJob::dispatch(
            $this->executionId,
            $this->nextNodeId,
            $this->context,
            $this->visitedNodeIds
        );
    }
}
