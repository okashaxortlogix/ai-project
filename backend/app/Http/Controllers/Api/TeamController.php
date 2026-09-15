<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use App\Models\UserInvitation;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class TeamController extends Controller
{
    /**
     * List all team members and pending invitations for the tenant.
     */
    public function members(Request $request)
    {
        $orgId = $request->user()->organization_id;

        $members = User::where('organization_id', $orgId)
            ->select('id', 'name', 'email', 'role', 'avatar', 'is_active', 'created_at')
            ->get();

        $invitations = UserInvitation::where('organization_id', $orgId)
            ->where('status', 'pending')
            ->where('expires_at', '>', now())
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'members' => $members,
                'invitations' => $invitations
            ]
        ]);
    }

    /**
     * Invite a new team member.
     */
    public function invite(Request $request)
    {
        $orgId = $request->user()->organization_id;

        $validated = $request->validate([
            'email' => 'required|email|max:255',
            'role' => 'required|string|in:Admin,Manager,Agent,Viewer'
        ]);

        // Check if user already exists in organization
        $existingUser = User::where('organization_id', $orgId)->where('email', $validated['email'])->first();
        if ($existingUser) {
            return response()->json([
                'success' => false,
                'message' => 'User with this email is already a member of your organization.'
            ], 422);
        }

        // Cancel previous pending invites for this email
        UserInvitation::where('organization_id', $orgId)
            ->where('email', $validated['email'])
            ->where('status', 'pending')
            ->update(['status' => 'revoked']);

        $token = Str::random(40);
        $invitation = UserInvitation::create([
            'id' => (string) Str::uuid(),
            'organization_id' => $orgId,
            'email' => strtolower(trim($validated['email'])),
            'role' => $validated['role'],
            'token' => $token,
            'status' => 'pending',
            'invited_by' => $request->user()->id,
            'expires_at' => now()->addDays(7)
        ]);

        return response()->json([
            'success' => true,
            'message' => "Invitation successfully sent to {$invitation->email}.",
            'data' => $invitation
        ], 201);
    }

    /**
     * Accept an invitation and initialize team member password.
     */
    public function acceptInvite(Request $request)
    {
        $validated = $request->validate([
            'token' => 'required|string',
            'name' => 'required|string|max:255',
            'password' => 'required|string|min:6'
        ]);

        $invitation = UserInvitation::where('token', $validated['token'])
            ->where('status', 'pending')
            ->where('expires_at', '>', now())
            ->first();

        if (!$invitation) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid or expired invitation token.'
            ], 404);
        }

        $hashed = Hash::make($validated['password']);
        $user = User::create([
            'id' => (string) Str::uuid(),
            'organization_id' => $invitation->organization_id,
            'name' => $validated['name'],
            'email' => $invitation->email,
            'password' => $hashed,
            'password_hash' => $hashed,
            'role' => $invitation->role,
            'avatar' => "https://ui-avatars.com/api/?name=" . urlencode($validated['name']) . "&background=2563EB&color=fff&size=120",
            'is_active' => true
        ]);

        $invitation->update(['status' => 'accepted']);

        $authToken = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Invitation accepted successfully.',
            'token' => $authToken,
            'user' => $user
        ], 201);
    }

    /**
     * Revoke an invitation.
     */
    public function revokeInvite(Request $request, string $id)
    {
        $orgId = $request->user()->organization_id;
        $invitation = UserInvitation::where('organization_id', $orgId)->findOrFail($id);
        $invitation->update(['status' => 'revoked']);

        return response()->json([
            'success' => true,
            'message' => 'Invitation revoked.'
        ]);
    }
}
