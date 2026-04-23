<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Ensure both tables exist before attempting to add the FK
        if (! Schema::hasTable('child_ariya_images') || ! Schema::hasTable('child_ariya_items')) {
            return;
        }

        $database = env('DB_DATABASE');

        // Check information_schema to see if the foreign key already exists
        $rows = DB::select(
            'SELECT CONSTRAINT_NAME FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ? AND REFERENCED_TABLE_NAME = ?',
            [$database, 'child_ariya_images', 'ariya_item_id', 'child_ariya_items']
        );

        if (count($rows) > 0) {
            // FK already exists
            return;
        }

        // Add foreign key constraint
        DB::statement('ALTER TABLE `child_ariya_images` ADD CONSTRAINT `child_ariya_images_ariya_item_id_foreign` FOREIGN KEY (`ariya_item_id`) REFERENCES `child_ariya_items` (`id`) ON DELETE CASCADE');
    }

    public function down(): void
    {
        if (! Schema::hasTable('child_ariya_images')) {
            return;
        }

        $database = env('DB_DATABASE');

        $rows = DB::select(
            'SELECT CONSTRAINT_NAME FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ? AND REFERENCED_TABLE_NAME = ?',
            [$database, 'child_ariya_images', 'ariya_item_id', 'child_ariya_items']
        );

        if (count($rows) === 0) {
            return;
        }

        DB::statement('ALTER TABLE `child_ariya_images` DROP FOREIGN KEY `child_ariya_images_ariya_item_id_foreign`');
    }
};
