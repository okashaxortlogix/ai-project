<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class WorkflowExecution extends Model
{
    use HasUuids;

    protected $fillable = [
        'workflow_id',
        'workflow_version_id',
        'organization_id',
        'trigger_event',
        'entity_type',
        'entity_id',
        'status',
        'current_node_id',
        'context',
        'retry_count',
        'error_message',
        'started_at',
        'completed_at'
    ];

    protected $casts = [
        'context' => 'array',
        'retry_count' => 'integer',
        'started_at' => 'datetime',
        'completed_at' => 'datetime'
    ];

    public function workflow(): BelongsTo
    {
        return $this->belongsTo(Workflow::class);
    }

    public function version(): BelongsTo
    {
        return $this->belongsTo(WorkflowVersion::class, 'workflow_version_id');
    }

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    public function steps(): HasMany
    {
        return $this->hasMany(WorkflowExecutionStep::class)->orderBy('executed_at', 'asc');
    }
}
