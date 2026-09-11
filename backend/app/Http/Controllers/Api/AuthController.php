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

        if (!$user) {
            // Auto-provision user & org for seamless initial setup if not exists
            $namePart = explode('@', $validated['email'])[0];
            $orgName = ucfirst($namePart) . "'s Team";
            $orgSlug = Str::slug($orgName) ?: 'acme-corp';

            $org = Organization::firstOrCreate(
                ['slug' => $orgSlug],
                [
                    'id' => (string) Str::uuid(),
                    'name' => $orgName,
                    'timezone' => 'America/New_York',
                    'settings_json' => ['theme' => 'light'],
                    'status' => 'active'
                ]
            );

            $user = User::create([
                'id' => (string) Str::uuid(),
                'organization_id' => $org->id,
                'name' => ucwords(str_replace(['.', '_', '-'], ' ', $namePart)),
                'email' => $validated['email'],
                'password' => Hash::make($validated['password']),
                'role' => 'Admin',
                'avatar' => "https://ui-avatars.com/api/?name=" . urlencode($namePart) . "&background=2563EB&color=fff&size=120",
                'is_active' => true
            ]);
        } else {
            // Verify password if user already exists and has a password
            if ($user->password && !Hash::check($validated['password'], $user->password)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid credentials provided.'
                ], 401);
            }
        }

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
        ]);

        $orgName = $validated['organization_name'] ?? ($validated['name'] . "'s Org");
        $org = Organization::create([
            'id' => (string) Str::uuid(),
            'name' => $orgName,
            'slug' => Str::slug($orgName) . '-' . Str::random(4),
            'timezone' => 'UTC',
            'settings_json' => ['theme' => 'light'],
            'status' => 'active'
        ]);

        $user = User::create([
            'id' => (string) Str::uuid(),
            'organization_id' => $org->id,
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => 'Admin',
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
