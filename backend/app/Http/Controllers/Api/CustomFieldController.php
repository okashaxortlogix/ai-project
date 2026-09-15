<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use App\Models\CustomObject;
use App\Models\CustomObjectField;

class CustomFieldController extends Controller
{
    /**
     * List custom fields for the tenant, optionally filtered by entity.
     */
    public function index(Request $request)
    {
        $orgId = $request->user()->organization_id;
        $entity = $request->input('entity');

        $query = CustomObject::where('organization_id', $orgId);
        if ($entity) {
            $query->where('slug', Str::slug($entity));
        }

        $customObjects = $query->with('fields')->get();
        $fields = $customObjects->flatMap(function ($obj) {
            return $obj->fields->map(function ($f) use ($obj) {
                return [
                    'id' => $f->id,
                    'entity' => $obj->slug,
                    'field_name' => $f->field_name,
                    'field_key' => $f->field_key,
                    'field_type' => $f->field_type,
                    'options' => $f->options,
                    'is_required' => $f->is_required,
                ];
            });
        })->values();

        return response()->json([
            'success' => true,
            'data' => $fields
        ]);
    }

    /**
     * Create a custom field definition.
     */
    public function store(Request $request)
    {
        $orgId = $request->user()->organization_id;

        $validated = $request->validate([
            'entity' => 'nullable|string',
            'field_name' => 'required|string',
            'field_key' => 'nullable|string',
            'field_type' => 'required|string|in:text,number,date,select,currency,boolean',
            'options' => 'nullable|array',
            'is_required' => 'nullable|boolean'
        ]);

        $entitySlug = Str::slug($validated['entity'] ?? 'general');
        $customObj = CustomObject::firstOrCreate(
            ['organization_id' => $orgId, 'slug' => $entitySlug],
            [
                'id' => (string) Str::uuid(),
                'name' => ucfirst($entitySlug),
                'singular_name' => ucfirst($entitySlug),
                'description' => "Custom object for {$entitySlug}",
                'icon' => 'Box'
            ]
        );

        $fieldKey = $validated['field_key'] ?? Str::snake($validated['field_name']);

        $field = CustomObjectField::create([
            'id' => (string) Str::uuid(),
            'custom_object_id' => $customObj->id,
            'field_name' => $validated['field_name'],
            'field_key' => $fieldKey,
            'field_type' => $validated['field_type'],
            'options' => $validated['options'] ?? null,
            'is_required' => $validated['is_required'] ?? false
        ]);

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $field->id,
                'entity' => $customObj->slug,
                'field_name' => $field->field_name,
                'field_key' => $field->field_key,
                'field_type' => $field->field_type,
                'options' => $field->options,
                'is_required' => $field->is_required
            ]
        ], 201);
    }
}
