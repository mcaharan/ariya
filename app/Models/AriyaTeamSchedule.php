<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AriyaTeamSchedule extends Model
{
    protected $fillable = ['child_id', 'user_id', 'shift_date', 'start_time', 'end_time', 'sort_order', 'is_active'];

    protected $casts = [
        'shift_date' => 'date',
        'is_active'  => 'boolean',
    ];

    public function child()
    {
        return $this->belongsTo(Child::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
