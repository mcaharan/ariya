<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ChildMedSlot extends Model
{
    protected $fillable = ['child_id', 'time_label', 'sub_label', 'sort_order', 'is_active'];

    public function items()
    {
        return $this->hasMany(ChildMedItem::class, 'slot_id')->orderBy('sort_order');
    }

    public function confirmations()
    {
        return $this->hasMany(ChildMedConfirmation::class, 'slot_id');
    }
}
