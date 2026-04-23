<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ChildMandatoryItem extends Model
{
    protected $fillable = ['child_id', 'image', 'title', 'sort_order', 'is_active'];

    protected $casts = ['is_active' => 'boolean'];

    public function child()
    {
        return $this->belongsTo(Child::class);
    }
}
