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
        $orgId = $request->user()?->organization_id ?? $request->header('X-Organization-Id', 'org-acme-1');
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
        $availableSlots = [];

        foreach ($allSlots as $slot) {
            try {
                $slotStart = Carbon::parse("{$parsedDate} {$slot}");
                $slotEnd = (clone $slotStart)->addMinutes(30);

                $isOverlapping = false;
                foreach ($bookedAppointments as $booked) {
                    if ($booked->start_at && $booked->end_at) {
                        $bStart = Carbon::parse($booked->start_at);
                        $bEnd = Carbon::parse($booked->end_at);
                        if ($bStart < $slotEnd && $bEnd > $slotStart) {
                            $isOverlapping = true;
                            break;
                        }
                    } elseif ($booked->time === $slot) {
                        $isOverlapping = true;
                        break;
                    }
                }

                if ($isOverlapping) {
                    $bookedSlots[] = $slot;
                } else {
                    $availableSlots[] = $slot;
                }
            } catch (\Exception $e) {
                $availableSlots[] = $slot;
            }
        }

        return response()->json([
            'success' => true,
            'date' => $dateStr,
            'available_slots' => array_values(array_unique($availableSlots)),
            'booked_slots' => array_values(array_unique($bookedSlots))
        ]);
    }

    public function store(Request $request)
    {
        $orgId = $request->user()?->organization_id ?? $request->header('X-Organization-Id', 'org-acme-1');
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

        // Conflict check with datetime range overlap (BUG-026)
        $existingConflict = Appointment::where('organization_id', $orgId)
            ->where('status', '!=', 'Cancelled')
            ->where(function ($q) use ($startAt, $endAt, $validated) {
                $q->where(function ($sub) use ($startAt, $endAt) {
                    $sub->whereNotNull('start_at')
                        ->where('start_at', '<', $endAt)
                        ->where('end_at', '>', $startAt);
                })->orWhere(function ($sub) use ($validated) {
                    $sub->where('date', $validated['date'])
                        ->where('time', $validated['time']);
                });
            })
            ->first();

        if ($existingConflict) {
            return response()->json([
                'success' => false,
                'message' => 'Time slot is already reserved or overlaps with an existing appointment. Please select another slot.'
            ], 422);
        }

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

        \App\Services\Audit\AuditLogger::log(
            $orgId,
            'appointment_booked',
            'customer',
            $customerId,
            'appointment',
            $apt->id,
            ['date' => $apt->date, 'time' => $apt->time, 'service' => $apt->service]
        );

        return response()->json(['success' => true, 'data' => $apt], 201);
    }

    public function update(Request $request, string $id)
    {
        $orgId = $request->user()->organization_id ?? $request->header('X-Organization-Id');
        $apt = Appointment::where('organization_id', $orgId)->findOrFail($id);

        $validated = $request->validate([
            'title' => 'sometimes|string',
            'date' => 'sometimes|string',
            'time' => 'sometimes|string',
            'status' => 'sometimes|string',
            'service' => 'sometimes|string'
        ]);

        $apt->update($validated);
        return response()->json(['success' => true, 'data' => $apt]);
    }

    public function cancel(Request $request, string $id)
    {
        $orgId = $request->user()->organization_id ?? $request->header('X-Organization-Id');
        $apt = Appointment::where('organization_id', $orgId)->findOrFail($id);
        $apt->update(['status' => 'Cancelled']);

        \App\Services\Audit\AuditLogger::log(
            $orgId,
            'appointment_cancelled',
            'user',
            $request->user()->id ?? null,
            'appointment',
            $apt->id
        );

        return response()->json(['success' => true, 'data' => $apt]);
    }
}
