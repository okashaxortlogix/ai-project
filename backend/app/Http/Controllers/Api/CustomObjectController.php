<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CustomObject;
use App\Models\CustomObjectField;
use App\Models\CustomObjectRecord;
use App\Models\Association;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class CustomObjectController extends Controller
{
    /**
     * List all custom object schemas.
     */
    public function index(Request $request)
    {
        $orgId = $request->user()->organization_id ?? $request->header('X-Organization-Id');
        $objects = CustomObject::with('fields')->where('organization_id', $orgId)->get();

        return response()->json(['success' => true, 'data' => $objects]);
    }

    /**
     * Define a new custom object schema.
     */
    public function store(Request $request)
    {
        $orgId = $request->user()->organization_id ?? $request->header('X-Organization-Id');

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'singular_name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'icon' => 'nullable|string',
            'fields' => 'required|array|min:1',
            'fields.*.field_name' => 'required|string',
            'fields.*.field_key' => 'required|string',
            'fields.*.field_type' => 'required|string|in:text,number,date,select,currency,boolean',
            'fields.*.options' => 'nullable|array',
            'fields.*.is_required' => 'nullable|boolean'
        ]);

        $customObject = CustomObject::create([
            'id' => (string) Str::uuid(),
            'organization_id' => $orgId,
            'name' => $validated['name'],
            'slug' => Str::slug($validated['name']),
            'singular_name' => $validated['singular_name'],
            'description' => $validated['description'] ?? null,
            'icon' => $validated['icon'] ?? 'Box'
        ]);

        foreach ($validated['fields'] as $f) {
            CustomObjectField::create([
                'id' => (string) Str::uuid(),
                'custom_object_id' => $customObject->id,
                'field_name' => $f['field_name'],
                'field_key' => Str::snake($f['field_key']),
                'field_type' => $f['field_type'],
                'options' => $f['options'] ?? null,
                'is_required' => $f['is_required'] ?? false
            ]);
        }

        return response()->json(['success' => true, 'data' => $customObject->load('fields')], 201);
    }

    /**
     * Show custom object definition.
     */
    public function show(Request $request, CustomObject $customObject)
    {
        $orgId = $request->user()->organization_id ?? $request->header('X-Organization-Id');
        if ($customObject->organization_id !== $orgId) {
            return response()->json(['success' => false, 'message' => 'Custom object not found.'], 404);
        }
        return response()->json(['success' => true, 'data' => $customObject->load('fields')]);
    }

    /**
     * List records of a custom object.
     */
    public function records(Request $request, CustomObject $customObject)
    {
        $orgId = $request->user()->organization_id ?? $request->header('X-Organization-Id');
        if ($customObject->organization_id !== $orgId) {
            return response()->json(['success' => false, 'message' => 'Custom object not found.'], 404);
        }

        $records = CustomObjectRecord::where('custom_object_id', $customObject->id)
            ->where('organization_id', $orgId)
            ->paginate(25);
        return response()->json(['success' => true, 'data' => $records->items(), 'meta' => ['total' => $records->total()]]);
    }

    /**
     * Create a record for this custom object.
     */
    public function storeRecord(Request $request, CustomObject $customObject)
    {
        $orgId = $request->user()->organization_id;
        if ($customObject->organization_id !== $orgId) {
            return response()->json(['success' => false, 'message' => 'Custom object not found.'], 404);
        }
        $validated = $request->validate([
            'data' => 'required|array',
            'associations' => 'nullable|array' // e.g. [['target_type' => 'contact', 'target_id' => 'uuid']]
        ]);

        $record = CustomObjectRecord::create([
            'id' => (string) Str::uuid(),
            'custom_object_id' => $customObject->id,
            'organization_id' => $orgId,
            'data' => $validated['data'],
            'created_by' => $request->user()->id ?? null
        ]);

        if (!empty($validated['associations'])) {
            foreach ($validated['associations'] as $assoc) {
                if (isset($assoc['target_type'], $assoc['target_id'])) {
                    if (!$this->verifyEntityOwnership($assoc['target_type'], $assoc['target_id'], $orgId)) {
                        continue; // Skip cross-tenant or non-existent targets
                    }
                    Association::create([
                        'id' => (string) Str::uuid(),
                        'organization_id' => $orgId,
                        'source_type' => 'custom_object_record',
                        'source_id' => $record->id,
                        'target_type' => $assoc['target_type'],
                        'target_id' => $assoc['target_id'],
                        'relationship_name' => $assoc['relationship_name'] ?? 'associated'
                    ]);
                }
            }
        }

        return response()->json(['success' => true, 'data' => $record], 201);
    }

    /**
     * Associate two entities (e.g. Contact <-> CustomObject, Opportunity <-> CustomObject).
     */
    public function associate(Request $request)
    {
        $orgId = $request->user()->organization_id;
        $validated = $request->validate([
            'source_type' => 'required|string',
            'source_id' => 'required|uuid',
            'target_type' => 'required|string',
            'target_id' => 'required|uuid',
            'relationship_name' => 'nullable|string'
        ]);

        // Cross-Tenant Boundary Verification (BUG-028)
        if (!$this->verifyEntityOwnership($validated['source_type'], $validated['source_id'], $orgId)) {
            return response()->json([
                'success' => false,
                'message' => "Forbidden: Source entity not found or cross-tenant access violation."
            ], 403);
        }

        if (!$this->verifyEntityOwnership($validated['target_type'], $validated['target_id'], $orgId)) {
            return response()->json([
                'success' => false,
                'message' => "Forbidden: Target entity not found or cross-tenant access violation."
            ], 403);
        }

        $association = Association::firstOrCreate([
            'organization_id' => $orgId,
            'source_type' => $validated['source_type'],
            'source_id' => $validated['source_id'],
            'target_type' => $validated['target_type'],
            'target_id' => $validated['target_id']
        ], [
            'id' => (string) Str::uuid(),
            'relationship_name' => $validated['relationship_name'] ?? 'associated'
        ]);

        return response()->json(['success' => true, 'data' => $association]);
    }

    /**
     * Verify that an entity belongs to the specified organization.
     */
    protected function verifyEntityOwnership(string $type, string $id, string $orgId): bool
    {
        $normalizedType = strtolower(trim($type));

        return match ($normalizedType) {
            'contact', 'contacts' => \App\Models\Contact::where('id', $id)->where('organization_id', $orgId)->exists(),
            'company', 'companies' => \App\Models\Company::where('id', $id)->where('organization_id', $orgId)->exists(),
            'opportunity', 'opportunities', 'deal', 'deals' => \App\Models\Opportunity::where('id', $id)->where('organization_id', $orgId)->exists(),
            'lead', 'leads' => \App\Models\Lead::where('id', $id)->where('organization_id', $orgId)->exists(),
            'custom_object', 'custom_objects' => CustomObject::where('id', $id)->where('organization_id', $orgId)->exists(),
            'custom_object_record', 'custom_record', 'custom_records' => CustomObjectRecord::where('id', $id)->where('organization_id', $orgId)->exists(),
            'document', 'knowledge_document' => \App\Models\KnowledgeDocument::where('id', $id)->where('organization_id', $orgId)->exists(),
            'task', 'tasks' => \App\Models\Task::where('id', $id)->where('organization_id', $orgId)->exists(),
            default => true
        };
    }
}
