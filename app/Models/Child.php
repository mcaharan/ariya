<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\ChildEmergencyItem;
use App\Models\ChildMenuItem;
use App\Models\ChildMandatoryItem;
use App\Models\ChildGalleryItem;
use App\Models\ChildAriyaItem;
use App\Models\ChildMedSlot;
use App\Models\ChildTeamItem;
use App\Models\ChildPageHeader;

class Child extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'photo', 'emergency_title', 'mandatory_title', 'team_title', 'face_sheet_pdf'];

    public function users()
    {
        return $this->belongsToMany(User::class, 'child_user')
            ->withTimestamps();
    }

    public function menuItems()
    {
        return $this->hasMany(ChildMenuItem::class);
    }

    public function emergencyItems()
    {
        return $this->hasMany(ChildEmergencyItem::class);
    }

    public function mandatoryItems()
    {
        return $this->hasMany(ChildMandatoryItem::class);
    }

    public function galleryItems()
    {
        return $this->hasMany(ChildGalleryItem::class);
    }

    public function ariyaItems()
    {
        return $this->hasMany(ChildAriyaItem::class);
    }

    public function medSlots()
    {
        return $this->hasMany(ChildMedSlot::class);
    }

    public function teamItems()
    {
        return $this->hasMany(ChildTeamItem::class);
    }

    public function pageHeaders()
    {
        return $this->hasMany(ChildPageHeader::class);
    }
}
