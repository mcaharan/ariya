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
        Schema::table('child_menu_items', function (Blueprint $table) {
            $table->string('icon_path')->nullable()->after('image');   // custom uploaded icon
            $table->string('content_type')->default('link')->after('href'); // link, video, image, pdf
            $table->text('content_value')->nullable()->after('content_type'); // URL or storage path
        });
    }

    public function down(): void
    {
        Schema::table('child_menu_items', function (Blueprint $table) {
            $table->dropColumn(['icon_path', 'content_type', 'content_value']);
        });
    }
};
