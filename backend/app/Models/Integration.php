<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Integration extends Model
{
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'organization_id',
        'provider',
        'name',
        'category',
        'connected',
        'icon',
        'status',
        'credentials',
        'last_synced_at'
    ];

    protected $casts = [
        'connected' => 'boolean',
        'credentials' => 'array',
        'last_synced_at' => 'datetime'
    ];

    public function organization()
    {
        return $this->belongsTo(Organization::class);
    }
}
