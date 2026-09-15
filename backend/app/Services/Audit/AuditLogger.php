<?php

namespace App\Services\Audit;

use App\Models\AuditLog;
use Illuminate\Support\Str;

class AuditLogger
{
    public static function log(
        string $organizationId,
        string $action,
        string $actorType = 'user',
        ?string $actorId = null,
        ?string $entityType = null,
        ?string $entityId = null,
        array $metadata = [],
        ?string $ipAddress = null
    ): AuditLog {
        return AuditLog::create([
            'id' => (string) Str::uuid(),
            'organization_id' => $organizationId,
            'actor_type' => $actorType,
            'actor_id' => $actorId,
            'action' => $action,
            'entity_type' => $entityType,
            'entity_id' => $entityId,
            'metadata_json' => $metadata,
            'ip_address' => $ipAddress,
            'created_at' => now()
        ]);
    }
}
