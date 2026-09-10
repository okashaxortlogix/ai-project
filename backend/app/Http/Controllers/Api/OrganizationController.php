<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Organization;

class OrganizationController extends Controller
{
    public function index(Request $request)
    {
        return response()->json(['success' => true, 'data' => Organization::all()]);
    }

    public function show(string $id)
    {
        return response()->json(['success' => true, 'data' => Organization::findOrFail($id)]);
    }

    public function update(Request $request, string $id)
    {
        $org = Organization::findOrFail($id);
        $org->update($request->all());
        return response()->json(['success' => true, 'data' => $org]);
    }
}
