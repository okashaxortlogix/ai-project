<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class AgentController extends Controller
{
    public function index(Request $request)
    {
        $agents = [
            [
                'id' => 'support',
                'name' => 'Customer Support Agent',
                'role' => 'Order tracking, FAQs & ticket resolution',
                'status' => 'active',
                'resolution_rate' => '94.2%',
                'avg_response' => '0.8s'
            ],
            [
                'id' => 'sales',
                'name' => 'Sales & Recommendation Agent',
                'role' => 'Product discovery, objection handling & lead capture',
                'status' => 'active',
                'resolution_rate' => '88.5%',
                'avg_response' => '1.1s'
            ],
            [
                'id' => 'appointment',
                'name' => 'Appointment Booking Agent',
                'role' => 'Calendar availability, service booking & rescheduling',
                'status' => 'active',
                'resolution_rate' => '96.0%',
                'avg_response' => '0.6s'
            ]
        ];

        return response()->json(['success' => true, 'data' => $agents]);
    }

    public function show(string $id)
    {
        return response()->json([
            'success' => true,
            'data' => [
                'id' => $id,
                'name' => ucfirst($id) . ' Agent',
                'status' => 'active',
                'temperature' => 0.3
            ]
        ]);
    }

    public function update(Request $request, string $id)
    {
        return response()->json([
            'success' => true,
            'data' => array_merge(['id' => $id], $request->all())
        ]);
    }
}
