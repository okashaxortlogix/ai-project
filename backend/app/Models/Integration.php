<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Integration extends Model
{
    use HasUuids;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'organization_id',
        'provider',
        'name',
        'category',
        'type',
        'connected',
        'icon',
        'status',
        'credentials',
        'external_account_id',
        'scopes_json',
        'configuration_json',
        'last_synced_at'
    ];

    protected $casts = [
        'connected' => 'boolean',
        'credentials' => 'array',
        'scopes_json' => 'array',
        'configuration_json' => 'array',
        'last_synced_at' => 'datetime'
    ];

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }
}
