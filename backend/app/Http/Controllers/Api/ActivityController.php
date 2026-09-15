<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use App\Models\Activity;
use App\Models\Note;

class ActivityController extends Controller
{
    /**
     * Get activity timeline for contact/opportunity/company.
     */
    public function index(Request $request)
    {
        $orgId = $request->user()->organization_id;
        $query = Activity::where('organization_id', $orgId);

        if ($request->filled('contact_id')) {
            $query->where('contact_id', $request->contact_id);
        }
        if ($request->filled('company_id')) {
            $query->where('company_id', $request->company_id);
        }
        if ($request->filled('opportunity_id')) {
            $query->where('opportunity_id', $request->opportunity_id);
        }

        $activities = $query->orderBy('created_at', 'desc')->get();

        return response()->json([
            'success' => true,
            'data' => $activities
        ]);
    }

    /**
     * Add a timeline event or note.
     */
    public function store(Request $request)
    {
        $orgId = $request->user()->organization_id;

        $validated = $request->validate([
            'contact_id' => 'nullable|uuid',
            'company_id' => 'nullable|uuid',
            'opportunity_id' => 'nullable|uuid',
            'type' => 'required|string', // note, call, meeting, stage_change, task_created, system
            'description' => 'required|string',
            'metadata' => 'nullable|array'
        ]);

        $activity = Activity::create([
            'id' => (string) Str::uuid(),
            'organization_id' => $orgId,
            'user_id' => $request->user()->id,
            'contact_id' => $validated['contact_id'] ?? null,
            'company_id' => $validated['company_id'] ?? null,
            'opportunity_id' => $validated['opportunity_id'] ?? null,
            'type' => $validated['type'],
            'description' => $validated['description'],
            'metadata' => $validated['metadata'] ?? null
        ]);

        // If type is note and contact_id is set, also store in notes table
        if ($validated['type'] === 'note' && !empty($validated['contact_id'])) {
            Note::create([
                'id' => (string) Str::uuid(),
                'organization_id' => $orgId,
                'author_id' => $request->user()->id,
                'notable_type' => 'contact',
                'notable_id' => $validated['contact_id'],
                'body' => $validated['description']
            ]);
        }

        return response()->json([
            'success' => true,
            'data' => $activity
        ], 201);
    }
}
