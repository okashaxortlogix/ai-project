<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use App\Models\User;
use App\Models\Organization;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|email',
            'password' => 'required|string|min:6',
        ]);

        $user = User::where('email', $validated['email'])->first();

        $authPassword = $user ? ($user->password ?? $user->password_hash) : null;
        if (!$user || !$authPassword || !Hash::check($validated['password'], $authPassword)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid credentials provided.'
            ], 401);
        }

        \App\Services\Audit\AuditLogger::log(
            $user->organization_id,
            'user_login',
            'user',
            $user->id,
            'user',
            $user->id,
            ['email' => $user->email],
            $request->ip()
        );

        $token = method_exists($user, 'createToken') 
            ? ($user->createToken('auth-token')->plainTextToken ?? 'tok_' . bin2hex(random_bytes(24)))
            : 'tok_' . bin2hex(random_bytes(24));

        return response()->json([
            'success' => true,
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role ?? 'Admin',
                'avatar' => $user->avatar,
                'organization_id' => $user->organization_id
            ]
        ]);
    }

    public function register(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:6',
            'organization_name' => 'nullable|string|max:255',
            'role' => 'nullable|string|in:Admin,Manager,Viewer,Agent',
            'organization_id' => 'nullable|uuid|exists:organizations,id'
        ]);

        $orgId = $validated['organization_id'] ?? null;
        $org = null;
        if ($orgId) {
            $org = Organization::find($orgId);
        }

        if (!$org) {
            $orgName = $validated['organization_name'] ?? ($validated['name'] . "'s Org");
            $org = Organization::create([
                'id' => (string) Str::uuid(),
                'name' => $orgName,
                'slug' => Str::slug($orgName) . '-' . Str::random(4),
                'timezone' => 'UTC',
                'settings_json' => ['theme' => 'light'],
                'status' => 'active'
            ]);
        }

        $hashedPassword = Hash::make($validated['password']);
        $user = User::create([
            'id' => (string) Str::uuid(),
            'organization_id' => $org->id,
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => $hashedPassword,
            'password_hash' => $hashedPassword,
            'role' => $validated['role'] ?? 'Admin',
            'avatar' => "https://ui-avatars.com/api/?name=" . urlencode($validated['name']) . "&background=2563EB&color=fff&size=120",
            'is_active' => true
        ]);

        $token = method_exists($user, 'createToken') 
            ? ($user->createToken('auth-token')->plainTextToken ?? 'tok_' . bin2hex(random_bytes(24)))
            : 'tok_' . bin2hex(random_bytes(24));

        return response()->json([
            'success' => true,
            'token' => $token,
            'user' => $user,
            'organization' => $org
        ], 201);
    }

    public function me(Request $request)
    {
        return response()->json([
            'success' => true,
            'user' => $request->user()
        ]);
    }

    public function logout(Request $request)
    {
        if ($request->user() && method_exists($request->user(), 'currentAccessToken')) {
            $request->user()->currentAccessToken()?->delete();
        }
        return response()->json([
            'success' => true,
            'message' => 'Logged out successfully'
        ]);
    }
}
