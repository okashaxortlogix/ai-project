<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Customer;

class CustomerController extends Controller
{
    public function index(Request $request)
    {
        $orgId = $request->header('X-Organization-Id', 'org-acme-1');
        $customers = Customer::where('organization_id', $orgId)->get();
        return response()->json(['success' => true, 'data' => $customers]);
    }

    public function store(Request $request)
    {
        $orgId = $request->header('X-Organization-Id', 'org-acme-1');
        $validated = $request->validate([
            'name' => 'required|string',
            'email' => 'required|email',
            'phone' => 'nullable|string',
            'source' => 'nullable|string'
        ]);

        $customer = Customer::create([
            'id' => 'cust-' . time(),
            'organization_id' => $orgId,
            'name' => $validated['name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'] ?? '',
            'source' => $validated['source'] ?? 'Website',
            'avatar' => 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80',
            'online' => true
        ]);

        return response()->json(['success' => true, 'data' => $customer], 201);
    }

    public function show(string $id)
    {
        return response()->json(['success' => true, 'data' => Customer::findOrFail($id)]);
    }

    public function update(Request $request, string $id)
    {
        $customer = Customer::findOrFail($id);
        $customer->update($request->all());
        return response()->json(['success' => true, 'data' => $customer]);
    }
}
