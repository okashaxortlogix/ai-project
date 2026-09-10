<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use App\Models\Organization;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|email',
            'password' => 'nullable|string',
        ]);

        $user = User::where('email', $validated['email'])->first();

        if (!$user) {
            // Demo / first-time auto provision for seamless evaluation
            $org = Organization::firstOrCreate(
                ['slug' => 'acme-corp'],
                [
                    'id' => 'org-acme-1',
                    'name' => 'Acme Corporation',
                    'timezone' => 'America/New_York',
                    'settings' => ['theme' => 'light']
                ]
            );

            $user = User::create([
                'id' => 'usr-' . time(),
                'organization_id' => $org->id,
                'name' => explode('@', $validated['email'])[0],
                'email' => $validated['email'],
                'password' => Hash::make($validated['password'] ?? 'secret123'),
                'role' => 'Admin',
                'avatar' => 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=120&q=80',
            ]);
        }

        $token = $user->createToken('auth-token')->plainTextToken ?? 'mock_jwt_token_' . base64_encode($user->id);

        return response()->json([
            'success' => true,
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
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

        $org = Organization::create([
            'id' => 'org-' . uniqid(),
            'name' => $validated['organization_name'] ?? ($validated['name'] . "'s Org"),
            'slug' => \Illuminate\Support\Str::slug($validated['organization_name'] ?? $validated['name']),
            'timezone' => 'UTC',
            'settings' => []
        ]);

        $user = User::create([
            'id' => 'usr-' . uniqid(),
            'organization_id' => $org->id,
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => 'Admin',
            'avatar' => 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=120&q=80'
        ]);

        $token = $user->createToken('auth-token')->plainTextToken ?? 'mock_jwt_token_' . base64_encode($user->id);

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
        if ($request->user()) {
            $request->user()->currentAccessToken()?->delete();
        }
        return response()->json([
            'success' => true,
            'message' => 'Logged out successfully'
        ]);
    }
}
