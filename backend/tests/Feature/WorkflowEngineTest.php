<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\Organization;
use App\Models\Contact;
use App\Models\Workflow;
use App\Models\WorkflowVersion;
use App\Models\WorkflowExecution;
use App\Models\WorkflowExecutionStep;
use App\Models\Tag;
use App\Models\Task;
use App\Services\Workflow\WorkflowEngine;
use Illuminate\Support\Str;

class WorkflowEngineTest extends TestCase
{
    public function test_real_workflow_executes_trigger_condition_and_actions(): void
    {
        $org = Organization::create([
            'id' => (string) Str::uuid(),
            'name' => 'Acme Automation Org',
            'slug' => 'acme-auto',
            'timezone' => 'UTC',
            'status' => 'active'
        ]);

        $contact = Contact::create([
            'id' => (string) Str::uuid(),
            'organization_id' => $org->id,
            'first_name' => 'John',
            'last_name' => 'Reese',
            'email' => 'john.reese@nyc.gov',
            'score' => 85,
            'status' => 'Lead'
        ]);

        // Define a real workflow graph: Trigger -> Condition (score > 50) -> Action (Add Tag "VIP Lead") -> Action (Create Task)
        $workflow = Workflow::create([
            'id' => (string) Str::uuid(),
            'organization_id' => $org->id,
            'name' => 'High Value Lead Onboarding',
            'trigger_type' => 'ContactCreated',
            'status' => 'published',
            'is_active' => true
        ]);

        $version = WorkflowVersion::create([
            'id' => (string) Str::uuid(),
            'workflow_id' => $workflow->id,
            'version_number' => 1,
            'is_active' => true,
            'nodes' => [
                [
                    'id' => 'node-1',
                    'type' => 'trigger',
                    'label' => 'When Contact is Created',
                    'data' => ['event' => 'ContactCreated']
                ],
                [
                    'id' => 'node-2',
                    'type' => 'condition',
                    'label' => 'Score > 50',
                    'data' => [
                        'field' => 'score',
                        'operator' => 'greater_than',
                        'value' => 50
                    ]
                ],
                [
                    'id' => 'node-3',
                    'type' => 'action',
                    'label' => 'Add VIP Tag',
                    'data' => [
                        'action_type' => 'add_tag',
                        'tag' => 'VIP Lead'
                    ]
                ],
                [
                    'id' => 'node-4',
                    'type' => 'action',
                    'label' => 'Create Welcome Task',
                    'data' => [
                        'action_type' => 'create_task',
                        'title' => 'Schedule VIP Welcome Call',
                        'priority' => 'high',
                        'due_days' => 2
                    ]
                ]
            ],
            'edges' => [
                ['source' => 'node-1', 'target' => 'node-2'],
                ['source' => 'node-2', 'target' => 'node-3', 'sourceHandle' => 'true'],
                ['source' => 'node-3', 'target' => 'node-4']
            ]
        ]);

        // Execute via real engine
        $engine = new WorkflowEngine();
        $execution = $engine->startExecution(
            $workflow,
            'ContactCreated',
            'contact',
            $contact->id,
            ['score' => 85, 'name' => $contact->name]
        );

        $this->assertNotNull($execution);
        $this->assertEquals('completed', $execution->status);

        // Verify Step records were persisted
        $steps = WorkflowExecutionStep::where('workflow_execution_id', $execution->id)->get();
        $this->assertCount(4, $steps);

        // Verify side effects occurred in real database
        $this->assertTrue($contact->fresh()->tags()->where('name', 'VIP Lead')->exists());
        $this->assertTrue(Task::where('contact_id', $contact->id)->where('title', 'Schedule VIP Welcome Call')->exists());
    }
}
