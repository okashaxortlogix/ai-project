<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\Customer;
use App\Models\Organization;
use App\Services\Agents\AgentRouter;

class ConversationController extends Controller
{
    public function index(Request $request)
    {
        $orgId = $request->header('X-Organization-Id', 'org-acme-1');
        $query = Conversation::where('organization_id', $orgId)->with(['customer', 'messages']);

        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        $conversations = $query->orderBy('created_at', 'desc')->get();

        return response()->json([
            'success' => true,
            'data' => $conversations,
            'meta' => [
                'total' => $conversations->count(),
                'organization_id' => $orgId
            ]
        ]);
    }

    public function store(Request $request)
    {
        $orgId = $request->header('X-Organization-Id', 'org-acme-1');
        $validated = $request->validate([
            'customer_id' => 'required|string',
            'channel' => 'nullable|string',
            'assigned_agent' => 'nullable|string'
        ]);

        $conv = Conversation::create([
            'id' => (string) Str::uuid(),
            'organization_id' => $orgId,
            'customer_id' => $validated['customer_id'],
            'channel' => $validated['channel'] ?? 'web',
            'status' => 'active',
            'assigned_agent' => $validated['assigned_agent'] ?? 'support',
            'last_message' => 'Conversation initialized',
            'last_message_at' => now(),
        ]);

        return response()->json(['success' => true, 'data' => $conv], 201);
    }

    public function show(string $id)
    {
        $conv = Conversation::with(['customer', 'messages'])->findOrFail($id);
        return response()->json(['success' => true, 'data' => $conv]);
    }

    public function messages(string $id)
    {
        $messages = Message::where('conversation_id', $id)->orderBy('created_at', 'asc')->get();
        return response()->json(['success' => true, 'data' => $messages]);
    }

    public function sendMessage(Request $request, string $id)
    {
        $validated = $request->validate([
            'content' => 'required|string',
            'sender' => 'nullable|string'
        ]);

        $conv = Conversation::with('customer')->findOrFail($id);
        $sender = $validated['sender'] ?? 'customer';

        // 1. Store Customer Message with unique UUID
        $custMsg = Message::create([
            'id' => (string) Str::uuid(),
            'organization_id' => $conv->organization_id,
            'conversation_id' => $conv->id,
            'sender_type' => $sender === 'customer' ? 'customer' : 'human',
            'sender' => $sender,
            'content' => $validated['content'],
            'content_type' => 'text',
            'timestamp' => now()->format('h:i A')
        ]);

        // 2. AI Orchestrator Execution
        $router = new AgentRouter();
        $agent = $router->route($conv, $validated['content']);
        $intent = $router->detectIntent($validated['content']);

        // Contextual RAG grounding
        $rag = new \App\Services\Knowledge\RAGService();
        $ragChunks = $rag->search($conv->organization_id, $validated['content']);
        $ragGrounding = !empty($ragChunks) ? $ragChunks[0]['chunk'] : null;

        $reply = "I'm happy to help you with that! As your {$agent->name}, I can assist with product recommendations, order tracking, and scheduling.";
        if ($intent === 'appointment') {
            $reply = "I'd be glad to schedule an appointment for you! We have openings tomorrow at 10:00 AM, 11:30 AM, and 2:00 PM. Which time works best for you?";
        } elseif ($intent === 'sales') {
            $reply = "Great question! Our top-rated models are the MacBook Air M1 ($799) and Dell Inspiron 15 ($749). Both include free express shipping and warranty. Would you like to reserve one or discuss special discount packages?";
        } elseif ($intent === 'support') {
            if ($ragGrounding) {
                $reply = $ragGrounding . " Let me know if you would like me to look up tracking details for a specific order!";
            } else {
                $reply = "I can help track your order, process returns, or resolve any delivery issues. Please provide your order number!";
            }
        } elseif ($intent === 'human_request') {
            $reply = "I understand. I have prioritized your request and transferred your conversation to our senior human representative. Someone will reply shortly.";
        }

        $aiResponse = [
            'reply' => $reply,
            'agent_type' => $agent->type ?? 'support',
            'agent_name' => $agent->name ?? 'AI Assistant',
            'tool_executed' => null,
            'grounded_source' => !empty($ragChunks) ? $ragChunks[0]['source'] : null,
        ];

        // 3. Store Agent Message with unique UUID
        $agentMsg = Message::create([
            'id' => (string) Str::uuid(),
            'organization_id' => $conv->organization_id,
            'conversation_id' => $conv->id,
            'sender_type' => 'agent',
            'sender' => 'agent',
            'agent_type' => $aiResponse['agent_type'] ?? 'support',
            'content' => $aiResponse['reply'],
            'content_type' => 'text',
            'timestamp' => now()->format('h:i A'),
            'metadata' => [
                'toolExecuted' => $aiResponse['tool_executed'] ?? null,
                'groundedSource' => $aiResponse['grounded_source'] ?? null
            ],
            'metadata_json' => [
                'toolExecuted' => $aiResponse['tool_executed'] ?? null,
                'groundedSource' => $aiResponse['grounded_source'] ?? null
            ]
        ]);

        $conv->update([
            'last_message' => $aiResponse['reply'],
            'last_message_at' => now(),
            'assigned_agent' => $aiResponse['agent_type'] ?? $conv->assigned_agent
        ]);

        return response()->json([
            'success' => true,
            'data' => [
                'userMessage' => $custMsg,
                'agentMessage' => $agentMsg,
                'orchestrator' => $aiResponse
            ]
        ]);
    }

