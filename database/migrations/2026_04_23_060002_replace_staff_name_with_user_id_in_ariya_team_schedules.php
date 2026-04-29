<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ariya_team_schedules', function (Blueprint $table) {
            $table->dropColumn('staff_name');
            $table->foreignId('user_id')->nullable()->after('child_id')
                  ->constrained()->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('ariya_team_schedules', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
            $table->dropColumn('user_id');
            $table->string('staff_name')->nullable()->after('child_id');
        });
    }
};
