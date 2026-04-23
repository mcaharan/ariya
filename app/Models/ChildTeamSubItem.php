<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ChildTeamSubItem extends Model
{
    protected $fillable = ['team_item_id', 'icon_path', 'header_image', 'title', 'content', 'content_type', 'content_value', 'sort_order', 'is_active'];

    protected $casts = ['is_active' => 'boolean'];

    public function teamItem()
    {
        return $this->belongsTo(ChildTeamItem::class);
    }
}
