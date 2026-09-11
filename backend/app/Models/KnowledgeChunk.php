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
        'content',
        'embedding',
        'metadata',
    ];

    protected $casts = [
        'chunk_index' => 'integer',
        'embedding' => 'array',
        'metadata' => 'array',
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
