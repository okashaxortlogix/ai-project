<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\Organization;
use App\Models\User;
use App\Models\KnowledgeDocument;
use App\Services\Knowledge\RAGService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;

class RAGPipelineTest extends TestCase
{
    use RefreshDatabase;

    public function test_rag_service_indexes_chunks_with_tenant_metadata_and_performs_search()
    {
        $org = Organization::create([
            'id' => (string) Str::uuid(),
            'name' => 'Knowledge Org',
            'slug' => 'knowledge-org',
            'settings' => ['timezone' => 'UTC']
        ]);

        $user = User::create([
            'id' => (string) Str::uuid(),
            'organization_id' => $org->id,
            'name' => 'Knowledge Admin',
            'email' => 'admin@knowledge.com',
            'password' => bcrypt('secret123'),
            'password_hash' => bcrypt('secret123'),
            'role' => 'Admin'
        ]);

        $doc = KnowledgeDocument::create([
            'organization_id' => $org->id,
            'title' => 'Return Policy and Warranty Guide',
            'type' => 'document',
            'storage_path' => 'docs/return_policy.txt',
            'content' => "Our store offers a 30-day money-back guarantee on all physical merchandise.\n\nCustomers requesting a refund must provide their order number and original receipt.\n\nLifetime warranty applies to all mechanical defect items with verified warranty registration.",
            'status' => 'indexed'
        ]);

        $rag = new RAGService();
        $chunks = $rag->indexDocument($doc);

        $this->assertCount(3, $chunks);
        $this->assertDatabaseHas('knowledge_chunks', [
            'organization_id' => $org->id,
            'document_id' => $doc->id,
        ]);

        // Semantic query through API endpoint
        $response = $this->actingAs($user, 'sanctum')
            ->withHeaders(['X-Organization-Id' => $org->id])
            ->postJson('/api/v1/knowledge/query', [
                'query' => 'What is the refund and return policy?'
            ]);

        $response->assertStatus(200);
        $this->assertTrue($response->json('success'));
        $results = $response->json('results');
        $this->assertNotEmpty($results);
        $this->assertStringContainsString('30-day money-back guarantee', $results[0]['content']);
    }
}
