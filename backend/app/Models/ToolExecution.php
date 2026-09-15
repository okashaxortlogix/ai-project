<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ToolExecution extends Model
{
    use HasUuids;

    protected $fillable = [
        'id',
        'organization_id',
        'conversation_id',
        'agent_id',
        'tool_name',
        'input_json',
        'output_json',
        'status',
        'error_code',
        'latency_ms'
    ];

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    public function conversation(): BelongsTo
    {
        return $this->belongsTo(Conversation::class);
    }
}
