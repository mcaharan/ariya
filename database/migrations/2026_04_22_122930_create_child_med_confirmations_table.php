<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('child_med_confirmations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('slot_id')->constrained('child_med_slots')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->date('confirmed_date');
            $table->timestamps();
            $table->unique(['slot_id', 'user_id', 'confirmed_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('child_med_confirmations');
    }
};
