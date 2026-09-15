<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\Organization;
use App\Models\Contact;
use App\Models\Pipeline;
use App\Models\PipelineStage;
use App\Models\Opportunity;
use App\Models\Task;
use App\Models\ToolExecution;
use App\Tools\ToolRegistry;
use Illuminate\Support\Str;

class AiToolRegistryTest extends TestCase
{
    public function test_ai_tools_execute_real_crm_mutations_with_audit_log(): void
    {
        $org = Organization::create([
            'id' => (string) Str::uuid(),
            'name' => 'AI Test Org',
            'slug' => 'ai-test-org',
            'timezone' => 'UTC',
            'status' => 'active'
        ]);

        $pipeline = Pipeline::create([
            'id' => (string) Str::uuid(),
            'organization_id' => $org->id,
            'name' => 'Standard Pipeline'
        ]);

        PipelineStage::create([
            'id' => (string) Str::uuid(),
            'pipeline_id' => $pipeline->id,
            'name' => 'Qualified'
        ]);

        $registry = new ToolRegistry();

        // 1. Test create_contact via AI tool
        $resCreate = $registry->execute('assistant', 'create_contact', [
            'first_name' => 'Harold',
            'last_name' => 'Finch',
            'email' => 'finch@ift.com',
            'phone' => '+1 212 555 0100'
        ], null, $org->id);

        $this->assertTrue($resCreate['success']);
        $contactId = $resCreate['data']->id;
        $this->assertDatabaseHas('contacts', ['id' => $contactId, 'email' => 'finch@ift.com']);

        // 2. Test search_contacts via AI tool
        $resSearch = $registry->execute('assistant', 'search_contacts', [
            'query' => 'Finch'
        ], null, $org->id);

        $this->assertTrue($resSearch['success']);
        $this->assertEquals(1, $resSearch['count']);

        // 3. Test add_tag via AI tool
        $resTag = $registry->execute('assistant', 'add_tag', [
            'contact_id' => $contactId,
            'tag' => 'Key Contact'
        ], null, $org->id);

        $this->assertTrue($resTag['success']);
        $contact = Contact::find($contactId);
        $this->assertTrue($contact->tags()->where('name', 'Key Contact')->exists());

        // 4. Test create_opportunity via AI tool
        $resOpp = $registry->execute('assistant', 'create_opportunity', [
            'title' => 'IFT Software License',
            'value' => 50000,
            'contact_id' => $contactId
        ], null, $org->id);

        $this->assertTrue($resOpp['success']);
        $this->assertDatabaseHas('opportunities', ['title' => 'IFT Software License', 'value' => 50000]);

        // 5. Test create_task via AI tool
        $resTask = $registry->execute('assistant', 'create_task', [
            'title' => 'Follow up on IFT agreement',
            'contact_id' => $contactId,
            'priority' => 'urgent'
        ], null, $org->id);

        $this->assertTrue($resTask['success']);
        $this->assertDatabaseHas('tasks', ['title' => 'Follow up on IFT agreement', 'priority' => 'urgent']);

        // 6. Test pipeline_report via AI tool
        $resReport = $registry->execute('assistant', 'pipeline_report', [], null, $org->id);
        $this->assertTrue($resReport['success']);
        $this->assertEquals(1, $resReport['total_deals']);
        $this->assertEquals(50000, $resReport['total_value']);

        // 7. Verify persistent tool execution audit records were logged
        $executions = ToolExecution::where('organization_id', $org->id)->get();
        $this->assertGreaterThanOrEqual(6, $executions->count());
        $this->assertTrue($executions->every(fn($e) => $e->status === 'success'));
    }
}
