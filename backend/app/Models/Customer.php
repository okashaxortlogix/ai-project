<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Customer extends Model
{
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'organization_id',
        'name',
        'email',
        'phone',
        'source',
        'avatar',
        'online'
    ];

    protected $casts = [
        'online' => 'boolean'
    ];

    public function conversations()
    {
        return $this->hasMany(Conversation::class);
    }
}
