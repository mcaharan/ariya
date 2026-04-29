<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('child_ariya_items', function (Blueprint $table) {
            $table->string('video_url', 2000)->nullable()->after('icon_path');
        });
    }

    public function down(): void
    {
        Schema::table('child_ariya_items', function (Blueprint $table) {
            $table->dropColumn('video_url');
        });
    }
};
