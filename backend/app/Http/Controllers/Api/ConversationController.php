<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\Customer;
use App\Services\AgentRouter;

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
            'id' => 'conv-' . time(),
            'organization_id' => $orgId,
            'customer_id' => $validated['customer_id'],
            'channel' => $validated['channel'] ?? 'web',
            'status' => 'active',
            'assigned_agent' => $validated['assigned_agent'] ?? 'support',
            'last_message' => 'Conversation initialized',
            'last_message_at' => now()->format('h:i A'),
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

        // 1. Store Customer Message
        $custMsg = Message::create([
            'id' => 'm-' . time(),
            'organization_id' => $conv->organization_id,
            'conversation_id' => $conv->id,
            'sender' => $sender,
            'content' => $validated['content'],
            'timestamp' => now()->format('h:i A')
        ]);

        // 2. AI Orchestrator Execution
        $router = new AgentRouter();
        $aiResponse = $router->route($conv, $validated['content']);

        // 3. Store Agent Message
        $agentMsg = Message::create([
            'id' => 'm-' . (time() + 1),
            'organization_id' => $conv->organization_id,
            'conversation_id' => $conv->id,
            'sender' => 'agent',
            'agent_type' => $aiResponse['agent_type'] ?? 'support',
            'content' => $aiResponse['reply'],
            'timestamp' => now()->format('h:i A'),
            'metadata' => [
                'toolExecuted' => $aiResponse['tool_executed'] ?? null,
                'groundedSource' => $aiResponse['grounded_source'] ?? null
            ]
        ]);

        $conv->update([
            'last_message' => $aiResponse['reply'],
            'last_message_at' => now()->format('h:i A'),
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
            'id' => 'm-' . time(),
            'organization_id' => $conv->organization_id,
            'conversation_id' => $conv->id,
            'sender' => 'system',
            'content' => 'Conversation escalated to human agent by request.',
            'timestamp' => now()->format('h:i A')
        ]);

        return response()->json(['success' => true, 'data' => $conv]);
    }

    public function resolve(string $id)
    {
        $conv = Conversation::findOrFail($id);
        $conv->update(['status' => 'resolved']);
        return response()->json(['success' => true, 'data' => $conv]);
    }

    public function getWidgetConfig(string $orgSlug)
    {
        return response()->json([
            'success' => true,
            'data' => [
                'title' => 'AI Conversation & Sales Suite',
                'welcomeMessage' => 'Hello! How can we assist you today?',
                'primaryColor' => '#1677FF',
                'agents' => ['support', 'sales', 'appointment']
            ]
        ]);
    }
}
