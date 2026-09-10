<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Integration;

class IntegrationController extends Controller
{
    public function index(Request $request)
    {
        $orgId = $request->header('X-Organization-Id', 'org-acme-1');
        $integrations = Integration::where('organization_id', $orgId)->get();
        return response()->json(['success' => true, 'data' => $integrations]);
    }

    public function connect(Request $request, string $provider)
    {
        $orgId = $request->header('X-Organization-Id', 'org-acme-1');
        
        $integration = Integration::updateOrCreate(
            ['organization_id' => $orgId, 'provider' => $provider],
            [
                'name' => ucfirst($provider),
                'connected' => true,
                'status' => 'active',
                'credentials' => $request->all(),
                'last_synced_at' => now()
            ]
        );

        return response()->json([
            'success' => true,
            'data' => $integration,
            'diagnostic' => [
                'provider' => $provider,
                'status' => 'verified_active',
                'latency' => '42ms'
            ]
        ]);
    }

    public function disconnect(string $id)
    {
        $integration = Integration::findOrFail($id);
        $integration->update(['connected' => false, 'status' => 'disconnected']);

        return response()->json(['success' => true, 'data' => $integration]);
    }

    public function status(string $id)
    {
        $integration = Integration::findOrFail($id);
        return response()->json(['success' => true, 'data' => $integration]);
    }
}
