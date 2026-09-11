<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

/**
 * App\Models\User
 *
 * @property string $id
 * @property string $organization_id
 * @property string $name
 * @property string $email
 * @property string $password
 * @property string $role
 * @property string|null $avatar
 * @property bool $is_active
 * @property-read \App\Models\Organization|null $organization
 * @method \Illuminate\Database\Eloquent\Relations\BelongsTo belongsTo(string $related, ?string $foreignKey = null, ?string $ownerKey = null, ?string $relation = null)
 */
class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'organization_id',
        'name',
        'email',
        'password',
        'role',
        'avatar',
        'is_active'
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the organization that owns the user.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function organization()
    {
        return $this->belongsTo(Organization::class);
    }
}
