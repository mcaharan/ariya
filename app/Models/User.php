<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\HasApiTokens;

#[Fillable(['name', 'email', 'password', 'role'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable, HasApiTokens;

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function roleName(): string
    {
        return $this->role ?: 'sub user';
    }

    public function isSuperadmin(): bool
    {
        return $this->roleName() === 'superadmin';
    }

    public function grantedMenus(): array
    {
        if (! $this->id) {
            return ['dashboard'];
        }

        if ($this->isSuperadmin()) {
            return ['dashboard', 'users', 'children'];
        }

        $menus = DB::table('user_menu_permissions')
            ->where('user_id', $this->id)
            ->pluck('menu_key')
            ->toArray();

        if (! in_array('dashboard', $menus, true)) {
            $menus[] = 'dashboard';
        }

        return array_values(array_unique($menus));
    }

    public function hasMenuAccess(string $menuKey): bool
    {
        if ($this->isSuperadmin()) {
            return true;
        }

        return in_array($menuKey, $this->grantedMenus(), true);
    }

    public function children()
    {
        return $this->belongsToMany(Child::class, 'child_user')
            ->withTimestamps();
    }
}
