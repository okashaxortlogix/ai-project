<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Carbon\Carbon;
use App\Models\Appointment;
use App\Models\Customer;

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
        $orgId = $request->header('X-Organization-Id', 'org-acme-1');
        $dateStr = $request->query('date', now()->format('Y-m-d'));

        try {
            $parsedDate = Carbon::parse($dateStr)->format('Y-m-d');
        } catch (\Exception $e) {
            $parsedDate = now()->format('Y-m-d');
        }

        $allSlots = [
            '09:00 AM',
            '10:00 AM',
            '11:30 AM',
            '01:00 PM',
            '02:00 PM',
            '03:30 PM',
            '04:30 PM'
        ];

        // Query booked appointments for the date
        $bookedAppointments = Appointment::where('organization_id', $orgId)
            ->where(function ($q) use ($parsedDate, $dateStr) {
                $q->whereDate('start_at', $parsedDate)
                  ->orWhere('date', $dateStr)
                  ->orWhere('date', $parsedDate);
            })
            ->where('status', '!=', 'Cancelled')
            ->get();

        $bookedSlots = [];
        foreach ($bookedAppointments as $apt) {
            if (!empty($apt->time)) {
                $bookedSlots[] = $apt->time;
            } elseif ($apt->start_at) {
                $bookedSlots[] = Carbon::parse($apt->start_at)->format('h:i A');
            }
        }

        $bookedSlots = array_values(array_unique($bookedSlots));
        $availableSlots = array_values(array_diff($allSlots, $bookedSlots));

        return response()->json([
            'success' => true,
            'date' => $dateStr,
            'available_slots' => $availableSlots,
            'booked_slots' => $bookedSlots
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
            'customer_id' => 'nullable|string',
            'avatar' => 'nullable|string'
        ]);

        // Resolve or create customer to satisfy FK
        $customerId = $validated['customer_id'] ?? null;
        if (!$customerId || !Customer::where('id', $customerId)->exists()) {
            $customer = Customer::create([
                'id' => (string) Str::uuid(),
                'organization_id' => $orgId,
                'name' => $validated['customer_name'],
                'source' => 'appointment_booking'
            ]);
            $customerId = $customer->id;
        }

        // Parse start_at and end_at
        try {
            $startAt = Carbon::parse("{$validated['date']} {$validated['time']}");
        } catch (\Exception $e) {
            $startAt = now()->addDay();
        }
        $endAt = (clone $startAt)->addMinutes(30);

        $customerName = $validated['customer_name'];
        $avatar = $validated['avatar'] ?? ("https://ui-avatars.com/api/?name=" . urlencode($customerName) . "&background=4F46E5&color=fff&size=120");

        $apt = Appointment::create([
            'id' => (string) Str::uuid(),
            'organization_id' => $orgId,
            'customer_id' => $customerId,
            'title' => $validated['title'],
            'date' => $validated['date'],
            'time' => $validated['time'],
            'customer_name' => $customerName,
            'avatar' => $avatar,
            'service' => $validated['service'] ?? 'Enterprise Demo',
            'provider' => $validated['provider'] ?? 'google_calendar',
            'start_at' => $startAt,
            'end_at' => $endAt,
            'timezone' => 'UTC',
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
