<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Association extends Model
{
    use HasUuids;

    protected $fillable = [
        'organization_id',
        'source_type',
        'source_id',
        'target_type',
        'target_id',
        'relationship_name'
    ];

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }
}
