<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\Organization;
use App\Models\User;
use App\Models\Appointment;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;

class AppointmentConflictTest extends TestCase
{
    use RefreshDatabase;

    public function test_double_booking_appointment_returns_422_conflict()
    {
        $org = Organization::create([
            'id' => (string) Str::uuid(),
            'name' => 'Calendar Test Org',
            'slug' => 'calendar-test-org',
            'settings' => ['timezone' => 'UTC']
        ]);

        $user = User::create([
            'id' => (string) Str::uuid(),
            'organization_id' => $org->id,
            'name' => 'Admin User',
            'email' => 'admin@calendartest.com',
            'password' => bcrypt('secret123'),
            'password_hash' => bcrypt('secret123'),
            'role' => 'Admin'
        ]);

        $bookingData = [
            'title' => 'VIP Strategy Call',
            'date' => '2026-09-25',
            'time' => '14:00',
            'customer_name' => 'Michael Scott',
            'service' => 'Consulting',
            'provider' => 'google_calendar'
        ];

        // First booking succeeds
        $response1 = $this->actingAs($user, 'sanctum')
            ->withHeaders(['X-Organization-Id' => $org->id])
            ->postJson('/api/v1/appointments', $bookingData);
        $response1->assertStatus(201);
        $this->assertDatabaseHas('appointments', [
            'organization_id' => $org->id,
            'date' => '2026-09-25',
            'time' => '14:00',
            'customer_name' => 'Michael Scott'
        ]);

        // Second overlapping booking on same slot returns 422 conflict
        $conflictingBooking = [
            'title' => 'Product Demo',
            'date' => '2026-09-25',
            'time' => '14:00',
            'customer_name' => 'Dwight Schrute',
            'service' => 'Product Tour',
            'provider' => 'google_calendar'
        ];

        $response2 = $this->actingAs($user, 'sanctum')
            ->withHeaders(['X-Organization-Id' => $org->id])
            ->postJson('/api/v1/appointments', $conflictingBooking);
        $response2->assertStatus(422);
        $this->assertFalse($response2->json('success'));
        $this->assertStringContainsString('already reserved', $response2->json('message'));

        // Booking on a different time slot succeeds
        $conflictingBooking['time'] = '14:30';
        $response3 = $this->actingAs($user, 'sanctum')
            ->withHeaders(['X-Organization-Id' => $org->id])
            ->postJson('/api/v1/appointments', $conflictingBooking);
        $response3->assertStatus(201);
    }
}
