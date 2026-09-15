<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class KnowledgeChunk extends Model
{
    use HasFactory;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'organization_id',
        'document_id',
        'chunk_index',
        'text',
        'content',
        'embedding',
        'metadata',
        'metadata_json',
    ];

    protected $casts = [
        'chunk_index' => 'integer',
        'embedding' => 'array',
        'metadata' => 'array',
        'metadata_json' => 'array',
    ];

    public function document()
    {
        return $this->belongsTo(KnowledgeDocument::class, 'document_id');
    }

    public function organization()
    {
        return $this->belongsTo(Organization::class);
    }
}
