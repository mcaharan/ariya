<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ariya_team_schedules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('child_id')->constrained()->cascadeOnDelete();
            $table->string('staff_name')->nullable(); // null = TBD
            $table->date('shift_date');
            $table->string('start_time', 5); // HH:MM 24h
            $table->string('end_time', 5);   // HH:MM 24h
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->index(['child_id', 'shift_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ariya_team_schedules');
    }
};
