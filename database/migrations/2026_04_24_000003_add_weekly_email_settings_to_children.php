<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('children', function (Blueprint $table) {
            $table->json('weekly_email_recipients')->nullable()->after('schedule_email_subject');
            $table->string('weekly_email_time', 5)->default('13:35')->after('weekly_email_recipients');
            $table->string('weekly_email_subject')->nullable()->after('weekly_email_time');
            $table->tinyInteger('weekly_email_day')->default(5)->after('weekly_email_subject'); // 5 = Friday
        });
    }

    public function down(): void
    {
        Schema::table('children', function (Blueprint $table) {
            $table->dropColumn(['weekly_email_recipients', 'weekly_email_time', 'weekly_email_subject', 'weekly_email_day']);
        });
    }
};
