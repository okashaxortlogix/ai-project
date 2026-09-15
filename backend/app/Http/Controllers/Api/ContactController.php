<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Contact;
use App\Models\Tag;
use App\Models\SmartList;
use App\Models\Activity;
use App\Services\Workflow\WorkflowEngine;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ContactController extends Controller
{
    /**
     * Display contacts with search, pagination, and advanced filtering.
     */
    public function index(Request $request)
    {
        $orgId = $request->user()->organization_id ?? $request->header('X-Organization-Id');
        $query = Contact::with(['tags', 'companies', 'owner'])->where('organization_id', $orgId);

        // Quick Search
        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                  ->orWhere('last_name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        // Status Filter
        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        // Tag Filter
        if ($tag = $request->query('tag')) {
            $query->whereHas('tags', function ($q) use ($tag) {
                $q->where('name', $tag);
            });
        }

        // Smart List Filter application
        if ($smartListId = $request->query('smart_list_id')) {
            $smartList = SmartList::find($smartListId);
            if ($smartList && !empty($smartList->filters)) {
                $this->applySmartListFilters($query, $smartList->filters);
            }
        }

        $contacts = $query->orderBy('created_at', 'desc')->paginate($request->query('per_page', 25));

        return response()->json([
            'success' => true,
            'data' => $contacts->items(),
            'meta' => [
                'total' => $contacts->total(),
                'current_page' => $contacts->currentPage(),
                'per_page' => $contacts->perPage(),
                'last_page' => $contacts->lastPage()
            ]
        ]);
    }

    /**
     * Create a new contact and trigger ContactCreated workflows.
     */
    public function store(Request $request, WorkflowEngine $workflowEngine)
    {
        $orgId = $request->user()->organization_id ?? $request->header('X-Organization-Id');

        $validated = $request->validate([
            'first_name' => 'required|string|max:255',
            'last_name' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:50',
            'source' => 'nullable|string',
            'status' => 'nullable|string',
            'score' => 'nullable|integer',
            'owner_id' => 'nullable|uuid',
            'tags' => 'nullable|array',
            'dnd_settings' => 'nullable|array',
            'custom_attributes' => 'nullable|array'
        ]);

        $contact = Contact::create([
            'id' => (string) Str::uuid(),
            'organization_id' => $orgId,
            'first_name' => $validated['first_name'],
            'last_name' => $validated['last_name'] ?? null,
            'email' => $validated['email'] ?? null,
            'phone' => $validated['phone'] ?? null,
            'source' => $validated['source'] ?? 'Direct',
            'status' => $validated['status'] ?? 'Lead',
            'score' => $validated['score'] ?? 10,
            'owner_id' => $validated['owner_id'] ?? null,
            'dnd_settings' => $validated['dnd_settings'] ?? ['email' => false, 'sms' => false, 'call' => false],
            'custom_attributes' => $validated['custom_attributes'] ?? []
        ]);

        // Attach Tags if provided
        if (!empty($validated['tags'])) {
            $syncData = [];
            foreach ($validated['tags'] as $tagName) {
                $tag = Tag::firstOrCreate(['organization_id' => $orgId, 'name' => $tagName]);
                $syncData[$tag->id] = ['id' => (string) Str::uuid()];
            }
            $contact->tags()->sync($syncData);
        }

        // Record Activity
        Activity::create([
            'id' => (string) Str::uuid(),
            'organization_id' => $orgId,
            'contact_id' => $contact->id,
            'type' => 'contact_created',
            'description' => "Contact {$contact->name} was created via {$contact->source}."
        ]);

        // Dispatch ContactCreated event into Workflow Engine
        $workflowEngine->dispatchEvent($orgId, 'ContactCreated', 'contact', $contact->id, [
            'name' => $contact->name,
            'email' => $contact->email,
            'phone' => $contact->phone,
            'source' => $contact->source,
            'score' => $contact->score,
            'status' => $contact->status
        ]);

        return response()->json(['success' => true, 'data' => $contact->load('tags')], 201);
    }

    /**
     * Show single contact profile with 360 associations.
     */
    public function show(Request $request, Contact $contact)
    {
        $orgId = $request->user()->organization_id ?? $request->header('X-Organization-Id');
        if ($contact->organization_id !== $orgId) {
            return response()->json(['success' => false, 'message' => 'Contact not found.'], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $contact->load([
                'tags',
                'companies',
                'opportunities.stage',
                'tasks',
                'activities',
                'owner'
            ])
        ]);
    }

    /**
     * Update contact.
     */
    public function update(Request $request, Contact $contact, WorkflowEngine $workflowEngine)
    {
        $orgId = $request->user()->organization_id ?? $request->header('X-Organization-Id');
        if ($contact->organization_id !== $orgId) {
            return response()->json(['success' => false, 'message' => 'Contact not found.'], 404);
        }

        $validated = $request->validate([
            'first_name' => 'sometimes|string|max:255',
            'last_name' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:50',
            'source' => 'nullable|string',
            'status' => 'nullable|string',
            'score' => 'nullable|integer',
            'owner_id' => 'nullable|uuid',
            'tags' => 'nullable|array',
            'dnd_settings' => 'nullable|array',
            'custom_attributes' => 'nullable|array'
        ]);

        $oldStatus = $contact->status;
        $contact->update($validated);

        if (isset($validated['tags'])) {
            $syncData = [];
            foreach ($validated['tags'] as $tagName) {
                $tag = Tag::firstOrCreate(['organization_id' => $contact->organization_id, 'name' => $tagName]);
                $syncData[$tag->id] = ['id' => (string) Str::uuid()];
            }
            $contact->tags()->sync($syncData);
        }

        if (isset($validated['status']) && $validated['status'] !== $oldStatus) {
            Activity::create([
                'id' => (string) Str::uuid(),
                'organization_id' => $contact->organization_id,
                'contact_id' => $contact->id,
                'type' => 'status_change',
                'description' => "Status changed from {$oldStatus} to {$contact->status}."
            ]);
        }

        // Trigger ContactUpdated workflow
        $workflowEngine->dispatchEvent($contact->organization_id, 'ContactUpdated', 'contact', $contact->id, $contact->toArray());

        \App\Services\Audit\AuditLogger::log(
            $contact->organization_id,
            'contact_updated',
            'user',
            $request->user()->id ?? null,
            'contact',
            $contact->id,
            ['updated_fields' => array_keys($validated)]
        );

        return response()->json(['success' => true, 'data' => $contact->load('tags')]);
    }

    /**
     * Delete/Archive contact.
     */
    public function destroy(Request $request, Contact $contact)
    {
        $orgId = $request->user()->organization_id ?? $request->header('X-Organization-Id');
        if ($contact->organization_id !== $orgId) {
            return response()->json(['success' => false, 'message' => 'Contact not found.'], 404);
        }

        $contact->delete();

        \App\Services\Audit\AuditLogger::log(
            $orgId,
            'contact_deleted',
            'user',
            $request->user()->id ?? null,
            'contact',
            $contact->id
        );

        return response()->json(['success' => true, 'message' => 'Contact deleted successfully.']);
    }

    /**
     * Detect duplicate contacts by email or phone.
     */
    public function duplicates(Request $request)
    {
        $orgId = $request->user()->organization_id ?? $request->header('X-Organization-Id');
        
        $emailDuplicates = Contact::where('organization_id', $orgId)
            ->whereNotNull('email')
            ->select('email')
            ->groupBy('email')
            ->havingRaw('count(*) > 1')
            ->pluck('email');

        $phoneDuplicates = Contact::where('organization_id', $orgId)
            ->whereNotNull('phone')
            ->select('phone')
            ->groupBy('phone')
            ->havingRaw('count(*) > 1')
            ->pluck('phone');

        $duplicateGroups = [];
        foreach ($emailDuplicates as $email) {
            $duplicateGroups[] = [
                'type' => 'email',
                'value' => $email,
                'contacts' => Contact::where('organization_id', $orgId)->where('email', $email)->get()
            ];
        }

        return response()->json(['success' => true, 'data' => $duplicateGroups]);
    }

    /**
     * Merge two contacts into primary.
     */
    public function merge(Request $request)
    {
        $orgId = $request->user()->organization_id ?? $request->header('X-Organization-Id');

        $validated = $request->validate([
            'primary_id' => 'required|uuid',
            'secondary_id' => 'required|uuid|different:primary_id'
        ]);

        $primary = Contact::where('organization_id', $orgId)->findOrFail($validated['primary_id']);
        $secondary = Contact::where('organization_id', $orgId)->findOrFail($validated['secondary_id']);

        // Merge tags
        $secondaryTagIds = $secondary->tags()->pluck('tags.id')->toArray();
        $primary->tags()->syncWithoutDetaching($secondaryTagIds);

        // Reassign opportunities, tasks, activities
        $secondary->opportunities()->update(['contact_id' => $primary->id]);
        $secondary->tasks()->update(['contact_id' => $primary->id]);
        $secondary->activities()->update(['contact_id' => $primary->id]);

        Activity::create([
            'id' => (string) Str::uuid(),
            'organization_id' => $orgId,
            'contact_id' => $primary->id,
            'type' => 'contact_merged',
            'description' => "Merged contact {$secondary->name} ({$secondary->id}) into {$primary->name}."
        ]);

        \App\Services\Audit\AuditLogger::log(
            $orgId,
            'contact_merged',
            'user',
            $request->user()->id ?? null,
            'contact',
            $primary->id,
            ['merged_from_id' => $secondary->id]
        );

        $secondary->delete();

        return response()->json(['success' => true, 'data' => $primary->load(['tags', 'opportunities', 'tasks'])]);
    }

    /**
     * Apply dynamic AND/OR filters from Smart List.
     */
    protected function applySmartListFilters($query, array $filters): void
    {
        foreach ($filters as $condition) {
            $field = $condition['field'] ?? null;
            $op = $condition['operator'] ?? 'equals';
            $val = $condition['value'] ?? null;

            if (!$field) continue;

            if ($field === 'tag') {
                $query->whereHas('tags', function ($q) use ($val) {
                    $q->where('name', $val);
                });
                continue;
            }

            if ($op === 'equals') {
                $query->where($field, $val);
            } elseif ($op === 'not_equals') {
                $query->where($field, '!=', $val);
            } elseif ($op === 'contains') {
                $query->where($field, 'like', "%{$val}%");
            } elseif ($op === 'greater_than') {
                $query->where($field, '>', $val);
            } elseif ($op === 'less_than') {
                $query->where($field, '<', $val);
            }
        }
    }
}
