<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Organization;

class OrganizationController extends Controller
{
    public function index(Request $request)
    {
        $userOrgId = $request->user()->organization_id;
        $orgs = Organization::where('id', $userOrgId)->get();
        return response()->json(['success' => true, 'data' => $orgs]);
    }

    public function show(Request $request, string $id)
    {
        $userOrgId = $request->user()->organization_id;
        if ($id !== $userOrgId) {
            return response()->json(['success' => false, 'message' => 'Organization not found.'], 404);
        }

        return response()->json(['success' => true, 'data' => Organization::findOrFail($id)]);
    }

    public function update(Request $request, string $id)
    {
        $userOrgId = $request->user()->organization_id;
        if ($id !== $userOrgId) {
            return response()->json(['success' => false, 'message' => 'Forbidden: Cannot modify another organization.'], 403);
        }

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'timezone' => 'nullable|string|max:100',
            'settings_json' => 'nullable|array',
            'slug' => 'nullable|string|max:100'
        ]);

        $org = Organization::findOrFail($id);
        $org->update($validated);
        return response()->json(['success' => true, 'data' => $org]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'timezone' => 'nullable|string|max:100',
            'settings_json' => 'nullable|array'
        ]);

        $org = Organization::create([
            'id' => (string) \Illuminate\Support\Str::uuid(),
            'name' => $validated['name'],
            'slug' => \Illuminate\Support\Str::slug($validated['name']) . '-' . \Illuminate\Support\Str::random(4),
            'timezone' => $validated['timezone'] ?? 'UTC',
            'settings_json' => $validated['settings_json'] ?? ['theme' => 'light'],
            'status' => 'active'
        ]);

        // Provision default pipeline for new sub-account/organization
        $pipeline = \App\Models\Pipeline::create([
            'organization_id' => $org->id,
            'name' => 'Sales Pipeline',
            'is_default' => true
        ]);

        $stages = [
            ['name' => 'New Lead', 'order' => 0],
            ['name' => 'Contacted', 'order' => 1],
            ['name' => 'Qualified', 'order' => 2],
            ['name' => 'Proposal Sent', 'order' => 3],
            ['name' => 'Won', 'order' => 4],
            ['name' => 'Lost', 'order' => 5],
        ];
        foreach ($stages as $stage) {
            \App\Models\PipelineStage::create([
                'pipeline_id' => $pipeline->id,
                'name' => $stage['name'],
                'order' => $stage['order']
            ]);
        }

        return response()->json(['success' => true, 'data' => $org], 201);
    }

    public function destroy(Request $request, string $id)
    {
        $userOrgId = $request->user()->organization_id;
        if ($id !== $userOrgId) {
            return response()->json(['success' => false, 'message' => 'Forbidden: Cannot delete another organization.'], 403);
        }

        $org = Organization::findOrFail($id);
        $org->delete();
        return response()->json(['success' => true, 'message' => 'Organization deleted successfully.']);
    }
}
