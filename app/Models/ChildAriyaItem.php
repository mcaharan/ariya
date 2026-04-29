<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ChildAriyaItem extends Model
{
    protected $fillable = ['child_id', 'type', 'icon_path', 'title', 'sort_order', 'is_active'];

    public function images()
    {
        return $this->hasMany(ChildAriyaImage::class, 'ariya_item_id')->orderBy('sort_order');
    }
}
