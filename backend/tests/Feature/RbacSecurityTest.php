<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\Organization;
use App\Models\User;
use App\Models\Contact;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;

class RbacSecurityTest extends TestCase
{
    use RefreshDatabase;

    public function test_viewer_role_cannot_perform_admin_or_manager_actions()
    {
        $org = Organization::create([
            'id' => (string) Str::uuid(),
            'name' => 'RBAC Org',
            'slug' => 'rbac-org',
            'settings' => ['timezone' => 'UTC']
        ]);

        $viewer = User::create([
            'id' => (string) Str::uuid(),
            'organization_id' => $org->id,
            'name' => 'Viewer User',
            'email' => 'viewer@rbac.com',
            'password' => bcrypt('secret123'),
            'password_hash' => bcrypt('secret123'),
            'role' => 'Viewer'
        ]);

        $admin = User::create([
            'id' => (string) Str::uuid(),
            'organization_id' => $org->id,
            'name' => 'Admin User',
            'email' => 'admin@rbac.com',
            'password' => bcrypt('secret123'),
            'password_hash' => bcrypt('secret123'),
            'role' => 'Admin'
        ]);

        $contact = Contact::create([
            'id' => (string) Str::uuid(),
            'organization_id' => $org->id,
            'first_name' => 'Target',
            'last_name' => 'Contact',
            'email' => 'target@example.com'
        ]);

        // 1. Viewer cannot delete contact (requires Admin or Manager) -> 403
        $resp1 = $this->actingAs($viewer, 'sanctum')
            ->withHeaders(['X-Organization-Id' => $org->id])
            ->deleteJson("/api/v1/contacts/{$contact->id}");
        $resp1->assertStatus(403);
        $this->assertFalse($resp1->json('success'));

        // 2. Viewer cannot update organization settings (requires Admin) -> 403
        $resp2 = $this->actingAs($viewer, 'sanctum')
            ->withHeaders(['X-Organization-Id' => $org->id])
            ->patchJson("/api/v1/organizations/{$org->id}", [
                'name' => 'Hacked Org Name'
            ]);
        $resp2->assertStatus(403);

        // 3. Viewer cannot connect an integration (requires Admin) -> 403
        $resp3 = $this->actingAs($viewer, 'sanctum')
            ->withHeaders(['X-Organization-Id' => $org->id])
            ->postJson("/api/v1/integrations/shopify/connect", [
                'storeDomain' => 'test.myshopify.com'
            ]);
        $resp3->assertStatus(403);

        // 4. Admin CAN delete contact -> 200
        $resp4 = $this->actingAs($admin, 'sanctum')
            ->withHeaders(['X-Organization-Id' => $org->id])
            ->deleteJson("/api/v1/contacts/{$contact->id}");
        $resp4->assertStatus(200);
        $this->assertDatabaseMissing('contacts', ['id' => $contact->id]);
    }
}
