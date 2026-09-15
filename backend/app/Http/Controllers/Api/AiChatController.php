<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\AI\LlmOrchestratorService;
use Illuminate\Http\Request;

class AiChatController extends Controller
{
    protected LlmOrchestratorService $orchestrator;

    public function __construct(LlmOrchestratorService $orchestrator)
    {
        $this->orchestrator = $orchestrator;
    }

    public function chat(Request $request)
    {
        $user = $request->user() ?: auth('sanctum')->user();
        $orgId = $user?->organization_id ?? $request->header('X-Organization-Id');

        if (!$orgId || !\Illuminate\Support\Str::isUuid($orgId) || !\App\Models\Organization::where('id', $orgId)->exists()) {
            if ($user?->organization_id) {
                $orgId = $user->organization_id;
            } else {
                $firstOrg = \App\Models\Organization::first();
                if ($firstOrg) {
                    $orgId = $firstOrg->id;
                } else {
                    return response()->json(['success' => false, 'message' => 'Valid organization context required.'], 400);
                }
            }
        }

        $validated = $request->validate([
            'message' => 'required|string',
            'agentType' => 'nullable|string',
            'conversationId' => 'nullable|string',
            'conversation_id' => 'nullable|string',
            'customerName' => 'nullable|string',
            'history' => 'nullable|array'
        ]);

        $convId = $validated['conversationId'] ?? ($validated['conversation_id'] ?? null);

        $response = $this->orchestrator->processMessage(
            $orgId,
            $convId,
            $validated['message'],
            $validated['agentType'] ?? 'assistant',
            $validated['customerName'] ?? null,
            $validated['history'] ?? []
        );

        return response()->json($response);
    }
}
