<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class AuditLog extends Model
{
    use HasUuids;

    public $timestamps = false;
    protected $table = 'audit_logs';

    protected $fillable = [
        'id',
        'organization_id',
        'actor_type',
        'actor_id',
        'action',
        'entity_type',
        'entity_id',
        'metadata_json',
        'ip_address',
        'created_at'
    ];

    protected $casts = [
        'metadata_json' => 'array',
        'created_at' => 'datetime'
    ];

    public function organization()
    {
        return $this->belongsTo(Organization::class);
    }
}
