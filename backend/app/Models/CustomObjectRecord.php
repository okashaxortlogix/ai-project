<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CustomObjectRecord extends Model
{
    use HasUuids;

    protected $fillable = [
        'custom_object_id',
        'organization_id',
        'data',
        'created_by'
    ];

    protected $casts = [
        'data' => 'array'
    ];

    public function customObject(): BelongsTo
    {
        return $this->belongsTo(CustomObject::class);
    }

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
