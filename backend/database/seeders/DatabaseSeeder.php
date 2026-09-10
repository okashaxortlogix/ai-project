<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Str;
use App\Models\Organization;
use App\Models\User;
use App\Models\Customer;
use App\Models\Agent;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\Lead;
use App\Models\Appointment;
use App\Models\KnowledgeDocument;
use App\Models\Integration;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Create Organization
        $org = Organization::create([
            'id' => (string) Str::uuid(),
            'name' => 'Acme Store',
            'slug' => 'acme-store',
            'timezone' => 'UTC-05:00 (Eastern Time US & Canada)',
            'status' => 'active'
        ]);

        // 2. Create Users
        $admin = User::create([
            'id' => (string) Str::uuid(),
            'name' => 'John Doe',
            'email' => 'john@acme.com',
            'password_hash' => bcrypt('secret123'),
            'status' => 'active'
        ]);

        // 3. Create Agents
        $supportAgent = Agent::create([
            'id' => (string) Str::uuid(),
            'organization_id' => $org->id,
            'type' => 'support',
            'name' => 'Customer Support Agent',
            'enabled' => true,
            'system_prompt' => 'You are the Customer Support Agent. Answer queries, track orders, and resolve customer issues using approved knowledge documents and tools.'
        ]);

        $salesAgent = Agent::create([
            'id' => (string) Str::uuid(),
            'organization_id' => $org->id,
            'type' => 'sales',
            'name' => 'Sales Agent',
            'enabled' => true,
            'system_prompt' => 'You are the Sales Agent. Recommend products, discover customer needs, qualify leads, and drive purchases without deceptive urgency.'
        ]);

        $appointmentAgent = Agent::create([
            'id' => (string) Str::uuid(),
            'organization_id' => $org->id,
            'type' => 'appointment',
            'name' => 'Appointment Agent',
            'enabled' => true,
            'system_prompt' => 'You are the Appointment Agent. Check calendar availability, present open slots, and confirm appointments with Google Calendar and Outlook.'
        ]);

        // 4. Create Customers
        $sarah = Customer::create([
            'id' => (string) Str::uuid(),
            'organization_id' => $org->id,
            'name' => 'Sarah Johnson',
            'email' => 'sarah@company.com',
            'phone' => '+1 234 567 8901',
            'source' => 'Website'
        ]);

        $mike = Customer::create([
            'id' => (string) Str::uuid(),
            'organization_id' => $org->id,
            'name' => 'Mike Wilson',
            'email' => 'mike@company.com',
            'phone' => '+1 234 567 8902',
            'source' => 'Facebook'
        ]);

        // 5. Create Leads
        Lead::create([
            'id' => (string) Str::uuid(),
            'organization_id' => $org->id,
            'customer_id' => $sarah->id,
            'owner_user_id' => $admin->id,
            'stage' => 'Hot',
            'source' => 'Website',
            'score' => 85,
            'notes' => 'Decision maker. Inquired about annual plans.'
        ]);

        Lead::create([
            'id' => (string) Str::uuid(),
            'organization_id' => $org->id,
            'customer_id' => $mike->id,
            'owner_user_id' => $admin->id,
            'stage' => 'Hot',
            'source' => 'Facebook',
            'score' => 72,
            'notes' => 'Order tracking inquiry.'
        ]);

        // 6. Create Appointments
        Appointment::create([
            'id' => (string) Str::uuid(),
            'organization_id' => $org->id,
            'customer_id' => $sarah->id,
            'title' => 'Demo Call',
            'service' => 'Enterprise Demo',
            'start_at' => now()->addDay()->setHour(14)->setMinute(0),
            'end_at' => now()->addDay()->setHour(14)->setMinute(30),
            'status' => 'confirmed',
            'provider' => 'google_calendar'
        ]);

        // 7. Create Knowledge Documents
        KnowledgeDocument::create([
            'id' => (string) Str::uuid(),
            'organization_id' => $org->id,
            'title' => 'Shipping Policy.pdf',
            'source_type' => 'pdf',
            'storage_path' => 'knowledge/shipping_policy.pdf',
            'status' => 'active'
        ]);

        KnowledgeDocument::create([
            'id' => (string) Str::uuid(),
            'organization_id' => $org->id,
            'title' => 'Return Policy.pdf',
            'source_type' => 'pdf',
            'storage_path' => 'knowledge/return_policy.pdf',
            'status' => 'active'
        ]);

        // 8. Integrations
        Integration::create([
            'id' => (string) Str::uuid(),
            'organization_id' => $org->id,
            'provider' => 'google_calendar',
            'type' => 'calendar',
            'status' => 'connected'
        ]);
    }
}
