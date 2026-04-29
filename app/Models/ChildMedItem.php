<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ChildMedItem extends Model
{
    protected $fillable = ['slot_id', 'name', 'dosage', 'sort_order'];
}
