<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use App\Models\Lead;
use App\Models\Customer;

class LeadController extends Controller
{
    public function index(Request $request)
    {
        $orgId = $request->header('X-Organization-Id', 'org-acme-1');
        $query = Lead::where('organization_id', $orgId);

        if ($request->filled('status') && $request->status !== 'All') {
            $query->where(function($b) use ($request) {
                $b->where('status', $request->status)
                  ->orWhere('stage', $request->status);
            });
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
            'avatar' => 'nullable|string',
            'customer_id' => 'nullable|string'
        ]);

        // Resolve or create customer to ensure FK validity
        $customerId = $validated['customer_id'] ?? null;
        if (!$customerId || !Customer::where('id', $customerId)->exists()) {
            $customer = Customer::firstOrCreate(
                ['email' => $validated['email'], 'organization_id' => $orgId],
                [
                    'id' => (string) Str::uuid(),
                    'name' => $validated['name'],
                    'phone' => $validated['phone'] ?? null,
                    'source' => $validated['source'] ?? 'website'
                ]
            );
            $customerId = $customer->id;
        }

        $status = $validated['status'] ?? 'Qualified';
        $name = $validated['name'];
        $avatar = $validated['avatar'] ?? ("https://ui-avatars.com/api/?name=" . urlencode($name) . "&background=0D8ABC&color=fff&size=120");

        $lead = Lead::create([
            'id' => (string) Str::uuid(),
            'organization_id' => $orgId,
            'customer_id' => $customerId,
            'name' => $name,
            'email' => $validated['email'],
            'phone' => $validated['phone'] ?? null,
            'company' => $validated['company'] ?? null,
            'source' => $validated['source'] ?? 'Website',
            'stage' => $status,
            'status' => $status,
            'score' => $validated['score'] ?? 85,
            'avatar' => $avatar,
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
        $data = $request->all();
        if (isset($data['status']) && !isset($data['stage'])) {
            $data['stage'] = $data['status'];
        }
        $lead->update($data);
        return response()->json(['success' => true, 'data' => $lead]);
    }
}
