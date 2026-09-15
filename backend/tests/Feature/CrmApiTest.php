<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\Organization;
use App\Models\User;
use App\Models\Pipeline;
use App\Models\PipelineStage;
use App\Models\Workflow;
use App\Models\WorkflowVersion;
use Laravel\Sanctum\Sanctum;
use Illuminate\Support\Str;

class CrmApiTest extends TestCase
{
    protected Organization $org;
    protected User $user;

    protected function setUp(): void
    {
        parent::setUp();

        $this->org = Organization::create([
            'id' => (string) Str::uuid(),
            'name' => 'API Test Organization',
            'slug' => 'api-test-org',
            'status' => 'active'
        ]);

        $this->user = User::create([
            'id' => (string) Str::uuid(),
            'name' => 'Test User',
            'email' => 'tester@apiorg.com',
            'password_hash' => bcrypt('secret123'),
            'role' => 'Admin',
            'status' => 'active'
        ]);

        $this->user->organization_id = $this->org->id;
        Sanctum::actingAs($this->user);
    }

    public function test_contact_endpoints_crud_and_duplicates(): void
    {
        // 1. Create Contact via API
        $response = $this->postJson('/api/v1/contacts', [
            'first_name' => 'Michael',
            'last_name' => 'Scott',
            'email' => 'michael@dundermifflin.com',
            'phone' => '+1 570 555 0199',
            'source' => 'Direct',
            'score' => 90
        ], ['X-Organization-Id' => $this->org->id]);

        $response->assertStatus(201);
        $response->assertJsonPath('success', true);
        $contactId = $response->json('data.id');

        // 2. Fetch Contact List
        $listResponse = $this->getJson('/api/v1/contacts?search=Michael', [
            'X-Organization-Id' => $this->org->id
        ]);
        $listResponse->assertStatus(200);
        $this->assertCount(1, $listResponse->json('data'));

        // 3. Update Contact
        $updateResponse = $this->patchJson("/api/v1/contacts/{$contactId}", [
            'status' => 'Hot',
            'score' => 100
        ]);
        $updateResponse->assertStatus(200);
        $this->assertEquals('Hot', $updateResponse->json('data.status'));
    }

    public function test_workflow_endpoints_and_real_execution(): void
    {
        // 1. Create Workflow via API
        $wfResponse = $this->postJson('/api/v1/workflows', [
            'name' => 'Lead Welcome API Flow',
            'trigger_type' => 'ContactCreated',
            'nodes' => [
                ['id' => 'n1', 'type' => 'trigger', 'label' => 'Start Trigger'],
                ['id' => 'n2', 'type' => 'action', 'label' => 'Log Activity Action', 'data' => ['action_type' => 'log_activity']]
            ],
            'edges' => [
                ['source' => 'n1', 'target' => 'n2']
            ]
        ], ['X-Organization-Id' => $this->org->id]);

        $wfResponse->assertStatus(201);
        $workflowId = $wfResponse->json('data.id');

        // 2. Publish Workflow
        $pubResponse = $this->postJson("/api/v1/workflows/{$workflowId}/toggle-publish");
        $pubResponse->assertStatus(200);
        $this->assertEquals('published', $pubResponse->json('status'));

        // 3. Trigger Real Execution via API
        $execResponse = $this->postJson("/api/v1/workflows/{$workflowId}/execute", [
            'context' => ['source' => 'API Integration Test']
        ]);
        $execResponse->assertStatus(200);
        $execResponse->assertJsonPath('success', true);
        $this->assertEquals('completed', $execResponse->json('data.status'));
        $this->assertCount(2, $execResponse->json('data.steps'));

        // 4. Fetch Execution History
        $histResponse = $this->getJson("/api/v1/workflows/{$workflowId}/executions");
        $histResponse->assertStatus(200);
        $this->assertGreaterThanOrEqual(1, count($histResponse->json('data')));
    }
}
