<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class KnowledgeDocument extends Model
{
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'organization_id',
        'title',
        'type',
        'status',
        'size',
        'content'
    ];

    public function organization()
    {
        return $this->belongsTo(Organization::class);
    }
}
