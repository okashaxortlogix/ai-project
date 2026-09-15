<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CustomObject extends Model
{
    use HasUuids;

    protected $fillable = [
        'organization_id',
        'name',
        'slug',
        'singular_name',
        'description',
        'icon'
    ];

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    public function fields(): HasMany
    {
        return $this->hasMany(CustomObjectField::class);
    }

    public function records(): HasMany
    {
        return $this->hasMany(CustomObjectRecord::class);
    }
}
