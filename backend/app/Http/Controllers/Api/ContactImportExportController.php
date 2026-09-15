<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Contact;
use App\Models\Tag;
use App\Models\Activity;
use Illuminate\Support\Str;

class ContactImportExportController extends Controller
{
    /**
     * Export all organization contacts to CSV.
     */
    public function export(Request $request)
    {
        $orgId = $request->user()->organization_id;

        $contacts = Contact::where('organization_id', $orgId)
            ->with('tags')
            ->orderBy('created_at', 'desc')
            ->get();

        $csvHeader = "first_name,last_name,email,phone,source,status,score,tags\n";
        $csvBody = "";

        foreach ($contacts as $contact) {
            $tagList = $contact->tags->pluck('name')->implode(';');
            $row = [
                '"' . str_replace('"', '""', $contact->first_name) . '"',
                '"' . str_replace('"', '""', $contact->last_name ?? '') . '"',
                '"' . str_replace('"', '""', $contact->email ?? '') . '"',
                '"' . str_replace('"', '""', $contact->phone ?? '') . '"',
                '"' . str_replace('"', '""', $contact->source ?? 'Direct') . '"',
                '"' . str_replace('"', '""', $contact->status ?? 'Lead') . '"',
                $contact->score ?? 10,
                '"' . str_replace('"', '""', $tagList) . '"'
            ];
            $csvBody .= implode(',', $row) . "\n";
        }

        return response($csvHeader . $csvBody, 200, [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="contacts_export_' . date('Y-m-d') . '.csv"'
        ]);
    }

    /**
     * Bulk import contacts from CSV file or raw CSV text.
     */
    public function import(Request $request)
    {
        $orgId = $request->user()->organization_id;

        $content = '';
        if ($request->hasFile('file')) {
            $file = $request->file('file');
            $content = file_get_contents($file->getRealPath());
        } elseif ($request->has('csv_content')) {
            $content = $request->input('csv_content');
        } else {
            $content = $request->getContent();
        }

        if (empty(trim($content))) {
            return response()->json([
                'success' => false,
                'message' => 'No CSV content or file provided for import.'
            ], 422);
        }

        $lines = preg_split('/\r\n|\r|\n/', trim($content));
        if (count($lines) < 2) {
            return response()->json([
                'success' => false,
                'message' => 'CSV must contain a header row and at least one data row.'
            ], 422);
        }

        $headers = array_map(fn($h) => strtolower(trim(str_replace(['"', "'"], '', $h))), str_getcsv(array_shift($lines)));

        $imported = 0;
        $skipped = 0;

        foreach ($lines as $line) {
            if (empty(trim($line))) continue;
            $row = str_getcsv($line);
            if (count($row) === 0) continue;

            $record = [];
            foreach ($headers as $idx => $header) {
                $record[$header] = isset($row[$idx]) ? trim($row[$idx]) : null;
            }

            $firstName = $record['first_name'] ?? ($record['name'] ?? null);
            if (empty($firstName)) {
                $skipped++;
                continue;
            }

            $email = !empty($record['email']) ? strtolower(trim($record['email'])) : null;

            // Deduplicate by email within same organization
            if ($email) {
                $exists = Contact::where('organization_id', $orgId)->where('email', $email)->exists();
                if ($exists) {
                    $skipped++;
                    continue;
                }
            }

            $contact = Contact::create([
                'id' => (string) Str::uuid(),
                'organization_id' => $orgId,
                'first_name' => $firstName,
                'last_name' => $record['last_name'] ?? null,
                'email' => $email,
                'phone' => $record['phone'] ?? null,
                'source' => $record['source'] ?? 'CSV Import',
                'status' => $record['status'] ?? 'Lead',
                'score' => isset($record['score']) && is_numeric($record['score']) ? (int)$record['score'] : 10,
                'dnd_settings' => ['email' => false, 'sms' => false, 'call' => false],
                'custom_attributes' => []
            ]);

            // Process tags
            if (!empty($record['tags'])) {
                $rawTags = explode(';', $record['tags']);
                $syncData = [];
                foreach ($rawTags as $tagStr) {
                    $tagName = trim($tagStr);
                    if ($tagName) {
                        $tag = Tag::firstOrCreate(['organization_id' => $orgId, 'name' => $tagName]);
                        $syncData[$tag->id] = ['id' => (string) Str::uuid()];
                    }
                }
                if (!empty($syncData)) {
                    $contact->tags()->sync($syncData);
                }
            }

            Activity::create([
                'id' => (string) Str::uuid(),
                'organization_id' => $orgId,
                'contact_id' => $contact->id,
                'type' => 'contact_imported',
                'description' => "Contact {$contact->name} imported via CSV."
            ]);

            $imported++;
        }

        return response()->json([
            'success' => true,
            'message' => "CSV import complete: {$imported} contacts imported, {$skipped} skipped.",
            'data' => [
                'imported' => $imported,
                'skipped' => $skipped,
                'total_rows_processed' => $imported + $skipped
            ]
        ], 201);
    }
}
