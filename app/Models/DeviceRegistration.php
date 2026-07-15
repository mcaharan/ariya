<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DeviceRegistration extends Model
{
    protected $fillable = [
        'device_id', 'display_name', 'user_id', 'status', 'device_info', 'last_used_at',
    ];

    protected $casts = [
        'device_info'  => 'array',
        'last_used_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
