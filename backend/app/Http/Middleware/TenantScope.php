<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class TenantScope
{
    /**
     * Handle an incoming request and strictly enforce organization tenant boundaries.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user) {
            $userOrgId = $user->organization_id;
            
            // If client supplied header, ensure it matches authenticated user's organization
            $headerOrgId = $request->header('X-Organization-Id');
            if ($headerOrgId && $headerOrgId !== $userOrgId) {
                return response()->json([
                    'success' => false,
                    'error' => 'Forbidden: Cross-tenant access violation.'
                ], 403);
            }

            // Bind verified tenant ID
            app()->instance('tenant.organization_id', $userOrgId);
        }

        $response = $next($request);

        if ($user && $user->organization_id) {
            $response->headers->set('X-Tenant-Context', $user->organization_id);
        }

        return $response;
    }
}
