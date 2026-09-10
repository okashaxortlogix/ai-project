<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Appointment;

class AppointmentController extends Controller
{
    public function index(Request $request)
    {
        $orgId = $request->header('X-Organization-Id', 'org-acme-1');
        $appointments = Appointment::where('organization_id', $orgId)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $appointments,
            'meta' => [
                'total' => $appointments->count(),
                'organization_id' => $orgId
            ]
        ]);
    }

    public function availability(Request $request)
    {
        $date = $request->query('date', 'Apr 29, 2025');

        return response()->json([
            'success' => true,
            'date' => $date,
            'available_slots' => [
                '10:00 AM',
                '11:30 AM',
                '2:00 PM',
                '4:30 PM'
            ],
            'booked_slots' => [
                '1:00 PM',
                '3:00 PM'
            ]
        ]);
    }

    public function store(Request $request)
    {
        $orgId = $request->header('X-Organization-Id', 'org-acme-1');
        $validated = $request->validate([
            'title' => 'required|string',
            'date' => 'required|string',
            'time' => 'required|string',
            'customer_name' => 'required|string',
            'service' => 'nullable|string',
            'provider' => 'nullable|string',
            'customer_id' => 'nullable|string'
        ]);

        $apt = Appointment::create([
            'id' => 'apt-' . time(),
            'organization_id' => $orgId,
            'customer_id' => $validated['customer_id'] ?? 'cust-1',
            'title' => $validated['title'],
            'date' => $validated['date'],
            'time' => $validated['time'],
            'customer_name' => $validated['customer_name'],
            'avatar' => 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
            'service' => $validated['service'] ?? 'Enterprise Demo',
            'provider' => $validated['provider'] ?? 'Google Calendar',
            'status' => 'Confirmed'
        ]);

        return response()->json(['success' => true, 'data' => $apt], 201);
    }

    public function update(Request $request, string $id)
    {
        $apt = Appointment::findOrFail($id);
        $apt->update($request->all());
        return response()->json(['success' => true, 'data' => $apt]);
    }

    public function cancel(string $id)
    {
        $apt = Appointment::findOrFail($id);
        $apt->update(['status' => 'Cancelled']);
        return response()->json(['success' => true, 'data' => $apt]);
    }
}
