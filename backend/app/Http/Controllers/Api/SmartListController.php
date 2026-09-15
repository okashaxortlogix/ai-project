<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\SmartList;
use Illuminate\Support\Str;

class SmartListController extends Controller
{
    /**
     * List all smart lists for the tenant.
     */
    public function index(Request $request)
    {
        $orgId = $request->user()->organization_id;
        $smartLists = SmartList::where('organization_id', $orgId)
            ->orderBy('created_at', 'asc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $smartLists
        ]);
    }

    /**
     * Create a new smart list definition.
     */
    public function store(Request $request)
    {
        $orgId = $request->user()->organization_id;
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'entity_type' => 'nullable|string|in:contact,opportunity,lead',
            'filters' => 'nullable|array',
            'columns' => 'nullable|array'
        ]);

        $smartList = SmartList::create([
            'id' => (string) Str::uuid(),
            'organization_id' => $orgId,
            'name' => $validated['name'],
            'entity_type' => $validated['entity_type'] ?? 'contact',
            'filters' => $validated['filters'] ?? [],
            'columns' => $validated['columns'] ?? ['name', 'email', 'phone', 'status', 'score', 'tags'],
            'created_by' => $request->user()->id ?? null
        ]);

        return response()->json([
            'success' => true,
            'data' => $smartList
        ], 201);
    }

    /**
     * Retrieve a specific smart list.
     */
    public function show(Request $request, string $id)
    {
        $orgId = $request->user()->organization_id;
        $smartList = SmartList::where('organization_id', $orgId)->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $smartList
        ]);
    }

    /**
     * Update an existing smart list.
     */
    public function update(Request $request, string $id)
    {
        $orgId = $request->user()->organization_id;
        $smartList = SmartList::where('organization_id', $orgId)->findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'filters' => 'nullable|array',
            'columns' => 'nullable|array'
        ]);

        $smartList->update($validated);

        return response()->json([
            'success' => true,
            'data' => $smartList
        ]);
    }

    /**
     * Delete a smart list.
     */
    public function destroy(Request $request, string $id)
    {
        $orgId = $request->user()->organization_id;
        $smartList = SmartList::where('organization_id', $orgId)->findOrFail($id);
        $smartList->delete();

        return response()->json([
            'success' => true,
            'message' => 'Smart list deleted successfully.'
        ]);
    }
}
