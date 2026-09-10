<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class TenantScope
{
    /**
     * Handle an incoming request and enforce organization tenant boundaries.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user && $user->organization_id) {
            // Bind active organization into service container
            app()->instance('tenant.organization_id', $user->organization_id);
        }

        return $next($request);
    }
}
