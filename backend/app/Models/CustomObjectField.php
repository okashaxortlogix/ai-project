<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CustomObjectField extends Model
{
    use HasUuids;

    protected $fillable = [
        'custom_object_id',
        'field_name',
        'field_key',
        'field_type',
        'options',
        'is_required'
    ];

    protected $casts = [
        'options' => 'array',
        'is_required' => 'boolean'
    ];

    public function customObject(): BelongsTo
    {
        return $this->belongsTo(CustomObject::class);
    }
}
