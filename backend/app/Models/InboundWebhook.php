<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class InboundWebhook extends Model
{
    use HasUuids;

    protected $table = 'inbound_webhooks';

    protected $fillable = [
        'id',
        'organization_id',
        'provider',
        'event_id',
        'event_type',
        'payload_hash',
        'payload_json',
        'status',
        'processed_at'
    ];

    public function organization()
    {
        return $this->belongsTo(Organization::class, 'organization_id');
    }

    protected $casts = [
        'payload_json' => 'array',
        'processed_at' => 'datetime'
    ];
}
