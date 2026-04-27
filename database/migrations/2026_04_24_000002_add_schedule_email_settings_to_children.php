<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('children', function (Blueprint $table) {
            $table->string('schedule_email_time', 5)->default('13:30')->after('schedule_email_recipients');
            $table->string('schedule_email_subject')->nullable()->after('schedule_email_time');
        });
    }

    public function down(): void
    {
        Schema::table('children', function (Blueprint $table) {
            $table->dropColumn(['schedule_email_time', 'schedule_email_subject']);
        });
    }
};
