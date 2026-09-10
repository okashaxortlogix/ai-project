<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\KnowledgeDocument;
use App\Services\RAGService;

class KnowledgeController extends Controller
{
    public function index(Request $request)
    {
        $orgId = $request->header('X-Organization-Id', 'org-acme-1');
        $docs = KnowledgeDocument::where('organization_id', $orgId)->get();

        return response()->json([
            'success' => true,
            'data' => $docs,
            'meta' => ['total' => $docs->count(), 'organization_id' => $orgId]
        ]);
    }

    public function store(Request $request)
    {
        $orgId = $request->header('X-Organization-Id', 'org-acme-1');
        $validated = $request->validate([
            'title' => 'required|string',
            'type' => 'nullable|string',
            'content' => 'nullable|string',
            'file' => 'nullable|file'
        ]);

        $content = $validated['content'] ?? 'Indexed content for ' . $validated['title'];

        $doc = KnowledgeDocument::create([
            'id' => 'doc-' . time(),
            'organization_id' => $orgId,
            'title' => $validated['title'],
            'type' => $validated['type'] ?? 'Policy',
            'status' => 'Active',
            'size' => '1.2 MB',
            'content' => $content
        ]);

        // Trigger RAG indexing
        $rag = new RAGService();
        $rag->indexDocument($doc);

        return response()->json(['success' => true, 'data' => $doc], 201);
    }

    public function show(string $id)
    {
        $doc = KnowledgeDocument::findOrFail($id);
        return response()->json(['success' => true, 'data' => $doc]);
    }

    public function destroy(string $id)
    {
        $doc = KnowledgeDocument::findOrFail($id);
        $doc->delete();

        return response()->json([
            'success' => true,
            'message' => 'Document successfully removed from vector index.'
        ]);
    }

    public function reindex(string $id)
    {
        $doc = KnowledgeDocument::findOrFail($id);
        $rag = new RAGService();
        $rag->indexDocument($doc);

        return response()->json([
            'success' => true,
            'message' => "Document {$doc->title} successfully reindexed."
        ]);
    }

    public function semanticQuery(Request $request)
    {
        $validated = $request->validate(['query' => 'required|string']);
        $orgId = $request->header('X-Organization-Id', 'org-acme-1');

        $rag = new RAGService();
        $result = $rag->search($orgId, $validated['query']);

        return response()->json(['success' => true, 'data' => $result]);
    }
}
