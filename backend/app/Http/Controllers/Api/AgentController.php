<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Agent;
use App\Models\Organization;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class AgentController extends Controller
{
    public function index(Request $request)
    {
        $orgId = $request->user()?->organization_id ?? $request->header('X-Organization-Id');
        if (!$orgId) {
            $firstOrg = Organization::first();
            $orgId = $firstOrg?->id;
        }

        if (!$orgId) {
            return response()->json(['success' => false, 'message' => 'Organization context required.'], 400);
        }

        $agents = Agent::where('organization_id', $orgId)->get();

        // If no agents are seeded for this tenant, provision default specialized agents
        if ($agents->isEmpty()) {
            $defaultAgents = [
                [
                    'type' => 'assistant',
                    'name' => 'Master AI Assistant',
                    'description' => 'Autonomous CRM copilot for contacts, deals, tasks, workflows and multi-domain operations.',
                    'system_prompt' => 'You are the Master AI Assistant for the CRM suite. Manage contacts, pipeline deals, schedule appointments, and coordinate tasks with zero hallucination.'
                ],
                [
                    'type' => 'support',
                    'name' => 'Customer Support Agent',
                    'description' => 'Autonomous support agent for order inquiries, FAQs, and ticket resolution.',
                    'system_prompt' => 'You are the Customer Support Agent. Answer queries, track orders, and resolve customer issues using approved knowledge documents and tools.'
                ],
                [
                    'type' => 'sales',
                    'name' => 'Sales & Pipeline Agent',
                    'description' => 'Autonomous sales representative for product recommendations, deal qualification, and pipeline progression.',
                    'system_prompt' => 'You are the Sales Agent. Recommend products, discover customer needs, qualify leads, and drive purchases without deceptive urgency.'
                ],
                [
                    'type' => 'appointment',
                    'name' => 'Appointment Booking Agent',
                    'description' => 'Autonomous scheduling agent for calendar availability, bookings, and reschedulings.',
                    'system_prompt' => 'You are the Appointment Agent. Check calendar availability, present open slots, and confirm appointments with Google Calendar and Outlook.'
                ]
            ];

            foreach ($defaultAgents as $def) {
                Agent::create([
                    'id' => (string) Str::uuid(),
                    'organization_id' => $orgId,
                    'type' => $def['type'],
                    'name' => $def['name'],
                    'description' => $def['description'],
                    'enabled' => true,
                    'system_prompt' => $def['system_prompt'],
                    'configuration_json' => [
                        'temperature' => 0.3,
                        'model' => 'gemini-1.5-flash'
                    ]
                ]);
            }

            $agents = Agent::where('organization_id', $orgId)->get();
        }

        return response()->json(['success' => true, 'data' => $agents]);
    }

    public function show(Request $request, string $id)
    {
        $orgId = $request->user()?->organization_id ?? $request->header('X-Organization-Id');
        
        $query = Agent::query();
        if ($orgId) {
            $query->where('organization_id', $orgId);
        }

        $agent = $query->where(function ($w) use ($id) {
            $w->where('id', $id)->orWhere('type', $id);
        })->first();

        if (!$agent) {
            return response()->json(['success' => false, 'message' => 'Agent not found.'], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $agent
        ]);
    }

    public function update(Request $request, string $id)
    {
        $orgId = $request->user()?->organization_id ?? $request->header('X-Organization-Id');
        
        $query = Agent::query();
        if ($orgId) {
            $query->where('organization_id', $orgId);
        }

        $agent = $query->where('id', $id)->first();
        if (!$agent) {
            return response()->json(['success' => false, 'message' => 'Agent not found.'], 404);
        }

        $agent->update($request->only(['name', 'description', 'enabled', 'system_prompt', 'configuration_json']));

        return response()->json([
            'success' => true,
            'data' => $agent
        ]);
    }
}
