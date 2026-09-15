<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WorkflowExecutionStep extends Model
{
    use HasUuids;

    protected $fillable = [
        'workflow_execution_id',
        'node_id',
        'node_name',
        'node_type',
        'status',
        'input_payload',
        'output_payload',
        'error_message',
        'executed_at'
    ];

    protected $casts = [
        'input_payload' => 'array',
        'output_payload' => 'array',
        'executed_at' => 'datetime'
    ];

    public function execution(): BelongsTo
    {
        return $this->belongsTo(WorkflowExecution::class, 'workflow_execution_id');
    }
}
