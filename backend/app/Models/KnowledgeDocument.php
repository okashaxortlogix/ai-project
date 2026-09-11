<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class KnowledgeDocument extends Model
{
    use HasUuids;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'organization_id',
        'title',
        'type',
        'source_type',
        'storage_path',
        'mime_type',
        'status',
        'size',
        'content',
        'checksum',
        'metadata_json',
        'created_by'
    ];

    protected $casts = [
        'metadata_json' => 'array'
    ];

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }
}
