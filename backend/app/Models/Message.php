<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Message extends Model
{
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'organization_id',
        'conversation_id',
        'sender',
        'agent_type',
        'content',
        'timestamp',
        'metadata'
    ];

    protected $casts = [
        'metadata' => 'array'
    ];

    public function conversation()
    {
        return $this->belongsTo(Conversation::class);
    }
}
