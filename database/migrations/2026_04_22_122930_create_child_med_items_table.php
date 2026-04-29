<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('child_med_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('slot_id')->constrained('child_med_slots')->cascadeOnDelete();
            $table->string('name');   // e.g. "RISPERIDONE"
            $table->string('dosage'); // e.g. "0.5 MG"
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('child_med_items');
    }
};
