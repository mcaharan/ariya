<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('child_ariya_images', function (Blueprint $table) {
            $table->id();
            // FK is added in a later migration to avoid same-timestamp ordering issues.
            $table->unsignedBigInteger('ariya_item_id');
            $table->index('ariya_item_id');
            $table->string('image');
            $table->string('caption')->nullable();
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('child_ariya_images');
    }
};
