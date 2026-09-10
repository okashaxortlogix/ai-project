<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Lead extends Model
{
    use HasUuids;

    protected $fillable = [
        'organization_id',
        'customer_id',
        'owner_user_id',
        'stage',
        'source',
        'score',
        'qualification_json',
        'notes',
        'external_ids_json'
    ];

    protected $casts = [
        'qualification_json' => 'array',
        'external_ids_json' => 'array',
        'score' => 'integer'
    ];

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }
}
