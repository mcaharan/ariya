<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ChildEmergencyItem extends Model
{
    protected $fillable = ['child_id', 'image', 'icon_path', 'title', 'content', 'content_type', 'content_value', 'sort_order', 'is_active'];

    protected $casts = ['is_active' => 'boolean'];

    public function child()
    {
        return $this->belongsTo(Child::class);
    }
}
