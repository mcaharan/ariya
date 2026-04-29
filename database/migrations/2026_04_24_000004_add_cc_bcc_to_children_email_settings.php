<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('children', function (Blueprint $table) {
            $table->json('schedule_email_cc')->nullable()->after('schedule_email_recipients');
            $table->json('schedule_email_bcc')->nullable()->after('schedule_email_cc');
            $table->json('weekly_email_cc')->nullable()->after('weekly_email_recipients');
            $table->json('weekly_email_bcc')->nullable()->after('weekly_email_cc');
        });
    }

    public function down(): void
    {
        Schema::table('children', function (Blueprint $table) {
            $table->dropColumn(['schedule_email_cc', 'schedule_email_bcc', 'weekly_email_cc', 'weekly_email_bcc']);
        });
    }
};
