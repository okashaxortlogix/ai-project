<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\Organization;
use App\Models\Contact;
use App\Models\Opportunity;
use App\Tools\ToolRegistry;
use Illuminate\Support\Str;

class TenantIsolationTest extends TestCase
{
    public function test_tenant_boundaries_strictly_prevent_cross_tenant_leakage(): void
    {
        // 1. Create Organization Alpha and Contact
        $orgAlpha = Organization::create([
            'id' => (string) Str::uuid(),
            'name' => 'Alpha Corp',
            'slug' => 'alpha-corp',
            'status' => 'active'
        ]);

        $contactAlpha = Contact::create([
            'id' => (string) Str::uuid(),
            'organization_id' => $orgAlpha->id,
            'first_name' => 'Alice',
            'last_name' => 'Alpha',
            'email' => 'alice@alpha.com'
        ]);

        // 2. Create Organization Beta and Contact
        $orgBeta = Organization::create([
            'id' => (string) Str::uuid(),
            'name' => 'Beta Corp',
            'slug' => 'beta-corp',
            'status' => 'active'
        ]);

        $contactBeta = Contact::create([
            'id' => (string) Str::uuid(),
            'organization_id' => $orgBeta->id,
            'first_name' => 'Bob',
            'last_name' => 'Beta',
            'email' => 'bob@beta.com'
        ]);

        $registry = new ToolRegistry();

        // 3. Search contacts as Org Alpha -> must NOT see Bob Beta
        $resAlphaSearch = $registry->execute('assistant', 'search_contacts', ['query' => ''], null, $orgAlpha->id);
        $this->assertTrue($resAlphaSearch['success']);
        $this->assertEquals(1, $resAlphaSearch['count']);
        $this->assertEquals('Alice Alpha', $resAlphaSearch['data']->first()->name);

        // 4. Org Alpha attempt to fetch Org Beta contact -> must fail
        $resForbiddenGet = $registry->execute('assistant', 'get_contact', ['contact_id' => $contactBeta->id], null, $orgAlpha->id);
        $this->assertFalse($resForbiddenGet['success']);
        $this->assertEquals('Contact not found.', $resForbiddenGet['error']);
    }
}
