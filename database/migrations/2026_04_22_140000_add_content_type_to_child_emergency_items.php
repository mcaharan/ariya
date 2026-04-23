<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('child_emergency_items', function (Blueprint $table) {
            $table->string('content_type')->default('text')->after('content');
            $table->text('content_value')->nullable()->after('content_type');
        });
    }

    public function down(): void
    {
        Schema::table('child_emergency_items', function (Blueprint $table) {
            $table->dropColumn(['content_type', 'content_value']);
        });
    }
};
