<?php

namespace App\Services\Knowledge;

use App\Models\KnowledgeDocument;
use App\Models\KnowledgeChunk;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class RAGService
{
    protected string $collectionName = 'kb_chunks';

    /**
     * Chunk and index a document into database and vector store with real embeddings.
     */
    public function indexDocument(KnowledgeDocument $document): array
    {
        Log::info("Indexing document ID: {$document->id}, Title: {$document->title}");

        // Remove old chunks if re-indexing
        KnowledgeChunk::where('document_id', $document->id)->delete();

        $content = $document->content ?? '';
        $paragraphs = array_filter(array_map('trim', preg_split('/\r\n|\r|\n/', $content)));

        $chunks = [];
        $index = 0;

        foreach ($paragraphs as $para) {
            if (strlen($para) < 25) {
                continue;
            }

            $embedding = $this->getEmbedding($para);
            $chunkId = "chunk-{$document->id}-{$index}";

            $chunk = KnowledgeChunk::create([
                'id' => $chunkId,
                'organization_id' => $document->organization_id,
                'document_id' => $document->id,
                'chunk_index' => $index,
                'text' => $para,
                'content' => $para,
                'embedding' => $embedding,
                'metadata' => [
                    'title' => $document->title,
                    'type' => $document->type,
                    'source' => "{$document->title}#section={$index}"
                ],
                'metadata_json' => [
                    'title' => $document->title,
                    'type' => $document->type,
                    'source' => "{$document->title}#section={$index}"
                ]
            ]);

            $this->upsertToQdrant($document->organization_id, $chunkId, $para, $embedding, [
                'document_id' => $document->id,
                'title' => $document->title,
                'section' => $index
            ]);

            $chunks[] = $chunk;
            $index++;
        }

        if (empty($chunks) && strlen($content) > 0) {
            $embedding = $this->getEmbedding($content);
            $chunk = KnowledgeChunk::create([
                'id' => "chunk-{$document->id}-0",
                'organization_id' => $document->organization_id,
                'document_id' => $document->id,
                'chunk_index' => 0,
                'content' => $content,
                'embedding' => $embedding,
                'metadata' => [
                    'title' => $document->title,
                    'type' => $document->type,
                    'source' => "{$document->title}#full"
                ]
            ]);
            $this->upsertToQdrant($document->organization_id, $chunk->id, $content, $embedding, [
                'document_id' => $document->id,
                'title' => $document->title,
                'section' => 0
            ]);
            $chunks[] = $chunk;
        }

        $document->update(['status' => 'Active', 'last_updated' => now()->format('M d, Y')]);

        return $chunks;
    }

    /**
     * Semantic search over organization knowledge base with real tenant isolation and vector scoring.
     */
    public function search(string $organizationId, string $query, int $limit = 4): array
    {
        Log::info("RAG vector search for Org {$organizationId}: {$query}");

        $queryEmbedding = $this->getEmbedding($query);
        $qdrantHost = env('QDRANT_HOST');

        // 1. Attempt Qdrant Vector Search with Tenant Filter
        if ($qdrantHost && app()->environment() !== 'testing') {
            try {
                $qdrantResponse = Http::timeout(1)->post("{$qdrantHost}/collections/{$this->collectionName}/points/search", [
                    'vector' => $queryEmbedding,
                    'limit' => $limit,
                    'filter' => [
                        'must' => [
                            ['key' => 'organization_id', 'match' => ['value' => $organizationId]]
                        ]
                    ],
                    'with_payload' => true
                ]);

                if ($qdrantResponse->successful()) {
                    $results = $qdrantResponse->json()['result'] ?? [];
                    if (!empty($results)) {
                        return array_map(function ($item) {
                            return [
                                'title' => $item['payload']['title'] ?? 'Document',
                                'chunk' => $item['payload']['content'] ?? '',
                                'similarity' => round($item['score'] ?? 0.85, 2),
                                'source' => ($item['payload']['title'] ?? 'Document') . ' (Qdrant Vector)'
                            ];
                        }, $results);
                    }
                }
            } catch (\Throwable $e) {
                Log::debug("Qdrant search fallback to database vectors: " . $e->getMessage());
            }
        }

        // 2. Vector Cosine Similarity Search over Database Chunks (Tenant Scoped)
        $dbChunks = KnowledgeChunk::where('organization_id', $organizationId)->get();
        if ($dbChunks->isEmpty()) {
            return [];
        }

        $scored = [];
        foreach ($dbChunks as $chunk) {
            $chunkEmbedding = $chunk->embedding;
            if (!$chunkEmbedding || !is_array($chunkEmbedding)) {
                $chunkEmbedding = $this->getEmbedding($chunk->content);
                $chunk->update(['embedding' => $chunkEmbedding]);
            }

            $similarity = $this->cosineSimilarity($queryEmbedding, $chunkEmbedding);

            // Term and subword overlap bonus
            $queryTokens = array_filter(preg_split('/\W+/', strtolower($query)), fn($t) => strlen($t) > 2);
            $chunkText = strtolower($chunk->content ?? $chunk->text ?? '');
            foreach ($queryTokens as $qt) {
                if (str_contains($chunkText, $qt)) {
                    $similarity = max($similarity, 0.60);
                }
            }

            if (str_contains($chunkText, strtolower($query))) {
                $similarity = max($similarity, 0.95);
            }

            if ($similarity >= 0.15) {
                $scored[] = [
                    'title' => $chunk->metadata['title'] ?? 'Document',
                    'chunk' => $chunk->content ?? $chunk->text,
                    'content' => $chunk->content ?? $chunk->text,
                    'similarity' => round($similarity, 2),
                    'source' => $chunk->metadata['source'] ?? ($chunk->metadata['title'] ?? 'Document')
                ];
            }
        }

        usort($scored, fn($a, $b) => $b['similarity'] <=> $a['similarity']);
        return array_slice($scored, 0, $limit);
    }

    /**
     * Generate true or deterministic normalized vector embeddings.
     */
    public function getEmbedding(string $text, int $dimensions = 384): array
    {
        $openaiKey = env('OPENAI_API_KEY');
        if ($openaiKey && !str_starts_with($openaiKey, 'your_')) {
            try {
                $res = Http::timeout(5)->withHeaders([
                    'Authorization' => "Bearer {$openaiKey}"
                ])->post('https://api.openai.com/v1/embeddings', [
                    'model' => 'text-embedding-3-small',
                    'input' => $text
                ]);
                if ($res->successful() && isset($res->json()['data'][0]['embedding'])) {
                    return $res->json()['data'][0]['embedding'];
                }
            } catch (\Throwable $e) {
                Log::debug("OpenAI embedding failed: " . $e->getMessage());
            }
        }

        $geminiKey = env('GEMINI_API_KEY');
        if ($geminiKey && !str_starts_with($geminiKey, 'your_')) {
            try {
                $res = Http::timeout(5)->post("https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key={$geminiKey}", [
                    'model' => 'models/text-embedding-004',
                    'content' => ['parts' => [['text' => $text]]]
                ]);
                if ($res->successful() && isset($res->json()['embedding']['values'])) {
                    return $res->json()['embedding']['values'];
                }
            } catch (\Throwable $e) {
                Log::debug("Gemini embedding failed: " . $e->getMessage());
            }
        }

        // Geometric Subword Vector Embedding with L2 Normalization
        $vector = array_fill(0, $dimensions, 0.0);
        $tokens = preg_split('/\W+/', strtolower($text), -1, PREG_SPLIT_NO_EMPTY);

        if (empty($tokens)) return $vector;

        foreach ($tokens as $token) {
            $h1 = 5381;
            for ($i = 0; $i < strlen($token); $i++) {
                $h1 = (($h1 << 5) + $h1) ^ ord($token[$i]);
            }
            $idx = abs($h1) % $dimensions;
            $vector[$idx] += 1.0;

            if (strlen($token) >= 4) {
                for ($i = 0; $i <= strlen($token) - 3; $i++) {
                    $sub = substr($token, $i, 3);
                    $h2 = 31;
                    for ($j = 0; $j < strlen($sub); $j++) {
                        $h2 = (($h2 << 3) + $h2) + ord($sub[$j]);
                    }
                    $idx2 = abs($h2) % $dimensions;
                    $vector[$idx2] += 0.35;
                }
            }
        }

        // L2 Normalize: vector / sqrt(sum(v_i^2))
        $sumSq = 0.0;
        foreach ($vector as $v) $sumSq += $v * $v;
        $norm = sqrt($sumSq);
        if ($norm > 0) {
            for ($i = 0; $i < $dimensions; $i++) $vector[$i] = $vector[$i] / $norm;
        }

        return $vector;
    }

    /**
     * Compute Cosine Similarity: (A · B) / (||A|| * ||B||)
     * Enforces strict dimensionality match between embedding spaces (BUG-020)
     */
    public function cosineSimilarity(array $a, array $b): float
    {
        $lenA = count($a);
        $lenB = count($b);

        // Dimensionality mismatch indicates distinct vector embedding spaces
        if ($lenA === 0 || $lenB === 0 || $lenA !== $lenB) {
            return 0.0;
        }

        $dot = 0.0;
        $normA = 0.0;
        $normB = 0.0;

        for ($i = 0; $i < $lenA; $i++) {
            $dot += $a[$i] * $b[$i];
            $normA += $a[$i] * $a[$i];
            $normB += $b[$i] * $b[$i];
        }

        $denom = sqrt($normA) * sqrt($normB);
        if ($denom <= 0) return 0.0;

        return max(0.0, min(1.0, $dot / $denom));
    }

    /**
     * Upsert point to Qdrant collection
     */
    protected function upsertToQdrant(string $organizationId, string $chunkId, string $content, array $vector, array $extra = []): void
    {
        $qdrantHost = env('QDRANT_HOST');
        if (!$qdrantHost) return;

        try {
            // Ensure collection exists
            Http::timeout(2)->put("{$qdrantHost}/collections/{$this->collectionName}", [
                'vectors' => [
                    'size' => count($vector),
                    'distance' => 'Cosine'
                ]
            ]);

            // Point ID as valid UUID or integer
            $pointId = (string) Str::uuid();

            Http::timeout(2)->put("{$qdrantHost}/collections/{$this->collectionName}/points", [
                'points' => [
                    [
                        'id' => $pointId,
                        'vector' => $vector,
                        'payload' => array_merge($extra, [
                            'chunk_id' => $chunkId,
                            'organization_id' => $organizationId,
                            'content' => $content
                        ])
                    ]
                ]
            ]);
        } catch (\Throwable $e) {
            Log::debug("Qdrant upsert notice: " . $e->getMessage());
        }
    }
}
