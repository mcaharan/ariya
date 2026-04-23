<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('child_team_items', function (Blueprint $table) {
            $table->string('header_image')->nullable()->after('icon_path');
        });

        Schema::table('child_team_sub_items', function (Blueprint $table) {
            $table->string('header_image')->nullable()->after('icon_path');
        });
    }

    public function down(): void
    {
        Schema::table('child_team_items', function (Blueprint $table) {
            $table->dropColumn('header_image');
        });

        Schema::table('child_team_sub_items', function (Blueprint $table) {
            $table->dropColumn('header_image');
        });
    }
};