    public function handoff(string $id)
    {
        $conv = Conversation::findOrFail($id);
        $conv->update([
            'status' => 'waiting_for_human',
            'assigned_agent' => 'human'
        ]);

        Message::create([
            'id' => (string) Str::uuid(),
            'organization_id' => $conv->organization_id,
            'conversation_id' => $conv->id,
            'sender_type' => 'system',
            'sender' => 'system',
            'content' => 'Conversation escalated to human agent by request.',
            'content_type' => 'text',
            'timestamp' => now()->format('h:i A')
        ]);

        return response()->json(['success' => true, 'data' => $conv]);
    }

    public function resolve(string $id)
    {
        $conv = Conversation::findOrFail($id);
        $conv->update([
            'status' => 'resolved',
            'resolved_at' => now()
        ]);
        return response()->json(['success' => true, 'data' => $conv]);
    }

    public function getWidgetConfig(string $orgSlug)
    {
        $org = Organization::where('slug', $orgSlug)->first();

        return response()->json([
            'success' => true,
            'data' => [
                'title' => $org ? $org->name : 'AI Conversation & Sales Suite',
                'welcomeMessage' => 'Hello! How can we assist you today?',
                'primaryColor' => '#1677FF',
                'agents' => ['support', 'sales', 'appointment']
            ]
        ]);
    }

    public function startWidgetConversation(Request $request)
    {
        $orgId = $request->header('X-Organization-Id', 'org-acme-1');
        $validated = $request->validate([
            'customer_name' => 'nullable|string',
            'customer_email' => 'nullable|email',
            'channel' => 'nullable|string'
        ]);

        $customer = Customer::create([
            'id' => (string) Str::uuid(),
            'organization_id' => $orgId,
            'name' => $validated['customer_name'] ?? 'Website Visitor',
            'email' => $validated['customer_email'] ?? null,
            'source' => 'web_widget'
        ]);

        $conv = Conversation::create([
            'id' => (string) Str::uuid(),
            'organization_id' => $orgId,
            'customer_id' => $customer->id,
            'channel' => $validated['channel'] ?? 'web',
            'status' => 'active',
            'assigned_agent' => 'support',
            'last_message' => 'Hello! How can I assist you today?',
            'last_message_at' => now()
        ]);

        $welcomeMsg = Message::create([
            'id' => (string) Str::uuid(),
            'organization_id' => $orgId,
            'conversation_id' => $conv->id,
            'sender_type' => 'agent',
            'sender' => 'agent',
            'agent_type' => 'support',
            'content' => 'Hello! How can I assist you today?',
            'content_type' => 'text',
            'timestamp' => now()->format('h:i A')
        ]);

        return response()->json([
            'success' => true,
            'data' => [
                'conversation' => $conv,
                'customer' => $customer,
                'welcomeMessage' => $welcomeMsg
            ]
        ], 201);
    }

    public function sendWidgetMessage(Request $request, string $id)
    {
        return $this->sendMessage($request, $id);
    }
}
