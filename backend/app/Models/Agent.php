<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Agent extends Model
{
    use HasFactory;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'organization_id',
        'name',
        'type',
        'role',
        'system_prompt',
        'temperature',
        'enabled',
        'config',
    ];

    protected $casts = [
        'enabled' => 'boolean',
        'temperature' => 'float',
        'config' => 'array',
    ];

    public function organization()
    {
        return $this->belongsTo(Organization::class);
    }

    public function conversations()
    {
        return $this->hasMany(Conversation::class, 'active_agent_id');
    }
}
