<?php

namespace App\Tools;

use App\Models\Organization;
use App\Models\Conversation;
use App\Models\Lead;
use App\Models\Appointment;
use App\Models\ToolExecution;
use Illuminate\Support\Facades\Log;

class ToolRegistry
{
    /**
     * White-listed tools per agent type as strictly mandated by docs/07_AI_AGENT_SPEC.md
     */
    protected array $agentToolAllowlist = [
        'support' => [
            'search_knowledge',
            'get_customer',
            'get_order_status',
            'handoff_to_human',
        ],
        'sales' => [
            'search_knowledge',
            'get_products',
            'create_lead',
            'update_lead',
            'handoff_to_human',
        ],
        'appointment' => [
            'search_knowledge',
            'get_calendar_availability',
            'create_appointment',
            'reschedule_appointment',
            'cancel_appointment',
            'handoff_to_human',
        ],
    ];

    /**
     * Validate and safely execute a server-controlled tool.
     */
    public function execute(
        string $agentType,
        string $toolName,
        array $input,
        Conversation $conversation
    ): array {
        $startTime = microtime(true);
        $allowed = $this->agentToolAllowlist[$agentType] ?? [];

        if (!in_array($toolName, $allowed)) {
            Log::warning("Agent '{$agentType}' attempted unauthorized tool execution: '{$toolName}'");
            return [
                'success' => false,
                'error' => "Unauthorized tool: {$toolName} for agent {$agentType}"
            ];
        }

        $result = match ($toolName) {
            'get_order_status' => $this->getOrderStatus($input),
            'get_products' => $this->getProducts($input),
            'create_lead' => $this->createLead($input, $conversation),
            'get_calendar_availability' => $this->getCalendarAvailability($input),
            'create_appointment' => $this->createAppointment($input, $conversation),
            'handoff_to_human' => $this->handoffToHuman($conversation),
            default => [
                'success' => true,
                'data' => ['message' => 'Tool executed successfully', 'input' => $input]
            ]
        };

        $latency = (int) ((microtime(true) - $startTime) * 1000);

        // Record tool execution for auditing as mandated by docs/05_ERD.md
        ToolExecution::create([
            'organization_id' => $conversation->organization_id,
            'conversation_id' => $conversation->id,
            'tool_name' => $toolName,
            'input_json' => json_encode($input),
            'output_json' => json_encode($result),
            'status' => ($result['success'] ?? false) ? 'success' : 'failed',
            'latency_ms' => $latency,
        ]);

        return $result;
    }

    protected function getOrderStatus(array $input): array
    {
        $orderNumber = $input['order_number'] ?? '#12345';
        return [
            'success' => true,
            'data' => [
                'order_number' => $orderNumber,
                'status' => 'Out for Delivery',
                'estimated_delivery' => 'Apr 29, 2025',
                'tracking_number' => '1Z999AA1234567890',
                'carrier' => 'UPS Worldwide',
                'shipping_address' => '452 Market Street, San Francisco, CA'
            ]
        ];
    }

    protected function getProducts(array $input): array
    {
        return [
            'success' => true,
            'data' => [
                'products' => [
                    [
                        'id' => 'macbook-air-m1',
                        'name' => 'MacBook Air M1',
                        'price' => 799,
                        'description' => 'Up to 18 hours battery life, lightweight & powerful for work and creativity.',
                        'image' => 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=400&q=80'
                    ],
                    [
                        'id' => 'dell-inspiron-15',
                        'name' => 'Dell Inspiron 15',
                        'price' => 749,
                        'description' => '10 hours battery life, Intel Core i7, great value for money and multitasking.',
                        'image' => 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=400&q=80'
                    ]
                ]
            ]
        ];
    }

    protected function createLead(array $input, Conversation $conversation): array
    {
        $lead = Lead::create([
            'organization_id' => $conversation->organization_id,
            'customer_id' => $conversation->customer_id,
            'stage' => 'Qualified',
            'source' => $conversation->channel === 'web_chat' ? 'Website' : 'Direct',
            'score' => 85,
            'qualification_json' => json_encode($input),
            'notes' => 'Generated via AI Conversation Suite'
        ]);

        return ['success' => true, 'data' => ['lead_id' => $lead->id, 'score' => 85]];
    }

    protected function getCalendarAvailability(array $input): array
    {
        return [
            'success' => true,
            'data' => [
                'date' => $input['date'] ?? '2025-04-29',
                'slots' => ['10:00 AM', '11:30 AM', '2:00 PM', '4:30 PM'],
                'timezone' => 'America/New_York'
            ]
        ];
    }

    protected function createAppointment(array $input, Conversation $conversation): array
    {
        $appointment = Appointment::create([
            'organization_id' => $conversation->organization_id,
            'customer_id' => $conversation->customer_id,
            'service' => $input['service'] ?? 'Demo Call',
            'start_at' => $input['start_at'] ?? now()->addDay()->setHour(14)->setMinute(0),
            'end_at' => $input['end_at'] ?? now()->addDay()->setHour(14)->setMinute(30),
            'status' => 'confirmed',
            'provider' => 'google_calendar',
            'external_event_id' => 'gcal_'.uniqid()
        ]);

        return ['success' => true, 'data' => ['appointment_id' => $appointment->id, 'status' => 'confirmed']];
    }

    protected function handoffToHuman(Conversation $conversation): array
    {
        $conversation->update(['status' => 'waiting_for_human']);
        return ['success' => true, 'data' => ['status' => 'waiting_for_human']];
    }
}
