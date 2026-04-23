<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ChildPageHeader extends Model
{
    protected $fillable = ['child_id', 'page_key', 'header_image'];
}
