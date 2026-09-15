<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\Organization;
use App\Models\Workflow;
use App\Models\WorkflowVersion;
use App\Models\WorkflowExecution;
use App\Models\WorkflowExecutionStep;
use App\Models\Contact;
use App\Models\Tag;
use App\Models\Task;
use App\Jobs\ExecuteWorkflowJob;
use App\Jobs\ExecuteWorkflowStepJob;
use App\Jobs\ResumeDelayedWorkflowJob;
use App\Services\Workflow\WorkflowEngine;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Str;

class AsynchronousWorkflowTest extends TestCase
{
    public function test_workflow_dispatches_queue_job_and_handles_asynchronous_wait(): void
    {
        Queue::fake([ResumeDelayedWorkflowJob::class]);

        $org = Organization::create([
            'id' => (string) Str::uuid(),
            'name' => 'Async Org',
            'slug' => 'async-org-' . Str::random(5),
            'status' => 'active'
        ]);

        $contact = Contact::create([
            'id' => (string) Str::uuid(),
            'organization_id' => $org->id,
            'first_name' => 'Delayed',
            'last_name' => 'Lead',
            'email' => 'delayed@lead.com',
            'status' => 'Hot'
        ]);

        $workflow = Workflow::create([
            'id' => (string) Str::uuid(),
            'organization_id' => $org->id,
            'name' => 'Async Nurture Flow',
            'trigger_type' => 'ContactCreated',
            'is_active' => true,
            'status' => 'published'
        ]);

        // Graph: Trigger -> Wait (10s) -> Add Tag (VIP)
        $version = WorkflowVersion::create([
            'id' => (string) Str::uuid(),
            'workflow_id' => $workflow->id,
            'version_number' => 1,
            'status' => 'published',
            'nodes' => [
                ['id' => 'node-trig', 'type' => 'trigger', 'data' => ['event' => 'ContactCreated']],
                ['id' => 'node-wait', 'type' => 'wait', 'data' => ['duration' => 10]],
                ['id' => 'node-tag', 'type' => 'action', 'data' => ['action_type' => 'add_tag', 'tag' => 'VIP']]
            ],
            'edges' => [
                ['id' => 'e1', 'source' => 'node-trig', 'target' => 'node-wait'],
                ['id' => 'e2', 'source' => 'node-wait', 'target' => 'node-tag']
            ]
        ]);

        $engine = new WorkflowEngine();
        $execution = $engine->startExecution($workflow, 'ContactCreated', 'contact', $contact->id, [
            'status' => 'Hot'
        ], false);

        $this->assertNotNull($execution);
        $this->assertEquals('waiting', $execution->fresh()->status);

        // Verify ResumeDelayedWorkflowJob was pushed with delay
        Queue::assertPushed(ResumeDelayedWorkflowJob::class, function ($job) use ($execution) {
            return $job->executionId === $execution->id && $job->nextNodeId === 'node-tag';
        });

        // Now simulate the worker executing ResumeDelayedWorkflowJob when the delay expires
        $waitStep = WorkflowExecutionStep::where('workflow_execution_id', $execution->id)->where('node_id', 'node-wait')->first();
        $this->assertNotNull($waitStep);

        $resumeJob = new ResumeDelayedWorkflowJob($execution->id, $waitStep->id, 'node-tag', ['status' => 'Hot'], ['node-trig', 'node-wait']);
        $resumeJob->handle();

        // Downstream step should execute
        $contact = $contact->fresh();
        $this->assertTrue($contact->tags()->where('name', 'VIP')->exists());
        $this->assertEquals('completed', $execution->fresh()->status);
    }
}
