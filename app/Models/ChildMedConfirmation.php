<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ChildMedConfirmation extends Model
{
    protected $fillable = ['slot_id', 'user_id', 'confirmed_date'];
}
