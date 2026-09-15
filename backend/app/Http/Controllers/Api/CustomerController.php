<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use App\Models\Customer;

class CustomerController extends Controller
{
    public function index(Request $request)
    {
        $orgId = $request->user()->organization_id ?? $request->header('X-Organization-Id');
        $customers = Customer::where('organization_id', $orgId)->get();
        return response()->json(['success' => true, 'data' => $customers]);
    }

    public function store(Request $request)
    {
        $orgId = $request->user()->organization_id ?? $request->header('X-Organization-Id');
        $validated = $request->validate([
            'name' => 'required|string',
            'email' => 'required|email',
            'phone' => 'nullable|string',
            'source' => 'nullable|string'
        ]);

        $customer = Customer::create([
            'id' => (string) Str::uuid(),
            'organization_id' => $orgId,
            'name' => $validated['name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'] ?? '',
            'source' => $validated['source'] ?? 'Website',
            'avatar' => 'https://ui-avatars.com/api/?name=' . urlencode($validated['name']) . '&background=2563EB&color=fff',
            'online' => true
        ]);

        return response()->json(['success' => true, 'data' => $customer], 201);
    }

    public function show(Request $request, string $id)
    {
        $orgId = $request->user()->organization_id ?? $request->header('X-Organization-Id');
        $customer = Customer::where('organization_id', $orgId)->findOrFail($id);
        return response()->json(['success' => true, 'data' => $customer]);
    }

    public function update(Request $request, string $id)
    {
        $orgId = $request->user()->organization_id ?? $request->header('X-Organization-Id');
        $customer = Customer::where('organization_id', $orgId)->findOrFail($id);
        
        $validated = $request->validate([
            'name' => 'sometimes|string',
            'email' => 'sometimes|email',
            'phone' => 'nullable|string',
            'source' => 'nullable|string'
        ]);

        $customer->update($validated);
        return response()->json(['success' => true, 'data' => $customer]);
    }
}
