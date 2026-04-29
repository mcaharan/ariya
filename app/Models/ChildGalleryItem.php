<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ChildGalleryItem extends Model
{
    protected $fillable = ['child_id', 'section', 'image', 'title', 'sort_order', 'is_active'];
}
