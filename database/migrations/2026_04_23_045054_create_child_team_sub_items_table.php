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
        Schema::create('child_team_sub_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('team_item_id')->constrained('child_team_items')->cascadeOnDelete();
            $table->string('icon_path')->nullable();
            $table->string('title');
            $table->text('content')->nullable();
            $table->string('content_type')->default('text');
            $table->string('content_value')->nullable();
            $table->integer('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('child_team_sub_items');
    }
};
