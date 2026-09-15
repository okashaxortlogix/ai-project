<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SmartList extends Model
{
    use HasUuids;

    protected $fillable = [
        'organization_id',
        'name',
        'entity_type',
        'filters',
        'columns',
        'created_by'
    ];

    protected $casts = [
        'filters' => 'array',
        'columns' => 'array'
    ];

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
