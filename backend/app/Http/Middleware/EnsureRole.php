<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureRole
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     * @param  string  ...$roles
     */
    public function handle(Request $request, Closure $next, ...$roles): Response
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated.'
            ], 401);
        }

        $userRole = $user->role ?? 'Viewer';

        // Admin has superuser authority across all operations
        if ($userRole === 'Admin') {
            return $next($request);
        }

        if (!empty($roles) && !in_array($userRole, $roles)) {
            return response()->json([
                'success' => false,
                'message' => "Forbidden: User role '{$userRole}' does not have required permissions."
            ], 403);
        }

        return $next($request);
    }
}
