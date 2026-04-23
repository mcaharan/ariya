<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('child_emergency_items')) {
            Schema::create('child_emergency_items', function (Blueprint $table) {
                $table->id();
                $table->foreignId('child_id')->constrained()->cascadeOnDelete();
                $table->string('image')->nullable();
                $table->string('icon_path')->nullable();
                $table->string('title');
                $table->text('content')->nullable();
                $table->string('content_type')->default('text');
                $table->text('content_value')->nullable();
                $table->integer('sort_order')->default(0);
                $table->boolean('is_active')->default(true);
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('child_mandatory_items')) {
            Schema::create('child_mandatory_items', function (Blueprint $table) {
                $table->id();
                $table->foreignId('child_id')->constrained()->cascadeOnDelete();
                $table->string('image');
                $table->string('title')->nullable();
                $table->integer('sort_order')->default(0);
                $table->boolean('is_active')->default(true);
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('child_emergency_items');
        Schema::dropIfExists('child_mandatory_items');
    }
};
