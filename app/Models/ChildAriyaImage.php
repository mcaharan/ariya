<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ChildAriyaImage extends Model
{
    protected $fillable = ['ariya_item_id', 'image', 'video_url', 'caption', 'sort_order'];
}
