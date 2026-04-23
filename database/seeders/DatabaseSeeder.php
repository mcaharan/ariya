<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Create dummy users with roles for initial setup
        User::factory()->create([
            'name' => 'Super Admin',
            'email' => 'superadmin@example.test',
            'role' => 'superadmin',
        ]);

        User::factory()->create([
            'name' => 'Manager User',
            'email' => 'manager@example.test',
            'role' => 'manager',
        ]);

        User::factory()->create([
            'name' => 'Sub User',
            'email' => 'subuser@example.test',
            'role' => 'sub user',
        ]);
    }
}
