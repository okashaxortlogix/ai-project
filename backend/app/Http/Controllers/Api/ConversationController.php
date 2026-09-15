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
        $orgId = $request->user()?->organization_id ?? $request->header('X-Organization-Id');
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
        $orgId = $request->user()?->organization_id ?? $request->header('X-Organization-Id');
        
        $customerId = $request->input('customer_id');
        if (!$customerId || !Str::isUuid($customerId) || !Customer::where('id', $customerId)->exists()) {
            $customer = Customer::firstOrCreate(
                ['organization_id' => $orgId, 'email' => 'guest-' . substr($orgId, 0, 8) . '@example.com'],
                [
                    'id' => (string) Str::uuid(),
                    'name' => 'Web Customer',
                    'channel' => 'web'
                ]
            );
            $customerId = $customer->id;
        }

        $conv = Conversation::create([
            'id' => (string) Str::uuid(),
            'organization_id' => $orgId,
            'customer_id' => $customerId,
            'channel' => $request->input('channel', 'web_chat'),
            'status' => 'active',
            'assigned_agent' => $request->input('assigned_agent', 'support'),
            'last_message' => 'Conversation initialized',
            'last_message_at' => now(),
        ]);

        return response()->json(['success' => true, 'data' => $conv], 201);
    }

    public function show(Request $request, string $id)
    {
        $orgId = $request->user()->organization_id;
        $conv = Conversation::where('organization_id', $orgId)->with(['customer', 'messages'])->findOrFail($id);
        return response()->json(['success' => true, 'data' => $conv]);
    }

    public function messages(Request $request, string $id)
    {
        $orgId = $request->user()->organization_id;
        $conv = Conversation::where('organization_id', $orgId)->findOrFail($id);
        $messages = Message::where('conversation_id', $conv->id)->where('organization_id', $orgId)->orderBy('created_at', 'asc')->get();
        return response()->json(['success' => true, 'data' => $messages]);
    }

    public function sendMessage(Request $request, string $id)
    {
        $orgId = $request->user()->organization_id;
        $validated = $request->validate([
            'content' => 'required|string',
            'sender' => 'nullable|string'
        ]);

        $conv = Conversation::where('organization_id', $orgId)->with('customer')->findOrFail($id);
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

        // 2. AI Orchestrator Execution with Live Tool Calling
        $router = new AgentRouter();
        $agent = $router->route($conv, $validated['content']);

        $orchestrator = new \App\Services\AI\LlmOrchestratorService();
        $aiResult = $orchestrator->processMessage(
            $conv->organization_id,
            $conv->id,
            $validated['content'],
            $agent->type ?? 'assistant',
            $custMsg->sender
        );

        $aiResponse = [
            'reply' => $aiResult['reply'],
            'agent_type' => $aiResult['agent_type'],
            'agent_name' => $agent->name ?? 'AI Assistant',
            'tool_executed' => $aiResult['tool_executed'],
            'grounded_source' => $aiResult['grounded_source'],
        ];

        $agentMsg = Message::where('conversation_id', $conv->id)
            ->where('sender_type', 'agent')
            ->latest('created_at')
            ->first();

        return response()->json([
            'success' => true,
            'data' => [
                'userMessage' => $custMsg,
                'agentMessage' => $agentMsg,
                'orchestrator' => $aiResponse
            ]
        ]);
    }

    public function handoff(Request $request, string $id)
    {
        $orgId = $request->user()->organization_id;
        $conv = Conversation::where('organization_id', $orgId)->findOrFail($id);
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

    public function resolve(Request $request, string $id)
    {
        $orgId = $request->user()->organization_id;
        $conv = Conversation::where('organization_id', $orgId)->findOrFail($id);
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
