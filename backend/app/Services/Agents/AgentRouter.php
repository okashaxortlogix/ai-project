<?php

namespace App\Services\Agents;

use App\Models\Conversation;
use App\Models\Message;
use App\Models\Agent;
use Illuminate\Support\Facades\Log;

class AgentRouter
{
    /**
     * Determine intent and route conversation to the appropriate specialized agent.
     * Categories: 'support', 'sales', 'appointment', 'human_request', 'general'
     */
    public function route(Conversation $conversation, string $userMessage): Agent
    {
        $intent = $this->detectIntent($userMessage);
        
        Log::info("AgentRouter classified message: '{$userMessage}' as intent: '{$intent}'");

        $agentType = match ($intent) {
            'support' => 'support',
            'sales' => 'sales',
            'appointment' => 'appointment',
            default => 'support',
        };

        // Find active organization agent of this type, or default to general support
        $agent = Agent::where('organization_id', $conversation->organization_id)
            ->where('type', $agentType)
            ->where('enabled', true)
            ->first();

        if (!$agent) {
            $agent = Agent::where('organization_id', $conversation->organization_id)
                ->where('enabled', true)
                ->first();
        }

        if (!$agent) {
            $agent = new Agent([
                'id' => "agent-{$agentType}",
                'organization_id' => $conversation->organization_id,
                'name' => ucfirst($agentType) . ' Agent',
                'type' => $agentType,
                'role' => "Autonomous {$agentType} agent",
                'enabled' => true,
                'temperature' => 0.4
            ]);
        }

        if ($agent->exists) {
            $conversation->update(['active_agent_id' => $agent->id]);
        }

        return $agent;
    }

    /**
     * Intent classifier using deterministic heuristic matching with fallback.
     */
    public function detectIntent(string $text): string
    {
        $lower = strtolower($text);

        // Explicit human handoff request
        if (preg_match('/\b(human|agent|representative|operator|talk to person|real person)\b/', $lower)) {
            return 'human_request';
        }

        // Appointment booking intent
        if (preg_match('/\b(book|appointment|demo|schedule|meeting|slot|time slot|calendar|reserve|call with)\b/', $lower)) {
            return 'appointment';
        }

        // Sales intent (pricing, buying, recommendations, discounts, features)
        if (preg_match('/\b(buy|pricing|price|cost|quote|recommend|laptop|discount|offer|deal|plans|upgrade|purchase|product|cart)\b/', $lower)) {
            return 'sales';
        }

        // Support intent (order, track, delivery, refund, policy, problem, broken, error, help)
        if (preg_match('/\b(order|track|tracking|delivery|shipping|return|refund|policy|issue|broken|help|where is my)\b/', $lower)) {
            return 'support';
        }

        return 'general';
    }
}
