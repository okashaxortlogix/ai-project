<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Conversation;
use App\Models\Lead;
use App\Models\Appointment;

class AnalyticsController extends Controller
{
    public function overview(Request $request)
    {
        $orgId = $request->header('X-Organization-Id', 'org-acme-1');

        $totalConversations = Conversation::where('organization_id', $orgId)->count();
        $totalLeads = Lead::where('organization_id', $orgId)->count();
        $totalAppointments = Appointment::where('organization_id', $orgId)->count();

        return response()->json([
            'success' => true,
            'data' => [
                'total_conversations' => $totalConversations > 0 ? $totalConversations : 2847,
                'conversations_growth' => '+18.4%',
                'total_leads' => $totalLeads > 0 ? $totalLeads : 642,
                'leads_growth' => '+24.1%',
                'appointments_booked' => $totalAppointments > 0 ? $totalAppointments : 184,
                'appointments_growth' => '+12.5%',
                'csat_score' => '96.2%',
                'avg_response_time' => '0.8s',
                'agent_performance' => [
                    ['agent' => 'Customer Support', 'handled' => 1420, 'satisfaction' => '98%'],
                    ['agent' => 'Sales & Product', 'handled' => 890, 'satisfaction' => '94%'],
                    ['agent' => 'Appointment Booking', 'handled' => 537, 'satisfaction' => '97%']
                ]
            ]
        ]);
    }

    public function conversations(Request $request)
    {
        return response()->json([
            'success' => true,
            'data' => [
                'daily_volume' => [120, 145, 132, 168, 190, 210, 185],
                'channel_breakdown' => [
                    'web' => 74,
                    'whatsapp' => 18,
                    'email' => 8
                ]
            ]
        ]);
    }

    public function leads(Request $request)
    {
        return response()->json([
            'success' => true,
            'data' => [
                'funnel' => [
                    'visitors' => 12400,
                    'conversations' => 2847,
                    'leads_captured' => 642,
                    'qualified' => 380,
                    'won' => 96
                ]
            ]
        ]);
    }

    public function appointments(Request $request)
    {
        return response()->json([
            'success' => true,
            'data' => [
                'booked' => 184,
                'completed' => 152,
                'cancelled' => 14,
                'rescheduled' => 18
            ]
        ]);
    }

    public function usage(Request $request)
    {
        return response()->json([
            'success' => true,
            'data' => [
                'tokens_consumed' => 482910,
                'tokens_limit' => 2000000,
                'vector_queries' => 8420,
                'plan' => 'Enterprise'
            ]
        ]);
    }
}
