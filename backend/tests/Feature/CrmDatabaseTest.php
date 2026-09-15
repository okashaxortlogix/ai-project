<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\Organization;
use App\Models\Contact;
use App\Models\Company;
use App\Models\Pipeline;
use App\Models\PipelineStage;
use App\Models\Opportunity;
use App\Models\Task;
use App\Models\Tag;
use App\Models\CustomObject;
use App\Models\CustomObjectRecord;
use App\Models\Association;
use Illuminate\Support\Str;

class CrmDatabaseTest extends TestCase
{
    public function test_crm_entities_and_relationships_persist_correctly(): void
    {
        // 1. Create Organization
        $org = Organization::create([
            'id' => (string) Str::uuid(),
            'name' => 'Acme Corporation',
            'slug' => 'acme-corp',
            'timezone' => 'America/New_York',
            'status' => 'active'
        ]);

        $this->assertDatabaseHas('organizations', ['id' => $org->id, 'name' => 'Acme Corporation']);

        // 2. Create Contact
        $contact = Contact::create([
            'id' => (string) Str::uuid(),
            'organization_id' => $org->id,
            'first_name' => 'Sarah',
            'last_name' => 'Connor',
            'email' => 'sarah@cyberdyne.com',
            'phone' => '+1 555 0199',
            'source' => 'Website',
            'status' => 'Hot',
            'score' => 95
        ]);

        $this->assertDatabaseHas('contacts', ['id' => $contact->id, 'email' => 'sarah@cyberdyne.com']);
        $this->assertEquals('Sarah Connor', $contact->name);

        // 3. Create Company and Associate Contact
        $company = Company::create([
            'id' => (string) Str::uuid(),
            'organization_id' => $org->id,
            'name' => 'Cyberdyne Systems',
            'domain' => 'cyberdyne.com',
            'industry' => 'Defense & AI'
        ]);

        $company->contacts()->attach($contact->id, ['role' => 'VP Operations', 'is_primary' => true]);

        $this->assertCount(1, $company->contacts);
        $this->assertEquals('VP Operations', $company->contacts->first()->pivot->role);

        // 4. Create Tags
        $tag = Tag::create(['id' => (string) Str::uuid(), 'organization_id' => $org->id, 'name' => 'Enterprise']);
        $contact->tags()->attach($tag->id);

        $this->assertCount(1, $contact->tags);
        $this->assertEquals('Enterprise', $contact->tags->first()->name);

        // 5. Create Pipeline and Stages
        $pipeline = Pipeline::create([
            'id' => (string) Str::uuid(),
            'organization_id' => $org->id,
            'name' => 'Enterprise Sales',
            'is_default' => true
        ]);

        $stageQualified = PipelineStage::create([
            'id' => (string) Str::uuid(),
            'pipeline_id' => $pipeline->id,
            'name' => 'Qualified',
            'order' => 1,
            'probability' => 40
        ]);

        $stageProposal = PipelineStage::create([
            'id' => (string) Str::uuid(),
            'pipeline_id' => $pipeline->id,
            'name' => 'Proposal Sent',
            'order' => 2,
            'probability' => 70
        ]);

        // 6. Create Opportunity and Move Stage
        $deal = Opportunity::create([
            'id' => (string) Str::uuid(),
            'organization_id' => $org->id,
            'contact_id' => $contact->id,
            'company_id' => $company->id,
            'pipeline_id' => $pipeline->id,
            'stage_id' => $stageQualified->id,
            'title' => 'Cyberdyne AI Defense Contract',
            'value' => 250000.00,
            'status' => 'open'
        ]);

        $this->assertDatabaseHas('opportunities', ['id' => $deal->id, 'value' => 250000.00]);

        $deal->update(['stage_id' => $stageProposal->id]);
        $this->assertEquals($stageProposal->id, $deal->fresh()->stage_id);

        // 7. Create Task Associated with Deal & Contact
        $task = Task::create([
            'id' => (string) Str::uuid(),
            'organization_id' => $org->id,
            'contact_id' => $contact->id,
            'opportunity_id' => $deal->id,
            'title' => 'Deliver final proposal slides',
            'priority' => 'high',
            'status' => 'pending'
        ]);

        $this->assertDatabaseHas('tasks', ['id' => $task->id, 'priority' => 'high']);

        // 8. Custom Object and Record Association
        $customObj = CustomObject::create([
            'id' => (string) Str::uuid(),
            'organization_id' => $org->id,
            'name' => 'Property',
            'slug' => 'property',
            'singular_name' => 'Property'
        ]);

        $record = CustomObjectRecord::create([
            'id' => (string) Str::uuid(),
            'custom_object_id' => $customObj->id,
            'organization_id' => $org->id,
            'data' => ['address' => '742 Evergreen Terrace', 'price' => 450000, 'bedrooms' => 4]
        ]);

        $assoc = Association::create([
            'id' => (string) Str::uuid(),
            'organization_id' => $org->id,
            'source_type' => 'custom_object_record',
            'source_id' => $record->id,
            'target_type' => 'contact',
            'target_id' => $contact->id,
            'relationship_name' => 'interested_buyer'
        ]);

        $this->assertDatabaseHas('associations', ['id' => $assoc->id, 'relationship_name' => 'interested_buyer']);
    }
}
