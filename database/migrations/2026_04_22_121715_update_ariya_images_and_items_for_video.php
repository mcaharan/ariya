<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Remove video_url from items (it belongs on inner content)
        Schema::table('child_ariya_items', function (Blueprint $table) {
            $table->dropColumn('video_url');
        });

        // Add video_url to images, make image nullable (entry is image OR video)
        Schema::table('child_ariya_images', function (Blueprint $table) {
            $table->string('image', 1000)->nullable()->change();
            $table->string('video_url', 2000)->nullable()->after('image');
        });
    }

    public function down(): void
    {
        Schema::table('child_ariya_items', function (Blueprint $table) {
            $table->string('video_url', 2000)->nullable()->after('icon_path');
        });

        Schema::table('child_ariya_images', function (Blueprint $table) {
            $table->dropColumn('video_url');
            $table->string('image', 1000)->nullable(false)->change();
        });
    }
};
