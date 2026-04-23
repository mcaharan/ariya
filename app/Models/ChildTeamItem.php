<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ChildTeamItem extends Model
{
    protected $fillable = ['child_id', 'icon_path', 'header_image', 'title', 'content', 'content_type', 'content_value', 'sort_order', 'is_active'];

    protected $casts = ['is_active' => 'boolean'];

    public function child()
    {
        return $this->belongsTo(Child::class);
    }

    public function subItems()
    {
        return $this->hasMany(ChildTeamSubItem::class, 'team_item_id')->orderBy('sort_order');
    }
}
