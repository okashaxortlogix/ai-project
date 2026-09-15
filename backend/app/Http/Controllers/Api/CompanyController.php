<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\Contact;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class CompanyController extends Controller
{
    public function index(Request $request)
    {
        $orgId = $request->user()->organization_id ?? $request->header('X-Organization-Id');
        $query = Company::with(['contacts', 'owner'])->where('organization_id', $orgId);

        if ($search = $request->query('search')) {
            $query->where('name', 'like', "%{$search}%")
                  ->orWhere('domain', 'like', "%{$search}%")
                  ->orWhere('industry', 'like', "%{$search}%");
        }

        return response()->json([
            'success' => true,
            'data' => $query->orderBy('name', 'asc')->paginate($request->query('per_page', 25))
        ]);
    }

    public function store(Request $request)
    {
        $orgId = $request->user()->organization_id ?? $request->header('X-Organization-Id');

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'domain' => 'nullable|string|max:255',
            'industry' => 'nullable|string|max:255',
            'size' => 'nullable|string|max:100',
            'phone' => 'nullable|string|max:50',
            'address' => 'nullable|array',
            'owner_id' => 'nullable|uuid'
        ]);

        $company = Company::create([
            'id' => (string) Str::uuid(),
            'organization_id' => $orgId,
            'name' => $validated['name'],
            'domain' => $validated['domain'] ?? null,
            'industry' => $validated['industry'] ?? null,
            'size' => $validated['size'] ?? null,
            'phone' => $validated['phone'] ?? null,
            'address' => $validated['address'] ?? null,
            'owner_id' => $validated['owner_id'] ?? null
        ]);

        return response()->json(['success' => true, 'data' => $company], 201);
    }

    public function show(Request $request, Company $company)
    {
        $orgId = $request->user()->organization_id ?? $request->header('X-Organization-Id');
        if ($company->organization_id !== $orgId) {
            return response()->json(['success' => false, 'message' => 'Company not found.'], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $company->load(['contacts', 'opportunities.stage', 'tasks', 'activities', 'owner'])
        ]);
    }

    public function update(Request $request, Company $company)
    {
        $orgId = $request->user()->organization_id ?? $request->header('X-Organization-Id');
        if ($company->organization_id !== $orgId) {
            return response()->json(['success' => false, 'message' => 'Company not found.'], 404);
        }

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'domain' => 'nullable|string|max:255',
            'industry' => 'nullable|string|max:255',
            'size' => 'nullable|string|max:100',
            'phone' => 'nullable|string|max:50',
            'address' => 'nullable|array',
            'owner_id' => 'nullable|uuid'
        ]);

        $company->update($validated);

        return response()->json(['success' => true, 'data' => $company]);
    }

    public function destroy(Request $request, Company $company)
    {
        $orgId = $request->user()->organization_id ?? $request->header('X-Organization-Id');
        if ($company->organization_id !== $orgId) {
            return response()->json(['success' => false, 'message' => 'Company not found.'], 404);
        }

        $company->delete();
        return response()->json(['success' => true, 'message' => 'Company deleted successfully.']);
    }

    public function attachContact(Request $request, Company $company)
    {
        $orgId = $request->user()->organization_id ?? $request->header('X-Organization-Id');
        if ($company->organization_id !== $orgId) {
            return response()->json(['success' => false, 'message' => 'Company not found.'], 404);
        }

        $validated = $request->validate([
            'contact_id' => 'required|uuid|exists:contacts,id',
            'role' => 'nullable|string|max:255',
            'is_primary' => 'nullable|boolean'
        ]);

        $contact = \App\Models\Contact::where('organization_id', $orgId)->findOrFail($validated['contact_id']);

        $company->contacts()->syncWithoutDetaching([
            $contact->id => [
                'id' => (string) \Illuminate\Support\Str::uuid(),
                'role' => $validated['role'] ?? 'Member',
                'is_primary' => $validated['is_primary'] ?? false
            ]
        ]);

        return response()->json(['success' => true, 'data' => $company->load('contacts')]);
    }
}
