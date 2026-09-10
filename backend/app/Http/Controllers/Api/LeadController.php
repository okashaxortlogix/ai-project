<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Lead;

class LeadController extends Controller
{
    public function index(Request $request)
    {
        $orgId = $request->header('X-Organization-Id', 'org-acme-1');
        $query = Lead::where('organization_id', $orgId);

        if ($request->filled('status') && $request->status !== 'All') {
            $query->where('status', $request->status);
        }

        if ($request->filled('q')) {
            $q = $request->q;
            $query->where(function($b) use ($q) {
                $b->where('name', 'like', "%{$q}%")
                  ->orWhere('email', 'like', "%{$q}%")
                  ->orWhere('company', 'like', "%{$q}%");
            });
        }

        $leads = $query->orderBy('created_at', 'desc')->get();

        return response()->json([
            'success' => true,
            'data' => $leads,
            'meta' => [
                'total' => $leads->count(),
                'organization_id' => $orgId
            ]
        ]);
    }

    public function store(Request $request)
    {
        $orgId = $request->header('X-Organization-Id', 'org-acme-1');
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email',
            'phone' => 'nullable|string',
            'company' => 'nullable|string',
            'source' => 'nullable|string',
            'status' => 'nullable|string',
            'score' => 'nullable|integer',
            'notes' => 'nullable|string',
            'customer_id' => 'nullable|string'
        ]);

        $lead = Lead::create([
            'id' => 'lead-' . time(),
            'organization_id' => $orgId,
            'customer_id' => $validated['customer_id'] ?? 'cust-1',
            'name' => $validated['name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'] ?? '+1 234 567 8900',
            'company' => $validated['company'] ?? null,
            'source' => $validated['source'] ?? 'Website',
            'status' => $validated['status'] ?? 'Qualified',
            'score' => $validated['score'] ?? 85,
            'avatar' => 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80',
            'notes' => $validated['notes'] ?? 'Created from API'
        ]);

        return response()->json(['success' => true, 'data' => $lead], 201);
    }

    public function show(string $id)
    {
        $lead = Lead::findOrFail($id);
        return response()->json(['success' => true, 'data' => $lead]);
    }

    public function update(Request $request, string $id)
    {
        $lead = Lead::findOrFail($id);
        $lead->update($request->all());
        return response()->json(['success' => true, 'data' => $lead]);
    }
}
