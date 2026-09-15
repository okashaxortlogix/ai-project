<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\Organization;
use App\Models\User;
use App\Models\Customer;
use App\Models\Conversation;
use App\Models\Contact;
use App\Models\Workflow;
use App\Models\WorkflowVersion;
use App\Models\WorkflowExecution;
use App\Models\AuditLog;
use App\Models\Task;
use App\Models\Tag;
use App\Services\AI\LlmOrchestratorService;
use App\Services\Workflow\WorkflowEngine;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;

class EndToEndLifecycleTest extends TestCase
{
    use RefreshDatabase;

    public function test_full_end_to_end_customer_to_ai_tool_to_workflow_to_audit_pipeline()
    {
        // 1. Setup Tenant & Admin
        $org = Organization::create([
            'id' => (string) Str::uuid(),
            'name' => 'Enterprise Health CRM',
            'slug' => 'enterprise-health',
            'settings' => ['timezone' => 'UTC']
        ]);

        $admin = User::create([
            'id' => (string) Str::uuid(),
            'organization_id' => $org->id,
            'name' => 'System Director',
            'email' => 'director@enterprisehealth.com',
            'password' => bcrypt('secret123'),
            'password_hash' => bcrypt('secret123'),
            'role' => 'Admin'
        ]);

        // 2. Customer initiates a conversation
        $customer = Customer::create([
            'id' => (string) Str::uuid(),
            'organization_id' => $org->id,
            'name' => 'Sarah Connor',
            'email' => 'sarah.connor@cyberdyne.com',
            'phone' => '+15550192834',
            'source' => 'web_chat'
        ]);

        $conversation = Conversation::create([
            'id' => (string) Str::uuid(),
            'organization_id' => $org->id,
            'customer_id' => $customer->id,
            'channel' => 'web',
            'status' => 'active'
        ]);

        // 3. Define an automated Workflow triggered on Contact Creation
        $workflow = Workflow::create([
            'id' => (string) Str::uuid(),
            'organization_id' => $org->id,
            'name' => 'VIP Lead Onboarding Workflow',
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
                    'type' => 'action',
                    'label' => 'Add VIP Tag',
                    'data' => ['action_type' => 'add_tag', 'tag' => 'vip-lead']
                ],
                [
                    'id' => 'node-3',
                    'type' => 'action',
                    'label' => 'Assign Followup Task',
                    'data' => [
                        'action_type' => 'create_task',
                        'title' => 'Follow up with Sarah Connor',
                        'priority' => 'high',
                        'due_days' => 1
                    ]
                ]
            ],
            'edges' => [
                ['source' => 'node-1', 'target' => 'node-2'],
                ['source' => 'node-2', 'target' => 'node-3']
            ]
        ]);

        // 4. Customer asks AI to create their contact record
        $llmService = new LlmOrchestratorService();
        $aiResponse = $llmService->processMessage(
            $org->id,
            $conversation->id,
            "Please add me to your CRM contacts. My name is Sarah Connor, email sarah.connor@cyberdyne.com, phone +15550192834",
            'sales',
            $customer->name
        );

        // Assert AI invoked the tool
        $this->assertNotNull($aiResponse['toolExecuted']);
        $this->assertEquals('create_contact', $aiResponse['toolExecuted']['toolName']);
        $this->assertTrue($aiResponse['toolExecuted']['result']['success']);

        // Assert real database mutation
        $contact = Contact::where('organization_id', $org->id)
            ->where('email', 'sarah.connor@cyberdyne.com')
            ->first();
        $this->assertNotNull($contact);
        $this->assertEquals('Sarah', $contact->first_name);

        // Assert Audit Log recorded the tool execution
        $this->assertDatabaseHas('audit_logs', [
            'organization_id' => $org->id,
            'action' => 'ai_tool_executed'
        ]);

        // 5. Trigger Workflow Engine for the newly created contact
        $engine = new WorkflowEngine();
        $execution = $engine->startExecution(
            $workflow,
            'ContactCreated',
            'contact',
            $contact->id,
            ['name' => $contact->first_name . ' ' . $contact->last_name, 'email' => $contact->email]
        );

        $this->assertNotNull($execution);
        $this->assertEquals('completed', $execution->status);

        // 6. Verify Workflow actions completed: Tag added and Task created in real DB
        $this->assertTrue($contact->fresh()->tags()->where('name', 'vip-lead')->exists());
        $this->assertTrue(Task::where('contact_id', $contact->id)->where('title', 'Follow up with Sarah Connor')->exists());

        // 7. Verify AI informs customer cleanly
        $this->assertNotEmpty($aiResponse['reply']);
        $this->assertStringContainsString('Sarah Connor', $aiResponse['reply']);
    }
}
