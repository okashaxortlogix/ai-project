<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Message extends Model
{
    use HasUuids;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'organization_id',
        'conversation_id',
        'sender_type',
        'sender',
        'sender_id',
        'agent_type',
        'content',
        'content_type',
        'timestamp',
        'metadata',
        'metadata_json',
        'model',
        'input_tokens',
        'output_tokens',
        'latency_ms',
        'status'
    ];

    protected $casts = [
        'metadata' => 'array',
        'metadata_json' => 'array'
    ];

    public function conversation(): BelongsTo
    {
        return $this->belongsTo(Conversation::class);
    }

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }
}
