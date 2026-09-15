<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Contact;
use App\Models\Lead;
use App\Models\Opportunity;
use App\Models\Conversation;
use App\Models\Appointment;

class SearchController extends Controller
{
    /**
     * Multi-tenant global search across CRM entities.
     */
    public function search(Request $request)
    {
        $orgId = $request->user()->organization_id;
        $q = trim($request->input('q', ''));

        if (empty($q)) {
            return response()->json([
                'success' => true,
                'data' => [
                    'contacts' => [],
                    'leads' => [],
                    'opportunities' => [],
                    'conversations' => [],
                    'appointments' => []
                ]
            ]);
        }

        $contacts = Contact::where('organization_id', $orgId)
            ->where(function ($query) use ($q) {
                $query->where('first_name', 'like', "%{$q}%")
                    ->orWhere('last_name', 'like', "%{$q}%")
                    ->orWhere('email', 'like', "%{$q}%")
                    ->orWhere('phone', 'like', "%{$q}%");
            })
            ->limit(10)
            ->get();

        $leads = Lead::where('organization_id', $orgId)
            ->where(function ($query) use ($q) {
                $query->where('name', 'like', "%{$q}%")
                    ->orWhere('email', 'like', "%{$q}%")
                    ->orWhere('company', 'like', "%{$q}%");
            })
            ->limit(10)
            ->get();

        $opportunities = Opportunity::where('organization_id', $orgId)
            ->where('title', 'like', "%{$q}%")
            ->limit(10)
            ->get();

        $conversations = Conversation::where('organization_id', $orgId)
            ->with('customer')
            ->whereHas('customer', function ($query) use ($q) {
                $query->where('name', 'like', "%{$q}%")
                    ->orWhere('email', 'like', "%{$q}%");
            })
            ->limit(10)
            ->get();

        $appointments = Appointment::where('organization_id', $orgId)
            ->where(function ($query) use ($q) {
                $query->where('customer_name', 'like', "%{$q}%")
                    ->orWhere('customer_email', 'like', "%{$q}%")
                    ->orWhere('service_type', 'like', "%{$q}%");
            })
            ->limit(10)
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'contacts' => $contacts,
                'leads' => $leads,
                'opportunities' => $opportunities,
                'conversations' => $conversations,
                'appointments' => $appointments
            ]
        ]);
    }
}
